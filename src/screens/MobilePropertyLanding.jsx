/**
 * MobilePropertyLanding — Full mobile property page for PWA.
 * Optimized for phone screens. No portal — renders inline.
 */
import { useState, useRef, useEffect } from 'react'
import { DEMO_LISTINGS } from '@/services/rentalService'
import { getNewProjects, STATUS_LABELS } from '@/services/newProjectService'

const BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2002_15_43%20AM.png'
const NEW_ICON = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2003_29_33%20AM.png?updatedAt=1777667392389'
const SALE_ICON = 'https://ik.imagekit.io/nepgaxllc/Untitledrwerwer-removebg-preview.png'

function fmtRp(n) {
  if (!n) return '—'
  const v = Number(String(n).replace(/\./g, ''))
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)}jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}

const TYPES = [
  { id: 'Villa', icon: '🏡' }, { id: 'House', icon: '🏠' }, { id: 'Apartment', icon: '🏢' },
  { id: 'Kos', icon: '🛏️' }, { id: 'Tanah', icon: '🌍' }, { id: 'Ruko', icon: '🏪' },
]

const CITIES = [
  { name: 'Yogyakarta', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&h=150&fit=crop' },
  { name: 'Bali', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=150&fit=crop' },
  { name: 'Jakarta', img: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=300&h=150&fit=crop' },
  { name: 'Surabaya', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=150&fit=crop' },
]

function HScroll({ children, speed = 0.3 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let raf
    const tick = () => { el.scrollLeft += speed; if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0; raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    const stop = () => cancelAnimationFrame(raf)
    const go = () => { raf = requestAnimationFrame(tick) }
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('touchend', go, { passive: true })
    return () => { cancelAnimationFrame(raf); el.removeEventListener('touchstart', stop); el.removeEventListener('touchend', go) }
  }, [speed])
  return <div ref={ref} style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>{children}</div>
}

function Card({ l, onClick }) {
  const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
  const ef = l.extra_fields || {}
  return (
    <button onClick={onClick} style={{ flexShrink: 0, width: 'calc(70vw)', maxWidth: 260, borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', fontFamily: 'inherit', padding: 0, cursor: 'pointer' }}>
      <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
        <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 8px', borderRadius: 5, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 9, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>📍 {l.city}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FACC15', marginTop: 3 }}>{fmtRp(price)}</div>
        {ef.bedrooms && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{ef.bedrooms}BR · {ef.bathrooms || 1}BA{ef.land_area ? ` · ${ef.land_area}` : ''}</div>}
      </div>
    </button>
  )
}

export default function MobilePropertyLanding({ onEnterApp, onSelectListing }) {
  const [search, setSearch] = useState('')
  const [projects, setProjects] = useState([])
  const [filterType, setFilterType] = useState(null)

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  const all = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)
  const forSale = all.filter(l => !!l.buy_now)
  const forRent = all.filter(l => !l.buy_now)
  const filtered = filterType ? all.filter(l => l.sub_category === filterType || l.extra_fields?.property_type === filterType) : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* BG image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url("${BG}")`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />

      {/* Scroll */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>IND<span style={{ color: '#8DC63F' }}>OO</span> <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Property</span></div>
          <button onClick={() => onEnterApp?.('app')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#8DC63F', color: '#000', fontSize: 11, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Open App</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 14px 10px', display: 'flex' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && onEnterApp?.('search', search)}
            placeholder="Search villa, house, kos..."
            style={{ flex: 1, padding: '12px 14px', borderRadius: '10px 0 0 10px', border: '1.5px solid rgba(141,198,63,0.25)', borderRight: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={() => onEnterApp?.('search', search)} style={{ padding: '12px 16px', borderRadius: '0 10px 10px 0', border: 'none', background: '#8DC63F', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Go</button>
        </div>

        {/* Type pills */}
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setFilterType(filterType === t.id ? null : t.id)} style={{
              padding: '6px 12px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: filterType === t.id ? 'rgba(141,198,63,0.15)' : 'rgba(0,0,0,0.5)',
              border: filterType === t.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: filterType === t.id ? '#8DC63F' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
            }}>{t.icon} {t.id}</button>
          ))}
        </div>

        {/* Filtered */}
        {filtered && (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{filterType} · {filtered.length}</div>
            <HScroll>{[...filtered, ...filtered].map((l, i) => <Card key={`f${i}`} l={l} onClick={() => onSelectListing?.(l)} />)}</HScroll>
          </div>
        )}

        {/* New Projects */}
        {projects.length > 0 && (
          <div style={{ padding: '6px 14px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={NEW_ICON} alt="" style={{ width: 24, height: 24 }} /> <span style={{ color: '#FACC15' }}>New</span> Projects
            </div>
            <HScroll speed={0.25}>
              {[...projects, ...projects].map((p, i) => (
                <div key={`np${i}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70 }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${(STATUS_LABELS[p.status]?.color || '#FACC15')}40` }}>
                    <img src={p.images?.[0] || BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', textAlign: 'center', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>{p.project_name}</div>
                  <div style={{ fontSize: 8, color: STATUS_LABELS[p.status]?.color || '#FACC15' }}>{STATUS_LABELS[p.status]?.label}</div>
                </div>
              ))}
            </HScroll>
          </div>
        )}

        {/* For Sale */}
        {forSale.length > 0 && (
          <div style={{ padding: '6px 14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#FACC15', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src={SALE_ICON} alt="" style={{ width: 20, height: 20 }} /> For Sale
              </div>
              <button onClick={() => onEnterApp?.('sale')} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>All →</button>
            </div>
            <HScroll>{[...forSale, ...forSale].map((l, i) => <Card key={`s${i}`} l={l} onClick={() => onSelectListing?.(l)} />)}</HScroll>
          </div>
        )}

        {/* For Rent */}
        {forRent.length > 0 && (
          <div style={{ padding: '6px 14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>🔑 For Rent</div>
              <button onClick={() => onEnterApp?.('rent')} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>All →</button>
            </div>
            <HScroll>{[...forRent, ...forRent].map((l, i) => <Card key={`r${i}`} l={l} onClick={() => onSelectListing?.(l)} />)}</HScroll>
          </div>
        )}

        {/* Grid */}
        <div style={{ padding: '6px 14px 12px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 8 }}>All Properties</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {all.slice(0, 6).map(l => {
              const price = l.buy_now ? (typeof l.buy_now === 'object' ? l.buy_now.price : l.buy_now) : l.price_month || l.price_day
              return (
                <button key={l.id} onClick={() => onSelectListing?.(l)} style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', fontFamily: 'inherit', padding: 0, cursor: 'pointer' }}>
                  <div style={{ height: 90, overflow: 'hidden', position: 'relative' }}>
                    <img src={l.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <div style={{ position: 'absolute', top: 4, left: 4, padding: '2px 6px', borderRadius: 4, background: l.buy_now ? '#FACC15' : '#8DC63F', fontSize: 8, fontWeight: 900, color: '#000' }}>{l.buy_now ? 'SALE' : 'RENT'}</div>
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{l.city}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#FACC15', marginTop: 2 }}>{fmtRp(price)}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <button onClick={() => onEnterApp?.('search')} style={{ width: '100%', padding: '12px', marginTop: 10, borderRadius: 12, border: 'none', background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Browse All →</button>
        </div>

        {/* Cities */}
        <div style={{ padding: '6px 14px 12px' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 8 }}>By City</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CITIES.map(c => (
              <button key={c.name} onClick={() => onEnterApp?.('search', c.name)} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', height: 70, border: 'none', cursor: 'pointer', padding: 0 }}>
                <img src={c.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 13, fontWeight: 900, color: '#fff' }}>{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Download */}
        <div style={{ padding: '14px 14px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Get INDOO App</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>GPS search, video tours, instant booking</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', color: '#8DC63F', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>Android</a>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>iOS</a>
          </div>
        </div>

      </div>
    </div>
  )
}
