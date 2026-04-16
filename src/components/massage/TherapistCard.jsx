/**
 * TherapistCard — listing card for massage therapists.
 * Same layout as massage app (1080 commits), converted to dark glass theme.
 * Structure: banner → location → profile → bio → specialties → pricing → buttons
 */
import { useState } from 'react'
import { fmtPrice } from '@/services/massageService'
import styles from './TherapistCard.module.css'

export default function TherapistCard({ therapist, onBook, onSchedule, onProfile }) {
  const [selectedPrice, setSelectedPrice] = useState(null) // '60' | '90' | '120'

  const statusClass = therapist.status === 'Available' ? styles.statusAvailable
    : therapist.status === 'Busy' ? styles.statusBusy : styles.statusOffline

  // Busy countdown
  let busyCountdown = null
  if (therapist.busyUntil) {
    const diff = new Date(therapist.busyUntil) - Date.now()
    if (diff > 0) {
      const mins = Math.floor(diff / 60000)
      busyCountdown = `${mins}m remaining`
    }
  }

  return (
    <div className={styles.card}>
      {/* Image banner */}
      <div className={styles.banner} onClick={() => onProfile?.(therapist)}>
        <img src={therapist.profileImage} alt={therapist.name} className={styles.bannerImg} />
        <div className={styles.bannerOverlay} />

        {/* Verified badge */}
        {therapist.isVerified && (
          <span className={styles.verifiedBadge}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Verified
          </span>
        )}

        {/* Rating */}
        <span className={styles.ratingBadge}>
          ★ {therapist.rating} <span style={{ opacity: 0.6 }}>({therapist.reviewCount})</span>
        </span>

        {/* Live indicator */}
        {therapist.isLive && (
          <span className={styles.bookingCount}>
            <span className={styles.liveDot} /> Online
          </span>
        )}
      </div>

      {/* Location — right aligned */}
      <div className={styles.location}>
        <span className={styles.locationCity}>
          <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {therapist.area}, {therapist.location}
        </span>
        <span className={styles.locationArea}>Serves {therapist.area} area</span>
      </div>

      {/* Profile name + status */}
      <div className={styles.profile}>
        <div className={styles.profileRow}>
          <span className={styles.profileName}>{therapist.name}</span>
          <span className={`${styles.statusBadge} ${statusClass}`}>{therapist.status}</span>
        </div>
        {busyCountdown && <span className={styles.countdown}>{busyCountdown}</span>}
      </div>

      {/* Client preferences */}
      <div className={styles.clientPref}>
        <span className={styles.clientPrefBold}>Accepts:</span> {therapist.clientPreferences}
      </div>

      {/* Bio */}
      <div className={styles.bio}>{therapist.description}</div>

      {/* Specialties */}
      <div className={styles.specialties}>
        {therapist.massageTypes.map(t => (
          <span key={t} className={styles.specChip}>{t}</span>
        ))}
      </div>

      {/* Languages */}
      <div className={styles.languages}>
        <span className={styles.langIcon}>🌐</span>
        <span className={styles.langText}>{therapist.languages.join(' · ')}</span>
      </div>

      {/* Pricing grid — 60 / 90 / 120 min */}
      <div className={styles.pricingGrid}>
        {['60', '90', '120'].map(dur => (
          <button
            key={dur}
            className={`${styles.priceBox} ${selectedPrice === dur ? styles.priceBoxSelected : ''}`}
            onClick={() => setSelectedPrice(selectedPrice === dur ? null : dur)}
          >
            <span className={styles.priceDuration}>{dur} min</span>
            <span className={styles.priceValue}>{fmtPrice(therapist[`price${dur}`])}</span>
          </button>
        ))}
      </div>

      {/* Action buttons — Book Now / Schedule / Prices */}
      <div className={styles.actions}>
        <button
          className={`${styles.bookBtn} ${selectedPrice ? styles.bookBtnFlash : ''}`}
          onClick={() => onBook?.(therapist, selectedPrice)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Book Now
        </button>
        <button className={styles.scheduleBtn} onClick={() => onSchedule?.(therapist)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Schedule
        </button>
        <button className={styles.pricesBtn} onClick={() => onProfile?.(therapist)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
