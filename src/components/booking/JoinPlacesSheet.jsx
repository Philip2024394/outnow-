/**
 * JoinPlacesSheet — Business registration for INDOO PLACES.
 * Flow: 1. Select Package → 2. Business Details → 3. Payment → 4. Success
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { DIRECTORY_CATEGORIES } from '@/services/directoryService'
import { useGeolocation } from '@/hooks/useGeolocation'
import { submitPlacesApplication, TIERS } from '@/services/placesListingService'
import IndooFooter from '@/components/ui/IndooFooter'

const BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_24_37%20PM.png'

const ALL_BUSINESS_TYPES = [
  ...DIRECTORY_CATEGORIES.map(c => ({ id: c.id, icon: c.icon, label: c.label })),
  { id: 'hotel', icon: '🏨', label: 'Hotel & Accommodation' },
  { id: 'cafe', icon: '☕', label: 'Café & Coffee Shop' },
  { id: 'bakery', icon: '🥐', label: 'Bakery & Pastry' },
  { id: 'pharmacy', icon: '💊', label: 'Pharmacy' },
  { id: 'laundry', icon: '🧺', label: 'Laundry Service' },
  { id: 'pet', icon: '🐾', label: 'Pet Shop & Vet' },
  { id: 'auto', icon: '🔧', label: 'Auto Repair & Service' },
  { id: 'electronics', icon: '📱', label: 'Electronics & Phone' },
  { id: 'clothing', icon: '👗', label: 'Clothing & Fashion' },
  { id: 'tour', icon: '🗺️', label: 'Tour & Travel Agent' },
  { id: 'coworking', icon: '💻', label: 'Coworking Space' },
  { id: 'yoga', icon: '🧘', label: 'Yoga & Wellness' },
  { id: 'diving', icon: '🤿', label: 'Diving & Water Sports' },
  { id: 'surfing', icon: '🏄', label: 'Surfing School' },
  { id: 'wedding', icon: '💒', label: 'Wedding & Event Venue' },
  { id: 'school', icon: '📚', label: 'Language & Training' },
  { id: 'other', icon: '📍', label: 'Other' },
]

const glass = { background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }
const inp = { width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box', background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }
const lbl = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }
function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function JoinPlacesSheet({ open, onClose }) {
  const { coords } = useGeolocation()
  const [step, setStep] = useState(1) // 1=packages, 2=details, 3=payment, 4=success
  const fileRef = useRef(null)
  const qrisRef = useRef(null)

  const [tier, setTier] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bio, setBio] = useState('')
  const [address, setAddress] = useState('')
  const [useGps, setUseGps] = useState(false)
  const [category, setCategory] = useState('')
  const [catSearch, setCatSearch] = useState('')
  const [showCatDrop, setShowCatDrop] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [primarySocial, setPrimarySocial] = useState('instagram')
  const [qrisPreview, setQrisPreview] = useState(null)
  const [referralCode, setReferralCode] = useState('')
  const [showReferral, setShowReferral] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const selectedCat = ALL_BUSINESS_TYPES.find(c => c.id === category)
  const filteredCats = catSearch.trim() ? ALL_BUSINESS_TYPES.filter(c => c.label.toLowerCase().includes(catSearch.toLowerCase())) : ALL_BUSINESS_TYPES
  const tierData = TIERS[tier] || TIERS.basic
  const canPublish = businessName.trim() && ownerName.trim() && whatsapp.trim() && category && (address.trim() || useGps)

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = await submitPlacesApplication({
      businessName, ownerName, whatsapp, bio, category,
      address: useGps && coords ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : address,
      instagram, facebook, tiktok, primarySocial,
      tier, fee: tierData.price, discount,
      referredBy: referralCode.trim() || null,
    })
    setGeneratedCode(result.referralCode)
    setSubmitting(false)
    setStep(4)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: `#0a0a0a url("${BG}") center/cover no-repeat`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Join <span style={{ color: '#8DC63F' }}>INDOO PLACES</span></h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontWeight: 600 }}>
            {step === 1 ? 'Choose your package' : step === 2 ? 'Your business details' : step === 3 ? 'Complete payment' : 'Welcome!'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px' }}>
        {[1, 2, 3, 4].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? '#8DC63F' : 'rgba(255,255,255,0.1)' }} />)}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>

        {/* ═══ STEP 1 — SELECT PACKAGE ═══ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Get Your Business Listed</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Thousands of tourists & locals discover places on Indoo every day</p>
            </div>

            {/* Basic Package */}
            <button onClick={() => { setTier('basic'); setStep(2) }} style={{
              ...glass, padding: '20px 18px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              border: '1.5px solid rgba(141,198,63,0.3)', width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>Basic</div>
                <div><span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{fmtRp(100000)}</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/year</span></div>
              </div>
              {['Business name & photo on card', 'WhatsApp contact button', '1 social media link displayed', 'Standard placement in search', 'Visible to all Indoo users'].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#8DC63F' }}>✓</span> {f}
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '12px 0', borderRadius: 12, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.25)', textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>
                Select Basic →
              </div>
            </button>

            {/* Premium Package */}
            <button onClick={() => { setTier('premium'); setStep(2) }} style={{
              ...glass, padding: '20px 18px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              border: '1.5px solid rgba(250,204,21,0.4)', width: '100%', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 14px', borderRadius: '0 0 0 12px', background: '#FACC15', fontSize: 10, fontWeight: 900, color: '#000' }}>RECOMMENDED</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>⭐ Premium</div>
                <div><span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{fmtRp(250000)}</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/year</span></div>
              </div>
              {['Everything in Basic', 'Featured placement for 30 days', 'Larger card in carousel', 'Priority in search results', 'Verified badge ✓ on card', 'Analytics dashboard (views, rides)', 'Ratings & reviews from riders', 'Referral bonus program'].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#FACC15' }}>✓</span> {f}
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '12px 0', borderRadius: 12, background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#FACC15' }}>
                Select Premium →
              </div>
            </button>

            {/* Referral */}
            <div style={{ ...glass, padding: 14 }}>
              <button onClick={() => setShowReferral(!showReferral)} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                🎁 Have a referral code? {showReferral ? '▲' : '▼'}
              </button>
              {showReferral && (
                <div style={{ marginTop: 8 }}>
                  <input value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="INDOO-XXXX1234" style={inp} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>You both get 1 month bonus</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — BUSINESS DETAILS ═══ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '8px 14px', borderRadius: 10, background: tier === 'premium' ? 'rgba(250,204,21,0.1)' : 'rgba(141,198,63,0.08)', border: `1px solid ${tier === 'premium' ? 'rgba(250,204,21,0.25)' : 'rgba(141,198,63,0.2)'}`, fontSize: 13, fontWeight: 800, color: tier === 'premium' ? '#FACC15' : '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{tier === 'premium' ? '⭐ Premium' : 'Basic'} Package — {fmtRp(tierData.price)}/yr</span>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
            </div>

            {/* Photo */}
            <div style={{ ...glass, padding: 16, textAlign: 'center' }}>
              <label style={lbl}>Business Photo</label>
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', height: 120, borderRadius: 14, border: '2px dashed rgba(141,198,63,0.3)',
                background: imagePreview ? `url(${imagePreview}) center/cover` : 'rgba(0,0,0,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
                color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700,
              }}>
                {!imagePreview && <><span>📷 Upload photo</span><span style={{ fontSize: 11, fontWeight: 600 }}>Best size: 800 × 500px (landscape)</span></>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setImagePreview(URL.createObjectURL(f)) }} style={{ display: 'none' }} />
            </div>

            {/* Name */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Business Name *</label>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Warung Sate Pak Ahmad" style={inp} />
            </div>

            {/* Owner + WhatsApp */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ ...glass, padding: 14, flex: 1 }}>
                <label style={lbl}>Owner Name *</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your name" style={inp} />
              </div>
              <div style={{ ...glass, padding: 14, flex: 1 }}>
                <label style={lbl}>WhatsApp *</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123..." type="tel" style={inp} />
              </div>
            </div>

            {/* Category */}
            <div style={{ ...glass, padding: 16, position: 'relative', zIndex: 5 }}>
              <label style={lbl}>Business Type *</label>
              {selectedCat ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(141,198,63,0.12)', border: '1.5px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{selectedCat.icon}</span> {selectedCat.label}
                  </div>
                  <button onClick={() => { setCategory(''); setCatSearch('') }} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
                </div>
              ) : (
                <>
                  <input value={catSearch} onChange={e => { setCatSearch(e.target.value); setShowCatDrop(true) }} onFocus={() => setShowCatDrop(true)} placeholder="Type to search..." style={inp} />
                  {showCatDrop && (
                    <div style={{ position: 'absolute', left: 16, right: 16, top: '100%', marginTop: -8, maxHeight: 180, overflowY: 'auto', background: 'rgba(10,10,10,0.95)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, zIndex: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
                      {filteredCats.map(c => (
                        <button key={c.id} onClick={() => { setCategory(c.id); setCatSearch(''); setShowCatDrop(false) }} style={{ width: '100%', padding: '11px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                          <span style={{ fontSize: 16 }}>{c.icon}</span> {c.label}
                        </button>
                      ))}
                      {filteredCats.length === 0 && <div style={{ padding: 14, color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' }}>No match</div>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Location */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Location *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setUseGps(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', background: !useGps ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.4)', border: !useGps ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)', color: !useGps ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>📝 Address</button>
                <button onClick={() => setUseGps(true)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', background: useGps ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.4)', border: useGps ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)', color: useGps ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>📍 GPS</button>
              </div>
              {!useGps && <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." style={inp} />}
              {useGps && coords && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 13, color: '#8DC63F', fontWeight: 700 }}>✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
            </div>

            {/* Bio */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>About Your Business</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What makes your business special..." rows={3} style={{ ...inp, resize: 'none', minHeight: 70 }} />
            </div>

            {/* Visit Us Discount */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>🎁 Visit Us Discount (optional)</label>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Customers show your Indoo card on arrival for a discount</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[0, 5, 10, 15, 20, 25, 30, 50].map(v => (
                  <button key={v} onClick={() => setDiscount(v)} style={{
                    padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    background: discount === v ? (v > 0 ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)') : 'rgba(0,0,0,0.4)',
                    border: discount === v ? (v > 0 ? '2px solid rgba(250,204,21,0.5)' : '2px solid rgba(141,198,63,0.4)') : '1px solid rgba(255,255,255,0.08)',
                    color: discount === v ? (v > 0 ? '#FACC15' : '#8DC63F') : 'rgba(255,255,255,0.4)',
                    fontSize: 14, fontWeight: 800, minWidth: 44, minHeight: 44,
                  }}>{v === 0 ? 'None' : `${v}%`}</button>
                ))}
              </div>
              {discount > 0 && (
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🏷️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>Show on arrival — {discount}% OFF</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>This badge will appear on your place card</div>
                  </div>
                </div>
              )}
            </div>

            {/* Social */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Social Media (1 shown on card)</label>
              {[
                { key: 'instagram', icon: '📸', color: '#E1306C', val: instagram, set: setInstagram, ph: 'Instagram username' },
                { key: 'facebook', icon: '📘', color: '#1877F2', val: facebook, set: setFacebook, ph: 'Facebook page' },
                { key: 'tiktok', icon: '🎵', color: '#fff', val: tiktok, set: setTiktok, ph: 'TikTok username' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <button onClick={() => setPrimarySocial(s.key)} style={{ width: 36, height: 36, borderRadius: 10, border: primarySocial === s.key ? `2px solid ${s.color}` : '1px solid rgba(255,255,255,0.08)', background: primarySocial === s.key ? `${s.color}15` : 'rgba(0,0,0,0.4)', cursor: 'pointer', fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</button>
                  <input value={s.val} onChange={e => s.set(e.target.value)} placeholder={s.ph} style={{ ...inp, flex: 1 }} />
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Tap icon to select which shows on your card</div>
            </div>

            {/* Publish button */}
            <button onClick={() => setStep(3)} disabled={!canPublish} style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: canPublish ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
              color: canPublish ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 900,
              cursor: canPublish ? 'pointer' : 'default', fontFamily: 'inherit',
              boxShadow: canPublish ? '0 4px 20px rgba(141,198,63,0.3)' : 'none',
            }}>Publish Live →</button>
          </div>
        )}

        {/* ═══ STEP 3 — PAYMENT ═══ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...glass, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{tier === 'premium' ? '⭐ Premium' : 'Basic'} — 1 Year</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#FACC15' }}>{fmtRp(tierData.price)}</div>
            </div>

            {/* QRIS */}
            <div style={{ ...glass, padding: 20, textAlign: 'center' }}>
              <label style={{ ...lbl, textAlign: 'center' }}>Option 1 — Scan QRIS</label>
              <div style={{ width: 180, height: 180, margin: '12px auto', borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#333', fontWeight: 700, textAlign: 'center', padding: 10 }}>QRIS Code<br />from Admin</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>GoPay · OVO · Dana · LinkAja</div>
            </div>

            {/* Bank */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={{ ...lbl }}>Option 2 — Bank Transfer</label>
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: '#fff' }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Bank BCA</div>
                <div style={{ color: '#FACC15', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>1234567890</div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>a/n INDOO INDONESIA</div>
              </div>
            </div>

            {/* Screenshot upload */}
            <div style={{ ...glass, padding: 16 }}>
              <label style={lbl}>Upload Payment Screenshot *</label>
              <button onClick={() => qrisRef.current?.click()} style={{
                width: '100%', height: 100, borderRadius: 14, border: '2px dashed rgba(250,204,21,0.3)',
                background: qrisPreview ? `url(${qrisPreview}) center/cover` : 'rgba(0,0,0,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700,
              }}>{!qrisPreview && '📄 Upload screenshot'}</button>
              <input ref={qrisRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setQrisPreview(URL.createObjectURL(f)) }} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={handleSubmit} disabled={!qrisPreview || submitting} style={{
                flex: 2, padding: '14px 0', borderRadius: 14, border: 'none',
                background: qrisPreview ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
                color: qrisPreview ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 900,
                cursor: qrisPreview ? 'pointer' : 'default', fontFamily: 'inherit',
              }}>{submitting ? 'Sending...' : 'Submit & Pay'}</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4 — SUCCESS ═══ */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '3px solid #8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Application Sent!</h2>
            {tier === 'premium' && <div style={{ padding: '4px 14px', borderRadius: 20, background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.3)', color: '#FACC15', fontSize: 13, fontWeight: 800 }}>⭐ Premium Listing</div>}

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 300, lineHeight: 1.6 }}>
              Your listing will be live soon! Admin will review your payment and contact you via WhatsApp to confirm activation.
            </p>

            <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', marginTop: 4 }}>Welcome to INDOO PLACES 🎉</div>

            <div style={{ ...glass, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 300 }}>
              <span style={{ fontSize: 20 }}>{selectedCat?.icon}</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{businessName}</div>
                <div style={{ fontSize: 12, color: '#F59E0B' }}>Pending review</div>
              </div>
            </div>

            {/* Referral code */}
            <div style={{ ...glass, padding: '16px 20px', width: '100%', maxWidth: 300 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Your Referral Code</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(141,198,63,0.2)', fontSize: 16, fontWeight: 900, color: '#8DC63F', letterSpacing: '0.05em' }}>{generatedCode}</div>
                <button onClick={() => { navigator.clipboard?.writeText(generatedCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? '✓' : '📋'}</button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Share with other businesses — you both get 1 month bonus!</div>
            </div>

            <button onClick={onClose} style={{
              padding: '14px 40px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
              color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(141,198,63,0.3)', marginTop: 8,
            }}>Done</button>
          </div>
        )}
      </div>
      <IndooFooter label="Places" onBack={step > 1 && step < 4 ? () => setStep(step - 1) : undefined} onHome={onClose} />
    </div>,
    document.body
  )
}
