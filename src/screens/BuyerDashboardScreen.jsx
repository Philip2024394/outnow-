/**
 * BuyerDashboardScreen — dedicated dashboard for marketplace buyers.
 * Tabs: My Orders, Tracking, Messages, Wishlist
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchBuyerOrders } from '@/services/marketplaceOrderService'
import { fetchConversations } from '@/services/marketplaceChatService'
import styles from './BuyerDashboardScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

const STATUS_CONFIG = {
  awaiting_payment: { label: 'Awaiting Payment', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  pending:          { label: 'Pending',          color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  confirmed:        { label: 'Confirmed',        color: '#8DC63F', bg: 'rgba(141,198,63,0.15)' },
  shipped:          { label: 'Shipped',           color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  delivered:        { label: 'Delivered',         color: '#34C759', bg: 'rgba(52,199,89,0.15)' },
  cancelled:        { label: 'Cancelled',         color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  refunded:         { label: 'Refunded',          color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
}

export default function BuyerDashboardScreen({ open, onClose, onOpenChat, onWriteReview }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !user?.id) return
    setLoading(true)
    Promise.all([
      fetchBuyerOrders(user.id),
      fetchConversations(user.id),
    ]).then(([o, c]) => {
      setOrders(o)
      setConversations(c)
      setLoading(false)
    })
  }, [open, user?.id])

  if (!open) return null

  const activeOrders = orders.filter(o => ['awaiting_payment','pending','confirmed','shipped'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered','cancelled','refunded'].includes(o.status))
  const shippedOrders = orders.filter(o => o.status === 'shipped')

  const totalSpent = pastOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total ?? 0), 0)

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="" className={styles.headerLogo} />
        <h1 className={styles.title}>My Dashboard</h1>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{activeOrders.length}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{shippedOrders.length}</span>
          <span className={styles.statLabel}>Shipping</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{pastOrders.length}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{fmtRp(totalSpent)}</span>
          <span className={styles.statLabel}>Total Spent</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'orders', label: 'Orders', badge: activeOrders.length },
          { id: 'tracking', label: 'Tracking', badge: shippedOrders.length },
          { id: 'messages', label: 'Messages', badge: conversations.length },
          { id: 'history', label: 'History' },
        ].map(t => (
          <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge > 0 && <span className={styles.tabBadge}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading && <div className={styles.empty}><span className={styles.emptyIcon}>⏳</span><span>Loading...</span></div>}

        {/* ═══ ORDERS TAB ═══ */}
        {!loading && tab === 'orders' && (
          <>
            {activeOrders.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📦</span>
                <span>No active orders</span>
                <span className={styles.emptySub}>Browse the marketplace to start shopping</span>
              </div>
            )}
            {activeOrders.map(order => {
              const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              const item = order.items?.[0]
              const sellerName = order.seller?.display_name ?? order.seller?.brand_name ?? 'Seller'
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderSeller}>🏪 {sellerName}</span>
                    <span className={styles.orderStatus} style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                  {item && (
                    <div className={styles.orderItem}>
                      {item.image && <img src={item.image} alt="" className={styles.orderImg} />}
                      <div className={styles.orderItemInfo}>
                        <span className={styles.orderItemName}>{item.name}</span>
                        {order.items.length > 1 && <span className={styles.orderItemMore}>+{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</span>}
                      </div>
                    </div>
                  )}
                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {order.tracking_no && (
                    <div className={styles.orderTracking}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                      {order.carrier_name && <span>{order.carrier_name}:</span>}
                      <span className={styles.trackingNo}>{order.tracking_no}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ═══ TRACKING TAB ═══ */}
        {!loading && tab === 'tracking' && (
          <>
            {shippedOrders.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🚚</span>
                <span>No shipments to track</span>
              </div>
            )}
            {shippedOrders.map(order => {
              const sellerName = order.seller?.display_name ?? order.seller?.brand_name ?? 'Seller'
              return (
                <div key={order.id} className={styles.trackCard}>
                  <div className={styles.trackHeader}>
                    <span className={styles.trackSeller}>{sellerName}</span>
                    <span className={styles.trackStatus}>In Transit</span>
                  </div>
                  <div className={styles.trackBody}>
                    <div className={styles.trackItem}>{order.items?.[0]?.name ?? 'Package'}</div>
                    {order.carrier_name && <div className={styles.trackCarrier}>📦 {order.carrier_name}</div>}
                    {order.tracking_no && <div className={styles.trackNo}>Tracking: <strong>{order.tracking_no}</strong></div>}
                    {order.shipped_at && <div className={styles.trackDate}>Shipped: {new Date(order.shipped_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                  <div className={styles.trackProgress}>
                    <div className={styles.trackDot} data-active="true" />
                    <div className={styles.trackLine} />
                    <div className={styles.trackDot} data-active="true" />
                    <div className={styles.trackLine} />
                    <div className={styles.trackDot} data-active="true" />
                    <div className={styles.trackLine} data-pending="true" />
                    <div className={styles.trackDot} />
                  </div>
                  <div className={styles.trackLabels}>
                    <span>Confirmed</span><span>Shipped</span><span>In Transit</span><span>Delivered</span>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ═══ MESSAGES TAB ═══ */}
        {!loading && tab === 'messages' && (
          <>
            {conversations.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>💬</span>
                <span>No conversations yet</span>
              </div>
            )}
            {conversations.map(conv => {
              const isBuyer = conv.buyer_id === user.id
              const other = isBuyer ? conv.seller : conv.buyer
              const name = other?.display_name ?? other?.brand_name ?? 'User'
              return (
                <button key={conv.id} className={styles.convCard} onClick={() => onOpenChat?.({
                  sellerId: conv.seller_id,
                  buyerId: conv.buyer_id,
                  displayName: name,
                })}>
                  <div className={styles.convAvatar}>
                    {other?.avatar_url ? <img src={other.avatar_url} alt="" /> : <span>{name[0]}</span>}
                  </div>
                  <div className={styles.convInfo}>
                    <span className={styles.convName}>{name}</span>
                    <span className={styles.convLast}>{conv.last_message ?? 'No messages yet'}</span>
                  </div>
                  <span className={styles.convTime}>
                    {conv.last_at ? new Date(conv.last_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </button>
              )
            })}
          </>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {!loading && tab === 'history' && (
          <>
            {pastOrders.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📋</span>
                <span>No past orders</span>
              </div>
            )}
            {pastOrders.map(order => {
              const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.delivered
              const sellerName = order.seller?.display_name ?? order.seller?.brand_name ?? 'Seller'
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderSeller}>🏪 {sellerName}</span>
                    <span className={styles.orderStatus} style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                  <div className={styles.orderItem}>
                    <div className={styles.orderItemInfo}>
                      <span className={styles.orderItemName}>{order.items?.[0]?.name ?? 'Order'}</span>
                    </div>
                  </div>
                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>
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
    </div>,
    document.body
  )
}
