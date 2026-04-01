import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import { activityEmoji } from '@/firebase/collections'
import styles from './VenueSheet.module.css'

export default function VenueSheet({ open, venue, onClose, onSelectSession, onOpenChat }) {
  const { show: showDealIntro, dismiss: dismissDealIntro } = useFeatureIntro('venue_deals')
  if (!venue) return null

  // Activity breakdown: { activityType → count }
  const breakdown = {}
  venue.sessions.forEach(s => {
    breakdown[s.activityType] = (breakdown[s.activityType] ?? 0) + 1
  })

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {venue.deal && showDealIntro && (
        <FeatureIntro
          emoji="🏷️"
          title="Venue Deals"
          bullets={[
            'Partner venues offer exclusive deals to IMOUTNOW users',
            'Just show this screen at the bar or door to claim',
            'Deals are live tonight only — first come, first served',
          ]}
          onDone={dismissDealIntro}
        />
      )}
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

        {/* Group chat button */}
        <button className={styles.chatBtn} onClick={() => { onClose?.(); setTimeout(() => onOpenChat?.(), 250) }}>
          <span className={styles.chatBtnDot} />
          <span className={styles.chatBtnText}>💬 Join Venue Chat</span>
          <span className={styles.chatBtnSub}>{venue.count} {venue.count === 1 ? 'person' : 'people'} in the room</span>
        </button>

        {/* Deal card */}
        {venue.deal && (
          <div className={styles.dealCard}>
            <div className={styles.dealHeader}>
              <span className={styles.dealEmoji}>{venue.deal.emoji}</span>
              <div className={styles.dealInfo}>
                <span className={styles.dealTitle}>{venue.deal.title}</span>
                <span className={styles.dealValid}>Valid until {venue.deal.validUntil}</span>
              </div>
              <span className={styles.dealBadge}>🏷️ Deal</span>
            </div>
            <p className={styles.dealDesc}>{venue.deal.description}</p>
          </div>
        )}

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
            <button
              key={s.id}
              className={styles.personRow}
              onClick={() => { onSelectSession?.(s); onClose?.() }}
            >
              <div className={styles.personAvatar}>
                {s.photoURL
                  ? <img src={s.photoURL} alt={s.displayName} className={styles.personAvatarImg} />
                  : <span className={styles.personAvatarInitial}>{s.displayName?.[0]?.toUpperCase()}</span>
                }
                <span className={styles.personOnlineDot} />
              </div>
              <span className={styles.personName}>{s.displayName?.split(' ')[0]}</span>
              <span className={styles.personActivity}>{activityEmoji(s.activityType)}</span>
              <span className={styles.personArrow}>›</span>
            </button>
          ))}
        </div>

      </div>
    </BottomSheet>
  )
}
