import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ImageUploader, PreviewCard, FormFooter } from '@/domains/rentals/components/FormFields'
import styles from '@/domains/rentals/rentalFormStyles.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */
const MASSAGE_TYPES = [
  'Traditional', 'Swedish', 'Deep Tissue', 'Thai', 'Balinese',
  'Shiatsu', 'Hot Stone', 'Aromatherapy', 'Sports', 'Reflexology',
  'Prenatal', 'Couples',
]
const LANGUAGES = ['Indonesian', 'English', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian']
const CLIENT_PREFS = ['All', 'Females Only', 'Males Only']
const AVAILABILITY_OPTS = ['Available', 'Busy', 'Offline']
const SPA_TYPES = ['Spa', 'Salon', 'Wellness Center', 'Hotel Spa']
const FACILITIES = ['AC', 'Shower', 'Locker', 'Parking', 'WiFi', 'Steam Room', 'Sauna', 'Jacuzzi']
const CITIES = ['Yogyakarta', 'Bali', 'Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Malang', 'Medan', 'Makassar', 'Solo']

const BG_IMAGES = {
  0: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png',
  1: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png',
  2: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png',
  4: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040',
}

const STORAGE_KEY = 'indoo_massage_listings'

function generateRef() { return 'SPA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

/* ══════════════════════════════════════════════════════════════════════════════
   PICKER FIELD — inline field with edit button + dropdown picker
   ══════════════════════════════════════════════════════════════════════════════ */
function PickerField({ label, value, onChange, options, placeholder, editing, setEditing, suffix, cols }) {
  const ref = useRef(null)
  const filtered = value ? options.filter(o => o.toLowerCase().includes(value.toLowerCase())) : options
  return (
    <>
      <div className={styles.inlineField}>
        <span className={styles.inlineLabel}>{label}</span>
        <input
          ref={ref}
          className={`${styles.inlineInput} ${!value ? styles.inlineInputEmpty : ''}`}
          value={value}
          onChange={e => { onChange(e.target.value); if (!editing) setEditing(true) }}
          onFocus={() => setEditing(true)}
          onBlur={() => setTimeout(() => setEditing(false), 200)}
          placeholder={placeholder || 'Select or type'}
        />
        {suffix && value && <span className={styles.inlineSuffix}>{suffix}</span>}
        <button className={styles.inlineEditBtn} onClick={() => {
          if (editing) { setEditing(false) }
          else { onChange(''); setEditing(true); setTimeout(() => { ref.current?.focus() }, 50) }
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      {editing && filtered.length > 0 && (
        <div className={styles.brandPicker} style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
          {filtered.map(o => {
            const isMatch = value && value.length >= 2 && o.toLowerCase().startsWith(value.toLowerCase()) && value !== o
            return <button key={o} className={`${styles.brandPickerItem} ${value === o ? styles.brandPickerItemActive : ''} ${isMatch ? styles.brandPickerItemMatch : ''}`} onClick={() => { onChange(o); setTimeout(() => setEditing(false), 400) }}>{o}</button>
          })}
        </div>
      )}
    </>
  )
}

/* Multi-select pill toggle */
function MultiPillSelect({ label, options, selected, onChange }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div style={{ marginBottom: 6 }}>
      {label && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: '0.03em', marginBottom: 6, display: 'block' }}>{label}</span>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => {
          const active = selected.includes(o)
          return (
            <button key={o} onClick={() => toggle(o)} style={{
              padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: active ? '#8DC63F' : 'rgba(255,255,255,0.04)',
              border: active ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.08)',
              color: active ? '#000' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            }}>{active ? '✓ ' : ''}{o}</button>
          )
        })}
      </div>
    </div>
  )
}

