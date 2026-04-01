import { useOverlay } from '@/contexts/OverlayContext'
import { useOtwRequests } from '@/hooks/useOtwRequests'
import styles from './GoLiveButton.module.css'

export default function GoLiveButton() {
  const { openGoLive } = useOverlay()
  const { incomingRequest } = useOtwRequests()

  return (
    <button
      className={styles.fab}
      onClick={openGoLive}
      aria-label="Go live"
    >
      <span className={styles.icon}>📍</span>
      <span className={styles.label}>I'M OUT NOW</span>
      {incomingRequest && <span className={styles.badge} />}
    </button>
  )
}
