import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BIKE_DIRECTORY } from '@/services/vehicleDirectoryService'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, FormFooter, ProgressBar, BuyNowFields } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'
import showroomStyles from './MotorbikeShowroom.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   BIKE BRANDS DATABASE
   ══════════════════════════════════════════════════════════════════════════════ */
const BIKE_BRANDS = {
  'Honda':    ['Beat', 'Beat Street', 'Vario 125', 'Vario 160', 'Scoopy', 'PCX 160', 'ADV 160', 'Genio', 'Stylo 160', 'CB150R', 'CB150X', 'CBR 150R', 'CBR 250RR', 'CRF 150L', 'CRF 250L', 'CT125', 'Forza 250', 'Rebel 500', 'CB500X', 'CB650R'],
  'Yamaha':   ['NMAX 155', 'Aerox 155', 'Fazio', 'Mio M3', 'Mio S', 'Gear 125', 'Filano', 'Lexi', 'FreeGo', 'R15 V4', 'R25', 'MT-15', 'MT-25', 'XSR 155', 'XSR 900', 'XMAX 250', 'TMAX', 'WR 155'],
  'Kawasaki': ['Ninja 150', 'Ninja 250', 'Ninja 400', 'Ninja ZX-25R', 'KLX 150', 'KLX 230', 'Versys-X 250', 'Versys 650', 'W175', 'Z250', 'Z400', 'Z650', 'Z900'],
  'Suzuki':   ['Nex II', 'Address', 'Burgman Street', 'GSX-R150', 'GSX-S150', 'Satria F150', 'V-Strom 250', 'Hayabusa'],
  'Vespa':    ['Sprint 150', 'Primavera 150', 'PX 150', 'GTS 300', 'S 125', 'LX 125'],
  'TVS':      ['Apache RTR 160', 'Apache RTR 200', 'Apache RR 310', 'Ntorq'],
  'Benelli':  ['Panarea 125', 'Motobi 200', 'TNT 249S', 'Leoncino 250', 'TRK 502'],
  'Royal Enfield': ['Classic 350', 'Meteor 350', 'Himalayan', 'Hunter 350', 'Continental GT 650', 'Interceptor 650'],
  'KTM':      ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200', 'RC 390', 'Adventure 250', 'Adventure 390'],
  'BMW':      ['G 310 R', 'G 310 GS', 'C 400 X', 'F 850 GS', 'R 1250 GS', 'S 1000 RR'],
  'Harley-Davidson': ['Street 500', 'Iron 883', 'Sportster S', 'Fat Boy', 'Pan America', 'Nightster'],
  'Ducati':   ['Monster 937', 'Scrambler', 'Panigale V4', 'Multistrada V4', 'DesertX'],
  'Triumph':  ['Street Triple', 'Tiger 900', 'Bonneville T120', 'Trident 660', 'Speed 400'],
  'Husqvarna':['Svartpilen 250', 'Vitpilen 250', 'Norden 901'],
  'CFMoto':   ['250NK', '300NK', '650NK', '700CL-X'],
  'Bajaj':    ['Pulsar 150', 'Pulsar NS200', 'Dominar 400'],
  'GPX':      ['Demon 150', 'Legend 200'],
  'Viar':     ['Vortex 250', 'Cross X 200'],
}

const ALL_MODELS = Object.entries(BIKE_BRANDS).flatMap(([brand, models]) => models.map(m => ({ brand, model: m })))
function findBrandByModel(v) { if (!v) return ''; const q = v.toLowerCase(); const m = ALL_MODELS.find(x => x.model.toLowerCase() === q || x.model.toLowerCase().startsWith(q)); return m?.brand ?? '' }
function getModelSuggestions(v) { if (!v || v.length < 2) return []; const q = v.toLowerCase(); return ALL_MODELS.filter(m => m.model.toLowerCase().includes(q)).slice(0, 6) }

