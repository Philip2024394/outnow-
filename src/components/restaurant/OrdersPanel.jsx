import styles from './RestaurantMenuSheet.module.css'
import { fmtRp, STATUS_COLORS, STATUS_LABELS } from './menuSheetConstants'

// ── My Orders slide-up panel ──────────────────────────────────────────────────
export default function OrdersPanel({
  foodOrders,
  onClose,
  onCancelOrder,
  onReviewOrder,
  onReorder,
}) {
  return (
    <div className={styles.panelBackdrop} onClick={onClose}>
      <div className={styles.ordersPanel} onClick={e => e.stopPropagation()}>
        <h3 className={styles.infoPanelTitle}>My Orders</h3>
        <p className={styles.infoPanelSub}>Your food order history</p>

        {foodOrders.length === 0 ? (
          <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 20 }}>No orders yet</p>
        ) : (
          foodOrders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderCardHeader}>
                <span className={styles.orderRestName}>{order.restaurant}</span>
                <span
                  className={styles.orderStatusBadge}
                  style={{ background: `${STATUS_COLORS[order.status] ?? '#666'}20`, color: STATUS_COLORS[order.status] ?? '#666', border: `1px solid ${STATUS_COLORS[order.status] ?? '#666'}40` }}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <div className={styles.orderItems}>
                {order.items.map((it, idx) => (
                  <span key={idx} className={styles.orderItemLine}>{it.qty}x {it.name}</span>
                ))}
              </div>
              <div className={styles.orderCardFooter}>
                <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {/* Cancel button for pending/awaiting_payment */}
              {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                <button
                  className={styles.orderCancelBtn}
                  onClick={() => onCancelOrder(order.id)}
                >
                  Cancel Order
                </button>
              )}
              {/* Review button for delivered orders */}
              {order.status === 'delivered' && !JSON.parse(localStorage.getItem('indoo_food_reviews') || '[]').some(r => r.order_id === order.id) && (
                <button
                  className={styles.orderReviewBtn}
                  onClick={() => onReviewOrder(order)}
                >
                  Rate this order
                </button>
              )}
              {/* Reorder button for completed/delivered orders */}
              {(order.status === 'delivered' || order.status === 'completed') && onReorder && (
                <button
                  onClick={() => onReorder(order.items)}
                  style={{
                    width: '100%', marginTop: 6, padding: '9px 0', borderRadius: 10,
                    background: 'transparent',
                    border: '1.5px solid rgba(141,198,63,0.5)',
                    color: '#8DC63F', fontSize: 12, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  🔄 Order Again
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
