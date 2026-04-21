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
import { useState, useEffect, useRef } from 'react'
import { updateFoodOrderStatus, confirmPickupWithCode, broadcastOrderToNextDriver } from '@/services/foodOrderService'
import { verifyQRScan } from '@/services/qrCodeService'
import DriverWarningScreen from './DriverWarningScreen'
import styles from './DriverFoodOrderAlert.module.css'

const ACCEPT_TIMEOUT = 45

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

export default function DriverFoodOrderAlert({ order, driverId, onDismiss }) {
  const [phase,       setPhase]       = useState('incoming')
  const [secondsLeft, setSecondsLeft] = useState(ACCEPT_TIMEOUT)
  const [pickupCode,  setPickupCode]  = useState('')
  const [codeError,   setCodeError]   = useState(null)
  const [busy,        setBusy]        = useState(false)
  const [scanMode,    setScanMode]    = useState('qr')
  const scannerRef = useRef(null)

  // QR Scanner setup
  useEffect(() => {
    if (phase !== 'pickup' || scanMode !== 'qr') return
    let scanner = null
    ;(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // QR scanned — verify it
            setBusy(true)
            setCodeError(null)
            const valid = await verifyQRScan(decodedText, order.restaurant_id)
            if (valid) {
              await updateFoodOrderStatus(order.id, 'picked_up')
              scanner.stop().catch(() => {})
              setPhase('delivering')
            } else {
              setCodeError('Invalid QR code — wrong restaurant')
            }
            setBusy(false)
          },
          () => {} // ignore scan errors
        )
      } catch (err) {
        // Camera not available — fall back to text
        setScanMode('text')
      }
    })()
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {})
    }
  }, [phase, scanMode]) // eslint-disable-line react-hooks/exhaustive-deps
  const [declinedBy,  setDeclinedBy]  = useState(order?.declined_by ?? [])
  const [warningType, setWarningType] = useState(null) // null | 'missed' | 'declined'

  const items = Array.isArray(order?.items) ? order.items : []

  const totalKm = ((order?.driver_distance_km ?? 0) + (order?.delivery_distance_km ?? 0))
  const journeyLabel = totalKm > 0 ? `${totalKm.toFixed(1)} km total journey` : null

  useEffect(() => {
    if (phase !== 'incoming') return
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(id); handleBroadcast('missed'); return 0 }
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

  async function handleBroadcast(type = 'declined') {
    const next = [...declinedBy, driverId]
    setDeclinedBy(next)
    await broadcastOrderToNextDriver(
      order.id,
      order.restaurant_lat,
      order.restaurant_lng,
      next,
    )
    setWarningType(type)
  }

  const handleDecline = () => handleBroadcast('declined')

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
  // Interpolate green (#8DC63F) → dark red (#7F1D1D) as pct drops 100→0
  const r = Math.round(141 + (127 - 141) * (1 - pct / 100))
  const g = Math.round(198 + (29  - 198) * (1 - pct / 100))
  const b = Math.round(63  + (29  - 63)  * (1 - pct / 100))
  const barColor = `rgb(${r},${g},${b})`

  if (warningType) {
    return (
      <DriverWarningScreen
        driverId={driverId}
        warningType={warningType}
        onDismiss={onDismiss}
      />
    )
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.handle} />

        {/* ── INCOMING ── */}
        {phase === 'incoming' && (
          <>
            <div className={styles.body}>
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
                    <span className={styles.restaurantNote}>Pickup location{journeyLabel ? ` · ${journeyLabel}` : ''}</span>
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
            </div>

            <div className={styles.footer}>
              <div className={styles.actions}>
                <button className={styles.declineBtn} onClick={handleDecline} disabled={busy}>
                  Decline
                </button>
                <button className={styles.acceptBtn} onClick={handleAccept} disabled={busy}>
                  Accept Order
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── ACTIVE — heading to restaurant ── */}
        {phase === 'active' && (
          <>
            <div className={styles.body}>
              <p className={styles.phaseLabel}>On the way</p>
              <h2 className={styles.title}>Head to Restaurant</h2>

              <div className={styles.section}>
                <div className={styles.restaurantRow}>
                  <div className={styles.restaurantIconWrap}>📍</div>
                  <div className={styles.restaurantInfo}>
                    <span className={styles.restaurantName}>{order.restaurant_name}</span>
                    <span className={styles.restaurantNote}>Show this order to restaurant staff{journeyLabel ? ` · ${journeyLabel}` : ''}</span>
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
            </div>

            <div className={styles.footer}>
              <button className={`${styles.acceptBtn} ${styles.acceptBtnStill}`} onClick={handleAtRestaurant}>
                I'm at the Restaurant
              </button>
            </div>
          </>
        )}

        {/* ── PICKUP — scan QR or enter code ── */}
        {phase === 'pickup' && (
          <>
            <div className={styles.body}>
              <p className={styles.phaseLabel}>Pickup</p>
              <h2 className={styles.title}>{scanMode === 'qr' ? 'Scan Restaurant QR' : 'Enter Pickup Code'}</h2>

              {scanMode === 'qr' ? (
                <>
                  <p className={styles.instrText}>
                    Point your camera at the <strong>QR code on the restaurant counter</strong>.
                  </p>
                  <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }} />
                  {codeError && <p className={styles.codeError}>{codeError}</p>}
                  <button onClick={() => setScanMode('text')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0' }}>
                    Can't scan? Enter code manually
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.instrText}>
                    Ask restaurant staff for the <strong>6-character pickup code</strong>.
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
                  <button onClick={() => setScanMode('qr')} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0' }}>
                    Scan QR code instead
                  </button>
                </>
              )}
            </div>

            <div className={styles.footer}>
              {scanMode === 'text' && (
                <button
                  className={`${styles.acceptBtn} ${styles.acceptBtnStill}`}
                  onClick={handleConfirmPickup}
                  disabled={busy || pickupCode.length < 6}
                >
                  {busy ? 'Verifying…' : 'Confirm Pickup'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── DELIVERING ── */}
        {phase === 'delivering' && (
          <>
            <div className={styles.body}>
              <p className={styles.phaseLabel}>Delivering</p>
              <h2 className={styles.title}>Deliver to Recipient</h2>

              <p className={styles.instrText}>
                Food collected ✓ — now deliver to <strong>{order.recipient_name ?? 'the recipient'}</strong>.
              </p>

              <div className={styles.cashNote}>
                Collect <strong>{fmtRp(order.delivery_fee)}</strong> delivery fee in cash from customer
              </div>
            </div>

            <div className={styles.footer}>
              <button className={`${styles.acceptBtn} ${styles.acceptBtnStill}`} onClick={handleDelivered} disabled={busy}>
                {busy ? 'Updating…' : 'Mark as Delivered ✓'}
              </button>
            </div>
          </>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <>
            <div className={styles.body}>
              <p className={styles.phaseLabel}>Complete</p>
              <h2 className={styles.title}>Delivery Complete!</h2>
              <p className={styles.instrText}>
                Order <strong>{order.cash_ref}</strong> delivered successfully. Great work!
              </p>
            </div>

            <div className={styles.footer}>
              <button className={`${styles.acceptBtn} ${styles.acceptBtnStill}`} onClick={onDismiss}>Done</button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
