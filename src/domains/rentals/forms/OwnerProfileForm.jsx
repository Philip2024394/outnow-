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
  const [showAgreement, setShowAgreement] = useState(false)
  const [showPlanSelect, setShowPlanSelect] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [localAgreement, setLocalAgreement] = useState(
    '1. Valid KTP (National ID Card) required\n2. SIM C (Motorcycle) or SIM A (Car) license required\n3. WhatsApp contact number must be provided\n4. KTP held as collateral during rental period\n5. Return vehicle with full tank of fuel\n6. Late return charged per hour based on daily rate\n7. Renter responsible for all traffic violations and fines\n8. Renter liable for any damage to the vehicle\n9. Vehicle must not be taken outside agreed area\n10. Sub-renting or lending to third party is prohibited'
  )
  const [touristAgreement, setTouristAgreement] = useState(
    '1. Valid Passport (physical or copy) required\n2. International Driving Permit (IDP) mandatory\n3. Small deposit paid in advance to secure booking\n4. Bank details of deposit must match passport name\n5. Proof of hotel/villa stay with remaining days required\n6. All documents must match (passport, bank, hotel booking)\n7. Emergency local contact must be provided\n8. Return vehicle with full tank of fuel (Pertamax)\n9. Late return charged per hour based on daily rate\n10. Renter responsible for damage and third-party costs\n11. Vehicle cannot leave the island\n12. Sub-renting or lending to third party is prohibited'
  )
  const [editingAgreementTab, setEditingAgreementTab] = useState('local')
  const [agreementAccepted, setAgreementAccepted] = useState(false)

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
            <p style={{ fontSize: 16, fontWeight: 700, color: '#8DC63F', margin: 0 }}>Welcome to Indoo Rentals</p>
            <button onClick={() => { setProcessing(false); setActivated(false); setShowPlanSelect(true) }} style={{ marginTop: 16, padding: '14px 40px', background: '#8DC63F', border: 'none', borderRadius: 14, color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
              Continue →
            </button>
          </div>
        )}
      </div>,
      document.body
    )
  }

  // Welcome screen — simple, clear, one path
  if (showPlanSelect) {
    const handleContinue = () => {
      try {
        const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
        p.plan = 'free'
        p.plan_started = new Date().toISOString()
        localStorage.setItem('indoo_rental_owner', JSON.stringify(p))
      } catch {}
      setShowPlanSelect(false)
      onComplete?.({ ownerId, ownerType, fullName, companyName, yearEstablished, whatsapp, email, city, address, fleetSize, bio, plan: 'free', rentalAgreement: { local: localAgreement, tourist: touristAgreement, accepted: agreementAccepted } })
    }

    return createPortal(
      <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_51_21%20PM.png?updatedAt=1776513101123)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />

        <div className={styles.content} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '40px 20px' }}>

          {/* Bike image */}
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_04_09%20AM.png" alt="" style={{ width: 140, height: 140, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))', marginBottom: 24 }} />

          {/* Welcome text */}
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>Welcome to Indoo</h1>
          <p style={{ fontSize: 14, color: '#8DC63F', fontWeight: 700, margin: '0 0 30px', textAlign: 'center' }}>Start earning today</p>

          {/* Simple package card */}
          <div style={{
            width: '100%', maxWidth: 340, padding: '24px 20px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(141,198,63,0.25)', borderRadius: 20,
            boxShadow: '0 0 20px rgba(141,198,63,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {/* Main message */}
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>Free To Join And Do Business</h2>
            <p style={{ fontSize: 14, color: '#8DC63F', fontWeight: 700, textAlign: 'center', margin: '0 0 20px' }}>Start With Your First Order Today</p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '✅', text: 'No sign-up fees', sub: 'Create your account completely free' },
                { icon: '🏍️', text: 'List unlimited vehicles', sub: 'Motorbikes, cars, trucks — list them all' },
                { icon: '💬', text: 'Connect with renters', sub: 'In-app chat to manage bookings' },
                { icon: '📊', text: 'Track your earnings', sub: 'Wallet dashboard with full history' },
                { icon: '🌍', text: 'Reach millions of tourists', sub: 'Your listings visible across Indonesia' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.text}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={handleContinue} style={{
            width: '100%', maxWidth: 340, marginTop: 20, padding: '16px 0',
            borderRadius: 14, background: '#8DC63F', border: 'none',
            color: '#000', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}>
            Get Started →
          </button>

          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 10, textAlign: 'center' }}>
            By continuing you agree to Indoo's <span style={{ color: 'rgba(141,198,63,0.5)', textDecoration: 'underline', cursor: 'pointer' }}>terms of service</span> including commission rates
          </p>
        </div>
      </div>,
      document.body
    )
  }

  // Old plan code removed — wallet system handles everything now
  if (false) {
    const _unused = [
      {
        id: '_removed', features: [
          { t: 'placeholder', y: true },
          { t: 'Basic rental card', y: true },
          { t: 'Standard search position', y: true },
          { t: 'Views count only', y: true },
          { t: 'WhatsApp direct contact', y: false },
          { t: 'GPS live tracking', y: false },
          { t: 'Analytics dashboard', y: false },
          { t: 'Custom rental agreement', y: false },
          { t: 'Verified owner badge', y: false },
        ],
      },
      {
        id: 'standard', name: 'Cruiser', tagline: 'Ride With Confidence', price: '49.000', color: '#3B82F6', commission: '5%',
        commColor: '#F59E0B', commBg: 'rgba(245,158,11,0.08)', commBorder: 'rgba(245,158,11,0.2)',
        contact: 'WhatsApp direct', badge: null, stars: 3, img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_06_08%20AM.png',
        features: [
          { t: 'Up to 10 listings', y: true },
          { t: 'WhatsApp direct to renters', y: true },
          { t: 'Enhanced rental card', y: true },
          { t: 'Boosted search position', y: true },
          { t: 'Views + booking analytics', y: true },
          { t: 'Editable rental agreement', y: true },
          { t: 'Email support', y: true },
          { t: 'GPS live tracking', y: false },
          { t: 'Full analytics dashboard', y: false },
          { t: 'Verified owner badge', y: false },
        ],
      },
      {
        id: 'premium', name: 'Superbike', tagline: 'Full Throttle Power', price: '79.000', color: '#FFD700', commission: '0%',
        commColor: '#8DC63F', commBg: 'rgba(141,198,63,0.08)', commBorder: 'rgba(141,198,63,0.2)',
        contact: 'WhatsApp + GPS Tracking', badge: 'BEST VALUE', stars: 5, img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_04_09%20AM.png',
        features: [
          { t: 'Unlimited listings', y: true },
          { t: 'WhatsApp direct to renters', y: true },
          { t: 'Live GPS tracking on rentals', y: true },
          { t: 'Premium rental card design', y: true },
          { t: 'Top priority in search results', y: true },
          { t: 'Full analytics dashboard', y: true },
          { t: 'Custom branded agreement', y: true },
          { t: '✓ Verified Owner badge', y: true },
          { t: 'Priority WhatsApp support', y: true },
          { t: '0% commission — keep all', y: true },
        ],
      },
    ]
    return createPortal(
      <div className={styles.screen} style={{ backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2018,%202026,%2006_51_21%20PM.png?updatedAt=1776513101123)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0, position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>Choose Your Plan</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '6px 0 0', fontWeight: 500 }}>Start free or upgrade for more power</p>
        </div>

        <div className={styles.content} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '100px 0 20px' }}>
            {plans.map(plan => {
              const sel = selectedPlan === plan.id
              return (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
                  padding: '18px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  position: 'relative', overflow: 'hidden',
                  background: sel ? `rgba(0,0,0,0.75)` : 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: sel ? `2px solid ${plan.color}` : '1.5px solid rgba(255,255,255,0.08)',
                  boxShadow: sel ? `0 0 25px ${plan.color}44, inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'all 0.25s',
                }}>
                  {/* Badge */}
                  {plan.badge && <div style={{ position: 'absolute', top: 12, right: plan.img ? 90 : 12, padding: '4px 12px', background: plan.color, borderRadius: 8, fontSize: 9, fontWeight: 900, color: '#000', letterSpacing: '0.05em', zIndex: 2 }}>{plan.badge}</div>}
                  {/* Package image */}
                  {plan.img && <img src={plan.img} alt="" style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 120, height: 120, objectFit: 'contain', opacity: 0.9, pointerEvents: 'none', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />}

                  {/* Name + Tagline + Stars + Price row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingRight: plan.badge ? 80 : 0 }}>
                    <div>
                      <span style={{ fontSize: 19, fontWeight: 900, color: plan.color }}>{plan.name}</span>
                      <div style={{ fontSize: 12, color: '#fff', marginTop: 2, fontWeight: 700, fontStyle: 'italic', opacity: 0.6 }}>{plan.tagline}</div>
                      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                        {Array.from({ length: 5 }, (_, si) => (
                          <span key={si} style={{ fontSize: 12, color: si < plan.stars ? plan.color : 'rgba(255,255,255,0.1)' }}>★</span>
                        ))}
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 4, fontWeight: 700, alignSelf: 'center' }}>{plan.stars === 5 ? 'Most Popular' : plan.stars === 3 ? 'Popular' : 'Starter'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 600 }}>{plan.contact}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Rp</span>
                        <span style={{ fontSize: 26, fontWeight: 900, color: plan.color }}>{plan.price}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/month</span>
                    </div>
                  </div>

                  {/* Commission badge — grey with running light */}
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 12, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(90deg, transparent 0%, ${plan.color}15 50%, transparent 100%)`, animation: 'commGlow 3s ease-in-out infinite', pointerEvents: 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1 }}>{plan.commission === '0%' ? '0% Commission — Keep All Earnings' : `${plan.commission} Commission Per Booking`}</span>
                  </div>

                  {/* Features — single column for readability */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {plan.features.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: f.y ? plan.color : 'rgba(255,255,255,0.15)', flexShrink: 0 }}>{f.y ? '✓' : '✕'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: f.y ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)', textDecoration: f.y ? 'none' : 'line-through' }}>{f.t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fingerprint select button — bottom right */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <div onClick={e => { e.stopPropagation(); setSelectedPlan(plan.id) }} style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: sel ? plan.color : 'rgba(255,255,255,0.06)',
                      border: sel ? 'none' : '1.5px solid rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.25s',
                      boxShadow: sel ? `0 0 16px ${plan.color}55` : 'none',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sel ? '#000' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18.9 8a8.1 8.1 0 0 0-2.2-3.8A8 8 0 0 0 4 12c0 2.2.5 3.9 1.3 5.3"/>
                        <path d="M12 4a8 8 0 0 1 8 8c0 2.5-.7 4.2-1.6 5.5"/>
                        <path d="M8 12a4 4 0 0 1 8 0c0 1.4-.3 2.5-.8 3.4"/>
                        <path d="M12 8a4 4 0 0 0-4 4c0 1.8.5 3.2 1.2 4.2"/>
                        <path d="M12 12v8"/>
                      </svg>
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {sel && <div style={{ marginTop: 6, textAlign: 'center', fontSize: 10, fontWeight: 800, color: plan.color, letterSpacing: '0.04em' }}>✓ SELECTED</div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px 24px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => {
              const plan = selectedPlan || 'free'
              try {
                const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
                p.plan = plan
                p.plan_started = new Date().toISOString()
                if (plan !== 'free') p.plan_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                localStorage.setItem('indoo_rental_owner', JSON.stringify(p))
              } catch {}
              setShowPlanSelect(false)
              onComplete?.({ ownerId, ownerType, fullName, companyName, yearEstablished, whatsapp, email, city, address, fleetSize, bio, plan, rentalAgreement: { local: localAgreement, tourist: touristAgreement, accepted: agreementAccepted } })
            }}
            disabled={!selectedPlan}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: !selectedPlan ? 'rgba(255,255,255,0.06)' : selectedPlan === 'free' ? '#8DC63F' : selectedPlan === 'standard' ? '#3B82F6' : '#FFD700',
              border: 'none', color: selectedPlan ? '#000' : 'rgba(255,255,255,0.2)',
              fontSize: 15, fontWeight: 800, cursor: selectedPlan ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: selectedPlan ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.25s',
            }}
          >
            {selectedPlan === 'premium' ? 'Start Premium →' : selectedPlan === 'standard' ? 'Start Standard →' : selectedPlan === 'free' ? 'Continue Free →' : 'Select a Plan'}
          </button>
          {selectedPlan && selectedPlan !== 'free' && (
            <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Cancel anytime · 7 day free trial</p>
          )}
        </div>
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
      rentalAgreement: { local: localAgreement, tourist: touristAgreement, accepted: agreementAccepted },
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

            {/* Rental Agreement */}
            <div style={{ marginTop: 16, padding: '14px', background: 'rgba(141,198,63,0.04)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Rental Agreement</span>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0', fontWeight: 500 }}>Set rules for local & tourist rentals</p>
                  </div>
                </div>
                <button onClick={() => setShowAgreement(true)} style={{ padding: '8px 14px', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  View & Edit
                </button>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(141,198,63,0.4)', margin: '8px 0 0', lineHeight: 1.4 }}>
                Pre-filled with standard Indonesian rental terms. You can edit these to match your business. These terms will be shown to renters before they book.
              </p>

              {/* Acceptance checkbox */}
              <button onClick={() => setAgreementAccepted(!agreementAccepted)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: agreementAccepted ? '#8DC63F' : 'transparent', border: agreementAccepted ? 'none' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', boxShadow: agreementAccepted ? '0 0 8px rgba(141,198,63,0.3)' : 'none' }}>
                  {agreementAccepted && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: agreementAccepted ? '#8DC63F' : 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                  I agree to use these rental terms for all my listings
                </span>
              </button>
            </div>

            {/* Bike image — inside container, below Agreement */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, marginRight: -30, marginBottom: -10 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{
                width: 140, height: 140, objectFit: 'contain',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))',
              }} />
            </div>

          </div>

        </div>
      </div>

      {/* Rental Agreement Popup Editor */}
      {showAgreement && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#111', border: '1.5px solid rgba(141,198,63,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(141,198,63,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            {/* Header */}
            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Rental Agreement</span>
              </div>
              <button onClick={() => setShowAgreement(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
              <button onClick={() => setEditingAgreementTab('local')} style={{ flex: 1, padding: '12px 0', background: editingAgreementTab === 'local' ? 'rgba(141,198,63,0.1)' : 'transparent', border: 'none', borderBottom: editingAgreementTab === 'local' ? '2px solid #8DC63F' : '2px solid transparent', color: editingAgreementTab === 'local' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                🇮🇩 Local Rental
              </button>
              <button onClick={() => setEditingAgreementTab('tourist')} style={{ flex: 1, padding: '12px 0', background: editingAgreementTab === 'tourist' ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', borderBottom: editingAgreementTab === 'tourist' ? '2px solid #FFD700' : '2px solid transparent', color: editingAgreementTab === 'tourist' ? '#FFD700' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✈️ Tourist Rental
              </button>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '0 0 8px', fontWeight: 500 }}>
                Edit the terms below. Each line is one requirement. These will be shown to renters.
              </p>
              {editingAgreementTab === 'local' ? (
                <textarea
                  value={localAgreement}
                  onChange={e => setLocalAgreement(e.target.value)}
                  style={{ width: '100%', minHeight: 250, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <textarea
                  value={touristAgreement}
                  onChange={e => setTouristAgreement(e.target.value)}
                  style={{ width: '100%', minHeight: 300, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 16px 16px', flexShrink: 0 }}>
              <button onClick={() => setShowAgreement(false)} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>
                Save Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.nextBtn} onClick={handleSubmit}>
          Create Account
        </button>
      </div>
    </div>,
    document.body)
}
