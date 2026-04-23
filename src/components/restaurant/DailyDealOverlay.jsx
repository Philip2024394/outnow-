/**
 * DailyDealOverlay — swipeable full-page daily deal cards
 * Shows current restaurant's deal first, then all other restaurants with deals today.
 * If no deal, shows "no deal" state then swipe to see others.
 */
import { useState, useEffect, useRef } from 'react'
import { getTodayDeal } from '@/constants/dailyDeals'
import { getAllTodayDeals } from '@/services/dailyDealService'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

function DealItemCard({ item, todayTheme, qty, onQtyChange, dealDiscount }) {
  const [zoomed, setZoomed] = useState(false)
  const pct = item.discountPct ?? dealDiscount ?? 0
  const discountedPrice = Math.round(item.originalPrice * (1 - pct / 100))
  const remaining = (item.quantity ?? 50) - (item.claimed ?? 0)
  const soldOut = remaining <= 0
  const almostGone = remaining > 0 && remaining <= 10
  return (
    <>
    <div style={{
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
      padding: '10px 12px',
      position: 'relative', overflow: 'hidden',
      opacity: soldOut ? 0.4 : 1,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Running green light */}
      {!soldOut && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runningLight 3s linear infinite', boxShadow: '0 0 8px #8DC63F' }} />
        </div>
      )}

      {/* Photo */}
      {item.photoUrl ? (
        <img src={item.photoUrl} alt="" onClick={(e) => { e.stopPropagation(); setZoomed(true) }}
          style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
        />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 24 }}>{todayTheme.emoji}</span>
        </div>
      )}

      {/* Name + price + discount below */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15', display: 'block', marginTop: 3 }}>{fmtRp(discountedPrice)}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', display: 'block', marginTop: 2 }}>Discounted {pct}%</span>
      </div>

      {/* Qty + remaining */}
      {!soldOut ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }} onTouchStart={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onPointerDown={(e) => { e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQtyChange(-1) }}
              style={{ width: 34, height: 32, borderRadius: '8px 0 0 8px', border: 'none', background: '#8DC63F', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', zIndex: 10, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >-</button>
            <span style={{ width: 36, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, fontWeight: 900 }}>{qty}</span>
            <button
              onPointerDown={(e) => { e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQtyChange(1) }}
              style={{ width: 34, height: 32, borderRadius: '0 8px 8px 0', border: 'none', background: '#8DC63F', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', zIndex: 10, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >+</button>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#EF4444', animation: 'discountFlash 1.5s ease-in-out infinite' }}>
            {remaining} left
          </span>
        </div>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 900, color: '#EF4444', flexShrink: 0 }}>Sold Out</span>
      )}
    </div>
    {/* Zoomed image — bottom sheet container, not full page */}
    {zoomed && item.photoUrl && (
      <>
        <div onClick={() => setZoomed(false)} style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
          background: '#0a0a0a', borderRadius: '24px 24px 0 0',
          borderTop: '3px solid #8DC63F',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 -4px 20px rgba(141,198,63,0.2), 0 -8px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Running green light on top rim */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10,
            overflow: 'hidden', pointerEvents: 'none',
          }}>
            <div style={{
              width: '30%', height: '100%',
              background: 'linear-gradient(90deg, transparent, #fff, transparent)',
              animation: 'runningLight 3s linear infinite',
              opacity: 0.6,
            }} />
          </div>

          {/* Image — clean, no text overlay */}
          <div style={{ position: 'relative', width: '100%', height: 240, flexShrink: 0 }}>
            <img src={item.photoUrl} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px 20px 0 0' }} />
            {/* Discount badge — top right */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              padding: '5px 12px', borderRadius: 8,
              background: '#EF4444', color: '#fff',
              fontSize: 14, fontWeight: 900,
              animation: 'discountFlash 1.5s ease-in-out infinite',
              boxShadow: '0 0 12px rgba(239,68,68,0.5)',
            }}>
              {item.discountPct}% OFF
            </div>
          </div>

          {/* Name + rating + price — in the dark footer, not on image */}
          <div style={{ padding: '14px 16px 0' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>{item.itemName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 15, color: '#FACC15' }}>★</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FACC15' }}>4.8</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#FACC15' }}>{fmtRp(discountedPrice)}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(item.originalPrice)}</span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div style={{ padding: '8px 16px 0' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.description}</span>
            </div>
          )}

          {/* Close button */}
          <div style={{ padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(false) }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#EF4444', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(350%); } }
        `}</style>
      </>
    )}
    </>
  )
}

export default function DailyDealOverlay({ restaurant, dealItems, onClose, onAddToCart, onViewMenu }) {
  const todayTheme = getTodayDeal()
  const scrollRef = useRef(null)
  const [otherDeals, setOtherDeals] = useState([])
  const [quantities, setQuantities] = useState(() => {
    const q = {}
    ;(dealItems ?? []).slice(0, 3).forEach(d => { q[d.itemId] = 1 })
    return q
  })

  // Countdown to midnight WIB
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
      const wib = new Date(utcMs + 7 * 3_600_000)
      const midnight = new Date(wib); midnight.setHours(23, 59, 59, 999)
      const diff = midnight.getTime() - wib.getTime()
      if (diff <= 0) { setCountdown('00:00:00'); return }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Random viewer count (40-120) + mock avatar indices
  const [viewerCount] = useState(() => 40 + Math.floor(Math.random() * 81))
  const [avatarIds] = useState(() => {
    const ids = []
    const used = new Set()
    while (ids.length < 5) {
      const id = 1 + Math.floor(Math.random() * 70)
      if (!used.has(id)) { used.add(id); ids.push(id) }
    }
    return ids
  })

  // Load all other restaurants' deals today
  useEffect(() => {
    getAllTodayDeals().then(deals => {
      // Filter out current restaurant
      setOtherDeals(deals.filter(d => d.restaurant_id !== restaurant?.id))
    })
  }, [restaurant?.id])

  const setQty = (itemId, delta) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, Math.min(10, (prev[itemId] ?? 1) + delta)) }))
  }

  const [addedFlash, setAddedFlash] = useState(false)
  const handleAddAll = () => {
    const discount = todayTheme.discount
    ;(dealItems ?? []).slice(0, 3).forEach(item => {
      const pct = item.discountPct ?? discount
      const qty = quantities[item.itemId] ?? 1
      for (let i = 0; i < qty; i++) {
        onAddToCart?.({
          id: item.itemId,
          name: item.itemName,
          price: Math.round(item.originalPrice * (1 - pct / 100)),
          originalPrice: item.originalPrice,
          dealDiscount: pct,
          isDealItem: true,
          photo_url: item.photoUrl ?? null,
        })
      }
    })
    setAddedFlash(true)
    setTimeout(() => setAddedFlash(false), 1500)
    onViewMenu?.()
  }

  const hasItems = dealItems && dealItems.length > 0
  const totalCards = 1 + otherDeals.length // this restaurant + others

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9700 }}>
      <style>{`.deal-swipe-feed::-webkit-scrollbar { display: none; }`}</style>
      {/* Vertical snap-scroll */}
      <div
        ref={scrollRef}
        className="deal-swipe-feed"
        style={{
          width: '100%', height: '100%',
          overflowX: 'hidden', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          display: 'flex', flexDirection: 'column',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        {/* ── Card 1: Current restaurant ── */}
        <div style={{ width: '100%', minHeight: '100vh', minHeight: '100dvh', scrollSnapAlign: 'start', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Background + slight tint */}
          <img src={todayTheme.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }} />

          {/* Top banner — restaurant name + deal theme */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 16px 8px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '0 0 16px 16px', borderBottom: '2px solid #8DC63F', overflow: 'hidden', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Running green light on bottom edge */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant?.name ?? 'Restaurant'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {avatarIds.slice(0, 4).map((id, i) => (
                  <img key={id} src={`https://i.pravatar.cc/40?img=${id}`} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8DC63F', marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i, position: 'relative' }} />
                ))}
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}><span style={{ color: '#8DC63F', fontWeight: 900 }}>{viewerCount}</span> viewing</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block' }}>Deal Ends</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
            </div>
          </div>


          {/* Spacer — pushes content to bottom */}
          <div style={{ flex: 1 }} />

          {/* Deal content — above footer */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 16px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!hasItems ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 8 }}>No deals from {restaurant?.name ?? 'this restaurant'} today</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, display: 'block' }}>
                  {otherDeals.length > 0 ? `Swipe up to see ${otherDeals.length} other deal${otherDeals.length > 1 ? 's' : ''} nearby` : 'Check back tomorrow'}
                </span>
              </div>
            ) : (
              <>
                {(dealItems ?? []).slice(0, 3).map(item => (
                  <DealItemCard
                    key={item.itemId}
                    item={item}
                    todayTheme={todayTheme}
                    qty={quantities[item.itemId] ?? 1}
                    onQtyChange={(d) => setQty(item.itemId, d)}
                    dealDiscount={todayTheme.discount}
                  />
                ))}
              </>
            )}
          </div>

          {/* Bottom — Add to Cart + round Close button */}
          <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {hasItems ? (
              <div style={{ flex: 1, position: 'relative' }}>
                {/* Fire particles */}
                {[...Array(6)].map((_, i) => (
                  <span key={i} style={{
                    position: 'absolute', bottom: '100%',
                    left: `${15 + i * 14}%`,
                    width: 6 + (i % 3) * 2, height: 6 + (i % 3) * 2,
                    borderRadius: '50%',
                    background: i % 2 === 0 ? '#FACC15' : '#EF4444',
                    animation: `fireUp ${1.2 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                    opacity: 0, pointerEvents: 'none',
                  }} />
                ))}
                <button onClick={handleAddAll} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: addedFlash ? '#FACC15' : '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'background 0.3s', transform: addedFlash ? 'scale(1.02)' : 'scale(1)' }}>
                  {addedFlash ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>
              </div>
            ) : (
              <button onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Back to Menu
              </button>
            )}
            <button onClick={onClose} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Arrow button — swipe down hint */}
          {totalCards > 1 && (
            <div style={{
              position: 'absolute', bottom: hasItems ? 100 : 80, left: 0, right: 0, zIndex: 3,
              display: 'flex', justifyContent: 'center',
              animation: 'arrowFloat 1.2s ease-in-out infinite',
            }}>
              <button
                onClick={() => { if (scrollRef.current) scrollRef.current.scrollBy({ top: scrollRef.current.clientHeight, behavior: 'smooth' }) }}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.8)', border: '2px solid rgba(250,204,21,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(250,204,21,0.4)', cursor: 'pointer', padding: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 14" fill="#FACC15" stroke="none" style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.8))' }}>
                  <path d="M4 2l8 8 8-8 2 2-10 10L2 4z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Swipe indicator dots — vertical right side */}
          {totalCards > 1 && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 3, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: todayTheme.color, boxShadow: `0 0 6px ${todayTheme.color}` }} />
              {otherDeals.map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />)}
            </div>
          )}
        </div>

        {/* ── Other restaurant deal cards ── */}
        {otherDeals.map(deal => (
          <div key={deal.id} style={{ width: '100%', minHeight: '100vh', minHeight: '100dvh', scrollSnapAlign: 'start', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <img src={todayTheme.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }} />

            {/* Top banner */}
            <div style={{
              position: 'relative', zIndex: 2,
              padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 16px 8px',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '0 0 16px 16px', borderBottom: '2px solid #8DC63F', overflow: 'hidden', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>{deal.restaurant?.name ?? 'Restaurant'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  {[11,22,33,44].map((id, i) => (
                    <img key={id} src={`https://i.pravatar.cc/40?img=${id + (deal.restaurant_id ?? 0)}`} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8DC63F', marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i, position: 'relative' }} />
                  ))}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}><span style={{ color: '#8DC63F', fontWeight: 900 }}>{40 + Math.floor((deal.restaurant_id ?? 1) * 7.3 % 81)}</span> viewing</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block' }}>Deal Ends</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
              </div>
            </div>

            {/* Food discount bubble — center hero */}
            <div style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)', zIndex: 5, animation: 'foodFloat 3.5s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid #FACC15', animation: 'bikeGlow 2.5s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px solid rgba(250,204,21,0.2)', animation: 'bikeGlow 3s ease-in-out 0.5s infinite' }} />
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
                border: '2.5px solid rgba(250,204,21,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(250,204,21,0.3), 0 0 80px rgba(250,204,21,0.1)',
              }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>🍽️</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#FACC15', marginTop: 3, lineHeight: 1 }}>{deal.discountPct ?? todayTheme.discount}%</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>OFF</span>
              </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Deal content — above footer */}
            <div style={{ position: 'relative', zIndex: 2, padding: '0 16px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(deal.items ?? []).slice(0, 3).map(item => (
                <DealItemCard
                  key={item.itemId}
                  item={item}
                  todayTheme={todayTheme}
                  qty={1}
                  dealDiscount={deal.discountPct ?? todayTheme.discount}
                  onQtyChange={() => {}}
                />
              ))}
            </div>

            {/* Add to Cart + Close button */}
            <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                {[...Array(6)].map((_, i) => (
                  <span key={i} style={{
                    position: 'absolute', bottom: '100%', left: `${15 + i * 14}%`,
                    width: 6 + (i % 3) * 2, height: 6 + (i % 3) * 2, borderRadius: '50%',
                    background: i % 2 === 0 ? '#FACC15' : '#EF4444',
                    animation: `fireUp ${1.2 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.2}s`, opacity: 0, pointerEvents: 'none',
                  }} />
                ))}
                <button onClick={() => { /* TODO: add deal to cart + open restaurant */ }} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: '#8DC63F', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                  Add to Cart
                </button>
              </div>
              <button onClick={onClose} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes swipeHintDown { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes arrowFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
        @keyframes discountFlash { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes shake { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-3deg); } 40% { transform: rotate(3deg); } 60% { transform: rotate(-2deg); } 80% { transform: rotate(2deg); } }
        @keyframes fireUp { 0% { opacity: 1; transform: translateY(0) scale(1); } 50% { opacity: 0.8; } 100% { opacity: 0; transform: translateY(-50px) scale(0.3); } }
        @keyframes bikeDrift { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
        @keyframes foodFloat { 0%,100% { transform: translateY(-10px) rotate(3deg); } 50% { transform: translateY(0) rotate(-3deg); } }
        @keyframes bikeGlow { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 0; } }
      `}</style>
    </div>
  )
}
