import { useEffect, useRef, useState } from 'react'
import { VenueNotificationService } from '@/services/venueNotifications'

// Manages venue proximity alerts.
// Returns:
//   proximityAlert — { venue, distM } when nearby, null otherwise
//   dismissAlert   — call to clear the banner
export function useVenueProximity(activeVenues) {
  const [proximityAlert, setProximityAlert] = useState(null)
  const serviceRef = useRef(null)

  // Boot the service once on mount
  useEffect(() => {
    const service = new VenueNotificationService()
    serviceRef.current = service

    service.init((venue, distM) => {
      setProximityAlert({ venue, distM })
    })

    return () => service.destroy()
  }, [])

  // Keep the venue list up to date whenever it changes
  useEffect(() => {
    serviceRef.current?.setVenues(activeVenues)
  }, [activeVenues])

  return {
    proximityAlert,
    dismissAlert: () => setProximityAlert(null),
  }
}
