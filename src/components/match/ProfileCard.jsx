import { useState } from 'react'
import styles from './ProfileCard.module.css'

const MEET_SPEED_COLOR = {
  'Meet now': '#39FF14',
  'Today':    '#FF6B35',
  'This week':'#A855F7',
}

export default function ProfileCard({ profile, onLike }) {
  const [liked, setLiked] = useState(profile.liked)
  const [popping, setPopping] = useState(false)

  const handleLike = (e) => {
    e.stopPropagation()
    if (liked) return
    setLiked(true)
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
    onLike?.(profile.id)
  }

  return (
    <div className={styles.card}>
      {/* Photo */}
      <div className={styles.photoWrap}>
        {profile.photoURL
          ? <img src={profile.photoURL} alt={profile.displayName} className={styles.photo} />
          : <div className={styles.photoFallback}>{profile.emoji}</div>
        }

        {/* Gradient overlay */}
        <div className={styles.photoGradient} />

        {/* Name + age over photo */}
        <div className={styles.photoMeta}>
          <span className={styles.photoName}>{profile.displayName}, {profile.age}</span>
          <span className={styles.photoArea}>📍 {profile.area}</span>
        </div>

        {/* Online dot */}
        {profile.online
          ? <span className={styles.onlineDot} />
          : <span className={styles.offlineDot} />
        }

        {/* Verified */}
        {profile.verified && <span className={styles.verifiedBadge}>✔</span>}
      </div>

      {/* Card body */}
      <div className={styles.body}>
        {/* Distance + status */}
        <div className={styles.distanceRow}>
          <span className={styles.distance}>{profile.distanceKm} km away</span>
          {profile.readyToMeet && (
            <span className={styles.readyBadge}>🚶 Ready to meet</span>
          )}
        </div>

        {/* Tagline */}
        <p className={styles.tagline}>{profile.tagline}</p>

        {/* Intent chips */}
        <div className={styles.chips}>
          <span className={styles.chip}>{profile.lookingFor}</span>
          <span className={styles.chip}>{profile.availability}</span>
          <span
            className={styles.chip}
            style={{ borderColor: MEET_SPEED_COLOR[profile.meetSpeed], color: MEET_SPEED_COLOR[profile.meetSpeed] }}
          >
            ⚡ {profile.meetSpeed}
          </span>
        </div>

        {/* First meet icons */}
        <div className={styles.meetRow}>
          {profile.firstMeet.map(m => (
            <span key={m} className={styles.meetChip}>{meetEmoji(m)} {m}</span>
          ))}
        </div>

        {/* Response time */}
        <div className={styles.meta}>
          <span className={styles.metaItem}>⚡ {profile.responseTime}</span>
        </div>
      </div>

      {/* Like button */}
      <button
        className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''} ${popping ? styles.likeBtnPop : ''}`}
        onClick={handleLike}
        aria-label="Like"
      >
        <svg width="22" height="22" viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    </div>
  )
}

function meetEmoji(type) {
  const map = { Coffee: '☕', Walk: '🚶', Drinks: '🍺', Dinner: '🍽️' }
  return map[type] ?? '📍'
}
