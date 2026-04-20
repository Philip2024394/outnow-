import styles from './RestaurantMenuSheet.module.css'
import { EVENT_LABELS } from './menuSheetConstants'

// ── Events / venue left drawer ────────────────────────────────────────────────
export default function EventsDrawer({ restaurant, onClose, onOrderViaChat }) {
  return (
    <div className={styles.panelBackdrop} onClick={onClose}>
      <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
        <h3 className={styles.infoPanelTitle}>Events & Venue</h3>
        <p className={styles.infoPanelSub}>{restaurant.name}</p>

        {restaurant.seating_capacity && (
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🪑</span>
            <div className={styles.infoText}>
              <span className={styles.infoLabel}>Seating Capacity</span>
              <span className={styles.infoValue}>Up to {restaurant.seating_capacity} guests</span>
            </div>
          </div>
        )}

        {restaurant.catering_available && (
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🍽</span>
            <div className={styles.infoText}>
              <span className={styles.infoLabel}>Catering</span>
              <span className={styles.infoValue}>Available for external events</span>
            </div>
          </div>
        )}

        {restaurant.event_features?.map(f => (
          <div key={f} className={styles.infoRow}>
            <span className={styles.infoIcon}>{EVENT_LABELS[f]?.split(' ')[0] ?? '✓'}</span>
            <div className={styles.infoText}>
              <span className={styles.infoValue}>{EVENT_LABELS[f]?.split(' ').slice(1).join(' ') ?? f}</span>
            </div>
          </div>
        ))}

        <button
          className={styles.eventEnquiryBtn}
          onClick={() => {
            if (onOrderViaChat) {
              onOrderViaChat({ restaurant, items: [], subtotal: 0, deliveryFee: 0, total: 0, notes: 'Event enquiry — please send details about availability and packages.', ref: `#EVENT_${Date.now().toString().slice(-6)}` })
            } else {
              const msg = `Hi ${restaurant.name}, I'd like to enquire about hosting an event at your venue. Please send me details about availability and packages.`
              window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
            }
          }}
        >
          💬 Enquire via Chat
        </button>
      </div>
    </div>
  )
}
