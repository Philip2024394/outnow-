import { useState, useRef, useEffect } from 'react'
import IndooFooter from '@/components/ui/IndooFooter'
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
  const [agreementFile, setAgreementFile] = useState(null)

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
    return (
      <div className={styles.screen} style={{ backgroundImage: "url('https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502')", backgroundSize: 'cover', backgroundPosition: 'center', alignItems: 'center', justifyContent: 'center' }}>
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
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: scale(1) } } @keyframes commGlow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(141,198,63,0.4)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Account Activated</h1>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#8DC63F', margin: 0 }}>Welcome to Indoo Done Deal</p>
            <button onClick={() => { setProcessing(false); setActivated(false); setShowPlanSelect(true) }} style={{ marginTop: 16, padding: '14px 40px', background: '#8DC63F', border: 'none', borderRadius: 14, color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
              Continue →
            </button>
          </div>
        )}
      </div>
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
      plan: 'free', plan_started: new Date().toISOString(),
    }
    localStorage.setItem('indoo_rental_owner', JSON.stringify(profile))
    setTimeout(() => {
      setActivated(true)
      setTimeout(() => {
        setProcessing(false)
        setActivated(false)
        onComplete?.(profile)
      }, 2000)
    }, 5000)
  }

  return (
    <div className={styles.screen} style={{ backgroundImage: "url('https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2029,%202026,%2003_29_38%20AM.png?updatedAt=1777408195502')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />

      {/* Hero header */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>Owner <span style={{ color: '#8DC63F' }}>Profile</span></h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', fontWeight: 600 }}>One-time setup for all your listings</p>
      </div>

      <div className={styles.content}>
        <div className={styles.form}>

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


            {/* Trading As */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              <h2 className={styles.inlineGroupTitle} style={{ margin: 0, padding: 0 }}>Trading As</h2>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <h2 className={styles.inlineGroupTitle} style={{ margin: 0, padding: 0 }}>Personal Details</h2>
            </div>
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

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <h2 className={styles.inlineGroupTitle} style={{ margin: 0, padding: 0 }}>Location</h2>
            </div>
            <div className={styles.inlineGroup}>
              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>City</span>
                <select
                  className={styles.inlineInput}
                  value={city}
                  onChange={e => {
                    setCity(e.target.value)
                    if (e.target.value === 'Other') setShowLocationPicker(true)
                    else setShowLocationPicker(false)
                  }}
                  style={{ appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%238DC63F\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  <option value="" style={{ background: '#111' }}>Select city...</option>
                  {['Yogyakarta','Jakarta','Surabaya','Bandung','Semarang','Medan','Makassar','Denpasar','Malang','Solo','Palembang','Manado','Balikpapan','Pontianak','Padang','Banjarmasin','Pekanbaru','Batam','Mataram','Kupang','Jayapura','Ambon','Ternate','Kendari','Gorontalo','Samarinda','Sorong','Pangkal Pinang','Bengkulu','Jambi','Lampung','Serang','Cirebon','Tasikmalaya','Sukabumi','Bogor','Bekasi','Tangerang','Depok','Other'].map(c => (
                    <option key={c} value={c} style={{ background: '#111', color: '#fff' }}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Other city — custom input + GPS */}
              {(city === 'Other' || showLocationPicker) && (
                <>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Your City</span>
                    <input className={styles.inlineInput} value={city === 'Other' ? '' : city} onChange={e => setCity(e.target.value)} placeholder="Enter city or area name" autoComplete="new-password" />
                  </div>
                  <button onClick={() => {
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                          const d = await r.json()
                          const c = [d.address?.city, d.address?.town, d.address?.village, d.address?.county].filter(Boolean)[0] || ''
                          const addr = [d.address?.road, d.address?.suburb, d.address?.village].filter(Boolean).join(', ')
                          if (c) setCity(c)
                          if (addr) setAddress(addr)
                          // Save GPS coords
                          try {
                            const profile = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
                            profile.gps = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                            profile.gps_city = c
                            localStorage.setItem('indoo_rental_owner', JSON.stringify(profile))
                          } catch {}
                          setShowLocationPicker(false)
                        } catch {}
                      },
                      () => {},
                      { enableHighAccuracy: true, timeout: 10000 }
                    )
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 12, width: '100%',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Set My GPS Location
                  </button>
                </>
              )}

              <div className={styles.inlineField}>
                <span className={styles.inlineLabel}>Address</span>
                <input className={styles.inlineInput} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" autoComplete="new-password" />
              </div>

              {/* Set GPS Location — always visible */}
              <button onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    try {
                      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                      const d = await r.json()
                      const c = [d.address?.city, d.address?.town, d.address?.village, d.address?.county].filter(Boolean)[0] || ''
                      const addr = [d.address?.road, d.address?.suburb, d.address?.village].filter(Boolean).join(', ')
                      if (c) setCity(c)
                      if (addr) setAddress(addr)
                      try {
                        const profile = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
                        profile.gps = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        profile.gps_city = c
                        localStorage.setItem('indoo_rental_owner', JSON.stringify(profile))
                      } catch {}
                    } catch {}
                  },
                  () => {},
                  { enableHighAccuracy: true, timeout: 10000 }
                )
              }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px', borderRadius: 12, width: '100%',
                background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)',
                color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Set My Location
              </button>
            </div>

            {/* Fleet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="M12 18h7M5 18l3-8h4l3 8"/><path d="M12 5l-2 5"/></svg>
              <h2 className={styles.inlineGroupTitle} style={{ margin: 0, padding: 0 }}>Your Fleet</h2>
            </div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 4px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>About</h2>
            </div>
            <div>
              <textarea className={styles.inlineInput} style={{ resize: 'none', height: 100, display: 'block', width: '100%', overflow: 'hidden', boxSizing: 'border-box' }} value={bio} onChange={e => { if (e.target.value.length <= 250) setBio(e.target.value) }} placeholder="Tell renters about yourself or your business..." autoComplete="new-password" />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right', marginTop: 4 }}>{bio.length}/250</span>
            </div>

            {/* Agreement Upload (Optional) */}
            <div style={{ marginTop: 16, padding: '14px', background: 'rgba(141,198,63,0.04)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Rental / Sales Agreement</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginLeft: 'auto' }}>Optional</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', lineHeight: 1.4 }}>Upload your own rental or sales agreement. This will be shown to buyers/renters before they proceed.</p>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(141,198,63,0.3)', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: agreementFile ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{agreementFile ? agreementFile.name : 'Upload PDF or Image'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAgreementFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              </label>

              {/* Activate button */}
              <button onClick={handleSubmit} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>
                Activate Account
              </button>
            </div>

          </div>

        </div>
      </div>
      <IndooFooter label="Owner Profile" onBack={onClose} onHome={onClose} />
    </div>
  )
}
