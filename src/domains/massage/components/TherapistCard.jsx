/**
 * TherapistCard — Composed card assembling all sub-components.
 * Converted from src/components/TherapistCard.tsx (1523 lines → ~200 lines)
 * TypeScript removed. Appwrite→Supabase. Tailwind→CSS Modules. Layout identical.
 *
 * Render structure preserved exactly from source lines 1239-1383:
 * Card → CardHeader → Location → Profile → ClientPref → Bio → Specialties → Languages → PricingGrid → Buttons
 */
import { useState, useMemo, useCallback, useRef } from 'react'
import { AvailabilityStatus } from '../constants/types'
import {
  getDisplayStatus, getTherapistDisplayName, isDiscountActive,
  getTranslatedDescription, formatPrice, getLocationCity,
  getClientPreferenceDisplay, getCombinedMenuForDisplay,
  getCheapestServiceByTotalPrice,
} from '../utils/therapistCardHelpers'
import { getDisplayRating, formatRating } from '../utils/ratingUtils'
import TherapistCardHeader from './therapist/TherapistCardHeader'
import TherapistProfile from '../modules/therapist/TherapistProfile'
import TherapistSpecialties from '../modules/therapist/TherapistSpecialties'
import TherapistLanguages from '../modules/therapist/TherapistLanguages'
import TherapistPricingGrid from '../modules/therapist/TherapistPricingGrid'
import TherapistPriceListModal from '../modules/therapist/TherapistPriceListModal'
import styles from './TherapistCard.module.css'

const BUTTON_ACTION_GUARD_MS = 300

