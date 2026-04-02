import styles from './ProfileStrip.module.css'

export default function ProfileStrip({
  filter = 'all',
  onFilterChange,
  outNowCount = 0,
  outLaterCount = 0,
  isLive = false,
  isInviteOut = true,        // default true — all users start here
  onActivate,                // opens GoLive (Im Out Now)
  onInviteOut,               // opens InviteOutSheet
  onEnd,
}) {
  return (
    <div className={styles.strip}>

      {/* Left — Out Now toggle */}
      <button
        className={`${styles.sideBtn} ${styles.sideBtnNow} ${filter === 'now' ? styles.sideBtnActive : ''}`}
        onClick={() => onFilterChange?.(filter === 'now' ? 'all' : 'now')}
        aria-label={filter === 'now' ? 'Show all' : 'Show Out Now'}
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
        ) : isInviteOut ? (
          <button className={styles.inviteOutBtn} onClick={onInviteOut}>
            <span className={styles.inviteOutDot} />
            <span className={styles.btnLabel}>INVITE OUT</span>
          </button>
        ) : (
          <button className={styles.activateBtn} onClick={onActivate}>
            <span className={styles.activateDot} />
            <span className={styles.btnLabel}>I'M OUT NOW</span>
          </button>
        )}
      </div>

      {/* Right — Out Later toggle */}
      <button
        className={`${styles.sideBtn} ${styles.sideBtnLater} ${filter === 'later' ? styles.sideBtnActive : ''}`}
        onClick={() => onFilterChange?.(filter === 'later' ? 'all' : 'later')}
        aria-label={filter === 'later' ? 'Show all' : 'Show Out Later'}
      >
        <span className={styles.sideBadgeCount}>{outLaterCount}</span>
        <span className={`${styles.sideBadgeLabel} ${styles.sideBadgeLabelOrange}`}>Out Later</span>
      </button>

    </div>
  )
}
