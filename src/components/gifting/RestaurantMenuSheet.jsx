/**
 * RestaurantMenuSheet
 *
 * Full-page menu for one restaurant.
 * User taps + on any item → it appears as a chip in the sticky footer.
 * Footer shows: selected chips (scroll left/right) · delivery price · total · send.
 * Distance is giftFor.distanceKm (profile person's location vs the map centre).
 * User can remove chips, change qty with +/−, add a note, then send anonymously.
 */
import { useState, useRef } from 'react'
import { getDeliveryTier, formatIDR } from '@/services/giftService'
import DriverSearchSheet from './DriverSearchSheet'
import styles from './RestaurantMenuSheet.module.css'

export default function RestaurantMenuSheet({ open, restaurant, giftFor, onClose, onOrderPlaced }) {
  const [cart,             setCart]             = useState({})   // { [id]: { ...item, qty } }
  const [commentOpen,      setCommentOpen]      = useState(false)
  const [comment,          setComment]          = useState('')
  const [driverSearchOpen, setDriverSearchOpen] = useState(false)
  const chipsRef = useRef(null)

  if (!open || !restaurant) return null

  const menuItems   = (restaurant.menu_items ?? restaurant.menu ?? []).filter(i => i.is_available !== false)
  const cartItems   = Object.values(cart)
  const cartCount   = cartItems.reduce((s, i) => s + i.qty, 0)
  const subtotal    = cartItems.reduce((s, i) => s + i.price * i.qty, 0)

  const distanceKm  = giftFor?.distanceKm ?? giftFor?.distKm ?? null
  const tier        = getDeliveryTier(distanceKm)
  const deliveryFee = tier?.fee ?? 0
  const total       = subtotal + deliveryFee

  // ── Cart actions ──────────────────────────────────────────────────────────

  function addItem(item) {
    setCart(prev => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], qty: prev[item.id].qty + 1 }
        : { ...item, qty: 1 },
    }))
  }

  function reduceItem(itemId) {
    setCart(prev => {
      const updated = { ...prev }
      if (!updated[itemId]) return prev
      if (updated[itemId].qty > 1) {
        updated[itemId] = { ...updated[itemId], qty: updated[itemId].qty - 1 }
      } else {
        delete updated[itemId]
      }
      return updated
    })
  }

  function removeChip(itemId) {
    setCart(prev => {
      const updated = { ...prev }
      delete updated[itemId]
      return updated
    })
  }

  function handleClose() {
    setCart({})
    setComment('')
    setCommentOpen(false)
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={handleClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>

          {/* ── Handle ── */}
          <div className={styles.handle} />

          {/* ── Header ── */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <span className={styles.restaurantName}>{restaurant.name}</span>
              <span className={styles.restaurantCuisine}>
                {restaurant.cuisine_type ?? restaurant.cuisine ?? 'Restaurant'}
                {restaurant.rating ? ` · ⭐ ${Number(restaurant.rating).toFixed(1)}` : ''}
              </span>
            </div>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">✕</button>
          </div>

          {/* ── Menu grid ── */}
          <div className={`${styles.menu} ${cartCount > 0 ? styles.menuWithFooter : ''}`}>
            {menuItems.length === 0 ? (
              <div className={styles.empty}>No menu items yet</div>
            ) : (
              <div className={styles.menuGrid}>
                {menuItems.map(item => {
                  const qty = cart[item.id]?.qty ?? 0
                  const img = item.image ?? item.photo_url
                  return (
                    <div
                      key={item.id}
                      className={`${styles.menuCard} ${qty > 0 ? styles.menuCardActive : ''}`}
                    >
                      {/* Round image wrapper — allows + button to hang on the edge */}
                      <div className={styles.menuCardImgWrap}>
                        <div className={`${styles.menuCardImg} ${qty > 0 ? styles.menuCardActiveImg : ''}`}>
                          {img
                            ? <img src={img} alt={item.name} className={styles.menuImg}
                                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                            : null}
                          <div className={styles.menuEmoji} style={img ? { display: 'none' } : {}}>🍽️</div>
                        </div>
                        {qty > 0 && <span className={styles.menuBadge}>{qty}</span>}
                        {qty === 0 && (
                          <button className={styles.addBtnEdge} onClick={() => addItem(item)}>+</button>
                        )}
                      </div>

                      <span className={styles.menuName}>{item.name}</span>
                      <span className={styles.menuPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</span>

                      {/* − qty + appears below price when item is in cart */}
                      {qty > 0 && (
                        <div className={styles.qtyRow}>
                          <button className={styles.qtyBtn} onClick={() => reduceItem(item.id)}>−</button>
                          <span className={styles.qtyVal}>{qty}</span>
                          <button className={styles.qtyBtn} onClick={() => addItem(item)}>+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Sticky footer — only when cart has items ── */}
          {cartCount > 0 && (
            <div className={styles.footer}>

              {/* Selected chips */}
              <div className={styles.chipsWrap} ref={chipsRef}>
                {cartItems.map(item => (
                  <div key={item.id} className={styles.chip}>
                    <span className={styles.chipQty}>{item.qty}×</span>
                    <span className={styles.chipName}>{item.name}</span>
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeChip(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >×</button>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLeft}>
                  <span className={styles.deliveryIcon}>🏍️</span>
                  <span className={styles.deliveryLabel}>Bike delivery</span>
                  {distanceKm != null && (
                    <span className={styles.deliveryDist}>{distanceKm.toFixed(1)} km</span>
                  )}
                </span>
                <span className={styles.deliveryFee}>
                  {deliveryFee > 0 ? `+ ${formatIDR(deliveryFee)}` : 'Free'}
                </span>
              </div>

              {/* Optional comment */}
              {commentOpen && (
                <div className={styles.commentWrap}>
                  <textarea
                    className={styles.commentInput}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a note for the restaurant or recipient… (they won't know it's from you)"
                    rows={2}
                    maxLength={200}
                    autoFocus
                  />
                  <span className={styles.commentCount}>{comment.length}/200</span>
                </div>
              )}

              {/* Total row + actions */}
              <div className={styles.footerActions}>
                <button
                  className={`${styles.noteBtn} ${commentOpen ? styles.noteBtnOn : ''}`}
                  onClick={() => setCommentOpen(v => !v)}
                >
                  {commentOpen ? 'Note ✓' : '+ Note'}
                </button>

                <div className={styles.footerTotals}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalVal}>Rp {total.toLocaleString('id-ID')}</span>
                </div>

                <button className={styles.sendBtn} onClick={() => setDriverSearchOpen(true)}>
                  Find Driver →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Driver search + order confirmation ── */}
      <DriverSearchSheet
        open={driverSearchOpen}
        restaurant={restaurant}
        items={cartItems}
        deliveryFee={deliveryFee}
        deliveryDistanceKm={distanceKm}
        comment={comment}
        onConfirmed={order => {
          setDriverSearchOpen(false)
          handleClose()
          onOrderPlaced?.(order)
        }}
        onClose={() => setDriverSearchOpen(false)}
      />

    </>
  )
}
