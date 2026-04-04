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
        <StatCard label="Total Users"    value={DEMO_USERS.length}             sub="+3 this week"    accent="#8DC63F" />
        <StatCard label="Active Now"     value="3"                             sub="live sessions"   accent="#8DC63F" />
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
        <StatCard label="Price Per Unlock"  value="£2.99"                        sub="via Stripe"                        accent="#8DC63F" />
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
        <StatCard label="Daily Active Users" value="342"  sub="↑ 14% vs last week" accent="#8DC63F" />
        <StatCard label="Sessions Today"     value="89"   sub="3 currently live"   accent="#8DC63F" />
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
              { label: 'iOS Safari (PWA)',  pct: 58, color: '#8DC63F' },
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
                { label: 'Avg. Report Time', value: '4m', color: '#8DC63F' },
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

// ── Venues Tab ────────────────────────────────────────────────────────────────

const VENUE_EMOJIS   = ['🍺','🍷','🍸','🍹','☕','🍕','🍔','🎳','🎬','🎤','🎾','🏋️','🌃','🏖️','🎨','🛍️','🎟️','🏠']
const VENUE_TYPES_A  = ['Bar','Pub','Restaurant','Café','Wine Bar','Cocktail Bar','Club','Bowling Alley','Rooftop','Other']
const SERVES_DRINKS_A= ['Beer','Wine','Cocktails','Spirits','Non-Alcoholic','Coffee','Soft Drinks']
const SERVES_FOOD_A  = ['Full Menu','Snacks & Sharing','Pizza','Burgers','Fine Dining','Brunch','Vegan Options','Late Night Food']
const AMENITIES_A    = ['Free WiFi','Pool Table','Dart Board','Board Games','Live Music','Sports TV','Karaoke','Outdoor Seating','Private Hire','Accessible']
const DEALS_A        = ['Buy 1 Get 1 Free','Happy Hour','Student Discount','Group Discount','Free Drink With Food','Set Menu Deal']

const MOCK_REVIEWERS = [
  { id:'r1',  name:'Sophie',    photo:'https://ik.imagekit.io/nepgaxllc/uk1.png'  },
  { id:'r2',  name:'Emma',      photo:'https://ik.imagekit.io/nepgaxllc/uk3.png'  },
  { id:'r3',  name:'Charlotte', photo:'https://ik.imagekit.io/nepgaxllc/uk4.png'  },
  { id:'r4',  name:'Mia',       photo:'https://ik.imagekit.io/nepgaxllc/uk5.png'  },
  { id:'r5',  name:'Olivia',    photo:'https://ik.imagekit.io/nepgaxllc/uk6.png'  },
  { id:'r6',  name:'James',     photo:'https://ik.imagekit.io/nepgaxllc/uk8.png'  },
  { id:'r7',  name:'Liam',      photo:'https://ik.imagekit.io/nepgaxllc/uk9.png'  },
  { id:'r8',  name:'Noah',      photo:'https://ik.imagekit.io/nepgaxllc/uk10.png' },
  { id:'r9',  name:'Isla',      photo:'https://ik.imagekit.io/nepgaxllc/uk2.png'  },
  { id:'r10', name:'Zara',      photo:'https://ik.imagekit.io/nepgaxllc/uk7.png'  },
]

const BLANK_VENUE = {
  name:'', emoji:'🍺', type:'',
  country:'', city:'', address:'', postcode:'',
  lat:'', lng:'',
  openTime:'', closeTime:'',
  description:'',
  drinks:[], food:[], amenities:[], deals:[],
  discountPercent:'', discountType:'',
  email:'', phone:'', instagram:'', website:'',
  tier:'basic',
  billingStatus:'none', nextBillingAt:'',
  claimStatus:'unclaimed', ownerEmail:'',
  mockOwnerId:'', mockOwnerName:'', mockOwnerPhoto:'',
  status:'active',
  reviews:[],
}

