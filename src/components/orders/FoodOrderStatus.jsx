/**
 * FoodOrderStatus — full-screen live tracking page.
 * Design matches BookingScreen (bike/car) — same green accent, glass cards, bg images.
 */
import { useState, useEffect } from 'react'
import { subscribeToFoodOrder, ORDER_STATUSES, getStatusIndex } from '@/services/foodOrderService'
import styles from './FoodOrderStatus.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

function isNightWIB() {
  const h = (new Date().getUTCHours() + 7) % 24
  return h >= 18 || h < 6
}

const BG_DAY   = 'url("https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2012,%202026,%2008_57_07%20PM.png")'
const BG_NIGHT = 'url("https://ik.imagekit.io/nepgaxllc/Night%20ride%20on%20Jalan%20Bromo.png")'

export default function FoodOrderStatus({ order, onClose }) {
  const [liveOrder, setLiveOrder] = useState(order)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    if (!order?.id) return
    setLiveOrder(order)
    const unsub = subscribeToFoodOrder(order.id, updated => setLiveOrder(updated))
    return unsub
  }, [order?.id]) // eslint-disable-line

  if (!liveOrder) return null

  const statusIdx   = getStatusIndex(liveOrder.status)
  const isDelivered = liveOrder.status === 'delivered'
  const items       = Array.isArray(liveOrder.items) ? liveOrder.items : []
  const bgImage     = isNightWIB() ? BG_NIGHT : BG_DAY

  // ── Minimized strip ──────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className={styles.stripWrap}>
        <div className={styles.strip} onClick={() => setMinimized(false)}>
          <span className={styles.stripEmoji}>
            {ORDER_STATUSES[Math.max(0, statusIdx)]?.icon ?? '🏍️'}
          </span>
          <div className={styles.stripMid}>
            <span className={styles.stripTitle}>
              {isDelivered ? 'Delivered!' : 'Order On Its Way'}
            </span>
            <span className={styles.stripSub}>
              {ORDER_STATUSES[Math.max(0, statusIdx)]?.label ?? ''}
            </span>
          </div>
          <span className={styles.stripExpand}>▲</span>
        </div>
      </div>
    )
  }

  // ── Full-screen page ─────────────────────────────────────────────────────────
  return (
    <div className={styles.screen} style={{ backgroundImage: bgImage }}>
      <div className={styles.scrim} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerBrand}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926"
            alt="INDOO"
            className={styles.headerLogo}
          />
        </div>
        <div className={styles.headerActions}>
          <button className={styles.minimizeBtn} onClick={() => setMinimized(true)} aria-label="Minimize">
            ▼
          </button>
          {isDelivered && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Title card */}
        <div className={styles.titleCard}>
          <div className={styles.titleRow}>
            <span className={styles.titleEmoji}>
              {isDelivered ? '🎉' : ORDER_STATUSES[Math.max(0, statusIdx)]?.icon ?? '🏍️'}
            </span>
            <div>
              <p className={styles.titleText}>
                {isDelivered ? 'Order Delivered!' : 'Order On Its Way'}
              </p>
              <p className={styles.titleRef}>Ref · {liveOrder.cash_ref}</p>
            </div>
          </div>

          {/* Status progress steps */}
          <div className={styles.steps}>
            {ORDER_STATUSES.map((s, i) => {
              const done    = i < statusIdx
              const current = i === statusIdx
              return (
                <div key={s.key} className={styles.step}>
                  <div className={`${styles.stepDot} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}>
                    {done
                      ? <span className={styles.stepCheck}>✓</span>
                      : <span className={styles.stepIcon}>{s.icon}</span>}
                  </div>
                  {i < ORDER_STATUSES.length - 1 && (
                    <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''} ${current ? styles.stepLineCurrent : ''}`} />
                  )}
                  <span className={`${styles.stepLabel} ${current ? styles.stepLabelCurrent : ''} ${done ? styles.stepLabelDone : ''}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Driver card — matches BookingScreen waiting card */}
        <div className={styles.driverCard}>
          <div className={styles.driverTop}>
            <div className={styles.driverAvatar}>
              {liveOrder.driver_photo
                ? <img src={liveOrder.driver_photo} alt="" className={styles.driverAvatarImg} />
                : <span className={styles.driverAvatarEmoji}>🏍️</span>}
            </div>
            <div className={styles.driverInfo}>
              <span className={styles.driverName}>{liveOrder.driver_name}</span>
              <span className={styles.driverVehicle}>
                {liveOrder.driver_vehicle}
              </span>
              <span className={styles.driverPlate}>{liveOrder.driver_plate}</span>
            </div>
            {liveOrder.driver_phone && (
              <a href={`tel:${liveOrder.driver_phone}`} className={styles.callBtn}>
                📞 Call
              </a>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className={styles.orderCard}>
          <div className={styles.orderRestaurant}>
            <span className={styles.orderRestaurantIcon}>📍</span>
            <span className={styles.orderRestaurantName}>{liveOrder.restaurant_name}</span>
          </div>
          <div className={styles.orderDivider} />
          <div className={styles.orderItems}>
            {items.map((item, i) => (
              <div key={i} className={styles.orderItem}>
                <span className={styles.orderItemQty}>{item.qty}×</span>
                <span className={styles.orderItemName}>{item.name}</span>
                <span className={styles.orderItemPrice}>{fmtRp(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className={styles.orderDivider} />
          <div className={styles.orderTotalRow}>
            <span className={styles.orderTotalLabel}>Total</span>
            <span className={styles.orderTotalVal}>{fmtRp(liveOrder.total)}</span>
          </div>
        </div>

        {/* Status note */}
        {!isDelivered && liveOrder.status === 'confirmed' && (
          <div className={styles.infoNote}>
            ✓ Payment confirmed — your driver has been notified and is heading to the restaurant
          </div>
        )}

        {/* Delivered */}
        {isDelivered && (
          <div className={styles.deliveredCard}>
            <span className={styles.deliveredEmoji}>🍽️</span>
            <p className={styles.deliveredTitle}>Enjoy your food!</p>
            <p className={styles.deliveredSub}>Your order has been delivered successfully.</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

      </div>
    </div>
  )
}
