import BottomSheet from '@/components/ui/BottomSheet'
import styles from './VenueListSheet.module.css'

export default function VenueListSheet({ open, venues = [], onClose, onSelectVenue }) {
  const sorted = [...venues].sort((a, b) => b.count - a.count)

  return (
    <BottomSheet open={open} onClose={onClose} title="Hot Venues">
      <div className={styles.content}>
        {sorted.length === 0 ? (
          <div className={styles.empty}>No active venues right now</div>
        ) : (
          <div className={styles.list}>
            {sorted.map(venue => {
              const isHot = venue.count >= 2
              return (
                <button
                  key={venue.id}
                  className={`${styles.row} ${isHot ? styles.rowHot : ''}`}
                  onClick={() => { onSelectVenue?.(venue); onClose?.() }}
                >
                  <span className={styles.emoji}>{venue.emoji}</span>
                  <div className={styles.info}>
                    <span className={styles.name}>{venue.name}</span>
                    <span className={styles.type}>{venue.type}</span>
                  </div>
                  <div className={styles.countBadge}>
                    {isHot && <span className={styles.hotDot} />}
                    <span className={styles.countNum}>{venue.count}</span>
                    <span className={styles.countLabel}>{venue.count === 1 ? 'here' : 'here'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
