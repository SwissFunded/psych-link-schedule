import { supabase } from '@/integrations/supabase/client';
import { getCustomerByMail, getTreater, getMultipleTreaters, getProviderDetails, BookAppointmentData, createEpatAppointmentDirectly, Treater, getAppointments } from '@/lib/epatApi';

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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'pending_admin_review' | 'pending_cancellation' | 'pending_reschedule';
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
  selectedTreater?: Treater; // Optional selected treater for multiple treater scenarios
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

// Get busy times from Vitabyte ICS Calendar
async function getBusyTimes(): Promise<CalendarSlot[]> {
  try {
    // Use our Vercel API route to avoid CORS issues
    const apiUrl = '/api/calendar';
    console.log('🗓️ Fetching Vitabyte ICS calendar (busy times) via proxy from:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('❌ API route failed:', response.status, response.statusText);
      return [];
    }
    
    const icsData = await response.text();
    
    console.log('📄 ICS Data received, length:', icsData.length);
    console.log('📄 First 500 chars of ICS data:', icsData.substring(0, 500));
    
    // Parse ICS data manually (simple parser for VEVENT)
    const busyTimes: CalendarSlot[] = [];
    const lines = icsData.split('\n');
    let currentEvent: any = {};
    let inEvent = false;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (cleanLine === 'END:VEVENT' && inEvent) {
        // Process the event - these are BUSY times (existing appointments)
        if (currentEvent.DTSTART && currentEvent.DTEND) {
          console.log('🔍 Processing event:', currentEvent.SUMMARY, 'DTSTART:', currentEvent.DTSTART, 'DTEND:', currentEvent.DTEND);
          const startDateTime = parseICSDateTime(currentEvent.DTSTART);
          const endDateTime = parseICSDateTime(currentEvent.DTEND);
          
          console.log('🔍 Parsed times:', startDateTime, 'to', endDateTime);
          
          if (startDateTime && endDateTime) {
            // Only include future appointments (skip past dates)
            const now = new Date();
            if (endDateTime > now) {
              // Generate all 30-minute slots for the duration of the event
              let currentSlot = new Date(startDateTime);
              while (currentSlot < endDateTime) {
                const date = currentSlot.toISOString().split('T')[0]; // YYYY-MM-DD
                const time = currentSlot.toTimeString().substring(0, 5); // HH:MM
                
                busyTimes.push({
                  date,
                  time,
                  title: currentEvent.SUMMARY || 'Busy',
                  description: currentEvent.DESCRIPTION || ''
                });
                
                // Move to the next 30-minute slot
                currentSlot.setMinutes(currentSlot.getMinutes() + 30);
              }
            }
          }
        }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent && cleanLine.includes(':')) {
        const [key, ...valueParts] = cleanLine.split(':');
        const value = valueParts.join(':');
        currentEvent[key.split(';')[0]] = value; // Handle keys like DTSTART;TZID=...
      }
    }
    
    console.log('✅ Parsed', busyTimes.length, 'future busy time slots from ICS');
    
    // Log the date range of busy times for debugging
    if (busyTimes.length > 0) {
      const dates = busyTimes.map(slot => slot.date).sort();
      const earliestDate = dates[0];
      const latestDate = dates[dates.length - 1];
      console.log('📅 Busy times date range:', earliestDate, 'to', latestDate);
    }
    
    return busyTimes;
  } catch (error) {
    console.error('❌ Failed to fetch Vitabyte ICS calendar via proxy:', error);
    return [];
  }
}

