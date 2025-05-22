import { vitabyteClient } from '@/integrations/vitabyte/client';
import { 
  Therapist, 
  Appointment, 
  TimeSlot 
} from './appointmentService';
import { format, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

/**
 * Vitabyte ePAD Service
 * 
 * This service adapts the Vitabyte ePAD API responses to match our application's expected format.
 */
export const vitabyteService = {
  /**
   * Get all therapists
   */
  getTherapists: async (): Promise<Therapist[]> => {
    try {
      const response = await vitabyteClient.getTherapists({
        isAvailable: true,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return [];
      }

      // Convert API therapists to application therapists
      return response.data.map(apiTherapist => ({
        id: apiTherapist.id,
        name: apiTherapist.name,
        specialty: apiTherapist.specialty,
        imageUrl: apiTherapist.imageUrl,
      }));
    } catch (error) {
      console.error('Error fetching therapists:', error);
      toast.error('Fehler beim Abrufen der Therapeuten');
      return [];
    }
  },

  /**
   * Get a therapist by ID
   */
  getTherapistById: async (id: string): Promise<Therapist | undefined> => {
    try {
      const response = await vitabyteClient.getTherapistById(id);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return undefined;
      }

      // Convert API therapist to application therapist
      return {
        id: response.data.id,
        name: response.data.name,
        specialty: response.data.specialty,
        imageUrl: response.data.imageUrl,
      };
    } catch (error) {
      console.error(`Error fetching therapist ${id}:`, error);
      toast.error('Fehler beim Abrufen der Therapeuteninformationen');
      return undefined;
    }
  },

  /**
   * Get all appointments for a patient
   */
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const response = await vitabyteClient.getAppointments({
        patientId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return [];
      }

      // Convert API appointments to application appointments
      return response.data.map(apiAppointment => ({
        id: apiAppointment.id,
        patientId: apiAppointment.patientId,
        therapistId: apiAppointment.therapistId,
        date: apiAppointment.date,
        duration: apiAppointment.duration,
        status: apiAppointment.status,
        type: apiAppointment.type,
        notes: apiAppointment.notes,
      }));
    } catch (error) {
      console.error(`Error fetching appointments for patient ${patientId}:`, error);
      toast.error('Fehler beim Abrufen der Termine');
      return [];
    }
  },

  /**
   * Get upcoming appointments for a patient
   */
  getUpcomingAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const now = new Date();
      const response = await vitabyteClient.getAppointments({
        patientId,
        startDate: now.toISOString(),
        status: 'scheduled',
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return [];
      }

      // Convert API appointments to application appointments
      return response.data.map(apiAppointment => ({
        id: apiAppointment.id,
        patientId: apiAppointment.patientId,
        therapistId: apiAppointment.therapistId,
        date: apiAppointment.date,
        duration: apiAppointment.duration,
        status: apiAppointment.status,
        type: apiAppointment.type,
        notes: apiAppointment.notes,
      }));
    } catch (error) {
      console.error(`Error fetching upcoming appointments for patient ${patientId}:`, error);
      toast.error('Fehler beim Abrufen der bevorstehenden Termine');
      return [];
    }
  },

  /**
   * Get past appointments for a patient
   */
  getPastAppointments: async (patientId: string): Promise<Appointment[]> => {
    try {
      const now = new Date();
      
      // Get completed and cancelled appointments
      const completedResponse = await vitabyteClient.getAppointments({
        patientId,
        endDate: now.toISOString(),
        status: 'completed',
      });

      const cancelledResponse = await vitabyteClient.getAppointments({
        patientId,
        status: 'cancelled',
      });

      const noShowResponse = await vitabyteClient.getAppointments({
        patientId,
        status: 'no-show',
      });

      if (completedResponse.error || cancelledResponse.error || noShowResponse.error) {
        throw new Error('Error fetching past appointments');
      }

      // Combine and sort by date (most recent first)
      const completedAppointments = completedResponse.data || [];
      const cancelledAppointments = cancelledResponse.data || [];
      const noShowAppointments = noShowResponse.data || [];

      const allPastAppointments = [
        ...completedAppointments,
        ...cancelledAppointments,
        ...noShowAppointments,
      ];

      // Sort by date (most recent first)
      allPastAppointments.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Convert API appointments to application appointments
      return allPastAppointments.map(apiAppointment => ({
        id: apiAppointment.id,
        patientId: apiAppointment.patientId,
        therapistId: apiAppointment.therapistId,
        date: apiAppointment.date,
        duration: apiAppointment.duration,
        status: apiAppointment.status,
        type: apiAppointment.type,
        notes: apiAppointment.notes,
      }));
    } catch (error) {
      console.error(`Error fetching past appointments for patient ${patientId}:`, error);
      toast.error('Fehler beim Abrufen der vergangenen Termine');
      return [];
    }
  },

  /**
   * Get available time slots for a therapist within a date range
   */
  getAvailableTimeSlots: async (therapistId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> => {
    try {
      const response = await vitabyteClient.getTimeSlots({
        therapistId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return [];
      }

      // Convert API time slots to application time slots
      return response.data
        .filter(slot => slot.available)
        .map(apiTimeSlot => ({
          therapistId: apiTimeSlot.therapistId,
          date: apiTimeSlot.date,
          duration: apiTimeSlot.duration,
          available: apiTimeSlot.available,
        }));
    } catch (error) {
      console.error(`Error fetching time slots for therapist ${therapistId}:`, error);
      toast.error('Fehler beim Abrufen der verfügbaren Termine');

      // Return empty array to avoid breaking the UI
      return [];
    }
  },

  /**
   * Book a new appointment
   */
  bookAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    try {
      const response = await vitabyteClient.bookAppointment({
        patientId: appointment.patientId,
        therapistId: appointment.therapistId,
        date: appointment.date,
        duration: appointment.duration,
        type: appointment.type,
        notes: appointment.notes,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        throw new Error('No data returned from API');
      }

      // Convert API appointment to application appointment
      return {
        id: response.data.id,
        patientId: response.data.patientId,
        therapistId: response.data.therapistId,
        date: response.data.date,
        duration: response.data.duration,
        status: response.data.status,
        type: response.data.type,
        notes: response.data.notes,
      };
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Fehler beim Buchen des Termins');
      throw error;
    }
  },

  /**
   * Cancel an appointment
   */
  cancelAppointment: async (appointmentId: string): Promise<boolean> => {
    try {
      const response = await vitabyteClient.cancelAppointment(appointmentId);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data || false;
    } catch (error) {
      console.error(`Error cancelling appointment ${appointmentId}:`, error);
      toast.error('Fehler beim Stornieren des Termins');
      return false;
    }
  },

  /**
   * Reschedule an appointment
   */
  rescheduleAppointment: async (appointmentId: string, newDate: string): Promise<Appointment | null> => {
    try {
      const response = await vitabyteClient.updateAppointment({
        id: appointmentId,
        date: newDate,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data) {
        return null;
      }

      // Convert API appointment to application appointment
      return {
        id: response.data.id,
        patientId: response.data.patientId,
        therapistId: response.data.therapistId,
        date: response.data.date,
        duration: response.data.duration,
        status: response.data.status,
        type: response.data.type,
        notes: response.data.notes,
      };
    } catch (error) {
      console.error(`Error rescheduling appointment ${appointmentId}:`, error);
      toast.error('Fehler beim Verschieben des Termins');
      return null;
    }
  },
}; 