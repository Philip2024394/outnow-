/**
 * BuyerProfileSheet
 * Mirrors SellerProfileSheet layout but with buyer-specific side buttons:
 * - My Orders, Wishlist, Recently Viewed, Safe Trade History
 * Same full-screen photo + bottom overlay pattern.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import styles from './BuyerProfileSheet.module.css'

// Recently viewed products stored in localStorage
const RV_KEY = 'indoo_recently_viewed'
const RV_MAX = 20

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(RV_KEY) ?? '[]')
  } catch { return [] }
}

export function trackProductView(product) {
  if (!product?.id) return
  const rv = getRecentlyViewed().filter(p => p.id !== product.id)
  rv.unshift({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    brand_name: product.brand_name,
    category: product.category,
    viewedAt: Date.now(),
  })
  if (rv.length > RV_MAX) rv.length = RV_MAX
  localStorage.setItem(RV_KEY, JSON.stringify(rv))
}

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

// Demo orders for display
const DEMO_ORDERS = [
  { id: 'o1', product: 'Wireless Earbuds Pro', status: 'delivered', total: 350000, date: '2026-04-10' },
  { id: 'o2', product: 'Leather Crossbody Bag', status: 'shipped', total: 1200000, date: '2026-04-13' },
  { id: 'o3', product: 'Slim Card Wallet', status: 'confirmed', total: 320000, date: '2026-04-14' },
]

const STATUS_COLORS = {
  pending:   '#FBBF24',
  confirmed: '#8DC63F',
  shipped:   '#818CF8',
  delivered: '#8DC63F',
  cancelled: '#EF4444',
}

export default function BuyerProfileSheet({ open, onClose, onOpenProduct }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('orders')
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    if (open) setRecentlyViewed(getRecentlyViewed())
  }, [open])

  if (!open) return null

  const displayName = user?.displayName ?? user?.display_name ?? 'Buyer'
  const photoURL = user?.photoURL ?? user?.photo_url ?? null
  const city = user?.city ?? null
  const country = user?.country ?? null
  const memberSince = user?.created_at ?? user?.createdAt ?? null

  let memberText = null
  if (memberSince) {
    const d = new Date(memberSince)
    if (!isNaN(d)) memberText = `Member since ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
  }

  const tabs = [
    { id: 'orders', icon: '📦', label: 'Orders' },
    { id: 'viewed', icon: '👁', label: 'Viewed' },
    { id: 'wishlist', icon: '❤️', label: 'Wishlist' },
    { id: 'safetrade', icon: '🛡️', label: 'Safe Trade' },
  ]

  return (
    <div className={styles.page}>
      {/* Background photo */}
      {photoURL
        ? <img src={photoURL} alt="" className={styles.bgImg} />
        : <div className={styles.bgFallback}>
            <span className={styles.bgInitial}>{displayName[0]?.toUpperCase()}</span>
          </div>
      }
      <div className={styles.bgGrad} />

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.logoWrap}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752"
            alt="Indoo Market"
            style={{ height: 28, objectFit: 'contain' }}
          />
        </div>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </div>

      {/* Side panel — buyer buttons */}
      <div className={styles.sidePanel}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={[styles.sidePanelBtn, activeTab === t.id ? styles.sidePanelBtnActive : ''].join(' ')}
            onClick={() => setActiveTab(t.id)}
            aria-label={t.label}
            title={t.label}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
          </button>
        ))}
      </div>

      {/* Bottom overlay — buyer info + tab content */}
      <div className={styles.bottomOverlay}>
        <span className={styles.buyerBadge}>🛍️ Buyer</span>
        <div className={styles.buyerName}>{displayName}</div>
        {city && (
          <p className={styles.locationText}>
            📍 {city}{country ? `, ${country}` : ''}
          </p>
        )}
        {/* Enabled domains */}
        <div className={styles.domainTags}>
          {(user?.enabledDomains ?? ['marketplace', 'dating', 'food', 'rides']).map(d => (
            <span key={d} className={styles.domainTag}>
              {d === 'marketplace' ? '🛍️' : d === 'dating' ? '💕' : d === 'food' ? '🍔' : d === 'rides' ? '🚗' : d === 'massage' ? '💆' : '🏠'} {d}
            </span>
          ))}
        </div>
        {memberText && <p className={styles.memberText}>{memberText}</p>}

        {/* Tab content */}
        <div className={styles.tabContent}>

          {/* Orders */}
          {activeTab === 'orders' && (
            <div className={styles.ordersList}>
              <span className={styles.tabTitle}>My Orders</span>
              {DEMO_ORDERS.map(o => (
                <div key={o.id} className={styles.orderRow}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderProduct}>{o.product}</span>
                    <span className={styles.orderDate}>{o.date}</span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>{formatIDR(o.total)}</span>
                    <span className={styles.orderStatus} style={{ color: STATUS_COLORS[o.status] ?? '#fff' }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
              {DEMO_ORDERS.length === 0 && (
                <p className={styles.emptyText}>No orders yet</p>
              )}
            </div>
          )}

          {/* Recently Viewed */}
          {activeTab === 'viewed' && (
            <div className={styles.viewedList}>
              <span className={styles.tabTitle}>Recently Viewed</span>
              {recentlyViewed.length > 0 ? (
                <div className={styles.viewedGrid}>
                  {recentlyViewed.map(p => (
                    <div key={p.id} className={styles.viewedCard} onClick={() => onOpenProduct?.(p)}>
                      {p.image
                        ? <img src={p.image} alt={p.name} className={styles.viewedImg} />
                        : <div className={styles.viewedImgPlaceholder}>📦</div>
                      }
                      <span className={styles.viewedName}>{p.name}</span>
                      <span className={styles.viewedPrice}>{formatIDR(p.price)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyText}>Browse products to see your history here</p>
              )}
            </div>
          )}

          {/* Wishlist */}
          {activeTab === 'wishlist' && (
            <div className={styles.wishlistSection}>
              <span className={styles.tabTitle}>My Wishlist</span>
              <p className={styles.emptyText}>Pin products from any store to save them here</p>
            </div>
          )}

          {/* Safe Trade History */}
          {activeTab === 'safetrade' && (
            <div className={styles.safeTradeSection}>
              <span className={styles.tabTitle}>Safe Trade History</span>
              <p className={styles.emptyText}>Your PayPal and Escrow protected purchases will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
