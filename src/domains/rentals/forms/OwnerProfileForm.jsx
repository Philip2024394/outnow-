import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from '../rentalFormStyles.module.css'

function generateOwnerId() { return 'OWN-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }

const OWNER_TYPES = ['Individual', 'Company', 'Agency']
const FLEET_SIZES = ['1', '2-5', '6-10', '11-25', '26-50', '50+']

export default function OwnerProfileForm({ open, onClose, onComplete }) {
  const ownerId = useRef(generateOwnerId()).current
  const [ownerType, setOwnerType] = useState('')
  const [editingType, setEditingType] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [yearEstablished, setYearEstablished] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [fleetSize, setFleetSize] = useState('')
  const [editingFleet, setEditingFleet] = useState(false)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [activated, setActivated] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Auto-detect city on load
  useEffect(() => {
    if (!open || city) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const d = await r.json()
          const c = [d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ')
          if (c) setCity(c)
        } catch {}
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    )
  }, [open])

  if (!open) return null

  // Processing / Activated screen
  if (processing) {
    return createPortal(
      <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledsadasdadsaa.png)', backgroundSize: 'cover', backgroundPosition: 'center', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
        {!activated ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', padding: 40 }}>
            {/* Spinning circle */}
            <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Processing Account</h1>
            <p style={{ fontSize: 16, color: '#fff', margin: 0, fontWeight: 600 }}>Please Wait...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', padding: 40, animation: 'fadeIn 0.5s ease' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: scale(1) } }`}</style>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(141,198,63,0.4)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Account Activated</h1>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#8DC63F', margin: 0 }}>Welcome to Indoo Rentals</p>
            <button onClick={() => { setProcessing(false); setActivated(false); onComplete?.({ ownerId, ownerType, fullName, companyName, yearEstablished, whatsapp, email, city, address, fleetSize, bio }) }} style={{ marginTop: 16, padding: '14px 40px', background: '#8DC63F', border: 'none', borderRadius: 14, color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
              Continue →
            </button>
          </div>
        )}
      </div>,
      document.body
    )
  }

  const isCompany = ownerType === 'Company' || ownerType === 'Agency'
  const errors = {
    ownerType: !ownerType,
    fullName: !fullName,
    whatsapp: !whatsapp,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const handleSubmit = () => {
    if (hasErrors) { setShowErrors(true); return }
    setProcessing(true)
    const profile = {
      ownerId, ownerType, fullName, companyName, yearEstablished,
      whatsapp, email, city, address, fleetSize, bio,
    }
    localStorage.setItem('indoo_rental_owner', JSON.stringify(profile))
    setTimeout(() => setActivated(true), 5000)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2008_02_07%20PM.png?updatedAt=1776344543969)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />

      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.form}>

          {/* Spacer for background image visibility */}
          <div style={{ height: 120, flexShrink: 0 }} />

          {/* Single glass container */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(141,198,63,0.2)',
            borderRadius: 20, padding: '20px 14px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)',
            position: 'relative',
          }}>
            {/* Green accent line top */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.4), transparent)', pointerEvents: 'none' }} />

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, padding: '0 0 12px', letterSpacing: '-0.02em' }}>Owner Profile</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '-8px 0 16px' }}>One-time setup — applies to all your listings</p>

            {/* Trading As */}
            <h2 className={styles.inlineGroupTitle}>Trading As</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Type</span>
                <input className={`${styles.inlineInput} ${!ownerType ? styles.inlineInputEmpty : ''}`} value={ownerType} onChange={e => { setOwnerType(e.target.value); setEditingType(true) }} onFocus={() => setEditingType(true)} onBlur={() => setTimeout(() => setEditingType(false), 200)} placeholder="Individual / Company" autoFocus />
                {showErrors && errors.ownerType && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}>Required</span>}
                <button className={styles.inlineEditBtn} onClick={() => setEditingType(!editingType)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {editingType && (
                <div className={styles.brandPicker}>
                  {OWNER_TYPES.map(t => (
                    <button key={t} className={`${styles.brandPickerItem} ${ownerType === t ? styles.brandPickerItemActive : ''}`} onClick={() => { setOwnerType(t); setEditingType(false) }}>{t}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Details */}
            <h2 className={styles.inlineGroupTitle}>Personal Details</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Full Name</span>
                <input className={`${styles.inlineInput} ${!fullName ? styles.inlineInputEmpty : ''}`} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" autoComplete="new-password" data-form-type="other" />
                {showErrors && errors.fullName && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}>Required</span>}
              </div>
              {isCompany && (
                <>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Company</span>
                    <input className={styles.inlineInput} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company / business name" autoComplete="new-password" data-form-type="other" />
                  </div>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Established</span>
                    <input className={styles.inlineInput} value={yearEstablished} onChange={e => setYearEstablished(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2020" inputMode="numeric" autoComplete="new-password" />
                  </div>
                </>
              )}
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>WhatsApp</span>
                <input className={`${styles.inlineInput} ${!whatsapp ? styles.inlineInputEmpty : ''}`} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" autoComplete="new-password" data-form-type="other" />
                {showErrors && errors.whatsapp && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}>Required</span>}
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Email</span>
                <input className={styles.inlineInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="optional" autoComplete="new-password" data-form-type="other" />
              </div>
            </div>

            {/* Location — city auto-detects, GPS on address */}
            <h2 className={styles.inlineGroupTitle}>Location</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>City</span>
                <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Auto-detecting..." autoComplete="new-password" />
              </div>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Address</span>
                <input className={styles.inlineInput} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" autoComplete="new-password" />
                <button onClick={() => {
                  setAddress('Detecting...')
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                        const d = await r.json()
                        const addr = [d.address?.road, d.address?.suburb, d.address?.village].filter(Boolean).join(', ')
                        setAddress(addr || d.display_name?.split(',').slice(0, 3).join(',') || 'Address set')
                        const c = [d.address?.city, d.address?.town, d.address?.county, d.address?.state].filter(Boolean).slice(0, 2).join(', ')
                        if (c) setCity(c)
                        // Show 3 nearby suggestions
                        const nearby = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&countrycodes=id&limit=3`)
                        const nd = await nearby.json()
                        setLocationSuggestions(nd.map(l => l.display_name.split(',').slice(0, 3).join(',')))
                        setShowLocationPicker(true)
                      } catch { setAddress('') }
                    },
                    () => setAddress(''),
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#EF4444', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, marginLeft: 8,
                  boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </button>
              </div>
              {showLocationPicker && locationSuggestions.length > 0 && (
                <div className={styles.brandPicker} style={{ gridTemplateColumns: '1fr' }}>
                  {locationSuggestions.map((loc, i) => (
                    <button key={i} className={`${styles.brandPickerItem} ${address === loc ? styles.brandPickerItemActive : ''}`} onClick={() => { setAddress(loc); setShowLocationPicker(false); setLocationSuggestions([]) }} style={{ textAlign: 'left', fontSize: 12 }}>
                      📍 {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fleet */}
            <h2 className={styles.inlineGroupTitle}>Your Fleet</h2>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Total Vehicles</span>
                <span className={styles.inlineInput} style={{ cursor: 'pointer' }} onClick={() => setEditingFleet(!editingFleet)}>{fleetSize || <span style={{ color: 'rgba(255,255,255,0.15)' }}>Select</span>}</span>
                <button className={styles.inlineEditBtn} onClick={() => setEditingFleet(!editingFleet)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              {editingFleet && (
                <div className={styles.brandPicker}>
                  {FLEET_SIZES.map(s => (
                    <button key={s} className={`${styles.brandPickerItem} ${fleetSize === s ? styles.brandPickerItemActive : ''}`} onClick={() => { setFleetSize(s); setEditingFleet(false) }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* About */}
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', padding: '16px 0 6px', margin: 0 }}>About</h2>
            <div>
              <textarea className={styles.inlineInput} style={{ resize: 'none', height: 100, display: 'block', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }} value={bio} onChange={e => { if (e.target.value.length <= 250) setBio(e.target.value) }} placeholder="Tell renters about yourself or your business..." autoComplete="new-password" />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right', marginTop: 4 }}>{bio.length}/250</span>
            </div>

            {/* Bike image — inside container, below About */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, marginRight: -30, marginBottom: -10 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{
                width: 140, height: 140, objectFit: 'contain',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))',
              }} />
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.nextBtn} onClick={handleSubmit}>
          Create Account
        </button>
      </div>
    </div>,
    document.body)
}
