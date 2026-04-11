/**
 * DriverFoodOrderAlert
 *
 * Shown to an online driver when a new food order is assigned to them.
 * Driver must:
 *   1. Accept or decline within the countdown window.
 *   2. On the way to restaurant → tap "I'm at the restaurant".
 *   3. Enter the restaurant's pickup code to confirm collection.
 *   4. Deliver and tap "Delivered".
 */
import { useState, useEffect } from 'react'
import { updateFoodOrderStatus, confirmPickupWithCode, broadcastOrderToNextDriver } from '@/services/foodOrderService'
import styles from './DriverFoodOrderAlert.module.css'

const ACCEPT_TIMEOUT = 45

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function DriverFoodOrderAlert({ order, driverId, onDismiss }) {
  const [phase,       setPhase]       = useState('incoming')
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT)
  const [pickupCode,  setPickupCode]  = useState('')
  const [codeError,   setCodeError]   = useState(null)
  const [busy,        setBusy]        = useState(false)
  const [declinedBy,  setDeclinedBy]  = useState(order?.declined_by ?? [])

  const items = Array.isArray(order?.items) ? order.items : []

  useEffect(() => {
    if (phase !== 'incoming') return
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(id); handleBroadcast(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase]) // eslint-disable-line

  async function handleAccept() {
    setBusy(true)
    await updateFoodOrderStatus(order.id, 'driver_heading', driverId)
    setPhase('active')
    setBusy(false)
  }

  async function handleBroadcast() {
    const next = [...declinedBy, driverId]
    setDeclinedBy(next)
    await broadcastOrderToNextDriver(
      order.id,
      order.restaurant_lat,
      order.restaurant_lng,
      next,
    )
    onDismiss?.()
  }

  const handleDecline = handleBroadcast

  async function handleAtRestaurant() { setPhase('pickup') }

  async function handleConfirmPickup() {
    if (!pickupCode.trim()) { setCodeError('Enter the restaurant code'); return }
    setBusy(true); setCodeError(null)
    const ok = await confirmPickupWithCode(order.id, pickupCode.trim(), order.restaurant_id)
    if (ok) { setPhase('delivering') }
    else    { setCodeError('Wrong code — ask restaurant staff') }
    setBusy(false)
  }

  async function handleDelivered() {
    setBusy(true)
    await updateFoodOrderStatus(order.id, 'delivered', driverId)
    setPhase('done')
    setBusy(false)
  }

  const pct = (secondsLeft / ACCEPT_TIMEOUT) * 100
  const barColor = pct > 60 ? '#8DC63F' : pct > 30 ? '#F59E0B' : '#EF4444'

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.handle} />

        {/* ── INCOMING ── */}
        {phase === 'incoming' && (
          <>
            <p className={styles.phaseLabel}>New Order</p>
            <h2 className={styles.title}>New Food Order</h2>

            <div className={styles.timerBar}>
              <div className={styles.timerFill} style={{
                width: `${pct}%`,
                background: barColor,
              }} />
            </div>
            <p className={styles.countdown}>Accept within <strong>{secondsLeft}s</strong></p>

            <div className={styles.section}>
              <div className={styles.restaurantRow}>
                <div className={styles.restaurantIconWrap}>🏪</div>
                <div className={styles.restaurantInfo}>
                  <span className={styles.restaurantName}>{order.restaurant_name}</span>
                  <span className={styles.restaurantNote}>Pickup location</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Order items</p>
              {items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <span className={styles.itemQtyBadge}>{item.qty}×</span>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemPrice}>{fmtRp(item.price * item.qty)}</span>
                </div>
              ))}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Delivery fee (collect from customer)</span>
                <span className={styles.totalAmt}>{fmtRp(order.delivery_fee)}</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.declineBtn} onClick={handleDecline} disabled={busy}>
                Decline
              </button>
              <button className={styles.acceptBtn} onClick={handleAccept} disabled={busy}>
                Accept Order
              </button>
            </div>
          </>
        )}

        {/* ── ACTIVE — heading to restaurant ── */}
        {phase === 'active' && (
          <>
            <p className={styles.phaseLabel}>On the way</p>
            <h2 className={styles.title}>Head to Restaurant</h2>

            <div className={styles.section}>
              <div className={styles.restaurantRow}>
                <div className={styles.restaurantIconWrap}>📍</div>
                <div className={styles.restaurantInfo}>
                  <span className={styles.restaurantName}>{order.restaurant_name}</span>
                  <span className={styles.restaurantNote}>Show this order to restaurant staff</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Items to collect</p>
              {items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <span className={styles.itemQtyBadge}>{item.qty}×</span>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
              ))}
            </div>

            <div className={styles.cashNote}>
              Pay restaurant <strong>{fmtRp(order.subtotal)}</strong> in cash when you collect
            </div>

            <button className={styles.acceptBtn} onClick={handleAtRestaurant}>
              I'm at the Restaurant
            </button>
          </>
        )}

        {/* ── PICKUP — enter restaurant code ── */}
        {phase === 'pickup' && (
          <>
            <p className={styles.phaseLabel}>Pickup</p>
            <h2 className={styles.title}>Enter Pickup Code</h2>

            <p className={styles.instrText}>
              Ask restaurant staff for the <strong>6-character pickup code</strong> to confirm collection.
            </p>

            <input
              className={`${styles.codeInput} ${codeError ? styles.codeInputError : ''}`}
              value={pickupCode}
              onChange={e => setPickupCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="AB3X7K"
              maxLength={6}
              autoFocus
            />
            {codeError && <p className={styles.codeError}>{codeError}</p>}

            <button
              className={styles.acceptBtn}
              onClick={handleConfirmPickup}
              disabled={busy || pickupCode.length < 6}
            >
              {busy ? 'Verifying…' : 'Confirm Pickup'}
            </button>
          </>
        )}

        {/* ── DELIVERING ── */}
        {phase === 'delivering' && (
          <>
            <p className={styles.phaseLabel}>Delivering</p>
            <h2 className={styles.title}>Deliver to Recipient</h2>

            <p className={styles.instrText}>
              Food collected ✓ — now deliver to <strong>{order.recipient_name ?? 'the recipient'}</strong>.
            </p>

            <div className={styles.cashNote}>
              Collect <strong>{fmtRp(order.delivery_fee)}</strong> delivery fee in cash from customer
            </div>

            <button className={styles.acceptBtn} onClick={handleDelivered} disabled={busy}>
              {busy ? 'Updating…' : 'Mark as Delivered ✓'}
            </button>
          </>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <>
            <p className={styles.phaseLabel}>Complete</p>
            <h2 className={styles.title}>Delivery Complete!</h2>
            <p className={styles.instrText}>
              Order <strong>{order.cash_ref}</strong> delivered successfully. Great work!
            </p>
            <button className={styles.acceptBtn} onClick={onDismiss}>Done</button>
          </>
        )}

      </div>
    </div>
  )
}