export default function TherapistCard({ therapist, onBookNow, onSchedule, onShare, language = 'en' }) {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(null)
  const [selectedPriceKey, setSelectedPriceKey] = useState(null)
  const [showPriceListModal, setShowPriceListModal] = useState(false)
  const lastBookRef = useRef(0)
  const lastScheduleRef = useRef(0)

  // Display values — same logic as source
  const displayStatus = getDisplayStatus(therapist)
  const displayImage = therapist.profilePicture || therapist.mainImage || therapist.profileImage || ''
  const displayRatingVal = getDisplayRating(therapist.rating, therapist.reviewCount)
  const displayRating = formatRating(displayRatingVal)
  const translatedDescription = getTranslatedDescription(therapist, language)
  const locationCity = getLocationCity(therapist.location)
  const locationArea = therapist.area || locationCity
  const bookingsCount = therapist.bookingsCount || Math.floor(10 + ((therapist.id?.toString()?.charCodeAt?.(2)) || 0) % 40)
  const chatLang = language === 'id' ? 'id' : 'en'

  // Busy countdown
  const [countdown, setCountdown] = useState(null)
  const [isOvertime, setIsOvertime] = useState(false)

  // Pricing — same as source getPricing()
  const pricing = useMemo(() => {
    const parse = (v) => (v != null && Number(v) > 0 ? Number(v) * 1000 : 0)
    return {
      '60': parse(therapist.price60),
      '90': parse(therapist.price90),
      '120': parse(therapist.price120),
    }
  }, [therapist.price60, therapist.price90, therapist.price120])

  // Combined menu for display services
  const combinedMenu = useMemo(() => getCombinedMenuForDisplay(null, therapist), [therapist])

  // Up to 3 services for PricingGrid
  const displayServices = useMemo(() => {
    if (combinedMenu.length === 0) return [{ serviceName: 'Traditional Massage', pricing }]
    return combinedMenu.slice(0, 3).map(item => ({
      serviceName: item.name ?? item.serviceName ?? 'Traditional Massage',
      pricing: {
        '60': Number(item.price60) * 1000,
        '90': Number(item.price90) * 1000,
        '120': Number(item.price120) * 1000,
      },
    }))
  }, [combinedMenu, pricing])

  // Button handlers with guard
  const handleBookNow = useCallback(() => {
    const now = Date.now()
    if (now - lastBookRef.current < BUTTON_ACTION_GUARD_MS) return
    lastBookRef.current = now
    onBookNow?.({ therapist, selectedPriceKey, pricing })
  }, [therapist, selectedPriceKey, pricing, onBookNow])

  const handleSchedule = useCallback(() => {
    const now = Date.now()
    if (now - lastScheduleRef.current < BUTTON_ACTION_GUARD_MS) return
    lastScheduleRef.current = now
    onSchedule?.({ therapist, pricing })
  }, [therapist, pricing, onSchedule])

  // Dynamic spacing
  const descLen = translatedDescription.length
  const spacingClass = descLen < 200 ? styles.spacingSmall : descLen < 300 ? styles.spacingMedium : styles.spacingLarge
  const bookFlash = !!selectedPriceKey

  return (
    <>
      {/* ═══ Main card container ═══ */}
      {/* Was: w-full bg-white rounded-xl shadow-lg border border-gray-200 border-t-4 border-t-amber-400 */}
      <div className={styles.card}>

        {/* 1. TherapistCardHeader — banner with badges */}
        <TherapistCardHeader
          therapist={therapist}
          displayImage={displayImage}
          onShareClick={() => onShare?.(therapist)}
          bookingsCount={bookingsCount}
          displayRating={displayRating}
        />

        {/* 2. Location display — right aligned with pin icon */}
        {/* Was: px-4 mt-3 flex flex-col items-end */}
        <div className={styles.location}>
          <div className={styles.locationCity}>
            <svg className={styles.locationPin} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {locationArea}
          </div>
          <div className={styles.locationArea}>
            Serves {locationArea} area
          </div>
        </div>

        {/* 3. TherapistProfile — overlapping pic + name + status */}
        <TherapistProfile
          therapist={therapist}
          displayStatus={displayStatus}
          isOvertime={isOvertime}
          countdown={countdown}
        />

        {/* 4. Client Preference */}
        {/* Was: mx-4 mb-2, text-xs text-gray-600 */}
        <div className={styles.clientPref}>
          <span className={styles.clientPrefBold}>
            {chatLang === 'id' ? 'Menerima' : 'Accepts'}:
          </span>{' '}
          {getClientPreferenceDisplay(therapist.clientPreferences, chatLang)}
        </div>

        {/* 5. Bio */}
        {/* Was: bg-white/90 backdrop-blur-sm rounded-lg py-2 px-3 mx-4 mb-3, line-clamp-6 */}
        <div className={styles.bio}>
          <p className={styles.bioText}>{translatedDescription}</p>
        </div>

        {/* 6. TherapistSpecialties */}
        <TherapistSpecialties therapist={therapist} />

        {/* 7. TherapistLanguages */}
        <TherapistLanguages
          therapist={therapist}
          translatedDescriptionLength={descLen}
        />

        {/* 8. TherapistPricingGrid — 1-3 service cards */}
        {pricing['60'] > 0 && pricing['90'] > 0 && pricing['120'] > 0 && (
          <TherapistPricingGrid
            pricing={pricing}
            therapist={therapist}
            displayRating={displayRating}
            formatPriceFn={formatPrice}
            translatedDescriptionLength={descLen}
            menuData={combinedMenu}
            services={displayServices}
            selectedServiceIndex={selectedServiceIndex}
            onSelectServiceIndex={(index) => {
              setSelectedServiceIndex(index)
              setSelectedPriceKey(index != null ? '90' : null)
            }}
            selectedPriceKey={selectedPriceKey}
            onSelectPriceKey={setSelectedPriceKey}
            onPriceClick={() => setShowPriceListModal(true)}
            language={chatLang}
            displayImage={displayImage}
          />
        )}

        {/* 9. Button row — Book Now + Schedule + Menu Prices */}
        {/* Was: relative z-10 flex gap-2 px-4 */}
        <div className={`${styles.buttonRow} ${spacingClass}`}>
          <button
            type="button"
            onClick={handleBookNow}
            className={`${styles.filledBtn} ${bookFlash ? styles.filledBtnFlash : ''}`}
          >
            {chatLang === 'id' ? 'Pesan Sekarang' : 'Book Now'}
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className={styles.filledBtn}
          >
            {chatLang === 'id' ? 'Terjadwal' : 'Scheduled'}
          </button>
          <button
            type="button"
            onClick={() => setShowPriceListModal(true)}
            className={styles.outlineBtn}
          >
            Menu Prices
          </button>
        </div>

        {/* 10. Hotel/Villa partner link (conditional) */}
        {therapist.partneredHotelVilla && (
          <div className={styles.partnerLink}>
            <button className={styles.partnerBtn}>
              <div className={styles.partnerInner}>
                <svg className={styles.partnerIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
                <div className={styles.partnerBody}>
                  <p className={styles.partnerName}>Partnered with {therapist.partneredHotelVilla}</p>
                  <p className={styles.partnerSub}>View partner hotels & villas →</p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Price List Modal — slide-up full menu */}
      <TherapistPriceListModal
        showPriceListModal={showPriceListModal}
        setShowPriceListModal={setShowPriceListModal}
        therapist={therapist}
        menuData={combinedMenu}
        onBookNow={handleBookNow}
        onSchedule={handleSchedule}
        chatLang={chatLang}
      />
    </>
  )
}
