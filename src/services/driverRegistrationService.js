/**
 * Driver Registration Service
 * Handles driver applications in demo mode (localStorage).
 * In production, delegates to driverService.js + Supabase.
 */

const STORAGE_KEY = 'indoo_driver_applications'

export const VEHICLE_TYPES = [
  { id: 'bike', label: 'Motor Bike', icon: '🏍️', licenseClass: 'SIM C' },
  { id: 'car',  label: 'Car',        icon: '🚗', licenseClass: 'SIM A' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Submit a new driver application */
export function submitApplication(data) {
  const apps = load()
  const existing = apps.findIndex(a => a.phone === data.phone)

  const entry = {
    id: 'drv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    ...data,
    status: 'pending', // pending | approved | rejected
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    adminNote: '',
  }

  if (existing >= 0) {
    // Update existing application
    apps[existing] = { ...apps[existing], ...entry, id: apps[existing].id }
    save(apps)
    return apps[existing]
  }

  apps.unshift(entry)
  save(apps)
  return entry
}

/** Get application by phone */
export function getApplicationByPhone(phone) {
  return load().find(a => a.phone === phone) || null
}

/** Get all applications (admin) */
export function getAllApplications() {
  return load()
}

/** Approve application (admin) */
export function approveApplication(id) {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx].status = 'approved'
  apps[idx].reviewedAt = new Date().toISOString()
  save(apps)
  return apps[idx]
}

/** Reject application (admin) */
export function rejectApplication(id, reason = '') {
  const apps = load()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx].status = 'rejected'
  apps[idx].reviewedAt = new Date().toISOString()
  apps[idx].adminNote = reason
  save(apps)
  return apps[idx]
}
