/**
 * RecommendationBanner
 * Horizontal scroll banner showing products based on buyer interest:
 * - Recently viewed products
 * - Recommended based on viewed categories
 * Renders at top of ShopSearchScreen.
 */
import { useState, useEffect } from 'react'
import { getRecentlyViewed } from './BuyerProfileSheet'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import styles from './RecommendationBanner.module.css'

function formatIDR(n) {
  n = parseFloat(n) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (n >= 1_000) return `Rp ${n.toLocaleString('id-ID')}`
  return `Rp ${n}`
}

export default function RecommendationBanner({ onProductTap, allProducts }) {
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [recommended, setRecommended] = useState([])

  useEffect(() => {
    const rv = getRecentlyViewed()
    setRecentlyViewed(rv.slice(0, 10))

    // Build recommendations from viewed categories
    const viewedCategories = [...new Set(rv.map(p => p.category).filter(Boolean))]
    const viewedIds = new Set(rv.map(p => p.id))
    const pool = (allProducts ?? DEMO_PRODUCTS).filter(p =>
      !viewedIds.has(p.id) && viewedCategories.includes(p.category)
    )
    // Shuffle and take up to 10
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 10)
    setRecommended(shuffled)
  }, [allProducts])

  if (recentlyViewed.length === 0 && recommended.length === 0) return null

  return (
    <div className={styles.wrapper}>
      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>👁</span>
            <span className={styles.sectionTitle}>Recently Viewed</span>
          </div>
          <div className={styles.scroll}>
            {recentlyViewed.map(p => (
              <div key={p.id} className={styles.card} onClick={() => onProductTap?.(p)}>
                {p.image
                  ? <img src={p.image} alt={p.name} className={styles.cardImg} />
                  : <div className={styles.cardImgPlaceholder}>📦</div>
                }
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{p.name}</span>
                  <span className={styles.cardPrice}>{formatIDR(p.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You */}
      {recommended.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>✨</span>
            <span className={styles.sectionTitle}>Recommended for You</span>
          </div>
          <div className={styles.scrollAuto}>
            {[...recommended, ...recommended].map((p, i) => (
              <div key={`${p.id}-${i}`} className={styles.card} onClick={() => onProductTap?.(p)}>
                {p.image
                  ? <img src={p.image} alt={p.name} className={styles.cardImg} />
                  : <div className={styles.cardImgPlaceholder}>📦</div>
                }
                <div className={styles.cardInfo}>
                  {p.brand_name && <span className={styles.cardBrand}>{p.brand_name}</span>}
                  <span className={styles.cardName}>{p.name}</span>
                  <span className={styles.cardPrice}>{formatIDR(p.price)}</span>
                  {p.dispatch_time && <span className={styles.cardDispatch}>{p.dispatch_time}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