const DEMO_ADMIN_VENUES = [
  { id:'av1', name:'The Neon Tap',        emoji:'🍺', type:'Bar',          country:'United Kingdom',      city:'London',   address:'14 Greek Street',      postcode:'W1D 4DP', lat:51.5133, lng:-0.1320, openTime:'17:00', closeTime:'01:00', description:'Craft beer bar in the heart of Soho with premium tap selection.', drinks:['Beer','Cocktails','Spirits'], food:['Snacks & Sharing'], amenities:['Pool Table','Live Music','Free WiFi'], deals:['Happy Hour'], discountPercent:15, discountType:'Drinks', email:'hello@neontap.com', phone:'+44 20 7123 4567', instagram:'@neontap', website:'https://neontap.com', tier:'premium', billingStatus:'trial',  nextBillingAt:'2026-05-04', claimStatus:'claimed',   ownerEmail:'james@neontap.com', status:'active',
    reviews:[
      { id:'rv1', reviewerId:'r1', reviewerName:'Sophie',    reviewerPhoto:'https://ik.imagekit.io/nepgaxllc/uk1.png',  rating:5, text:'Absolutely love this place! The craft beers are incredible and the vibe is unmatched. Staff are super friendly too. My go-to spot in Soho.',       date:'2026-03-28' },
      { id:'rv2', reviewerId:'r6', reviewerName:'James',     reviewerPhoto:'https://ik.imagekit.io/nepgaxllc/uk8.png',  rating:4, text:'Great selection of beers and the happy hour deal is brilliant. Pool table keeps things lively. Gets busy on weekends — arrive early.',           date:'2026-03-30' },
      { id:'rv3', reviewerId:'r2', reviewerName:'Emma',      reviewerPhoto:'https://ik.imagekit.io/nepgaxllc/uk3.png',  rating:5, text:'Came here through IMOUTNOW and met the nicest group of people. The 15% discount worked perfectly on the cocktails. Will be back!',             date:'2026-04-01' },
    ]
  },
  { id:'av2', name:'Soho Wine Cellar',    emoji:'🍷', type:'Wine Bar',      country:'United Kingdom',      city:'London',   address:'8 Frith Street',       postcode:'W1D 3JN', lat:51.5138, lng:-0.1269, openTime:'16:00', closeTime:'00:00', description:'Intimate wine bar with 200+ labels and expert sommeliers.',      drinks:['Wine','Cocktails'],          food:['Fine Dining','Snacks & Sharing'], amenities:['Free WiFi','Private Hire'], deals:[], discountPercent:'', discountType:'', email:'info@sohocellar.com', phone:'', instagram:'@sohocellar', website:'', tier:'basic',    billingStatus:'none',   nextBillingAt:'',           claimStatus:'unclaimed', ownerEmail:'',                  status:'active', reviews:[] },
  { id:'av3', name:'La Cantina',          emoji:'🍹', type:'Cocktail Bar',  country:'United States',       city:'New York', address:'245 W 52nd St',        postcode:'NY 10019',lat:40.7614, lng:-73.985, openTime:'18:00', closeTime:'02:00', description:'Upscale cocktail bar with Latin-inspired drinks menu.',          drinks:['Cocktails','Spirits','Wine'], food:['Snacks & Sharing'], amenities:['Live Music','Outdoor Seating'], deals:['Happy Hour'], discountPercent:10, discountType:'Cocktails', email:'hello@lacantina.com', phone:'+1 212 555 0192', instagram:'@lacantinanyc', website:'https://lacantina.com', tier:'premium', billingStatus:'active', nextBillingAt:'2026-05-01', claimStatus:'claimed', ownerEmail:'maria@lacantina.com', status:'active',
    reviews:[
      { id:'rv4', reviewerId:'r4', reviewerName:'Mia',    reviewerPhoto:'https://ik.imagekit.io/nepgaxllc/uk5.png', rating:5, text:'Best cocktails in NYC — the passion fruit margarita is life changing. Lively atmosphere and the outdoor seating is perfect for summer evenings.', date:'2026-03-22' },
      { id:'rv5', reviewerId:'r9', reviewerName:'Isla',   reviewerPhoto:'https://ik.imagekit.io/nepgaxllc/uk2.png', rating:4, text:'Discovered this through IMOUTNOW and it did not disappoint. Great happy hour deals and the music is always on point. Staff are brilliant.', date:'2026-03-25' },
    ]
  },
  { id:'av4', name:'The Fitzroy',         emoji:'🍺', type:'Pub',           country:'United Kingdom',      city:'London',   address:'16 Charlotte Street',  postcode:'W1T 2LY', lat:51.5196, lng:-0.1357, openTime:'11:00', closeTime:'23:00', description:'Classic British pub with rotating guest ales and hearty food.',  drinks:['Beer','Wine','Spirits'],     food:['Full Menu','Snacks & Sharing'], amenities:['Sports TV','Dart Board','Accessible'], deals:['Buy 1 Get 1 Free','Student Discount'], discountPercent:'', discountType:'', email:'', phone:'', instagram:'', website:'', tier:'basic', billingStatus:'none', nextBillingAt:'', claimStatus:'unclaimed', ownerEmail:'', status:'active', reviews:[] },
  { id:'av5', name:'Sky Lounge Dubai',    emoji:'🌃', type:'Rooftop',       country:'United Arab Emirates',city:'Dubai',    address:'Downtown Blvd, Fl 40', postcode:'',        lat:25.1972, lng:55.2744, openTime:'18:00', closeTime:'03:00', description:'Rooftop bar with panoramic views of the Burj Khalifa.',         drinks:['Cocktails','Wine','Non-Alcoholic'], food:['Fine Dining','Snacks & Sharing'], amenities:['Outdoor Seating','Live Music','Private Hire'], deals:[], discountPercent:'', discountType:'', email:'events@skyloungedxb.com', phone:'+971 4 555 0100', instagram:'@skyloungedxb', website:'https://skyloungedxb.com', tier:'premium', billingStatus:'active', nextBillingAt:'2026-05-10', claimStatus:'claimed', ownerEmail:'ops@skyloungedxb.com', status:'active', reviews:[] },
  { id:'av6', name:'Café de Flore',       emoji:'☕', type:'Café',          country:'France',              city:'Paris',    address:'172 Blvd Saint-Germain',postcode:'75006',  lat:48.8542, lng:2.3328,  openTime:'07:30', closeTime:'01:30', description:'Iconic Parisian café beloved by writers and artists since 1887.',drinks:['Coffee','Wine','Non-Alcoholic'], food:['Full Menu','Brunch'], amenities:['Outdoor Seating','Accessible'], deals:[], discountPercent:'', discountType:'', email:'', phone:'+33 1 45 48 55 26', instagram:'@cafedeflore', website:'', tier:'basic', billingStatus:'none', nextBillingAt:'', claimStatus:'unclaimed', ownerEmail:'', status:'active', reviews:[] },
  { id:'av7', name:'Club Social Sydney',  emoji:'🍸', type:'Club',          country:'Australia',           city:'Sydney',   address:'33 Oxford Street',     postcode:'2010',    lat:-33.8793,lng:151.2191,openTime:'21:00', closeTime:'05:00', description:'Premier nightclub in Surry Hills with three floors of music.',   drinks:['Cocktails','Beer','Spirits'], food:['Late Night Food'], amenities:['Live Music','Karaoke','Private Hire'], deals:['Happy Hour','Student Discount'], discountPercent:20, discountType:'Entry', email:'bookings@clubsocialsydney.com', phone:'+61 2 9123 4567', instagram:'@clubsocialsydney', website:'', tier:'premium', billingStatus:'active', nextBillingAt:'2026-05-15', claimStatus:'claimed', ownerEmail:'admin@clubsocialsydney.com', status:'active', reviews:[] },
]

