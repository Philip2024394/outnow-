import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import { DEMO_BUSINESS_SELLERS } from '@/demo/mockData'
import { sortProducts, sortSellers } from '@/utils/searchAlgorithm'
import SellerProfileSheet from '@/components/commerce/SellerProfileSheet'
import styles from './ShopSearchScreen.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// ShopSearchScreen — header search bar + category chips + 3-col seller grid
// Click seller card → full-screen business page
// Theme: gold #F59E0B
// ─────────────────────────────────────────────────────────────────────────────

const SEARCH_CATEGORIES = [
  { id: 'all',         label: 'All',        emoji: '🛍️', keywords: [],                                          lookingFor: [] },
  { id: 'fashion',     label: 'Fashion',    emoji: '👗', keywords: ['fashion','clothing','shoes','bags','dress','style','wear','outfit'],  lookingFor: ['fashion','buy_sell'] },
  { id: 'electronics', label: 'Electronics',emoji: '📱', keywords: ['phone','laptop','tech','gadgets','mobile','computer','tablet','tv'],  lookingFor: ['electronics'] },
  { id: 'beauty',      label: 'Beauty',     emoji: '💄', keywords: ['beauty','hair','nails','makeup','salon','barber','lashes','spa'],      lookingFor: ['beauty'] },
  { id: 'food',        label: 'Food',       emoji: '🍔', keywords: ['food','restaurant','catering','meals','chef','delivery','bakery'],    lookingFor: ['restaurant','catering','fresh_produce'] },
  { id: 'handmade',    label: 'Handmade',   emoji: '🎨', keywords: ['handmade','craft','art','jewellery','candles','ceramics','artisan'],  lookingFor: ['handmade','art_craft','creative'] },
  { id: 'health',      label: 'Health',     emoji: '💊', keywords: ['health','medical','pharmacy','fitness','gym','therapy','wellness'],    lookingFor: ['healthcare','fitness_pt','pharmacy'] },
  { id: 'home',        label: 'Home',       emoji: '🏠', keywords: ['furniture','home','decor','interior','plumber','cleaning','garden'],  lookingFor: ['hardware','trades','cleaning'] },
  { id: 'vehicles',    label: 'Vehicles',   emoji: '🚗', keywords: ['car','vehicle','motorcycle','truck','parts','tyres','mechanic'],       lookingFor: ['vehicles','auto_repair'] },
  { id: 'property',    label: 'Property',   emoji: '🏢', keywords: ['property','house','apartment','rent','real estate','land'],           lookingFor: ['property','real_estate'] },
  { id: 'services',    label: 'Services',   emoji: '🔧', keywords: ['service','repair','cleaning','laundry','tailoring','delivery'],       lookingFor: ['trades','laundry','tailoring','transport'] },
  { id: 'events',      label: 'Events',     emoji: '🎉', keywords: ['events','wedding','party','dj','catering','photography','venue'],     lookingFor: ['event_planning','music_perform'] },
  { id: 'tech',        label: 'Tech & IT',  emoji: '💻', keywords: ['software','developer','web','app','it','design','seo','branding'],    lookingFor: ['technology','marketing'] },
  { id: 'education',   label: 'Education',  emoji: '📚', keywords: ['tutoring','teaching','coaching','lessons','training','course'],       lookingFor: ['education','coaching'] },
  { id: 'agri',        label: 'Farm & Agri',emoji: '🌾', keywords: ['farm','crops','livestock','seeds','organic','poultry','honey'],       lookingFor: ['fresh_produce','agri_goods'] },
]

// Mock sellers loaded from mockData — used as fallback when Supabase is empty
const DEMO_SELLERS = DEMO_BUSINESS_SELLERS

function matchesCategory(seller, cat) {
  if (cat.id === 'all') return true
  if (cat.lookingFor?.includes(seller.lookingFor)) return true
  const text = `${seller.displayName} ${seller.brandName ?? ''} ${seller.bio ?? ''} ${seller.tags?.join?.(' ') ?? ''}`.toLowerCase()
  return cat.keywords.some(kw => text.includes(kw))
}

