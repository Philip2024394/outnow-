import styles from './MapOverlay.module.css'

export default function MapOverlay({ outNowCount = 0, onActivate, isLive, sessionTimeLeft }) {
  return (
    <div className={styles.overlay}>
      {/* Left — total out now */}
      <button className={styles.countBtn} aria-label="People out now">
        <span className={styles.countDot} />
        <span className={styles.countNum}>{outNowCount}</span>
        <span className={styles.countLabel}>out now</span>
      </button>

      {/* Right — session countdown (only when live) */}
      {isLive && sessionTimeLeft != null && (
        <div className={styles.timerBadge}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerText}>{formatTime(sessionTimeLeft)}</span>
        </div>
      )}

      {/* Bottom center — activate button */}
      {!isLive && (
        <button className={styles.activateBtn} onClick={onActivate}>
          <span className={styles.activateDot} />
          <span className={styles.activateLabel}>I'M OUT NOW</span>
        </button>
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
