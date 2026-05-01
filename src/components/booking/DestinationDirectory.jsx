/**
 * DestinationDirectory — Horizontal swipe card carousel for browsing destinations.
 * Swipe left/right to browse. Center card is highlighted with full detail.
 * Google Maps + Instagram links on each card.
 */
import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  DIRECTORY_CATEGORIES, getDestinationsByCategory,
  calculateDirectoryPrice, fmtIDR,
} from '@/services/directoryService'
import SuggestPlaceSheet from './SuggestPlaceSheet'

/* ── Category → Hero image ── */
const CAT_IMAGES = {
  temple:       'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=250&fit=crop',
  beach:        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop',
  restaurant:   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
  shopping:     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop',
  nightlife:    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=250&fit=crop',
  hospital:     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=250&fit=crop',
  university:   'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=250&fit=crop',
  nature:       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop',
  airport:      'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop',
  'art & culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop',
  transport:    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
  government:   'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=250&fit=crop',
  'food areas': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop',
  'fast food':  'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=250&fit=crop',
  gyms:         'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
  salons:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop',
  spas:         'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop',
  karaoke:      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=250&fit=crop',
  malls:        'https://images.unsplash.com/photo-1519567241046-7f570f0e1ec8?w=400&h=250&fit=crop',
  markets:      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop',
  waterparks:   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
  'bus stations':'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=250&fit=crop',
  'train stations':'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=250&fit=crop',
  pizza:        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop',
  'chinese food':'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=250&fit=crop',
  'sushi & japanese':'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop',
  billiards:    'https://images.unsplash.com/photo-1570283626914-5d5a1b474932?w=400&h=250&fit=crop',
  'western food':'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=250&fit=crop',
  'money exchange':'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=250&fit=crop',
  dentist:      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=250&fit=crop',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop'
function getHeroImg(cat) { return CAT_IMAGES[cat] || DEFAULT_IMG }

/* ── Stable session shuffle ── */
let _shuffled = null
function getShuffled() {
  if (!_shuffled) {
    const arr = [...getDestinationsByCategory('all')]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    _shuffled = arr
  }
  return _shuffled
}

export default function DestinationDirectory({ open, onClose, onSelectDestination, vehicleMode }) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [activeIdx, setActiveIdx] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [ratings] = useState(() => {
    const r = {}
    getShuffled().forEach(d => { r[d.id] = (4 + Math.random()).toFixed(1) })
    return r
  })

  const dragRef = useRef({ startX: 0, dragging: false, startTime: 0 })

  if (!open) return null

  let destinations = getShuffled()
  if (activeCat !== 'all') destinations = destinations.filter(d => d.category === activeCat)
  if (search.trim()) {
    const q = search.toLowerCase()
    destinations = destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q) || d.category.includes(q)
    )
  }

  const isBike = vehicleMode !== 'car_taxi'
  const isStandalone = vehicleMode === null || vehicleMode === undefined
  const totalAll = getShuffled().length
  const usedCats = [...new Set(getShuffled().map(d => d.category))]
  const clamp = (i) => Math.max(0, Math.min(destinations.length - 1, i))

  /* ── Swipe handlers ── */
  const onStart = (x) => {
    dragRef.current = { startX: x, dragging: true, startTime: Date.now() }
    setDragX(0)
  }
  const onMove = (x) => {
    if (!dragRef.current.dragging) return
    setDragX(x - dragRef.current.startX)
  }
  const onEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const dx = dragX
    const dt = Date.now() - dragRef.current.startTime
    const velocity = Math.abs(dx) / (dt || 1)
    // Swipe threshold: 50px or fast flick
    if (dx < -50 || (dx < -20 && velocity > 0.4)) {
      setActiveIdx(prev => clamp(prev + 1))
    } else if (dx > 50 || (dx > 20 && velocity > 0.4)) {
      setActiveIdx(prev => clamp(prev - 1))
    }
    setDragX(0)
  }

  const handleTouchStart = (e) => onStart(e.touches[0].clientX)
  const handleTouchMove = (e) => onMove(e.touches[0].clientX)
  const handleTouchEnd = () => onEnd()
  const handleMouseDown = (e) => { e.preventDefault(); onStart(e.clientX) }
  const handleMouseMove = (e) => { if (dragRef.current.dragging) onMove(e.clientX) }
  const handleMouseUp = () => onEnd()

  /* ── Card position calc ── */
  const CARD_W = 300
  const GAP = 20

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a url("https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%201,%202026,%2012_24_37%20PM.png") center/cover no-repeat', zIndex: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
    >
      {/* ═══ Header ═══ */}
      <div style={{ flexShrink: 0, padding: '14px 16px 0', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📍</span> Discover Places
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>Swipe to explore · Tap to book a ride</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSuggestOpen(true)} style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.35)',
              color: '#F59E0B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5,
            }}>+ Suggest</button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 11, fontWeight: 600 }}>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', color: '#8DC63F' }}>{totalAll} places</span>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>{usedCats.length} categories</span>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>Yogyakarta</span>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setActiveIdx(0) }} placeholder="Search places..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          {search && <button onClick={() => { setSearch(''); setActiveIdx(0) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          <button onClick={() => { setActiveCat('all'); setActiveIdx(0) }} style={{
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
            background: activeCat === 'all' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: activeCat === 'all' ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: activeCat === 'all' ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
          }}>All</button>
          {DIRECTORY_CATEGORIES.filter(c => usedCats.includes(c.id)).map(c => (
            <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveIdx(0) }} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: activeCat === c.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
              border: activeCat === c.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: activeCat === c.id ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ Swipe Carousel ═══ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {destinations.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>🔍</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>No places found</span>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {destinations.map((dest, idx) => {
              const diff = idx - activeIdx
              const absDiff = Math.abs(diff)
              if (absDiff > 2) return null

              const offset = diff * (CARD_W * 0.62 + GAP) + (dragRef.current.dragging ? dragX * 0.6 : 0)
              const scale = absDiff === 0 ? 1 : absDiff === 1 ? 0.88 : 0.78
              const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.75 : 0.45
              const isCenter = absDiff === 0

              const pricing = calculateDirectoryPrice(dest)
              const price = isBike ? pricing.bike : pricing.car
              const catObj = DIRECTORY_CATEGORIES.find(c => c.id === dest.category)

              return (
                <div key={dest.id} style={{
                  position: 'absolute',
                  width: CARD_W, maxWidth: 'calc(100vw - 48px)',
                  transform: `translateX(${offset}px) scale(${scale})`,
                  opacity,
                  zIndex: 10 - absDiff,
                  transition: dragRef.current.dragging ? 'none' : 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                  pointerEvents: isCenter ? 'auto' : 'none',
                }}>
                  <div style={{
                    borderRadius: 20, overflow: 'hidden', position: 'relative',
                    border: isCenter ? '2px solid rgba(141,198,63,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isCenter ? '0 0 40px rgba(141,198,63,0.15), 0 12px 48px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
                  }}>
                    {/* Full background image */}
                    <img src={getHeroImg(dest.category)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 10%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.92))' }} />

                    {/* Content over image */}
                    <div style={{ position: 'relative', zIndex: 1, padding: '14px 14px 16px', minHeight: isCenter ? 340 : 260, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      {/* Top badges */}
                      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: '#8DC63F', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {catObj?.icon || '📍'} {catObj?.label || dest.category}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>
                            {dest.distanceKm} km
                          </div>
                          {/* Instagram square button */}
                          <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(dest.name.replace(/\s+/g, '').toLowerCase())}/`} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()} style={{
                              width: 32, height: 32, borderRadius: 8, textDecoration: 'none',
                              background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(225,48,108,0.4)',
                            }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          </a>
                        </div>
                      </div>

                      {/* Name + address */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)', lineHeight: 1.2, marginBottom: 4 }}>{dest.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, flex: 1 }}>{dest.address}</div>
                          <div style={{ padding: '3px 8px', borderRadius: 8, background: 'rgba(250,204,21,0.15)', fontSize: 12, fontWeight: 800, color: '#FACC15', whiteSpace: 'nowrap' }}>
                            ⭐ {ratings[dest.id]}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCenter ? 12 : 0 }}>
                        <div>
                          <span style={{ fontSize: 22, fontWeight: 900, color: '#FACC15', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{fmtIDR(price)}</span>
                          <span style={{ fontSize: 14, marginLeft: 6 }}>{isBike ? '🏍️' : '🚗'}</span>
                        </div>
                        {pricing.isReturn && (
                          <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.15)', fontSize: 10, fontWeight: 700, color: '#60A5FA' }}>Return trip</span>
                        )}
                      </div>

                      {/* Center card: Book CTA */}
                      {isCenter && isStandalone && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => {
                            onSelectDestination?.({ ...dest, price: pricing.bike, isReturn: pricing.isReturn, vehiclePrice: pricing, _selectedVehicle: 'bike_ride' })
                            onClose()
                          }} style={{
                            flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                            color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                          }}>
                            🏍️ Bike — {fmtIDR(pricing.bike)}
                          </button>
                          <button onClick={() => {
                            onSelectDestination?.({ ...dest, price: pricing.car, isReturn: pricing.isReturn, vehiclePrice: pricing, _selectedVehicle: 'car_taxi' })
                            onClose()
                          }} style={{
                            flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                            color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                          }}>
                            🚗 Car — {fmtIDR(pricing.car)}
                          </button>
                        </div>
                      )}
                      {isCenter && !isStandalone && (
                        <button onClick={() => {
                          onSelectDestination?.({ ...dest, price, isReturn: pricing.isReturn, vehiclePrice: pricing })
                          onClose()
                        }} style={{
                          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                          background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                          color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                        }}>
                          {isBike ? '🏍️' : '🚗'} Book Ride Here — {fmtIDR(price)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ Bottom bar ═══ */}
      {destinations.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '12px 16px 20px',
          background: 'transparent',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Prev */}
          <button onClick={() => setActiveIdx(prev => clamp(prev - 1))} disabled={activeIdx === 0} style={{
            width: 44, height: 44, borderRadius: 22, cursor: 'pointer',
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.12)',
            color: activeIdx === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
            {destinations.length <= 20 ? destinations.map((_, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{
                width: i === activeIdx ? 16 : 6, height: 6, borderRadius: 3,
                background: i === activeIdx ? '#8DC63F' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s', cursor: 'pointer',
              }} />
            )) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                {activeIdx + 1} / {destinations.length}
              </span>
            )}
          </div>

          {/* Next */}
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
