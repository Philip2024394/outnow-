import { useState } from 'react'
import styles from './AdminDashboard.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { id: 'u1', name: 'Ava Mitchell',    email: 'ava@example.com',     status: 'active',   joined: '2025-11-04', lastActive: '2 min ago',  sessions: 14, reports: 0 },
  { id: 'u2', name: 'Jordan Lee',      email: 'jordan@example.com',  status: 'active',   joined: '2025-11-10', lastActive: '18 min ago', sessions: 9,  reports: 0 },
  { id: 'u3', name: 'Maya Patel',      email: 'maya@example.com',    status: 'active',   joined: '2025-12-01', lastActive: '1 hr ago',   sessions: 22, reports: 0 },
  { id: 'u4', name: 'Kai Thompson',    email: 'kai@example.com',     status: 'active',   joined: '2025-12-14', lastActive: '3 hrs ago',  sessions: 6,  reports: 1 },
  { id: 'u5', name: 'Priya Sharma',    email: 'priya@example.com',   status: 'active',   joined: '2026-01-03', lastActive: 'Yesterday',  sessions: 31, reports: 0 },
  { id: 'u6', name: 'Sam Okafor',      email: 'sam@example.com',     status: 'banned',   joined: '2026-01-15', lastActive: '2 days ago', sessions: 3,  reports: 4 },
  { id: 'u7', name: 'Chloe Brennan',   email: 'chloe@example.com',   status: 'active',   joined: '2026-01-28', lastActive: '5 hrs ago',  sessions: 8,  reports: 0 },
  { id: 'u8', name: 'Ravi Gupta',      email: 'ravi@example.com',    status: 'active',   joined: '2026-02-09', lastActive: '12 min ago', sessions: 17, reports: 0 },
  { id: 'u9', name: 'Isla Morgan',     email: 'isla@example.com',    status: 'active',   joined: '2026-02-22', lastActive: '30 min ago', sessions: 5,  reports: 0 },
  { id: 'u10',name: 'Dante Williams',  email: 'dante@example.com',   status: 'banned',   joined: '2026-03-01', lastActive: '1 week ago', sessions: 1,  reports: 6 },
  { id: 'u11',name: 'Zara Ahmed',      email: 'zara@example.com',    status: 'active',   joined: '2026-03-15', lastActive: '45 min ago', sessions: 11, reports: 0 },
  { id: 'u12',name: 'Finn O\'Brien',   email: 'finn@example.com',    status: 'pending',  joined: '2026-03-29', lastActive: 'Just now',   sessions: 1,  reports: 0 },
]

const DEMO_TRANSACTIONS = [
  { id: 't1', user: 'Jordan Lee',    type: 'Location Unlock', amount: 2.99, date: '2026-04-01 14:22', status: 'paid' },
  { id: 't2', user: 'Maya Patel',    type: 'Location Unlock', amount: 2.99, date: '2026-04-01 12:08', status: 'paid' },
  { id: 't3', user: 'Ava Mitchell',  type: 'Location Unlock', amount: 2.99, date: '2026-04-01 11:45', status: 'paid' },
  { id: 't4', user: 'Ravi Gupta',    type: 'Location Unlock', amount: 2.99, date: '2026-04-01 09:30', status: 'paid' },
  { id: 't5', user: 'Priya Sharma',  type: 'Location Unlock', amount: 2.99, date: '2026-03-31 22:14', status: 'paid' },
  { id: 't6', user: 'Chloe Brennan', type: 'Location Unlock', amount: 2.99, date: '2026-03-31 19:07', status: 'paid' },
  { id: 't7', user: 'Zara Ahmed',    type: 'Location Unlock', amount: 2.99, date: '2026-03-31 17:55', status: 'paid' },
  { id: 't8', user: 'Kai Thompson',  type: 'Location Unlock', amount: 2.99, date: '2026-03-31 15:30', status: 'refunded' },
  { id: 't9', user: 'Isla Morgan',   type: 'Location Unlock', amount: 2.99, date: '2026-03-30 20:18', status: 'paid' },
  { id: 't10',user: 'Finn O\'Brien', type: 'Location Unlock', amount: 2.99, date: '2026-03-30 13:44', status: 'paid' },
]

