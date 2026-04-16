/**
 * CityPlaceCard — Massage/Facial/Beauty place card for city listings.
 * Converted from src/components/CityPlaceCard.tsx (910 lines)
 * Same layout: image with badges → profile overlap → name/status → photos → treatments → pricing → buttons
 * Cream spa gold theme #C9A96E
 */
import { useState, useMemo } from 'react'
import { getDisplayRating, formatRating } from '../utils/ratingUtils'
import { isDiscountActive } from '../utils/therapistCardHelpers'
import { LANGUAGE_FLAG_MAP } from '../utils/therapistCardHelpers'
import styles from './CityPlaceCard.module.css'

const DEFAULT_PLACE_IMAGE = 'https://ik.imagekit.io/7grri5v7d/facial%202.png?updatedAt=1766551253328'
const BRANCH_ICON_URL = 'https://ik.imagekit.io/7grri5v7d/branch%206s.png'
const VERIFIED_BADGE_URL = 'https://ik.imagekit.io/7grri5v7d/verified-badge.png'

function formatPrice(price) {
  if (!price || price <= 0) return '—'
  return new Intl.NumberFormat('id-ID').format(price)
}

function getMetaBarLabel(category) {
  if (category === 'facial') return 'Facial Clinic'
  if (category === 'beauty') return 'Beauty Salon'
  return 'Massage Spa'
}

function getCategoryBadgeText(category) {
  if (category === 'facial') return 'Facial'
  if (category === 'beauty') return 'Beauty'
  return 'Massage'
}

function getTreatmentsLabel(place, category) {
  if (category === 'massage') return place?.services || 'All Massage Types'
  if (category === 'facial') return place?.treatments || 'Facial & Beauty Services'
  return place?.treatments || place?.services || 'Beauty Services'
}