const CC_OPTIONS = ['50','100','110','115','125','135','150','155','160','180','200','250','300','350','400','500','600','650','750','800','900','1000','1200','1450','1800','2000']
const TRANS = ['Automatic', 'Manual', 'Semi-Auto']
const FUEL_POLICY = ['Fuel Included', 'Return Full', 'Pay Per Use']
const FUEL_TYPE = ['Petrol', 'Electric']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Silver', 'Grey', 'Orange', 'Matte Black', 'Brown', 'Custom']
const COLOR_HEX = { Black: '#111', White: '#eee', Red: '#e53e3e', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Silver: '#a8a8a8', Grey: '#6b6b6b', Orange: '#f97316', 'Matte Black': '#1a1a1a', Brown: '#8b5e3c', Custom: '#8DC63F' }
const LICENSE = ['SIM C', 'International License', 'No License Required']
const MIN_RENTAL = ['1 day', '2 days', '3 days', '1 week', '1 month']

function generateRef() { return 'BIKE-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

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
   BIKE SHOWROOM — Stage with lighting, swipeable carousel, stat badges
   ══════════════════════════════════════════════════════════════════════════════ */
function BikeShowroom({ brand, model, cc, trans, onSelectBike }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const lastFilledRef = useRef(-1)
  const totalBikes = BIKE_DIRECTORY.length

  // Triple the array for infinite loop effect
  const displayBikes = [...BIKE_DIRECTORY, ...BIKE_DIRECTORY, ...BIKE_DIRECTORY]

  // Start in the middle set on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = totalBikes * scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    const realIdx = idx % totalBikes
    setActiveIdx(realIdx)

    // Auto-fill on swipe
    if (realIdx !== lastFilledRef.current && BIKE_DIRECTORY[realIdx]) {
      lastFilledRef.current = realIdx
      onSelectBike?.(BIKE_DIRECTORY[realIdx])
    }

    // Loop: if scrolled to start or end, jump to middle set
    if (idx <= 2) {
      el.scrollLeft = (totalBikes + idx) * el.offsetWidth
    } else if (idx >= totalBikes * 2 - 2) {
      el.scrollLeft = (totalBikes + (idx - totalBikes * 2)) * el.offsetWidth
    }
  }

  const currentBike = BIKE_DIRECTORY[activeIdx]
  const isSelected = currentBike && brand && model && currentBike.name.toLowerCase().includes(model.toLowerCase())

  return (
    <div className={showroomStyles.stage}>

      <div className={showroomStyles.spotlightCenter} />
      <div className={showroomStyles.spotlightLeft} />
      <div className={showroomStyles.spotlightRight} />

      {/* Bike carousel — all bikes, swipeable */}
      <div ref={scrollRef} className={showroomStyles.carousel} onScroll={handleScroll}>
        {displayBikes.map((bike, i) => (
          <div key={`${bike.id}-${i}`} className={showroomStyles.bikeSlide} onClick={() => onSelectBike?.(bike)}>
            <img src={bike.image} alt={bike.name} className={showroomStyles.bikeImg} />
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

      {/* Bike name + specs in one container */}
      <div className={showroomStyles.bikeName}>
        <span className={showroomStyles.bikeNameBrand}>{currentBike?.name.split(' ')[0] ?? ''}</span>
        <span className={showroomStyles.bikeNameModel}>{currentBike?.name.split(' ').slice(1).join(' ') ?? ''}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{currentBike?.cc}cc · {currentBike?.type}</div>
      </div>


    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INCLUDED ITEMS — visual cards like "Extra Bundle Included"
   ══════════════════════════════════════════════════════════════════════════════ */
function IncludedBundle({ helmets, raincoat, phoneHolder, usbCharger, sideBox }) {
  const items = [
    { icon: '⛑️', label: 'Helmet', value: helmets, sub: helmets === '0' ? 'Not included' : `${helmets} included` },
    { icon: '🌧️', label: 'Raincoat', value: raincoat, sub: raincoat === '0' ? 'Not included' : `${raincoat} included` },
    { icon: '📱', label: 'Phone Stand', value: phoneHolder, sub: phoneHolder ? 'Included' : 'Not included' },
    { icon: '🔌', label: 'USB Charger', value: usbCharger, sub: usbCharger ? 'Included' : 'Not included' },
    { icon: '📦', label: 'Storage Box', value: sideBox, sub: sideBox ? 'Included' : 'Not included' },
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
export default function MotorbikeListingForm({ open, onClose, onSubmit }) {
  const bikeRef = useMemo(() => generateRef(), [])
  const [step, setStep] = useState(0)
  const [mainImage, setMainImage] = useState('')
  const [thumbs, setThumbs] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [cc, setCc] = useState('')
  const [trans, setTrans] = useState('')
  const [fuelType, setFuelType] = useState('Petrol')
  const [color, setColor] = useState([])
  const [plateNo, setPlateNo] = useState('')
  const [insurance, setInsurance] = useState(false)
  const [fuelPolicy, setFuelPolicy] = useState('')
  const [condition, setCondition] = useState('Good')
  const [mileage, setMileage] = useState('')
  const [helmets, setHelmets] = useState('2')
  const [raincoat, setRaincoat] = useState('0')
  const [delivery, setDelivery] = useState(false)
  const [airportDropoff, setAirportDropoff] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState('')
  const [airportFee, setAirportFee] = useState('')
  const [sideBox, setSideBox] = useState(false)
  const [phoneHolder, setPhoneHolder] = useState(false)
  const [usbCharger, setUsbCharger] = useState(false)
  const [minAge, setMinAge] = useState('17')
  const [minRental, setMinRental] = useState('1 day')
  const [license, setLicense] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [daily, setDaily] = useState('')
  const [weekly, setWeekly] = useState('')
  const [monthly, setMonthly] = useState('')
  const [deposit, setDeposit] = useState('')
  const [lateFee, setLateFee] = useState('')
  const [buyNow, setBuyNow] = useState(false)
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [negotiable, setNegotiable] = useState(true)
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
  const brandInputRef = useRef(null)
  const modelInputRef = useRef(null)

  if (!open) return null

  const autoTitle = [make, model, year].filter(Boolean).join(' ')
  const displayTitle = title || (autoTitle ? `${autoTitle} — Rental ${city || ''}`.trim() : '')
  const tags = [cc && `${cc}cc`, trans, condition, fuelPolicy, helmets !== '0' && `${helmets} helmet${helmets > 1 ? 's' : ''}`, delivery && 'Drop Off', insurance && 'Insured', buyNow && 'For Sale'].filter(Boolean)
  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'weekly') setWeekly(v); if (k === 'monthly') setMonthly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit?.({
      ref: bikeRef, category: 'Motorcycles', title: title || autoTitle, description: desc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: Number(daily), price_week: Number(weekly), price_month: Number(monthly),
      condition, buy_now: buyNow ? { price: Number(buyNowPrice), negotiable } : null,
      extra_fields: { make, model, year, cc, transmission: trans, fuelType, colors: color, plateNo, insurance, fuelPolicy, condition, mileage, helmets, raincoat, delivery, deliveryFee, airportDropoff, airportFee, sideBox, phoneHolder, usbCharger, minAge, minRental, license, whatsapp, deposit, lateFee },
    })
    setSubmitting(false); setStep(4)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/UntitledsadasdadsaasAS.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

      <div style={{ padding: '16px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Bike Details</span>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ width: 38, height: 38, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div className={styles.content} style={{ paddingTop: 77 }}>

        {step === 4 && (
          <div className={styles.done}>
            <span className={styles.doneIcon}>🎉</span>
            <h2 className={styles.doneTitle}>Listing Published!</h2>
            <p className={styles.doneSub}>Ref: {bikeRef}</p>
            <p className={styles.doneSub}>Your motorbike rental is now live.</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

        {/* ═══ STEP 0: ALL DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* ── SHOWROOM STAGE ── */}
            <BikeShowroom brand={make} model={model} cc={cc} trans={trans} onSelectBike={(bike) => {
              const parts = bike.name.split(' ')
              setMake(parts[0])
              setModel(parts.slice(1).join(' '))
              setCc(String(bike.cc))
              if (bike.type === 'Matic' || bike.type === 'Classic') setTrans('Automatic')
              else if (bike.type === 'Sport' || bike.type === 'Naked Sport' || bike.type === 'Trail') setTrans('Manual')
              else setTrans('')
            }} />

            {/* ── Motor Bike Details — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '16px 14px', marginTop: 23 }}>
            <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0 }}>Motor Bike Details</h2>

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
                  {Object.keys(BIKE_BRANDS).map(b => (
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
              {/* Model picker grid — 3 per row, filtered by brand */}
              {editingModel && make && BIKE_BRANDS[make] && (
                <div className={styles.brandPicker}>
                  {BIKE_BRANDS[make].filter(m => !model || m.toLowerCase().includes(model.toLowerCase())).map(m => (
                    <button key={m} className={`${styles.brandPickerItem} ${model === m ? styles.brandPickerItemActive : ''} ${model && model.length >= 2 && m.toLowerCase().startsWith(model.toLowerCase()) && model !== m ? styles.brandPickerItemMatch : ''}`} onClick={() => { setModel(m); const bike = BIKE_DIRECTORY.find(b => b.name.toLowerCase().includes(m.toLowerCase())); if (bike) setCc(String(bike.cc)); setTimeout(() => setEditingModel(false), 400) }}>
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* Engine CC — edit + picker */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Engine</span>
                <input className={`${styles.inlineInput} ${!cc ? styles.inlineInputEmpty : ''}`} value={cc} onChange={e => { setCc(e.target.value.replace(/[^0-9]/g, '')); setShowCcList(true) }} onFocus={() => setShowCcList(true)} onBlur={() => setTimeout(() => setShowCcList(false), 200)} placeholder="150" inputMode="numeric" />
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

              <PickerField label="Transmission" value={trans} onChange={setTrans} options={TRANS} placeholder="Automatic" editing={editingTrans} setEditing={setEditingTrans} styles={styles} />

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Year</span>
                <input className={styles.inlineInput} value={year} onChange={e => setYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2023" inputMode="numeric" />
              </div>

              {/* Color — typeable + color dot picker */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Color</span>
                {color[0] && !editingColor && <span style={{ width: 14, height: 14, borderRadius: '50%', background: COLOR_HEX[color[0]] || '#888', boxShadow: `0 0 0 3px ${(COLOR_HEX[color[0]] || '#888')}33`, flexShrink: 0, marginRight: 6 }} />}
                <input className={`${styles.inlineInput} ${!color[0] ? styles.inlineInputEmpty : ''}`} value={color[0] ?? ''} onChange={e => { setColor(e.target.value ? [e.target.value] : []); if (!editingColor) setEditingColor(true) }} onFocus={() => setEditingColor(true)} onBlur={() => setTimeout(() => setEditingColor(false), 200)} placeholder="Black" />
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
                <input className={styles.inlineInput} value={mileage} onChange={e => setMileage(e.target.value.replace(/[^0-9]/g, ''))} placeholder="12000" inputMode="numeric" />
                {mileage && <span className={styles.inlineSuffix}>km</span>}
              </div>

              <PickerField label="Fuel" value={fuelType} onChange={setFuelType} options={FUEL_TYPE} placeholder="Petrol" editing={editingFuel} setEditing={setEditingFuel} styles={styles} />

              <PickerField label="Condition" value={condition} onChange={setCondition} options={CONDITIONS} placeholder="Good" editing={editingCondition} setEditing={setEditingCondition} styles={styles} />

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Plate No</span>
                <input className={styles.inlineInput} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="AB 1234 CD" />
              </div>

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Insurance</span>
                <button onClick={() => setInsurance(!insurance)} style={{ background: 'none', border: 'none', color: insurance ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                  {insurance ? '✓ Yes' : 'No'}
                </button>
                <button className={styles.inlineEditBtn} onClick={() => setInsurance(!insurance)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </div>

            </div>
          </div>
        )}

        {/* ═══ STEP 1: LISTING DETAILS ═══ */}
        {step === 1 && (
          <div className={styles.form}>
            <Section icon="📸" title="Bike Photos" sub="No names or watermarks. Main + up to 4 thumbnails" />
            <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />

            {/* ── Listing Info — inline ── */}
            <h2 className={styles.inlineGroupTitle}>Listing Info</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Title</span>
                <input className={styles.inlineInput} value={title} onChange={e => setTitle(e.target.value)} placeholder={autoTitle || 'Honda Beat 2023'} />
              </div>

              <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                <div style={{ flex: 1 }}>
                  <textarea className={styles.inlineInput} style={{ resize: 'none', minHeight: 60, display: 'block', width: '100%' }} value={desc} onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }} placeholder="Condition, features..." rows={3} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{desc.length}/350</span>
                </div>
              </div>

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Location</span>
                <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Bali, Yogyakarta" />
                <button onClick={() => { setCity('Detecting...'); navigator.geolocation.getCurrentPosition(async (pos) => { try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d = await r.json(); setCity([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set') } catch { setCity('Location set') } }, () => setCity(''), { enableHighAccuracy: true, timeout: 10000 }) }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', padding: '0 0 0 8px' }}>📍 GPS</button>
              </div>

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>WhatsApp</span>
                <input className={styles.inlineInput} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" />
              </div>
            </div>

            {/* ── Rental Policy — inline ── */}
            <h2 className={styles.inlineGroupTitle}>Rental Policy</h2>
            <div className={styles.inlineGroup}>
              <PickerField label="Fuel Policy" value={fuelPolicy} onChange={setFuelPolicy} options={FUEL_POLICY} placeholder="Return Full" editing={editingFuelPolicy} setEditing={setEditingFuelPolicy} styles={styles} />
              <PickerField label="License" value={license} onChange={setLicense} options={LICENSE} placeholder="SIM C" editing={editingLicense} setEditing={setEditingLicense} styles={styles} />

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Min Age</span>
                <input className={styles.inlineInput} value={minAge} onChange={e => setMinAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="17" inputMode="numeric" />
                <span className={styles.inlineSuffix}>years</span>
              </div>

              <PickerField label="Min Rental" value={minRental} onChange={setMinRental} options={MIN_RENTAL} placeholder="1 day" editing={editingMinRental} setEditing={setEditingMinRental} styles={styles} />
            </div>

            {/* ── Included — inline with +/- counters ── */}
            <h2 className={styles.inlineGroupTitle}>Included With Rental</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Helmets</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setHelmets(String(Math.max(0, Number(helmets) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{helmets}</span>
                  <button onClick={() => setHelmets(String(Math.min(3, Number(helmets) + 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                </div>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Raincoat</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setRaincoat(String(Math.max(0, Number(raincoat) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{raincoat}</span>
                  <button onClick={() => setRaincoat(String(Math.min(3, Number(raincoat) + 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                </div>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Phone Stand</span>
                <button onClick={() => setPhoneHolder(!phoneHolder)} style={{ background: 'none', border: 'none', color: phoneHolder ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{phoneHolder ? '✓ Yes' : 'No'}</button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>USB Charger</span>
                <button onClick={() => setUsbCharger(!usbCharger)} style={{ background: 'none', border: 'none', color: usbCharger ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{usbCharger ? '✓ Yes' : 'No'}</button>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Storage Box</span>
                <button onClick={() => setSideBox(!sideBox)} style={{ background: 'none', border: 'none', color: sideBox ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{sideBox ? '✓ Yes' : 'No'}</button>
              </div>
            </div>

            {/* ── Drop Off — inline ── */}
            <h2 className={styles.inlineGroupTitle}>Drop Off Service</h2>
            <p className={styles.inlineGroupSub}>Prepare documents in advance</p>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Hotel / Villa</span>
                <button onClick={() => setDelivery(!delivery)} style={{ background: 'none', border: 'none', color: delivery ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{delivery ? '✓ Yes' : 'No'}</button>
              </div>
              {delivery && (
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Fee</span>
                  <button onClick={() => setDeliveryFee(deliveryFee === 'Free' ? '' : 'Free')} style={{ background: 'none', border: 'none', color: deliveryFee === 'Free' ? '#8DC63F' : '#EF4444', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: '0 12px 0 0' }}>{deliveryFee === 'Free' ? '✓ Free' : 'Free'}</button>
                  <input className={styles.inlineInput} value={deliveryFee === 'Free' ? '' : deliveryFee} onChange={e => setDeliveryFee(e.target.value.replace(/[^0-9]/g, ''))} placeholder="price" inputMode="numeric" style={{ maxWidth: 100 }} />
                  {deliveryFee && deliveryFee !== 'Free' && <span className={styles.inlineSuffix}>Rp</span>}
                </div>
              )}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Airport</span>
                <button onClick={() => setAirportDropoff(!airportDropoff)} style={{ background: 'none', border: 'none', color: airportDropoff ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{airportDropoff ? '✓ Yes' : 'No'}</button>
              </div>
              {airportDropoff && (
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Fee</span>
                  <button onClick={() => setAirportFee(airportFee === 'Free' ? '' : 'Free')} style={{ background: 'none', border: 'none', color: airportFee === 'Free' ? '#8DC63F' : '#EF4444', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: '0 12px 0 0' }}>{airportFee === 'Free' ? '✓ Free' : 'Free'}</button>
                  <input className={styles.inlineInput} value={airportFee === 'Free' ? '' : airportFee} onChange={e => setAirportFee(e.target.value.replace(/[^0-9]/g, ''))} placeholder="price" inputMode="numeric" style={{ maxWidth: 100 }} />
                  {airportFee && airportFee !== 'Free' && <span className={styles.inlineSuffix}>Rp</span>}
                </div>
              )}
            </div>

            {/* ── Buy Now — inline ── */}
            <h2 className={styles.inlineGroupTitle}>Buy Now Price</h2>
            <p className={styles.inlineGroupSub}>List your motor bike for sale</p>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Price</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                <input className={styles.inlineInput} value={buyNowPrice} onChange={e => { const raw = e.target.value.replace(/[^0-9]/g, ''); setBuyNowPrice(raw); setBuyNow(!!raw) }} placeholder="13000000" inputMode="numeric" />
              </div>
              {buyNowPrice && (
                <div style={{ padding: '4px 0 8px', fontSize: 15, fontWeight: 800, color: '#8DC63F' }}>
                  Rp {Number(buyNowPrice).toLocaleString('id-ID')}{Number(buyNowPrice) >= 1000000 && ` (${(Number(buyNowPrice) / 1000000).toFixed(1).replace('.0', '')}jt)`}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══ STEP 1: PRICING ═══ */}
        {step === 2 && <div className={styles.form}><PriceFields daily={daily} weekly={weekly} monthly={monthly} deposit={deposit} lateFee={lateFee} onChange={priceChange} /></div>}

        {/* ═══ STEP 2: PREVIEW ═══ */}
        {step === 3 && (
          <div className={styles.form}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className={showroomStyles.refBadge}>REF: {bikeRef}</span>
              <span className={showroomStyles.statusBadge}>Ready to Publish</span>
            </div>
            <PreviewCard title={displayTitle} city={city} category="Motorbike" subType={`${make} ${model} · ${cc}cc · ${year}`} price={daily} image={mainImage} tags={tags} />
            {buyNow && buyNowPrice && <div className={showroomStyles.buyNowPreview}><span>Buy Now: Rp {Number(buyNowPrice).toLocaleString('id-ID')}{negotiable ? ' · Negotiable' : ' · Fixed'}</span></div>}
          </div>
        )}
      </div>

      {step < 4 && (
        <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!(make && model && cc) : step === 2 ? !!daily : true} submitting={submitting} nextLabel={step === 3 ? 'Publish Listing' : step === 2 ? 'Preview →' : step === 1 ? 'Set Pricing →' : 'Next →'} />
      )}
    </div>,
    document.body
  )
}
