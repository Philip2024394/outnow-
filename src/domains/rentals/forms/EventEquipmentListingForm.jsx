import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, FormFooter, ProgressBar, BuyNowFields } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'
import showroomStyles from './MotorbikeShowroom.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   EQUIPMENT DIRECTORY — inline showroom data
   ══════════════════════════════════════════════════════════════════════════════ */
const EQUIPMENT_DIRECTORY = [
  { id: 'pa500', name: 'PA System 500W', type: 'Sound', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 300000, priceTo: 500000 },
  { id: 'pa1000', name: 'PA System 1000W', type: 'Sound', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 500000, priceTo: 800000 },
  { id: 'djctrl', name: 'DJ Controller', type: 'Sound', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 400000, priceTo: 750000 },
  { id: 'wirelessmic', name: 'Wireless Mic Set', type: 'Sound', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 150000, priceTo: 300000 },
  { id: 'ledpar', name: 'LED Par Lights', type: 'Lighting', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 200000, priceTo: 400000 },
  { id: 'movinghead', name: 'Moving Head Lights', type: 'Lighting', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 350000, priceTo: 600000 },
  { id: 'smoke', name: 'Smoke Machine', type: 'Lighting', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 100000, priceTo: 200000 },
  { id: 'stage', name: 'Stage Platform', type: 'Stage', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 1000000, priceTo: 3000000 },
  { id: 'wedarch', name: 'Wedding Arch', type: 'Decor', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 500000, priceTo: 1500000 },
  { id: 'photobooth', name: 'Photo Booth', type: 'Photography', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 1500000, priceTo: 3500000 },
  { id: 'projscreen', name: 'Projector+Screen', type: 'Photography', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 300000, priceTo: 600000 },
  { id: 'tent3', name: 'Tent 3x3m', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 200000, priceTo: 400000 },
  { id: 'tent5', name: 'Tent 5x5m', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 400000, priceTo: 800000 },
  { id: 'tent10', name: 'Tent 10x10m', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 1000000, priceTo: 2000000 },
  { id: 'roundtbl', name: 'Round Tables Set', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 300000, priceTo: 600000 },
  { id: 'chairs50', name: 'Chairs Set (50)', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 500000, priceTo: 1000000 },
  { id: 'foldtbl', name: 'Folding Tables', type: 'Furniture', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 150000, priceTo: 350000 },
  { id: 'redcarpet', name: 'Red Carpet', type: 'Decor', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 200000, priceTo: 500000 },
  { id: 'balloonarch', name: 'Balloon Arch', type: 'Decor', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 300000, priceTo: 800000 },
  { id: 'neonsign', name: 'Neon Sign Custom', type: 'Decor', image: 'https://ik.imagekit.io/nepgaxllc/placeholder-equipment.png', priceFrom: 250000, priceTo: 600000 },
]

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */
const EQUIP_CATEGORIES = ['Sound System', 'Lighting', 'Stage & Platform', 'Furniture (Tables/Chairs)', 'Decoration', 'Photography/Video', 'Tent & Canopy', 'Miscellaneous']
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const USAGE = ['Indoor', 'Outdoor', 'Both']
const POWER_OPTIONS = ['No Power Needed', '100W', '200W', '300W', '500W', '750W', '1000W', '1500W', '2000W', '3000W', '5000W']
const MIN_RENTAL = ['1 day', '3 days', '1 week']
const PRICING_MODES = ['Per Day', 'Per Event', 'Per Week']

