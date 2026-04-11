/**
 * DriverWarningScreen
 *
 * Full-page formal warning shown to a driver after they decline or miss
 * a booking / food order. Driver must tap "I Understand" to dismiss.
 *
 * Props:
 *   warningType  'missed' | 'declined'   — controls headline copy
 *   onDismiss    () => void
 */
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
  const copy = COPY[warningType] ?? COPY.missed

  return (
    <div className={styles.screen}>
      {/* Background image with dark overlay */}
      <div className={styles.bg} />
      <div className={styles.overlay} />

      <div className={styles.content}>

        {/* ── Top badge ── */}
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>⚠️</span>
          {copy.badge}
        </div>

        {/* ── Headline ── */}
        <h1 className={styles.headline}>{copy.headline}</h1>
        <p className={styles.sub}>{copy.sub}</p>

        {/* ── Policy card ── */}
        <div className={styles.policyCard}>
          <p className={styles.policyTitle}>Official Notice from Head Office</p>

          <p className={styles.policyBody}>
            Missing or declining customer bookings is a direct violation of your
            <strong> Hangar Policy Agreement</strong>. Every missed or declined ride
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

        {/* ── Signature line ── */}
        <div className={styles.signatureLine}>
          <span className={styles.signatureIcon}>🏢</span>
          <div>
            <p className={styles.signatureName}>ImOutNow Management</p>
            <p className={styles.signatureTitle}>Head Office · Driver Operations</p>
          </div>
        </div>

        {/* ── Dismiss ── */}
        <button className={styles.dismissBtn} onClick={onDismiss}>
          I Understand — Continue
        </button>

        <p className={styles.footerNote}>
          This warning has been recorded on your driver profile.
        </p>

      </div>
    </div>
  )
}
