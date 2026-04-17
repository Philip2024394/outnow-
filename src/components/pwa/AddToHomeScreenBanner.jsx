import { usePWA } from '@/hooks/usePWA'
import styles from './AddToHomeScreenBanner.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

export default function AddToHomeScreenBanner({ _forceVisible = false }) {
  const { canShowBanner, isIOS, install, dismiss } = usePWA()

  if (!canShowBanner && !_forceVisible) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Logo */}
        <img src={LOGO_URL} alt="Indoo" className={styles.logo} />

        {/* Title */}
        <h2 className={styles.title}>Add to Home Screen</h2>

        {/* Description */}
        <p className={styles.desc}>
          {isIOS
            ? 'Tap the Share button below then select "Add to Home Screen" to get instant notifications when someone you like goes out.'
            : 'Install Indoo for instant push notifications the moment someone you liked goes out nearby.'}
        </p>

        {/* iOS instruction visual */}
        {isIOS && (
          <div className={styles.iosHint}>
            <span className={styles.iosStep}>1. Tap <strong>Share</strong> ↑</span>
            <span className={styles.iosStep}>2. Select <strong>Add to Home Screen</strong></span>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttons}>
          {!isIOS && (
            <button className={styles.addBtn} onClick={install}>
              Add to Home Screen
            </button>
          )}
          <button className={styles.laterBtn} onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
