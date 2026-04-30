/**
 * AndongBookingScreen — 4-page flow for booking a horse cart experience.
 * Page 1: Full-screen landing
 * Page 2: Tour packages by category
 * Page 3: Map with horses + booking options
 * Page 4: Horse selection cards
 */
import { useState, useEffect } from 'react'
import {
  ANDONG_PRICING, ANDONG_PACKAGES, PACKAGE_CATEGORIES, TIME_SLOTS,
  getAvailableHorses, calculateAndongFare, formatRpAndong,
} from '@/services/andongService'

// ── Page 1: Full-Screen Landing ──────────────────────────────────────────────

function LandingPage({ onNext, onClose }) {
  return (
    <div style={{ ...S.page, background: '#000' }}>
      <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2006_01_25%20AM.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.95) 100%)' }} />
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 14, zIndex: 10 }}>
        <button onClick={onClose} style={{ ...S.backBtn, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
      </div>
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', right: 16, zIndex: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 900 }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>Andong</span></span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, padding: '0 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>Ride a<br />Horse Cart</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, lineHeight: 1.5, maxWidth: 280 }}>Experience Yogyakarta's iconic andong — cultural heritage tours through historic streets</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {['💚 Welfare Certified', '📅 Book Tomorrow', '🏨 Hotel Pickup', '💬 Chat with Kusir'].map((f, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.8)' }}>{f}</span>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>From <span style={{ color: '#8DC63F', fontWeight: 900, fontSize: 18 }}>{formatRpAndong(75000)}</span> / tour</div>
        <button onClick={onNext} style={{ ...S.primaryBtn, marginTop: 16 }}>Browse Tour Packages</button>
      </div>
    </div>
  )
}

// ── Page 2: Tour Packages ────────────────────────────────────────────────────

