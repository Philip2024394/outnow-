import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { sortProducts, sortSellers } from '@/utils/searchAlgorithm'
import { useLanguage } from '@/i18n'
import styles from './FloatingIcons.module.css'

const CATEGORIES = [
  { id: 'all',         emoji: '🛍️', label: 'All' },
  { id: 'food',        emoji: '🍜', label: 'Food' },
  { id: 'fashion',     emoji: '👗', label: 'Fashion' },
  { id: 'electronics', emoji: '📱', label: 'Electronics' },
  { id: 'beauty',      emoji: '💄', label: 'Beauty' },
  { id: 'handmade',    emoji: '🎨', label: 'Handmade' },
  { id: 'dating',      emoji: '💕', label: 'Dating' },
  { id: 'bike_ride',   emoji: '🏍️', label: 'Ride' },
  { id: 'car_taxi',    emoji: '🚗', label: 'Car' },
  { id: 'massage',     emoji: '💆', label: 'Massage' },
  { id: 'home_furniture', emoji: '🏠', label: 'Home' },
  { id: 'shoes',       emoji: '👟', label: 'Shoes' },
]

function fmtRp(n) {
  if (!n) return ''
  const v = parseFloat(n)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

export default function FloatingIcons({
  sessions = [], serviceCounts = {}, onSelectSession,
  onFoodClick, onRideClick, onShoppingClick, onDatingClick, onMassageClick,
}) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [sellers, setSellers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  // Fetch sellers and products from Supabase
  const search = useCallback(async (q, cat) => {
    if (!supabase) return
    setLoading(true)
    try {
      const like = q.trim() ? `%${q.trim()}%` : null

      let sellerQ = supabase
        .from('profiles')
        .select('id,display_name,brand_name,looking_for,city,country,photo_url,bio,orders_filled,orders_canceled,created_at')
        .not('brand_name', 'is', null)
        .limit(30)
      if (like) sellerQ = sellerQ.or(`brand_name.ilike.${like},display_name.ilike.${like},bio.ilike.${like},city.ilike.${like}`)

      let productQ = supabase
        .from('products')
        .select('*, profiles:user_id(display_name, photo_url, city, country)')
        .eq('active', true)
        .limit(20)
      if (like) productQ = productQ.or(`name.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      if (cat !== 'all') productQ = productQ.eq('category', cat)

      const [s, p] = await Promise.allSettled([sellerQ, productQ])
      setSellers(s.status === 'fulfilled' ? (s.value.data ?? []) : [])
      setProducts(p.status === 'fulfilled' ? (p.value.data ?? []) : [])
    } catch {
      setSellers([])
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query, activeCat), 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, activeCat, search])

  const handleCategoryClick = (cat) => {
    // Special categories open their dedicated screens
    if (cat.id === 'food' && onFoodClick) { onFoodClick(); return }
    if ((cat.id === 'bike_ride' || cat.id === 'car_taxi') && onRideClick) { onRideClick(); return }
    if (cat.id === 'dating' && onDatingClick) { onDatingClick(); return }
    if (cat.id === 'massage' && onMassageClick) { onMassageClick(); return }
    setActiveCat(cat.id)
  }

  const handleSellerClick = (seller) => {
    if (onShoppingClick) onShoppingClick()
  }

  const sortedProducts = sortProducts(products, query, null, null)
  const sortedSellers = sortSellers(
    sellers.map(s => ({ ...s, displayName: s.display_name, brandName: s.brand_name, photoURL: s.photo_url })),
    query, null, null
  )

  const hasResults = sortedProducts.length > 0 || sortedSellers.length > 0

  return (
    <div className={styles.dock}>
      <div className={styles.dockInner}>

        {/* Search bar */}
        <div className={styles.searchRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, sellers, services..."
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Category chips */}
        <div className={styles.chipStrip}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.chip} ${activeCat === cat.id ? styles.chipActive : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span>{cat.emoji}</span>
              <span className={styles.chipLabel}>{cat.label}</span>
              {(serviceCounts[cat.id] ?? 0) > 0 && (
                <span className={styles.chipBadge}>{serviceCounts[cat.id]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div className={styles.results}>
            {loading && (
              <div className={styles.loadingRow}>Searching...</div>
            )}

            {/* Product results */}
            {sortedProducts.length > 0 && (
              <>
                <div className={styles.resultSection}>Products</div>
                <div className={styles.productGrid}>
                  {sortedProducts.slice(0, 6).map(p => (
                    <button key={p.id} className={styles.productCard} onClick={() => onShoppingClick?.()}>
                      <div className={styles.productImgWrap}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className={styles.productImg} />
                          : <span className={styles.productImgFallback}>📦</span>
                        }
                        {p.sale_price && p.sale_price < p.price && (
                          <span className={styles.saleBadge}>-{Math.round((1 - p.sale_price / p.price) * 100)}%</span>
                        )}
                      </div>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productPrice}>
                        {p.sale_price && p.sale_price < p.price ? (
                          <>
                            <span className={styles.salePrice}>{fmtRp(p.sale_price)}</span>
                            <span className={styles.origPrice}>{fmtRp(p.price)}</span>
                          </>
                        ) : fmtRp(p.price)}
                      </div>
                      {p.profiles?.display_name && (
                        <div className={styles.productSeller}>{p.profiles.display_name}</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Seller results */}
            {sortedSellers.length > 0 && (
              <>
                <div className={styles.resultSection}>Sellers</div>
                {sortedSellers.slice(0, 4).map(s => (
                  <button key={s.id} className={styles.sellerRow} onClick={() => handleSellerClick(s)}>
                    <div className={styles.sellerAvatar}>
                      {s.photo_url
                        ? <img src={s.photo_url} alt="" className={styles.sellerAvatarImg} />
                        : <span>{(s.brand_name ?? s.display_name ?? '?')[0]}</span>
                      }
                    </div>
                    <div className={styles.sellerInfo}>
                      <div className={styles.sellerName}>{s.brand_name ?? s.display_name}</div>
                      <div className={styles.sellerCity}>{s.city ? `📍 ${s.city}` : ''}</div>
                    </div>
                    {s.orders_filled > 0 && (
                      <div className={styles.sellerStats}>{s.orders_filled} sold</div>
                    )}
                  </button>
                ))}
              </>
            )}

            {!loading && !hasResults && query.trim().length >= 2 && (
              <div className={styles.emptyResults}>
                No results for "{query}" — try different keywords
              </div>
            )}

            {hasResults && (
              <button className={styles.viewAllBtn} onClick={() => onShoppingClick?.()}>
                View all in Marketplace →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
