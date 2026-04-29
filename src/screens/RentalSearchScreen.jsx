/**
 * RentalSearchScreen — browse rental listings by category.
 * Search bar + category chips + 2-col grid.
 * Tap card → full detail view with WhatsApp CTA.
 * Theme: gold #8DC63F
 */
import { useState, useEffect } from 'react'
import IndooFooter from '@/components/ui/IndooFooter'
import {
  RENTAL_CATEGORIES, getListings, getListingsByCategory,
  searchListings, fmtIDR,
} from '@/services/rentalService'
import RentalDashboard from '@/components/rentals/RentalDashboard'
import RentalSignUpScreen from './RentalSignUpScreen'
import RentalCategoryRouter from '@/domains/rentals/RentalCategoryRouter'
import RentalRenterSignUpScreen from './RentalRenterSignUpScreen'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import PriceCalculator from '@/components/rentals/PriceCalculator'
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
import RentalLanding from './rental/RentalLanding'
import SubCategoryLanding from './rental/SubCategoryLanding'
import VehicleDirectory, { BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG } from './rental/VehicleDirectory'
import RentalCategories, { CATEGORY_TILES } from './rental/RentalCategories'
import { seedMockData } from '@/utils/mockData'
import styles from './RentalSearchScreen.module.css'

const LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2010_51_20%20PM.png?updatedAt=1776613897705'


const VEHICLES_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2007_48_01%20AM.png'
const PROPERTY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2005_01_47%20AM.png'
const FASHION_BG  = 'https://ik.imagekit.io/nepgaxllc/Untitledsfsdfsfsdasdasdddddd.png'
const EQUIPMENT_BG = 'https://ik.imagekit.io/nepgaxllc/Exploring%20the%20marketplace%20on%20a%20scooter.png?updatedAt=1776106102122'

// Preload all background images on mount
const ALL_BGS = [LANDING_BG, VEHICLES_BG, PROPERTY_BG, FASHION_BG, EQUIPMENT_BG, BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG]
function usePreloadImages() {
  useEffect(() => {
    ALL_BGS.forEach(src => { const img = new Image(); img.src = src })
  }, [])
}


