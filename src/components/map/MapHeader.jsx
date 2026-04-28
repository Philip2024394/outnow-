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

      <div className={styles.right} />
    </div>,
    document.body
  )
}
