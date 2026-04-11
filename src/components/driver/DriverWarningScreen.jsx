/**
 * DriverWarningScreen
 *
 * Two-phase full-page warning after a driver declines or misses a booking.
 *
 * Phase 1 — "lobby": full-screen office image, badge, "Enter Office" button
 * Phase 2 — "warning": policy text, signature, "I Understand" dismiss
 *
 * Props:
 *   warningType  'missed' | 'declined'
 *   onDismiss    () => void
 */
import { useState } from 'react'
import styles from './DriverWarningScreen.module.css'

const COPY = {
  missed: {
    badge:    'MISSED BOOKING',
    headline: 'Warning Issued',
    sub:      'You missed a customer request.',
  },
  declined: {
    badge:    'BOOKING DECLINED',
    headline: 'Warning Issued',
    sub:      'You declined a customer request.',
  },
}

export default function DriverWarningScreen({ warningType = 'missed', onDismiss }) {
  const [phase, setPhase] = useState('lobby')
  const copy = COPY[warningType] ?? COPY.missed

  return (
    <div className={styles.screen}>
      <div className={styles.bg} />

      {/* ── PHASE 1: Lobby — image + Enter Office ── */}
      {phase === 'lobby' && (
        <>
          <div className={styles.overlayLight} />
          <div className={styles.lobbyContent}>
            <div className={styles.lobbyBottom}>
              <p className={styles.lobbyHint}>A message is waiting for you inside</p>
              <button
                className={styles.enterBtn}
                onClick={() => setPhase('warning')}
              >
                Enter Office
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── PHASE 2: Warning — policy text ── */}
      {phase === 'warning' && (
        <>
          <div className={styles.overlayDark} />
          <div className={styles.content}>

            <div className={styles.badge}>
              <span className={styles.badgeIcon}>⚠️</span>
              {copy.badge}
            </div>

            <h1 className={styles.headline}>{copy.headline}</h1>
            <p className={styles.sub}>{copy.sub}</p>

            <div className={styles.policyCard}>
              <p className={styles.policyTitle}>Official Notice from Head Office</p>

              <p className={styles.policyBody}>
                Missing or declining customer bookings is a direct violation of your
                <strong> Hangger Policy Agreement</strong>. Every missed or declined ride
                negatively impacts our customers and the quality of service we are
                committed to delivering.
              </p>

              <div className={styles.divider} />

              <p className={styles.policyBody}>
                Our management team has been notified and a <strong>written warning
                has been logged</strong> against your driver account. Continued violations
                may result in suspension or removal from the platform.
              </p>

              <div className={styles.divider} />

              <p className={styles.policyBody}>
                We request all drivers to abide by the strict rules outlined in your
                agreement. Please ensure you are available and responsive when you
                mark yourself as online.
              </p>
            </div>

            <div className={styles.signatureLine}>
              <span className={styles.signatureIcon}>🏢</span>
              <div>
                <p className={styles.signatureName}>Hangger Management</p>
                <p className={styles.signatureTitle}>Head Office · Driver Operations</p>
              </div>
            </div>

            <button className={styles.dismissBtn} onClick={onDismiss}>
              I Understand — Continue
            </button>

            <p className={styles.footerNote}>
              This warning has been recorded on your driver profile.
            </p>

          </div>
        </>
      )}
    </div>
  )
}
