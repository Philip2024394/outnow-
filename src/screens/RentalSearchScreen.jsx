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

function RentalLanding({ onEnter, onClose, onDashboard, onSignUp, onListRental, onSellItem, onBuyItem, onRentItem }) {
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
          <span className={styles.landingBrandText}><span>INDOO</span><span className={styles.landingBrandGreen}>DONE DEAL</span></span>
        </div>

        {/* Slogan */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600, margin: '0 0 20px', letterSpacing: '0.03em' }}>RENTALS & SALES</p>

        {/* 4 Action buttons */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🔑', label: 'List a Rental', sub: 'List your vehicle or property for rent', color: '#8DC63F', borderColor: 'rgba(141,198,63,0.2)', action: onListRental || onSignUp },
            { icon: '💰', label: 'Sell an Item', sub: 'Put your vehicle or equipment up for sale', color: '#FFD700', borderColor: 'rgba(255,215,0,0.15)', action: onSellItem || onSignUp },
            { icon: '🛒', label: 'Buy an Item', sub: 'Browse vehicles and equipment for sale', color: '#FFD700', borderColor: 'rgba(255,215,0,0.15)', action: onBuyItem || onEnter },
            { icon: '🏍️', label: 'Rent an Item', sub: 'Find motors, cars, villas to rent', color: '#8DC63F', borderColor: 'rgba(141,198,63,0.2)', action: onRentItem || onEnter },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '14px 16px',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: `1.5px solid ${btn.borderColor}`, borderRadius: 16,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'all 0.25s',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${btn.color}10`, border: `1px solid ${btn.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{btn.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: btn.color }}>{btn.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{btn.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={`${btn.color}66`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>

        {/* Search bar — bottom */}
        <div style={{ padding: '16px 20px 0' }}>
          <div className={styles.landingSearchWrap} onClick={onEnter} style={{ cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={styles.landingSearchInput} placeholder="Search done deals..." readOnly onClick={onEnter} />
          </div>
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
const BIKE_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdasdfsdsdfsadasd.png?updatedAt=1776328299311'
const CAR_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasd.png?updatedAt=1776099885459'
const TRUCK_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdasdfsdsdfsadasddsasd.png'
const BUS_DIR_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2004_38_15%20AM.png'
const ALL_BGS = [LANDING_BG, VEHICLES_BG, PROPERTY_BG, FASHION_BG, EQUIPMENT_BG, BIKE_DIR_BG, CAR_DIR_BG, TRUCK_DIR_BG, BUS_DIR_BG]
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
  const bgUrl = isBike ? BIKE_DIR_BG : isTruck ? TRUCK_DIR_BG : isBus ? BUS_DIR_BG : CAR_DIR_BG
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
          {directory.map((v, idx) => (
            <button key={v.id} className={styles.dirCard} onClick={() => onSelectModel(v)} style={{ animationDelay: `${idx * 0.08}s` }}>
              {/* Top accent line */}
              <div className={styles.dirCardAccent} />

              {/* Listings count badge */}
              <div className={styles.dirCardBadge}>
                <span className={styles.dirCardBadgeNum}>{v.listings}</span>
                <span className={styles.dirCardBadgeLabel}>listed</span>
              </div>

              {/* Vehicle image — floating with shadow */}
              <div className={styles.dirCardImgWrap}>
                {v.image ? (
                  <img src={v.image} alt={v.name} className={styles.dirCardImg} />
                ) : (
                  <span className={styles.dirCardPlaceholder}>{isBike ? '🏍️' : isTruck ? '🚛' : isBus ? '🚌' : '🚗'}</span>
                )}
                {/* Floor reflection */}
                <div className={styles.dirCardReflection} />
              </div>

              {/* Info panel */}
              <div className={styles.dirCardInfo}>
                <span className={styles.dirCardName}>{v.name}</span>
                {/* Spec chips */}
                <div className={styles.dirCardChips}>
                  <span className={styles.dirCardChip}>{v.cc}cc</span>
                  <span className={styles.dirCardChip}>{v.type}</span>
                  {v.seats && <span className={styles.dirCardChip}>{v.seats} seat{v.seats > 1 ? 's' : ''}</span>}
                  {v.payload && <span className={styles.dirCardChip}>{v.payload}</span>}
                </div>
                {/* Price bar */}
                {v.priceFrom && (
                  <div className={styles.dirCardPriceBar}>
                    <div className={styles.dirCardPriceLeft}>
                      <span className={styles.dirCardPriceCurrency}>Rp</span>
                      <span className={styles.dirCardPriceValue}>{(v.priceFrom/1000).toFixed(0)}k</span>
                    </div>
                    <div className={styles.dirCardPriceDivider} />
                    <div className={styles.dirCardPriceRight}>
                      <span className={styles.dirCardPriceTo}>{(v.priceTo/1000).toFixed(0)}k</span>
                      <span className={styles.dirCardPriceDay}>/day</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver available icon — bottom right (cars, buses, trucks only) */}
              {!isBike && (
                <div className={styles.dirCardDriver} title="Driver available">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                </div>
              )}

              {/* Arrow indicator */}
              <div className={styles.dirCardArrow}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
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
          <h1 className={styles.catHeroTitle}>Indoo Done Deal</h1>
          <p className={styles.catHeroSub}>Rentals & Sales across Indonesia</p>
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
  const [showFilter, setShowFilter] = useState(false)
  const [priceSort, setPriceSort] = useState('')
  const [cardImgIdx, setCardImgIdx] = useState({})
  const [flippedCards, setFlippedCards] = useState({})
  const [listingMode, setListingMode] = useState('all') // 'all' | 'rent' | 'sale'

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
      <RentalLanding
        onEnter={() => { markSectionVisited('rentals'); setView('categories') }}
        onClose={onClose}
        onDashboard={() => { markSectionVisited('rentals'); setDashboardOpen(true) }}
        onSignUp={() => setRentalSignUpOpen(true)}
        onListRental={() => { setRentalSignUpOpen(true) }}
        onSellItem={() => { setRentalSignUpOpen(true) }}
        onBuyItem={() => { markSectionVisited('rentals'); setListingMode('sale'); setView('categories') }}
        onRentItem={() => { markSectionVisited('rentals'); setListingMode('rent'); setView('categories') }}
      />
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
          { img: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237', label: 'Bike', filter: 'Motorcycles' },
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
        onSelectModel={(model) => { setSelectedModel(model); setActiveFilter([vehicleType]); setSearch(model.name.split(' ')[0]); setView('browse') }}
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

  let sortedListings = [...listings]
  if (priceSort === 'low') sortedListings.sort((a, b) => (a.price_day || 0) - (b.price_day || 0))
  if (priceSort === 'high') sortedListings.sort((a, b) => (b.price_day || 0) - (a.price_day || 0))

  return (
    <div className={styles.page}>
      {/* Header — search bar + filter */}
      <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { if (vehicleType) { setView('vehicleDir'); return } setView('categories') }} style={{ width: 36, height: 36, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 14, height: 40 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rentals..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', outline: 'none', padding: '0 10px' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer', padding: 0 }}>✕</button>}
          </div>
          <button onClick={() => setShowFilter(!showFilter)} style={{ width: 36, height: 36, borderRadius: 12, background: showFilter ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: showFilter ? 'none' : '1.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: showFilter ? '#000' : 'rgba(255,255,255,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </button>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 0 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: '', label: 'All' },
              { id: 'low', label: 'Price: Low → High' },
              { id: 'high', label: 'Price: High → Low' },
            ].map(f => (
              <button key={f.id} onClick={() => setPriceSort(f.id)} style={{ padding: '6px 14px', borderRadius: 10, background: priceSort === f.id ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: priceSort === f.id ? 'none' : '1px solid rgba(255,255,255,0.06)', color: priceSort === f.id ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {f.label}
              </button>
            ))}
            {RENTAL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <button key={c.id} onClick={() => { setCategory(category === c.id ? 'all' : c.id); setSearch('') }} style={{ padding: '6px 14px', borderRadius: 10, background: category === c.id ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.04)', border: category === c.id ? '1px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)', color: category === c.id ? '#8DC63F' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Market title + results count */}
        <div style={{ padding: '6px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
            {vehicleType === 'Motorcycles' ? '🏍️ Bike' : vehicleType === 'Cars' ? '🚗 Car' : vehicleType === 'Trucks' ? '🚛 Truck' : vehicleType === 'Buses' ? '🚌 Bus' : '📦'} Market
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
            {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).length} {listingMode === 'sale' ? 'for sale' : listingMode === 'rent' ? 'for rent' : 'available'}
          </span>
        </div>
      </div>

      {/* Floating side nav — right edge, touch-friendly */}
      <div style={{
        position: 'fixed', right: 8, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
        padding: '10px 6px', borderRadius: 18,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        {[
          { id: 'home', label: 'Home', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, color: '#fff', action: () => { if (vehicleType) { setView('vehicleDir') } else { setView('categories') } } },
          { id: 'rent', label: 'Rental', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>, color: '#8DC63F', action: () => setListingMode(listingMode === 'rent' ? 'all' : 'rent') },
          { id: 'sale', label: 'Selling', icon: <span style={{ fontSize: 16 }}>💰</span>, color: '#FFD700', action: () => setListingMode(listingMode === 'sale' ? 'all' : 'sale') },
        ].map(btn => {
          const isActive = (btn.id === 'rent' && listingMode === 'rent') || (btn.id === 'sale' && listingMode === 'sale')
          return (
          <button key={btn.id} onClick={btn.action} style={{
            width: 44, minHeight: 52, borderRadius: 12,
            background: isActive ? (btn.id === 'sale' ? '#FFD700' : '#8DC63F') : 'rgba(255,255,255,0.04)',
            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: isActive ? '#000' : btn.color,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            cursor: 'pointer', padding: '6px 0', transition: 'all 0.2s', fontFamily: 'inherit',
            boxShadow: isActive ? `0 0 12px ${btn.id === 'sale' ? 'rgba(255,215,0,0.3)' : 'rgba(141,198,63,0.3)'}` : 'none',
          }}>
            {btn.icon}
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.03em' }}>{btn.label}</span>
          </button>
        )})}
      </div>

      {/* Premium listing cards */}
      <div className={styles.body} style={{ paddingRight: 58 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sortedListings.length === 0 && <div className={styles.empty}>No rentals found</div>}

          <style>{`@keyframes flipGlow { 0%,100% { box-shadow: 0 0 8px rgba(141,198,63,0.3); } 50% { box-shadow: 0 0 18px rgba(141,198,63,0.6), 0 0 30px rgba(141,198,63,0.2); } }`}</style>
          {sortedListings.filter(l => listingMode === 'sale' ? !!l.buy_now : listingMode === 'rent' ? !l.buy_now : true).map(l => {
            const imgs = l.images?.length ? l.images : [l.image || '']
            const currentImg = cardImgIdx[l.id] || 0
            const isFlipped = !!flippedCards[l.id]
            return (
            <div key={l.id} style={{ perspective: 1000, width: '100%' }}>
              <div style={{
                position: 'relative', width: '100%', minHeight: isFlipped ? 260 : 'auto',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}>

                {/* ══ FRONT SIDE ══ */}
                <div style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  width: '100%', display: 'flex', flexDirection: 'column',
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20,
                  overflow: 'hidden', fontFamily: 'inherit', textAlign: 'left',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
                  position: isFlipped ? 'absolute' : 'relative', inset: isFlipped ? 0 : undefined,
                }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />

                  {/* Image section — corner buttons for image switching */}
                  <div onClick={() => setSelected(l)} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'visible', background: '#0a0a0a', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
                    <img src={imgs[currentImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.25s' }} />

                    {l.isOwnerListing && <div style={{ position:'absolute',top:8,left:8,padding:'3px 8px',background:'#8DC63F',borderRadius:6,fontSize:8,fontWeight:900,color:'#000',letterSpacing:'0.04em',zIndex:3 }}>{listingMode === 'sale' ? 'YOUR SALE' : 'YOUR RENTAL'}</div>}
                    {!l.buy_now && <div style={{ position:'absolute',top:8,left:8,padding:'4px 10px',background:'#8DC63F',borderRadius:8,fontSize:9,fontWeight:900,color:'#000',letterSpacing:'0.03em',zIndex:3,boxShadow:'0 2px 8px rgba(141,198,63,0.3)' }}>FOR RENT</div>}
                    {l.buy_now && <div style={{ position:'absolute',top:8,left:8,padding:'4px 10px',background:'#FFD700',borderRadius:8,fontSize:9,fontWeight:900,color:'#000',letterSpacing:'0.03em',zIndex:3,boxShadow:'0 2px 8px rgba(255,215,0,0.3)' }}>FOR SALE</div>}
                    {l.extra_fields?.withDriver && <div style={{ position:'absolute',top:'50%',right:8,transform:'translateY(-50%)',width:26,height:26,borderRadius:'50%',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',border:'1.5px solid rgba(141,198,63,0.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#8DC63F',zIndex:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></div>}

                    {/* Left/Right arrows — black, only if 2+ images */}
                    {imgs.length > 1 && <>
                      <button onClick={e => { e.stopPropagation(); setCardImgIdx(p => ({...p,[l.id]:(currentImg - 1 + imgs.length) % imgs.length})) }} style={{ position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',width:28,height:28,borderRadius:'50%',background:'#000',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:4,padding:0,color:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); setCardImgIdx(p => ({...p,[l.id]:(currentImg + 1) % imgs.length})) }} style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',width:28,height:28,borderRadius:'50%',background:'#000',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:4,padding:0,color:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      {/* Image counter */}
                      <div style={{ position:'absolute',top:8,right:8,padding:'3px 8px',background:'rgba(0,0,0,0.5)',borderRadius:6,fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.6)',zIndex:3 }}>{currentImg + 1}/{imgs.length}</div>
                    </>}
                    </div>{/* close inner clip div */}

                    {/* Flip button — center bottom */}
                    <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:true})) }} style={{ position:'absolute',bottom:-34,left:'50%',transform:'translateX(-50%)',width:68,height:68,borderRadius:'50%',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(12px)',border:'3px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:10,padding:0 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.9 8a8.1 8.1 0 0 0-2.2-3.8A8 8 0 0 0 4 12c0 2.2.5 3.9 1.3 5.3"/><path d="M12 4a8 8 0 0 1 8 8c0 2.5-.7 4.2-1.6 5.5"/><path d="M8 12a4 4 0 0 1 8 0c0 1.4-.3 2.5-.8 3.4"/><path d="M12 8a4 4 0 0 0-4 4c0 1.8.5 3.2 1.2 4.2"/><path d="M12 12v8"/></svg>
                    </button>
                  </div>

                  {/* Front info */}
                  <div onClick={() => setSelected(l)} style={{ padding:'14px 14px 14px',display:'flex',flexDirection:'column',gap:6,cursor:'pointer' }}>
                    {/* Brand + specs row */}
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:0 }}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.01em'}}>{l.extra_fields?.brand || l.title?.split(' ')[0] || l.title}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:600,marginTop:2}}>{[l.extra_fields?.cc && `${l.extra_fields.cc}cc`, l.extra_fields?.year, l.extra_fields?.transmission].filter(Boolean).join(' · ') || l.sub_category}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}><span style={{fontSize:12,color:'#FFD700',fontWeight:800}}>★ {l.rating||'—'}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>({l.review_count})</span></div>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontWeight:600}}>{l.city||'Indonesia'}</span>
                      <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.15)'}}>👁 {l.view_count}</span>
                    </div>
                    {/* Price + action — depends on card type */}
                    {l.buy_now ? (
                      <>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                            <span style={{fontSize:10,fontWeight:700,color:'rgba(255,215,0,0.6)'}}>Rp</span>
                            <span style={{fontSize:22,fontWeight:900,color:'#FFD700',letterSpacing:'-0.02em'}}>{fmtIDR(Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g,''))).replace('Rp ','')}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setBookingListing({...l, _buyMode: true}) }} style={{ padding:'8px 16px',borderRadius:10,background:'#FFD700',border:'none',color:'#000',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(255,215,0,0.3)',flexShrink:0 }}>
                            Buy Now
                          </button>
                        </div>
                        {(typeof l.buy_now === 'object' && l.buy_now.negotiable) && <span style={{fontSize:10,color:'rgba(255,215,0,0.4)',fontWeight:600,marginTop:2}}>Price is negotiable</span>}
                      </>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                          <span style={{fontSize:10,fontWeight:700,color:'rgba(141,198,63,0.6)'}}>Rp</span>
                          <span style={{fontSize:22,fontWeight:900,color:'#8DC63F',letterSpacing:'-0.02em'}}>{fmtIDR(l.price_day).replace('Rp ','')}</span>
                          <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontWeight:600}}>/day</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setBookingListing(l) }} style={{ padding:'8px 16px',borderRadius:10,background:'#8DC63F',border:'none',color:'#000',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(141,198,63,0.3)',flexShrink:0 }}>
                          Book Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ══ BACK SIDE ══ */}
                <div style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute', inset: 0, width: '100%',
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 20,
                  overflow: 'hidden', fontFamily: 'inherit', textAlign: 'left',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(141,198,63,0.08)',
                  display: 'flex', flexDirection: 'column', padding: '16px',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)', pointerEvents: 'none' }} />

                  {/* Back header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>📍 {l.city || 'Indonesia'}</div>
                    </div>
                    {/* Flip back button */}
                    <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:false})) }} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                  </div>

                  {/* Spec chips */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{l.sub_category || l.category}</span>
                    <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{getConditionLabel(l.condition)}</span>
                    {l.features?.slice(0, 4).map((f, fi) => <span key={fi} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{f}</span>)}
                    {l.extra_fields?.withDriver && <span style={{ padding: '4px 10px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>🚗 Driver</span>}
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, flex: 1, overflow: 'hidden', marginBottom: 12 }}>
                    {l.description?.slice(0, 150)}{l.description?.length > 150 ? '...' : ''}
                  </div>

                  {/* Price section — rental or selling */}
                  {l.buy_now ? (
                    <>
                      <div style={{ padding: '12px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 12, marginBottom: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,215,0,0.4)', letterSpacing: '0.05em', marginBottom: 4 }}>SELLING PRICE</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFD700' }}>{fmtIDR(Number(String(typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now).replace(/\./g,'')))}</div>
                        {(typeof l.buy_now === 'object' && l.buy_now.negotiable) && <div style={{ fontSize: 10, color: 'rgba(255,215,0,0.4)', marginTop: 4, fontWeight: 600 }}>Price is negotiable</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:false})); setChatListing(l) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          Chat
                        </button>
                        <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:false})); setBookingListing({...l, _buyMode: true}) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>
                          💰 Buy Now
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                        {[
                          { label: 'DAY', price: l.price_day },
                          { label: 'WEEK', price: l.price_week },
                          { label: 'MONTH', price: l.price_month },
                        ].map((p, pi) => (
                          <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 10, textAlign: 'center', minHeight: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: 3 }}>{p.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{p.price ? fmtIDR(p.price) : '—'}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:false})); setChatListing(l) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          Chat
                        </button>
                        <button onClick={e => { e.stopPropagation(); setFlippedCards(p => ({...p,[l.id]:false})); setBookingListing(l) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
                          🔑 Book Now
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )})}
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
