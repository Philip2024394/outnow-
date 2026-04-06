import Avatar from '@/components/ui/Avatar'
import styles from './BottomNav.module.css'

const TABS = [
  {
    id: 'map',
    label: 'Map',
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: 'match',
    label: 'Discover',
    icon: () => null,
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'venues',
    label: 'Venues',
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
  },
]

export default function BottomNav({ activeTab = 'map', onChange, unreadChats = 0, onOpenVenues, activeVenueCount = 0, userPhotoURL, userName, isLive = false, isInviteOut = false, onProfileTap, onDiscoverInvite, onDiscoverNow, outNowCount = 0, inviteOutCount = 0, newNowCount = 0, newInviteCount = 0, onHanggle, businessCount = 0, hanggleActive = false }) {
  const select = (id, extra) => { onChange?.(id); extra?.() }

  return (
    <nav className={styles.nav}>

      {TABS.map(({ id, label, icon }) => {
        const active = activeTab === id
        const badge = id === 'chat' ? unreadChats : id === 'venues' ? activeVenueCount : 0

        if (id === 'match') {
          return (
            <button key={id} className={`${styles.hanggleBtn} ${hanggleActive ? styles.hanggleBtnActive : ''}`} onClick={onHanggle} aria-label="Hanggle">
              <span className={styles.hanggleBtnCount}>{businessCount}</span>
            </button>
          )
        }

        if (id === 'chat') {
          return (
            <button key={id} className={styles.chatBtn} onClick={onDiscoverInvite} aria-label="Invite Out profiles">
              <span className={`${styles.colorBtnCount} ${newInviteCount > 0 ? styles.colorBtnCountNew : ''}`}>{inviteOutCount}</span>
            </button>
          )
        }

        if (id === 'venues') {
          return (
            <button key={id} className={styles.venuesBtn} onClick={onDiscoverNow} aria-label="Out Now profiles">
              <span className={`${styles.colorBtnCount} ${newNowCount > 0 ? styles.colorBtnCountNew : ''}`}>{outNowCount}</span>
            </button>
          )
        }

        return (
          <button
            key={id}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => select(id, id === 'venues' ? onOpenVenues : undefined)}
            aria-label={label}
          >
            <span className={styles.iconWrap}>
              {icon(active)}
              {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
            </span>
            {active && <span className={styles.tabLabel}>{label}</span>}
          </button>
        )
      })}

      {/* Profile */}
      <button
        className={[
          styles.avatarTab,
          activeTab === 'profile' ? styles.avatarTabActive : '',
          isLive      ? styles.avatarLive   : '',
          isInviteOut ? styles.avatarInvite : '',
        ].filter(Boolean).join(' ')}
        onClick={() => select('profile', onProfileTap)}
        aria-label="My status"
      >
        <Avatar
          src={userPhotoURL ?? 'https://i.pravatar.cc/68?img=12'}
          name={userName ?? 'Me'}
          size={30}
          live={isLive}
          inviteOut={isInviteOut}
        />
        {activeTab === 'profile' && <span className={styles.tabLabel}>Me</span>}
      </button>

    </nav>
  )
}
