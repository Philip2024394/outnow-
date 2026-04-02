import styles from './ProfileStrip.module.css'

export default function ProfileStrip({
  outNowCount    = 0,
  inviteOutCount = 0,
  outLaterCount  = 0,
  onDiscoverNow,
  onDiscoverInvite,
  onDiscoverLater,
}) {
  return (
    <div className={styles.strip}>
      <div className={styles.discRow}>

        <button className={`${styles.discBtn} ${styles.discBtnNow}`} onClick={onDiscoverNow}>
          <span className={styles.discCount}>{outNowCount}</span>
          <span className={`${styles.discLabel} ${styles.discLabelNow}`}>Out Now</span>
        </button>

        <button className={`${styles.discBtn} ${styles.discBtnInvite}`} onClick={onDiscoverInvite}>
          <span className={styles.discCount}>{inviteOutCount}</span>
          <span className={`${styles.discLabel} ${styles.discLabelInvite}`}>Invite Out</span>
        </button>

        <button className={`${styles.discBtn} ${styles.discBtnLater}`} onClick={onDiscoverLater}>
          <span className={styles.discCount}>{outLaterCount}</span>
          <span className={`${styles.discLabel} ${styles.discLabelLater}`}>Out Later</span>
        </button>

      </div>
    </div>
  )
}
