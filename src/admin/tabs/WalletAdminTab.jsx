/**
 * WalletAdminTab — INDOO Prepaid Wallet Management
 *
 * Manages prepaid wallets for bike riders, car drivers, and restaurants.
 * - Commission (10%) auto-deducted from wallet per order
 * - Minimum balance enforcement with 24hr grace period
 * - Top-up verification via bank transfer screenshot
 *
 * Sub-tabs: All Wallets | Pending Top-Ups | Commission Log
 */
import { useState, useEffect } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtShortDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const MINIMUM_BALANCE = { bike: 30000, car: 100000, restaurant: 50000 }
const TYPE_LABELS = { bike: 'Bike Rider', car: 'Car Driver', restaurant: 'Restaurant' }
const TYPE_ICONS = { bike: '\u{1F6B2}', car: '\u{1F697}', restaurant: '\u{1F37D}\uFE0F' }

// ── Demo Data Generation ────────────────────────────────────────────────────

const now = Date.now()
const hAgo = (h) => new Date(now - h * 3600000).toISOString()
const dAgo = (d) => new Date(now - d * 86400000).toISOString()

function generateDemoWallets() {
  return [
    // 5 bike riders
    { id: 'w1', userId: 'u1', name: 'Budi Santoso', type: 'bike', balance: 85000, status: 'active', lastTopUp: hAgo(48), createdAt: dAgo(60) },
    { id: 'w2', userId: 'u2', name: 'Agus Wijaya', type: 'bike', balance: 32000, status: 'active', lastTopUp: hAgo(120), createdAt: dAgo(45) },
    { id: 'w3', userId: 'u3', name: 'Rizky Pratama', type: 'bike', balance: 15000, status: 'restricted', lastTopUp: hAgo(200), createdAt: dAgo(90), restrictedAt: hAgo(18) },
    { id: 'w4', userId: 'u4', name: 'Dian Saputra', type: 'bike', balance: 0, status: 'deactivated', lastTopUp: hAgo(500), createdAt: dAgo(120), restrictedAt: hAgo(72), deactivatedAt: hAgo(48) },
    { id: 'w5', userId: 'u5', name: 'Fajar Nugroho', type: 'bike', balance: 150000, status: 'active', lastTopUp: hAgo(12), createdAt: dAgo(30) },
    // 4 car drivers
    { id: 'w6', userId: 'u6', name: 'Hendra Gunawan', type: 'car', balance: 250000, status: 'active', lastTopUp: hAgo(24), createdAt: dAgo(80) },
    { id: 'w7', userId: 'u7', name: 'Irwan Setiawan', type: 'car', balance: 75000, status: 'restricted', lastTopUp: hAgo(168), createdAt: dAgo(55), restrictedAt: hAgo(6) },
    { id: 'w8', userId: 'u8', name: 'Joko Widodo P.', type: 'car', balance: 180000, status: 'active', lastTopUp: hAgo(72), createdAt: dAgo(100) },
    { id: 'w9', userId: 'u9', name: 'Kurniawan Adi', type: 'car', balance: 0, status: 'deactivated', lastTopUp: hAgo(720), createdAt: dAgo(150), restrictedAt: hAgo(96), deactivatedAt: hAgo(72) },
    // 3 restaurants
    { id: 'w10', userId: 'u10', name: 'Warung Sari Rasa', type: 'restaurant', balance: 320000, status: 'active', lastTopUp: hAgo(36), createdAt: dAgo(200) },
    { id: 'w11', userId: 'u11', name: 'Bakso Pak Harto', type: 'restaurant', balance: 42000, status: 'restricted', lastTopUp: hAgo(240), createdAt: dAgo(180), restrictedAt: hAgo(10) },
    { id: 'w12', userId: 'u12', name: 'Nasi Goreng Mbak Rina', type: 'restaurant', balance: 175000, status: 'active', lastTopUp: hAgo(60), createdAt: dAgo(95) },
  ]
}

