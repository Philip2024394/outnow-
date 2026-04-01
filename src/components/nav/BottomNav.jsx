import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'map',
    label: 'Map',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#39FF14' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: 'match',
    label: 'Match',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#39FF14' : 'none'} stroke={active ? '#39FF14' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#39FF14' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#39FF14' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav({ activeTab = 'map', onChange }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onChange?.(tab.id)}
            aria-label={tab.label}
          >
            <span className={styles.icon}>{tab.icon(active)}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
