/**
 * DestinationDirectory — 3D wheel carousel for browsing destinations.
 * Premium UI with hero images, Google/Instagram links, category pills.
 * Tap center card to book ride. Swipe vertically to spin wheel.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  DIRECTORY_CATEGORIES, getDestinationsByCategory,
  calculateDirectoryPrice, fmtIDR,
} from '@/services/directoryService'
import SuggestPlaceSheet from './SuggestPlaceSheet'

/* ── Category → Hero image mapping ── */
const CAT_IMAGES = {
  temple:       'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=200&fit=crop',
  beach:        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop',
  restaurant:   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
  shopping:     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
  nightlife:    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=200&fit=crop',
  hospital:     'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=200&fit=crop',
  university:   'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
  nature:       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop',
  airport:      'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=200&fit=crop',
  'art & culture': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=200&fit=crop',
  transport:    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop',
  government:   'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&h=200&fit=crop',
  'food areas': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop',
  'fast food':  'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=200&fit=crop',
  gyms:         'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
  salons:       'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop',
  spas:         'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=200&fit=crop',
  karaoke:      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=200&fit=crop',
  malls:        'https://images.unsplash.com/photo-1519567241046-7f570f0e1ec8?w=400&h=200&fit=crop',
  markets:      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop',
  waterparks:   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=200&fit=crop',
  'bus stations':'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=200&fit=crop',
  'train stations':'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=200&fit=crop',
  pizza:        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=200&fit=crop',
  'chinese food':'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=200&fit=crop',
  'sushi & japanese':'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop',
  billiards:    'https://images.unsplash.com/photo-1570283626914-5d5a1b474932?w=400&h=200&fit=crop',
  'western food':'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop',
  'money exchange':'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=200&fit=crop',
  dentist:      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=200&fit=crop',
}
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop'

function getHeroImg(cat) { return CAT_IMAGES[cat] || DEFAULT_IMG }
function getRating() { return (4 + Math.random()).toFixed(1) }

/* ── Glass style ── */
const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

