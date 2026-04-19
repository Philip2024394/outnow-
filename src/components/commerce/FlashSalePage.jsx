/**
 * FlashSalePage
 * Full-screen flash sale page with marketplace header, tab bar, countdown timer.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import ProductDetailSheet from './ProductDetailSheet'
import styles from './FlashSalePage.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

function formatTime(ms) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Demo live activity feed
const DEMO_ACTIVITY = [
  { id: 'a1', buyer: 'Sarah M.', product: 'Wireless Earbuds Pro', seller: 'SoundMax', ago: '2 min ago' },
  { id: 'a2', buyer: 'Andi P.', product: 'Slim Card Wallet', seller: 'Kulit Asli', ago: '5 min ago' },
  { id: 'a3', buyer: 'Dewi S.', product: 'Leather Keychain', seller: 'Kulit Asli', ago: '8 min ago' },
]

export default function FlashSalePage({ open, onClose, allProducts, onOrderViaChat, onMakeOffer }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [activity, setActivity] = useState(DEMO_ACTIVITY)
  const timerRef = useRef(null)

  // Get flash sale products
  const products = (allProducts ?? DEMO_PRODUCTS).filter(p =>
    p.flashSale?.active && p.flashSale.endsAt > Date.now()
  )

  // Find earliest ending flash sale for main timer
  const earliestEnd = products.length > 0
    ? Math.min(...products.map(p => p.flashSale.endsAt))
    : 0

  useEffect(() => {
    if (!open || earliestEnd <= 0) return
    function tick() {
      const diff = earliestEnd - Date.now()
      setCountdown(formatTime(diff))
      if (diff <= 0) clearInterval(timerRef.current)
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [open, earliestEnd])

  if (!open) return null

  return createPortal(
    <div className={styles.page}>
      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>M3</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>FLASH SALE</span></div>
      {/* Header — brand logo + close */}
      <div className={styles.header}>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>MARKET</span> <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>· FLASH SALE</span></span>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Tabs — matching main marketplace, Flash Sale highlighted */}
      <div className={styles.mainTabs}>
        <button className={styles.mainTab} onClick={onClose}>🛍️ Products</button>
        <button className={`${styles.mainTab} ${styles.mainTabActive}`}>⚡ Flash Sale</button>
        <button className={styles.mainTab} onClick={onClose}>🔨 Auctions</button>
        <button className={styles.mainTab} onClick={onClose}>🔄 Used</button>
      </div>

      {/* Timer bar */}
      <div className={styles.timerBar}>
        <span className={styles.flashIcon}>⚡</span>
        <span className={styles.timerTitle}>Flash Sale</span>
        <div className={styles.timerBox}>
          <span className={styles.timerLabel}>Ends in</span>
          <span className={styles.timerValue}>{countdown}</span>
        </div>
      </div>

      {/* Live activity feed */}
      {activity.length > 0 && (
        <div className={styles.activityBar}>
          <span className={styles.activityIcon}>🔥</span>
          <div className={styles.activityScroll}>
            {activity.map(a => (
              <span key={a.id} className={styles.activityItem}>
                <strong>{a.buyer}</strong> bought {a.product} from {a.seller} — {a.ago}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className={styles.body}>
        {products.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⚡</span>
            <span>No active flash sales right now</span>
            <span className={styles.emptySub}>Check back soon — sellers run flash sales regularly</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map(p => {
              const salePrice = Math.round(p.price * (1 - p.flashSale.discountPercent / 100))
              const timeLeft = p.flashSale.endsAt - Date.now()
              return (
                <div key={p.id} className={styles.card} onClick={() => setSelectedProduct(p)}>
                  <div className={styles.cardImgWrap}>
                    {p.image
                      ? <img src={p.image} alt={p.name} className={styles.cardImg} />
                      : <div className={styles.cardImgPlaceholder}>📦</div>
                    }
                    <span className={styles.cardDiscount}>-{p.flashSale.discountPercent}%</span>
                    <span className={styles.cardTimer}>{formatTime(timeLeft)}</span>
                  </div>
                  <div className={styles.cardInfo}>
                    {p.brand_name && <span className={styles.cardBrand}>{p.brand_name}</span>}
                    <span className={styles.cardName}>{p.name}</span>
                    <div className={styles.cardPrices}>
                      <span className={styles.cardSalePrice}>{formatIDR(salePrice)}</span>
                      <span className={styles.cardOrigPrice}>{formatIDR(p.price)}</span>
                    </div>
                    <div className={styles.cardStock}>
                      <div className={styles.stockBar}>
                        <div className={styles.stockFill} style={{ width: `${Math.min(100, ((p.stock ?? 10) / 20) * 100)}%` }} />
                      </div>
                      <span className={styles.stockText}>{p.stock ?? 10} left</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Product detail sheet */}
      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrderViaChat={onOrderViaChat}
          onMakeOffer={onMakeOffer}
        />
      )}
    </div>,
    document.body
  )
}
