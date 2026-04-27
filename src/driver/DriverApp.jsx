/**
 * DriverApp — Standalone driver PWA for indoodrive.id
 * Login → Dashboard with tabs: Rides | Food | Deals | Earnings | Profile
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import DriverEarningsScreen from '@/components/driver/DriverEarningsScreen'
import DriverTripScreen from '@/components/driver/DriverTripScreen'
import DriverIncomingBooking from '@/components/driver/DriverIncomingBooking'
import DriverFoodOrderAlert from '@/components/driver/DriverFoodOrderAlert'
import DriverCashFloatModal from '@/components/driver/DriverCashFloatModal'
import DriverSignInGate from '@/components/driver/DriverSignInGate'
import { getDriverTier } from '@/services/driverTierService'
import { getDriverGoals } from '@/services/driverIncentiveService'
import { fetchDriverTripHistory } from '@/services/bookingService'
import { getDriverFoodOrders } from '@/services/foodOrderService'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'rides', label: 'Rides', icon: '🏍️' },
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

// Demo driver profile
const DEMO_PROFILE = {
  id: 'driver-demo',
  display_name: 'Agus Prasetyo',
  email: 'agus@indoo.id',
  phone: '081234567999',
  vehicle_type: 'bike_ride',
  vehicle_brand: 'Honda',
  vehicle_model: 'Vario 150',
  vehicle_plate: 'AB 1234 XY',
  rating: 4.9,
  total_trips: 247,
  photo_url: 'https://i.pravatar.cc/200?img=12',
  is_online: false,
  city: 'Yogyakarta',
}

export default function DriverApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)

  // Dashboard state
  const [tab, setTab] = useState('home')
  const [profile, setProfile] = useState(DEMO_PROFILE)
  const [isOnline, setIsOnline] = useState(false)
  const [tier, setTier] = useState(null)
  const [goals, setGoals] = useState(null)
  const [todayTrips, setTodayTrips] = useState(0)
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [foodOrders, setFoodOrders] = useState([])
  const [activeBooking, setActiveBooking] = useState(null)
  const [incomingBooking, setIncomingBooking] = useState(null)
  const [incomingFoodOrder, setIncomingFoodOrder] = useState(null)
  const [showCashFloat, setShowCashFloat] = useState(false)
  const [showEarnings, setShowEarnings] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('indoo_driver_terms_accepted') === 'true')
  const [showHotspotMap, setShowHotspotMap] = useState(false)

  // Auth
  useEffect(() => {
    if (!supabase) {
      setUser({ id: 'demo', email: 'driver@indoo.id' })
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  // Load driver data on login
  useEffect(() => {
    if (!user) return
    const driverId = user.id
    getDriverTier(driverId).then(t => setTier(t)).catch(() => {})
    getDriverGoals(driverId).then(g => setGoals(g)).catch(() => {})
    fetchDriverTripHistory(driverId, 50).then(trips => {
      const today = new Date().toDateString()
      const todayList = (trips ?? []).filter(t => new Date(t.created_at).toDateString() === today)
      setTodayTrips(todayList.length)
      setTodayEarnings(todayList.reduce((s, t) => s + (t.fare ?? 0), 0))
    }).catch(() => {})
    getDriverFoodOrders(driverId).then(o => setFoodOrders(o ?? [])).catch(() => setFoodOrders([]))
  }, [user])

  const handleAuth = async () => {
    if (!loginEmail.trim() || !loginPass.trim()) return
    setSigningIn(true)
    setLoginError(null)
    if (!supabase) {
      setTimeout(() => { setUser({ id: 'demo', email: loginEmail }); setSigningIn(false) }, 800)
      return
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass })
      if (error) setLoginError(error.message)
    } catch (err) { setLoginError(err.message) }
    finally { setSigningIn(false) }
  }

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setIsOnline(false)
  }

  const toggleOnline = () => {
    if (!isOnline) {
      setShowCashFloat(true)
    } else {
      setIsOnline(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(141,198,63,0.2)', borderTopColor: '#8DC63F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Loading INDOO Drive...</span>
        </div>
      </div>
    )
  }

  // Login
  if (!user) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundImage: `url("${BG_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
              <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>DRIVE</span>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Driver Dashboard</p>
          </div>
          <div style={{ width: '100%', maxWidth: 360, padding: '28px 24px', borderRadius: 24, background: 'rgba(10,10,10,0.9)', border: '1.5px solid rgba(141,198,63,0.2)', backdropFilter: 'blur(20px)', animation: 'slideUp 0.4s ease' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Sign In</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Access your driver dashboard</p>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAuth() }} placeholder="Password" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
            {loginError && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 14 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{loginError}</span></div>}
            <button onClick={handleAuth} disabled={signingIn} style={{ width: '100%', padding: 16, borderRadius: 16, background: signingIn ? 'rgba(141,198,63,0.5)' : '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: signingIn ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {signingIn ? 'Please wait...' : 'Sign In'}
            </button>
          </div>
          <div style={{ marginTop: 32 }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>indoodrive.id · Powered by INDOO</span></div>
        </div>
      </div>
    )
  }

  // ── Terms & Conditions Gate ──
  if (!termsAccepted) {
    const tcSectionStyle = { marginTop: 24, marginBottom: 8 }
    const tcNumStyle = { color: '#8DC63F', fontWeight: 900 }
    const tcTitleStyle = { fontWeight: 800, color: '#fff' }
    const tcBodyStyle = { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: '0 0 0' }
    const tcRedStyle = { color: '#EF4444', fontWeight: 700 }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808', position: 'relative' }}>
        <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>INDOO Driver Agreement</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Please read and accept to continue</p>
          </div>

          {/* Terms content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
            <div style={{ padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', margin: '0 0 4px', textAlign: 'center' }}>TERMS & CONDITIONS</h2>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>INDOO DRIVER PLATFORM</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center', fontWeight: 700 }}>PT HAMMEREX PRODUCTS INDONESIA</p>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>

                {/* Section 1 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>1. </span><span style={tcTitleStyle}>PLATFORM STATUS</span></p>
                <p style={tcBodyStyle}>INDOO is a digital technology platform (penyedia aplikasi) that facilitates connections between independent service providers and customers. PT HAMMEREX PRODUCTS INDONESIA is not a transportation company, does not provide ride or delivery services, does not employ drivers, and does not act as a carrier, logistics provider, or agent. All services are performed solely by independent Drivers.</p>

                {/* Section 2 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>2. </span><span style={tcTitleStyle}>PARTNERSHIP MODEL (KEMITRAAN)</span></p>
                <p style={tcBodyStyle}>The relationship between the Company and Drivers is strictly a partnership (kemitraan). This agreement does not create employment, does not create wages or salary, and does not establish subordination. There are no fixed working hours, no obligation to accept orders, and no exclusivity requirement.</p>

                {/* Section 3 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>3. </span><span style={tcTitleStyle}>DRIVER AUTONOMY</span></p>
                <p style={tcBodyStyle}>Drivers have full control over: when to work, whether to accept or reject orders, routes taken, and operational methods. The Company does not give direct instructions or supervise Drivers.</p>

                {/* Section 4 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>4. </span><span style={tcTitleStyle}>PRICING FRAMEWORK</span></p>
                <p style={tcBodyStyle}>The Platform provides a digital pricing mechanism. Drivers agree to the displayed fare structure and authorize the Platform to calculate pricing. Pricing is a marketplace tool, not wages. The Company does not pay salaries and does not guarantee earnings.</p>

                {/* Section 5 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>5. </span><span style={tcTitleStyle}>SERVICE FEES</span></p>
                <p style={tcBodyStyle}>Drivers agree to pay a 10% platform service fee from each order.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>Non-payment within 30 days may result in: account suspension, access restriction, and a daily penalty increase of 20% applied to the total outstanding amount. This penalty covers loss of earnings, administrative processing, and recruitment fees and will continue to accumulate daily until the full balance is settled.</p>

                {/* Section 6 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>6. </span><span style={tcTitleStyle}>NO TRANSPORT OPERATOR LIABILITY</span></p>
                <p style={tcBodyStyle}>The Company is strictly an application provider, not a transport operator as contemplated under Indonesian transport frameworks. This aligns with the separation recognized in regulations between application providers and transport service providers.</p>

                {/* Section 7 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>7. </span><span style={tcTitleStyle}>FULL DRIVER LIABILITY</span></p>
                <p style={tcBodyStyle}>Drivers are fully responsible for: passenger safety, vehicle operation, delivery of goods, and compliance with traffic laws.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>The Company bears zero responsibility for: accidents, injuries or death, lost or damaged goods, and food quality or contamination.</p>

                {/* Section 8 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>8. </span><span style={tcTitleStyle}>INSURANCE REQUIREMENT</span></p>
                <p style={tcBodyStyle}>Drivers must maintain valid vehicle insurance and personal accident coverage (recommended) at all times while operating on the platform.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>If insurance is not active, the Driver assumes 100% legal and financial liability for any incident — including where the vehicle is owned by a third party.</p>

                {/* Section 9 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>9. </span><span style={tcTitleStyle}>INDEMNITY</span></p>
                <p style={tcBodyStyle}>Drivers agree to defend, indemnify, and hold harmless PT HAMMEREX PRODUCTS INDONESIA, its directors, officers, employees, and affiliates from any claims, lawsuits, damages, losses, costs, and government penalties arising from: Driver activities, legal violations, service performance, or any breach of these terms.</p>

                {/* Section 10 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>10. </span><span style={tcTitleStyle}>GOVERNMENT & LEGAL COMPLIANCE</span></p>
                <p style={tcBodyStyle}>Drivers are solely responsible for: SIM (driving licence), STNK (vehicle registration), taxes, and all permits required by Indonesian law. The Company is not responsible for regulatory classification, government enforcement, or legal compliance of drivers.</p>

                {/* Section 11 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>11. </span><span style={tcTitleStyle}>CONDUCT & PROFESSIONAL STANDARDS</span></p>
                <p style={tcBodyStyle}>Drivers must maintain professional and respectful behaviour with all passengers and customers. Drivers must only charge the fare price stated and approved by the platform. Overcharging, harassment, discrimination, or unprofessional conduct will result in immediate deactivation and potential legal action.</p>

                {/* Section 12 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>12. </span><span style={tcTitleStyle}>VEHICLE ROADWORTHINESS</span></p>
                <p style={tcBodyStyle}>All vehicles used on the INDOO platform must meet road safety and roadworthiness standards as required by Indonesian law. The Company reserves the right to deactivate any driver whose vehicle does not meet these standards.</p>

                {/* Section 13 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>13. </span><span style={tcTitleStyle}>CUSTOMER & THIRD-PARTY DISPUTES</span></p>
                <p style={tcBodyStyle}>All disputes are strictly between: Driver and customer, or Driver and third parties. The Company is not a party to any dispute and has no obligation to intervene.</p>

                {/* Section 14 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>14. </span><span style={tcTitleStyle}>LIMITATION OF LIABILITY</span></p>
                <p style={tcBodyStyle}>To the maximum extent permitted by Indonesian law, the Company shall not be liable for: personal injury or death, property damage, criminal acts by drivers, loss of income, or platform interruptions.</p>

                {/* Section 15 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>15. </span><span style={tcTitleStyle}>PLATFORM CONTROL DISCLAIMER</span></p>
                <p style={tcBodyStyle}>The Company does not control: driver behaviour, service quality, or execution of services. Platform features including ratings, pricing, and navigation are tools only — not instructions.</p>

                {/* Section 16 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>16. </span><span style={tcTitleStyle}>ACCOUNT SUSPENSION & TERMINATION</span></p>
                <p style={tcBodyStyle}>The Company may suspend or terminate driver accounts at its sole discretion based on: safety concerns, legal risk, violations of these terms, or any reason the Company deems necessary to protect the platform, its users, or its reputation.</p>

                {/* Section 17 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>17. </span><span style={tcTitleStyle}>DATA & PRIVACY</span></p>
                <p style={tcBodyStyle}>Driver data may be used for: platform functionality, safety, compliance, training, driver validation, quality assurance, and dispute resolution. By accepting these terms, drivers consent to the sharing of their contact details and personal information with platform users when necessary. Data handling is in accordance with Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi.</p>

                {/* Section 18 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>18. </span><span style={tcTitleStyle}>FORCE MAJEURE</span></p>
                <p style={tcBodyStyle}>The Company is not liable for events beyond its reasonable control, including: government action, natural disasters, pandemics, system failures, or third-party service disruptions.</p>

                {/* Section 19 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>19. </span><span style={tcTitleStyle}>GOVERNING LAW</span></p>
                <p style={tcBodyStyle}>This Agreement is governed by the laws of the Republic of Indonesia, including: Kitab Undang-Undang Hukum Perdata and Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen.</p>

                {/* Section 20 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>20. </span><span style={tcTitleStyle}>SEVERABILITY</span></p>
                <p style={tcBodyStyle}>If any clause of this agreement is found to be invalid or unenforceable, the remaining clauses shall continue in full force and effect.</p>

                {/* Section 21 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>21. </span><span style={tcTitleStyle}>ACCEPTANCE</span></p>
                <p style={tcBodyStyle}>By using the INDOO Platform, Drivers confirm that: they act as independent contractors, they accept all risks associated with providing services, they waive claims against the Company to the fullest extent permitted by Indonesian law, and they have read, understood, and agreed to all terms set forth herein.</p>

                {/* Green bordered acceptance box */}
                <div style={{ marginTop: 28, padding: 16, borderRadius: 12, background: 'rgba(141,198,63,0.06)', border: '2px solid #8DC63F' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#8DC63F', lineHeight: 1.7, margin: 0 }}>
                    By clicking 'I Accept' below, you confirm that you have read, understood, and voluntarily agree to all terms and conditions. This acceptance is timestamped and logged. You acknowledge that you are entering into this agreement as a fully self-employed independent contractor with PT HAMMEREX PRODUCTS INDONESIA.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Accept button */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
            <button onClick={() => { localStorage.setItem('indoo_driver_terms_accepted', 'true'); localStorage.setItem('indoo_driver_terms_accepted_at', new Date().toISOString()); setTermsAccepted(true) }} style={{ width: '100%', padding: 18, borderRadius: 16, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              I Accept These Terms & Conditions
            </button>
            <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '10px 0 0' }}>&copy; 2026 PT HAMMEREX PRODUCTS INDONESIA &middot; All rights reserved &middot; INDOO Platform v1.0</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808', position: 'relative' }}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 1 }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <img src={profile.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${isOnline ? '#8DC63F' : 'rgba(255,255,255,0.15)'}` }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{profile.display_name}</span>
          <span style={{ fontSize: 12, color: isOnline ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {isOnline ? '● Online' : '○ Offline'} · {tier?.current?.name ?? 'Bronze'} · ⭐ {profile.rating}
          </span>
        </div>
        {/* Go online/offline toggle */}
        <button onClick={toggleOnline} style={{
          padding: '10px 18px', borderRadius: 14,
          background: isOnline ? 'rgba(239,68,68,0.15)' : '#8DC63F',
          border: isOnline ? '1.5px solid rgba(239,68,68,0.3)' : 'none',
          color: isOnline ? '#EF4444' : '#000',
          fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <>
            {/* Online Status — Primary focus */}
            <div style={{ padding: 20, borderRadius: 20, background: isOnline ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${isOnline ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.1)'}`, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: isOnline ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', border: `3px solid ${isOnline ? '#8DC63F' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.3s' }}>
                <span style={{ fontSize: 28, opacity: isOnline ? 1 : 0.4 }}>{isOnline ? '🟢' : '⚪'}</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: isOnline ? '#8DC63F' : 'rgba(255,255,255,0.5)', display: 'block' }}>{isOnline ? 'ACTIVE' : 'OFFLINE'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4 }}>
                {isOnline ? 'Accepting rides, food delivery & all services' : 'Go online to start receiving orders'}
              </span>
              {!isOnline && (
                <button onClick={toggleOnline} style={{ marginTop: 16, padding: '14px 40px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Go Online
                </button>
              )}
            </div>

            {/* Daily Activity */}
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Today's Activity</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#FACC15', display: 'block' }}>{todayTrips}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Trips</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{fmtRp(Math.round(todayEarnings * 0.9))}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Your Earnings (90%)</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#EF4444', display: 'block' }}>{fmtRp(Math.round(todayEarnings * 0.1))}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Admin Fee (10%)</span>
                </div>
              </div>
            </div>

            {/* Commission Due */}
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(239,68,68,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>💳</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>Admin Fee Due</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>10% deducted from each order · You keep 90%</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{fmtRp(Math.round(todayEarnings * 0.1))}</span>
            </div>

            {/* Hotspot Map Button */}
            <button onClick={() => setShowHotspotMap(true)} style={{ width: '100%', padding: 16, borderRadius: 16, background: 'rgba(0,229,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,229,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🗺️</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#00E5FF', display: 'block' }}>Area Hotspot Map</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>See high-traffic zones & admin notifications</span>
              </div>
              <span style={{ fontSize: 18, color: 'rgba(0,229,255,0.5)' }}>→</span>
            </button>

            {/* Driver Level Progression */}
            {tier && (
              <div style={{ padding: 16, borderRadius: 16, background: `rgba(${tier.current.id === 'elite' ? '141,198,63' : '255,255,255'},0.06)`, backdropFilter: 'blur(16px)', border: `1.5px solid ${tier.current.color}40`, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{tier.current.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: tier.current.color, display: 'block' }}>{tier.current.label} Driver</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tier.current.description}</span>
                  </div>
                </div>

                {/* Progress to next tier */}
                {tier.next ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Next: {tier.next.icon} {tier.next.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{tier.tripsToNext} trips to go</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${tier.progress * 100}%`, height: '100%', background: `linear-gradient(90deg, ${tier.current.color}, ${tier.next.color})`, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Hit your daily goals consistently to level up</span>
                  </>
                ) : (
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#8DC63F', display: 'block' }}>🎉 You've reached INDOO Elite!</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Enjoy your exclusive rewards & perks</span>
                  </div>
                )}

                {/* Elite rewards preview (show for all tiers as motivation) */}
                {tier.current.id !== 'elite' && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'rgba(141,198,63,0.04)', border: '1px dashed rgba(141,198,63,0.15)' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F', display: 'block', marginBottom: 6 }}>💎 INDOO ELITE REWARDS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['🧥 Jacket', '🎒 Bag', '🏨 Hotel Stay', '🍽️ Meals', '🎫 Events'].map(r => (
                        <span key={r} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', color: 'rgba(255,255,255,0.5)' }}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elite rewards detail (show when elite) */}
                {tier.current.id === 'elite' && tier.current.rewards && (
                  <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {tier.current.rewards.map(r => (
                      <div key={r.label} style={{ padding: 8, borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', textAlign: 'center' }}>
                        <span style={{ fontSize: 18, display: 'block' }}>{r.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Daily goal (trips toward next level) */}
            {goals && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Today's Goal</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: todayTrips >= goals.daily_trips ? '#8DC63F' : '#FACC15' }}>{todayTrips}/{goals.daily_trips} trips</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (todayTrips / goals.daily_trips) * 100)}%`, height: '100%', background: todayTrips >= goals.daily_trips ? '#8DC63F' : 'linear-gradient(90deg, #FACC15, #8DC63F)', borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, display: 'block' }}>
                  {todayTrips >= goals.daily_trips ? '✅ Goal achieved! Every trip counts toward your next level' : 'Complete daily goals to progress to the next driver level'}
                </span>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setTab('rides')} style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(141,198,63,0.25)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🏍️</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', display: 'block' }}>Ride Orders</span>
              </button>
              <button onClick={() => setTab('food')} style={{ padding: 16, borderRadius: 16, background: 'rgba(250,204,21,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(250,204,21,0.25)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🍔</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', display: 'block' }}>Food Delivery</span>
              </button>
            </div>
          </>
        )}

        {/* ── RIDES TAB ── */}
        {tab === 'rides' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🏍️ Ride Orders</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Bike ride & car taxi bookings</p>
            {!isOnline ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔴</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>You're offline</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 20 }}>Go online to start receiving ride requests</span>
                <button onClick={toggleOnline} style={{ padding: '14px 32px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Go Online</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #8DC63F', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 32 }}>🏍️</span>
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.3)', animation: 'ping 2s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'block', marginBottom: 8 }}>Waiting for rides...</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>You'll be notified when a booking comes in</span>
              </div>
            )}
          </>
        )}

        {/* ── FOOD TAB ── */}
        {tab === 'food' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🍔 Food Delivery</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Restaurant pickups & deal hunt deliveries</p>
            {!isOnline ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔴</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>You're offline</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 20 }}>Go online to receive food delivery orders</span>
                <button onClick={toggleOnline} style={{ padding: '14px 32px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Go Online</button>
              </div>
            ) : foodOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #FACC15', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 32 }}>🍔</span>
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(250,204,21,0.3)', animation: 'ping 2s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', display: 'block', marginBottom: 8 }}>Waiting for food orders...</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Restaurants & deal hunt orders will appear here</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {foodOrders.map(order => (
                  <div key={order.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>🏪</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{order.restaurant ?? 'Restaurant'}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{order.id} · {order.items?.length ?? 0} items</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>{fmtRp(order.delivery_fee ?? order.delivery ?? 10000)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: order.status === 'driver_heading' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', color: order.status === 'driver_heading' ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontWeight: 800 }}>
                        {order.status === 'driver_heading' ? 'Heading to pickup' : order.status === 'picked_up' ? 'Delivering' : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── EARNINGS TAB ── */}
        {tab === 'earnings' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>💰 Earnings</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Your income and trip history</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(141,198,63,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{fmtRp(todayEarnings)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Today</span>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', display: 'block' }}>{todayTrips}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Trips</span>
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>INDOO drivers keep 90% of each fare. 10% admin fee is deducted automatically from each order.</span>
            </div>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                <img src={profile.photo_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #8DC63F' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#8DC63F', border: '3px solid #080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{profile.display_name}</h2>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{profile.email}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Phone', value: profile.phone },
                { label: 'Vehicle', value: `${profile.vehicle_brand} ${profile.vehicle_model}` },
                { label: 'Plate', value: profile.vehicle_plate },
                { label: 'City', value: profile.city },
                { label: 'Rating', value: `⭐ ${profile.rating}` },
                { label: 'Total Trips', value: profile.total_trips },
                { label: 'Tier', value: tier?.current?.name ?? 'Bronze' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={handleLogout} style={{ marginTop: 20, width: '100%', padding: 14, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Sign Out
            </button>
          </>
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 8px)',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-around', zIndex: 100,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
            minWidth: 48,
          }}>
            <span style={{ fontSize: 20, filter: tab === t.id ? 'none' : 'grayscale(1) opacity(0.4)' }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: tab === t.id ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Cash float modal ── */}
      {showCashFloat && (
        <DriverCashFloatModal
          driverName={profile.display_name}
          onConfirm={(amount) => {
            setShowCashFloat(false)
            setIsOnline(true)
          }}
        />
      )}

      {/* ── Incoming ride booking overlay ── */}
      {incomingBooking && (
        <DriverIncomingBooking
          booking={incomingBooking}
          driverId={profile.id}
          onAccepted={(booking) => { setIncomingBooking(null); setActiveBooking(booking) }}
          onDeclined={() => setIncomingBooking(null)}
        />
      )}

      {/* ── Active trip screen ── */}
      {activeBooking && (
        <DriverTripScreen
          booking={activeBooking}
          driverId={profile.id}
          onCompleted={() => setActiveBooking(null)}
          onClose={() => setActiveBooking(null)}
        />
      )}

      {/* ── Incoming food order overlay ── */}
      {incomingFoodOrder && (
        <DriverFoodOrderAlert
          order={incomingFoodOrder}
          driverId={profile.id}
          onDismiss={() => setIncomingFoodOrder(null)}
        />
      )}

      {/* ── Hotspot Map Overlay ── */}
      {showHotspotMap && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080808', display: 'flex', flexDirection: 'column' }}>
          <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.3 }} />

          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
            <button onClick={() => setShowHotspotMap(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>←</button>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>🗺️ Area Hotspot Map</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Yogyakarta · Live demand zones</span>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 12, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)' }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#8DC63F' }}>● LIVE</span>
            </div>
          </div>

          {/* Map */}
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <HotspotMapContent />
          </div>

          {/* Bottom info panel */}
          <div style={{ padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 10, fontWeight: 800, color: '#EF4444' }}>🔴 High Demand</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', fontSize: 10, fontWeight: 800, color: '#FACC15' }}>🟡 Moderate</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)', fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>🟢 Your Area</span>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>⚪ Quiet</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block' }}>💡 Move to red zones for higher booking rate. Too many drivers in your area reduces your chances.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hotspot Map Component (Mapbox GL) ────────────────────────────────────────
function HotspotMapContent() {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const [mapError, setMapError] = useState(false)

  const ZONES = [
    { name: 'Malioboro', lat: -7.7925, lng: 110.3658, demand: 'high', drivers: 2, orders: 9 },
    { name: 'Prawirotaman', lat: -7.8125, lng: 110.3650, demand: 'high', drivers: 1, orders: 7 },
    { name: 'Seturan', lat: -7.7650, lng: 110.4100, demand: 'high', drivers: 0, orders: 5 },
    { name: 'Tugu Station', lat: -7.7891, lng: 110.3614, demand: 'moderate', drivers: 3, orders: 4 },
    { name: 'Amplaz', lat: -7.7835, lng: 110.4020, demand: 'moderate', drivers: 2, orders: 3 },
    { name: 'Alun-Alun Selatan', lat: -7.8120, lng: 110.3580, demand: 'moderate', drivers: 1, orders: 3 },
    { name: 'UGM Campus', lat: -7.7713, lng: 110.3776, demand: 'quiet', drivers: 4, orders: 1 },
    { name: 'Jalan Kaliurang', lat: -7.7500, lng: 110.3850, demand: 'quiet', drivers: 5, orders: 1 },
    { name: 'Condongcatur', lat: -7.7550, lng: 110.3950, demand: 'quiet', drivers: 6, orders: 0 },
    { name: 'Kotagede', lat: -7.8200, lng: 110.3950, demand: 'quiet', drivers: 3, orders: 0 },
    { name: 'Kota Baru', lat: -7.7820, lng: 110.3758, demand: 'moderate', drivers: 2, orders: 2 },
    { name: 'Jakal North', lat: -7.7350, lng: 110.3900, demand: 'quiet', drivers: 4, orders: 0 },
  ]

  const DEMAND_COLORS = { high: '#EF4444', moderate: '#FACC15', quiet: 'rgba(255,255,255,0.3)' }
  const DEMAND_OPACITY = { high: 0.25, moderate: 0.15, quiet: 0.06 }

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) { setMapError(true); return }

    let cancelled = false

    // Load Mapbox GL
    const loadMb = () => new Promise((resolve, reject) => {
      if (window.mapboxgl) { resolve(window.mapboxgl); return }
      if (!document.getElementById('mapbox-css-driver')) {
        const link = document.createElement('link')
        link.id = 'mapbox-css-driver'
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css'
        document.head.appendChild(link)
      }
      const script = document.createElement('script')
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js'
      script.onload = () => resolve(window.mapboxgl)
      script.onerror = () => reject(new Error('Failed'))
      document.head.appendChild(script)
    })

    loadMb().then(mapboxgl => {
      if (cancelled || !mapRef.current) return
      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [110.385, -7.79],
        zoom: 12.5,
        attributionControl: false,
      })
      mapObjRef.current = map

      map.on('load', () => {
        if (cancelled) return

        // Driver's current position (green marker — you)
        const driverEl = document.createElement('div')
        driverEl.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:#8DC63F;border:3px solid #fff;box-shadow:0 0 12px rgba(141,198,63,0.8);animation:driverFlash 1.5s ease-in-out infinite"></div>`
        new mapboxgl.Marker({ element: driverEl }).setLngLat([110.3758, -7.7820]).addTo(map)

        // Other drivers in the area (10 mock green dots — placed in quiet/oversaturated zones)
        const OTHER_DRIVERS = [
          // Quiet zones (oversaturated — too many drivers, low demand)
          { lat: -7.7520, lng: 110.3870 }, // Jalan Kaliurang
          { lat: -7.7485, lng: 110.3830 }, // Jalan Kaliurang
          { lat: -7.7540, lng: 110.3960 }, // Condongcatur
          { lat: -7.7565, lng: 110.3935 }, // Condongcatur
          { lat: -7.7580, lng: 110.3980 }, // Condongcatur
          { lat: -7.8210, lng: 110.3930 }, // Kotagede
          { lat: -7.8185, lng: 110.3970 }, // Kotagede
          { lat: -7.7340, lng: 110.3920 }, // Jakal North
          { lat: -7.7370, lng: 110.3880 }, // Jakal North
          { lat: -7.7730, lng: 110.3790 }, // UGM area
        ]
        OTHER_DRIVERS.forEach((d, i) => {
          const el = document.createElement('div')
          el.innerHTML = `<div style="width:10px;height:10px;border-radius:50%;background:#8DC63F;border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px rgba(141,198,63,0.6);animation:driverFlash ${1.2 + (i % 3) * 0.3}s ease-in-out infinite;animation-delay:${i * 0.2}s"></div>`
          new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([d.lng, d.lat]).addTo(map)
        })

        // Zone circles + labels
        ZONES.forEach(z => {
          const color = DEMAND_COLORS[z.demand]
          const opacity = DEMAND_OPACITY[z.demand]

          // Circle overlay
          const el = document.createElement('div')
          const size = z.demand === 'high' ? 100 : z.demand === 'moderate' ? 80 : 60
          el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:${opacity};border:1.5px solid ${color};pointer-events:none;`
          if (z.demand === 'high') el.style.animation = 'hotspotPulse 2s ease-in-out infinite'
          new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([z.lng, z.lat]).addTo(map)

          // Label
          const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: [0, -size / 2 - 5], className: 'hotspot-popup' })
            .setLngLat([z.lng, z.lat])
            .setHTML(`<div style="font-family:system-ui;padding:6px 10px;background:rgba(0,0,0,0.85);border-radius:8px;border:1px solid ${color}40;text-align:center;min-width:80px">
              <div style="font-size:11px;font-weight:900;color:${color}">${z.name}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">${z.orders} orders · ${z.drivers} drivers</div>
              ${z.demand === 'high' && z.drivers < 2 ? '<div style="font-size:9px;color:#EF4444;font-weight:700;margin-top:3px">⚠️ NEEDS DRIVERS</div>' : ''}
              ${z.drivers > z.orders && z.demand === 'quiet' ? '<div style="font-size:9px;color:#FACC15;font-weight:700;margin-top:3px">Too many drivers here</div>' : ''}
            </div>`)
            .addTo(map)

          // Suggested movement arrows for oversaturated quiet zones
          if (z.drivers > z.orders + 2 && z.demand === 'quiet') {
            const arrowEl = document.createElement('div')
            arrowEl.innerHTML = `<div style="font-size:16px;animation:bounce 1.5s ease-in-out infinite">↗️</div>`
            new mapboxgl.Marker({ element: arrowEl, anchor: 'center' }).setLngLat([z.lng + 0.003, z.lat - 0.002]).addTo(map)
          }
        })

        // Add pulsing animation style
        const style = document.createElement('style')
        style.textContent = `
          @keyframes hotspotPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
          @keyframes driverFlash { 0%,100% { opacity: 1; box-shadow: 0 0 8px rgba(141,198,63,0.6); } 50% { opacity: 0.4; box-shadow: 0 0 16px rgba(141,198,63,1); } }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          .hotspot-popup .mapboxgl-popup-content { background: none !important; padding: 0 !important; box-shadow: none !important; }
          .hotspot-popup .mapboxgl-popup-tip { display: none !important; }
        `
        document.head.appendChild(style)
      })
    }).catch(() => { if (!cancelled) setMapError(true) })

    return () => { cancelled = true; if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null } }
  }, [])

  if (mapError) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
        <span style={{ fontSize: 48 }}>🗺️</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Map unavailable</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Check your connection</span>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
