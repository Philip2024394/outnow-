/**
 * MarketplaceNotificationsScreen
 * Marketplace-specific notifications: orders, commission, shipping, messages.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './MarketplaceNotificationsScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const NOTIF_TYPES = [
  { id: 'all',        label: 'All' },
  { id: 'orders',     label: 'Orders' },
  { id: 'shipping',   label: 'Shipping' },
  { id: 'commission', label: 'Commission' },
  { id: 'messages',   label: 'Messages' },
  { id: 'system',     label: 'System' },
]

const DEMO_NOTIFICATIONS = [
  { id: 'n1',  type: 'orders',     icon: '📦', title: 'New order received',           body: 'Ava M. ordered Nike Air Max 90 — confirm within 24 hours',          time: '5m ago',  read: false },
  { id: 'n2',  type: 'orders',     icon: '✅', title: 'Order confirmed',              body: 'Order #SHOP_11223344 confirmed and ready to ship',                   time: '1h ago',  read: false },
  { id: 'n3',  type: 'shipping',   icon: '🚚', title: 'Package picked up',            body: 'JNE picked up order #SHOP_11223344 — tracking: JNE9876543',         time: '2h ago',  read: false },
  { id: 'n4',  type: 'shipping',   icon: '📍', title: 'Package in transit',           body: 'Order #SHOP_55443322 is at Jakarta sorting center',                  time: '4h ago',  read: true },
  { id: 'n5',  type: 'shipping',   icon: '🎉', title: 'Package delivered',            body: 'Order #SHOP_99887766 has been delivered to buyer',                   time: '6h ago',  read: true },
  { id: 'n6',  type: 'commission', icon: '💰', title: 'Commission due',               body: 'Rp 62,500 commission due in 68 hours — submit payment proof',       time: '8h ago',  read: false },
  { id: 'n7',  type: 'commission', icon: '✅', title: 'Commission paid',              body: 'Rp 17,000 commission for order #SHOP_55443322 confirmed',            time: '1d ago',  read: true },
  { id: 'n8',  type: 'commission', icon: '⚠️', title: 'Commission overdue',           body: 'Rp 44,500 is overdue — pay now to avoid account restrictions',      time: '2d ago',  read: false },
  { id: 'n9',  type: 'messages',   icon: '💬', title: 'New message from Ravi G.',     body: '"Is this available in size L?"',                                     time: '15m ago', read: false },
  { id: 'n10', type: 'messages',   icon: '💬', title: 'New message from Maya P.',     body: '"When will my order be shipped?"',                                   time: '3h ago',  read: true },
  { id: 'n11', type: 'orders',     icon: '❌', title: 'Order cancelled',              body: 'Jordan L. cancelled order #SHOP_77665544 — refund processed',        time: '1d ago',  read: true },
  { id: 'n12', type: 'orders',     icon: '⭐', title: 'New review received',          body: 'Chloe B. left a 5-star review on Batik Shirt Premium',               time: '1d ago',  read: true },
  { id: 'n13', type: 'system',     icon: '📢', title: 'Flash Sale starting soon',     body: 'Your flash sale starts in 2 hours — make sure stock is updated',     time: '2d ago',  read: true },
  { id: 'n14', type: 'system',     icon: '🔔', title: 'Profile update required',      body: 'Complete your seller verification to get the verified badge',         time: '3d ago',  read: true },
  { id: 'n15', type: 'system',     icon: '📊', title: 'Weekly sales report',          body: 'You earned Rp 2,480,000 this week — 23% up from last week',         time: '4d ago',  read: true },
]

function timeAgo(str) { return str }

export default function MarketplaceNotificationsScreen({ open, onClose, onOpenReviews, onOpenOrders }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!open || !user?.id || !supabase) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['gift_order', 'gift_update', 'gift_received', 'massage_booking', 'massage_confirmed', 'massage_commission', 'massage_admin', 'market_message', 'system'])
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setNotifications(data.map(n => ({
            id: n.id,
            type: mapNotifType(n.type),
            icon: mapNotifIcon(n.type),
            title: n.title,
            body: n.body,
            time: formatTime(n.created_at),
            read: n.read,
          })))
        }
      })
  }, [open, user?.id])

  if (!open) return null

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (supabase && user?.id) {
      supabase.from('notifications').update({ read: true }).eq('id', id).catch(() => {})
    }
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (supabase && user?.id) {
      supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).catch(() => {})
    }
  }

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <h1 className={styles.title}>Notifications</h1>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {NOTIF_TYPES.map(t => {
          const count = t.id === 'all' ? notifications.filter(n => !n.read).length : notifications.filter(n => n.type === t.id && !n.read).length
          return (
            <button key={t.id} className={`${styles.tab} ${filter === t.id ? styles.tabActive : ''}`} onClick={() => setFilter(t.id)}>
              {t.label}
              {count > 0 && <span className={styles.tabBadge}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Notifications list */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔔</span>
            <span>No notifications</span>
          </div>
        )}
        {filtered.map(n => (
          <button key={n.id} className={`${styles.card} ${!n.read ? styles.cardUnread : ''}`} onClick={() => {
            markRead(n.id)
            if (n.title.includes('review')) onOpenReviews?.()
            else if (n.type === 'orders') onOpenOrders?.()
          }}>
            <span className={styles.cardIcon}>{n.icon}</span>
            <div className={styles.cardBody}>
              <span className={styles.cardTitle}>{n.title}</span>
              <span className={styles.cardText}>{n.body}</span>
              <span className={styles.cardTime}>{n.time}</span>
            </div>
            {!n.read && <span className={styles.unreadDot} />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}

function mapNotifType(type) {
  if (['gift_order', 'gift_update'].includes(type)) return 'orders'
  if (['massage_booking', 'massage_confirmed'].includes(type)) return 'orders'
  if (['massage_commission'].includes(type)) return 'commission'
  if (['market_message'].includes(type)) return 'messages'
  return 'system'
}

function mapNotifIcon(type) {
  const map = { gift_order: '📦', gift_update: '🚚', massage_booking: '📦', massage_confirmed: '✅', massage_commission: '💰', market_message: '💬' }
  return map[type] || '🔔'
}

function formatTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
