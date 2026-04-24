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

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_04_21%20PM.png'

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

  // ── Dashboard ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808' }}>

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <>
            {/* Today stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', display: 'block' }}>{todayTrips}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Trips Today</span>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{fmtRp(todayEarnings)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Earned Today</span>
              </div>
            </div>

            {/* Goals */}
            {goals && (
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 10 }}>Daily Goal</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (todayTrips / goals.daily_trips) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #8DC63F, #FACC15)', borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{todayTrips}/{goals.daily_trips}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6, display: 'block' }}>Complete {goals.daily_trips} trips today → bonus {fmtRp(goals.daily_bonus)}</span>
              </div>
            )}

            {/* Tier card */}
            {tier && (
              <div style={{ padding: 16, borderRadius: 16, background: `linear-gradient(135deg, ${tier.current.color}15, rgba(0,0,0,0.3))`, border: `1.5px solid ${tier.current.color}33`, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{tier.current.icon ?? '🥉'}</span>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{tier.current.name} Driver</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{tier.totalTrips} trips · {tier.current.bonusMultiplier}x bonus</span>
                  </div>
                </div>
                {tier.next && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Next: {tier.next.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tier.tripsToNext} trips to go</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${tier.progress * 100}%`, height: '100%', background: tier.current.color ?? '#8DC63F', borderRadius: 3 }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setTab('rides')} style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🏍️</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', display: 'block' }}>Ride Orders</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Bike & Car</span>
              </button>
              <button onClick={() => setTab('food')} style={{ padding: 16, borderRadius: 16, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🍔</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FACC15', display: 'block' }}>Food Delivery</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{foodOrders.length} active</span>
              </button>
              <button onClick={() => setTab('earnings')} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>💰</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>Earnings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>History & payouts</span>
              </button>
              <button onClick={() => setTab('profile')} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>👤</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>Profile</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Settings & docs</span>
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
                  <div key={order.id} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', display: 'block' }}>{fmtRp(todayEarnings)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Today</span>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', display: 'block' }}>{todayTrips}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Trips</span>
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>INDOO drivers keep 100% of fares. Commission is 10% paid from your wallet — not deducted from earnings.</span>
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
