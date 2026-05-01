/**
 * WebsiteLanding — Desktop landing page with product carousel and search.
 * Auto-scrolling listings, category brands, hero search.
 * Desktop only (hidden on mobile).
 */
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/i18n'
import { DEMO_LISTINGS } from '@/services/rentalService'

const LOGO = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'
const HERO_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

/* ── Category brands with icons ── */
const CATEGORIES = [
  { id: 'property', label: 'Property', icon: '🏠', color: '#8DC63F', desc: 'Villa · House · Kos · Land' },
  { id: 'cars', label: 'Cars', icon: '🚗', color: '#60A5FA', desc: 'Rental & Sale' },
  { id: 'bikes', label: 'Bikes', icon: '🏍️', color: '#F59E0B', desc: 'Matic · Sport · Trail' },
  { id: 'places', label: 'Places', icon: '📍', color: '#EC4899', desc: '282+ Destinations' },
  { id: 'dealhunt', label: 'Deal Hunt', icon: '🔥', color: '#EF4444', desc: 'Daily Deals' },
  { id: 'newprojects', label: 'New Projects', icon: '🏗️', color: '#FACC15', desc: 'Pre-Sale & Construction' },
  { id: 'agents', label: 'Agents', icon: '🏢', color: '#A855F7', desc: 'Verified Professionals' },
  { id: 'food', label: 'Food', icon: '🍽️', color: '#F97316', desc: 'Order & Delivery' },
]

const FEATURES = [
  { icon: '🏠', title: 'Property Sales & Rentals', desc: 'Houses, villas, apartments, kos, land, ruko, gudang — all property types' },
  { icon: '🏍️', title: 'Bike & Car Rides', desc: 'Book a ride to any property or place with live pricing' },
  { icon: '📍', title: 'Discover Places', desc: '282+ destinations with swipe carousel and ride booking' },
  { icon: '🔥', title: 'Deal Hunt', desc: 'Property discounts, rental specials, food offers' },
  { icon: '🏗️', title: 'New Projects', desc: 'Pre-sale villas, apartments — brochures and floor plans' },
  { icon: '🏢', title: 'Agent Directory', desc: 'Find verified agents with portfolios and testimonials' },
  { icon: '💳', title: 'KPR Calculator', desc: 'Mortgage calculator with Syariah and bank comparison' },
  { icon: '📊', title: 'Market Data', desc: 'Price history, valuations, comparable sales' },
]

