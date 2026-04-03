import { DEMO_LIKED_USERS } from '@/demo/mockData'
import { activityEmoji } from '@/firebase/collections'
import styles from './LikedMeScreen.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function LikedMeScreen({ onClose, likedUsers }) {
  const users = IS_DEMO ? DEMO_LIKED_USERS : (likedUsers ?? [])
  const onlineCount = users.filter(u => u.online).length
  const totalViews = users.reduce((sum, u) => sum + (u.viewCount ?? 0), 0)

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.headerAvatars}>
          {users.slice(0, 4).map((u, i) => (
            <div key={u.id} className={styles.headerAvatar} style={{ zIndex: 4 - i }}>
              {u.photoURL
                ? <img src={u.photoURL} alt={u.displayName} className={styles.headerAvatarImg} />
                : <span className={styles.headerAvatarInitial}>{u.displayName?.[0]?.toUpperCase()}</span>
              }
            </div>
          ))}
          {users.length > 4 && (
            <div className={`${styles.headerAvatar} ${styles.headerAvatarMore}`} style={{ zIndex: 0 }}>
              +{users.length - 4}
            </div>
          )}
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{users.length}</span>
          <span className={styles.statLabel}>Liked you</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBox}>
          <span className={styles.statNum}>{onlineCount}</span>
          <span className={styles.statLabel}>Online now</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBox}>
          <span className={styles.statNum}>{totalViews}</span>
          <span className={styles.statLabel}>Profile views</span>
        </div>
      </div>

      <p className={styles.sectionTitle}>This week</p>

      {/* Landscape profile cards */}
      <div className={styles.list}>
        {users.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💚</span>
            <p className={styles.emptyText}>No likes yet</p>
            <p className={styles.emptySub}>Go live to be discovered by people nearby</p>
          </div>
        )}

        {users.map(user => (
          <div key={user.id} className={styles.card}>
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName} className={styles.avatar} />
                : <div className={styles.avatarFallback}>{user.emoji ?? user.displayName?.[0]?.toUpperCase()}</div>
              }
              {user.online && <span className={styles.onlineDot} />}
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{user.displayName}</span>
                {user.age && <span className={styles.age}>{user.age}</span>}
                {user.online
                  ? <span className={styles.onlineBadge}>● Online</span>
                  : <span className={styles.timeBadge}>{timeAgo(user.likedAt)}</span>
                }
              </div>
              {user.tagline && <p className={styles.tagline}>{user.tagline}</p>}
              <div className={styles.metaRow}>
                <span className={styles.activityBadge}>
                  {activityEmoji(user.activityType)} {user.activityType}
                </span>
                <span className={styles.areaBadge}>📍 {user.area}</span>
              </div>
            </div>

            {/* View count */}
            <div className={styles.views}>
              <span className={styles.viewNum}>{user.viewCount ?? 0}</span>
              <span className={styles.viewLabel}>views</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
