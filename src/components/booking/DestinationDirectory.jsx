/**
 * DestinationDirectory — Swipe card carousel for browsing places.
 * Simple horizontal scroll snap approach — guaranteed to render.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  DIRECTORY_CATEGORIES, getDestinationsByCategory, getDestinationsNearUser,
  calculateDirectoryPrice, fmtIDR,
} from '@/services/directoryService'
import { useGeolocation } from '@/hooks/useGeolocation'
import SuggestPlaceSheet from './SuggestPlaceSheet'

const ID_FLAG = 'https://ik.imagekit.io/nepgaxllc/Untitledxxxxcc-removebg-preview.png?updatedAt=1777592820803'
const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_24_37%20PM.png'

const CAT_IMAGES = {
  temple: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=300&fit=crop',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  nightlife: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop',
  hospital: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
  nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  airport: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop',
  transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
  'food areas': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'fast food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',
  gyms: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  malls: 'https://images.unsplash.com/photo-1519567241046-7f570f0e1ec8?w=400&h=300&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  spas: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
function heroImg(cat) { return CAT_IMAGES[cat] || DEFAULT_IMG }

export default function DestinationDirectory({ open, onClose, onSelectDestination, vehicleMode }) {
  const { coords } = useGeolocation()
  const [search, setSearch] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const scrollRef = useRef(null)

  // Scroll snap to active index
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[activeIdx]
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  // Get destinations — user location sorted, fallback to all
  let destinations
  if (coords) {
    destinations = getDestinationsNearUser(coords.lat, coords.lng, 50, 'all')
    if (destinations.length === 0) destinations = getDestinationsNearUser(coords.lat, coords.lng, 9999, 'all')
  }
  if (!destinations || destinations.length === 0) destinations = getDestinationsByCategory('all')

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase()
    destinations = destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q) || d.category.includes(q)
    )
  }

  const isStandalone = vehicleMode === null || vehicleMode === undefined
  const isBike = vehicleMode !== 'car_taxi'
  const clamp = (i) => Math.max(0, Math.min(destinations.length - 1, i))

  const selectDest = (dest, vehicle) => {
    const pricing = calculateDirectoryPrice(dest)
    onSelectDestination?.({
      ...dest,
      price: vehicle === 'car_taxi' ? pricing.car : pricing.bike,
      isReturn: pricing.isReturn,
      vehiclePrice: pricing,
      _selectedVehicle: vehicle,
    })
    onClose()
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9500,
      background: `#0a0a0a url("${BG_IMG}") center/cover no-repeat`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>
            <span>INDOO</span> <span style={{ color: '#8DC63F' }}>PLACES</span>
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSuggestOpen(true)} style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.35)',
              color: '#F59E0B', fontSize: 11, fontWeight: 800,
            }}>+ Suggest</button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, background: 'rgba(0,0,0,0.85)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setActiveIdx(0) }} placeholder="Search places near you..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', outline: 'none' }} />
          {search && <button onClick={() => { setSearch(''); setActiveIdx(0) }} style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>}
          <img src={ID_FLAG} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }} />
        </div>
        {search && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#8DC63F', textAlign: 'center' }}>{destinations.length} results</div>}
      </div>

      {/* ── Stacked Cards ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'visible', margin: '0 22px' }}
        onTouchStart={e => { scrollRef.current = { x: e.touches[0].clientX, t: Date.now() } }}
        onTouchEnd={e => {
          if (!scrollRef.current) return
          const dx = e.changedTouches[0].clientX - scrollRef.current.x
          const dt = Date.now() - scrollRef.current.t
          const v = Math.abs(dx) / (dt || 1)
          if (dx < -40 || (dx < -15 && v > 0.3)) setActiveIdx(prev => clamp(prev + 1))
          else if (dx > 40 || (dx > 15 && v > 0.3)) setActiveIdx(prev => clamp(prev - 1))
          scrollRef.current = null
        }}
        onMouseDown={e => { scrollRef.current = { x: e.clientX, t: Date.now() } }}
        onMouseUp={e => {
          if (!scrollRef.current) return
          const dx = e.clientX - scrollRef.current.x
          if (dx < -40) setActiveIdx(prev => clamp(prev + 1))
          else if (dx > 40) setActiveIdx(prev => clamp(prev - 1))
          scrollRef.current = null
        }}
      >
        {destinations.length === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>🔍</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>No places found</span>
          </div>
        )}

        {destinations.map((dest, idx) => {
          const diff = idx - activeIdx
          const absDiff = Math.abs(diff)
          if (absDiff > 1) return null // only show prev, current, next

          const pricing = calculateDirectoryPrice(dest)
          const price = isBike ? pricing.bike : pricing.car

          // Center card full, prev card peeking left, next card peeking right
          const isActive = diff === 0
          // Side cards: shifted 70% to the side, scaled down, dimmed
          const sideShift = diff < 0 ? '-58%' : '58%'

          return (
            <div key={dest.id} style={{
              position: 'absolute',
              top: isActive ? '7%' : '12%',
              bottom: isActive ? '7%' : '12%',
              left: isActive ? '1%' : '1%',
              right: isActive ? '1%' : '1%',
              transform: isActive ? 'translateX(0) scale(1)' : `translateX(${sideShift}) scale(0.7)`,
              opacity: isActive ? 1 : 0.9,
              zIndex: isActive ? 3 : 1,
              filter: isActive ? 'none' : 'brightness(0.65)',
              borderRadius: 20, overflow: 'hidden',
              border: isActive ? '2px solid rgba(141,198,63,0.5)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isActive ? '0 0 30px rgba(141,198,63,0.15), 0 8px 40px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
              pointerEvents: isActive ? 'auto' : 'none',
            }}>
              {/* Full background image */}
              <img src={heroImg(dest.category)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 15%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.93))' }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

                {/* Instagram — top right */}
                <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(dest.name.replace(/\s+/g, '').toLowerCase())}/`}
                  target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, textDecoration: 'none', background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(225,48,108,0.4)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>

                {/* Distance — top left */}
                {dest.distanceKm && (
                  <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>
                    {dest.distanceKm} km
                  </div>
                )}

                {/* Name + address */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)', lineHeight: 1.2, marginBottom: 4 }}>{dest.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{dest.address}</div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#FACC15', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{fmtIDR(price)}</span>
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.12)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>One way</span>
                </div>

                {/* Bike + Car buttons */}
                {isStandalone ? (
                  <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => selectDest(dest, 'bike_ride')} style={{
                      flex: 1, padding: '8px 10px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                      color: '#000', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(141,198,63,0.3)', overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, fontWeight: 900 }}>Bike</span>
                        <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtIDR(pricing.bike)}</span>
                      </div>
                      <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    </button>
                    <button onClick={() => selectDest(dest, 'car_taxi')} style={{
                      flex: 1, padding: '8px 10px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                      color: '#000', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(141,198,63,0.3)', overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, fontWeight: 900 }}>Car</span>
                        <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtIDR(pricing.car)}</span>
                      </div>
                      <img src="https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566" alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                    Book now · arrival ~{Math.max(5, Math.round((dest.distanceKm || 5) * 2.5))} Min
                  </div>
                  </>
                ) : (
                  <button onClick={() => selectDest(dest, vehicleMode)} style={{
                    width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                    color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                  }}>{isBike ? '🏍️' : '🚗'} Book Ride — {fmtIDR(price)}</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Bottom nav ── */}
      {destinations.length > 0 && (
        <div style={{ flexShrink: 0, padding: '6px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button onClick={() => setActiveIdx(prev => clamp(prev - 1))} disabled={activeIdx === 0} style={{
            width: 44, height: 44, borderRadius: 22, cursor: 'pointer',
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.12)',
            color: activeIdx === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            {activeIdx + 1} / {destinations.length}
          </span>

          <button onClick={() => setActiveIdx(prev => clamp(prev + 1))} disabled={activeIdx >= destinations.length - 1} style={{
            width: 44, height: 44, borderRadius: 22, cursor: 'pointer',
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.12)',
            color: activeIdx >= destinations.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      <SuggestPlaceSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>,
    document.body
  )
}
