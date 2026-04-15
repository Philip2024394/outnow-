import { useState, useEffect, useRef } from 'react'
import styles from './HanggerCartPanel.module.css'

const DELIVERY_FEE = 15000

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `${n.toLocaleString('id-ID')}rp`
  return `${n}rp`
}

function buildWhatsAppMessage(sellerName, cart, address, notes) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total    = subtotal + DELIVERY_FEE
  const ref      = `#HANG_${Date.now().toString().slice(-8)}`

  const lines = cart.map(i => {
    let ln = `• ${i.name} × ${i.qty}`
    if (i.variant) ln += ` (${i.variant})`
    ln += ` — ${formatIDR(i.price * i.qty)}`
    return ln
  })

  const msg = [
    `🛍 *Order from ${sellerName}*`,
    `Indoo Market — ${ref}`,
    '———————————————',
    ...lines,
    '———————————————',
    `🛵 Bike delivery: ~${formatIDR(DELIVERY_FEE)}`,
    `💰 *Est. total: ~${formatIDR(total)}*`,
    address?.trim() ? `📍 Deliver to: ${address.trim()}` : '',
    notes?.trim()   ? `📝 Notes: ${notes.trim()}`         : '',
  ].filter(Boolean).join('\n')

  return { msg, total }
}

export default function HanggerCartPanel({
  cart, onUpdateQty, onClearCart,
  sellerName, sellerWa,
  cartSheetOpen,
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [notes,     setNotes]     = useState('')
  const [address,   setAddress]   = useState('')
  const [locating,  setLocating]  = useState(false)
  const [showAddr,  setShowAddr]  = useState(false)
  const collapseRef = useRef(null)

  const totalQty = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total    = subtotal + DELIVERY_FEE

  // Auto-expand when item added, collapse after 2.5s
  // Don't auto-expand if the full cart sheet is already open
  const prevQtyRef = useRef(totalQty)
  useEffect(() => {
    if (cartSheetOpen) { prevQtyRef.current = totalQty; return }
    if (totalQty > prevQtyRef.current) {
      setExpanded(true)
      clearTimeout(collapseRef.current)
      collapseRef.current = setTimeout(() => setExpanded(false), 2500)
    }
    prevQtyRef.current = totalQty
  }, [totalQty, cartSheetOpen])

  // Collapse panel when cart sheet opens
  useEffect(() => {
    if (cartSheetOpen) setExpanded(false)
  }, [cartSheetOpen])

  useEffect(() => () => clearTimeout(collapseRef.current), [])

  // Hide entirely when cart is empty
  if (cart.length === 0) return null

  function handleUseLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          setAddress(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
        } catch {
          setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } finally { setLocating(false) }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  function handleCheckout() {
    if (!sellerWa) return
    if (!showAddr) { setShowAddr(true); return }
    const { msg } = buildWhatsAppMessage(sellerName, cart, address, notes)
    window.open(
      `https://wa.me/${sellerWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
  }

  return (
    <div
      className={`${styles.cartBadge} ${expanded ? styles.cartBadgeOpen : ''}`}
      onClick={() => {
        setExpanded(e => !e)
        clearTimeout(collapseRef.current)
      }}
    >
      {/* ── Circle badge ── */}
      <div className={styles.cartBadgeTop}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {totalQty > 0 && <span className={styles.cartCount}>{totalQty}</span>}
      </div>

      {/* ── Expanded dropdown ── */}
      {expanded && cart.length > 0 && (
        <div className={styles.cartDropdown} onClick={e => e.stopPropagation()}>

          {/* Items */}
          {cart.map(item => (
            <div key={`${item.id}-${item.variant ?? ''}`} className={styles.cartRow}>
              <span className={styles.cartQty}>{item.qty}×</span>
              <span className={styles.cartName}>
                {item.name}
                {item.variant && <span className={styles.cartVariant}> · {item.variant}</span>}
              </span>
              <span className={styles.cartPrice}>{formatIDR(item.price * item.qty)}</span>
              <div className={styles.cartQtyBtns}>
                <button
                  className={styles.cartQtyBtn}
                  onClick={() => onUpdateQty(item.id, item.variant, item.qty + 1)}
                >+</button>
                <button
                  className={`${styles.cartQtyBtn} ${item.qty === 1 ? styles.cartQtyBtnDel : ''}`}
                  onClick={() => onUpdateQty(item.id, item.variant, item.qty - 1)}
                >
                  {item.qty === 1 ? '🗑' : '−'}
                </button>
              </div>
            </div>
          ))}

          <div className={styles.cartDivider} />

          {/* Delivery */}
          <div className={styles.cartMeta}>
            <span className={styles.cartMetaIcon}>🛵</span>
            <span className={styles.cartMetaLabel}>Bike delivery</span>
            <span className={styles.cartMetaValue}>~{formatIDR(DELIVERY_FEE)}</span>
          </div>

          <div className={styles.cartDivider} />

          {/* Total */}
          <div className={styles.cartTotal}>
            <span>Est. total</span>
            <span className={styles.cartTotalVal}>{formatIDR(total)}</span>
          </div>

          {/* Notes */}
          <input
            className={styles.notesInput}
            placeholder="📝 Notes or special requests…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onClick={e => e.stopPropagation()}
            maxLength={160}
          />

          {/* Address — revealed on first checkout tap */}
          {showAddr && (
            <div className={styles.addrWrap} onClick={e => e.stopPropagation()}>
              <input
                className={styles.addrInput}
                placeholder="📍 Delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                autoFocus
              />
              <button
                className={styles.locateBtn}
                onClick={handleUseLocation}
                disabled={locating}
                title="Use my location"
              >
                {locating ? '…' : '🎯'}
              </button>
            </div>
          )}

          {/* Checkout */}
          <button className={styles.orderBtn} onClick={handleCheckout} disabled={!sellerWa}>
            {showAddr ? '📲 Send Order via WhatsApp' : 'Checkout →'}
          </button>

          {/* Clear cart */}
          <button className={styles.clearBtn} onClick={() => { onClearCart(); setExpanded(false) }}>
            Clear cart
          </button>
        </div>
      )}
    </div>
  )
}
