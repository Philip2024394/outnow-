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

export default function ProfileStrip({ sessions = [], selectedId, onSelect, hideLive, hideScheduled, onToggleLive, onToggleScheduled, otwUserId = null }) {
  if (sessions.length === 0) return null

  return (
    <div className={styles.strip}>

      {/* Green — toggle Out Now profiles */}
      <button
        className={`${styles.sideBtn} ${hideLive ? styles.sideBtnOff : ''}`}
        onClick={onToggleLive}
        aria-label={hideLive ? 'Show Out Now' : 'Hide Out Now'}
      >
        <span className={`${styles.sideDot} ${hideLive ? styles.sideDotRed : styles.sideDotGreen}`} />
      </button>

      <div className={styles.rail}>
        {sessions.map((s) => {
          const isSelected = s.id === selectedId
          const isOtw = otwUserId && s.userId === otwUserId
          return (
            <button
              key={s.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              onClick={() => onSelect?.(s)}
            >
              {/* Avatar */}
              <div className={`${styles.avatarWrap} ${isOtw ? styles.avatarOtw : isSelected ? styles.avatarSelected : ''}`}>
                {s.photoURL
                  ? <img src={s.photoURL} alt={s.displayName} className={`${styles.avatarImg} ${isOtw ? styles.avatarImgOtw : ''}`} />
                  : <span className={styles.avatarEmoji}>
                      {s.displayName?.[0]?.toUpperCase() ?? '?'}
                    </span>
                }
                {/* Online / scheduled / OTW dot */}
                <span className={
                  isOtw ? styles.otwDot :
                  s.status === 'scheduled' ? styles.scheduledDot :
                  styles.onlineDot
                } />
                {/* Activity badge */}
                <span className={styles.activityBadge}>{activityEmoji(s.activityType)}</span>
                {/* OTW label */}
                {isOtw && <span className={styles.otwLabel}>OTW</span>}
              </div>

              {/* Name */}
              <span className={`${styles.name} ${isOtw ? styles.nameOtw : isSelected ? styles.nameSelected : ''}`}>
                {s.displayName?.split(' ')[0]}
              </span>

              {/* Area or scheduled time */}
              <span className={isOtw ? styles.areaOtw : s.status === 'scheduled' ? styles.areaScheduled : styles.area}>
                {isOtw ? 'On the way' : s.status === 'scheduled' ? fmtScheduled(s.scheduledFor) : (s.area ?? '')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orange — toggle Out Later profiles */}
      <button
        className={`${styles.sideBtn} ${hideScheduled ? styles.sideBtnOff : ''}`}
        onClick={onToggleScheduled}
        aria-label={hideScheduled ? 'Show Out Later' : 'Hide Out Later'}
      >
        <span className={`${styles.sideDot} ${hideScheduled ? styles.sideDotRed : styles.sideDotOrange}`} />
      </button>

    </div>
  )
}
