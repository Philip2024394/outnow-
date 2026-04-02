import { useEffect } from 'react'
import styles from './OtwReplyBanner.module.css'

const AUTO_DISMISS_MS = 8000

export default function OtwReplyBanner({ banner, onView, onOpenNotifications, onDismiss }) {
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [banner, onDismiss])

  if (!banner) return null

  const name = banner.session?.displayName ?? 'Someone'

  return (
    <div className={styles.banner}>
      <button className={styles.body} onClick={() => onView(banner.session)}>
        <span className={styles.bell}>🔔</span>
        <div className={styles.text}>
          <span className={styles.name}>{name} replied to your message!</span>
          <span className={styles.sub}>Tap to view their profile</span>
        </div>
      </button>
      <div className={styles.actions}>
        <button className={styles.notifBtn} onClick={onOpenNotifications} aria-label="View in notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <button className={styles.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
