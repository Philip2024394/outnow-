import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMySpot } from '@/services/spotService'
import styles from './MySpotScreen.module.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MySpotScreen({ open, onClose, onClaimSpot }) {
  const { user } = useAuth()
  const [spot, setSpot]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getMySpot(user?.id)
      .then(s => setSpot(s))
      .catch(() => setSpot(null))
      .finally(() => setLoading(false))
  }, [open, user?.id])

  if (!open) return null

  const isActive  = spot?.status === 'active'
  const isPending = spot?.status === 'pending'

  return (
    <div className={styles.screen}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.topTitle}>My Map Spot</span>
      </div>

      {loading && (
        <div className={styles.claimPrompt}>
          <div className={styles.claimIcon}>⏳</div>
        </div>
      )}

      {/* Has a spot */}
      {!loading && spot && (
        <>
          {/* Map preview */}
          <div className={styles.mapPreview}>
            <div className={styles.mapGrid} />
            <div className={styles.mapPlaceholder}>
              <div className={styles.mapPin}>📍</div>
              <div className={styles.mapPostcode}>{spot.postcode}</div>
              <div className={styles.mapLabel}>Your claimed location</div>
            </div>
            <div className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusPending}`}>
              <span className={styles.statusDot} />
              {isActive ? 'Active' : 'Pending Review'}
            </div>
          </div>

          {/* Pending notice */}
          {isPending && (
            <div className={styles.pendingNotice}>
              <p className={styles.pendingNoticeTitle}>Under review — your spot is live</p>
              <p className={styles.pendingNoticeSub}>
                Your pin is visible on the map now. Our team will verify your spot within 72 hours. No action needed.
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className={styles.infoRow}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Spot type</div>
              <div className={styles.infoValue}>{spot.type === 'spot_business' ? '🏪' : '👤'}</div>
              <div className={styles.infoSub}>{spot.type === 'spot_business' ? 'Business' : 'Personal'}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Claimed</div>
              <div className={styles.infoValue} style={{ fontSize: 13, marginTop: 4 }}>{formatDate(spot.claimed_at)}</div>
            </div>
          </div>

          {/* Details */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Spot details</div>
            <div className={styles.detailCard}>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Postcode</span>
                <span className={`${styles.detailVal} ${styles.detailValOrange}`}>{spot.postcode}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Status</span>
                <span className={styles.detailVal}>{isActive ? '✅ Verified' : '🕐 Pending'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Exclusivity</span>
                <span className={styles.detailVal}>100% — no one else can claim this</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Visibility</span>
                <span className={styles.detailVal}>Live on map now</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Billing</span>
                <span className={styles.detailVal}>{spot.type === 'spot_business' ? '$1.99/month' : '$0.99/month'}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>What this means</div>
            <div className={styles.detailCard}>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Your postcode</span>
                <span className={styles.detailVal}>Permanently reserved</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>If you cancel</span>
                <span className={styles.detailVal}>Spot becomes claimable again</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Protected zones</span>
                <span className={styles.detailVal}>Govt & royal buildings blocked</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No spot yet */}
      {!loading && !spot && (
        <div className={styles.claimPrompt}>
          <div className={styles.claimIcon}>📍</div>
          <h2 className={styles.claimTitle}>Own your postcode</h2>
          <p className={styles.claimSub}>
            Claim your location on the Hangger map. First come, first served — once it's yours, nobody can take it.
          </p>
          <button className={styles.claimBtn} onClick={onClaimSpot}>
            Claim your spot
          </button>
          <p className={styles.priceNote}>From $0.99/month · Cancel anytime</p>
        </div>
      )}

    </div>
  )
}
