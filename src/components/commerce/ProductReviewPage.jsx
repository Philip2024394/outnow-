/**
 * ProductReviewPage — full review page opened from side panel button.
 * Multi-category star ratings: quality, description accuracy, value, dispatch, seller service.
 * Scale bar showing listing compliance %. Seller reply + objection system.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import WriteReview from './WriteReview'
import styles from './ProductReviewPage.module.css'

const RATING_CATEGORIES = [
  { key: 'quality', label: 'Quality' },
  { key: 'description', label: 'As Described' },
  { key: 'value', label: 'Value for Price' },
  { key: 'dispatch', label: 'Dispatch Time' },
  { key: 'service', label: 'Seller Service' },
]

const DEMO_REVIEWS = [
  {
    id: 'r1', buyerName: 'Sarah M.', buyerPhoto: null, date: '2026-04-10',
    ratings: { quality: 5, description: 5, value: 4, dispatch: 5, service: 5 },
    text: 'Exactly as described. Fast delivery, well packaged. Would buy again!',
    photos: [],
    sellerReply: 'Thank you for your kind review! We appreciate your business.',
    objected: false,
  },
  {
    id: 'r2', buyerName: 'Andi P.', buyerPhoto: null, date: '2026-04-08',
    ratings: { quality: 4, description: 3, value: 4, dispatch: 4, service: 4 },
    text: 'Good quality but colour slightly different from photo. Seller was helpful when I reached out.',
    photos: [],
    sellerReply: null,
    objected: false,
  },
  {
    id: 'r3', buyerName: 'Dewi S.', buyerPhoto: null, date: '2026-04-05',
    ratings: { quality: 5, description: 5, value: 5, dispatch: 3, service: 5 },
    text: 'Love it! Perfect gift. Took a bit longer to dispatch than expected but great product.',
    photos: [],
    sellerReply: null,
    objected: false,
  },
]

function StarRow({ rating, size = 11 }) {
  return (
    <div className={styles.starRow}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#8DC63F' : 'none'}
          stroke={i <= rating ? '#8DC63F' : 'rgba(255,255,255,0.12)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function ProductReviewPage({ open, onClose, productName, productId }) {
  const [writeOpen, setWriteOpen] = useState(false)
  const [userReviews, setUserReviews] = useState([])

  if (!open) return null

  const reviews = [...userReviews.map((r, i) => ({
    ...r, id: `user-${i}`, buyerName: 'You',
    ratings: { quality: r.rating, description: r.rating, value: r.rating, dispatch: r.rating, service: r.rating },
  })), ...DEMO_REVIEWS]

  // Calculate averages per category
  const avgPerCat = RATING_CATEGORIES.map(cat => {
    const sum = reviews.reduce((s, r) => s + (r.ratings?.[cat.key] ?? 0), 0)
    return { ...cat, avg: reviews.length > 0 ? (sum / reviews.length).toFixed(1) : 0 }
  })

  const overallAvg = reviews.length > 0
    ? (reviews.reduce((s, r) => {
        const vals = Object.values(r.ratings ?? {})
        return s + (vals.reduce((a, b) => a + b, 0) / vals.length)
      }, 0) / reviews.length).toFixed(1)
    : 0

  // Description compliance — % of reviews where "description" rating >= 4
  const descriptionCompliance = reviews.length > 0
    ? Math.round((reviews.filter(r => (r.ratings?.description ?? 5) >= 4).length / reviews.length) * 100)
    : 100

  const lowCompliance = descriptionCompliance < 70

  return createPortal(
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Reviews</span>
          <span className={styles.headerSub}>{productName}</span>
        </div>
        <button className={styles.writeBtn} onClick={() => setWriteOpen(true)}>Write</button>
      </div>

      <div className={styles.body}>
        {/* Overall score */}
        <div className={styles.overallCard}>
          <span className={styles.overallScore}>{overallAvg}</span>
          <div className={styles.overallMeta}>
            <StarRow rating={Math.round(overallAvg)} size={14} />
            <span className={styles.overallCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className={styles.breakdown}>
          {avgPerCat.map(cat => (
            <div key={cat.key} className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>{cat.label}</span>
              <div className={styles.breakdownBar}>
                <div className={styles.breakdownFill} style={{ width: `${(cat.avg / 5) * 100}%` }} />
              </div>
              <span className={styles.breakdownVal}>{cat.avg}</span>
            </div>
          ))}
        </div>

        {/* Description compliance */}
        <div className={`${styles.complianceCard} ${lowCompliance ? styles.complianceLow : ''}`}>
          <span className={styles.complianceLabel}>Listing Accuracy</span>
          <div className={styles.complianceBar}>
            <div className={styles.complianceFill} style={{ width: `${descriptionCompliance}%`, background: lowCompliance ? '#EF4444' : '#8DC63F' }} />
          </div>
          <span className={styles.complianceVal}>{descriptionCompliance}%</span>
          {lowCompliance && (
            <span className={styles.complianceWarning}>
              Seller is advised to update listing to match buyer expectations
            </span>
          )}
        </div>

        {/* Review cards */}
        {reviews.map(r => {
          const reviewAvg = Object.values(r.ratings ?? {})
          const avg = reviewAvg.length > 0 ? (reviewAvg.reduce((a, b) => a + b, 0) / reviewAvg.length).toFixed(1) : 0
          return (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewAvatar}>
                  {r.buyerPhoto ? <img src={r.buyerPhoto} alt="" className={styles.reviewAvatarImg} /> : r.buyerName[0]}
                </div>
                <div className={styles.reviewMeta}>
                  <span className={styles.reviewName}>{r.buyerName}</span>
                  <div className={styles.reviewRatingRow}>
                    <StarRow rating={Math.round(avg)} size={10} />
                    <span className={styles.reviewDate}>{r.date}</span>
                  </div>
                </div>
              </div>

              {/* Per-category mini ratings */}
              <div className={styles.miniRatings}>
                {RATING_CATEGORIES.map(cat => (
                  <span key={cat.key} className={styles.miniRating}>
                    {cat.label}: {r.ratings?.[cat.key] ?? '–'}★
                  </span>
                ))}
              </div>

              <p className={styles.reviewText}>{r.text}</p>

              {r.photos?.length > 0 && (
                <div className={styles.reviewPhotos}>
                  {r.photos.map((url, i) => <img key={i} src={url} alt="" className={styles.reviewPhoto} />)}
                </div>
              )}

              {r.sellerReply && (
                <div className={styles.sellerReply}>
                  <span className={styles.replyLabel}>Seller reply</span>
                  <p className={styles.replyText}>{r.sellerReply}</p>
                </div>
              )}

              {r.objected && (
                <span className={styles.objectedBadge}>Under admin review</span>
              )}
            </div>
          )
        })}
      </div>

      <WriteReview
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        productName={productName}
        onSubmit={(review) => setUserReviews(prev => [review, ...prev])}
      />
    </div>,
    document.body
  )
}
