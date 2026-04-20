import styles from './RestaurantMenuSheet.module.css'
import { CATEGORY_EMOJIS } from './menuSheetConstants'
import { FOOD_CATEGORIES_FULL } from '@/constants/foodCategories'

// Build a quick lookup: category name (lowercase) → image URL
const CAT_IMAGES = {}
FOOD_CATEGORIES_FULL.forEach(c => {
  CAT_IMAGES[c.id] = c.image
  CAT_IMAGES[c.label.toLowerCase()] = c.image
  CAT_IMAGES[c.labelId.toLowerCase()] = c.image
  // Also map common variations
  c.subs.forEach(sub => { CAT_IMAGES[sub.toLowerCase()] = c.image })
})

function getCatImage(catName) {
  if (!catName) return null
  const lower = catName.toLowerCase()
  return CAT_IMAGES[lower] ?? CAT_IMAGES[lower.split(' ')[0]] ?? null
}

// ── Category floating grid (left side) with images ──────────────────────────
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
          style={{ overflow: 'hidden' }}
        >
          <span className={styles.drawerCatEmoji}>🍽</span>
          <span className={styles.drawerCatName}>All</span>
          <span className={styles.drawerCatCount}>{items.length}</span>
        </button>

        {categories.map(cat => {
          const img = getCatImage(cat)
          return (
            <button
              key={cat}
              className={`${styles.drawerCat} ${activeCategory === cat ? styles.drawerCatActive : ''}`}
              onClick={() => onJumpToCategory(cat)}
              style={img ? { padding: 0, overflow: 'hidden', flexDirection: 'column', gap: 0 } : {}}
            >
              {img ? (
                <>
                  <img src={img} alt={cat} style={{ width: '100%', height: '55%', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, padding: '2px 4px' }}>
                    <span className={styles.drawerCatName}>{cat}</span>
                    <span className={styles.drawerCatCount}>{items.filter(i => i.category === cat).length}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.drawerCatEmoji}>{CATEGORY_EMOJIS[cat] ?? '🍽'}</span>
                  <span className={styles.drawerCatName}>{cat}</span>
                  <span className={styles.drawerCatCount}>{items.filter(i => i.category === cat).length}</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
