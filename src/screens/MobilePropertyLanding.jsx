/**
 * MobilePropertyLanding — Full mobile property page for PWA.
 * Shows when phone user visits /property.
 * Ultimate design with cards, carousels, search, new projects.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DEMO_LISTINGS } from '@/services/rentalService'
import { getNewProjects, STATUS_LABELS } from '@/services/newProjectService'
import { useLanguage } from '@/i18n'

const HERO_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2002_15_43%20AM.png'
const NEW_PROJ_ICON = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2003_29_33%20AM.png?updatedAt=1777667392389'
const SALE_ICON = 'https://ik.imagekit.io/nepgaxllc/Untitledrwerwer-removebg-preview.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TYPES = [
  { id: 'Villa', icon: '🏡', label: 'Villa' },
  { id: 'House', icon: '🏠', label: 'House' },
  { id: 'Apartment', icon: '🏢', label: 'Apt' },
  { id: 'Kos', icon: '🛏️', label: 'Kos' },
  { id: 'Tanah', icon: '🌍', label: 'Land' },
  { id: 'Ruko', icon: '🏪', label: 'Ruko' },
]

const CITIES = [
  { name: 'Yogyakarta', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=150&fit=crop' },
  { name: 'Bali', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=150&fit=crop' },
  { name: 'Jakarta', img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=300&h=150&fit=crop' },
  { name: 'Surabaya', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=150&fit=crop' },
]

/* ── Auto-scroll carousel ── */
function AutoScroll({ items, renderItem, speed = 0.3 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el || items.length < 2) return
    let raf
    const tick = () => { el.scrollLeft += speed; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    el.addEventListener('touchstart', () => cancelAnimationFrame(raf), { passive: true })
    el.addEventListener('touchend', () => { raf = requestAnimationFrame(tick) }, { passive: true })
    return () => cancelAnimationFrame(raf)
  }, [items, speed])
  return (
    <div ref={ref} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '4px 0' }}>
      {[...items, ...items].map((item, i) => renderItem(item, i))}
    </div>
  )
}

/* ── Property Card ── */
function PropertyCard({ l, onClick }) {
  const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
  const ef = l.extra_fields || {}
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, width: 260, borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'left', fontFamily: 'inherit', padding: 0,
    }}>
      <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))' }} />
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 6, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 10, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
        {l.rating && <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', fontSize: 10, fontWeight: 800, color: '#FACC15' }}>⭐ {l.rating}</div>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📍 {l.city} · {l.sub_category}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(price)}{!l.buy_now && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l.price_month ? '/mo' : '/day'}</span>}</div>
        {(ef.bedrooms || ef.land_area) && <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', gap: 6 }}>{ef.bedrooms && <span>🛏️{ef.bedrooms}</span>}{ef.bathrooms && <span>🚿{ef.bathrooms}</span>}{ef.land_area && <span>📐{ef.land_area}</span>}</div>}
      </div>
    </button>
  )
}

