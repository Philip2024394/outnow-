/**
 * DriverWarningScreen
 *
 * 3-phase full-page flow after a driver declines or misses a booking.
 *
 * Phase 1 — lobby   : full office image + "Enter Office" button
 * Phase 2 — review  : driver profile card, stats, reviews, management note
 * Phase 3 — warning : formal policy text + "I Understand" dismiss
 *
 * Props:
 *   driverId     string
 *   warningType  'missed' | 'declined'
 *   onDismiss    () => void
 */
import { useState, useEffect } from 'react'
import { fetchDriverStats, buildManagementNote } from '@/services/driverStatsService'
import styles from './DriverWarningScreen.module.css'

const BADGE_COPY = {
  missed:   'MISSED BOOKING',
  declined: 'BOOKING DECLINED',
}

function Stars({ n }) {
  return (
    <span className={styles.stars}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#FBBF24' : 'rgba(255,255,255,0.2)' }}>★</span>
      ))}
    </span>
  )
}

function StatBox({ label, value, sub }) {
  return (
    <div className={styles.statBox}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  )
}

function RateBar({ label, value, max = 100, warn = 70, good = 80 }) {
  const pct   = Math.min(100, Math.max(0, (value / max) * 100))
  const color = value >= good ? '#8DC63F' : value >= warn ? '#FBBF24' : '#EF4444'
  return (
    <div className={styles.rateRow}>
      <div className={styles.rateTop}>
        <span className={styles.rateLabel}>{label}</span>
        <span className={styles.rateVal} style={{ color }}>{value}{max === 100 ? '%' : ''}</span>
      </div>
      <div className={styles.rateTrack}>
        <div className={styles.rateFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function DriverWarningScreen({ driverId, warningType = 'missed', onDismiss }) {
  const [phase, setPhase] = useState('lobby')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchDriverStats(driverId).then(setStats)
  }, [driverId])

  const badge   = BADGE_COPY[warningType] ?? BADGE_COPY.missed
  const profile = stats?.profile ?? {}
  const notes   = stats ? buildManagementNote(warningType, stats) : []

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className={styles.screen}>
      <div className={styles.bg} />

      {/* ══════════════════════════════════════════════
          PHASE 1 — LOBBY
      ══════════════════════════════════════════════ */}
      {phase === 'lobby' && (
        <>
          <div className={styles.overlayLight} />
          <div className={styles.lobbyContent}>
            <div className={styles.lobbyBottom}>
              <p className={styles.lobbyHint}>A message is waiting for you inside</p>
              <button className={styles.enterBtn} onClick={() => setPhase('review')}>
                Enter Office
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          PHASE 2 — PERFORMANCE REVIEW
      ══════════════════════════════════════════════ */}
      {phase === 'review' && (
        <>
          <div className={styles.overlayDark} />
          <div className={styles.content}>

            {/* Header */}
            <div className={styles.reviewHeader}>
              <p className={styles.reviewDate}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 className={styles.reviewTitle}>Performance Review</h2>
              <p className={styles.reviewSub}>Prepared by Hangger Driver Operations</p>
            </div>

            {/* Driver profile card */}
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.avatarWrap}>
                  {profile.photo_url
                    ? <img src={profile.photo_url} alt={profile.display_name} className={styles.avatarImg} />
                    : <span className={styles.avatarInitial}>{profile.display_name?.[0] ?? '?'}</span>
                  }
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{profile.display_name ?? '—'}</p>
                  <p className={styles.profileMeta}>
                    Age {profile.driver_age ?? '—'} &nbsp;·&nbsp; Member since {memberSince}
                  </p>
                  <p className={styles.profileMeta}>
                    {profile.driver_type === 'car_taxi' ? '🚗 Car' : '🏍️ Bike'}&nbsp;·&nbsp;
                    {profile.vehicle_model} {profile.vehicle_color ? `(${profile.vehicle_color})` : ''}
                  </p>
                  <p className={styles.profilePlate}>{profile.plate_prefix}</p>
                </div>
              </div>
              <div className={styles.profileRatingRow}>
                <Stars n={Math.round(profile.rating ?? 0)} />
                <span className={styles.profileRatingNum}>{(profile.rating ?? 0).toFixed(1)}</span>
                <span className={styles.profileTotalTrips}>{(profile.total_trips ?? 0).toLocaleString()} total trips</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              <StatBox label="Trips today"    value={stats?.tripsToday    ?? '—'} />
              <StatBox label="Trips this week" value={stats?.tripsThisWeek ?? '—'} />
              <StatBox label="Hrs online today" value={stats ? `${stats.hoursOnlineToday}h` : '—'} />
              <StatBox label="Hrs online week"  value={stats ? `${stats.hoursOnlineWeek}h`  : '—'} />
            </div>

            {/* Rate bars */}
            <div className={styles.ratesCard}>
              <p className={styles.sectionLabel}>Key Metrics</p>
              <RateBar label="Acceptance rate"   value={profile.acceptance_rate   ?? 100} warn={70} good={80} />
              <RateBar label="Rating score"      value={Math.round((profile.rating ?? 5) * 20)} warn={60} good={80} />
              <RateBar label="Cancellations"     value={Math.max(0, 100 - ((profile.cancellation_count ?? 0) * 10))} warn={60} good={80} />
            </div>

            {/* Recent reviews */}
            {stats?.reviews?.length > 0 && (
              <div className={styles.reviewsCard}>
                <p className={styles.sectionLabel}>Recent Passenger Feedback</p>
                {stats.reviews.map((r, i) => (
                  <div key={i} className={styles.reviewItem}>
                    <div className={styles.reviewTop}>
                      <Stars n={r.stars} />
                      <span className={styles.reviewerName}>{r.reviewer}</span>
                      <span className={styles.reviewDate2}>
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {r.comment && <p className={styles.reviewComment}>"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Management note */}
            <div className={styles.mgmtCard}>
              <p className={styles.sectionLabel}>Words from Management</p>
              {notes.map((line, i) => (
                <p key={i} className={styles.mgmtLine}>{line}</p>
              ))}
              <div className={styles.mgmtSignature}>
                <span className={styles.mgmtSigIcon}>🏢</span>
                <div>
                  <p className={styles.mgmtSigName}>Hangger Management</p>
                  <p className={styles.mgmtSigTitle}>Head Office · Driver Operations</p>
                </div>
              </div>
            </div>

            <button className={styles.continueBtn} onClick={() => setPhase('warning')}>
              Continue →
            </button>

          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          PHASE 3 — FORMAL WARNING
      ══════════════════════════════════════════════ */}
      {phase === 'warning' && (
        <>
          <div className={styles.overlayDark} />
          <div className={styles.content}>

            <div className={styles.badge}>
              <span className={styles.badgeIcon}>⚠️</span>
              {badge}
            </div>

            <h1 className={styles.headline}>Warning Issued</h1>
            <p className={styles.sub}>
              {warningType === 'missed' ? 'You missed a customer request.' : 'You declined a customer request.'}
            </p>

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