const DEMO_SESSIONS = [
  { id: 's1',  user: 'Ava Mitchell',  area: 'Soho, London',         activity: '☕ Coffee',  duration: '1h 12m', status: 'active'  },
  { id: 's2',  user: 'Ravi Gupta',    area: 'Shoreditch, London',   activity: '🍺 Drinks',  duration: '48m',    status: 'active'  },
  { id: 's3',  user: 'Jordan Lee',    area: 'Brixton, London',      activity: '🚶 Walk',    duration: '22m',    status: 'active'  },
  { id: 's4',  user: 'Zara Ahmed',    area: 'Camden, London',       activity: '🍽️ Dinner', duration: '2h 04m', status: 'ended'   },
  { id: 's5',  user: 'Maya Patel',    area: 'Notting Hill, London', activity: '☕ Coffee',  duration: '1h 30m', status: 'ended'   },
  { id: 's6',  user: 'Chloe Brennan', area: 'Hackney, London',      activity: '🍺 Drinks',  duration: '55m',    status: 'ended'   },
  { id: 's7',  user: 'Priya Sharma',  area: 'Islington, London',    activity: '🚶 Walk',    duration: '40m',    status: 'ended'   },
  { id: 's8',  user: 'Kai Thompson',  area: 'Chelsea, London',      activity: '🍽️ Dinner', duration: '1h 20m', status: 'ended'   },
]

const DAILY_REVENUE = [
  { day: 'Mar 26', amount: 17.94 },
  { day: 'Mar 27', amount: 26.91 },
  { day: 'Mar 28', amount: 8.97  },
  { day: 'Mar 29', amount: 35.88 },
  { day: 'Mar 30', amount: 29.90 },
  { day: 'Mar 31', amount: 23.92 },
  { day: 'Apr 01', amount: 11.96 },
]

