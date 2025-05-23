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
  therapistId?: string;
  status: 'scheduled' | 'cancelled' | 'completed' | 'no-show';
  type?: 'in-person' | 'video' | 'phone';
  notes?: string;
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

// Additional types for therapists and patient appointments
export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
}

export interface GetAppointmentsParams {
  patientId: string;
  startDate?: string;
  endDate?: string;
  status?: 'scheduled' | 'cancelled' | 'completed';
}

// Create Axios instance with default configuration using Basic Auth
const createApiClient = (appName: 'system' | 'agenda' = 'system') => {
  const username = import.meta.env.VITE_EPAT_USERNAME;
  const password = import.meta.env.VITE_EPAT_PASSWORD;
  const apiUrl = import.meta.env.VITE_EPAT_API_URL || 'https://psych.vitabyte.ch/v1';
  
  if (!username || !password) {
    console.error('API credentials are not defined in environment variables');
    throw new Error('API credentials are missing');
  }
  
  // Create Base64 encoded credentials
  const token = btoa(`${username}:${password}`);
  
  // Use proxy path in development mode to avoid CORS issues
  const baseURL = import.meta.env.DEV ? `/api/${appName}` : `${apiUrl}/${appName}`;
  
  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Basic ${token}`,
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
 * Verifies if the API credentials are valid by calling the verify endpoint
 * @returns Promise with boolean indicating if the credentials are valid
 */
export const verifyApiKey = async (): Promise<boolean> => {
  try {
    const apiClient = createApiClient('system');
    
    // Log the request details for debugging
    console.log('🔍 API Client config:', {
      baseURL: apiClient.defaults.baseURL,
      headers: {
        ...apiClient.defaults.headers,
        Authorization: (apiClient.defaults.headers as any)?.Authorization ? '[REDACTED]' : 'Missing'
      }
    });
    
    console.log('📡 Making request to /verify...');
    const response = await apiClient.post('/verify');
    
    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    const isValid = response.status === 200 && (response.data as any)?.status === true;
    console.log('✅ API verification result:', isValid);
    
    return isValid;
  } catch (error) {
    // For this specific function, we return false instead of throwing
    // since it's used to check authentication
    console.error('❌ API verification error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
      data: (error as any)?.response?.data,
      config: {
        url: (error as any)?.config?.url,
        method: (error as any)?.config?.method,
        baseURL: (error as any)?.config?.baseURL
      }
    });
    return false;
  }
};

/**
 * Fetches available time slots
 * @returns Promise with array of available appointments
 */
export const getAvailableAppointments = async (): Promise<AvailableAppointment[]> => {
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/getSlots');
    
    // Convert response to our format
    const slots = Array.isArray(response.data) ? response.data : [];
    return slots.map((slot: any) => ({
      id: slot.id || `slot-${slot.start}`,
      dateTime: slot.start || slot.dateTime,
      duration: slot.duration || 50,
      isAvailable: true
    }));
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
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/createAppointment', data);
    
    // Convert response to our format
    const appointmentData = response.data as any;
    return {
      id: appointmentData?.id || `apt-${Date.now()}`,
      dateTime: appointmentData?.dateTime || appointmentData?.start,
      duration: appointmentData?.duration || 50,
      patientId: data.patientId,
      therapistId: appointmentData?.therapistId,
      status: 'scheduled',
      type: 'in-person',
      notes: appointmentData?.notes,
      metadata: data.metadata
    };
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
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/modifyAppointment', {
      appointmentId,
      status: 'cancelled'
    });
    
    const appointmentData = response.data as any;
    return {
      id: appointmentData?.id || appointmentId,
      dateTime: appointmentData?.dateTime || appointmentData?.start,
      duration: appointmentData?.duration || 50,
      patientId: appointmentData?.patientId || '',
      therapistId: appointmentData?.therapistId,
      status: 'cancelled',
      type: appointmentData?.type || 'in-person',
      notes: appointmentData?.notes,
      metadata: appointmentData?.metadata
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets a specific appointment by ID
 * @param appointmentId ID of the appointment to fetch
 * @returns Promise with the appointment details
 */
export const getAppointmentById = async (appointmentId: string): Promise<Appointment> => {
  const apiClient = createApiClient('agenda');
  
  try {
    const response = await apiClient.post('/getAppointment', { appointmentId });
    
    const appointmentData = response.data as any;
    return {
      id: appointmentData?.id || appointmentId,
      dateTime: appointmentData?.dateTime || appointmentData?.start,
      duration: appointmentData?.duration || 50,
      patientId: appointmentData?.patientId || appointmentData?.customerId || '',
      therapistId: appointmentData?.therapistId || appointmentData?.providerId,
      status: appointmentData?.status || 'scheduled',
      type: appointmentData?.type || 'in-person',
      notes: appointmentData?.notes,
      metadata: appointmentData?.metadata
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reschedules an appointment by cancelling the old one and booking a new one
 * @param appointmentId ID of the appointment to reschedule
 * @param newData New appointment data
 * @returns Promise with the rescheduled appointment details
 */
export const rescheduleAppointment = async (
  appointmentId: string, 
  newData: RescheduleAppointmentData
): Promise<Appointment> => {
  try {
    // First get the original appointment to extract the patientId
    const originalAppointment = await getAppointmentById(appointmentId);
    
    // Cancel the existing appointment
    await cancelAppointment(appointmentId);
    
    // Then book the new appointment
    const bookingData: BookAppointmentData = {
      appointmentId: newData.newAppointmentId,
      patientId: originalAppointment.patientId,
      metadata: newData.metadata,
    };
    
    // Book the new appointment
    return await bookAppointment(bookingData);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets all therapists
 * @returns Promise with array of therapists
 */
export const getTherapists = async (): Promise<Therapist[]> => {
  const apiClient = createApiClient('system');
  
  try {
    const response = await apiClient.post('/getProviders');
    const data = response.data as any;
    
    // Handle the working system API response format
    if (data?.status === 'ok' && Array.isArray(data?.result)) {
      return data.result.map((provider: any) => ({
        id: provider.userid?.toString() || provider.id,
        name: `${provider.title || ''} ${provider.givenname || ''} ${provider.familyname || ''}`.trim(),
        specialty: provider.specialization || 'General Practice',
        imageUrl: provider.imageUrl || provider.avatar
      }));
    }
    
    // Fallback to old format if needed
    const providers = Array.isArray(data) ? data : [];
    return providers.map((provider: any) => ({
      id: provider.id || provider.providerId,
      name: provider.name || `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialty || provider.specialization || 'General Practice',
      imageUrl: provider.imageUrl || provider.avatar
    }));
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Gets a therapist by ID
 * @param therapistId ID of the therapist to fetch
 * @returns Promise with the therapist details
 */
