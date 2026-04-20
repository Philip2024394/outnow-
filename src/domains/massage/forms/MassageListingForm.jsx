import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ImageUploader, PreviewCard, FormFooter } from '@/domains/rentals/components/FormFields'
import styles from '@/domains/rentals/rentalFormStyles.module.css'
import {
  MASSAGE_TYPES, LANGUAGES, CLIENT_PREFS, AVAILABILITY_OPTS,
  SPA_TYPES, FACILITIES, CITIES, BG_IMAGES, STORAGE_KEY,
  generateRef, DEMO_MASSAGE_LISTINGS,
  PickerField, MultiPillSelect, InlineBoolField, GlassCard,
  ServiceMenuEditor, ModeToggle,
  MassageSettingsDrawer, MassageProcessingStep, MassageSuccessStep,
} from './MassageFormComponents'
import MassageMyListingsPanel from './MassageMyListingsPanel'
import PostDealWidget from '@/domains/dealhunt/components/PostDealWidget'

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function MassageListingForm({ open, onClose, onSubmit, editListing }) {
  const isEditing = !!editListing
  const listingRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
  const [dealHuntOpen, setDealHuntOpen] = useState(false)
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
      <MassageSettingsDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} myListings={myListings} setShowMyListings={setShowMyListings} />

      {/* ══ Content ══ */}
      <div className={styles.content} style={{ paddingTop: 97 }}>

        {/* ═══ STEP 4: ENTERING MARKETPLACE — ping animation ═══ */}
        {step === 4 && <MassageProcessingStep isEditing={isEditing} mode={mode} listingRef={listingRef} />}

        {/* ═══ STEP 5: SUCCESS ═══ */}
        {step === 5 && <MassageSuccessStep isEditing={isEditing} mode={mode} listingRef={listingRef} displayTitle={displayTitle} city={city} massageTypes={massageTypes} spaType={spaType} lowestPrice={lowestPrice} onClose={onClose} setMyListings={setMyListings} setShowMyListings={setShowMyListings} />}

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
        <MassageMyListingsPanel
          myListings={myListings}
          setMyListings={setMyListings}
          previewListingIdx={previewListingIdx}
          setPreviewListingIdx={setPreviewListingIdx}
          setShowMyListings={setShowMyListings}
          onClose={onClose}
        />
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

      {/* Deal Hunt — Post a Deal button */}
      {step === 0 && (
        <button onClick={() => setDealHuntOpen(true)} style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.4)' }}>
          🔥 Post a Deal
        </button>
      )}
      <PostDealWidget open={dealHuntOpen} onClose={() => setDealHuntOpen(false)} domain="massage" sellerItems={[]} sellerId={null} sellerName="Therapist" />
    </div>,
    document.body
  )
}
