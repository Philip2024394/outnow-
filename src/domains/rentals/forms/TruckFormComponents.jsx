import { useState, useRef, useEffect } from 'react'
import { TRUCK_DIRECTORY } from '@/services/vehicleDirectoryService'
import showroomStyles from './MotorbikeShowroom.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   TRUCK BRANDS DATABASE
   ══════════════════════════════════════════════════════════════════════════════ */
export const TRUCK_BRANDS = {
  'Suzuki':   ['Carry Pickup'],
  'Daihatsu': ['Gran Max'],
  'Isuzu':    ['Elf', 'Traga', 'Giga'],
  'Mitsubishi': ['Colt Diesel', 'L300', 'Fuso'],
  'Toyota':   ['Hilux', 'Dyna'],
  'Hino':     ['Dutro', 'Ranger', '500'],
  'UD Trucks': ['Kuzer', 'Quester'],
}

export const ALL_MODELS = Object.entries(TRUCK_BRANDS).flatMap(([brand, models]) => models.map(m => ({ brand, model: m })))
export function findBrandByModel(v) { if (!v) return ''; const q = v.toLowerCase(); const m = ALL_MODELS.find(x => x.model.toLowerCase() === q || x.model.toLowerCase().startsWith(q)); return m?.brand ?? '' }
export function getModelSuggestions(v) { if (!v || v.length < 2) return []; const q = v.toLowerCase(); return ALL_MODELS.filter(m => m.model.toLowerCase().includes(q)).slice(0, 6) }

export const CC_OPTIONS = ['1500','2400','2500','2800','3000','3900','4000','4600','5000','5200','5900','6400','7700','8000','10000','12000']
export const TRANS = ['Manual', 'Automatic', 'Semi-Auto']
export const FUEL_POLICY = ['Fuel Included', 'Return Full', 'Pay Per Use']
export const FUEL_TYPE = ['Diesel', 'Petrol']
export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
export const COLORS = ['White', 'Blue', 'Red', 'Yellow', 'Silver', 'Grey', 'Green', 'Orange', 'Black', 'Custom']
export const COLOR_HEX = { Black: '#111', White: '#eee', Red: '#e53e3e', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Silver: '#a8a8a8', Grey: '#6b6b6b', Orange: '#f97316', Custom: '#8DC63F' }
export const LICENSE = ['SIM B1 (Truck)', 'SIM B2 (Heavy)', 'International']
export const MIN_RENTAL = ['1 day', '2 days', '3 days', '1 week', '1 month']
export const PAYLOAD_OPTIONS = ['500kg', '750kg', '1 ton', '2.5 ton', '5 ton', '8 ton', '10 ton+']
export const TRUCK_TYPES = ['Pickup', 'Box Truck', 'Flatbed', 'Dump Truck', 'Double Cab', 'Refrigerated', 'Tanker']
export const BOX_SIZES = ['S', 'M', 'L', 'XL']
export const INSURANCE_OPTIONS = ['Cargo Insurance', 'Vehicle Insurance', 'Third Party', 'None']

export function generateRef() { return 'TRCK-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

export const DEMO_TRUCK_LISTINGS = [
  { ref: 'TRCK-XK2F4821', category: 'Trucks', title: 'Isuzu Traga Box 2800cc 2024', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasdasada-removebg-preview.png?updatedAt=1776113199000', price_day: '450.000', price_week: '2.800.000', price_month: '9.500.000', condition: 'Like New', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { make: 'Isuzu', model: 'Traga', cc: '2800', year: '2024', transmission: 'Manual', payload: '2.5 ton', truckType: 'Box Truck' } },
  { ref: 'TRCK-MN7P3295', category: 'Trucks', title: 'Mitsubishi Colt Diesel 4000cc 2023', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasda-removebg-preview.png?updatedAt=1776112890251', price_day: '600.000', price_week: '3.500.000', price_month: '12.000.000', condition: 'Good', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { make: 'Mitsubishi', model: 'Colt Diesel', cc: '4000', year: '2023', transmission: 'Manual', payload: '5 ton', truckType: 'Box Truck' } },
  { ref: 'TRCK-RT4K6738', category: 'Trucks', title: 'Suzuki Carry Pickup 1500cc 2024', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasd-removebg-preview.png?updatedAt=1776112751249', price_day: '250.000', price_week: '1.500.000', price_month: '5.000.000', condition: 'New', status: 'offline', created_at: '2026-04-10T14:20:00Z', extra_fields: { make: 'Suzuki', model: 'Carry Pickup', cc: '1500', year: '2024', transmission: 'Manual', payload: '750kg', truckType: 'Pickup' } },
]

/* ══════════════════════════════════════════════════════════════════════════════
   TRUCK SHOWROOM — Stage with lighting, swipeable carousel, stat badges
   ══════════════════════════════════════════════════════════════════════════════ */
export function TruckShowroom({ brand, model, payload, truckType, onSelectTruck }) {
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
   BOOL TOGGLE FIELD — reusable inline toggle for truck form
   ══════════════════════════════════════════════════════════════════════════════ */
export function BoolToggleField({ label, value, onChange, styles: s }) {
  return (
    <div className={s.inlineField}>
      <span className={s.inlineLabel}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ background: 'none', border: 'none', color: value ? '#8DC63F' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>{value ? '✓ Yes' : 'No'}</button>
      <button className={s.inlineEditBtn} onClick={() => onChange(!value)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INCLUDED SECTION — glass container with 5 toggle fields
   ══════════════════════════════════════════════════════════════════════════════ */
export function IncludedSection({ tarpaulin, setTarpaulin, ropeSet, setRopeSet, toolKit, setToolKit, gps, setGps, dashCam, setDashCam, styles: s }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
      <h2 className={s.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Included With Rental</h2>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Equipment & accessories</p>
      <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
      <div className={s.inlineGroup}>
        <BoolToggleField label="Tarpaulin" value={tarpaulin} onChange={setTarpaulin} styles={s} />
        <BoolToggleField label="Rope Set" value={ropeSet} onChange={setRopeSet} styles={s} />
        <BoolToggleField label="Tool Kit" value={toolKit} onChange={setToolKit} styles={s} />
        <BoolToggleField label="GPS Tracker" value={gps} onChange={setGps} styles={s} />
        <BoolToggleField label="Dash Cam" value={dashCam} onChange={setDashCam} styles={s} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   INCLUDED ITEMS — visual cards for truck equipment
   ══════════════════════════════════════════════════════════════════════════════ */
export function IncludedBundle({ tarpaulin, ropeSet, toolKit, gps, dashCam }) {
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
