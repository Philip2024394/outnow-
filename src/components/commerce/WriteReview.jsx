/**
 * WriteReview — review submission form with star rating, text, photo upload.
 * Shows after order is marked complete. Verified purchase badge.
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './WriteReview.module.css'

export default function WriteReview({ open, onClose, productName, orderId, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef(null)

  if (!open) return null

  const handlePhoto = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''
    const newPhotos = files.slice(0, 5 - photos.length).map(f => ({
      file: f,
      url: URL.createObjectURL(f),
    }))
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5))
  }

  const removePhoto = (i) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    // In production: upload photos to storage, save review to Supabase
    const review = {
      rating,
      text: text.trim(),
      photos: photos.map(p => p.url),
      orderId,
      productName,
      verifiedPurchase: !!orderId,
      createdAt: Date.now(),
    }
    onSubmit?.(review)
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => { onClose() }, 1500)
  }

  const activeRating = hoverRating || rating

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {submitted ? (
          <div className={styles.successWrap}>
            <span className={styles.successIcon}>✅</span>
            <span className={styles.successText}>Review submitted! Thank you.</span>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.title}>Write a Review</span>
              <span className={styles.subtitle}>{productName}</span>
              {orderId && <span className={styles.verifiedBadge}>✓ Verified Purchase</span>}
            </div>

            {/* Star rating */}
            <div className={styles.starsWrap}>
              <span className={styles.starsLabel}>Tap to rate</span>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    className={styles.starBtn}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24"
                      fill={i <= activeRating ? '#F59E0B' : 'none'}
                      stroke={i <= activeRating ? '#F59E0B' : 'rgba(255,255,255,0.15)'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <span className={styles.ratingText}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </span>
              )}
            </div>

            {/* Text */}
            <div className={styles.section}>
              <textarea
                className={styles.textInput}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell other buyers about this product — quality, fit, delivery experience..."
                rows={4}
                maxLength={500}
              />
              <span className={styles.charCount}>{text.length}/500</span>
            </div>

            {/* Photos */}
            <div className={styles.section}>
              <span className={styles.photoLabel}>Add photos (up to 5)</span>
              <div className={styles.photoRow}>
                {photos.map((p, i) => (
                  <div key={i} className={styles.photoThumb}>
                    <img src={p.url} alt="" className={styles.photoImg} />
                    <button className={styles.photoRemove} onClick={() => removePhoto(i)}>✕</button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button className={styles.photoAdd} onClick={() => inputRef.current?.click()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            {/* Submit */}
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={rating === 0 || submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
