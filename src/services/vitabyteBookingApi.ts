// Vitabyte Booking API Service
// Handles direct communication with Vitabyte's REST API for appointment management
// Based on previous implementation from psych-link-schedule repository

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

export interface VitabyteApiResponse<T> {
  status: boolean | string; // Can be true/false or "ok"
  msg?: string;
  result: T;
  servertime?: string;
}

export interface Customer {
  patid: number;
  firstname: string;
  lastname: string;
  gender: string;
  dob: string; // "YYYY-MM-DD"
  title?: string;
  street?: string;
  zip?: string;
  city?: string;
  mobile?: string;
  mail: string;
  ahv?: string;
  deleted: number; // 0 = active, 1 = deleted
}

export interface CreateAppointmentRequest {
  date: string;        // "YYYY-MM-DD HH:MM:SS"
  end: string;         // "YYYY-MM-DD HH:MM:SS"
  dateTs: string;      // Same as date (required per API docs)
  endTs: string;       // Same as end (required per API docs)
  calendar: number;    // Calendar ID (120 for Antoine)
  patid: number;       // Patient ID
  appointment: string; // Appointment type/reason
  comment?: string;    // Optional notes
  state?: string;      // Optional appointment state
}

export interface AppointmentResponse {
  appointmentid: number;
}

export interface VitabyteAppointment {
  id: number;
  date: string;
  duration: number;
  patid: number;
  provider: number;
  appointment: string;
  comment?: string;
  status: string;
}

// ============================================================================
// API Client Setup
// ============================================================================

class VitabyteBookingApi {
  private systemClient: AxiosInstance;
  private agendaClient: AxiosInstance;
  private credentials: { username: string; password: string };

  constructor() {
    // Credentials from environment or fallback to documented values
    this.credentials = {
      username: import.meta.env.VITE_VITABYTE_USERNAME || 'Miro',
      password: import.meta.env.VITE_VITABYTE_PASSWORD || '#dCdGV;f8je,1Tj34nxo'
    };

    const authToken = btoa(`${this.credentials.username}:${this.credentials.password}`);

    // System API client (for patient lookup, providers, services)
    this.systemClient = axios.create({
      baseURL: '/api/vitabyte-proxy',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Type': 'system' // Custom header to tell proxy which API to use
      },
      timeout: 15000
    });

    // Agenda API client (for appointment CRUD operations)
    this.agendaClient = axios.create({
      baseURL: '/api/vitabyte-proxy',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Type': 'agenda' // Custom header to tell proxy which API to use
      },
      timeout: 15000
    });

    console.log('🔧 Vitabyte API clients initialized');
  }

  // ============================================================================
  // System API Methods
  // ============================================================================

  /**
   * Verify API credentials are working
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      console.log('🔍 Verifying Vitabyte API credentials...');
      
      const response = await this.systemClient.post('/verify');
      const data = response.data as VitabyteApiResponse<any>;

      const isValid = response.status === 200 && 
                     (data.status === true || data.status === 'ok');

      console.log(`✅ Credentials ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      return false;
    }
  }

  /**
   * Find customer/patient by email address
   */
  async getCustomerByEmail(email: string): Promise<Customer[]> {
    try {
      console.log('📧 Looking up customer by email:', email);
      
      const response = await this.systemClient.post('/getCustomerByMail', {
        mail: email
      });

      const data = response.data as VitabyteApiResponse<Customer[]>;

      if ((data.status === true || data.status === 'ok') && Array.isArray(data.result)) {
        console.log(`✅ Found ${data.result.length} customer(s)`);
        return data.result;
      }

      console.log('⚠️ No customers found');
      return [];
    } catch (error) {
      console.error('❌ Customer lookup failed:', error);
      throw new Error('Fehler beim Suchen des Patienten. Bitte versuchen Sie es erneut.');
    }
  }

  // ============================================================================
  // Agenda API Methods
  // ============================================================================

  /**
   * Create a new appointment in Vitabyte
   */
  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentResponse> {
    try {
      console.log('📅 Creating appointment in Vitabyte:', data);
      
      const response = await this.agendaClient.post('/createAppointment', data);
      const responseData = response.data as VitabyteApiResponse<AppointmentResponse[] | AppointmentResponse>;

      console.log('📥 Create appointment response:', responseData);

      // Handle both array and direct object responses
      let appointmentId: number | undefined;

      if ((responseData.status === true || responseData.status === 'ok')) {
        if (Array.isArray(responseData.result) && responseData.result.length > 0) {
          appointmentId = responseData.result[0].appointmentid;
        } else if (typeof responseData.result === 'object' && 'appointmentid' in responseData.result) {
          appointmentId = (responseData.result as AppointmentResponse).appointmentid;
        }
      }

      if (appointmentId) {
        console.log(`✅ Appointment created successfully! ID: ${appointmentId}`);
        return { appointmentid: appointmentId };
      }

      throw new Error(responseData.msg || 'Failed to create appointment');
    } catch (error: any) {
      console.error('❌ Appointment creation failed:', error);
      
      // User-friendly error messages
      if (error.response?.status === 401) {
        throw new Error('Authentifizierungsfehler. Bitte kontaktieren Sie den Support.');
      } else if (error.response?.status === 400) {
        throw new Error('Ungültige Termindaten. Bitte überprüfen Sie Ihre Eingabe.');
      } else if (error.message) {
        throw new Error(`Fehler beim Erstellen des Termins: ${error.message}`);
      } else {
        throw new Error('Fehler beim Erstellen des Termins. Bitte versuchen Sie es erneut.');
      }
    }
  }

  /**
   * Get all appointments for a patient
   */
  async getPatientAppointments(patid: number): Promise<VitabyteAppointment[]> {
    try {
      console.log('📋 Fetching appointments for patient:', patid);
      
      const response = await this.agendaClient.post('/getAppointments', { patid });
      const data = response.data as VitabyteApiResponse<VitabyteAppointment[]>;

      if ((data.status === true || data.status === 'ok') && Array.isArray(data.result)) {
        console.log(`✅ Found ${data.result.length} appointment(s)`);
        return data.result;
      }

      console.log('⚠️ No appointments found');
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch appointments:', error);
      return [];
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: number): Promise<boolean> {
    try {
      console.log('🚫 Cancelling appointment:', appointmentId);
      
      const response = await this.agendaClient.post('/modifyAppointment', {
        appointmentId,
        status: 'cancelled'
      });

      const data = response.data as VitabyteApiResponse<any>;
      const success = data.status === true || data.status === 'ok';

      if (success) {
        console.log('✅ Appointment cancelled successfully');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to cancel appointment:', error);
      throw new Error('Fehler beim Stornieren des Termins. Bitte versuchen Sie es erneut.');
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const vitabyteBookingApi = new VitabyteBookingApi();

