/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VendorDashboardV2 — Ultimate Food Vendor Dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * Stripe + Shopify inspired. 6 pages. Live/Offline toggles. Help icons.
 * Full CRUD menu management. Orders feed. Analytics. Payouts.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')
const LOCAL_KEY = 'indoo_vendor_restaurant'

// ── Help content per section ─────────────────────────────────────────────────
const HELP = {
  menu: {
    title: 'Menu Management',
    steps: [
      'Tap "+ Add Item" to create a new menu item with name, price, photo, and category.',
      'Use the green/grey toggle on each item to set it LIVE (visible to customers) or OFFLINE (hidden).',
      'Tap the pencil icon to edit an item, or the trash icon to delete it.',
      'Filter by category or status using the dropdowns above.',
      'Customers only see LIVE items — use OFFLINE during busy hours instead of deleting.',
    ],
  },
  orders: {
    title: 'Orders',
    steps: [
      'New orders appear here automatically when a customer places an order.',
      'Tap "Confirm" to accept the order and start preparing.',
      'Update status as you progress: Preparing → Ready → Completed.',
      'The driver will be notified when the order is ready for pickup.',
      'Completed orders move to the history tab.',
    ],
  },
  analytics: {
    title: 'Analytics',
    steps: [
      'Track your daily, weekly, and monthly sales.',
      'See which items sell the most so you can stock accordingly.',
      'Peak hours show when you get the most orders — staff up during these times.',
      'Items set to OFFLINE during peak hours may reduce your revenue.',
    ],
  },
  settings: {
    title: 'Store Settings',
    steps: [
      'Update your store name, photo, and address here.',
      'Set your opening and closing hours — customers see this on your page.',
      'Add your bank details so customers can pay you directly.',
      'Keep your phone number updated so drivers can contact you.',
    ],
  },
  payouts: {
    title: 'Payouts',
    steps: [
      'INDOO takes 10% commission on every order (7% if customer pays via bank transfer).',
      'Commission is tracked here. You pay INDOO from your wallet balance.',
      'When your commission owed exceeds Rp 50,000, please top up your wallet.',
      'All customer payments go directly to your bank account — INDOO never holds your money.',
    ],
  },
  toggle: {
    title: 'Live / Offline Toggle',
    steps: [
      'LIVE means customers can see and order this item.',
      'OFFLINE means the item is hidden from customers.',
      'Use this during busy hours to pause specific items without deleting them.',
      'The master toggle at the top sets your entire store Live or Offline.',
      'Individual item toggles can override the global status.',
    ],
  },
}