function generateRef() { return 'EVNT-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

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
   EQUIPMENT SHOWROOM — Stage with lighting, swipeable carousel
   ══════════════════════════════════════════════════════════════════════════════ */
function EquipmentShowroom({ equipType, equipName, onSelectEquipment }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const lastFilledRef = useRef(-1)
  const totalItems = EQUIPMENT_DIRECTORY.length

  // Triple the array for infinite loop effect
  const displayItems = [...EQUIPMENT_DIRECTORY, ...EQUIPMENT_DIRECTORY, ...EQUIPMENT_DIRECTORY]

  // Start in the middle set on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = totalItems * scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    const realIdx = idx % totalItems
    setActiveIdx(realIdx)

    // Auto-fill on swipe
    if (realIdx !== lastFilledRef.current && EQUIPMENT_DIRECTORY[realIdx]) {
      lastFilledRef.current = realIdx
      onSelectEquipment?.(EQUIPMENT_DIRECTORY[realIdx])
    }

    // Loop: if scrolled to start or end, jump to middle set
    if (idx <= 2) {
      el.scrollLeft = (totalItems + idx) * el.offsetWidth
    } else if (idx >= totalItems * 2 - 2) {
      el.scrollLeft = (totalItems + (idx - totalItems * 2)) * el.offsetWidth
    }
  }

  const currentItem = EQUIPMENT_DIRECTORY[activeIdx]
  const isSelected = currentItem && equipName && currentItem.name.toLowerCase().includes(equipName.toLowerCase())

  return (
    <div className={showroomStyles.stage}>
      <div className={showroomStyles.spotlightCenter} />
      <div className={showroomStyles.spotlightLeft} />
      <div className={showroomStyles.spotlightRight} />

      {/* Equipment carousel — all items, swipeable */}
      <div ref={scrollRef} className={showroomStyles.carousel} onScroll={handleScroll}>
        {displayItems.map((item, i) => (
          <div key={`${item.id}-${i}`} className={showroomStyles.bikeSlide} onClick={() => onSelectEquipment?.(item)}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              {item.type === 'Sound' ? '🔊' : item.type === 'Lighting' ? '💡' : item.type === 'Stage' ? '🎭' : item.type === 'Decor' ? '🎀' : item.type === 'Photography' ? '📸' : item.type === 'Furniture' ? '🪑' : '🎪'}
            </div>
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

      {/* Equipment name + type */}
      <div className={showroomStyles.bikeName}>
        <span className={showroomStyles.bikeNameBrand}>{currentItem?.name ?? ''}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{currentItem?.type} · Rp {(currentItem?.priceFrom / 1000).toFixed(0)}k - {(currentItem?.priceTo / 1000).toFixed(0)}k /day</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INCLUDED BUNDLE — visual cards for event equipment extras
   ══════════════════════════════════════════════════════════════════════════════ */
function IncludedBundle({ setupIncl, operatorIncl, transportIncl, cables, extension, backup }) {
  const items = [
    { icon: '🔧', label: 'Setup', value: setupIncl, sub: setupIncl ? 'Included' : 'Not included' },
    { icon: '👨‍🔧', label: 'Operator', value: operatorIncl, sub: operatorIncl ? 'Included' : 'Not included' },
    { icon: '🚚', label: 'Transport', value: transportIncl, sub: transportIncl ? 'Included' : 'Not included' },
    { icon: '🔌', label: 'Cables', value: cables, sub: cables ? 'Included' : 'Not included' },
    { icon: '🔋', label: 'Extension', value: extension, sub: extension ? 'Included' : 'Not included' },
    { icon: '🔄', label: 'Backup Unit', value: backup, sub: backup ? 'Available' : 'Not available' },
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
   SPAM FILTER — checks listing quality
   ══════════════════════════════════════════════════════════════════════════════ */
function spamCheck(title, desc) {
  const issues = []
  if (title && title === title.toUpperCase() && title.length > 5) issues.push('Title is ALL CAPS')
  if (desc && /(.)\1{4,}/.test(desc)) issues.push('Description has repeated characters')
  if (title && /\b(free|gratis|murah banget)\b/i.test(title)) issues.push('Suspicious keywords in title')
  if (desc && desc.length < 20 && desc.length > 0) issues.push('Description too short')
  return issues
}

/* ══════════════════════════════════════════════════════════════════════════════
   WALLET COMMISSION DISPLAY
   ══════════════════════════════════════════════════════════════════════════════ */
function WalletCommission({ daily, perEvent }) {
  const price = Number(String(daily || perEvent || '0').replace(/\./g, ''))
  if (!price) return null
  const commission = Math.round(price * 0.05)
  const youGet = price - commission
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', borderRadius: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
        <span>Platform fee (5%)</span>
        <span>Rp {commission.toLocaleString('id-ID')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8DC63F', fontWeight: 800, marginTop: 4 }}>
        <span>You receive</span>
        <span>Rp {youGet.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function EventEquipmentListingForm({ open, onClose, onSubmit, editListing }) {
  const isEditing = !!editListing
  const equipRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
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
  const [equipCategory, setEquipCategory] = useState(ef.equipCategory || '')
  const [equipName, setEquipName] = useState(ef.equipName || '')
  const [brand, setBrand] = useState(ef.brand || '')
  const [model, setModel] = useState(ef.model || '')
  const [quantity, setQuantity] = useState(ef.quantity || '1')
  const [powerReq, setPowerReq] = useState(ef.powerReq || '')
  const [setupIncl, setSetupIncl] = useState(ef.setupIncl || false)
  const [operatorIncl, setOperatorIncl] = useState(ef.operatorIncl || false)
  const [operatorFee, setOperatorFee] = useState(ef.operatorFee || '')
  const [transportIncl, setTransportIncl] = useState(ef.transportIncl || false)
  const [deliveryFee, setDeliveryFee] = useState(ef.deliveryFee || '')
  const [condition, setCondition] = useState(editListing?.condition || ef.condition || 'Good')
  const [usage, setUsage] = useState(ef.usage || 'Both')
  const [cables, setCables] = useState(ef.cables || false)
  const [extension, setExtension] = useState(ef.extension || false)
  const [backup, setBackup] = useState(ef.backup || false)
  const [minRental, setMinRental] = useState(ef.minRental || '1 day')
  const [whatsapp, setWhatsapp] = useState(() => {
    if (ef.whatsapp) return ef.whatsapp
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.whatsapp || '' } catch { return '' }
  })
  const [daily, setDaily] = useState(editListing?.price_day || '')
  const [perEvent, setPerEvent] = useState(editListing?.price_event || ef.perEvent || '')
  const [weekly, setWeekly] = useState(editListing?.price_week || '')
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
  const [editingCategory, setEditingCategory] = useState(false)
  const [editingCondition, setEditingCondition] = useState(false)
  const [editingUsage, setEditingUsage] = useState(false)
  const [editingPower, setEditingPower] = useState(false)
  const [editingMinRental, setEditingMinRental] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [previewListingIdx, setPreviewListingIdx] = useState(null)
  const DEMO_LISTINGS = [
    { ref: 'EVNT-AK3F7821', category: 'Party & Event', title: 'PA System 1000W + DJ Setup', image: '', price_day: '500.000', price_event: '1.500.000', price_week: '2.800.000', condition: 'Like New', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { equipCategory: 'Sound System', equipName: 'PA System 1000W', brand: 'JBL', model: 'PartyBox 1000', quantity: '1' } },
    { ref: 'EVNT-BN8P4295', category: 'Party & Event', title: 'LED Par Lights x10 Set', image: '', price_day: '350.000', price_event: '800.000', price_week: '2.000.000', condition: 'Good', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { equipCategory: 'Lighting', equipName: 'LED Par Lights', brand: 'Generic', model: 'RGB 54', quantity: '10' } },
    { ref: 'EVNT-CT4K9738', category: 'Party & Event', title: 'Tent 10x10m White', image: '', price_day: '1.500.000', price_event: '2.000.000', price_week: '7.000.000', condition: 'Good', status: 'offline', created_at: '2026-04-10T14:20:00Z', extra_fields: { equipCategory: 'Tent & Canopy', equipName: 'Tent 10x10m', brand: '-', model: 'Heavy Duty', quantity: '1' } },
  ]
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_event_listings') || '[]')
      return saved.length > 0 ? saved : DEMO_LISTINGS
    } catch { return DEMO_LISTINGS }
  })

  if (!open) return null

  const autoTitle = [equipName, brand && brand !== '-' ? brand : '', model, quantity && Number(quantity) > 1 ? `x${quantity}` : ''].filter(Boolean).join(' ')
  const displayTitle = title || (autoTitle ? `${autoTitle} — Rental ${city || ''}`.trim() : '')
  const tags = [equipCategory, condition, usage, setupIncl && 'Setup Incl.', operatorIncl && 'Operator', transportIncl && 'Delivery', cables && 'Cables', Number(quantity) > 1 && `Qty: ${quantity}`, buyNow && 'For Sale'].filter(Boolean)

  // Auto description
  const autoDesc = useMemo(() => {
    if (!equipName) return ''
    const eq = equipName
    const br = brand && brand !== '-' ? ` (${brand} ${model || ''})`.trim() : ''
    const qty = quantity && Number(quantity) > 1 ? ` Set of ${quantity} units.` : ''
    const cond = condition ? `${condition} condition` : 'well-maintained'
    const loc = city ? ` in ${city}` : ''
    const setup = setupIncl ? ' Setup and teardown included.' : ''
    const op = operatorIncl ? ' Professional operator available.' : ''
    const trans = transportIncl ? ' Transport/delivery available.' : ''
    const pwr = powerReq && powerReq !== 'No Power Needed' ? ` Power requirement: ${powerReq}.` : ''
    const use = usage ? ` Suitable for ${usage.toLowerCase()} events.` : ''
    const templates = [
      `${eq}${br} available for daily or event rental${loc}.${qty} ${cond}, clean and ready to use.${setup}${op}${trans}${pwr}${use} Perfect for weddings, parties & corporate events!`,
      `Rent this ${cond} ${eq}${br}${loc}.${qty}${setup}${op}${trans}${pwr}${use} Great for any occasion.`,
      `${eq}${br} — ${cond}.${qty} Available for short or long-term rental${loc}.${setup}${op}${trans}${pwr}${use} Well-maintained and reliable.`,
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }, [equipName, brand, model, quantity, condition, city, setupIncl, operatorIncl, transportIncl, powerReq, usage])

  const priceChange = (k, v) => { if (k === 'daily') setDaily(v); if (k === 'perEvent') setPerEvent(v); if (k === 'weekly') setWeekly(v); if (k === 'deposit') setDeposit(v); if (k === 'lateFee') setLateFee(v) }

  // Spam filter
  const spamIssues = spamCheck(title || autoTitle, desc || autoDesc)

  const handleSubmit = async () => {
    setSubmitting(true)
    const listing = {
      ref: equipRef, category: 'Party & Event', title: title || autoTitle, description: desc || autoDesc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: daily, price_event: perEvent, price_week: weekly,
      condition, buy_now: buyNow ? { price: buyNowPrice, negotiable } : null,
      extra_fields: { equipCategory, equipName, brand, model, quantity, powerReq, setupIncl, operatorIncl, operatorFee, transportIncl, deliveryFee, condition, usage, cables, extension, backup, minRental, whatsapp, deposit, lateFee, perEvent },
      status: 'live',
      created_at: new Date().toISOString(),
    }
    // Save to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_event_listings') || '[]')
      if (isEditing) {
        const idx = saved.findIndex(l => l.ref === equipRef)
        if (idx >= 0) saved[idx] = { ...saved[idx], ...listing }
        else saved.push(listing)
      } else {
        saved.push(listing)
      }
      localStorage.setItem('indoo_event_listings', JSON.stringify(saved))
    } catch {}
    await onSubmit?.(listing)
    setSubmitting(false); setStep(4)
    // After 5 seconds, show success
    setTimeout(() => setStep(5), 5000)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: `url(${step === 1 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_56_32%20AM.png' : step === 2 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_58_15%20AM.png' : step >= 4 ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040' : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_52_45%20AM.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

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

            {/* Drawer header */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Settings</span>
              </div>
              <button onClick={() => setShowDrawer(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Menu items */}
            <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🎪', label: 'My Listings', sub: `${myListings.length} listing${myListings.length !== 1 ? 's' : ''}`, action: () => { setShowDrawer(false); setShowMyListings(true) } },
                { icon: '📋', label: 'Rental Agreement', sub: 'Update local & tourist terms', action: () => { setShowDrawer(false); setShowAgreementEditor(true) } },
                { icon: '📅', label: 'Booking Calendar', sub: 'View & manage bookings' },
                { icon: '📊', label: 'Equipment Stats', sub: 'Views, bookings & revenue' },
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

            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 30 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #8DC63F', animation: 'ping 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.4)', animation: 'pulseRing 2s ease-in-out infinite 0.5s' }} />
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.2)', animation: 'pulseRing 2s ease-in-out infinite 1s' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36 }}>🎪</span>
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Updating Listing' : 'Equipment Entering Marketplace'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>
              {isEditing ? 'Saving your changes...' : 'Setting up your listing...'}
            </p>

            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.16}s` }} />
              ))}
            </div>

            <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', marginTop: 20, fontWeight: 600, letterSpacing: '0.04em' }}>REF: {equipRef}</p>
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
              {isEditing ? 'Your changes are now live on the marketplace' : 'Your equipment is now on the marketplace'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 30px' }}>REF: {equipRef}</p>

            {/* Equipment info summary */}
            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 14, marginBottom: 24, width: '100%', maxWidth: 280 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{equipName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{brand} {model} · {equipCategory}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginTop: 8 }}>{daily ? `Rp ${daily}/day` : perEvent ? `Rp ${perEvent}/event` : ''}</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
              <button onClick={() => { onClose('viewMarketplace') }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Live on Marketplace
              </button>
              <button onClick={() => { setMyListings(JSON.parse(localStorage.getItem('indoo_event_listings') || '[]')); setShowMyListings(true) }} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.25)', color: '#FFD700', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                🎪 View My Listings
              </button>
              <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 0: EQUIPMENT DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* ── SHOWROOM STAGE ── */}
            <EquipmentShowroom equipType={equipCategory} equipName={equipName} onSelectEquipment={(item) => {
              setEquipName(item.name)
              // Map directory type to category
              const typeMap = { Sound: 'Sound System', Lighting: 'Lighting', Stage: 'Stage & Platform', Decor: 'Decoration', Photography: 'Photography/Video', Furniture: 'Tent & Canopy' }
              setEquipCategory(typeMap[item.type] || 'Miscellaneous')
            }} />

            {/* ── Equipment Details — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', marginTop: 23, boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
            <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Equipment Details</h2>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Select or enter your equipment information</p>
            <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
            </div>

            <div className={styles.inlineGroup}>
              {/* Equipment Category */}
              <PickerField label="Category" value={equipCategory} onChange={setEquipCategory} options={EQUIP_CATEGORIES} placeholder="Sound System" editing={editingCategory} setEditing={setEditingCategory} styles={styles} cols={2} />

              {/* Equipment Name */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Equipment</span>
                <input className={`${styles.inlineInput} ${!equipName ? styles.inlineInputEmpty : ''}`} value={equipName} onChange={e => setEquipName(e.target.value)} placeholder="e.g. PA System 1000W" />
              </div>

              {/* Brand */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Brand</span>
                <input className={styles.inlineInput} value={brand} onChange={e => setBrand(e.target.value)} placeholder="JBL, Yamaha, etc." />
              </div>

              {/* Model */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Model</span>
                <input className={styles.inlineInput} value={model} onChange={e => setModel(e.target.value)} placeholder="Model name" />
              </div>

              {/* Quantity */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setQuantity(String(Math.max(1, Number(quantity) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>-</button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(String(Number(quantity) + 1))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                </div>
              </div>

              {/* Power Requirement */}
              <PickerField label="Power" value={powerReq} onChange={setPowerReq} options={POWER_OPTIONS} placeholder="500W" editing={editingPower} setEditing={setEditingPower} styles={styles} cols={3} />

              {/* Condition */}
              <PickerField label="Condition" value={condition} onChange={setCondition} options={CONDITIONS} placeholder="Good" editing={editingCondition} setEditing={setEditingCondition} styles={styles} />

              {/* Usage — Indoor/Outdoor/Both */}
              <PickerField label="Usage" value={usage} onChange={setUsage} options={USAGE} placeholder="Both" editing={editingUsage} setEditing={setEditingUsage} styles={styles} />

              {/* Setup Included */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Setup Incl.</span>
                <button onClick={() => setSetupIncl(!setupIncl)} style={{ background: 'none', border: 'none', color: setupIncl ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                  {setupIncl ? '✓ Yes' : 'No'}
                </button>
                <button className={styles.inlineEditBtn} onClick={() => setSetupIncl(!setupIncl)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>

              {/* Operator Included */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Operator</span>
                <button onClick={() => setOperatorIncl(!operatorIncl)} style={{ background: 'none', border: 'none', color: operatorIncl ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                  {operatorIncl ? '✓ Yes' : 'No'}
                </button>
                <button className={styles.inlineEditBtn} onClick={() => setOperatorIncl(!operatorIncl)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {operatorIncl && (
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Op. Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                  <input className={styles.inlineInput} value={operatorFee} onChange={e => setOperatorFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="200.000" inputMode="decimal" />
                  <span className={styles.inlineSuffix}>/event</span>
                </div>
              )}

              {/* Transport Included */}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Transport</span>
                <button onClick={() => setTransportIncl(!transportIncl)} style={{ background: 'none', border: 'none', color: transportIncl ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                  {transportIncl ? '✓ Yes' : 'No'}
                </button>
                <button className={styles.inlineEditBtn} onClick={() => setTransportIncl(!transportIncl)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {transportIncl && (
                <div style={{ padding: '4px 0 4px 8px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setDeliveryFee('Free')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: deliveryFee === 'Free' ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: deliveryFee === 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: deliveryFee === 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      {deliveryFee === 'Free' ? '✓ ' : ''}Free Delivery
                    </button>
                    <button onClick={() => setDeliveryFee('')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: deliveryFee !== 'Free' && deliveryFee !== '' ? '#FFD700' : deliveryFee === '' ? '#FFD700' : 'rgba(255,255,255,0.04)', border: deliveryFee !== 'Free' ? 'none' : '1px solid rgba(255,255,255,0.08)', color: deliveryFee !== 'Free' ? '#000' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                      Set Price
                    </button>
                  </div>
                  {deliveryFee !== 'Free' && (
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Price</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                      <input className={styles.inlineInput} value={deliveryFee === 'Free' ? '' : deliveryFee} onChange={e => setDeliveryFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="100.000" inputMode="decimal" />
                    </div>
                  )}
                </div>
              )}
            </div>

            </div>
          </div>
        )}

        {/* ═══ STEP 1: PHOTOS + LISTING INFO + POLICY + INCLUDED + DELIVERY ═══ */}
        {step === 1 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            {/* ── Photos ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Equipment Photos</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>No watermarks. Main + up to 4 thumbnails</p>
              <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            </div>

            {/* ── Listing Info ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Listing Info</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Title, description & contact</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              {/* Auto-filled equipment info */}
              {autoTitle && (
                <div style={{ padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {equipCategory && <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.15)' }}>{equipCategory}</span>}
                  {equipName && <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F', background: 'rgba(141,198,63,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(141,198,63,0.15)' }}>{equipName}</span>}
                  {brand && brand !== '-' && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{brand}</span>}
                  {Number(quantity) > 1 && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>x{quantity}</span>}
                </div>
              )}
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Title</span>
                  <input className={styles.inlineInput} value={title || autoTitle} onChange={e => setTitle(e.target.value)} placeholder="PA System 1000W JBL" />
                </div>
                <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                  <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className={styles.inlineInput}
                      style={{ resize: 'none', minHeight: 100, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                      value={desc || autoDesc}
                      onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }}
                      placeholder="Equipment details, features..."
                      rows={5}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                    />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{(desc || autoDesc).length}/350</span>
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Location</span>
                  <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Bali, Jakarta" />
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
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Minimum rental & pricing mode</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              <PickerField label="Min Rental" value={minRental} onChange={setMinRental} options={MIN_RENTAL} placeholder="1 day" editing={editingMinRental} setEditing={setEditingMinRental} styles={styles} />

              {/* Rental Prices inline */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: '0.03em', marginBottom: 6, display: 'block' }}>Rental Prices</span>
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Per Day</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={`${styles.inlineInput} ${!daily ? styles.inlineInputEmpty : ''}`} value={daily} onChange={e => setDaily(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="300.000" inputMode="decimal" />
                {daily && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(daily.replace(/\./g,'')) >= 1000000 ? (Number(daily.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : daily}</span>}
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Per Event</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={styles.inlineInput} value={perEvent} onChange={e => setPerEvent(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={daily ? Math.round(Number(daily.replace(/\./g,'')) * 1.5).toLocaleString('id-ID').replace(/,/g,'.') : '500.000'} inputMode="decimal" />
                {perEvent && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(perEvent.replace(/\./g,'')) >= 1000000 ? (Number(perEvent.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : perEvent}</span>}
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Per Week</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, marginRight: 2 }}>Rp</span>
                <input className={styles.inlineInput} value={weekly} onChange={e => setWeekly(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={daily ? Math.round(Number(daily.replace(/\./g,'')) * 7 * 0.8).toLocaleString('id-ID').replace(/,/g,'.') : '1.800.000'} inputMode="decimal" />
                {weekly && <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>{Number(weekly.replace(/\./g,'')) >= 1000000 ? (Number(weekly.replace(/\./g,''))/1000000).toFixed(1).replace('.0','') + 'jt' : weekly}</span>}
              </div>
            </div>

            </div>

            {/* ── Included — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Included With Rental</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Accessories & extras included</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <IncludedBundle setupIncl={setupIncl} operatorIncl={operatorIncl} transportIncl={transportIncl} cables={cables} extension={extension} backup={backup} />
              <div className={styles.inlineGroup} style={{ marginTop: 10 }}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Cables</span>
                  <button onClick={() => setCables(!cables)} style={{ background: 'none', border: 'none', color: cables ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{cables ? '✓ Yes' : 'No'}</button>
                  <button className={styles.inlineEditBtn} onClick={() => setCables(!cables)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Extension</span>
                  <button onClick={() => setExtension(!extension)} style={{ background: 'none', border: 'none', color: extension ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{extension ? '✓ Yes' : 'No'}</button>
                  <button className={styles.inlineEditBtn} onClick={() => setExtension(!extension)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Backup Unit</span>
                  <button onClick={() => setBackup(!backup)} style={{ background: 'none', border: 'none', color: backup ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{backup ? '✓ Yes' : 'No'}</button>
                  <button className={styles.inlineEditBtn} onClick={() => setBackup(!backup)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Buy Now — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Buy Now Price</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>List your equipment for sale</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Price</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                <input className={styles.inlineInput} value={buyNowPrice} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); setBuyNowPrice(raw); setBuyNow(!!raw) }} placeholder="5.000.000" inputMode="decimal" />
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

        {/* ═══ STEP 2: PRICING & SECURITY & TERMS ═══ */}
        {step === 2 && (
          <div className={styles.form} style={{ paddingTop: 70 }}>
            {/* Rental Rates */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Rental Rates</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Set your per day, per event & weekly prices</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Day</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!daily ? styles.inlineInputEmpty : ''}`} value={daily} onChange={e => priceChange('daily', e.target.value.replace(/[^0-9]/g, ''))} placeholder="300000" inputMode="numeric" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Event</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={perEvent} onChange={e => priceChange('perEvent', e.target.value.replace(/[^0-9]/g, ''))} placeholder="500000" inputMode="numeric" autoComplete="new-password" />
                  {daily && !perEvent && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(daily * 1.5).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Week</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={weekly} onChange={e => priceChange('weekly', e.target.value.replace(/[^0-9]/g, ''))} placeholder="1800000" inputMode="numeric" autoComplete="new-password" />
                  {daily && !weekly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(daily * 7 * 0.8).toLocaleString('id-ID')}</span>}
                </div>
              </div>
              <WalletCommission daily={daily} perEvent={perEvent} />
            </div>

            {/* Security & Fees */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Security & Deposit</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Security deposit for equipment damage</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Deposit</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!deposit ? styles.inlineInputEmpty : ''}`} value={deposit} onChange={e => priceChange('deposit', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="500.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Late Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!lateFee ? styles.inlineInputEmpty : ''}`} value={lateFee} onChange={e => priceChange('lateFee', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="100.000" inputMode="decimal" autoComplete="new-password" />
                  <span className={styles.inlineSuffix}>/hour</span>
                </div>
              </div>
            </div>

            {/* Spam filter warnings */}
            {spamIssues.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', marginBottom: 6 }}>Listing Quality Issues</div>
                {spamIssues.map((issue, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', fontWeight: 500, padding: '2px 0' }}>- {issue}</div>
                ))}
              </div>
            )}

            {/* ── Rental Terms ── */}
            {!ownerAgreementSaved && (<>
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
                    {['Valid KTP (National ID Card)', 'WhatsApp contact number', 'KTP held as collateral during rental', 'Equipment must be returned in same condition', 'Renter responsible for damage during use', 'Late return charged per hour', 'No sub-renting to third parties'].map((term, i, arr) => (
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
                    {['Valid Passport (physical or copy)', 'Security deposit paid in advance', 'Bank details must match passport name', 'Proof of hotel/villa stay', 'All documents must match', 'Emergency local contact required', 'Equipment must be returned in same condition', 'Late return charged per hour', 'Renter responsible for damage and third-party costs', 'Equipment cannot leave the city'].map((term, i, arr) => (
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
              <span className={showroomStyles.refBadge}>REF: {equipRef}</span>
              <span className={showroomStyles.statusBadge}>Ready to Publish</span>
            </div>
            <PreviewCard title={displayTitle} city={city} category="Party & Event" subType={`${equipCategory} · ${equipName} · Qty: ${quantity}`} price={daily || perEvent} image={mainImage} tags={tags} />
            {buyNow && buyNowPrice && <div className={showroomStyles.buyNowPreview}><span>Buy Now: Rp {Number(buyNowPrice).toLocaleString('id-ID')}{negotiable ? ' · Negotiable' : ' · Fixed'}</span></div>}
          </div>
        )}
      </div>

      {/* My Listings Popup */}
      {showMyListings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_49_51%20AM.png?updatedAt=1776545407915)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <style>{`@keyframes livePulse { 0%, 100% { opacity: 1; text-shadow: 0 0 6px rgba(141,198,63,0.8); } 50% { opacity: 0.5; text-shadow: 0 0 2px rgba(141,198,63,0.2); } }
@keyframes liveGlow { 0%, 100% { box-shadow: 0 0 8px rgba(141,198,63,0.4), inset 0 0 4px rgba(141,198,63,0.1); } 50% { box-shadow: 0 0 16px rgba(141,198,63,0.6), inset 0 0 8px rgba(141,198,63,0.15); } }`}</style>
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎪</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>My Listings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{myListings.length} total</span>
              </div>
            </div>
            <button onClick={() => setShowMyListings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Listings */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🎪</span>
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
                        <div onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, cursor: 'pointer' }}>🎪</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.extra_fields?.equipCategory} · {l.extra_fields?.equipName}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginTop: 4 }}>
                          {l.price_day ? `Rp ${l.price_day}/day` : l.price_event ? `Rp ${l.price_event}/event` : 'No price set'}
                        </div>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: l.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${l.status === 'live' ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`, alignSelf: 'flex-start', animation: l.status === 'live' ? 'liveGlow 2s ease-in-out infinite' : 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: l.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.05em', textTransform: 'uppercase', animation: l.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{l.status === 'live' ? '● Live' : '○ Offline'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
                      <button onClick={() => {
                        const updated = [...myListings]
                        updated[i] = { ...updated[i], status: updated[i].status === 'live' ? 'offline' : 'live' }
                        setMyListings(updated)
                        localStorage.setItem('indoo_event_listings', JSON.stringify(updated))
                      }} style={{ flex: 1, padding: '9px 0', background: '#FFD700', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(255,215,0,0.3)' }}>
                        {l.status === 'live' ? '⏸ Offline' : '▶ Live'}
                      </button>
                      <button onClick={() => { setShowMyListings(false); onClose('edit', l) }} style={{ flex: 1, padding: '9px 0', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(141,198,63,0.3)' }}>
                        ✎ Edit
                      </button>
                      <button onClick={() => {
                        const updated = myListings.filter((_, j) => j !== i)
                        setMyListings(updated)
                        localStorage.setItem('indoo_event_listings', JSON.stringify(updated))
                      }} style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: 'inset 0 0 8px rgba(239,68,68,0.05)' }}>
                        🗑
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
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2003_49_51%20AM.png?updatedAt=1776545407915)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPreviewListingIdx(null)}>
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
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: pl.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.status === 'live' ? 'rgba(141,198,63,0.25)' : 'rgba(239,68,68,0.3)'}`, fontSize: 9, fontWeight: 800, color: pl.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.04em', animation: pl.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{pl.status === 'live' ? '● LIVE' : '○ OFFLINE'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>{pl.ref}</span>
                    </div>
                    <button onClick={() => setPreviewListingIdx(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>

                  {pl.image ? (
                    <img src={pl.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎪</div>
                  )}

                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{pl.extra_fields?.equipName} <span style={{ color: '#8DC63F' }}>{pl.extra_fields?.brand}</span></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {pl.extra_fields?.equipCategory && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.equipCategory}</span>}
                      {pl.extra_fields?.quantity && Number(pl.extra_fields.quantity) > 1 && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Qty: {pl.extra_fields.quantity}</span>}
                      {pl.condition && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{pl.condition}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 14px 14px', gap: 8 }}>
                    {[
                      { label: '1 Day', price: pl.price_day },
                      { label: 'Event', price: pl.price_event },
                      { label: '1 Week', price: pl.price_week },
                    ].map((p, pi) => (
                      <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{p.price ? `Rp ${p.price}` : '—'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                    <button onClick={() => {
                      const updated = [...myListings]
                      updated[previewListingIdx] = { ...updated[previewListingIdx], status: updated[previewListingIdx].status === 'live' ? 'offline' : 'live' }
                      setMyListings(updated)
                      localStorage.setItem('indoo_event_listings', JSON.stringify(updated))
                    }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      {pl.status === 'live' ? '⏸ Go Offline' : '▶ Go Live'}
                    </button>
                    <button onClick={() => { setPreviewListingIdx(null); setShowMyListings(false); onClose('edit', pl) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
                      ✎ Edit
                    </button>
                    <button onClick={() => {
                      const updated = myListings.filter((_, j) => j !== previewListingIdx)
                      setMyListings(updated)
                      localStorage.setItem('indoo_event_listings', JSON.stringify(updated))
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
        <FormFooter step={step} onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!(equipCategory && equipName) : step === 2 ? !!(daily || perEvent) : true} submitting={submitting} nextLabel={step === 3 ? 'Publish Listing' : step === 2 ? 'Preview →' : step === 1 ? 'Set Pricing →' : 'Next →'} />
      )}
    </div>,
    document.body
  )
}
