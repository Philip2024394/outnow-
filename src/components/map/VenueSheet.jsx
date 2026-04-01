import BottomSheet from '@/components/ui/BottomSheet'
import { activityEmoji } from '@/firebase/collections'
import styles from './VenueSheet.module.css'

export default function VenueSheet({ open, venue, onClose }) {
  if (!venue) return null

  // Activity breakdown: { activityType → count }
  const breakdown = {}
  venue.sessions.forEach(s => {
    breakdown[s.activityType] = (breakdown[s.activityType] ?? 0) + 1
  })

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.venueEmoji}>{venue.emoji}</span>
          <div className={styles.headerText}>
            <h2 className={styles.venueName}>{venue.name}</h2>
            <span className={styles.venueType}>{venue.type}</span>
          </div>
        </div>

        <p className={styles.address}>📍 {venue.address}</p>

        {/* Live count */}
        <div className={styles.countRow}>
          <span className={styles.countDot} />
          <span className={styles.countText}>
            <strong className={styles.countNum}>{venue.count}</strong>
            {venue.count === 1 ? ' person' : ' people'} out here now
          </span>
        </div>

        {/* Activity breakdown */}
        <div className={styles.chips}>
          {Object.entries(breakdown).map(([type, n]) => (
            <span key={type} className={styles.chip}>
              {activityEmoji(type)} {type} {n > 1 ? `×${n}` : ''}
            </span>
          ))}
        </div>

        {/* Who's there */}
        <div className={styles.sectionLabel}>Who's here</div>
        <div className={styles.peopleList}>
          {venue.sessions.map(s => (
            <div key={s.id} className={styles.personRow}>
              <div className={styles.personAvatar}>
                {s.photoURL
                  ? <img src={s.photoURL} alt={s.displayName} className={styles.personAvatarImg} />
                  : <span className={styles.personAvatarInitial}>{s.displayName?.[0]?.toUpperCase()}</span>
                }
                <span className={styles.personOnlineDot} />
              </div>
              <span className={styles.personName}>{s.displayName?.split(' ')[0]}</span>
              <span className={styles.personActivity}>{activityEmoji(s.activityType)}</span>
            </div>
          ))}
        </div>

      </div>
    </BottomSheet>
  )
}
