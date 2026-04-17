import { DEMO_REVIEWS } from '@/demo/mockData'
import styles from './ReviewsSection.module.css'

function StarRow({ rating }) {
  return (
    <div className={styles.starRow}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`${styles.starDot} ${n <= rating ? styles.starFilled : ''}`}>★</span>
      ))}
    </div>
  )
}

export default function ReviewsSection() {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>⭐ Reviews</span>
          <h3 className={styles.heading}>What people are saying</h3>
        </div>
        <div className={styles.overallScore}>
          <span className={styles.scoreNum}>4.8</span>
          <span className={styles.scoreLabel}>/ 5</span>
        </div>
      </div>

      <div className={styles.cards}>
        {DEMO_REVIEWS.map(r => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.avatar}>{r.emoji}</div>
              <div className={styles.meta}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{r.displayName}</span>
                  <span className={styles.age}>{r.age}</span>
                  {r.verified && (
                    <span className={styles.verified} title="Verified user">✓</span>
                  )}
                </div>
                <div className={styles.locationRow}>
                  <span className={styles.flag}>{r.flag}</span>
                  <span className={styles.location}>{r.area}</span>
                </div>
              </div>
              <div className={styles.ratingRight}>
                <StarRow rating={r.rating} />
                <span className={styles.timeAgo}>{r.timeAgo}</span>
              </div>
            </div>

            <p className={styles.text}>{r.text}</p>

            <div className={styles.cardFooter}>
              <span className={styles.activityTag}>{r.activityType}</span>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.footnote}>Reviews from verified Indoo users in your country</p>
    </div>
  )
}
