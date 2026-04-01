import { usePWA } from '@/hooks/usePWA'
import styles from './AddToHomeScreenBanner.module.css'

export default function AddToHomeScreenBanner() {
  const { canShowBanner, isIOS, install, dismiss } = usePWA()

  if (!canShowBanner) return null

  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.icon}>📲</span>
        <div className={styles.text}>
          <span className={styles.title}>Add to Home Screen</span>
          <span className={styles.sub}>
            {isIOS
              ? 'Tap Share then "Add to Home Screen"'
              : 'Install for instant notifications when someone is out'}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {!isIOS && (
          <button className={styles.installBtn} onClick={install}>
            Install
          </button>
        )}
        <button className={styles.dismissBtn} onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  )
}
