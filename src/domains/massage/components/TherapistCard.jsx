/**
 * TherapistCard — Compact glass browse card.
 * Photo left, info right, ~300px height.
 * Green dot = online, orange dot = busy/offline.
 * Tap card → full profile. Book Now → booking flow.
 */
import styles from './TherapistCard.module.css'

function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${(n / 1000).toFixed(0)}k`
}

export default function TherapistCard({ therapist, onBookNow, onMenu, onTap }) {
  const isOnline = therapist.status === 'Available' && therapist.isLive
  const isBusy = therapist.status === 'Busy' || therapist.status === 'Offline'
  const startingPrice = Math.min(
    therapist.price60 || 999999,
    therapist.price90 || 999999,
    therapist.price120 || 999999,
  )
  const massageTypes = Array.isArray(therapist.massageTypes)
    ? therapist.massageTypes.slice(0, 3)
    : []

  return (
    <div className={styles.card} onClick={() => onTap?.(therapist)}>

      {/* Photo with status dot */}
      <div className={styles.photoWrap}>
        <img
          src={therapist.profileImage || therapist.profilePicture || '/default-avatar.jpg'}
          alt={therapist.name}
          className={styles.photo}
          loading="lazy"
          onError={(e) => { e.target.src = '/default-avatar.jpg' }}
        />
        <div className={`${styles.statusDot} ${isOnline ? styles.dotOnline : styles.dotBusy}`} />
      </div>

      {/* Info */}
      <div className={styles.info}>
        {/* Name + verified */}
        <div className={styles.nameRow}>
          <span className={styles.name}>{therapist.name}</span>
          {therapist.isVerified && (
            <svg className={styles.verifiedIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
            </svg>
          )}
        </div>

        {/* Location */}
        <div className={styles.locationRow}>
          <svg className={styles.locationPin} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {therapist.area || therapist.location || 'Yogyakarta'}
        </div>

        {/* Specialties — max 3 chips */}
        {massageTypes.length > 0 && (
          <div className={styles.specialties}>
            {massageTypes.map(t => (
              <span key={t} className={styles.specChip}>{t}</span>
            ))}
          </div>
        )}

        {/* Bio — 3 lines */}
        {therapist.description && (
          <p className={styles.bio}>{therapist.description}</p>
        )}

        {/* Rating */}
        <div className={styles.ratingRow}>
          <svg className={styles.ratingStar} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className={styles.ratingVal}>{therapist.rating?.toFixed(1) || '4.8'}</span>
          <span className={styles.ratingCount}>({therapist.reviewCount || 0})</span>
        </div>

        {/* Pricing — 60 / 90 / 120 min */}
        <div className={styles.pricingRow}>
          <div className={styles.priceBox}>
            <span className={styles.priceDur}>60min</span>
            <span className={styles.priceVal}>{fmtPrice(therapist.price60)}</span>
          </div>
          <div className={styles.priceBox}>
            <span className={styles.priceDur}>90min</span>
            <span className={styles.priceVal}>{fmtPrice(therapist.price90)}</span>
          </div>
          <div className={styles.priceBox}>
            <span className={styles.priceDur}>120min</span>
            <span className={styles.priceVal}>{fmtPrice(therapist.price120)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button className={styles.bookBtn} onClick={(e) => { e.stopPropagation(); onBookNow?.(therapist) }}>
            Book Now
          </button>
          <button className={styles.menuBtn} onClick={(e) => { e.stopPropagation(); onMenu?.(therapist) }}>
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}
