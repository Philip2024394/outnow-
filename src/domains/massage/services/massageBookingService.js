/**
 * Massage Booking Service
 * Handles booking flow with 10% commission.
 * Demo mode: localStorage. Production: Supabase.
 */

const BOOKINGS_KEY = 'indoo_massage_bookings'

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const COMMISSION_RATE = 0.10 // 10%

function load() {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [] }
  catch { return [] }
}

function save(data) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(data))
}

/**
 * Create a booking request.
 * Customer selects therapist + duration → booking created with commission calculated.
 */
export function createMassageBooking({
  therapistId,
  therapistName,
  customerId,
  customerName,
  customerPhone,
  duration, // 60 | 90 | 120
  price, // total price for this duration
  serviceType, // 'Traditional Massage' etc
  location, // customer's location / hotel / villa
}) {
  const bookings = load()
  const commission = Math.round(price * COMMISSION_RATE)

  const booking = {
    id: 'mb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    therapistId,
    therapistName,
    customerId: customerId || 'guest',
    customerName: customerName || 'Guest',
    customerPhone: customerPhone || '',
    duration,
    price,
    commission,
    therapistPayout: price - commission,
    serviceType: serviceType || 'Massage',
    location: location || '',
    status: BOOKING_STATUS.PENDING,
    commissionPaid: false,
    commissionDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h deadline
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    completedAt: null,
  }

  bookings.unshift(booking)
  save(bookings)
  return booking
}

/** Get all bookings */
export function getAllBookings() { return load() }

/** Get bookings for a therapist */
export function getTherapistBookings(therapistId) {
  return load().filter(b => b.therapistId === therapistId)
}

/** Get bookings for a customer */
export function getCustomerBookings(customerId) {
  return load().filter(b => b.customerId === customerId)
}

/** Update booking status */
export function updateBookingStatus(bookingId, status) {
  const bookings = load()
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) return null
  bookings[idx].status = status
  if (status === BOOKING_STATUS.CONFIRMED) bookings[idx].confirmedAt = new Date().toISOString()
  if (status === BOOKING_STATUS.COMPLETED) bookings[idx].completedAt = new Date().toISOString()
  save(bookings)
  return bookings[idx]
}

/** Mark commission as paid */
export function markCommissionPaid(bookingId) {
  const bookings = load()
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) return null
  bookings[idx].commissionPaid = true
  save(bookings)
  return bookings[idx]
}

/** Get unpaid commissions for a therapist */
export function getUnpaidCommissions(therapistId) {
  return load().filter(b =>
    b.therapistId === therapistId &&
    b.status === BOOKING_STATUS.COMPLETED &&
    !b.commissionPaid
  )
}

/** Get total unpaid commission amount */
export function getUnpaidTotal(therapistId) {
  const unpaid = getUnpaidCommissions(therapistId)
  return unpaid.reduce((sum, b) => sum + b.commission, 0)
}

/** Check if therapist has overdue commission (past 72h deadline) */
export function hasOverdueCommission(therapistId) {
  const now = new Date()
  return getUnpaidCommissions(therapistId).some(b => new Date(b.commissionDueAt) < now)
}

/** Admin: get all pending commissions */
export function getAllPendingCommissions() {
  return load().filter(b => b.status === BOOKING_STATUS.COMPLETED && !b.commissionPaid)
}

/** Format price */
export function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
