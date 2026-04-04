import { activityEmoji } from '@/firebase/collections'
import { lookingForText } from '@/utils/lookingForLabels'
import styles from './LikedProfilesScreen.module.css'

function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function LikedProfilesScreen({ onClose, likedProfiles = [], onRemove }) {
  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Liked Profiles</span>
          <span className={styles.headerCount}>{likedProfiles.length} saved</span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Empty state */}
      {likedProfiles.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🤍</span>
          <span className={styles.emptyTitle}>No liked profiles yet</span>
          <span className={styles.emptySub}>Tap the heart on any profile card to save them here</span>
        </div>
      )}

      {/* List */}
      <div className={styles.list}>
        {likedProfiles.map(profile => (
          <div key={profile.id} className={styles.card}>

            {/* Photo */}
            <div className={styles.photoWrap}>
              {profile.photoURL
                ? <img src={profile.photoURL} alt={profile.displayName} className={styles.photo} />
                : <div className={styles.photoInitial}>{profile.displayName?.[0]?.toUpperCase() ?? '?'}</div>
              }
              {profile.isVerified && (
                <div className={styles.verifiedDot}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{profile.displayName}{profile.age ? `, ${profile.age}` : ''}</span>
                <span className={styles.time}>{timeAgo(profile.likedAt)}</span>
              </div>
              {profile.area && (
                <span className={styles.area}>📍 {profile.area}{profile.city ? `, ${profile.city}` : ''}</span>
              )}
              {profile.activityType && (
                <span className={styles.activity}>
                  {activityEmoji(profile.activityType)} First Meet Preference
                </span>
              )}
              {profile.lookingFor && (
                <span className={styles.lookingFor}>{lookingForText(profile.lookingFor)}</span>
              )}
              {profile.bio && (
                <span className={styles.bio}>{profile.bio.slice(0, 80)}...</span>
              )}
            </div>

            {/* Remove */}
            <button
              className={styles.removeBtn}
              onClick={() => onRemove?.(profile.id)}
              aria-label="Remove"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>

          </div>
        ))}
      </div>

    </div>
  )
}
