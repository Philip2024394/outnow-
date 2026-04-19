/**
 * ProductReviews
 * Star rating display + review cards for a product.
 * Shows on the product detail page below description.
 * Buyers can leave reviews after order is marked complete.
 */
import { useState } from 'react'
import WriteReview from './WriteReview'
import styles from './ProductReviews.module.css'

// Demo reviews
const DEMO_REVIEWS = [
  {
    id: 'r1',
    buyerName: 'Sarah M.',
    rating: 5,
    text: 'Exactly as described. Fast delivery, well packaged. Would buy again!',
    date: '2026-04-10',
    photos: [],
    sellerReply: 'Thank you for your kind review! We appreciate your business.',
  },
  {
    id: 'r2',
    buyerName: 'Andi P.',
    rating: 4,
    text: 'Good quality, colour slightly different from photo but overall happy.',
    date: '2026-04-08',
    photos: [],
    sellerReply: null,
  },
  {
    id: 'r3',
    buyerName: 'Dewi S.',
    rating: 5,
    text: 'Love it! Perfect gift for my sister.',
    date: '2026-04-05',
    photos: [],
    sellerReply: null,
  },
]

function StarDisplay({ rating, size = 12 }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#8DC63F' : 'none'}
          stroke={i <= rating ? '#8DC63F' : 'rgba(255,255,255,0.15)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function ProductReviews({ productId, productName }) {
  const [showAll, setShowAll] = useState(false)
  const [writeOpen, setWriteOpen] = useState(false)
  const [userReviews, setUserReviews] = useState([])

  const reviews = [...userReviews.map((r, i) => ({ ...r, id: `user-${i}`, buyerName: 'You' })), ...DEMO_REVIEWS]
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0
  const visible = showAll ? reviews : reviews.slice(0, 2)

  if (reviews.length === 0) return null

  return (
    <div className={styles.wrapper}>
      {/* Summary bar + write button */}
      <div className={styles.summary}>
        <div className={styles.summaryLeft}>
          <span className={styles.avgRating}>{avgRating}</span>
          <div className={styles.summaryMeta}>
            <StarDisplay rating={Math.round(avgRating)} size={11} />
            <span className={styles.reviewCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button className={styles.writeBtn} onClick={() => setWriteOpen(true)}>Write Review</button>
      </div>

      {/* Review cards */}
      {visible.map(r => (
        <div key={r.id} className={styles.reviewCard}>
          <div className={styles.reviewHeader}>
            <div className={styles.reviewAvatar}>
              {r.buyerName[0]}
            </div>
            <div className={styles.reviewMeta}>
              <span className={styles.reviewName}>{r.buyerName}</span>
              <div className={styles.reviewRatingRow}>
                <StarDisplay rating={r.rating} size={10} />
                <span className={styles.reviewDate}>{r.date}</span>
              </div>
            </div>
          </div>
          <p className={styles.reviewText}>{r.text}</p>

          {/* Review photos */}
          {r.photos?.length > 0 && (
            <div className={styles.reviewPhotos}>
              {r.photos.map((url, i) => (
                <img key={i} src={url} alt="" className={styles.reviewPhoto} />
              ))}
            </div>
          )}

          {/* Seller reply */}
          {r.sellerReply && (
            <div className={styles.sellerReply}>
              <span className={styles.replyLabel}>Seller reply</span>
              <p className={styles.replyText}>{r.sellerReply}</p>
            </div>
          )}
        </div>
      ))}

      {reviews.length > 2 && !showAll && (
        <button className={styles.showAllBtn} onClick={() => setShowAll(true)}>
          View all {reviews.length} reviews
        </button>
      )}

      <WriteReview
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        productName={productName}
        onSubmit={(review) => setUserReviews(prev => [review, ...prev])}
      />
    </div>
  )
}
