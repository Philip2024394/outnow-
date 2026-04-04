import styles from './StatusCheckInBanner.module.css'

export default function StatusCheckInBanner({ session, onStillOut, onLeaving }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.moon}>🌙</div>
        <h2 className={styles.title}>Still out?</h2>
        <p className={styles.sub}>
          You've been out for a while — tap below so we keep showing your profile to people nearby.
        </p>

        <div className={styles.btnRow}>
          <button className={styles.btnOut} onClick={onStillOut}>
            <span className={styles.btnIcon}>🎉</span>
            Still Out
          </button>
          <button className={styles.btnLeave} onClick={onLeaving}>
            <span className={styles.btnIcon}>👋</span>
            I&apos;m Leaving
          </button>
        </div>

        <p className={styles.autoNote}>
          No response in 3 hours and we&apos;ll automatically switch you to <strong>Invite Out</strong> so you still appear on the map.
        </p>
      </div>
    </div>
  )
}
