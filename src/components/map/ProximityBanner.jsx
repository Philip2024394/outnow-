// In-app proximity banner — shown on iOS and web when user is near a hot venue
// On Android (Capacitor native) this is replaced by a system notification instead

import { useEffect, useState } from 'react'
import styles from './ProximityBanner.module.css'

const AUTO_DISMISS_MS = 8000

export default function ProximityBanner({ alert, onDismiss, onTap }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!alert) { setVisible(false); return }
    setVisible(true)
    const id = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [alert]) // eslint-disable-line

  if (!alert) return null

  const { venue, distM } = alert

  return (
    <div
      className={`${styles.banner} ${visible ? styles.bannerVisible : styles.bannerHidden}`}
      onClick={() => { onTap?.(venue); onDismiss?.() }}
    >
      <span className={styles.pulse} />
      <span className={styles.emoji}>{venue.emoji}</span>
      <div className={styles.text}>
        <span className={styles.title}>{venue.name}</span>
        <span className={styles.sub}>
          {venue.count} {venue.count === 1 ? 'person' : 'people'} out here · {Math.round(distM)}m away
        </span>
      </div>
      <button
        className={styles.dismiss}
        onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