const DEMO_SUGGESTIONS = [
  { id:'s1', name:'The Dolphin',         area:'Hackney, London',       submittedByName:'Ava Mitchell',  submittedAt:'2026-04-01', status:'pending',  adminNote:'', offersDiscount:true,  discountPercent:15, discountType:'drinks', discountStatus:'offered'   },
  { id:'s2', name:'Monmouth Coffee',     area:'Covent Garden, London', submittedByName:'Jordan Lee',    submittedAt:'2026-03-30', status:'pending',  adminNote:'', offersDiscount:true,  discountPercent:10, discountType:'all',    discountStatus:'offered'   },
  { id:'s3', name:'Netil Market',        area:'London Fields, London', submittedByName:'Maya Patel',    submittedAt:'2026-03-29', status:'approved', adminNote:'', offersDiscount:true,  discountPercent:20, discountType:'food',   discountStatus:'confirmed' },
  { id:'s4', name:'Lucky Voice',         area:'Soho, London',          submittedByName:'Kai Thompson',  submittedAt:'2026-03-28', status:'rejected', adminNote:'Already on the map', offersDiscount:false, discountPercent:null, discountType:null, discountStatus:null },
  { id:'s5', name:'Pergola on the Roof', area:'White City, London',    submittedByName:'Priya Sharma',  submittedAt:'2026-03-27', status:'pending',  adminNote:'', offersDiscount:true,  discountPercent:12, discountType:'entry',  discountStatus:'offered'   },
]

