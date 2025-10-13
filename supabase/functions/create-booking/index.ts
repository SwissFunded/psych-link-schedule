import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  therapistId: string
  startTime: string // ISO 8601
  durationMinutes: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  appointmentType: 'erstgespraech' | 'folgetermin' | 'telefontermin'
  appointmentMode: 'in_person' | 'video' | 'phone'
  notes?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const bookingData: BookingRequest = await req.json()
    
    console.log('📅 Creating booking:', {
      therapist: bookingData.therapistId,
      time: bookingData.startTime,
      patient: `${bookingData.firstName} ${bookingData.lastName}`,
      appointmentType: bookingData.appointmentType,
      appointmentMode: bookingData.appointmentMode
    })

    // Validate required fields
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.email) {
      console.error('❌ Missing required fields:', { firstName: !!bookingData.firstName, lastName: !!bookingData.lastName, email: !!bookingData.email })
      throw new Error('Vorname, Nachname und Email sind erforderlich')
    }

    // Validate appointment type
    if (!['erstgespraech', 'folgetermin', 'telefontermin'].includes(bookingData.appointmentType)) {
      console.error('❌ Invalid appointment type:', bookingData.appointmentType)
      throw new Error(`Ungültiger Termintyp: ${bookingData.appointmentType}. Erlaubt sind: erstgespraech, folgetermin, telefontermin`)
    }

    // Calculate end time
    const startTime = new Date(bookingData.startTime)
    const endTime = new Date(startTime.getTime() + bookingData.durationMinutes * 60000)

    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert into database (exclusion constraint will prevent overlaps)
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        therapist_id: bookingData.therapistId,
        calendar_id: 136, // Antoine's calendar
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: bookingData.durationMinutes,
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone || null,
        appointment_type: bookingData.appointmentType,
        appointment_mode: bookingData.appointmentMode,
        notes: bookingData.notes || null,
        status: 'scheduled',
        source: 'web'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Database insert error:', insertError)
      
      // Handle specific database errors
      if (insertError.code === '23P01') {
        // Exclusion constraint violation (overlapping booking)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Dieser Zeitslot ist bereits gebucht. Bitte wählen Sie einen anderen Termin.'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409 // Conflict
          }
        )
      }
      
      if (insertError.code === '23514') {
        // Check constraint violation (invalid appointment_type or appointment_mode)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ungültige Termindaten. Bitte überprüfen Sie Ihre Eingabe.',
            details: insertError.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      
      // Generic database error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Fehler beim Speichern der Buchung',
          details: insertError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('✅ Booking created in DB:', booking.id)

    // Return success without Vitabyte integration
    // Bookings are stored in database only and can be managed via Admin Panel
    return new Response(
      JSON.stringify({
        success: true,
        booking: booking
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Booking error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Fehler beim Erstellen der Buchung'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

