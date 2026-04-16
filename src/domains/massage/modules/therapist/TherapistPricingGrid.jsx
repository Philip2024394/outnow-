/**
 * TherapistPricingGrid — Up to 3 service cards with 60/90/120 pricing.
 * Converted from src/modules/therapist/TherapistPricingGrid.tsx
 * TypeScript removed. Tailwind→CSS Modules. Layout identical.
 *
 * Key feature: servicesToShow.map() renders 1-3 selectable price cards.
 * Each card: thumbnail + service name + Popular Choice badge + 60/90/120 grid.
 * Tap to select → Book Now heartbeat animation.
 */
import { useState } from 'react'
import { isDiscountActive, getCheapestServiceByTotalPrice } from '../../utils/therapistCardHelpers'
import { getPriceCardTitle } from '../../utils/priceCardTitle'
import { formatPrice } from '../../utils/therapistCardHelpers'
import styles from './TherapistPricingGrid.module.css'

const DEFAULT_PRICE_IMAGE = 'https://ik.imagekit.io/7grri5v7d/hotel%20massage%20indoniseas.png?updatedAt=1761154913720'

const ROWS = [
  { label: '60min', key: '60' },
  { label: '90min', key: '90' },
  { label: '120min', key: '120' },
]

export default function TherapistPricingGrid({
  pricing,
  therapist,
  displayRating,
  formatPriceFn,
  getDynamicSpacingFn,
  translatedDescriptionLength = 0,
  menuData = [],
  services: servicesProp,
  selectedServiceIndex = null,
  onSelectServiceIndex,
  selectedPriceKey = null,
  onSelectPriceKey,
  onPriceClick,
  language = 'en',
  displayImage,
}) {
  const fmt = formatPriceFn || formatPrice

  const getFallbackServiceName = () => {
    if (!menuData || menuData.length === 0) return 'Traditional Massage'
    const withFull = menuData.filter(item => {
      return Number(item.price60) > 0 && Number(item.price90) > 0 && Number(item.price120) > 0
    })
    if (withFull.length === 0) return 'Traditional Massage'
    const cheapest = getCheapestServiceByTotalPrice(withFull)
    if (!cheapest) return 'Traditional Massage'
    return cheapest.name || cheapest.serviceName || cheapest.title || 'Traditional Massage'
  }

  const servicesToShow = servicesProp && servicesProp.length > 0
    ? servicesProp.slice(0, 3)
    : [{ serviceName: getFallbackServiceName(), pricing }]

  const isId = language === 'id'
  const badgeLabel = isId ? 'Pilihan Populer' : 'Popular Choice'

  const renderPrice = (pricingMap, key) => {
    const val = Number(pricingMap[key])
    if (val <= 0) return isId ? 'Hubungi' : 'Contact'
    if (isDiscountActive(therapist)) {
      const discounted = Math.round(val * (1 - (therapist.discountPercentage || 0) / 100))
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          <span>{fmt(discounted)}</span>
          <span className={styles.gridStrikethrough}>{fmt(val)}</span>
        </span>
      )
    }
    return <span style={{ whiteSpace: 'nowrap' }}>{fmt(val)}</span>
  }

  const isSelectable = (onSelectServiceIndex != null && servicesToShow.length > 1) || onSelectPriceKey != null

  // Dynamic spacing from description length
  const spacingClass = translatedDescriptionLength < 200 ? styles.spacingSmall
    : translatedDescriptionLength < 300 ? styles.spacingMedium : styles.spacingLarge

  return (
    <div className={`${styles.wrap} ${spacingClass}`}>
      {/* Header: "Trending Sessions" */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          {/* Sparkles icon — was lucide Sparkles */}
          <svg className={styles.sparkleIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          Trending Sessions
        </h3>
        <p className={styles.subtitle}>
          {isId ? 'Pilih sesi di bawah lalu Book Now' : 'Select window below and Book Now'}
        </p>
        <p className={styles.serviceName}>
          {servicesToShow.length <= 1 ? (
            <>
              {getPriceCardTitle(servicesToShow[0]?.serviceName, 'Service')}
              {isDiscountActive(therapist) && (
                <span className={styles.discountNote}>🔥 {isId ? 'Harga diskon ditampilkan' : 'Discounted prices displayed'}</span>
              )}
            </>
          ) : (
            isDiscountActive(therapist) && (
              <span className={styles.discountNote}>🔥 {isId ? 'Harga diskon ditampilkan' : 'Discounted prices displayed'}</span>
            )
          )}
        </p>
      </div>

      {/* Service Cards — up to 3 */}
      <div className={styles.cardList}>
        {servicesToShow.map((svc, index) => {
          const isSelected = servicesToShow.length > 1 ? selectedServiceIndex === index : selectedPriceKey != null

          const handleCardClick = () => {
            if (!isSelectable) return
            if (servicesToShow.length > 1 && onSelectServiceIndex) {
              onSelectServiceIndex(isSelected ? null : index)
              return
            }
            if (onSelectPriceKey) onSelectPriceKey(selectedPriceKey ? null : '90')
          }

          return (
            <div
              key={`price-card-${index}-${svc.serviceName}`}
              role={isSelectable ? 'button' : undefined}
              tabIndex={isSelectable ? 0 : undefined}
              onClick={(e) => {
                if (isSelectable && !e.target.closest('button')) {
                  e.stopPropagation()
                  handleCardClick()
                }
              }}
              onKeyDown={(e) => {
                if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleCardClick()
                }
              }}
              className={[
                styles.priceCard,
                styles.priceCardHighlight,
                isSelectable ? styles.priceCardSelectable : '',
                isSelected ? styles.priceCardSelected : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={styles.priceCardInner}>
                {/* Thumbnail */}
                <div className={styles.thumb}>
                  <img
                    src={(displayImage || therapist?.mainImage || therapist?.profilePicture || DEFAULT_PRICE_IMAGE).trim() || DEFAULT_PRICE_IMAGE}
                    alt=""
                    className={styles.thumbImg}
                    onError={(e) => { e.target.src = DEFAULT_PRICE_IMAGE }}
                  />
                  {/* Selected overlay with fingerprint icon */}
                  {isSelected && (
                    <div className={styles.thumbOverlay} aria-hidden>
                      <svg className={styles.fingerprintIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 10V4m0 0L9 7m3-3l3 3"/><rect x="4" y="10" width="16" height="10" rx="2"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card body: name + badge + price grid */}
                <div className={styles.cardBody}>
                  <div className={styles.cardNameRow}>
                    <span className={styles.cardName} title={getPriceCardTitle(svc.serviceName, 'Service')}>
                      {getPriceCardTitle(svc.serviceName, 'Service')}
                    </span>
                    <span className={styles.popularBadge}>
                      <svg className={styles.badgeSparkle} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Duration labels row */}
                  <div className={styles.priceGridLabels}>
                    {ROWS.map(({ label, key }) => (
                      <span key={`label-${key}`} className={styles.gridLabel}>{label}</span>
                    ))}
                  </div>

                  {/* Price values row */}
                  <div className={styles.priceGridValues}>
                    {ROWS.map(({ key }) => (
                      <span key={`price-${key}`} className={styles.gridValue}>
                        {renderPrice(svc.pricing, key)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info/Eye button — top right of card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onPriceClick?.()
                }}
                className={styles.infoBtn}
                aria-label={isId ? 'Info sesi' : 'Session info'}
                title={isId ? 'Apa yang bisa Anda harapkan' : 'What to expect'}
              >
                {/* Eye icon — was lucide Eye */}
                <svg className={styles.infoBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className={styles.footer}>
        {isId ? 'Tarif profesional · Profil terverifikasi' : 'Professional rates · Verified profile'}
      </p>
    </div>
  )
}
