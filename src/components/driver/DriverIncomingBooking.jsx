import { useEffect, useState } from 'react'
import { acceptBooking, declineBooking } from '@/services/bookingService'
import styles from './DriverIncomingBooking.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function DriverIncomingBooking({ booking, driverId, onAccepted, onDeclined }) {
  const [busy,     setBusy]     = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(null)

  // Countdown from expires_at
  useEffect(() => {
    if (!booking?.expires_at) return
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(booking.expires_at) - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) onDeclined('expired')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [booking?.expires_at, onDeclined])

  const handleAccept = async () => {
    setBusy(true)
    await acceptBooking(booking.id, driverId)
    onAccepted(booking)
  }

  const handleDecline = async () => {
    setBusy(true)
    await declineBooking(booking.id, driverId)
    onDeclined('declined')
  }

  const passenger = booking.passenger
  const pctLeft   = secondsLeft != null && booking?.expires_at
    ? (secondsLeft / Math.round((new Date(booking.expires_at) - new Date(booking.created_at)) / 1000)) * 100
    : 100

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Timer bar */}
        <div className={styles.timerBar}>
          <div className={styles.timerFill} style={{ width: `${pctLeft}%`, background: pctLeft < 25 ? '#ff6b6b' : '#8DC63F' }} />
        </div>

        <div className={styles.pulse}>🔔</div>
        <h2 className={styles.title}>New Booking Request</h2>
        {secondsLeft != null && (
          <p className={styles.countdown}>Expires in <strong>{secondsLeft}s</strong></p>
        )}

        {/* Passenger */}
        <div className={styles.passengerRow}>
          <div className={styles.passengerAvatar}>
            {passenger?.photo_url
              ? <img src={passenger.photo_url} alt={passenger.display_name} className={styles.avatarImg} />
              : <span className={styles.avatarInitial}>{passenger?.display_name?.[0]?.toUpperCase() ?? '?'}</span>
            }
          </div>
          <div className={styles.passengerInfo}>
            <span className={styles.passengerName}>{passenger?.display_name ?? 'Passenger'}</span>
            {passenger?.rating && (
              <span className={styles.passengerRating}>⭐ {passenger.rating}</span>
            )}
          </div>
          {booking.fare != null && (
            <span className={styles.fare}>{fmtRp(booking.fare)}</span>
          )}
        </div>

        {/* Route */}
        <div className={styles.route}>
          <div className={styles.routeRow}>
            <span className={styles.routeDot} style={{ background: '#8DC63F' }} />
            <div className={styles.routeTextWrap}>
              <span className={styles.routeLabel}>Pickup</span>
              <span className={styles.routeAddr}>{booking.pickup_location ?? '—'}</span>
            </div>
          </div>
          <div className={styles.routeConnector} />
          <div className={styles.routeRow}>
            <span className={styles.routeDot} style={{ background: '#F5C518' }} />
            <div className={styles.routeTextWrap}>
              <span className={styles.routeLabel}>Destination</span>
              <span className={styles.routeAddr}>{booking.dropoff_location ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.btnDecline} onClick={handleDecline} disabled={busy}>
            ✕ Decline
          </button>
          <button className={styles.btnAccept} onClick={handleAccept} disabled={busy}>
            {busy ? '…' : '✓ Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
