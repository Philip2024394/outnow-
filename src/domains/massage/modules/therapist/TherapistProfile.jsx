/**
 * TherapistProfile — Overlapping profile pic, name, verification badge, status display.
 * Converted from src/modules/therapist/TherapistProfile.tsx
 * TypeScript removed. Tailwind→CSS Modules. Layout identical.
 *
 * LOCKED PATTERNS (preserved from source):
 * - Profile positioning: -mt-24 overlap, 100px circle
 * - Name offset: ml-[75px]
 * - Status badge: pulsing dot rings (green available, yellow busy)
 */
import { AvailabilityStatus } from '../../constants/types'
import { getDisplayStatus, getTherapistDisplayName } from '../../utils/therapistCardHelpers'
import styles from './TherapistProfile.module.css'

const VERIFIED_BADGE_URL = 'https://ik.imagekit.io/7grri5v7d/verified-badge.png'
const BRANCH_IMG = 'https://ik.imagekit.io/7grri5v7d/branch%205.png'

export default function TherapistProfile({
  therapist,
  displayStatus,
  isOvertime = false,
  countdown = null,
  customVerifiedBadge,
}) {
  const isAvailable = displayStatus === AvailabilityStatus.Available
  const isBusy = displayStatus === AvailabilityStatus.Busy

  // Verification check — same logic as source:
  // 1. Manual flag OR 2. Bank+KTP complete OR 3. SafePass active
  const hasVerifiedBadge = therapist?.verifiedBadge || therapist?.isVerified
  const hasBankDetails = therapist?.bankName && therapist?.accountName && therapist?.accountNumber
  const hasKtpUploaded = therapist?.ktpPhotoUrl
  const hasSafePass = therapist?.hotelVillaSafePassStatus === 'active'
  const shouldShowBadge = hasVerifiedBadge || (hasBankDetails && hasKtpUploaded) || hasSafePass

  const badgeUrl = customVerifiedBadge || VERIFIED_BADGE_URL

  return (
    <>
      {/* ════════════════════════════════════════
       * Profile Section — Overlapping main image by 30%
       * 🔒 UI DESIGN LOCKED — positioning finalized
       * ════════════════════════════════════════ */}
      <div className={styles.profileWrap}>
        <div className={styles.profileRow}>
          {/* Profile Picture — 30% of card width */}
          <div className={styles.profilePicWrap}>
            <div className={styles.profilePicContainer}>
              <img
                className={styles.profilePic}
                src={therapist?.profilePicture || therapist?.mainImage || '/default-avatar.jpg'}
                alt={`${getTherapistDisplayName(therapist.name)} profile`}
                loading="lazy"
                onError={(e) => { e.target.src = '/default-avatar.jpg' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
       * Name and Status — Below main image
       * 🔒 75px offset from left is intentional
       * ════════════════════════════════════════ */}
      <div className={styles.nameSection}>
        <div className={styles.nameShrink}>
          {/* Name — left aligned with 75px offset */}
          <div className={styles.nameOffset}>
            <div className={styles.nameRow}>
              {/* Verified Badge */}
              {shouldShowBadge && (
                <img
                  src={badgeUrl}
                  alt="Verified"
                  className={styles.verifiedBadge}
                  title="Verified Therapist - Bank Details & KTP Complete"
                />
              )}
              <h3 className={styles.name}>
                {getTherapistDisplayName(therapist.name)}
              </h3>
            </div>
          </div>

          {/* Status Badge with pulsing rings — exact animation from massage app */}
          <div className={styles.statusRow}>
            <div className={`${styles.statusBadge} ${isOvertime ? styles.statusOvertime : isAvailable ? styles.statusAvailable : styles.statusBusy}`}>
              {/* Pulsing dot system */}
              <span className={styles.dotWrap}>
                <span className={`${styles.dot} ${isOvertime ? styles.dotRed : isAvailable ? styles.dotGreen : styles.dotYellow}`} />
                {/* Available: two expanding green rings */}
                {!isOvertime && isAvailable && (
                  <>
                    <span className={styles.ring1} />
                    <span className={styles.ring2} />
                  </>
                )}
                {/* Busy: single yellow ping */}
                {!isOvertime && isBusy && (
                  <span className={styles.busyRing} />
                )}
              </span>

              {/* Status text */}
              {isBusy ? (
                therapist.busyUntil ? (
                  <div className={styles.busyRow}>
                    <span className={styles.statusText}>Busy</span>
                    {/* BusyCountdownTimer inline — same as source */}
                    <span className={styles.statusText}>
                      {countdown ? (isOvertime ? `Extra Time ${countdown}` : `Free in ${countdown}`) : ''}
                    </span>
                  </div>
                ) : countdown ? (
                  <span className={styles.statusText}>
                    {isOvertime ? 'Busy - Extra Time ' : 'Busy - Free in '}{countdown}
                  </span>
                ) : (
                  <span className={styles.statusText}>Busy</span>
                )
              ) : (
                <span className={styles.statusText}>{displayStatus}</span>
              )}
            </div>

            {/* Branch decorative image — right side */}
            <img
              src={BRANCH_IMG}
              alt=""
              className={styles.branchImg}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </>
  )
}
