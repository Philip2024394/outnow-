/**
 * SimilarProducts — "You may also like" recommendation strip.
 *
 * Shown on ProductDetailSheet when a buyer views a product but hasn't
 * added to cart or paid. Shows cheaper/similar products from other sellers
 * to keep the buyer browsing and excited.
 *
 * Algorithm: same category, sorted by price (cheapest first),
 * max 2 per seller for fair rotation.
 */
import { useState, useEffect } from 'react'
import { getSimilarProducts } from '@/services/productService'
import { filterSimilarProducts } from '@/utils/searchAlgorithm'
import styles from './SimilarProducts.module.css'

function fmtPrice(price, currency = 'IDR') {
  if (!price) return ''
  if (currency === 'IDR') {
    const n = parseFloat(price)
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
    return `Rp ${n.toLocaleString('id-ID')}`
  }
  const sym = { GBP: '£', USD: '$', EUR: '€' }
  return `${sym[currency] ?? currency}${parseFloat(price).toFixed(2)}`
}

export default function SimilarProducts({ currentProduct, onSelect }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentProduct?.category || !currentProduct?.price) {
      setLoading(false)
      return
    }
    setLoading(true)
    getSimilarProducts(currentProduct.id, currentProduct.category, currentProduct.price, { limit: 12 })
      .then(data => {
        const sorted = filterSimilarProducts(data, currentProduct)
        setProducts(sorted.slice(0, 8))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [currentProduct?.id, currentProduct?.category, currentProduct?.price])

  if (loading || products.length === 0) return null

  const cheaper = products.filter(p => p.price < currentProduct.price)
  const similar = products.filter(p => p.price >= currentProduct.price)

  return (
    <div className={styles.wrap}>
      {cheaper.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEmoji}>💡</span>
            Similar at lower prices
          </div>
          <div className={styles.strip}>
            {cheaper.map(p => (
              <button key={p.id} className={styles.card} onClick={() => onSelect?.(p)}>
                <div className={styles.cardImgWrap}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className={styles.cardImg} />
                    : <div className={styles.cardImgFallback}>📦</div>
                  }
                  {p.price < currentProduct.price && (
                    <span className={styles.saveBadge}>
                      Save {Math.round((1 - p.price / currentProduct.price) * 100)}%
                    </span>
                  )}
                </div>
                <div className={styles.cardName}>{p.name}</div>
                <div className={styles.cardPrice}>{fmtPrice(p.price, p.currency)}</div>
                {p.profiles?.display_name && (
                  <div className={styles.cardSeller}>{p.profiles.display_name}</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {similar.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEmoji}>✨</span>
            You may also like
          </div>
          <div className={styles.strip}>
            {similar.map(p => (
              <button key={p.id} className={styles.card} onClick={() => onSelect?.(p)}>
                <div className={styles.cardImgWrap}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className={styles.cardImg} />
                    : <div className={styles.cardImgFallback}>📦</div>
                  }
                </div>
                <div className={styles.cardName}>{p.name}</div>
                <div className={styles.cardPrice}>{fmtPrice(p.price, p.currency)}</div>
                {p.profiles?.display_name && (
                  <div className={styles.cardSeller}>{p.profiles.display_name}</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
