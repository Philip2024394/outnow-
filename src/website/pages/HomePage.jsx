/**
 * HomePage — INDOO Property website landing page.
 * Hero + carousels + stats + cities + features + download CTA.
 */
import { useState, useRef, useEffect } from 'react'
import { DEMO_LISTINGS } from '@/services/rentalService'
import { getNewProjects, STATUS_LABELS } from '@/services/newProjectService'
import { ScrollReveal } from '../hooks/useScrollReveal'
import StatsCounter from '../components/StatsCounter'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TYPES = [
  { id: 'House', icon: '🏠', label: 'House' }, { id: 'Villa', icon: '🏡', label: 'Villa' },
  { id: 'Apartment', icon: '🏢', label: 'Apartment' }, { id: 'Kos', icon: '🛏️', label: 'Kos' },
  { id: 'Tanah', icon: '🌍', label: 'Land' }, { id: 'Ruko', icon: '🏪', label: 'Ruko' },
  { id: 'Gudang', icon: '🏭', label: 'Warehouse' }, { id: 'Pabrik', icon: '⚙️', label: 'Factory' },
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
  { icon: '💳', title: 'KPR Calculator', desc: 'Konvensional, Syariah & Take-Over with 5+ bank comparison' },
  { icon: '📊', title: 'Price History', desc: '12-month trend charts — first in Indonesia' },
  { icon: '🏷️', title: 'Property Valuation', desc: 'A/B/C/D scoring with factor breakdown' },
  { icon: '🏘️', title: 'Comparable Sales', desc: 'Recently sold nearby with real market data' },
  { icon: '📍', title: 'Neighborhood Guide', desc: 'Transport, schools, hospitals, dining — walkability score' },
  { icon: '🎬', title: 'Video Tours', desc: 'Record and watch 1-min property tours' },
  { icon: '🏢', title: 'Agent Directory', desc: 'Verified agents with portfolios & testimonials' },
  { icon: '🔥', title: 'Deal Hunt', desc: 'Property deals with 2.5% minimum discount' },
]

function AutoCarousel({ items, renderCard }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let raf
    const tick = () => { el.scrollLeft += 0.4; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [])
  return <div ref={ref} style={{ display: 'flex', gap: 20, overflowX: 'hidden', scrollbarWidth: 'none', padding: '4px 0' }}>{[...items, ...items].map((item, i) => <div key={i} style={{ flexShrink: 0, width: 320 }}>{renderCard(item, i)}</div>)}</div>
}

function PropertyCard({ l, onClick }) {
  const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
  const ef = l.extra_fields || {}
  return (
    <div className="ws-card" onClick={onClick} style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.6))' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 11, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
        {l.rating && <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#FACC15' }}>⭐ {l.rating}</div>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>📍 {l.city} · {l.sub_category}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
        {(ef.bedrooms || ef.land_area) && <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex', gap: 8 }}>{ef.bedrooms && <span>🛏️ {ef.bedrooms}</span>}{ef.bathrooms && <span>🚿 {ef.bathrooms}</span>}{ef.land_area && <span>📐 {ef.land_area}</span>}</div>}
      </div>
    </div>
  )
}

