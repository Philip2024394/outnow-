/**
 * TherapistCard — EXACT layout from massage app (1080 commits)
 * Converted: white→dark glass, amber→green, TypeScript→JavaScript
 * Every section maps 1:1 to original TherapistCard.tsx + sub-components
 */
import { useState } from 'react'
import { fmtPrice } from '@/services/massageService'
import styles from './TherapistCard.module.css'

// Language flag mapping — exact copy from TherapistLanguages.tsx
const LANG_MAP = {
  english: { flag: '🇬🇧', name: 'EN' }, indonesian: { flag: '🇮🇩', name: 'ID' },
  mandarin: { flag: '🇨🇳', name: 'ZH' }, japanese: { flag: '🇯🇵', name: 'JP' },
  korean: { flag: '🇰🇷', name: 'KR' }, thai: { flag: '🇹🇭', name: 'TH' },
  french: { flag: '🇫🇷', name: 'FR' }, german: { flag: '🇩🇪', name: 'DE' },
  spanish: { flag: '🇪🇸', name: 'ES' }, javanese: { flag: '🇮🇩', name: 'JV' },
}

export default function TherapistCard({ therapist, onBook, onSchedule, onProfile, onShare }) {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(null)
  const [selectedPriceKey, setSelectedPriceKey] = useState(null)

  // Status helpers
  const isAvailable = therapist.status === 'Available'
  const isBusy = therapist.status === 'Busy'
  const isOffline = therapist.status === 'Offline'

  // Busy countdown
  let busyCountdown = null
  if (therapist.busyUntil) {
    const diff = new Date(therapist.busyUntil) - Date.now()
    if (diff > 0) {
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      busyCountdown = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
    }
  }

  const bookingsCount = therapist.bookingsCount || Math.floor(10 + (therapist.id?.charCodeAt?.(2) || 0) % 40)
  const displayRating = therapist.rating ? therapist.rating.toFixed(1) : null
  const displayImage = therapist.profileImage || therapist.mainImage || '/default-avatar.jpg'
  const treatments = Array.isArray(therapist.massageTypes) ? therapist.massageTypes.join(', ') : 'Traditional, Deep Tissue'
  const languages = Array.isArray(therapist.languages) ? therapist.languages : ['Indonesian']

  // Pricing — same structure as massage app: 60/90/120
  const pricing = {
    60: therapist.price60 || 0,
    90: therapist.price90 || 0,
    120: therapist.price120 || 0,
  }
  const serviceName = therapist.massageTypes?.[0] || 'Traditional Massage'

  const ROWS = [
    { label: '60min', key: '60' },
    { label: '90min', key: '90' },
    { label: '120min', key: '120' },
  ]

  return (
    <div className={styles.card}>

      {/* ══════════════════════════════════════════════
       * SECTION 1: TherapistCardHeader
       * Was: 16/9 banner with rating, orders, share
       * ══════════════════════════════════════════════ */}
      <div className={styles.banner}>
        <div className={styles.bannerGrad}>
          <img
            src={displayImage}
            alt={`${therapist.name} cover`}
            className={styles.bannerImg}
            loading="eager"
          />
        </div>

        {/* Rating badge — top left */}
        {displayRating && (
          <div className={styles.ratingBadge}>
            <svg className={styles.ratingStar} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={styles.ratingText}>{displayRating}</span>
          </div>
        )}

        {/* Orders badge — top right */}
        {bookingsCount > 0 && (
          <div className={styles.ordersBadge}>{bookingsCount}+ Orders</div>
        )}

        {/* Share button — bottom right */}
        <button className={styles.shareBtn} onClick={() => onShare?.(therapist)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* ══════════════════════════════════════════════
       * SECTION 2: TherapistProfile
       * Was: overlapping profile pic + name + status
       * ══════════════════════════════════════════════ */}
      <div className={styles.profileWrap}>
        <div className={styles.profileRow}>
          <img
            src={therapist.profileImage || '/default-avatar.jpg'}
            alt={`${therapist.name} profile`}
            className={styles.profilePic}
          />
        </div>
      </div>

      {/* Name + status — offset 75px from left (matching profile pic width) */}
      <div className={styles.nameWrap}>
        <div className={styles.nameInner}>
          <div className={styles.nameRow}>
            {therapist.isVerified && (
              <svg className={styles.verifiedIcon} viewBox="0 0 24 24" fill="#8DC63F">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
              </svg>
            )}
            <span className={styles.name}>{therapist.name}</span>
          </div>

          {/* Status badge with pulsing dots — exact animation from massage app */}
          <div className={styles.statusWrap}>
            <div className={`${styles.statusBadge} ${isAvailable ? styles.statusAvailable : isBusy ? styles.statusBusy : styles.statusOffline}`}>
              <span className={styles.dotWrap}>
                <span className={`${styles.dot} ${isAvailable ? styles.dotGreen : isBusy ? styles.dotYellow : ''}`} />
                {isAvailable && (
                  <>
                    <span className={styles.ring1} />
                    <span className={styles.ring2} />
                  </>
                )}
                {isBusy && <span className={styles.busyRing} />}
              </span>
              <span className={styles.statusText}>
                {isBusy && busyCountdown ? `Busy - Free in ${busyCountdown}` : therapist.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
       * SECTION 3: Client Preferences
       * Was: mx-4 mb-2, "Accepts: All"
       * ══════════════════════════════════════════════ */}
      <div className={styles.clientPref}>
        <span className={styles.clientPrefBold}>Accepts:</span> {therapist.clientPreferences || 'All'}
      </div>

      {/* ══════════════════════════════════════════════
       * SECTION 4: Bio
       * Was: bg-white/90 backdrop-blur-sm rounded-lg, line-clamp-6
       * ══════════════════════════════════════════════ */}
      <div className={styles.bio}>{therapist.description}</div>

      {/* ══════════════════════════════════════════════
       * SECTION 5: TherapistSpecialties
       * Was: "Treatments: Traditional, Deep Tissue..."
       * ══════════════════════════════════════════════ */}
      <div className={styles.treatments}>
        <p className={styles.treatmentsText}>
          <span className={styles.treatmentsBold}>Treatments:</span> {treatments}
        </p>
      </div>

      {/* ══════════════════════════════════════════════
       * SECTION 6: TherapistLanguages
       * Was: flag pills with 2-letter codes
       * ══════════════════════════════════════════════ */}
      <div className={styles.languages}>
        <h4 className={styles.langTitle}>Languages</h4>
        <div className={styles.langList}>
          {languages.slice(0, 3).map(lang => {
            const info = LANG_MAP[lang.toLowerCase()] || { flag: '🌐', name: lang.slice(0, 2).toUpperCase() }
            return (
              <span key={lang} className={styles.langPill}>
                <span className={styles.langFlag}>{info.flag}</span>
                <span className={styles.langCode}>{info.name}</span>
              </span>
            )
          })}
          {languages.length > 3 && (
            <span className={styles.langMore}>+{languages.length - 3}</span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
       * SECTION 7: TherapistPricingGrid
       * Was: orange-bordered card with image, 60/90/120 grid
       * ══════════════════════════════════════════════ */}
      {pricing[60] > 0 && pricing[90] > 0 && pricing[120] > 0 && (
        <div className={styles.pricingWrap}>
          <div className={styles.pricingHeader}>
            <h3 className={styles.pricingTitle}>
              <svg className={styles.pricingTitleIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              Trending Sessions
            </h3>
            <p className={styles.pricingSub}>Select window below and Book Now</p>
            <p className={styles.pricingServiceName}>{serviceName}</p>
          </div>

          <div
            className={`${styles.priceCard} ${styles.priceCardGlow} ${selectedPriceKey ? styles.priceCardSelected : ''}`}
            onClick={() => setSelectedPriceKey(selectedPriceKey ? null : '90')}
          >
            <div className={styles.priceCardInner}>
              {/* Thumbnail */}
              <div className={styles.priceThumb}>
                <img src={displayImage} alt="" className={styles.priceThumbImg} />
                {selectedPriceKey && (
                  <div className={styles.priceThumbOverlay}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 10V4m0 0L9 7m3-3l3 3"/><rect x="4" y="10" width="16" height="10" rx="2"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className={styles.priceCardBody}>
                <div className={styles.priceCardNameRow}>
                  <span className={styles.priceCardName}>{serviceName}</span>
                  <span className={styles.popularBadge}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                    Popular Choice
                  </span>
                </div>

                {/* Duration labels row */}
                <div className={styles.priceGridLabels}>
                  {ROWS.map(r => (
                    <span key={`l-${r.key}`} className={styles.priceGridLabel}>{r.label}</span>
                  ))}
                </div>

                {/* Price values row */}
                <div className={styles.priceGridValues}>
                  {ROWS.map(r => (
                    <span key={`v-${r.key}`} className={styles.priceGridValue}>{fmtPrice(pricing[r.key])}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Info button — top right */}
            <button className={styles.priceInfoBtn} onClick={e => { e.stopPropagation(); onProfile?.(therapist) }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <p className={styles.priceFooter}>Professional rates · Verified profile</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════
       * SECTION 8: Action Buttons
       * Was: Book Now / Schedule / Prices row
       * ══════════════════════════════════════════════ */}
      <div className={styles.actions}>
        <button
          className={`${styles.bookBtn} ${selectedPriceKey ? styles.bookBtnFlash : ''}`}
          onClick={() => onBook?.(therapist, selectedPriceKey ? Number(selectedPriceKey) : null)}
        >
          Book Now
        </button>
        <button className={styles.scheduleBtn} onClick={() => onSchedule?.(therapist)}>
          Schedule
        </button>
        <button className={styles.pricesBtn} onClick={() => onProfile?.(therapist)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </button>
      </div>

    </div>
  )
}
