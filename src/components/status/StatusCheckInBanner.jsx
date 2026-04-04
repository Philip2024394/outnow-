import styles from './StatusCheckInBanner.module.css'

const CONTENT = {
  time: {
    icon:    '🌙',
    title:   'Still out?',
    sub:     "You've been out for a while — tap below so we keep showing your profile to people nearby.",
    autoNote: "No response in 3 hours and we'll automatically switch you to Invite Out so you still appear on the map.",
  },
  location: {
    icon:    '📍',
    title:   'You\'ve moved',
    sub:     "Looks like you've left your venue. Are you still out tonight? Tap below and we'll update your location.",
    autoNote: "No response in 5 minutes and we'll automatically switch you to Invite Out.",
  },
}

export default function StatusCheckInBanner({ reason = 'time', onStillOut, onLeaving }) {
  const c = CONTENT[reason] ?? CONTENT.time

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.moon}>{c.icon}</div>
        <h2 className={styles.title}>{c.title}</h2>
        <p className={styles.sub}>{c.sub}</p>

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

        <p className={styles.autoNote}>{c.autoNote}</p>
      </div>
    </div>
  )
}
