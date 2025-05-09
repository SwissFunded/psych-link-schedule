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

// Mock therapists data
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
        
        // Randomly mark some slots as unavailable
        const available = Math.random() > 0.4;
        
        slots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available
        });
      }
      
      // Afternoon slots
      for (let hour = 13; hour < 17; hour++) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);
        
        // Randomly mark some slots as unavailable
        const available = Math.random() > 0.4;
        
        slots.push({
          therapistId: therapist.id,
          date: slotDate.toISOString(),
          duration: 50,
          available
        });
      }
    }
  }
  
  return slots;
};

const availableSlots = generateAvailableSlots();

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
    return availableSlots.filter(slot => 
      slot.therapistId === therapistId &&
      slot.available &&
      new Date(slot.date) >= startDate &&
      new Date(slot.date) <= endDate
    );
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
    
    return newAppointment;
  },
  
  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
      patientAppointments[appointmentIndex].status = 'cancelled';
      return true;
    }
    
    return false;
  },
  
  rescheduleAppointment: async (appointmentId: string, newDate: string): Promise<Appointment | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const appointmentIndex = patientAppointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
      patientAppointments[appointmentIndex].date = newDate;
      return patientAppointments[appointmentIndex];
    }
    
    return null;
  }
};
