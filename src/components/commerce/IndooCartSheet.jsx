import { useState, useMemo } from 'react'
import { PARCEL_CARRIERS, CARGO_CARRIERS, EXPORT_CARRIERS } from '@/services/commissionService'
import { validateVoucher, redeemVoucher } from '@/services/voucherService'
import { calculateCombinedShipping, fmtWeight } from '@/services/deliveryRateService'
import styles from './IndooCartSheet.module.css'

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

// Bike delivery — city only, per-km pricing, no Safe Trade
const BIKE_DELIVERY = {
  id: 'bike', type: 'indoo_ride', icon: '🛵', label: 'Bike Delivery',
  note: 'Same city · 1-2 hrs · per km pricing',
  baseFare: 15000, perKm: 3000, cityOnly: true, safeTrade: false,
}

// Pick up — always free
const PICKUP_OPTION = {
  id: 'collect', type: 'collect', icon: '🤝', label: 'Pick Up',
  note: 'Collect from seller', fee: 0, safeTrade: true,
}

export default function IndooCartSheet({
  open, onClose,
  cart, onUpdateQty, onClearCart,
  sellerName, sellerWa,
  product,
  products = [],
  sellerCity = '',
  buyerCity = '',
  onOrderViaChat,
}) {
  const [selectedDelivery, setSelectedDelivery] = useState(null) // auto-set below
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false)
  const [address, setAddress]     = useState('')
  const [notes, setNotes]         = useState('')
  const [showAddr, setShowAddr]   = useState(false)
  const [locating, setLocating]   = useState(false)
  const [showMore, setShowMore]   = useState(false)
  const [dropship, setDropship]   = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherResult, setVoucherResult] = useState(null) // { valid, discount, error }
  const [dropshipAddr, setDropshipAddr] = useState('')
  const [locatingDrop, setLocatingDrop] = useState(false)

  // Build delivery options from seller's product config
  const deliveryConfig = product?.deliveryPricing ?? {}
  const priceIncluded = deliveryConfig.priceIncluded ?? false
  const carrierPrices = deliveryConfig.carriers ?? {}
  const customCarriers = deliveryConfig.customCarriers ?? []

  // Build all available delivery options sorted by price (cheapest first)
  const deliveryOptions = useMemo(() => {
    const options = []

    // Free delivery if price included
    if (priceIncluded) {
      options.push({
        id: 'free', type: 'free', icon: '🎁', label: 'Free Delivery',
        note: 'Included in product price', fee: 0, safeTrade: true,
      })
    }

    // Seller-configured parcel carriers
    PARCEL_CARRIERS.forEach(c => {
      if (carrierPrices[c.type] !== undefined) {
        options.push({
          id: c.type, type: c.type, icon: '📦', label: c.label,
          logo: c.logo, deliveryDays: c.deliveryDays,
          note: c.deliveryDays || 'Nationwide · 3-5 days', fee: carrierPrices[c.type], safeTrade: true,
        })
      }
    })

    // Seller-configured cargo carriers
    CARGO_CARRIERS.forEach(c => {
      if (carrierPrices[c.type] !== undefined) {
        options.push({
          id: c.type, type: c.type, icon: '🚛', label: c.label,
          logo: c.logo, deliveryDays: c.deliveryDays,
          note: c.deliveryDays || 'Large items · 5-10 days', fee: carrierPrices[c.type], safeTrade: true,
        })
      }
    })

    // Seller-configured export carriers
    EXPORT_CARRIERS.forEach(c => {
      if (carrierPrices[c.type] !== undefined) {
        options.push({
          id: c.type, type: c.type, icon: '✈️', label: c.label,
          logo: c.logo, deliveryDays: c.deliveryDays,
          note: c.deliveryDays || 'International · 7-14 days', fee: carrierPrices[c.type], safeTrade: true,
        })
      }
    })

    // Custom carriers from seller
    customCarriers.forEach((c, i) => {
      options.push({
        id: `custom_${i}`, type: `custom_${i}`, icon: '📬', label: c.name,
        note: c.category === 'cargo' ? 'Large items' : 'Parcels',
        fee: c.price ?? 0, safeTrade: true,
      })
    })

    // Always add pickup
    options.push(PICKUP_OPTION)

    // Sort by fee (cheapest first), free always on top
    options.sort((a, b) => a.fee - b.fee)

    return options
  }, [priceIncluded, carrierPrices, customCarriers])

  // Combined shipping calculation — weight-based, one fee for all items
  const shippingCalc = useMemo(() => {
    if (cart.length === 0) return null
    return calculateCombinedShipping(cart, products, sellerCity, buyerCity)
  }, [cart, products, sellerCity, buyerCity])

  // Auto-select cheapest on first render
  const cheapest = deliveryOptions[0] ?? PICKUP_OPTION
  const selected = selectedDelivery
    ? (deliveryOptions.find(d => d.id === selectedDelivery) ?? cheapest)
    : cheapest

  const isBike = selected.id === 'bike'
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  // Use weight-based rate when available, otherwise fall back to seller's set price
  const deliveryFee = selected.id === 'collect' ? 0
    : selected.id === 'bike' ? BIKE_DELIVERY.baseFare
    : (shippingCalc?.cheapest?.total ?? selected.fee ?? 0)

  const total = subtotal + deliveryFee
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  // Safe Trade available for this product (not for bike delivery)
  const safeTrade = product?.safeTrade ?? {}
  const safeTradeAvailable = safeTrade.enabled && selected.safeTrade

  // How many options to show before "Show more"
  const visibleCount = 3
  const hasMore = deliveryOptions.length > visibleCount
  const visibleOptions = showMore ? deliveryOptions : deliveryOptions.slice(0, visibleCount)

  function handleUseLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
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

  function handleUseLocationDrop() {
    if (!navigator.geolocation) return
    setLocatingDrop(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          setDropshipAddr(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
        } catch {
          setDropshipAddr(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } finally { setLocatingDrop(false) }
      },
      () => setLocatingDrop(false),
      { timeout: 8000 }
    )
  }

  function handleCheckout() {
    if (!showAddr && selected.id !== 'collect') { setShowAddr(true); return }

    // For in-app chat order
    if (onOrderViaChat) {
      onOrderViaChat({
        product,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, variant: i.variant })),
        subtotal,
        deliveryFee,
        total,
        notes: notes.trim() || '',
        sellerName,
      })
      onClose()
      return
    }

    // Fallback: WhatsApp order
    if (!sellerWa) return
    const ref = `#HANG_${Date.now().toString().slice(-8)}`
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
      `${selected.icon} ${selected.label}: ${deliveryFee > 0 ? `~${formatIDR(deliveryFee)}` : 'Free'}`,
      `💰 *Est. total: ~${formatIDR(total)}*`,
      address?.trim() ? `📍 Buyer address: ${address.trim()}` : '',
      dropship && dropshipAddr?.trim() ? `📦 Dropship to: ${dropshipAddr.trim()}` : '',
      dropship ? '🔄 *Dropship order* — ship directly to customer address above' : '',
      notes?.trim() ? `📝 Notes: ${notes.trim()}` : '',
      isBike ? '⚠️ Bike delivery — direct bank transfer required (no Safe Trade)' : '',
    ].filter(Boolean).join('\n')

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
                  <button className={styles.qtyBtn} onClick={() => onUpdateQty(item.id, item.variant, item.qty - 1)}>−</button>
                  <span className={styles.qtyNum}>{item.qty}</span>
                  <button className={styles.qtyBtn} onClick={() => onUpdateQty(item.id, item.variant, item.qty + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Delivery section ── */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Delivery</div>

            {/* Selected delivery — compact card with logo + days + price */}
            <button
              className={`${styles.deliveryBtn} ${styles.deliveryBtnActive}`}
              onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
            >
              <div className={styles.dTop}>
                {selected.logo ? (
                  <img src={selected.logo} alt={selected.label} className={styles.dLogo} />
                ) : (
                  <span className={styles.dIcon}>{selected.icon || '📦'}</span>
                )}
                <div className={styles.dInfo}>
                  <span className={styles.dLabel}>{selected.label}</span>
                  <span className={styles.dNote}>{selected.deliveryDays || selected.note}</span>
                </div>
                <span className={styles.dFee}>
                  {selected.fee === 0 || selected.id === 'collect' ? <span className={styles.dFree}>FREE</span> : formatIDR(selected.fee ?? deliveryFee)}
                </span>
              </div>
              <span className={styles.dCheapest}>{showDeliveryOptions ? 'Hide options' : 'Change delivery'}</span>
            </button>

            {/* Expanded delivery options — only when Change is tapped */}
            {showDeliveryOptions && (
              <>
                {/* Pick Up */}
                <button
                  className={`${styles.pickupBtn} ${selected.id === 'collect' ? styles.pickupBtnActive : ''}`}
                  onClick={() => { setSelectedDelivery('collect'); setShowDeliveryOptions(false) }}
                >
                  <div className={styles.pickupContent}>
                    <div className={styles.pickupInfo}>
                      <span className={styles.pickupLabel}>Free Pick Up</span>
                      <span className={styles.pickupNote}>Collect from seller</span>
                    </div>
                    <span className={styles.pickupFree}>FREE</span>
                  </div>
                </button>

                {/* Cheapest / recommended */}
                {deliveryOptions.length > 0 && cheapest.id !== 'collect' && (
                  <div className={styles.recommendedDelivery}>
                    <button
                      className={`${styles.deliveryBtn} ${selected.id === cheapest.id ? styles.deliveryBtnActive : ''}`}
                      onClick={() => { setSelectedDelivery(cheapest.id); setShowDeliveryOptions(false) }}
                    >
                      <div className={styles.dTop}>
                        <span className={styles.dIcon}>{cheapest.icon}</span>
                        <div className={styles.dInfo}>
                          <span className={styles.dLabel}>{cheapest.label}</span>
                          <span className={styles.dNote}>{cheapest.note}</span>
                        </div>
                        <span className={styles.dFee}>
                          {cheapest.fee === 0 ? <span className={styles.dFree}>FREE</span> : formatIDR(cheapest.fee)}
                        </span>
                      </div>
                      <span className={styles.dCheapest}>Cheapest option</span>
                    </button>
                  </div>
                )}

            {/* Bike delivery */}
            <button
              className={`${styles.deliveryBtn} ${styles.bikeBtn} ${selected.id === 'bike' ? styles.deliveryBtnActive : ''}`}
              onClick={() => { setSelectedDelivery('bike'); setShowDeliveryOptions(false) }}
            >
              <div className={styles.dTop}>
                <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="Bike" className={styles.bikeIcon} />
                <div className={styles.dInfo}>
                  <span className={styles.dLabel}>{BIKE_DELIVERY.label}</span>
                  <span className={styles.dNote}>{BIKE_DELIVERY.note}</span>
                </div>
                <span className={styles.dFee}>~{formatIDR(BIKE_DELIVERY.baseFare)}</span>
              </div>
            </button>

            {/* Other options */}
            {visibleOptions.filter(d => d.id !== cheapest.id && d.id !== 'collect').map(opt => (
              <button
                key={opt.id}
                className={`${styles.deliveryBtn} ${selected.id === opt.id ? styles.deliveryBtnActive : ''}`}
                onClick={() => { setSelectedDelivery(opt.id); setShowDeliveryOptions(false) }}
              >
                <div className={styles.dTop}>
                  <span className={styles.dIcon}>{opt.icon}</span>
                  <div className={styles.dInfo}>
                    <span className={styles.dLabel}>{opt.label}</span>
                    <span className={styles.dNote}>{opt.note}</span>
                  </div>
                  <span className={styles.dFee}>
                    {opt.fee === 0 ? <span className={styles.dFree}>FREE</span> : formatIDR(opt.fee)}
                  </span>
                </div>
              </button>
            ))}

            {hasMore && !showMore && (
              <button className={styles.showMoreBtn} onClick={() => setShowMore(true)}>
                + {deliveryOptions.length - visibleCount} more option{deliveryOptions.length - visibleCount > 1 ? 's' : ''}
              </button>
            )}
              </>
            )}
          </div>

          {/* Bike warning banner */}
          {isBike && (
            <div className={styles.bikeBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Bike delivery requires direct bank transfer with screenshot upload. Safe Trade (PayPal/Escrow) is not available for bike orders.</span>
            </div>
          )}

          {/* Safe Trade badge — shown for non-bike deliveries when seller offers it */}
          {safeTradeAvailable && !isBike && (
            <div className={styles.safeTradeBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Safe Trade available — PayPal or Escrow buyer protection at checkout</span>
            </div>
          )}

          {/* Notes */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Special notes or requests</div>
            <textarea
              className={styles.notesInput}
              placeholder="e.g. leave at door, gift wrap, allergies..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Address — revealed after first checkout tap */}
          {showAddr && selected.id !== 'collect' && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Your address</div>
              <textarea
                className={styles.addrInput}
                placeholder="Enter your full address..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                autoFocus
              />
              <button className={styles.gpsBtn} onClick={handleUseLocation} disabled={locating}>
                {locating ? '📡 Detecting...' : '📍 Use my location'}
              </button>

              {/* Dropship toggle */}
              <div className={styles.dropshipToggle} onClick={() => setDropship(v => !v)}>
                <div className={`${styles.dropshipCheck} ${dropship ? styles.dropshipCheckOn : ''}`}>
                  {dropship && <span>✓</span>}
                </div>
                <div className={styles.dropshipInfo}>
                  <span className={styles.dropshipLabel}>Dropship order</span>
                  <span className={styles.dropshipSub}>Ship directly to a different address</span>
                </div>
              </div>

              {/* Dropship delivery address */}
              {dropship && (
                <>
                  <div className={styles.sectionLabel} style={{ marginTop: 4 }}>Deliver to (customer address)</div>
                  <textarea
                    className={styles.addrInput}
                    placeholder="Enter customer's delivery address..."
                    value={dropshipAddr}
                    onChange={e => setDropshipAddr(e.target.value)}
                    rows={2}
                  />
                  <button className={styles.gpsBtn} onClick={handleUseLocationDrop} disabled={locatingDrop}>
                    {locatingDrop ? '📡 Detecting...' : '📍 Use customer location'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Voucher code */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Voucher code</div>
            <div className={styles.voucherRow}>
              <input
                className={styles.voucherInput}
                value={voucherCode}
                onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherResult(null) }}
                placeholder="Enter code"
                maxLength={20}
              />
              <button className={styles.voucherApply} onClick={() => {
                if (!voucherCode.trim()) return
                const result = validateVoucher(voucherCode, subtotal)
                setVoucherResult(result)
              }}>Apply</button>
            </div>
            {voucherResult && !voucherResult.valid && (
              <span className={styles.voucherError}>{voucherResult.error}</span>
            )}
            {voucherResult?.valid && (
              <span className={styles.voucherSuccess}>-{voucherResult.discountPercent}% ({formatIDR(voucherResult.discount)} off)</span>
            )}
          </div>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            {voucherResult?.valid && (
              <div className={styles.totalRow}>
                <span style={{ color: '#8DC63F' }}>Voucher -{voucherResult.discountPercent}%</span>
                <span style={{ color: '#8DC63F' }}>-{formatIDR(voucherResult.discount)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>{selected.icon} {selected.label}</span>
              <span>{deliveryFee > 0 ? `~${formatIDR(deliveryFee)}` : <span style={{ color: '#8DC63F', fontWeight: 700 }}>Free</span>}</span>
            </div>
            <div className={[styles.totalRow, styles.grandRow].join(' ')}>
              <span>Est. total</span>
              <span className={styles.grandVal}>{formatIDR(total - (voucherResult?.valid ? voucherResult.discount : 0))}</span>
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
            disabled={!sellerWa && !onOrderViaChat}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {showAddr ? (isBike ? 'Send Order · Direct Transfer' : 'Checkout') : 'Checkout'}
          </button>
        </div>

      </div>
    </div>
  )
}
