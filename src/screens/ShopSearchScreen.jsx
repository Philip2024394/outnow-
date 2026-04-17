import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import { DEMO_BUSINESS_SELLERS } from '@/demo/mockData'
import { sortProducts, sortSellers } from '@/utils/searchAlgorithm'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import SellerProfileSheet from '@/components/commerce/SellerProfileSheet'
import RecommendationBanner from '@/components/commerce/RecommendationBanner'
import FlashSalePage from '@/components/commerce/FlashSalePage'
import AuctionPage from '@/components/commerce/AuctionPage'
import BuyerProfileSheet from '@/components/commerce/BuyerProfileSheet'
import PurchaseHistoryScreen from '@/screens/PurchaseHistoryScreen'
import SearchAutocomplete, { saveRecentSearch } from '@/components/commerce/SearchAutocomplete'
import { getAuctions, AUCTION_STATUS } from '@/services/auctionService'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import styles from './ShopSearchScreen.module.css'

const MARKET_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2017,%202026,%2002_19_47%20AM.png'

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
const POWER_SELLER_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2010_10_59%20PM.png'
const POWER_SELLER_MIN_ORDERS = 3

const DEACTIVATED_IMGS = [
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2010_14_04%20PM.png',   // Restocking
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2010_15_55%20PM.png',   // Sold Out
]
const DEACTIVATED_SHOW_DAYS = 3

function isPowerSeller(seller) {
  const orders = seller.ordersFilled ?? seller.orders_filled ?? 0
  return orders >= POWER_SELLER_MIN_ORDERS
}

function isRecentlyDeactivated(product) {
  if (product.active) return false
  const deactivatedAt = product.deactivated_at ?? product.deactivatedAt
  if (!deactivatedAt) return true // no timestamp = just deactivated, show it
  return (Date.now() - new Date(deactivatedAt).getTime()) < DEACTIVATED_SHOW_DAYS * 86400000
}

