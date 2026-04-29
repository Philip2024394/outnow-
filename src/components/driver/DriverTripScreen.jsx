import { useState, useRef, useEffect } from 'react'
import { driverMarkArrived, driverStartRide, driverCompleteRide } from '@/services/bookingService'
import useDriverNavigation from '@/hooks/useDriverNavigation'
import DriverNavMap from './DriverNavMap'
import DriverNavInstructions from './DriverNavInstructions'
import styles from './DriverTripScreen.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function DriverTripScreen({ booking, driverId, onCompleted, onClose }) {
  const [phase, setPhase] = useState(
    booking.status === 'in_progress' ? 'in_progress' : 'going_to_pickup'
  )
  const [busy, setBusy] = useState(false)

  // Determine navigation destination based on phase
  const destination = phase === 'in_progress' || phase === 'arrived'
    ? booking.dropoff_coords
    : booking.pickup_coords

  const {
    route, loading, driverPos, bearing,
    currentStep, nextStep, etaMin, distToNextTurn,
    isOffRoute, arrived,
  } = useDriverNavigation(destination, phase !== 'completed')

  const passenger = booking.passenger

  const handleArrived = async () => {
    setBusy(true)
    await driverMarkArrived(booking.id)
    setPhase('arrived')
    setBusy(false)
  }

  const handleStartRide = async () => {
    setBusy(true)
    await driverStartRide(booking.id)
    setPhase('in_progress')
    setBusy(false)
  }

  const completeTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(completeTimerRef.current), [])

  const handleComplete = async () => {
    setBusy(true)
    await driverCompleteRide(booking.id, driverId)
    setPhase('completed')
    setBusy(false)
    completeTimerRef.current = setTimeout(() => onCompleted?.(), 2000)
  }

  // Completed screen (no map)
  if (phase === 'completed') {
    return (
      <div className={styles.screen}>
        <div className={styles.completedScreen}>
          <span className={styles.completedIcon}>🎉</span>
          <span className={styles.completedText}>Ride Complete!</span>
          {booking.fare != null && (
            <span className={styles.completedFare}>{fmtRp(booking.fare)} earned</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.navScreen}>
      {/* Full-screen navigation map */}
      <DriverNavMap
        driverPos={driverPos}
        bearing={bearing}
        route={route}
        destination={destination}
        isOffRoute={isOffRoute}
      />

      {/* Turn-by-turn instructions overlay */}
      <DriverNavInstructions
        currentStep={currentStep}
        nextStep={nextStep}
        distToNextTurn={distToNextTurn}
        etaMin={etaMin}
        arrived={arrived}
        durationText={route?.durationText}
      />

      {/* Floating passenger card */}
      <div className={styles.passengerFloat}>
        <div className={styles.passengerAvatar}>
          {passenger?.photo_url
            ? <img src={passenger.photo_url} alt="" className={styles.avatarImg} />
            : <span className={styles.avatarInitial}>{passenger?.display_name?.[0]?.toUpperCase() ?? '?'}</span>
          }
        </div>
        <div className={styles.passengerInfo}>
          <span className={styles.passengerName}>{passenger?.display_name ?? 'Passenger'}</span>
          <span className={styles.phaseLabel}>
            {phase === 'going_to_pickup' && '📍 Heading to pickup'}
            {phase === 'arrived' && '⏳ Waiting for passenger'}
            {phase === 'in_progress' && '🚀 Ride in progress'}
          </span>
        </div>
        {booking.fare != null && (
          <span className={styles.fareFloat}>{fmtRp(booking.fare)}</span>
        )}
      </div>

      {/* Action button — overlays bottom of map */}
      <div className={styles.actionOverlay}>
        {phase === 'going_to_pickup' && (
          <button className={styles.actionBtn} onClick={handleArrived} disabled={busy}>
            {busy ? '...' : "📍 I've Arrived"}
          </button>
        )}
        {phase === 'arrived' && (
          <button className={styles.actionBtn} onClick={handleStartRide} disabled={busy}>
            {busy ? '...' : '🚀 Start Ride'}
          </button>
        )}
        {phase === 'in_progress' && (
          <button className={`${styles.actionBtn} ${styles.actionBtnComplete}`} onClick={handleComplete} disabled={busy}>
            {busy ? '...' : '✅ Complete Ride'}
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <span>Loading route...</span>
        </div>
      )}

      {/* Close button */}
      {onClose && phase === 'going_to_pickup' && (
        <button className={styles.closeNav} onClick={onClose}>✕</button>
      )}
    </div>
  )
}
