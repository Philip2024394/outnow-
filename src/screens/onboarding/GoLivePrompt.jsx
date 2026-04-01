import { useState } from 'react'
import styles from './GoLivePrompt.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const NEARBY_COUNT = 3 // demo value — replace with real count from useLiveUsers if desired

export default function GoLivePrompt({ onGoLive, onSkip }) {
  const [leaving, setLeaving] = useState(false)

  const handleGoLive = () => {
    setLeaving(true)
    setTimeout(onGoLive, 300)
  }

  const handleSkip = () => {
    setLeaving(true)
    setTimeout(onSkip, 300)
  }

  return (
    <div className={`${styles.overlay} ${leaving ? styles.overlayLeaving : ''}`}>
      <div className={`${styles.card} ${leaving ? styles.cardLeaving : ''}`}>

        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

        <div className={styles.iconWrap}>
          <span className={styles.icon}>🟢</span>
        </div>

        <h1 className={styles.title}>You're all set!</h1>
        <p className={styles.sub}>Are you out tonight?</p>

        <div className={styles.nearbyBadge}>
          <span className={styles.nearbyDot} />
          <span className={styles.nearbyText}>{NEARBY_COUNT} people are out near you right now</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.goLiveBtn} onClick={handleGoLive}>
            Yes — I'm Out Now 🟢
          </button>
          <button className={styles.skipBtn} onClick={handleSkip}>
            Not Tonight
          </button>
        </div>

        <p className={styles.hint}>You can go live any time from the map screen</p>
      </div>
    </div>
  )
}
