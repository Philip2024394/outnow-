/**
 * OrderHistoryScreen — buyer's sent gifts and food orders.
 * Pulled from gift_orders table via getMyGiftsSent().
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMyGiftsSent, formatIDR } from '@/services/giftService'
import styles from './OrderHistoryScreen.module.css'

const STATUS_LABELS = {
  pending:    { label: 'Pending',     color: '#FBBF24' },
  processing: { label: 'Processing',  color: '#60A5FA' },
  delivering: { label: 'On the way',  color: '#A78BFA' },
  delivered:  { label: 'Delivered',   color: '#4ADE80' },
  cancelled:  { label: 'Cancelled',   color: '#F87171' },
}

const DEMO_ORDERS = [
  { id: 'd1', product_name: 'Noodle Bowl', product_image: null, product_price: 35000, delivery_fee: 5000, status: 'delivered',   created_at: new Date(Date.now() - 86400000*2).toISOString(), gift_message: 'Enjoy!' },
  { id: 'd2', product_name: 'Coffee Set',  product_image: null, product_price: 78000, delivery_fee: 8000, status: 'delivering',  created_at: new Date(Date.now() - 3600000).toISOString(),    gift_message: '' },
  { id: 'd3', product_name: 'Pizza Slice', product_image: null, product_price: 32000, delivery_fee: 5000, status: 'pending',     created_at: new Date().toISOString(),                        gift_message: 'A little surprise 🎁' },
]

export default function OrderHistoryScreen({ onClose }) {
  const { user } = useAuth()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('gifts') // 'gifts' | 'food'

  useEffect(() => {
    if (!user?.id && !user?.uid) { setOrders(DEMO_ORDERS); setLoading(false); return }
    getMyGiftsSent(user.uid ?? user.id).then(data => {
      setOrders(data.length ? data : DEMO_ORDERS)
      setLoading(false)
    })
  }, [user])

  const filtered = tab === 'food'
    ? orders.filter(o => o.item_type === 'food')
    : orders.filter(o => o.item_type !== 'food')

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.title}>My Orders</span>
      </div>

      {/* Tab bar */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'gifts' ? styles.tabActive : ''}`} onClick={() => setTab('gifts')}>🛍️ Gifts Sent</button>
        <button className={`${styles.tab} ${tab === 'food'  ? styles.tabActive : ''}`} onClick={() => setTab('food')}>🍔 Food Sent</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>{tab === 'food' ? '🍔' : '🛍️'}</span>
          <p>No {tab === 'food' ? 'food orders' : 'gifts'} sent yet.</p>
          <p className={styles.emptySub}>Browse the marketplace to send your first gift!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(order => {
            const total    = Number(order.product_price ?? 0) + Number(order.delivery_fee ?? 0)
            const st       = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending
            const dateStr  = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardLeft}>
                  {order.product_image
                    ? <img src={order.product_image} alt={order.product_name} className={styles.cardImg} />
                    : <div className={styles.cardImgFallback}>{tab === 'food' ? '🍔' : '🎁'}</div>
                  }
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{order.product_name ?? 'Gift'}</div>
                  <div className={styles.cardDate}>{dateStr}</div>
                  {order.gift_message ? <div className={styles.cardMsg}>"{order.gift_message}"</div> : null}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardPrice}>{formatIDR(total)}</span>
                    <span className={styles.cardStatus} style={{ color: st.color, borderColor: `${st.color}40`, background: `${st.color}15` }}>{st.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
