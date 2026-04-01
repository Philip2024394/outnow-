import styles from './MapOverlay.module.css'

export default function MapOverlay({ outNowCount = 0, outLaterCount = 0, onActivate, onEnd, isLive, sessionTimeLeft }) {
  return (
    <div className={styles.overlay}>
      {/* Top-left — Out Now + Out Later side by side */}
      <div className={styles.countRow}>
        <div className={styles.countBox}>
          <span className={styles.countDot} />
          <span className={styles.countNum}>{outNowCount}</span>
          <span className={styles.countLabel}>Out Now</span>
        </div>
        <div className={`${styles.countBox} ${styles.countBoxLater}`}>
          <span className={styles.countDotOrange} />
          <span className={styles.countNum}>{outLaterCount}</span>
          <span className={`${styles.countLabel} ${styles.countLabelOrange}`}>Out Later</span>
        </div>
      </div>

      {/* Right — session countdown (only when live) */}
      {isLive && sessionTimeLeft != null && (
        <div className={styles.timerBadge}>
          <span className={styles.timerIcon}>⏱</span>
          <span className={styles.timerText}>{formatTime(sessionTimeLeft)}</span>
        </div>
      )}

      {/* Bottom center — I'M OUT NOW when inactive, FINISH OUT when live */}
      {!isLive && (
        <button className={styles.activateBtn} onClick={onActivate}>
          <span className={styles.activateDot} />
          <span className={styles.activateLabel}>I'M OUT NOW</span>
        </button>
      )}
      {isLive && (
        <button className={styles.finishBtn} onClick={onEnd}>
          <span className={styles.finishDot} />
          <span className={styles.activateLabel}>FINISH OUT</span>
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
