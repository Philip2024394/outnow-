/**
 * UsedGoodsScreen — browse pre-owned / secondhand products.
 * Matches the main marketplace layout: same bg, glass overlay, brand header, tabs.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { fetchAllProducts } from '@/services/commerceService'
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

export default function UsedGoodsScreen({ open, onClose, onOpenChat, onOpenProducts, onOpenFlashSale, onOpenAuctions }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

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
        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>MARKET</span> <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>· USED</span></span>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Search bar */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search used goods..." />
        </div>
      </div>

      {/* Tabs — matching main marketplace */}
      <div className={styles.mainTabs}>
        <button className={styles.mainTab} onClick={() => { onClose?.(); onOpenProducts?.() }}>🛍️ Products</button>
        <button className={styles.mainTab} onClick={() => { onClose?.(); onOpenFlashSale?.() }}>⚡ Flash Sale</button>
        <button className={styles.mainTab} onClick={() => { onClose?.(); onOpenAuctions?.() }}>🔨 Auctions</button>
        <button className={`${styles.mainTab} ${styles.mainTabActive}`}>🔄 Used</button>
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
            <div key={p.id} className={styles.card}>
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
              <button className={styles.cardBtn} onClick={() => onOpenChat?.({ sellerId: p.user_id, displayName: p.seller?.display_name ?? 'Seller' })}>
                Message Seller
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
