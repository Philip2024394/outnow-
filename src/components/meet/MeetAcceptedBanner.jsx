import styles from './MeetAcceptedBanner.module.css'

/**
 * User A sees this banner when User B accepts their "Let's Meet" request.
 * Tapping opens the chat conversation.
 */
export default function MeetAcceptedBanner({ session, onTapToChat, onDismiss, onUnlockVenue }) {
  return (
    <div className={styles.banner} onClick={onTapToChat}>
      <div className={styles.left}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {session.fromPhotoURL
              ? <img src={session.fromPhotoURL} alt="" className={styles.avatarImg} />
              : <span className={styles.avatarInitial}>
                  {session.fromDisplayName?.[0]?.toUpperCase() ?? '?'}
                </span>
            }
          </div>
          <div className={styles.heartsField} aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <span key={i} className={styles.floatHeart} style={{ '--i': i }}>♥</span>
            ))}
          </div>
        </div>
        <div className={styles.text}>
          <span className={styles.name}>{session.fromDisplayName ?? 'Someone'} accepted!</span>
          <span className={styles.sub}>Tap to open chat 💬</span>
        </div>
      </div>
      {onUnlockVenue && (
        <button
          className={styles.unlockBtn}
          onClick={(e) => { e.stopPropagation(); onUnlockVenue(session) }}
        >
          Unlock Venue — $2.99
        </button>
      )}
      <button
        className={styles.closeBtn}
        onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  )
}
