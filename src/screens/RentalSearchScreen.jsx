/**
 * RentalSearchScreen — browse rental listings by category.
 * Search bar + category chips + 2-col grid.
 * Tap card → full detail view with WhatsApp CTA.
 * Theme: green #8DC63F
 */
import { useState, useEffect } from 'react'
import {
  RENTAL_CATEGORIES, getListings, getListingsByCategory,
  searchListings, fmtIDR, getConditionLabel,
} from '@/services/rentalService'
import { getDirectory } from '@/services/vehicleDirectoryService'
import RentalDashboard from '@/components/rentals/RentalDashboard'
import RentalSignUpScreen from './RentalSignUpScreen'
import RentalCategoryRouter from '@/domains/rentals/RentalCategoryRouter'
import RentalRenterSignUpScreen from './RentalRenterSignUpScreen'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import PriceCalculator from '@/components/rentals/PriceCalculator'
import { RentalChat, RentalBookingFlow } from '@/domains/rentals/components/RentalBooking'
import styles from './RentalSearchScreen.module.css'

function RentalDetail({ listing, onClose, onChat, onBook }) {
  if (!listing) return null

  const extraEntries = listing.extra_fields
    ? Object.entries(listing.extra_fields).filter(([, v]) => v !== null && v !== false && v !== '')
    : []

  return (
    <div className={styles.detailOverlay}>
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.detailTitle}>{listing.title}</span>
      </div>

      <div className={styles.detailBody}>
        <img src={listing.images?.[0]} alt="" className={styles.detailImg} />

        <div className={styles.detailContent}>
          <div>
            <div className={styles.detailName}>{listing.title}</div>
            <div className={styles.detailAddress}>{listing.address} · {listing.city}</div>
          </div>

          {/* Prices */}
          <div className={styles.detailPriceRow}>
            <div className={`${styles.priceBox} ${!listing.price_day ? styles.priceBoxEmpty : ''}`}>
              <span className={styles.priceBoxVal}>{fmtIDR(listing.price_day)}</span>
              <span className={styles.priceBoxLabel}>Per Day</span>
            </div>
            <div className={`${styles.priceBox} ${!listing.price_week ? styles.priceBoxEmpty : ''}`}>
              <span className={styles.priceBoxVal}>{fmtIDR(listing.price_week)}</span>
              <span className={styles.priceBoxLabel}>Per Week</span>
            </div>
            <div className={`${styles.priceBox} ${!listing.price_month ? styles.priceBoxEmpty : ''}`}>
              <span className={styles.priceBoxVal}>{fmtIDR(listing.price_month)}</span>
              <span className={styles.priceBoxLabel}>Per Month</span>
            </div>
          </div>

          {/* Meta badges */}
          <div className={styles.detailMeta}>
            <span className={`${styles.metaChip} ${styles.metaCondition}`}>{getConditionLabel(listing.condition)}</span>
            <span className={`${styles.metaChip} ${styles.metaOwner}`}>{listing.owner_type === 'agent' ? 'Agent' : 'Owner'}</span>
            <span className={`${styles.metaChip} ${styles.metaCategory}`}>{listing.category} · {listing.sub_category}</span>
          </div>

          {/* Description */}
          <div className={styles.detailDesc}>{listing.description}</div>

          {/* Features */}
          {listing.features?.length > 0 && (
            <div className={styles.detailSection}>
              <span className={styles.detailSectionTitle}>Features</span>
              <div className={styles.featureList}>
                {listing.features.map((f, i) => (
                  <span key={i} className={styles.featureChip}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Extra fields */}
          {extraEntries.length > 0 && (
            <div className={styles.detailSection}>
              <span className={styles.detailSectionTitle}>Specifications</span>
              <div className={styles.extraGrid}>
                {extraEntries.map(([k, v]) => (
                  <div key={k} className={styles.extraItem}>
                    <span className={styles.extraKey}>{k.replace(/_/g, ' ')}: </span>
                    {typeof v === 'boolean' ? 'Yes' : String(v)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 8px' }}>
        <button className={styles.chatBtn} onClick={() => onChat?.(listing)} style={{ flex: 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Chat
        </button>
        <button onClick={() => onBook?.(listing)} style={{ flex: 1, padding: '14px 0', background: '#FFD700', border: 'none', borderRadius: 14, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>
          🏍️ Book Now
        </button>
      </div>
      <span className={styles.commissionNote}>10% deposit to confirm · Pay balance on pickup</span>
    </div>
  )
}

const LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasda.png?updatedAt=1776095672208'

function RentalLanding({ onEnter, onClose, onDashboard, onSignUp }) {
  return (
    <div className={styles.landing}>
      {/* Floating side nav — right edge */}
      <div className={styles.floatNav}>
        <button className={styles.floatNavBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </button>
        <button className={`${styles.floatNavBtn} ${styles.floatNavBtnAccent}`} onClick={onSignUp}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Sign Up</span>
        </button>
      </div>

      {/* Main content area */}
      <div className={styles.landingMain}>
        {/* Header — brand text */}
        <div className={styles.landingHeader}>
          <span className={styles.landingBrandText}><span>INDOO</span><span className={styles.landingBrandGreen}>RENTALS</span></span>
        </div>

        {/* Search bar */}
        <div className={styles.landingSearchRow}>
          <div className={styles.landingSearchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.landingSearchInput} placeholder="Search rentals..." readOnly onClick={onEnter} />
          </div>
        </div>

        {/* Hero content — pushed to bottom */}
        <div className={styles.landingContent}>
          <h1 className={styles.landingTitle}>Indoo Rentals</h1>
          <p className={styles.landingSub}>Motors, cars, villas, cameras, sound systems and more — rent anything you need</p>
          <button className={styles.landingBtn} onClick={onEnter}>
            Let's Go Rent
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const CATEGORY_TILES = [
  { id: 'Vehicles',      label: 'Vehicles',       img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_21_07%20AM.png', desc: 'Cars, Motorcycles & Trucks', filter: ['Cars', 'Motorcycles'], bg: 'https://ik.imagekit.io/nepgaxllc/Scooter%20ride%20to%20the%20rental%20lot.png?updatedAt=1776105148434', tagline: 'Find your perfect ride' },
  { id: 'Property',      label: 'Property',       img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_31_24%20AM.png', desc: 'Villas, Kos & Rooms',   filter: ['Property'], bg: null, tagline: 'Stay anywhere you want' },
  { id: 'Fashion',       label: 'Fashion',        img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_44_22%20AM.png', desc: 'Kebaya, Suits & More',   filter: ['Fashion'], bg: null, tagline: 'Dress for every occasion' },
  { id: 'Electronics',   label: 'Electronics',    emoji: '📷', desc: 'Cameras, Laptops & Gear',filter: ['Electronics'], bg: null, tagline: 'Gear up without buying' },
  { id: 'Audio & Sound', label: 'Audio & Sound',  img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_50_12%20AM.png', desc: 'Speakers, DJ & PA',      filter: ['Audio & Sound'], bg: null, tagline: 'Sound for every event' },
  { id: 'Party & Event', label: 'Party & Event',  img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2001_29_12%20AM.png', desc: 'Tents, Decor & Catering',filter: ['Party & Event'], bg: null, tagline: 'Make your event perfect' },
]

const VEHICLES_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2004_41_52%20PM.png'
const PROPERTY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2003_21_17%20PM.png'
const FASHION_BG  = 'https://ik.imagekit.io/nepgaxllc/Stylish%20shopping%20stroll%20at%20sunset.png?updatedAt=1776105703045'
const EQUIPMENT_BG = 'https://ik.imagekit.io/nepgaxllc/Exploring%20the%20marketplace%20on%20a%20scooter.png?updatedAt=1776106102122'

// Preload all background images on mount
const BIKE_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2012_33_21%20AM.png'
const CAR_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2012_38_19%20AM.png'
const TRUCK_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdasdfsdsdfsadasddsasd.png'
const ALL_BGS = [LANDING_BG, VEHICLES_BG, PROPERTY_BG, FASHION_BG, EQUIPMENT_BG, BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG]
function usePreloadImages() {
  useEffect(() => {
    ALL_BGS.forEach(src => { const img = new Image(); img.src = src })
  }, [])
}


function VehicleDirectory({ vehicleType, onSelectModel, onBack }) {
  const directory = getDirectory(vehicleType)
  const isBike = vehicleType === 'Motorcycles'
  const isTruck = vehicleType === 'Trucks'
  const isBus = vehicleType === 'Buses'
  const title = isBike ? 'Motor Bikes' : isTruck ? 'Trucks' : isBus ? 'Buses' : 'Cars'
  const bgUrl = isBike ? BIKE_DIR_BG : isTruck ? TRUCK_DIR_BG : CAR_DIR_BG
  const bgStyle = bgUrl ? { backgroundImage: `url("${bgUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}

  return (
    <div className={styles.dirPage} style={bgStyle}>
      <button onClick={onBack} style={{ position:'absolute', top:16, right:16, zIndex:3, width:36, height:36, borderRadius:'50%', background:'#8DC63F', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.3)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div className={styles.dirHero}>
        <h1 className={styles.dirHeroTitle}>{title} Rentals</h1>
        <p className={styles.dirHeroSub}>
          {isBike ? 'Find your perfect ride in Indonesia' : isTruck ? 'Heavy-duty vehicles for every job' : isBus ? 'Group travel made easy' : 'Drive in comfort across the island'}
        </p>
      </div>
      <div className={styles.dirBody}>
        <div className={styles.dirGrid}>
          {directory.map(v => (
            <button key={v.id} className={styles.dirCard} onClick={() => onSelectModel(v)}>
              <div className={styles.dirCardBadge}>{v.listings}</div>
              <div className={styles.dirCardImgWrap}>
                {v.image ? (
                  <img src={v.image} alt={v.name} className={styles.dirCardImg} />
                ) : (
                  <span className={styles.dirCardPlaceholder}>{isBike ? '🏍️' : isTruck ? '🚛' : isBus ? '🚌' : '🚗'}</span>
                )}
              </div>
              <div className={styles.dirCardInfo}>
                <span className={styles.dirCardName}>{v.name}</span>
                <span className={styles.dirCardSpec}>
                  {v.cc}cc · {v.type}
                  {v.seats ? ` · ${v.seats} seats` : ''}
                  {v.payload ? ` · ${v.payload}` : ''}
                </span>
                {v.priceFrom && (
                  <span className={styles.dirCardPrice}>
                    Rp {(v.priceFrom/1000).toFixed(0)}k – {(v.priceTo/1000).toFixed(0)}k<span className={styles.dirCardPriceDay}>/day</span>
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SubCategoryLanding({ bg, title, tagline, buttons, onSelect, onBack }) {
  return (
    <div className={styles.landing} style={{ backgroundImage: `url("${bg}")` }}>
      <div className={styles.landingOverlay} />
      {/* Header — brand name left, back button right */}
      <div className={styles.subHeader}>
        <span className={styles.subHeaderBrand}>IND<span className={styles.subHeaderGreen}>OO</span> RENTALS</span>
        <button className={styles.subHeaderBack} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>
      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle}>{title}</h1>
        <p className={styles.landingSub}>{tagline}</p>
        <div className={styles.vehicleBtns}>
          {buttons.map(b => (
            <button key={b.filter} className={styles.vehicleBtn} onClick={() => onSelect(b.filter)}>
              {b.img
                ? <img src={b.img} alt={b.label} className={styles.vehicleBtnImg} />
                : <span className={styles.vehicleBtnIcon}>{b.icon}</span>}
              <span className={styles.vehicleBtnLabel}>{b.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RentalCategories({ onSelect, onBack, onDashboard }) {
  return (
    <div className={styles.catPage}>
      <div className={styles.catHeader}>
        <div>
          <h1 className={styles.catHeroTitle}>Indoo Rentals</h1>
          <p className={styles.catHeroSub}>Rent anything, anywhere in Indonesia</p>
        </div>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:'50%', background:'#8DC63F', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.3)', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>
      <div className={styles.catGrid}>
        {CATEGORY_TILES.map(c => (
          <button key={c.id} className={styles.catTile} onClick={() => onSelect(c)}>
            {c.img
              ? <img src={c.img} alt={c.label} className={styles.catTileImg} />
              : <span className={styles.catTileEmoji}>{c.emoji}</span>
            }
            <span className={styles.catTileLabel}>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RentalSearchScreen({ onClose }) {
  usePreloadImages()
  const [view, setView] = useState('landing')
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

  // Merge demo listings with owner-published live listings
  const ownerListings = (() => {
    try {
      return JSON.parse(localStorage.getItem('indoo_my_listings') || '[]')
        .filter(l => l.status === 'live')
        .map(l => ({
          id: l.ref,
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
          features: [l.extra_fields?.cc && `${l.extra_fields.cc}cc`, l.extra_fields?.transmission, l.extra_fields?.fuelType].filter(Boolean),
          rating: (4 + Math.random()).toFixed(1),
          review_count: Math.floor(Math.random() * 20),
          view_count: Math.floor(Math.random() * 200) + 10,
          extra_fields: l.extra_fields,
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
      onClose={() => setRentalSignUpOpen(false)}
      onListRental={() => { setRentalSignUpOpen(false); setRentalListingOpen(true) }}
      onRentItems={() => {
        setRentalSignUpOpen(false)
        const profile = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
        if (profile.rentalUnlocked) {
          markSectionVisited('rentals'); setView('categories')
        } else {
          setRenterSignUpOpen(true)
        }
      }}
    />
    <RentalRenterSignUpScreen
      open={renterSignUpOpen}
      onClose={() => setRenterSignUpOpen(false)}
      onComplete={() => { setRenterSignUpOpen(false); markSectionVisited('rentals'); setView('categories') }}
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

  if (view === 'landing') {
    return <div>
      <RentalLanding onEnter={() => { markSectionVisited('rentals'); setView('categories') }} onClose={onClose} onDashboard={() => { markSectionVisited('rentals'); setDashboardOpen(true) }} onSignUp={() => setRentalSignUpOpen(true)} />
      {modals}
    </div>
  }

  if (view === 'categories') {
    return (
      <RentalCategories
        onSelect={(c) => {
          if (c.id === 'Vehicles') { setView('vehicles'); return }
          if (c.id === 'Property') { setView('property'); return }
          if (c.id === 'Fashion') { setView('fashion'); return }
          if (c.id === 'Electronics' || c.id === 'Audio & Sound' || c.id === 'Party & Event') { setView('equipment'); return }
          setActiveFilter(c.filter); setView('browse')
        }}
        onBack={() => setView('landing')}
        onDashboard={() => setDashboardOpen(true)}
      />
    )
  }

  if (view === 'vehicles') {
    return (
      <SubCategoryLanding
        bg={VEHICLES_BG}
        title="Rent Vehicles"
        tagline="Find your perfect ride"
        buttons={[
          { img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', label: 'Motor Bike', filter: 'Motorcycles' },
          { img: 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566', label: 'Car', filter: 'Cars' },
          { img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssss-removebg-preview.png', label: 'Truck', filter: 'Trucks' },
          { img: 'https://ik.imagekit.io/nepgaxllc/asdasdasssssddd-removebg-preview.png', label: 'Bus', filter: 'Buses' },
        ]}
        onSelect={(type) => { setVehicleType(type); setView('vehicleDir') }}
        onBack={() => setView('categories')}
      />
    )
  }

  if (view === 'vehicleDir' && vehicleType) {
    return (
      <VehicleDirectory
        vehicleType={vehicleType}
        onSelectModel={(model) => { setSelectedModel(model); setActiveFilter([vehicleType]); setView('browse') }}
        onBack={() => setView('vehicles')}
      />
    )
  }

  if (view === 'property') {
    return (
      <SubCategoryLanding
        bg={PROPERTY_BG}
        title="Rent Property"
        tagline="Stay anywhere you want"
        buttons={[
          { icon: '🏠', label: 'House', filter: 'House' },
          { icon: '🏭', label: 'Factory', filter: 'Factory' },
          { icon: '🏢', label: 'Kos', filter: 'Kos' },
          { icon: '🏡', label: 'Villa', filter: 'Villa' },
        ]}
        onSelect={(type) => { setActiveFilter([type]); setView('browse') }}
        onBack={() => setView('categories')}
      />
    )
  }

  if (view === 'equipment') {
    return (
      <SubCategoryLanding
        bg={EQUIPMENT_BG}
        title="Rent Equipment"
        tagline="Gear up for any occasion"
        buttons={[
          { icon: '🎪', label: 'Event Gear', filter: 'Event' },
          { icon: '📸', label: 'Photo & Video', filter: 'Camera' },
          { icon: '💻', label: 'Laptops & Phones', filter: 'Laptop' },
        ]}
        onSelect={(type) => { setActiveFilter([type, 'Electronics', 'Audio & Sound', 'Party & Event']); setView('browse') }}
        onBack={() => setView('categories')}
      />
    )
  }

  if (view === 'fashion') {
    return (
      <SubCategoryLanding
        bg={FASHION_BG}
        title="Rent Fashion"
        tagline="Dress for every occasion"
        buttons={[
          { icon: '👰', label: 'Wedding Clothes', filter: 'Wedding' },
          { icon: '👗', label: 'Fashion Clothes', filter: 'Fashion' },
        ]}
        onSelect={(type) => { setActiveFilter([type, 'Fashion']); setView('browse') }}
        onBack={() => setView('categories')}
      />
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => {
          if (vehicleType) { setView('vehicleDir'); return }
          setView('categories')
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rentals..." />
          {search && <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* Category chips */}
      <div className={styles.categories}>
        {RENTAL_CATEGORIES.map(c => (
          <button key={c.id} className={`${styles.catChip} ${category === c.id ? styles.catChipActive : ''}`} onClick={() => { setCategory(c.id); setSearch('') }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.body}>
        <div className={styles.grid}>
          {listings.length === 0 && <div className={styles.empty}>No rentals found</div>}

          {listings.map(l => (
            <button key={l.id} className={styles.card} onClick={() => setSelected(l)} style={{ position: 'relative' }}>
              {l.isOwnerListing && <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', background: '#8DC63F', borderRadius: 4, fontSize: 7, fontWeight: 900, color: '#000', letterSpacing: '0.04em', zIndex: 2 }}>YOUR LISTING</div>}
              <img src={l.images?.[0]} alt="" className={styles.cardImg} />
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{l.title}</span>
                <div className={styles.cardMeta}>
                  <span className={styles.cardCategory}>{l.sub_category}</span>
                  <span className={styles.cardCondition}>{getConditionLabel(l.condition)}</span>
                  <span className={styles.cardCity}>{l.city}</span>
                </div>
                <div className={styles.cardPrices}>
                  <span className={styles.cardPriceMain}>{fmtIDR(l.price_day)}</span>
                  <span className={styles.cardPricePer}>/ day</span>
                  {l.price_month && <span className={styles.cardPriceSub}>{fmtIDR(l.price_month)} / month</span>}
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardRating}>★ {l.rating || '-'} ({l.review_count})</span>
                  <span className={styles.cardViews}>{l.view_count} views</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail view */}
      {selected && <RentalDetail listing={selected} onClose={() => setSelected(null)} onChat={(l) => { setSelected(null); setChatListing(l) }} onBook={(l) => { setSelected(null); setBookingListing(l) }} />}

      {/* Chat window */}
      {chatListing && <RentalChat listing={chatListing} onClose={() => setChatListing(null)} onBook={() => { setChatListing(null); setBookingListing(chatListing) }} />}

      {/* Booking flow */}
      {bookingListing && <RentalBookingFlow listing={bookingListing} onClose={() => setBookingListing(null)} onConfirm={() => setBookingListing(null)} />}
      <RentalDashboard open={dashboardOpen} onClose={() => setDashboardOpen(false)} />
      <PriceCalculator vehicle={calcVehicle} onClose={() => setCalcVehicle(null)} />
      {modals}
    </div>
  )
}
