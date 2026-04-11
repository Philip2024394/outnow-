/**
 * DeliveryRatingModal — star rating after a gift or food order is delivered.
 * Writes a rating row to gift_order_ratings via Supabase.
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './DeliveryRatingModal.module.css'

export default function DeliveryRatingModal({ order, onClose, onRated }) {
  const { user } = useAuth()
  const [stars,    setStars]    = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [comment,  setComment]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleRate = async () => {
    if (stars === 0) return
    setSaving(true)
    try {
      if (supabase) {
        await supabase.from('gift_order_ratings').upsert({
          order_id:   order.id,
          rated_by:   user?.uid ?? user?.id,
          seller_id:  order.seller_id,
          stars,
          comment:    comment.trim() || null,
          created_at: new Date().toISOString(),
        }, { onConflict: 'order_id,rated_by' })

        // Mark order as rated
        await supabase.from('gift_orders').update({ rated: true }).eq('id', order.id)
      }
      onRated?.()
    } catch { /* non-critical */ }
    setSaving(false)
  }

  const display = hovered || stars

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.emoji}>🎁</div>
        <h3 className={styles.title}>Rate this delivery</h3>
        <p className={styles.sub}>{order.product_name ?? 'Your gift'}</p>

        {/* Star picker */}
        <div className={styles.stars}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`${styles.star} ${n <= display ? styles.starFilled : ''}`}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >★</button>
          ))}
        </div>

        {stars > 0 && (
          <div className={styles.label}>
            {['', 'Poor 😕', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Amazing! 🤩'][stars]}
          </div>
        )}

        <textarea
          className={styles.comment}
          placeholder="Leave a comment (optional)…"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={200}
        />

        <button
          className={styles.submitBtn}
          disabled={stars === 0 || saving}
          onClick={handleRate}
        >
          {saving ? 'Saving…' : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}