// Generate available time slots by excluding busy times
async function getCalendarSlots(): Promise<CalendarSlot[]> {
  try {
    // Get busy times from ICS calendar
    const busyTimes = await getBusyTimes();
    
    // Generate available slots for the next 30 days
    const availableSlots: CalendarSlot[] = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
    
    // Working hours: 8:00 AM to 6:00 PM, Monday to Friday
    const workingHours = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30'
    ];
    
    // Group busy times by date for efficient lookup
    const busyTimesByDate: Record<string, string[]> = {};
    busyTimes.forEach(busy => {
      if (!busyTimesByDate[busy.date]) {
        busyTimesByDate[busy.date] = [];
      }
      busyTimesByDate[busy.date].push(busy.time);
    });
    
    // Generate available slots for each day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const busyTimesForDate = busyTimesByDate[dateStr] || [];
        
        // Add available times (not in busy list)
        workingHours.forEach(time => {
          if (!busyTimesForDate.includes(time)) {
            availableSlots.push({
              date: dateStr,
              time: time,
              title: 'Available',
              description: 'Available appointment slot'
            });
          }
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('✅ Generated', availableSlots.length, 'available time slots (excluding', busyTimes.length, 'busy times)');
    
    // Log the date range of available slots
    if (availableSlots.length > 0) {
      const dates = availableSlots.map(slot => slot.date).sort();
      const earliestDate = dates[0];
      const latestDate = dates[dates.length - 1];
      console.log('📅 Available slots date range:', earliestDate, 'to', latestDate);
    }
    
    return availableSlots;
  } catch (error) {
    console.error('❌ Failed to generate available calendar slots:', error);
    return [];
  }
}

// Helper function to parse ICS datetime format
function parseICSDateTime(icsDateTime: string): Date | null {
  try {
    // Handle different ICS datetime formats
    // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    // Example: 20240715T100000Z or 20240715T100000
    
    let dateStr = icsDateTime;
    let isUTC = false;
    
    // Check if it's UTC (ends with Z)
    if (dateStr.endsWith('Z')) {
      isUTC = true;
      dateStr = dateStr.replace('Z', '');
    }
    
    if (dateStr.includes('T')) {
      const parts = dateStr.split('T');
      const datePart = parts[0];
      const timePart = parts[1];
      
      const year = parseInt(datePart.substring(0, 4));
      const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(datePart.substring(6, 8));
      
      const hour = parseInt(timePart.substring(0, 2));
      const minute = parseInt(timePart.substring(2, 4));
      const second = parseInt(timePart.substring(4, 6)) || 0;
      
      if (isUTC) {
        // UTC time - create UTC date
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      } else {
        // Local time - create local date (Swiss timezone)
        return new Date(year, month, day, hour, minute, second);
      }
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
        .select('appointment_date, appointment_time, duration')
        .eq('status', 'scheduled');

      // Create a map of booked times by date
      const bookedTimesByDate: Record<string, string[]> = {};
      existingBookings?.forEach(booking => {
        const { appointment_date, appointment_time, duration } = booking;
        if (!bookedTimesByDate[appointment_date]) {
          bookedTimesByDate[appointment_date] = [];
        }

        const startTime = new Date(`${appointment_date}T${appointment_time}`);
        const numSlots = Math.ceil((duration || 50) / 30);

        for (let i = 0; i < numSlots; i++) {
          const slotTime = new Date(startTime.getTime() + i * 30 * 60 * 1000);
          bookedTimesByDate[appointment_date].push(
            slotTime.toTimeString().substring(0, 5)
          );
        }
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

  // Book a new appointment using Vitabyte API directly (bypassing Supabase)
  bookAppointmentViaAPI: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; appointmentData?: any; error?: string }> => {
    try {
      console.log('🔄 Attempting direct API booking for:', bookingData.patientEmail);
      
      // First, get patient info from Vitabyte
      const customers = await getCustomerByMail(bookingData.patientEmail);
      if (customers.length === 0) {
        return { success: false, error: 'Patient not found in Vitabyte system' };
      }

      const vitabytePatientId = customers[0].patid;
      console.log('✅ Found patient ID:', vitabytePatientId);

      // Get treater info - use selected treater if provided
      let treater;
      if (bookingData.selectedTreater) {
        treater = bookingData.selectedTreater;
        console.log('✅ Using selected treater provider ID:', treater.provider);
      } else {
        treater = await getTreater(vitabytePatientId);
        if (!treater) {
          return { success: false, error: 'No treater assigned to patient' };
        }
        console.log('✅ Found treater provider ID:', treater.provider);
      }

      // CALENDAR ID MAPPING: Provider ID 215 doesn't directly map to calendar ID
      // From logs: Calendar ID 120 works for Dr. Sporer, API docs show calendar ID 2 as example
      // For provider 215 (Miro' Waltisberg), we need to find the correct calendar ID
      
      // Temporary: Try known working calendar IDs
      // TODO: Implement proper provider-to-calendar mapping or discovery endpoint
      const calendarIdMapping: Record<number, number> = {
        96: 120,   // Dr. med. Sonja Sporer -> Calendar ID 120 (from logs)
        215: 2,    // Miro' Waltisberg -> Try Calendar ID 2 (from API docs example)
      };
      
      const calendarId = calendarIdMapping[treater.provider] || 2; // Default to example calendar ID 2
      console.log(`📅 Mapping provider ${treater.provider} to calendar ID ${calendarId}`);

      // Format the appointment data for Vitabyte API
      const appointmentDateTime = new Date(`${bookingData.appointmentDate}T${bookingData.appointmentTime}:00`);
      const endDateTime = new Date(appointmentDateTime.getTime() + (bookingData.duration || 50) * 60 * 1000);

      const formatVitabyteDateTime = (date: Date) => {
        return date.toISOString().replace('T', ' ').substring(0, 19); // "2024-12-27 14:30:00"
      };

      const dateTimeStr = formatVitabyteDateTime(appointmentDateTime);
      const endTimeStr = formatVitabyteDateTime(endDateTime);

      const apiBookingData: BookAppointmentData = {
        date: dateTimeStr,
        end: endTimeStr,
        dateTs: dateTimeStr,    // Required by API docs
        endTs: endTimeStr,      // Required by API docs
        calendar: calendarId,
        patid: vitabytePatientId,
        appointment: bookingData.appointmentType === 'phone' ? 'Telefon' : 'Konsultation',
        comment: bookingData.notes || `Booked via app for ${bookingData.patientName}`
      };

      console.log('📡 Sending booking request to Vitabyte API:', apiBookingData);

      // Try to create the appointment using the API
      const result = await createEpatAppointmentDirectly(apiBookingData);
      
      if (result && result.appointmentid) {
        console.log('✅ Successfully created appointment via API:', result);
        return { 
          success: true, 
          id: result.appointmentid.toString(), 
          appointmentData: { ...apiBookingData, vitabyteAppointmentId: result.appointmentid }
        };
      } else {
        console.log('❌ API booking failed, no appointment ID returned');
        return { success: false, error: 'Failed to create appointment in Vitabyte system' };
      }

    } catch (error) {
      console.error('❌ API booking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown API booking error' 
      };
    }
  },

  // Book a new appointment (store for admin dashboard review)
  bookAppointment: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      console.log('🔄 Starting booking process for admin dashboard:', bookingData.patientEmail);
      
      // Get patient info from Vitabyte for context
      let vitabytePatientId = null;
      let treaterName = null;
      let treaterId = null;
      let allTreaters = null;

      try {
        const customers = await getCustomerByMail(bookingData.patientEmail);
        if (customers.length > 0) {
          vitabytePatientId = customers[0].patid;
          
          // Try to get multiple treaters info
          const multipleTreatersResponse = await getMultipleTreaters(vitabytePatientId);
          if (multipleTreatersResponse && multipleTreatersResponse.count > 0) {
            allTreaters = multipleTreatersResponse.treaters;
            
            // Use selected treater if provided, otherwise use the first treater as primary
            const primaryTreater = bookingData.selectedTreater || multipleTreatersResponse.treaters[0];
            treaterId = primaryTreater.provider;
            treaterName = primaryTreater.name;
            
            console.log(`🎯 Found ${multipleTreatersResponse.count} treater(s) for patient:`, allTreaters);
            
            // If we don't have name from the treater data, try to get it
            if (!treaterName) {
              const providerDetails = await getProviderDetails({ providerid: primaryTreater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            }
          } else {
            // Fallback to single treater lookup
            const treater = await getTreater(vitabytePatientId);
            if (treater) {
              treaterId = treater.provider;
              const providerDetails = await getProviderDetails({ providerid: treater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch Vitabyte data, proceeding with basic booking:', error);
      }

      // Store booking in Supabase with "pending_admin_review" status
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
          status: 'pending_admin_review', // Special status for admin dashboard
          metadata: { 
            booking_source: 'web_app',
            requires_admin_approval: true,
            booking_timestamp: new Date().toISOString(),
            all_treaters: allTreaters,
            treater_count: allTreaters?.length || 0
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking for admin review:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Booking stored for admin review! ID:', data.id);
      return { success: true, id: data.id };
    } catch (error) {
      console.error('❌ Error in booking for admin dashboard:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },

  // Original Supabase-only booking (renamed from bookAppointment)
  bookAppointmentSupabaseOnly: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      // First, try to get patient info from Vitabyte (minimal API call)
      let vitabytePatientId = null;
      let treaterName = null;
      let treaterId = null;
      let allTreaters = null;

      try {
        const customers = await getCustomerByMail(bookingData.patientEmail);
        if (customers.length > 0) {
          vitabytePatientId = customers[0].patid;
          
          // Try to get multiple treaters info
          const multipleTreatersResponse = await getMultipleTreaters(vitabytePatientId);
          if (multipleTreatersResponse && multipleTreatersResponse.count > 0) {
            allTreaters = multipleTreatersResponse.treaters;
            
            // Use selected treater if provided, otherwise use the first treater as primary
            const primaryTreater = bookingData.selectedTreater || multipleTreatersResponse.treaters[0];
            treaterId = primaryTreater.provider;
            treaterName = primaryTreater.name;
            
            console.log(`🎯 Found ${multipleTreatersResponse.count} treater(s) for patient:`, allTreaters);
            
            // If we don't have name from the treater data, try to get it
            if (!treaterName) {
              const providerDetails = await getProviderDetails({ providerid: primaryTreater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            }
          } else {
            // Fallback to single treater lookup
            const treater = await getTreater(vitabytePatientId);
            if (treater) {
              treaterId = treater.provider;
              const providerDetails = await getProviderDetails({ providerid: treater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
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
          status: 'scheduled',
          // Store all treaters information as JSON
          metadata: allTreaters ? { 
            all_treaters: allTreaters,
            treater_count: allTreaters.length 
          } : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error in bookAppointmentSupabaseOnly:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },

  // Get user's appointments from Vitabyte API (primary) with Supabase fallback
  getUpcomingAppointments: async (patientEmail: string): Promise<Appointment[]> => {
    try {
      // First try to get appointments from Vitabyte API
      console.log('🔍 Fetching appointments from Vitabyte API for:', patientEmail);
      
      // Get patient ID from email
      const customers = await getCustomerByMail(patientEmail);
      if (customers.length > 0) {
        const vitabytePatientId = customers[0].patid;
        console.log('✅ Found Vitabyte patient ID:', vitabytePatientId);
        
        // Get appointments from Vitabyte API
        const appointmentsResponse = await getAppointments({ patid: vitabytePatientId });
        
        if (appointmentsResponse?.result && Array.isArray(appointmentsResponse.result)) {
          console.log('✅ Found Vitabyte appointments:', appointmentsResponse.result.length);
          
          const today = new Date();
          const upcomingAppointments = appointmentsResponse.result
            .filter((apt: any) => {
              // Filter for future appointments
              const appointmentDate = new Date(apt.date || apt.start || apt.datetime);
              return appointmentDate >= today;
            })
            .map((apt: any) => ({
              id: apt.id || apt.appointmentid || `vitabyte-${apt.date}-${apt.calendar}`,
              patientId: patientEmail,
              therapistId: apt.calendar?.toString() || 'unknown',
              date: apt.date || apt.start || apt.datetime,
              duration: apt.duration || 50,
              status: 'scheduled' as const,
              type: 'in-person' as const,
              notes: apt.comment || apt.notes,
              metadata: {
                vitabyteAppointmentId: apt.id || apt.appointmentid,
                calendar: apt.calendar,
                appointmentType: apt.appointment || apt.type || 'Termin',
                appointmentTitle: apt.appointment || apt.type || apt.title || 'Termin',
                source: 'vitabyte'
              }
            }))
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          console.log('✅ Processed upcoming Vitabyte appointments:', upcomingAppointments.length);
          return upcomingAppointments;
        }
      }
      
      console.log('ℹ️ No Vitabyte appointments found, falling back to Supabase');
    } catch (error) {
      console.warn('⚠️ Error fetching from Vitabyte API, falling back to Supabase:', error);
    }
    
    // Fallback to Supabase appointments
    return appointmentService.getUpcomingAppointmentsFromSupabase(patientEmail);
  },

  // Get user's appointments from Supabase (fallback method)
  getUpcomingAppointmentsFromSupabase: async (patientEmail: string): Promise<Appointment[]> => {
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
        vitabytePatientId: booking.vitabyte_patient_id,
        source: 'supabase'
      }
    })) || [];
  },

  // Get user's past appointments from Vitabyte API (primary) with Supabase fallback
  getPastAppointments: async (patientEmail: string): Promise<Appointment[]> => {
    try {
      // First try to get appointments from Vitabyte API
      console.log('🔍 Fetching past appointments from Vitabyte API for:', patientEmail);
      
      // Get patient ID from email
      const customers = await getCustomerByMail(patientEmail);
      if (customers.length > 0) {
        const vitabytePatientId = customers[0].patid;
        console.log('✅ Found Vitabyte patient ID:', vitabytePatientId);
        
        // Get appointments from Vitabyte API
        const appointmentsResponse = await getAppointments({ patid: vitabytePatientId });
        
        if (appointmentsResponse?.result && Array.isArray(appointmentsResponse.result)) {
          console.log('✅ Found Vitabyte appointments:', appointmentsResponse.result.length);
          
          const today = new Date();
          const pastAppointments = appointmentsResponse.result
            .filter((apt: any) => {
              // Filter for past appointments
              const appointmentDate = new Date(apt.date || apt.start || apt.datetime);
              return appointmentDate < today;
            })
            .map((apt: any) => ({
              id: apt.id || apt.appointmentid || `vitabyte-${apt.date}-${apt.calendar}`,
              patientId: patientEmail,
              therapistId: apt.calendar?.toString() || 'unknown',
              date: apt.date || apt.start || apt.datetime,
              duration: apt.duration || 50,
              status: 'completed' as const, // Assume past appointments are completed
              type: 'in-person' as const,
              notes: apt.comment || apt.notes,
              metadata: {
                vitabyteAppointmentId: apt.id || apt.appointmentid,
                calendar: apt.calendar,
                appointmentType: apt.appointment || apt.type || 'Termin',
                appointmentTitle: apt.appointment || apt.type || apt.title || 'Termin',
                source: 'vitabyte'
              }
            }))
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          console.log('✅ Processed past Vitabyte appointments:', pastAppointments.length);
          return pastAppointments;
        }
      }
      
      console.log('ℹ️ No Vitabyte past appointments found, falling back to Supabase');
    } catch (error) {
      console.warn('⚠️ Error fetching past appointments from Vitabyte API, falling back to Supabase:', error);
    }
    
    // Fallback to Supabase appointments
    return appointmentService.getPastAppointmentsFromSupabase(patientEmail);
  },

  // Get past appointments from Supabase (fallback method)
  getPastAppointmentsFromSupabase: async (patientEmail: string): Promise<Appointment[]> => {
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
        vitabytePatientId: booking.vitabyte_patient_id,
        source: 'supabase'
      }
    })) || [];
  },

  // Request appointment cancellation (goes to admin for approval)
  cancelAppointment: async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Instead of directly cancelling, create a cancellation request
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'pending_cancellation',
          metadata: {
            cancellation_requested: true,
            cancellation_timestamp: new Date().toISOString(),
            requires_admin_approval: true
          }
        })
        .eq('id', appointmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting appointment cancellation:', error);
      return { success: false, error: 'Failed to request cancellation' };
    }
  },

  // Request appointment reschedule (goes to admin for approval)
  rescheduleAppointment: async (
    appointmentId: string, 
    newDate: string, 
    newTime: string, 
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the current appointment data
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !currentAppointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Update with reschedule request
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'pending_reschedule',
          metadata: {
            ...((currentAppointment as any).metadata || {}),
            reschedule_requested: true,
            reschedule_timestamp: new Date().toISOString(),
            original_date: currentAppointment.appointment_date,
            original_time: currentAppointment.appointment_time,
            requested_new_date: newDate,
            requested_new_time: newTime,
            reschedule_reason: reason,
            requires_admin_approval: true
          }
        })
        .eq('id', appointmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting appointment reschedule:', error);
      return { success: false, error: 'Failed to request reschedule' };
    }
  },

  // Get therapist by ID (simplified)
  getTherapistById: async (therapistId: string): Promise<Therapist | undefined> => {
    const therapists = await appointmentService.getTherapists();
    return therapists.find(t => t.id === therapistId);
  },

  // Get all appointments from all patients (admin function)
  getAllAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('🔍 Fetching all appointments from all patients (admin)');
      
      // Get all appointments from Supabase
      const { data: supabaseBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching appointments from Supabase:', error);
        throw error;
      }

      console.log('📅 Found', supabaseBookings?.length || 0, 'appointments in Supabase');

      const allAppointments: Appointment[] = [];

      // Convert Supabase bookings to Appointment format
      if (supabaseBookings) {
        for (const booking of supabaseBookings) {
          allAppointments.push({
            id: booking.id,
            patientId: booking.patient_email,
            therapistId: booking.appointment_type,
            date: `${booking.appointment_date}T${booking.appointment_time}:00`,
            duration: booking.duration || 60,
            status: booking.status as any,
            type: 'in-person' as any,
            notes: booking.notes,
            metadata: {
              appointmentType: booking.appointment_type,
              patientEmail: booking.patient_email,
              patientName: booking.patient_name,
              treaterName: booking.treater_name,
              treaterId: booking.treater_id,
              vitabytePatientId: booking.vitabyte_patient_id,
              source: 'supabase'
            }
          });
        }
      }

      // Try to get additional appointments from Vitabyte API for known patients
      try {
        // Get all unique patient emails from Supabase bookings
        const patientEmails = [...new Set(supabaseBookings?.map(booking => booking.patient_email).filter(Boolean) || [])];
        
        console.log('👥 Found', patientEmails.length, 'unique patient emails');
        
        // Fetch Vitabyte appointments for each patient
        for (const email of patientEmails) {
          try {
            const customers = await getCustomerByMail(email);
            if (customers.length > 0) {
              const vitabytePatientId = customers[0].patid;
              const appointmentsResponse = await getAppointments({ patid: vitabytePatientId });
              
              if (appointmentsResponse?.result && Array.isArray(appointmentsResponse.result)) {
                for (const apt of appointmentsResponse.result) {
                  // Create unique ID to avoid duplicates
                  const vitabyteId = `vitabyte-${apt.id || apt.appointmentid || `${apt.date}-${apt.calendar}`}`;
                  
                  // Check if we already have this appointment
                  if (!allAppointments.find(existing => existing.id === vitabyteId)) {
                    allAppointments.push({
                      id: vitabyteId,
                      patientId: email,
                      therapistId: apt.calendar?.toString() || 'unknown',
                      date: apt.date || apt.start || apt.datetime,
                      duration: apt.duration || 50,
                      status: 'scheduled' as const,
                      type: 'in-person' as const,
                      notes: apt.comment || apt.notes,
                      metadata: {
                        vitabyteAppointmentId: apt.id || apt.appointmentid,
                        calendar: apt.calendar,
                        appointmentType: apt.appointment || apt.type || 'Termin',
                        appointmentTitle: apt.appointment || apt.type || apt.title || 'Termin',
                        patientEmail: email,
                        patientName: customers[0].firstname + ' ' + customers[0].lastname,
                        source: 'vitabyte'
                      }
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch Vitabyte appointments for ${email}:`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch Vitabyte appointments:', error);
      }

      console.log('✅ Total appointments collected:', allAppointments.length);
      
      // Sort by date (newest first)
      allAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return allAppointments;
    } catch (error) {
      console.error('❌ Error in getAllAppointments:', error);
      throw error;
    }
  }
};
