import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TRUCK_DIRECTORY } from '@/services/vehicleDirectoryService'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, FormFooter, BuyNowFields } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'
import showroomStyles from './MotorbikeShowroom.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   TRUCK BRANDS DATABASE
   ══════════════════════════════════════════════════════════════════════════════ */
const TRUCK_BRANDS = {
  'Suzuki':   ['Carry Pickup'],
  'Daihatsu': ['Gran Max'],
  'Isuzu':    ['Elf', 'Traga', 'Giga'],
  'Mitsubishi': ['Colt Diesel', 'L300', 'Fuso'],
  'Toyota':   ['Hilux', 'Dyna'],
  'Hino':     ['Dutro', 'Ranger', '500'],
  'UD Trucks': ['Kuzer', 'Quester'],
}

const ALL_MODELS = Object.entries(TRUCK_BRANDS).flatMap(([brand, models]) => models.map(m => ({ brand, model: m })))
function findBrandByModel(v) { if (!v) return ''; const q = v.toLowerCase(); const m = ALL_MODELS.find(x => x.model.toLowerCase() === q || x.model.toLowerCase().startsWith(q)); return m?.brand ?? '' }
function getModelSuggestions(v) { if (!v || v.length < 2) return []; const q = v.toLowerCase(); return ALL_MODELS.filter(m => m.model.toLowerCase().includes(q)).slice(0, 6) }

const CC_OPTIONS = ['1500','2400','2500','2800','3000','3900','4000','4600','5000','5200','5900','6400','7700','8000','10000','12000']
const TRANS = ['Manual', 'Automatic', 'Semi-Auto']
const FUEL_POLICY = ['Fuel Included', 'Return Full', 'Pay Per Use']
const FUEL_TYPE = ['Diesel', 'Petrol']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const COLORS = ['White', 'Blue', 'Red', 'Yellow', 'Silver', 'Grey', 'Green', 'Orange', 'Black', 'Custom']
const COLOR_HEX = { Black: '#111', White: '#eee', Red: '#e53e3e', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Silver: '#a8a8a8', Grey: '#6b6b6b', Orange: '#f97316', Custom: '#8DC63F' }
const LICENSE = ['SIM B1 (Truck)', 'SIM B2 (Heavy)', 'International']
const MIN_RENTAL = ['1 day', '2 days', '3 days', '1 week', '1 month']
const PAYLOAD_OPTIONS = ['500kg', '750kg', '1 ton', '2.5 ton', '5 ton', '8 ton', '10 ton+']
const TRUCK_TYPES = ['Pickup', 'Box Truck', 'Flatbed', 'Dump Truck', 'Double Cab', 'Refrigerated', 'Tanker']
const BOX_SIZES = ['S', 'M', 'L', 'XL']
const INSURANCE_OPTIONS = ['Cargo Insurance', 'Vehicle Insurance', 'Third Party', 'None']

