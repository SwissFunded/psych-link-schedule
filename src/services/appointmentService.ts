import { supabase } from '@/integrations/supabase/client';
import { 
  addToGoogleCalendar, 
  updateGoogleCalendarEvent, 
  deleteFromGoogleCalendar,
  formatAppointmentForCalendar,
  GoogleCalendarAuth
} from './calendarService';

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
  duration: number; // in minutes
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
const generateAvailableSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
  
  // Generate slots for the next 14 days
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Generate slots for each therapist
    for (const therapist of therapists) {
      // Morning slots: 09:00, 10:00, 11:00
      for (let hour = 9; hour <= 11; hour++) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        slots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available: true
        });
      }
      
      // Afternoon slots: 13:00, 14:00, 15:00, 16:00, 17:00
      for (let hour = 13; hour <= 17; hour++) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        slots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available: true
        });
      }
    }
  }
  
  return slots;
};

const availableSlots = generateAvailableSlots();

// Generate a guaranteed list of fixed available time slots for the next 7 days
// Matches the same schedule as main slots
const generateFixedAvailableSlots = (): TimeSlot[] => {
  const fixedSlots: TimeSlot[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
  
  // Generate slots for the next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Generate slots for each therapist - full schedule
    for (const therapist of therapists) {
      // Morning: 09:00, 10:00, 11:00
      // Afternoon: 13:00, 14:00, 15:00, 16:00, 17:00
      const availableHours = [9, 10, 11, 13, 14, 15, 16, 17];
      
      for (const hour of availableHours) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        fixedSlots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available: true
        });
      }
    }
  }
  
  return fixedSlots;
};

const fixedAvailableSlots = generateFixedAvailableSlots();

// Helper function to get user's Google Calendar auth
async function getGoogleCalendarAuth(): Promise<GoogleCalendarAuth | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.google_calendar_auth || null;
  } catch (error) {
    console.error('Error getting calendar auth:', error);
    return null;
  }
}

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
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Filter available slots
    const filteredSlots = availableSlots.filter(slot => 
      slot.therapistId === therapistId &&
      slot.available &&
      new Date(slot.date) >= startDate &&
      new Date(slot.date) <= endDate
    );
    
    // If no slots are available, return fixed guaranteed slots
    if (filteredSlots.length === 0) {
      return fixedAvailableSlots.filter(slot => 
        slot.therapistId === therapistId &&
        new Date(slot.date) >= startDate &&
        new Date(slot.date) <= endDate
      );
    }
    
    return filteredSlots;
  },
  
  bookAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAppointment: Appointment = {
      ...appointment,
      id: 'apt' + Math.random().toString(36).substr(2, 9)
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
    
    // Sync to Google Calendar if connected
    try {
      const calendarAuth = await getGoogleCalendarAuth();
      if (calendarAuth) {
        const therapist = await appointmentService.getTherapistById(appointment.therapistId);
        if (therapist) {
          const calendarEvent = formatAppointmentForCalendar(newAppointment, therapist.name);
          const eventId = await addToGoogleCalendar(calendarEvent, calendarAuth);
          if (eventId) {
            newAppointment.googleCalendarEventId = eventId;
            console.log('✓ Appointment synced to Google Calendar');
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync to Google Calendar:', error);
      // Don't fail the booking if calendar sync fails
    }
    
    return newAppointment;
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
      
      // Delete from Google Calendar if synced
      try {
        const calendarAuth = await getGoogleCalendarAuth();
        if (calendarAuth && appointment.googleCalendarEventId) {
          const deleted = await deleteFromGoogleCalendar(
            appointment.googleCalendarEventId,
            calendarAuth
          );
          if (deleted) {
            console.log('✓ Appointment removed from Google Calendar');
          }
        }
      } catch (error) {
        console.error('Failed to delete from Google Calendar:', error);
        // Don't fail the cancellation if calendar sync fails
      }
      
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
      
      // Update in Google Calendar if synced
      try {
        const calendarAuth = await getGoogleCalendarAuth();
        if (calendarAuth && appointment.googleCalendarEventId) {
          const therapist = await appointmentService.getTherapistById(appointment.therapistId);
          if (therapist) {
            const calendarEvent = formatAppointmentForCalendar(
              patientAppointments[appointmentIndex],
              therapist.name
            );
            const updated = await updateGoogleCalendarEvent(
              appointment.googleCalendarEventId,
              calendarEvent,
              calendarAuth
            );
            if (updated) {
              console.log('✓ Appointment updated in Google Calendar');
            }
          }
        }
      } catch (error) {
        console.error('Failed to update Google Calendar:', error);
        // Don't fail the reschedule if calendar sync fails
      }
      
      return patientAppointments[appointmentIndex];
    }
    
    return null;
  }
};
