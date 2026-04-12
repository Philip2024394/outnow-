/**
 * DriverTripEndSheet
 * Blocking sheet shown at trip end — driver MUST tap Complete or Cancelled
 * before the next order window opens.
 * Complete  → 10% commission recorded on fare
 * Cancelled → flagged for admin review (no commission)
 * No backdrop dismiss — driver cannot skip this screen.
 */
import { useState } from 'react'
import styles from './DriverTripEndSheet.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

const CANCEL_REASONS = [
  { id: 'no_show',         label: 'Passenger no-show' },
  { id: 'wrong_address',   label: 'Wrong / unreachable address' },
  { id: 'passenger_cancel',label: 'Passenger cancelled at pickup' },
  { id: 'safety',          label: 'Safety concern' },
  { id: 'other',           label: 'Other' },
]

export default function DriverTripEndSheet({ open, booking, onComplete, onCancelled, _forceStep, _forceDoneOutcome }) {
  const [step, setStep]         = useState(_forceStep ?? 'declare')   // 'declare' | 'cancel_reason' | 'done'
  const [reason, setReason]     = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome]   = useState(_forceDoneOutcome ?? null)   // 'complete' | 'cancelled'

  if (!open) return null

  const fare      = booking?.fare ?? 0
  const commission = Math.round(fare * 0.10)

  const handleComplete = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    setOutcome('complete')
    setStep('done')
    setSubmitting(false)
    onComplete?.({ bookingId: booking?.id, fare, commission })
  }

  const handleCancelSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    setOutcome('cancelled')
    setStep('done')
    setSubmitting(false)
    onCancelled?.({ bookingId: booking?.id, reason })
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* ── Declare step ── */}
        {step === 'declare' && (
          <>
            <div className={styles.header}>
              <span className={styles.headerTitle}>End of Trip</span>
              <span className={styles.headerSub}>Declare the outcome to unlock your next order</span>
            </div>

            <div className={styles.tripCard}>
              <div className={styles.tripRow}>
                <span className={styles.tripLabel}>Passenger</span>
                <span className={styles.tripValue}>{booking?.passenger?.display_name ?? 'Passenger'}</span>
              </div>
              <div className={styles.tripDivider} />
              <div className={styles.tripRow}>
                <span className={styles.tripLabel}>Pickup</span>
                <span className={styles.tripValue}>{booking?.pickup_location ?? '—'}</span>
              </div>
              <div className={styles.tripRow}>
                <span className={styles.tripLabel}>Drop-off</span>
                <span className={styles.tripValue}>{booking?.dropoff_location ?? '—'}</span>
              </div>
              <div className={styles.tripDivider} />
              <div className={styles.tripRow}>
                <span className={styles.tripLabel}>Fare</span>
                <span className={styles.tripFare}>{fmtRp(fare)}</span>
              </div>
              <div className={styles.commissionNote}>
                10% commission due at next sign-in: <strong>{fmtRp(commission)}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.btnComplete}
                onClick={handleComplete}
                disabled={submitting}
              >
                {submitting ? '⏳ Recording…' : '✓ Trip Complete'}
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setStep('cancel_reason')}
                disabled={submitting}
              >
                ✗ Not Placed / Cancelled
              </button>
            </div>

            <p className={styles.hint}>
              You cannot accept new orders until you declare this trip.
            </p>
          </>
        )}

        {/* ── Cancel reason step ── */}
        {step === 'cancel_reason' && (
          <>
            <div className={styles.header}>
              <span className={styles.headerTitle}>Why was the trip not placed?</span>
              <span className={styles.headerSub}>Select the reason — admin may verify via live map</span>
            </div>

            <div className={styles.reasonList}>
              {CANCEL_REASONS.map(r => (
                <button
                  key={r.id}
                  className={`${styles.reasonBtn} ${reason === r.id ? styles.reasonBtnSelected : ''}`}
                  onClick={() => setReason(r.id)}
                >
                  <div className={`${styles.reasonRadio} ${reason === r.id ? styles.reasonRadioSelected : ''}`} />
                  {r.label}
                </button>
              ))}
            </div>

            <div className={styles.reasonActions}>
              <button
                className={styles.btnSubmitCancel}
                onClick={handleCancelSubmit}
                disabled={!reason || submitting}
              >
                {submitting ? '⏳ Submitting…' : 'Submit & Continue'}
              </button>
              <button className={styles.btnBack} onClick={() => setStep('declare')}>
                Back
              </button>
            </div>
          </>
        )}

        {/* ── Done step ── */}
        {step === 'done' && (
          <div className={styles.doneState}>
            <span className={styles.doneIcon}>
              {outcome === 'complete' ? '✅' : '📋'}
            </span>
            <span className={styles.doneTitle}>
              {outcome === 'complete' ? 'Trip Recorded' : 'Cancellation Logged'}
            </span>
            <span className={styles.doneSub}>
              {outcome === 'complete'
                ? `Commission of ${fmtRp(commission)} added to your balance — due at next sign-in.`
                : 'Admin has been notified. No commission recorded for this trip.'}
            </span>
            {outcome === 'complete' && (
              <div className={styles.commPill}>
                💰 {fmtRp(commission)} due next shift
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