/* Toggle bool field inline */
function InlineBoolField({ label, value, onChange }) {
  return (
    <div className={styles.inlineField}>
      <span className={styles.inlineLabel}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ background: 'none', border: 'none', color: value ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
        {value ? '✓ Yes' : 'No'}
      </button>
      <button className={styles.inlineEditBtn} onClick={() => onChange(!value)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>
  )
}

/* Glass container wrapper */
function GlassCard({ children, title, sub, gold }) {
  const borderColor = gold ? 'rgba(255,215,0,0.2)' : 'rgba(141,198,63,0.2)'
  const glowColor = gold ? 'rgba(255,215,0,0.06)' : 'rgba(141,198,63,0.08)'
  const titleColor = gold ? '#FFD700' : undefined
  return (
    <div style={{
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1.5px solid ${borderColor}`, borderRadius: 20, padding: '16px 14px',
      boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(141,198,63,0.05)`,
      position: 'relative', zIndex: 1,
    }}>
      {title && <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)', color: titleColor }}>{title}</h2>}
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>{sub}</p>}
      {title && (
        <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
        </div>
      )}
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SERVICE MENU EDITOR
   ══════════════════════════════════════════════════════════════════════════════ */
function ServiceMenuEditor({ menu, setMenu }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [new60, setNew60] = useState('')
  const [new90, setNew90] = useState('')
  const [new120, setNew120] = useState('')

  const addService = () => {
    if (!newName) return
    setMenu([...menu, { name: newName, price60: Number(new60) || 0, price90: Number(new90) || 0, price120: Number(new120) || 0 }])
    setNewName(''); setNew60(''); setNew90(''); setNew120(''); setShowAdd(false)
  }

  const removeService = (i) => setMenu(menu.filter((_, j) => j !== i))

  const fmtP = (n) => n ? `Rp ${Number(n).toLocaleString('id-ID')}` : '-'

  return (
    <div>
      {/* Existing services */}
      {menu.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>60m: <span style={{ color: '#8DC63F', fontWeight: 700 }}>{fmtP(s.price60)}</span></span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>90m: <span style={{ color: '#8DC63F', fontWeight: 700 }}>{fmtP(s.price90)}</span></span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>120m: <span style={{ color: '#8DC63F', fontWeight: 700 }}>{fmtP(s.price120)}</span></span>
            </div>
          </div>
          <button onClick={() => removeService(i)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}>x</button>
        </div>
      ))}

      {/* Add form */}
      {showAdd ? (
        <div style={{ padding: '10px 0', borderTop: menu.length ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <div className={styles.inlineField}>
            <span className={styles.inlineLabel}>Name</span>
            <input className={styles.inlineInput} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Balinese Massage" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            <div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>60 min</span>
              <input className={styles.inlineInput} value={new60} onChange={e => setNew60(e.target.value.replace(/[^0-9]/g, ''))} placeholder="150000" inputMode="numeric" style={{ fontSize: 12, padding: '6px 8px', marginTop: 2 }} />
            </div>
            <div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>90 min</span>
              <input className={styles.inlineInput} value={new90} onChange={e => setNew90(e.target.value.replace(/[^0-9]/g, ''))} placeholder="200000" inputMode="numeric" style={{ fontSize: 12, padding: '6px 8px', marginTop: 2 }} />
            </div>
            <div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>120 min</span>
              <input className={styles.inlineInput} value={new120} onChange={e => setNew120(e.target.value.replace(/[^0-9]/g, ''))} placeholder="250000" inputMode="numeric" style={{ fontSize: 12, padding: '6px 8px', marginTop: 2 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={addService} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Add Service</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1.5px dashed rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          + Add Service
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MODE TOGGLE — Home Massage / Massage Spa
   ══════════════════════════════════════════════════════════════════════════════ */
function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 14, border: '1.5px solid rgba(141,198,63,0.15)', overflow: 'hidden', marginBottom: 12 }}>
      {[
        { key: 'home', label: 'Home Massage', icon: '🏠' },
        { key: 'spa', label: 'Massage Spa', icon: '🏢' },
      ].map(opt => (
        <button key={opt.key} onClick={() => setMode(opt.key)} style={{
          flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: mode === opt.key ? '#8DC63F' : 'transparent',
          color: mode === opt.key ? '#000' : 'rgba(255,255,255,0.4)',
          fontSize: 13, fontWeight: 800, transition: 'all 0.25s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   DEMO LISTINGS
   ══════════════════════════════════════════════════════════════════════════════ */
const DEMO_MASSAGE_LISTINGS = [
  { ref: 'SPA-DW1K4821', category: 'Massage', mode: 'home', title: 'Dewi Sari - Balinese Massage', image: 'https://i.pravatar.cc/300?img=45', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { fullName: 'Dewi Sari', massageTypes: ['Balinese', 'Deep Tissue', 'Aromatherapy'], availability: 'Available', city: 'Yogyakarta' } },
  { ref: 'SPA-ZN3P7295', category: 'Massage', mode: 'spa', title: 'Serenity Wellness Spa', image: '', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { spaName: 'Serenity Wellness Spa', spaType: 'Wellness Center', city: 'Yogyakarta' } },
]

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function MassageListingForm({ open, onClose, onSubmit, editListing }) {
  const isEditing = !!editListing
  const listingRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
  const ef = editListing?.extra_fields || {}

  /* ── state ── */
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(editListing?.mode || ef.mode || 'home')

  // Shared
  const [mainImage, setMainImage] = useState(editListing?.image || '')
  const [thumbs, setThumbs] = useState(() => editListing?.images?.slice(1) || [])
  const [desc, setDesc] = useState(editListing?.description || ef.description || '')
  const [city, setCity] = useState(() => {
    if (ef.city || editListing?.city) return ef.city || editListing?.city
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.city || '' } catch { return '' }
  })
  const [whatsapp, setWhatsapp] = useState(() => {
    if (ef.whatsapp) return ef.whatsapp
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.whatsapp || '' } catch { return '' }
  })
  const [menu, setMenu] = useState(ef.menu || [])
  const [massageTypes, setMassageTypes] = useState(ef.massageTypes || [])
  const [languages, setLanguages] = useState(ef.languages || ['Indonesian'])
  const [clientPref, setClientPref] = useState(ef.clientPreferences || 'All')
  const [availability, setAvailability] = useState(ef.availability || 'Available')

  // Home massage fields
  const [fullName, setFullName] = useState(ef.fullName || '')
  const [age, setAge] = useState(ef.age || '')
  const [experience, setExperience] = useState(ef.yearsOfExperience || '')
  const [area, setArea] = useState(ef.area || '')
  const [serviceRadius, setServiceRadius] = useState(ef.serviceRadius || '10')
  const [certImage, setCertImage] = useState(ef.certImage || '')
  const [bringTable, setBringTable] = useState(ef.bringTable || false)
  const [bringOils, setBringOils] = useState(ef.bringOils || false)
  const [towelsProvided, setTowelsProvided] = useState(ef.towelsProvided || false)

  // Spa fields
  const [spaName, setSpaName] = useState(ef.spaName || '')
  const [spaType, setSpaType] = useState(ef.spaType || '')
  const [fullAddress, setFullAddress] = useState(ef.fullAddress || '')
  const [lat, setLat] = useState(ef.lat || '')
  const [lng, setLng] = useState(ef.lng || '')
  const [openTime, setOpenTime] = useState(ef.openTime || '09:00')
  const [closeTime, setCloseTime] = useState(ef.closeTime || '21:00')
  const [daysOpen, setDaysOpen] = useState(ef.daysOpen || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  const [facilities, setFacilities] = useState(ef.facilities || [])
  const [staffCount, setStaffCount] = useState(ef.staffCount || '')
  const [rideBooking, setRideBooking] = useState(ef.rideBooking || false)
  const [rideTypes, setRideTypes] = useState(ef.rideTypes || [])

  // Pickers
  const [editingCity, setEditingCity] = useState(false)
  const [editingArea, setEditingArea] = useState(false)
  const [editingClientPref, setEditingClientPref] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState(false)
  const [editingSpaType, setEditingSpaType] = useState(false)

  // UI
  const [submitting, setSubmitting] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [previewListingIdx, setPreviewListingIdx] = useState(null)
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      return saved.length > 0 ? saved : DEMO_MASSAGE_LISTINGS
    } catch { return DEMO_MASSAGE_LISTINGS }
  })

  if (!open) return null

  const displayTitle = mode === 'home'
    ? (fullName ? `${fullName} - ${massageTypes[0] || 'Massage'} Therapist` : 'Massage Therapist')
    : (spaName || 'Massage Spa')

  const tags = [
    mode === 'home' ? 'Home Service' : spaType || 'Spa',
    ...massageTypes.slice(0, 3),
    availability,
    clientPref !== 'All' ? clientPref : null,
  ].filter(Boolean)

  const lowestPrice = menu.length > 0 ? Math.min(...menu.map(s => s.price60 || s.price90 || s.price120 || 999999)) : ''

  /* ── Validation per step ── */
  const canNext = (() => {
    if (step === 0) return mode === 'home' ? !!(fullName && city) : !!(spaName && city)
    if (step === 1) return menu.length > 0
    return true
  })()

  /* ── Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true)
    const listing = {
      ref: listingRef, category: 'Massage', mode,
      title: displayTitle,
      description: desc,
      city,
      image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      status: 'live',
      created_at: new Date().toISOString(),
      extra_fields: {
        mode, massageTypes, languages, clientPreferences: clientPref, availability,
        menu, whatsapp, description: desc,
        city, ...(mode === 'home' ? {
          fullName, age, yearsOfExperience: experience, area, serviceRadius,
          certImage, bringTable, bringOils, towelsProvided,
        } : {
          spaName, spaType, fullAddress, lat, lng,
          openTime, closeTime, daysOpen, facilities, staffCount,
          rideBooking, rideTypes,
        }),
      },
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (isEditing) {
        const idx = saved.findIndex(l => l.ref === listingRef)
        if (idx >= 0) saved[idx] = { ...saved[idx], ...listing }
        else saved.push(listing)
      } else {
        saved.push(listing)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {}
    await onSubmit?.(listing)
    setSubmitting(false); setStep(4)
    setTimeout(() => setStep(5), 5000)
  }

  const bgImg = BG_IMAGES[step] || BG_IMAGES[step >= 4 ? 4 : 0]

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

      {/* ── Header — back + settings ── */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ width: 38, height: 38, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={() => setShowDrawer(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>

      {/* ══ Side Drawer ══ */}
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
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes livePulse { 0%, 100% { opacity: 1; text-shadow: 0 0 6px rgba(141,198,63,0.8); } 50% { opacity: 0.5; text-shadow: 0 0 2px rgba(141,198,63,0.2); } }
@keyframes liveGlow { 0%, 100% { box-shadow: 0 0 8px rgba(141,198,63,0.4), inset 0 0 4px rgba(141,198,63,0.1); } 50% { box-shadow: 0 0 16px rgba(141,198,63,0.6), inset 0 0 8px rgba(141,198,63,0.15); } }`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, transparent, #8DC63F 30%, #8DC63F 70%, transparent)', pointerEvents: 'none', boxShadow: '0 0 12px rgba(141,198,63,0.4)' }} />

            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Settings</span>
              </div>
              <button onClick={() => setShowDrawer(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
            </div>

            <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '💆', label: 'My Listings', sub: `${myListings.length} listing${myListings.length !== 1 ? 's' : ''}`, action: () => { setShowDrawer(false); setShowMyListings(true) } },
                { icon: '📊', label: 'Booking Stats', sub: 'Views, bookings & revenue' },
                { icon: '📋', label: 'Terms of Service', sub: 'Policies & conditions' },
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
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>Indoo Massage v1.0</span>
            </div>
          </div>
        </>
      )}

      {/* ══ Content ══ */}
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
                <span style={{ fontSize: 36 }}>{mode === 'home' ? '💆' : '🏢'}</span>
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              {isEditing ? 'Updating Listing' : 'Entering Marketplace'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>
              {isEditing ? 'Saving your changes...' : 'Setting up your listing...'}
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: `dotBounce 1.4s ease-in-out infinite ${i * 0.16}s` }} />
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', marginTop: 20, fontWeight: 600, letterSpacing: '0.04em' }}>REF: {listingRef}</p>
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
              {isEditing ? 'Listing Updated!' : "You're Live!"}
            </h2>
            <p style={{ fontSize: 14, color: '#8DC63F', margin: '0 0 4px', fontWeight: 700 }}>
              {isEditing ? 'Your changes are now live on the marketplace' : mode === 'home' ? 'Your therapist profile is now on the marketplace' : 'Your spa is now on the marketplace'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 30px' }}>REF: {listingRef}</p>

            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 14, marginBottom: 24, width: '100%', maxWidth: 280 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{displayTitle}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{city} {mode === 'home' ? `· ${massageTypes.slice(0, 2).join(', ')}` : `· ${spaType}`}</div>
              {lowestPrice > 0 && <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', marginTop: 8 }}>From Rp {Number(lowestPrice).toLocaleString('id-ID')}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
              <button onClick={() => { onClose('viewMarketplace') }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Live on Marketplace
              </button>
              <button onClick={() => { setMyListings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); setShowMyListings(true) }} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,215,0,0.1)', border: '1.5px solid rgba(255,215,0,0.25)', color: '#FFD700', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                View My Listings
              </button>
              <button onClick={onClose} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Done
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 0: PROFILE / SPA DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* Mode Toggle */}
            <ModeToggle mode={mode} setMode={setMode} />

            {mode === 'home' ? (
              /* ── HOME MASSAGE — Therapist Profile ── */
              <>
                <GlassCard title="Therapist Profile" sub="Your personal information">
                  <div className={styles.inlineGroup}>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Full Name</span>
                      <input className={`${styles.inlineInput} ${!fullName ? styles.inlineInputEmpty : ''}`} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dewi Sari" />
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Age</span>
                      <input className={styles.inlineInput} value={age} onChange={e => setAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="28" inputMode="numeric" />
                      {age && <span className={styles.inlineSuffix}>years</span>}
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Experience</span>
                      <input className={styles.inlineInput} value={experience} onChange={e => setExperience(e.target.value.replace(/[^0-9]/g, ''))} placeholder="5" inputMode="numeric" />
                      {experience && <span className={styles.inlineSuffix}>years</span>}
                    </div>
                    <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                      <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Bio</span>
                      <div style={{ flex: 1 }}>
                        <textarea
                          className={styles.inlineInput}
                          style={{ resize: 'none', minHeight: 80, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                          value={desc}
                          onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }}
                          placeholder="Tell clients about your experience, specialties, and approach..."
                          rows={4}
                          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                          ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                        />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{desc.length}/350</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard title="Service Location" sub="Where you provide service">
                  <div className={styles.inlineGroup}>
                    <PickerField label="City" value={city} onChange={setCity} options={CITIES} placeholder="Yogyakarta" editing={editingCity} setEditing={setEditingCity} />
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Area</span>
                      <input className={styles.inlineInput} value={area} onChange={e => setArea(e.target.value)} placeholder="Sleman" />
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Radius</span>
                      <input className={styles.inlineInput} value={serviceRadius} onChange={e => setServiceRadius(e.target.value.replace(/[^0-9]/g, ''))} placeholder="10" inputMode="numeric" />
                      <span className={styles.inlineSuffix}>km</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard title="Massage Types" sub="Select all types you offer">
                  <MultiPillSelect options={MASSAGE_TYPES} selected={massageTypes} onChange={setMassageTypes} />
                </GlassCard>

                <GlassCard title="Client & Language" sub="Preferences and spoken languages">
                  <div className={styles.inlineGroup}>
                    <PickerField label="Clients" value={clientPref} onChange={setClientPref} options={CLIENT_PREFS} placeholder="All" editing={editingClientPref} setEditing={setEditingClientPref} />
                  </div>
                  <MultiPillSelect label="Languages" options={LANGUAGES} selected={languages} onChange={setLanguages} />
                </GlassCard>

                <GlassCard title="Equipment" sub="What you bring to the session">
                  <div className={styles.inlineGroup}>
                    <InlineBoolField label="Own Table" value={bringTable} onChange={setBringTable} />
                    <InlineBoolField label="Own Oils" value={bringOils} onChange={setBringOils} />
                    <InlineBoolField label="Towels" value={towelsProvided} onChange={setTowelsProvided} />
                  </div>
                </GlassCard>
              </>
            ) : (
              /* ── MASSAGE SPA — Business Listing ── */
              <>
                <GlassCard title="Spa Business Info" sub="Your spa or wellness center details">
                  <div className={styles.inlineGroup}>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Spa Name</span>
                      <input className={`${styles.inlineInput} ${!spaName ? styles.inlineInputEmpty : ''}`} value={spaName} onChange={e => setSpaName(e.target.value)} placeholder="Serenity Wellness Spa" />
                    </div>
                    <PickerField label="Type" value={spaType} onChange={setSpaType} options={SPA_TYPES} placeholder="Spa" editing={editingSpaType} setEditing={setEditingSpaType} />
                    <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                      <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                      <div style={{ flex: 1 }}>
                        <textarea
                          className={styles.inlineInput}
                          style={{ resize: 'none', minHeight: 80, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                          value={desc}
                          onChange={e => { if (e.target.value.length <= 350) setDesc(e.target.value) }}
                          placeholder="Describe your spa, ambiance, and specialties..."
                          rows={4}
                          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                          ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                        />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{desc.length}/350</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard title="Location" sub="Help customers find you">
                  <div className={styles.inlineGroup}>
                    <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 14 }}>
                      <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Address</span>
                      <textarea
                        className={styles.inlineInput}
                        style={{ resize: 'none', minHeight: 50, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                        value={fullAddress}
                        onChange={e => setFullAddress(e.target.value)}
                        placeholder="Jl. Malioboro No. 52, Yogyakarta"
                        rows={2}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      />
                    </div>
                    <PickerField label="City" value={city} onChange={setCity} options={CITIES} placeholder="Yogyakarta" editing={editingCity} setEditing={setEditingCity} />
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>GPS</span>
                      <input className={styles.inlineInput} value={lat && lng ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : ''} readOnly placeholder="Tap to detect" style={{ cursor: 'pointer' }} onClick={() => {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setLat(String(pos.coords.latitude))
                          setLng(String(pos.coords.longitude))
                          if (!city) {
                            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                              .then(r => r.json()).then(d => {
                                setCity([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set')
                              }).catch(() => {})
                          }
                        }, () => {}, { enableHighAccuracy: true, timeout: 10000 })
                      }} />
                      <button onClick={() => {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setLat(String(pos.coords.latitude))
                          setLng(String(pos.coords.longitude))
                        }, () => {}, { enableHighAccuracy: true, timeout: 10000 })
                      }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', padding: '0 0 0 8px' }}>GPS</button>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard title="Operating Hours" sub="When are you open?">
                  <div className={styles.inlineGroup}>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Open</span>
                      <input className={styles.inlineInput} type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Close</span>
                      <input className={styles.inlineInput} type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                    </div>
                  </div>
                  <MultiPillSelect label="Days Open" options={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} selected={daysOpen} onChange={setDaysOpen} />
                </GlassCard>

                <GlassCard title="Facilities" sub="Select available amenities">
                  <MultiPillSelect options={FACILITIES} selected={facilities} onChange={setFacilities} />
                </GlassCard>

                <GlassCard title="Staff & Ride Booking" sub="Team size and ride integration">
                  <div className={styles.inlineGroup}>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Therapists</span>
                      <input className={styles.inlineInput} value={staffCount} onChange={e => setStaffCount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="5" inputMode="numeric" />
                      <span className={styles.inlineSuffix}>staff</span>
                    </div>
                    <InlineBoolField label="Ride Booking" value={rideBooking} onChange={setRideBooking} />
                  </div>
                  {rideBooking && (
                    <div style={{ padding: '8px 0 4px' }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', fontWeight: 500 }}>Customers can book a bike or car ride to your spa</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['Bike Ride', 'Car Ride'].map(rt => {
                          const active = rideTypes.includes(rt)
                          return (
                            <button key={rt} onClick={() => setRideTypes(active ? rideTypes.filter(x => x !== rt) : [...rideTypes, rt])} style={{
                              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 800,
                              background: active ? '#8DC63F' : 'rgba(255,255,255,0.04)',
                              border: active ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.08)',
                              color: active ? '#000' : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                            }}>{active ? '✓ ' : ''}{rt}</button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </GlassCard>
              </>
            )}
          </div>
        )}

        {/* ═══ STEP 1: PHOTOS + SERVICE MENU + AVAILABILITY ═══ */}
        {step === 1 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            <GlassCard title={mode === 'home' ? 'Profile Photo' : 'Spa Photos'} sub={mode === 'home' ? 'Upload your profile photo' : 'Upload photos of your spa (up to 5)'}>
              <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            </GlassCard>

            <GlassCard title="Service Menu" sub="Add massage services with pricing per duration">
              <ServiceMenuEditor menu={menu} setMenu={setMenu} />
            </GlassCard>

            <GlassCard title="Availability" sub="Set your current status">
              <div className={styles.inlineGroup}>
                <PickerField label="Status" value={availability} onChange={setAvailability} options={AVAILABILITY_OPTS} placeholder="Available" editing={editingAvailability} setEditing={setEditingAvailability} />
              </div>
            </GlassCard>

            {mode === 'home' && (
              <GlassCard title="Certification" sub="Upload certification (optional)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {certImage ? (
                    <div style={{ position: 'relative' }}>
                      <img src={certImage} alt="Cert" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, border: '1.5px solid rgba(141,198,63,0.2)' }} />
                      <button onClick={() => setCertImage('')} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                    </div>
                  ) : (
                    <label style={{ padding: '12px 20px', borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1.5px dashed rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Upload
                      <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setCertImage(URL.createObjectURL(file))
                        e.target.value = ''
                      }} />
                    </label>
                  )}
                </div>
              </GlassCard>
            )}

            {/* WhatsApp — locked like bike form */}
            <GlassCard title="Contact" sub="How clients reach you">
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField} style={{ opacity: 0.5, pointerEvents: 'none', position: 'relative' }}>
                  <span className={styles.inlineLabel}>WhatsApp</span>
                  <input className={styles.inlineInput} value={whatsapp ? whatsapp.slice(0, 4) + 'xxxxxxxx' : ''} readOnly placeholder="Locked" type="tel" style={{ cursor: 'not-allowed' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#FFD700', letterSpacing: '0.04em' }}>PRO</span>
                  </div>
                </div>
              </div>
            </GlassCard>

          </div>
        )}

        {/* ═══ STEP 2: PRICING SUMMARY + TERMS ═══ */}
        {step === 2 && (
          <div className={styles.form} style={{ paddingTop: 70 }}>

            <GlassCard title="Pricing Summary" sub="Review your service menu">
              {menu.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500, textAlign: 'center', padding: '16px 0' }}>No services added yet. Go back to add services.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Service</th>
                        <th style={{ textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>60m</th>
                        <th style={{ textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>90m</th>
                        <th style={{ textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>120m</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menu.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12, fontWeight: 700, color: '#fff', padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{s.name}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: s.price60 ? '#8DC63F' : 'rgba(255,255,255,0.15)', padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' }}>{s.price60 ? `Rp ${Number(s.price60).toLocaleString('id-ID')}` : '-'}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: s.price90 ? '#8DC63F' : 'rgba(255,255,255,0.15)', padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' }}>{s.price90 ? `Rp ${Number(s.price90).toLocaleString('id-ID')}` : '-'}</td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: s.price120 ? '#8DC63F' : 'rgba(255,255,255,0.15)', padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', whiteSpace: 'nowrap' }}>{s.price120 ? `Rp ${Number(s.price120).toLocaleString('id-ID')}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            {/* Terms */}
            <GlassCard title="Terms & Conditions" sub="Standard service policies" gold>
              <div style={{ padding: '4px 0' }}>
                {[
                  'Client must confirm booking at least 2 hours in advance',
                  'Cancellation within 1 hour of appointment may incur a fee',
                  mode === 'home' ? 'Therapist will arrive within 15 minutes of scheduled time' : 'Walk-ins subject to availability',
                  'Payment is due at the end of the session',
                  'Tips are appreciated but not mandatory',
                  'No inappropriate behavior tolerated — zero tolerance policy',
                ].map((term, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 14, color: '#8DC63F', marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.4 }}>{term}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Summary info card */}
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{menu.length} service{menu.length !== 1 ? 's' : ''} configured</span>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{mode === 'home' ? `${fullName || 'Therapist'} · ${massageTypes.length} massage types` : `${spaName || 'Spa'} · ${facilities.length} facilities`}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ═══ STEP 3: PREVIEW ═══ */}
        {step === 3 && (
          <div className={styles.form}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>REF: {listingRef}</span>
              <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>Ready to Publish</span>
            </div>
            <PreviewCard
              title={displayTitle}
              city={city}
              category="Massage"
              subType={mode === 'home' ? `${massageTypes.slice(0, 3).join(', ')} · ${experience || '?'}yr exp` : `${spaType || 'Spa'} · ${staffCount || '?'} therapists`}
              price={lowestPrice ? String(lowestPrice) : ''}
              image={mainImage}
              tags={tags}
            />

            {/* Extra details preview */}
            <GlassCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mode === 'home' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Location</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{city}{area ? `, ${area}` : ''} ({serviceRadius}km radius)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Clients</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{clientPref}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Languages</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{languages.join(', ')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Equipment</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{[bringTable && 'Table', bringOils && 'Oils', towelsProvided && 'Towels'].filter(Boolean).join(', ') || 'None'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Address</span>
                      <span style={{ color: '#fff', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{fullAddress || city}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Hours</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{openTime} - {closeTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Facilities</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{facilities.join(', ') || 'None'}</span>
                    </div>
                    {rideBooking && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ride Booking</span>
                        <span style={{ color: '#8DC63F', fontWeight: 700 }}>{rideTypes.join(', ')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </GlassCard>

            {/* Service menu preview */}
            {menu.length > 0 && (
              <GlassCard title="Services" sub={`${menu.length} service${menu.length !== 1 ? 's' : ''}`}>
                {menu.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < menu.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>
                      {s.price60 ? `Rp ${Number(s.price60).toLocaleString('id-ID')}` : s.price90 ? `Rp ${Number(s.price90).toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>
                ))}
              </GlassCard>
            )}
          </div>
        )}
      </div>

      {/* ══ My Listings Popup ══ */}
      {showMyListings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: `url(${BG_IMAGES[4]})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column' }}>
          <style>{`@keyframes livePulse { 0%, 100% { opacity: 1; text-shadow: 0 0 6px rgba(141,198,63,0.8); } 50% { opacity: 0.5; text-shadow: 0 0 2px rgba(141,198,63,0.2); } }
@keyframes liveGlow { 0%, 100% { box-shadow: 0 0 8px rgba(141,198,63,0.4), inset 0 0 4px rgba(141,198,63,0.1); } 50% { box-shadow: 0 0 16px rgba(141,198,63,0.6), inset 0 0 8px rgba(141,198,63,0.15); } }`}</style>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💆</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>My Listings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{myListings.length} total</span>
              </div>
            </div>
            <button onClick={() => setShowMyListings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>💆</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No listings yet</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Your published listings will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20 }}>
                {myListings.map((l, i) => (
                  <div key={l.ref || i} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', gap: 12, padding: 12 }}>
                      {l.image ? (
                        <img src={l.image} alt="" onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer', border: '1.5px solid rgba(255,215,0,0.2)' }} />
                      ) : (
                        <div onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, cursor: 'pointer' }}>{l.mode === 'spa' ? '🏢' : '💆'}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.mode === 'home' ? 'Home Massage' : 'Spa'} · {l.extra_fields?.city || ''}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginTop: 4 }}>
                          {l.extra_fields?.massageTypes?.slice(0, 2).join(', ') || l.extra_fields?.spaType || 'Massage'}
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
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                      }} style={{ flex: 1, padding: '9px 0', background: '#FFD700', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(255,215,0,0.3)' }}>
                        {l.status === 'live' ? 'Offline' : 'Go Live'}
                      </button>
                      <button onClick={() => { setShowMyListings(false); onClose('edit', l) }} style={{ flex: 1, padding: '9px 0', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(141,198,63,0.3)' }}>
                        Edit
                      </button>
                      <button onClick={() => {
                        const updated = myListings.filter((_, j) => j !== i)
                        setMyListings(updated)
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                      }} style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
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

          {/* Preview card overlay */}
          {previewListingIdx !== null && myListings[previewListingIdx] && (() => {
            const pl = myListings[previewListingIdx]
            return (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundImage: `url(${BG_IMAGES[4]})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPreviewListingIdx(null)}>
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
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: pl.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.status === 'live' ? 'rgba(141,198,63,0.25)' : 'rgba(239,68,68,0.3)'}`, fontSize: 9, fontWeight: 800, color: pl.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.04em' }}>{pl.status === 'live' ? 'LIVE' : 'OFFLINE'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>{pl.ref}</span>
                    </div>
                    <button onClick={() => setPreviewListingIdx(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
                  </div>
                  {pl.image ? (
                    <img src={pl.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>{pl.mode === 'spa' ? '🏢' : '💆'}</div>
                  )}
                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{pl.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{pl.mode === 'home' ? 'Home Massage' : 'Spa'}</span>
                      {pl.extra_fields?.city && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.city}</span>}
                      {pl.extra_fields?.availability && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.availability}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                    <button onClick={() => {
                      const updated = [...myListings]
                      updated[previewListingIdx] = { ...updated[previewListingIdx], status: updated[previewListingIdx].status === 'live' ? 'offline' : 'live' }
                      setMyListings(updated)
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
                    }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      {pl.status === 'live' ? 'Go Offline' : 'Go Live'}
                    </button>
                    <button onClick={() => { setPreviewListingIdx(null); setShowMyListings(false); onClose('edit', pl) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
                      Edit
                    </button>
                    <button onClick={() => {
                      const updated = myListings.filter((_, j) => j !== previewListingIdx)
                      setMyListings(updated)
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
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

      {/* ══ Footer ══ */}
      {step <= 3 && (
        <FormFooter
          step={step}
          onNext={() => step === 3 ? handleSubmit() : setStep(s => s + 1)}
          onDraft={() => {}}
          canNext={canNext}
          submitting={submitting}
          nextLabel={step === 3 ? 'Publish Listing' : step === 2 ? 'Preview' : step === 1 ? 'Review Pricing' : 'Next'}
        />
      )}
    </div>,
    document.body
  )
}
