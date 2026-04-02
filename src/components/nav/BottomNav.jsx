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

export default function BottomNav({ activeTab = 'map', onChange, unreadChats = 0, hasActiveMapFilter, onOpenFilter, onOpenVenues, activeVenueCount = 0, onSOS }) {
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

      {/* Venues button — always visible */}
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

      {/* Filter button — only on map tab */}
      {activeTab === 'map' && (
        <button
          className={`${styles.tab} ${hasActiveMapFilter ? styles.filterActive : ''}`}
          onClick={onOpenFilter}
          aria-label="Filter map"
        >
          <span className={styles.iconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hasActiveMapFilter ? '#39FF14' : '#666'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {hasActiveMapFilter && <span className={styles.filterDot} />}
          </span>
        </button>
      )}

      {/* SOS button */}
      <button className={styles.sosTab} onClick={onSOS} aria-label="Alert my contact">
        SOS
      </button>
    </nav>
  )
}
