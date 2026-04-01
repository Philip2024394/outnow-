import { useState } from 'react'
import { DEMO_LIKED_USERS } from '@/demo/mockData'
import { activityEmoji } from '@/firebase/collections'
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

const DEMO_VIEWS = [
  { id: 'v1', name: 'Ava Mitchell',  age: 26, city: 'Soho, London',         views: 3,  avatar: '👩',   youLiked: true  },
  { id: 'v2', name: 'Maya Patel',    age: 29, city: 'Shoreditch, London',   views: 1,  avatar: '👩‍🦱', youLiked: false },
  { id: 'v3', name: 'Jordan Lee',    age: 31, city: 'Brixton, London',      views: 2,  avatar: '🧑',   youLiked: true  },
  { id: 'v4', name: 'Priya Sharma',  age: 24, city: 'Notting Hill, London', views: 1,  avatar: '👩‍🦳', youLiked: false },
  { id: 'v5', name: 'Kai Thompson',  age: 28, city: 'Camden, London',       views: 4,  avatar: '🧔',   youLiked: false },
  { id: 'v6', name: 'Zara Ahmed',    age: 27, city: 'Hackney, London',      views: 1,  avatar: '👩‍🦰', youLiked: true  },
]

const DEMO_NOTIFS = [
  {
    id: 'n1',
    type: 'like',
    emoji: '❤️',
    title: 'Ava liked your profile',
    body: "She's out in Soho right now",
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'match',
    emoji: '🔥',
    title: 'You matched with Jordan!',
    body: "You both liked each other — you're both out right now",
    time: '18 min ago',
    unread: true,
  },
  {
    id: 'n4',
    type: 'otw',
    emoji: '🚶',
    title: 'Kai is on the way',
    body: 'He accepted your OTW request',
    time: '1 hr ago',
    unread: false,
  },
  {
    id: 'n5',
    type: 'like',
    emoji: '❤️',
    title: 'Priya liked your profile',
    body: "She's out in Notting Hill",
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'n6',
    type: 'digest',
    emoji: '📅',
    title: 'Weekend Digest',
    body: '8 people are out near you this weekend',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'n7',
    type: 'system',
    emoji: '🛡️',
    title: 'Safety reminder',
    body: 'Always meet in a public place. Trust your instincts.',
    time: '3 days ago',
    unread: false,
  },
]

export const DEMO_UNREAD_COUNT = DEMO_NOTIFS.filter(n => n.unread).length

const TOTAL_VIEWS   = DEMO_VIEWS.reduce((s, v) => s + v.views, 0)
const TOTAL_LIKES   = 6
const TOTAL_MATCHES = 2

export default function NotificationsScreen({ onClose }) {
  const [views, setViews] = useState(DEMO_VIEWS)
  const unreadCount = DEMO_NOTIFS.filter(n => n.unread).length

  const toggleLike = (id) => {
    setViews(prev => prev.map(v => v.id === id ? { ...v, youLiked: !v.youLiked } : v))
  }

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount} new</span>
        )}
        <button className={styles.homeBtn} onClick={onClose} aria-label="Go to map">
          {/* Home icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 21 9 12 15 12 15 21"/>
          </svg>
        </button>
      </div>

      {/* ── Stats strip — directly under header ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statChip}>
          <span className={styles.statNum}>{TOTAL_VIEWS}</span>
          <span className={styles.statMeta}>Profile Views</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{TOTAL_LIKES}</span>
          <span className={styles.statMeta}>Likes Received</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statChip}>
          <span className={styles.statNum}>{TOTAL_MATCHES}</span>
          <span className={styles.statMeta}>Matches</span>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className={styles.scroll}>

        {/* ── LIKED YOU THIS WEEK ── */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>❤️</span>
          <span className={styles.sectionTitle}>Liked You This Week</span>
          <span className={styles.sectionCount}>{DEMO_LIKED_USERS.length}</span>
        </div>
        {DEMO_LIKED_USERS.map(u => (
          <LikedCard key={u.id} user={u} />
        ))}

        {/* ── WHO VIEWED YOUR PROFILE ── */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>👁️</span>
          <span className={styles.sectionTitle}>Who Viewed Your Profile</span>
          <span className={styles.sectionCount}>{views.length}</span>
        </div>
        {views.map(v => (
          <ViewerCard key={v.id} viewer={v} onToggleLike={toggleLike} />
        ))}

        {/* ── NEW NOTIFICATIONS ── */}
        {unreadCount > 0 && (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔴</span>
              <span className={styles.sectionTitle}>New</span>
              <span className={styles.sectionCount}>{unreadCount}</span>
            </div>
            {DEMO_NOTIFS.filter(n => n.unread).map(n => (
              <NotifRow key={n.id} notif={n} />
            ))}
          </>
        )}

        {/* ── EARLIER ── */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🕐</span>
          <span className={styles.sectionTitle}>Earlier</span>
        </div>
        {DEMO_NOTIFS.filter(n => !n.unread).map(n => (
          <NotifRow key={n.id} notif={n} />
        ))}

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
        aria-label={liked ? 'Unlike' : 'Like back'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {liked ? 'Liked' : 'Like'}
      </button>
    </div>
  )
}

/* ── Landscape viewer card ── */
function ViewerCard({ viewer, onToggleLike }) {
  return (
    <div className={styles.viewerCard}>
      <div className={styles.viewerAvatar}>{viewer.avatar}</div>
      <div className={styles.viewerBody}>
        <div className={styles.viewerTop}>
          <span className={styles.viewerName}>{viewer.name}</span>
          <span className={styles.viewerAge}>{viewer.age}</span>
        </div>
        <span className={styles.viewerCity}>📍 {viewer.city}</span>
        <span className={styles.viewerViews}>
          Viewed your profile {viewer.views} {viewer.views === 1 ? 'time' : 'times'}
        </span>
      </div>
      <button
        className={`${styles.likeBtn} ${viewer.youLiked ? styles.likeBtnActive : ''}`}
        onClick={() => onToggleLike(viewer.id)}
        aria-label={viewer.youLiked ? 'Unlike' : 'Like'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={viewer.youLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {viewer.youLiked ? 'Liked' : 'Like'}
      </button>
    </div>
  )
}

/* ── Notification row ── */
function NotifRow({ notif }) {
  return (
    <div className={`${styles.row} ${notif.unread ? styles.rowUnread : ''}`}>
      <div className={`${styles.rowEmoji} ${notif.unread ? styles.rowEmojiUnread : ''}`}>
        {notif.emoji}
      </div>
      <div className={styles.rowText}>
        <span className={styles.rowTitle}>{notif.title}</span>
        <span className={styles.rowBody}>{notif.body}</span>
        <span className={styles.rowTime}>{notif.time}</span>
      </div>
      {notif.unread && <span className={styles.dot} />}
    </div>
  )
}
