/**
 * Service category constants – same "therapists" collection can offer multiple services.
 * Used for: Home tab filtering (massage vs facial), future services (e.g. "reflexology").
 * Add new service IDs here and filter in useHomePageLocation + HomePage tabs.
 *
 * Converted from serviceTypes.ts — TypeScript removed, logic identical.
 */
export const SERVICE_TYPES = {
  MASSAGE: 'massage',
  FACIAL: 'facial',
  BEAUTICIAN: 'beautician',
}

/** Check if therapist offers a given service (uses servicesOffered array). Handles JSON string from API. */
export function therapistOffersService(therapist, serviceId) {
  let offered = therapist?.servicesOffered
  if (offered == null) return false
  if (typeof offered === 'string') {
    try {
      offered = JSON.parse(offered)
    } catch {
      offered = offered.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return Array.isArray(offered) && offered.includes(serviceId)
}

/** Whether therapist should appear in "Facial Therapist" listing: offers facial OR beautician with paid Facial upgrade. */
export function shouldAppearInFacialListing(therapist) {
  if (therapistOffersService(therapist, SERVICE_TYPES.FACIAL)) return true
  if (!therapistOffersService(therapist, SERVICE_TYPES.BEAUTICIAN)) return false
  if (!therapist?.facialTherapistListingActive) return false
  const expiresAt = therapist?.facialTherapistListingExpiresAt
  if (!expiresAt) return true
  try {
    return new Date(expiresAt) > new Date()
  } catch {
    return false
  }
}