function ProjectCircleCarousel() {
  const [projects, setProjects] = useState([])
  const ref = useRef(null)

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  useEffect(() => {
    const el = ref.current; if (!el || projects.length < 2) return
    let raf
    const tick = () => { el.scrollLeft += 0.3; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', go)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('mouseenter', stop); el.removeEventListener('mouseleave', go) }
  }, [projects])

  if (projects.length === 0) return null
  const doubled = [...projects, ...projects]
  return (
    <div ref={ref} style={{ display: 'flex', gap: 24, overflowX: 'hidden', scrollbarWidth: 'none', padding: '8px 0' }}>
      {doubled.map((p, i) => {
        const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
        return (
          <div key={`${p.id}-${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: 100 }}
            onMouseEnter={e => e.currentTarget.querySelector('.ring').style.borderColor = status.color}
            onMouseLeave={e => e.currentTarget.querySelector('.ring').style.borderColor = 'rgba(250,204,21,0.3)'}
          >
            <div className="ring" style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid rgba(250,204,21,0.3)', padding: 2,
              transition: 'border-color 0.3s, transform 0.3s',
            }}>
              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'} alt={p.project_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{p.project_name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: status.color }}>{status.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage({ onSearch, onBrowseSale, onBrowseRent, onBrowseAll, onSelectListing }) {
  const [searchVal, setSearchVal] = useState('')
  const allProperty = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)
  const forSale = allProperty.filter(l => !!l.buy_now)
  const forRent = allProperty.filter(l => !l.buy_now)

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '80px 0' }}>
        <div className="ws-container" style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
          <ScrollReveal style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.15em', marginBottom: 12 }}>INDOO PROPERTY</div>
            <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.08 }}>
              Find Your Dream<br /><span style={{ color: '#8DC63F' }}>Property</span> in Indonesia
            </h1>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', margin: '0 0 36px', maxWidth: 480, lineHeight: 1.5 }}>
              Buy, sell, rent — houses, villas, apartments, kos, land. The most feature-rich property platform in Indonesia.
            </p>
            <div style={{ display: 'flex', maxWidth: 540, marginBottom: 24 }}>
              <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch?.(searchVal)}
                placeholder="Search villas, apartments, kos, land..."
                style={{ flex: 1, padding: '18px 22px', borderRadius: '16px 0 0 16px', border: '2px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={() => onSearch?.(searchVal)} style={{ padding: '18px 32px', borderRadius: '0 16px 16px 0', border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Villa', 'House', 'Apartment', 'Kos', 'Land', 'Ruko'].map(t => (
                <button key={t} onClick={() => onSearch?.(t)} style={{ padding: '9px 20px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.4)'; e.currentTarget.style.color = '#8DC63F' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                >{t}</button>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} style={{ width: 320, flexShrink: 0 }}>
            <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <StatsCounter value={allProperty.length} label="Total Properties" />
                <StatsCounter value={forSale.length} label="For Sale" color="#FACC15" />
                <StatsCounter value={forRent.length} label="For Rent" />
                <StatsCounter value={13} label="Property Types" color="#60A5FA" />
              </div>
              <button onClick={onBrowseAll} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', marginTop: 20, background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Explore All →</button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ NEW PROJECTS — round profile carousel ═══ */}
      <section style={{ padding: '40px 0 20px' }}>
        <div className="ws-container">
          <ScrollReveal>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏗️ <span style={{ color: '#FACC15' }}>New</span> Projects
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>Pre-sale & under construction</span>
            </h2>
          </ScrollReveal>
          <ProjectCircleCarousel />
        </div>
      </section>

      {/* ═══ FOR SALE CAROUSEL ═══ */}
      {forSale.length > 0 && (
        <section style={{ padding: '40px 0' }}>
          <div className="ws-container">
            <ScrollReveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', margin: 0 }}>🏷️ For Sale</h2>
                <button onClick={onBrowseSale} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.06)', color: '#FACC15', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
              </div>
            </ScrollReveal>
            <AutoCarousel items={forSale} renderCard={(l) => <PropertyCard l={l} onClick={() => onSelectListing?.(l)} />} />
          </div>
        </section>
      )}

      {/* ═══ FOR RENT CAROUSEL ═══ */}
      {forRent.length > 0 && (
        <section style={{ padding: '40px 0' }}>
          <div className="ws-container">
            <ScrollReveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F', margin: 0 }}>🔑 For Rent</h2>
                <button onClick={onBrowseRent} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.06)', color: '#8DC63F', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
              </div>
            </ScrollReveal>
            <AutoCarousel items={forRent} renderCard={(l) => <PropertyCard l={l} onClick={() => onSelectListing?.(l)} />} />
          </div>
        </section>
      )}

      {/* ═══ BROWSE BY TYPE ═══ */}
      <section style={{ padding: '48px 0' }}>
        <div className="ws-container">
          <ScrollReveal><h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 24px' }}>Browse by Type</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {TYPES.map((t, i) => {
              const count = allProperty.filter(l => l.sub_category === t.id || l.extra_fields?.property_type === t.id).length
              return (
                <ScrollReveal key={t.id} delay={i * 0.05}>
                  <div className="ws-card" onClick={() => onSearch?.(t.id)} style={{ padding: '22px 16px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700, marginTop: 4 }}>{count} listings</div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ BROWSE BY CITY ═══ */}
      <section style={{ padding: '48px 0' }}>
        <div className="ws-container">
          <ScrollReveal><h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 24px' }}>Browse by City</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            {CITIES.map((c, i) => (
              <ScrollReveal key={c.name} delay={i * 0.06}>
                <div className="ws-card" onClick={() => onSearch?.(c.name)} style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', height: 150 }}>
                  <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700 }}>{c.count} properties</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: '48px 0' }}>
        <div className="ws-container">
          <ScrollReveal>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Property Tools</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0 0 28px' }}>Features no other Indonesian property platform has</p>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.05}>
                <div className="ws-card" style={{ padding: '24px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ APP DOWNLOAD CTA ═══ */}
      <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, rgba(141,198,63,0.08), rgba(0,0,0,0.6))', borderTop: '1px solid rgba(141,198,63,0.1)' }}>
        <div className="ws-container" style={{ textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Search Faster on the App</h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', margin: '0 auto 32px', maxWidth: 480 }}>Download INDOO for the full experience — GPS search, video tours, instant booking.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(141,198,63,0.3)' }}>📱 Download for Android</button>
              <button style={{ padding: '16px 36px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🍎 Download for iOS</button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