const MAX_DAILY = Math.max(...DAILY_REVENUE.map(d => d.amount))

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: accent }}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    active:  { label: 'Active',  cls: styles.pillGreen  },
    banned:  { label: 'Banned',  cls: styles.pillRed    },
    pending: { label: 'Pending', cls: styles.pillYellow },
    paid:     { label: 'Paid',     cls: styles.pillGreen  },
    refunded: { label: 'Refunded', cls: styles.pillYellow },
    ended:    { label: 'Ended',    cls: styles.pillGrey   },
  }
  const { label, cls } = map[status] ?? { label: status, cls: '' }
  return <span className={`${styles.pill} ${cls}`}>{label}</span>
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function OverviewTab() {
  const activeUsers  = DEMO_USERS.filter(u => u.status === 'active').length
  const revenueToday = DEMO_TRANSACTIONS.filter(t => t.date.startsWith('2026-04-01') && t.status === 'paid')
    .reduce((s, t) => s + t.amount, 0)
  const revenueMonth = DEMO_TRANSACTIONS.filter(t => t.status === 'paid')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className={styles.tabContent}>
      <div className={styles.statsGrid}>
        <StatCard label="Total Users"    value={DEMO_USERS.length}             sub="+3 this week"    accent="#39FF14" />
        <StatCard label="Active Now"     value="3"                             sub="live sessions"   accent="#39FF14" />
        <StatCard label="Revenue Today"  value={`£${revenueToday.toFixed(2)}`} sub="4 transactions"  accent="#F5A623" />
        <StatCard label="Revenue / Month"value={`£${revenueMonth.toFixed(2)}`} sub="location unlocks" accent="#F5A623" />
      </div>

      {/* Revenue bar chart */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Revenue — Last 7 Days</h3>
        <div className={styles.barChart}>
          {DAILY_REVENUE.map(d => (
            <div key={d.day} className={styles.barGroup}>
              <div className={styles.barWrap}>
                <div
                  className={styles.bar}
                  style={{ height: `${(d.amount / MAX_DAILY) * 100}%` }}
                  title={`£${d.amount.toFixed(2)}`}
                />
              </div>
              <span className={styles.barLabel}>{d.day.split(' ')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* Recent sign-ups */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Sign-ups</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...DEMO_USERS].reverse().slice(0, 5).map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.joined}</td>
                  <td><StatusPill status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent transactions */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Transactions</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TRANSACTIONS.slice(0, 5).map(t => (
                <tr key={t.id}>
                  <td>{t.user}</td>
                  <td>£{t.amount.toFixed(2)}</td>
                  <td><StatusPill status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UsersTab() {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [users, setUsers]     = useState(DEMO_USERS)

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.status === filter
    return matchSearch && matchFilter
  })

  const toggleBan = (id) => {
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' }
      : u
    ))
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tableToolbar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.filterBtns}>
          {['all','active','banned','pending'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Sessions</th>
              <th>Reports</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={u.status === 'banned' ? styles.rowBanned : ''}>
                <td className={styles.tdBold}>{u.name}</td>
                <td className={styles.tdMuted}>{u.email}</td>
                <td><StatusPill status={u.status} /></td>
                <td className={styles.tdMuted}>{u.joined}</td>
                <td className={styles.tdMuted}>{u.lastActive}</td>
                <td>{u.sessions}</td>
                <td className={u.reports > 0 ? styles.tdRed : ''}>{u.reports}</td>
                <td>
                  <button
                    className={`${styles.actionBtn} ${u.status === 'banned' ? styles.actionBtnGreen : styles.actionBtnRed}`}
                    onClick={() => toggleBan(u.id)}
                  >
                    {u.status === 'banned' ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className={styles.empty}>No users match your search.</p>
        )}
      </div>
    </div>
  )
}

function RevenueTab() {
  const paid     = DEMO_TRANSACTIONS.filter(t => t.status === 'paid')
  const refunded = DEMO_TRANSACTIONS.filter(t => t.status === 'refunded')
  const total    = paid.reduce((s, t) => s + t.amount, 0)
  const todayRev = paid.filter(t => t.date.startsWith('2026-04-01')).reduce((s, t) => s + t.amount, 0)

  return (
    <div className={styles.tabContent}>
      <div className={styles.statsGrid}>
        <StatCard label="All-Time Revenue"  value={`£${total.toFixed(2)}`}       sub={`${paid.length} transactions`}     accent="#F5A623" />
        <StatCard label="Today"             value={`£${todayRev.toFixed(2)}`}    sub="location unlocks"                  accent="#F5A623" />
        <StatCard label="Refunds"           value={`${refunded.length}`}          sub={`£${(refunded.length * 2.99).toFixed(2)} returned`} accent="#FF3B30" />
        <StatCard label="Price Per Unlock"  value="£2.99"                        sub="via Stripe"                        accent="#39FF14" />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Transaction History</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TRANSACTIONS.map((t, i) => (
              <tr key={t.id}>
                <td className={styles.tdMuted}>{i + 1}</td>
                <td className={styles.tdBold}>{t.user}</td>
                <td className={styles.tdMuted}>{t.type}</td>
                <td>£{t.amount.toFixed(2)}</td>
                <td className={styles.tdMuted}>{t.date}</td>
                <td><StatusPill status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrafficTab() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.statsGrid}>
        <StatCard label="Daily Active Users" value="342"  sub="↑ 14% vs last week" accent="#39FF14" />
        <StatCard label="Sessions Today"     value="89"   sub="3 currently live"   accent="#39FF14" />
        <StatCard label="New Users Today"    value="7"    sub="since midnight"      accent="#A855F7" />
        <StatCard label="Peak Hour"          value="8 PM" sub="most sessions live"  accent="#F5A623" />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Active Sessions</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Area</th>
                <th>Activity</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SESSIONS.map(s => (
                <tr key={s.id}>
                  <td className={styles.tdBold}>{s.user}</td>
                  <td className={styles.tdMuted}>{s.area}</td>
                  <td>{s.activity}</td>
                  <td className={styles.tdMuted}>{s.duration}</td>
                  <td><StatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Platform Breakdown</h3>
          <div className={styles.platformList}>
            {[
              { label: 'iOS Safari (PWA)',  pct: 58, color: '#39FF14' },
              { label: 'Android Chrome',    pct: 29, color: '#F5A623' },
              { label: 'Desktop Browser',   pct: 10, color: '#A855F7' },
              { label: 'Other',             pct: 3,  color: '#555' },
            ].map(p => (
              <div key={p.label} className={styles.platformRow}>
                <span className={styles.platformLabel}>{p.label}</span>
                <div className={styles.platformBarWrap}>
                  <div className={styles.platformBar} style={{ width: `${p.pct}%`, background: p.color }} />
                </div>
                <span className={styles.platformPct}>{p.pct}%</span>
              </div>
            ))}
          </div>
          <div className={styles.section} style={{ marginTop: 24 }}>
            <h3 className={styles.sectionTitle}>Safety Stats</h3>
            <div className={styles.safetyStats}>
              {[
                { label: 'Reports Filed',    value: '11', color: '#FF3B30' },
                { label: 'Users Banned',     value: '2',  color: '#FF3B30' },
                { label: 'Blocks Issued',    value: '8',  color: '#F5A623' },
                { label: 'Avg. Report Time', value: '4m', color: '#39FF14' },
              ].map(s => (
                <div key={s.label} className={styles.safetyStat}>
                  <span className={styles.safetyNum} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.safetyLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', icon: '📊', label: 'Overview'  },
  { id: 'users',    icon: '👥', label: 'Users'     },
  { id: 'revenue',  icon: '💰', label: 'Revenue'   },
  { id: 'traffic',  icon: '📈', label: 'Traffic'   },
]

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <img src={LOGO_URL} alt="IMOUTNOW" className={styles.sidebarLogo} />
          <span className={styles.sidebarTitle}>Admin</span>
        </div>
        <nav className={styles.nav}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.navItem} ${activeTab === t.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className={styles.navIcon}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.adminBadge}>
            <span className={styles.adminDot} />
            admin
          </div>
          <button className={styles.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>
              {TABS.find(t => t.id === activeTab)?.icon}{' '}
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className={styles.headerSub}>IMOUTNOW — Admin Dashboard · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className={styles.headerLive}>
            <span className={styles.livePulse} />
            Live
          </div>
        </header>

        <div className={styles.contentWrap}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'revenue'  && <RevenueTab />}
          {activeTab === 'traffic'  && <TrafficTab />}
        </div>
      </main>
    </div>
  )
}
