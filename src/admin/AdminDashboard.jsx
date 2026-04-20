import { useState, useEffect } from 'react'
import styles from './AdminDashboard.module.css'
import AlertsOverlay from './tabs/AlertsOverlay'
import OverviewTab    from './tabs/OverviewTab'
import AnalyticsTab   from './tabs/AnalyticsTab'
import DatingAdminTab from './tabs/DatingAdminTab'
import MarketplaceAdminTab from './tabs/MarketplaceAdminTab'
import AuctionAdminTab from './tabs/AuctionAdminTab'
import RidesAdminTab  from './tabs/RidesAdminTab'
import LiveMapTab     from './tabs/LiveMapTab'
import RestaurantsTab from './RestaurantsTab'
import DriversTab     from './DriversTab'
import PricingTab     from './PricingTab'
import BookingsTab    from './BookingsTab'
import IndooNewsTab from './IndooNewsTab'
import NotificationsTab from './NotificationsTab'
import MessagesTab   from './tabs/MessagesTab'
import MarketingTab  from './MarketingTab'
import IdVerificationTab from './tabs/IdVerificationTab'
import CommissionsAdminTab from './tabs/CommissionsAdminTab'
import WalletAdminTab from './tabs/WalletAdminTab'
import MassageAdminTab from './tabs/MassageAdminTab'
import ViolationsTab from './tabs/ViolationsTab'
import PlaceSuggestionsTab from './tabs/PlaceSuggestionsTab'
import DealHuntAdminTab from './tabs/DealHuntAdminTab'

const LOGO = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const NAV = [
  { id: 'overview',     icon: '⚡', label: 'Overview'    },
  { id: 'alerts',       icon: '🚨', label: 'Alerts',  alert: true },
  { id: 'analytics',    icon: '📊', label: 'Analytics'   },
  { id: 'dating',       icon: '💕', label: 'Dating'       },
  { id: 'marketplace',  icon: '🛍️', label: 'Market'       },
  { id: 'auctions',     icon: '🔨', label: 'Auctions'     },
  { id: 'restaurants',  icon: '🍽️', label: 'Food'         },
  { id: 'wallets',      icon: '💳', label: 'Wallets'       },
  { id: 'commissions',  icon: '💰', label: 'Commissions'  },
  { id: 'massage',      icon: '💆', label: 'Massage'      },
  { id: 'rides',        icon: '🚗', label: 'Rides'        },
  { id: 'map',          icon: '🗺️', label: 'Live Map'     },
  { id: 'drivers',      icon: '🏍️', label: 'Drivers'      },
  { id: 'id_verify',   icon: '⭐', label: 'ID Verify'    },
  { id: 'bookings',     icon: '📋', label: 'Bookings'     },
  { id: 'users',        icon: '👥', label: 'Users'        },
  { id: 'news',         icon: '📰', label: 'News'         },
  { id: 'pricing',      icon: '💰', label: 'Pricing'      },
  { id: 'notify',       icon: '🔔', label: 'Notify'       },
  { id: 'messages',     icon: '💬', label: 'Messages'     },
  { id: 'marketing',    icon: '📢', label: 'Marketing'    },
  { id: 'violations',   icon: '🛡️', label: 'Violations',  alert: true },
  { id: 'places',       icon: '📍', label: 'Places' },
  { id: 'dealhunt',     icon: '🔥', label: 'Deal Hunt' },
]

