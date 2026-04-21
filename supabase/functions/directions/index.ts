import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_KEY = Deno.env.get('GOOGLE_DIRECTIONS_KEY') ?? ''

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { origin, destination, mode } = await req.json()

    if (!origin || !destination) {
      return new Response(JSON.stringify({ error: 'origin and destination required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!GOOGLE_KEY) {
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json`
      + `?origin=${origin}`
      + `&destination=${destination}`
      + `&mode=${mode || 'driving'}`
      + `&key=${GOOGLE_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status === 'OK' && data.routes?.length > 0) {
      const leg = data.routes[0].legs[0]
      return new Response(JSON.stringify({
        distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
        durationMin: Math.ceil(leg.duration.value / 60),
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        source: 'google',
      }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      error: 'No route found',
      status: data.status,
    }), {
      status: 404,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
