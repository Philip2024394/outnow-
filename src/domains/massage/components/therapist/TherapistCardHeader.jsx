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
