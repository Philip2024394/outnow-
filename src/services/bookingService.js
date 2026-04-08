import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'

// ── Demo fallback drivers ─────────────────────────────────────────────────────
export const DEMO_DRIVERS = [
  { id: 'd1', display_name: 'Budi Santoso', driver_type: 'bike_ride', driver_online: true, rating: 4.9, phone: '6281234567890', driver_last_location: { lat: -7.797, lng: 110.370 } },
  { id: 'd2', display_name: 'Ani Rahayu',   driver_type: 'bike_ride', driver_online: true, rating: 4.7, phone: '6281234567891', driver_last_location: { lat: -7.801, lng: 110.365 } },
  { id: 'd3', display_name: 'Citra Dewi',   driver_type: 'car_taxi',  driver_online: true, rating: 4.8, phone: '6281234567892', driver_last_location: { lat: -7.793, lng: 110.375 } },
  { id: 'd4', display_name: 'Hendra Putra', driver_type: 'bike_ride', driver_online: true, rating: 4.6, phone: '6281234567893', driver_last_location: { lat: -7.805, lng: 110.358 } },
  { id: 'd5', display_name: 'Sari Wulan',   driver_type: 'car_taxi',  driver_online: true, rating: 4.9, phone: '6281234567894', driver_last_location: { lat: -7.789, lng: 110.381 } },
]

// ── Nearby drivers ────────────────────────────────────────────────────────────
export async function fetchNearbyDrivers(userLat, userLng, driverType, excludeIds = []) {
  let drivers = DEMO_DRIVERS.filter(d => d.driver_type === driverType && !excludeIds.includes(d.id))

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, driver_type, driver_online, driver_last_location, phone, rating')
      .eq('is_driver', true)
      .eq('driver_online', true)
      .eq('driver_type', driverType)
      .not('id', 'in', excludeIds.length ? `(${excludeIds.join(',')})` : '()')
      .limit(10)
    if (data?.length) drivers = data
  }

  return drivers
    .map(d => {
      const loc    = d.driver_last_location
      const distKm = (userLat && userLng && loc?.lat && loc?.lng)
        ? haversineKm(userLat, userLng, loc.lat, loc.lng)
        : Math.random() * 1.8 + 0.3
      // ETA: ~18 km/h avg city speed
      const etaMin = Math.max(1, Math.round((distKm / 18) * 60))
      return { ...d, distKm: Math.round(distKm * 10) / 10, etaMin }
    })
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 5)
}

// ── Driver online/offline ─────────────────────────────────────────────────────
export async function setDriverOnline(userId, online, coords = null) {
  if (!supabase) return
  const update = {
    driver_online: online,
    ...(online && coords ? {
      driver_last_location:    { lat: coords.lat, lng: coords.lng },
      driver_last_location_at: new Date().toISOString(),
    } : {}),
  }
  await supabase.from('profiles').update(update).eq('id', userId)
}

export async function updateDriverLocation(userId, coords) {
  if (!supabase) return
  await supabase.from('profiles').update({
    driver_last_location:    { lat: coords.lat, lng: coords.lng },
    driver_last_location_at: new Date().toISOString(),
  }).eq('id', userId)
}

export async function getDriverOnlineStatus(userId) {
  if (!supabase) return false
  const { data } = await supabase
    .from('profiles')
    .select('driver_online')
    .eq('id', userId)
    .maybeSingle()
  return data?.driver_online ?? false
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function createBooking({ userId, driverId, pickupAddress, dropoffAddress, pickupCoords, dropoffCoords, fare, distanceKm, timeoutSeconds = 45 }) {
  const id        = `BOOK_${Date.now()}`
  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000).toISOString()
  const booking   = {
    id,
    user_id:          userId,
    driver_id:        driverId,
    status:           'pending',
    pickup_location:  pickupAddress,
    dropoff_location: dropoffAddress,
    pickup_coords:    pickupCoords  ?? null,
    dropoff_coords:   dropoffCoords ?? null,
    fare,
    distance_km:      distanceKm   ?? null,
    created_at:       new Date().toISOString(),
    expires_at:       expiresAt,
  }
  if (supabase) {
    const { error } = await supabase.from('bookings').insert(booking)
    if (error) console.warn('Booking insert error:', error.message)
  }
  return booking
}

export async function expireBooking(bookingId) {
  if (!supabase) return
  await supabase.from('bookings').update({ status: 'expired' }).eq('id', bookingId)
}

export async function markBookingStarted(bookingId) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'accepted', completed_at: new Date().toISOString() })
    .eq('id', bookingId)
}
