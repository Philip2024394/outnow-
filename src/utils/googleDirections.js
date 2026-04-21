/**
 * Google Directions API utility.
 * Calls Supabase Edge Function (server-side proxy) to avoid CORS.
 * Falls back to haversine + speed estimate if API fails.
 */
import { haversineKm } from './distance'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FN_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/directions` : null

/**
 * Get real driving distance and ETA between two coordinates.
 * Routes through Supabase Edge Function → Google Directions API.
 * Falls back to haversine estimate on failure.
 */
export async function getDirections(originLat, originLng, destLat, destLng, mode = 'driving') {
  if (!originLat || !originLng || !destLat || !destLng) {
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  if (!EDGE_FN_URL || !SUPABASE_ANON) {
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        mode,
      }),
    })

    if (!res.ok) throw new Error(`Edge function returned ${res.status}`)

    const data = await res.json()

    if (data.source === 'google' && data.distanceKm != null) {
      return data
    }

    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  } catch (err) {
    // Silent fallback — no console spam in dev
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }
}

/**
 * Fallback: haversine straight-line + speed assumption.
 * Road distance is typically 1.3x straight-line in Indonesian cities.
 */
function fallbackEstimate(originLat, originLng, destLat, destLng, mode) {
  const straightKm = haversineKm(originLat ?? 0, originLng ?? 0, destLat ?? 0, destLng ?? 0)
  const roadKm = Math.round(straightKm * 1.3 * 10) / 10

  const speeds = {
    driving: 20,
    bicycling: 15,
    walking: 5,
  }
  const speed = speeds[mode] ?? 20
  const durationMin = Math.max(1, Math.ceil((roadKm / speed) * 60))

  return {
    distanceKm: roadKm,
    durationMin,
    distanceText: `${roadKm} km`,
    durationText: `${durationMin} min`,
    source: 'fallback',
  }
}

/**
 * Quick distance + ETA for driver matching.
 */
export async function getDriverETA(driverLat, driverLng, destLat, destLng) {
  const result = await getDirections(driverLat, driverLng, destLat, destLng, 'driving')
  return {
    distKm: result.distanceKm,
    etaMin: result.durationMin,
  }
}

/**
 * Calculate full delivery route: driver → restaurant → customer.
 */
export async function getDeliveryRoute(driverCoords, restaurantCoords, customerCoords) {
  const [toRestaurant, toCustomer] = await Promise.all([
    getDirections(driverCoords.lat, driverCoords.lng, restaurantCoords.lat, restaurantCoords.lng),
    getDirections(restaurantCoords.lat, restaurantCoords.lng, customerCoords.lat, customerCoords.lng),
  ])

  return {
    toRestaurant,
    toCustomer,
    totalMin: toRestaurant.durationMin + toCustomer.durationMin,
    totalKm: Math.round((toRestaurant.distanceKm + toCustomer.distanceKm) * 10) / 10,
  }
}

/**
 * Calculate fare-ready distance between pickup and dropoff.
 */
export async function getRideDistance(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  return getDirections(pickupLat, pickupLng, dropoffLat, dropoffLng, 'driving')
}
