/**
 * CarDriverApp — Standalone car driver PWA for INDOO Car
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
import { getPrepaidWallet, topUpPrepaidWallet, checkWalletStatus } from '@/services/walletService'
import { getDriverTier } from '@/services/driverTierService'
import { getDriverGoals } from '@/services/driverIncentiveService'
import { fetchDriverTripHistory } from '@/services/bookingService'
import { getDriverFoodOrders } from '@/services/foodOrderService'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2011_05_34%20PM.png?updatedAt=1776614750168'

const CAR_IMG = 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'rides', label: 'Rides', icon: '🚕' },
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

// Demo driver profile
const DEMO_PROFILE = {
  id: 'driver-demo-car',
  display_name: 'Agus Prasetyo',
  email: 'agus@indoo.id',
  phone: '081234567999',
  vehicle_type: 'car_taxi',
  vehicle_brand: 'Toyota',
  vehicle_model: 'Avanza',
  vehicle_plate: 'AB 5678 CD',
  rating: 4.9,
  total_trips: 247,
  photo_url: 'https://i.pravatar.cc/200?img=12',
  is_online: false,
  city: 'Yogyakarta',
}

export default function CarDriverApp() {
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
  const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('indoo_car_driver_terms_accepted') === 'true')
  const [showHotspotMap, setShowHotspotMap] = useState(false)
  const [showEliteAwards, setShowEliteAwards] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [showTopUp, setShowTopUp] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Auth
  useEffect(() => {
    if (!supabase) {
      setUser({ id: 'demo', email: 'cardriver@indoo.id' })
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
    getPrepaidWallet(driverId, 'car_driver').then(w => setWallet(w)).catch(() => {})
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

  const [confirmToggle, setConfirmToggle] = useState(false)
  const toggleOnline = () => {
    if (!isOnline) {
      if (!confirmToggle) { setConfirmToggle(true); setTimeout(() => setConfirmToggle(false), 3000); return }
      setConfirmToggle(false)
      setShowCashFloat(true)
    } else {
      if (!confirmToggle) { setConfirmToggle(true); setTimeout(() => setConfirmToggle(false), 3000); return }
      setConfirmToggle(false)
      setIsOnline(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(141,198,63,0.2)', borderTopColor: '#8DC63F', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Loading INDOO Car...</span>
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
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>CAR</span>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Car Driver Dashboard</p>
          </div>
          <div style={{ width: '100%', maxWidth: 360, padding: '28px 24px', borderRadius: 24, background: 'rgba(10,10,10,0.9)', border: '1.5px solid rgba(141,198,63,0.2)', backdropFilter: 'blur(20px)', animation: 'slideUp 0.4s ease' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Sign In</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Access your car driver dashboard</p>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAuth() }} placeholder="Password" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
            {loginError && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 14 }}><span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{loginError}</span></div>}
            <button onClick={handleAuth} disabled={signingIn} style={{ width: '100%', padding: 16, borderRadius: 16, background: signingIn ? 'rgba(141,198,63,0.5)' : '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: signingIn ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {signingIn ? 'Please wait...' : 'Sign In'}
            </button>
          </div>
          <div style={{ marginTop: 32 }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>indoocar.id · Powered by INDOO</span></div>
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

    const TC_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2008_02_07%20PM.png?updatedAt=1776344543969'
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808', position: 'relative' }}>
        <img src={TC_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>INDOO Car Driver Agreement</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Please read and accept to continue</p>
          </div>

          {/* Terms content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
            <div style={{ padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F', margin: '0 0 4px', textAlign: 'center' }}>TERMS & CONDITIONS</h2>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: '0 0 4px', textAlign: 'center' }}>INDOO CAR DRIVER PLATFORM</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center', fontWeight: 700 }}>PT HAMMEREX PRODUCTS INDONESIA</p>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>

                {/* Section 1 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>1. </span><span style={tcTitleStyle}>PLATFORM STATUS</span></p>
                <p style={tcBodyStyle}>INDOO is a digital technology platform (penyedia aplikasi) that facilitates connections between independent service providers and customers. PT HAMMEREX PRODUCTS INDONESIA is not a transportation company, does not provide ride or delivery services, does not employ car drivers, and does not act as a carrier, logistics provider, or agent. All services are performed solely by independent Car Drivers.</p>

                {/* Section 2 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>2. </span><span style={tcTitleStyle}>PARTNERSHIP MODEL (KEMITRAAN)</span></p>
                <p style={tcBodyStyle}>The relationship between the Company and Car Drivers is strictly a partnership (kemitraan). This agreement does not create employment, does not create wages or salary, and does not establish subordination. There are no fixed working hours, no obligation to accept orders, and no exclusivity requirement.</p>

                {/* Section 3 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>3. </span><span style={tcTitleStyle}>DRIVER AUTONOMY</span></p>
                <p style={tcBodyStyle}>Car drivers have full control over: when to work, whether to accept or reject orders, routes taken, and operational methods. The Company does not give direct instructions or supervise car drivers.</p>

                {/* Section 4 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>4. </span><span style={tcTitleStyle}>PRICING FRAMEWORK</span></p>
                <p style={tcBodyStyle}>The Platform provides a digital pricing mechanism. Car drivers agree to the displayed fare structure and authorize the Platform to calculate pricing. Pricing is a marketplace tool, not wages. The Company does not pay salaries and does not guarantee earnings.</p>

                {/* Section 5 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>5. </span><span style={tcTitleStyle}>SERVICE FEES</span></p>
                <p style={tcBodyStyle}>Car drivers agree to pay a 10% platform service fee from each order.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>Non-payment within 30 days may result in: account suspension, access restriction, and a daily penalty increase of 20% applied to the total outstanding amount. This penalty covers loss of earnings, administrative processing, and recruitment fees and will continue to accumulate daily until the full balance is settled.</p>

                {/* Section 6 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>6. </span><span style={tcTitleStyle}>NO TRANSPORT OPERATOR LIABILITY</span></p>
                <p style={tcBodyStyle}>The Company is strictly an application provider, not a transport operator as contemplated under Indonesian transport frameworks. This aligns with the separation recognized in regulations between application providers and transport service providers.</p>

                {/* Section 7 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>7. </span><span style={tcTitleStyle}>FULL DRIVER LIABILITY</span></p>
                <p style={tcBodyStyle}>Car drivers are fully responsible for: passenger safety, vehicle operation, delivery of goods, and compliance with traffic laws.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>The Company bears zero responsibility for: accidents, injuries or death, lost or damaged goods, and food quality or contamination.</p>

                {/* Section 8 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>8. </span><span style={tcTitleStyle}>INSURANCE REQUIREMENT</span></p>
                <p style={tcBodyStyle}>Car drivers must maintain valid vehicle insurance and personal accident coverage (recommended) at all times while operating on the platform.</p>
                <p style={{ ...tcBodyStyle, ...tcRedStyle, margin: '8px 0' }}>If insurance is not active, the car driver assumes 100% legal and financial liability for any incident — including where the vehicle is owned by a third party.</p>

                {/* Section 9 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>9. </span><span style={tcTitleStyle}>INDEMNITY</span></p>
                <p style={tcBodyStyle}>Car drivers agree to defend, indemnify, and hold harmless PT HAMMEREX PRODUCTS INDONESIA, its directors, officers, employees, and affiliates from any claims, lawsuits, damages, losses, costs, and government penalties arising from: car driver activities, legal violations, service performance, or any breach of these terms.</p>

                {/* Section 10 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>10. </span><span style={tcTitleStyle}>GOVERNMENT & LEGAL COMPLIANCE</span></p>
                <p style={tcBodyStyle}>Car drivers are solely responsible for: SIM (driving licence), STNK (vehicle registration), taxes, and all permits required by Indonesian law. The Company is not responsible for regulatory classification, government enforcement, or legal compliance of car drivers.</p>

                {/* Section 11 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>11. </span><span style={tcTitleStyle}>CONDUCT & PROFESSIONAL STANDARDS</span></p>
                <p style={tcBodyStyle}>Car drivers must maintain professional and respectful behaviour with all passengers and customers. Car drivers must only charge the fare price stated and approved by the platform. Overcharging, harassment, discrimination, or unprofessional conduct will result in immediate deactivation and potential legal action.</p>

                {/* Section 12 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>12. </span><span style={tcTitleStyle}>VEHICLE ROADWORTHINESS</span></p>
                <p style={tcBodyStyle}>All vehicles used on the INDOO platform must meet road safety and roadworthiness standards as required by Indonesian law. The Company reserves the right to deactivate any car driver whose vehicle does not meet these standards.</p>

                {/* Section 13 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>13. </span><span style={tcTitleStyle}>CUSTOMER & THIRD-PARTY DISPUTES</span></p>
                <p style={tcBodyStyle}>All disputes are strictly between: car driver and customer, or car driver and third parties. The Company is not a party to any dispute and has no obligation to intervene.</p>

                {/* Section 14 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>14. </span><span style={tcTitleStyle}>LIMITATION OF LIABILITY</span></p>
                <p style={tcBodyStyle}>To the maximum extent permitted by Indonesian law, the Company shall not be liable for: personal injury or death, property damage, criminal acts by car drivers, loss of income, or platform interruptions.</p>

                {/* Section 15 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>15. </span><span style={tcTitleStyle}>PLATFORM CONTROL DISCLAIMER</span></p>
                <p style={tcBodyStyle}>The Company does not control: car driver behaviour, service quality, or execution of services. Platform features including ratings, pricing, and navigation are tools only — not instructions.</p>

                {/* Section 16 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>16. </span><span style={tcTitleStyle}>ACCOUNT SUSPENSION & TERMINATION</span></p>
                <p style={tcBodyStyle}>The Company may suspend or terminate car driver accounts at its sole discretion based on: safety concerns, legal risk, violations of these terms, or any reason the Company deems necessary to protect the platform, its users, or its reputation.</p>

                {/* Section 17 */}
                <p style={tcSectionStyle}><span style={tcNumStyle}>17. </span><span style={tcTitleStyle}>DATA & PRIVACY</span></p>
                <p style={tcBodyStyle}>Car driver data may be used for: platform functionality, safety, compliance, training, driver validation, quality assurance, and dispute resolution. By accepting these terms, car drivers consent to the sharing of their contact details and personal information with platform users when necessary. Data handling is in accordance with Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi.</p>

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
                <p style={tcBodyStyle}>By using the INDOO Platform, car drivers confirm that: they act as independent contractors, they accept all risks associated with providing services, they waive claims against the Company to the fullest extent permitted by Indonesian law, and they have read, understood, and agreed to all terms set forth herein.</p>

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
            <button onClick={() => { localStorage.setItem('indoo_car_driver_terms_accepted', 'true'); localStorage.setItem('indoo_car_driver_terms_accepted_at', new Date().toISOString()); setTermsAccepted(true) }} style={{ width: '100%', padding: 18, borderRadius: 16, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
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
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: 900 }}>
          <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>Driver Car</span>
        </span>
        <button onClick={() => setDrawerOpen(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}>⚙️</button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <>
            {/* Online Status — Primary focus */}
            <div style={{ padding: 20, borderRadius: 20, background: isOnline ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${isOnline ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.1)'}`, marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: isOnline ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', border: `3px solid ${isOnline ? '#8DC63F' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.3s', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 28, opacity: isOnline ? 1 : 0.4 }}>{isOnline ? '🟢' : '⚪'}</span>
                {isOnline && <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.4)', animation: 'satPing 2s ease-out infinite' }} />}
                {isOnline && <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(141,198,63,0.2)', animation: 'satPing 2s ease-out infinite 0.5s' }} />}
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: isOnline ? '#8DC63F' : 'rgba(255,255,255,0.5)', display: 'block', position: 'relative', zIndex: 1 }}>{isOnline ? 'ACTIVE' : 'OFFLINE'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4, position: 'relative', zIndex: 1 }}>
                {isOnline ? 'Accepting car rides, food delivery & all services' : 'Go online to start receiving orders'}
              </span>
              <div style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
                {!isOnline ? (
                  <button onClick={toggleOnline} style={{ padding: '14px 40px', borderRadius: 14, background: confirmToggle ? '#FACC15' : '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {confirmToggle ? 'Tap Again to Confirm' : 'Go Online'}
                  </button>
                ) : (
                  <button onClick={toggleOnline} style={{ padding: '10px 24px', borderRadius: 12, background: '#991B1B', border: 'none', color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {confirmToggle ? 'Tap Again to Go Offline' : 'Go Offline'}
                  </button>
                )}
              </div>
              <img src={CAR_IMG} alt="" style={{ position: 'absolute', bottom: -4, right: -4, width: 150, height: 150, objectFit: 'contain', opacity: 1, pointerEvents: 'none', zIndex: 0 }} />
            </div>

            {/* Today's Activity — 3 separate containers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 20, borderRadius: 20, background: 'rgba(141,198,63,0.06)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.2)', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{todayTrips}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Trips</span>
              </div>
              <div style={{ padding: 20, borderRadius: 20, background: 'rgba(141,198,63,0.06)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.2)', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{fmtRp(Math.round(todayEarnings * 0.9))}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Earned (90%)</span>
              </div>
              <div onClick={() => setShowHotspotMap(true)} style={{ padding: 20, borderRadius: 20, background: 'rgba(141,198,63,0.06)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.2)', textAlign: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                <span style={{ fontSize: 26, display: 'block' }}>🗺️</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>Hotspot</span>
              </div>
            </div>

            {/* Wallet Balance */}
            {(() => {
              const bal = wallet?.balance ?? 0
              const min = wallet?.minimum ?? 100000
              const st = wallet?.status ?? 'active'
              const isLow = bal < min * 1.5
              const isDanger = st === 'restricted' || st === 'deactivated' || bal < min
              const balColor = isDanger ? '#EF4444' : isLow ? '#FACC15' : '#8DC63F'
              const statusColor = st === 'active' ? '#8DC63F' : st === 'restricted' ? '#FACC15' : '#EF4444'
              const statusLabel = st === 'active' ? 'Active' : st === 'restricted' ? 'Restricted' : 'Deactivated'
              const hoursRemaining = wallet?.restricted_at ? Math.max(0, Math.ceil(24 - (Date.now() - new Date(wallet.restricted_at).getTime()) / 3600000)) : null
              const deductions = JSON.parse(localStorage.getItem(`indoo_wallet_deductions_${user?.id ?? 'demo'}`) || '[]').slice(-5).reverse()
              return (
                <div style={{ padding: 16, borderRadius: 20, background: `rgba(${isDanger ? '239,68,68' : isLow ? '250,204,21' : '141,198,63'},0.06)`, backdropFilter: 'blur(16px)', border: `1.5px solid ${isDanger ? '#EF4444' : statusColor}40`, marginBottom: 12, animation: isDanger ? 'walletFlash 1.5s ease-in-out infinite' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src="https://ik.imagekit.io/nepgaxllc/mmmass-removebg-preview.png?updatedAt=1777002478628" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Wallet Balance</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: `${statusColor}20`, border: `1px solid ${statusColor}40`, color: statusColor }}>{statusLabel}</span>
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 900, color: balColor, display: 'block', marginBottom: 4 }}>{fmtRp(bal)}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 10 }}>Minimum required: {fmtRp(min)}</span>
                  {st === 'restricted' && hoursRemaining !== null && (
                    <div style={{ padding: 8, borderRadius: 10, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#FACC15' }}>⚠️ Top up within {hoursRemaining} hours to avoid deactivation</span>
                    </div>
                  )}
                  {st === 'deactivated' && (
                    <div style={{ padding: 8, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Account deactivated. Top up to reactivate.</span>
                    </div>
                  )}
                  {deductions.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Recent Deductions</span>
                      {deductions.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < deductions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block' }}>{d.orderType ?? 'Order'} #{(d.orderId ?? '').slice(-4)}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{d.date ? new Date(d.date).toLocaleDateString('id-ID') : ''}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#EF4444' }}>-{fmtRp(d.commission ?? d.amount ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setShowTopUp(true)} style={{ width: '100%', padding: 12, borderRadius: 12, background: isDanger ? '#EF4444' : '#8DC63F', border: 'none', color: isDanger ? '#fff' : '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', animation: isDanger ? 'walletFlash 1.5s ease-in-out infinite' : 'none' }}>
                    {isDanger ? '⚠️ Top Up Now' : 'Top Up'}
                  </button>
                </div>
              )
            })()}
            <style>{`
              @keyframes walletFlash { 0%,100% { opacity: 1; } 50% { opacity: 0.7; border-color: rgba(239,68,68,0.6); } }
              @keyframes goalRunLight { 0% { left: -40px; } 100% { left: 100%; } }
              @keyframes satPing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
            `}</style>


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

                {/* View Elite Awards button */}
              </div>
            )}

            {/* Daily goal (trips toward next level) */}
            {goals && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{tier?.current?.icon} {tier?.current?.label ?? 'Standard'} Driver — Today's Goal</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: todayTrips >= goals.daily_trips ? '#8DC63F' : '#FACC15' }}>{todayTrips}/{goals.daily_trips} trips</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.min(100, (todayTrips / goals.daily_trips) * 100)}%`, height: '100%', background: todayTrips >= goals.daily_trips ? '#8DC63F' : 'linear-gradient(90deg, #FACC15, #8DC63F)', borderRadius: 3, transition: 'width 0.5s', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'goalRunLight 2s linear infinite' }} />
                  </div>
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, display: 'block' }}>
                  {todayTrips >= goals.daily_trips ? '✅ Goal achieved! Every trip counts toward your next level' : 'Complete daily goals to progress to the next driver level'}
                </span>
              </div>
            )}

            {/* Quick actions — Car Rides + Food only (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setTab('rides')} style={{ padding: 16, borderRadius: 20, background: 'rgba(0,229,255,0.08)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(0,229,255,0.3)', cursor: 'pointer', textAlign: 'center', overflow: 'hidden' }}>
                <img src={CAR_IMG} alt="" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block', margin: '0 auto 6px' }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#00E5FF', display: 'block' }}>Car Rides</span>
              </button>
              <button onClick={() => setTab('food')} style={{ padding: 16, borderRadius: 20, background: 'rgba(250,204,21,0.08)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(250,204,21,0.3)', cursor: 'pointer', textAlign: 'center', overflow: 'hidden' }}>
                <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2004_54_54%20AM.png?updatedAt=1777240511049" alt="" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block', margin: '0 auto 6px' }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#FACC15', display: 'block' }}>Food</span>
              </button>
            </div>
          </>
        )}

        {/* ── RIDES TAB ── */}
        {tab === 'rides' && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🚕 Car Orders</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Car taxi bookings</p>
            {!isOnline ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔴</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>You're offline</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 20 }}>Go online to start receiving car ride requests</span>
                <button onClick={toggleOnline} style={{ padding: '14px 32px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>Go Online</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #8DC63F', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 32 }}>🚕</span>
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(141,198,63,0.3)', animation: 'ping 2s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'block', marginBottom: 8 }}>Waiting for car rides...</span>
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
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>INDOO drivers keep 90% of each trip. 10% is payable to INDOO Head Quarters.</span>
            </div>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (() => {
          const GLASS = { borderRadius: 20, backdropFilter: 'blur(16px)', border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }
          const SECTION_TITLE = { fontSize: 14, fontWeight: 900, color: '#FACC15', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'block' }

          const personalDocs = [
            { key: 'ktp', icon: '🪪', name: 'KTP', desc: 'Kartu Tanda Penduduk — National ID Card' },
            { key: 'selfie_ktp', icon: '🤳', name: 'Selfie with KTP', desc: 'Photo holding your ID card' },
            { key: 'sim', icon: '🪪', name: 'SIM A', desc: 'Surat Izin Mengemudi — Driving Licence (SIM A for car)' },
            { key: 'selfie_sim', icon: '🤳', name: 'Selfie with SIM', desc: 'Photo holding your licence' },
            { key: 'skck', icon: '📋', name: 'SKCK', desc: 'Surat Keterangan Catatan Kepolisian — Police Clearance' },
          ]

          const vehicleDocs = [
            { key: 'stnk', icon: '📄', name: 'STNK', desc: 'Surat Tanda Nomor Kendaraan — Vehicle Registration' },
            { key: 'bpkb', icon: '📘', name: 'BPKB', desc: 'Buku Pemilik Kendaraan Bermotor — Vehicle Ownership' },
            { key: 'vehicle_photo', icon: '🚗', name: 'Vehicle Photo', desc: 'Front/side of vehicle with plate visible' },
            { key: 'insurance', icon: '🛡️', name: 'Insurance Certificate', desc: 'Active vehicle insurance — INDOO provides accident coverage for active drivers' },
            { key: 'uji_berkala', icon: '🔧', name: 'Vehicle Inspection', desc: 'Uji Berkala — Roadworthiness certificate' },
          ]

          const getDocStatus = (docKey) => {
            const stored = localStorage.getItem(`indoo_car_driver_docs_${docKey}`)
            if (!stored) return { status: 'not_uploaded', label: '🔴 Not Uploaded', color: '#EF4444' }
            try {
              const parsed = JSON.parse(stored)
              if (parsed.approved) return { status: 'approved', label: '🟢 Approved', color: '#22C55E', preview: parsed.preview }
              return { status: 'pending', label: '🟡 Pending Review', color: '#FACC15', preview: parsed.preview }
            } catch { return { status: 'not_uploaded', label: '🔴 Not Uploaded', color: '#EF4444' } }
          }

          const handleDocUpload = (docKey, file) => {
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
              localStorage.setItem(`indoo_car_driver_docs_${docKey}`, JSON.stringify({ preview: ev.target.result, approved: false, uploadedAt: new Date().toISOString() }))
              setTab('_refresh')
              setTimeout(() => setTab('profile'), 0)
            }
            reader.readAsDataURL(file)
          }

          const renderDocCard = (doc) => {
            const info = getDocStatus(doc.key)
            return (
              <div key={doc.key} style={{ ...GLASS, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {info.preview ? (
                  <img src={info.preview} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{doc.icon}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{doc.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>{doc.desc}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: info.color, display: 'block', marginTop: 6 }}>{info.label}</span>
                </div>
                <label style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', alignSelf: 'center' }}>
                  Upload
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleDocUpload(doc.key, e.target.files?.[0])} />
                </label>
              </div>
            )
          }

          const savedNpwp = localStorage.getItem('indoo_car_driver_npwp') || ''
          const savedBank = JSON.parse(localStorage.getItem('indoo_car_driver_bank') || '{}')
          const savedEmergency = JSON.parse(localStorage.getItem('indoo_car_driver_emergency') || '{}')

          return (
            <>
              {/* Profile Header */}
              <div style={{ ...GLASS, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                  <img src={profile.photo_url} alt="" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #8DC63F' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: '3px solid #080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{profile.display_name}</h2>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block' }}>{profile.email}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>{profile.phone}</span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15', display: 'block' }}>{'⭐'.repeat(Math.round(profile.rating || 0))}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{profile.rating} rating</span>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{profile.total_trips}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>trips</span>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', display: 'block', padding: '2px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.25)' }}>{tier?.current?.name ?? 'Bronze'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2, display: 'block' }}>tier</span>
                  </div>
                </div>
              </div>

              {/* Personal Documents */}
              <div style={{ marginBottom: 16 }}>
                <span style={SECTION_TITLE}>🪪 Personal Documents</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{personalDocs.map(renderDocCard)}</div>
              </div>

              {/* Vehicle Documents */}
              <div style={{ marginBottom: 16 }}>
                <span style={SECTION_TITLE}>🚗 Vehicle Documents</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{vehicleDocs.map(renderDocCard)}</div>
              </div>

              {/* Tax & Banking */}
              <div style={{ ...GLASS, padding: 18, marginBottom: 16 }}>
                <span style={SECTION_TITLE}>🏦 Tax & Banking</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>NPWP — Tax ID Number</label>
                    <input type="text" placeholder="Enter NPWP number" defaultValue={savedNpwp} onBlur={e => localStorage.setItem('indoo_car_driver_npwp', e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Bank Name</label>
                    <select defaultValue={savedBank.bankName || ''} onChange={e => { const b = JSON.parse(localStorage.getItem('indoo_car_driver_bank') || '{}'); b.bankName = e.target.value; localStorage.setItem('indoo_car_driver_bank', JSON.stringify(b)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}>
                      <option value="" disabled style={{ color: '#888' }}>Select bank...</option>
                      {['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB', 'Permata', 'Danamon'].map(b => (<option key={b} value={b} style={{ background: '#1a1a1a', color: '#fff' }}>{b}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Bank Account Number</label>
                    <input type="text" placeholder="Enter account number" defaultValue={savedBank.accountNumber || ''} onBlur={e => { const b = JSON.parse(localStorage.getItem('indoo_car_driver_bank') || '{}'); b.accountNumber = e.target.value; localStorage.setItem('indoo_car_driver_bank', JSON.stringify(b)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Account Holder Name</label>
                    <input type="text" placeholder="Enter holder name" defaultValue={savedBank.holderName || ''} onBlur={e => { const b = JSON.parse(localStorage.getItem('indoo_car_driver_bank') || '{}'); b.holderName = e.target.value; localStorage.setItem('indoo_car_driver_bank', JSON.stringify(b)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div style={{ ...GLASS, padding: 18, marginBottom: 16 }}>
                <span style={SECTION_TITLE}>🆘 Emergency Contact</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Contact Name</label>
                    <input type="text" placeholder="Full name" defaultValue={savedEmergency.name || ''} onBlur={e => { const em = JSON.parse(localStorage.getItem('indoo_car_driver_emergency') || '{}'); em.name = e.target.value; localStorage.setItem('indoo_car_driver_emergency', JSON.stringify(em)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Phone Number</label>
                    <input type="tel" placeholder="08xxxxxxxxxx" defaultValue={savedEmergency.phone || ''} onBlur={e => { const em = JSON.parse(localStorage.getItem('indoo_car_driver_emergency') || '{}'); em.phone = e.target.value; localStorage.setItem('indoo_car_driver_emergency', JSON.stringify(em)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Relationship</label>
                    <select defaultValue={savedEmergency.relationship || ''} onChange={e => { const em = JSON.parse(localStorage.getItem('indoo_car_driver_emergency') || '{}'); em.relationship = e.target.value; localStorage.setItem('indoo_car_driver_emergency', JSON.stringify(em)) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', appearance: 'none' }}>
                      <option value="" disabled style={{ color: '#888' }}>Select...</option>
                      {['Spouse', 'Parent', 'Sibling', 'Other'].map(r => (<option key={r} value={r} style={{ background: '#1a1a1a', color: '#fff' }}>{r}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div style={{ ...GLASS, padding: 18, marginBottom: 16 }}>
                <span style={SECTION_TITLE}>🚗 Vehicle Details</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Brand', value: profile.vehicle_brand || '-' },
                    { label: 'Model', value: profile.vehicle_model || '-' },
                    { label: 'Year', value: profile.vehicle_year || '-' },
                    { label: 'Color', value: profile.vehicle_color || '-' },
                    { label: 'Plate Number', value: profile.vehicle_plate || '-' },
                    { label: 'CC (Engine Size)', value: profile.vehicle_cc || '-' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )
        })()}
      </div>

      {/* Settings Drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex' }}>
          {/* Backdrop */}
          <div onClick={() => setDrawerOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} />
          {/* Drawer panel */}
          <div style={{ width: 300, background: '#0d0d1a', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideLeft 0.3s ease' }}>
            {/* Drawer header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={profile.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{profile.display_name}</div>
                <div style={{ fontSize: 12, color: '#FACC15', fontWeight: 700 }}>{tier?.tier_name || 'Bronze'} Driver</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
            {/* Menu items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              <button onClick={() => { setTab('profile'); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>👤</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>My Profile</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
              <button onClick={() => { setShowTopUp(true); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>💰</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>Wallet & Top Up</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
              <button onClick={() => { setShowEliteAwards(true); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>💎</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>INDOO Elite Awards</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
              <button onClick={() => { setShowHotspotMap(true); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>🗺️</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>Hotspot Map</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
              <button onClick={() => { setTab('earnings'); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>📊</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>Earnings</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

              {/* Car Fare Rates */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><span>🚕</span> Car Fare Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Base Fare</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 12.000</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Per KM</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 4.000</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Min Fare</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 15.000</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Waiting (per min)</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 1.500</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

              {/* Food Delivery Rates */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><span>🍔</span> Food Delivery Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Base</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 5.000</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Per KM</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 2.000</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Min</span><span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15' }}>Rp 8.000</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

              <button onClick={() => { localStorage.removeItem('indoo_car_driver_terms_accepted'); localStorage.removeItem('indoo_car_driver_terms_accepted_at'); setTermsAccepted(false); setDrawerOpen(false) }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>📋</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>Terms & Conditions</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 18 }}>📞</span><span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>Support</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>+62 812-3456-7890</span>
              </div>
              <button onClick={() => { setDrawerOpen(false); handleLogout() }} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>🔴</span><span style={{ flex: 1, fontSize: 14, color: '#EF4444', fontWeight: 600 }}>Sign Out</span><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* ── Bottom tab bar — floating ── */}
      <div style={{
        position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', left: 16, right: 16,
        padding: '10px 8px',
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 20,
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
          onClose={() => setShowCashFloat(false)}
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

      {/* ── Top Up Wallet Overlay ── */}
      {showTopUp && (() => {
        const bal = wallet?.balance ?? 0
        const minBal = 100000
        const walletColor = bal >= minBal ? '#22C55E' : bal >= minBal * 0.5 ? '#FACC15' : '#EF4444'
        const walletStatus = bal >= minBal ? 'Healthy' : bal >= minBal * 0.5 ? 'Low Balance' : 'Restricted'
        const QUICK_AMOUNTS = [50000, 100000, 200000, 300000]
        const PAYMENT_METHODS = [
          { id: 'bank', label: 'Bank Transfer (BCA)', icon: '🏦' },
          { id: 'gopay', label: 'GoPay', icon: '💚' },
          { id: 'ovo', label: 'OVO', icon: '💜' },
          { id: 'dana', label: 'DANA', icon: '💙' },
          { id: 'shopeepay', label: 'ShopeePay', icon: '🧡' },
          { id: 'indomaret', label: 'Indomaret', icon: '🏪' },
          { id: 'alfamart', label: 'Alfamart', icon: '🏬' },
        ]
        return (
          <TopUpOverlay
            wallet={wallet}
            bal={bal}
            minBal={minBal}
            walletColor={walletColor}
            walletStatus={walletStatus}
            quickAmounts={QUICK_AMOUNTS}
            paymentMethods={PAYMENT_METHODS}
            fmtRp={fmtRp}
            userId={user?.id}
            onClose={() => setShowTopUp(false)}
            onTopUpComplete={(w) => { setWallet(w); setShowTopUp(false) }}
          />
        )
      })()}

      {/* ── INDOO Elite Awards Page ── */}
      {showEliteAwards && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080808', display: 'flex', flexDirection: 'column' }}>
          <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.2 }} />

          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(141,198,63,0.2)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
            <button onClick={() => setShowEliteAwards(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>←</button>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'block' }}>💎 INDOO Elite Awards</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Exclusive rewards for Elite car drivers</span>
            </div>
          </div>

          {/* Products grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', position: 'relative', zIndex: 1 }}>
            {/* Intro */}
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(141,198,63,0.15)', marginBottom: 16, textAlign: 'center' }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>💎</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'block' }}>INDOO Elite Service Provider</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: 4 }}>Reach Elite status (500+ trips, 4.8+ rating) to unlock these exclusive free rewards</span>
            </div>

            {/* Landscape product cards */}
            {[
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2001_53_00%20AM.png', name: 'INDOO Elite Jacket', desc: 'Premium lined jacket representing the finest delivery service in Indonesia. Colour-reflecting design with INDOO branding.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#8DC63F' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2001_56_58%20AM.png', name: 'INDOO T-Shirt', desc: 'Official INDOO branded performance t-shirt. Breathable fabric, perfect for daily rides in any weather.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#00E5FF' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2002_00_04%20AM.png', name: 'INDOO Helmet', desc: 'Safety-certified branded helmet with INDOO Elite design. High-visibility markings for safer night rides.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#8DC63F' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2002_07_42%20AM.png', name: 'INDOO Baseball Cap', desc: 'Stylish INDOO branded cap. Perfect for off-duty wear and representing your Elite status.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#FACC15' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2002_12_43%20AM.png', name: 'INDOO Delivery Bag', desc: 'Insulated thermal backpack with INDOO branding. Keeps food hot or cold during transport. Built for daily use.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#00E5FF' },
              { icon: '🏨', name: 'Hotel / Villa Stay', desc: '1-night stay voucher at partner hotels or villas in Yogyakarta. Redeemable quarterly.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#FACC15' },
              { icon: '🍽️', name: 'Meal Vouchers', desc: 'Monthly meal voucher pack (5x Rp 25.000) redeemable at any INDOO partner restaurant.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#8DC63F' },
              { icon: '🎫', name: 'Elite Event Passes', desc: 'VIP invitation to quarterly INDOO driver meetups, workshops, and exclusive social events.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#00E5FF' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2002_20_02%20AM.png', name: 'INDOO Phone Cover', desc: 'Protective phone case with INDOO Elite branding. Shock-resistant design built for drivers on the move.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#8DC63F' },
              { img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2002_25_57%20AM.png', name: 'INDOO Leather Wallet', desc: 'Premium men\'s leather wallet with embossed INDOO Elite crest. Quality craftsmanship for our top drivers.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#FACC15' },
              { icon: '📱', name: 'Priority Support Line', desc: 'Direct WhatsApp access to INDOO support team. Average response time: 2 minutes.', status: tier?.current?.id === 'elite' ? 'available' : 'locked', color: '#8DC63F' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1px solid ${item.status === 'available' ? item.color + '40' : 'rgba(255,255,255,0.08)'}`, marginBottom: 10 }}>
                {/* Icon/Image */}
                <div style={{ width: 80, height: 80, borderRadius: 16, background: item.status === 'available' ? `${item.color}10` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${item.status === 'available' ? item.color + '30' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {item.img ? (
                    <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'none' }} />
                  ) : (
                    <span style={{ fontSize: 32, filter: 'none' }}>{item.icon}</span>
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: item.status === 'available' ? '#fff' : 'rgba(255,255,255,0.4)' }}>{item.name}</span>
                    {item.status === 'available' ? (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F' }}>FREE</span>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', color: '#FACC15' }}>🔒 ELITE</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, display: 'block' }}>{item.desc}</span>
                  {item.status === 'available' && (
                    <button style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, background: item.color, border: 'none', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Claim Reward</button>
                  )}
                </div>
              </div>
            ))}

            {/* Footer note */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Rewards refreshed quarterly · Items subject to availability</span>
            </div>
          </div>
        </div>
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

          {/* Bottom info panel — floating */}
          <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', left: 16, right: 16, padding: '14px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.1)', zIndex: 2 }}>
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

// ── Top Up Overlay Component ─────────────────────────────────────────────────
function TopUpOverlay({ wallet, bal, minBal, walletColor, walletStatus, quickAmounts, paymentMethods, fmtRp, userId, onClose, onTopUpComplete }) {
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [transferProof, setTransferProof] = useState(null)
  const [topUpSuccess, setTopUpSuccess] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleConfirm = async () => {
    if (!selectedAmount || !selectedMethod) return
    setProcessing(true)
    try {
      const result = await topUpPrepaidWallet(userId ?? 'default', selectedAmount, selectedMethod)
      setTopUpSuccess(true)
      setTimeout(() => {
        getPrepaidWallet(userId ?? 'default', 'car_driver').then(w => onTopUpComplete(w)).catch(() => onTopUpComplete({ ...wallet, balance: (wallet?.balance ?? 0) + selectedAmount }))
      }, 1500)
    } catch {
      setTopUpSuccess(true)
      setTimeout(() => {
        onTopUpComplete({ ...wallet, balance: (wallet?.balance ?? 0) + selectedAmount })
      }, 1500)
    }
    setProcessing(false)
  }

  if (topUpSuccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080808', display: 'flex', flexDirection: 'column' }}>
        <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.2 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>✅</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', display: 'block', marginBottom: 8 }}>Top Up Successful!</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{fmtRp(selectedAmount)} added to your wallet</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'block' }}>Returning to dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#080808', display: 'flex', flexDirection: 'column' }}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.2 }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(141,198,63,0.2)', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px' }}>←</button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Top Up Wallet</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Add funds to your car driver wallet</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', position: 'relative', zIndex: 1 }}>

        {/* Current balance */}
        <div style={{ padding: 20, borderRadius: 18, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${walletColor}40`, marginBottom: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Current Balance</span>
          <span style={{ fontSize: 32, fontWeight: 900, color: walletColor, display: 'block' }}>{fmtRp(bal)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: walletColor, marginTop: 6, display: 'inline-block', padding: '3px 12px', borderRadius: 8, background: `${walletColor}18`, border: `1px solid ${walletColor}30` }}>{walletStatus}</span>
        </div>

        {/* Quick amounts */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 10 }}>Select Amount</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickAmounts.map(amt => (
              <button key={amt} onClick={() => setSelectedAmount(amt)} style={{ padding: 16, borderRadius: 14, background: selectedAmount === amt ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${selectedAmount === amt ? '#8DC63F' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: selectedAmount === amt ? '#8DC63F' : '#fff', display: 'block' }}>{fmtRp(amt)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 10 }}>Payment Method</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paymentMethods.map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m.id)} style={{ padding: '14px 16px', borderRadius: 14, background: selectedMethod === m.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${selectedMethod === m.id ? '#8DC63F' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: selectedMethod === m.id ? '#8DC63F' : '#fff', textAlign: 'left' }}>{m.label}</span>
                {selectedMethod === m.id && <span style={{ fontSize: 16, color: '#8DC63F' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Bank transfer details (shown when bank selected) */}
        {selectedMethod === 'bank' && (
          <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Transfer To This Account</span>
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Bank</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>BCA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Account Name</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>PT HAMMEREX PRODUCTS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Account Number</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', letterSpacing: '0.1em' }}>7890-1234-5678</span>
              </div>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText('789012345678') }} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', color: '#FACC15', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
              Copy Account Number
            </button>

            {/* Screenshot upload */}
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 10 }}>Upload Transfer Screenshot</span>
            {transferProof ? (
              <div style={{ position: 'relative' }}>
                <img src={transferProof} alt="Transfer proof" style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }} />
                <button onClick={() => setTransferProof(null)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 20px', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 32 }}>📷</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Tap to upload screenshot</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>JPG, PNG accepted</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = ev => setTransferProof(ev.target.result)
                    reader.readAsDataURL(file)
                  }
                }} />
              </label>
            )}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedAmount || !selectedMethod || processing || (selectedMethod === 'bank' && !transferProof)}
          style={{
            width: '100%', padding: 16, borderRadius: 14,
            background: (selectedAmount && selectedMethod && (selectedMethod !== 'bank' || transferProof)) ? '#8DC63F' : 'rgba(255,255,255,0.06)',
            border: (selectedAmount && selectedMethod && (selectedMethod !== 'bank' || transferProof)) ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: (selectedAmount && selectedMethod && (selectedMethod !== 'bank' || transferProof)) ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: 15, fontWeight: 900,
            cursor: (selectedAmount && selectedMethod && (selectedMethod !== 'bank' || transferProof)) ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}>
          {processing ? 'Processing...' : selectedAmount ? `Confirm Top Up ${fmtRp(selectedAmount)}` : 'Select amount and method'}
        </button>
      </div>
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