export default function AdminDashboard({ onLogout }) {
  const [tab,          setTab]          = useState('overview')
  const [alertCount,   setAlertCount]   = useState(0)
  const [sysStatus,    setSysStatus]    = useState({ db: true, stripe: false, api: true })
  const [now,          setNow]          = useState(new Date())
  const [alertsVisible, setAlertsVisible] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Check system health
  useEffect(() => {
    const stripeOk = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    setSysStatus(s => ({ ...s, stripe: stripeOk }))
    let issues = 0
    if (!stripeOk) issues++
    if (!import.meta.env.VITE_STRIPE_PRICE_VIBE_BLAST) issues++
    if (!import.meta.env.VITE_STRIPE_PRICE_SOCIAL_BOOST) issues++
    setAlertCount(issues)
  }, [])

  const handleTabClick = (id) => {
    if (id === 'alerts') { setAlertsVisible(true); return }
    setTab(id)
  }

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className={styles.app}>

      {/* Always-on alert monitor */}
      <AlertsOverlay
        visible={alertsVisible || tab === 'alerts'}
        onClose={() => { setAlertsVisible(false); if (tab === 'alerts') setTab('overview') }}
        onCountChange={setAlertCount}
      />

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <img src={LOGO} alt="Indoo" className={styles.logo} />
          <span className={styles.adminLabel}>ADMIN SYSTEM</span>
          <span className={styles.version}>v2.0 · 2030</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${tab === item.id ? styles.navItemActive : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.alert && alertCount > 0 && (
                <span className={styles.alertBadge}>{alertCount}</span>
              )}
              {tab === item.id && <span className={styles.navGlow} />}
            </button>
          ))}
        </nav>

        <div className={styles.sideBottom}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${sysStatus.db ? styles.dotGreen : styles.dotRed}`} />
            <span className={styles.statusLabel}>Database</span>
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${sysStatus.stripe ? styles.dotGreen : styles.dotRed}`} />
            <span className={styles.statusLabel}>Stripe</span>
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${sysStatus.api ? styles.dotGreen : styles.dotRed}`} />
            <span className={styles.statusLabel}>API</span>
          </div>
          <button className={styles.logoutBtn} onClick={onLogout}>
            ⏻ Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.topLeft}>
            <span className={styles.topTab}>{NAV.find(n => n.id === tab)?.icon} {NAV.find(n => n.id === tab)?.label}</span>
          </div>
          <div className={styles.topCenter}>
            <span className={styles.livePulse} />
            <span className={styles.liveLabel}>LIVE</span>
            <span className={styles.topTime}>{timeStr}</span>
            <span className={styles.topDate}>{dateStr}</span>
          </div>
          <div className={styles.topRight}>
            {alertCount > 0 && (
              <button className={styles.alertBtn} onClick={() => setAlertsVisible(true)}>
                ⚠ {alertCount} issue{alertCount > 1 ? 's' : ''}
              </button>
            )}
            <span className={styles.adminTag}>indoo.admin</span>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {tab === 'overview'    && <OverviewTab />}
          {tab === 'analytics'   && <AnalyticsTab />}
          {tab === 'dating'      && <DatingAdminTab />}
          {tab === 'marketplace' && <MarketplaceAdminTab />}
          {tab === 'auctions' && <AuctionAdminTab />}
          {tab === 'restaurants' && <RestaurantsTab />}
          {tab === 'rides'       && <RidesAdminTab />}
          {tab === 'map'         && <LiveMapTab />}
          {tab === 'drivers'     && <DriversTab />}
          {tab === 'id_verify'   && <IdVerificationTab />}
          {tab === 'bookings'    && <BookingsTab />}
          {tab === 'news'        && <IndooNewsTab />}
          {tab === 'pricing'     && <PricingTab />}
          {tab === 'notify'      && <NotificationsTab />}
          {tab === 'messages'    && <MessagesTab />}
          {tab === 'marketing'   && <MarketingTab />}
          {tab === 'users'       && <UsersTab />}
          {tab === 'wallets' && <WalletAdminTab />}
          {tab === 'commissions' && <CommissionsAdminTab />}
          {tab === 'massage'     && <MassageAdminTab />}
          {tab === 'violations'  && <ViolationsTab />}
          {tab === 'places'      && <PlaceSuggestionsTab />}
          {tab === 'dealhunt'    && <DealHuntAdminTab />}
        </div>
      </div>
    </div>
  )
}

// Inline Users tab (existing functionality kept)
function UsersTab() {
  const USERS = [
    { id:'u1', name:'Ava Mitchell',   email:'ava@example.com',    status:'active',  joined:'2025-11-04', sessions:14, reports:0 },
    { id:'u2', name:'Jordan Lee',     email:'jordan@example.com', status:'active',  joined:'2025-11-10', sessions:9,  reports:0 },
    { id:'u3', name:'Maya Patel',     email:'maya@example.com',   status:'active',  joined:'2025-12-01', sessions:22, reports:0 },
    { id:'u4', name:'Kai Thompson',   email:'kai@example.com',    status:'active',  joined:'2025-12-14', sessions:6,  reports:1 },
    { id:'u5', name:'Priya Sharma',   email:'priya@example.com',  status:'active',  joined:'2026-01-03', sessions:31, reports:0 },
    { id:'u6', name:'Sam Okafor',     email:'sam@example.com',    status:'banned',  joined:'2026-01-15', sessions:3,  reports:4 },
    { id:'u7', name:'Chloe Brennan',  email:'chloe@example.com',  status:'active',  joined:'2026-01-28', sessions:8,  reports:0 },
    { id:'u8', name:'Ravi Gupta',     email:'ravi@example.com',   status:'active',  joined:'2026-02-09', sessions:17, reports:0 },
  ]
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ color: '#00E5FF', fontFamily: 'monospace', marginBottom: 20 }}>👥 Users</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {['Name','Email','Status','Joined','Sessions','Reports','Action'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px' }}>{u.name}</td>
              <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: u.status === 'active' ? 'rgba(0,255,157,0.1)' : 'rgba(255,68,68,0.1)',
                  color: u.status === 'active' ? '#00FF9D' : '#FF4444', border: `1px solid ${u.status === 'active' ? '#00FF9D44' : '#FF444444'}` }}>
                  {u.status}
                </span>
              </td>
              <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{u.joined}</td>
              <td style={{ padding: '12px', fontFamily: 'monospace' }}>{u.sessions}</td>
              <td style={{ padding: '12px', color: u.reports > 0 ? '#FF4444' : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{u.reports}</td>
              <td style={{ padding: '12px' }}>
                <button style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: '1px solid #00E5FF44', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