function generateDemoTopUps() {
  return [
    { id: 't1', userId: 'u3', name: 'Rizky Pratama', type: 'bike', amount: 50000, method: 'Bank Transfer (BCA)', status: 'pending', createdAt: hAgo(2), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/00FF9D?text=BCA+Transfer+Rp50.000', note: '' },
    { id: 't2', userId: 'u7', name: 'Irwan Setiawan', type: 'car', amount: 200000, method: 'Bank Transfer (BCA)', status: 'pending', createdAt: hAgo(4), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/00E5FF?text=BCA+Transfer+Rp200.000', note: '' },
    { id: 't3', userId: 'u11', name: 'Bakso Pak Harto', type: 'restaurant', amount: 100000, method: 'Bank Transfer (BCA)', status: 'pending', createdAt: hAgo(1), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/FFB800?text=BCA+Transfer+Rp100.000', note: '' },
    { id: 't4', userId: 'u5', name: 'Fajar Nugroho', type: 'bike', amount: 100000, method: 'Bank Transfer (BCA)', status: 'verified', createdAt: hAgo(14), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/8DC63F?text=BCA+Transfer+Rp100.000', verifiedAt: hAgo(12), note: '' },
    { id: 't5', userId: 'u6', name: 'Hendra Gunawan', type: 'car', amount: 300000, method: 'Bank Transfer (BCA)', status: 'verified', createdAt: hAgo(26), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/8DC63F?text=BCA+Transfer+Rp300.000', verifiedAt: hAgo(24), note: '' },
    { id: 't6', userId: 'u4', name: 'Dian Saputra', type: 'bike', amount: 50000, method: 'Bank Transfer (BCA)', status: 'rejected', createdAt: hAgo(100), screenshotUrl: 'https://placehold.co/400x600/1a1a2e/EF4444?text=Blurry+Screenshot', rejectedAt: hAgo(96), rejectReason: 'Screenshot blurry, cannot verify amount', note: '' },
  ]
}

function generateDemoCommissions() {
  return [
    { id: 'c1', userId: 'u1', name: 'Budi Santoso', orderId: '#RIDE_10234', orderType: 'bike', orderTotal: 28000, commission: 2800, balanceBefore: 87800, balanceAfter: 85000, createdAt: hAgo(3) },
    { id: 'c2', userId: 'u5', name: 'Fajar Nugroho', orderId: '#RIDE_10235', orderType: 'bike', orderTotal: 15000, commission: 1500, balanceBefore: 151500, balanceAfter: 150000, createdAt: hAgo(6) },
    { id: 'c3', userId: 'u6', name: 'Hendra Gunawan', orderId: '#RIDE_10236', orderType: 'car', orderTotal: 85000, commission: 8500, balanceBefore: 258500, balanceAfter: 250000, createdAt: hAgo(8) },
    { id: 'c4', userId: 'u10', name: 'Warung Sari Rasa', orderId: '#FOOD_20111', orderType: 'food', orderTotal: 56000, commission: 5600, balanceBefore: 325600, balanceAfter: 320000, createdAt: hAgo(10) },
    { id: 'c5', userId: 'u12', name: 'Nasi Goreng Mbak Rina', orderId: '#FOOD_20112', orderType: 'food', orderTotal: 42000, commission: 4200, balanceBefore: 179200, balanceAfter: 175000, createdAt: hAgo(12) },
    { id: 'c6', userId: 'u8', name: 'Joko Widodo P.', orderId: '#RIDE_10237', orderType: 'car', orderTotal: 120000, commission: 12000, balanceBefore: 192000, balanceAfter: 180000, createdAt: hAgo(18) },
    { id: 'c7', userId: 'u2', name: 'Agus Wijaya', orderId: '#RIDE_10238', orderType: 'bike', orderTotal: 18000, commission: 1800, balanceBefore: 33800, balanceAfter: 32000, createdAt: hAgo(24) },
    { id: 'c8', userId: 'u1', name: 'Budi Santoso', orderId: '#RIDE_10239', orderType: 'bike', orderTotal: 22000, commission: 2200, balanceBefore: 90000, balanceAfter: 87800, createdAt: hAgo(28) },
    { id: 'c9', userId: 'u10', name: 'Warung Sari Rasa', orderId: '#FOOD_20113', orderType: 'food', orderTotal: 38000, commission: 3800, balanceBefore: 329400, balanceAfter: 325600, createdAt: hAgo(36) },
    { id: 'c10', userId: 'u6', name: 'Hendra Gunawan', orderId: '#RIDE_10240', orderType: 'car', orderTotal: 65000, commission: 6500, balanceBefore: 265000, balanceAfter: 258500, createdAt: hAgo(48) },
    { id: 'c11', userId: 'u5', name: 'Fajar Nugroho', orderId: '#RIDE_10241', orderType: 'bike', orderTotal: 32000, commission: 3200, balanceBefore: 154700, balanceAfter: 151500, createdAt: hAgo(52) },
    { id: 'c12', userId: 'u12', name: 'Nasi Goreng Mbak Rina', orderId: '#FOOD_20114', orderType: 'food', orderTotal: 75000, commission: 7500, balanceBefore: 186700, balanceAfter: 179200, createdAt: hAgo(60) },
    { id: 'c13', userId: 'u8', name: 'Joko Widodo P.', orderId: '#RIDE_10242', orderType: 'car', orderTotal: 95000, commission: 9500, balanceBefore: 201500, balanceAfter: 192000, createdAt: hAgo(72) },
    { id: 'c14', userId: 'u2', name: 'Agus Wijaya', orderId: '#RIDE_10243', orderType: 'bike', orderTotal: 25000, commission: 2500, balanceBefore: 36300, balanceAfter: 33800, createdAt: hAgo(96) },
    { id: 'c15', userId: 'u10', name: 'Warung Sari Rasa', orderId: '#FOOD_20115', orderType: 'food', orderTotal: 48000, commission: 4800, balanceBefore: 334200, balanceAfter: 329400, createdAt: hAgo(120) },
  ]
}

// ── localStorage Persistence ────────────────────────────────────────────────

const LS_WALLETS = 'indoo_admin_wallets'
const LS_TOPUPS = 'indoo_admin_topups'
const LS_COMMISSIONS = 'indoo_admin_commissions'

function loadOrInit(key, generator) {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  const data = generator()
  localStorage.setItem(key, JSON.stringify(data))
  return data
}

function persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Shared Styles ────────────────────────────────────────────────────────────

const colors = {
  green: '#00FF9D',
  greenAlt: '#8DC63F',
  yellow: '#FFB800',
  yellowAlt: '#FACC15',
  red: '#FF4444',
  redAlt: '#EF4444',
  cyan: '#00E5FF',
  bg: '#0a0a0f',
  card: 'rgba(255,255,255,0.02)',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#fff',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
}

const s = {
  input: {
    padding: '10px 12px',
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 10,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 10,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },
  btnPrimary: (color = colors.greenAlt) => ({
    padding: '8px 16px',
    borderRadius: 10,
    background: color,
    border: 'none',
    color: '#000',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }),
  btnOutline: (color = colors.textSecondary) => ({
    padding: '8px 16px',
    borderRadius: 10,
    background: 'transparent',
    border: `1px solid ${color}40`,
    color: color,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }),
  card: {
    padding: '14px 16px',
    background: colors.card,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 14,
  },
  glass: (borderColor = 'rgba(141,198,63,0.15)') => ({
    padding: 14,
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${borderColor}`,
    borderRadius: 14,
    backdropFilter: 'blur(12px)',
  }),
  badge: (bg, color) => ({
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    background: bg,
    color: color,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.03em',
  }),
  statCard: (color) => ({
    padding: 14,
    background: `${color}0A`,
    border: `1px solid ${color}25`,
    borderRadius: 14,
    textAlign: 'center',
  }),
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WalletAdminTab() {
  const [subTab, setSubTab] = useState('wallets')
  const [wallets, setWallets] = useState(() => loadOrInit(LS_WALLETS, generateDemoWallets))
  const [topUps, setTopUps] = useState(() => loadOrInit(LS_TOPUPS, generateDemoTopUps))
  const [commissions, setCommissions] = useState(() => loadOrInit(LS_COMMISSIONS, generateDemoCommissions))

  // Persist on change
  useEffect(() => { persist(LS_WALLETS, wallets) }, [wallets])
  useEffect(() => { persist(LS_TOPUPS, topUps) }, [topUps])
  useEffect(() => { persist(LS_COMMISSIONS, commissions) }, [commissions])

  const pendingCount = topUps.filter(t => t.status === 'pending').length

  const subTabs = [
    { id: 'wallets', label: 'All Wallets' },
    { id: 'topups', label: 'Pending Top-Ups', badge: pendingCount },
    { id: 'commissions', label: 'Commission Log' },
  ]

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: colors.textPrimary, margin: '0 0 16px' }}>
        Wallet Management
      </h2>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: subTab === tab.id ? colors.greenAlt : colors.inputBg,
              border: subTab === tab.id ? 'none' : `1px solid ${colors.inputBorder}`,
              color: subTab === tab.id ? '#000' : colors.textSecondary,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                background: subTab === tab.id ? '#000' : colors.red,
                color: subTab === tab.id ? colors.greenAlt : '#fff',
                fontSize: 10, fontWeight: 900,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'wallets' && (
        <AllWalletsTab wallets={wallets} setWallets={setWallets} commissions={commissions} topUps={topUps} />
      )}
      {subTab === 'topups' && (
        <PendingTopUpsTab topUps={topUps} setTopUps={setTopUps} wallets={wallets} setWallets={setWallets} />
      )}
      {subTab === 'commissions' && (
        <CommissionLogTab commissions={commissions} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TAB 1: ALL WALLETS
// ═══════════════════════════════════════════════════════════════════════════════

function AllWalletsTab({ wallets, setWallets, commissions, topUps }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [creditModal, setCreditModal] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')

  const filtered = wallets.filter(w => {
    if (filterType !== 'all' && w.type !== filterType) return false
    if (filterStatus !== 'all' && w.status !== filterStatus) return false
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeCount = wallets.filter(w => w.status === 'active').length
  const restrictedCount = wallets.filter(w => w.status === 'restricted').length
  const deactivatedCount = wallets.filter(w => w.status === 'deactivated').length
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

  function getBalanceColor(w) {
    const min = MINIMUM_BALANCE[w.type]
    if (w.balance < min) return colors.red
    if (w.balance < min * 1.5) return colors.yellow
    return colors.green
  }

  function getStatusBadge(status) {
    if (status === 'active') return s.badge(`${colors.greenAlt}20`, colors.greenAlt)
    if (status === 'restricted') return s.badge(`${colors.yellow}20`, colors.yellow)
    return s.badge(`${colors.red}20`, colors.red)
  }

  function handleStatusChange(walletId, newStatus) {
    setWallets(prev => prev.map(w => {
      if (w.id !== walletId) return w
      const updates = { status: newStatus }
      if (newStatus === 'restricted') updates.restrictedAt = new Date().toISOString()
      if (newStatus === 'deactivated') updates.deactivatedAt = new Date().toISOString()
      return { ...w, ...updates }
    }))
  }

  function handleCredit() {
    if (!creditModal || !creditAmount) return
    const amount = Number(creditAmount.replace(/\./g, ''))
    if (!amount || amount <= 0) return
    setWallets(prev => prev.map(w => {
      if (w.id !== creditModal.id) return w
      const newBalance = w.balance + amount
      const newStatus = newBalance >= MINIMUM_BALANCE[w.type] ? 'active' : w.status
      return { ...w, balance: newBalance, status: newStatus, lastTopUp: new Date().toISOString() }
    }))
    setCreditModal(null)
    setCreditAmount('')
    setCreditNote('')
  }

  function getWalletTransactions(userId) {
    return commissions.filter(c => c.userId === userId).slice(0, 5)
  }

  function getWalletTopUps(userId) {
    return topUps.filter(t => t.userId === userId).slice(0, 5)
  }

  return (
    <>
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <div style={s.statCard(colors.greenAlt)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.greenAlt, marginTop: 4 }}>{activeCount}</div>
        </div>
        <div style={s.statCard(colors.yellow)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>RESTRICTED</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.yellow, marginTop: 4 }}>{restrictedCount}</div>
        </div>
        <div style={s.statCard(colors.red)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>DEACTIVATED</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.red, marginTop: 4 }}>{deactivatedCount}</div>
        </div>
        <div style={s.statCard(colors.cyan)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL BALANCE</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: colors.cyan, marginTop: 4 }}>{fmtRp(totalBalance)}</div>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{ ...s.input, flex: 1, minWidth: 140 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={s.select}>
          <option value="all">All Types</option>
          <option value="bike">Bike</option>
          <option value="car">Car</option>
          <option value="restaurant">Restaurant</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.select}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="restricted">Restricted</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Wallet List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted, fontSize: 13 }}>
            No wallets found
          </div>
        )}
        {filtered.map(w => {
          const isExpanded = expandedId === w.id
          const min = MINIMUM_BALANCE[w.type]
          const balColor = getBalanceColor(w)

          return (
            <div key={w.id} style={{ ...s.card, cursor: 'pointer', transition: 'border-color 0.2s', borderColor: isExpanded ? `${colors.greenAlt}30` : colors.cardBorder }}>
              {/* Main row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{TYPE_ICONS[w.type]}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>{w.name}</span>
                    <span style={getStatusBadge(w.status)}>{w.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: colors.textMuted }}>Balance: </span>
                      <span style={{ fontWeight: 800, color: balColor }}>{fmtRp(w.balance)}</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Min: </span>
                      <span style={{ fontWeight: 700, color: colors.textSecondary }}>{fmtRp(min)}</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Type: </span>
                      <span style={{ fontWeight: 700, color: colors.textSecondary }}>{TYPE_LABELS[w.type]}</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Last Top-Up: </span>
                      <span style={{ fontWeight: 700, color: colors.textSecondary }}>{fmtShortDate(w.lastTopUp)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: colors.textMuted, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  &#9660;
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.cardBorder}` }}>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {w.status !== 'active' && (
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(w.id, 'active') }} style={s.btnPrimary(colors.greenAlt)}>
                        Activate
                      </button>
                    )}
                    {w.status !== 'restricted' && (
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(w.id, 'restricted') }} style={s.btnPrimary(colors.yellow)}>
                        Restrict
                      </button>
                    )}
                    {w.status !== 'deactivated' && (
                      <button onClick={(e) => { e.stopPropagation(); handleStatusChange(w.id, 'deactivated') }} style={s.btnPrimary(colors.red)}>
                        Deactivate
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setCreditModal(w) }} style={s.btnPrimary(colors.cyan)}>
                      + Credit
                    </button>
                  </div>

                  {/* Recent commission deductions */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, marginBottom: 8, letterSpacing: '0.05em' }}>
                      RECENT COMMISSION DEDUCTIONS
                    </div>
                    {getWalletTransactions(w.userId).length === 0 ? (
                      <div style={{ fontSize: 12, color: colors.textMuted, padding: '8px 0' }}>No deductions yet</div>
                    ) : (
                      getWalletTransactions(w.userId).map(tx => (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.cardBorder}`, fontSize: 12 }}>
                          <div>
                            <span style={{ color: colors.textSecondary, fontWeight: 700 }}>{tx.orderId}</span>
                            <span style={{ color: colors.textMuted, marginLeft: 8 }}>{timeAgo(tx.createdAt)}</span>
                          </div>
                          <span style={{ color: colors.red, fontWeight: 800 }}>-{fmtRp(tx.commission)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Top-up history */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, marginBottom: 8, letterSpacing: '0.05em' }}>
                      TOP-UP HISTORY
                    </div>
                    {getWalletTopUps(w.userId).length === 0 ? (
                      <div style={{ fontSize: 12, color: colors.textMuted, padding: '8px 0' }}>No top-ups yet</div>
                    ) : (
                      getWalletTopUps(w.userId).map(tu => (
                        <div key={tu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${colors.cardBorder}`, fontSize: 12 }}>
                          <div>
                            <span style={{ color: colors.textSecondary, fontWeight: 700 }}>{fmtRp(tu.amount)}</span>
                            <span style={{ color: colors.textMuted, marginLeft: 8 }}>{tu.method}</span>
                            <span style={{ color: colors.textMuted, marginLeft: 8 }}>{timeAgo(tu.createdAt)}</span>
                          </div>
                          <span style={s.badge(
                            tu.status === 'verified' ? `${colors.greenAlt}20` : tu.status === 'rejected' ? `${colors.red}20` : `${colors.yellow}20`,
                            tu.status === 'verified' ? colors.greenAlt : tu.status === 'rejected' ? colors.red : colors.yellow
                          )}>
                            {tu.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#111', border: `1.5px solid ${colors.greenAlt}30`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${colors.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary }}>
                Add Credit &#8212; {creditModal.name}
              </span>
              <button onClick={() => { setCreditModal(null); setCreditAmount(''); setCreditNote('') }} style={{ width: 36, height: 36, minWidth: 36, borderRadius: '50%', background: colors.redAlt, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                X
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ ...s.glass(`${colors.cyan}20`), marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 700 }}>CURRENT BALANCE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: colors.cyan, marginTop: 4 }}>{fmtRp(creditModal.balance)}</div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>Min: {fmtRp(MINIMUM_BALANCE[creditModal.type])}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.textMuted }}>Rp</span>
                <input
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Amount to add"
                  style={{ ...s.input, flex: 1, fontSize: 16 }}
                  inputMode="numeric"
                  autoFocus
                />
              </div>

              <input
                value={creditNote}
                onChange={e => setCreditNote(e.target.value)}
                placeholder="Admin note (optional)"
                style={{ ...s.input, width: '100%', marginBottom: 14, boxSizing: 'border-box' }}
              />

              <button onClick={handleCredit} style={{ ...s.btnPrimary(colors.greenAlt), width: '100%', padding: 14, fontSize: 14, borderRadius: 14 }}>
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TAB 2: PENDING TOP-UPS
// ═══════════════════════════════════════════════════════════════════════════════

