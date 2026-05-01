/**
 * PropertyLanding — Dedicated desktop landing page for property sales & rentals.
 * SEO-optimized with real listing content, auto-scrolling carousels, grids.
 * URL: /property
 */
import { useState, useEffect, useRef } from 'react'
import { DEMO_LISTINGS } from '@/services/rentalService'

const HERO_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const PROPERTY_TYPES = [
  { id: 'House', icon: '🏠', label: 'House', desc: 'Rumah tinggal' },
  { id: 'Villa', icon: '🏡', label: 'Villa', desc: 'Luxury living' },
  { id: 'Apartment', icon: '🏢', label: 'Apartment', desc: 'Studio to penthouse' },
  { id: 'Kos', icon: '🛏️', label: 'Kos', desc: 'Boarding rooms' },
  { id: 'Tanah', icon: '🌍', label: 'Land', desc: 'Tanah kavling' },
  { id: 'Ruko', icon: '🏪', label: 'Ruko', desc: 'Shophouse' },
  { id: 'Gudang', icon: '🏭', label: 'Warehouse', desc: 'Gudang & storage' },
  { id: 'Pabrik', icon: '⚙️', label: 'Factory', desc: 'Industrial' },
]

const CITIES = [
  { name: 'Yogyakarta', count: 86, img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=200&fit=crop' },
  { name: 'Bali', count: 54, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop' },
  { name: 'Jakarta', count: 38, img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=200&fit=crop' },
  { name: 'Surabaya', count: 22, img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop' },
  { name: 'Bandung', count: 18, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop' },
  { name: 'Semarang', count: 14, img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop' },
]

const FEATURES = [
  { icon: '💳', title: 'KPR Calculator', desc: 'Konvensional, Syariah, Take-Over — compare 5+ banks instantly' },
  { icon: '📊', title: 'Price History', desc: '12-month price trend charts — first in Indonesia' },
  { icon: '🏷️', title: 'Property Valuation', desc: 'Estimated value with A/B/C/D scoring' },
  { icon: '🏘️', title: 'Comparable Sales', desc: 'Recently sold nearby — see real market data' },
  { icon: '📍', title: 'Neighborhood Guide', desc: 'Transport, schools, hospitals, dining nearby' },
  { icon: '🎬', title: 'Video Tours', desc: 'Record and watch 1-minute property tours' },
]

/* ── Auto-scroll carousel ── */
function Carousel({ items, renderCard }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf, speed = 0.5
    const tick = () => { el.scrollLeft += speed; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop)
    el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [])
  const doubled = [...items, ...items]
  return (
    <div ref={ref} style={{ display: 'flex', gap: 20, overflowX: 'hidden', scrollbarWidth: 'none', padding: '4px 0' }}>
      {doubled.map((item, i) => renderCard(item, i))}
    </div>
  )
}

/* ── Listing card ── */
function ListingCard({ l, onClick }) {
  const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
  const ef = l.extra_fields || {}
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: 300, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: l.buy_now ? 'rgba(250,204,21,0.9)' : 'rgba(141,198,63,0.9)', fontSize: 11, fontWeight: 800, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
        {l.sub_category && <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: 700, color: '#fff' }}>{l.sub_category}</div>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>📍 {l.city} · {l.sub_category || l.category}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{!l.buy_now ? (l.price_month ? '/mo' : '/day') : ''}</span></div>
        </div>
        {(ef.bedrooms || ef.land_area) && (
          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex', gap: 8 }}>
            {ef.bedrooms && <span>🛏️ {ef.bedrooms}BR</span>}
            {ef.bathrooms && <span>🚿 {ef.bathrooms}BA</span>}
            {ef.land_area && <span>📐 {ef.land_area}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PropertyLanding({ onBrowse, onSearch, onViewListing }) {
  const [searchVal, setSearchVal] = useState('')
  const [activeType, setActiveType] = useState('all')

  const allProperty = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)
  const forSale = allProperty.filter(l => !!l.buy_now)
  const forRent = allProperty.filter(l => !l.buy_now)
  const filtered = activeType === 'all' ? allProperty : allProperty.filter(l => l.sub_category === activeType || l.extra_fields?.property_type === activeType)

  return (
    <div className="property-landing" style={{ display: 'none', background: '#0a0a0a', minHeight: '100vh' }}>

      {/* ═══ HERO ═══ */}
      <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center', background: `#0a0a0a url("${HERO_BG}") center/cover no-repeat` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75))' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1400, margin: '0 auto', padding: '80px 48px 60px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>INDOO PROPERTY</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: '0 0 16px', lineHeight: 1.08 }}>
            Property <span style={{ color: '#FACC15' }}>Sales</span> & <span style={{ color: '#8DC63F' }}>Rentals</span>
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', maxWidth: 560, lineHeight: 1.5 }}>
            Houses, villas, apartments, kos, land, ruko — buy, sell, or rent with Indonesia's most feature-rich property platform.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', maxWidth: 640, marginBottom: 28 }}>
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
              placeholder="Search by property name, city, type..."
              style={{ flex: 1, padding: '18px 22px', borderRadius: '16px 0 0 16px', border: '2px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={() => onSearch?.(searchVal)} style={{ padding: '18px 32px', borderRadius: '0 16px 16px 0', border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { val: allProperty.length, label: 'Properties' },
              { val: forSale.length, label: 'For Sale' },
              { val: forRent.length, label: 'For Rent' },
              { val: '13', label: 'Types' },
            ].map(s => (
              <div key={s.label}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F' }}>{s.val}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROPERTY TYPES ═══ */}
      <section style={{ padding: '48px 48px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Browse by Type</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
          {PROPERTY_TYPES.map(t => (
            <button key={t.id} onClick={() => { setActiveType(t.id === activeType ? 'all' : t.id); onBrowse?.(t.id) }} style={{
              padding: '18px 8px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
              background: activeType === t.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.02)',
              border: activeType === t.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (activeType !== t.id) { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.2)'; e.currentTarget.style.background = 'rgba(141,198,63,0.04)' } }}
            onMouseLeave={e => { if (activeType !== t.id) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
            >
              <div style={{ fontSize: 26, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: activeType === t.id ? '#8DC63F' : '#fff' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ FOR SALE CAROUSEL ═══ */}
      {forSale.length > 0 && (
        <section style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FACC15', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>🏷️ For Sale</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{forSale.length} properties · Auto-scrolling</p>
            </div>
            <button onClick={() => onBrowse?.('sale')} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.06)', color: '#FACC15', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
          </div>
          <Carousel items={forSale} renderCard={(l, i) => <ListingCard key={`sale-${l.id}-${i}`} l={l} onClick={() => onViewListing?.(l)} />} />
        </section>
      )}

      {/* ═══ FOR RENT CAROUSEL ═══ */}
      {forRent.length > 0 && (
        <section style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>🔑 For Rent</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{forRent.length} properties · Auto-scrolling</p>
            </div>
            <button onClick={() => onBrowse?.('rent')} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.06)', color: '#8DC63F', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
          </div>
          <Carousel items={forRent} renderCard={(l, i) => <ListingCard key={`rent-${l.id}-${i}`} l={l} onClick={() => onViewListing?.(l)} />} />
        </section>
      )}

      {/* ═══ ALL PROPERTIES GRID ═══ */}
      <section style={{ padding: '48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>
              {activeType === 'all' ? 'All Properties' : PROPERTY_TYPES.find(t => t.id === activeType)?.label || activeType}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{filtered.length} listings</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map(l => {
            const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
            const ef = l.extra_fields || {}
            return (
              <div key={l.id} onClick={() => onViewListing?.(l)} style={{
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, background: l.buy_now ? 'rgba(250,204,21,0.9)' : 'rgba(141,198,63,0.9)', fontSize: 11, fontWeight: 800, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>📍 {l.city} · {l.sub_category}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
                  {(ef.bedrooms || ef.land_area) && <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.2)', display: 'flex', gap: 6 }}>{ef.bedrooms && <span>🛏️ {ef.bedrooms}</span>}{ef.bathrooms && <span>🚿 {ef.bathrooms}</span>}{ef.land_area && <span>📐 {ef.land_area}</span>}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══ BROWSE BY CITY ═══ */}
      <section style={{ padding: '48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Property by City</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {CITIES.map(c => (
            <div key={c.name} onClick={() => onBrowse?.(c.name)} style={{
              borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 140,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#8DC63F', fontWeight: 700 }}>{c.count} properties</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: '48px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Property Tools</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: '0 0 24px' }}>Features no other Indonesian property platform has</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: '22px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.2)'; e.currentTarget.style.background = 'rgba(141,198,63,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: '64px 48px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(141,198,63,0.06), rgba(0,0,0,0.95))', borderTop: '1px solid rgba(141,198,63,0.08)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Find Your Property Today</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '0 auto 28px', maxWidth: 450 }}>Browse property sales and rentals on Indonesia's most complete platform.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button onClick={() => onBrowse?.('all')} style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>Browse All Properties</button>
          <button style={{ padding: '14px 32px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>📱 Download App</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Property</span></div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Agents</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>New Projects</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>© 2026 Indoo Indonesia</div>
      </footer>

      <style>{`
        @media (min-width: 768px) { .property-landing { display: block !important; } }
        @media (max-width: 1100px) { .property-landing section { padding-left: 24px !important; padding-right: 24px !important; } }
      `}</style>
    </div>
  )
}