function generateRef() { return 'TRCK-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

/* Inline field with edit button + dropdown picker + typeable input */
function PickerField({ label, value, onChange, options, placeholder, editing, setEditing, suffix, styles: s, pickerStyles, cols }) {
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

const editSvg = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

function EditBtn({ fieldRef }) {
  return (
    <button className={styles.inlineEdit} onClick={() => {
      const input = fieldRef?.current ?? document.activeElement?.closest(`.${styles.inlineField}`)?.querySelector('input, select, textarea')
      if (input) { input.focus(); input.select?.() }
    }}>{editSvg}</button>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TRUCK SHOWROOM — Stage with lighting, swipeable carousel, stat badges
   ══════════════════════════════════════════════════════════════════════════════ */
function TruckShowroom({ brand, model, payload, truckType, onSelectTruck }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const lastFilledRef = useRef(-1)
  const totalTrucks = TRUCK_DIRECTORY.length

  // Triple the array for infinite loop effect
  const displayTrucks = [...TRUCK_DIRECTORY, ...TRUCK_DIRECTORY, ...TRUCK_DIRECTORY]

  // Start in the middle set on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = totalTrucks * scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    const realIdx = idx % totalTrucks
    setActiveIdx(realIdx)

    // Auto-fill on swipe
    if (realIdx !== lastFilledRef.current && TRUCK_DIRECTORY[realIdx]) {
      lastFilledRef.current = realIdx
      onSelectTruck?.(TRUCK_DIRECTORY[realIdx])
    }

    // Loop: if scrolled to start or end, jump to middle set
    if (idx <= 2) {
      el.scrollLeft = (totalTrucks + idx) * el.offsetWidth
    } else if (idx >= totalTrucks * 2 - 2) {
      el.scrollLeft = (totalTrucks + (idx - totalTrucks * 2)) * el.offsetWidth
    }
  }

  const currentTruck = TRUCK_DIRECTORY[activeIdx]
  const isSelected = currentTruck && brand && model && currentTruck.name.toLowerCase().includes(model.toLowerCase())

  return (
    <div className={showroomStyles.stage}>

      <div className={showroomStyles.spotlightCenter} />
      <div className={showroomStyles.spotlightLeft} />
      <div className={showroomStyles.spotlightRight} />

      {/* Truck carousel — all trucks, swipeable */}
      <div ref={scrollRef} className={showroomStyles.carousel} onScroll={handleScroll}>
        {displayTrucks.map((truck, i) => (
          <div key={`${truck.id}-${i}`} className={showroomStyles.bikeSlide} onClick={() => onSelectTruck?.(truck)}>
            <img src={truck.image} alt={truck.name} className={showroomStyles.bikeImg} style={{ height: 120, maxWidth: '80%', marginTop: 30 }} />
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

      {/* Truck name + specs in one container */}
      <div className={showroomStyles.bikeName}>
        <span className={showroomStyles.bikeNameBrand}>{currentTruck?.name.split(' ')[0] ?? ''}</span>
        <span className={showroomStyles.bikeNameModel}>{currentTruck?.name.split(' ').slice(1).join(' ') ?? ''}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{currentTruck?.cc}cc · {currentTruck?.type} · {currentTruck?.payload}</div>
      </div>


    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INCLUDED ITEMS — visual cards for truck equipment
   ══════════════════════════════════════════════════════════════════════════════ */
function IncludedBundle({ tarpaulin, ropeSet, toolKit, gps, dashCam }) {
  const items = [
    { icon: '🛡️', label: 'Tarpaulin', value: tarpaulin, sub: tarpaulin ? 'Included' : 'Not included' },
    { icon: '🪢', label: 'Rope Set', value: ropeSet, sub: ropeSet ? 'Included' : 'Not included' },
    { icon: '🔧', label: 'Tool Kit', value: toolKit, sub: toolKit ? 'Included' : 'Not included' },
    { icon: '📡', label: 'GPS Tracker', value: gps, sub: gps ? 'Included' : 'Not included' },
    { icon: '📹', label: 'Dash Cam', value: dashCam, sub: dashCam ? 'Included' : 'Not included' },
  ]
  return (
    <div className={showroomStyles.bundleGrid}>
      {items.map(item => {
        const active = item.value && item.value !== '0' && item.value !== false
        return (
          <div key={item.label} className={`${showroomStyles.bundleCard} ${active ? showroomStyles.bundleCardActive : ''}`}>
            <span className={showroomStyles.bundleIcon}>{item.icon}</span>
            <span className={showroomStyles.bundleLabel}>{item.label}</span>
            <span className={showroomStyles.bundleSub}>{item.sub}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function TruckListingForm({ open, onClose, onSubmit, editListing }) {
  const isEditing = !!editListing
  const truckRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
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
  const [make, setMake] = useState(ef.make || '')
  const [model, setModel] = useState(ef.model || '')
  const [year, setYear] = useState(ef.year || '')
  const [cc, setCc] = useState(ef.cc || '')
  const [trans, setTrans] = useState(ef.transmission || 'Manual')
  const [fuelType, setFuelType] = useState(ef.fuelType || 'Diesel')
  const [color, setColor] = useState(ef.colors || [])
  const [plateNo, setPlateNo] = useState(ef.plateNo || '')
  const [insurance, setInsurance] = useState(ef.insurance || 'None')
  const [fuelPolicy, setFuelPolicy] = useState(ef.fuelPolicy || '')
  const [condition, setCondition] = useState(editListing?.condition || ef.condition || 'Good')
  const [mileage, setMileage] = useState(ef.mileage || '')
  const [payload, setPayload] = useState(ef.payload || '')
  const [truckType, setTruckType] = useState(ef.truckType || '')
  const [boxSize, setBoxSize] = useState(ef.boxSize || '')
  const [hydraulicLift, setHydraulicLift] = useState(ef.hydraulicLift || false)
  const [withDriver, setWithDriver] = useState(ef.withDriver || false)
  const [driverFee, setDriverFee] = useState(ef.driverFee || '')
  const [tarpaulin, setTarpaulin] = useState(ef.tarpaulin || false)
  const [ropeSet, setRopeSet] = useState(ef.ropeSet || false)
  const [toolKit, setToolKit] = useState(ef.toolKit || false)
  const [gps, setGps] = useState(ef.gps || false)
  const [dashCam, setDashCam] = useState(ef.dashCam || false)
  const [delivery, setDelivery] = useState(ef.delivery || false)
  const [airportDropoff, setAirportDropoff] = useState(ef.airportDropoff || false)
  const [deliveryFee, setDeliveryFee] = useState(ef.deliveryFee || '')
  const [airportFee, setAirportFee] = useState(ef.airportFee || '')
  const [minAge, setMinAge] = useState(ef.minAge || '21')
  const [minRental, setMinRental] = useState(ef.minRental || '1 day')
  const [license, setLicense] = useState(ef.license || '')
  const [whatsapp, setWhatsapp] = useState(() => {
    if (ef.whatsapp) return ef.whatsapp
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.whatsapp || '' } catch { return '' }
  })
  const [daily, setDaily] = useState(editListing?.price_day || '')
  const [weekly, setWeekly] = useState(editListing?.price_week || '')
  const [monthly, setMonthly] = useState(editListing?.price_month || '')
  const [deposit, setDeposit] = useState(ef.deposit || '')
  const [lateFee, setLateFee] = useState(ef.lateFee || '')
  const [buyNow, setBuyNow] = useState(!!editListing?.buy_now)
  const [buyNowPrice, setBuyNowPrice] = useState(editListing?.buy_now?.price || '')
  const [negotiable, setNegotiable] = useState(editListing?.buy_now?.negotiable ?? true)
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
  const [submitting, setSubmitting] = useState(false)
  const [modelSuggestions, setModelSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showCcList, setShowCcList] = useState(false)
  const [editingBrand, setEditingBrand] = useState(false)
  const [editingModel, setEditingModel] = useState(false)
  const [editingTrans, setEditingTrans] = useState(false)
  const [editingFuel, setEditingFuel] = useState(false)
  const [editingCondition, setEditingCondition] = useState(false)
  const [editingFuelPolicy, setEditingFuelPolicy] = useState(false)
  const [editingLicense, setEditingLicense] = useState(false)
  const [editingMinRental, setEditingMinRental] = useState(false)
  const [editingColor, setEditingColor] = useState(false)
  const [editingPayload, setEditingPayload] = useState(false)
  const [editingTruckType, setEditingTruckType] = useState(false)
  const [editingBoxSize, setEditingBoxSize] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [previewListingIdx, setPreviewListingIdx] = useState(null)
  const [editingListing, setEditingListing] = useState(null)
  const DEMO_LISTINGS = [
    { ref: 'TRCK-XK2F4821', category: 'Trucks', title: 'Isuzu Traga Box 2800cc 2024', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasdasada-removebg-preview.png?updatedAt=1776113199000', price_day: '450.000', price_week: '2.800.000', price_month: '9.500.000', condition: 'Like New', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { make: 'Isuzu', model: 'Traga', cc: '2800', year: '2024', transmission: 'Manual', payload: '2.5 ton', truckType: 'Box Truck' } },
    { ref: 'TRCK-MN7P3295', category: 'Trucks', title: 'Mitsubishi Colt Diesel 4000cc 2023', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasda-removebg-preview.png?updatedAt=1776112890251', price_day: '600.000', price_week: '3.500.000', price_month: '12.000.000', condition: 'Good', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { make: 'Mitsubishi', model: 'Colt Diesel', cc: '4000', year: '2023', transmission: 'Manual', payload: '5 ton', truckType: 'Box Truck' } },
    { ref: 'TRCK-RT4K6738', category: 'Trucks', title: 'Suzuki Carry Pickup 1500cc 2024', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasd-removebg-preview.png?updatedAt=1776112751249', price_day: '250.000', price_week: '1.500.000', price_month: '5.000.000', condition: 'New', status: 'offline', created_at: '2026-04-10T14:20:00Z', extra_fields: { make: 'Suzuki', model: 'Carry Pickup', cc: '1500', year: '2024', transmission: 'Manual', payload: '750kg', truckType: 'Pickup' } },
  ]
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_truck_listings') || '[]')
      return saved.length > 0 ? saved : DEMO_LISTINGS
    } catch { return DEMO_LISTINGS }
  })
  const brandInputRef = useRef(null)
  const modelInputRef = useRef(null)

  if (!open) return null

  const autoTitle = [make, model, cc && `${cc}cc`, year].filter(Boolean).join(' ')
  const displayTitle = title || (autoTitle ? `${autoTitle} — Rental ${city || ''}`.trim() : '')
  const tags = [cc && `${cc}cc`, trans, condition, payload, truckType, fuelPolicy, withDriver && 'With Driver', delivery && 'Drop Off', insurance !== 'None' && insurance, buyNow && 'For Sale'].filter(Boolean)

  // Random description templates
  const autoDesc = useMemo(() => {
    if (!make || !model) return ''
    const truck = `${make} ${model}`
    const eng = cc ? ` ${cc}cc` : ''
    const tr = trans ? `, ${trans.toLowerCase()}` : ''
    const yr = year ? ` (${year})` : ''
    const cond = condition ? `${condition} condition` : 'well-maintained'
    const loc = city ? ` in ${city}` : ''
    const ins = insurance && insurance !== 'None' ? ` ${insurance} included.` : ''
    const pl = payload ? ` Payload capacity: ${payload}.` : ''
    const drv = withDriver ? ' Available with experienced driver.' : ''
    const del = delivery ? ' Drop off available.' : ''
    const hydr = hydraulicLift ? ' Equipped with hydraulic lift.' : ''
    const templates = [
      `${truck}${eng}${tr}${yr} available for daily, weekly or monthly rental${loc}. ${cond}, ready for heavy hauling.${ins}${pl}${drv}${del}${hydr} Perfect for logistics and moving.`,
      `Rent this ${cond} ${truck}${eng}${yr}${loc}. Powerful and reliable${tr ? ' with ' + trans.toLowerCase() + ' transmission' : ''}.${ins}${pl}${drv}${del}${hydr} Great for commercial and personal use.`,
      `${truck}${eng}${yr} — ${cond}${tr}. Available for short or long-term rental${loc}.${ins}${pl}${drv}${del}${hydr} Well-serviced and road-ready for any job.`,
      `Need a truck for hauling${loc}? This ${truck}${eng}${yr} is in ${cond} and ready to work.${tr ? ' ' + trans + ' transmission.' : ''}${ins}${pl}${drv}${del}${hydr} Book now!`,
      `${cond} ${truck}${eng}${tr}${yr}. Ideal for transport and logistics${loc}. Recently serviced.${ins}${pl}${drv}${del}${hydr} Flexible rental periods available.`,
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }, [make, model, cc, trans, year, condition, city, insurance, payload, withDriver, delivery, hydraulicLift])
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    const listing = {
      ref: truckRef, category: 'Trucks', title: title || autoTitle, description: desc || autoDesc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: daily, price_week: weekly, price_month: monthly,
      condition, buy_now: buyNow ? { price: buyNowPrice, negotiable } : null,
      extra_fields: { make, model, year, cc, transmission: trans, fuelType, colors: color, plateNo, insurance, fuelPolicy, condition, mileage, payload, truckType, boxSize, hydraulicLift, withDriver, driverFee, tarpaulin, ropeSet, toolKit, gps, dashCam, delivery, deliveryFee, airportDropoff, airportFee, minAge, license, whatsapp, deposit, lateFee },
      status: 'live',
      created_at: new Date().toISOString(),
    }
    // Save to localStorage — update if editing, add if new
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_truck_listings') || '[]')
      if (isEditing) {
        const idx = saved.findIndex(l => l.ref === truckRef)
        if (idx >= 0) saved[idx] = { ...saved[idx], ...listing }
        else saved.push(listing)
      } else {
        saved.push(listing)
      }
      localStorage.setItem('indoo_my_truck_listings', JSON.stringify(saved))
    } catch {}
    await onSubmit?.(listing)
    setSubmitting(false); setStep(4)
    // After 5 seconds, show success
    setTimeout(() => setStep(5), 5000)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: `url(${step === 1 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2004_15_20%20AM.png' : step === 2 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2004_23_29%20AM.png' : step === 3 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_45_34%20AM.png?updatedAt=1776545159845' : step >= 4 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_45_34%20AM.png?updatedAt=1776545159845' : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_42_02%20AM.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

      <div style={{ padding: '16px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        {/* Back button — left */}
        <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ width: 38, height: 38, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {/* Settings button — right */}
        <button onClick={() => setShowDrawer(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* Settings Side Drawer */}
      {showDrawer && (
        <>
          {/* Backdrop — blurred */}
          <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9998 }} />
          {/* Drawer — slides in from right, 70% width, glass background */}
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
            {/* Green edge accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, transparent, #8DC63F 30%, #8DC63F 70%, transparent)', pointerEvents: 'none', boxShadow: '0 0 12px rgba(141,198,63,0.4)' }} />

            {/* Drawer header */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Settings</span>
              </div>
              <button onClick={() => setShowDrawer(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Menu items — black glass buttons */}
            <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🚛', label: 'My Listings', sub: `${myListings.length} listing${myListings.length !== 1 ? 's' : ''}`, action: () => { setShowDrawer(false); setShowMyListings(true) } },
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

            {/* Drawer footer */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>Indoo Rentals v1.0</span>
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

            {/* Ping circles */}
            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 30 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #8DC63F', animation: 'ping 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.4)', animation: 'pulseRing 2s ease-in-out infinite 0.5s' }} />
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.2)', animation: 'pulseRing 2s ease-in-out infinite 1s' }} />
              {/* Center icon */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36 }}>🚛</span>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Updating Listing' : 'Truck Entering Marketplace'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>
              {isEditing ? 'Saving your changes...' : 'Setting up your listing...'}
            </p>

            {/* Loading dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.16}s` }} />
              ))}
            </div>

            <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', marginTop: 20, fontWeight: 600, letterSpacing: '0.04em' }}>REF: {truckRef}</p>
          </div>
        )}

        {/* ═══ STEP 5: SUCCESS — view live listing ═══ */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '0 40px', animation: 'fadeInScale 0.5s ease' }}>
            <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>

            {/* Success check */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(141,198,63,0.4)', marginBottom: 24 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Listing Updated!' : 'You\'re Live!'}
            </h2>
            <p style={{ fontSize: 14, color: '#8DC63F', margin: '0 0 4px', fontWeight: 700 }}>
              {isEditing ? 'Your changes are now live on the marketplace' : 'Your truck is now on the marketplace'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 24px' }}>REF: {truckRef}</p>

            {/* Truck info summary */}
            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 14, marginBottom: 24, width: '100%', maxWidth: 280 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{make} {model}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{cc}cc · {year} · {payload}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginTop: 8 }}>{daily ? `Rp ${daily}/day` : ''}</div>
            </div>

            {/* Action buttons — no Done button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
              <button onClick={() => { onClose('viewMarketplace') }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Live on Marketplace
              </button>
              <button onClick={() => { setMyListings(JSON.parse(localStorage.getItem('indoo_my_truck_listings') || '[]')); setShowMyListings(true) }} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.25)', color: '#FFD700', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                🚛 View My Listings
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 0: ALL DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* ── SHOWROOM STAGE ── */}
            <TruckShowroom brand={make} model={model} payload={payload} truckType={truckType} onSelectTruck={(truck) => {
              const parts = truck.name.split(' ')
              setMake(parts[0])
              setModel(parts.slice(1).join(' '))
              setCc(String(truck.cc))
              if (truck.payload) setPayload(truck.payload)
              if (truck.type) setTruckType(truck.type)
              setTrans('Manual')
            }} />

            {/* ── Truck Details — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', marginTop: 23, boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
            <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Truck Details</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Select or enter your truck information</p>
            <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
            </div>

            <div className={styles.inlineGroup}>
              {/* Brand — with edit button + brand picker grid */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Brand</span>
                <input ref={brandInputRef} className={`${styles.inlineInput} ${!make ? styles.inlineInputEmpty : ''}`} value={make} onChange={e => { setMake(e.target.value); if (!e.target.value) setEditingBrand(true) }} onFocus={() => setEditingBrand(true)} onBlur={() => setTimeout(() => setEditingBrand(false), 200)} placeholder="Select brand" />
                <button className={styles.inlineEditBtn} onClick={() => { setEditingBrand(!editingBrand); if (!editingBrand) { brandInputRef.current?.focus(); brandInputRef.current?.select() } }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {/* Brand picker grid — 3 per row */}
              {editingBrand && (
                <div className={styles.brandPicker}>
                  {Object.keys(TRUCK_BRANDS).map(b => (
                    <button key={b} className={`${styles.brandPickerItem} ${make === b ? styles.brandPickerItemActive : ''} ${make && make.length >= 2 && b.toLowerCase().startsWith(make.toLowerCase()) && make !== b ? styles.brandPickerItemMatch : ''}`} onClick={() => { setMake(b); setModel(''); setTimeout(() => setEditingBrand(false), 400) }}>
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* Model — with edit button + model picker */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Model</span>
                <input ref={modelInputRef} className={`${styles.inlineInput} ${!model ? styles.inlineInputEmpty : ''}`} value={model} onChange={e => { setModel(e.target.value); if (!e.target.value) setEditingModel(true); const b = findBrandByModel(e.target.value); if (b && !make) setMake(b) }} onFocus={() => setEditingModel(true)} onBlur={() => setTimeout(() => setEditingModel(false), 200)} placeholder="Select model" />
                <button className={styles.inlineEditBtn} onClick={() => { setEditingModel(!editingModel); if (!editingModel) { modelInputRef.current?.focus(); modelInputRef.current?.select() } }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {/* Model picker grid — filtered by brand */}
              {editingModel && make && TRUCK_BRANDS[make] && (
                <div className={styles.brandPicker}>
                  {TRUCK_BRANDS[make].filter(m => !model || m.toLowerCase().includes(model.toLowerCase())).map(m => (
                    <button key={m} className={`${styles.brandPickerItem} ${model === m ? styles.brandPickerItemActive : ''} ${model && model.length >= 2 && m.toLowerCase().startsWith(model.toLowerCase()) && model !== m ? styles.brandPickerItemMatch : ''}`} onClick={() => { setModel(m); const truck = TRUCK_DIRECTORY.find(t => t.name.toLowerCase().includes(m.toLowerCase())); if (truck) { setCc(String(truck.cc)); if (truck.payload) setPayload(truck.payload); if (truck.type) setTruckType(truck.type) } setTimeout(() => setEditingModel(false), 400) }}>
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* Engine CC — edit + picker */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Engine</span>
                <input className={`${styles.inlineInput} ${!cc ? styles.inlineInputEmpty : ''}`} value={cc} onChange={e => { setCc(e.target.value.replace(/[^0-9]/g, '')); setShowCcList(true) }} onFocus={() => setShowCcList(true)} onBlur={() => setTimeout(() => setShowCcList(false), 200)} placeholder="2800" inputMode="numeric" />
                {cc && <span className={styles.inlineSuffix}>cc</span>}
                <button className={styles.inlineEditBtn} onClick={() => { setShowCcList(!showCcList); if (showCcList) return; setCc('') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {showCcList && (
                <div className={styles.brandPicker}>
                  {(cc ? CC_OPTIONS.filter(o => o.startsWith(cc)) : CC_OPTIONS).map(o => (
                    <button key={o} className={`${styles.brandPickerItem} ${cc === o ? styles.brandPickerItemActive : ''}`} onClick={() => { setCc(o); setShowCcList(false) }}>{o}cc</button>
                  ))}
                </div>
              )}

              <PickerField label="Transmission" value={trans} onChange={setTrans} options={TRANS} placeholder="Manual" editing={editingTrans} setEditing={setEditingTrans} styles={styles} />

              {/* Payload capacity */}
              <PickerField label="Payload" value={payload} onChange={setPayload} options={PAYLOAD_OPTIONS} placeholder="2.5 ton" editing={editingPayload} setEditing={setEditingPayload} styles={styles} />

              {/* Truck type */}
              <PickerField label="Truck Type" value={truckType} onChange={setTruckType} options={TRUCK_TYPES} placeholder="Box Truck" editing={editingTruckType} setEditing={setEditingTruckType} styles={styles} />

              {/* Box size */}
              <PickerField label="Box Size" value={boxSize} onChange={setBoxSize} options={BOX_SIZES} placeholder="M" editing={editingBoxSize} setEditing={setEditingBoxSize} styles={styles} cols={4} />

              {/* Hydraulic lift */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Hydraulic Lift</span>
                <button onClick={() => setHydraulicLift(!hydraulicLift)} style={{ background: 'none', border: 'none', color: hydraulicLift ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                  {hydraulicLift ? '✓ Yes' : 'No'}
                </button>
                <button className={styles.inlineEditBtn} onClick={() => setHydraulicLift(!hydraulicLift)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Year</span>
                <input className={styles.inlineInput} value={year} onChange={e => setYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2023" inputMode="numeric" />
              </div>

              {/* Color — typeable + color dot picker */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Color</span>
                {color[0] && !editingColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: COLOR_HEX[color[0]] || '#888', boxShadow: `0 0 0 3px ${(COLOR_HEX[color[0]] || '#888')}33`, flexShrink: 0, marginRight: 6 }} />}
                <input className={`${styles.inlineInput} ${!color[0] ? styles.inlineInputEmpty : ''}`} value={color[0] ?? ''} onChange={e => { setColor(e.target.value ? [e.target.value] : []); if (!editingColor) setEditingColor(true) }} onFocus={() => setEditingColor(true)} onBlur={() => setTimeout(() => setEditingColor(false), 200)} placeholder="White" />
                <button className={styles.inlineEditBtn} onClick={() => { if (editingColor) { setEditingColor(false) } else { setColor([]); setEditingColor(true) } }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {editingColor && (
                <div className={styles.brandPicker} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {COLORS.filter(c => !color[0] || c.toLowerCase().includes((color[0] ?? '').toLowerCase())).map(c => (
                    <button key={c} className={`${styles.brandPickerItem} ${color[0] === c ? styles.brandPickerItemActive : ''}`} onClick={() => { setColor([c]); setEditingColor(false) }} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_HEX[c] || '#888', boxShadow: `0 0 0 2px ${(COLOR_HEX[c] || '#888')}44`, flexShrink: 0 }} />
                      <span style={{ fontSize: 11 }}>{c}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Mileage</span>
                <input className={styles.inlineInput} value={mileage} onChange={e => setMileage(e.target.value.replace(/[^0-9]/g, ''))} placeholder="45000" inputMode="numeric" />
                {mileage && <span className={styles.inlineSuffix}>km</span>}
              </div>

              <PickerField label="Fuel" value={fuelType} onChange={setFuelType} options={FUEL_TYPE} placeholder="Diesel" editing={editingFuel} setEditing={setEditingFuel} styles={styles} />

              <PickerField label="Condition" value={condition} onChange={setCondition} options={CONDITIONS} placeholder="Good" editing={editingCondition} setEditing={setEditingCondition} styles={styles} />

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Plate No</span>
                <input className={styles.inlineInput} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="AB 1234 CD" />
              </div>

              {/* Insurance — picker with truck-specific options */}
              <PickerField label="Insurance" value={insurance} onChange={setInsurance} options={INSURANCE_OPTIONS} placeholder="None" editing={editingInsurance} setEditing={setEditingInsurance} styles={styles} />
            </div>

            </div>

            {/* ── Driver — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', marginTop: 14, boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Driver Option</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Trucks often need specialized drivers</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>With Driver</span>
                  <button onClick={() => setWithDriver(!withDriver)} style={{ background: 'none', border: 'none', color: withDriver ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {withDriver ? '✓ Available' : 'No'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setWithDriver(!withDriver)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                {withDriver && (
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Driver Fee</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                    <input className={`${styles.inlineInput} ${!driverFee ? styles.inlineInputEmpty : ''}`} value={driverFee} onChange={e => setDriverFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="300.000" inputMode="decimal" />
                    <span className={styles.inlineSuffix}>/day</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: LISTING DETAILS ═══ */}
        {step === 1 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            {/* ── Photos ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Truck Photos</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>No names or watermarks. Main + up to 4 thumbnails</p>
              <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            </div>

            {/* ── Listing Info ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Listing Info</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Title, description & contact</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              {/* Auto-filled truck info */}
              {autoTitle && (
                <div style={{ padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {make && <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.15)' }}>{make}</span>}
                  {model && <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F', background: 'rgba(141,198,63,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(141,198,63,0.15)' }}>{model}</span>}
                  {cc && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{cc}cc</span>}
                  {year && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{year}</span>}
                  {payload && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{payload}</span>}
                </div>
              )}
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Title</span>
                  <input className={styles.inlineInput} value={title || autoTitle} onChange={e => setTitle(e.target.value)} placeholder="Isuzu Traga Box 2800cc 2024" />
                </div>
                <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                  <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className={styles.inlineInput}
                      style={{ resize: 'none', minHeight: 100, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                      value={desc || autoDesc}
                      onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }}
                      placeholder="Condition, features..."
                      rows={5}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                    />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{(desc || autoDesc).length}/350</span>
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Location</span>
                  <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Jakarta, Surabaya" />
                  <button onClick={() => { setCity('Detecting...'); navigator.geolocation.getCurrentPosition(async (pos) => { try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d = await r.json(); setCity([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set') } catch { setCity('Location set') } }, () => setCity(''), { enableHighAccuracy: true, timeout: 10000 }) }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', padding: '0 0 0 8px' }}>GPS</button>
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

            {/* ── Rental Policy ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Rental Policy</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Fuel, license & minimum rental</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              <PickerField label="Fuel Policy" value={fuelPolicy} onChange={setFuelPolicy} options={FUEL_POLICY} placeholder="Return Full" editing={editingFuelPolicy} setEditing={setEditingFuelPolicy} styles={styles} />
              <PickerField label="License" value={license} onChange={setLicense} options={LICENSE} placeholder="SIM B1 (Truck)" editing={editingLicense} setEditing={setEditingLicense} styles={styles} />

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Min Age</span>
                <input className={styles.inlineInput} value={minAge} onChange={e => setMinAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="21" inputMode="numeric" />
                <span className={styles.inlineSuffix}>years</span>
              </div>

              {/* Rental periods with pricing */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: '0.03em', marginBottom: 6, display: 'block' }}>Rental Prices</span>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>1 Day</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={`${styles.inlineInput} ${!daily ? styles.inlineInputEmpty : ''}`} value={daily} onChange={e => setDaily(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="500.000" inputMode="decimal" />
                {daily && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(daily.replace(/\./g,'')) >= 1000000 ? (Number(daily.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : daily}</span>}
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>1 Week</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={styles.inlineInput} value={weekly} onChange={e => setWeekly(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={daily ? Math.round(Number(daily.replace(/\./g,'')) * 7 * 0.85).toLocaleString('id-ID').replace(/,/g,'.') : '3.000.000'} inputMode="decimal" />
                {weekly && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(weekly.replace(/\./g,'')) >= 1000000 ? (Number(weekly.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : weekly}</span>}
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>1 Month</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={styles.inlineInput} value={monthly} onChange={e => setMonthly(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={daily ? Math.round(Number(daily.replace(/\./g,'')) * 30 * 0.7).toLocaleString('id-ID').replace(/,/g,'.') : '10.000.000'} inputMode="decimal" />
                {monthly && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(monthly.replace(/\./g,'')) >= 1000000 ? (Number(monthly.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : monthly}</span>}
              </div>
            </div>

            </div>

            {/* ── Included — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Included With Rental</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Equipment & accessories</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Tarpaulin</span>
                <button onClick={() => setTarpaulin(!tarpaulin)} style={{ background: 'none', border: 'none', color: tarpaulin ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{tarpaulin ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => setTarpaulin(!tarpaulin)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Rope Set</span>
                <button onClick={() => setRopeSet(!ropeSet)} style={{ background: 'none', border: 'none', color: ropeSet ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{ropeSet ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => setRopeSet(!ropeSet)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Tool Kit</span>
                <button onClick={() => setToolKit(!toolKit)} style={{ background: 'none', border: 'none', color: toolKit ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{toolKit ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => setToolKit(!toolKit)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>GPS Tracker</span>
                <button onClick={() => setGps(!gps)} style={{ background: 'none', border: 'none', color: gps ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{gps ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => setGps(!gps)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Dash Cam</span>
                <button onClick={() => setDashCam(!dashCam)} style={{ background: 'none', border: 'none', color: dashCam ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{dashCam ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => setDashCam(!dashCam)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </div>

            </div>

            {/* ── Drop Off — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Drop Off Service</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Delivery to customer location</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              {/* Location Drop Off */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Delivery</span>
                <button onClick={() => { setDelivery(!delivery); if (!delivery) setDeliveryFee('Free') }} style={{ background: 'none', border: 'none', color: delivery ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{delivery ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => { setDelivery(!delivery); if (!delivery) setDeliveryFee('Free') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {delivery && (
                <div style={{ padding: '4px 0 4px 8px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setDeliveryFee('Free')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: deliveryFee === 'Free' ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: deliveryFee === 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: deliveryFee === 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      {deliveryFee === 'Free' ? '✓ ' : ''}Free Drop Off
                    </button>
                    <button onClick={() => setDeliveryFee('')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: deliveryFee !== 'Free' ? '#FFD700' : 'rgba(255,255,255,0.04)', border: deliveryFee !== 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: deliveryFee !== 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      Set Price
                    </button>
                  </div>
                  {deliveryFee !== 'Free' && (
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Price</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                      <input className={styles.inlineInput} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="150.000" inputMode="decimal" />
                      {deliveryFee && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(deliveryFee.replace(/\./g,'')) >= 1000000 ? (Number(deliveryFee.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : deliveryFee}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Airport / Port Drop Off */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Port/Depot</span>
                <button onClick={() => { setAirportDropoff(!airportDropoff); if (!airportDropoff) setAirportFee('Free') }} style={{ background: 'none', border: 'none', color: airportDropoff ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{airportDropoff ? '✓ Yes' : 'No'}</button>
                <button className={styles.inlineEditBtn} onClick={() => { setAirportDropoff(!airportDropoff); if (!airportDropoff) setAirportFee('Free') }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {airportDropoff && (
                <div style={{ padding: '4px 0 4px 8px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setAirportFee('Free')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: airportFee === 'Free' ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: airportFee === 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: airportFee === 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      {airportFee === 'Free' ? '✓ ' : ''}Free Drop Off
                    </button>
                    <button onClick={() => setAirportFee('')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: airportFee !== 'Free' ? '#FFD700' : 'rgba(255,255,255,0.04)', border: airportFee !== 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: airportFee !== 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      Set Price
                    </button>
                  </div>
                  {airportFee !== 'Free' && (
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Price</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                      <input className={styles.inlineInput} value={airportFee} onChange={e => setAirportFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="200.000" inputMode="decimal" />
                      {airportFee && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(airportFee.replace(/\./g,'')) >= 1000000 ? (Number(airportFee.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : airportFee}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            </div>

            {/* ── Buy Now — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Buy Now Price</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>List your truck for sale</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Price</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                <input className={styles.inlineInput} value={buyNowPrice} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); setBuyNowPrice(raw); setBuyNow(!!raw) }} placeholder="150.000.000" inputMode="decimal" />
              </div>
              {buyNowPrice && (
                <div style={{ padding: '4px 0 8px', fontSize: 15, fontWeight: 800, color: '#8DC63F' }}>
                  Rp {buyNowPrice}{Number(buyNowPrice.replace(/\./g,'')) >= 1000000 && ` (${Math.round(Number(buyNowPrice.replace(/\./g,'')) / 1000000)}jt)`}
                </div>
              )}
            </div>
            </div>

          </div>
        )}

        {/* ═══ STEP 2: PRICING ═══ */}
        {step === 2 && (
          <div className={styles.form} style={{ paddingTop: 130 }}>
            {/* Rental Rates */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Rental Rates</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Set your daily, weekly & monthly prices</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Daily</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!daily ? styles.inlineInputEmpty : ''}`} value={daily} onChange={e => priceChange('daily', e.target.value.replace(/[^0-9]/g, ''))} placeholder="500000" inputMode="numeric" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Weekly</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={weekly} onChange={e => priceChange('weekly', e.target.value.replace(/[^0-9]/g, ''))} placeholder="3000000" inputMode="numeric" autoComplete="new-password" />
                  {daily && !weekly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(daily * 7 * 0.85).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Monthly</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={monthly} onChange={e => priceChange('monthly', e.target.value.replace(/[^0-9]/g, ''))} placeholder="10000000" inputMode="numeric" autoComplete="new-password" />
                  {daily && !monthly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(daily * 30 * 0.7).toLocaleString('id-ID')}</span>}
                </div>
              </div>
            </div>

            {/* Security & Fees */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Security & Fees</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Deposit and late return charges</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Deposit</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!deposit ? styles.inlineInputEmpty : ''}`} value={deposit} onChange={e => priceChange('deposit', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="2.000.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Late Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!lateFee ? styles.inlineInputEmpty : ''}`} value={lateFee} onChange={e => priceChange('lateFee', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="100.000" inputMode="decimal" autoComplete="new-password" />
                  <span className={styles.inlineSuffix}>/hour</span>
                </div>
              </div>
            </div>

            {/* ── Rental Terms — only show if owner hasn't saved agreement yet ── */}
            {!ownerAgreementSaved && (<>
            {/* ── Local Rental Terms — toggle + view ── */}
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


            {/* Local Terms Popup */}
            {showLocalTerms && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div style={{ width: '100%', maxWidth: 400, background: '#111', border: '1.5px solid rgba(141,198,63,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(141,198,63,0.1)' }}>
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🇮🇩</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Local Truck Rental Terms</span>
                    </div>
                    <button onClick={() => setShowLocalTerms(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '12px 16px 16px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {['Valid KTP (National ID Card)', 'SIM B1 or SIM B2 (Truck/Heavy License)', 'WhatsApp contact number', 'KTP held as collateral during rental', 'Return vehicle with full tank of diesel', 'Late return charged per hour', 'Renter responsible for all traffic violations', 'Cargo insurance recommended for high-value loads', 'Maximum payload must not be exceeded', 'Driver must be minimum 21 years old'].map((term, i, arr) => (
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

            </>)}

            {/* If agreement already saved — show small confirmation */}
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

            {/* Agreement Editor Popup — from side drawer */}
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
          <div className={styles.form} style={{ paddingTop: 80 }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.1), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className={showroomStyles.refBadge}>REF: {truckRef}</span>
                <span className={showroomStyles.statusBadge}>Ready to Publish</span>
              </div>
              <PreviewCard title={displayTitle} city={city} category="Truck" subType={`${make} ${model} · ${cc}cc · ${payload}`} price={daily} image={mainImage} tags={tags} />
              {buyNow && buyNowPrice && <div className={showroomStyles.buyNowPreview}><span>Buy Now: Rp {Number(buyNowPrice).toLocaleString('id-ID')}{negotiable ? ' · Negotiable' : ' · Fixed'}</span></div>}
            </div>
          </div>
        )}
      </div>

      {/* My Listings Popup */}
      {showMyListings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_45_34%20AM.png?updatedAt=1776545159845)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚛</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>My Truck Listings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{myListings.length} total</span>
              </div>
            </div>
            <button onClick={() => setShowMyListings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Listings */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🚛</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No listings yet</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Your published truck listings will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 140 }}>
                {myListings.map((l, i) => (
                  <div key={l.ref || i} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                    {/* Card top — image (tappable) + info */}
                    <div style={{ display: 'flex', gap: 12, padding: 12 }}>
                      {l.image ? (
                        <img src={l.image} alt="" onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer', border: '1.5px solid rgba(255,215,0,0.2)', transition: 'border-color 0.2s' }} />
                      ) : (
                        <div onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, cursor: 'pointer' }}>🚛</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.extra_fields?.make} {l.extra_fields?.model} · {l.extra_fields?.payload}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginTop: 4 }}>
                          {l.price_day ? `Rp ${l.price_day}/day` : 'No price set'}
                        </div>
                      </div>
                      {/* Status badge */}
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: l.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${l.status === 'live' ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`, alignSelf: 'flex-start', animation: l.status === 'live' ? 'liveGlow 2s ease-in-out infinite' : 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: l.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.05em', textTransform: 'uppercase', animation: l.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{l.status === 'live' ? '● Live' : '○ Offline'}</span>
                      </div>
                    </div>

                    {/* Card bottom — actions */}
                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
                      {/* Toggle live/offline */}
                      <button onClick={() => {
                        const updated = [...myListings]
                        updated[i] = { ...updated[i], status: updated[i].status === 'live' ? 'offline' : 'live' }
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_truck_listings', JSON.stringify(updated))
                      }} style={{ flex: 1, padding: '9px 0', background: '#FFD700', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(255,215,0,0.3)' }}>
                        {l.status === 'live' ? '⏸ Offline' : '▶ Live'}
                      </button>
                      {/* Edit */}
                      <button onClick={() => { setShowMyListings(false); onClose('edit', l) }} style={{ flex: 1, padding: '9px 0', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(141,198,63,0.3)' }}>
                        ✎ Edit
                      </button>
                      {/* Delete */}
                      <button onClick={() => {
                        const updated = myListings.filter((_, j) => j !== i)
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_truck_listings', JSON.stringify(updated))
                      }} style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: 'inset 0 0 8px rgba(239,68,68,0.05)' }}>
                        🗑
                      </button>
                    </div>

                    {/* Ref + date */}
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
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_45_34%20AM.png?updatedAt=1776545159845)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPreviewListingIdx(null)}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
                {/* Container window */}
                <div onClick={e => e.stopPropagation()} style={{
                  width: '100%', maxWidth: 380,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>
                  {/* Header bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: pl.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.status === 'live' ? 'rgba(141,198,63,0.25)' : 'rgba(239,68,68,0.3)'}`, fontSize: 9, fontWeight: 800, color: pl.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.04em', animation: pl.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{pl.status === 'live' ? '● LIVE' : '○ OFFLINE'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>{pl.ref}</span>
                    </div>
                    <button onClick={() => setPreviewListingIdx(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>

                  {/* Image — full width, 16:9 */}
                  {pl.image ? (
                    <img src={pl.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🚛</div>
                  )}

                  {/* Info section */}
                  <div style={{ padding: '14px 14px 10px' }}>
                    {/* Make & Model */}
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{pl.extra_fields?.make} <span style={{ color: '#8DC63F' }}>{pl.extra_fields?.model}</span></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {pl.extra_fields?.cc && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.cc}cc</span>}
                      {pl.extra_fields?.year && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.year}</span>}
                      {pl.extra_fields?.payload && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.payload}</span>}
                      {pl.extra_fields?.truckType && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.truckType}</span>}
                      {pl.condition && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{pl.condition}</span>}
                    </div>
                  </div>

                  {/* Pricing — 3 equal columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 14px 14px', gap: 8 }}>
                    {[
                      { label: '1 Day', price: pl.price_day },
                      { label: '1 Week', price: pl.price_week },
                      { label: '1 Month', price: pl.price_month },
                    ].map((p, pi) => (
                      <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{p.price ? `Rp ${p.price}` : '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                    <button onClick={() => {
                      const updated = [...myListings]
                      updated[previewListingIdx] = { ...updated[previewListingIdx], status: updated[previewListingIdx].status === 'live' ? 'offline' : 'live' }
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_truck_listings', JSON.stringify(updated))
                    }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      {pl.status === 'live' ? '⏸ Go Offline' : '▶ Go Live'}
                    </button>
                    <button onClick={() => { setPreviewListingIdx(null); setShowMyListings(false); onClose('edit', pl) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
                      ✎ Edit
                    </button>
                    <button onClick={() => {
                      const updated = myListings.filter((_, j) => j !== previewListingIdx)
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_truck_listings', JSON.stringify(updated))
                      setPreviewListingIdx(null)
                    }} style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {step <= 3 && (
        <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!(make && model && cc) : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish Listing' : step === 2 ? 'Preview →' : step === 1 ? 'Set Pricing →' : 'Next →'} />
      )}
    </div>,
    document.body
  )
}
