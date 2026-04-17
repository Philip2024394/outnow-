/**
 * SellerOrdersScreen — full-page seller orders management.
 * Status flow: pending → confirmed → shipped → delivered
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fetchOrders, updateOrderStatus } from '@/services/commerceService'
import { useAuth } from '@/hooks/useAuth'
import styles from './SellerOrdersScreen.module.css'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered']
const STATUS_COLORS = {
  pending:   { bg: 'rgba(251,191,36,0.15)', border: '#FBBF24', text: '#FBBF24' },
  confirmed: { bg: 'rgba(167,139,250,0.15)', border: '#A78BFA', text: '#A78BFA' },
  shipped:   { bg: 'rgba(99,102,241,0.15)',  border: '#818CF8', text: '#818CF8' },
  delivered: { bg: 'rgba(52,199,89,0.15)',   border: '#34C759', text: '#34C759' },
}

const DEMO_ORDERS = [
  { id:'o1', product:'Nike Air Max 90', buyer:'Ava M.', qty:1, total:1250000, status:'pending', time:'2h ago' },
  { id:'o2', product:'Samsung Galaxy Buds', buyer:'Ravi G.', qty:2, total:890000, status:'confirmed', time:'5h ago' },
  { id:'o3', product:'Batik Shirt Premium', buyer:'Maya P.', qty:1, total:340000, status:'shipped', time:'1d ago', trackingNo:'JNE1234567', carrierName:'JNE' },
  { id:'o4', product:'Aromatherapy Candle Set', buyer:'Chloe B.', qty:3, total:175000, status:'delivered', time:'3d ago' },
  { id:'o5', product:'Handmade Leather Wallet', buyer:'Jordan L.', qty:1, total:285000, status:'pending', time:'30m ago' },
]

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function SellerOrdersScreen({ open, onClose }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState(DEMO_ORDERS)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!open || !user?.id) return
    fetchOrders(user.id).then(data => {
      if (data?.length) setOrders(data)
    })
  }, [open, user?.id])

  if (!open) return null

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const advanceOrder = (id, currentStatus) => {
    const nextIdx = STATUS_FLOW.indexOf(currentStatus) + 1
    if (nextIdx >= STATUS_FLOW.length) return
    const nextStatus = STATUS_FLOW[nextIdx]
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o))
    if (user?.id) updateOrderStatus(id, nextStatus, { sellerId: user.id }).catch(() => {})
  }

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return createPortal(
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className={styles.title}>My Orders</h1>
        <span className={styles.count}>{orders.length} total</span>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map(t => (
          <button key={t} className={`${styles.tab} ${filter === t ? styles.tabActive : ''}`} onClick={() => setFilter(t)}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No orders</div>}
        {filtered.map(order => {
          const color = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
          const canAdvance = STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1
          return (
            <div key={order.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.cardProduct}>{order.product}</span>
                <span className={styles.cardStatus} style={{ background: color.bg, borderColor: color.border, color: color.text }}>
                  {order.status}
                </span>
              </div>
              <div className={styles.cardMeta}>
                <span>{order.buyer}</span>
                <span>Qty: {order.qty}</span>
                <span className={styles.cardTotal}>{fmtRp(order.total)}</span>
                <span className={styles.cardTime}>{order.time}</span>
              </div>
              {order.trackingNo && (
                <div className={styles.tracking}>{order.carrierName}: {order.trackingNo}</div>
              )}
              {canAdvance && (
                <button className={styles.advanceBtn} onClick={() => advanceOrder(order.id, order.status)}>
                  Mark as {STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
