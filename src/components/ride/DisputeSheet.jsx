import { useState, useEffect } from 'react'
import { submitDispute, getDisputeTimeLeftMs, formatCountdown } from '@/services/disputeService'
import styles from './DisputeSheet.module.css'

export default function DisputeSheet({ ride, userId, userName, onClose }) {
  const [explanation, setExplanation]   = useState('')
  const [sending,     setSending]       = useState(false)
  const [done,        setDone]          = useState(false)
  const [timeLeft,    setTimeLeft]      = useState(() => getDisputeTimeLeftMs(ride.created_at))

  // Live countdown
  useEffect(() => {
    const id = setInterval(() => {
      const ms = getDisputeTimeLeftMs(ride.created_at)
      setTimeLeft(ms)
      if (ms <= 0) clearInterval(id)
    }, 30000)
    return () => clearInterval(id)
  }, [ride.created_at])

  const countdown = formatCountdown(timeLeft)

  const handleSubmit = async () => {
    if (!explanation.trim() || sending) return
    setSending(true)
    await submitDispute({
      bookingId:       ride.id,
      userId,
      userName,
      driverName:      ride.driver_name,
      driverType:      ride.driver_type,
      pickupLocation:  ride.pickup_location,
      dropoffLocation: ride.dropoff_location,
      cancelledAt:     ride.created_at,
      explanation:     explanation.trim(),
    })
    setSending(false)
    setDone(true)
  }

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>

        {done ? (
          <div className={styles.doneWrap}>
            <span className={styles.doneIcon}>✅</span>
            <p className={styles.doneTitle}>Dispute Submitted</p>
            <p className={styles.doneSub}>Our team will review your case within 24 hours and notify you of the outcome.</p>
            <button className={styles.closeBtn} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={styles.title}>⚠️ Dispute Cancellation</span>
                {countdown
                  ? <span className={styles.countdown}>⏱ {countdown} remaining to dispute</span>
                  : <span className={styles.expired}>Dispute window expired</span>
                }
              </div>
              <button className={styles.closeX} onClick={onClose} aria-label="Close">✕</button>
            </div>

            {/* Auto-filled ride details */}
            <div className={styles.detailsCard}>
              <p className={styles.detailsLabel}>Cancellation Details</p>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Booking ID</span>
                <span className={styles.detailVal}>{ride.id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Submitted by</span>
                <span className={styles.detailVal}>{userName ?? userId}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Driver</span>
                <span className={styles.detailVal}>{ride.driver_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Vehicle type</span>
                <span className={styles.detailVal}>{ride.driver_type === 'car_taxi' ? '🚗 Car' : '🛵 Bike'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Pickup</span>
                <span className={styles.detailVal}>{ride.pickup_location ?? '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Dropoff</span>
                <span className={styles.detailVal}>{ride.dropoff_location ?? '—'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Date</span>
                <span className={styles.detailVal}>
                  {new Date(ride.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Your explanation <span className={styles.required}>*</span></label>
              <textarea
                className={styles.textarea}
                placeholder="Explain what happened with this cancellation… (max 200 characters)"
                maxLength={200}
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                rows={4}
                disabled={!countdown}
              />
              <span className={styles.charCount}>{explanation.length} / 200</span>
            </div>

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!explanation.trim() || sending || !countdown}
            >
              {sending ? 'Submitting…' : 'Submit Dispute'}
            </button>

            <p className={styles.note}>
              False or abusive disputes may result in account review. Disputes cap at 3 per month.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
