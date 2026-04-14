/**
 * DriverSearchSheet
 *
 * Phases:
 *  1. "searching"  — animated pulsing rings while findingdrivers
 *  2. "found"      — driver card + order summary + confirm button
 *  3. "no_drivers" — no available drivers message + retry
 *  4. "confirming" — spinner while creating the order
 */
import { useState, useEffect, useRef } from 'react'
import { searchFoodDrivers, createFoodOrder } from '@/services/foodOrderService'
import { formatIDR } from '@/services/giftService'
import { useAuth } from '@/hooks/useAuth'
import styles from './DriverSearchSheet.module.css'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// Images 0–3 loop while searching. Images 4–5 play once (in order) when driver
// is found, acting as a cinematic bridge before the driver card appears.
const NIGHT_LOOP_IMAGES = [
  'https://ik.imagekit.io/nepgaxllc/Indonesia%20at%20night_%20map%20transforms%20to%20city.png',
  'https://ik.imagekit.io/nepgaxllc/Untitledfsdf.png?updatedAt=1775555383465',
  'https://ik.imagekit.io/nepgaxllc/Night%20view%20of%20Kota%20Tua%20Jakarta.png',
  'https://ik.imagekit.io/nepgaxllc/Tropical%20night%20road%20by%20the%20sea.png',
]
const NIGHT_FOUND_IMAGES = [
  'https://ik.imagekit.io/nepgaxllc/Motorcyclist%20heading%20towards%20Borobudur%20at%20night.png', // driver walking to bike
  'https://ik.imagekit.io/nepgaxllc/Night%20ride%20towards%20Borobudur%20temple.png',               // driver riding
]
// Combined for index-based rendering
const NIGHT_ALL_IMAGES = [...NIGHT_LOOP_IMAGES, ...NIGHT_FOUND_IMAGES]

function isNightWIB() {
  const hourWIB = (new Date().getUTCHours() + 7) % 24
  return hourWIB >= 18 || hourWIB < 6
}

