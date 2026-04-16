/**
 * Rental Listing Service
 * Owners create/manage vehicle listings with pricing, driver options, extras.
 */

const STORAGE_KEY = 'indoo_rental_listings_owner'

export const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'Motor Bike', icon: '🏍️' },
  { id: 'car',        label: 'Car',        icon: '🚗' },
  { id: 'truck',      label: 'Truck',      icon: '🚛' },
  { id: 'bus',        label: 'Bus',        icon: '🚌' },
]

export const FUEL_OPTIONS = [
  { id: 'excluded', label: 'Fuel Excluded' },
  { id: 'included', label: 'Fuel Included' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Create a new rental listing */
export function createListing(data) {
  const listings = load()
  const entry = {
    id: 'rl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    ...data,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    bookings: 0,
  }
  listings.unshift(entry)
  save(listings)
  return entry
}

/** Get all listings for current owner */
export function getMyListings() {
  return load()
}

/** Update a listing */
export function updateListing(id, updates) {
  const listings = load()
  const idx = listings.findIndex(l => l.id === id)
  if (idx === -1) return null
  listings[idx] = { ...listings[idx], ...updates, updatedAt: new Date().toISOString() }
  save(listings)
  return listings[idx]
}

/** Delete a listing */
export function deleteListing(id) {
  save(load().filter(l => l.id !== id))
}

/** Toggle listing status */
export function toggleListingStatus(id) {
  const listings = load()
  const idx = listings.findIndex(l => l.id === id)
  if (idx === -1) return null
  listings[idx].status = listings[idx].status === 'active' ? 'paused' : 'active'
  listings[idx].updatedAt = new Date().toISOString()
  save(listings)
  return listings[idx]
}

/** Format price */
export function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
