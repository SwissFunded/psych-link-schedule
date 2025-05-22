import {
  VITABYTE_API_URL,
  VITABYTE_API_KEY,
  VITABYTE_API_SECRET,
  API_TIMEOUT,
  DEFAULT_HEADERS,
} from './config';

import {
  ApiResponse,
  ApiError,
  ApiTherapist,
  ApiAppointment,
  ApiTimeSlot,
  BookAppointmentRequest,
  UpdateAppointmentRequest,
  GetTimeSlotsParams,
  GetAppointmentsParams,
  GetTherapistsParams,
} from './types';

/**
 * Vitabyte ePAD API Client
 * 
 * This client handles all communication with the Vitabyte ePAD API.
 */
class VitabyteClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private controller: AbortController;

  constructor() {
    this.baseUrl = VITABYTE_API_URL;
    this.apiKey = VITABYTE_API_KEY;
    this.apiSecret = VITABYTE_API_SECRET;
    this.controller = new AbortController();
  }

  /**
   * Make an API request with proper error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Create default options with authentication
      const defaultOptions: RequestInit = {
        headers: {
          ...DEFAULT_HEADERS,
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret,
        },
        signal: this.controller.signal,
      };

      // Set up request timeout
      const timeoutId = setTimeout(() => {
        this.controller.abort();
        this.controller = new AbortController(); // Create new controller for future requests
      }, API_TIMEOUT);

      // Merge options
      const fetchOptions: RequestInit = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      // Make the request
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle API errors
      if (!response.ok) {
        const apiError: ApiError = {
          code: data.error?.code || `HTTP_${response.status}`,
          message: data.error?.message || 'Unknown error occurred',
          details: data.error?.details,
        };

        return { error: apiError };
      }

      return { data: data.data || data };
    } catch (error) {
      // Handle network errors or timeouts
      const apiError: ApiError = {
        code: error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      };

      return { error: apiError };
    }
  }

  /**
   * Get all providers (therapists) or filter by parameters
   */
  async getTherapists(params?: GetTherapistsParams): Promise<ApiResponse<ApiTherapist[]>> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    queryParams.append('endpoint', 'getProviders');
    
    if (params) {
      if (params.specialty) queryParams.append('specialty', params.specialty);
      if (params.isAvailable !== undefined) queryParams.append('isAvailable', String(params.isAvailable));
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));
    }

    // Using the proxy
    const queryString = queryParams.toString();
    return this.request<ApiTherapist[]>(`?${queryString}`);
  }

  /**
   * Get a therapist by ID
   */
  async getTherapistById(id: string): Promise<ApiResponse<ApiTherapist>> {
    // Using the proxy
    return this.request<ApiTherapist>(`?endpoint=getProvider&id=${id}`);
  }

  /**
   * Get all appointments for a patient, or filter by parameters
   */
  async getAppointments(params: GetAppointmentsParams): Promise<ApiResponse<ApiAppointment[]>> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    queryParams.append('endpoint', 'getAppointments');
    queryParams.append('customerId', params.patientId); // Use customerId instead of patientId
    if (params.startDate) queryParams.append('from', params.startDate); // Use 'from' instead of 'startDate'
    if (params.endDate) queryParams.append('to', params.endDate); // Use 'to' instead of 'endDate'
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString();
    return this.request<ApiAppointment[]>(`?${queryString}`);
  }

  /**
   * Get a specific appointment by ID
   */
  async getAppointmentById(id: string): Promise<ApiResponse<ApiAppointment>> {
    // Using the proxy
    return this.request<ApiAppointment>(`?endpoint=getAppointments&id=${id}`);
  }

  /**
   * Book a new appointment
   */
  async bookAppointment(appointment: BookAppointmentRequest): Promise<ApiResponse<ApiAppointment>> {
    return this.request<ApiAppointment>(`?endpoint=createAppointment`, {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  /**
   * Update an existing appointment (can be used for rescheduling)
   */
  async updateAppointment(appointment: UpdateAppointmentRequest): Promise<ApiResponse<ApiAppointment>> {
    return this.request<ApiAppointment>(`?endpoint=modifyAppointment`, {
      method: 'POST', // Using POST as per the API endpoints
      body: JSON.stringify(appointment),
    });
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<ApiResponse<boolean>> {
    // Using modifyAppointment to cancel
    return this.request<boolean>(`?endpoint=modifyAppointment`, {
      method: 'POST',
      body: JSON.stringify({
        id: appointmentId,
        status: 'cancelled'
      }),
    });
  }

  /**
   * Get available time slots for a therapist within a date range
   */
  async getTimeSlots(params: GetTimeSlotsParams): Promise<ApiResponse<ApiTimeSlot[]>> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    queryParams.append('endpoint', 'getSlots');
    queryParams.append('providerId', params.therapistId); // Use providerId instead of therapistId
    queryParams.append('from', params.startDate); // Use 'from' instead of 'startDate'
    queryParams.append('to', params.endDate); // Use 'to' instead of 'endDate'
    if (params.duration) queryParams.append('duration', String(params.duration));

    const queryString = queryParams.toString();
    return this.request<ApiTimeSlot[]>(`?${queryString}`);
  }
}

// Export a singleton instance
export const vitabyteClient = new VitabyteClient();

// Also export the class for testing or special use cases
export default VitabyteClient; 