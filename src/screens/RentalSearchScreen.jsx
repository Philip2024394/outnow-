/**
 * RentalSearchScreen — browse rental listings by category.
 * Search bar + category chips + 2-col grid.
 * Tap card → full detail view with WhatsApp CTA.
 * Theme: gold #8DC63F
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import IndooFooter from '@/components/ui/IndooFooter'
import PropertyMapSearch from '@/components/property/PropertyMapSearch'
import SavedSearchAlerts from '@/components/property/SavedSearchAlerts'
import {
  RENTAL_CATEGORIES, fetchListings, fetchListingsByCategory,
  fetchSearchListings, fmtIDR,
  getListings, getListingsByCategory, searchListings,
} from '@/services/rentalService'
import RentalDashboard from '@/components/rentals/RentalDashboard'
import RentalSignUpScreen from './RentalSignUpScreen'
import RentalCategoryRouter from '@/domains/rentals/RentalCategoryRouter'
import RentalRenterSignUpScreen from './RentalRenterSignUpScreen'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import PriceCalculator from '@/components/rentals/PriceCalculator'
import PropertyCard from '@/components/rentals/PropertyCard'
import { getPropertiesByCategory, DEMO_PROPERTIES } from '@/services/propertyListingService'
import { RentalChat, RentalBookingFlow } from '@/domains/rentals/components/RentalBooking'
import { ReviewsPopup, getAvgRating } from '@/components/reviews/ReviewSystem'
import MyBookingsScreen from './MyBookingsScreen'
import SavedItemsScreen, { isItemSaved, saveItem } from './SavedItemsScreen'
import MyListingsScreen from './MyListingsScreen'
import IndooWallet from '@/components/wallet/IndooWallet'
import RentalCalendar from '@/components/calendar/RentalCalendar'
import SettingsScreen from './SettingsScreen'
import MessagesScreen from './MessagesScreen'
import ProfileScreen2 from './ProfileScreen2'
import RentalDetail, { PageBadge } from './rental/RentalDetail'
import SubCategoryLanding from './rental/SubCategoryLanding'
import VehicleDirectory, { BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG } from './rental/VehicleDirectory'
import { seedMockData } from '@/utils/mockData'
import styles from './RentalSearchScreen.module.css'

const LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2011_05_34%20PM.png?updatedAt=1776614750168'


const VEHICLES_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2007_48_01%20AM.png'
const PROPERTY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2005_01_47%20AM.png'
const FASHION_BG  = 'https://ik.imagekit.io/nepgaxllc/Untitledsfsdfsfsdasdasdddddd.png'
const EQUIPMENT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_40_04%20AM.png?updatedAt=1777408820302'

// Preload all background images on mount
const SCROLL_CARDS_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2010_41_24%20AM.png?updatedAt=1777520502182'
const ALL_BGS = [LANDING_BG, VEHICLES_BG, PROPERTY_BG, FASHION_BG, EQUIPMENT_BG, BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG, SCROLL_CARDS_BG]
function usePreloadImages() {
  useEffect(() => {
    ALL_BGS.forEach(src => { const img = new Image(); img.src = src })
  }, [])
}

const fmtKGlobal = n => n >= 1000000000 ? (n/1000000000).toFixed(1).replace('.0','')+'M' : n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','')+'jt' : n >= 1000 ? Math.round(n/1000)+'k' : n
const getPrice = l => { const p = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day; return p ? fmtKGlobal(Number(String(p).replace(/\./g,''))) : '—' }

/* Auto-scrolling circular story carousel */
function NewListingsCarousel({ listings, onSelect }) {
  const scrollRef = useRef(null)
  const pauseRef = useRef(false)
  const items = listings.filter(l => ['House','Villa','Kos','Factory','Property'].includes(l.category)).slice(0, 12)
  if (items.length < 2) return null

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const speed = 0.2
    let raf
    const tick = () => {
      if (!pauseRef.current) {
        el.scrollLeft += speed
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) el.scrollLeft = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleTap = (nl) => {
    pauseRef.current = true
    setTimeout(() => { pauseRef.current = false }, 3000)
    onSelect(nl)
  }

  const handleDoubleTap = (e) => {
    e.stopPropagation()
    pauseRef.current = false
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>New Listings</div>
      <div ref={scrollRef}
        onTouchStart={() => { pauseRef.current = true }}
        onTouchEnd={() => { setTimeout(() => { pauseRef.current = false }, 3000) }}
        style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, paddingRight: 60, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map(nl => (
          <div key={nl.id} onClick={() => handleTap(nl)} onDoubleClick={handleDoubleTap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 2.5, background: 'conic-gradient(#8DC63F 0deg, #6BA33A 120deg, #8DC63F 240deg, #6BA33A 360deg)', boxShadow: '0 0 14px rgba(141,198,63,0.3)', animation: 'storyRing 8s linear infinite' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #0a0a0a' }}>
                <img src={nl.images?.[0] || nl.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', maxWidth: 72 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nl.sub_category || nl.extra_fields?.property_type || 'Property'}</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#FACC15' }}>{getPrice(nl)}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes storyRing { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* Auto-scrolling featured card carousel */
function FeaturedCarousel({ listings, onSelect }) {
  const scrollRef = useRef(null)
  const pauseRef = useRef(false)
  const items = listings.filter(l => ['House','Villa','Kos','Factory','Property'].includes(l.category) && l.rating >= 4.5).slice(0, 8)
  if (items.length < 2) return null

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const speed = 0.3
    let raf
    const tick = () => {
      if (!pauseRef.current) {
        el.scrollLeft += speed
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) el.scrollLeft = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleTap = (fl) => {
    pauseRef.current = true
    setTimeout(() => { pauseRef.current = false }, 3000)
    onSelect(fl)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Featured</div>
      <div ref={scrollRef}
        onTouchStart={() => { pauseRef.current = true }}
        onTouchEnd={() => { setTimeout(() => { pauseRef.current = false }, 3000) }}
        onDoubleClick={() => { pauseRef.current = false }}
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map(fl => (
          <div key={fl.id} onClick={() => handleTap(fl)} style={{ width: 230, flexShrink: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: 'rgba(15,15,15,0.95)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative', height: 140 }}>
              <img src={fl.images?.[0] || fl.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.85))', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 8, left: 0, padding: '3px 10px 3px 8px', borderRadius: '0 8px 8px 0', background: fl.buy_now ? 'rgba(250,204,21,0.15)' : 'rgba(141,198,63,0.15)', backdropFilter: 'blur(6px)', borderRight: `1.5px solid ${fl.buy_now ? '#FACC15' : '#8DC63F'}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{fl.sub_category || fl.extra_fields?.property_type}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: fl.buy_now ? '#FACC15' : '#8DC63F', marginLeft: 6 }}>{fl.buy_now ? 'SALE' : 'RENT'}</span>
              </div>
              {fl.rating && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, fontWeight: 800, color: '#FFD700', padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.5)' }}>★ {fl.rating}</span>}
              <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>Rp {getPrice(fl)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fl.title}</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11 }}>📍</span>
                {fl.city || 'Indonesia'}
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: 12, fontWeight: 800, color: '#fff' }}>
                {fl.extra_fields?.bedrooms && <span>{fl.extra_fields.bedrooms} 🛏️</span>}
                {fl.extra_fields?.bathrooms && <span>{fl.extra_fields.bathrooms} 🚿</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function RentalSearchScreen({ onClose, initialView, initialListingMode, initialListingOpen }) {
  usePreloadImages()
  const [view, setView] = useState(initialView || 'browse')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState(null)
  const [vehicleType, setVehicleType] = useState(null) // Motorcycles | Cars | Trucks
  const [selectedModel, setSelectedModel] = useState(null)
  const [selected, setSelected] = useState(null)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [rentalSignUpOpen, setRentalSignUpOpen] = useState(false)
  const [rentalCategoryOpen, setRentalListingOpen] = useState(initialListingOpen || false)
  const [renterSignUpOpen, setRenterSignUpOpen] = useState(false)
  const [calcVehicle, setCalcVehicle] = useState(null)
  const [chatListing, setChatListing] = useState(null)
  const [bookingListing, setBookingListing] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [priceSort, setPriceSort] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterHeroFlipped, setFilterHeroFlipped] = useState(false)
  const [filterPreviewIdx, setFilterPreviewIdx] = useState(0)
  const [cardImgIdx, setCardImgIdx] = useState({})
  const [flippedCards, setFlippedCards] = useState({})
  const [listingMode, setListingMode] = useState(initialListingMode || 'all') // 'all' | 'rent' | 'sale'
  const [scrolledPastCards, setScrolledPastCards] = useState(false)
  const gridRef = useRef(null)
  const bodyScrollRef = useRef(null)
  const [reviewListing, setReviewListing] = useState(null)
  const [showUserDrawer, setShowUserDrawer] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'book'|'chat', listing }
  const [showMyBookings, setShowMyBookings] = useState(false)
  const [showSavedItems, setShowSavedItems] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMapSearch, setShowMapSearch] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [savedToggle, setSavedToggle] = useState(0) // force re-render on save

  // Seed mock/demo data on first mount (version-gated inside seedMockData)
  useEffect(() => { seedMockData() }, [])

  // ─── Scroll-based background swap: detect when first card enters header ───
  const scrollCheckRef = useRef(null)
  useEffect(() => {
    // Re-attach on every render since the body element may mount/unmount
    const attach = () => {
      const el = bodyScrollRef.current
      if (!el || scrollCheckRef.current === el) return
      scrollCheckRef.current = el
      el.addEventListener('scroll', () => {
        const grid = gridRef.current
        if (!grid) return
        const gridTop = grid.getBoundingClientRect().top
        setScrolledPastCards(gridTop < 100)
      }, { passive: true })
    }
    attach()
    // Retry after a short delay in case refs aren't ready yet
    const t = setTimeout(attach, 500)
    return () => clearTimeout(t)
  })

  // ─── Supabase async listing fetch ───
  const [supaListings, setSupaListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)

  const loadListings = useCallback(async () => {
    setListingsLoading(true)
    try {
      let data
      if (search.trim()) {
        data = await fetchSearchListings(search)
      } else if (category !== 'all') {
        data = await fetchListingsByCategory(category)
      } else {
        data = await fetchListings()
      }
      setSupaListings(data || [])
    } catch (err) {
      console.warn('[RentalSearchScreen] fetch error, using sync fallback:', err)
      // Fallback to synchronous demo data
      const fallback = search.trim()
        ? searchListings(search)
        : category !== 'all' ? getListingsByCategory(category) : getListings()
      setSupaListings(fallback)
    }
    setListingsLoading(false)
  }, [search, category])

  useEffect(() => { loadListings() }, [loadListings])

  // Check if user has account before allowing book/chat
  const hasAccount = () => {
    try { return !!localStorage.getItem('indoo_profile') || !!localStorage.getItem('indoo_rental_owner') || !!localStorage.getItem('indoo_demo_profile') } catch { return false }
  }
  const requireAccount = (type, listing) => {
    if (type === 'chat') { setChatListing(listing); return }
    if (hasAccount()) {
      if (type === 'book') setBookingListing(listing)
    } else {
      setPendingAction({ type, listing })
      setRentalSignUpOpen(true)
    }
  }

  // Merge demo listings with owner-published live listings (all categories)
  const ALL_LISTING_KEYS = ['indoo_my_listings', 'indoo_my_car_listings', 'indoo_my_truck_listings', 'indoo_my_bus_listings', 'indoo_event_listings', 'indoo_my_property_listings', 'indoo_my_bicycle_listings']
  const ownerListings = (() => {
    try {
      const allRaw = []
      const seenRefs = new Set()
      for (const key of ALL_LISTING_KEYS) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]')
          for (const item of items) {
            const uid = item.ref || item.id
            if (!seenRefs.has(uid)) { seenRefs.add(uid); allRaw.push(item) }
          }
        } catch {}
      }
      return allRaw
        .filter(l => l.status === 'live')
        .map(l => ({
          id: l.ref || l.id,
          title: l.title,
          description: l.description || '',
          category: l.category || 'Motorcycles',
          sub_category: l.extra_fields?.transmission || l.category || 'Matic',
          city: l.city || '',
          price_day: Number(String(l.price_day).replace(/\./g, '')) || 0,
          price_week: Number(String(l.price_week).replace(/\./g, '')) || 0,
          price_month: Number(String(l.price_month).replace(/\./g, '')) || 0,
          price_3month: Number(String(l.price_3month || 0).replace(/\./g, '')) || 0,
          price_6month: Number(String(l.price_6month || 0).replace(/\./g, '')) || 0,
          price_year: Number(String(l.price_year || 0).replace(/\./g, '')) || 0,
          price_2year: Number(String(l.price_2year || 0).replace(/\./g, '')) || 0,
          price_5year: Number(String(l.price_5year || 0).replace(/\./g, '')) || 0,
          condition: l.condition?.toLowerCase().replace(' ', '_') || 'good',
          status: 'active',
          owner_type: 'owner',
          images: l.images || (l.image ? [l.image] : []),
          features: l.features?.length ? l.features : [l.extra_fields?.cc && `${l.extra_fields.cc}cc`, l.extra_fields?.transmission, l.extra_fields?.fuelType].filter(Boolean),
          rating: l.rating || (4 + Math.random()).toFixed(1),
          review_count: l.review_count || Math.floor(Math.random() * 20),
          view_count: Math.floor(Math.random() * 200) + 10,
          ref: l.ref || l.id,
          extra_fields: l.extra_fields,
          buy_now: l.buy_now || null,
          isOwnerListing: true,
        }))
    } catch { return [] }
  })()

  // Merge Supabase listings with local owner listings (deduplicate by id)
  const ownerIds = new Set(ownerListings.map(l => l.id))
  let listings = [...ownerListings, ...supaListings.filter(l => !ownerIds.has(l.id))]

  if (activeFilter && !search.trim()) {
    listings = listings.filter(l => activeFilter.includes(l.category) || activeFilter.includes(l.sub_category))
  } else if (category !== 'all' && !search.trim()) {
    listings = listings.filter(l => l.category === category)
  }

  if (search.trim() && category !== 'all') {
    listings = listings.filter(l => l.category === category)
  }

  // Also filter owner listings by search
  if (search.trim()) {
    const q = search.toLowerCase()
    listings = listings.filter(l =>
      l.title?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q)
    )
  }

  // Modal screens — always rendered regardless of view
  const modals = <>
    <RentalSignUpScreen
      open={rentalSignUpOpen}
      onClose={() => {
        setRentalSignUpOpen(false)
        // Resume pending action after sign up
        if (pendingAction) {
          const { type, listing } = pendingAction
          setPendingAction(null)
          if (type === 'book') setBookingListing(listing)
          else if (type === 'chat') setChatListing(listing)
        }
      }}
      onListRental={() => { setRentalSignUpOpen(false); setRentalListingOpen(true) }}
      onSellItem={() => { setRentalSignUpOpen(false); setRentalListingOpen(true) }}
      onBuyItem={() => { setRentalSignUpOpen(false); markSectionVisited('rentals'); setListingMode('sale'); setView('browse') }}
      onRentItems={() => {
        setRentalSignUpOpen(false)
        markSectionVisited('rentals'); setListingMode('rent'); setView('browse')
      }}
    />
    <RentalRenterSignUpScreen
      open={renterSignUpOpen}
      onClose={() => setRenterSignUpOpen(false)}
      onComplete={() => { setRenterSignUpOpen(false); markSectionVisited('rentals'); setView('browse') }}
    />
    {rentalCategoryOpen && <RentalCategoryRouter
      open={rentalCategoryOpen}
      onClose={(action) => {
        setRentalListingOpen(false)
        if (action === 'viewMarketplace') {
          setActiveFilter(['Motorcycles'])
          setView('browse')
        }
      }}
      onSubmit={async (listing) => { console.log('[rental] New listing:', listing) }}
    />}
  </>



  if (view === 'vehicles') {
    return (<>
      <SubCategoryLanding
        bg={VEHICLES_BG}
        title={listingMode === 'sale' ? 'Vehicles to Buy' : listingMode === 'rent' ? 'Vehicles to Rent' : 'Vehicles'}
        tagline="Find your perfect ride"
        heroSub={listingMode === 'sale' ? 'Find vehicles for sale across Indonesia' : listingMode === 'rent' ? 'Find vehicles to rent across Indonesia' : 'Buy or rent vehicles across Indonesia'}
        buttons={[
          { img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', label: 'Bike Market', sub: 'Matic, Sport, Trail & Classic', count: '1,200+', rating: 4.8, filter: 'Motorcycles' },
          { img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', label: 'Car Market', sub: 'MPV, SUV, Sedan & City Cars', count: '860+', rating: 4.7, filter: 'Cars' },
          { img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png', label: 'Truck Market', sub: 'Pickup, Box & Flatbed', count: '240+', rating: 4.6, filter: 'Trucks' },
          { img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssssddd-removebg-preview.png', label: 'Bus Market', sub: 'Minibus, HiAce & Tour Bus', count: '95+', rating: 4.5, filter: 'Buses' },
        ]}
        onSelect={(type) => { setVehicleType(type); setView('vehicleDir') }}
        onBack={() => setView('browse')}
      />
    </>)
  }

  if (view === 'vehicleDir' && vehicleType) {
    return (<>
      <VehicleDirectory
        vehicleType={vehicleType}
        listingMode={listingMode}
        onSelectModel={(model) => { setSelectedModel(model); setActiveFilter([vehicleType]); setCategory(vehicleType); setSearch(model.name.split(' ')[0]); setView('browse') }}
        onBack={() => setView('vehicles')}
      />
    </>)
  }

  if (view === 'property') {
    return (<>
      <SubCategoryLanding
        bg={PROPERTY_BG}
        bgPosition="center top"
        noScroll
        title={listingMode === 'sale' ? 'Property to Buy' : listingMode === 'rent' ? 'Property to Rent' : 'Property'}
        tagline="Stay anywhere you want"
        heroSub={listingMode === 'sale' ? 'Find property for sale across Indonesia' : listingMode === 'rent' ? 'Find property to rent across Indonesia' : 'Buy or rent houses, villas, kos & factory spaces'}
        buttons={[
          { label: 'House', filter: 'House', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddg.png', heroIcon: 'house' },
          { label: 'Factory', filter: 'Factory', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdd.png', heroIcon: 'factory' },
          { label: 'Kos', filter: 'Kos', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdddd.png', heroIcon: 'kos' },
          { label: 'Villa', filter: 'Villa', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdddddd.png', heroIcon: 'villa' },
        ]}
        onSelect={(type) => { setActiveFilter([type, 'Property']); setCategory('Property'); setView('browse') }}
        onBack={() => { setActiveFilter(null); setCategory('all'); setView('browse') }}
      />
    </>)
  }

  if (view === 'equipment') {
    return (<>
      <SubCategoryLanding
        bg={EQUIPMENT_BG}
        title={listingMode === 'sale' ? 'Equipment to Buy' : listingMode === 'rent' ? 'Equipment to Rent' : 'Equipment'}
        tagline="Gear up for any occasion"
        heroSub={listingMode === 'sale' ? 'Find equipment for sale' : listingMode === 'rent' ? 'Find equipment to rent' : 'Buy or rent cameras, sound systems & event gear'}
        buttons={[
          { icon: '🎪', label: 'Event Gear', filter: 'Event' },
          { icon: '📸', label: 'Photo & Video', filter: 'Camera' },
          { icon: '💻', label: 'Laptops & Phones', filter: 'Laptop' },
        ]}
        onSelect={(type) => { setActiveFilter([type, 'Electronics', 'Audio & Sound', 'Party & Event']); setView('browse') }}
        onBack={() => setView('browse')}
      />
    </>)
  }

  if (view === 'fashion') {
    return (<>
      <SubCategoryLanding
        bg={FASHION_BG}
        bgPosition="center top"
        title={listingMode === 'sale' ? 'Fashion to Buy' : listingMode === 'rent' ? 'Fashion to Rent' : 'Fashion'}
        tagline="Dress for every occasion"
        heroSub={listingMode === 'sale' ? 'Find fashion for sale' : listingMode === 'rent' ? 'Find fashion to rent' : 'Buy or rent kebaya, suits, gowns & traditional wear'}
        buttons={[
          { label: 'Wedding Clothes', filter: 'Wedding', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2006_13_12%20AM.png', heroIcon: 'wedding' },
          { label: 'Fashion Clothes', filter: 'Fashion', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2006_15_05%20AM.png', heroIcon: 'fashion' },
        ]}
        onSelect={(type) => { setActiveFilter([type, 'Fashion']); setView('browse') }}
        onBack={() => setView('browse')}
      />
    </>)
  }

  let sortedListings = [...listings]
  // Apply advanced filters
  if (filterCity) sortedListings = sortedListings.filter(l => l.city?.toLowerCase().includes(filterCity.toLowerCase()))
  if (filterCondition) sortedListings = sortedListings.filter(l => (l.condition || '').toLowerCase().includes(filterCondition.toLowerCase()))
  if (filterPriceMin) sortedListings = sortedListings.filter(l => (l.price_day || l.buy_now || 0) >= Number(filterPriceMin))
  if (filterPriceMax) sortedListings = sortedListings.filter(l => (l.price_day || l.buy_now || 0) <= Number(filterPriceMax))
  if (priceSort === 'low') sortedListings.sort((a, b) => (a.price_day || 0) - (b.price_day || 0))
  if (priceSort === 'high') sortedListings.sort((a, b) => (b.price_day || 0) - (a.price_day || 0))

  return (
    <div className={styles.page} style={(() => {
      const cat = vehicleType || category
      const filter = activeFilter?.[0]
      const BG = {
        Motorcycles: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502',
        Cars: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_31_56%20AM.png?updatedAt=1777408335834',
        'Audio & Sound': 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_36_37%20AM.png?updatedAt=1777408614828',
        'Party & Event': 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_40_04%20AM.png?updatedAt=1777408820302',
        Event: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_40_04%20AM.png?updatedAt=1777408820302',
        Fashion: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_42_33%20AM.png?updatedAt=1777408975197',
        Wedding: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_42_33%20AM.png?updatedAt=1777408975197',
        Property: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png',
      }
      const url = BG[cat] || BG[filter] || null
      return url ? { backgroundImage: `url('${url}')` } : undefined
    })()}>
      {/* Scroll background overlay — fades in when cards reach header */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url('${SCROLL_CARDS_BG}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: scrolledPastCards ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }} />
      {/* Header — market title + search bar + filter */}
      <div style={{ padding: '14px 14px 0', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Listing count badge */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(141,198,63,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>#{sortedListings.length}</span>
          </div>
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { if (vehicleType) { setView('vehicleDir'); return } setView('browse') }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'block', whiteSpace: 'nowrap' }}>
              {vehicleType === 'Motorcycles' ? 'Bike ' : vehicleType === 'Cars' ? 'Car ' : vehicleType === 'Trucks' ? 'Truck ' : vehicleType === 'Buses' ? 'Bus ' : activeFilter?.includes('House') || activeFilter?.includes('Villa') || activeFilter?.includes('Kos') || activeFilter?.includes('Factory') || category === 'Property' ? 'Property ' : ''}<span style={{ color: '#8DC63F' }}>Market</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', marginTop: 2, display: 'block' }}>{listingMode === 'sale' ? 'For Sale' : listingMode === 'rent' ? 'For Rent' : 'Buy · Sell · Rentals'} in Yogyakarta</span>
          </div>
          <button onClick={() => setShowMapSearch(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>📍</span>
          </button>
          <button onClick={() => setShowAlerts(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>🔔</span>
          </button>
          <button onClick={() => setShowFilter(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M3 4h18v2H3zm3 5h12v2H6zm3 5h6v2H9z"/></svg>
          </button>
        </div>

        {/* Filter overlay — full screen with flip hero + filter fields */}
        {showFilter && (() => {
          const modeFilteredListings = sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true)
          const previewListing = modeFilteredListings[filterPreviewIdx % Math.max(modeFilteredListings.length, 1)] || modeFilteredListings[0]
          const previewImgs = previewListing?.images?.length ? previewListing.images : [previewListing?.image || '']
          const hasActiveFilters = filterCity || filterCondition || filterPriceMin || filterPriceMax || priceSort || category !== 'all'
          const activeCount = [filterCity, filterCondition, filterPriceMin, filterPriceMax, priceSort, category !== 'all' ? category : ''].filter(Boolean).length
          const fmtK = n => n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','') + 'jt' : n >= 1000 ? Math.round(n/1000) + 'k' : n

          return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'linear-gradient(180deg, #0a0a0c 0%, #0d0d0f 40%, #0a0a0c 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            <style>{`@keyframes filterFlip { from { transform: rotateY(0) } to { transform: rotateY(180deg) } } @keyframes filterSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Filter & Search</span>
                {activeCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, background: '#8DC63F', fontSize: 12, fontWeight: 900, color: '#000' }}>{activeCount}</span>}
              </div>
              <button onClick={() => setShowFilter(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>

              {/* Rent / Buy toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setListingMode('rent')} style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: listingMode === 'rent' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)', border: listingMode === 'rent' ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.06)', color: listingMode === 'rent' ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Rentals
                </button>
                <button onClick={() => setListingMode('sale')} style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: listingMode === 'sale' ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: listingMode === 'sale' ? '1.5px solid rgba(255,215,0,0.4)' : '1.5px solid rgba(255,255,255,0.06)', color: listingMode === 'sale' ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  For Sale
                </button>
                <button onClick={() => setListingMode('all')} style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: listingMode === 'all' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: listingMode === 'all' ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.06)', color: listingMode === 'all' ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  All
                </button>
              </div>

              {/* ═══ HERO FLIP CARD — preview listing ═══ */}
              {previewListing && (
                <div style={{ perspective: 1000, marginBottom: 16, animation: 'filterSlideUp 0.3s ease' }}>
                  <div style={{
                    position: 'relative', width: '100%', minHeight: 200,
                    transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                    transformStyle: 'preserve-3d',
                    transform: filterHeroFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                  }}>
                    {/* ── FRONT: Image ── */}
                    <div style={{
                      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                      width: '100%', borderRadius: 20, overflow: 'hidden',
                      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
                      border: '1.5px solid rgba(141,198,63,0.12)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)',
                      position: filterHeroFlipped ? 'absolute' : 'relative', inset: 0,
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', zIndex: 2 }} />
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                        <img src={previewImgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', pointerEvents: 'none' }} />

                        {/* Badges */}
                        {!previewListing.buy_now && <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: '#8DC63F', borderRadius: 8, fontSize: 12, fontWeight: 900, color: '#000', zIndex: 3 }}>FOR RENT</div>}
                        {previewListing.buy_now && <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: '#FFD700', borderRadius: 8, fontSize: 12, fontWeight: 900, color: '#000', zIndex: 3 }}>FOR SALE</div>}

                        {/* Title overlay */}
                        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 60, zIndex: 3 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{previewListing.title}</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2 }}>{previewListing.city}</div>
                        </div>

                        {/* Price badge */}
                        <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 10, border: '1px solid rgba(141,198,63,0.2)', zIndex: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>Rp {fmtK(previewListing.price_day || previewListing.buy_now || 0)}</span>
                          {previewListing.price_day && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/day</span>}
                        </div>
                      </div>
                    </div>

                    {/* ── BACK: Details/Specs ── */}
                    <div style={{
                      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      width: '100%', borderRadius: 20, overflow: 'hidden',
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
                      border: '1.5px solid rgba(141,198,63,0.12)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)',
                      position: 'absolute', inset: 0, padding: '16px',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)' }} />

                      <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{previewListing.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{previewListing.city} · {previewListing.category}</div>

                      {/* Prices grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        {[
                          { label: 'Day', val: previewListing.price_day },
                          { label: 'Week', val: previewListing.price_week },
                          { label: 'Month', val: previewListing.price_month },
                        ].map(p => (
                          <div key={p.label} style={{ padding: '8px 6px', background: 'rgba(141,198,63,0.06)', borderRadius: 10, border: '1px solid rgba(141,198,63,0.1)', textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: p.val ? '#8DC63F' : 'rgba(255,255,255,0.15)' }}>{p.val ? `Rp ${fmtK(p.val)}` : '—'}</div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, marginTop: 2 }}>{p.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Specs from extra_fields */}
                      {previewListing.extra_fields && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {Object.entries(previewListing.extra_fields).filter(([,v]) => v && v !== false).slice(0, 6).map(([k,v]) => (
                            <span key={k} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                              {typeof v === 'boolean' ? k.replace(/_/g, ' ') : `${k.replace(/_/g, ' ')}: ${v}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Features */}
                      {previewListing.features?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {previewListing.features.slice(0, 5).map((f, i) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flip + nav buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                    <button onClick={() => setFilterPreviewIdx(p => Math.max(0, p - 1))} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={() => setFilterHeroFlipped(p => !p)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '2px solid rgba(141,198,63,0.2)', color: '#8DC63F', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7 7"/><path d="M3 3l7 7"/><path d="M16 21h5v-5"/><path d="M8 21H3v-5"/><path d="M21 21l-7-7"/><path d="M3 21l7-7"/></svg>
                    </button>
                    <button onClick={() => setFilterPreviewIdx(p => p + 1)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>Flip to view details · Swipe to browse</span>
                  </div>
                </div>
              )}

              {/* ═══ FILTER FIELDS ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'filterSlideUp 0.4s ease 0.1s both' }}>

                {/* Sort */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Sort By</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: '', label: 'Default' },
                      { id: 'low', label: 'Price Low' },
                      { id: 'high', label: 'Price High' },
                    ].map(f => (
                      <button key={f.id} onClick={() => setPriceSort(f.id)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: priceSort === f.id ? '#8DC63F' : 'rgba(255,255,255,0.04)',
                        color: priceSort === f.id ? '#000' : 'rgba(255,255,255,0.4)',
                        fontSize: 13, fontWeight: 800,
                        boxShadow: priceSort === f.id ? '0 2px 10px rgba(141,198,63,0.3)' : 'none',
                      }}>{f.label}</button>
                    ))}
                  </div>
                </div>

                {/* Category — hidden when viewing specific vehicle type */}
                {!vehicleType && (
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Category</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {RENTAL_CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => { setCategory(category === c.id ? 'all' : c.id); setSearch('') }} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: category === c.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                        border: category === c.id ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: category === c.id ? '#8DC63F' : 'rgba(255,255,255,0.35)',
                        fontSize: 13, fontWeight: 700,
                      }}>{c.emoji} {c.label}</button>
                    ))}
                  </div>
                </div>
                )}

                {/* Price Range */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Price Range (per day)</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: 4 }}>MIN</div>
                      <input type="number" placeholder="50.000" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16, fontWeight: 700, marginTop: 16 }}>—</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: 4 }}>MAX</div>
                      <input type="number" placeholder="500.000" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Condition</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: '', label: 'All' },
                      { id: 'new', label: 'New' },
                      { id: 'like_new', label: 'Like New' },
                      { id: 'good', label: 'Good' },
                      { id: 'fair', label: 'Fair' },
                    ].map(c => (
                      <button key={c.id} onClick={() => setFilterCondition(filterCondition === c.id ? '' : c.id)} style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: filterCondition === c.id ? '#8DC63F' : 'rgba(255,255,255,0.04)',
                        color: filterCondition === c.id ? '#000' : 'rgba(255,255,255,0.4)',
                        fontSize: 12, fontWeight: 800,
                        boxShadow: filterCondition === c.id ? '0 2px 10px rgba(141,198,63,0.3)' : 'none',
                      }}>{c.label}</button>
                    ))}
                  </div>
                </div>

                {/* City */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Location</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['', 'Canggu', 'Seminyak', 'Kuta', 'Ubud', 'Denpasar', 'Uluwatu', 'Kerobokan'].map(c => (
                      <button key={c} onClick={() => setFilterCity(filterCity === c ? '' : c)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: filterCity === c ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                        border: filterCity === c ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: filterCity === c ? '#8DC63F' : 'rgba(255,255,255,0.35)',
                        fontSize: 13, fontWeight: 700,
                      }}>{c || 'All'}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
              {hasActiveFilters && (
                <button onClick={() => { setPriceSort(''); setCategory('all'); setFilterCity(''); setFilterCondition(''); setFilterPriceMin(''); setFilterPriceMax('') }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear All
                </button>
              )}
              <button onClick={() => { setShowFilter(false); setFilterHeroFlipped(false) }} style={{ flex: 2, padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Show {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).length} Results
              </button>
            </div>
          </div>
          )
        })()}

      </div>


      {/* User Account Side Drawer */}
      {showUserDrawer && (
        <>
          <div onClick={() => setShowUserDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9998 }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '70%',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1.5px solid rgba(141,198,63,0.15)',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.06)',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s ease',
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, transparent, #8DC63F 30%, #8DC63F 70%, transparent)', pointerEvents: 'none', boxShadow: '0 0 12px rgba(141,198,63,0.4)' }} />

            {/* Header */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Account</span>
              </div>
              <button onClick={() => setShowUserDrawer(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* DEV: Role toggle — remove for production */}
            {(() => {
              const isOwner = !!localStorage.getItem('indoo_rental_owner')
              const allItems = [
                // Both
                { icon: '👤', label: 'My Profile', sub: 'View and edit your details', role: 'both', action: () => { setShowUserDrawer(false); setShowProfile(true) } },
                { icon: '💬', label: 'Messages', sub: 'Chat with owners & renters', role: 'both', action: () => { setShowUserDrawer(false); setShowMessages(true) } },
                { icon: '⚙️', label: 'Settings', sub: 'Preferences and notifications', role: 'both', action: () => { setShowUserDrawer(false); setShowSettings(true) } },
                // Buyer only
                { icon: '📦', label: 'My Bookings', sub: 'View your rental bookings', role: 'buyer', action: () => { setShowUserDrawer(false); setShowMyBookings(true) } },
                { icon: '⭐', label: 'My Reviews', sub: 'Reviews you have written', role: 'buyer', action: () => { setShowUserDrawer(false); setReviewListing({ ref: 'my_reviews', title: 'My Reviews' }) } },
                { icon: '❤️', label: 'Saved Items', sub: 'Your favourite listings', role: 'buyer', action: () => { setShowUserDrawer(false); setShowSavedItems(true) } },
                // Seller only
                { icon: '📋', label: 'My Listings', sub: 'Manage your rental & sale listings', role: 'seller', action: () => { setShowUserDrawer(false); setShowMyListings(true) } },
                { icon: '💰', label: 'Wallet', sub: 'Balance, commission & transactions', role: 'seller', action: () => { setShowUserDrawer(false); setShowWallet(true) } },
                { icon: '📅', label: 'Calendar', sub: 'Manage booking availability', role: 'seller', action: () => { setShowUserDrawer(false); setShowCalendar(true) } },
                { icon: '📊', label: 'Analytics', sub: 'Views, bookings & revenue', role: 'seller', action: () => setShowUserDrawer(false) },
                { icon: '📋', label: 'List a Rental', sub: 'Start earning with your vehicle', role: 'seller', action: () => { setShowUserDrawer(false); setRentalListingOpen(true) } },
                { icon: '💰', label: 'Sell an Item', sub: 'Put your vehicle up for sale', role: 'seller', action: () => { setShowUserDrawer(false); setRentalListingOpen(true) } },
              ]
              // DEV: show all. Production: filter by isOwner
              const visibleItems = allItems // Production: allItems.filter(i => i.role === 'both' || (isOwner ? i.role === 'seller' : i.role === 'buyer'))
              return null // rendered below
            })()}

            {/* Menu items — smart based on role */}
            <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Role badge — DEV toggle */}
              {(() => {
                const isOwner = !!localStorage.getItem('indoo_rental_owner')
                return (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>
                      {isOwner ? '👤 Owner Account' : '👤 Buyer Account'}
                    </div>
                    {isOwner && <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', fontSize: 12, fontWeight: 700, color: '#FFD700' }}>+ Buyer</div>}
                  </div>
                )
              })()}
              {(() => {
                const isOwner = !!localStorage.getItem('indoo_rental_owner')
                return [
                  // Both — always show
                  { icon: '👤', label: 'My Profile', sub: 'View and edit your details', show: true, action: () => { setShowUserDrawer(false); setShowProfile(true) } },
                  { icon: '💬', label: 'Messages', sub: 'Chat with owners & renters', show: true, action: () => { setShowUserDrawer(false); setShowMessages(true) } },
                  // Buyer
                  { icon: '📦', label: 'My Bookings', sub: 'View your rental bookings', show: true, action: () => { setShowUserDrawer(false); setShowMyBookings(true) } },
                  { icon: '⭐', label: 'My Reviews', sub: 'Reviews you have written', show: true, action: () => { setShowUserDrawer(false); setReviewListing({ ref: 'my_reviews', title: 'My Reviews' }) } },
                  { icon: '❤️', label: 'Saved Items', sub: 'Your favourite listings', show: true, action: () => { setShowUserDrawer(false); setShowSavedItems(true) } },
                  // Seller — only if owner
                  { icon: '📋', label: 'My Listings', sub: 'Manage your rental & sale listings', show: isOwner, action: () => { setShowUserDrawer(false); setShowMyListings(true) } },
                  { icon: '💰', label: 'Wallet', sub: 'Balance, commission & transactions', show: isOwner, action: () => { setShowUserDrawer(false); setShowWallet(true) } },
                  { icon: '📅', label: 'Calendar', sub: 'Manage booking availability', show: isOwner, action: () => { setShowUserDrawer(false); setShowCalendar(true) } },
                  { icon: '📊', label: 'Analytics', sub: 'Views, bookings & revenue', show: isOwner, action: () => setShowUserDrawer(false) },
                  // Actions — seller
                  { icon: '🔑', label: 'List a Rental', sub: 'Start earning with your vehicle', show: isOwner, accent: '#8DC63F', action: () => { setShowUserDrawer(false); setRentalListingOpen(true) } },
                  { icon: '💰', label: 'Sell an Item', sub: 'Put your vehicle up for sale', show: isOwner, accent: '#FFD700', action: () => { setShowUserDrawer(false); setRentalListingOpen(true) } },
                  // Settings — always
                  { icon: '⚙️', label: 'Settings', sub: 'Preferences and notifications', show: true, action: () => { setShowUserDrawer(false); setShowSettings(true) } },
                ].filter(i => i.show)
              })().map((item, i) => (
                <button key={i} onClick={item.action} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 12px',
                  background: 'linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(15,15,18,0.95) 100%)',
                  border: item.accent ? `1px solid ${item.accent}30` : '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: item.accent ? `0 4px 12px rgba(0,0,0,0.4), 0 0 8px ${item.accent}15` : '0 4px 12px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset, 0 -2px 6px rgba(0,0,0,0.3) inset',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg, rgba(40,40,45,1) 0%, rgba(20,20,22,1) 100%)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.accent || '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', fontWeight: 600 }}>Indoo Done Deal v1.0</span>
            </div>
          </div>
        </>
      )}

      {/* 2-column product grid — matches marketplace layout */}
      <div ref={bodyScrollRef} className={styles.body} style={{ paddingRight: 0, paddingTop: 90, position: 'relative', zIndex: 1 }}>
        <style>{`
          @keyframes rentalCardIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}</style>
        {/* Mode label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: listingMode === 'sale' ? '#FFD700' : listingMode === 'rent' ? '#8DC63F' : '#fff' }}>
            {listingMode === 'sale' ? 'For Sale' : listingMode === 'rent' ? 'Rentals' : 'All Listings'}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).length} items
          </span>
        </div>
        {/* Quick category chips — hidden */}
        {false && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'Motorcycles', label: 'Bikes' },
              { id: 'Cars', label: 'Cars' },
              { id: 'Trucks', label: 'Trucks' },
              { id: 'Property', label: 'Property' },
              { id: 'Fashion', label: 'Fashion' },
              { id: 'Electronics', label: 'Electronics' },
              { id: 'Audio & Sound', label: 'Audio' },
              { id: 'Party & Event', label: 'Events' },
            ].map(c => (
              <button key={c.id} onClick={() => { setCategory(c.id === 'all' ? 'all' : c.id); setActiveFilter(c.id === 'all' ? null : [c.id]); setSearch('') }} style={{
                padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                background: (category === c.id || (c.id === 'all' && category === 'all' && !activeFilter)) ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                border: (category === c.id || (c.id === 'all' && category === 'all' && !activeFilter)) ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: (category === c.id || (c.id === 'all' && category === 'all' && !activeFilter)) ? '#8DC63F' : 'rgba(255,255,255,0.4)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>{c.label}</button>
            ))}
          </div>
        )}
        {/* Rent / Sale — toggle with green underline */}
        <div style={{ display: 'flex', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setListingMode(listingMode === 'rent' ? 'all' : 'rent')} style={{
            flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: listingMode === 'rent' ? '#8DC63F' : 'rgba(255,255,255,0.35)',
            fontSize: 14, fontWeight: 800,
            borderBottom: 'none',
            transition: 'all 0.2s', position: 'relative',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            For Rent
            {listingMode === 'rent' && <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, borderRadius: 1, background: '#8DC63F' }} />}
          </button>
          <button onClick={() => setListingMode(listingMode === 'sale' ? 'all' : 'sale')} style={{
            flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: listingMode === 'sale' ? '#8DC63F' : 'rgba(255,255,255,0.35)',
            fontSize: 14, fontWeight: 800,
            borderBottom: 'none', position: 'relative',
            transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            For Sale
            {listingMode === 'sale' && <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, borderRadius: 1, background: '#8DC63F' }} />}
          </button>
        </div>

        {/* New Listings — auto-scrolling circular carousel */}
        <NewListingsCarousel listings={sortedListings} onSelect={setSelected} />

        {/* Featured — auto-scrolling card carousel */}
        <FeaturedCarousel listings={sortedListings} onSelect={setSelected} />

        {sortedListings.length === 0 && <div className={styles.empty}>No rentals found</div>}
        <div ref={gridRef} className={styles.grid}>
          {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).map((l, idx) => {
            const imgs = l.images?.length ? l.images : [l.image || '']
            const fmtK = n => n >= 1000000000 ? (n/1000000000).toFixed(1).replace('.0','')+'M' : n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','') + 'jt' : n >= 1000 ? Math.round(n/1000) + 'k' : n
            const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
            const isPropertyCard = ['House', 'Villa', 'Kos', 'Factory', 'Property'].includes(l.category)
            return (
            <button key={`${l.id}-${idx}`} onClick={() => setSelected(l)} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
              overflow: 'hidden', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', position: 'relative', padding: 0, width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
              animation: 'rentalCardIn 0.4s ease both',
              transition: 'transform 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Full-width hero image */}
              <div
                onTouchStart={e => { e.currentTarget._touchX = e.touches[0].clientX }}
                onTouchEnd={e => { const diff = e.changedTouches[0].clientX - (e.currentTarget._touchX || 0); if (Math.abs(diff) > 40 && imgs.length > 1) { e.stopPropagation(); setCardImgIdx(p => ({ ...p, [l.id]: diff > 0 ? ((p[l.id] || 0) - 1 + imgs.length) % imgs.length : ((p[l.id] || 0) + 1) % imgs.length })) } }}
                style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <img src={imgs[cardImgIdx[l.id] || 0] || imgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)', pointerEvents: 'none' }} />

                {/* Top-left: Type + Sale/Rent badge */}
                <div style={{ position: 'absolute', top: 10, left: 0, zIndex: 3, padding: '5px 14px 5px 10px', borderRadius: '0 10px 10px 0', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRight: `2px solid ${l.buy_now ? '#FACC15' : '#8DC63F'}` }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{l.sub_category || l.extra_fields?.property_type || l.category}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: l.buy_now ? '#FACC15' : '#8DC63F', marginLeft: 8 }}>{l.buy_now ? 'SALE' : 'RENT'}</span>
                </div>

                {/* Top-right: Rating + photos */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, display: 'flex', gap: 6 }}>
                  {l.rating && <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700', padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>⭐ {l.rating}</span>}
                  {imgs.length > 1 && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>📷 {imgs.length}</span>}
                </div>

                {/* Bottom on image: Price + Owner + Location */}
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, zIndex: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#FACC15', letterSpacing: '-0.02em' }}>Rp {price ? fmtK(Number(String(price).replace(/\./g, ''))) : '—'}</span>
                      {!l.buy_now && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginLeft: 4 }}>/{l.price_month ? 'bln' : l.price_week ? 'mgg' : 'hr'}</span>}
                    </div>
                    {l.owner_type && <span style={{ fontSize: 13, fontWeight: 700, color: l.owner_type === 'owner' ? '#8DC63F' : '#60A5FA' }}>Listing · {l.owner_type === 'owner' ? 'Owner' : 'Agent'}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <span style={{ fontSize: 12 }}>📍</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{l.city || 'Indonesia'}</span>
                    {l.extra_fields?.land_area && <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>📐 {l.extra_fields.land_area}</span>}
                  </div>
                </div>
              </div>

              {/* Bottom strip — specs + rental periods */}
              <div style={{ background: 'rgba(10,10,10,0.98)', padding: '10px 12px', borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Title */}
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{l.title}</div>

                {/* Specs — colored emoji icons */}
                {isPropertyCard && l.extra_fields && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {l.extra_fields.bedrooms && <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 15 }}>🛏️</span>{l.extra_fields.bedrooms}</span>}
                    {l.extra_fields.bathrooms && <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 15 }}>🚿</span>{l.extra_fields.bathrooms}</span>}
                    {l.extra_fields.parking && <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ fontSize: 15 }}>🚗</span>{l.extra_fields.parking}</span>}
                    {l.extra_fields?.certificate && <span style={{ fontSize: 12, fontWeight: 700, color: l.extra_fields.certificate.includes('SHM') ? '#8DC63F' : '#FACC15' }}>📄 {l.extra_fields.certificate.split('·')[0].trim()}</span>}
                  </div>
                )}
              </div>

              {/* Rental periods strip */}
              {!l.buy_now && isPropertyCard && (() => {
                const sub = l.sub_category || l.extra_fields?.property_type || ''
                const rates = sub === 'Factory' ? [
                  l.price_6month && { l: '6 Month', p: l.price_6month },
                  l.price_year && { l: 'Year', p: l.price_year },
                  l.price_2year && { l: '2 Year', p: l.price_2year },
                  l.price_5year && { l: '5 Year', p: l.price_5year },
                ] : sub === 'Kos' ? [
                  l.price_month && { l: 'Month', p: l.price_month },
                  l.price_3month && { l: '3 Month', p: l.price_3month },
                  l.price_6month && { l: '6 Month', p: l.price_6month },
                  l.price_year && { l: 'Year', p: l.price_year },
                ] : sub === 'House' ? [
                  l.price_month && { l: 'Month', p: l.price_month },
                  l.price_6month && { l: '6 Month', p: l.price_6month },
                  l.price_year && { l: 'Year', p: l.price_year },
                ] : [
                  l.price_day && { l: 'Day', p: l.price_day },
                  l.price_week && { l: 'Week', p: l.price_week },
                  l.price_month && { l: 'Month', p: l.price_month },
                  l.price_year && { l: 'Year', p: l.price_year },
                ]
                const valid = rates.filter(Boolean)
                if (valid.length <= 1) return null
                return (
                  <div style={{ display: 'flex', background: 'rgba(5,5,5,0.98)', borderTop: '1px solid rgba(250,204,21,0.08)', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                    {valid.map((r, i) => (
                      <div key={r.l} style={{ flex: 1, padding: '8px 4px', textAlign: 'center', borderRight: i < valid.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{r.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 2 }}>{fmtK(r.p)}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </button>
          )})}
        </div>
      </div>

      {/* Detail view */}
      {selected && <RentalDetail listing={selected} onClose={() => setSelected(null)} onChat={(l) => { setSelected(null); requireAccount('chat', l) }} onBook={(l) => { setSelected(null); requireAccount('book', l) }} onReview={(l) => { setSelected(null); setReviewListing(l) }} />}

      {/* Reviews popup */}
      {reviewListing && <ReviewsPopup open={true} onClose={() => setReviewListing(null)} listingRef={reviewListing.ref || reviewListing.id} listingTitle={reviewListing.title} />}

      {/* Chat window */}
      {chatListing && <RentalChat listing={chatListing} onClose={() => setChatListing(null)} onBook={() => { setChatListing(null); setBookingListing(chatListing) }} />}

      {/* Booking flow */}
      {bookingListing && <RentalBookingFlow listing={bookingListing} onClose={() => setBookingListing(null)} onConfirm={() => setBookingListing(null)} />}
      <RentalDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <PriceCalculator vehicle={calcVehicle} onClose={() => setCalcVehicle(null)} />
      <MyBookingsScreen open={showMyBookings} onClose={() => setShowMyBookings(false)} />
      <SavedItemsScreen open={showSavedItems} onClose={() => setShowSavedItems(false)} />
      <MyListingsScreen open={showMyListings} onClose={() => setShowMyListings(false)} />
      <IndooWallet open={showWallet} onClose={() => setShowWallet(false)} />
      <RentalCalendar open={showCalendar} onClose={() => setShowCalendar(false)} listingRef="owner_calendar" listingTitle="My Availability" mode="owner" />
      <ProfileScreen2 open={showProfile} onClose={() => setShowProfile(false)} />
      <SettingsScreen open={showSettings} onClose={() => setShowSettings(false)} />
      <MessagesScreen open={showMessages} onClose={() => setShowMessages(false)} onOpenChat={(conv) => { setShowMessages(false); setChatListing(conv) }} />
      <PropertyMapSearch open={showMapSearch} onClose={() => setShowMapSearch(false)} listings={sortedListings} onSelect={(l) => { setShowMapSearch(false); setSelected(l) }} />
      <SavedSearchAlerts open={showAlerts} onClose={() => setShowAlerts(false)} />
      {modals}
      {!rentalCategoryOpen && !selected && <IndooFooter label="Rentals" onBack={onClose} onHome={onClose} />}
    </div>
  )
}
