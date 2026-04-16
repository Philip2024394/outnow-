/**
 * therapistCardConstants.js — Status styling for therapist cards.
 * Converted from therapistCardConstants.ts.
 *
 * NOTE: Original used Tailwind classes. In dark glass theme, these map to CSS Module classes.
 * The CSS Module class names are used directly in TherapistCard.jsx instead.
 * This file kept for reference and logic that depends on isAvailable flag.
 */
import { AvailabilityStatus } from './types'

export const statusStyles = {
  [AvailabilityStatus.Available]: { isAvailable: true },
  [AvailabilityStatus.Busy]: { isAvailable: false },
  [AvailabilityStatus.Offline]: { isAvailable: false },
}