export default function CityPlaceCard({
  place,
  category = 'massage',
  variant = 'listing', // 'listing' | 'profile'
  onClick,
  onShare,
  language = 'en',
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showMenuSlider, setShowMenuSlider] = useState(false)

  const placeName = place?.name || getMetaBarLabel(category)
  const mainImage = place?.mainImage || place?.coverImage || DEFAULT_PLACE_IMAGE
  const profileImage = place?.profileImage || place?.profilePicture || mainImage
  const displayRating = formatRating(getDisplayRating(place?.rating, place?.reviewCount))
  const displayBookingsCount = place?.bookingsCount || Math.floor(10 + ((place?.id?.toString()?.charCodeAt?.(2)) || 0) % 30)
  const isOpen = place?.isOpen !== false
  const joinedDisplay = place?.membershipStartDate ? new Date(place.membershipStartDate).toLocaleDateString('en-GB') : '—'

  // Pricing
  const pricing = useMemo(() => {
    const parse = (v) => (v != null && Number(v) > 0 ? (Number(v) < 1000 ? Number(v) * 1000 : Number(v)) : 0)
    return {
      '60': parse(place?.price60),
      '90': parse(place?.price90),
      '120': parse(place?.price120),
    }
  }, [place?.price60, place?.price90, place?.price120])

  // Gallery photos
  const photoItems = useMemo(() => {
    const items = []
    const seen = new Set()
    const add = (url) => { if (url && !seen.has(url)) { seen.add(url); items.push(url) } }
    add(mainImage)
    if (Array.isArray(place?.galleryImages)) place.galleryImages.forEach(g => add(g?.imageUrl || g?.url))
    if (Array.isArray(place?.images)) place.images.forEach(u => add(u))
    return items.slice(0, 5)
  }, [place, mainImage])

  // Languages
  const languages = Array.isArray(place?.languagesSpoken) ? place.languagesSpoken : []

  return (
    <div className="relative">
      {/* Meta bar — joined date + category label */}
      {variant !== 'profile' && (
        <div className={styles.metaBar}>
          <span className={styles.metaDate}>
            <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {joinedDisplay}
          </span>
          <span className={styles.metaCategory}>
            <svg className={styles.metaIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {getMetaBarLabel(category)}
          </span>
        </div>
      )}

      {/* Card container */}
      <div className={styles.card} onClick={() => onClick?.(place)}>

        {/* Image container */}
        <div className={styles.imageWrap}>
          <div className={styles.topLine} />
          <div className={styles.imageInner}>
            <img src={mainImage} alt={placeName} className={styles.mainImg} onError={(e) => { e.target.src = DEFAULT_PLACE_IMAGE }} />
            <div className={styles.bottomLine} />

            {/* Rating badge — top left */}
            <div className={styles.ratingBadge}>
              <svg className={styles.ratingStar} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={styles.ratingText}>{displayRating}</span>
            </div>

            {/* Treatments count — top right */}
            <div className={styles.treatmentsBadge}>
              {displayBookingsCount}+ treatments
            </div>

            {/* Share button — bottom right */}
            <button className={styles.shareBtn} onClick={(e) => { e.stopPropagation(); onShare?.(place) }}>
              <svg className={styles.shareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>

            {/* Discount badge */}
            {isDiscountActive(place) && (
              <div className={styles.discountBadge}>
                <span className={styles.discountText}>{place.discountPercentage}% OFF</span>
              </div>
            )}

            {/* Category badge — bottom left (non-massage) */}
            {variant !== 'profile' && category !== 'massage' && (
              <div className={styles.categoryBadge}>{getCategoryBadgeText(category)}</div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className={styles.location}>
          <div className={styles.locationCity}>
            <svg className={styles.locationPin} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className={styles.locationTruncate}>
              {place?.address || place?.location || place?.city || 'Location'}
            </span>
          </div>
          <div className={styles.locationArea}>
            {place?.city ? `Serves ${place.city} area` : 'View profile for location'}
          </div>
        </div>

        {/* Profile pic — overlapping image */}
        <div className={styles.profileWrap}>
          <div className={styles.profileRow}>
            <div className={styles.profilePicWrap}>
              <div className={styles.profilePicContainer}>
                <img className={styles.profilePic} src={profileImage} alt={placeName} loading="lazy" onError={(e) => { e.target.src = DEFAULT_PLACE_IMAGE }} />
              </div>
            </div>
          </div>
        </div>

        {/* Name + Status */}
        <div className={styles.nameSection}>
          <div className={styles.nameOffset}>
            <div className={styles.nameRow}>
              {(place?.verifiedBadge || place?.isVerified) && (
                <img src={VERIFIED_BADGE_URL} alt="Verified" className={styles.verifiedBadge} />
              )}
              <h3 className={styles.name}>{placeName}</h3>
            </div>
          </div>
          <div className={styles.statusRow}>
            <div className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
              <span className={styles.dotWrap}>
                <span className={`${styles.dot} ${isOpen ? styles.dotOpen : styles.dotClosed}`} />
                {isOpen && (<><span className={styles.ring1} /><span className={styles.ring2} /></>)}
              </span>
              <span className={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</span>
            </div>
            {category === 'massage' && (
              <div className={styles.branchImg}>
                <img src={BRANCH_ICON_URL} alt="" className={styles.branchImgInner} loading="lazy" />
              </div>
            )}
          </div>
        </div>

        {/* Focus note */}
        <div className={styles.focusNote}>
          {getMetaBarLabel(category)} · Visit our location
        </div>

        {/* Photos strip */}
        {photoItems.length > 0 && (
          <div className={styles.photosWrap}>
            <p className={styles.photosTitle}>Photos</p>
            <div className={styles.photosRow}>
              {photoItems.map((url, i) => (
                <button key={i} className={styles.photoThumb} onClick={(e) => { e.stopPropagation(); setSelectedPhoto(url) }}>
                  <img src={url} alt="" className={styles.photoThumbImg} loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Treatments */}
        <div className={styles.treatments}>
          <p className={styles.treatmentsText}>
            <span className={styles.treatmentsBold}>Treatments:</span> {getTreatmentsLabel(place, category)}
          </p>
        </div>

        {/* Description */}
        {place?.description && (
          <p className={styles.description}>{place.description}</p>
        )}

        {/* Languages (profile only) */}
        {variant === 'profile' && languages.length > 0 && (
          <div className={styles.langWrap}>
            <p className={styles.langTitle}>Languages spoken</p>
            <div className={styles.langList}>
              {languages.map((lang, i) => (
                <span key={i} className={styles.langPill}>
                  <span className={styles.langFlag}>{LANGUAGE_FLAG_MAP[lang.toLowerCase()] || '🌐'}</span>
                  <span>{lang}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price container — thumbnail + 60/90/120 grid */}
        <div className={styles.priceWrap}>
          <div className={styles.priceInner}>
            <div className={styles.priceThumb}>
              <img src={profileImage} alt={placeName} className={styles.priceThumbImg} onError={(e) => { e.target.src = DEFAULT_PLACE_IMAGE }} />
            </div>
            <div className={styles.priceBody}>
              <div className={styles.priceLabels}>
                <div className={styles.priceCell}>60 min</div>
                <div className={styles.priceCell}>90 min</div>
                <div className={styles.priceCell}>120 min</div>
              </div>
              <div className={styles.priceValues}>
                <div className={styles.priceCell}>{formatPrice(pricing['60'])}</div>
                <div className={styles.priceCell}>{formatPrice(pricing['90'])}</div>
                <div className={styles.priceCell}>{formatPrice(pricing['120'])}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons — View Profile + Menu Prices (listing) or Book Now + Menu Prices (profile) */}
        <div className={styles.buttonRow}>
          <button type="button" className={styles.filledBtn} onClick={(e) => { e.stopPropagation(); onClick?.(place) }}>
            {variant === 'profile' ? 'Book Now' : 'View Profile'}
          </button>
          <button type="button" className={styles.outlineBtn} onClick={(e) => { e.stopPropagation(); setShowMenuSlider(true) }}>
            Menu Prices
          </button>
        </div>
      </div>
    </div>
  )
}
