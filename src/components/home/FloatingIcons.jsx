import { useState } from 'react'
import ActivityProfileGrid from './ActivityProfileGrid'
import styles from './FloatingIcons.module.css'

const ICONS = [
  // Left column (top → bottom)
  { id: 'drinks',       emoji: '🍺', label: 'Drinks'   },
  { id: 'food',         emoji: '🍕', label: 'Food',    img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsasdfsdf-removebg-preview.png', bare: true },
  { id: 'coffee',       emoji: '☕', label: 'Coffee',  img: 'https://ik.imagekit.io/nepgaxllc/Untitleddfsds-removebg-preview.png', bare: true },
  { id: 'gym',          emoji: '🏋️', label: 'Gym',    img: 'https://ik.imagekit.io/nepgaxllc/Untitleddfgsdfgd-removebg-preview.png', bare: true },
  { id: 'walk',         emoji: '🚶', label: 'Walk'     },
  { id: 'karaoke',      emoji: '🎤', label: 'Karaoke'  },
  // Right column (top → bottom)
  { id: 'brunch',       emoji: '🥂', label: 'Brunch'   },
  { id: 'cycling',      emoji: '🚴', label: 'Cycling'  },
  { id: 'beach',        emoji: '🏖️', label: 'Beach'   },
  { id: 'gaming_night', emoji: '🎮', label: 'Gaming',  img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsd-removebg-preview.png', bare: true },
  { id: 'yoga',         emoji: '🧘', label: 'Yoga'     },
  { id: 'travel',       emoji: '✈️', label: 'Travel'  },
]

// Each icon gets a unique slow-bob animation offset so they don't all move in sync
const OFFSETS = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 0.2, 0.6, 1.0, 1.4, 1.8, 2.2]

export default function FloatingIcons({ sessions = [], onSelectSession }) {
  const [activeActivity, setActiveActivity] = useState(null)

  const left  = ICONS.slice(0, 6)
  const right = ICONS.slice(6, 12)

  return (
    <>
      <div className={styles.root}>
        {/* Left column */}
        <div className={styles.column}>
          {left.map((icon, i) => (
            <IconBubble
              key={icon.id}
              icon={icon}
              delay={OFFSETS[i]}
              count={sessions.filter(s => s.activityType === icon.id || (s.activities ?? []).includes(icon.id)).length}
              onClick={() => setActiveActivity(icon)}
            />
          ))}
        </div>

        {/* Right column */}
        <div className={styles.column}>
          {right.map((icon, i) => (
            <IconBubble
              key={icon.id}
              icon={icon}
              delay={OFFSETS[i + 6]}
              count={sessions.filter(s => s.activityType === icon.id || (s.activities ?? []).includes(icon.id)).length}
              onClick={() => setActiveActivity(icon)}
            />
          ))}
        </div>
      </div>

      {/* Profile grid sheet */}
      <ActivityProfileGrid
        open={!!activeActivity}
        activity={activeActivity}
        sessions={sessions.filter(s =>
          activeActivity &&
          (s.activityType === activeActivity.id || (s.activities ?? []).includes(activeActivity.id))
        )}
        onClose={() => setActiveActivity(null)}
        onSelectSession={(s) => { setActiveActivity(null); onSelectSession?.(s) }}
      />
    </>
  )
}

function IconBubble({ icon, delay, count, onClick }) {
  if (icon.bare) {
    return (
      <button
        className={styles.bareBubble}
        style={{ animationDelay: `${delay}s` }}
        onClick={onClick}
        aria-label={icon.label}
      >
        {icon.img
          ? <img src={icon.img} alt={icon.label} className={styles.iconImgBare} />
          : <span className={styles.emojiBare}>{icon.emoji}</span>
        }
        <span className={styles.bareLabel}>{icon.label}</span>
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>
    )
  }

  return (
    <button
      className={styles.bubble}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
      aria-label={icon.label}
    >
      {icon.img
        ? <img src={icon.img} alt={icon.label} className={styles.iconImg} />
        : <span className={styles.emoji}>{icon.emoji}</span>
      }
      <span className={styles.label}>{icon.label}</span>
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </button>
  )
}
