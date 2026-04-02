import Avatar from '@/components/ui/Avatar'
import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'map',
    label: 'Map',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#39FF14' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: 'match',
    label: 'Discover',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#39FF14' : 'none'} stroke={active ? '#39FF14' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#39FF14' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function BottomNav({ activeTab = 'map', onChange, unreadChats = 0, onOpenVenues, activeVenueCount = 0, venuesOn = false, onToggleVenues, userPhotoURL, userName, isLive = false, isInviteOut = false, isScheduled = false, onProfileTap }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        const badge  = tab.id === 'chat' && unreadChats > 0 ? unreadChats : 0
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onChange?.(tab.id)}
            aria-label={tab.label}
          >
            <span className={styles.iconWrap}>
              {tab.icon(active)}
              {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
            </span>
          </button>
        )
      })}

      {/* Hot venues button */}
      <button
        className={`${styles.tab} ${activeVenueCount > 0 ? styles.venuesActive : ''}`}
        onClick={onOpenVenues}
        aria-label="Hot venues"
      >
        <span className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeVenueCount > 0 ? '#39FF14' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {activeVenueCount > 0 && (
            <span className={styles.badge}>{activeVenueCount > 9 ? '9+' : activeVenueCount}</span>
          )}
        </span>
      </button>

      {/* Venue toggle — blue when on */}
      <button
        className={`${styles.tab} ${venuesOn ? styles.venueToggleOn : ''}`}
        onClick={onToggleVenues}
        aria-label="Toggle partner venues"
      >
        <span className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={venuesOn ? 'rgba(77,166,255,0.2)' : 'none'} stroke={venuesOn ? '#4DA6FF' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {venuesOn && <span className={styles.venueToggleDot} />}
        </span>
      </button>

      {/* Profile avatar — status ring shows current state */}
      <button
        className={[
          styles.avatarTab,
          isLive      ? styles.avatarLive    : '',
          isInviteOut ? styles.avatarInvite  : '',
          isScheduled ? styles.avatarLater   : '',
        ].filter(Boolean).join(' ')}
        onClick={onProfileTap}
        aria-label="My status"
      >
        <Avatar
          src={userPhotoURL}
          name={userName ?? 'Me'}
          size={34}
          live={isLive}
          inviteOut={isInviteOut}
          scheduled={isScheduled}
        />
      </button>
    </nav>
  )
}