function PendingTopUpsTab({ topUps, setTopUps, wallets, setWallets }) {
  const [filter, setFilter] = useState('pending')
  const [lightbox, setLightbox] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const filtered = topUps.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    return true
  })

  const pendingCount = topUps.filter(t => t.status === 'pending').length
  const verifiedCount = topUps.filter(t => t.status === 'verified').length
  const rejectedCount = topUps.filter(t => t.status === 'rejected').length

  function handleVerify(topUp) {
    setTopUps(prev => prev.map(t =>
      t.id === topUp.id ? { ...t, status: 'verified', verifiedAt: new Date().toISOString() } : t
    ))
    setWallets(prev => prev.map(w => {
      if (w.userId !== topUp.userId) return w
      const newBalance = w.balance + topUp.amount
      const newStatus = newBalance >= MINIMUM_BALANCE[w.type] ? 'active' : w.status
      return { ...w, balance: newBalance, status: newStatus, lastTopUp: new Date().toISOString() }
    }))
  }

  function handleReject() {
    if (!rejectModal) return
    setTopUps(prev => prev.map(t =>
      t.id === rejectModal.id ? { ...t, status: 'rejected', rejectedAt: new Date().toISOString(), rejectReason: rejectReason || 'No reason given' } : t
    ))
    setRejectModal(null)
    setRejectReason('')
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <div style={s.statCard(colors.yellow)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700 }}>PENDING</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.yellow, marginTop: 4 }}>{pendingCount}</div>
        </div>
        <div style={s.statCard(colors.greenAlt)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700 }}>VERIFIED</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.greenAlt, marginTop: 4 }}>{verifiedCount}</div>
        </div>
        <div style={s.statCard(colors.red)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700 }}>REJECTED</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: colors.red, marginTop: 4 }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['all', 'pending', 'verified', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: filter === f ? (f === 'pending' ? colors.yellow : f === 'verified' ? colors.greenAlt : f === 'rejected' ? colors.red : colors.cyan) : colors.inputBg,
              border: filter === f ? 'none' : `1px solid ${colors.inputBorder}`,
              color: filter === f ? '#000' : colors.textSecondary,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && filter !== f && (
              <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: colors.red, color: '#fff', fontSize: 10, fontWeight: 900 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Top-up list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted, fontSize: 13 }}>
            No top-ups found
          </div>
        )}
        {filtered.map(tu => (
          <div key={tu.id} style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Screenshot thumbnail */}
              <div
                onClick={() => setLightbox(tu.screenshotUrl)}
                style={{
                  width: 60, height: 80, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${colors.inputBorder}`,
                }}
              >
                <img
                  src={tu.screenshotUrl}
                  alt="Transfer proof"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>{tu.name}</span>
                  <span style={s.badge(
                    tu.status === 'pending' ? `${colors.yellow}20` : tu.status === 'verified' ? `${colors.greenAlt}20` : `${colors.red}20`,
                    tu.status === 'pending' ? colors.yellow : tu.status === 'verified' ? colors.greenAlt : colors.red
                  )}>
                    {tu.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: colors.green }}>{fmtRp(tu.amount)}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: colors.textMuted, flexWrap: 'wrap' }}>
                  <span>{TYPE_ICONS[tu.type]} {TYPE_LABELS[tu.type]}</span>
                  <span>{tu.method}</span>
                  <span>{timeAgo(tu.createdAt)}</span>
                </div>

                {tu.status === 'rejected' && tu.rejectReason && (
                  <div style={{ marginTop: 6, fontSize: 11, color: colors.red, fontStyle: 'italic' }}>
                    Rejected: {tu.rejectReason}
                  </div>
                )}
                {tu.status === 'verified' && tu.verifiedAt && (
                  <div style={{ marginTop: 6, fontSize: 11, color: colors.greenAlt }}>
                    Verified {timeAgo(tu.verifiedAt)}
                  </div>
                )}
              </div>

              {/* Action buttons (only for pending) */}
              {tu.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleVerify(tu)}
                    style={{ ...s.btnPrimary(colors.greenAlt), padding: '10px 14px', fontSize: 14, minHeight: 44 }}
                    title="Verify top-up"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setRejectModal(tu)}
                    style={{ ...s.btnPrimary(colors.red), padding: '10px 14px', fontSize: 14, minHeight: 44 }}
                    title="Reject top-up"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'pointer',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={lightbox}
              alt="Transfer screenshot"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, border: `2px solid ${colors.cardBorder}` }}
            />
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: -14, right: -14,
                width: 36, height: 36, borderRadius: '50%',
                background: colors.red, border: 'none', color: '#fff',
                fontSize: 16, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              X
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#111', border: `1.5px solid ${colors.red}30`, borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${colors.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary }}>
                Reject Top-Up &#8212; {rejectModal.name}
              </span>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ width: 36, height: 36, minWidth: 36, borderRadius: '50%', background: colors.redAlt, border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                X
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                Rejecting top-up of <strong style={{ color: colors.textPrimary }}>{fmtRp(rejectModal.amount)}</strong>
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g., screenshot blurry, amount mismatch)..."
                rows={3}
                style={{ ...s.input, width: '100%', resize: 'vertical', marginBottom: 14, boxSizing: 'border-box' }}
                autoFocus
              />
              <button onClick={handleReject} style={{ ...s.btnPrimary(colors.red), width: '100%', padding: 14, fontSize: 14, borderRadius: 14 }}>
                Reject Top-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-TAB 3: COMMISSION LOG
// ═══════════════════════════════════════════════════════════════════════════════

function CommissionLogTab({ commissions }) {
  const [filterType, setFilterType] = useState('all')

  const filtered = commissions.filter(c => {
    if (filterType === 'all') return true
    if (filterType === 'bike') return c.orderType === 'bike'
    if (filterType === 'car') return c.orderType === 'car'
    if (filterType === 'food') return c.orderType === 'food'
    return true
  })

  // Compute summary stats
  const nowMs = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(todayStart); monthStart.setDate(1)

  const todayTotal = commissions.filter(c => new Date(c.createdAt) >= todayStart).reduce((s, c) => s + c.commission, 0)
  const weekTotal = commissions.filter(c => new Date(c.createdAt) >= weekStart).reduce((s, c) => s + c.commission, 0)
  const monthTotal = commissions.filter(c => new Date(c.createdAt) >= monthStart).reduce((s, c) => s + c.commission, 0)

  const orderTypeColor = { bike: colors.cyan, car: colors.yellow, food: colors.green }
  const orderTypeLabel = { bike: 'Bike Ride', car: 'Car Ride', food: 'Food Order' }

  return (
    <>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        <div style={s.statCard(colors.greenAlt)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>TODAY</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: colors.greenAlt, marginTop: 4 }}>{fmtRp(todayTotal)}</div>
        </div>
        <div style={s.statCard(colors.cyan)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>THIS WEEK</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: colors.cyan, marginTop: 4 }}>{fmtRp(weekTotal)}</div>
        </div>
        <div style={s.statCard(colors.yellow)}>
          <div style={{ fontSize: 9, color: colors.textMuted, fontWeight: 700, letterSpacing: '0.05em' }}>THIS MONTH</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: colors.yellow, marginTop: 4 }}>{fmtRp(monthTotal)}</div>
        </div>
      </div>

      {/* Filter + Export */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={s.select}>
          <option value="all">All Types</option>
          <option value="bike">Bike Ride</option>
          <option value="car">Car Ride</option>
          <option value="food">Food Order</option>
        </select>
        <div style={{ flex: 1 }} />
        <button style={{ ...s.btnOutline(colors.textMuted), opacity: 0.5, cursor: 'not-allowed', minHeight: 44 }} disabled title="Coming soon">
          Export CSV (soon)
        </button>
      </div>

      {/* Commission list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr', gap: 8, padding: '8px 14px', fontSize: 10, fontWeight: 800, color: colors.textMuted, letterSpacing: '0.05em' }}>
          <span>USER</span>
          <span>ORDER</span>
          <span style={{ textAlign: 'right' }}>TOTAL</span>
          <span style={{ textAlign: 'right' }}>COMMISSION</span>
          <span style={{ textAlign: 'right' }}>BALANCE</span>
          <span style={{ textAlign: 'right' }}>DATE</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted, fontSize: 13 }}>
            No commission entries found
          </div>
        )}

        {filtered.map(c => (
          <div key={c.id} style={{ ...s.card, display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '10px 14px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary }}>{c.orderId}</div>
              <span style={s.badge(`${orderTypeColor[c.orderType]}20`, orderTypeColor[c.orderType])}>
                {orderTypeLabel[c.orderType] || c.orderType}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.textSecondary, textAlign: 'right' }}>
              {fmtRp(c.orderTotal)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: colors.red, textAlign: 'right' }}>
              -{fmtRp(c.commission)}
            </span>
            <div style={{ textAlign: 'right', fontSize: 11 }}>
              <div style={{ color: colors.textMuted }}>{fmtRp(c.balanceBefore)}</div>
              <div style={{ color: colors.textSecondary, fontWeight: 700 }}>{fmtRp(c.balanceAfter)}</div>
            </div>
            <span style={{ fontSize: 11, color: colors.textMuted, textAlign: 'right' }}>
              {fmtDate(c.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {/* Total row */}
      {filtered.length > 0 && (
        <div style={{ ...s.glass(`${colors.greenAlt}20`), marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: colors.textMuted }}>
            TOTAL ({filtered.length} entries)
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, color: colors.greenAlt }}>
            {fmtRp(filtered.reduce((sum, c) => sum + c.commission, 0))}
          </span>
        </div>
      )}
    </>
  )
}