export default function DriverSearchSheet({
  open,
  restaurant,
  items,
  deliveryFee,
  deliveryDistanceKm,
  comment,
  onConfirmed,   // (order) => void
  onClose,
  _forcePhase,   // dev-only: skip straight to a phase
  _forceDriver,  // dev-only: pre-fill driver for 'found' phase
}) {
  const { user } = useAuth()
  const [phase,    setPhase]   = useState('searching')
  const [driver,   setDriver]  = useState(_forceDriver ?? null)
  const [error,    setError]   = useState(null)
  const [foundSec, setFoundSec] = useState(null)
  const searchStart   = useRef(null)
  const slideshowRef  = useRef(null)
  const cinematicRefs = useRef([])

  // Single index — all 6 image divs always in DOM, only active one is opacity 1.
  // CSS transition handles the cross-fade automatically — no slot swapping needed.
  const [bgIdx, setBgIdx] = useState(0)

  // In dev/demo always show night slideshow so all images are testable
  const nightMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true' || isNightWIB()

  const subtotal = items?.reduce((s, i) => s + i.price * i.qty, 0) ?? 0
  const total    = subtotal + (deliveryFee ?? 0)

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(slideshowRef.current)
    cinematicRefs.current.forEach(clearTimeout)
  }, [])

  // Run driver search when sheet opens
  useEffect(() => {
    if (!open) return
    if (_forcePhase) { setPhase(_forcePhase); if (_forceDriver) setDriver(_forceDriver); return }
    setPhase('searching')
    setDriver(null)
    setError(null)
    setFoundSec(null)
    setBgIdx(0)
    clearInterval(slideshowRef.current)
    cinematicRefs.current.forEach(clearTimeout)
    cinematicRefs.current = []
    searchStart.current = Date.now()
    runSearch()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Loop images 0–3 every 3s while searching
  useEffect(() => {
    if (phase !== 'searching' || !nightMode) return
    slideshowRef.current = setInterval(() => {
      setBgIdx(i => (i + 1) % NIGHT_LOOP_IMAGES.length)
    }, 3000)
    return () => clearInterval(slideshowRef.current)
  }, [phase, nightMode])

  async function runSearch() {
    const [drivers] = await Promise.all([
      searchFoodDrivers(restaurant?.lat, restaurant?.lng),
      new Promise(r => setTimeout(r, 8000)),
    ])
    const available = drivers.filter(d => !d.driver_busy)
    if (available.length === 0) { setPhase('no_drivers'); return }

    const elapsed = Math.round((Date.now() - (searchStart.current ?? Date.now())) / 1000)
    setFoundSec(elapsed)
    setDriver(available[0])

    if (nightMode) {
      // Stop loop, play cinematic: image 4 (3s) → image 5 (3s) → found
      clearInterval(slideshowRef.current)
      setBgIdx(4)
      cinematicRefs.current = [
        setTimeout(() => setBgIdx(5),        3000),
        setTimeout(() => setPhase('found'),  6000),
      ]
    } else {
      setPhase('found')
    }
  }

  async function handleConfirm() {
    if (!driver) return
    setPhase('confirming')
    try {
      const order = await createFoodOrder({
        restaurant,
        items,
        driver,
        sender:              user,
        deliveryFee:         deliveryFee ?? 0,
        deliveryDistanceKm:  deliveryDistanceKm ?? null,
        driverDistanceKm:    driver.distKm ?? null,
        comment,
      })
      onConfirmed(order)
    } catch (err) {
      setError(err?.message || 'Could not place order. Please try again.')
      setPhase('found')
    }
  }

  if (!open) return null

  const foundBg = phase === 'found'
    ? (nightMode ? styles.sheetFoundNight : styles.sheetFound)
    : ''

  return (
    <div className={styles.backdrop}>
      <div className={`${styles.sheet} ${foundBg}`}>

        {/* Night slideshow — all 6 images always in DOM, active one = opacity 1 */}
        {phase === 'searching' && nightMode && (
          <div className={styles.nightBgContainer}>
            {NIGHT_ALL_IMAGES.map((img, i) => (
              <div
                key={i}
                className={styles.nightBgSlot}
                style={{
                  backgroundImage: `url("${img}")`,
                  opacity: i === bgIdx ? 1 : 0,
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.handle} />

        {/* ── SEARCHING ── */}
        {phase === 'searching' && (
          <>
            <button className={styles.backBtn} onClick={onClose}>← Back</button>
            <div className={styles.searchingWrap}>
              <div className={styles.pingWrap}>
                <div className={styles.pingRing} />
                <div className={styles.pingRing} style={{ animationDelay: '0.6s' }} />
                <div className={styles.pingRing} style={{ animationDelay: '1.2s' }} />
                <div className={styles.pingCenter}>
                  <img
                    src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531"
                    alt=""
                    className={styles.pingCenterImg}
                  />
                </div>
              </div>
              <h3 className={styles.searchTitle}>Finding your driver</h3>
              <p className={styles.searchSub}>Near {restaurant?.name}…</p>
            </div>
          </>
        )}

        {/* ── DRIVER FOUND ── */}
        {phase === 'found' && driver && (
          <>
            <div className={styles.foundHeader}>
              <div className={styles.foundHeaderText}>
                <h3 className={styles.foundTitle}>Driver Located</h3>
                <p className={styles.foundSub}>Located in {foundSec ?? '—'} seconds · On the way…</p>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            {/* Driver card */}
            <div className={styles.driverCard}>

              {/* Top row: photo + name/rating + ETA */}
              <div className={styles.driverTop}>
                <div className={styles.driverAvatar}>
                  {driver.photo_url
                    ? <img src={driver.photo_url} alt={driver.display_name} className={styles.driverAvatarImg} />
                    : <span className={styles.driverAvatarEmoji}>🏍️</span>}
                </div>
                <div className={styles.driverInfo}>
                  <span className={styles.driverName}>{driver.display_name?.split(' ')[0]}</span>
                  <span className={styles.driverRating}>
                    ⭐ {driver.rating?.toFixed(1)} <span className={styles.driverRatingCount}>from {(driver.total_trips ?? 0).toLocaleString()} rides</span>
                  </span>
                  {driver.acceptance_rate != null && (
                    <span className={styles.driverAcceptance}>{driver.acceptance_rate}% acceptance rate</span>
                  )}
                </div>
                <div className={styles.driverEtaBox}>
                  <span className={styles.driverEtaNum}>~{driver.etaMin}</span>
                  <span className={styles.driverEtaLabel}>min away</span>
                </div>
              </div>

              {/* Vehicle + plate row */}
              <div className={styles.driverVehicleRow}>
                <div className={styles.driverVehicleInfo}>
                  <span className={styles.driverVehicleType}>🏍️ {driver.vehicle_model}</span>
                  <span className={styles.driverVehicleColor}>{driver.vehicle_color}</span>
                </div>
                <div className={styles.driverPlate}>{driver.plate_prefix}</div>
              </div>

              {/* Badges row */}
              <div className={styles.driverBadges}>
                {driver.years_experience != null && (
                  <span className={styles.badge}>🏅 {driver.years_experience}+ yrs experience</span>
                )}
                <span className={styles.badge}>🛵 {(driver.total_trips ?? 0).toLocaleString()} trips</span>
                {driver.languages?.length > 0 && (
                  <span className={styles.badge}>
                    {driver.languages.map(l =>
                      l === 'id' ? '🇮🇩' : l === 'en' ? '🇬🇧' : l
                    ).join(' ')}
                  </span>
                )}
              </div>

            </div>

            {/* Order summary */}
            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>📍 Restaurant</span>
                <span className={styles.summaryVal}>{restaurant?.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>🛍️ Items</span>
                <span className={styles.summaryVal}>
                  {items?.map(i => `${i.qty}× ${i.name}`).join(', ')}
                </span>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryVal}>{fmtRp(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>🏍️ Delivery fee</span>
                <span className={styles.summaryVal}>{formatIDR(deliveryFee)}</span>
              </div>
              <div className={styles.summaryRowTotal}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalVal}>{fmtRp(total)}</span>
              </div>
            </div>

            <div className={styles.cashNote}>
              🏦 You will transfer the full amount to the restaurant — next step after confirming
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button className={styles.confirmBtn} onClick={handleConfirm}>
              Place Order →
            </button>
          </>
        )}

        {/* ── CONFIRMING ── */}
        {phase === 'confirming' && (
          <div className={styles.searchingWrap}>
            <div className={styles.spinner} />
            <h3 className={styles.searchTitle}>Placing your order…</h3>
            <p className={styles.searchSub}>Notifying {driver?.display_name} and {restaurant?.name}</p>
          </div>
        )}

        {/* ── NO DRIVERS ── */}
        {phase === 'no_drivers' && (
          <div className={styles.noDriversWrap}>
            <span className={styles.noDriversEmoji}>😔</span>
            <h3 className={styles.searchTitle}>No drivers nearby</h3>
            <p className={styles.searchSub}>No available drivers near {restaurant?.name} right now.</p>
            <button className={styles.retryBtn} onClick={runSearch}>Try Again</button>
            <button className={styles.cancelLink} onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