export default function RentalSearchScreen({ onClose, initialView }) {
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
  const [rentalCategoryOpen, setRentalListingOpen] = useState(false)
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
  const [listingMode, setListingMode] = useState('all') // 'all' | 'rent' | 'sale'
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
  const [savedToggle, setSavedToggle] = useState(0) // force re-render on save

  // Seed mock/demo data on first mount (version-gated inside seedMockData)
  useEffect(() => { seedMockData() }, [])

  // Check if user has account before allowing book/chat
  const hasAccount = () => {
    try { return !!localStorage.getItem('indoo_profile') || !!localStorage.getItem('indoo_rental_owner') } catch { return false }
  }
  const requireAccount = (type, listing) => {
    if (hasAccount()) {
      if (type === 'book') setBookingListing(listing)
      else if (type === 'chat') setChatListing(listing)
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
      for (const key of ALL_LISTING_KEYS) {
        try { allRaw.push(...JSON.parse(localStorage.getItem(key) || '[]')) } catch {}
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

  let listings = search.trim()
    ? searchListings(search)
    : category !== 'all' ? getListingsByCategory(category) : getListings()

  // Add owner listings to the pool
  listings = [...ownerListings, ...listings]

  if (activeFilter && !search.trim() && category === 'all') {
    listings = listings.filter(l => activeFilter.includes(l.category) || activeFilter.includes(l.sub_category))
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
      <PageBadge num={3} label="Vehicles" />
      <SubCategoryLanding
        bg={VEHICLES_BG}
        title="Vehicles"
        tagline="Find your perfect ride"
        heroSub="Buy or rent vehicles across Indonesia"
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
      <PageBadge num={4} label="Directory" />
      <VehicleDirectory
        vehicleType={vehicleType}
        onSelectModel={(model) => { setSelectedModel(model); setActiveFilter([vehicleType]); setSearch(model.name.split(' ')[0]); setView('browse') }}
        onBack={() => setView('vehicles')}
      />
    </>)
  }

  if (view === 'property') {
    return (<>
      <PageBadge num={5} label="Property" />
      <SubCategoryLanding
        bg={PROPERTY_BG}
        bgPosition="center top"
        noScroll
        title="Property Buy & Rent"
        tagline="Stay anywhere you want"
        heroSub="Buy or rent houses, villas, kos & factory spaces"
        buttons={[
          { label: 'House', filter: 'House', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddg.png', heroIcon: 'house' },
          { label: 'Factory', filter: 'Factory', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdd.png', heroIcon: 'factory' },
          { label: 'Kos', filter: 'Kos', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdddd.png', heroIcon: 'kos' },
          { label: 'Villa', filter: 'Villa', heroCard: true, heroImg: 'https://ik.imagekit.io/nepgaxllc/Untitleddddddgdddddd.png', heroIcon: 'villa' },
        ]}
        onSelect={(type) => { setActiveFilter([type]); setView('browse') }}
        onBack={() => setView('browse')}
      />
    </>)
  }

  if (view === 'equipment') {
    return (<>
      <PageBadge num={6} label="Equipment" />
      <SubCategoryLanding
        bg={EQUIPMENT_BG}
        title="Equipment Buy & Rent"
        tagline="Gear up for any occasion"
        heroSub="Buy or rent cameras, sound systems, lighting & event gear"
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
      <PageBadge num={7} label="Fashion" />
      <SubCategoryLanding
        bg={FASHION_BG}
        bgPosition="center top"
        title="Fashion Buy & Rent"
        tagline="Dress for every occasion"
        heroSub="Buy or rent kebaya, suits, gowns & traditional wear"
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
    <div className={styles.page} style={vehicleType === 'Cars' ? { backgroundImage: "url('https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2011_05_34%20PM.png')" } : undefined}>
      {/* Header — market title + search bar + filter */}
      <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { if (vehicleType) { setView('vehicleDir'); return } setView('browse') }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'block' }}>
              {vehicleType === 'Motorcycles' ? 'Bike ' : vehicleType === 'Cars' ? 'Car ' : vehicleType === 'Trucks' ? 'Truck ' : vehicleType === 'Buses' ? 'Bus ' : ''}<span style={{ color: '#8DC63F' }}>Market</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', marginTop: 2, display: 'block' }}>Indonesia's Largest Marketplace · Buy · Sell · Rentals</span>
          </div>
          <button onClick={() => setShowFilter(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M3 4h18v2H3zm3 5h12v2H6zm3 5h6v2H9z"/></svg>
          </button>
        </div>

        {/* Filter overlay — full screen with flip hero + filter fields */}
        {showFilter && (() => {
          const previewListing = sortedListings[filterPreviewIdx % Math.max(sortedListings.length, 1)] || sortedListings[0]
          const previewImgs = previewListing?.images?.length ? previewListing.images : [previewListing?.image || '']
          const hasActiveFilters = filterCity || filterCondition || filterPriceMin || filterPriceMax || priceSort || category !== 'all'
          const activeCount = [filterCity, filterCondition, filterPriceMin, filterPriceMax, priceSort, category !== 'all' ? category : ''].filter(Boolean).length
          const fmtK = n => n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','') + 'jt' : n >= 1000 ? Math.round(n/1000) + 'k' : n

          return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'linear-gradient(180deg, #0a0a0c 0%, #0d0d0f 40%, #0a0a0c 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            <PageBadge num="8a" label="Filter" />
            <style>{`@keyframes filterFlip { from { transform: rotateY(0) } to { transform: rotateY(180deg) } } @keyframes filterSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Filter & Search</span>
                {activeCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, background: '#8DC63F', fontSize: 10, fontWeight: 900, color: '#000' }}>{activeCount}</span>}
              </div>
              <button onClick={() => setShowFilter(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }}>

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
                        {!previewListing.buy_now && <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: '#8DC63F', borderRadius: 8, fontSize: 9, fontWeight: 900, color: '#000', zIndex: 3 }}>FOR RENT</div>}
                        {previewListing.buy_now && <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', background: '#FFD700', borderRadius: 8, fontSize: 9, fontWeight: 900, color: '#000', zIndex: 3 }}>FOR SALE</div>}

                        {/* Title overlay */}
                        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 60, zIndex: 3 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{previewListing.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2 }}>{previewListing.city}</div>
                        </div>

                        {/* Price badge */}
                        <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 10, border: '1px solid rgba(141,198,63,0.2)', zIndex: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>Rp {fmtK(previewListing.price_day || previewListing.buy_now || 0)}</span>
                          {previewListing.price_day && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/day</span>}
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
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>{previewListing.city} · {previewListing.category}</div>

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
                            <span key={k} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                              {typeof v === 'boolean' ? k.replace(/_/g, ' ') : `${k.replace(/_/g, ' ')}: ${v}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Features */}
                      {previewListing.features?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {previewListing.features.slice(0, 5).map((f, i) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', fontSize: 9, fontWeight: 700, color: '#8DC63F' }}>{f}</span>
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
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>Flip to view details · Swipe to browse</span>
                  </div>
                </div>
              )}

              {/* ═══ FILTER FIELDS ═══ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'filterSlideUp 0.4s ease 0.1s both' }}>

                {/* Sort */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Sort By</div>
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
                        fontSize: 11, fontWeight: 800,
                        boxShadow: priceSort === f.id ? '0 2px 10px rgba(141,198,63,0.3)' : 'none',
                      }}>{f.label}</button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Category</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {RENTAL_CATEGORIES.map(c => (
                      <button key={c.id} onClick={() => { setCategory(category === c.id ? 'all' : c.id); setSearch('') }} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: category === c.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                        border: category === c.id ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: category === c.id ? '#8DC63F' : 'rgba(255,255,255,0.35)',
                        fontSize: 11, fontWeight: 700,
                      }}>{c.emoji} {c.label}</button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Price Range (per day)</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: 4 }}>MIN</div>
                      <input type="number" placeholder="50.000" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 16, fontWeight: 700, marginTop: 16 }}>—</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, marginBottom: 4 }}>MAX</div>
                      <input type="number" placeholder="500.000" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Condition</div>
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
                        fontSize: 10, fontWeight: 800,
                        boxShadow: filterCondition === c.id ? '0 2px 10px rgba(141,198,63,0.3)' : 'none',
                      }}>{c.label}</button>
                    ))}
                  </div>
                </div>

                {/* City */}
                <div style={{ padding: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 16, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>Location</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['', 'Canggu', 'Seminyak', 'Kuta', 'Ubud', 'Denpasar', 'Uluwatu', 'Kerobokan'].map(c => (
                      <button key={c} onClick={() => setFilterCity(filterCity === c ? '' : c)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: filterCity === c ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                        border: filterCity === c ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: filterCity === c ? '#8DC63F' : 'rgba(255,255,255,0.35)',
                        fontSize: 11, fontWeight: 700,
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

      {/* Floating side nav — glass panel */}
      <div style={{
        position: 'fixed', right: 8, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 200,
        padding: '14px 8px', borderRadius: 20,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <style>{`@keyframes sideNavGlow { 0%, 100% { box-shadow: 0 0 6px rgba(141,198,63,0.3); } 50% { box-shadow: 0 0 14px rgba(141,198,63,0.6); } } @keyframes sideNavGlowGold { 0%, 100% { box-shadow: 0 0 6px rgba(255,215,0,0.3); } 50% { box-shadow: 0 0 14px rgba(255,215,0,0.6); } }`}</style>
        <button onClick={() => setListingMode(listingMode === 'sale' ? 'all' : 'sale')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: listingMode === 'sale' ? 'rgba(255,215,0,0.1)' : 'none', border: 'none', cursor: 'pointer', color: listingMode === 'sale' ? '#FFD700' : '#fff', fontSize: 10, fontWeight: 700, padding: '8px 6px', borderRadius: 12, animation: listingMode === 'sale' ? 'sideNavGlowGold 2s ease-in-out infinite' : 'none' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span>Buy</span>
        </button>
        <button onClick={() => setListingMode(listingMode === 'rent' ? 'all' : 'rent')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: listingMode === 'rent' ? 'rgba(141,198,63,0.1)' : 'none', border: 'none', cursor: 'pointer', color: listingMode === 'rent' ? '#8DC63F' : '#fff', fontSize: 10, fontWeight: 700, padding: '8px 6px', borderRadius: 12, animation: listingMode === 'rent' ? 'sideNavGlow 2s ease-in-out infinite' : 'none' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          <span>Rent</span>
        </button>
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
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 9, fontWeight: 700, color: '#8DC63F' }}>
                      {isOwner ? '👤 Owner Account' : '👤 Buyer Account'}
                    </div>
                    {isOwner && <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', fontSize: 9, fontWeight: 700, color: '#FFD700' }}>+ Buyer</div>}
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
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', fontWeight: 600 }}>Indoo Done Deal v1.0</span>
            </div>
          </div>
        </>
      )}

      <PageBadge num={8} label="Browse" />
      {/* 2-column product grid — matches marketplace layout */}
      <div className={styles.body} style={{ paddingRight: 66, paddingTop: 90 }}>
        <style>{`
          @keyframes rentalCardIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        `}</style>
        {/* Mode label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: listingMode === 'sale' ? '#FFD700' : listingMode === 'rent' ? '#8DC63F' : '#fff' }}>
            {listingMode === 'sale' ? 'For Sale' : listingMode === 'rent' ? 'Rentals' : 'All Listings'}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).length} items
          </span>
        </div>
        {sortedListings.length === 0 && <div className={styles.empty}>No rentals found</div>}
        <div className={styles.grid}>
          {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).map(l => {
            const imgs = l.images?.length ? l.images : [l.image || '']
            const fmtK = n => n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','') + 'jt' : n >= 1000 ? Math.round(n/1000) + 'k' : n
            const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_day
            return (
            <button key={l.id} onClick={() => setSelected(l)} style={{
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20,
              overflow: 'hidden', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', position: 'relative', padding: 0, width: '100%',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
              animation: 'rentalCardIn 0.4s ease both',
              transition: 'transform 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Green glow line */}
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />

              {/* 16:9 image */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0a0a', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
                {imgs[0] ? (
                  <img src={imgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,255,255,0.08)' }}>🏍️</div>
                )}
                {/* Bottom gradient */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }} />

                {/* City badge with red pin */}
                <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                  {l.city?.split(',')[0] || 'Indonesia'}
                </span>

                {/* Heart save */}
                <div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); if (isItemSaved(l.id)) return; saveItem({ id: l.id, title: l.title, city: l.city, price: l.price_day || l.buy_now, image: imgs[0], category: l.category }); setSavedToggle(p => p + 1) }} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3, padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isItemSaved(l.id) ? '#EF4444' : 'none'} stroke={isItemSaved(l.id) ? '#EF4444' : '#fff'} strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>

                {/* Rating badge */}
                {l.rating && <span style={{ position: 'absolute', bottom: 10, left: 10, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', fontSize: 11, fontWeight: 800, color: '#FFD700', zIndex: 3 }}>★ {l.rating}{l.review_count ? <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}> ({l.review_count})</span> : ''}</span>}

                {/* Transmission badge */}
                {l.extra_fields?.transmission && <span style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 10, fontWeight: 800, zIndex: 3, textTransform: 'capitalize' }}>{l.extra_fields.transmission === 'matic' ? 'Automatic' : l.extra_fields.transmission === 'manual' ? 'Manual' : l.extra_fields.transmission}</span>}

              </div>

              {/* Card body — brand + specs + price + features */}
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Brand / Title */}
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.extra_fields?.brand ? `${l.extra_fields.brand} ${l.extra_fields.model || ''}`.trim() : l.title}
                    </div>
                    {/* Specs line */}
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.extra_fields?.cc
                        ? [l.extra_fields.cc && `${l.extra_fields.cc}cc`, l.extra_fields.year, l.extra_fields.transmission].filter(Boolean).join(' · ')
                        : `${l.category}${l.city ? ` · ${l.city}` : ''}`
                      }
                    </div>
                  </div>
                  {/* Price — right side */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: l.buy_now ? '#FFD700' : '#8DC63F', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
                      {price ? fmtK(Number(String(price).replace(/\./g, ''))) : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 1 }}>
                      {l.buy_now ? 'asking' : '/day'}
                    </div>
                  </div>
                </div>
                {/* Includes line — helmets + raincoat + drop off icons */}
                {(() => {
                  const helmetCount = l.extra_fields?.helmet_count || (l.features?.some(f => /helm/i.test(f)) ? 1 : 0)
                  const hasRaincoat = l.features?.some(f => /rain|jas hujan/i.test(f))
                  const hasDropOff = l.extra_fields?.delivery_available || l.features?.some(f => /deliver|drop|antar/i.test(f))
                  if (!helmetCount && !hasRaincoat && !hasDropOff) return null
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      {helmetCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                          <img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssss-removebg-preview.png" alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
                          x{helmetCount}
                        </span>
                      )}
                      {hasRaincoat && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                          <img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssdd-removebg-preview.png" alt="" style={{ width: 15, height: 15, objectFit: 'contain' }} />
                          x1
                        </span>
                      )}
                      {hasDropOff && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                          <img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssddss-removebg-preview.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                          Drop off
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>
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
      {modals}
      <IndooFooter label="Rentals" onBack={onClose} onHome={onClose} />
    </div>
  )
}
