/**
 * AndongApp — Standalone dashboard for Andong (horse cart) operators.
 * Cultural heritage transport — Yogyakarta traditional horse-drawn carriage.
 * Includes horse profile management, welfare tracking, and ride bookings.
 */
import { useState, useEffect } from 'react'
import {
  WELFARE, ANDONG_PRICING, getAvailableHorses,
  checkHorseAvailability, calculateAndongFare,
  getWelfareSummary, formatRpAndong,
} from '@/services/andongService'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2011_17_44%20AM.png?updatedAt=1777263492233'

const TABS = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'horse', icon: '🐴', label: 'Horse' },
  { id: 'earnings', icon: '💰', label: 'Earnings' },
  { id: 'welfare', icon: '💚', label: 'Welfare' },
]

// Demo earnings data
const DEMO_EARNINGS = {
  today: 225000,
  week: 1350000,
  month: 4800000,
  trips_today: 3,
  trips_week: 18,
  trips_month: 64,
  rating: 4.8,
}

export default function AndongApp() {
  const [tab, setTab] = useState('home')
  const [isOnline, setIsOnline] = useState(false)
  const [horses, setHorses] = useState([])
  const [selectedHorse, setSelectedHorse] = useState(null)
  const [incomingBooking, setIncomingBooking] = useState(null)
  const [temperature, setTemperature] = useState(29)

  // Load horses
  useEffect(() => {
    getAvailableHorses(temperature).then(h => {
      setHorses(h)
      if (!selectedHorse && h.length) setSelectedHorse(h[0])
    })
  }, [temperature])

  // Demo: simulate incoming booking after going online
  useEffect(() => {
    if (!isOnline || incomingBooking) return
    const timer = setTimeout(() => {
      setIncomingBooking({
        id: 'andong-demo-001',
        passenger_name: 'Sarah Johnson',
        passenger_photo: 'https://i.pravatar.cc/200?img=9',
        passengers: 2,
        duration_hours: 1,
        pickup_address: 'Hotel Tentrem, Jl. P. Mangkubumi',
        pickup_coords: { lat: -7.7835, lng: 110.3642 },
        fare: calculateAndongFare(1, -7.7835, 110.3642),
        notes: 'Would love to see Kraton area',
        created_at: new Date().toISOString(),
      })
    }, 5000)
    return () => clearTimeout(timer)
  }, [isOnline, incomingBooking])

  const welfare = getWelfareSummary()
  const horse = selectedHorse

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080808', position: 'relative' }}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', opacity: 0.6 }} />

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900 }}>
            <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>Andong</span>
          </span>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginTop: 2 }}>Cultural Heritage Transport</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{temperature}°C</span>
          {temperature >= WELFARE.TEMP_REDUCED_C && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: temperature >= WELFARE.TEMP_SHUTDOWN_C ? '#EF4444' : '#FACC15', color: '#000', fontWeight: 800 }}>
              {temperature >= WELFARE.TEMP_SHUTDOWN_C ? 'TOO HOT' : 'HOT'}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <>
            {/* Online toggle */}
            <div style={{ padding: 20, borderRadius: 20, background: isOnline ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: `1.5px solid ${isOnline ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.1)'}`, marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: isOnline ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)', border: `3px solid ${isOnline ? '#8DC63F' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span style={{ fontSize: 28 }}>{isOnline ? '🐴' : '😴'}</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 900, color: isOnline ? '#8DC63F' : 'rgba(255,255,255,0.5)', display: 'block' }}>{isOnline ? 'ACCEPTING RIDES' : 'OFFLINE'}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 4 }}>
                {isOnline ? `${horse?.name || 'Your horse'} is ready for passengers` : 'Go online to accept andong bookings'}
              </span>
              {temperature >= WELFARE.TEMP_SHUTDOWN_C ? (
                <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>Bookings suspended — {temperature}°C exceeds safe limit for horses</span>
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => setIsOnline(!isOnline)} style={{ padding: '14px 40px', borderRadius: 14, background: isOnline ? '#991B1B' : '#8DC63F', border: 'none', color: isOnline ? '#fff' : '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isOnline ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              )}
            </div>

            {/* Active horse card */}
            {horse && (
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(141,198,63,0.1)', border: '2px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🐴</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{horse.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{horse.breed} · {horse.color} · Age {horse.age}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>⭐</span> {horse.rating}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{horse.total_trips} trips</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>🎨 {horse.cart_style}</div>

                {/* Today's welfare stats */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'Trips', value: `${horse.today_trips}/${WELFARE.MAX_TRIPS_PER_DAY}`, color: horse.today_trips >= WELFARE.MAX_TRIPS_PER_DAY ? '#EF4444' : '#8DC63F' },
                    { label: 'Hours', value: `${horse.today_hours}/${WELFARE.MAX_HOURS_PER_DAY}h`, color: horse.today_hours >= WELFARE.MAX_HOURS_PER_DAY ? '#EF4444' : '#8DC63F' },
                    { label: 'Distance', value: `${horse.today_km}/${WELFARE.MAX_DISTANCE_KM_PER_DAY}km`, color: horse.today_km >= WELFARE.MAX_DISTANCE_KM_PER_DAY ? '#EF4444' : '#8DC63F' },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Availability status */}
                {!horse.available && horse.reason && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{horse.reason}</span>
                  </div>
                )}
                {horse.warning && horse.reason && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)' }}>
                    <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 600 }}>{horse.reason}</span>
                  </div>
                )}
              </div>
            )}

            {/* Today's earnings quick view */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F' }}>{formatRpAndong(DEMO_EARNINGS.today)}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Today's Earnings</div>
              </div>
              <div style={{ flex: 1, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{DEMO_EARNINGS.trips_today}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Trips Today</div>
              </div>
            </div>

            {/* Pricing info */}
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Andong Fare Rates</div>
              {ANDONG_PRICING.packages.map((pkg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{pkg.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {pkg.badge && <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontWeight: 700 }}>{pkg.badge}</span>}
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{formatRpAndong(pkg.price)}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Hotel pickup (outside Malioboro)</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>+{formatRpAndong(ANDONG_PRICING.hotelPickupFee)}</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>INDOO takes 10% commission — you keep 90% of every fare</div>
            </div>
          </>
        )}

        {/* ── HORSE TAB ── */}
        {tab === 'horse' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Your Horses</div>
            {horses.map(h => (
              <div key={h.id} style={{ padding: 16, borderRadius: 16, background: selectedHorse?.id === h.id ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${selectedHorse?.id === h.id ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 10, cursor: 'pointer' }} onClick={() => setSelectedHorse(h)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>🐴</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{h.breed} · {h.color} · Age {h.age}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>🎨 {h.cart_style}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: h.available ? '#8DC63F' : '#EF4444' }}>{h.available ? 'Available' : 'Resting'}</span>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>⭐ {h.rating} · {h.total_trips} trips</div>
                  </div>
                </div>

                {/* Health info */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontSize: 11 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Vet check: </span>
                    <span style={{ color: h.vet_status === 'healthy' ? '#8DC63F' : '#EF4444', fontWeight: 700 }}>{h.vet_status}</span>
                  </div>
                  <div style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontSize: 11 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>Next vet: </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{h.next_vet_due?.slice(0, 10)}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  Rest day: <span style={{ color: '#FACC15', fontWeight: 700 }}>{h.rest_day}</span> · Capacity: {h.capacity} passengers
                </div>
                {!h.available && h.reason && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#EF4444' }}>{h.reason}</div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── EARNINGS TAB ── */}
        {tab === 'earnings' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Earnings</div>
            {[
              { label: 'Today', amount: DEMO_EARNINGS.today, trips: DEMO_EARNINGS.trips_today },
              { label: 'This Week', amount: DEMO_EARNINGS.week, trips: DEMO_EARNINGS.trips_week },
              { label: 'This Month', amount: DEMO_EARNINGS.month, trips: DEMO_EARNINGS.trips_month },
            ].map((e, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{e.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F', marginTop: 4 }}>{formatRpAndong(e.amount)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{e.trips}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>trips</div>
                </div>
              </div>
            ))}
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your Rating</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', marginTop: 4 }}>⭐ {DEMO_EARNINGS.rating}</div>
            </div>
          </>
        )}

        {/* ── WELFARE TAB ── */}
        {tab === 'welfare' && (
          <>
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(141,198,63,0.06)', border: '1.5px solid rgba(141,198,63,0.2)', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', marginBottom: 4 }}>{welfare.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{welfare.subtitle}</div>
              {welfare.standards.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{s.icon}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s.text}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{welfare.disclaimer}</div>
            </div>
          </>
        )}
      </div>

      {/* ── Incoming Booking Overlay ── */}
      {incomingBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 340, borderRadius: 20, background: 'rgba(15,15,20,0.95)', border: '1.5px solid rgba(141,198,63,0.3)', padding: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 40 }}>🐴</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 8 }}>New Andong Booking!</div>

            {/* Passenger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
              <img src={incomingBooking.passenger_photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(141,198,63,0.3)' }} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{incomingBooking.passenger_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{incomingBooking.passengers} passengers · {incomingBooking.duration_hours}h tour</div>
              </div>
            </div>

            {/* Pickup */}
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: 0.5 }}>PICKUP</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{incomingBooking.pickup_address}</div>
              {incomingBooking.notes && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontStyle: 'italic' }}>"{incomingBooking.notes}"</div>
              )}
            </div>

            {/* Fare */}
            <div style={{ marginTop: 12, fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>
              {formatRpAndong(incomingBooking.fare.total)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              You earn: {formatRpAndong(incomingBooking.fare.driverGets)}
              {incomingBooking.fare.isOutsideMalioboro && ' (incl. hotel pickup fee)'}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setIncomingBooking(null)} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Decline
              </button>
              <button onClick={() => { setIncomingBooking(null) }} style={{ flex: 2, padding: 14, borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                Accept Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom nav ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: tab === t.id ? 1 : 0.4, transition: 'opacity 0.2s' }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.id ? '#8DC63F' : '#fff' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
