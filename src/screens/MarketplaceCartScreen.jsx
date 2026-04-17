/**
 * MarketplaceCartScreen
 * Shopping cart + order tracking for marketplace buyers.
 * Tabs: Cart, Active Orders, Order History
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import styles from './MarketplaceCartScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

const DEMO_CART = [
  { id: 'c1', name: 'Nike Air Max 90 Original', price: 1250000, qty: 1, image: 'https://picsum.photos/seed/shoe1/200', seller: 'Bali Crafts Co.', stock: 5 },
  { id: 'c2', name: 'Batik Shirt Premium Jogja', price: 340000, qty: 2, image: 'https://picsum.photos/seed/batik1/200', seller: 'Toko Batik Mega', stock: 12 },
  { id: 'c3', name: 'Aromatherapy Candle Set', price: 175000, qty: 1, image: 'https://picsum.photos/seed/candle1/200', seller: 'Handmade by Dewi', stock: 8 },
]

const DEMO_ACTIVE = [
  { id: 'a1', product: 'Samsung Galaxy Buds Pro', total: 890000, status: 'confirmed', seller: 'Toko Elektronik Jaya', date: 'Apr 16', tracking: null },
  { id: 'a2', product: 'Leather Wallet Handmade', total: 285000, status: 'shipped', seller: 'Handmade by Dewi', date: 'Apr 15', tracking: 'JNE1234567' },
]

const DEMO_HISTORY = [
  { id: 'h1', product: 'Kebaya Sari Modern', total: 450000, status: 'delivered', seller: 'Butik Kebaya Sari', date: 'Apr 10' },
  { id: 'h2', product: 'Organic Honey 500ml', total: 120000, status: 'delivered', seller: 'Farm Fresh Indo', date: 'Apr 8' },
  { id: 'h3', product: 'Phone Case Premium', total: 85000, status: 'cancelled', seller: 'Tech Accessories ID', date: 'Apr 5' },
]

const STATUS_STYLES = {
  pending:   { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24', label: 'Pending' },
  confirmed: { bg: '#8DC63F',               color: '#fff',    label: 'Confirmed' },
  shipped:   { bg: '#8DC63F',               color: '#fff',    label: 'Shipped', glow: true },
  delivered: { bg: 'rgba(52,199,89,0.15)',  color: '#34C759', label: 'Delivered' },
  cancelled: { bg: '#EF4444',              color: '#fff',    label: 'Cancelled' },
}

export default function MarketplaceCartScreen({ open, onClose, onWriteReview }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('cart')
  const [cart, setCart] = useState(DEMO_CART)
  const [activeOrders] = useState(DEMO_ACTIVE)
  const [history] = useState(DEMO_HISTORY)

  if (!open) return null

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item
      const newQty = Math.max(1, Math.min(item.stock, item.qty + delta))
      return { ...item, qty: newQty }
    }))
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <h1 className={styles.title}>
          {tab === 'cart' && <><svg className={styles.titleIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> My Cart</>}
          {tab === 'active' && <><svg className={styles.titleIconSpin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Active Orders</>}
          {tab === 'history' && <><svg className={styles.titleIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Order History</>}
        </h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'cart' ? styles.tabActive : ''}`} onClick={() => setTab('cart')}>
          Cart {cart.length > 0 && <span className={styles.tabBadge}>{cartCount}</span>}
        </button>
        <button className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
          Active {activeOrders.length > 0 && <span className={styles.tabBadge}>{activeOrders.length}</span>}
        </button>
        <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      {/* Content */}
      <div className={styles.list}>

        {/* ═══ CART TAB ═══ */}
        {tab === 'cart' && (
          <>
            {cart.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🛒</span>
                <span>Your cart is empty</span>
                <span className={styles.emptySub}>Browse the marketplace to add products</span>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className={styles.cartCard}>
                <div className={styles.cartLeft}>
                  <img src={item.image} alt={item.name} className={styles.cartImg} />
                  <div className={styles.qtyRow}>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.id, -1)}>-</button>
                    <span className={styles.qtyNum}>{item.qty}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className={styles.cartRight}>
                  <div className={styles.cartTopRow}>
                    <div className={styles.cartInfo}>
                      <span className={styles.cartName}>{item.name}</span>
                      <span className={styles.cartSeller}>{item.seller}</span>
                      <span className={styles.cartPrice}>{fmtRp(item.price)}</span>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                  <div className={styles.cartBottomRow}>
                    <span className={styles.cartSubtotalLabel}>Total</span>
                    <span className={styles.cartSubtotal}>{fmtRp(item.price * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══ ACTIVE ORDERS TAB ═══ */}
        {tab === 'active' && (
          <>
            {activeOrders.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📦</span>
                <span>No active orders</span>
              </div>
            )}
            {activeOrders.map(order => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderProduct}>{order.product}</span>
                    <span className={`${styles.orderStatus} ${st.glow ? styles.orderStatusGlow : ''}`} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>{order.seller}</span>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  {order.tracking && (
                    <div className={styles.orderTracking}>Tracking: {order.tracking}</div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ═══ ORDER HISTORY TAB ═══ */}
        {tab === 'history' && (
          <>
            {history.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📋</span>
                <span>No past orders</span>
              </div>
            )}
            {history.map(order => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.delivered
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderProduct}>{order.product}</span>
                    <span className={`${styles.orderStatus} ${st.glow ? styles.orderStatusGlow : ''}`} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>{order.seller}</span>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  {order.status === 'delivered' && (
                    <div className={styles.actionRow}>
                      <button className={styles.reviewBtn} onClick={() => onWriteReview?.(order)}>Write Review</button>
                      <button className={styles.reorderBtn}>Buy Again</button>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Cart footer — only on cart tab with items */}
      {tab === 'cart' && cart.length > 0 && (
        <div className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.footerLabel}>Total ({cartCount} items)</span>
            <span className={styles.footerPrice}>{fmtRp(cartTotal)}</span>
          </div>
          <button className={styles.checkoutBtn}>
            Checkout
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
