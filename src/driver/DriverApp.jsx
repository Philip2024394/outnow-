/**
 * DriverApp — Standalone driver PWA for indoodrive.id
 * Login → Dashboard with tabs: Rides | Food | Deals | Earnings | Profile
 */
import { useState, useEffect } from 'react'
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
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', margin: '0 0 16px' }}>Terms & Conditions — INDOO Driver Platform</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>Operated by PT HAMMEREX PRODUCTS INDONESIA</p>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
                <p style={{ fontWeight: 800, color: '#fff', marginBottom: 8 }}>1. SERVICE FEE & COMMISSION</p>
                <p>By using the INDOO platform, drivers agree to pay a platform service fee of 10% (ten percent) of all earnings generated through the platform. This commission is payable to PT HAMMEREX PRODUCTS INDONESIA ("the Company") on a rolling basis.</p>
                <p style={{ color: '#EF4444', fontWeight: 700, margin: '8px 0' }}>Failure to pay the 10% service fee within 30 days of the due date will result in a daily penalty increase of 20% applied to the total outstanding amount. This penalty covers loss of earnings, administrative processing, and recruitment fees. The penalty will continue to accumulate daily until the full balance is settled.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>2. VEHICLE INSURANCE REQUIREMENT</p>
                <p>All drivers are required to maintain valid and active vehicle insurance at all times while operating on the INDOO platform. It is strictly prohibited to operate any vehicle without active insurance coverage. Any accident, damage, injury, or liability incurred while insurance is not active shall be the sole personal responsibility of the driver — including in cases where the vehicle is owned by a third party. The Company accepts no liability whatsoever for uninsured operations.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>3. CONDUCT & PRICING</p>
                <p>Drivers must maintain professional and respectful behaviour with all passengers and customers at all times. Drivers must only charge the fare price stated and approved by the platform. Overcharging, harassment, or unprofessional conduct will result in immediate deactivation and potential legal action.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>4. VEHICLE ROADWORTHINESS</p>
                <p>All vehicles used on the INDOO platform must meet road safety and roadworthiness standards as required by Indonesian law. Vehicles must pass inspection requirements and be maintained in safe operating condition. The Company reserves the right to deactivate any driver whose vehicle does not meet these standards.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>5. SELF-EMPLOYED STATUS</p>
                <p style={{ fontWeight: 700 }}>Drivers joining the INDOO platform are fully self-employed independent contractors. The platform acts solely as a gateway to connect drivers with customers and does not act as an employer in any form, shape, or capacity. No employment relationship exists between the driver and PT HAMMEREX PRODUCTS INDONESIA or any of its subsidiaries.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>6. TAX & GOVERNMENT OBLIGATIONS</p>
                <p>Each driver is solely responsible for keeping their government tax obligations, permits, licences, and any other regulatory requirements fully up to date. The Company is not responsible for any driver's tax affairs or regulatory compliance.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>7. DATA SHARING & PRIVACY</p>
                <p>All drivers agree to the sharing of their contact details and personal information with platform users when necessary for the completion of services. Driver data may be used by the platform owners (PT HAMMEREX PRODUCTS INDONESIA) for training purposes, driver validation, quality assurance, dispute resolution, and platform improvement. By accepting these terms, drivers consent to this data usage.</p>

                <p style={{ fontWeight: 800, color: '#fff', marginTop: 20, marginBottom: 8 }}>8. PLATFORM RIGHTS</p>
                <p>PT HAMMEREX PRODUCTS INDONESIA reserves the right to deactivate, suspend, or permanently remove any driver account at its sole discretion for any violation of these terms, or for any reason that the Company deems necessary to protect the platform, its users, or its reputation.</p>

                <p style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', fontWeight: 700, color: '#8DC63F' }}>
                  By accepting below, you confirm that you have read, understood, and agree to all terms and conditions set forth by PT HAMMEREX PRODUCTS INDONESIA. You acknowledge that you are entering into this agreement as a self-employed independent contractor.
                </p>
              </div>
            </div>
          </div>

          {/* Accept button */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
            <button onClick={() => { localStorage.setItem('indoo_driver_terms_accepted', 'true'); setTermsAccepted(true) }} style={{ width: '100%', padding: 18, borderRadius: 16, background: '#8DC63F', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              I Accept These Terms & Conditions
            </button>
            <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '10px 0 0' }}>PT HAMMEREX PRODUCTS INDONESIA · All rights reserved</p>
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

            {/* Goals progress */}
            {goals && (
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Daily Goal</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#8DC63F' }}>{todayTrips}/{goals.daily_trips} trips</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (todayTrips / goals.daily_trips) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #8DC63F, #FACC15)', borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>Bonus {fmtRp(goals.daily_bonus)} on completion</span>
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
    </div>
  )
}
