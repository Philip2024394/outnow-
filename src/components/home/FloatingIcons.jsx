import { useState } from 'react'
import ActivityProfileGrid from './ActivityProfileGrid'
import styles from './FloatingIcons.module.css'

const ICONS = [
  // Left column (top → bottom)
  { id: 'bike_ride', label: 'Bike Ride', img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', bare: true, vehicle: true },
  { id: 'food',      label: 'Food',      img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsasdfsdf-removebg-preview.png', bare: true },
  { id: 'coffee',    label: 'Coffee',    img: 'https://ik.imagekit.io/nepgaxllc/Untitleddfsds-removebg-preview.png', bare: true },
  // Right column (top → bottom)
  { id: 'car_taxi',  label: 'Car Taxi',  img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', bare: true, vehicle: true },
  { id: 'shopping',  label: 'Shopping',  img: 'https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png', bare: true },
  { id: 'gaming_night', label: 'Gaming', img: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsd-removebg-preview.png', bare: true },
]

// Each icon gets a unique slow-bob animation offset
const OFFSETS = [0, 0.4, 0.8, 0.2, 0.6, 1.0]

export default function FloatingIcons({ sessions = [], onSelectSession, onFoodClick, onRideClick, onShoppingClick }) {
  const [activeActivity, setActiveActivity] = useState(null)

  const left  = ICONS.slice(0, 3)
  const right = ICONS.slice(3, 6)

  const handleIconClick = (icon) => {
    if (icon.id === 'food' && onFoodClick)                                    { onFoodClick();     return }
    if ((icon.id === 'bike_ride' || icon.id === 'car_taxi') && onRideClick)   { onRideClick();     return }
    if (icon.id === 'shopping' && onShoppingClick)                            { onShoppingClick(); return }
    setActiveActivity(icon)
  }

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
              onClick={() => handleIconClick(icon)}
            />
          ))}
        </div>

        {/* Right column */}
        <div className={styles.column}>
          {right.map((icon, i) => (
            <IconBubble
              key={icon.id}
              icon={icon}
              delay={OFFSETS[i + 3]}
              count={sessions.filter(s => s.activityType === icon.id || (s.activities ?? []).includes(icon.id)).length}
              onClick={() => handleIconClick(icon)}
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
          ? <img src={icon.img} alt={icon.label} className={icon.vehicle ? styles.iconImgVehicle : styles.iconImgBare} />
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
