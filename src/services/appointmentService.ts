import { supabase } from '@/integrations/supabase/client';
import { getCustomerByMail, getTreater, getProviderDetails } from '@/lib/epatApi';

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'in-person' | 'video' | 'phone';
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BookingData {
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  appointmentType: string;
  duration?: number;
  notes?: string;
}

// Time slots from EPAT Calendar API
export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface CalendarSlot {
  date: string;
  time: string;
  title?: string;
  description?: string;
}

// Vitabyte ICS Calendar function
async function getCalendarSlots(): Promise<CalendarSlot[]> {
  try {
    const icsUrl = 'https://api.vitabyte.ch/calendar/?action=getics&cid=966541-462631-f1b699-977a3d&type=.ics';
    console.log('🗓️ Fetching Vitabyte ICS calendar from:', icsUrl);
    
    const response = await fetch(icsUrl);
    const icsData = await response.text();
    
    console.log('📄 ICS Data received, length:', icsData.length);
    
    // Parse ICS data manually (simple parser for VEVENT)
    const slots: CalendarSlot[] = [];
    const lines = icsData.split('\n');
    let currentEvent: any = {};
    let inEvent = false;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (cleanLine === 'END:VEVENT' && inEvent) {
        // Process the event
        if (currentEvent.DTSTART) {
          const startDateTime = parseICSDateTime(currentEvent.DTSTART);
          if (startDateTime) {
            const date = startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
            const time = startDateTime.toTimeString().substring(0, 5); // HH:MM
            
            slots.push({
              date,
              time,
              title: currentEvent.SUMMARY || 'Termin',
              description: currentEvent.DESCRIPTION || ''
            });
          }
        }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent && cleanLine.includes(':')) {
        const [key, ...valueParts] = cleanLine.split(':');
        const value = valueParts.join(':');
        currentEvent[key] = value;
      }
    }
    
    console.log('✅ Parsed', slots.length, 'calendar slots from ICS');
    return slots;
  } catch (error) {
    console.error('❌ Failed to fetch Vitabyte ICS calendar:', error);
    return [];
  }
}

// Helper function to parse ICS datetime format
function parseICSDateTime(icsDateTime: string): Date | null {
  try {
    // Handle different ICS datetime formats
    // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    let dateStr = icsDateTime.replace(/[TZ]/g, '');
    
    if (dateStr.length >= 14) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(8, 10));
      const minute = parseInt(dateStr.substring(10, 12));
      const second = parseInt(dateStr.substring(12, 14)) || 0;
      
      return new Date(year, month, day, hour, minute, second);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing ICS datetime:', icsDateTime, error);
    return null;
  }
}

