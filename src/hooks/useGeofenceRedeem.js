import { useState, useEffect, useRef } from 'react'

export function useGeofenceRedeem({ activeClaims, onAutoRedeem }) {
  // activeClaims = array of { id, deal: { lat, lng, title, seller_name }, status }
  // onAutoRedeem = callback(claimId) when user arrives at location

  const [nearbyDeal, setNearbyDeal] = useState(null) // claim that user is near
  const [checking, setChecking] = useState(false)
  const watchRef = useRef(null)
  const redeemedRef = useRef(new Set()) // prevent double-redeem

  useEffect(() => {
    const active = activeClaims?.filter(c => c.status === 'active' && c.deal?.lat && c.deal?.lng) ?? []
    if (!active.length || !navigator.geolocation) {
      setChecking(false)
      return
    }

    setChecking(true)

    // Haversine distance in meters
    function distanceM(lat1, lon1, lat2, lon2) {
      const R = 6371000
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    // Check position every 30 seconds
    const checkPosition = (pos) => {
      const { latitude, longitude } = pos.coords
      for (const claim of active) {
        if (redeemedRef.current.has(claim.id)) continue
        const dist = distanceM(latitude, longitude, claim.deal.lat, claim.deal.lng)
        if (dist <= 200) {
          setNearbyDeal(claim)
          // Auto-redeem after 5 minutes at location
          // For now, just notify — let the UI handle confirmation
          redeemedRef.current.add(claim.id)
          onAutoRedeem?.(claim.id)
          break
        }
      }
    }

    watchRef.current = navigator.geolocation.watchPosition(checkPosition, () => {}, {
      enableHighAccuracy: false,
      maximumAge: 30000,
      timeout: 10000,
    })

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
      setChecking(false)
    }
  }, [activeClaims?.length]) // re-run when claims change

  return { nearbyDeal, checking }
}
