/**
 * PurchaseHistoryScreen — buyer order management.
 * Shows all orders with status, details, reorder button.
 * Accessible from buyer profile or bottom nav.
 */
import { useState } from 'react'
import styles from './PurchaseHistoryScreen.module.css'

function fmtIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

function fmtDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG = {
  pending:     { label: 'Pending',      color: '#FBBF24', icon: '⏳' },
  confirmed:   { label: 'Confirmed',    color: '#8DC63F', icon: '✓' },
  shipped:     { label: 'Shipped',      color: '#818CF8', icon: '📦' },
  delivered:   { label: 'Delivered',    color: '#8DC63F', icon: '✅' },
  complete:    { label: 'Complete',     color: '#8DC63F', icon: '✅' },
  cancelled:   { label: 'Cancelled',   color: '#EF4444', icon: '✕' },
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'complete', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

// Demo orders
const DEMO_ORDERS = [
  {
    id: 'ord-1', ref: '#IM-3637', status: 'delivered',
    product: 'Wireless Earbuds Pro', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaa.png',
    seller: 'SoundMax', qty: 1, total: 262500, date: Date.now() - 2 * 86400000,
    delivery: 'JNE', trackingNo: 'JNE12345678', safeTrade: true,
  },
  {
    id: 'ord-2', ref: '#IM-4182', status: 'shipped',
    product: 'Leather Crossbody Bag', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssd.png',
    seller: 'Kulit Asli', qty: 1, total: 1200000, date: Date.now() - 1 * 86400000,
    delivery: 'SiCepat', trackingNo: 'SCP87654321', safeTrade: true,
  },
  {
    id: 'ord-3', ref: '#IM-4201', status: 'confirmed',
    product: 'Slim Card Wallet', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasda.png',
    seller: 'Kulit Asli', qty: 2, total: 544000, date: Date.now() - 4 * 3600000,
    delivery: 'Bike Delivery', trackingNo: null, safeTrade: false,
  },
  {
    id: 'ord-4', ref: '#IM-2890', status: 'complete',
    product: 'Leather Keychain', image: 'https://ik.imagekit.io/nepgaxllc/Untitledzxczxczxczx.png',
    seller: 'Kulit Asli', qty: 3, total: 285000, date: Date.now() - 10 * 86400000,
    delivery: 'Pos Indonesia', trackingNo: 'POS99887766', safeTrade: false,
  },
  {
    id: 'ord-5', ref: '#IM-1455', status: 'cancelled',
    product: 'Bifold Leather Wallet', image: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasaaassssdasdcxcasdasdadfssdf.png',
    seller: 'Kulit Asli', qty: 1, total: 450000, date: Date.now() - 15 * 86400000,
    delivery: null, trackingNo: null, safeTrade: false,
  },
]

export default function PurchaseHistoryScreen({ onClose, onReorder }) {
  const [tab, setTab] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = tab === 'all' ? DEMO_ORDERS
    : tab === 'active' ? DEMO_ORDERS.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status))
    : tab === 'complete' ? DEMO_ORDERS.filter(o => ['delivered', 'complete'].includes(o.status))
    : DEMO_ORDERS.filter(o => o.status === 'cancelled')

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>My Orders</span>
        <span className={styles.orderCount}>{DEMO_ORDERS.length}</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className={styles.body}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No orders in this category</div>
        )}

        {filtered.map(order => {
          const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
          const expanded = expandedId === order.id

          return (
            <div key={order.id} className={styles.orderCard} onClick={() => setExpandedId(expanded ? null : order.id)}>
              {/* Main row */}
              <div className={styles.orderMain}>
                {order.image && <img src={order.image} alt="" className={styles.orderImg} />}
                <div className={styles.orderInfo}>
                  <span className={styles.orderProduct}>{order.product}</span>
                  <span className={styles.orderSeller}>{order.seller} · Qty: {order.qty}</span>
                  <span className={styles.orderDate}>{fmtDate(order.date)}</span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderTotal}>{fmtIDR(order.total)}</span>
                  <span className={styles.orderStatus} style={{ color: st.color }}>
                    {st.icon} {st.label}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className={styles.orderDetail}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Order ref</span>
                    <span className={styles.detailValue}>{order.ref}</span>
                  </div>
                  {order.delivery && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Delivery</span>
                      <span className={styles.detailValue}>{order.delivery}</span>
                    </div>
                  )}
                  {order.trackingNo && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Tracking</span>
                      <span className={styles.detailValueMono}>{order.trackingNo}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Safe Trade</span>
                    <span className={styles.detailValue} style={{ color: order.safeTrade ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>
                      {order.safeTrade ? '✓ Protected' : 'Not used'}
                    </span>
                  </div>

                  <div className={styles.detailActions}>
                    {(order.status === 'delivered' || order.status === 'complete') && (
                      <button className={styles.reorderBtn} onClick={(e) => { e.stopPropagation(); onReorder?.(order) }}>
                        Reorder
                      </button>
                    )}
                    {order.status === 'shipped' && order.trackingNo && (
                      <button className={styles.trackBtn} onClick={(e) => e.stopPropagation()}>
                        Track Package
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