function ProductCard({ product, onClick, isFirstNewShopProduct, isPowerSellerProduct, onAuctionTap }) {
  const price = parseFloat(product.price) || 0
  const salePrice = parseFloat(product.sale_price) || 0
  const hasSale = salePrice > 0 && salePrice < price
  const discount = hasSale ? Math.round((1 - salePrice / price) * 100) : 0
  const fmtRp = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt` : `Rp ${n.toLocaleString('id-ID')}`
  const sellerName = product.profiles?.display_name ?? ''

  // Check if this product is in a live auction
  const liveAuction = getAuctions().find(a =>
    a.productId === product.id && a.status === AUCTION_STATUS.LIVE && a.endTime > Date.now()
  )
  const inAuction = !!liveAuction
  const deactivated = product._showDeactivated ?? false
  const deactivatedImg = DEACTIVATED_IMGS[(product.id?.charCodeAt(0) ?? 0) % 2]

  return (
    <button className={`${styles.card} ${deactivated ? styles.cardDeactivated : ''}`} onClick={() => !deactivated && onClick(product)} style={{ position:'relative', cursor: deactivated ? 'default' : 'pointer' }}>
      <div className={styles.cardImgWrap}>
        {(product.image_url ?? product.image)
          ? <img src={product.image_url ?? product.image} alt={product.name} className={styles.cardImg} />
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
        {inAuction && (
          <div className={styles.auctionOverlay} onClick={(e) => { e.stopPropagation(); onAuctionTap?.(liveAuction) }}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2009_59_27%20PM.png" alt="" className={styles.auctionOverlayImg} />
            <span className={styles.auctionLiveText}>LIVE</span>
          </div>
        )}
        {isFirstNewShopProduct && !inAuction && (
          <div className={styles.newShopOverlay}>
            <img src={NEW_SHOP_IMGS[(product.id?.charCodeAt(0) ?? 0) % 2]} alt="" className={styles.newShopOverlayImg} />
          </div>
        )}
        {isPowerSellerProduct && !inAuction && !isFirstNewShopProduct && !deactivated && (
          <div className={styles.newShopOverlay}>
            <img src={POWER_SELLER_IMG} alt="Power Seller" className={styles.newShopOverlayImg} />
          </div>
        )}
        {deactivated && (
          <div className={styles.deactivatedOverlay}>
            <img src={deactivatedImg} alt="" className={styles.deactivatedOverlayImg} />
            <span className={styles.deactivatedStock}>0 Stock</span>
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName} style={{ fontSize:11, lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {product.name}
        </div>
        <div style={{ padding:'2px 0', display:'flex', alignItems:'baseline', gap:4 }}>
          {hasSale ? (
            <>
              <span style={{ fontSize:12, fontWeight:800, color:'#FFE500', fontFamily:'monospace' }}>{fmtRp(salePrice)}</span>
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
const NEW_SHOP_DAYS = 7
const NEW_SHOP_IMGS = [
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2010_05_14%20PM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2010_07_52%20PM.png',
]

function isNewShop(seller) {
  const created = seller.created_at ?? seller.createdAt
  if (!created) return false
  return (Date.now() - new Date(created).getTime()) < NEW_SHOP_DAYS * 86400000
}

function SellerCard({ seller, onClick, onAuctionTap }) {
  // Check if seller has an active auction
  const liveAuction = getAuctions().find(a =>
    a.sellerId === seller.id && a.status === AUCTION_STATUS.LIVE && a.endTime > Date.now()
  )
  const hasLiveAuction = !!liveAuction
  const newShop = isNewShop(seller)

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
        {hasLiveAuction && (
          <div className={styles.auctionOverlay} onClick={(e) => { e.stopPropagation(); onAuctionTap?.(liveAuction) }}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2009_59_27%20PM.png" alt="" className={styles.auctionOverlayImg} />
            <span className={styles.auctionLiveText}>LIVE</span>
          </div>
        )}
        {newShop && !hasLiveAuction && (
          <div className={styles.newShopOverlay}>
            <img src={NEW_SHOP_IMGS[(seller.id?.charCodeAt(0) ?? 0) % 2]} alt="" className={styles.newShopOverlayImg} />
          </div>
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
export default function ShopSearchScreen({ onClose, userCity, userCountry, giftFor, onGiftDismiss, wishlistMode = false, onWishlistSelectSeller, showToast, onOrderViaChat, onMakeOffer, onLandingChange, onHome, onChat, onAlerts, onProfile }) {
  const [showLanding, setShowLanding] = useState(true)
  const [query,                  setQuery]                  = useState('')
  const [activeCategory,         setActiveCategory]         = useState('all')
  const [sellers,                setSellers]                = useState(DEMO_SELLERS)
  const [products,               setProducts]               = useState(DEMO_PRODUCTS)
  const [loading,                setLoading]                = useState(false)
  const [selectedSeller,         setSelectedSeller]         = useState(null)
  const [viewMode,               setViewMode]               = useState('all') // 'all' | 'products' | 'sellers'
  const [wishlistBannerDismissed, setWishlistBannerDismissed] = useState(false)
  const [flashSaleOpen, setFlashSaleOpen] = useState(false)
  const [auctionOpen, setAuctionOpen] = useState(false)
  const [auctionSelected, setAuctionSelected] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterSort, setFilterSort] = useState('relevance') // relevance | price_low | price_high | distance
  const [filterCity, setFilterCity] = useState('')
  const [filterCondition, setFilterCondition] = useState('all') // all | new | used
  const [searchFocused, setSearchFocused] = useState(false)
  const [buyerProfileOpen, setBuyerProfileOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const inputRef = useRef(null)

  const activeCat = SEARCH_CATEGORIES.find(c => c.id === activeCategory) ?? SEARCH_CATEGORIES[0]

  // Use search algorithm for relevance scoring + fair rotation
  const filteredSellers = sortSellers(
    sellers.filter(s => {
      if (!matchesCategory(s, activeCat) || !matchesQuery(s, query)) return false
      if (filterCity && !(s.city ?? '').toLowerCase().includes(filterCity.toLowerCase())) return false
      return true
    }),
    query, userCity, userCountry
  )

  let filteredProducts = sortProducts(
    products.filter(p => {
      if (activeCat.id !== 'all') {
        if (p.category !== activeCat.id && !activeCat.keywords?.some(kw => (p.name ?? '').toLowerCase().includes(kw) || (p.tags ?? []).some(t => t.toLowerCase().includes(kw)))) return false
      }
      // City filter
      if (filterCity) {
        const pCity = (p.profiles?.city ?? p.city ?? '').toLowerCase()
        if (!pCity.includes(filterCity.toLowerCase())) return false
      }
      // Condition filter
      if (filterCondition === 'new' && p.condition && !p.condition.toLowerCase().includes('new')) return false
      if (filterCondition === 'used' && p.condition && p.condition.toLowerCase().includes('new')) return false
      return true
    }),
    query, userCity, userCountry
  )

  // Sort products
  if (filterSort === 'price_low') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  } else if (filterSort === 'price_high') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
  }

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
      setProducts(productData.length > 0 ? productData : DEMO_PRODUCTS)
    } catch {
      setSellers(DEMO_SELLERS)
      setProducts(DEMO_PRODUCTS)
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
        onMakeOffer={onMakeOffer ?? null}
      />
    )
  }

  const handleSellerClick = (seller) => {
    if (wishlistMode) { onWishlistSelectSeller?.(seller) }
    else { setSelectedSeller(seller) }
  }

  const handleAuctionTap = (auction) => {
    setAuctionSelected(auction)
    setAuctionOpen(true)
  }

  if (showLanding) return (
    <div className={styles.landingPage} style={{ backgroundImage: `url("${MARKET_LANDING_BG}")` }}>
      <div className={styles.landingOverlay} />

      {/* Header: brand logo */}
      <div className={styles.landingHeader}>
        <img src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752" alt="Indoo Market" className={styles.landingHeaderLogo} />
      </div>

      {/* Footer content */}
      <div className={styles.landingContent}>
        <p className={styles.landingSub}>Buy & sell anything — fashion, electronics, handmade and more</p>
        <button className={styles.landingBtn} onClick={() => { markSectionVisited('marketplace'); setShowLanding(false); onLandingChange?.(false) }}>
          Enter Marketplace
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

    </div>
  )

  return (
    <>
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

      {/* ── Header: logo + settings icon ── */}
      <div className={styles.header}>
        <img src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752" alt="Indoo Market" className={styles.headerLogo} />
        <button className={styles.profileBtn} onClick={() => setBuyerProfileOpen(true)} title="My Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className={styles.profileBtnLabel}>Account</span>
        </button>
      </div>

      {/* ── Search bar + filter ── */}
      <div className={styles.searchRow}>
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
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { saveRecentSearch(query); setSearchFocused(false); inputRef.current?.blur() } }}
            placeholder="Search products, sellers…"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
          <SearchAutocomplete
            query={query}
            products={products}
            visible={searchFocused}
            onSelect={(q) => { setQuery(q); saveRecentSearch(q); setSearchFocused(false) }}
          />
        </div>
        <button className={styles.filterInlineBtn} onClick={() => setShowFilters(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          {(filterSort !== 'relevance' || filterCity || filterCondition !== 'all') && (
            <span className={styles.filterInlineDot} />
          )}
        </button>
      </div>

      {/* ── 3 Tabs: Products / Flash Sale / Auctions ── */}
      <div className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${!flashSaleOpen && !auctionOpen ? styles.mainTabActive : ''}`}
          onClick={() => { setFlashSaleOpen(false); setAuctionOpen(false) }}
        >
          🛍️ Products
        </button>
        <button
          className={`${styles.mainTab} ${flashSaleOpen ? styles.mainTabActive : ''}`}
          onClick={() => { setFlashSaleOpen(true); setAuctionOpen(false) }}
        >
          ⚡ Flash Sale
        </button>
        <button
          className={`${styles.mainTab} ${auctionOpen ? styles.mainTabActive : ''}`}
          onClick={() => { setAuctionOpen(true); setFlashSaleOpen(false) }}
        >
          🔨 Auctions
        </button>
      </div>

      {/* ── Expanded filters ── */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Sort by</span>
              <select className={styles.filterSelect} value={filterSort} onChange={e => setFilterSort(e.target.value)}>
                <option value="relevance">Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="distance">Distance: Nearest</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Condition</span>
              <select className={styles.filterSelect} value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>City</span>
            <input className={styles.filterInput} value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="e.g. Jakarta, Bali, Surabaya" />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Category</span>
            <div className={styles.filterChips}>
              {SEARCH_CATEGORIES.map(cat => (
                <button key={cat.id}
                  className={[styles.filterChip, activeCategory === cat.id ? styles.filterChipActive : ''].join(' ')}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <button className={styles.filterClear} onClick={() => { setFilterSort('relevance'); setFilterCity(''); setFilterCondition('all'); setActiveCategory('all') }}>
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Recommendation banners ── */}
      {!query.trim() && (
        <RecommendationBanner onProductTap={(p) => {
          const s = sellers.find(x => x.id === p.user_id) ?? { id: p.user_id ?? 'unknown', displayName: p.brand_name ?? 'Seller', brandName: p.brand_name, photoURL: null, city: p.city ?? null }
          handleSellerClick(s)
        }} />
      )}


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
            {filteredProducts.reduce((acc, p, i) => {
              // Cap deactivated cards: max 2 per 30 normal cards
              const deactivatedSoFar = acc.filter(x => x.props.product._showDeactivated).length
              const batch30 = Math.floor(acc.length / 30)
              const deactivatedInBatch = acc.slice(batch30 * 30).filter(x => x.props.product._showDeactivated).length

              if (isRecentlyDeactivated(p)) {
                if (deactivatedInBatch >= 2) return acc // skip excess
              }

              const sellerMatch = sellers.find(s => s.id === p.user_id)
              const isFirstNew = sellerMatch && isNewShop(sellerMatch) && filteredProducts.findIndex(fp => fp.user_id === p.user_id) === i
              const isFirstPower = sellerMatch && isPowerSeller(sellerMatch) && !isNewShop(sellerMatch) && filteredProducts.findIndex(fp => fp.user_id === p.user_id) === i
              const showDeactivated = isRecentlyDeactivated(p)
              const cardProduct = showDeactivated ? { ...p, _showDeactivated: true } : p

              acc.push(
                <ProductCard key={p.id} product={cardProduct} isFirstNewShopProduct={isFirstNew} isPowerSellerProduct={isFirstPower} onAuctionTap={handleAuctionTap} onClick={(prod) => {
                  const seller = sellers.find(s => s.id === prod.user_id) ?? {
                    id: prod.user_id,
                    displayName: prod.profiles?.display_name ?? 'Seller',
                    photoURL: prod.profiles?.photo_url ?? null,
                    city: prod.profiles?.city ?? null,
                    country: prod.profiles?.country ?? null,
                  }
                  handleSellerClick(seller)
                }} />
              )
              return acc
            }, [])}
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

    <FlashSalePage
      open={flashSaleOpen}
      onClose={() => setFlashSaleOpen(false)}
      onOrderViaChat={onOrderViaChat}
      onMakeOffer={onMakeOffer}
    />
    <AuctionPage
      open={auctionOpen}
      onClose={() => setAuctionOpen(false)}
    />
    <BuyerProfileSheet
      open={buyerProfileOpen}
      onClose={() => setBuyerProfileOpen(false)}
    />
    </>
  )
}
