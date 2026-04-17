/**
 * WriteReviewScreen — buyer writes a review for a delivered order.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './WriteReviewScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

export default function WriteReviewScreen({ open, onClose, order }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleAddImage = () => {
    const url = prompt('Paste image URL:')
    if (url?.trim()) setImages(prev => [...prev, url.trim()].slice(0, 5))
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSaving(true)

    const review = {
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      order_id: order?.id,
      product: order?.product,
      seller: order?.seller,
      rating,
      text: text.trim(),
      images,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    }

    if (supabase && user?.id) {
      await supabase.from('product_reviews').insert(review).catch(() => {})
    }

    // localStorage fallback
    const existing = JSON.parse(localStorage.getItem('indoo_reviews') || '[]')
    existing.unshift(review)
    localStorage.setItem('indoo_reviews', JSON.stringify(existing))

    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return createPortal(
      <div className={styles.screen}>
        <div className={styles.successWrap}>
          <span className={styles.successIcon}>🎉</span>
          <h2 className={styles.successTitle}>Review Submitted!</h2>
          <p className={styles.successSub}>Thank you for your feedback. The seller will be notified.</p>
          <button className={styles.successBtn} onClick={() => { setSubmitted(false); setRating(0); setText(''); setImages([]); onClose?.() }}>
            Done
          </button>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <h1 className={styles.title}>Write Review</h1>
      </div>

      <div className={styles.body}>
        {/* Product info */}
        {order && (
          <div className={styles.productCard}>
            <span className={styles.productName}>{order.product}</span>
            <span className={styles.productSeller}>{order.seller}</span>
          </div>
        )}

        {/* Star rating */}
        <div className={styles.ratingSection}>
          <span className={styles.ratingLabel}>How would you rate this product?</span>
          <div className={styles.starRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} className={`${styles.starBtn} ${i <= rating ? styles.starBtnFilled : ''}`} onClick={() => setRating(i)}>
                ★
              </button>
            ))}
          </div>
          <span className={styles.ratingText}>
            {rating === 0 && 'Tap a star to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent!'}
          </span>
        </div>

        {/* Review text */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Your Review</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your experience with this product — quality, fit, packaging, delivery..."
            rows={5}
            maxLength={1000}
          />
          <span className={styles.charCount}>{text.length}/1000</span>
        </div>

        {/* Photos */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Add Photos (optional, up to 5)</label>
          <div className={styles.imageRow}>
            {images.map((img, i) => (
              <div key={i} className={styles.imageThumb}>
                <img src={img} alt="" />
                <button className={styles.imageRemove} onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {images.length < 5 && (
              <button className={styles.imageAdd} onClick={handleAddImage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={rating === 0 || saving}>
          {saving ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>,
    document.body
  )
}
