import BottomSheet from '@/components/ui/BottomSheet'
import styles from './VenueListSheet.module.css'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasd.png'

export default function VenueListSheet({ open, venues = [], onClose, onSelectVenue }) {
  const sorted = [...venues].sort((a, b) => b.count - a.count)

  return (
    <BottomSheet open={open} onClose={onClose} title="Hot Venues">
      <div className={styles.container}>

        {/* Full background image */}
        <img src={BG_URL} alt="" className={styles.bgImage} />
        {/* Dark overlay */}
        <div className={styles.frost} />

        {/* Green strip top */}
        <div className={styles.greenStrip} />

        {/* Horizontal scroll row */}
        <div className={styles.inner}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>No active venues right now</div>
          ) : (
            <div className={styles.scrollRow}>
              {sorted.map(venue => {
                const isHot = venue.count >= 2
                return (
                  <button
                    key={venue.id}
                    className={styles.card}
                    onClick={() => { onSelectVenue?.(venue); onClose?.() }}
                  >
                    <span className={styles.cardEmoji}>{venue.emoji}</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{venue.name}</span>
                      <span className={styles.cardType}>{venue.type}</span>
                    </div>
                    <div className={styles.cardRight}>
                      {venue.deal && <span className={styles.dealChip}>🏷️</span>}
                      <div className={styles.countWrap}>
                        {isHot && <span className={styles.hotDot} />}
                        <span className={styles.countNum}>{venue.count}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
