import Avatar from '@/components/ui/Avatar'
import styles from './BottomNav.module.css'

const c = (active) => active ? '#fff' : 'rgba(255,255,255,0.45)'

export default function BottomNav({ activeTab = 'map', onChange, unreadChats = 0, onOpenVenues, activeVenueCount = 0, onToggleVenues, userPhotoURL, userName, isLive = false, isInviteOut = false, isScheduled = false, onProfileTap }) {
  const select = (id, extra) => { onChange?.(id); extra?.() }

  return (
    <nav className={styles.nav}>

      {/* Map */}
      <button className={styles.tab} onClick={() => select('map')} aria-label="Map">
        <span className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c(activeTab === 'map')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
        </span>
      </button>

      {/* Discover */}
      <button className={styles.tab} onClick={() => select('match')} aria-label="Discover">
        <span className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'match' ? '#fff' : 'none'} stroke={c(activeTab === 'match')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </span>
      </button>

      {/* Chat */}
      <button className={styles.tab} onClick={() => select('chat')} aria-label="Chat">
        <span className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c(activeTab === 'chat')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {unreadChats > 0 && <span className={styles.badge}>{unreadChats > 9 ? '9+' : unreadChats}</span>}
        </span>
      </button>

      {/* Venues (menu icon) */}
      <button className={styles.tab} onClick={() => select('venues', onOpenVenues)} aria-label="Venues">
        <span className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c(activeTab === 'venues')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          {activeVenueCount > 0 && <span className={styles.badge}>{activeVenueCount > 9 ? '9+' : activeVenueCount}</span>}
        </span>
      </button>

      {/* Venue toggle (pin) */}
      <button className={styles.tab} onClick={() => select('venueToggle', onToggleVenues)} aria-label="Toggle partner venues">
        <span className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c(activeTab === 'venueToggle')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </span>
      </button>

      {/* Profile */}
      <button
        className={[
          styles.avatarTab,
          isLive      ? styles.avatarLive   : '',
          isInviteOut ? styles.avatarInvite : '',
          isScheduled ? styles.avatarLater  : '',
        ].filter(Boolean).join(' ')}
        onClick={() => select('profile', onProfileTap)}
        aria-label="My status"
      >
        <Avatar
          src={userPhotoURL ?? 'https://i.pravatar.cc/68?img=12'}
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
