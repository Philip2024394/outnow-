import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import { DEMO_BUSINESS_SELLERS } from '@/demo/mockData'
import { sortProducts, sortSellers } from '@/utils/searchAlgorithm'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import SellerProfileSheet from '@/components/commerce/SellerProfileSheet'
import ProductDetailSheet from '@/components/commerce/ProductDetailSheet'
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

const MARKET_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/UntitledsssaaddddddddDADSASDSDASSSsdfsdf.png'

// ─────────────────────────────────────────────────────────────────────────────
// ShopSearchScreen — header search bar + category chips + 3-col seller grid
// Click seller card → full-screen business page
// Theme: gold #8DC63F
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
          <span style={{ position:'absolute', top:4, right:4, padding:'2px 6px', borderRadius:4, background:'rgba(239,68,68,0.9)', color:'#fff', fontSize:11, fontWeight:800 }}>
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span style={{ position:'absolute', bottom:4, left:4, padding:'2px 6px', borderRadius:4, background:'rgba(0,0,0,0.7)', color:'#ef4444', fontSize:11, fontWeight:700 }}>
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
              <span style={{ fontSize:16, fontWeight:900, color:'#FFE500', fontFamily:'monospace' }}>{fmtRp(salePrice)}</span>
              <span style={{ fontSize:12, textDecoration:'line-through', color:'rgba(255,255,255,0.3)' }}>{fmtRp(price)}</span>
            </>
          ) : (
            <span style={{ fontSize:16, fontWeight:900, color:'#8DC63F', fontFamily:'monospace' }}>{fmtRp(price)}</span>
          )}
        </div>
        {sellerName && (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
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

// DEV: Page badge
function MktBadge({ num, label }) {
  return (
    <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>{num}</div>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ShopSearchScreen({ onClose, userCity, userCountry, giftFor, onGiftDismiss, wishlistMode = false, onWishlistSelectSeller, showToast, onOrderViaChat, onMakeOffer, onLandingChange, onHome, onChat, onAlerts, onProfile, onOpenUsedGoods, onOpenWanted }) {
  const [showLanding, setShowLanding] = useState(true)
  const [showCategories, setShowCategories] = useState(false)
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
  const [selectedProduct, setSelectedProduct] = useState(null)
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

  return (
    <>
    {/* ── Landing page (M1) — hidden via display:none instead of unmounting ── */}
    <div className={styles.landingPage} style={{ backgroundImage: `url("${MARKET_LANDING_BG}")`, display: showLanding ? undefined : 'none' }}>
      <MktBadge num="M1" label="Market Landing" />
      <div className={styles.landingOverlay} />

      {/* Side nav — Home + Sign Up */}
      <div style={{
        position: 'fixed', right: 6, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
        padding: '10px 6px', borderRadius: 24,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <button onClick={onClose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaa-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.03em' }}>Home</span>
        </button>
        <button onClick={() => setBuyerProfileOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaddd-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.03em' }}>Sign Up</span>
        </button>
      </div>

      {/* Header: brand logo + search bar */}
      <div className={styles.landingHeader}>
        <span style={{ fontSize: 28, fontWeight: 900, flexShrink: 0 }}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span> <span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>MARKET</span></span>
        <div className={styles.landingSearchWrap}>
          <svg className={styles.landingSearchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.landingSearchInput}
            placeholder="Search products, sellers…"
            readOnly
            onClick={() => { markSectionVisited('marketplace'); setShowLanding(false); onLandingChange?.(false) }}
          />
        </div>
      </div>

      {/* Live order ticker */}
      <div style={{ overflow: 'hidden', padding: '6px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', animation: 'tickerScroll 25s linear infinite', whiteSpace: 'nowrap', gap: 40 }}>
          {['Sarah bought Leather Bag · 2m ago', 'Andi booked Honda Vario · 5m ago', 'Rizky won Auction · 8m ago', 'Wayan listed Sound System · 12m ago', 'Sari sold Villa Package · 15m ago', 'Sarah bought Leather Bag · 2m ago', 'Andi booked Honda Vario · 5m ago', 'Rizky won Auction · 8m ago'].map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', flexShrink: 0 }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Footer — hero text + browse button */}
      <div className={styles.landingFooter}>
        <p className={styles.landingSub}>Buy & sell anything — fashion, electronics, handmade and more</p>
        <button onClick={() => { markSectionVisited('marketplace'); setShowLanding(false); setShowCategories(true); onLandingChange?.(false) }} style={{
          padding: '16px 40px', borderRadius: 16, background: '#8DC63F', border: 'none',
          color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
        }}>
          Browse Market
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

    </div>

    {/* ── Categories page (M1b) ── */}
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120,
      background: '#0a0a0c url("https://ik.imagekit.io/nepgaxllc/UntitledsssaaddddddddDADSASDSDASSSsdfsdf.png?updatedAt=1776625639213") center / cover no-repeat',
      display: showCategories ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Dark scrim so text is readable over image */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
      <MktBadge num="M1b" label="Categories" />

      {/* Header */}
      <div style={{ padding: '14px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: 28, fontWeight: 900 }}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span><span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>MARKET</span></span>
        <button onClick={() => { setShowCategories(false); setShowLanding(true); onLandingChange?.(true) }} style={{ width: 36, height: 36, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      {/* Subtitle */}
      <p style={{ padding: '0 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: '0 0 12px', position: 'relative', zIndex: 1 }}>Buy · Sell · Trade — choose a category</p>

      {/* 6 Landscape cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 80px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        {[
          { label: 'New Products', sub: 'Brand new goods from verified sellers', count: '24 items', rating: 4.8, icon: '✨', onClick: () => { setShowCategories(false) } },
          { label: 'Used Goods', sub: 'Pre-owned deals at great prices', count: '12 deals', rating: 4.6, icon: '🔄', onClick: () => { setShowCategories(false); onOpenUsedGoods?.() } },
          { label: 'Wanted Board', sub: 'Post what you need — sellers come to you', count: '8 requests', rating: 4.7, icon: '👀', onClick: () => { setShowCategories(false); onOpenWanted?.() } },
          { label: 'Flash Sale', sub: 'Limited time deals with huge discounts', count: '3 LIVE', live: true, rating: 4.9, icon: '⚡', onClick: () => { setShowCategories(false); requestAnimationFrame(() => setFlashSaleOpen(true)) } },
          { label: 'Auction', sub: 'Bid & win — live auctions happening now', count: '2 LIVE', live: true, rating: 4.8, icon: '🔨', onClick: () => { setShowCategories(false); requestAnimationFrame(() => setAuctionOpen(true)) } },
          { label: 'Shop All', sub: 'Browse the full marketplace catalog', count: 'Browse', rating: 4.7, icon: '🛍️', onClick: () => { setShowCategories(false) } },
        ].map((item, i) => (
          <button key={i} onClick={item.onClick} style={{
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14,
            padding: '16px 14px', width: '100%', boxSizing: 'border-box',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            position: 'relative',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.4)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.2,0.64,1), border-color 0.3s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Glow line */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.25), transparent)', pointerEvents: 'none' }} />

            {/* Icon */}
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', border: '1.5px solid rgba(141,198,63,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {item.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{item.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', flexShrink: 0 }}>★ {item.rating}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 5, lineHeight: 1.3 }}>{item.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: item.live ? 'rgba(239,68,68,0.15)' : 'rgba(141,198,63,0.12)', border: item.live ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(141,198,63,0.25)', fontSize: 10, fontWeight: 800, color: item.live ? '#EF4444' : '#8DC63F', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {item.live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', animation: 'livePulse 1.5s ease-in-out infinite' }} />}
                  {item.count}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Enter</span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer nav */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 99998, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 30, padding: '6px 8px',
      }}>
        {[
          { label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: () => { setShowCategories(false); setShowLanding(true); onLandingChange?.(true) } },
          { label: 'Used', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.22-8.56"/><path d="M21 3v6h-6"/></svg>, action: () => { setShowCategories(false); onOpenUsedGoods?.() } },
          { label: 'Alerts', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, action: () => onAlerts?.(), badge: true },
          { label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => setBuyerProfileOpen(true) },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '8px 16px', borderRadius: 22,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s',
          }}>
            <div style={{ position: 'relative' }}>
              {btn.icon}
              {btn.badge && <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid #0e0e0e' }} />}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* ── Products grid (M2) — hidden via display:none instead of unmounting ── */}
    <div className={styles.screen} style={{ display: (showLanding || showCategories) ? 'none' : undefined }}>
      <MktBadge num="M2" label="Products Grid" />

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

      {/* ── Header: logo left + home button right ── */}
      <div className={styles.header}>
        <span style={{ fontSize: 28, fontWeight: 900 }}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span><span style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>MARKET</span></span>
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

      {/* ── Live order ticker ── */}
      <div style={{ overflow: 'hidden', padding: '6px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', animation: 'tickerScroll 25s linear infinite', whiteSpace: 'nowrap', gap: 40 }}>
          {['Sarah bought Leather Bag · 2m ago', 'Andi booked Honda Vario · 5m ago', 'Rizky won Auction · 8m ago', 'Wayan listed Sound System · 12m ago', 'Sari sold Villa Package · 15m ago', 'Sarah bought Leather Bag · 2m ago', 'Andi booked Honda Vario · 5m ago', 'Rizky won Auction · 8m ago'].map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', flexShrink: 0 }} />{t}
            </span>
          ))}
        </div>
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
                background: viewMode === m.id ? 'rgba(141,198,63,0.2)' : 'transparent',
                color: viewMode === m.id ? '#8DC63F' : 'rgba(255,255,255,0.35)',
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
            <div style={{ padding:'10px 16px 6px', fontSize:20, fontWeight:900, color:'#fff' }}>
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
                  setSelectedProduct(prod)
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
            <div style={{ padding:'10px 16px 6px', fontSize:20, fontWeight:900, color:'#fff' }}>
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
      onOpenAuction={() => setAuctionOpen(true)}
      onOpenProducts={() => { setFlashSaleOpen(false); setAuctionOpen(false) }}
      onAlerts={() => onAlerts?.()}
      onProfile={() => setBuyerProfileOpen(true)}
    />
    <AuctionPage
      open={auctionOpen}
      onClose={() => setAuctionOpen(false)}
      onOpenUsedGoods={() => onOpenUsedGoods?.()}
      onAlerts={() => onAlerts?.()}
      onProfile={() => setBuyerProfileOpen(true)}
    />
    {selectedProduct && (
      <ProductDetailSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOrderViaChat={onOrderViaChat}
        onMakeOffer={onMakeOffer}
      />
    )}
    <BuyerProfileSheet
      open={buyerProfileOpen}
      onClose={() => setBuyerProfileOpen(false)}
    />

    {/* Floating footer nav — soft glass design (hidden on landing + categories) */}
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99998, display: (showLanding || showCategories) ? 'none' : 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 30, padding: '6px 8px',
    }}>
      {[
        { label: 'Home', active: showLanding, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, action: () => { setShowLanding(true); setShowCategories(false); onLandingChange?.(true) } },
        { label: 'Used', active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.22-8.56"/><path d="M21 3v6h-6"/></svg>, action: () => onOpenUsedGoods?.() },
        { label: 'Alerts', active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, action: () => onAlerts?.(), badge: true },
        { label: 'Profile', active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, action: () => setBuyerProfileOpen(true) },
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
    </>
  )
}
