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
}

export interface TimeSlot {
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes
  available: boolean;
}

import { vitabyteService } from './vitabyteService';

/**
 * USE_MOCK_DATA controls whether to use mock data or the real API.
 * Set to false to use the Vitabyte ePAD API.
 */
const USE_MOCK_DATA = false;

// Mock therapists data (used only if USE_MOCK_DATA is true)
const therapists: Therapist[] = [
  {
    id: "t1",
    name: "Dr. Sarah Johnson",
    specialty: "Cognitive Behavioral Therapy",
  },
  {
    id: "t2",
    name: "Dr. Michael Wong",
    specialty: "Family Therapy",
  },
  {
    id: "t3",
    name: "Dr. Alicia Garcia",
    specialty: "Trauma-Focused Therapy",
  }
];

// Mock appointments for the current patient (used only if USE_MOCK_DATA is true)
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

// Mock available time slots (used only if USE_MOCK_DATA is true)
const generateAvailableSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
  
  // Generate slots for the next 14 days
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Generate slots for each therapist
    for (const therapist of therapists) {
      // Morning slots
      for (let hour = 9; hour < 12; hour++) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        // All slots are available
        slots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available: true
        });
      }
      
      // Afternoon slots
      for (let hour = 13; hour < 17; hour++) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        // All slots are available
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

// Generate a guaranteed list of fixed available time slots for the next 7 days (used only if USE_MOCK_DATA is true)
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
    
    // Generate slots for each therapist at fixed times: 10:00, 11:00, 14:00, 16:00
    for (const therapist of therapists) {
      const fixedHours = [10, 11, 14, 16];
      
      for (const hour of fixedHours) {
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

// Service functions - automatically uses the right data source based on USE_MOCK_DATA
export const appointmentService = {
  getTherapists: async (): Promise<Therapist[]> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...therapists];
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getTherapists();
    }
  },
  
  getTherapistById: async (id: string): Promise<Therapist | undefined> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      return therapists.find(t => t.id === id);
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getTherapistById(id);
    }
  },
  
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 700));
      return patientAppointments.filter(apt => apt.patientId === patientId);
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getPatientAppointments(patientId);
    }
  },
  
  getUpcomingAppointments: async (patientId: string): Promise<Appointment[]> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      const now = new Date();
      return patientAppointments.filter(apt => 
        apt.patientId === patientId && 
        apt.status === 'scheduled' && 
        new Date(apt.date) > now
      );
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getUpcomingAppointments(patientId);
    }
  },
  
  getPastAppointments: async (patientId: string): Promise<Appointment[]> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      const now = new Date();
      return patientAppointments.filter(apt => 
        apt.patientId === patientId && 
        (apt.status === 'completed' || apt.status === 'no-show' || new Date(apt.date) < now)
      );
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getPastAppointments(patientId);
    }
  },
  
  getAvailableTimeSlots: async (therapistId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> => {
    if (USE_MOCK_DATA) {
      // Use mock data
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
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.getAvailableTimeSlots(therapistId, startDate, endDate);
    }
  },
  
  bookAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAppointment: Appointment = {
        ...appointment,
        id: 'apt' + Math.random().toString(36).substr(2, 9)
      };
      
      // Update our mock data
      patientAppointments.push(newAppointment);
      
      return newAppointment;
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.bookAppointment(appointment);
    }
  },
  
  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
      if (appointmentIndex !== -1) {
        patientAppointments[appointmentIndex].status = 'cancelled';
        return true;
      }
      
      return false;
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.cancelAppointment(appointmentId);
    }
  },
  
  rescheduleAppointment: async (appointmentId: string, newDate: string): Promise<Appointment | null> => {
    if (USE_MOCK_DATA) {
      // Use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
      if (appointmentIndex !== -1) {
        patientAppointments[appointmentIndex].date = newDate;
        return patientAppointments[appointmentIndex];
      }
      
      return null;
    } else {
      // Use Vitabyte ePAD API
      return vitabyteService.rescheduleAppointment(appointmentId, newDate);
    }
  }
};
