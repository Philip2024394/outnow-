import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { activityEmoji } from '@/firebase/collections'
import { DEMO_LIKED_USERS } from '@/demo/mockData'
import styles from './NotificationsScreen.module.css'

function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Notification type → emoji
const NOTIF_EMOJI = {
  match:   '🔥',
  like:    '❤️',
  wave:    '👋',
  gift:    '🎁',
  otw:     '🚶',
  system:  '🛡️',
  digest:  '📅',
}

export const DEMO_UNREAD_COUNT = 2

export default function NotificationsScreen({ onClose }) {
  const { notifications, profileViews, unreadCount, markAllRead } = useNotifications()

  // Use real notifications if available, otherwise show demo placeholders
  const hasRealNotifs = notifications.length > 0
  const hasRealViews  = profileViews.length > 0

  const unread  = (hasRealNotifs ? notifications : []).filter(n => !n.read)
  const earlier = (hasRealNotifs ? notifications : []).filter(n => n.read)

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {unreadCount > 0 && (
          <span
            className={styles.unreadBadge}
            onClick={markAllRead}
            style={{ cursor: 'pointer' }}
          >
            {unreadCount} new
          </span>
        )}
        <button className={styles.homeBtn} onClick={onClose} aria-label="Go to map">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 21 9 12 15 12 15 21"/>
          </svg>
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statChip}>
          <span className={styles.statNum}>{profileViews.length || '—'}</span>
          <span className={styles.statMeta}>Profile Views</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{notifications.filter(n => n.type === 'like').length || '—'}</span>
          <span className={styles.statMeta}>Likes Received</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{notifications.filter(n => n.type === 'match').length || '—'}</span>
          <span className={styles.statMeta}>Matches</span>
        </div>
      </div>

      <div className={styles.scroll}>

        {/* ── LIKED YOU — real interests/likes from Supabase (demo fallback) ── */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>❤️</span>
          <span className={styles.sectionTitle}>Liked You This Week</span>
          <span className={styles.sectionCount}>{DEMO_LIKED_USERS.length}</span>
        </div>
        {DEMO_LIKED_USERS.map(u => (
          <LikedCard key={u.id} user={u} />
        ))}

        {/* ── WHO VIEWED YOUR PROFILE ── */}
        {(hasRealViews ? profileViews : []).length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>👁️</span>
              <span className={styles.sectionTitle}>Who Viewed Your Profile</span>
              <span className={styles.sectionCount}>{profileViews.length}</span>
            </div>
            {profileViews.map(v => (
              <ViewerCard key={v.id} viewer={v} />
            ))}
          </>
        )}

        {/* ── NEW NOTIFICATIONS ── */}
        {unread.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔴</span>
              <span className={styles.sectionTitle}>New</span>
              <span className={styles.sectionCount}>{unread.length}</span>
            </div>
            {unread.map(n => (
              <NotifRow key={n.id} notif={n} />
            ))}
          </>
        )}

        {/* ── EARLIER ── */}
        {earlier.length > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🕐</span>
              <span className={styles.sectionTitle}>Earlier</span>
            </div>
            {earlier.map(n => (
              <NotifRow key={n.id} notif={n} />
            ))}
          </>
        )}

        {/* Empty state when no Supabase data yet */}
        {!hasRealNotifs && (
          <div className={styles.sectionHeader} style={{ opacity: 0.5, justifyContent: 'center' }}>
            <span className={styles.sectionTitle}>No notifications yet — get out there! 🌆</span>
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Liked card ── */
function LikedCard({ user }) {
  const [liked, setLiked] = useState(false)
  return (
    <div className={styles.viewerCard}>
      <div className={styles.viewerAvatar}>
        {user.emoji ?? user.displayName?.[0]?.toUpperCase()}
        {user.online && <span className={styles.onlineDot} />}
      </div>
      <div className={styles.viewerBody}>
        <div className={styles.viewerTop}>
          <span className={styles.viewerName}>{user.displayName}</span>
          <span className={styles.viewerAge}>{user.age}</span>
          {user.online
            ? <span className={styles.onlinePill}>● Online</span>
            : <span className={styles.timePill}>{timeAgo(user.likedAt)}</span>
          }
        </div>
        <span className={styles.viewerCity}>📍 {user.area}</span>
        <span className={styles.viewerViews}>
          {activityEmoji(user.activityType)} {user.tagline}
        </span>
      </div>
      <button
        className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
        onClick={() => setLiked(v => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {liked ? 'Liked' : 'Like'}
      </button>
    </div>
  )
}

/* ── Profile viewer card (real data) ── */
function ViewerCard({ viewer }) {
  return (
    <div className={styles.viewerCard}>
      <div className={styles.viewerAvatar}>
        {viewer.photoURL
          ? <img src={viewer.photoURL} alt={viewer.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : viewer.displayName?.[0]?.toUpperCase() ?? '?'
        }
      </div>
      <div className={styles.viewerBody}>
        <div className={styles.viewerTop}>
          <span className={styles.viewerName}>{viewer.displayName}</span>
          {viewer.age && <span className={styles.viewerAge}>{viewer.age}</span>}
        </div>
        {viewer.city && <span className={styles.viewerCity}>📍 {viewer.city}</span>}
        <span className={styles.viewerViews}>{timeAgo(viewer.createdAt)}</span>
      </div>
    </div>
  )
}

/* ── Notification row (real Supabase data) ── */
function NotifRow({ notif }) {
  return (
    <div className={`${styles.row} ${!notif.read ? styles.rowUnread : ''}`}>
      <div className={`${styles.rowEmoji} ${!notif.read ? styles.rowEmojiUnread : ''}`}>
        {NOTIF_EMOJI[notif.type] ?? '🔔'}
      </div>
      <div className={styles.rowText}>
        <span className={styles.rowTitle}>{notif.title}</span>
        {notif.body && <span className={styles.rowBody}>{notif.body}</span>}
        <span className={styles.rowTime}>{timeAgo(notif.createdAt)}</span>
      </div>
      {!notif.read && <span className={styles.dot} />}
    </div>
  )
}
