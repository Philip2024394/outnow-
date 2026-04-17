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

// items = array of { id, name, price, qty, image, currency } (multi-item cart)
// product = single item object (quick-order from carousel)
// One of the two must be provided.
export default function FoodOrderSheet({ open, product, items, seller, giftFor, onClose, showToast }) {
  const { user } = useAuth()

  const isMulti      = Array.isArray(items) && items.length > 0
  const itemsSubtotal = isMulti ? items.reduce((s, i) => s + i.price * i.qty, 0) : 0

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

  if (!open || (!product && !isMulti) || !seller || !giftFor) return null

  const distanceKm   = giftFor.distanceKm ?? giftFor.distKm ?? null
  const tier         = getDeliveryTier(distanceKm)
  const indooAvail = tier !== null
  const basePrice    = isMulti ? itemsSubtotal : Number(product.price ?? 0)
  const totalPrice   = basePrice + Number(tier?.fee ?? 0)

  // Bundle product used when placing a multi-item order
  const orderProduct = isMulti ? {
    id:       `cart-${Date.now()}`,
    name:     items.map(i => `${i.qty}× ${i.name}`).join(', '),
    price:    itemsSubtotal,
    currency: 'IDR',
  } : product

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
        product:     orderProduct,
        giftMessage: message,
        deliveryFee: tier?.fee ?? 0,
        distanceKm,
      })

      if (error) { showToast?.(error, 'error'); setSending(false); return }

      const sellerName = seller.brandName ?? seller.displayName ?? 'a restaurant'

      await notifyGiftToSeller(seller.id, {
        productName: orderProduct.name,
        orderId,
        fromUserId:  buyerUserId,
      })

      const recipientHasAddress = await hasGiftAddress(recipientId)
      if (recipientHasAddress) {
        await notifyGiftToRecipient(recipientId, {
          sellerName,
          productName: orderProduct.name,
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

        {/* ── Order summary ── */}
        <div className={styles.restaurantRow}>
          <span className={styles.restaurantLabel}>from</span>
          <span className={styles.restaurantName}>{seller.brandName ?? seller.displayName}</span>
        </div>

        {isMulti ? (
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={styles.itemRow}>
                <span className={styles.itemQty}>{item.qty}×</span>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemPrice}>{formatPrice(item.price * item.qty, item.currency)}</span>
              </div>
            ))}
            <div className={styles.itemsSubtotalRow}>
              <span>Subtotal</span>
              <span className={styles.itemsSubtotalVal}>{formatPrice(itemsSubtotal, 'IDR')}</span>
            </div>
          </div>
        ) : (
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
            </div>

            <div className={styles.productPrice}>
              {formatPrice(product.price, product.currency)}
            </div>
          </div>
        )}

        {/* Delivery */}
        {indooAvail ? (
          <div className={styles.deliverySection}>
            <div className={styles.deliveryTitle}>
              <span>🏍️ Indoo Local Delivery</span>
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
            🚚 Outside Indoo local range — the restaurant will arrange delivery.
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
          <span className={styles.totalValue}>{formatPrice(totalPrice, isMulti ? 'IDR' : product.currency)}</span>
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
