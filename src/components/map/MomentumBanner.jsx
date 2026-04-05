import { useMomentum } from '@/hooks/useMomentum'
import styles from './MomentumBanner.module.css'

/**
 * Shows "🔥 X people out in [City] right now" as a floating pill on the map.
 * Only renders when count >= 2 (avoids "1 person out" which feels empty).
 * Fades in/out — non-intrusive, purely informational.
 *
 * Also used inside VenueOwnerDashboard with a venue's city.
 */
export default function MomentumBanner({ city, className = '' }) {
  const { count, loading } = useMomentum(city)

  if (loading || count < 2 || !city) return null

  return (
    <div className={`${styles.banner} ${className}`} aria-live="polite">
      <span className={styles.flame}>🔥</span>
      <span className={styles.text}>
        <strong>{count}</strong> {count === 1 ? 'person' : 'people'} out in {city} right now
      </span>
    </div>
  )
}
