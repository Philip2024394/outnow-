/**
 * Google Directions API utility.
 * Returns real road distance (km) and ETA (minutes) between two GPS points.
 * Falls back to haversine + speed estimate if API fails or is unavailable.
 */
import { haversineKm } from './distance'

const API_KEY = import.meta.env.VITE_GOOGLE_DIRECTIONS_KEY

/**
 * Get real driving distance and ETA between two coordinates.
 * Uses Google Directions API for accurate road-based results.
 * Falls back to haversine estimate on failure.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @param {'driving'|'walking'|'bicycling'} mode - travel mode (default: driving)
 * @returns {Promise<{ distanceKm: number, durationMin: number, source: 'google'|'fallback' }>}
 */
export async function getDirections(originLat, originLng, destLat, destLng, mode = 'driving') {
  // Validate inputs
  if (!originLat || !originLng || !destLat || !destLng) {
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  // If no API key, use fallback
  if (!API_KEY) {
    console.warn('[GoogleDirections] No API key — using haversine fallback')
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json`
      + `?origin=${originLat},${originLng}`
      + `&destination=${destLat},${destLng}`
      + `&mode=${mode}`
      + `&key=${API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status === 'OK' && data.routes?.length > 0) {
      const leg = data.routes[0].legs[0]
      return {
        distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
        durationMin: Math.ceil(leg.duration.value / 60),
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        source: 'google',
      }
    }

    // API returned but no valid route
    console.warn('[GoogleDirections] No route found:', data.status)
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  } catch (err) {
    console.warn('[GoogleDirections] API error, using fallback:', err.message)
    return fallbackEstimate(originLat, originLng, destLat, destLng, mode)
  }
}

/**
 * Fallback: haversine straight-line + speed assumption.
 * Road distance is typically 1.3x straight-line in Indonesian cities.
 */
function fallbackEstimate(originLat, originLng, destLat, destLng, mode) {
  const straightKm = haversineKm(originLat ?? 0, originLng ?? 0, destLat ?? 0, destLng ?? 0)
  const roadKm = Math.round(straightKm * 1.3 * 10) / 10 // road factor

  // Speed assumptions for Indonesian traffic
  const speeds = {
    driving: 20, // km/h — city traffic avg
    bicycling: 15, // km/h — motorbike in traffic
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
 * Returns simplified result for sorting drivers.
 *
 * @param {number} driverLat
 * @param {number} driverLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {Promise<{ distKm: number, etaMin: number }>}
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
 * Returns both legs and total ETA.
 *
 * @param {object} driverCoords - { lat, lng }
 * @param {object} restaurantCoords - { lat, lng }
 * @param {object} customerCoords - { lat, lng }
 * @returns {Promise<{ toRestaurant: object, toCustomer: object, totalMin: number, totalKm: number }>}
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
 * Returns road distance for accurate fare calculation.
 *
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @param {number} dropoffLat
 * @param {number} dropoffLng
 * @returns {Promise<{ distanceKm: number, durationMin: number }>}
 */
export async function getRideDistance(pickupLat, pickupLng, dropoffLat, dropoffLng) {
  return getDirections(pickupLat, pickupLng, dropoffLat, dropoffLng, 'driving')
}
