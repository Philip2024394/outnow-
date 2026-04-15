/**
 * MakeOfferSheet
 * Bottom sheet for buyer to make a price offer on a product.
 * Shows listed price, lets buyer enter qty + offer price per item.
 * Minimum offer is 50% of listed price.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './MakeOfferSheet.module.css'

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

export default function MakeOfferSheet({ open, onClose, product, onSubmitOffer }) {
  const [qty, setQty] = useState(1)
  const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')

  if (!open || !product) return null

  const listedPrice = product.price ?? 0
  const minOffer = Math.floor(listedPrice * 0.5)
  const offerNum = parseFloat(offerPrice) || 0
  const totalOffer = offerNum * qty
  const totalListed = listedPrice * qty
  const savings = totalListed - totalOffer
  const savingsPercent = totalListed > 0 ? Math.round((savings / totalListed) * 100) : 0
  const tooLow = offerNum > 0 && offerNum < minOffer
  const valid = offerNum >= minOffer && qty >= 1

  function handleSubmit() {
    if (!valid) return
    onSubmitOffer?.({
      product,
      qty,
      offerPrice: offerNum,
      listedPrice,
      totalOffer,
      message: message.trim(),
    })
    onClose()
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div>
            <span className={styles.title}>Make an Offer</span>
            <span className={styles.subtitle}>{product.name}</span>
          </div>
        </div>

        <div className={styles.body}>
          {/* Listed price */}
          <div className={styles.listedRow}>
            <span className={styles.listedLabel}>Listed price</span>
            <span className={styles.listedPrice}>{formatIDR(listedPrice)}</span>
          </div>

          {/* Quantity */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Quantity</span>
            <div className={styles.qtyRow}>
              <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className={styles.qtyNum}>{qty}</span>
              <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          {/* Offer price per item */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Your offer per item</span>
            <div className={styles.priceInput}>
              <span className={styles.rpPrefix}>Rp</span>
              <input
                type="number"
                className={styles.priceField}
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                placeholder={String(listedPrice)}
                min={minOffer}
              />
            </div>
            {tooLow && (
              <span className={styles.errorText}>
                Minimum offer is {formatIDR(minOffer)} (50% of listed price)
              </span>
            )}
          </div>

          {/* Optional message */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Message to seller (optional)</span>
            <textarea
              className={styles.messageInput}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. I'd like to buy in bulk, can you do a better price?"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Summary */}
          {offerNum > 0 && !tooLow && (
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Listed total ({qty}×)</span>
                <span className={styles.summaryStrike}>{formatIDR(totalListed)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Your offer ({qty}×)</span>
                <span className={styles.summaryOffer}>{formatIDR(totalOffer)}</span>
              </div>
              {savings > 0 && (
                <div className={styles.summaryRow}>
                  <span>You save</span>
                  <span className={styles.summarySave}>{formatIDR(savings)} ({savingsPercent}%)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={!valid}>
            Send Offer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
