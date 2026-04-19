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

export default function FlashSalePage({ open, onClose, allProducts, onOrderViaChat, onMakeOffer, onOpenAuction, onOpenProducts, onAlerts, onProfile }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [activity, setActivity] = useState(DEMO_ACTIVITY)
  const [searchQuery, setSearchQuery] = useState('')
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

  const displayProducts = searchQuery.trim()
    ? products.filter(p => {
        const q = searchQuery.toLowerCase()
        return (p.name ?? '').toLowerCase().includes(q) || (p.brand_name ?? '').toLowerCase().includes(q)
      })
    : products

  if (!open) return null

  return createPortal(
    <div className={styles.page}>
      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>M3</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>FLASH SALE</span></div>
      {/* Header — logo only */}
      <div className={styles.header}>
        <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em' }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span><span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>FLASH SALE</span></span>
      </div>

      {/* Search bar (matching M2) */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 14px 0', flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search flash sale deals..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 10, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M3 4h18v2H3zm3 5h12v2H6zm3 5h6v2H9z"/></svg>
        </button>
      </div>

      {/* Live ticker (matching M2) */}
      <div style={{ overflow: 'hidden', padding: '6px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', animation: 'tickerScroll 25s linear infinite', whiteSpace: 'nowrap', gap: 40 }}>
          {[...(activity.length > 0 ? activity.map(a => `${a.buyer} bought ${a.product} · ${a.ago}`) : ['Flash deals ending soon!', 'Up to 40% off selected items', 'New deals added every hour', 'Free shipping on orders over 100k']), ...(activity.length > 0 ? activity.map(a => `${a.buyer} bought ${a.product} · ${a.ago}`) : ['Flash deals ending soon!', 'Up to 40% off selected items', 'New deals added every hour', 'Free shipping on orders over 100k'])].map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Page toggle tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {[
          { label: '🛍️ Products', active: false, action: () => { onClose(); onOpenProducts?.() } },
          { label: '⚡ Flash Sale', active: true, action: () => {} },
          { label: '🔨 Auction', active: false, action: () => { onClose(); onOpenAuction?.() } },
        ].map((tab, i) => (
          <button key={i} onClick={tab.action} style={{
            flex: 1, padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: tab.active ? '2px solid #F59E0B' : '2px solid transparent',
            color: tab.active ? '#F59E0B' : 'rgba(255,255,255,0.35)',
            fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'center', whiteSpace: 'nowrap',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Products grid */}
      <div className={styles.body}>
        {displayProducts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>⚡</span>
            <span>No active flash sales right now</span>
            <span className={styles.emptySub}>Check back soon — sellers run flash sales regularly</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {displayProducts.map(p => {
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
          product={{
            ...selectedProduct,
            sale_price: Math.round(selectedProduct.price * (1 - (selectedProduct.flashSale?.discountPercent || 0) / 100)),
            _flashSale: true,
            _discountPercent: selectedProduct.flashSale?.discountPercent || 0,
          }}
          onClose={() => setSelectedProduct(null)}
          onOrderViaChat={onOrderViaChat}
          onMakeOffer={onMakeOffer}
        />
      )}

      {/* Floating footer nav */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 100001, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 30, padding: '6px 8px',
      }}>
        {[
          { label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: onClose },
          { label: 'Used', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.22-8.56"/><path d="M21 3v6h-6"/></svg>, action: onClose },
          { label: 'Alerts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, action: () => onAlerts?.(), badge: true },
          { label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => onProfile?.() },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '8px 16px', borderRadius: 22,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s',
          }}>
            {btn.icon}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}
