import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import { DEMO_BUSINESS_SELLERS } from '@/demo/mockData'
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
export default function ShopSearchScreen({ onClose, userCity, userCountry }) {
  const [query,          setQuery]          = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sellers,        setSellers]        = useState(DEMO_SELLERS)
  const [loading,        setLoading]        = useState(false)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const inputRef = useRef(null)

  const activeCat = SEARCH_CATEGORIES.find(c => c.id === activeCategory) ?? SEARCH_CATEGORIES[0]

  const filtered = sellers
    .filter(s => matchesCategory(s, activeCat) && matchesQuery(s, query))
    .sort((a, b) => {
      const score = s => (s.city === userCity ? 0 : s.country === userCountry ? 1 : 2)
      return score(a) - score(b)
    })

  const search = useCallback(async (q, catId) => {
    setLoading(true)
    try {
      const cat = SEARCH_CATEGORIES.find(c => c.id === catId) ?? SEARCH_CATEGORIES[0]
      let dbQ = supabase
        .from('profiles')
        .select('id,displayName,brandName,lookingFor,city,country,photoURL,bio,tags,productCondition,isOnline,bizWhatsapp')
        .not('lookingFor', 'is', null)
        .ilike('country', 'indonesia')
        .limit(60)
      if (cat.lookingFor?.length) dbQ = dbQ.in('lookingFor', cat.lookingFor)
      if (q.trim()) dbQ = dbQ.or(`displayName.ilike.%${q}%,brandName.ilike.%${q}%,bio.ilike.%${q}%,city.ilike.%${q}%`)
      const { data } = await dbQ
      if (data && data.length > 0) setSellers(data)
      else setSellers(DEMO_SELLERS)
    } catch { setSellers(DEMO_SELLERS) }
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
      />
    )
  }

  return (
    <div className={styles.screen}>

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

      {/* ── Results info ── */}
      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          {loading ? 'Searching…' : `${filtered.length} seller${filtered.length !== 1 ? 's' : ''}`}
          {query ? ` · "${query}"` : ''}
        </span>
        {userCity && <span className={styles.localBadge}>📍 {userCity} first</span>}
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        {loading && Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImg} />
            <div className={styles.skeletonLine} style={{ width: '70%' }} />
            <div className={styles.skeletonLine} style={{ width: '45%' }} />
          </div>
        ))}

        {!loading && filtered.map(seller => (
          <SellerCard key={seller.id} seller={seller} onClick={setSelectedSeller} />
        ))}

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <span>🔍</span>
            <div>No sellers found</div>
            <div className={styles.emptySub}>Try a different search or category</div>
          </div>
        )}
      </div>
    </div>
  )
}
