import { useState, useRef } from 'react'
import styles from '@/domains/rentals/rentalFormStyles.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */
export const MASSAGE_TYPES = [
  'Traditional', 'Swedish', 'Deep Tissue', 'Thai', 'Balinese',
  'Shiatsu', 'Hot Stone', 'Aromatherapy', 'Sports', 'Reflexology',
  'Prenatal', 'Couples',
]
export const LANGUAGES = ['Indonesian', 'English', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian']
export const CLIENT_PREFS = ['All', 'Females Only', 'Males Only']
export const AVAILABILITY_OPTS = ['Available', 'Busy', 'Offline']
export const SPA_TYPES = ['Spa', 'Salon', 'Wellness Center', 'Hotel Spa']
export const FACILITIES = ['AC', 'Shower', 'Locker', 'Parking', 'WiFi', 'Steam Room', 'Sauna', 'Jacuzzi']
export const CITIES = ['Yogyakarta', 'Bali', 'Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Malang', 'Medan', 'Makassar', 'Solo']

export const BG_IMAGES = {
  0: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_57_42%20PM.png',
  1: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2007_07_33%20PM.png',
  2: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2010_39_50%20PM.png',
  4: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2011_13_56%20PM.png?updatedAt=1776528855040',
}

export const STORAGE_KEY = 'indoo_massage_listings'

export function generateRef() { return 'SPA-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

export const DEMO_MASSAGE_LISTINGS = [
  { ref: 'SPA-DW1K4821', category: 'Massage', mode: 'home', title: 'Dewi Sari - Balinese Massage', image: 'https://i.pravatar.cc/300?img=45', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { fullName: 'Dewi Sari', massageTypes: ['Balinese', 'Deep Tissue', 'Aromatherapy'], availability: 'Available', city: 'Yogyakarta' } },
  { ref: 'SPA-ZN3P7295', category: 'Massage', mode: 'spa', title: 'Serenity Wellness Spa', image: '', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { spaName: 'Serenity Wellness Spa', spaType: 'Wellness Center', city: 'Yogyakarta' } },
]

/* ══════════════════════════════════════════════════════════════════════════════
   PICKER FIELD — inline field with edit button + dropdown picker
   ══════════════════════════════════════════════════════════════════════════════ */
export function PickerField({ label, value, onChange, options, placeholder, editing, setEditing, suffix, cols }) {
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
export function MultiPillSelect({ label, options, selected, onChange }) {
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
export function InlineBoolField({ label, value, onChange }) {
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
export function GlassCard({ children, title, sub, gold }) {
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
export function ServiceMenuEditor({ menu, setMenu }) {
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
/* ══════════════════════════════════════════════════════════════════════════════
   SETTINGS DRAWER
   ══════════════════════════════════════════════════════════════════════════════ */
export function MassageSettingsDrawer({ showDrawer, setShowDrawer, myListings, setShowMyListings }) {
  if (!showDrawer) return null
  return (
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
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   PROCESSING STEP (Step 4) — ping animation
   ══════════════════════════════════════════════════════════════════════════════ */
export function MassageProcessingStep({ isEditing, mode, listingRef }) {
  return (
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
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUCCESS STEP (Step 5)
   ══════════════════════════════════════════════════════════════════════════════ */
export function MassageSuccessStep({ isEditing, mode, listingRef, displayTitle, city, massageTypes, spaType, lowestPrice, onClose, setMyListings, setShowMyListings }) {
  return (
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
  )
}

export function ModeToggle({ mode, setMode }) {
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
