import { supabase } from '@/integrations/supabase/client';
import { checkTimeSlotAvailability } from './vitabyteCalendarService';
// TODO: Google Calendar sync needs to be moved to server-side (Supabase Edge Functions)
// The googleapis package is Node.js-only and cannot run in the browser
// import { 
//   addToGoogleCalendar, 
//   updateGoogleCalendarEvent, 
//   deleteFromGoogleCalendar,
//   formatAppointmentForCalendar,
//   GoogleCalendarAuth
// } from './calendarService';

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
  googleCalendarEventId?: string; // Store Google Calendar event ID
}

export interface TimeSlot {
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes (always 30)
  available: boolean;
}

// Mock therapists data
const therapists: Therapist[] = [
  {
    id: "t1",
    name: "Dipl. Arzt Antoine Theurillat",
    specialty: "Allgemeine Psychotherapie",
  }
];

// Mock appointments for the current patient
const patientAppointments: Appointment[] = [
  {
    id: "apt1",
    patientId: "p-123",
    therapistId: "t1",
    date: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    status: 'scheduled',
    type: 'in-person'
  },
  {
    id: "apt2",
    patientId: "p-123",
    therapistId: "t3",
    date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    status: 'scheduled',
    type: 'video'
  },
  {
    id: "apt3",
    patientId: "p-123",
    therapistId: "t1",
    date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 50,
    status: 'completed',
    type: 'in-person'
  }
];

// Mock available time slots
// Schedule for Dipl. Arzt Antoine Theurillat:
// Mo-Fr: 08:00-18:00
// Blocked until: 09:00 (first appointment at 09:00)
// Lunch break: 12:00-13:00
// Last appointment: 17:00
// Available slots: 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00
// PERFORMANCE: Dynamically generate slots on demand instead of all at once
const generateAvailableSlotsInRange = (startDate: Date, endDate: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      // Generate slots for each therapist
      for (const therapist of therapists) {
        // Morning slots: 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
        for (let hour = 8; hour < 12; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotDate = new Date(current);
            slotDate.setHours(hour, minute, 0, 0);
            
            slots.push({
              therapistId: therapist.id,
              date: slotDate.toISOString(),
              duration: 30,
              available: true
            });
          }
        }
        
        // Afternoon slots: 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30
        for (let hour = 13; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            // Skip slots after 17:30
            if (hour === 17 && minute > 30) continue;
            
            const slotDate = new Date(current);
            slotDate.setHours(hour, minute, 0, 0);
            
            slots.push({
              therapistId: therapist.id,
              date: slotDate.toISOString(),
              duration: 30,
              available: true
            });
          }
        }
      }
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return slots;
};

// Keep a small cache for immediate use (next 14 days from tomorrow)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const twoWeeksOut = new Date(tomorrow);
twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
const availableSlots = generateAvailableSlotsInRange(tomorrow, twoWeeksOut);

// PERFORMANCE: Generate fixed slots on demand using the same efficient generator
// This avoids loading 180 days of slots upfront
const fixedAvailableSlots = generateAvailableSlotsInRange(tomorrow, twoWeeksOut);

// TODO: Move to server-side
// Helper function to get user's Google Calendar auth
// async function getGoogleCalendarAuth(): Promise<GoogleCalendarAuth | null> {
//   try {
//     const { data: { user } } = await supabase.auth.getUser();
//     return user?.user_metadata?.google_calendar_auth || null;
//   } catch (error) {
//     console.error('Error getting calendar auth:', error);
//     return null;
//   }
// }

