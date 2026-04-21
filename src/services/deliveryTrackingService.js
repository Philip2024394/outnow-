/**
 * Delivery tracking service — GPS location updates + phase detection.
 * Used by driver app to broadcast location and by customer app to track.
 */
import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/utils/distance'

// Phase thresholds (km)
const NEARBY_THRESHOLD = 0.2      // 200m from restaurant
const ALMOST_THERE_THRESHOLD = 0.5 // 500m from customer

/**
 * Update driver's GPS location (called every 10s during active delivery).
 */
export async function updateDriverLocation(driverId, lat, lng, heading, speed) {
  if (!supabase) return
  await supabase.from('driver_locations').upsert({
    driver_id: driverId,
    lat, lng, heading, speed,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Subscribe to a driver's location changes (customer side).
 * Returns unsubscribe function.
 */
export function subscribeToDriverLocation(driverId, onUpdate) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`driver-loc-${driverId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'driver_locations',
      filter: `driver_id=eq.${driverId}`,
    }, payload => onUpdate(payload.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

/**
 * Update delivery phase (written by driver, read by customer).
 */
export async function updateDeliveryPhase(orderId, driverId, phase, lat, lng) {
  if (!supabase) return
  await supabase.from('delivery_tracking').insert({
    order_id: orderId,
    driver_id: driverId,
    phase, lat, lng,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Subscribe to delivery phase changes (customer side).
 * Returns unsubscribe function.
 */
export function subscribeToDeliveryPhase(orderId, onPhaseChange) {
  if (!supabase) return () => {}
  const ch = supabase
    .channel(`delivery-${orderId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'delivery_tracking',
      filter: `order_id=eq.${orderId}`,
    }, payload => onPhaseChange(payload.new.phase))
    .subscribe()
  return () => supabase.removeChannel(ch)
}

/**
 * Detect delivery phase based on GPS distance.
 * Called by driver app with current location.
 *
 * @param {number} driverLat
 * @param {number} driverLng
 * @param {{ lat: number, lng: number }} restaurantCoords
 * @param {{ lat: number, lng: number }} customerCoords
 * @param {string} currentPhase
 * @returns {string|null} new phase if changed, null if no change
 */
export function detectPhase(driverLat, driverLng, restaurantCoords, customerCoords, currentPhase) {
  const distToRestaurant = haversineKm(driverLat, driverLng, restaurantCoords.lat, restaurantCoords.lng)
  const distToCustomer = haversineKm(driverLat, driverLng, customerCoords.lat, customerCoords.lng)

  // Before pickup
  if (currentPhase === 'heading_to_restaurant' && distToRestaurant < NEARBY_THRESHOLD) {
    return 'driver_nearby'
  }

  // After pickup (on_the_way phase)
  if (currentPhase === 'on_the_way' && distToCustomer < ALMOST_THERE_THRESHOLD) {
    return 'almost_there'
  }

  return null // no change
}

/**
 * Get latest driver location for an order.
 */
export async function getDriverLocation(driverId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('driver_locations')
    .select('lat, lng, heading, speed, updated_at')
    .eq('driver_id', driverId)
    .single()
  return data
}
