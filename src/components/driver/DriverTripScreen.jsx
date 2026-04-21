import { useState, useRef, useEffect } from 'react'
import { driverMarkArrived, driverStartRide, driverCompleteRide } from '@/services/bookingService'
import styles from './DriverTripScreen.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// Opens Google Maps navigation to a coordinate or address
function openNav(coords, address) {
  const query = coords?.lat
    ? `${coords.lat},${coords.lng}`
    : encodeURIComponent(address ?? '')
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`, '_blank')
}

export default function DriverTripScreen({ booking, driverId, onCompleted, onClose }) {
  // phase: 'going_to_pickup' | 'arrived' | 'in_progress' | 'completed'
  const [phase, setPhase] = useState(
    booking.status === 'in_progress' ? 'in_progress' : 'going_to_pickup'
  )
  const [busy, setBusy] = useState(false)

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

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerPhase}>
          {phase === 'going_to_pickup' && '🔵 Head to Pickup'}
          {phase === 'arrived'         && '🟡 Waiting for Passenger'}
          {phase === 'in_progress'     && '🟢 Ride in Progress'}
          {phase === 'completed'       && '✅ Ride Complete!'}
        </div>
        {onClose && phase !== 'in_progress' && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
      </div>

      {/* Passenger info */}
      <div className={styles.passengerCard}>
        <div className={styles.passengerAvatar}>
          {passenger?.photo_url
            ? <img src={passenger.photo_url} alt={passenger.display_name} className={styles.avatarImg} />
            : <span className={styles.avatarInitial}>{passenger?.display_name?.[0]?.toUpperCase() ?? '?'}</span>
          }
        </div>
        <div className={styles.passengerMeta}>
          <span className={styles.passengerName}>{passenger?.display_name ?? 'Passenger'}</span>
          {passenger?.rating && <span className={styles.passengerRating}>⭐ {passenger.rating}</span>}
        </div>
        {booking.fare != null && (
          <span className={styles.fare}>{fmtRp(booking.fare)}</span>
        )}
      </div>

      {/* Route */}
      <div className={styles.routeCard}>
        <div className={styles.routeRow}>
          <span className={styles.routeDot} style={{ background: '#8DC63F' }} />
          <div className={styles.routeText}>
            <span className={styles.routeLabel}>Pickup</span>
            <span className={styles.routeAddr}>{booking.pickup_location ?? '—'}</span>
          </div>
          <button
            className={styles.navBtn}
            onClick={() => openNav(booking.pickup_coords, booking.pickup_location)}
          >
            🧭 Navigate
          </button>
        </div>
        <div className={styles.routeConnector} />
        <div className={styles.routeRow}>
          <span className={styles.routeDot} style={{ background: '#F5C518' }} />
          <div className={styles.routeText}>
            <span className={styles.routeLabel}>Destination</span>
            <span className={styles.routeAddr}>{booking.dropoff_location ?? '—'}</span>
          </div>
          {phase === 'in_progress' && (
            <button
              className={styles.navBtn}
              onClick={() => openNav(booking.dropoff_coords, booking.dropoff_location)}
            >
              🧭 Navigate
            </button>
          )}
        </div>
      </div>

      {/* Booking ID */}
      <div className={styles.bookingId}>Booking #{booking.id}</div>

      {/* Action button */}
      <div className={styles.actionArea}>
        {phase === 'going_to_pickup' && (
          <button className={styles.btnPrimary} onClick={handleArrived} disabled={busy}>
            {busy ? '…' : "📍 I've Arrived at Pickup"}
          </button>
        )}
        {phase === 'arrived' && (
          <button className={styles.btnPrimary} onClick={handleStartRide} disabled={busy}>
            {busy ? '…' : '🚀 Start Ride'}
          </button>
        )}
        {phase === 'in_progress' && (
          <button className={`${styles.btnPrimary} ${styles.btnComplete}`} onClick={handleComplete} disabled={busy}>
            {busy ? '…' : '✅ Complete Ride'}
          </button>
        )}
        {phase === 'completed' && (
          <div className={styles.completedMsg}>
            <span className={styles.completedIcon}>🎉</span>
            <span className={styles.completedText}>Ride complete! Well done.</span>
            {booking.fare != null && (
              <span className={styles.completedFare}>{fmtRp(booking.fare)} earned</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