function ChipSelect({ options, selected, onChange }) {
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div className={styles.formChips}>
      {options.map(o => (
        <button key={o} type="button"
          className={`${styles.formChip} ${selected.includes(o) ? styles.formChipActive : ''}`}
          onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  )
}

const BLANK_REVIEW = { reviewerId:'r1', rating:5, text:'', date: new Date().toISOString().split('T')[0] }

function StarPicker({ value, onChange }) {
  return (
    <div className={styles.starRow}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" className={`${styles.starBtn} ${n <= value ? styles.starBtnOn : ''}`} onClick={() => onChange(n)}>★</button>
      ))}
    </div>
  )
}

function VenueFormPanel({ initial, onSave, onClose }) {
  const [form,      setForm]      = useState({ ...(initial ?? BLANK_VENUE), reviews: initial?.reviews ?? [] })
  const [panelTab,  setPanelTab]  = useState('details') // 'details' | 'reviews'
  const [newReview, setNewReview] = useState({ ...BLANK_REVIEW })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addReview = () => {
    if (!newReview.text.trim()) return
    const reviewer = MOCK_REVIEWERS.find(r => r.id === newReview.reviewerId) ?? MOCK_REVIEWERS[0]
    const review = {
      id: `rv${Date.now()}`,
      reviewerId:    reviewer.id,
      reviewerName:  reviewer.name,
      reviewerPhoto: reviewer.photo,
      rating:        newReview.rating,
      text:          newReview.text.trim(),
      date:          newReview.date,
    }
    setForm(f => ({ ...f, reviews: [review, ...(f.reviews ?? [])] }))
    setNewReview({ ...BLANK_REVIEW })
  }

  const deleteReview = (id) => setForm(f => ({ ...f, reviews: f.reviews.filter(r => r.id !== id) }))

  const avgRating = form.reviews?.length
    ? (form.reviews.reduce((s, r) => s + r.rating, 0) / form.reviews.length).toFixed(1)
    : '—'

  return (
    <>
      <div className={styles.panelOverlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{initial?.id ? 'Edit Venue' : 'Add New Venue'}</h2>
          <button className={styles.panelClose} onClick={onClose}>✕</button>
        </div>

        {/* Panel tabs */}
        <div className={styles.panelTabs}>
          <button className={`${styles.panelTabBtn} ${panelTab === 'details' ? styles.panelTabBtnActive : ''}`} onClick={() => setPanelTab('details')}>📋 Details</button>
          <button className={`${styles.panelTabBtn} ${panelTab === 'reviews' ? styles.panelTabBtnActive : ''}`} onClick={() => setPanelTab('reviews')}>
            ⭐ Reviews {form.reviews?.length > 0 && <span className={styles.reviewCount}>{form.reviews.length}</span>}
          </button>
        </div>

        {/* ── REVIEWS TAB ── */}
        {panelTab === 'reviews' && (
          <div className={styles.panelBody}>
            {/* Stats */}
            <div className={styles.reviewStats}>
              <div className={styles.reviewStatBig}>{avgRating}</div>
              <div className={styles.reviewStatSub}>avg rating · {form.reviews?.length ?? 0} review{form.reviews?.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Add review form */}
            <div className={styles.panelSection}>
              <p className={styles.panelSectionTitle}>Post a Review</p>

              {/* User picker */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Reviewer (mock user)</label>
                <div className={styles.reviewerPicker}>
                  {MOCK_REVIEWERS.map(u => (
                    <button key={u.id} type="button"
                      className={`${styles.reviewerPickerBtn} ${newReview.reviewerId === u.id ? styles.reviewerPickerBtnActive : ''}`}
                      onClick={() => setNewReview(r => ({ ...r, reviewerId: u.id }))}
                      title={u.name}
                    >
                      <img src={u.photo} alt={u.name} className={styles.reviewerPickerImg} />
                      <span className={styles.reviewerPickerName}>{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stars */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Rating</label>
                <StarPicker value={newReview.rating} onChange={v => setNewReview(r => ({ ...r, rating: v }))} />
              </div>

              {/* Text */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Review Text</label>
                <textarea
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Write the review as if you were this user visiting the venue…"
                  value={newReview.text}
                  onChange={e => setNewReview(r => ({ ...r, text: e.target.value }))}
                />
              </div>

              {/* Date */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Review Date</label>
                <input type="date" className={styles.formInput} value={newReview.date} onChange={e => setNewReview(r => ({ ...r, date: e.target.value }))} />
              </div>

              <button className={styles.panelSaveBtn} onClick={addReview} disabled={!newReview.text.trim()}>
                + Post Review
              </button>
            </div>

            {/* Existing reviews */}
            {(form.reviews?.length ?? 0) > 0 && (
              <div className={styles.panelSection}>
                <p className={styles.panelSectionTitle}>Posted Reviews</p>
                <div className={styles.reviewList}>
                  {(form.reviews ?? []).map(r => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewCardTop}>
                        <img src={r.reviewerPhoto} alt={r.reviewerName} className={styles.reviewAvatar} />
                        <div className={styles.reviewMeta}>
                          <span className={styles.reviewName}>{r.reviewerName}</span>
                          <div className={styles.reviewStars}>{'★'.repeat(r.rating)}<span className={styles.reviewStarsEmpty}>{'★'.repeat(5 - r.rating)}</span></div>
                          <span className={styles.reviewDate}>{r.date}</span>
                        </div>
                        <button className={styles.reviewDeleteBtn} onClick={() => deleteReview(r.id)} title="Delete review">✕</button>
                      </div>
                      <p className={styles.reviewText}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(form.reviews?.length ?? 0) === 0 && (
              <p className={styles.empty}>No reviews yet — post the first one above.</p>
            )}
          </div>
        )}

        {/* ── DETAILS TAB ── */}
        {panelTab === 'details' && (
        <div className={styles.panelBody}>

          {/* Emoji */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Venue Emoji</p>
            <div className={styles.emojiRow}>
              {VENUE_EMOJIS.map(e => (
                <button key={e} type="button"
                  className={`${styles.emojiBtn} ${form.emoji === e ? styles.emojiBtnActive : ''}`}
                  onClick={() => set('emoji', e)}>{e}</button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Basic Info</p>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Venue Name *</label>
              <input className={styles.formInput} placeholder="e.g. The Neon Tap" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Venue Type *</label>
                <select className={styles.formSelect} value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="">Select type…</option>
                  {VENUE_TYPES_A.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Status</label>
                <select className={styles.formSelect} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <textarea className={styles.formTextarea} rows={3} maxLength={200} placeholder="What makes this venue special…" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Location</p>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Country *</label>
                <input className={styles.formInput} placeholder="United Kingdom" value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>City *</label>
                <input className={styles.formInput} placeholder="London" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Street Address</label>
              <input className={styles.formInput} placeholder="14 Greek Street" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className={styles.formGrid3}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Postcode / ZIP</label>
                <input className={styles.formInput} placeholder="W1D 4DP" value={form.postcode} onChange={e => set('postcode', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Latitude</label>
                <input className={styles.formInput} type="number" step="any" placeholder="51.5133" value={form.lat} onChange={e => set('lat', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Longitude</label>
                <input className={styles.formInput} type="number" step="any" placeholder="-0.1320" value={form.lng} onChange={e => set('lng', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Opening Hours</p>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Opens</label>
                <input type="time" className={styles.formInput} value={form.openTime} onChange={e => set('openTime', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Closes</label>
                <input type="time" className={styles.formInput} value={form.closeTime} onChange={e => set('closeTime', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Serves */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Drinks Served</p>
            <ChipSelect options={SERVES_DRINKS_A} selected={form.drinks} onChange={v => set('drinks', v)} />
          </div>
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Food Served</p>
            <ChipSelect options={SERVES_FOOD_A} selected={form.food} onChange={v => set('food', v)} />
          </div>
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Amenities</p>
            <ChipSelect options={AMENITIES_A} selected={form.amenities} onChange={v => set('amenities', v)} />
          </div>
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Deals</p>
            <ChipSelect options={DEALS_A} selected={form.deals} onChange={v => set('deals', v)} />
          </div>

          {/* Discount */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>IMOUTNOW Exclusive Discount (5% – 30%)</p>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Discount %</label>
                <select className={styles.formSelect} value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)}>
                  <option value="">No discount</option>
                  {[5,10,15,20,25,30].map(n => <option key={n} value={n}>{n}% off</option>)}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Applies To</label>
                <select className={styles.formSelect} value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                  <option value="">Select…</option>
                  {['Drinks','Food','All Items','Cocktails','Entry','Set Menu','First Round'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Contact Details</p>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} type="email" placeholder="hello@venue.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Phone</label>
                <input className={styles.formInput} placeholder="+44 7700 900000" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Instagram</label>
                <input className={styles.formInput} placeholder="@yourvenue" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Website</label>
                <input className={styles.formInput} placeholder="https://venue.com" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Listing Tier */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Listing Tier</p>
            <div className={styles.tierToggle}>
              <button type="button"
                className={`${styles.tierBtn} ${styles.tierBtnBasic} ${form.tier === 'basic' ? styles.tierBtnActive : ''}`}
                onClick={() => set('tier', 'basic')}>
                🔵 Basic — Free Forever
              </button>
              <button type="button"
                className={`${styles.tierBtn} ${styles.tierBtnPremium} ${form.tier === 'premium' ? styles.tierBtnActive : ''}`}
                onClick={() => set('tier', 'premium')}>
                ⭐ Premium — $10.99/mo
              </button>
            </div>

            {form.tier === 'premium' && (
              <>
                <div className={styles.formField} style={{ marginTop: 10 }}>
                  <label className={styles.formLabel}>Billing Status</label>
                  <div className={styles.billingRow}>
                    {['trial','active','cancelled'].map(b => (
                      <button key={b} type="button"
                        className={`${styles.billingBtn} ${form.billingStatus === b ? styles.billingBtnActive : ''}`}
                        onClick={() => set('billingStatus', b)}>
                        {b.charAt(0).toUpperCase() + b.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Next Billing Date</label>
                  <input type="date" className={styles.formInput} value={form.nextBillingAt} onChange={e => set('nextBillingAt', e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Claim */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Ownership / Claim</p>
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Claim Status</label>
                <select className={styles.formSelect} value={form.claimStatus} onChange={e => set('claimStatus', e.target.value)}>
                  <option value="unclaimed">Unclaimed (Admin Added)</option>
                  <option value="claimed">Claimed by Owner</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Owner Email</label>
                <input className={styles.formInput} placeholder="owner@venue.com" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Mock owner account */}
          <div className={styles.panelSection}>
            <p className={styles.panelSectionTitle}>Mock Owner Account (Admin Control)</p>
            <p style={{ fontSize:11, color:'#444', margin:'0 0 10px', lineHeight:1.5 }}>
              Assign a mock user profile as the venue owner. Admin can log in as this user and manage the venue as if they were a real owner.
            </p>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Select Mock Owner Profile</label>
              <div className={styles.reviewerPicker}>
                {MOCK_REVIEWERS.map(u => (
                  <button key={u.id} type="button"
                    className={`${styles.reviewerPickerBtn} ${form.mockOwnerId === u.id ? styles.reviewerPickerBtnActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, mockOwnerId: u.id, mockOwnerName: u.name, mockOwnerPhoto: u.photo }))}
                    title={u.name}
                  >
                    <img src={u.photo} alt={u.name} className={styles.reviewerPickerImg} />
                    <span className={styles.reviewerPickerName}>{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {form.mockOwnerId && (
              <div className={styles.mockOwnerCard}>
                <img src={form.mockOwnerPhoto} alt={form.mockOwnerName} className={styles.mockOwnerAvatar} />
                <div className={styles.mockOwnerInfo}>
                  <span className={styles.mockOwnerName}>{form.mockOwnerName}</span>
                  <span className={styles.mockOwnerRole}>Venue Owner · Mock Account</span>
                  <span className={styles.mockOwnerEmail}>{form.mockOwnerName?.toLowerCase()}@imoutnow-demo.com</span>
                </div>
                <div className={styles.mockOwnerAccess}>
                  <span className={styles.mockAccessPill}>✓ Dashboard Access</span>
                  <span className={styles.mockAccessPill}>✓ Edit Venue</span>
                  <span className={styles.mockAccessPill}>✓ View Analytics</span>
                </div>
              </div>
            )}
            <div className={styles.formGrid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Mock Login Email</label>
                <input className={styles.formInput} readOnly
                  value={form.mockOwnerName ? `${form.mockOwnerName.toLowerCase()}@imoutnow-demo.com` : '—'}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Mock Password</label>
                <input className={styles.formInput} readOnly value={form.mockOwnerId ? 'Demo1234!' : '—'} />
              </div>
            </div>
          </div>

        </div>
        )}

        <div className={styles.panelFooter}>
          <button className={styles.panelCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.panelSaveBtn} onClick={() => onSave(form)}
            disabled={!form.name || !form.country || !form.city}>
            {initial?.id ? 'Save Changes' : '+ Add Venue'}
          </button>
        </div>
      </div>
    </>
  )
}

function VenuesTab() {
  const [venues,      setVenues]     = useState(DEMO_ADMIN_VENUES)
  const [suggestions, setSuggestions]= useState(DEMO_SUGGESTIONS)
  const [subTab,      setSubTab]     = useState('manage')
  const [search,      setSearch]     = useState('')
  const [countryF,    setCountryF]   = useState('all')
  const [tierF,       setTierF]      = useState('all')
  const [panelVenue,  setPanelVenue] = useState(null) // null=closed | BLANK_VENUE=adding | venue=editing
  const [rejectNote,  setRejectNote] = useState({})
  const [rejectOpen,  setRejectOpen] = useState(null)

  // ── Venue management ──
  const saveVenue = (form) => {
    if (form.id) {
      setVenues(p => p.map(v => v.id === form.id ? form : v))
    } else {
      setVenues(p => [...p, { ...form, id: `av${Date.now()}`, addedBy:'admin', addedAt: new Date().toISOString().split('T')[0] }])
    }
    setPanelVenue(null)
  }

  const deleteVenue = (id) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this venue from the map?')) setVenues(p => p.filter(v => v.id !== id))
  }

  const countries = ['all', ...new Set(venues.map(v => v.country))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b))

  const filtered = venues.filter(v => {
    const q = search.toLowerCase()
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.country.toLowerCase().includes(q)
    const matchC = countryF === 'all' || v.country === countryF
    const matchT = tierF === 'all' || v.tier === tierF
    return matchQ && matchC && matchT
  })

  const premiumCount  = venues.filter(v => v.tier === 'premium').length
  const claimedCount  = venues.filter(v => v.claimStatus === 'claimed').length
  const trialCount    = venues.filter(v => v.billingStatus === 'trial').length

  // ── Suggestions ──
  const pendingCount = suggestions.filter(s => s.status === 'pending').length
  const approveSuggestion = (id) => setSuggestions(p => p.map(s => s.id === id ? { ...s, status:'approved' } : s))
  const rejectSuggestion  = (id) => { setSuggestions(p => p.map(s => s.id === id ? { ...s, status:'rejected', adminNote: rejectNote[id] ?? '' } : s)); setRejectOpen(null) }

  return (
    <div className={styles.tabContent}>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Venues"    value={venues.length}  sub="on the map"           accent="#8DC63F" />
        <StatCard label="Premium Listings"value={premiumCount}   sub="paying venues"        accent="#F5C518" />
        <StatCard label="Claimed"         value={claimedCount}   sub="owner accounts"       accent="#A855F7" />
        <StatCard label="On Trial"        value={trialCount}     sub="first month free"     accent="#F5A623" />
      </div>

      {/* Sub-tab + Add button */}
      <div className={styles.venueToolbar}>
        <div className={styles.subTabBtns}>
          <button className={`${styles.subTabBtn} ${subTab === 'manage' ? styles.subTabBtnActive : ''}`} onClick={() => setSubTab('manage')}>📍 Manage Venues</button>
          <button className={`${styles.subTabBtn} ${subTab === 'suggestions' ? styles.subTabBtnActive : ''}`} onClick={() => setSubTab('suggestions')}>
            📥 Suggestions {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount}</span>}
          </button>
        </div>
        {subTab === 'manage' && (
          <button className={styles.addVenueBtn} onClick={() => setPanelVenue({ ...BLANK_VENUE })}>
            + Add Venue
          </button>
        )}
      </div>

      {/* ── Manage tab ── */}
      {subTab === 'manage' && (
        <>
          <div className={styles.tableToolbar}>
            <input className={styles.searchInput} type="search" placeholder="Search by name, city or country…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className={styles.formSelect} style={{ width:'auto', minWidth:160 }} value={countryF} onChange={e => setCountryF(e.target.value)}>
              {countries.map(c => <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>)}
            </select>
            <div className={styles.filterBtns}>
              {[['all','All'],['basic','Basic'],['premium','Premium ⭐']].map(([id,label]) => (
                <button key={id} className={`${styles.filterBtn} ${tierF === id ? styles.filterBtnActive : ''}`} onClick={() => setTierF(id)}>{label}</button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>Hours</th>
                  <th>Tier</th>
                  <th>Billing</th>
                  <th>Claimed</th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td className={styles.tdBold}>{v.emoji} {v.name}</td>
                    <td className={styles.tdMuted}>{v.country}</td>
                    <td className={styles.tdMuted}>{v.city}</td>
                    <td className={styles.tdMuted}>{v.type || '—'}</td>
                    <td className={styles.tdMuted}>{v.openTime && v.closeTime ? `${v.openTime}–${v.closeTime}` : '—'}</td>
                    <td>
                      <span className={`${styles.tierPill} ${v.tier === 'premium' ? styles.tierPremium : styles.tierBasic}`}>
                        {v.tier === 'premium' ? '⭐ Premium' : '🔵 Basic'}
                      </span>
                    </td>
                    <td>
                      {v.tier === 'premium'
                        ? <span className={`${styles.pill} ${v.billingStatus === 'active' ? styles.pillGreen : v.billingStatus === 'trial' ? styles.pillYellow : styles.pillRed}`}>
                            {v.billingStatus}
                          </span>
                        : <span className={styles.tdMuted}>—</span>
                      }
                    </td>
                    <td>
                      <span className={`${styles.claimPill} ${v.claimStatus === 'claimed' ? styles.claimClaimed : styles.claimUnclaimed}`}>
                        {v.claimStatus === 'claimed' ? '✓ Claimed' : 'Unclaimed'}
                      </span>
                    </td>
                    <td>
                      {v.discountPercent
                        ? <span className={styles.discountPct}>{v.discountPercent}% {v.discountType}</span>
                        : <span className={styles.tdMuted}>—</span>
                      }
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} onClick={() => setPanelVenue(v)}>Edit</button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnRed}`}   onClick={() => deleteVenue(v.id)}>Del</button>
                        {v.tier === 'basic'
                          ? <button className={`${styles.actionBtn}`} style={{ borderColor:'rgba(245,197,24,0.3)', color:'#F5C518', background:'rgba(245,197,24,0.06)' }} onClick={() => setVenues(p => p.map(x => x.id === v.id ? {...x, tier:'premium', billingStatus:'trial'} : x))}>→ Premium</button>
                          : <button className={`${styles.actionBtn} ${styles.filterBtn}`}   onClick={() => setVenues(p => p.map(x => x.id === v.id ? {...x, tier:'basic', billingStatus:'none'} : x))}>→ Basic</button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className={styles.empty}>No venues match your filters.</p>}
          </div>
        </>
      )}

      {/* ── Suggestions tab ── */}
      {subTab === 'suggestions' && (
        <div className={styles.section}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Venue</th><th>Area</th><th>Discount Offer</th><th>Submitted By</th><th>Date</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(s => (
                <>
                  <tr key={s.id}>
                    <td className={styles.tdBold}>{s.name}</td>
                    <td className={styles.tdMuted}>{s.area}</td>
                    <td>
                      {s.offersDiscount
                        ? <span className={styles.discountPct}>{s.discountPercent}% {s.discountType}</span>
                        : <span className={styles.tdMuted}>—</span>}
                    </td>
                    <td className={styles.tdMuted}>{s.submittedByName}</td>
                    <td className={styles.tdMuted}>{s.submittedAt}</td>
                    <td><StatusPill status={s.status} /></td>
                    <td>
                      {s.status === 'pending' && (
                        <div className={styles.venueBtns}>
                          <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} onClick={() => approveSuggestion(s.id)}>Approve</button>
                          <button className={`${styles.actionBtn} ${styles.actionBtnRed}`}   onClick={() => setRejectOpen(rejectOpen === s.id ? null : s.id)}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {rejectOpen === s.id && (
                    <tr key={`${s.id}-r`} className={styles.rejectRow}>
                      <td colSpan={7}>
                        <div className={styles.rejectWrap}>
                          <input className={`${styles.searchInput} ${styles.rejectInput}`} placeholder="Optional note…" value={rejectNote[s.id] ?? ''} onChange={e => setRejectNote(p => ({ ...p, [s.id]: e.target.value }))} />
                          <button className={`${styles.actionBtn} ${styles.actionBtnRed}`} onClick={() => rejectSuggestion(s.id)}>Confirm Reject</button>
                          <button className={`${styles.actionBtn} ${styles.filterBtn}`}   onClick={() => setRejectOpen(null)}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {suggestions.length === 0 && <p className={styles.empty}>No suggestions yet.</p>}
        </div>
      )}

      {/* Form panel */}
      {panelVenue !== null && (
        <VenueFormPanel
          initial={panelVenue.id ? panelVenue : null}
          onSave={saveVenue}
          onClose={() => setPanelVenue(null)}
        />
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', icon: '📊', label: 'Overview'  },
  { id: 'users',    icon: '👥', label: 'Users'     },
  { id: 'revenue',  icon: '💰', label: 'Revenue'   },
  { id: 'traffic',  icon: '📈', label: 'Traffic'   },
  { id: 'venues',   icon: '📍', label: 'Venues'    },
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
          {activeTab === 'venues'   && <VenuesTab />}
        </div>
      </main>
    </div>
  )
}