function HelpIcon({ section }) {
  const [open, setOpen] = useState(false)
  const help = HELP[section]
  if (!help) return null
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        width: 22, height: 22, borderRadius: '50%', background: 'rgba(141,198,63,0.15)',
        border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 11, fontWeight: 900,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>?</button>
      {open && createPortal(
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>💡</div>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 12px', textAlign: 'center' }}>{help.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {help.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Got it!</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ── Status Toggle ────────────────────────────────────────────────────────────
function StatusToggle({ active, onChange, size = 'normal' }) {
  const w = size === 'large' ? 56 : 44
  const h = size === 'large' ? 28 : 24
  const knob = size === 'large' ? 22 : 18
  return (
    <button onClick={() => onChange(!active)} style={{
      width: w, height: h, borderRadius: h, border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
      background: active ? '#8DC63F' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: (h - knob) / 2, left: active ? w - knob - 3 : 3,
        width: knob, height: knob, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, helpKey, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, flex: 1 }}>{title}</h2>
      {helpKey && <HelpIcon section={helpKey} />}
      {children}
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = '#8DC63F', icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
    </div>
  )
}

// ── Menu Item Card ───────────────────────────────────────────────────────────
function MenuCard({ item, onToggle, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      opacity: item.is_available ? 1 : 0.5, transition: 'opacity 0.3s',
    }}>
      {item.photo_url ? (
        <img src={item.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🍽️</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.category}</span>
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
        background: item.is_available ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)',
        color: item.is_available ? '#8DC63F' : 'rgba(255,255,255,0.3)',
      }}>{item.is_available ? 'LIVE' : 'OFF'}</span>
      <StatusToggle active={item.is_available} onChange={() => onToggle(item.id)} />
      <button onClick={() => onEdit(item)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button onClick={() => onDelete(item.id)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>
  )
}

const MENU_CATS = ['All', 'Main', 'Sides', 'Drinks', 'Snacks', 'Desserts', 'Rice', 'Noodles', 'Gorengan', 'Tea & Coffee', 'Juice & Smoothie', 'Satay & Grilled']

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'payouts', label: 'Payouts', icon: '💰' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VendorDashboardV2({ onClose }) {
  const [page, setPage] = useState('overview')
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [storeOpen, setStoreOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY))?.is_open ?? true } catch { return true }
  })
  const [editItem, setEditItem] = useState(null) // null = closed, {} = new, {...} = editing
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [menuFilter, setMenuFilter] = useState('All')
  const [menuStatus, setMenuStatus] = useState('all') // 'all' | 'live' | 'offline'
  const [menuSearch, setMenuSearch] = useState('')
  const [sideOpen, setSideOpen] = useState(false)
  const [liveListOpen, setLiveListOpen] = useState(false)
  const [offlineListOpen, setOfflineListOpen] = useState(false)

  // Load restaurant data
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
      if (data) {
        setRestaurant(data)
        setMenuItems(data.menu_items ?? [])
        setStoreOpen(data.is_open ?? true)
      }
    } catch {}
  }, [])

  // Persist changes
  const persist = (items, open) => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
      data.menu_items = items
      data.is_open = open ?? storeOpen
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
    } catch {}
  }

  // ── Menu CRUD ──────────────────────────────────────────────────────────────
  const toggleItem = (id) => {
    setMenuItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, is_available: !i.is_available } : i)
      persist(updated)
      return updated
    })
  }

  const deleteItem = (id) => {
    setMenuItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      persist(updated)
      return updated
    })
    setDeleteConfirm(null)
  }

  const saveItem = (item) => {
    setMenuItems(prev => {
      let updated
      if (prev.find(i => i.id === item.id)) {
        updated = prev.map(i => i.id === item.id ? item : i)
      } else {
        updated = [...prev, { ...item, id: Date.now(), is_available: true }]
      }
      persist(updated)
      return updated
    })
    setEditItem(null)
  }

  const toggleStore = (val) => {
    setStoreOpen(val)
    persist(menuItems, val)
  }

  // Filtered menu
  const filtered = menuItems.filter(i => {
    if (menuFilter !== 'All' && i.category !== menuFilter) return false
    if (menuStatus === 'live' && !i.is_available) return false
    if (menuStatus === 'offline' && i.is_available) return false
    if (menuSearch && !i.name.toLowerCase().includes(menuSearch.toLowerCase())) return false
    return true
  })

  const liveCount = menuItems.filter(i => i.is_available).length
  const offCount = menuItems.length - liveCount

  // Demo orders with full details
  const [orders, setOrders] = useState([
    { id: 'ORD-1001', items: [{ name: 'Nasi Gudeg', qty: 2, prepTime: 10 }, { name: 'Es Teh', qty: 2, prepTime: 2 }], total: 66000, customer: 'Agus Prasetyo', phone: '6281234567890', address: 'Jl. Kaliurang Km 5', status: 'confirmed', time: '2 min ago', driverETA: 8, paymentMethod: 'bank', qrCode: 'INDOO-1001-AGS' },
    { id: 'ORD-1002', items: [{ name: 'Bakso Jumbo', qty: 1, prepTime: 8 }, { name: 'Es Jeruk', qty: 1, prepTime: 3 }], total: 33000, customer: 'Siti Rahayu', phone: '6281234567891', address: 'Jl. Malioboro 12', status: 'preparing', time: '8 min ago', driverETA: 4, paymentMethod: 'cod', qrCode: 'INDOO-1002-STI' },
    { id: 'ORD-1003', items: [{ name: 'Nasi Goreng', qty: 3, prepTime: 12 }, { name: 'Sate Ayam', qty: 1, prepTime: 10 }], total: 119000, customer: 'Budi Wijaya', phone: '6281234567892', address: 'Jl. Parangtritis 45', status: 'ready', time: '15 min ago', driverETA: 1, paymentMethod: 'bank', qrCode: 'INDOO-1003-BDI' },
    { id: 'ORD-1004', items: [{ name: 'Ayam Geprek', qty: 2, prepTime: 12 }], total: 50000, customer: 'Dewi Lestari', phone: '6281234567893', address: 'Jl. Solo Km 3', status: 'completed', time: '32 min ago', driverETA: 0, paymentMethod: 'bank', qrCode: 'INDOO-1004-DWI', qrScanned: true },
  ])
  const [showQR, setShowQR] = useState(null) // order id showing QR

  const audioRef = useRef(null)

  // Play notification sound for unaccepted orders
  useEffect(() => {
    const hasUnaccepted = orders.some(o => o.status === 'confirmed')
    if (hasUnaccepted) {
      // Create audio context for notification beep
      const playBeep = () => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = 880 // A5 note
          gain.gain.value = 0.15
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
          osc.stop(ctx.currentTime + 0.5)
          // Second beep
          setTimeout(() => {
            const osc2 = ctx.createOscillator()
            const gain2 = ctx.createGain()
            osc2.connect(gain2)
            gain2.connect(ctx.destination)
            osc2.frequency.value = 1100 // C#6
            gain2.gain.value = 0.15
            osc2.start()
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
            osc2.stop(ctx.currentTime + 0.5)
          }, 200)
        } catch {}
      }
      playBeep()
      audioRef.current = setInterval(playBeep, 5000) // repeat every 5 seconds
      return () => clearInterval(audioRef.current)
    } else {
      if (audioRef.current) clearInterval(audioRef.current)
    }
  }, [orders.filter(o => o.status === 'confirmed').length]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column',
      backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png?updatedAt=1776728649363)',
      backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: '#000',
      isolation: 'isolate',
    }}>
      {/* Glass overlay — same as notifications */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 0, pointerEvents: 'none' }} />
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes flashGreen { 0%,100% { background: #8DC63F; transform: scale(1); } 50% { background: #6BA32D; transform: scale(1.02); box-shadow: 0 0 20px rgba(141,198,63,0.5); } }
        @keyframes runLeftLight { 0% { top: -30%; } 100% { top: 100%; } }
      `}</style>

      {/* ── Header — same style as notifications ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: 'transparent', position: 'relative', zIndex: 1, flexShrink: 0,
      }}>
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_07_28%20AM.png?updatedAt=1776532065659" alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{restaurant?.name ?? 'My Restaurant'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block' }}>{restaurant?.city ?? ''}{restaurant?.address ? ` · ${restaurant.address}` : ''}</span>
        </div>
        <button onClick={() => setSideOpen(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      {/* ── Stats strip — same as notifications ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'transparent', position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{fmtRp(847000)}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sales</span>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', lineHeight: 1 }}>23</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</span>
        </div>
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: storeOpen ? '#8DC63F' : '#EF4444', lineHeight: 1 }}>{storeOpen ? 'Open' : 'Closed'}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
        </div>
      </div>

      {/* ── Content — scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingBottom: 100, background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '0 16px' }}>

        {/* ══════════ PAGE: OVERVIEW ══════════ */}
        {page === 'overview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Today's Overview</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: storeOpen ? '#8DC63F' : '#EF4444' }}>{storeOpen ? 'OPEN' : 'CLOSED'}</span>
                <StatusToggle active={storeOpen} onChange={toggleStore} size="large" />
                <HelpIcon section="toggle" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="Sales" value={fmtRp(847000)} color="#FACC15" icon="💰" />
              <StatCard label="Orders" value="23" color="#8DC63F" icon="📦" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {/* Live Items — tappable */}
              <div onClick={() => setPage('live')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>🟢 LIVE ITEMS</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F' }}>{liveCount}</span>
                <img src="https://ik.imagekit.io/nepgaxllc/Detailed%20white%20fingerprint%20on%20transparent%20background.png?updatedAt=1775934544111" alt="" style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
              {/* Offline Items — tappable */}
              <div onClick={() => setPage('offline')} style={{
                flex: 1, minWidth: 120, padding: '16px 14px', borderRadius: 16, cursor: 'pointer', position: 'relative',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: 8 }}>⚫ OFFLINE</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{offCount}</span>
                <img src="https://ik.imagekit.io/nepgaxllc/Detailed%20white%20fingerprint%20on%20transparent%20background.png?updatedAt=1775934544111" alt="" style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, opacity: 0.15, objectFit: 'contain' }} />
              </div>
            </div>

            <SectionHeader title="Live Orders" helpKey="orders" />
            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No active orders right now</div>
            ) : orders.filter(o => o.status !== 'completed').map(o => {
              const statusColor = o.status === 'confirmed' ? '#8DC63F' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
              return (
                <div key={o.id} style={{
                  padding: 14, borderRadius: 16, marginBottom: 10, position: 'relative', overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${statusColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  borderLeft: `4px solid ${statusColor}`,
                }}>
                  {/* Running light on left border for confirmed orders */}
                  {o.status === 'confirmed' && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '30%', background: 'linear-gradient(180deg, transparent, #fff, transparent)', animation: 'runLeftLight 1.5s linear infinite', position: 'absolute' }} />
                    </div>
                  )}
                  {/* Order ref + status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{o.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: `${statusColor}20`, color: statusColor, textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{o.time}</span>
                  </div>

                  {/* Customer info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: o.paymentMethod === 'bank' ? 'rgba(141,198,63,0.1)' : 'rgba(250,204,21,0.1)', color: o.paymentMethod === 'bank' ? '#8DC63F' : '#FACC15' }}>
                      {o.paymentMethod === 'bank' ? 'Bank' : 'COD'}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ marginBottom: 10 }}>
                    {o.items.map((it, i) => (
                      <span key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.6 }}>
                        {it.qty}x {it.name}
                      </span>
                    ))}
                  </div>

                  {/* Total + Driver ETA */}
                  {/* Prep time + Driver ETA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(o.total)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>🍳</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          Prep: {Math.max(...o.items.map(i => i.prepTime ?? 10))} min
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#8DC63F' : '#FACC15' }}>
                          {o.driverETA === 0 ? 'Delivered' : o.driverETA <= 2 ? 'Arriving now' : `Driver: ${o.driverETA} min`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button based on status */}
                  <div style={{ marginTop: 10 }}>
                    {o.status === 'confirmed' && (
                      <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                        animation: 'flashGreen 1s ease-in-out infinite',
                      }}>
                        ✓ Accept Order
                      </button>
                    )}
                    {o.status === 'preparing' && (
                      <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#FACC15', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                      }}>
                        🔔 Ready for Pickup
                      </button>
                    )}
                    {o.status === 'ready' && (
                      <button onClick={() => setShowQR(o.id)} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: '#60A5FA', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                      }}>
                        📱 Show QR for Driver Scan
                      </button>
                    )}
                    {o.status === 'ready' && (
                      <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginTop: 6, textAlign: 'center' }}>
                        ⚠️ Payment processes only after driver scans QR
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ══════════ PAGE: MENU ══════════ */}
        {page === 'menu' && (
          <>
            <SectionHeader title="Menu Management" helpKey="menu">
              <button onClick={() => setEditItem({})} style={{ padding: '8px 16px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>+ Add Item</button>
            </SectionHeader>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }} />
              <select value={menuFilter} onChange={e => setMenuFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }}>
                {MENU_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={menuStatus} onChange={e => setMenuStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 12, outline: 'none' }}>
                <option value="all">All Status</option>
                <option value="live">Live Only</option>
                <option value="offline">Offline Only</option>
              </select>
            </div>

            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 12 }}>{filtered.length} items · {liveCount} live · {offCount} offline</span>

            {/* Menu items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  {menuItems.length === 0 ? 'No menu items yet — tap "+ Add Item" to start' : 'No items match your filters'}
                </div>
              ) : filtered.map(item => (
                <MenuCard key={item.id} item={item} onToggle={toggleItem} onEdit={setEditItem} onDelete={(id) => setDeleteConfirm(id)} />
              ))}
            </div>
          </>
        )}

        {/* ══════════ PAGE: ORDERS ══════════ */}
        {page === 'orders' && (
          <>
            <SectionHeader title="Active Orders" helpKey="orders" />
            {orders.filter(o => o.status !== 'completed').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No active orders</div>
            ) : orders.filter(o => o.status !== 'completed').map(o => {
              const statusColor = o.status === 'confirmed' ? '#8DC63F' : o.status === 'preparing' ? '#FACC15' : '#60A5FA'
              return (
                <div key={o.id} style={{ padding: 14, borderRadius: 16, marginBottom: 10, position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${statusColor}30`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', borderLeft: `4px solid ${statusColor}` }}>
                  {o.status === 'confirmed' && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '30%', background: 'linear-gradient(180deg, transparent, #fff, transparent)', animation: 'runLeftLight 1.5s linear infinite', position: 'absolute' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{o.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6, background: `${statusColor}20`, color: statusColor, textTransform: 'uppercase' }}>{o.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{o.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block' }}>{o.customer}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{o.address}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: o.paymentMethod === 'bank' ? 'rgba(141,198,63,0.1)' : 'rgba(250,204,21,0.1)', color: o.paymentMethod === 'bank' ? '#8DC63F' : '#FACC15' }}>
                      {o.paymentMethod === 'bank' ? 'Bank' : 'COD'}
                    </span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {o.items.map((it, i) => <span key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1.6 }}>{it.qty}x {it.name}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(o.total)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12 }}>🍳</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          Prep: {Math.max(...o.items.map(i => i.prepTime ?? 10))} min
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: o.driverETA <= 2 ? '#8DC63F' : '#FACC15' }}>
                          {o.driverETA <= 2 ? 'Arriving now' : `Driver: ${o.driverETA} min`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {o.status === 'confirmed' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', animation: 'flashGreen 1s ease-in-out infinite' }}>✓ Accept Order</button>}
                    {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>🔔 Ready for Pickup</button>}
                    {o.status === 'ready' && (
                      <>
                        <button onClick={() => setShowQR(o.id)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#60A5FA', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer' }}>📱 Show QR for Driver Scan</button>
                        <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginTop: 6, textAlign: 'center' }}>⚠️ Payment processes only after driver scans QR</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            <SectionHeader title="Completed Orders" />
            {orders.filter(o => o.status === 'completed').map(o => (
              <div key={o.id} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8, opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{o.id}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{o.customer} · {o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(o.total)}</span>
                    <span style={{ fontSize: 9, color: '#8DC63F', display: 'block' }}>✓ Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════ PAGE: ANALYTICS ══════════ */}
        {page === 'analytics' && (
          <>
            <SectionHeader title="Analytics" helpKey="analytics" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="This Week" value={fmtRp(4250000)} color="#FACC15" icon="📊" />
              <StatCard label="This Month" value={fmtRp(18700000)} color="#8DC63F" icon="📈" />
            </div>

            <SectionHeader title="Top Selling Items" />
            {menuItems.slice(0, 5).map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.3)', width: 20 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>{fmtRp(item.price * (12 - i * 2))}</span>
              </div>
            ))}

            <SectionHeader title="Peak Hours" />
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, marginBottom: 20 }}>
              {[10,25,40,65,90,100,85,70,45,30,15,8].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 70 ? '#8DC63F' : h > 40 ? '#FACC15' : 'rgba(255,255,255,0.08)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} title={`${i + 9}:00`} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
              <span>9am</span><span>12pm</span><span>3pm</span><span>6pm</span><span>9pm</span>
            </div>
          </>
        )}

        {/* ══════════ PAGE: SETTINGS ══════════ */}
        {page === 'settings' && (
          <>
            <SectionHeader title="Store Settings" helpKey="settings" />
            {[
              { label: 'Store Name', value: restaurant?.name ?? '', key: 'name' },
              { label: 'Address', value: restaurant?.address ?? '', key: 'address' },
              { label: 'City', value: restaurant?.city ?? '', key: 'city' },
              { label: 'Phone', value: restaurant?.phone ?? '', key: 'phone' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</label>
                <input defaultValue={field.value} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginTop: 8 }}>Save Changes</button>
          </>
        )}

        {/* ══════════ PAGE: PAYOUTS ══════════ */}
        {page === 'payouts' && (
          <>
            <SectionHeader title="Payouts" helpKey="payouts" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard label="Balance" value={fmtRp(1250000)} color="#8DC63F" icon="💰" />
              <StatCard label="Commission Owed" value={fmtRp(187000)} color="#EF4444" icon="📊" />
            </div>

            <SectionHeader title="Recent Transactions" />
            {[
              { type: 'Order', ref: 'ORD-1001', amount: 66000, commission: 6600, date: 'Today' },
              { type: 'Order', ref: 'ORD-0998', amount: 45000, commission: 4500, date: 'Yesterday' },
              { type: 'Payout', ref: 'PAY-0055', amount: -500000, commission: 0, date: '2 days ago' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.ref}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{t.date}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: t.amount > 0 ? '#8DC63F' : '#EF4444' }}>{t.amount > 0 ? '+' : ''}{fmtRp(Math.abs(t.amount))}</span>
                  {t.commission > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block' }}>-{fmtRp(t.commission)} commission</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══════════ PAGE: LIVE ITEMS ══════════ */}
        {page === 'live' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', margin: 0, flex: 1 }}>🟢 Live Items ({liveCount})</h2>
              <HelpIcon section="menu" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.filter(i => i.is_available).map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                  <StatusToggle active={true} onChange={() => toggleItem(item.id)} />
                </div>
              ))}
              {liveCount === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No live items — toggle items on from Offline page</div>}
            </div>
          </>
        )}

        {/* ══════════ PAGE: OFFLINE ITEMS ══════════ */}
        {page === 'offline' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPage('overview')} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.5)', margin: 0, flex: 1 }}>⚫ Offline Items ({offCount})</h2>
              <HelpIcon section="menu" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.filter(i => !i.is_available).map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14,
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', opacity: 0.7,
                }}>
                  {item.photo_url ? <img src={item.photo_url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtRp(item.price)}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>{item.category}</span>
                  </div>
                  <button onClick={() => setEditItem(item)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                  <StatusToggle active={false} onChange={() => toggleItem(item.id)} />
                </div>
              ))}
              {offCount === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>All items are live — nothing offline</div>}
            </div>
          </>
        )}
        </div>
      </div>

      {/* ── Add/Edit Item Modal ── */}
      {editItem !== null && (
        <ItemModal item={editItem} onSave={saveItem} onClose={() => setEditItem(null)} />
      )}


      {/* ── QR Code Modal — vendor shows to driver ── */}
      {showQR && (() => {
        const order = orders.find(o => o.id === showQR)
        if (!order) return null
        return (
          <div onClick={() => setShowQR(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center', border: '2px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>{order.id}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>Show this QR to the driver</span>

              {/* QR Code */}
              <div style={{ padding: 16, borderRadius: 16, background: '#fff', display: 'inline-block', marginBottom: 16 }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${order.qrCode}`} alt="QR" style={{ width: 180, height: 180, display: 'block' }} />
              </div>

              {/* Order summary */}
              <div style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4 }}>{order.customer}</span>
                {order.items.map((it, i) => (
                  <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block' }}>{it.qty}x {it.name}</span>
                ))}
                <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 6 }}>{fmtRp(order.total)}</span>
              </div>

              <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'block', marginBottom: 12 }}>
                ⚠️ Payment will only process after driver scans this code
              </span>

              {/* Simulate scan button (demo) */}
              <button onClick={() => { updateOrderStatus(order.id, 'completed'); setShowQR(null) }} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', marginBottom: 8,
              }}>
                ✓ Driver Scanned — Complete Order
              </button>
              <button onClick={() => setShowQR(null)} style={{
                width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                Close
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a1e', borderRadius: 20, padding: 24, maxWidth: 300, width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🗑️</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>Delete this item?</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 16 }}>This action cannot be undone.</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteItem(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#EF4444', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Side Menu Overlay ── */}
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 260, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 16px 20px', animation: 'slideInRight 0.25s ease' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 4 }}>{restaurant?.name ?? 'My Restaurant'}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 20 }}>{restaurant?.cuisine_type ?? ''} · {restaurant?.city ?? ''}</span>
            {NAV_ITEMS.map(nav => (
              <button key={nav.id} onClick={() => { setPage(nav.id); setSideOpen(false) }} style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4,
                background: page === nav.id ? 'rgba(141,198,63,0.1)' : 'none',
                color: page === nav.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
                fontSize: 14, fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>{nav.icon}</span> {nav.label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12, paddingTop: 12 }}>
              <button onClick={onClose} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>✕ Close Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// ── Add/Edit Item Modal ──────────────────────────────────────────────────────
function ItemModal({ item, onSave, onClose }) {
  const isNew = !item?.id
  const [name, setName] = useState(item?.name ?? '')
  const [price, setPrice] = useState(item?.price?.toString() ?? '')
  const [category, setCategory] = useState(item?.category ?? 'Main')
  const [description, setDescription] = useState(item?.description ?? '')
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url ?? null)

  const handleSave = () => {
    if (!name.trim() || !price) return
    onSave({
      ...item,
      id: item?.id ?? Date.now(),
      name: name.trim(),
      price: Number(price),
      category,
      description: description.trim(),
      photo_url: photoUrl,
      is_available: item?.is_available ?? true,
    })
  }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: '#111', borderRadius: '24px 24px 0 0',
        borderTop: '3px solid #8DC63F', padding: '20px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>{isNew ? 'Add Menu Item' : 'Edit Menu Item'}</h3>

        <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Item Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nasi Goreng Spesial" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Price (Rp)</label>
        <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="25000" inputMode="numeric" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Category</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {MENU_CATS.filter(c => c !== 'All').map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
              background: category === c ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)',
              color: category === c ? '#8DC63F' : 'rgba(255,255,255,0.4)',
              outline: category === c ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}>{c}</button>
          ))}
        </div>

        <label style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your dish..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 16, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !price} style={{ flex: 2, padding: '14px', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', opacity: name.trim() && price ? 1 : 0.4 }}>{isNew ? 'Add Item' : 'Save Changes'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
