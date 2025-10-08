import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Whitelist of allowed calendar configurations
const CALENDAR_CONFIGS: Record<string, Record<string, string>> = {
  't1': {
    'appointment': '966541-462631-f1b699-977a3d', // TEST calendar (temporary)
    'epat': '966541-462631-f1b699-977a3d' // TEST calendar (temporary)
  }
}

// In-memory cache with timestamps
const cache: Record<string, { data: string, timestamp: number }> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-requested-with',
      },
    })
  }

  try {
    const { therapistId, feedType } = await req.json()

    // Validate inputs
    if (!therapistId || !feedType) {
      return new Response(
        JSON.stringify({ error: 'Missing therapistId or feedType' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    if (!CALENDAR_CONFIGS[therapistId] || !CALENDAR_CONFIGS[therapistId][feedType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid therapistId or feedType' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const cacheKey = `${therapistId}-${feedType}`

    // Check cache
    const cached = cache[cacheKey]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Cache HIT] ${cacheKey}`)
      return new Response(
        JSON.stringify({
          icsData: cached.data,
          cached: true,
          timestamp: cached.timestamp,
          feedType,
          therapistId
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Fetch from Vitabyte API
    const cid = CALENDAR_CONFIGS[therapistId][feedType]
    const url = `https://api.vitabyte.ch/calendar/?action=getics&cid=${cid}&type=.ics`
    
    console.log(`[Fetch] ${cacheKey} from ${url}`)

    // Retry logic with exponential backoff
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/calendar',
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const icsData = await response.text()
        
        // Validate ICS data
        if (!icsData.includes('BEGIN:VCALENDAR')) {
          throw new Error('Invalid ICS data received')
        }

        // Update cache
        cache[cacheKey] = {
          data: icsData,
          timestamp: Date.now()
        }

        console.log(`[Success] ${cacheKey} - ${icsData.length} bytes`)

        return new Response(
          JSON.stringify({
            icsData,
            cached: false,
            timestamp: Date.now(),
            feedType,
            therapistId
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        )

      } catch (error: any) {
        lastError = error
        console.error(`[Attempt ${attempt}] ${cacheKey} failed:`, error.message)
        
        if (attempt < 3) {
          // Exponential backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // All retries failed
    console.error(`[FAILED] ${cacheKey} after 3 attempts:`, lastError?.message)

    // Return cached data if available, even if expired
    if (cached) {
      console.log(`[Fallback] Using stale cache for ${cacheKey}`)
      return new Response(
        JSON.stringify({
          icsData: cached.data,
          cached: true,
          stale: true,
          timestamp: cached.timestamp,
          feedType,
          therapistId,
          warning: 'Using stale cache data due to fetch failure'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch calendar after 3 attempts',
        details: lastError?.message 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error: any) {
    console.error('[Error]', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})

