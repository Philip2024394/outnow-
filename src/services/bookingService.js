import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'

// ── Demo fallback drivers ─────────────────────────────────────────────────────
export const DEMO_DRIVERS = [
  { id: 'd1', display_name: 'Budi Santoso', driver_age: 28, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.9, total_trips: 342, phone: '6281234567890', vehicle_model: 'Honda Vario 125', vehicle_year: 2022, vehicle_color: 'Black',  plate_prefix: 'AB12', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.797, lng: 110.370 } },
  { id: 'd2', display_name: 'Ani Rahayu',   driver_age: 24, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.7, total_trips: 178, phone: '6281234567891', vehicle_model: 'Yamaha NMAX',     vehicle_year: 2021, vehicle_color: 'Blue',   plate_prefix: 'AB34', accepts_rides: true,  accepts_packages: false, driver_last_location: { lat: -7.801, lng: 110.365 } },
  { id: 'd3', display_name: 'Citra Dewi',   driver_age: 31, driver_type: 'car_taxi',  driver_online: true, driver_busy: false, rating: 4.8, total_trips: 521, phone: '6281234567892', vehicle_model: 'Toyota Avanza',   vehicle_year: 2020, vehicle_color: 'White',  plate_prefix: 'AB56', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.793, lng: 110.375 } },
  { id: 'd4', display_name: 'Hendra Putra', driver_age: 35, driver_type: 'bike_ride', driver_online: true, driver_busy: false, rating: 4.6, total_trips: 89,  phone: '6281234567893', vehicle_model: 'Honda Beat',      vehicle_year: 2023, vehicle_color: 'Red',    plate_prefix: 'AB78', accepts_rides: false, accepts_packages: true,  driver_last_location: { lat: -7.805, lng: 110.358 } },
  { id: 'd5', display_name: 'Sari Wulan',   driver_age: 27, driver_type: 'car_taxi',  driver_online: true, driver_busy: false, rating: 4.9, total_trips: 634, phone: '6281234567894', vehicle_model: 'Daihatsu Xenia',  vehicle_year: 2021, vehicle_color: 'Silver', plate_prefix: 'AB90', accepts_rides: true,  accepts_packages: true,  driver_last_location: { lat: -7.789, lng: 110.381 } },
]

// ── Set driver busy state (explicit booking or auto speed detection) ──────────
export async function setDriverBusy(driverId, busy, source = 'booking') {
  if (!supabase) return
  await supabase.from('profiles').update({
    driver_busy:      busy,
    driver_auto_busy: source === 'auto' ? busy : false,
  }).eq('id', driverId)
}

export async function setDriverSpeedKmh(driverId, speedKmh) {
  if (!supabase) return
  await supabase.from('profiles').update({ driver_speed_kmh: Math.round(speedKmh) }).eq('id', driverId)
}

// ── Nearby drivers ────────────────────────────────────────────────────────────
export async function fetchNearbyDrivers(userLat, userLng, driverType, excludeIds = []) {
  let drivers = DEMO_DRIVERS.filter(d => d.driver_type === driverType && !excludeIds.includes(d.id))

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, driver_age, driver_type, driver_online, driver_busy, driver_auto_busy, driver_speed_kmh, driver_last_location, phone, rating, total_trips, vehicle_model, vehicle_year, vehicle_color, plate_prefix')
      .eq('is_driver', true)
      .eq('driver_online', true)
      .eq('driver_type', driverType)
      .not('id', 'in', excludeIds.length ? `(${excludeIds.join(',')})` : '()')
      .limit(12)
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
    // Available drivers first (sorted by distance), busy drivers last (sorted by distance)
    .sort((a, b) => {
      if (a.driver_busy !== b.driver_busy) return a.driver_busy ? 1 : -1
      return a.distKm - b.distKm
    })
    .slice(0, 8)
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
    // Mark driver as explicitly busy
    await supabase.from('profiles').update({ driver_busy: true, driver_auto_busy: false }).eq('id', driverId)
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
    .update({ status: 'accepted', started_at: new Date().toISOString() })
    .eq('id', bookingId)
}

export async function incrementDriverTrips(driverId) {
  if (!supabase) return
  await supabase.rpc('increment_driver_trips', { p_driver_id: driverId })
}

export async function completeBooking(bookingId, driverId = null) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (driverId) {
    await supabase.from('profiles').update({ driver_busy: false, driver_auto_busy: false }).eq('id', driverId)
  }
}

export async function cancelBooking(bookingId, reason = '', driverId = null) {
  if (!supabase) return
  await supabase.from('bookings')
    .update({ status: 'cancelled', cancel_reason: reason, completed_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (driverId) {
    await supabase.from('profiles').update({ driver_busy: false, driver_auto_busy: false }).eq('id', driverId)
  }
}

export async function submitDriverReview({ bookingId, driverId, userId, stars, comment = '' }) {
  if (!supabase) return
  await supabase.from('driver_reviews').insert({
    booking_id:  bookingId,
    driver_id:   driverId,
    user_id:     userId,
    stars,
    comment,
    created_at:  new Date().toISOString(),
  })
  // Recalculate driver's average rating
  const { data } = await supabase
    .from('driver_reviews')
    .select('stars')
    .eq('driver_id', driverId)
  if (data?.length) {
    const avg = data.reduce((s, r) => s + r.stars, 0) / data.length
    await supabase.from('profiles')
      .update({ rating: Math.round(avg * 10) / 10 })
      .eq('id', driverId)
  }
}
