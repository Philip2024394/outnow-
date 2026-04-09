import { useState } from 'react'
import styles from './HanggerCartSheet.module.css'

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `${n.toLocaleString('id-ID')}rp`
  return `${n}rp`
}

const DELIVERY_OPTIONS = [
  { id: 'bike',     icon: '🛵', label: 'Bike',     fee: 15000, note: 'Same city · 1-2 hrs'     },
  { id: 'car',      icon: '🚗', label: 'Car',      fee: 30000, note: 'Same city · 30-60 min'   },
  { id: 'standard', icon: '📦', label: 'Courier',  fee: 20000, note: '3-5 business days'       },
  { id: 'collect',  icon: '🤝', label: 'Pick Up',  fee: 0,     note: 'Collect from seller'     },
]

function buildWhatsAppMessage(sellerName, cart, deliveryId, address, notes) {
  const opt      = DELIVERY_OPTIONS.find(d => d.id === deliveryId) ?? DELIVERY_OPTIONS[0]
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total    = subtotal + opt.fee
  const ref      = `#HANG_${Date.now().toString().slice(-8)}`

  const lines = cart.map(i => {
    let ln = `• ${i.name} × ${i.qty}`
    if (i.variant) ln += ` (${i.variant})`
    ln += ` — ${formatIDR(i.price * i.qty)}`
    return ln
  })

  const msg = [
    `🛍 *Order from ${sellerName}*`,
    `Hangger Market — ${ref}`,
    '———————————————',
    ...lines,
    '———————————————',
    `${opt.icon} ${opt.label}: ${opt.fee > 0 ? `~${formatIDR(opt.fee)}` : 'Free'}`,
    `💰 *Est. total: ~${formatIDR(total)}*`,
    address?.trim() ? `📍 Deliver to: ${address.trim()}` : '',
    notes?.trim()   ? `📝 Notes: ${notes.trim()}`         : '',
  ].filter(Boolean).join('\n')

  return { msg, ref, total }
}

export default function HanggerCartSheet({
  open, onClose,
  cart, onUpdateQty, onClearCart,
  sellerName, sellerWa,
}) {
  const [delivery,   setDelivery]   = useState('bike')
  const [address,    setAddress]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [showAddr,   setShowAddr]   = useState(false)
  const [locating,   setLocating]   = useState(false)

  const opt      = DELIVERY_OPTIONS.find(d => d.id === delivery) ?? DELIVERY_OPTIONS[0]
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total    = subtotal + opt.fee
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

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
    const { msg } = buildWhatsAppMessage(sellerName, cart, delivery, address, notes)
    window.open(
      `https://wa.me/${sellerWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
  }

  if (!open || cart.length === 0) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>Your Cart</span>
            <span className={styles.count}>{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>

          {/* Items */}
          <div className={styles.items}>
            {cart.map(item => (
              <div key={`${item.id}-${item.variant ?? ''}`} className={styles.item}>
                {item.image
                  ? <img src={item.image} alt={item.name} className={styles.itemImg} />
                  : <div className={styles.itemImgPlaceholder}>📦</div>
                }
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.variant && <span className={styles.itemVariant}>{item.variant}</span>}
                  <span className={styles.itemPrice}>{formatIDR(item.price * item.qty)}</span>
                </div>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => onUpdateQty(item.id, item.variant, item.qty - 1)}
                  >−</button>
                  <span className={styles.qtyNum}>{item.qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => onUpdateQty(item.id, item.variant, item.qty + 1)}
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery options */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Delivery method</div>
            <div className={styles.deliveryGrid}>
              {DELIVERY_OPTIONS.map(o => (
                <button
                  key={o.id}
                  className={[styles.deliveryBtn, delivery === o.id ? styles.deliveryBtnActive : ''].join(' ')}
                  onClick={() => setDelivery(o.id)}
                >
                  <span className={styles.dIcon}>{o.icon}</span>
                  <span className={styles.dLabel}>{o.label}</span>
                  <span className={styles.dNote}>{o.note}</span>
                  <span className={styles.dFee}>{o.fee > 0 ? `+${formatIDR(o.fee)}` : 'Free'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Special notes or requests</div>
            <textarea
              className={styles.notesInput}
              placeholder="e.g. leave at door, gift wrap, allergies…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Address — revealed after first checkout tap */}
          {showAddr && opt.id !== 'collect' && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Delivery address</div>
              <textarea
                className={styles.addrInput}
                placeholder="Enter your full address…"
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                autoFocus
              />
              <button className={styles.gpsBtn} onClick={handleUseLocation} disabled={locating}>
                {locating ? '📡 Detecting…' : '📍 Use my location'}
              </button>
            </div>
          )}

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>{opt.icon} {opt.label}</span>
              <span>{opt.fee > 0 ? `~${formatIDR(opt.fee)}` : 'Free'}</span>
            </div>
            <div className={[styles.totalRow, styles.grandRow].join(' ')}>
              <span>Est. total</span>
              <span className={styles.grandVal}>{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.clearBtn} onClick={() => { onClearCart(); onClose() }}>
            Clear cart
          </button>
          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={!sellerWa}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {showAddr ? 'Send Order via WhatsApp' : 'Checkout'}
          </button>
        </div>

      </div>
    </div>
  )
}
