import styles from './ProfileStrip.module.css'
import { activityEmoji } from '@/firebase/collections'

function fmtScheduled(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return (isToday ? '' : d.toLocaleDateString([], { weekday: 'short' }) + ' ') +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ProfileStrip({ sessions = [], selectedId, onSelect }) {
  if (sessions.length === 0) return null

  return (
    <div className={styles.strip}>
      <div className={styles.rail}>
        {sessions.map((s) => {
          const isSelected = s.id === selectedId
          return (
            <button
              key={s.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              onClick={() => onSelect?.(s)}
            >
              {/* Avatar */}
              <div className={`${styles.avatarWrap} ${isSelected ? styles.avatarSelected : ''}`}>
                {s.photoURL
                  ? <img src={s.photoURL} alt={s.displayName} className={styles.avatarImg} />
                  : <span className={styles.avatarEmoji}>
                      {s.displayName?.[0]?.toUpperCase() ?? '?'}
                    </span>
                }
                {/* Online / scheduled dot */}
                <span className={s.status === 'scheduled' ? styles.scheduledDot : styles.onlineDot} />
                {/* Activity badge */}
                <span className={styles.activityBadge}>{activityEmoji(s.activityType)}</span>
              </div>

              {/* Name */}
              <span className={`${styles.name} ${isSelected ? styles.nameSelected : ''}`}>
                {s.displayName?.split(' ')[0]}
              </span>

              {/* Area or scheduled time */}
              <span className={s.status === 'scheduled' ? styles.areaScheduled : styles.area}>
                {s.status === 'scheduled' ? fmtScheduled(s.scheduledFor) : (s.area ?? '')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
