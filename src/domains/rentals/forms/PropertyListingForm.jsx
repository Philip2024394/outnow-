import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, FormFooter, ProgressBar, BuyNowFields } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'
import showroomStyles from './MotorbikeShowroom.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY DIRECTORY — showroom carousel data
   ══════════════════════════════════════════════════════════════════════════════ */
const PROPERTY_DIRECTORY = [
  { id: 'villa_sunset_bali',      name: 'Villa Sunset Bali',         type: 'Villa',     bedrooms: 3, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png', listings: 12, priceFrom: 500000, priceTo: 1500000 },
  { id: 'kos_exclusive_jakarta',  name: 'Kos Exclusive Jakarta',     type: 'Kos',       bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png', listings: 28, priceFrom: 1500000, priceTo: 3500000 },
  { id: 'studio_apartment_bandung', name: 'Studio Apartment Bandung', type: 'Studio',    bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png', listings: 18, priceFrom: 300000, priceTo: 800000 },
  { id: 'rice_field_villa_ubud',  name: 'Rice Field Villa Ubud',     type: 'Villa',     bedrooms: 2, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040', listings: 8, priceFrom: 600000, priceTo: 2000000 },
  { id: 'beachfront_bungalow',    name: 'Beachfront Bungalow',       type: 'Bungalow',  bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png', listings: 6, priceFrom: 400000, priceTo: 1200000 },
  { id: 'modern_loft_surabaya',   name: 'Modern Loft Surabaya',      type: 'Apartment', bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png', listings: 10, priceFrom: 350000, priceTo: 900000 },
  { id: 'family_house_yogya',     name: 'Family House Yogya',        type: 'House',     bedrooms: 4, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png', listings: 5, priceFrom: 400000, priceTo: 1000000 },
  { id: 'penthouse_suite',        name: 'Penthouse Suite',           type: 'Penthouse', bedrooms: 3, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040', listings: 2, priceFrom: 2000000, priceTo: 5000000 },
  { id: 'traditional_joglo',      name: 'Traditional Joglo',         type: 'House',     bedrooms: 2, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png', listings: 4, priceFrom: 500000, priceTo: 1500000 },
  { id: 'container_house',        name: 'Container House',           type: 'House',     bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png', listings: 3, priceFrom: 250000, priceTo: 700000 },
  { id: 'tiny_house',             name: 'Tiny House',                type: 'House',     bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png', listings: 7, priceFrom: 200000, priceTo: 500000 },
  { id: 'glamping_tent',          name: 'Glamping Tent',             type: 'Glamping',  bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040', listings: 9, priceFrom: 300000, priceTo: 800000 },
  { id: 'treehouse_villa',        name: 'Treehouse Villa',           type: 'Villa',     bedrooms: 1, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png', listings: 3, priceFrom: 500000, priceTo: 1500000 },
  { id: 'cliff_villa_uluwatu',    name: 'Cliff Villa Uluwatu',       type: 'Villa',     bedrooms: 4, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png', listings: 2, priceFrom: 1500000, priceTo: 5000000 },
  { id: 'pool_villa_seminyak',    name: 'Pool Villa Seminyak',       type: 'Villa',     bedrooms: 3, image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png', listings: 6, priceFrom: 800000, priceTo: 2500000 },
]

/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY OPTIONS & CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */
const PROPERTY_TYPES = ['Villa', 'Apartment', 'Kos', 'House', 'Room', 'Studio', 'Bungalow', 'Penthouse', 'Glamping']
const FURNISHED_OPTIONS = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']
const AMENITIES = ['Pool', 'AC', 'WiFi', 'Kitchen', 'Laundry', 'Parking', 'Garden', 'Security', 'CCTV', 'Hot Water', 'TV', 'Balcony', 'Rooftop']
const AMENITY_ICONS = { Pool: '🏊', AC: '❄️', WiFi: '📶', Kitchen: '🍳', Laundry: '🧺', Parking: '🅿️', Garden: '🌿', Security: '🔒', CCTV: '📹', 'Hot Water': '🚿', TV: '📺', Balcony: '🌅', Rooftop: '🏙️' }
const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5+']
const FLOOR_OPTIONS = ['Ground', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+', 'Penthouse']

function generateRef() { return 'PROP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

/* Inline field with edit button + dropdown picker + typeable input */
function PickerField({ label, value, onChange, options, placeholder, editing, setEditing, suffix, styles: s, cols }) {
  const ref = useRef(null)
  const filtered = value ? options.filter(o => o.toLowerCase().includes(value.toLowerCase())) : options
  return (
    <>
      <div className={s.inlineField}>
        <span className={s.inlineLabel}>{label}</span>
        <input
          ref={ref}
          className={`${s.inlineInput} ${!value ? s.inlineInputEmpty : ''}`}
          value={value}
          onChange={e => { onChange(e.target.value); if (!editing) setEditing(true) }}
          onFocus={() => setEditing(true)}
          onBlur={() => setTimeout(() => setEditing(false), 200)}
          placeholder={placeholder || 'Select or type'}
        />
        {suffix && value && <span className={s.inlineSuffix}>{suffix}</span>}
        <button className={s.inlineEditBtn} onClick={() => {
          if (editing) { setEditing(false) }
          else { onChange(''); setEditing(true); setTimeout(() => { ref.current?.focus() }, 50) }
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      {editing && filtered.length > 0 && (
        <div className={s.brandPicker} style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
          {filtered.map(o => {
            const isMatch = value && value.length >= 2 && o.toLowerCase().startsWith(value.toLowerCase()) && value !== o
            return <button key={o} className={`${s.brandPickerItem} ${value === o ? s.brandPickerItemActive : ''} ${isMatch ? s.brandPickerItemMatch : ''}`} onClick={() => { onChange(o); setTimeout(() => setEditing(false), 400) }}>{o}</button>
          })}
        </div>
      )}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY SHOWROOM — Stage with lighting, swipeable carousel
   ══════════════════════════════════════════════════════════════════════════════ */
function PropertyShowroom({ propType, onSelectProperty }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const lastFilledRef = useRef(-1)
  const totalProps = PROPERTY_DIRECTORY.length

  // Triple the array for infinite loop effect
  const displayProps = [...PROPERTY_DIRECTORY, ...PROPERTY_DIRECTORY, ...PROPERTY_DIRECTORY]

  // Start in the middle set on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = totalProps * scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    const realIdx = idx % totalProps
    setActiveIdx(realIdx)

    // Auto-fill on swipe
    if (realIdx !== lastFilledRef.current && PROPERTY_DIRECTORY[realIdx]) {
      lastFilledRef.current = realIdx
      onSelectProperty?.(PROPERTY_DIRECTORY[realIdx])
    }

    // Loop: if scrolled to start or end, jump to middle set
    if (idx <= 2) {
      el.scrollLeft = (totalProps + idx) * el.offsetWidth
    } else if (idx >= totalProps * 2 - 2) {
      el.scrollLeft = (totalProps + (idx - totalProps * 2)) * el.offsetWidth
    }
  }

  const currentProp = PROPERTY_DIRECTORY[activeIdx]
  const isSelected = currentProp && propType && currentProp.type.toLowerCase() === propType.toLowerCase()

  return (
    <div className={showroomStyles.stage}>
      <div className={showroomStyles.spotlightCenter} />
      <div className={showroomStyles.spotlightLeft} />
      <div className={showroomStyles.spotlightRight} />

      {/* Property carousel — all properties, swipeable */}
      <div ref={scrollRef} className={showroomStyles.carousel} onScroll={handleScroll}>
        {displayProps.map((prop, i) => (
          <div key={`${prop.id}-${i}`} className={showroomStyles.bikeSlide} onClick={() => onSelectProperty?.(prop)}>
            <img src={prop.image} alt={prop.name} className={showroomStyles.bikeImg} style={{ borderRadius: 12, objectFit: 'cover' }} />
            <div className={showroomStyles.floorGlow} />
          </div>
        ))}
      </div>

      {/* Tap to select hint */}
      {!isSelected && (
        <div style={{ textAlign: 'center', padding: '0 0 4px', fontSize: 11, color: 'rgba(141,198,63,0.4)', fontWeight: 600 }}>
          ← Swipe to browse · Tap to select →
        </div>
      )}

      {/* Property name + specs */}
      <div className={showroomStyles.bikeName}>
        <span className={showroomStyles.bikeNameBrand}>{currentProp?.type ?? ''}</span>
        <span className={showroomStyles.bikeNameModel}>{currentProp?.name ?? ''}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{currentProp?.bedrooms} BR · {currentProp?.type}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   AMENITIES BUNDLE — visual cards for included amenities
   ══════════════════════════════════════════════════════════════════════════════ */
function AmenitiesBundle({ amenities }) {
  const items = AMENITIES.map(a => ({
    icon: AMENITY_ICONS[a] || '✓',
    label: a,
    active: amenities.includes(a),
  }))
  return (
    <div className={showroomStyles.bundleGrid}>
      {items.map(item => (
        <div key={item.label} className={`${showroomStyles.bundleCard} ${item.active ? showroomStyles.bundleCardActive : ''}`}>
          <span className={showroomStyles.bundleIcon}>{item.icon}</span>
          <span className={showroomStyles.bundleLabel}>{item.label}</span>
          <span className={showroomStyles.bundleSub}>{item.active ? 'Included' : 'Not included'}</span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function PropertyListingForm({ open, onClose, onSubmit, editListing }) {
  const isEditing = !!editListing
  const propRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
  const ef = editListing?.extra_fields || {}
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState(editListing?.image || '')
  const [thumbs, setThumbs] = useState(() => editListing?.images?.slice(1) || [])
  const [title, setTitle] = useState(editListing?.title || '')
  const [desc, setDesc] = useState(editListing?.description || '')
  const [city, setCity] = useState(() => {
    if (editListing?.city) return editListing.city
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.city || '' } catch { return '' }
  })
  const [address, setAddress] = useState(ef.address || '')
  const [propType, setPropType] = useState(ef.propType || '')
  const [bedrooms, setBedrooms] = useState(ef.bedrooms || '1')
  const [bathrooms, setBathrooms] = useState(ef.bathrooms || '1')
  const [sizeSqm, setSizeSqm] = useState(ef.sizeSqm || '')
  const [furnished, setFurnished] = useState(ef.furnished || '')
  const [floorLevel, setFloorLevel] = useState(ef.floorLevel || '')
  const [amenities, setAmenities] = useState(ef.amenities || [])
  const [electricityIncluded, setElectricityIncluded] = useState(ef.electricityIncluded || false)
  const [waterIncluded, setWaterIncluded] = useState(ef.waterIncluded || false)
  const [internetIncluded, setInternetIncluded] = useState(ef.internetIncluded || false)
  const [checkIn, setCheckIn] = useState(ef.checkIn || '14:00')
  const [checkOut, setCheckOut] = useState(ef.checkOut || '12:00')
  const [maxGuests, setMaxGuests] = useState(ef.maxGuests || '2')
  const [petFriendly, setPetFriendly] = useState(ef.petFriendly || false)
  const [smokingAllowed, setSmokingAllowed] = useState(ef.smokingAllowed || false)
  const [minAge, setMinAge] = useState(ef.minAge || '18')
  const [whatsapp, setWhatsapp] = useState(() => {
    if (ef.whatsapp) return ef.whatsapp
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.whatsapp || '' } catch { return '' }
  })

  // Pricing
  const [nightly, setNightly] = useState(editListing?.price_day || '')
  const [weekly, setWeekly] = useState(editListing?.price_week || '')
  const [monthly, setMonthly] = useState(editListing?.price_month || '')
  const [yearly, setYearly] = useState(editListing?.price_year || ef.yearly || '')
  const [deposit, setDeposit] = useState(ef.deposit || '')
  const [cleaningFee, setCleaningFee] = useState(ef.cleaningFee || '')
  const [lateFee, setLateFee] = useState(ef.lateFee || '')
  const [buyNow, setBuyNow] = useState(!!editListing?.buy_now)
  const [buyNowPrice, setBuyNowPrice] = useState(editListing?.buy_now?.price || '')
  const [negotiable, setNegotiable] = useState(editListing?.buy_now?.negotiable ?? true)

  // Terms
  const [showLocalTerms, setShowLocalTerms] = useState(false)
  const [showTouristTerms, setShowTouristTerms] = useState(false)
  const [localTermsEnabled, setLocalTermsEnabled] = useState(true)
  const [touristTermsEnabled, setTouristTermsEnabled] = useState(true)
  const [showAgreementEditor, setShowAgreementEditor] = useState(false)
  const [agreementEditTab, setAgreementEditTab] = useState('local')
  const ownerProfile = useMemo(() => { try { return JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}') } catch { return {} } }, [])
  const ownerAgreementSaved = !!ownerProfile.rentalAgreement?.accepted
  const [editLocalTerms, setEditLocalTerms] = useState(ownerProfile.rentalAgreement?.local || '')
  const [editTouristTerms, setEditTouristTerms] = useState(ownerProfile.rentalAgreement?.tourist || '')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [editingType, setEditingType] = useState(false)
  const [editingFurnished, setEditingFurnished] = useState(false)
  const [editingFloor, setEditingFloor] = useState(false)
  const [editingBedrooms, setEditingBedrooms] = useState(false)
  const [editingBathrooms, setEditingBathrooms] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [previewListingIdx, setPreviewListingIdx] = useState(null)

  const DEMO_LISTINGS = [
    { ref: 'PROP-AB3K7821', category: 'Property', title: 'Villa Sunset 3BR - Seminyak', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png', price_day: '850.000', price_week: '5.000.000', price_month: '15.000.000', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { propType: 'Villa', bedrooms: '3', bathrooms: '2', amenities: ['Pool', 'AC', 'WiFi', 'Kitchen'] } },
    { ref: 'PROP-CD5M2943', category: 'Property', title: 'Kos Exclusive Jakarta Selatan', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png', price_day: '150.000', price_month: '3.500.000', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { propType: 'Kos', bedrooms: '1', bathrooms: '1', amenities: ['AC', 'WiFi', 'Laundry'] } },
    { ref: 'PROP-EF8N4567', category: 'Property', title: 'Studio Apartment Bandung', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png', price_day: '300.000', price_month: '5.000.000', status: 'offline', created_at: '2026-04-10T14:20:00Z', extra_fields: { propType: 'Studio', bedrooms: '1', bathrooms: '1', amenities: ['AC', 'WiFi', 'Parking'] } },
  ]
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_property_listings') || '[]')
      return saved.length > 0 ? saved : DEMO_LISTINGS
    } catch { return DEMO_LISTINGS }
  })

  if (!open) return null

  const autoTitle = [propType, bedrooms && `${bedrooms}BR`, city].filter(Boolean).join(' ')
  const displayTitle = title || (autoTitle ? `${autoTitle} — Rental`.trim() : '')
  const tags = [propType, bedrooms && `${bedrooms} BR`, bathrooms && `${bathrooms} BA`, `${maxGuests} guests`, furnished, petFriendly && 'Pet Friendly', ...amenities.slice(0, 3)].filter(Boolean)

  // Auto-generate description
  const autoDesc = useMemo(() => {
    if (!propType) return ''
    const loc = city ? ` in ${city}` : ''
    const br = bedrooms ? ` ${bedrooms} bedroom${Number(bedrooms) > 1 ? 's' : ''}` : ''
    const ba = bathrooms ? `, ${bathrooms} bathroom${Number(bathrooms) > 1 ? 's' : ''}` : ''
    const sz = sizeSqm ? ` (${sizeSqm} sqm)` : ''
    const furn = furnished ? ` ${furnished}.` : ''
    const amenList = amenities.length > 0 ? ` Amenities include ${amenities.slice(0, 5).join(', ')}.` : ''
    const pet = petFriendly ? ' Pet friendly.' : ''
    const utils = [electricityIncluded && 'electricity', waterIncluded && 'water', internetIncluded && 'internet'].filter(Boolean)
    const utilStr = utils.length > 0 ? ` ${utils.join(', ')} included.` : ''
    const templates = [
      `Beautiful ${propType.toLowerCase()}${br}${ba}${sz} available for rent${loc}.${furn}${amenList}${pet}${utilStr} Perfect for your stay!`,
      `${propType}${br}${ba}${loc}${sz}.${furn}${amenList}${utilStr}${pet} Available for daily, weekly or monthly rental.`,
      `Charming${br} ${propType.toLowerCase()}${loc}${sz}.${furn}${amenList}${pet}${utilStr} Great location, comfortable stay guaranteed.`,
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }, [propType, bedrooms, bathrooms, sizeSqm, furnished, amenities, city, petFriendly, electricityIncluded, waterIncluded, internetIncluded])

  const priceChange = (k, v) => {
    if (k === 'daily') setNightly(v)
    if (k === 'weekly') setWeekly(v)
    if (k === 'monthly') setMonthly(v)
    if (k === 'deposit') setDeposit(v)
    if (k === 'lateFee') setLateFee(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const listing = {
      ref: propRef, category: 'Property', title: title || autoTitle, description: desc || autoDesc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: nightly, price_week: weekly, price_month: monthly, price_year: yearly,
      buy_now: buyNow ? { price: buyNowPrice, negotiable } : null,
      extra_fields: { propType, address, bedrooms, bathrooms, sizeSqm, furnished, floorLevel, amenities, electricityIncluded, waterIncluded, internetIncluded, checkIn, checkOut, maxGuests, petFriendly, smokingAllowed, minAge, whatsapp, deposit, cleaningFee, lateFee, yearly },
      status: 'live',
      created_at: new Date().toISOString(),
    }
    // Save to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_property_listings') || '[]')
      if (isEditing) {
        const idx = saved.findIndex(l => l.ref === propRef)
        if (idx >= 0) saved[idx] = { ...saved[idx], ...listing }
        else saved.push(listing)
      } else {
        saved.push(listing)
      }
      localStorage.setItem('indoo_my_property_listings', JSON.stringify(saved))
    } catch {}
    await onSubmit?.(listing)
    setSubmitting(false); setStep(4)
    // After 5 seconds, show success
    setTimeout(() => setStep(5), 5000)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: `url(${step === 1 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png' : step === 2 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png' : step >= 4 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040' : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

      <div style={{ padding: '16px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        {/* Back button */}
        <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ width: 38, height: 38, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {/* Settings button */}
        <button onClick={() => setShowDrawer(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* Settings Side Drawer */}
      {showDrawer && (
        <>
          <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9998 }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '70%',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderLeft: '1.5px solid rgba(141,198,63,0.2)',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.08)',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.25s ease',
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } } @keyframes livePulse { 0%, 100% { opacity: 1; text-shadow: 0 0 6px rgba(141,198,63,0.8); } 50% { opacity: 0.5; text-shadow: 0 0 2px rgba(141,198,63,0.2); } }
@keyframes liveGlow { 0%, 100% { box-shadow: 0 0 8px rgba(141,198,63,0.4), inset 0 0 4px rgba(141,198,63,0.1); } 50% { box-shadow: 0 0 16px rgba(141,198,63,0.6), inset 0 0 8px rgba(141,198,63,0.15); } }`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, transparent, #8DC63F 30%, #8DC63F 70%, transparent)', pointerEvents: 'none', boxShadow: '0 0 12px rgba(141,198,63,0.4)' }} />

            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Settings</span>
              </div>
              <button onClick={() => setShowDrawer(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🏠', label: 'My Listings', sub: `${myListings.length} listing${myListings.length !== 1 ? 's' : ''}`, action: () => { setShowDrawer(false); setShowMyListings(true) } },
                { icon: '📋', label: 'Rental Agreement', sub: 'Update local & tourist terms', action: () => { setShowDrawer(false); setShowAgreementEditor(true) } },
                { icon: '📅', label: 'Booking Calendar', sub: 'View & manage bookings' },
                { icon: '📊', label: 'Rental Shop Stats', sub: 'Views, bookings & revenue' },
                { icon: '📄', label: 'Terms of Rental Service', sub: 'Policies & conditions' },
              ].map((item, i) => (
                <button key={i} onClick={() => { if (item.action) item.action(); else setShowDrawer(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '14px 12px',
                  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(141,198,63,0.12)', borderRadius: 14,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>Indoo Done Deal v1.0</span>
            </div>
          </div>
        </>
      )}

      <div className={styles.content} style={{ paddingTop: 97 }}>

        {/* ═══ STEP 4: ENTERING MARKETPLACE — ping animation ═══ */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: 40, position: 'relative' }}>
            <style>{`
              @keyframes ping { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
              @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.4); opacity: 0; } 100% { transform: scale(0.8); opacity: 0; } }
              @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            `}</style>

            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 30 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #8DC63F', animation: 'ping 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.4)', animation: 'pulseRing 2s ease-in-out infinite 0.5s' }} />
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.2)', animation: 'pulseRing 2s ease-in-out infinite 1s' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36 }}>🏠</span>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Updating Listing' : 'Property Entering Marketplace'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>
              {isEditing ? 'Saving your changes...' : 'Setting up your listing...'}
            </p>

            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.16}s` }} />
              ))}
            </div>

            <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', marginTop: 20, fontWeight: 600, letterSpacing: '0.04em' }}>REF: {propRef}</p>
          </div>
        )}

        {/* ═══ STEP 5: SUCCESS ═══ */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: 40, animation: 'fadeInScale 0.5s ease' }}>
            <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>

            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(141,198,63,0.4)', marginBottom: 24 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Listing Updated!' : 'You\'re Live!'}
            </h2>
            <p style={{ fontSize: 14, color: '#8DC63F', margin: '0 0 4px', fontWeight: 700 }}>
              {isEditing ? 'Your changes are now live on the marketplace' : 'Your property is now on the marketplace'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 30px' }}>REF: {propRef}</p>

            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 14, marginBottom: 24, width: '100%', maxWidth: 280 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{propType} {bedrooms}BR</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{city} · {furnished}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginTop: 8 }}>{nightly ? `Rp ${nightly}/night` : monthly ? `Rp ${monthly}/month` : ''}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
              <button onClick={() => { onClose('viewMarketplace') }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Live on Marketplace
              </button>
              <button onClick={() => { setMyListings(JSON.parse(localStorage.getItem('indoo_my_property_listings') || '[]')); setShowMyListings(true) }} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.25)', color: '#FFD700', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                🏠 View My Listings
              </button>
              <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 0: PROPERTY DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* ── SHOWROOM STAGE ── */}
            <PropertyShowroom propType={propType} onSelectProperty={(prop) => {
              setPropType(prop.type)
              setBedrooms(String(prop.bedrooms))
              if (!title) setTitle(prop.name)
            }} />

            {/* ── Property Details — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', marginTop: 23, boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
            <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Property Details</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Select or enter your property information</p>
            <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
            </div>

            <div className={styles.inlineGroup}>
              {/* Property Type */}
              <PickerField label="Type" value={propType} onChange={setPropType} options={PROPERTY_TYPES} placeholder="Villa" editing={editingType} setEditing={setEditingType} styles={styles} />

              {/* Bedrooms */}
              <PickerField label="Bedrooms" value={bedrooms} onChange={setBedrooms} options={BEDROOM_OPTIONS} placeholder="2" editing={editingBedrooms} setEditing={setEditingBedrooms} styles={styles} cols={5} />

              {/* Bathrooms */}
              <PickerField label="Bathrooms" value={bathrooms} onChange={setBathrooms} options={BATHROOM_OPTIONS} placeholder="1" editing={editingBathrooms} setEditing={setEditingBathrooms} styles={styles} cols={5} />

              {/* Size */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Size</span>
                <input className={`${styles.inlineInput} ${!sizeSqm ? styles.inlineInputEmpty : ''}`} value={sizeSqm} onChange={e => setSizeSqm(e.target.value.replace(/[^0-9]/g, ''))} placeholder="45" inputMode="numeric" />
                {sizeSqm && <span className={styles.inlineSuffix}>sqm</span>}
              </div>

              {/* Furnished */}
              <PickerField label="Furnished" value={furnished} onChange={setFurnished} options={FURNISHED_OPTIONS} placeholder="Fully Furnished" editing={editingFurnished} setEditing={setEditingFurnished} styles={styles} />

              {/* Floor Level — for apartments/kos */}
              {(propType === 'Apartment' || propType === 'Kos' || propType === 'Penthouse' || propType === 'Studio') && (
                <PickerField label="Floor" value={floorLevel} onChange={setFloorLevel} options={FLOOR_OPTIONS} placeholder="Ground" editing={editingFloor} setEditing={setEditingFloor} styles={styles} cols={4} />
              )}

              {/* Max Guests */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Max Guests</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setMaxGuests(String(Math.max(1, Number(maxGuests) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>-</button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{maxGuests}</span>
                  <button onClick={() => setMaxGuests(String(Math.min(20, Number(maxGuests) + 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                </div>
              </div>
            </div>

            </div>
          </div>
        )}

        {/* ═══ STEP 1: PHOTOS + INFO + AMENITIES + RULES ═══ */}
        {step === 1 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            {/* ── Photos ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Property Photos</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>No watermarks. Main + up to 4 thumbnails</p>
              <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            </div>

            {/* ── Listing Info ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Listing Info</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Title, description & contact</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              {/* Auto-filled property info */}
              {propType && (
                <div style={{ padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {propType && <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.15)' }}>{propType}</span>}
                  {bedrooms && <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F', background: 'rgba(141,198,63,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(141,198,63,0.15)' }}>{bedrooms} BR</span>}
                  {bathrooms && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{bathrooms} BA</span>}
                  {sizeSqm && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{sizeSqm} sqm</span>}
                  {furnished && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{furnished}</span>}
                </div>
              )}
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Title</span>
                  <input className={styles.inlineInput} value={title || autoTitle} onChange={e => setTitle(e.target.value)} placeholder="Villa Sunset 3BR - Seminyak" />
                </div>
                <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                  <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className={styles.inlineInput}
                      style={{ resize: 'none', minHeight: 100, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                      value={desc || autoDesc}
                      onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }}
                      placeholder="Property features, neighborhood, views..."
                      rows={5}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                    />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{(desc || autoDesc).length}/350</span>
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Location</span>
                  <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Seminyak, Bali" />
                  <button onClick={() => { setCity('Detecting...'); navigator.geolocation.getCurrentPosition(async (pos) => { try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d = await r.json(); setCity([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set') } catch { setCity('Location set') } }, () => setCity(''), { enableHighAccuracy: true, timeout: 10000 }) }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', padding: '0 0 0 8px' }}>GPS</button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Address</span>
                  <input className={styles.inlineInput} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, postal code" />
                </div>
                <div className={styles.inlineField} style={{ opacity: 0.5, pointerEvents: 'none', position: 'relative' }}>
                  <span className={styles.inlineLabel}>WhatsApp</span>
                  <input className={styles.inlineInput} value={whatsapp ? whatsapp.slice(0, 4) + '--------' : ''} readOnly placeholder="Locked" type="tel" style={{ cursor: 'not-allowed' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#FFD700', letterSpacing: '0.04em' }}>PRO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Amenities — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Amenities</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Select all amenities available</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {AMENITIES.map(a => {
                  const active = amenities.includes(a)
                  return (
                    <button key={a} onClick={() => setAmenities(prev => active ? prev.filter(x => x !== a) : [...prev, a])} style={{
                      padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                      background: active ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)',
                      border: active ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)',
                      boxShadow: active ? '0 0 12px rgba(141,198,63,0.15), inset 0 0 6px rgba(141,198,63,0.05)' : 'none',
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{AMENITY_ICONS[a]}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{a}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Utilities ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Utilities Included</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>What's included in the rental price</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Electricity</span>
                  <button onClick={() => setElectricityIncluded(!electricityIncluded)} style={{ background: 'none', border: 'none', color: electricityIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {electricityIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setElectricityIncluded(!electricityIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Water</span>
                  <button onClick={() => setWaterIncluded(!waterIncluded)} style={{ background: 'none', border: 'none', color: waterIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {waterIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setWaterIncluded(!waterIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Internet</span>
                  <button onClick={() => setInternetIncluded(!internetIncluded)} style={{ background: 'none', border: 'none', color: internetIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {internetIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setInternetIncluded(!internetIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── House Rules ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>House Rules</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Check-in/out, pets & smoking policy</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-in</span>
                  <input className={styles.inlineInput} type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-out</span>
                  <input className={styles.inlineInput} type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Min Age</span>
                  <input className={styles.inlineInput} value={minAge} onChange={e => setMinAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="18" inputMode="numeric" />
                  <span className={styles.inlineSuffix}>years</span>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Pets Allowed</span>
                  <button onClick={() => setPetFriendly(!petFriendly)} style={{ background: 'none', border: 'none', color: petFriendly ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {petFriendly ? 'Yes' : 'No'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setPetFriendly(!petFriendly)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Smoking</span>
                  <button onClick={() => setSmokingAllowed(!smokingAllowed)} style={{ background: 'none', border: 'none', color: smokingAllowed ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {smokingAllowed ? 'Allowed' : 'Not allowed'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setSmokingAllowed(!smokingAllowed)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Buy Now — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Buy Now Price</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>List your property for sale</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Price</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={buyNowPrice} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); setBuyNowPrice(raw); setBuyNow(!!raw) }} placeholder="500.000.000" inputMode="decimal" />
                </div>
                {buyNowPrice && (
                  <div style={{ padding: '4px 0 8px', fontSize: 15, fontWeight: 800, color: '#8DC63F' }}>
                    Rp {buyNowPrice}{Number(buyNowPrice.replace(/\./g, '')) >= 1000000 && ` (${Math.round(Number(buyNowPrice.replace(/\./g, '')) / 1000000)}jt)`}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ═══ STEP 2: RATES + TERMS ═══ */}
        {step === 2 && (
          <div className={styles.form} style={{ paddingTop: 70 }}>
            {/* Rental Rates */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Rental Rates</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Per night, weekly, monthly & yearly</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Night</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!nightly ? styles.inlineInputEmpty : ''}`} value={nightly} onChange={e => priceChange('daily', e.target.value.replace(/[^0-9]/g, ''))} placeholder="500000" inputMode="numeric" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Week</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={weekly} onChange={e => priceChange('weekly', e.target.value.replace(/[^0-9]/g, ''))} placeholder={nightly ? Math.round(Number(nightly) * 7 * 0.85).toLocaleString('id-ID') : '3000000'} inputMode="numeric" autoComplete="new-password" />
                  {nightly && !weekly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(nightly * 7 * 0.85).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Month</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={monthly} onChange={e => priceChange('monthly', e.target.value.replace(/[^0-9]/g, ''))} placeholder={nightly ? Math.round(Number(nightly) * 30 * 0.6).toLocaleString('id-ID') : '10000000'} inputMode="numeric" autoComplete="new-password" />
                  {nightly && !monthly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(nightly * 30 * 0.6).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Year</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={yearly} onChange={e => setYearly(e.target.value.replace(/[^0-9]/g, ''))} placeholder={monthly ? Math.round(Number(monthly) * 12 * 0.85).toLocaleString('id-ID') : '100000000'} inputMode="numeric" autoComplete="new-password" />
                  {monthly && !yearly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(monthly * 12 * 0.85).toLocaleString('id-ID')}</span>}
                </div>
              </div>
            </div>

            {/* Security & Fees */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Security & Fees</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Deposit, cleaning fee & late charges</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Security Deposit</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!deposit ? styles.inlineInputEmpty : ''}`} value={deposit} onChange={e => priceChange('deposit', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="3.000.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Cleaning Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={cleaningFee} onChange={e => setCleaningFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="200.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Late Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!lateFee ? styles.inlineInputEmpty : ''}`} value={lateFee} onChange={e => priceChange('lateFee', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="100.000" inputMode="decimal" autoComplete="new-password" />
                  <span className={styles.inlineSuffix}>/hour</span>
                </div>
              </div>
            </div>

            {/* ── Rental Terms ── */}
            {!ownerAgreementSaved && (<>
            {/* Local Rental Terms */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1.5px solid ${localTermsEnabled ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '16px 14px', boxShadow: localTermsEnabled ? '0 0 20px rgba(255,215,0,0.06)' : 'none', transition: 'all 0.25s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🇮🇩</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: localTermsEnabled ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>Local Rental</span>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0', fontWeight: 500 }}>Terms for Indonesian renters</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {localTermsEnabled && <button onClick={() => setShowLocalTerms(true)} style={{ padding: '6px 10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, color: '#FFD700', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>}
                  <button onClick={() => setLocalTermsEnabled(!localTermsEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: localTermsEnabled ? '#FFD700' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: localTermsEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tourist Rental Terms */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1.5px solid ${touristTermsEnabled ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '16px 14px', boxShadow: touristTermsEnabled ? '0 0 20px rgba(255,215,0,0.06)' : 'none', transition: 'all 0.25s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>✈️</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: touristTermsEnabled ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>Tourist Rental</span>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0', fontWeight: 500 }}>Terms for foreign renters</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {touristTermsEnabled && <button onClick={() => setShowTouristTerms(true)} style={{ padding: '6px 10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, color: '#FFD700', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>}
                  <button onClick={() => setTouristTermsEnabled(!touristTermsEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: touristTermsEnabled ? '#FFD700' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: touristTermsEnabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Local Terms Popup */}
            {showLocalTerms && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: '100%', maxWidth: 400, background: '#111', border: '1.5px solid rgba(141,198,63,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(141,198,63,0.1)' }}>
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🇮🇩</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Local Rental Terms</span>
                    </div>
                    <button onClick={() => setShowLocalTerms(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '12px 16px 16px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {['Valid KTP (National ID Card)', 'Security deposit equal to 1 month rent', 'WhatsApp contact number', 'KTP held as reference during rental', 'Minimum rental period applies', 'Tenant responsible for utility overages', 'No subletting without permission', 'Property must be returned in original condition'].map((term, i, arr) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ fontSize: 14, color: '#8DC63F', marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.4 }}>{term}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px 16px' }}>
                    <button onClick={() => setShowLocalTerms(false)} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tourist Terms Popup */}
            {showTouristTerms && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: '100%', maxWidth: 400, background: '#111', border: '1.5px solid rgba(255,215,0,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(255,215,0,0.08)' }}>
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>✈️</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#FFD700' }}>Tourist Rental Terms</span>
                    </div>
                    <button onClick={() => setShowTouristTerms(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '12px 16px 16px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {['Valid Passport (physical or copy)', 'Security deposit paid in advance', 'Bank details must match passport name', 'Proof of travel insurance recommended', 'Emergency local contact required', 'All documents must match (passport, bank)', 'Property cannot be sublet', 'Tenant responsible for damage and repairs', 'Minimum stay may apply for tourist rental', 'Late checkout charged per hour'].map((term, i, arr) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ fontSize: 14, color: '#FFD700', marginTop: 1 }}>✓</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.4 }}>{term}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px 16px' }}>
                    <button onClick={() => setShowTouristTerms(false)} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                  </div>
                </div>
              </div>
            )}
            </>)}

            {/* If agreement already saved */}
            {ownerAgreementSaved && (
              <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>Rental Agreement Saved</span>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>Update from settings menu if needed</p>
                </div>
              </div>
            )}

            {/* Agreement Editor Popup */}
            {showAgreementEditor && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: '100%', maxWidth: 420, background: '#111', border: '1.5px solid rgba(141,198,63,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(141,198,63,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>📋</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Update Rental Agreement</span>
                    </div>
                    <button onClick={() => setShowAgreementEditor(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                    <button onClick={() => setAgreementEditTab('local')} style={{ flex: 1, padding: '12px 0', background: agreementEditTab === 'local' ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', borderBottom: agreementEditTab === 'local' ? '2px solid #FFD700' : '2px solid transparent', color: agreementEditTab === 'local' ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🇮🇩 Local</button>
                    <button onClick={() => setAgreementEditTab('tourist')} style={{ flex: 1, padding: '12px 0', background: agreementEditTab === 'tourist' ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', borderBottom: agreementEditTab === 'tourist' ? '2px solid #FFD700' : '2px solid transparent', color: agreementEditTab === 'tourist' ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✈️ Tourist</button>
                  </div>
                  <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
                    <textarea value={agreementEditTab === 'local' ? editLocalTerms : editTouristTerms} onChange={e => agreementEditTab === 'local' ? setEditLocalTerms(e.target.value) : setEditTouristTerms(e.target.value)} style={{ width: '100%', minHeight: 250, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ padding: '8px 16px 16px', flexShrink: 0 }}>
                    <button onClick={() => {
                      try {
                        const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
                        p.rentalAgreement = { local: editLocalTerms, tourist: editTouristTerms, accepted: true }
                        localStorage.setItem('indoo_rental_owner', JSON.stringify(p))
                      } catch {}
                      setShowAgreementEditor(false)
                    }} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>Save Agreement</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══ STEP 3: PREVIEW ═══ */}
        {step === 3 && (
          <div className={styles.form}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className={showroomStyles.refBadge}>REF: {propRef}</span>
              <span className={showroomStyles.statusBadge}>Ready to Publish</span>
            </div>
            <PreviewCard title={displayTitle} city={city} category="Property" subType={`${propType} · ${bedrooms}BR · ${bathrooms}BA${sizeSqm ? ` · ${sizeSqm}sqm` : ''}`} price={nightly || monthly} image={mainImage} tags={tags} />
            {buyNow && buyNowPrice && <div className={showroomStyles.buyNowPreview}><span>Buy Now: Rp {Number(buyNowPrice).toLocaleString('id-ID')}{negotiable ? ' · Negotiable' : ' · Fixed'}</span></div>}

            {/* Amenities preview */}
            {amenities.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, padding: '12px 14px', marginTop: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F', margin: '0 0 8px' }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amenities.map(a => (
                    <span key={a} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{AMENITY_ICONS[a]} {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing preview */}
            <div style={{ display: 'grid', gridTemplateColumns: nightly && monthly && yearly ? '1fr 1fr 1fr 1fr' : nightly && monthly ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                nightly && { label: 'Night', price: nightly },
                weekly && { label: 'Week', price: weekly },
                monthly && { label: 'Month', price: monthly },
                yearly && { label: 'Year', price: yearly },
              ].filter(Boolean).map((p, pi) => (
                <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#8DC63F', whiteSpace: 'nowrap' }}>Rp {p.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* My Listings Popup */}
      {showMyListings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏠</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>My Listings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{myListings.length} total</span>
              </div>
            </div>
            <button onClick={() => setShowMyListings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🏠</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No listings yet</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Your published listings will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 140 }}>
                {myListings.map((l, i) => (
                  <div key={l.ref || i} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', gap: 12, padding: 12 }}>
                      {l.image ? (
                        <img src={l.image} alt="" onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer', border: '1.5px solid rgba(255,215,0,0.2)', transition: 'border-color 0.2s' }} />
                      ) : (
                        <div onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, cursor: 'pointer' }}>🏠</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.extra_fields?.propType} · {l.extra_fields?.bedrooms}BR · {l.extra_fields?.bathrooms}BA</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginTop: 4 }}>
                          {l.price_day ? `Rp ${l.price_day}/night` : l.price_month ? `Rp ${l.price_month}/month` : 'No price set'}
                        </div>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: l.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${l.status === 'live' ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`, alignSelf: 'flex-start', animation: l.status === 'live' ? 'liveGlow 2s ease-in-out infinite' : 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: l.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.05em', textTransform: 'uppercase', animation: l.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{l.status === 'live' ? 'LIVE' : 'OFFLINE'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
                      <button onClick={() => {
                        const updated = [...myListings]
                        updated[i] = { ...updated[i], status: updated[i].status === 'live' ? 'offline' : 'live' }
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      }} style={{ flex: 1, padding: '9px 0', background: '#FFD700', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(255,215,0,0.3)' }}>
                        {l.status === 'live' ? 'Offline' : 'Live'}
                      </button>
                      <button onClick={() => { setShowMyListings(false); onClose('edit', l) }} style={{ flex: 1, padding: '9px 0', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(141,198,63,0.3)' }}>
                        Edit
                      </button>
                      <button onClick={() => {
                        const updated = myListings.filter((_, j) => j !== i)
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      }} style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: 'inset 0 0 8px rgba(239,68,68,0.05)' }}>
                        Del
                      </button>
                    </div>

                    <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(141,198,63,0.4)' }}>{l.ref}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Preview Card */}
          {previewListingIdx !== null && myListings[previewListingIdx] && (() => {
            const pl = myListings[previewListingIdx]
            return (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPreviewListingIdx(null)}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
                <div onClick={e => e.stopPropagation()} style={{
                  width: '100%', maxWidth: 380,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: pl.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.status === 'live' ? 'rgba(141,198,63,0.25)' : 'rgba(239,68,68,0.3)'}`, fontSize: 9, fontWeight: 800, color: pl.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.04em', animation: pl.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{pl.status === 'live' ? 'LIVE' : 'OFFLINE'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>{pl.ref}</span>
                    </div>
                    <button onClick={() => setPreviewListingIdx(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>

                  {pl.image ? (
                    <img src={pl.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏠</div>
                  )}

                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{pl.extra_fields?.propType} <span style={{ color: '#8DC63F' }}>{pl.extra_fields?.bedrooms}BR</span></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {pl.extra_fields?.propType && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.propType}</span>}
                      {pl.extra_fields?.bedrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.bedrooms} BR</span>}
                      {pl.extra_fields?.bathrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.bathrooms} BA</span>}
                      {pl.extra_fields?.amenities?.length > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{pl.extra_fields.amenities.length} amenities</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 14px 14px', gap: 8 }}>
                    {[
                      { label: 'Night', price: pl.price_day },
                      { label: 'Week', price: pl.price_week },
                      { label: 'Month', price: pl.price_month },
                    ].map((p, pi) => (
                      <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{p.price ? `Rp ${p.price}` : '---'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                    <button onClick={() => {
                      const updated = [...myListings]
                      updated[previewListingIdx] = { ...updated[previewListingIdx], status: updated[previewListingIdx].status === 'live' ? 'offline' : 'live' }
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                    }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      {pl.status === 'live' ? 'Go Offline' : 'Go Live'}
                    </button>
                    <button onClick={() => { setPreviewListingIdx(null); setShowMyListings(false); onClose('edit', pl) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
                      Edit
                    </button>
                    <button onClick={() => {
                      const updated = myListings.filter((_, j) => j !== previewListingIdx)
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      setPreviewListingIdx(null)
                    }} style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Del
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {step <= 3 && (
        <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!propType : step === 1 ? !!title || !!autoTitle : step === 2 ? !!(nightly || monthly) : true} submitting={submitting} nextLabel={step === 3 ? 'Publish Listing' : step === 2 ? 'Preview' : step === 1 ? 'Set Pricing' : 'Next'} />
      )}
    </div>,
    document.body
  )
}
