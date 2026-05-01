/**
 * JoinPlacesSheet — Business registration for INDOO PLACES.
 * Rp 100,000/year listing fee. Collect business info, QRIS payment screenshot,
 * social media, and send to admin for approval.
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DIRECTORY_CATEGORIES } from '@/services/directoryService'
import { useGeolocation } from '@/hooks/useGeolocation'

const BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_24_37%20PM.png'

// Extended business types for auto-complete
const ALL_BUSINESS_TYPES = [
  ...DIRECTORY_CATEGORIES.map(c => ({ id: c.id, icon: c.icon, label: c.label })),
  { id: 'hotel', icon: '🏨', label: 'Hotel & Accommodation' },
  { id: 'cafe', icon: '☕', label: 'Café & Coffee Shop' },
  { id: 'bakery', icon: '🥐', label: 'Bakery & Pastry' },
  { id: 'pharmacy', icon: '💊', label: 'Pharmacy' },
  { id: 'laundry', icon: '🧺', label: 'Laundry Service' },
  { id: 'pet', icon: '🐾', label: 'Pet Shop & Vet' },
  { id: 'auto', icon: '🔧', label: 'Auto Repair & Service' },
  { id: 'electronics', icon: '📱', label: 'Electronics & Phone Shop' },
  { id: 'clothing', icon: '👗', label: 'Clothing & Fashion' },
  { id: 'photography', icon: '📷', label: 'Photography Studio' },
  { id: 'printing', icon: '🖨️', label: 'Printing & Copy' },
  { id: 'tour', icon: '🗺️', label: 'Tour & Travel Agent' },
  { id: 'coworking', icon: '💻', label: 'Coworking Space' },
  { id: 'yoga', icon: '🧘', label: 'Yoga & Wellness' },
  { id: 'diving', icon: '🤿', label: 'Diving & Water Sports' },
  { id: 'surfing', icon: '🏄', label: 'Surfing School' },
  { id: 'tattoo', icon: '💉', label: 'Tattoo Studio' },
  { id: 'wedding', icon: '💒', label: 'Wedding & Event Venue' },
  { id: 'school', icon: '📚', label: 'Language & Training School' },
  { id: 'other', icon: '📍', label: 'Other' },
]

const glass = {
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }

export default function JoinPlacesSheet({ open, onClose }) {
  const { coords } = useGeolocation()
  const [step, setStep] = useState(1) // 1=info, 2=payment, 3=success
  const fileRef = useRef(null)
  const qrisRef = useRef(null)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bio, setBio] = useState('')
  const [address, setAddress] = useState('')
  const [useGps, setUseGps] = useState(false)
  const [category, setCategory] = useState('')
  const [catSearch, setCatSearch] = useState('')
  const [showCatDrop, setShowCatDrop] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [primarySocial, setPrimarySocial] = useState('instagram')
  const [qrisScreenshot, setQrisScreenshot] = useState(null)
  const [qrisPreview, setQrisPreview] = useState(null)

  if (!open) return null

  const filteredCats = catSearch.trim()
    ? ALL_BUSINESS_TYPES.filter(c => c.label.toLowerCase().includes(catSearch.toLowerCase()))
    : ALL_BUSINESS_TYPES

  const selectedCat = ALL_BUSINESS_TYPES.find(c => c.id === category)

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleQris = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisScreenshot(file)
    setQrisPreview(URL.createObjectURL(file))
  }

  const canProceed = businessName.trim() && ownerName.trim() && whatsapp.trim() && category && (address.trim() || useGps)

  const handleSubmit = () => {
    const listing = {
      businessName, ownerName, whatsapp, bio, category,
      address: useGps && coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : address,
      instagram, facebook, tiktok, primarySocial,
      image, qrisScreenshot,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      fee: 100000,
      feePeriod: '1 year',
    }
    // Save to localStorage for admin review
    const existing = JSON.parse(localStorage.getItem('indoo_places_applications') || '[]')
    existing.push(listing)
    localStorage.setItem('indoo_places_applications', JSON.stringify(existing))
    setStep(3)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: `#0a0a0a url("${BG}") center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
            Join <span style={{ color: '#8DC63F' }}>INDOO PLACES</span>
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontWeight: 600 }}>List your business · Rp 100,000/year</p>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? '#8DC63F' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>

        {/* ═══ STEP 1: Business Info ═══ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Business Image */}
            <div style={{ ...glass, padding: 16, textAlign: 'center' }}>
              <label style={labelStyle}>Business Photo</label>
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', height: 140, borderRadius: 14, border: '2px dashed rgba(141,198,63,0.3)',
                background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : 'rgba(0,0,0,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700,
              }}>
                {!imagePreview && '📷 Tap to upload photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            </div>

            {/* Business Name */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Business Name *</label>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Warung Sate Pak Ahmad" style={inputStyle} />
            </div>

            {/* Owner Name */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Owner / Contact Name *</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            </div>

            {/* WhatsApp */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>WhatsApp Number *</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="081234567890" type="tel" style={inputStyle} />
            </div>

            {/* Category — auto-complete */}
            <div style={{ ...glass, padding: 16, position: 'relative' }}>
              <label style={labelStyle}>Business Type *</label>
              {selectedCat ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(141,198,63,0.12)', border: '1.5px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 14, fontWeight: 800, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{selectedCat.icon}</span> {selectedCat.label}
                  </div>
                  <button onClick={() => { setCategory(''); setCatSearch('') }} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
                </div>
              ) : (
                <>
                  <input value={catSearch} onChange={e => { setCatSearch(e.target.value); setShowCatDrop(true) }} onFocus={() => setShowCatDrop(true)} placeholder="Start typing... e.g. Restaurant, Spa, Hotel" style={inputStyle} />
                  {showCatDrop && (
                    <div style={{ position: 'absolute', left: 16, right: 16, top: '100%', marginTop: -8, maxHeight: 200, overflowY: 'auto', background: 'rgba(10,10,10,0.95)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, zIndex: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
                      {filteredCats.map(c => (
                        <button key={c.id} onClick={() => { setCategory(c.id); setCatSearch(''); setShowCatDrop(false) }} style={{
                          width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                        }}>
                          <span style={{ fontSize: 18 }}>{c.icon}</span> {c.label}
                        </button>
                      ))}
                      {filteredCats.length === 0 && <div style={{ padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>No match — select "Other"</div>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Location */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Location *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setUseGps(false)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: !useGps ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.4)',
                  border: !useGps ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: !useGps ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
                }}>📝 Enter Address</button>
                <button onClick={() => setUseGps(true)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: useGps ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.4)',
                  border: useGps ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: useGps ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
                }}>📍 Use My Location</button>
              </div>
              {!useGps && <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." style={inputStyle} />}
              {useGps && coords && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 13, color: '#8DC63F', fontWeight: 700 }}>
                  ✓ GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </div>
              )}
              {useGps && !coords && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Getting location...</div>}
            </div>

            {/* Bio */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>About Your Business</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell customers what makes your business special..." rows={3} style={{ ...inputStyle, resize: 'none', minHeight: 80 }} />
            </div>

            {/* Social Media */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Social Media (shown on your card)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setPrimarySocial('instagram')} style={{ width: 36, height: 36, borderRadius: 10, border: primarySocial === 'instagram' ? '2px solid #E1306C' : '1px solid rgba(255,255,255,0.08)', background: primarySocial === 'instagram' ? 'rgba(225,48,108,0.15)' : 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📸</button>
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram username" style={{ ...inputStyle, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setPrimarySocial('facebook')} style={{ width: 36, height: 36, borderRadius: 10, border: primarySocial === 'facebook' ? '2px solid #1877F2' : '1px solid rgba(255,255,255,0.08)', background: primarySocial === 'facebook' ? 'rgba(24,119,242,0.15)' : 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📘</button>
                  <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook page" style={{ ...inputStyle, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setPrimarySocial('tiktok')} style={{ width: 36, height: 36, borderRadius: 10, border: primarySocial === 'tiktok' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)', background: primarySocial === 'tiktok' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎵</button>
                  <input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="TikTok username" style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Tap icon to set as primary (shown on your place card)</div>
            </div>

            {/* Next button */}
            <button onClick={() => setStep(2)} disabled={!canProceed} style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: canProceed ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
              color: canProceed ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 900,
              cursor: canProceed ? 'pointer' : 'default', fontFamily: 'inherit',
              boxShadow: canProceed ? '0 4px 20px rgba(141,198,63,0.3)' : 'none',
            }}>Continue to Payment →</button>
          </div>
        )}

        {/* ═══ STEP 2: Payment ═══ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Fee info */}
            <div style={{ ...glass, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Annual Listing Fee</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FACC15' }}>Rp 100,000</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Valid for 1 year from activation</div>
            </div>

            {/* QRIS Code */}
            <div style={{ ...glass, padding: 20, textAlign: 'center' }}>
              <label style={{ ...labelStyle, textAlign: 'center' }}>Scan QRIS to Pay</label>
              <div style={{ width: 200, height: 200, margin: '12px auto', borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#333', fontWeight: 700 }}>
                QRIS Code<br />from Admin
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Scan with any e-wallet (GoPay, OVO, Dana, etc.)</div>
            </div>

            {/* Upload screenshot */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={labelStyle}>Upload Payment Screenshot *</label>
              <button onClick={() => qrisRef.current?.click()} style={{
                width: '100%', height: 120, borderRadius: 14, border: '2px dashed rgba(250,204,21,0.3)',
                background: qrisPreview ? `url(${qrisPreview}) center/cover no-repeat` : 'rgba(0,0,0,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700,
              }}>
                {!qrisPreview && '📄 Tap to upload screenshot'}
              </button>
              <input ref={qrisRef} type="file" accept="image/*" onChange={handleQris} style={{ display: 'none' }} />
            </div>

            {/* Summary */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Application Summary</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Business</span><span style={{ color: '#fff', fontWeight: 700 }}>{businessName}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Owner</span><span style={{ color: '#fff', fontWeight: 700 }}>{ownerName}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>WhatsApp</span><span style={{ color: '#fff', fontWeight: 700 }}>{whatsapp}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Category</span><span style={{ color: '#8DC63F', fontWeight: 700 }}>{selectedCat?.icon} {selectedCat?.label}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Social</span><span style={{ color: '#fff', fontWeight: 700 }}>{primarySocial === 'instagram' ? `📸 ${instagram || '—'}` : primarySocial === 'facebook' ? `📘 ${facebook || '—'}` : `🎵 ${tiktok || '—'}`}</span></div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>← Back</button>
              <button onClick={handleSubmit} disabled={!qrisScreenshot} style={{
                flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
                background: qrisScreenshot ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
                color: qrisScreenshot ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 900,
                cursor: qrisScreenshot ? 'pointer' : 'default', fontFamily: 'inherit',
                boxShadow: qrisScreenshot ? '0 4px 20px rgba(141,198,63,0.3)' : 'none',
              }}>Send Application</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Success ═══ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '3px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Application Sent!</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.5 }}>
              Admin will review your listing and contact you via WhatsApp to confirm activation.
            </p>
            <div style={{ ...glass, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{selectedCat?.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{businessName}</div>
                <div style={{ fontSize: 12, color: '#8DC63F' }}>Pending approval</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              padding: '14px 40px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(141,198,63,0.3)', marginTop: 12,
            }}>Done</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
