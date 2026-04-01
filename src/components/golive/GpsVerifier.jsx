import { useGeolocation } from '@/hooks/useGeolocation'
import Spinner from '@/components/ui/Spinner'
import styles from './GpsVerifier.module.css'

/**
 * Shows GPS accuracy status. Returns coords to parent when ready.
 */
export default function GpsVerifier({ onReady }) {
  const { coords, error, loading, refresh } = useGeolocation()

  if (loading) {
    return (
      <div className={styles.state}>
        <Spinner size={20} color="var(--color-live)" />
        <span>Verifying location…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.state}>
        <span className={styles.errorIcon}>⚠️</span>
        <span className={styles.errorText}>{error}</span>
        <button className={styles.retry} onClick={refresh}>Try again</button>
      </div>
    )
  }

  const accuracyOk = coords && coords.accuracy <= 50
  const accuracyLabel = coords
    ? coords.accuracy < 10 ? 'Excellent' : coords.accuracy < 30 ? 'Good' : 'Fair'
    : ''

  // Notify parent once we have usable coordinates
  if (coords && onReady) {
    onReady(coords)
  }

  return (
    <div className={styles.state}>
      <div className={[styles.ring, accuracyOk ? styles.ok : styles.weak].join(' ')}>
        <span className={styles.ringLabel}>📍</span>
      </div>
      <div className={styles.info}>
        <span className={accuracyOk ? styles.ok : styles.weak}>
          {accuracyOk ? 'Location confirmed' : 'Weak signal'}
        </span>
        <span className={styles.accuracy}>±{Math.round(coords?.accuracy ?? 0)}m · {accuracyLabel}</span>
      </div>
    </div>
  )
}
