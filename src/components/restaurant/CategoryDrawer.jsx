import styles from './RestaurantMenuSheet.module.css'
import { CATEGORY_EMOJIS } from './menuSheetConstants'

// ── Category floating grid (left side) ────────────────────────────────────────
export default function CategoryDrawer({
  items,
  categories,
  activeCategory,
  onClose,
  onJumpToCategory,
}) {
  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerGrid} onClick={e => e.stopPropagation()}>
        {/* All items */}
        <button
          className={`${styles.drawerCat} ${!activeCategory ? styles.drawerCatActive : ''}`}
          onClick={() => onJumpToCategory(null)}
        >
          <span className={styles.drawerCatEmoji}>🍽</span>
          <span className={styles.drawerCatName}>All</span>
          <span className={styles.drawerCatCount}>{items.length}</span>
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.drawerCat} ${activeCategory === cat ? styles.drawerCatActive : ''}`}
            onClick={() => onJumpToCategory(cat)}
          >
            <span className={styles.drawerCatEmoji}>{CATEGORY_EMOJIS[cat] ?? '🍽'}</span>
            <span className={styles.drawerCatName}>{cat}</span>
            <span className={styles.drawerCatCount}>{items.filter(i => i.category === cat).length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