const CITIES = [
  { name: 'Yogyakarta', listings: 142, image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=250&fit=crop' },
  { name: 'Bali', listings: 89, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop' },
  { name: 'Jakarta', listings: 56, image: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=250&fit=crop' },
  { name: 'Surabaya', listings: 34, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop' },
]

const STATS = [
  { val: '282+', label: 'Places' },
  { val: '13', label: 'Property Types' },
  { val: '5', label: 'Banks in KPR' },
  { val: '40+', label: 'Business Types' },
]

/* ── Auto-scrolling carousel ── */
function ProductCarousel({ listings, onSelect }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const speed = 0.5
    let raf
    const tick = () => {
      el.scrollLeft += speed
      // Loop
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const pause = () => cancelAnimationFrame(raf)
    const resume = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', pause); el.removeEventListener('mouseleave', resume) }
  }, [])

  const doubled = [...listings, ...listings]

  return (
    <div ref={scrollRef} style={{ display: 'flex', gap: 20, overflowX: 'hidden', scrollbarWidth: 'none', padding: '8px 0' }}>
      {doubled.map((l, i) => {
        const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
        return (
          <div key={`${l.id}-${i}`} onClick={() => onSelect?.(l)} style={{
            flexShrink: 0, width: 280, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ height: 170, overflow: 'hidden', position: 'relative' }}>
              <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: l.buy_now ? 'rgba(250,204,21,0.9)' : 'rgba(141,198,63,0.9)', fontSize: 11, fontWeight: 800, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>📍 {l.city} · {l.sub_category || l.category}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function WebsiteLanding({ onBrowse, onSearch }) {
  const { t } = useLanguage()
  const [searchVal, setSearchVal] = useState('')
  const allListings = DEMO_LISTINGS.filter(l => l.images?.length > 0).slice(0, 12)

  return (
    <div className="website-landing" style={{ display: 'none', background: '#0a0a0a', minHeight: '100vh', width: '100%' }}>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: `#0a0a0a url("${HERO_BG}") center/cover no-repeat`,
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.7))' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1400, margin: '0 auto', padding: '80px 48px 120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
            {/* Left — text + search */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>🇮🇩 INDONESIA'S SUPER APP</div>
              <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.08 }}>
                Property. Rides.<br /><span style={{ color: '#8DC63F' }}>Places.</span>
              </h1>
              <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', margin: '0 0 36px', lineHeight: 1.6, maxWidth: 480 }}>
                Buy, sell, rent property. Book bike & car rides. Discover 282+ destinations. All in one platform.
              </p>

              {/* Search bar */}
              <div style={{ display: 'flex', maxWidth: 540, marginBottom: 28 }}>
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
                  placeholder="Search villas, apartments, kos, land..."
                  style={{
                    flex: 1, padding: '18px 22px', borderRadius: '16px 0 0 16px',
                    border: '2px solid rgba(141,198,63,0.3)', borderRight: 'none',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                    color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button onClick={() => onSearch?.(searchVal)} style={{
                  padding: '18px 32px', borderRadius: '0 16px 16px 0', border: 'none',
                  background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                  color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                }}>Search</button>
              </div>

              {/* Quick type pills */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Villa', 'House', 'Apartment', 'Kos', 'Land', 'Ruko'].map(type => (
                  <button key={type} onClick={() => onBrowse?.(type)} style={{
                    padding: '9px 20px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)',
                    color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.4)'; e.currentTarget.style.color = '#8DC63F' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                  >{type}</button>
                ))}
              </div>
            </div>

            {/* Right — stats card */}
            <div style={{ width: 320, flexShrink: 0 }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '28px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Stats</div>
                {STATS.map((s, i) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#8DC63F' }}>{s.val}</span>
                  </div>
                ))}
                <button onClick={() => onBrowse?.('all')} style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none', marginTop: 16,
                  background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                  color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                }}>Explore All →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY BRANDS ═══ */}
      <section style={{ padding: '48px 48px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => onBrowse?.(c.id)} style={{
              padding: '20px 8px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.color}50`; e.currentTarget.style.background = `${c.color}08` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ PRODUCT CAROUSEL — auto-scrolling ═══ */}
      <section style={{ padding: '32px 48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Featured Listings</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Auto-scrolling · Hover to pause</p>
          </div>
          <button onClick={() => onBrowse?.('all')} style={{
            padding: '10px 24px', borderRadius: 12, border: '1.5px solid rgba(141,198,63,0.3)',
            background: 'rgba(141,198,63,0.08)', color: '#8DC63F', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>View All →</button>
        </div>
        <ProductCarousel listings={allListings} onSelect={(l) => onBrowse?.(l.id)} />
      </section>

      {/* ═══ BROWSE BY CITY ═══ */}
      <section style={{ padding: '48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 24px' }}>Browse by City</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {CITIES.map(city => (
            <div key={city.name} onClick={() => onBrowse?.(city.name)} style={{
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 180,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              <img src={city.image} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{city.name}</div>
                <div style={{ fontSize: 13, color: '#8DC63F', fontWeight: 700 }}>{city.listings} listings</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section style={{ padding: '48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Everything You Need</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0 0 32px' }}>One platform for property, transport, and local discovery</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: '24px 20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.2)'; e.currentTarget.style.background = 'rgba(141,198,63,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(141,198,63,0.06), rgba(0,0,0,0.95))',
        borderTop: '1px solid rgba(141,198,63,0.08)',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 14px' }}>Ready to Explore Indonesia?</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', margin: '0 auto 32px', maxWidth: 480 }}>
          Download INDOO — property, rides, and places in one app.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => onBrowse?.('all')} style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(141,198,63,0.3)' }}>
            🌐 Browse on Web
          </button>
          <button style={{ padding: '16px 36px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            📱 Download App
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>IND<span style={{ color: '#8DC63F' }}>OO</span></div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Indonesia's Super App · Property · Rides · Places</div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>© 2026 Indoo Indonesia</div>
      </footer>

      <style>{`
        @media (min-width: 768px) { .website-landing { display: block !important; } }
        @media (max-width: 1100px) {
          .website-landing section { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </div>
  )
}