// Service functions
export const appointmentService = {
  // Get basic therapist info (simplified)
  getTherapists: async (): Promise<Therapist[]> => {
    // Return a simple list of appointment types instead of actual therapists
    return [
      {
        id: "consultation",
        name: "Beratungsgespräch",
        specialty: "Allgemeine Beratung"
      },
      {
        id: "therapy",
        name: "Therapiesitzung",
        specialty: "Psychotherapie"
      },
      {
        id: "followup",
        name: "Nachkontrolle",
        specialty: "Follow-up"
      }
    ];
  },

  // Get available time slots for a specific date using Vitabyte ICS Calendar
  getAvailableSlots: async (date: string): Promise<TimeSlot[]> => {
    try {
      // Get slots from Vitabyte ICS Calendar
      const calendarSlots = await getCalendarSlots();
      
      // Filter slots for the specific date
      const slotsForDate = calendarSlots.filter(slot => slot.date === date);
      
      // Get existing bookings for this date from Supabase to exclude already booked times
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('appointment_time')
        .eq('appointment_date', date)
        .eq('status', 'scheduled');

      const bookedTimes = existingBookings?.map(booking => booking.appointment_time) || [];

      // Convert calendar slots to TimeSlot format, excluding booked times
      return slotsForDate.map(slot => ({
        time: slot.time,
        available: !bookedTimes.includes(slot.time)
      }));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  },

  // Get all available slots grouped by date from Vitabyte ICS Calendar
  getAllAvailableSlots: async (): Promise<Record<string, TimeSlot[]>> => {
    try {
      // Get slots from Vitabyte ICS Calendar
      const calendarSlots = await getCalendarSlots();
      
      // Get all existing bookings from Supabase
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('appointment_date, appointment_time')
        .eq('status', 'scheduled');

      // Create a map of booked times by date
      const bookedTimesByDate: Record<string, string[]> = {};
      existingBookings?.forEach(booking => {
        if (!bookedTimesByDate[booking.appointment_date]) {
          bookedTimesByDate[booking.appointment_date] = [];
        }
        bookedTimesByDate[booking.appointment_date].push(booking.appointment_time);
      });

      // Group calendar slots by date and mark availability
      const slotsByDate: Record<string, TimeSlot[]> = {};
      calendarSlots.forEach(slot => {
        if (!slotsByDate[slot.date]) {
          slotsByDate[slot.date] = [];
        }
        
        const bookedTimes = bookedTimesByDate[slot.date] || [];
        slotsByDate[slot.date].push({
          time: slot.time,
          available: !bookedTimes.includes(slot.time)
        });
      });

      // Sort times within each date
      Object.keys(slotsByDate).forEach(date => {
        slotsByDate[date].sort((a, b) => a.time.localeCompare(b.time));
      });

      return slotsByDate;
    } catch (error) {
      console.error('Error fetching all available slots:', error);
      return {};
    }
  },

  // Book a new appointment (store in Supabase)
  bookAppointment: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      // First, try to get patient info from Vitabyte (minimal API call)
      let vitabytePatientId = null;
      let treaterName = null;
      let treaterId = null;

      try {
        const customers = await getCustomerByMail(bookingData.patientEmail);
        if (customers.length > 0) {
          vitabytePatientId = customers[0].patid;
          
          // Try to get treater info
          const treater = await getTreater(vitabytePatientId);
          if (treater) {
            treaterId = treater.provider;
            const providerDetails = await getProviderDetails({ providerid: treater.provider });
            if (providerDetails) {
              treaterName = providerDetails.name;
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch Vitabyte data, proceeding with basic booking:', error);
      }

      // Store booking in Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          patient_email: bookingData.patientEmail,
          patient_name: bookingData.patientName,
          patient_phone: bookingData.patientPhone,
          vitabyte_patient_id: vitabytePatientId,
          treater_name: treaterName,
          treater_id: treaterId,
          appointment_date: bookingData.appointmentDate,
          appointment_time: bookingData.appointmentTime,
          appointment_type: bookingData.appointmentType,
          duration: bookingData.duration || 50,
          notes: bookingData.notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error in bookAppointment:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },

  // Get user's appointments from Supabase
  getUpcomingAppointments: async (patientEmail: string): Promise<Appointment[]> => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('patient_email', patientEmail)
      .eq('status', 'scheduled')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }

    return bookings?.map(booking => ({
      id: booking.id,
      patientId: booking.patient_email,
      therapistId: booking.appointment_type,
      date: `${booking.appointment_date}T${booking.appointment_time}:00`,
      duration: booking.duration,
      status: 'scheduled' as const,
      type: 'in-person' as const,
      notes: booking.notes,
      metadata: {
        treaterName: booking.treater_name,
        treaterId: booking.treater_id,
        vitabytePatientId: booking.vitabyte_patient_id
      }
    })) || [];
  },

  // Get past appointments from Supabase
  getPastAppointments: async (patientEmail: string): Promise<Appointment[]> => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('patient_email', patientEmail)
      .lt('appointment_date', today)
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching past appointments:', error);
      return [];
    }

    return bookings?.map(booking => ({
      id: booking.id,
      patientId: booking.patient_email,
      therapistId: booking.appointment_type,
      date: `${booking.appointment_date}T${booking.appointment_time}:00`,
      duration: booking.duration,
      status: 'completed' as const,
      type: 'in-person' as const,
      notes: booking.notes,
      metadata: {
        treaterName: booking.treater_name,
        treaterId: booking.treater_id,
        vitabytePatientId: booking.vitabyte_patient_id
      }
    })) || [];
  },

  // Cancel an appointment
  cancelAppointment: async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: 'Failed to cancel appointment' };
    }
  },

  // Get therapist by ID (simplified)
  getTherapistById: async (therapistId: string): Promise<Therapist | undefined> => {
    const therapists = await appointmentService.getTherapists();
    return therapists.find(t => t.id === therapistId);
  }
};