function PackagesPage({ onSelectPackage, onBack }) {
  const [cat, setCat] = useState('all')
  const filtered = cat === 'all' ? ANDONG_PACKAGES : ANDONG_PACKAGES.filter(p => p.category === cat)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Tour Packages</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ANDONG_PACKAGES.length} experiences available</div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', flexShrink: 0 }}>
        {PACKAGE_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
            borderColor: cat === c.id ? 'rgba(141,198,63,0.5)' : 'rgba(255,255,255,0.08)',
            background: cat === c.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.04)',
            color: cat === c.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{c.icon} {c.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}>
        {filtered.map(pkg => (
          <button key={pkg.id} onClick={() => onSelectPackage(pkg)} style={{
            width: '100%', padding: 14, borderRadius: 16, marginBottom: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{pkg.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{pkg.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{pkg.hours}h · {pkg.bestTime}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{formatRpAndong(pkg.price)}</div>
                {pkg.badge && <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: pkg.badge === 'Premium' ? 'rgba(250,204,21,0.15)' : pkg.badge === 'Ethical' ? 'rgba(141,198,63,0.15)' : 'rgba(59,130,246,0.15)', color: pkg.badge === 'Premium' ? '#FACC15' : pkg.badge === 'Ethical' ? '#8DC63F' : '#60A5FA', fontWeight: 700 }}>{pkg.badge}</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.4 }}>{pkg.desc}</div>

            {/* Includes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {(pkg.includes || []).slice(0, 4).map((inc, i) => (
                <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>{inc}</span>
              ))}
              {(pkg.includes || []).length > 4 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>+{pkg.includes.length - 4} more</span>}
            </div>

            {/* Welfare note */}
            <div style={{ fontSize: 9, color: 'rgba(141,198,63,0.5)', marginTop: 6 }}>💚 {pkg.welfareNote}</div>
          </button>
        ))}

        {/* Hotel pickup note */}
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 16 }}>🏨</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Hotel pickup: +{formatRpAndong(ANDONG_PRICING.hotelPickupFee)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Free within Malioboro zone</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 3: Map + Booking Options ────────────────────────────────────────────

function MapPage({ pkg, horses, bookingDate, setBookingDate, bookingSlot, setBookingSlot, onViewAvailable, onBack }) {
  const availableCount = horses.filter(h => h.available && h.status !== 'booked').length
  const bookedCount = horses.filter(h => h.status === 'booked' || !h.available).length
  const fare = calculateAndongFare(pkg, null, null)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{pkg.icon} {pkg.label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{pkg.hours}h · {formatRpAndong(pkg.price)} · <span style={{ color: '#8DC63F' }}>{availableCount} available</span></div>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: 220, background: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a1a0a, #0a0a15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 12 }}>Yogyakarta Area</div>
          </div>
        </div>
        {horses.map((h, i) => {
          const isBooked = h.status === 'booked' || !h.available
          const left = 15 + (i * 14) + (i % 2 ? 6 : 0)
          const top = 25 + (i * 10) + (i % 3 ? 12 : -8)
          return (
            <div key={h.id} style={{
              position: 'absolute', left: `${Math.min(left, 82)}%`, top: `${Math.min(Math.max(top, 12), 72)}%`,
              width: 14, height: 14, borderRadius: '50%',
              background: isBooked ? '#EF4444' : '#8DC63F', border: '2px solid rgba(0,0,0,0.5)',
              boxShadow: isBooked ? 'none' : '0 0 8px rgba(141,198,63,0.6)',
              animation: isBooked ? 'none' : 'pulse 2s ease-in-out infinite', zIndex: 5,
            }}>
              <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.7)', padding: '1px 3px', borderRadius: 2 }}>{h.name}</div>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 130px' }}>
        {/* Package summary */}
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{pkg.desc}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {(pkg.includes || []).map((inc, i) => (
              <span key={i} style={{ fontSize: 9, padding: '3px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.5)' }}>✓ {inc}</span>
            ))}
          </div>
        </div>

        {/* Book Today / Tomorrow */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['today', 'tomorrow'].map(d => (
            <button key={d} onClick={() => setBookingDate(d)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid',
              borderColor: bookingDate === d ? 'rgba(141,198,63,0.5)' : 'rgba(255,255,255,0.08)',
              background: bookingDate === d ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.04)',
              color: bookingDate === d ? '#8DC63F' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>{d === 'today' ? 'Book Today' : 'Book Tomorrow'}</button>
          ))}
        </div>

        {/* Time slots */}
        {bookingDate === 'tomorrow' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {TIME_SLOTS.map(slot => (
              <button key={slot.id} onClick={() => setBookingSlot(slot.id)} style={{
                minWidth: 72, padding: '8px 8px', borderRadius: 10, border: '1.5px solid',
                borderColor: bookingSlot === slot.id ? 'rgba(141,198,63,0.5)' : 'rgba(255,255,255,0.08)',
                background: bookingSlot === slot.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{ fontSize: 14 }}>{slot.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: bookingSlot === slot.id ? '#8DC63F' : '#fff', marginTop: 2 }}>{slot.label}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{slot.time}</div>
              </button>
            ))}
          </div>
        )}

        {/* Fare summary */}
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{pkg.label} ({pkg.hours}h)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatRpAndong(pkg.price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Hotel pickup (if outside Malioboro)</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>+{formatRpAndong(ANDONG_PRICING.hotelPickupFee)}</span>
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <button onClick={onViewAvailable} style={S.primaryBtn}>View Available Horses · {formatRpAndong(pkg.price)}</button>
      </div>
    </div>
  )
}

// ── Page 4: Horse Selection Cards ────────────────────────────────────────────

function HorseSelectionPage({ horses, pkg, bookingDate, bookingSlot, onBook, onBack }) {
  const [selectedHorse, setSelectedHorse] = useState(null)
  const available = horses.filter(h => {
    if (!h.available || h.status === 'booked') return false
    return h.availablePackages?.some(p => p.hours >= pkg.hours) ?? true
  })
  const fare = calculateAndongFare(pkg, null, null)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Choose Your Horse</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{available.length} available for {pkg.label}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 140px' }}>
        {available.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: 40 }}>🐴</span>
            <div style={{ marginTop: 8, fontSize: 14 }}>No horses available for this package right now</div>
            <div style={{ marginTop: 4, fontSize: 12 }}>Try a shorter tour or book for tomorrow</div>
          </div>
        )}

        {available.map(h => {
          const selected = selectedHorse?.id === h.id
          return (
            <button key={h.id} onClick={() => setSelectedHorse(h)} style={{
              width: '100%', display: 'flex', gap: 12, padding: 14, borderRadius: 16, marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              background: selected ? 'rgba(141,198,63,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${selected ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              <div style={{ flexShrink: 0 }}>
                <img src={h.owner_photo} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: `2px solid ${selected ? 'rgba(141,198,63,0.4)' : 'rgba(255,255,255,0.1)'}` }} />
                <div style={{ textAlign: 'center', marginTop: 4 }}><span style={{ fontSize: 10, color: '#FACC15', fontWeight: 700 }}>⭐ {h.rating}</span></div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{h.owner_name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>🐴 {h.name} · {h.color}</div>
                  </div>
                  <div style={{ padding: '3px 8px', borderRadius: 6, background: h.cart_type === 'covered' ? 'rgba(59,130,246,0.15)' : 'rgba(250,204,21,0.15)', border: `1px solid ${h.cart_type === 'covered' ? 'rgba(59,130,246,0.3)' : 'rgba(250,204,21,0.3)'}` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: h.cart_type === 'covered' ? '#60A5FA' : '#FACC15' }}>{h.cart_type === 'covered' ? '🏠 Covered' : '☀️ Open'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>🪑 {h.seats} seats</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>🎨 {h.cart_color}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{h.total_trips} trips</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {(h.languages || []).map(lang => (
                    <span key={lang} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'rgba(141,198,63,0.1)', color: '#8DC63F', fontWeight: 700 }}>{lang}</span>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>📏 {h.remainingKm}km remaining today · {h.remainingHours}h left</div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedHorse && fare && (
        <div style={S.footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{pkg.label} with {selectedHorse.owner_name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{bookingDate === 'tomorrow' ? `Tomorrow · ${TIME_SLOTS.find(s => s.id === bookingSlot)?.time || ''}` : 'Today · Now'}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F' }}>{formatRpAndong(fare.total)}</div>
          </div>
          <button onClick={() => onBook(selectedHorse)} style={S.primaryBtn}>Book {selectedHorse.name}</button>
        </div>
      )}
    </div>
  )
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function AndongBookingScreen({ onClose }) {
  const [page, setPage] = useState('landing')
  const [horses, setHorses] = useState([])
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [bookingDate, setBookingDate] = useState('today')
  const [bookingSlot, setBookingSlot] = useState('afternoon')
  const [bookedHorse, setBookedHorse] = useState(null)

  useEffect(() => { getAvailableHorses(29).then(setHorses) }, [])

  const handleSelectPackage = (pkg) => { setSelectedPkg(pkg); setPage('map') }
  const handleBook = (horse) => { setBookedHorse(horse); setPage('booked') }
  const fare = selectedPkg ? calculateAndongFare(selectedPkg, null, null) : null

  if (page === 'booked' && bookedHorse) {
    return (
      <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <span style={{ fontSize: 64 }}>🐴</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', marginTop: 12 }}>Andong Booked!</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{bookedHorse.name} with {bookedHorse.owner_name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{selectedPkg?.icon} {selectedPkg?.label}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{selectedPkg?.desc}</div>
          {bookingDate === 'tomorrow' && <div style={{ fontSize: 12, color: '#FACC15', marginTop: 6 }}>Tomorrow · {TIME_SLOTS.find(s => s.id === bookingSlot)?.time}</div>}
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 16 }}>{fare && formatRpAndong(fare.total)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>💚 Welfare certified ride</div>
          <button onClick={onClose} style={{ ...S.primaryBtn, marginTop: 24, maxWidth: 200, margin: '24px auto 0' }}>Done</button>
        </div>
      </div>
    )
  }

  if (page === 'landing') return <LandingPage onNext={() => setPage('packages')} onClose={onClose} />
  if (page === 'packages') return <PackagesPage onSelectPackage={handleSelectPackage} onBack={() => setPage('landing')} />
  if (page === 'map') return <MapPage pkg={selectedPkg} horses={horses} bookingDate={bookingDate} setBookingDate={setBookingDate} bookingSlot={bookingSlot} setBookingSlot={setBookingSlot} onViewAvailable={() => setPage('select')} onBack={() => setPage('packages')} />
  if (page === 'select') return <HorseSelectionPage horses={horses} pkg={selectedPkg} bookingDate={bookingDate} bookingSlot={bookingSlot} onBook={handleBook} onBack={() => setPage('map')} />
  return null
}

const S = {
  page: { position: 'fixed', inset: 0, zIndex: 99000, background: '#080808', display: 'flex', flexDirection: 'column' },
  header: { padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  backBtn: { width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  footer: { padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)' },
  primaryBtn: { width: '100%', padding: 16, borderRadius: 14, background: 'linear-gradient(135deg, #8DC63F, #6ba020)', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(141,198,63,0.35)' },
}
