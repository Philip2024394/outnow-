import styles from './VenueOwnerDashboard.module.css'

const MOCK_STATS = [
  { label: 'Profile Views',    value: '284',  change: '+12% this week',  icon: '👁️'  },
  { label: 'Visitors via App', value: '47',   change: '+8 from last week', icon: '📍' },
  { label: 'Chat Messages',    value: '132',  change: 'This month',       icon: '💬'  },
  { label: 'Discount Claims',  value: '19',   change: 'Code used 19×',    icon: '🏷️'  },
]

export default function VenueOwnerDashboard({ venue, onClose, onEditListing }) {
  const v = venue ?? {
    name: 'The Neon Tap',
    type: 'Bar',
    address: '23 Old Compton St, Soho',
    city: 'London',
    openTime: '16:00',
    closeTime: '02:00',
    drinks: ['Beer', 'Cocktails', 'Spirits'],
    food: ['Snacks & Sharing'],
    amenities: ['Free WiFi', 'Pool / Billiards Table', 'Dart Board'],
    deals: ['Happy Hour'],
    discountPercent: '15',
    discountType: 'Drinks',
    description: 'A buzzing Soho bar with craft beers, inventive cocktails and a crowd that knows how to have a good night.',
    plan: 'premium',
    subscriptionStatus: 'trial',
    trialEndsIn: 24,
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className={styles.headerMid}>
          <span className={styles.headerTitle}>Venue Dashboard</span>
          <span className={styles.headerSub}>Owner Portal</span>
        </div>
        <img
          src="https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064"
          alt="IMOUTNOW"
          className={styles.headerLogo}
        />
      </div>

      <div className={styles.content}>

        {/* Venue identity card */}
        <div className={styles.venueCard}>
          <div className={styles.venueCardTop}>
            <div className={styles.venueLiveRow}>
              <span className={styles.liveDot} />
              <span className={styles.liveText}>Live on Map</span>
            </div>
            {v.subscriptionStatus === 'trial' && (
              <span className={styles.trialBadge}>🎉 Free Trial — {v.trialEndsIn} days left</span>
            )}
          </div>
          <h2 className={styles.venueName}>{v.name}</h2>
          <p className={styles.venueType}>{v.type} · {v.address}</p>
          {(v.drinks?.length > 0 || v.food?.length > 0) && (
            <p className={styles.venueServes}>
              Serves: {[...(v.drinks ?? []), ...(v.food ?? [])].join(' · ')}
            </p>
          )}
          {v.amenities?.length > 0 && (
            <div className={styles.amenityChips}>
              {v.amenities.map(a => <span key={a} className={styles.amenityChip}>{a}</span>)}
            </div>
          )}
          <button className={styles.editBtn} onClick={onEditListing}>Edit Listing</button>
        </div>

        {/* Stats grid */}
        <div>
          <h3 className={styles.sectionTitle}>This Month</h3>
          <div className={styles.statsGrid}>
            {MOCK_STATS.map(s => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statIcon}>{s.icon}</span>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statChange}>{s.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade prompt for free plan */}
        {v.plan === 'free' && (
          <div className={styles.upgradePrompt}>
            <div className={styles.upgradePromptTop}>
              <span className={styles.upgradePromptIcon}>⭐</span>
              <div>
                <p className={styles.upgradePromptTitle}>Upgrade to Premium</p>
                <p className={styles.upgradePromptSub}>Green glow, live count, venue chat, discount banner and analytics.</p>
              </div>
            </div>
            <div className={styles.upgradePromptRow}>
              <span className={styles.upgradePromptPrice}>$10.99/mo · First month free</span>
              <button className={styles.upgradePromptBtn}>Upgrade →</button>
            </div>
          </div>
        )}

        {/* Venue chat */}
        <div className={`${styles.chatCard} ${v.plan === 'free' ? styles.chatCardLocked : ''}`}>
          <div className={styles.chatCardLeft}>
            <span className={styles.chatCardIcon}>💬</span>
            <div>
              <p className={styles.chatCardTitle}>Venue Group Chat</p>
              <p className={styles.chatCardSub}>Active · 6 people in the room right now</p>
            </div>
          </div>
          <div className={styles.chatLiveDot} />
        </div>

        {/* Discount code */}
        {v.discountPercent && (
          <div className={styles.discountCard}>
            <div className={styles.discountLeft}>
              <span className={styles.discountPct}>{v.discountPercent}% OFF</span>
              <span className={styles.discountType}>{v.discountType}</span>
            </div>
            <div className={styles.discountRight}>
              <span className={styles.discountLabel}>Your Code</span>
              <span className={styles.discountCode}>
                {v.name.replace(/^the\s+/i, '').slice(0, 2).toUpperCase()}-3637-ION
              </span>
              <span className={styles.discountNote}>Shown to all users on your venue profile</span>
            </div>
          </div>
        )}

        {/* Subscription */}
        <div className={styles.subCard}>
          <div className={styles.subRow}>
            <span className={styles.subLabel}>Plan</span>
            <span className={styles.subValue}>
              {v.subscriptionStatus === 'trial' ? '🎉 Free Trial' : '✓ Active — $10.99/mo'}
            </span>
          </div>
          <div className={styles.subRow}>
            <span className={styles.subLabel}>Billing</span>
            <span className={styles.subValue}>
              {v.subscriptionStatus === 'trial' ? `First charge in ${v.trialEndsIn} days` : 'Next bill on 1st of month'}
            </span>
          </div>
          <div className={styles.subRow}>
            <span className={styles.subLabel}>Cancel</span>
            <span className={styles.subValueDanger}>Cancel anytime — no penalty</span>
          </div>
        </div>

      </div>
    </div>
  )
}
