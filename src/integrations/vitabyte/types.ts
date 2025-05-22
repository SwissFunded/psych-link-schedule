/**
 * Types for the Vitabyte ePAD API integration
 */

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    }
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Therapist types
export interface ApiTherapist {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
  credentials?: string;
  isAvailable: boolean;
  location?: string;
}

// Appointment types
export interface ApiAppointment {
  id: string;
  patientId: string;
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'in-person' | 'video' | 'phone';
  notes?: string;
  createdAt: string; // ISO format
  updatedAt: string; // ISO format
  location?: string;
  linkToMeeting?: string;
}

// Time slot types
export interface ApiTimeSlot {
  id: string;
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes
  available: boolean;
}

// Patient types
export interface ApiPatient {
  id: string;
  name: string;
  surname?: string;
  email: string;
  phone: string;
  birthdate?: string;
}

// Request types
export interface BookAppointmentRequest {
  patientId: string;
  therapistId: string;
  date: string; // ISO format
  duration: number; // in minutes
  type: 'in-person' | 'video' | 'phone';
  notes?: string;
}

export interface UpdateAppointmentRequest {
  id: string;
  date?: string; // ISO format
  duration?: number; // in minutes
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type?: 'in-person' | 'video' | 'phone';
  notes?: string;
}

export interface GetTimeSlotsParams {
  therapistId: string;
  startDate: string; // ISO format
  endDate: string; // ISO format
  duration?: number; // in minutes
}

export interface GetAppointmentsParams {
  patientId: string;
  startDate?: string; // ISO format
  endDate?: string; // ISO format
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type?: 'in-person' | 'video' | 'phone';
  page?: number;
  limit?: number;
}

export interface GetTherapistsParams {
  specialty?: string;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
} 