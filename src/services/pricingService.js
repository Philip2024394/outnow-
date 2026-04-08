import { supabase } from '@/lib/supabase'

export const DEFAULT_ZONES = [
  { id: 1, city_name: 'Yogyakarta',       zone_id: 1,  car_base_fare: 6000, car_per_km: 3000, bike_base_fare: 5000, bike_per_km: 2500, is_active: true },
  { id: 2, city_name: 'Jakarta',          zone_id: 2,  car_base_fare: 8000, car_per_km: 3500, bike_base_fare: 6500, bike_per_km: 3000, is_active: true },
  { id: 3, city_name: 'Surabaya',         zone_id: 3,  car_base_fare: 7000, car_per_km: 3200, bike_base_fare: 5500, bike_per_km: 2800, is_active: true },
  { id: 4, city_name: 'Bandung',          zone_id: 4,  car_base_fare: 7000, car_per_km: 3200, bike_base_fare: 5500, bike_per_km: 2800, is_active: true },
  { id: 5, city_name: 'Semarang',         zone_id: 5,  car_base_fare: 6000, car_per_km: 3000, bike_base_fare: 5000, bike_per_km: 2500, is_active: true },
  { id: 6, city_name: 'Malang',           zone_id: 6,  car_base_fare: 6000, car_per_km: 3000, bike_base_fare: 5000, bike_per_km: 2500, is_active: true },
  { id: 7, city_name: 'Bali (Denpasar)',  zone_id: 7,  car_base_fare: 7000, car_per_km: 3200, bike_base_fare: 5500, bike_per_km: 2800, is_active: true },
  { id: 99,city_name: 'Other Cities',     zone_id: 99, car_base_fare: 5000, car_per_km: 2500, bike_base_fare: 4000, bike_per_km: 2000, is_active: true },
]

export const DEFAULT_SETTINGS = { minimum_fare: 10000, max_fare: 100000, max_distance_km: 50, driver_timeout_seconds: 60 }

export async function fetchPricingZones() {
  if (!supabase) return DEFAULT_ZONES
  const { data, error } = await supabase.from('pricing_zones').select('*').order('zone_id')
  if (error || !data?.length) return DEFAULT_ZONES
  return data
}

export async function upsertPricingZone(zone) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('pricing_zones')
    .upsert({ ...zone, updated_at: new Date().toISOString() })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePricingZone(id) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('pricing_zones').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchGlobalSettings() {
  if (!supabase) return DEFAULT_SETTINGS
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'ride_settings').maybeSingle()
  return data?.value ?? DEFAULT_SETTINGS
}

export async function saveGlobalSettings(settings) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('app_settings').upsert({
    key: 'ride_settings', value: settings, updated_at: new Date().toISOString(),
  }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

/** Pure client-side fare estimate — no network call needed */
export function estimateFare(driverType, cityName, distanceKm, zones, settings) {
  const zone = zones.find(z => z.city_name.toLowerCase() === (cityName ?? '').toLowerCase())
             ?? zones.find(z => z.zone_id === 99)
             ?? zones[0]
  const base    = driverType === 'car_taxi' ? zone.car_base_fare : zone.bike_base_fare
  const perKm   = driverType === 'car_taxi' ? zone.car_per_km   : zone.bike_per_km
  const minFare = settings?.minimum_fare ?? 10000
  const maxFare = settings?.max_fare     ?? 100000
  return Math.min(Math.max(base + Math.round(distanceKm * perKm), minFare), maxFare)
}

export function formatRp(amount) {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`
}
