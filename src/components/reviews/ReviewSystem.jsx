/**
 * ReviewSystem — category-based star ratings for rental/sale listings
 * 4 categories: Service, Item As Described, Value For Money, Will Deal Again
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const REVIEWS_KEY = 'indoo_reviews'

const CATEGORIES = [
  { key: 'service', label: 'Service' },
  { key: 'asDescribed', label: 'Item As Described' },
  { key: 'valueForMoney', label: 'Value For Money' },
  { key: 'dealAgain', label: 'Will Deal Again' },
]

// ── Helpers ──────────────────────────────────────────────────────────

export function getReviews(listingRef) {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}')
    return all[listingRef] || []
  } catch { return [] }
}

export function saveReview(review) {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}')
    if (!all[review.listingRef]) all[review.listingRef] = []
    all[review.listingRef].unshift(review)
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all))
  } catch {}
}

export function getAvgRating(listingRef) {
  const reviews = getReviews(listingRef)
  if (!reviews.length) return { avg: 0, count: 0 }
  const sum = reviews.reduce((s, r) => {
    const reviewAvg = (r.service + r.asDescribed + r.valueForMoney + r.dealAgain) / 4
    return s + reviewAvg
  }, 0)
  return { avg: +(sum / reviews.length).toFixed(1), count: reviews.length }
}

// ── Shared styles ────────────────────────────────────────────────────

const overlayBg = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)',
  display: 'flex', flexDirection: 'column',
  overflow: 'hidden',
}

const cardStyle = {
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1.5px solid rgba(141,198,63,0.08)',
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
}

const glowLine = {
  height: 1,
  background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)',
  flexShrink: 0,
}

function StarRow({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? '#FFD700' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

function CloseButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: '50%',
      background: '#8DC63F', border: 'none', color: '#000',
      fontSize: 13, fontWeight: 900, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>✕</button>
  )
}

function reviewOverallAvg(r) {
  return +((r.service + r.asDescribed + r.valueForMoney + r.dealAgain) / 4).toFixed(1)
}

// ── ReviewsPopup ─────────────────────────────────────────────────────

export function ReviewsPopup({ open, onClose, listingRef, listingTitle }) {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (open) setReviews(getReviews(listingRef))
  }, [open, listingRef])

  if (!open) return null

  const count = reviews.length
  const overall = count > 0
    ? +(reviews.reduce((s, r) => s + reviewOverallAvg(r), 0) / count).toFixed(1)
    : 0

  // category averages
  const catAvgs = {}
  CATEGORIES.forEach(c => {
    catAvgs[c.key] = count > 0
      ? +(reviews.reduce((s, r) => s + (r[c.key] || 0), 0) / count).toFixed(1)
      : 0
  })

  return createPortal(
    <div style={overlayBg}>
      {/* Header */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{listingTitle || 'Reviews'}</span>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div style={glowLine} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch' }}>

        {/* Overall rating hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '24px 0 20px' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>{overall || '—'}</div>
          <div style={{ marginTop: 6 }}><StarRow rating={overall} size={20} /></div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{count} review{count !== 1 ? 's' : ''}</div>
        </div>

        {/* Category breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <div key={c.key} style={{
              ...cardStyle,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{c.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarRow rating={catAvgs[c.key]} size={13} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700', minWidth: 24, textAlign: 'right' }}>{catAvgs[c.key] || '—'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Individual reviews */}
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>⭐</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>No reviews yet</span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>Be the first to leave a review</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map((r, i) => {
              const avg = reviewOverallAvg(r)
              return (
                <div key={r.id || i} style={{ ...cardStyle, padding: '14px 16px' }}>
                  {/* Reviewer info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: '#FFD700',
                      }}>{r.name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{new Date(r.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FFD700' }}>{avg}</div>
                      <StarRow rating={avg} size={10} />
                    </div>
                  </div>

                  {/* Category ratings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {CATEGORIES.map(c => (
                      <div key={c.key} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '2px 0',
                      }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{c.label}</span>
                        <StarRow rating={r[c.key] || 0} size={11} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── WriteReview ──────────────────────────────────────────────────────

export function WriteReview({ open, onClose, listingRef, listingTitle, onSaved }) {
  const [ratings, setRatings] = useState({ service: 0, asDescribed: 0, valueForMoney: 0, dealAgain: 0 })
  const [name, setName] = useState('')
  const [hoverState, setHoverState] = useState({})

  // Pre-fill name from profile
  useEffect(() => {
    if (open) {
      try {
        const profile = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
        if (profile.name) setName(profile.name)
      } catch {}
      // Reset ratings on open
      setRatings({ service: 0, asDescribed: 0, valueForMoney: 0, dealAgain: 0 })
      setHoverState({})
    }
  }, [open])

  if (!open) return null

  const allRated = CATEGORIES.every(c => ratings[c.key] > 0)
  const canSubmit = allRated

  const handleSubmit = () => {
    if (!canSubmit) return
    const review = {
      id: 'rev_' + Date.now(),
      listingRef,
      name: name.trim() || 'Anonymous',
      service: ratings.service,
      asDescribed: ratings.asDescribed,
      valueForMoney: ratings.valueForMoney,
      dealAgain: ratings.dealAgain,
      date: new Date().toISOString(),
    }
    saveReview(review)
    onSaved?.()
  }

  return createPortal(
    <div style={overlayBg}>
      {/* Header */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>✏️</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Rate Your Experience</span>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div style={glowLine} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>

        {/* Listing title */}
        {listingTitle && (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{listingTitle}</span>
          </div>
        )}

        {/* 4 rating rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {CATEGORIES.map(c => {
            const active = hoverState[c.key] || ratings[c.key]
            return (
              <div key={c.key} style={{
                ...cardStyle,
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{c.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRatings(prev => ({ ...prev, [c.key]: s }))}
                      onMouseEnter={() => setHoverState(prev => ({ ...prev, [c.key]: s }))}
                      onMouseLeave={() => setHoverState(prev => ({ ...prev, [c.key]: 0 }))}
                      style={{
                        fontSize: 28, lineHeight: 1,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: s <= active ? '#FFD700' : 'rgba(255,255,255,0.15)',
                        transition: 'color 0.12s',
                      }}
                    >★</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Name field */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Your Name (optional)</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="How should we display your name?"
            style={{
              width: '100%', padding: '13px 16px',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(141,198,63,0.08)',
              borderRadius: 14, color: '#fff', fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: '100%', padding: '15px 0', borderRadius: 16, marginTop: 24,
          background: canSubmit ? '#8DC63F' : 'rgba(255,255,255,0.04)',
          border: 'none',
          color: canSubmit ? '#000' : 'rgba(255,255,255,0.15)',
          fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          boxShadow: canSubmit ? '0 4px 16px rgba(141,198,63,0.3)' : 'none',
          transition: 'all 0.2s',
        }}>
          Submit Rating
        </button>
      </div>
    </div>,
    document.body
  )
}
