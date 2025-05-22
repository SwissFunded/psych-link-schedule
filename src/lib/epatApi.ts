import axios from 'axios';

// Base types for the API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types for appointments
export interface Appointment {
  id: string;
  dateTime: string;
  duration: number;
  patientId: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  metadata?: Record<string, unknown>;
}

export interface AvailableAppointment {
  id: string;
  dateTime: string; 
  duration: number;
  isAvailable: boolean;
}

export interface BookAppointmentData {
  appointmentId: string;
  patientId: string;
  metadata?: Record<string, unknown>;
}

export interface RescheduleAppointmentData {
  newAppointmentId: string;
  metadata?: Record<string, unknown>;
}

// Create Axios instance with default configuration
const createApiClient = () => {
  const apiKey = import.meta.env.VITE_EPAT_API_KEY;
  
  if (!apiKey) {
    console.error('API key is not defined in environment variables');
    throw new Error('API key is missing');
  }
  
  return axios.create({
    baseURL: 'https://dev.vitabyte.ch/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
};

// Error handling helper
const handleApiError = (error: unknown): never => {
  // Check if error is an Axios error object
  const axiosError = error as any;
  
  if (axiosError.response) {
    // Don't log sensitive data, only status and message
    console.error(`API Error:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
    });
    
    throw new Error(
      axiosError.response?.data?.error || 
      axiosError.message || 
      'An error occurred with the ePat API'
    );
  }
  
  // For non-Axios errors
  console.error('Unexpected error during API call:', (error as Error)?.message);
  throw error;
};

/**
 * Verifies if the API key is valid by calling the verify endpoint
 * @returns Promise with boolean indicating if the API key is valid
 */
export const verifyApiKey = async (): Promise<boolean> => {
  const apiClient = createApiClient();
  
  try {
    const response = await apiClient.get<ApiResponse<{ valid: boolean }>>('/verify');
    
    return response.data.success && response.data.data?.valid === true;
  } catch (error) {
    // For this specific function, we return false instead of throwing
    // since it's used to check authentication
    console.error('Failed to verify API key');
    return false;
  }
};

/**
 * Fetches available appointments
 * @returns Promise with array of available appointments
 */
export const getAvailableAppointments = async (): Promise<AvailableAppointment[]> => {
  const apiClient = createApiClient();
  
  try {
    const response = await apiClient.get<ApiResponse<AvailableAppointment[]>>('/appointments/available');
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch available appointments');
    }
    
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Books an appointment
 * @param data The appointment booking data
 * @returns Promise with the booked appointment details
 */
export const bookAppointment = async (data: BookAppointmentData): Promise<Appointment> => {
  const apiClient = createApiClient();
  
  try {
    const response = await apiClient.post<ApiResponse<Appointment>>('/appointments/book', data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to book appointment');
    }
    
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancels an appointment
 * @param appointmentId ID of the appointment to cancel
 * @returns Promise with the cancelled appointment details
 */
export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  const apiClient = createApiClient();
  
  try {
    const response = await apiClient.post<ApiResponse<Appointment>>(`/appointments/${appointmentId}/cancel`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to cancel appointment');
    }
    
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reschedules an appointment
 * @param appointmentId ID of the appointment to reschedule
 * @param newData New appointment data
 * @returns Promise with the rescheduled appointment details
 */
export const rescheduleAppointment = async (
  appointmentId: string, 
  newData: RescheduleAppointmentData
): Promise<Appointment> => {
  const apiClient = createApiClient();
  
  try {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/reschedule`, 
      newData
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to reschedule appointment');
    }
    
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
}; 