/**
 * UsedGoodsScreen — browse pre-owned / secondhand products.
 * Matches the main marketplace layout: same bg, glass overlay, brand header, tabs.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fetchAllProducts } from '@/services/commerceService'
import ProductDetailSheet from '@/components/commerce/ProductDetailSheet'
import styles from './UsedGoodsScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const CONDITION_LABELS = {
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  used: 'Pre-owned',
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'bags', label: 'Bags' },
  { id: 'phones_accessories', label: 'Phones' },
  { id: 'womens_fashion', label: "Women's" },
  { id: 'mens_fashion', label: "Men's" },
  { id: 'home_living', label: 'Home' },
  { id: 'automotive', label: 'Auto' },
  { id: 'handmade', label: 'Handmade' },
]

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function UsedGoodsScreen({ open, onClose, onOpenChat, onOpenProducts, onOpenFlashSale, onOpenAuctions, onAlerts, onProfile }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchAllProducts({ condition: 'used' }).then(p => {
      setProducts(p)
      setLoading(false)
    })
  }, [open])

  if (!open) return null

  const filtered = products.filter(p => {
    if (category !== 'all' && p.category !== category) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    }
    return true
  })

  return createPortal(
    <div className={styles.screen}>
      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>M5</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>USED GOODS</span></div>
      {/* Header — brand logo */}
      <div className={styles.header}>
        <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em' }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span><span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>USED</span></span>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>


      {/* Search bar + filter */}
      <div className={styles.searchRow} style={{ display: 'flex', gap: 8 }}>
        <div className={styles.searchWrap} style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search used goods..." />
        </div>
        <button style={{ width: 38, height: 38, borderRadius: 10, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M3 4h18v2H3zm3 5h12v2H6zm3 5h6v2H9z"/></svg>
        </button>
      </div>

      {/* Category chips */}
      <div className={styles.chips}>
        {CATEGORIES.map(c => (
          <button key={c.id} className={`${styles.chip} ${category === c.id ? styles.chipActive : ''}`} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className={styles.content}>
        {loading && <div className={styles.empty}>Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <span>No used items found</span>
            <span className={styles.emptySub}>Try a different category or search</span>
          </div>
        )}
        <div className={styles.grid}>
          {filtered.map(p => (
            <div key={p.id} className={styles.card} onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
              <div className={styles.cardImgWrap}>
                <img src={p.image} alt={p.name} className={styles.cardImg} />
                <span className={styles.condBadge}>{CONDITION_LABELS[p.condition] ?? p.condition}</span>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{p.name}</span>
                <span className={styles.cardPrice}>{fmtRp(p.price)}</span>
                {p.seller && (
                  <span className={styles.cardSeller}>{p.seller?.brand_name ?? p.seller?.display_name}</span>
                )}
              </div>
              <button className={styles.cardBtn} onClick={(e) => { e.stopPropagation(); onOpenChat?.({ sellerId: p.user_id, displayName: p.seller?.display_name ?? 'Seller' }) }}>
                Message Seller
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product detail sheet */}
      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Floating footer nav */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 99998, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 30, padding: '6px 8px',
      }}>
        {[
          { label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: onClose },
          { label: 'Used', active: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.22-8.56"/><path d="M21 3v6h-6"/></svg>, action: () => {} },
          { label: 'Alerts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, action: () => onAlerts?.(), badge: true },
          { label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => onProfile?.() },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '8px 16px', borderRadius: 22,
            background: btn.active ? 'rgba(141,198,63,0.12)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: btn.active ? '#8DC63F' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.2s',
          }}>
            <div style={{ position: 'relative' }}>
              {btn.icon}
              {btn.badge && <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid #0e0e0e' }} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}
