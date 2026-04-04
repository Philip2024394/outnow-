import { formatDistance } from '@/utils/distance'
import styles from './ProfileCard.module.css'

export default function ProfileCard({ profile, onView }) {
  const firstName = profile.displayName?.split(' ')[0] ?? profile.displayName

  return (
    <div className={styles.card}>

      {/* Photo fills the card */}
      <div className={styles.photoWrap}>
        {profile.photoURL
          ? <img src={profile.photoURL} alt={firstName} className={styles.photo} />
          : <div className={styles.photoFallback}>{profile.emoji}</div>
        }

        {/* Distance — top right */}
        {formatDistance(profile.distanceKm) != null && (
          <span className={styles.distanceBadge}>{formatDistance(profile.distanceKm)}</span>
        )}

        {/* Online dot — top left */}
        {profile.online && <span className={styles.onlineDot} />}

        {/* Bottom gradient + name/city */}
        <div className={styles.gradient} />
        <div className={styles.meta}>
          <span className={styles.name}>{firstName}, {profile.age}</span>
          <span className={styles.city}>{profile.area}</span>
        </div>

        {/* Finger button — bottom right */}
        <button
          className={styles.viewBtn}
          onClick={() => onView?.(profile)}
          aria-label="View profile"
        >
          👆
        </button>
      </div>

    </div>
  )
}