/* ── Shuffled destinations (stable per session) ── */
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
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [ratings] = useState(() => {
    const r = {}
    getShuffled().forEach(d => { r[d.id] = getRating() })
    return r
  })

  // Touch/drag state
  const dragRef = useRef({ startY: 0, lastY: 0, velocity: 0, dragging: false, lastTime: 0 })
  const animRef = useRef(null)

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
  const totalPlaces = getShuffled().length
  const usedCats = [...new Set(getShuffled().map(d => d.category))]

  // Clamp activeIdx
  const clampIdx = (i) => Math.max(0, Math.min(destinations.length - 1, i))

  // Wheel card transforms
  const VISIBLE_CARDS = 7
  const CARD_GAP = 80

  const getCardStyle = (idx) => {
    const diff = idx - activeIdx
    const absDiff = Math.abs(diff)
    if (absDiff > 3) return { display: 'none' }

    const y = diff * CARD_GAP
    const scale = 1 - absDiff * 0.12
    const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.6 : absDiff === 2 ? 0.35 : 0.15
    const rotateX = diff * -8
    const z = -absDiff * 60
    const blur = absDiff > 1 ? 2 : 0

    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(-50%, -50%) translateY(${y}px) perspective(1000px) rotateX(${rotateX}deg) translateZ(${z}px) scale(${scale})`,
      opacity,
      zIndex: 10 - absDiff,
      transition: dragRef.current.dragging ? 'none' : 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
      filter: blur ? `blur(${blur}px)` : 'none',
      pointerEvents: absDiff === 0 ? 'auto' : 'none',
      width: 'calc(100% - 32px)',
      maxWidth: 380,
    }
  }

  // Touch handlers
  const handleDragStart = (clientY) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    dragRef.current = { startY: clientY, lastY: clientY, velocity: 0, dragging: true, lastTime: Date.now() }
  }

  const handleDragMove = (clientY) => {
    if (!dragRef.current.dragging) return
    const now = Date.now()
    const dt = now - dragRef.current.lastTime || 1
    const dy = clientY - dragRef.current.lastY
    dragRef.current.velocity = dy / dt
    dragRef.current.lastY = clientY
    dragRef.current.lastTime = now

    const totalDy = clientY - dragRef.current.startY
    const steps = Math.round(-totalDy / 50)
    const base = clampIdx(activeIdx)
    const newIdx = clampIdx(base + steps)
    if (newIdx !== activeIdx) {
      dragRef.current.startY = clientY
      setActiveIdx(newIdx)
    }
  }

  const handleDragEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const v = dragRef.current.velocity
    if (Math.abs(v) > 0.3) {
      const direction = v < 0 ? 1 : -1
      const steps = Math.min(3, Math.ceil(Math.abs(v) * 3))
      setActiveIdx(prev => clampIdx(prev + direction * steps))
    }
  }

  const onTouchStart = (e) => handleDragStart(e.touches[0].clientY)
  const onTouchMove = (e) => handleDragMove(e.touches[0].clientY)
  const onTouchEnd = () => handleDragEnd()
  const onMouseDown = (e) => { e.preventDefault(); handleDragStart(e.clientY) }
  const onMouseMove = (e) => { if (dragRef.current.dragging) handleDragMove(e.clientY) }
  const onMouseUp = () => handleDragEnd()

  // Active destination
  const activeDest = destinations[activeIdx]
  const activePricing = activeDest ? calculateDirectoryPrice(activeDest) : null
  const activePrice = activePricing ? (isBike ? activePricing.bike : activePricing.car) : 0

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    >
      {/* Header */}
      <div style={{ ...glass, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', flexShrink: 0, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📍</span> Discover Places
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>Tourist spots, restaurants, temples & more</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSuggestOpen(true)} style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.35)',
              color: '#F59E0B', fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 5,
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', color: '#8DC63F' }}>{totalPlaces} places</span>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>{usedCats.length} categories</span>
          <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>Yogyakarta</span>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40, background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setActiveIdx(0) }} placeholder="Search places..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          {search && <button onClick={() => { setSearch(''); setActiveIdx(0) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          <button onClick={() => { setActiveCat('all'); setActiveIdx(0) }} style={{
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
            background: activeCat === 'all' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: activeCat === 'all' ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: activeCat === 'all' ? '#8DC63F' : 'rgba(255,255,255,0.4)',
            fontSize: 12, fontWeight: 700,
          }}>All</button>
          {DIRECTORY_CATEGORIES.filter(c => usedCats.includes(c.id)).map(c => (
            <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveIdx(0) }} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
              background: activeCat === c.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
              border: activeCat === c.id ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: activeCat === c.id ? '#8DC63F' : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      </div>

      {/* 3D Wheel Carousel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'none' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {destinations.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>🔍</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>No places found</span>
          </div>
        ) : (
          <>
            {/* Navigation arrows */}
            <button onClick={() => setActiveIdx(prev => clampIdx(prev - 1))} disabled={activeIdx === 0} style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
              width: 44, height: 44, borderRadius: 22, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: activeIdx === 0 ? 'rgba(255,255,255,0.15)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>

            {/* Cards */}
            {destinations.map((dest, idx) => {
              const style = getCardStyle(idx)
              if (style.display === 'none') return null
              const pricing = calculateDirectoryPrice(dest)
              const price = isBike ? pricing.bike : pricing.car
              const isCenter = idx === activeIdx
              const catObj = DIRECTORY_CATEGORIES.find(c => c.id === dest.category)

              return (
                <div key={dest.id} style={style}>
                  <div style={{
                    ...glass,
                    borderRadius: 18, overflow: 'hidden',
                    border: isCenter ? '2px solid rgba(141,198,63,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isCenter ? '0 0 30px rgba(141,198,63,0.2), 0 8px 40px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.4)',
                    background: isCenter ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  }}>
                    {/* Hero image */}
                    <div style={{ width: '100%', height: isCenter ? 120 : 80, position: 'relative', overflow: 'hidden' }}>
                      <img src={getHeroImg(dest.category)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))' }} />
                      {/* Category badge */}
                      <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: '#8DC63F', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {catObj?.icon || '📍'} {catObj?.label || dest.category}
                      </div>
                      {/* Distance badge */}
                      <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>
                        {dest.distanceKm} km
                      </div>
                      {/* Price overlay */}
                      <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtIDR(price)}</span>
                        <span style={{ fontSize: 12, marginLeft: 4 }}>{isBike ? '🏍️' : '🚗'}</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: isCenter ? '14px 16px' : '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: isCenter ? 16 : 14, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{dest.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 1.3 }}>{dest.address}</div>
                        </div>
                        {/* Rating */}
                        <div style={{ padding: '3px 8px', borderRadius: 8, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', fontSize: 12, fontWeight: 800, color: '#FACC15', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          ⭐ {ratings[dest.id] || '4.5'}
                        </div>
                      </div>

                      {/* Center card extras */}
                      {isCenter && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Action links */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${dest.lat},${dest.lng}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                              flex: 1, padding: '8px 0', borderRadius: 10, textDecoration: 'none',
                              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                              color: '#60A5FA', fontSize: 12, fontWeight: 700, textAlign: 'center',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}>
                              📍 Google Maps
                            </a>
                            <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(dest.name.replace(/\s+/g, '').toLowerCase())}/`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                              flex: 1, padding: '8px 0', borderRadius: 10, textDecoration: 'none',
                              background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.25)',
                              color: '#E1306C', fontSize: 12, fontWeight: 700, textAlign: 'center',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}>
                              📸 Instagram
                            </a>
                          </div>
                          {/* Book ride CTA */}
                          <button onClick={() => {
                            onSelectDestination?.({ ...dest, price, isReturn: pricing.isReturn, vehiclePrice: pricing })
                            onClose()
                          }} style={{
                            width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
                            color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
                          }}>
                            {isBike ? '🏍️' : '🚗'} Book Ride Here — {fmtIDR(price)}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Down arrow */}
            <button onClick={() => setActiveIdx(prev => clampIdx(prev + 1))} disabled={activeIdx >= destinations.length - 1} style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
              width: 44, height: 44, borderRadius: 22, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: activeIdx >= destinations.length - 1 ? 'rgba(255,255,255,0.15)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {/* Position indicator */}
            <div style={{ position: 'absolute', bottom: 14, right: 16, zIndex: 20, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              {activeIdx + 1} / {destinations.length}
            </div>
          </>
        )}
      </div>

      <SuggestPlaceSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>,
    document.body
  )
}