function matchesQuery(seller, q) {
  if (!q.trim()) return true
  const text = `${seller.displayName} ${seller.brandName ?? ''} ${seller.bio ?? ''} ${seller.city ?? ''} ${seller.lookingFor ?? ''}`.toLowerCase()
  return q.toLowerCase().split(' ').filter(Boolean).every(w => text.includes(w))
}

function getCategoryLabel(lookingFor) {
  const opt = LOOKING_FOR_OPTIONS.find(o => o.value === lookingFor)
  return opt ? `${opt.emoji ?? '🏪'} ${opt.label}` : '🏪 Business'
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const price = parseFloat(product.price) || 0
  const salePrice = parseFloat(product.sale_price) || 0
  const hasSale = salePrice > 0 && salePrice < price
  const discount = hasSale ? Math.round((1 - salePrice / price) * 100) : 0
  const fmtRp = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt` : `Rp ${n.toLocaleString('id-ID')}`
  const sellerName = product.profiles?.display_name ?? ''

  return (
    <button className={styles.card} onClick={() => onClick(product)} style={{ position:'relative' }}>
      <div className={styles.cardImgWrap}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className={styles.cardImg} />
          : <div className={styles.cardImgFallback} style={{ fontSize:28, color:'rgba(255,255,255,0.15)' }}>📦</div>
        }
        {hasSale && (
          <span style={{ position:'absolute', top:4, right:4, padding:'2px 6px', borderRadius:4, background:'rgba(239,68,68,0.9)', color:'#fff', fontSize:9, fontWeight:800 }}>
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span style={{ position:'absolute', bottom:4, left:4, padding:'2px 6px', borderRadius:4, background:'rgba(0,0,0,0.7)', color:'#ef4444', fontSize:9, fontWeight:700 }}>
            Sold Out
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName} style={{ fontSize:11, lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {product.name}
        </div>
        <div style={{ padding:'2px 0', display:'flex', alignItems:'baseline', gap:4 }}>
          {hasSale ? (
            <>
              <span style={{ fontSize:12, fontWeight:800, color:'#ef4444', fontFamily:'monospace' }}>{fmtRp(salePrice)}</span>
              <span style={{ fontSize:9, textDecoration:'line-through', color:'rgba(255,255,255,0.3)' }}>{fmtRp(price)}</span>
            </>
          ) : (
            <span style={{ fontSize:12, fontWeight:800, color:'#F59E0B', fontFamily:'monospace' }}>{fmtRp(price)}</span>
          )}
        </div>
        {sellerName && (
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {sellerName}{product.profiles?.city ? ` · ${product.profiles.city}` : ''}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Seller card ───────────────────────────────────────────────────────────────
function SellerCard({ seller, onClick }) {
  return (
    <button className={styles.card} onClick={() => onClick(seller)}>
      <div className={styles.cardImgWrap}>
        {seller.photoURL
          ? <img src={seller.photoURL} alt={seller.displayName} className={styles.cardImg} />
          : <div className={styles.cardImgFallback}>{(seller.brandName ?? seller.displayName)[0]}</div>
        }
        {seller.isOnline && <span className={styles.onlineDot} />}
        {seller.productCondition && seller.productCondition !== 'new' && (
          <span className={styles.conditionBadge}>{seller.productCondition}</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{seller.brandName || seller.displayName}</div>
        <div className={styles.cardCat}>{getCategoryLabel(seller.lookingFor)}</div>
        {seller.city && (
          <div className={styles.cardCity}>📍 {seller.city}{seller.country ? `, ${seller.country}` : ''}</div>
        )}
      </div>
    </button>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ShopSearchScreen({ onClose, userCity, userCountry, giftFor, onGiftDismiss, wishlistMode = false, onWishlistSelectSeller, showToast, onOrderViaChat }) {
  const [query,                  setQuery]                  = useState('')
  const [activeCategory,         setActiveCategory]         = useState('all')
  const [sellers,                setSellers]                = useState(DEMO_SELLERS)
  const [products,               setProducts]               = useState([])
  const [loading,                setLoading]                = useState(false)
  const [selectedSeller,         setSelectedSeller]         = useState(null)
  const [viewMode,               setViewMode]               = useState('all') // 'all' | 'products' | 'sellers'
  const [wishlistBannerDismissed, setWishlistBannerDismissed] = useState(false)
  const inputRef = useRef(null)

  const activeCat = SEARCH_CATEGORIES.find(c => c.id === activeCategory) ?? SEARCH_CATEGORIES[0]

  // Use search algorithm for relevance scoring + fair rotation
  const filteredSellers = sortSellers(
    sellers.filter(s => matchesCategory(s, activeCat) && matchesQuery(s, query)),
    query, userCity, userCountry
  )
  const filteredProducts = sortProducts(
    products.filter(p => {
      if (activeCat.id === 'all') return true
      return p.category === activeCat.id || activeCat.keywords?.some(kw => (p.name ?? '').toLowerCase().includes(kw) || (p.tags ?? []).some(t => t.toLowerCase().includes(kw)))
    }),
    query, userCity, userCountry
  )

  const search = useCallback(async (q, catId) => {
    setLoading(true)
    try {
      const cat = SEARCH_CATEGORIES.find(c => c.id === catId) ?? SEARCH_CATEGORIES[0]
      const like = q.trim() ? `%${q.trim()}%` : null

      // Fetch sellers
      let sellerQ = supabase
        .from('profiles')
        .select('id,displayName:display_name,brandName:brand_name,lookingFor:looking_for,city,country,photoURL:photo_url,bio,tags,productCondition:product_condition,isOnline:is_online,bizWhatsapp:biz_whatsapp,orders_filled,orders_canceled,created_at')
        .not('looking_for', 'is', null)
        .limit(60)
      if (cat.lookingFor?.length) sellerQ = sellerQ.in('looking_for', cat.lookingFor)
      if (like) sellerQ = sellerQ.or(`display_name.ilike.${like},brand_name.ilike.${like},bio.ilike.${like},city.ilike.${like}`)

      // Fetch products — search by name, tags, description, category
      let productQ = supabase
        .from('products')
        .select('*, profiles:user_id(display_name, photo_url, city, country)')
        .eq('active', true)
        .limit(40)
      if (like) productQ = productQ.or(`name.ilike.${like},description.ilike.${like},category.ilike.${like}`)
      if (cat.id !== 'all') productQ = productQ.eq('category', cat.id)

      const [sellersRes, productsRes] = await Promise.allSettled([sellerQ, productQ])

      const sellerData = sellersRes.status === 'fulfilled' ? (sellersRes.value.data ?? []) : []
      const productData = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []

      setSellers(sellerData.length > 0 ? sellerData : DEMO_SELLERS)
      setProducts(productData)
    } catch {
      setSellers(DEMO_SELLERS)
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query, activeCategory), 350)
    return () => clearTimeout(t)
  }, [query, activeCategory, search])

  // If a seller is selected, render the full business page
  if (selectedSeller) {
    return (
      <SellerProfileSheet
        seller={selectedSeller}
        onClose={() => setSelectedSeller(null)}
        giftFor={giftFor ?? null}
        showToast={showToast}
        onOrderViaChat={onOrderViaChat ?? null}
      />
    )
  }

  const handleSellerClick = (seller) => {
    if (wishlistMode) { onWishlistSelectSeller?.(seller) }
    else { setSelectedSeller(seller) }
  }

  return (
    <div className={styles.screen}>

      {/* ── Gift context chip ── */}
      {giftFor && (
        <div className={styles.giftChip}>
          {giftFor.photoURL
            ? <img src={giftFor.photoURL} alt={giftFor.displayName} className={styles.giftChipAvatar} />
            : <span className={styles.giftChipAvatarFallback}>💕</span>
          }
          <div className={styles.giftChipText}>
            <span className={styles.giftChipLabel}>Shopping For</span>
            <span className={styles.giftChipName}>{giftFor.displayName ?? 'Someone special'}</span>
          </div>
          <button className={styles.giftChipClose} onClick={onGiftDismiss} aria-label="Clear gift context">✕</button>
        </div>
      )}

      {/* ── Wishlist discovery banner (normal browsing mode only) ── */}
      {!giftFor && !wishlistMode && !wishlistBannerDismissed && (
        <div className={styles.wishlistBanner}>
          <span className={styles.wishlistBannerEmoji}>📌</span>
          <div className={styles.wishlistBannerText}>
            <strong>Pin items to your profile</strong>
            <span>Admirers can buy them as anonymous gifts — a gesture of commitment before or after a date</span>
          </div>
          <button className={styles.wishlistBannerClose} onClick={() => setWishlistBannerDismissed(true)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ── Header with search bar ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sellers, products, services…"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        <div className={styles.wordmark}>
          <span className={styles.echo}>ECHO</span>
          <span className={styles.shop}>Shop</span>
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className={styles.chips}>
        {SEARCH_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={[styles.chip, activeCategory === cat.id ? styles.chipActive : ''].join(' ')}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── View mode toggle + results info ── */}
      <div className={styles.resultsBar}>
        <div style={{ display:'flex', gap:0, borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
          {[
            { id:'all',      label:'All' },
            { id:'products', label:`Products (${filteredProducts.length})` },
            { id:'sellers',  label:`Sellers (${filteredSellers.length})` },
          ].map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              style={{
                padding:'5px 10px', fontSize:10, fontWeight:700, cursor:'pointer',
                border:'none', fontFamily:'inherit',
                background: viewMode === m.id ? 'rgba(245,158,11,0.2)' : 'transparent',
                color: viewMode === m.id ? '#F59E0B' : 'rgba(255,255,255,0.35)',
              }}
            >{m.label}</button>
          ))}
        </div>
        {userCity && <span className={styles.localBadge}>📍 {userCity} first</span>}
      </div>

      {/* ── Products grid ── */}
      {(viewMode === 'all' || viewMode === 'products') && filteredProducts.length > 0 && (
        <>
          {viewMode === 'all' && (
            <div style={{ padding:'8px 16px 4px', fontSize:12, fontWeight:800, color:'#F59E0B' }}>
              Products
            </div>
          )}
          <div className={styles.grid}>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onClick={(prod) => {
                // Find the seller for this product and open their profile
                const seller = sellers.find(s => s.id === prod.user_id) ?? {
                  id: prod.user_id,
                  displayName: prod.profiles?.display_name ?? 'Seller',
                  photoURL: prod.profiles?.photo_url ?? null,
                  city: prod.profiles?.city ?? null,
                  country: prod.profiles?.country ?? null,
                }
                handleSellerClick(seller)
              }} />
            ))}
          </div>
        </>
      )}

      {/* ── Sellers grid ── */}
      {(viewMode === 'all' || viewMode === 'sellers') && (
        <>
          {viewMode === 'all' && filteredProducts.length > 0 && (
            <div style={{ padding:'12px 16px 4px', fontSize:12, fontWeight:800, color:'#A78BFA' }}>
              Sellers
            </div>
          )}
          <div className={styles.grid}>
            {loading && Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImg} />
                <div className={styles.skeletonLine} style={{ width: '70%' }} />
                <div className={styles.skeletonLine} style={{ width: '45%' }} />
              </div>
            ))}

            {!loading && filteredSellers.map(seller => (
              <SellerCard key={seller.id} seller={seller} onClick={handleSellerClick} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && filteredSellers.length === 0 && filteredProducts.length === 0 && (
        <div className={styles.empty} style={{ gridColumn:'1/-1' }}>
          <span>🔍</span>
          <div>No results found</div>
          <div className={styles.emptySub}>Try a different search or category</div>
        </div>
      )}
    </div>
  )
}
