import styles from './MapOverlay.module.css'

export default function MapOverlay({ isLive, sessionTimeLeft }) {
  return (
    <div className={styles.overlay}>
      {isLive && sessionTimeLeft != null && (
        <div className={styles.timerBadge}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerText}>{formatTime(sessionTimeLeft)}</span>
        </div>
      )}
    </div>
  )
}

function formatTime(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
