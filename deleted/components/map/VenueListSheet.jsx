import styles from './VenueListSheet.module.css'

export default function VenueListSheet({ open, venues = [], onClose, onSelectVenue }) {
  const sorted = [...venues].sort((a, b) => b.count - a.count)

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.sheet}>

        {/* Drag handle */}
        <div className={styles.handle} onClick={onClose} />

        {/* Header row */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Hot Venues</span>
            <span className={styles.headerSub}>Active Venues · Places</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Scrollable venue list */}
        <div className={styles.scrollRow}>
          {sorted.length === 0 ? (
            <div className={styles.empty}>No active venues right now</div>
          ) : (
            sorted.map(venue => {
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
            })
          )}
        </div>
      </div>
    </div>
  )
}
