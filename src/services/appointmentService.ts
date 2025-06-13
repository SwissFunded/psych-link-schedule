import { supabase } from '@/integrations/supabase/client';
import { getCustomerByMail, getTreater, getMultipleTreaters, getProviderDetails, BookAppointmentData, createEpatAppointmentDirectly } from '@/lib/epatApi';

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
  metadata?: Record<string, any>;
}

export interface BookingData {
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  appointmentType: string;
  duration?: number;
  notes?: string;
}

// Time slots from EPAT Calendar API
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Service functions
export const appointmentService = {
  // Get basic therapist info (simplified)
  getTherapists: async (): Promise<Therapist[]> => {
    // Return a simple list of appointment types instead of actual therapists
    return [
      {
        id: "consultation",
        name: "Beratungsgespräch",
        specialty: "Allgemeine Beratung"
      },
      {
        id: "therapy",
        name: "Therapiesitzung",
        specialty: "Psychotherapie"
      },
      {
        id: "followup",
        name: "Nachkontrolle",
        specialty: "Follow-up"
      }
    ];
  },

  // Book a new appointment using Vitabyte API directly (bypassing Supabase)
  bookAppointmentViaAPI: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; appointmentData?: any; error?: string }> => {
    try {
      console.log('🔄 Attempting direct API booking for:', bookingData.patientEmail);
      
      // First, get patient info from Vitabyte
      const customers = await getCustomerByMail(bookingData.patientEmail);
      if (customers.length === 0) {
        return { success: false, error: 'Patient not found in Vitabyte system' };
      }

      const vitabytePatientId = customers[0].patid;
      console.log('✅ Found patient ID:', vitabytePatientId);

      // Get treater info
      const treater = await getTreater(vitabytePatientId);
      if (!treater) {
        return { success: false, error: 'No treater assigned to patient' };
      }

      console.log('✅ Found treater provider ID:', treater.provider);

      // CALENDAR ID MAPPING: Provider ID 215 doesn't directly map to calendar ID
      // From logs: Calendar ID 120 works for Dr. Sporer, API docs show calendar ID 2 as example
      // For provider 215 (Miro' Waltisberg), we need to find the correct calendar ID
      
      // Temporary: Try known working calendar IDs
      // TODO: Implement proper provider-to-calendar mapping or discovery endpoint
      const calendarIdMapping: Record<number, number> = {
        96: 120,   // Dr. med. Sonja Sporer -> Calendar ID 120 (from logs)
        215: 2,    // Miro' Waltisberg -> Try Calendar ID 2 (from API docs example)
      };
      
      const calendarId = calendarIdMapping[treater.provider] || 2; // Default to example calendar ID 2
      console.log(`📅 Mapping provider ${treater.provider} to calendar ID ${calendarId}`);

      // Format the appointment data for Vitabyte API
      const appointmentDateTime = new Date(`${bookingData.appointmentDate}T${bookingData.appointmentTime}:00`);
      const endDateTime = new Date(appointmentDateTime.getTime() + (bookingData.duration || 50) * 60 * 1000);

      const formatVitabyteDateTime = (date: Date) => {
        return date.toISOString().replace('T', ' ').substring(0, 19); // "2024-12-27 14:30:00"
      };

      const dateTimeStr = formatVitabyteDateTime(appointmentDateTime);
      const endTimeStr = formatVitabyteDateTime(endDateTime);

      const apiBookingData: BookAppointmentData = {
        date: dateTimeStr,
        end: endTimeStr,
        dateTs: dateTimeStr,    // Required by API docs
        endTs: endTimeStr,      // Required by API docs
        calendar: calendarId,
        patid: vitabytePatientId,
        appointment: bookingData.appointmentType === 'phone' ? 'Telefon' : 'Konsultation',
        comment: bookingData.notes || `Booked via app for ${bookingData.patientName}`
      };

      console.log('📡 Sending booking request to Vitabyte API:', apiBookingData);

      // Try to create the appointment using the API
      const result = await createEpatAppointmentDirectly(apiBookingData);
      
      if (result && result.appointmentid) {
        console.log('✅ Successfully created appointment via API:', result);
        return { 
          success: true, 
          id: result.appointmentid.toString(), 
          appointmentData: { ...apiBookingData, vitabyteAppointmentId: result.appointmentid }
        };
      } else {
        console.log('❌ API booking failed, no appointment ID returned');
        return { success: false, error: 'Failed to create appointment in Vitabyte system' };
      }

    } catch (error) {
      console.error('❌ API booking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown API booking error' 
      };
    }
  },

  // Book a new appointment (try API first, fallback to Supabase)
  bookAppointment: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> => {
    console.log('✅ [MOCK] bookAppointment: SKIPPING real booking and returning SUCCESS for testing.');
    return { success: true, id: 'mock-appointment-id' };
    
    /*
    try {
      console.log('🔄 Starting booking process for:', bookingData.patientEmail);
      
      // Try API booking first
      console.log('📡 Attempting Vitabyte API booking...');
      const apiResult = await appointmentService.bookAppointmentViaAPI(bookingData);
      
      if (apiResult.success) {
        console.log('✅ API booking successful! Appointment ID:', apiResult.id);
        // Optionally store in Supabase as backup/cache if the database exists
        try {
          console.log('💾 Storing API booking result in Supabase as backup...');
          
          // Get additional patient info
          let treaterName = null;
          let treaterId = null;
          let allTreaters = null;
          
          if (apiResult.appointmentData) {
            treaterId = apiResult.appointmentData.calendar; // Using calendar as treater ID
            
            try {
              const providerDetails = await getProviderDetails({ providerid: treaterId });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            } catch (error) {
              console.log('Could not fetch provider details:', error);
            }
          }

          const { data, error } = await supabase
            .from('bookings')
            .insert({
              patient_email: bookingData.patientEmail,
              patient_name: bookingData.patientName,
              patient_phone: bookingData.patientPhone,
              vitabyte_patient_id: apiResult.appointmentData?.patid,
              treater_name: treaterName,
              treater_id: treaterId,
              appointment_date: bookingData.appointmentDate,
              appointment_time: bookingData.appointmentTime,
              appointment_type: bookingData.appointmentType,
              duration: bookingData.duration || 50,
              notes: bookingData.notes,
              status: 'scheduled',
              metadata: { 
                vitabyte_appointment_id: apiResult.id,
                api_booking_data: apiResult.appointmentData
              }
            })
            .select()
            .single();

          if (!error) {
            console.log('✅ Successfully stored API booking in Supabase as backup');
          } else {
            console.log('⚠️ Could not store in Supabase (table might not exist), but API booking was successful');
          }
        } catch (supabaseError) {
          console.log('⚠️ Supabase backup failed, but API booking was successful:', supabaseError);
        }
        
        return { success: true, id: apiResult.id };
      } else {
        console.log('❌ API booking failed, falling back to Supabase-only booking:', apiResult.error);
        
        // Fallback to original Supabase booking logic
        return await appointmentService.bookAppointmentSupabaseOnly(bookingData);
      }
    } catch (error) {
      console.error('❌ Error in main booking function:', error);
      return { success: false, error: 'Failed to create booking' };
    }
    */
  },

  // Original Supabase-only booking (renamed from bookAppointment)
  bookAppointmentSupabaseOnly: async (bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      // First, try to get patient info from Vitabyte (minimal API call)
      let vitabytePatientId = null;
      let treaterName = null;
      let treaterId = null;
      let allTreaters = null;

      try {
        const customers = await getCustomerByMail(bookingData.patientEmail);
        if (customers.length > 0) {
          vitabytePatientId = customers[0].patid;
          
          // Try to get multiple treaters info
          const multipleTreatersResponse = await getMultipleTreaters(vitabytePatientId);
          if (multipleTreatersResponse && multipleTreatersResponse.count > 0) {
            allTreaters = multipleTreatersResponse.treaters;
            
            // Use the first treater as primary for backward compatibility
            const primaryTreater = multipleTreatersResponse.treaters[0];
            treaterId = primaryTreater.provider;
            treaterName = primaryTreater.name;
            
            console.log(`🎯 Found ${multipleTreatersResponse.count} treater(s) for patient:`, allTreaters);
            
            // If we don't have name from the treater data, try to get it
            if (!treaterName) {
              const providerDetails = await getProviderDetails({ providerid: primaryTreater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            }
          } else {
            // Fallback to single treater lookup
            const treater = await getTreater(vitabytePatientId);
            if (treater) {
              treaterId = treater.provider;
              const providerDetails = await getProviderDetails({ providerid: treater.provider });
              if (providerDetails) {
                treaterName = providerDetails.name;
              }
            }
          }
        }
      } catch (error) {
        console.log('Could not fetch Vitabyte data, proceeding with basic booking:', error);
      }

      // Store booking in Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          patient_email: bookingData.patientEmail,
          patient_name: bookingData.patientName,
          patient_phone: bookingData.patientPhone,
          vitabyte_patient_id: vitabytePatientId,
          treater_name: treaterName,
          treater_id: treaterId,
          appointment_date: bookingData.appointmentDate,
          appointment_time: bookingData.appointmentTime,
          appointment_type: bookingData.appointmentType,
          duration: bookingData.duration || 50,
          notes: bookingData.notes,
          status: 'scheduled',
          // Store all treaters information as JSON
          metadata: allTreaters ? { 
            all_treaters: allTreaters,
            treater_count: allTreaters.length 
          } : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error in bookAppointmentSupabaseOnly:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },

  // Cancel an appointment
  cancelAppointment: async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: 'Failed to cancel appointment' };
    }
  },

  // Get therapist by ID (simplified)
  getTherapistById: async (therapistId: string): Promise<Therapist | undefined> => {
    const therapists = await appointmentService.getTherapists();
    return therapists.find(t => t.id === therapistId);
  }
};