// Service functions
export const appointmentService = {
  getTherapists: async (): Promise<Therapist[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...therapists];
  },
  
  getTherapistById: async (id: string): Promise<Therapist | undefined> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return therapists.find(t => t.id === id);
  },
  
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    return patientAppointments.filter(apt => apt.patientId === patientId);
  },
  
  getUpcomingAppointments: async (patientId: string): Promise<Appointment[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date();
    return patientAppointments.filter(apt => 
      apt.patientId === patientId && 
      apt.status === 'scheduled' && 
      new Date(apt.date) > now
    );
  },
  
  getPastAppointments: async (patientId: string): Promise<Appointment[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date();
    return patientAppointments.filter(apt => 
      apt.patientId === patientId && 
      (apt.status === 'completed' || apt.status === 'no-show' || new Date(apt.date) < now)
    );
  },
  
  getAvailableTimeSlots: async (therapistId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400)); // Reduced from 800ms for better mobile performance
    
    // PERFORMANCE: Generate slots on-demand for the requested range only
    const generatedSlots = generateAvailableSlotsInRange(startDate, endDate);
    
    // Filter by therapist and check against booked appointments
    const therapistSlots = generatedSlots.filter(slot => {
      if (slot.therapistId !== therapistId) return false;
      
      // Check if this slot is already booked
      const isBooked = patientAppointments.some(apt => 
        apt.therapistId === therapistId && 
        apt.date === slot.date &&
        apt.status !== 'cancelled'
      );
      
      return !isBooked;
    });
    
    // Check against Vitabyte calendar for real availability
    return checkTimeSlotAvailability(therapistId, therapistSlots);
  },
  
  bookAppointment: async (appointment: Omit<Appointment, 'id'>, patientData: { firstName: string; lastName: string; email: string; phone?: string; appointmentType: string }): Promise<Appointment> => {
    console.log('📅 Starting appointment booking process via Edge Function...');
    
    try {
      // Map appointment type to expected values
      let mappedAppointmentType: 'erstgespraech' | 'folgetermin' | 'telefontermin' = 'folgetermin';
      
      if (patientData.appointmentType.includes('erstgespraech') || patientData.appointmentType === 'erstgespraech') {
        mappedAppointmentType = 'erstgespraech';
      } else if (patientData.appointmentType.includes('telefontermin') || patientData.appointmentType === 'telefontermin') {
        mappedAppointmentType = 'telefontermin';
      } else {
        mappedAppointmentType = 'folgetermin';
      }
      
      // Map appointment mode: convert 'in-person' to 'in_person'
      let mappedAppointmentMode: 'in_person' | 'video' | 'phone' = 'in_person';
      if (appointment.type === 'video') {
        mappedAppointmentMode = 'video';
      } else if (appointment.type === 'phone') {
        mappedAppointmentMode = 'phone';
      } else {
        mappedAppointmentMode = 'in_person';
      }
      
      // Call the Edge Function for robust booking with double-booking prevention
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          therapistId: appointment.therapistId,
          startTime: appointment.date,
          durationMinutes: appointment.duration,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone,
          appointmentType: mappedAppointmentType,
          appointmentMode: mappedAppointmentMode,
          notes: appointment.notes
        }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Fehler beim Buchen des Termins');
      }

      if (!data || !data.success) {
        console.error('❌ Booking failed:', data);
        throw new Error(data?.error || 'Fehler beim Buchen des Termins');
      }

      console.log('✅ Booking successful:', data.booking);

      // Create appointment object from response
      const newAppointment: Appointment = {
        id: data.booking.id,
        ...appointment
      };

      // Update our mock data
      patientAppointments.push(newAppointment);
      
      // Mark the slot as unavailable
      const slotIndex = availableSlots.findIndex(slot => 
        slot.therapistId === appointment.therapistId &&
        slot.date === appointment.date
      );
      
      if (slotIndex !== -1) {
        availableSlots[slotIndex].available = false;
      }
      
      // Also check fixedAvailableSlots
      const fixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === appointment.date
      );
      
      if (fixedSlotIndex !== -1) {
        fixedAvailableSlots[fixedSlotIndex].available = false;
      }
      
      // For 60-minute appointments, also mark the next slot as unavailable
      if (appointment.duration === 60) {
        const nextSlotTime = new Date(appointment.date);
        nextSlotTime.setMinutes(nextSlotTime.getMinutes() + 30);
        const nextSlotDate = nextSlotTime.toISOString();
        
        const nextSlotIndex = availableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === nextSlotDate
        );
        if (nextSlotIndex !== -1) {
          availableSlots[nextSlotIndex].available = false;
        }
        
        const nextFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === nextSlotDate
        );
        if (nextFixedSlotIndex !== -1) {
          fixedAvailableSlots[nextFixedSlotIndex].available = false;
        }
      }
      
      return newAppointment;
    } catch (error: any) {
      console.error('❌ Booking failed:', error);
      throw error;
    }
  },
  
  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
      const appointment = patientAppointments[appointmentIndex];
      patientAppointments[appointmentIndex].status = 'cancelled';
      
      // Mark the slot as available again
      const slotIndex = availableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === appointment.date
      );
      
      if (slotIndex !== -1) {
        availableSlots[slotIndex].available = true;
      }
      
      // Also check fixedAvailableSlots
      const fixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === appointment.date
      );
      
      if (fixedSlotIndex !== -1) {
        fixedAvailableSlots[fixedSlotIndex].available = true;
      }
      
      // For 60-minute appointments, also free up the next slot
      if (appointment.duration === 60) {
        const nextSlotTime = new Date(appointment.date);
        nextSlotTime.setMinutes(nextSlotTime.getMinutes() + 30);
        const nextSlotDate = nextSlotTime.toISOString();
        
        const nextSlotIndex = availableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === nextSlotDate
        );
        if (nextSlotIndex !== -1) {
          availableSlots[nextSlotIndex].available = true;
        }
        
        const nextFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === nextSlotDate
        );
        if (nextFixedSlotIndex !== -1) {
          fixedAvailableSlots[nextFixedSlotIndex].available = true;
        }
      }
      
      // TODO: Google Calendar sync - needs server-side implementation
      // Delete from Google Calendar if synced
      // try {
      //   const calendarAuth = await getGoogleCalendarAuth();
      //   if (calendarAuth && appointment.googleCalendarEventId) {
      //     const deleted = await deleteFromGoogleCalendar(
      //       appointment.googleCalendarEventId,
      //       calendarAuth
      //     );
      //     if (deleted) {
      //       console.log('✓ Appointment removed from Google Calendar');
      //     }
      //   }
      // } catch (error) {
      //   console.error('Failed to delete from Google Calendar:', error);
      //   // Don't fail the cancellation if calendar sync fails
      // }
      
      return true;
    }
    
    return false;
  },
  
  rescheduleAppointment: async (appointmentId: string, newDate: string): Promise<Appointment | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
      const appointment = patientAppointments[appointmentIndex];
      const oldDate = appointment.date;
      
      // Mark old slot as available again
      const oldSlotIndex = availableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === oldDate
      );
      
      if (oldSlotIndex !== -1) {
        availableSlots[oldSlotIndex].available = true;
      }
      
      const oldFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === oldDate
      );
      
      if (oldFixedSlotIndex !== -1) {
        fixedAvailableSlots[oldFixedSlotIndex].available = true;
      }
      
      // For 60-minute appointments, also free up the next old slot
      if (appointment.duration === 60) {
        const oldNextSlotTime = new Date(oldDate);
        oldNextSlotTime.setMinutes(oldNextSlotTime.getMinutes() + 30);
        const oldNextSlotDate = oldNextSlotTime.toISOString();
        
        const oldNextSlotIndex = availableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === oldNextSlotDate
        );
        if (oldNextSlotIndex !== -1) {
          availableSlots[oldNextSlotIndex].available = true;
        }
        
        const oldNextFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === oldNextSlotDate
        );
        if (oldNextFixedSlotIndex !== -1) {
          fixedAvailableSlots[oldNextFixedSlotIndex].available = true;
        }
      }
      
      // Update appointment date
      patientAppointments[appointmentIndex].date = newDate;
      
      // Mark new slot as unavailable
      const newSlotIndex = availableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === newDate
      );
      
      if (newSlotIndex !== -1) {
        availableSlots[newSlotIndex].available = false;
      }
      
      const newFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
        slot.therapistId === appointment.therapistId &&
        slot.date === newDate
      );
      
      if (newFixedSlotIndex !== -1) {
        fixedAvailableSlots[newFixedSlotIndex].available = false;
      }
      
      // For 60-minute appointments, also mark the next new slot as unavailable
      if (appointment.duration === 60) {
        const newNextSlotTime = new Date(newDate);
        newNextSlotTime.setMinutes(newNextSlotTime.getMinutes() + 30);
        const newNextSlotDate = newNextSlotTime.toISOString();
        
        const newNextSlotIndex = availableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === newNextSlotDate
        );
        if (newNextSlotIndex !== -1) {
          availableSlots[newNextSlotIndex].available = false;
        }
        
        const newNextFixedSlotIndex = fixedAvailableSlots.findIndex(slot =>
          slot.therapistId === appointment.therapistId &&
          slot.date === newNextSlotDate
        );
        if (newNextFixedSlotIndex !== -1) {
          fixedAvailableSlots[newNextFixedSlotIndex].available = false;
        }
      }
      
      // TODO: Google Calendar sync - needs server-side implementation
      // Update in Google Calendar if synced
      // try {
      //   const calendarAuth = await getGoogleCalendarAuth();
      //   if (calendarAuth && appointment.googleCalendarEventId) {
      //     const therapist = await appointmentService.getTherapistById(appointment.therapistId);
      //     if (therapist) {
      //       const calendarEvent = formatAppointmentForCalendar(
      //         patientAppointments[appointmentIndex],
      //         therapist.name
      //       );
      //       const updated = await updateGoogleCalendarEvent(
      //         appointment.googleCalendarEventId,
      //         calendarEvent,
      //         calendarAuth
      //       );
      //       if (updated) {
      //         console.log('✓ Appointment updated in Google Calendar');
      //       }
      //     }
      //   }
      // } catch (error) {
      //   console.error('Failed to update Google Calendar:', error);
      //   // Don't fail the reschedule if calendar sync fails
      // }
      
      return patientAppointments[appointmentIndex];
    }
    
    return null;
  }
};
