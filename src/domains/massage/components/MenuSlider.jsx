/**
 * MenuSlider — Slide-up service menu for therapists.
 * Shows up to 20 services, each with name + 60/90/120 pricing.
 * User can book directly from any service row.
 */
import { createPortal } from 'react-dom'
import styles from './MenuSlider.module.css'

function fmtPrice(n) {
  if (!n || n <= 0) return null
  return `Rp ${(n / 1000).toFixed(0)}k`
}

export default function MenuSlider({ open, onClose, therapist, onBook }) {
  if (!open || !therapist) return null

  const menu = therapist.menu || []
  const name = therapist.name || 'Therapist'

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className={styles.headerTitle}>{name}</span>
            <span className={styles.headerSub}>{menu.length} service{menu.length !== 1 ? 's' : ''} available</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Service list */}
        <div className={styles.menuList}>
          {menu.length === 0 && (
            <div className={styles.empty}>No menu items added yet</div>
          )}

          {menu.map((service, i) => {
            const p60 = fmtPrice(service.price60)
            const p90 = fmtPrice(service.price90)
            const p120 = fmtPrice(service.price120)

            return (
              <div key={i} className={styles.serviceRow}>
                <div className={styles.serviceName}>{service.name || `Service ${i + 1}`}</div>
                <div className={styles.priceGrid}>
                  <div className={styles.priceCell}>
                    <span className={styles.priceDur}>60min</span>
                    {p60 ? <span className={styles.priceVal}>{p60}</span> : <span className={styles.priceNA}>—</span>}
                  </div>
                  <div className={styles.priceCell}>
                    <span className={styles.priceDur}>90min</span>
                    {p90 ? <span className={styles.priceVal}>{p90}</span> : <span className={styles.priceNA}>—</span>}
                  </div>
                  <div className={styles.priceCell}>
                    <span className={styles.priceDur}>120min</span>
                    {p120 ? <span className={styles.priceVal}>{p120}</span> : <span className={styles.priceNA}>—</span>}
                  </div>
                </div>
                <button
                  className={styles.serviceBookBtn}
                  onClick={() => onBook?.(therapist, service)}
                >
                  Book {service.name || 'Service'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
