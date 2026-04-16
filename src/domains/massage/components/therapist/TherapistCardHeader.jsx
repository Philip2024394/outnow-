/**
 * TherapistCardHeader — Banner image with rating, orders, discount, share badges.
 * Converted from src/components/therapist/TherapistCardHeader.tsx
 * TypeScript removed. Tailwind→CSS Modules. Logic identical.
 */
import { isDiscountActive, getTherapistDisplayName } from '../../utils/therapistCardHelpers'
import styles from './TherapistCardHeader.module.css'

const FALLBACK_IMAGE = 'https://ik.imagekit.io/7grri5v7d/hotel%20massage%20indoniseas.png?updatedAt=1761154913720'

export default function TherapistCardHeader({
  therapist,
  displayImage,
  onShareClick,
  bookingsCount = 0,
  displayRating,
  shareCount,
  isBeautician = false,
}) {
  return (
    <div
      className={styles.banner}
      /* style kept identical: aspectRatio, minHeight, maxHeight are in CSS */
    >
      {/* Orange→Green gradient behind main image (prevents layout shift during load) */}
      <div className={styles.bannerGrad}>
        <img
          key={displayImage}
          src={displayImage}
          alt={`${getTherapistDisplayName(therapist.name)} cover`}
          className={styles.bannerImg}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width="400"
          height="225"
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE
          }}
        />
      </div>

      {/* Star Rating Badge — Top Left */}
      {/* Was: bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 */}
      {displayRating && (
        <div className={styles.ratingBadge}>
          <svg className={styles.ratingStar} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className={styles.ratingText}>{displayRating}</span>
        </div>
      )}

      {/* Orders Badge — Top Right (only when no active discount) */}
      {/* Was: bg-black/70 backdrop-blur-sm text-[11px] font-bold rounded-full */}
      {bookingsCount > 0 && !isDiscountActive(therapist) && (
        <div className={styles.ordersBadge}>
          {bookingsCount}+ Orders
        </div>
      )}

      {/* Enhanced Discount Badge — Top Right (replaces orders badge when discount active) */}
      {isDiscountActive(therapist) && (
        <div className={styles.discountWrap}>
          {/* Orders badge when discount is active */}
          {bookingsCount > 0 && (
            <div className={styles.ordersBadge}>
              {bookingsCount}+ Orders
            </div>
          )}
          {/* Discount badge with fade animation */}
          <div className={styles.discountBadge}>
            {therapist.discountPercentage}% OFF
          </div>
          {/* Countdown timer */}
          <div className={styles.discountTimer}>
            <svg className={styles.clockIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {(() => {
              if (!therapist.discountEndTime) return 'EXPIRED'
              const now = new Date()
              const endTime = new Date(therapist.discountEndTime)
              const timeLeft = endTime.getTime() - now.getTime()
              if (timeLeft <= 0) return 'EXPIRED'
              const hours = Math.floor(timeLeft / (1000 * 60 * 60))
              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
              if (hours > 0) return `${hours}h ${minutes}m`
              if (minutes > 0) return `${minutes}m ${seconds}s`
              return `${seconds}s`
            })()}
          </div>
        </div>
      )}

      {/* Share count + Share button — Bottom Right */}
      {/* Was: bg-black/50 backdrop-blur-sm p-2 rounded-full */}
      <div className={styles.shareWrap}>
        {shareCount !== undefined && shareCount >= 0 && (
          <div className={styles.shareCount} title="Times this profile was shared">
            <svg className={styles.shareIconSmall} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>{shareCount}</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onShareClick?.() }}
          className={styles.shareBtn}
          title="Share this therapist"
          aria-label="Share this therapist"
        >
          <svg className={styles.shareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
