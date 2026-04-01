import { useState } from 'react'
import { markOtwProceeding, cancelOtw } from '@/services/otwService'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import styles from './VenueReveal.module.css'

/**
 * Shown after Stripe payment completes.
 * Displays exact venue name, address, and estimated travel time.
 * User B confirms "Proceed" → User A is notified.
 */
export default function VenueReveal({ open, unlock, request, onClose }) {
  const [eta, setEta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!unlock) return null

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(unlock.venueAddress)}&ll=${unlock.venueLat},${unlock.venueLng}`

  const handleProceed = async () => {
    setLoading(true)
    try {
      // Calculate ETA using Google Maps Distance Matrix if available
      const etaMinutes = await getEtaMinutes(unlock.venueLat, unlock.venueLng)
      setEta(etaMinutes)
      if (request?.id) {
        await markOtwProceeding(request.id, etaMinutes)
      }
      setConfirmed(true)
    } catch {
      setConfirmed(true)
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (request?.id) {
      try { await cancelOtw(request.id) } catch {}
    }
    onClose()
  }

  if (confirmed) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div className={styles.content}>
          <div className={styles.icon}>🚀</div>
          <h2 className={styles.heading}>You're on your way!</h2>
          <p className={styles.sub}>They know you're coming.</p>
          {eta && (
            <div className={styles.etaBadge}>
              🕐 ~{eta} min away
            </div>
          )}
          <div className={styles.venueCard}>
            <div className={styles.venueName}>{unlock.venueName}</div>
            <div className={styles.venueAddress}>{unlock.venueAddress}</div>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.directionsBtn}>
            🗺️ Open in Maps
          </a>
          <Button variant="ghost" fullWidth onClick={onClose}>Done</Button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={handleCancel}>
      <div className={styles.content}>
        <div className={styles.icon}>📍</div>
        <h2 className={styles.heading}>Location Unlocked</h2>

        <div className={styles.venueCard}>
          <div className={styles.venueLabel}>EXACT LOCATION</div>
          <div className={styles.venueName}>{unlock.venueName}</div>
          <div className={styles.venueAddress}>{unlock.venueAddress}</div>
        </div>

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.directionsBtn}>
          🗺️ View on map
        </a>

        <div className={styles.confirm}>
          <p className={styles.confirmText}>
            Proceed and notify them you're on your way?
          </p>
          <div className={styles.confirmActions}>
            <Button variant="otw" size="lg" fullWidth loading={loading} onClick={handleProceed}>
              🚀 I'm on my way!
            </Button>
            <Button variant="ghost" fullWidth onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>

        <p className={styles.note}>
          Cancelling returns them to the live map. No additional charges.
        </p>
      </div>
    </BottomSheet>
  )
}

async function getEtaMinutes(destLat, destLng) {
  return new Promise((resolve) => {
    if (!window.google?.maps) return resolve(null)

    navigator.geolocation.getCurrentPosition((pos) => {
      const origin = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
      const destination = new window.google.maps.LatLng(destLat, destLng)
      const service = new window.google.maps.DistanceMatrixService()

      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: 'WALKING',
      }, (result, status) => {
        if (status === 'OK') {
          const minutes = Math.ceil(result.rows[0].elements[0].duration.value / 60)
          resolve(minutes)
        } else {
          resolve(null)
        }
      })
    }, () => resolve(null))
  })
}
