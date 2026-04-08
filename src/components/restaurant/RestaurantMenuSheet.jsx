import { useState } from 'react'
import styles from './RestaurantMenuSheet.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

function buildWhatsAppMessage(restaurant, cart, deliveryAddress) {
  const lines = cart.map(item => `• ${item.name} × ${item.qty} — ${fmtRp(item.price * item.qty)}`)
  const foodTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const bookingRef = `#HDL_${Date.now().toString().slice(-8)}`
  const deliveryNote = restaurant.deliveryFare
    ? `🛵 Estimated delivery: ~${fmtRp(restaurant.deliveryFare)}`
    : '🛵 Delivery cost to be confirmed'

  const msg = [
    `🍽 *Order from ${restaurant.name}*`,
    '———————————————',
    ...lines,
    '———————————————',
    `🍴 Food total: ${fmtRp(foodTotal)}`,
    deliveryNote,
    `💰 *Estimated total: ~${fmtRp(foodTotal + (restaurant.deliveryFare ?? 0))}*`,
    deliveryAddress ? `📍 Deliver to: ${deliveryAddress}` : '',
    `⏱ Prep time: ~${Math.max(...cart.map(i => i.prep_time_min ?? 15))} min`,
    '',
    `Hangger Booking Ref: ${bookingRef}`,
    `(Restaurant will book Hangger driver after payment)`,
  ].filter(Boolean).join('\n')

  return { msg, bookingRef }
}

export default function RestaurantMenuSheet({ restaurant, onClose }) {
  const [cart,          setCart]          = useState([])  // [{ ...item, qty }]
  const [activeCategory,setActiveCategory] = useState('all')
  const [deliveryAddr,  setDeliveryAddr]  = useState('')
  const [showOrder,     setShowOrder]     = useState(false)

  const items    = restaurant.menu_items ?? []
  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))]

  const visible = activeCategory === 'all'
    ? items
    : items.filter(i => i.category === activeCategory)

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId)
      if (!existing || existing.qty <= 1) return prev.filter(c => c.id !== itemId)
      return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const cartQty  = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const qtyFor   = (id) => cart.find(c => c.id === id)?.qty ?? 0

  const handleWhatsApp = () => {
    const { msg } = buildWhatsAppMessage(restaurant, cart, deliveryAddr)
    const url = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className={styles.handle} />

        {/* Restaurant header */}
        <div className={styles.restaurantHeader}>
          <div className={styles.restaurantInfo}>
            <span className={styles.restaurantName}>{restaurant.name}</span>
            <span className={styles.restaurantMeta}>
              ⭐ {restaurant.rating ?? '—'} · {restaurant.cuisine_type}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Delivery estimate strip */}
        {restaurant.distKm != null && (
          <div className={styles.deliveryStrip}>
            <span>🛵 {restaurant.distKm} km away</span>
            {restaurant.deliveryFare && (
              <span className={styles.deliveryFare}>~{fmtRp(restaurant.deliveryFare)} delivery</span>
            )}
            <span className={styles.deliveryNote}>Driver booked by restaurant after payment</span>
          </div>
        )}

        {/* Category filter */}
        <div className={styles.categoryRow}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className={styles.menuList}>
          {visible.map(item => (
            <div key={item.id} className={`${styles.menuItem} ${!item.is_available ? styles.menuItemUnavailable : ''}`}>
              {/* Photo */}
              <div className={styles.itemPhoto}>
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.name} className={styles.itemImg} />
                  : <span className={styles.itemPhotoEmoji}>🍽</span>
                }
              </div>

              {/* Info */}
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.description && <span className={styles.itemDesc}>{item.description}</span>}
                <div className={styles.itemMeta}>
                  <span className={styles.itemPrice}>{fmtRp(item.price)}</span>
                  {item.prep_time_min && (
                    <span className={styles.itemPrep}>⏱ {item.prep_time_min} min</span>
                  )}
                </div>
              </div>

              {/* Qty control */}
              {item.is_available !== false && (
                <div className={styles.qtyControl}>
                  {qtyFor(item.id) > 0 ? (
                    <>
                      <button className={styles.qtyBtn} onClick={() => removeFromCart(item.id)}>−</button>
                      <span className={styles.qtyNum}>{qtyFor(item.id)}</span>
                      <button className={styles.qtyBtn} onClick={() => addToCart(item)}>+</button>
                    </>
                  ) : (
                    <button className={styles.addBtn} onClick={() => addToCart(item)}>+ Add</button>
                  )}
                </div>
              )}
              {item.is_available === false && (
                <span className={styles.unavailableTag}>Sold out</span>
              )}
            </div>
          ))}
        </div>

        {/* Cart bar */}
        {cartQty > 0 && (
          <div className={styles.cartBar}>
            {!showOrder ? (
              <button className={styles.cartBtn} onClick={() => setShowOrder(true)}>
                <span className={styles.cartBadge}>{cartQty}</span>
                <span>View Order</span>
                <span className={styles.cartTotal}>{fmtRp(cartTotal)}</span>
              </button>
            ) : (
              <div className={styles.orderPanel}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderTitle}>Your Order</span>
                  <button className={styles.orderBack} onClick={() => setShowOrder(false)}>← Menu</button>
                </div>

                {cart.map(item => (
                  <div key={item.id} className={styles.orderRow}>
                    <span className={styles.orderQty}>{item.qty}×</span>
                    <span className={styles.orderName}>{item.name}</span>
                    <span className={styles.orderPrice}>{fmtRp(item.price * item.qty)}</span>
                  </div>
                ))}

                <div className={styles.orderDivider} />
                <div className={styles.orderRow}>
                  <span className={styles.orderName} style={{ fontWeight: 800 }}>Food Total</span>
                  <span className={styles.orderPrice} style={{ color: '#8DC63F' }}>{fmtRp(cartTotal)}</span>
                </div>
                {restaurant.deliveryFare && (
                  <div className={styles.orderRow}>
                    <span className={styles.orderName}>🛵 Est. Delivery</span>
                    <span className={styles.orderPrice}>~{fmtRp(restaurant.deliveryFare)}</span>
                  </div>
                )}
                {restaurant.deliveryFare && (
                  <div className={styles.orderRow}>
                    <span className={styles.orderName} style={{ fontWeight: 900 }}>Est. Total</span>
                    <span className={styles.orderPrice} style={{ color: '#8DC63F', fontWeight: 900 }}>
                      ~{fmtRp(cartTotal + restaurant.deliveryFare)}
                    </span>
                  </div>
                )}

                <input
                  className={styles.addressInput}
                  placeholder="📍 Your delivery address"
                  value={deliveryAddr}
                  onChange={e => setDeliveryAddr(e.target.value)}
                />

                <button className={styles.whatsappBtn} onClick={handleWhatsApp}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.848L.057 23.571l5.894-1.545A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.214-3.5.918.934-3.408-.235-.372A9.818 9.818 0 0112 2.182c5.428 0 9.818 4.39 9.818 9.818 0 5.428-4.39 9.818-9.818 9.818z"/>
                  </svg>
                  Order via WhatsApp
                </button>
                <p className={styles.whatsappNote}>
                  Pay restaurant directly · They will book a Hangger driver for delivery
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
