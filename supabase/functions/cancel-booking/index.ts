import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelRequest {
  bookingId: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId }: CancelRequest = await req.json()
    
    console.log('🚫 Canceling booking:', bookingId)

    if (!bookingId) {
      throw new Error('Booking ID ist erforderlich')
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Get the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      console.error('❌ Booking not found:', fetchError)
      throw new Error('Buchung nicht gefunden')
    }

    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Buchung war bereits storniert'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Step 2: Cancel in Vitabyte (if we have an appointment ID)
    if (booking.vitabyte_appointment_id) {
      const vitabyteUsername = Deno.env.get('VITABYTE_USERNAME') || Deno.env.get('VITE_VITABYTE_USERNAME')
      const vitabytePassword = Deno.env.get('VITABYTE_PASSWORD') || Deno.env.get('VITE_VITABYTE_PASSWORD')
      
      if (vitabyteUsername && vitabytePassword) {
        const authToken = btoa(`${vitabyteUsername}:${vitabytePassword}`)
        
        try {
          console.log(`📤 Canceling in Vitabyte: ${booking.vitabyte_appointment_id}`)
          
          const vitabyteResponse = await fetch('https://psych.vitabyte.ch/v1/agenda/modifyAppointment', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              appointmentId: booking.vitabyte_appointment_id,
              status: 'cancelled'
            })
          })

          const vitabyteData = await vitabyteResponse.json()
          console.log('📥 Vitabyte cancel response:', vitabyteData)

          if (vitabyteData.status !== true && vitabyteData.status !== 'ok') {
            console.warn('⚠️ Vitabyte cancellation failed:', vitabyteData.msg)
            // Continue anyway - we'll cancel in our DB
          } else {
            console.log('✅ Vitabyte appointment cancelled')
          }
        } catch (vitabyteError: any) {
          console.error('❌ Vitabyte API error:', vitabyteError)
          // Continue anyway - we'll cancel in our DB
        }
      }
    }

    // Step 3: Update booking status in DB
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error('Fehler beim Aktualisieren der Buchung')
    }

    console.log('✅ Booking cancelled:', updatedBooking.id)

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Cancel error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Fehler beim Stornieren der Buchung'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

