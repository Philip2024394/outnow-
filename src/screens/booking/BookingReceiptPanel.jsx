/**
 * BookingReceiptPanel — completed trip summary, star rating, optional comment,
 * and submit / skip actions.
 */
import styles from '../BookingScreen.module.css'

const BIKE_IMG = 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png'
const CAR_IMG  = 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png'

const STAR_LABELS = ['', 'Poor', 'Below average', 'OK', 'Good', 'Excellent']

export default function BookingReceiptPanel({
  selectedDriver,
  pickup, destination,
  fare, formatRp,
  reviewStars, setReviewStars,
  reviewHover, setReviewHover,
  reviewComment, setReviewComment,
  reviewSubmitting,
  handleSubmitReview,
  onClose,
}) {
  const activeStars = reviewHover || reviewStars

  return (
    <div className={styles.body}>
      <div className={styles.reviewCard}>
        {/* Driver */}
        <div className={styles.reviewDriver}>
          <img
            src={selectedDriver?.driver_type === 'car_taxi' ? CAR_IMG : BIKE_IMG}
            alt="driver"
            className={styles.reviewDriverImg}
          />
          <div>
            <p className={styles.reviewDriverName}>{selectedDriver?.display_name}</p>
            <p className={styles.reviewDriverType}>{selectedDriver?.driver_type === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'}</p>
          </div>
        </div>

        {/* Trip receipt */}
        <div className={styles.reviewReceipt}>
          <div className={styles.reviewReceiptRow}>
            <span className={styles.reviewReceiptLabel}>From</span>
            <span className={styles.reviewReceiptValue}>{pickup?.label ?? 'Pickup'}</span>
          </div>
          <div className={styles.reviewReceiptRow}>
            <span className={styles.reviewReceiptLabel}>To</span>
            <span className={styles.reviewReceiptValue}>{destination?.label ?? 'Destination'}</span>
          </div>
          <div className={styles.reviewReceiptRow}>
            <span className={styles.reviewReceiptLabel}>Fare</span>
            <span className={styles.reviewReceiptValue}>{formatRp(fare)}</span>
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className={styles.reviewStarsCard}>
        <p className={styles.reviewAsk}>Rate your driver</p>
        <div className={styles.reviewStarsRow}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`${styles.reviewStar} ${n <= activeStars ? styles.reviewStarActive : ''}`}
              onClick={() => setReviewStars(n)}
              onMouseEnter={() => setReviewHover(n)}
              onMouseLeave={() => setReviewHover(0)}
            >★</button>
          ))}
        </div>
        {activeStars > 0 && (
          <p className={styles.reviewStarLabel}>{STAR_LABELS[activeStars]}</p>
        )}
      </div>

      {/* Comment — show after star selected */}
      {reviewStars > 0 && (
        <textarea
          className={styles.reviewComment}
          value={reviewComment}
          onChange={e => setReviewComment(e.target.value)}
          placeholder="Add a comment (optional)…"
          rows={3}
          maxLength={300}
        />
      )}

      <button
        className={styles.submitReviewBtn}
        onClick={handleSubmitReview}
        disabled={!reviewStars || reviewSubmitting}
      >
        {reviewSubmitting ? 'Saving…' : 'Submit Review'}
      </button>
      <button className={styles.skipReviewBtn} onClick={onClose}>
        Skip — close
      </button>
    </div>
  )
}
