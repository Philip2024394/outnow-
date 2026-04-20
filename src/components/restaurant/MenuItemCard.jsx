import styles from './RestaurantMenuSheet.module.css'
import { fmtRp, CATEGORY_GRADIENTS } from './menuSheetConstants'

// ── Menu item card — full-screen ──────────────────────────────────────────────
export default function MenuItemCard({ item, qty, onAdd, onRemove, itemRef }) {
  const bg = item.photo_url
    ? `url("${item.photo_url}")`
    : CATEGORY_GRADIENTS[item.category] ?? 'linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)'

  return (
    <div className={styles.itemCard} ref={itemRef}>
      {/* Background */}
      <div className={styles.itemBg} style={{ backgroundImage: bg }} />
      <div className={styles.itemOverlay} />

      {/* Category pill top-left */}
      {item.category && (
        <div className={styles.itemCatPill}>{item.category}</div>
      )}

      {/* Prep time top-right */}
      {item.prep_time_min && (
        <div className={styles.itemPrep}>⏱ {item.prep_time_min} min</div>
      )}

      {/* Sold out overlay */}
      {item.is_available === false && (
        <div className={styles.soldOutOverlay}>
          <span className={styles.soldOutText}>Sold Out</span>
        </div>
      )}

      {/* Bottom content */}
      <div className={styles.itemBottom}>
        <h2 className={styles.itemName}>{item.name}</h2>
        {item.description && (
          <p className={styles.itemDesc}>{item.description}</p>
        )}
        <div className={styles.itemFooter}>
          <span className={styles.itemPrice}>{fmtRp(item.price)}</span>

          {item.is_available !== false && (
            qty > 0 ? (
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={onRemove}>−</button>
                <span className={styles.qtyNum}>{qty}</span>
                <button className={styles.qtyBtn} onClick={onAdd}>+</button>
              </div>
            ) : (
              <button className={styles.addBtn} onClick={onAdd}>
                + Add
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
