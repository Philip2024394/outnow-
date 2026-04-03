import { useState } from 'react'
import { unlockVenuePayment } from '@/services/paymentService'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import styles from './PaymentGate.module.css'

/**
 * Shown to User B after User A accepts.
 * Pay $2.99 → redirects to Stripe hosted checkout.
 * On return: VenueReveal shows exact location.
 */
export default function PaymentGate({ open, request, onClose, showToast }) {
  const [loading, setLoading] = useState(false)

  const price = import.meta.env.VITE_OTW_PRICE_USD ?? '2.99'

  const handlePay = async () => {
    if (!request?.id || !request?.sessionId) {
      showToast('Session expired.', 'error')
      return
    }
    setLoading(true)
    try {
      await unlockVenuePayment(request.id, request.sessionId)
      // Stripe redirect happens inside the service — this line won't be reached
    } catch (err) {
      showToast('Payment failed. Try again.', 'error')
      setLoading(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className={styles.content}>
        <div className={styles.icon}>🔒</div>

        <h2 className={styles.heading}>Unlock Location</h2>
        <p className={styles.sub}>
          They accepted! Pay to reveal the exact venue name and get directions.
        </p>

        <div className={styles.priceCard}>
          <span className={styles.price}>${price}</span>
          <span className={styles.priceLabel}>one-time unlock</span>
        </div>

        <div className={styles.includes}>
          <div className={styles.includeRow}>
            <span>📍</span>
            <span>Exact venue name & address</span>
          </div>
          <div className={styles.includeRow}>
            <span>🗺️</span>
            <span>Precise map pin + directions</span>
          </div>
          <div className={styles.includeRow}>
            <span>🔔</span>
            <span>Notifies them you're coming</span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handlePay}
        >
          Pay ${price} to Unlock
        </Button>

        <Button variant="ghost" fullWidth onClick={onClose}>
          Cancel
        </Button>

        <p className={styles.note}>
          Secure payment via Stripe. No charge if they cancel.
        </p>
      </div>
    </BottomSheet>
  )
}
