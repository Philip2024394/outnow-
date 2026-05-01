import { useState, useRef, useEffect } from 'react'
import { getConditionLabel } from '@/services/rentalService'
import { saveItem, isItemSaved } from '../SavedItemsScreen'
import KPRCalculator from '@/components/property/KPRCalculator'
import BookingRequest from '@/components/property/BookingRequest'
import PropertyReviews from '@/components/property/PropertyReviews'
import VideoPlayer from '@/components/property/VideoPlayer'
import WhatsAppCTA from '@/components/property/WhatsAppCTA'
import VerifiedBadge from '@/components/property/VerifiedBadge'
import NeighborhoodGuide from '@/components/property/NeighborhoodGuide'
import PriceHistoryChart from '@/components/property/PriceHistoryChart'
import PropertyValuation from '@/components/property/PropertyValuation'
import TransportProximity from '@/components/property/TransportProximity'
import UniversalBusinessProfile from '@/components/profile/UniversalBusinessProfile'

function PageBadge({ num, label }) {
  return (
    <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>{num}</div>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

export { PageBadge }

/* ── Similar Properties demo data (as full listing objects) ── */
const SIMILAR_DEMO = [
  { id: 's1', title: 'Modern Villa Seminyak', category: 'Property', sub_category: 'Villa', city: 'Bali', price_month: 45000000, price_day: 1800000, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80'], rating: 4.8, review_count: 12, owner_type: 'owner', condition: 'new', extra_fields: { bedrooms: 3, bathrooms: 2, land_area: '250 m²', property_type: 'Villa', pool: true, furnished: 'Fully Furnished', certificate: 'HGB' } },
  { id: 's2', title: 'Cozy House Denpasar', category: 'Property', sub_category: 'House', city: 'Bali', price_month: 25000000, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80'], rating: 4.6, review_count: 8, owner_type: 'owner', condition: 'good', extra_fields: { bedrooms: 2, bathrooms: 1, land_area: '120 m²', property_type: 'House', furnished: 'Semi Furnished', certificate: 'SHM' } },
  { id: 's3', title: 'Luxury Pool Villa Ubud', category: 'Property', sub_category: 'Villa', city: 'Bali', price_month: 85000000, price_day: 3500000, images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80'], rating: 4.9, review_count: 22, owner_type: 'agent', condition: 'new', extra_fields: { bedrooms: 4, bathrooms: 3, land_area: '400 m²', property_type: 'Villa', pool: true, furnished: 'Fully Furnished', certificate: 'HGB' } },
  { id: 's4', title: 'Kos Exclusive Canggu', category: 'Property', sub_category: 'Kos', city: 'Bali', price_month: 3500000, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80'], rating: 4.4, review_count: 15, owner_type: 'owner', condition: 'good', extra_fields: { bedrooms: 1, bathrooms: 1, property_type: 'Kos', gender: 'Campur', room_size: '20 m²' } },
  { id: 's5', title: 'Industrial Warehouse', category: 'Property', sub_category: 'Factory', city: 'Sleman', price_year: 150000000, images: ['https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=400&q=80'], rating: 4.5, review_count: 3, owner_type: 'agent', condition: 'good', extra_fields: { land_area: '800 m²', building_area: '600 m²', property_type: 'Factory', zoning: 'Industrial', certificate: 'HGB' } },
]

/* ── CSS keyframes injected once ── */
const STYLE_ID = '__rental_detail_anims__'
function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes rd_slideUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes rd_fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rd_pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(141,198,63,0.4); } 50% { box-shadow: 0 0 0 12px rgba(141,198,63,0); } }
    @keyframes rd_matchArc { from { stroke-dashoffset: 251; } to { stroke-dashoffset: var(--arc-end); } }
    @keyframes rd_similarScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes rd_emojiBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes rd_dotGlow { 0%,100% { box-shadow: 0 0 3px rgba(141,198,63,0.3); } 50% { box-shadow: 0 0 8px rgba(141,198,63,0.7); } }
    @keyframes rd_bestValue { 0%,100% { opacity: 0.8; } 50% { opacity: 1; } }
    .rd-section { animation: rd_slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
    .rd-chat-fab { animation: rd_pulse 2.5s ease-in-out infinite; }
    .rd-hero-img { transition: transform 0.15s ease-out; }
    .rd-similar-track { display: flex; gap: 12px; animation: rd_similarScroll 25s linear infinite; }
    .rd-similar-track:hover { animation-play-state: paused; }
    .rd-emoji-bounce { animation: rd_emojiBounce 0.5s ease both; }
    .rd-dot-glow { animation: rd_dotGlow 2s ease-in-out infinite; }
    .rd-gallery-img { transition: transform 0.2s ease; }
    .rd-gallery-img:active { transform: scale(1.03); }
  `
  document.head.appendChild(s)
}

/* ── Main Component ── */
export default function RentalDetail({ listing: initialListing, onClose, onChat, onBook, onReview }) {
  const [activeListing, setActiveListing] = useState(initialListing)
  const listing = activeListing
  const [saved, setSaved] = useState(() => isItemSaved(listing?.id))
  const [activeImg, setActiveImg] = useState(0)
  const [showKPR, setShowKPR] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [imgScale, setImgScale] = useState(1)
  const [matchScore] = useState(() => Math.floor(Math.random() * 14) + 85)
  const [shareToast, setShareToast] = useState(false)
  const scrollRef = useRef(null)
  const touchStartX = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    injectStyles()
    requestAnimationFrame(() => setMounted(true))
  }, [])

  /* Parallax scroll handler */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const y = el.scrollTop
      const s = 1 + Math.min(y * 0.0004, 0.15)
      setImgScale(s)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  if (!listing) return null

  const images = listing.images?.length ? listing.images : [listing.image || '']
  const isProperty = ['House', 'Villa', 'Kos', 'Factory', 'Property'].includes(listing.category) || ['House', 'Villa', 'Kos', 'Factory', 'Tanah', 'Ruko', 'Gudang', 'Pabrik', 'Apartment'].includes(listing.sub_category)
  const subCat = listing.sub_category || listing.category || 'Property'
  const ef = listing.extra_fields || {}

  const fmtK = n => !n ? '\u2014' : n >= 1000000000 ? (n / 1000000000).toFixed(1).replace('.0', '') + 'B' : n >= 1000000 ? (n / 1000000).toFixed(1).replace('.0', '') + 'jt' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n)
  const fmtFull = n => !n ? '\u2014' : `Rp ${Number(n).toLocaleString('id-ID')}`

  const mainPrice = listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month || listing.price_day || listing.price_year
  const priceLabel = listing.buy_now ? 'For Sale' : listing.price_month ? '/ month' : listing.price_day ? '/ day' : listing.price_year ? '/ year' : ''

  /* Rental periods based on sub_category */
  const getRentalPeriods = () => {
    const periods = []
    const add = (key, label, field) => {
      const val = listing[field]
      if (val) periods.push({ key, label, price: val })
    }
    switch (subCat) {
      case 'Villa':
        add('day', 'Day', 'price_day')
        add('week', 'Week', 'price_week')
        add('month', 'Month', 'price_month')
        add('year', 'Year', 'price_year')
        break
      case 'House':
        add('month', 'Month', 'price_month')
        add('6month', '6 Months', 'price_6month')
        add('year', 'Year', 'price_year')
        break
      case 'Kos':
        add('month', 'Month', 'price_month')
        add('3month', '3 Months', 'price_3month')
        add('6month', '6 Months', 'price_6month')
        add('year', 'Year', 'price_year')
        break
      case 'Factory':
        add('6month', '6 Months', 'price_6month')
        add('year', 'Year', 'price_year')
        add('2year', '2 Years', 'price_2year')
        add('5year', '5 Years', 'price_5year')
        break
      default:
        add('day', 'Day', 'price_day')
        add('week', 'Week', 'price_week')
        add('month', 'Month', 'price_month')
        add('3month', '3 Months', 'price_3month')
        add('6month', '6 Months', 'price_6month')
        add('year', 'Year', 'price_year')
        add('2year', '2 Years', 'price_2year')
        add('5year', '5 Years', 'price_5year')
        break
    }
    return periods
  }

  const rentalPeriods = listing.buy_now ? [] : getRentalPeriods()

  /* Touch swipe for images */
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeImg < images.length - 1) setActiveImg(activeImg + 1)
      else if (diff < 0 && activeImg > 0) setActiveImg(activeImg - 1)
    }
    touchStartX.current = null
  }

  const handleSave = () => {
    saveItem(listing)
    setSaved(!saved)
  }

  const handleShare = async () => {
    const shareData = { title: listing.title, text: `Check out: ${listing.title}`, url: window.location.href }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch (_) { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(window.location.href) } catch (_) { /* fallback */ }
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  /* Match Score SVG arc */
  const matchCircumference = 251.2
  const matchOffset = matchCircumference - (matchCircumference * matchScore / 100)

  /* Section stagger helper */
  const sectionDelay = (idx) => mounted ? { animationDelay: `${0.08 + idx * 0.07}s` } : { opacity: 0 }

  /* ── Rendering helpers ── */
  const SectionHeader = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>
  )

  const GlassCard = ({ children, style = {} }) => (
    <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', ...style }}>{children}</div>
  )

  const DETAIL_ICONS = {
    Certificate: 'https://ik.imagekit.io/nepgaxllc/Untitledsssvvvvv-removebg-preview.png',
    Furnished: 'https://ik.imagekit.io/nepgaxllc/Untitledsssvvvvvdd-removebg-preview.png',
    Facing: 'https://ik.imagekit.io/nepgaxllc/Untitledssv-removebg-preview.png',
    Floors: 'https://ik.imagekit.io/nepgaxllc/Untitled33-removebg-preview.png',
    'Year Built': 'https://ik.imagekit.io/nepgaxllc/Untitledsssff-removebg-preview.png',
  }

  let detailRowIdx = 0
  const DetailRow = ({ label, value, color = '#fff', isLast = false }) => {
    const idx = detailRowIdx++
    const iconUrl = DETAIL_ICONS[label]
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', gap: 10 }}>
        {iconUrl && <img src={iconUrl} alt="" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0, opacity: 0.8 }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', flex: 1 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
      </div>
    )
  }

  /* ── Property Details array ── */
  const propertyDetails = [
    ef.certificateType && ['Certificate', ef.certificateType, ef.certificateType === 'SHM' ? '#8DC63F' : '#FACC15'],
    ef.certificate && !ef.certificateType && ['Certificate', ef.certificate, ef.certificate.includes?.('SHM') ? '#8DC63F' : '#FACC15'],
    ef.furnished && ['Furnished', ef.furnished, '#8DC63F'],
    ef.numFloors && ['Floors', ef.numFloors, '#fff'],
    ef.floors && !ef.numFloors && ['Floors', ef.floors, '#fff'],
    ef.facingDirection && ['Facing', ef.facingDirection, '#fff'],
    ef.facing && !ef.facingDirection && ['Facing', ef.facing, '#fff'],
    ef.yearBuilt && ['Year Built', ef.yearBuilt, '#fff'],
    ef.year_built && !ef.yearBuilt && ['Year Built', ef.year_built, '#fff'],
    ef.electricityCapacity && ['Electricity', ef.electricityCapacity, '#FACC15'],
    ef.power && !ef.electricityCapacity && ['Power', ef.power, '#FACC15'],
    ef.waterType && ['Water', ef.waterType, '#60A5FA'],
    ef.numGarages && ['Garages', ef.numGarages, '#fff'],
    ef.accessRoadWidth && ['Road Width', ef.accessRoadWidth, '#fff'],
    ef.view && ['View', ef.view, '#fff'],
    ef.zoning && ['Zoning', ef.zoning, '#fff'],
    ef.ceiling_height && ['Ceiling Height', ef.ceiling_height, '#fff'],
    ef.floodFree && ['Flood Free', 'Yes', '#8DC63F'],
    ef.nearTollRoad && ['Near Toll Road', 'Yes', '#8DC63F'],
    ef.nearPublicTransport && ['Public Transport', 'Nearby', '#8DC63F'],
    ef.foreigner_eligible && ['Foreigner Eligible', 'Yes', '#60A5FA'],
  ].filter(Boolean)

  /* ── Kos details ── */
  const kosDetails = [
    ef.kosTier && ['Tier', ef.kosTier, '#FACC15'],
    ef.kosGender && ['Gender', ef.kosGender, ef.kosGender === 'Putri' ? '#EC4899' : ef.kosGender === 'Putra' ? '#60A5FA' : '#A855F7'],
    ef.gender && !ef.kosGender && ['Gender', ef.gender, '#fff'],
    ef.kosBedType && ['Bed Type', ef.kosBedType, '#fff'],
    ef.kosMaxOccupants && ['Max Occupants', ef.kosMaxOccupants, '#fff'],
    ef.room_size && ['Room Size', ef.room_size, '#fff'],
    ef.kosAvailableRooms && ['Available Rooms', ef.kosAvailableRooms, '#8DC63F'],
    ef.available_rooms && !ef.kosAvailableRooms && ['Available Rooms', ef.available_rooms, '#8DC63F'],
    ef.kosMinStay && ['Min Stay', ef.kosMinStay, '#fff'],
    ef.min_duration && !ef.kosMinStay && ['Min Stay', ef.min_duration, '#fff'],
    ef.kosDepositAmount && ['Deposit', ef.kosDepositAmount, '#fff'],
    ef.deposit && !ef.kosDepositAmount && ['Deposit', ef.deposit, '#fff'],
    ef.kosAvailableFrom && ['Available From', ef.kosAvailableFrom, '#8DC63F'],
  ].filter(Boolean)

  const isKos = ef.property_type === 'Kos' || subCat === 'Kos'
  const hasHouseRules = isKos && (ef.kosGuestHours || ef.kosCouplesAllowed !== undefined || ef.kos24HourAccess !== undefined || ef.smokingAllowed !== undefined || ef.petsAllowed !== undefined)

  const houseRules = hasHouseRules ? [
    ef.kosGuestHours && ['Guest Hours', `Until ${ef.kosGuestHours}`, '#fff'],
    ef.kosCouplesAllowed !== undefined && ['Couples Allowed', ef.kosCouplesAllowed ? 'Yes' : 'No', ef.kosCouplesAllowed ? '#8DC63F' : '#EF4444'],
    ef.kos24HourAccess !== undefined && ['24-Hour Access', ef.kos24HourAccess ? 'Yes' : 'No', ef.kos24HourAccess ? '#8DC63F' : '#EF4444'],
    ef.smokingAllowed !== undefined && ['Smoking', ef.smokingAllowed ? 'Allowed' : 'Not Allowed', ef.smokingAllowed ? '#FACC15' : '#8DC63F'],
    ef.petsAllowed !== undefined && ['Pets', ef.petsAllowed ? 'Allowed' : 'Not Allowed', ef.petsAllowed ? '#8DC63F' : '#EF4444'],
  ].filter(Boolean) : []

  /* Non-property extras */
  const helmetCount = ef.helmet_count || (listing.features?.some(f => /helm/i.test(f)) ? 1 : 0)
  const hasRaincoat = listing.features?.some(f => /rain|jas hujan/i.test(f))
  const hasDropOff = ef.delivery_available || listing.features?.some(f => /deliver|drop|antar/i.test(f))

  let sectionIdx = 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, fontFamily: 'inherit', background: '#0a0a0a' }}>

      {/* Share toast */}
      {shareToast && (
        <div style={{ position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, padding: '10px 20px', borderRadius: 10, background: 'rgba(141,198,63,0.9)', color: '#000', fontSize: 13, fontWeight: 700, animation: 'rd_fadeIn 0.2s ease' }}>
          Link copied!
        </div>
      )}

      {/* Full layout */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ═══════════ HERO IMAGE SECTION — 45% ═══════════ */}
        <div ref={heroRef} style={{ height: '45%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

          {/* Main image with parallax */}
          <img
            className="rd-hero-img"
            src={images[activeImg] || images[0]}
            alt={listing.title || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: `scale(${imgScale})`, transformOrigin: 'center center' }}
          />

          {/* Cinematic gradient overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, transparent 30%, transparent 50%, rgba(10,10,10,0.85) 80%, #0a0a0a 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,10,0.4) 0%, transparent 40%)', pointerEvents: 'none' }} />

          {/* Top-left: Close button */}
          <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>

          {/* Top-right: Share + Save */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 10, zIndex: 10 }}>
            <button onClick={handleShare} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            </button>
            <button onClick={handleSave} style={{ width: 40, height: 40, borderRadius: '50%', background: saved ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: saved ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#EF4444' : 'none'} stroke={saved ? '#EF4444' : '#fff'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
            </button>
          </div>

          {/* Floating thumbnails — left side */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', top: 68, left: 14, zIndex: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {images.slice(0, 3).map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{
                  width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', padding: 0, cursor: 'pointer',
                  border: activeImg === i ? '2.5px solid #FFD700' : '2px solid rgba(255,255,255,0.25)',
                  opacity: activeImg === i ? 1 : 0.65,
                  transform: activeImg === i ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  boxShadow: activeImg === i ? '0 0 16px rgba(255,215,0,0.35)' : '0 2px 10px rgba(0,0,0,0.5)',
                  background: 'transparent',
                }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}

          {/* Match Score badge — top area near right */}
          <div style={{ position: 'absolute', top: 68, right: 16, zIndex: 8, width: 56, height: 56 }}>
            <svg width="56" height="56" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="40" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
              <circle cx="45" cy="45" r="40" fill="none" stroke="#8DC63F" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={matchCircumference}
                style={{ '--arc-end': matchOffset, strokeDashoffset: mounted ? matchOffset : matchCircumference, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1) 0.5s' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F', lineHeight: 1 }}>{matchScore}%</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>MATCH</span>
            </div>
          </div>

          {/* Bottom overlay: Price + badge + owner + rating */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px', zIndex: 5 }}>
            {/* Sub-category badge + Owner/Agent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#000', background: '#8DC63F', padding: '3px 10px', borderRadius: 6, letterSpacing: '0.03em' }}>{subCat}</span>
              {listing.owner_type && (
                <span style={{ fontSize: 12, fontWeight: 800, color: listing.owner_type === 'owner' ? '#FACC15' : '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{listing.owner_type}</span>
              )}
              {listing.rating && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span>⭐</span> {listing.rating}
                  {listing.review_count ? <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>({listing.review_count})</span> : null}
                </span>
              )}
            </div>
            {/* Large price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtFull(mainPrice)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{priceLabel}</span>
            </div>
          </div>

          {/* Image counter dots */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 6 }}>
              {images.slice(0, 8).map((_, i) => (
                <div key={i} style={{ width: activeImg === i ? 18 : 6, height: 6, borderRadius: 3, background: activeImg === i ? '#FFD700' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* ═══════════ SCROLLABLE CONTENT ═══════════ */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ padding: '20px 16px 140px' }}>

            {/* ── Title + Location ── */}
            <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>{listing.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <span style={{ fontSize: 14 }}>📍</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{listing.address || listing.city || 'Indonesia'}</span>
                  </div>
                </div>
                {ef.land_area && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>📐</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{ef.land_area}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick Stats Bar ── */}
            {isProperty && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                  {[
                    ef.bedrooms && { icon: '🛏️', val: ef.bedrooms, label: 'Beds' },
                    ef.bathrooms && { icon: '🚿', val: ef.bathrooms, label: 'Bath' },
                    ef.toilets && { icon: '🚽', val: ef.toilets, label: 'WC' },
                    ef.pool && { icon: '🏊', val: typeof ef.pool === 'number' ? ef.pool : 1, label: 'Pool' },
                    (ef.garage || ef.parking) && { icon: '🚗', val: ef.garage || ef.parking, label: ef.garage ? 'Garage' : 'Parking' },
                  ].filter(Boolean).map((stat, i, arr) => (
                    <div key={i} style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div className="rd-emoji-bounce" style={{ fontSize: 20, lineHeight: 1, animationDelay: `${i * 0.15}s` }}>{stat.icon}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 4 }}>{stat.val}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Size Cards with background images ── */}
            {isProperty && (ef.land_area || ef.building_area) && (() => {
              const landImg = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_00_08%20PM.png'
              const houseImg = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2011_55_49%20AM.png'
              const factoryImg = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_02_44%20PM.png'
              const isFactory = ['Factory', 'Gudang', 'Pabrik'].includes(subCat)
              const buildingBg = isFactory ? factoryImg : houseImg
              return (
                <div className="rd-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                  {ef.land_area && (
                    <GlassCard style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden', minHeight: 110 }}>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Land Area</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 6 }}>{ef.land_area}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>m²</div>
                      </div>
                      <img src={landImg} alt="" style={{ position: 'absolute', bottom: -2, right: -2, width: 77, height: 77, objectFit: 'contain', opacity: 0.85, pointerEvents: 'none' }} />
                    </GlassCard>
                  )}
                  {ef.building_area && (
                    <GlassCard style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.85)', position: 'relative', overflow: 'hidden', minHeight: 110 }}>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Building Area</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 6 }}>{ef.building_area}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>m²</div>
                      </div>
                      <img src={buildingBg} alt="" style={{ position: 'absolute', bottom: -4, right: -4, width: 140, height: 140, objectFit: 'contain', opacity: 0.85, pointerEvents: 'none' }} />
                    </GlassCard>
                  )}
                </div>
              )
            })()}

            {/* ── Rental Periods — glass tinted with Best Value ── */}
            {rentalPeriods.length > 0 && (() => {
              const bestIdx = rentalPeriods.reduce((best, p, i) => {
                const monthly = p.key === 'day' ? p.price * 30 : p.key === 'week' ? p.price * 4.3 : p.key === 'month' ? p.price : p.key === '3month' ? p.price / 3 : p.key === '6month' ? p.price / 6 : p.key === 'year' ? p.price / 12 : p.key === '2year' ? p.price / 24 : p.price / 60
                return monthly < best.monthly ? { idx: i, monthly } : best
              }, { idx: 0, monthly: Infinity }).idx
              return (
                <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                  <SectionHeader>Rental Periods</SectionHeader>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {rentalPeriods.map((p, i) => {
                      const isBest = i === bestIdx && rentalPeriods.length > 1
                      return (
                        <div key={p.key} style={{ flex: 1, padding: '12px 6px', borderRadius: 12, textAlign: 'center', position: 'relative', background: isBest ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)', border: isBest ? '1.5px solid rgba(141,198,63,0.3)' : '1px solid rgba(255,255,255,0.06)', boxShadow: isBest ? '0 0 16px rgba(141,198,63,0.15)' : 'none' }}>
                          {isBest && <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', padding: '2px 8px', borderRadius: 6, background: '#8DC63F', fontSize: 9, fontWeight: 800, color: '#000', whiteSpace: 'nowrap', animation: 'rd_bestValue 2s ease infinite' }}>Best Value</div>}
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: isBest ? 4 : 0 }}>{p.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>{fmtK(p.price)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* ── Non-property vehicle extras ── */}
            {!isProperty && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                {(helmetCount > 0 || hasRaincoat || hasDropOff) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: '12px 14px', background: 'rgba(141,198,63,0.04)', borderRadius: 12, border: '1px solid rgba(141,198,63,0.1)' }}>
                    {helmetCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssss-removebg-preview.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />x{helmetCount}</span>}
                    {hasRaincoat && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssdd-removebg-preview.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />x1</span>}
                    {hasDropOff && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssddss-removebg-preview.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />Drop off</span>}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Day', price: listing.price_day },
                    { label: 'Week', price: listing.price_week },
                    { label: 'Month', price: listing.price_month },
                  ].map((p, i) => (
                    <div key={i} style={{ padding: '12px 6px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{p.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: p.price ? '#FACC15' : 'rgba(255,255,255,0.15)' }}>{p.price ? fmtK(p.price) : '\u2014'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Property Details List ── */}
            {propertyDetails.length > 0 && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Property Details</SectionHeader>
                <GlassCard>
                  {propertyDetails.map(([label, value, color], i) => (
                    <DetailRow key={i} label={label} value={value} color={color} isLast={i === propertyDetails.length - 1} />
                  ))}
                </GlassCard>
              </div>
            )}

            {/* ── Kos: Room Info ── */}
            {isKos && kosDetails.length > 0 && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Room Info</SectionHeader>
                <GlassCard>
                  {kosDetails.map(([label, value, color], i) => (
                    <DetailRow key={i} label={label} value={value} color={color} isLast={i === kosDetails.length - 1} />
                  ))}
                </GlassCard>
              </div>
            )}

            {/* ── Kos: Includes / Excludes ── */}
            {isKos && (ef.kosIncluded?.length > 0 || ef.kosExcluded?.length > 0) && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Price Includes / Excludes</SectionHeader>
                <div style={{ display: 'flex', gap: 10 }}>
                  {ef.kosIncluded?.length > 0 && (
                    <GlassCard style={{ flex: 1, padding: '14px', border: '1px solid rgba(141,198,63,0.12)', background: 'rgba(141,198,63,0.03)' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }}>Includes</div>
                      {ef.kosIncluded.map((item, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#8DC63F', fontWeight: 900, fontSize: 14 }}>✓</span> {item}
                        </div>
                      ))}
                    </GlassCard>
                  )}
                  {ef.kosExcluded?.length > 0 && (
                    <GlassCard style={{ flex: 1, padding: '14px', border: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.03)' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }}>Excludes</div>
                      {ef.kosExcluded.map((item, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#EF4444', fontWeight: 900, fontSize: 14 }}>✗</span> {item}
                        </div>
                      ))}
                    </GlassCard>
                  )}
                </div>
              </div>
            )}

            {/* ── Kos: House Rules ── */}
            {houseRules.length > 0 && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>House Rules</SectionHeader>
                <GlassCard>
                  {houseRules.map(([label, value, color], i) => (
                    <DetailRow key={i} label={label} value={value} color={color} isLast={i === houseRules.length - 1} />
                  ))}
                </GlassCard>
              </div>
            )}

            {/* ── Facilities (Room + Shared) ── */}
            {(ef.kosRoomFacilities?.length > 0 || ef.kosSharedFacilities?.length > 0) && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Facilities</SectionHeader>
                {ef.kosRoomFacilities?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Room</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ef.kosRoomFacilities.map((f, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.12)', color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {ef.kosSharedFacilities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Shared</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ef.kosSharedFacilities.map((f, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Video Tour / Cancellation ── */}
            {(ef.videoTourUrl || ef.cancellationPolicy) && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <GlassCard>
                  {ef.videoTourUrl && (
                    <DetailRow label="🎬 Video Tour" value="Watch →" color="#60A5FA" isLast={!ef.cancellationPolicy} />
                  )}
                  {ef.cancellationPolicy && (
                    <DetailRow label="📄 Cancellation" value={ef.cancellationPolicy} color="#fff" isLast />
                  )}
                </GlassCard>
              </div>
            )}

            {/* ── Description ── */}
            {listing.description && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Description</SectionHeader>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, letterSpacing: '0.01em' }}>{listing.description}</div>
              </div>
            )}

            {/* ── Features — 2 col grid ── */}
            {listing.features?.length > 0 && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Features</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {listing.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(141,198,63,0.03)', border: '1px solid rgba(141,198,63,0.06)' }}>
                      <div className="rd-dot-glow" style={{ width: 7, height: 7, borderRadius: '50%', background: '#8DC63F', flexShrink: 0, animationDelay: `${i * 0.3}s` }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery — 2 col grid ── */}
            {images.length > 1 && (
              <div className="rd-section" style={{ marginBottom: 24, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>📷 Gallery</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{
                      padding: 0, border: activeImg === i ? '2px solid #FFD700' : '2px solid transparent',
                      borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'transparent',
                      aspectRatio: '4/3', position: 'relative',
                    }}>
                      <img className="rd-gallery-img" src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {activeImg === i && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD700', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 6 }}>Viewing</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Video Tour ── */}
            {listing.video_url && (
              <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
                <SectionHeader>Video Tour</SectionHeader>
                <VideoPlayer videoUrl={listing.video_url} thumbnailUrl={listing.video_thumbnail} />
              </div>
            )}

            {/* ── Verified Badge + Owner Type ── */}
            {isProperty && (
              <div className="rd-section" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', ...sectionDelay(sectionIdx++) }}>
                <VerifiedBadge type={listing.owner_type === 'agent' ? 'verified' : 'trusted'} size="md" />
                {listing.condition === 'new' && <VerifiedBadge type="new" size="md" />}
                {listing.owner_type === 'agent' && <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA', fontSize: 12, fontWeight: 800 }}>🏢 Agent</span>}
                {listing.owner_type === 'owner' && <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 800 }}>👤 Owner</span>}
                <button onClick={() => setShowProfile(true)} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>View Profile →</button>
              </div>
            )}

            {/* ── Price History & Market ── */}
            {isProperty && (
              <div className="rd-section" style={{ ...sectionDelay(sectionIdx++) }}>
                <PriceHistoryChart listing={listing} />
              </div>
            )}

            {/* ── Property Valuation ── */}
            {isProperty && listing.buy_now && (
              <div className="rd-section" style={{ ...sectionDelay(sectionIdx++) }}>
                <PropertyValuation listing={listing} />
              </div>
            )}

            {/* ── Neighborhood Guide ── */}
            {isProperty && (
              <div className="rd-section" style={{ ...sectionDelay(sectionIdx++) }}>
                <NeighborhoodGuide listing={listing} />
              </div>
            )}

            {/* ── Transport Proximity ── */}
            {isProperty && (
              <div className="rd-section" style={{ ...sectionDelay(sectionIdx++) }}>
                <TransportProximity listing={listing} />
              </div>
            )}

            {/* ── Reviews ── */}
            <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
              <PropertyReviews listingId={listing.id} listingTitle={listing.title} rating={listing.rating} reviewCount={listing.review_count} />
            </div>

            {/* ── Similar Properties Carousel ── */}
            <div className="rd-section" style={{ marginBottom: 20, ...sectionDelay(sectionIdx++) }}>
              <SectionHeader>Similar Properties</SectionHeader>
              <div style={{ overflow: 'hidden', borderRadius: 14, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
                <div className="rd-similar-track" style={{ width: 'max-content' }}>
                  {[...SIMILAR_DEMO, ...SIMILAR_DEMO].map((item, i) => (
                    <div key={i} onClick={() => { setActiveListing(item); setActiveImg(0); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ width: 160, flexShrink: 0, borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                      <div style={{ width: '100%', height: 100, position: 'relative', overflow: 'hidden' }}>
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }} />
                        <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 12, fontWeight: 800, color: '#000', background: '#8DC63F', padding: '2px 6px', borderRadius: 4 }}>{item.sub_category || item.extra_fields?.property_type || 'Property'}</span>
                      </div>
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#FACC15' }}>{fmtK(item.price_month || item.price_year || item.price_day || 0)}{item.price_month ? '/mo' : item.price_year ? '/yr' : '/day'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                          {item.extra_fields?.bedrooms > 0 && <span>🛏️ {item.extra_fields.bedrooms}</span>}
                          {item.extra_fields?.land_area && <span>📐 {item.extra_fields.land_area}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════ FLOATING CHAT BUTTON ═══════════ */}
        <button
          className="rd-chat-fab"
          onClick={() => onChat?.(listing)}
          style={{
            position: 'absolute', bottom: 80, right: 16, zIndex: 20,
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>

        {/* ═══════════ FIXED BOTTOM ACTION BAR ═══════════ */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
          padding: '24px 16px 16px',
          background: 'linear-gradient(transparent 0%, rgba(10,10,10,0.7) 30%, #0a0a0a 70%)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* WhatsApp CTA (property) or Chat Owner (other) */}
          {isProperty ? (
            <WhatsAppCTA phoneNumber={listing.whatsapp || '81234567890'} listingTitle={listing.title} listingPrice={listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month} size="small" />
          ) : (
            <button onClick={() => onChat?.(listing)} style={{
              flex: 1, padding: '15px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              Chat Owner
            </button>
          )}

          {/* KPR Calculator (sale only) */}
          {listing.buy_now && isProperty && (
            <button onClick={() => setShowKPR(true)} style={{
              padding: '15px 12px', borderRadius: 14,
              background: 'rgba(250,204,21,0.08)',
              border: '1.5px solid rgba(250,204,21,0.2)',
              color: '#FACC15', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              🏦 KPR
            </button>
          )}

          {/* Book / Contact — solid green */}
          <button onClick={() => setShowBooking(true)} style={{
            flex: 1.6, padding: '15px 0', borderRadius: 14,
            background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
            border: 'none', color: '#000', fontSize: 15, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 24px rgba(141,198,63,0.35)',
          }}>
            {listing.buy_now ? '📞 Contact' : '📋 Book Now'}
          </button>

          {/* Rating star button */}
          <button onClick={() => onReview?.(listing)} style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: 'rgba(255,215,0,0.06)',
            border: '1.5px solid rgba(255,215,0,0.15)',
            color: '#FFD700', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ⭐ {listing.rating || ''}
          </button>
        </div>
      </div>

      {/* Popups */}
      {showKPR && <KPRCalculator open onClose={() => setShowKPR(false)} propertyPrice={listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : 0} />}
      {showBooking && <BookingRequest open onClose={() => setShowBooking(false)} listing={listing} />}
      {showProfile && <UniversalBusinessProfile
        open
        onClose={() => setShowProfile(false)}
        profile={{
          name: listing.title,
          ownerType: listing.owner_type,
          city: listing.city,
          image: listing.images?.[0],
          rating: listing.rating,
          reviewCount: listing.review_count,
          bio: listing.description,
          whatsapp: listing.whatsapp,
          category: listing.category,
        }}
        listings={SIMILAR_DEMO.filter(s => s.owner_type === listing.owner_type).slice(0, 5)}
        onChat={onChat ? () => { setShowProfile(false); onChat(listing) } : undefined}
      />}
    </div>
  )
}
