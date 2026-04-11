/**
 * IncomingGiftsScreen — recipient's dashboard showing incoming gifts and food
 * deliveries, with real-time order status updates via Supabase Realtime.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getMyGiftsReceived, formatIDR } from '@/services/giftService'
import { supabase } from '@/lib/supabase'
import DeliveryRatingModal from '@/components/gifting/DeliveryRatingModal'
import styles from './IncomingGiftsScreen.module.css'

const STATUS_LABELS = {
  pending:    { label: 'Preparing',   color: '#FBBF24', icon: '⏳' },
  processing: { label: 'Processing',  color: '#60A5FA', icon: '🔄' },
  delivering: { label: 'On the way',  color: '#A78BFA', icon: '🛵' },
  delivered:  { label: 'Delivered',   color: '#4ADE80', icon: '✅' },
  cancelled:  { label: 'Cancelled',   color: '#F87171', icon: '❌' },
}

const DEMO_INCOMING = [
  {
    id: 'inc1', product_name: 'Noodle Bowl', product_image: null, product_price: 35000,
    delivery_fee: 5000, status: 'delivering', created_at: new Date(Date.now() - 3600000).toISOString(),
    gift_message: 'Thinking of you 💕', item_type: 'food',
  },
  {
    id: 'inc2', product_name: 'Flower Bouquet', product_image: null, product_price: 120000,
    delivery_fee: 12000, status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString(),
    gift_message: '', item_type: 'product',
  },
  {
    id: 'inc3', product_name: 'Coffee Set', product_image: null, product_price: 78000,
    delivery_fee: 8000, status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString(),
    gift_message: 'Have a great day!', item_type: 'product',
  },
]

export default function IncomingGiftsScreen({ onClose }) {
  const { user } = useAuth()
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [tab,          setTab]          = useState('all')   // 'all' | 'food' | 'gifts'
  const [ratingOrder,  setRatingOrder]  = useState(null)

  // Initial fetch
  useEffect(() => {
    if (!user?.id && !user?.uid) { setOrders(DEMO_INCOMING); setLoading(false); return }
    const uid = user.uid ?? user.id
    getMyGiftsReceived(uid).then(data => {
      setOrders(data.length ? data : DEMO_INCOMING)
      setLoading(false)
    })
  }, [user])

  // Real-time order status updates
  useEffect(() => {
    if (!supabase || !user?.id && !user?.uid) return
    const uid = user.uid ?? user.id
    const channel = supabase
      .channel(`incoming-gifts-${uid}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'gift_orders',
        filter: `recipient_id=eq.${uid}`,
      }, (payload) => {
        setOrders(prev => prev.map(o =>
          o.id === payload.new.id ? { ...o, ...payload.new } : o
        ))
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'gift_orders',
        filter: `recipient_id=eq.${uid}`,
      }, (payload) => {
        setOrders(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const filtered = tab === 'food'
    ? orders.filter(o => o.item_type === 'food')
    : tab === 'gifts'
    ? orders.filter(o => o.item_type !== 'food')
    : orders

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.title}>Incoming Gifts</span>
        {orders.filter(o => o.status === 'pending' || o.status === 'delivering').length > 0 && (
          <span className={styles.badge}>
            {orders.filter(o => o.status === 'pending' || o.status === 'delivering').length}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'all'   ? styles.tabActive : ''}`} onClick={() => setTab('all')}>All</button>
        <button className={`${styles.tab} ${tab === 'food'  ? styles.tabActive : ''}`} onClick={() => setTab('food')}>🍔 Food</button>
        <button className={`${styles.tab} ${tab === 'gifts' ? styles.tabActive : ''}`} onClick={() => setTab('gifts')}>🛍️ Gifts</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>🎁</span>
          <p>Nothing here yet.</p>
          <p className={styles.emptySub}>When someone sends you a gift it will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(order => {
            const st      = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending
            const dateStr = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            const total   = Number(order.product_price ?? 0) + Number(order.delivery_fee ?? 0)
            return (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardIcon}>
                  {order.item_type === 'food' ? '🍔' : '🎁'}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{order.product_name ?? 'A gift for you'}</div>
                  <div className={styles.cardDate}>{dateStr}</div>
                  {order.gift_message ? (
                    <div className={styles.cardMsg}>"{order.gift_message}"</div>
                  ) : (
                    <div className={styles.cardMsg} style={{ fontStyle: 'normal', opacity: 0.35 }}>Anonymous gift</div>
                  )}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardPrice}>{formatIDR(total)}</span>
                    <span className={styles.cardStatus} style={{ color: st.color, borderColor: `${st.color}40`, background: `${st.color}15` }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  {/* Tracking progress bar */}
                  {order.status !== 'cancelled' && (
                    <div className={styles.progressBar}>
                      {['pending','processing','delivering','delivered'].map((s, i) => {
                        const steps = ['pending','processing','delivering','delivered']
                        const cur   = steps.indexOf(order.status)
                        return (
                          <div key={s} className={`${styles.progressStep} ${i <= cur ? styles.progressStepDone : ''}`} />
                        )
                      })}
                    </div>
                  )}
                  {/* Rate button for delivered */}
                  {order.status === 'delivered' && !order.rated && (
                    <button className={styles.rateBtn} onClick={() => setRatingOrder(order)}>
                      ⭐ Rate this gift
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {ratingOrder && (
        <DeliveryRatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
          onRated={() => {
            setOrders(prev => prev.map(o => o.id === ratingOrder.id ? { ...o, rated: true } : o))
            setRatingOrder(null)
          }}
        />
      )}
    </div>
  )
}