export const getTherapistById = async (therapistId: string): Promise<Therapist | undefined> => {
  const apiClient = createApiClient('system');
  
  try {
    const response = await apiClient.post('/getProvider', { providerId: therapistId });
    
    const provider = response.data as any;
    if (!provider) {
      return undefined;
    }
    
    return {
      id: provider.userid?.toString() || provider.id || provider.providerId,
      name: `${provider.title || ''} ${provider.givenname || ''} ${provider.familyname || ''}`.trim() || provider.name || `${provider.firstName} ${provider.lastName}`,
      specialty: provider.specialization || provider.specialty || 'General Practice',
      imageUrl: provider.imageUrl || provider.avatar
    };
  } catch (error) {
    // For this function, return undefined on error rather than throwing
    // to match the expected behavior from appointmentService
    console.error('Error fetching therapist:', (error as Error)?.message);
    return undefined;
  }
};

/**
 * Gets appointments for a specific patient
 * @param params Parameters for filtering appointments
 * @returns Promise with array of appointments
 */
export const getPatientAppointments = async (params: GetAppointmentsParams): Promise<Appointment[]> => {
  const apiClient = createApiClient('agenda');
  
  try {
    const requestData: any = {
      customerId: params.patientId
    };
    
    if (params.startDate) {
      requestData.startDate = params.startDate;
    }
    if (params.endDate) {
      requestData.endDate = params.endDate;
    }
    if (params.status) {
      requestData.status = params.status;
    }
    
    const response = await apiClient.post('/getAppointments', requestData);
    
    const appointments = Array.isArray(response.data) ? response.data : [];
    return appointments.map((appointment: any) => ({
      id: appointment.id || appointment.appointmentId,
      dateTime: appointment.dateTime || appointment.start,
      duration: appointment.duration || 50,
      patientId: params.patientId,
      therapistId: appointment.therapistId || appointment.providerId,
      status: appointment.status || 'scheduled',
      type: appointment.type || 'in-person',
      notes: appointment.notes,
      metadata: appointment.metadata
    }));
  } catch (error) {
    return handleApiError(error);
  }
}; 