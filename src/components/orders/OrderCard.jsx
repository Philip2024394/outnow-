/**
 * OrderCard — inline chat message card for marketplace and restaurant orders.
 *
 * Rendered inside ChatWindow whenever msg.orderCard is present.
 *
 * orderCard shape:
 *   { type, ref, sellerName, sellerId, items, subtotal, deliveryFee, total,
 *     notes, status, updatedAt }
 *
 * status lifecycle:  pending → confirmed → complete | cancelled
 *
 * Props:
 *   orderCard   — the orderCard object from the message
 *   fromMe      — true if the viewer sent this card (i.e. the buyer)
 *   onStatusChange(newStatus) — called when a button is pressed
 */
import styles from './OrderCard.module.css'

function fmtRp(n) {
  if (!n && n !== 0) return '—'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f5c518', bg: 'rgba(245,197,24,0.12)',   border: 'rgba(245,197,24,0.3)'  },
  confirmed: { label: 'Confirmed', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    border: 'rgba(34,197,94,0.3)'   },
  complete:  { label: 'Complete',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   border: 'rgba(96,165,250,0.3)'  },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)'   },
}

const TYPE_BADGE = {
  marketplace: { emoji: '🛍️', label: 'Marketplace Order' },
  restaurant:  { emoji: '🍽️', label: 'Restaurant Order'  },
}

export default function OrderCard({ orderCard, fromMe, onStatusChange }) {
  if (!orderCard) return null

  const { type, ref: orderRef, sellerName, items = [], subtotal, deliveryFee, total, notes, status = 'pending' } = orderCard
  const st   = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const badge = TYPE_BADGE[type] ?? TYPE_BADGE.marketplace
  const isBuyer  = fromMe   // the person who placed the order
  const isSeller = !fromMe  // the person receiving the order

  return (
    <div className={styles.card}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.typeEmoji}>{badge.emoji}</span>
          <div>
            <div className={styles.typeLabel}>{badge.label}</div>
            <div className={styles.ref}>{orderRef}</div>
          </div>
        </div>
        <span
          className={styles.statusBadge}
          style={{ color: st.color, background: st.bg, borderColor: st.border }}
        >
          {st.label}
        </span>
      </div>

      {/* Seller */}
      {sellerName && (
        <div className={styles.sellerRow}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {sellerName}
        </div>
      )}

      {/* Items */}
      <div className={styles.items}>
        {items.map((item, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.itemLeft}>
              <span className={styles.itemName}>{item.name}</span>
              {item.variant && <span className={styles.itemVariant}>{item.variant}</span>}
              {item.note    && <span className={styles.itemNote}>📝 {item.note}</span>}
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemQty}>×{item.qty}</span>
              <span className={styles.itemPrice}>{fmtRp(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Totals */}
      <div className={styles.totals}>
        {subtotal != null && deliveryFee != null && (
          <>
            <div className={styles.totalRow}>
              <span>Items</span><span>{fmtRp(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Delivery</span><span>{deliveryFee > 0 ? fmtRp(deliveryFee) : 'Free'}</span>
            </div>
          </>
        )}
        <div className={`${styles.totalRow} ${styles.totalRowGrand}`}>
          <span>Total</span><span>{fmtRp(total)}</span>
        </div>
      </div>

      {/* Notes */}
      {notes?.trim() && (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>Note:</span> {notes}
        </div>
      )}

      {/* Action buttons — only show if not already complete/cancelled */}
      {status === 'pending' && isSeller && onStatusChange && (
        <div className={styles.actions}>
          <button className={styles.btnConfirm} onClick={() => onStatusChange('confirmed')}>
            ✓ Confirm Order
          </button>
          <button className={styles.btnCancel} onClick={() => onStatusChange('cancelled')}>
            Decline
          </button>
        </div>
      )}

      {status === 'confirmed' && (
        <div className={styles.actions}>
          {isBuyer && onStatusChange && (
            <button className={styles.btnComplete} onClick={() => onStatusChange('complete')}>
              ✓ Mark as Received
            </button>
          )}
          {isSeller && onStatusChange && (
            <button className={styles.btnCancel} onClick={() => onStatusChange('cancelled')}>
              Cancel
            </button>
          )}
        </div>
      )}

      {status === 'complete' && (
        <div className={styles.completedNote}>Order completed · Thank you!</div>
      )}

      {status === 'cancelled' && (
        <div className={styles.cancelledNote}>Order was cancelled</div>
      )}
    </div>
  )
}
