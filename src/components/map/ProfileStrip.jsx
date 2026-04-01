import styles from './ProfileStrip.module.css'

export default function ProfileStrip({
  hideLive,
  hideScheduled,
  onToggleLive,
  onToggleScheduled,
  outNowCount = 0,
  outLaterCount = 0,
  isLive = false,
  onActivate,
  onEnd,
}) {
  return (
    <div className={styles.strip}>

      {/* Left — Out Now toggle badge */}
      <button
        className={`${styles.sideBtn} ${styles.sideBtnNow} ${hideLive ? styles.sideBtnOff : ''}`}
        onClick={onToggleLive}
        aria-label={hideLive ? 'Show Out Now' : 'Hide Out Now'}
      >
        <span className={styles.sideBadgeCount}>{outNowCount}</span>
        <span className={styles.sideBadgeLabel}>Out Now</span>
      </button>

      {/* Centre — action button */}
      <div className={styles.centre}>
        {isLive ? (
          <button className={styles.finishBtn} onClick={onEnd}>
            <span className={styles.finishDot} />
            <span className={styles.btnLabel}>FINISH OUT</span>
          </button>
        ) : (
          <button className={styles.activateBtn} onClick={onActivate}>
            <span className={styles.activateDot} />
            <span className={styles.btnLabel}>I'M OUT NOW</span>
          </button>
        )}
      </div>

      {/* Right — Out Later toggle badge */}
      <button
        className={`${styles.sideBtn} ${styles.sideBtnLater} ${hideScheduled ? styles.sideBtnOff : ''}`}
        onClick={onToggleScheduled}
        aria-label={hideScheduled ? 'Show Out Later' : 'Hide Out Later'}
      >
        <span className={styles.sideBadgeCount}>{outLaterCount}</span>
        <span className={`${styles.sideBadgeLabel} ${styles.sideBadgeLabelOrange}`}>Out Later</span>
      </button>

    </div>
  )
}
