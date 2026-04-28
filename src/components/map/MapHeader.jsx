import { useMySession } from '@/hooks/useMySession'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n'
import styles from './MapHeader.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

export default function MapHeader({
  onOpenNotifications,
  notifCount = 0,
  onAccountClick,
}) {
  const { isLive } = useMySession()
  const { user } = useAuth()
  const { t } = useLanguage()
  const demoProfile = (() => { try { return JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}') } catch { return {} } })()
  const isRegistered = !!user || localStorage.getItem('indoo_registered') === 'true'
  const photoURL = user?.photoURL ?? user?.user_metadata?.avatar_url ?? demoProfile.photo ?? null
  const displayName = user?.displayName ?? user?.user_metadata?.full_name ?? demoProfile.name ?? null

  return createPortal(
    <div className={styles.header}>
      {/* Logo — left side */}
      <div className={styles.logoArea}>
        <img src={LOGO_URL} alt="Indoo" className={styles.logo} />
      </div>

      <div className={styles.right}>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        )}

        {/* Notifications */}
        <button className={styles.settingsBtn} onClick={onOpenNotifications} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span className={styles.notifBadge}>{notifCount > 9 ? '9+' : notifCount}</span>
          )}
        </button>

        {/* Account — shows avatar if registered, hidden if guest browsing */}
        {isRegistered && (
          <button className={styles.avatarBtn} onClick={onAccountClick} aria-label="My account">
            {photoURL
              ? <img src={photoURL} alt={displayName ?? 'Me'} className={styles.avatarImg} />
              : <span className={styles.avatarInitial}>{(displayName?.[0] ?? '?').toUpperCase()}</span>
            }
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
