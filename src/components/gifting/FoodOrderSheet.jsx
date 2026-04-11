/**
 * FoodOrderSheet.jsx
 * Anonymous meal delivery checkout.
 * Same privacy model as GiftOrderSheet — sender is always anonymous.
 * Same draggable floating profile bubble.
 */
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { placeGiftOrder, getDeliveryTier, DELIVERY_TIERS, formatIDR, hasGiftAddress } from '@/services/giftService'
import { notifyGiftToSeller, notifyGiftToRecipient, notifyGiftAddressRequired } from '@/services/notificationService'
import styles from './FoodOrderSheet.module.css'

function formatPrice(price, currency) {
  if (!price) return '—'
  if (currency === 'IDR' || !currency) return formatIDR(price)
  return `${currency} ${Number(price).toLocaleString()}`
}

export default function FoodOrderSheet({ open, product, seller, giftFor, onClose, showToast }) {
  const { user } = useAuth()

  const [message,   setMessage]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [bubblePos, setBubblePos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 96 : 320,
    y: 72,
  }))
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const onBubblePointerDown = (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOffsetRef.current = { x: e.clientX - bubblePos.x, y: e.clientY - bubblePos.y }
  }
  const onBubblePointerMove = (e) => {
    if (!e.buttons) return
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 430
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    setBubblePos({
      x: Math.max(8, Math.min(vw - 80, e.clientX - dragOffsetRef.current.x)),
      y: Math.max(8, Math.min(vh - 110, e.clientY - dragOffsetRef.current.y)),
    })
  }

  if (!open || !product || !seller || !giftFor) return null

  const distanceKm   = giftFor.distanceKm ?? giftFor.distKm ?? null
  const tier         = getDeliveryTier(distanceKm)
  const hanggerAvail = tier !== null
  const totalPrice   = Number(product.price ?? 0) + Number(tier?.fee ?? 0)

  const handleSend = async () => {
    if (!user?.id && !user?.uid) {
      showToast?.('Sign in to send a meal', 'error')
      return
    }
    setSending(true)
    try {
      const buyerUserId = user.uid ?? user.id
      const recipientId = giftFor.userId ?? giftFor.id

      const { id: orderId, error } = await placeGiftOrder({
        recipientId,
        sellerId:    seller.id,
        product,
        giftMessage: message,
        deliveryFee: tier?.fee ?? 0,
        distanceKm,
      })

      if (error) { showToast?.(error, 'error'); setSending(false); return }

      const sellerName = seller.brandName ?? seller.displayName ?? 'a restaurant'

      await notifyGiftToSeller(seller.id, {
        productName: product.name,
        orderId,
        fromUserId:  buyerUserId,
      })

      const recipientHasAddress = await hasGiftAddress(recipientId)
      if (recipientHasAddress) {
        await notifyGiftToRecipient(recipientId, {
          sellerName,
          productName: product.name,
          orderId,
          fromUserId:  buyerUserId,
        })
      } else {
        await notifyGiftAddressRequired(recipientId, {
          sellerName,
          fromUserId: buyerUserId,
          orderId,
        })
      }

      setSent(true)
    } catch (e) {
      showToast?.(e.message ?? 'Something went wrong', 'error')
    }
    setSending(false)
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.successWrap}>
            <div className={styles.successEmoji}>🍽️</div>
            <h2 className={styles.successTitle}>Meal sent!</h2>
            <p className={styles.successSub}>
              Your anonymous meal is on its way to{' '}
              <strong>{giftFor.displayName ?? 'them'}</strong>.{' '}
              The restaurant has been notified.
            </p>
            <p className={styles.successPrivacy}>
              🔒 Your identity is completely anonymous — they'll never know who sent it.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>

      {/* ── Draggable floating profile bubble ── */}
      <div
        className={styles.floatingBubble}
        style={{ left: bubblePos.x, top: bubblePos.y }}
        onPointerDown={onBubblePointerDown}
        onPointerMove={onBubblePointerMove}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.bubbleRing}>
          {giftFor.photoURL
            ? <img src={giftFor.photoURL} alt={giftFor.displayName} className={styles.bubblePhoto} />
            : <div className={styles.bubblePhotoFallback}>💕</div>
          }
          <span className={styles.bubbleName}>{giftFor.displayName ?? 'Someone'}</span>
        </div>
        <span className={styles.bubbleLabel}>Meal Surprise</span>
      </div>

      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Dish card */}
        <div className={styles.productCard}>
          {product.image || product.image_url
            ? <img src={product.image ?? product.image_url} alt={product.name} className={styles.productImg} />
            : <div className={styles.productImgFallback}>🍜</div>
          }
          <div className={styles.productInfo}>
            <div className={styles.productName}>{product.name}</div>
            {product.selectedVariant && (
              <div className={styles.productVariant}>{product.selectedVariant}</div>
            )}
            <div className={styles.productSeller}>
              from {seller.brandName ?? seller.displayName}
            </div>
          </div>
          <div className={styles.productPrice}>
            {formatPrice(product.price, product.currency)}
          </div>
        </div>

        {/* Delivery */}
        {hanggerAvail ? (
          <div className={styles.deliverySection}>
            <div className={styles.deliveryTitle}>
              <span>🏍️ Hangger Local Delivery</span>
              {distanceKm != null && (
                <span className={styles.distanceTag}>{distanceKm.toFixed(1)} km</span>
              )}
            </div>
            <div className={styles.deliveryTiers}>
              {DELIVERY_TIERS.map(t => (
                <div
                  key={t.label}
                  className={[styles.tierRow, tier?.maxKm === t.maxKm ? styles.tierRowActive : ''].join(' ')}
                >
                  <span className={styles.tierLabel}>{t.label}</span>
                  <span className={styles.tierFee}>{formatIDR(t.fee)}</span>
                </div>
              ))}
            </div>
            <div className={styles.deliveryFeeRow}>
              <span>Delivery fee</span>
              <span className={styles.deliveryFeeValue}>{formatIDR(tier.fee)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.sellerShipsNote}>
            🚚 Outside Hangger local range — the restaurant will arrange delivery.
          </div>
        )}

        {/* Message */}
        <div className={styles.messageSection}>
          <label className={styles.messageLabel}>
            💌 A little note <span className={styles.messageLabelOptional}>(optional)</span>
          </label>
          <textarea
            className={styles.messageInput}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            placeholder="Enjoy your meal… they won't know it's from you."
            rows={3}
          />
          <div className={styles.messageCount}>{message.length}/200</div>
        </div>

        {/* Total + send */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatPrice(totalPrice, product.currency)}</span>
        </div>

        <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
          {sending
            ? <span className={styles.sendBtnSpinner} />
            : <>🍔 Send Meal Anonymously</>
          }
        </button>

        <p className={styles.privacyNote}>
          Your identity is never revealed. The restaurant only receives an anonymous delivery order.
        </p>
      </div>
    </div>
  )
}
