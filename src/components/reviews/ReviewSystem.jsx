/**
 * ReviewSystem — leave and view reviews for rental/sale listings
 * Shared across all categories
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'

const REVIEWS_KEY = 'indoo_reviews'

// Get reviews for a listing
export function getReviews(listingRef) {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}')
    return all[listingRef] || []
  } catch { return [] }
}

// Save a review
export function saveReview(listingRef, review) {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}')
    if (!all[listingRef]) all[listingRef] = []
    all[listingRef].unshift(review)
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all))
  } catch {}
}

// Get average rating
export function getAvgRating(listingRef) {
  const reviews = getReviews(listingRef)
  if (!reviews.length) return { avg: 0, count: 0 }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return { avg: +(sum / reviews.length).toFixed(1), count: reviews.length }
}

// View reviews popup
export function ReviewsPopup({ open, onClose, listingRef, listingTitle }) {
  const [reviews] = useState(() => getReviews(listingRef))
  const [showWrite, setShowWrite] = useState(false)

  if (!open) return null

  const { avg, count } = getAvgRating(listingRef)

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ width: '100%', maxWidth: 400, maxHeight: '85vh', background: 'rgba(10,10,15,0.95)', border: '1.5px solid rgba(255,215,0,0.12)', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Reviews</div>
            {listingTitle && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{listingTitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Rating summary */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFD700' }}>{avg || '—'}</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 2 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 14, color: s <= Math.round(avg) ? '#FFD700' : 'rgba(255,255,255,0.1)' }}>★</span>)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{count} review{count !== 1 ? 's' : ''}</div>
          </div>
          {/* Rating bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[5,4,3,2,1].map(star => {
              const starCount = reviews.filter(r => r.rating === star).length
              const pct = count > 0 ? (starCount / count) * 100 : 0
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 12, textAlign: 'right' }}>{star}</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#FFD700', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', width: 16 }}>{starCount}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Write review button */}
        <div style={{ padding: '10px 16px', flexShrink: 0 }}>
          <button onClick={() => setShowWrite(true)} style={{ width: '100%', padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ✍️ Write a Review
          </button>
        </div>

        {/* Reviews list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>⭐</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>No reviews yet</span>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Be the first to leave a review</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map((r, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#FFD700' }}>{r.name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{r.name}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{new Date(r.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 11, color: s <= r.rating ? '#FFD700' : 'rgba(255,255,255,0.08)' }}>★</span>)}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write review popup */}
        {showWrite && <WriteReview listingRef={listingRef} onClose={() => setShowWrite(false)} onSaved={() => { setShowWrite(false); onClose() }} />}
      </div>
    </div>,
    document.body
  )
}

// Write review form
function WriteReview({ listingRef, onClose, onSaved }) {
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [hoverStar, setHoverStar] = useState(0)

  const canSubmit = rating > 0 && name.trim() && text.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    saveReview(listingRef, {
      id: `rv_${Date.now()}`,
      name: name.trim(),
      rating,
      text: text.trim(),
      date: new Date().toISOString(),
    })
    onSaved?.()
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.98)', borderRadius: 22, display: 'flex', flexDirection: 'column', zIndex: 3 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#FFD700' }}>Write a Review</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Star rating */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Tap to rate</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)} style={{
                fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: s <= (hoverStar || rating) ? '#FFD700' : 'rgba(255,255,255,0.1)',
                transform: s <= (hoverStar || rating) ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.15s',
              }}>★</button>
            ))}
          </div>
          {rating > 0 && <div style={{ fontSize: 11, color: '#FFD700', marginTop: 6, fontWeight: 700 }}>{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</div>}
        </div>

        {/* Name */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="How should we display your name?" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Review text */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Your Review</label>
          <textarea value={text} onChange={e => { if (e.target.value.length <= 500) setText(e.target.value) }} placeholder="Tell others about your experience..." rows={4} style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', float: 'right', marginTop: 2 }}>{text.length}/500</span>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          width: '100%', padding: '14px 0', borderRadius: 14, marginTop: 'auto',
          background: canSubmit ? '#FFD700' : 'rgba(255,255,255,0.04)',
          border: 'none', color: canSubmit ? '#000' : 'rgba(255,255,255,0.15)',
          fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', boxShadow: canSubmit ? '0 4px 16px rgba(255,215,0,0.3)' : 'none',
        }}>
          Submit Review
        </button>
      </div>
    </div>
  )
}
