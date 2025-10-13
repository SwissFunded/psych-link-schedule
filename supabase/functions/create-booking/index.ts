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
      patient: `${bookingData.firstName} ${bookingData.lastName}`
    })

    // Validate required fields
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.email) {
      throw new Error('Vorname, Nachname und Email sind erforderlich')
    }

    // Calculate end time
    const startTime = new Date(bookingData.startTime)
    const endTime = new Date(startTime.getTime() + bookingData.durationMinutes * 60000)

    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Check for existing overlapping bookings
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, first_name, last_name')
      .eq('therapist_id', bookingData.therapistId)
      .eq('status', 'scheduled')
      .overlaps('slot', `[${startTime.toISOString()},${endTime.toISOString()})`)

    if (checkError) {
      console.error('❌ Error checking for conflicts:', checkError)
      throw new Error('Fehler beim Prüfen der Verfügbarkeit')
    }

    if (existingBookings && existingBookings.length > 0) {
      console.warn('⚠️ Booking conflict detected:', existingBookings)
      throw new Error('Dieser Zeitslot ist bereits gebucht. Bitte wählen Sie einen anderen Termin.')
    }

    // Step 2: Insert into database (this will also enforce the exclusion constraint)
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
      
      // Check if it's a conflict error (exclusion constraint)
      if (insertError.code === '23P01') {
        throw new Error('Dieser Zeitslot wurde gerade von einem anderen Patienten gebucht. Bitte wählen Sie einen anderen Termin.')
      }
      
      throw new Error('Fehler beim Speichern der Buchung')
    }

    console.log('✅ Booking created in DB:', booking.id)

    // Step 3: Create appointment in Vitabyte
    const vitabyteUsername = Deno.env.get('VITABYTE_USERNAME') || Deno.env.get('VITE_VITABYTE_USERNAME')
    const vitabytePassword = Deno.env.get('VITABYTE_PASSWORD') || Deno.env.get('VITE_VITABYTE_PASSWORD')
    
    if (!vitabyteUsername || !vitabytePassword) {
      console.error('❌ Vitabyte credentials not found')
      
      // Update booking status to failed
      await supabase
        .from('bookings')
        .update({ status: 'failed' })
        .eq('id', booking.id)
      
      throw new Error('Vitabyte Konfigurationsfehler. Bitte kontaktieren Sie den Support.')
    }

    const authToken = btoa(`${vitabyteUsername}:${vitabytePassword}`)
    
    // Format dates for Vitabyte: "YYYY-MM-DD HH:MM:SS"
    const formatForVitabyte = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    const vitabytePayload = {
      date: formatForVitabyte(startTime),
      end: formatForVitabyte(endTime),
      dateTs: formatForVitabyte(startTime),
      endTs: formatForVitabyte(endTime),
      calendar: 136,
      patid: 0, // No patient ID needed
      appointment: bookingData.notes || bookingData.appointmentType,
      comment: `${bookingData.firstName} ${bookingData.lastName} (${bookingData.email}) - Gebucht via psychcentral.app`
    }

    console.log('📤 Sending to Vitabyte API:', vitabytePayload)

    try {
      const vitabyteResponse = await fetch('https://psych.vitabyte.ch/v1/agenda/createAppointment', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(vitabytePayload)
      })

      const vitabyteData = await vitabyteResponse.json()
      console.log('📥 Vitabyte response:', vitabyteData)

      if (vitabyteData.status === true || vitabyteData.status === 'ok') {
        let appointmentId: number | undefined

        if (Array.isArray(vitabyteData.result) && vitabyteData.result.length > 0) {
          appointmentId = vitabyteData.result[0].appointmentid
        } else if (typeof vitabyteData.result === 'object' && vitabyteData.result.appointmentid) {
          appointmentId = vitabyteData.result.appointmentid
        }

        if (appointmentId) {
          // Update booking with Vitabyte appointment ID
          await supabase
            .from('bookings')
            .update({ vitabyte_appointment_id: appointmentId })
            .eq('id', booking.id)
          
          console.log(`✅ Vitabyte appointment created! ID: ${appointmentId}`)
          
          return new Response(
            JSON.stringify({
              success: true,
              booking: {
                ...booking,
                vitabyte_appointment_id: appointmentId
              }
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }
      }

      // Vitabyte failed but we have DB booking
      console.warn('⚠️ Vitabyte booking failed, but DB booking exists')
      await supabase
        .from('bookings')
        .update({ status: 'failed' })
        .eq('id', booking.id)
      
      throw new Error(`Vitabyte Fehler: ${vitabyteData.msg || 'Unbekannter Fehler'}`)
      
    } catch (vitabyteError: any) {
      console.error('❌ Vitabyte API error:', vitabyteError)
      
      // Mark booking as failed
      await supabase
        .from('bookings')
        .update({ status: 'failed' })
        .eq('id', booking.id)
      
      throw new Error('Fehler beim Erstellen des Termins in Vitabyte. Der Termin wurde lokal gespeichert.')
    }

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

