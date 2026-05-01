/**
 * WebsitePropertyModule — Desktop property website.
 * WRAPS existing app components in desktop layout — zero code duplication.
 * Renders: search grid, property detail, new projects, agents, KPR calculator.
 */
import { useState, useEffect } from 'react'
import { DEMO_LISTINGS } from '@/services/rentalService'
import { getNewProjects, fmtRp as fmtRpProject, STATUS_LABELS } from '@/services/newProjectService'
import { useLanguage } from '@/i18n'
import KPRCalculator from '@/components/property/KPRCalculator'
import DesktopNav from './DesktopNav'

const HERO_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TYPES = [
  { id: 'all', icon: '🏘️', label: 'All' },
  { id: 'House', icon: '🏠', label: 'House' },
  { id: 'Villa', icon: '🏡', label: 'Villa' },
  { id: 'Apartment', icon: '🏢', label: 'Apartment' },
  { id: 'Kos', icon: '🛏️', label: 'Kos' },
  { id: 'Tanah', icon: '🌍', label: 'Land' },
  { id: 'Ruko', icon: '🏪', label: 'Ruko' },
  { id: 'Gudang', icon: '🏭', label: 'Warehouse' },
  { id: 'Pabrik', icon: '⚙️', label: 'Factory' },
]

const CITIES = [
  { name: 'Yogyakarta', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=200&fit=crop' },
  { name: 'Bali', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop' },
  { name: 'Jakarta', img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=200&fit=crop' },
  { name: 'Surabaya', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop' },
  { name: 'Bandung', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop' },
  { name: 'Semarang', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop' },
]

const DEMO_AGENTS = [
  { id: 'a1', name: 'Ahmad Pratama', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', company: 'Ray White Yogyakarta', city: 'Yogyakarta', rating: 4.8, reviews: 34, sold: 45, specializations: ['Villa', 'House'] },
  { id: 'a2', name: 'Dewi Anggraini', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', company: 'Brighton Real Estate', city: 'Bali', rating: 4.9, reviews: 56, sold: 78, specializations: ['Villa', 'Resort'] },
  { id: 'a3', name: 'Hendra Wijaya', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', company: 'ERA Indonesia', city: 'Yogyakarta', rating: 4.6, reviews: 21, sold: 22, specializations: ['Kos', 'Apartment'] },
  { id: 'a4', name: 'Made Surya', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', company: 'Century 21 Bali', city: 'Bali', rating: 4.7, reviews: 42, sold: 63, specializations: ['Villa', 'Land'] },
]

/* ── Listing Card ── */
function PropertyCard({ l, onClick }) {
  const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
  const ef = l.extra_fields || {}
  return (
    <div onClick={onClick} style={{
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.6))' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 12px', borderRadius: 8, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 11, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
        {l.sub_category && <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: '#fff' }}>{l.sub_category}</div>}
        {l.rating && <div style={{ position: 'absolute', bottom: 10, right: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#FACC15' }}>⭐ {l.rating}</div>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>📍 {l.city}{l.address ? ` · ${l.address}` : ''}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{!l.buy_now ? (l.price_month ? '/mo' : '/day') : ''}</span></span>
        </div>
        {(ef.bedrooms || ef.land_area) && (
          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            {ef.bedrooms && <span>🛏️ {ef.bedrooms} Bed</span>}
            {ef.bathrooms && <span>🚿 {ef.bathrooms} Bath</span>}
            {ef.land_area && <span>📐 {ef.land_area}</span>}
            {ef.certificate && <span>📜 {ef.certificate}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Auto-scroll Carousel ── */
function AutoCarousel({ items, renderCard }) {
  const ref = useState(null)[1]
  const scrollRef = { current: null }
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf, speed = 0.4
    const tick = () => { el.scrollLeft += speed; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    el.addEventListener('mouseenter', () => cancelAnimationFrame(raf))
    el.addEventListener('mouseleave', () => { raf = requestAnimationFrame(tick) })
    return () => cancelAnimationFrame(raf)
  }, [])
  const doubled = [...items, ...items]
  return (
    <div ref={el => { scrollRef.current = el; ref(el) }} style={{ display: 'flex', gap: 20, overflowX: 'hidden', scrollbarWidth: 'none', padding: '4px 0' }}>
      {doubled.map((item, i) => <div key={i} style={{ flexShrink: 0, width: 320 }}>{renderCard(item, i)}</div>)}
    </div>
  )
}

/* ── Property Detail Panel (desktop 2-column) ── */
function DesktopPropertyDetail({ listing, onClose }) {
  const [showKPR, setShowKPR] = useState(false)
  if (!listing) return null
  const ef = listing.extra_fields || {}
  const price = listing.buy_now ? (typeof listing.buy_now === 'object' ? listing.buy_now.price : listing.buy_now) : listing.price_month || listing.price_day
  const images = listing.images?.length ? listing.images : [listing.image || '']

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 24px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 1100, background: '#0a0a0a', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', minHeight: 500 }}>
        {/* Left — Images */}
        <div style={{ width: '50%', position: 'relative' }}>
          <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 500 }} />
          <div style={{ position: 'absolute', top: 16, left: 16, padding: '6px 14px', borderRadius: 10, background: listing.buy_now ? '#FACC15' : '#8DC63F', fontSize: 13, fontWeight: 900, color: '#000' }}>{listing.buy_now ? 'FOR SALE' : 'FOR RENT'}</div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8 }}>
              {images.slice(0, 4).map((img, i) => (
                <div key={i} style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div style={{ width: '50%', padding: '28px 32px', overflowY: 'auto', maxHeight: '80vh' }}>
          <button onClick={onClose} style={{ float: 'right', width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          <div style={{ fontSize: 13, color: '#8DC63F', fontWeight: 700, marginBottom: 6 }}>{listing.sub_category || listing.category} · {listing.city}</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{listing.title}</h2>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>📍 {listing.address || listing.city}</div>

          {/* Price */}
          <div style={{ fontSize: 32, fontWeight: 900, color: '#FACC15', marginBottom: 20 }}>
            {fmtRp(price)}
            {!listing.buy_now && <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>{listing.price_month ? ' /month' : ' /day'}</span>}
          </div>

          {/* Specs */}
          {(ef.bedrooms || ef.land_area) && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {ef.bedrooms && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{ef.bedrooms}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Beds</div></div>}
              {ef.bathrooms && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{ef.bathrooms}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Bath</div></div>}
              {ef.land_area && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{ef.land_area}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Land</div></div>}
              {ef.building_area && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{ef.building_area}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Building</div></div>}
              {ef.certificate && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{ef.certificate}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Cert</div></div>}
            </div>
          )}

          {/* Description */}
          {listing.description && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>{listing.description}</div>}

          {/* Features */}
          {listing.features?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>Features</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {listing.features.map(f => <span key={f} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{f}</span>)}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>💬 WhatsApp</button>
            {listing.buy_now && (
              <button onClick={() => setShowKPR(true)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FACC15, #F59E0B)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>🏦 KPR Calculator</button>
            )}
          </div>

          {/* Owner info */}
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(141,198,63,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{listing.owner_type === 'agent' ? '🏢' : '👤'}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{listing.owner_type === 'agent' ? 'Property Agent' : 'Property Owner'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>View Profile →</div>
            </div>
          </div>
        </div>
      </div>

      {showKPR && <KPRCalculator open onClose={() => setShowKPR(false)} propertyPrice={price ? Number(String(price).replace(/\./g, '')) : 500000000} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN MODULE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function WebsitePropertyModule() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [mode, setMode] = useState('all') // all | sale | rent
  const [selectedListing, setSelectedListing] = useState(null)
  const [projects, setProjects] = useState([])
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  const allProperty = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)
  let filtered = allProperty
  if (activeType !== 'all') filtered = filtered.filter(l => l.sub_category === activeType || l.extra_fields?.property_type === activeType)
  if (mode === 'sale') filtered = filtered.filter(l => !!l.buy_now)
  if (mode === 'rent') filtered = filtered.filter(l => !l.buy_now)
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(l => l.title.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.sub_category?.toLowerCase().includes(q))
  }
  const forSale = allProperty.filter(l => !!l.buy_now)
  const forRent = allProperty.filter(l => !l.buy_now)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', width: '100%', color: '#fff', fontFamily: 'inherit', overflow: 'hidden' }}>
      <DesktopNav activeSection={activeSection} onNavigate={setActiveSection} />

      {/* ═══ HERO ═══ */}
      <section style={{ position: 'relative', width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', background: `url("${HERO_BG}") center/cover no-repeat`, marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75))' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1400, margin: '0 auto', padding: '80px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', letterSpacing: '0.15em', marginBottom: 12 }}>INDOO PROPERTY</div>
              <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.08 }}>
                Property <span style={{ color: '#FACC15' }}>Sales</span> &<br /><span style={{ color: '#8DC63F' }}>Rentals</span> in Indonesia
              </h1>
              <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', margin: '0 0 36px', maxWidth: 500, lineHeight: 1.5 }}>
                Houses, villas, apartments, kos, land — buy, sell, or rent on Indonesia's most complete property platform.
              </p>

              {/* Search */}
              <div style={{ display: 'flex', maxWidth: 560, marginBottom: 24 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, city, type..."
                  style={{ flex: 1, padding: '18px 22px', borderRadius: '16px 0 0 16px', border: '2px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none' }} />
                <button style={{ padding: '18px 32px', borderRadius: '0 16px 16px 0', border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
              </div>

              {/* Mode pills */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ id: 'all', label: 'All Properties' }, { id: 'sale', label: '🏷️ For Sale' }, { id: 'rent', label: '🔑 For Rent' }].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    padding: '10px 22px', borderRadius: 24, cursor: 'pointer', fontFamily: 'inherit',
                    background: mode === m.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                    border: mode === m.id ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.1)',
                    color: mode === m.id ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700,
                  }}>{m.label}</button>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div style={{ width: 300, flexShrink: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '28px 24px' }}>
              {[
                { val: allProperty.length, label: 'Total Properties', color: '#fff' },
                { val: forSale.length, label: 'For Sale', color: '#FACC15' },
                { val: forRent.length, label: 'For Rent', color: '#8DC63F' },
                { val: '13', label: 'Property Types', color: '#60A5FA' },
                { val: projects.length, label: 'New Projects', color: '#F97316' },
              ].map((s, i) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TYPE FILTER ═══ */}
      <section style={{ padding: '40px 48px 20px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)} style={{
              padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              background: activeType === t.id ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.03)',
              border: activeType === t.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: activeType === t.id ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}><span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}</button>
          ))}
        </div>
      </section>

      {/* ═══ FOR SALE CAROUSEL ═══ */}
      {forSale.length > 0 && mode !== 'rent' && (
        <section style={{ padding: '24px 48px', maxWidth: 1400, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FACC15', margin: '0 0 16px' }}>🏷️ For Sale — {forSale.length} Properties</h2>
          <AutoCarousel items={forSale} renderCard={(l) => <PropertyCard l={l} onClick={() => setSelectedListing(l)} />} />
        </section>
      )}

      {/* ═══ FOR RENT CAROUSEL ═══ */}
      {forRent.length > 0 && mode !== 'sale' && (
        <section style={{ padding: '24px 48px', maxWidth: 1400, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', margin: '0 0 16px' }}>🔑 For Rent — {forRent.length} Properties</h2>
          <AutoCarousel items={forRent} renderCard={(l) => <PropertyCard l={l} onClick={() => setSelectedListing(l)} />} />
        </section>
      )}

      {/* ═══ ALL PROPERTIES GRID ═══ */}
      <section style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>
          {activeType === 'all' ? 'All Properties' : TYPES.find(t => t.id === activeType)?.label} <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>({filtered.length})</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map(l => <PropertyCard key={l.id} l={l} onClick={() => setSelectedListing(l)} />)}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No properties found</div>}
      </section>

      {/* ═══ AGENTS ═══ */}
      <section style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>🏢 Property Agents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {DEMO_AGENTS.map(a => (
            <div key={a.id} style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(141,198,63,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <img src={a.photo} alt="" style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(141,198,63,0.3)' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{a.company}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                <span>📍 {a.city}</span>
                <span>⭐ {a.rating}</span>
                <span>{a.sold} sold</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {a.specializations.map(s => <span key={s} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(250,204,21,0.08)', fontSize: 10, fontWeight: 700, color: '#FACC15' }}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CITIES ═══ */}
      <section style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 20px' }}>Browse by City</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {CITIES.map(c => (
            <div key={c.name} onClick={() => setSearch(c.name)} style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 140, transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: 16, fontWeight: 900, color: '#fff' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Property</span></div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Agents</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>© 2026 Indoo Indonesia</div>
      </footer>

      {/* ═══ DETAIL OVERLAY ═══ */}
      {selectedListing && <DesktopPropertyDetail listing={selectedListing} onClose={() => setSelectedListing(null)} />}
    </div>
  )
}
