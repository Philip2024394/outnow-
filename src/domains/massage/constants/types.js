/**
 * types.js — Massage domain data types and enums.
 * Converted from types.ts — TypeScript interfaces removed, enums → objects.
 * All values and structure preserved exactly.
 */

export const AvailabilityStatus = {
  Available: 'Available',
  Busy: 'Busy',
  Offline: 'Offline',
}

export const BookingStatus = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  OnTheWay: 'OnTheWay',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
  TimedOut: 'TimedOut',
  Reassigned: 'Reassigned',
}

export const ProviderResponseStatus = {
  AwaitingResponse: 'AwaitingResponse',
  Confirmed: 'Confirmed',
  OnTheWay: 'OnTheWay',
  Declined: 'Declined',
  TimedOut: 'TimedOut',
}

export const NotificationType = {
  NewBooking: 'new_booking',
  BookingConfirmed: 'booking_confirmed',
  BookingCancelled: 'booking_cancelled',
  MembershipReminder: 'membership_reminder',
  BookingReminder: 'booking_reminder',
}

export const ReviewStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
}

export const HotelVillaServiceStatus = {
  NotOptedIn: 'not_opted_in',
  OptedIn: 'opted_in',
  Active: 'active',
}

export const CommissionPaymentStatus = {
  Pending: 'pending',
  AwaitingVerification: 'awaiting_verification',
  Verified: 'verified',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
}

export const CommissionPaymentMethod = {
  BankTransfer: 'bank_transfer',
  Cash: 'cash',
  MobilePayment: 'mobile_payment',
  Other: 'other',
}