export default function MobilePropertyLanding({ onEnterApp, onSelectListing }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState([])
  const [activeType, setActiveType] = useState(null)

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  const allProperty = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)
  const forSale = allProperty.filter(l => !!l.buy_now)
  const forRent = allProperty.filter(l => !l.buy_now)
  const filtered = activeType ? allProperty.filter(l => l.sub_category === activeType || l.extra_fields?.property_type === activeType) : null

  const handleSearch = () => { onEnterApp?.('search', search) }
  const handleType = (type) => { setActiveType(activeType === type ? null : type) }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: `#0a0a0a url("${HERO_BG}") center/cover no-repeat fixed`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Dark overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Scrollable content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ padding: '16px 16px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Property</span></div>
            <button onClick={() => onEnterApp?.('app')} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Open App</button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search villa, house, apartment..."
              style={{ flex: 1, padding: '14px 16px', borderRadius: '12px 0 0 12px', border: '1.5px solid rgba(141,198,63,0.3)', borderRight: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={handleSearch} style={{ padding: '14px 20px', borderRadius: '0 12px 12px 0', border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
          </div>

          {/* Type pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {TYPES.map(t => (
              <button key={t.id} onClick={() => handleType(t.id)} style={{
                padding: '8px 14px', borderRadius: 12, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                background: activeType === t.id ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.5)',
                border: activeType === t.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: activeType === t.id ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}><span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}</button>
            ))}
          </div>
        </div>

        {/* ═══ FILTERED RESULTS (if type selected) ═══ */}
        {filtered && (
          <div style={{ padding: '10px 16px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10 }}>{activeType} · {filtered.length} listings</div>
            <AutoScroll items={filtered} renderItem={(l, i) => <PropertyCard key={`f-${l.id}-${i}`} l={l} onClick={() => onSelectListing?.(l)} />} />
          </div>
        )}

        {/* ═══ NEW PROJECTS ═══ */}
        {projects.length > 0 && (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={NEW_PROJ_ICON} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <span style={{ color: '#FACC15' }}>New</span> Projects
            </div>
            <AutoScroll items={projects} speed={0.25} renderItem={(p, i) => (
              <div key={`np-${p.id}-${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 80 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${(STATUS_LABELS[p.status]?.color || '#FACC15')}40` }}>
                  <img src={p.images?.[0] || HERO_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{p.project_name}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: STATUS_LABELS[p.status]?.color || '#FACC15' }}>{STATUS_LABELS[p.status]?.label || 'New'}</div>
              </div>
            )} />
          </div>
        )}

        {/* ═══ FOR SALE ═══ */}
        {forSale.length > 0 && (
          <div style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={SALE_ICON} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> For Sale
              </div>
              <button onClick={() => onEnterApp?.('sale')} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
            </div>
            <AutoScroll items={forSale} renderItem={(l, i) => <PropertyCard key={`s-${l.id}-${i}`} l={l} onClick={() => onSelectListing?.(l)} />} />
          </div>
        )}

        {/* ═══ FOR RENT ═══ */}
        {forRent.length > 0 && (
          <div style={{ padding: '10px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F', display: 'flex', alignItems: 'center', gap: 8 }}>🔑 For Rent</div>
              <button onClick={() => onEnterApp?.('rent')} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
            </div>
            <AutoScroll items={forRent} renderItem={(l, i) => <PropertyCard key={`r-${l.id}-${i}`} l={l} onClick={() => onSelectListing?.(l)} />} />
          </div>
        )}

        {/* ═══ ALL PROPERTIES GRID ═══ */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10 }}>All Properties · {allProperty.length}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {allProperty.slice(0, 8).map(l => {
              const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
              return (
                <button key={l.id} onClick={() => onSelectListing?.(l)} style={{
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'left', fontFamily: 'inherit', padding: 0,
                }}>
                  <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
                    <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 8px', borderRadius: 5, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 9, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{l.city}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', marginTop: 3 }}>{fmtRp(price)}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <button onClick={() => onEnterApp?.('search')} style={{ width: '100%', padding: '14px', marginTop: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8DC63F, #6BA52A)', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>Browse All Properties →</button>
        </div>

        {/* ═══ BROWSE BY CITY ═══ */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Browse by City</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CITIES.map(c => (
              <button key={c.name} onClick={() => onEnterApp?.('search', c.name)} style={{
                borderRadius: 12, overflow: 'hidden', position: 'relative', height: 90,
                border: 'none', cursor: 'pointer', padding: 0,
              }}>
                <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 14, fontWeight: 900, color: '#fff' }}>{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ DOWNLOAD CTA ═══ */}
        <div style={{ padding: '20px 16px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Get the Full Experience</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Download INDOO for GPS search, video tours & instant booking</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', color: '#8DC63F', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>📱 Android</a>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>🍎 iOS</a>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}
