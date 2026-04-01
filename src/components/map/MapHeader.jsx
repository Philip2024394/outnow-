import { useMySession } from '@/hooks/useMySession'
import styles from './MapHeader.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

export default function MapHeader({ onOpenLikes }) {
  const { isLive } = useMySession()

  return (
    <div className={styles.header}>
      {/* Logo */}
      <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

      <div className={styles.right}>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        )}

        {/* Settings / Likes icon */}
        <button className={styles.settingsBtn} onClick={onOpenLikes} aria-label="Who liked me">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <circle cx="19" cy="7" r="3" fill="currentColor" stroke="none" className={styles.notifDot} />
          </svg>
        </button>
      </div>
    </div>
  )
}
