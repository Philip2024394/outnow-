/**
 * SellerTrustCard
 * Shows seller reliability info: stats, payment options, hours, badges.
 * Opens from the info button on the catalog slider.
 */
import { createPortal } from 'react-dom'
import { isSellerOpen, getSellerStatusText, DAY_SHORT } from '@/utils/sellerHours'
import styles from './SellerTrustCard.module.css'

const DEFAULT_HOURS = {
  mon: { open: '09:00', close: '17:00', closed: false },
  tue: { open: '09:00', close: '17:00', closed: false },
  wed: { open: '09:00', close: '17:00', closed: false },
  thu: { open: '09:00', close: '17:00', closed: false },
  fri: { open: '09:00', close: '17:00', closed: false },
  sat: { open: '09:00', close: '14:00', closed: false },
  sun: { open: null, close: null, closed: true },
}

const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_MAP = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

export default function SellerTrustCard({ open, onClose, seller }) {
  if (!open || !seller) return null

  const hours = seller.openingHours ?? DEFAULT_HOURS
  const sellerOpen = isSellerOpen(hours)
  const statusText = getSellerStatusText(hours)

  // Stats
  const ordersFilled = seller.ordersFilled ?? 0
  const ordersCanceled = seller.ordersCanceled ?? 0
  const totalOrders = ordersFilled + ordersCanceled
  const fillRate = totalOrders > 0 ? Math.round((ordersFilled / totalOrders) * 100) : 100
  const responseTime = seller.avgResponseMinutes ?? null

  // Business info
  const businessType = seller.businessType ?? 'Seller'
  const memberSince = seller.memberSince ?? seller.createdAt ?? null
  const yearsInBusiness = seller.yearsInBusiness ?? null
  const location = seller.city ? `${seller.city}${seller.country ? `, ${seller.country}` : ''}` : null

  // Trade options
  const safeTrade = seller.safeTrade ?? {}
  const acceptsCOD = seller.cashOnDelivery ?? false
  const customBranding = seller.customBranding ?? null
  const isManufacturer = seller.businessType === 'Manufacturer' || seller.businessType === 'Maker'

  // Badges
  const badges = []
  if (totalOrders >= 100) badges.push({ label: 'Top Seller', color: '#FFE500', bg: 'rgba(255,229,0,0.1)' })
  if (responseTime && responseTime <= 30) badges.push({ label: 'Fast Responder', color: '#8DC63F', bg: 'rgba(141,198,63,0.08)' })
  if (safeTrade.enabled) badges.push({ label: 'Safe Trade', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)' })
  if (seller.verified) badges.push({ label: 'Verified', color: '#8DC63F', bg: 'rgba(141,198,63,0.08)' })

  // Format member since
  let memberText = null
  if (memberSince) {
    const d = new Date(memberSince)
    if (!isNaN(d)) memberText = `Member since ${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
  }

  // Current day
  const today = new Date().getDay()
  const todayKey = ['sun','mon','tue','wed','thu','fri','sat'][today]

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Profile */}
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {seller.photoURL
              ? <img src={seller.photoURL} alt="" className={styles.avatarImg} />
              : <span className={styles.avatarLetter}>{(seller.brandName ?? seller.displayName ?? 'S').charAt(0).toUpperCase()}</span>
            }
            <div className={`${styles.onlineDot} ${sellerOpen ? styles.onlineDotGreen : styles.onlineDotRed}`} />
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>
              {seller.brandName ?? seller.displayName ?? 'Seller'}
              {seller.verified && (
                <img src="https://ik.imagekit.io/nepgaxllc/Untitleddfsdfsdfssss-removebg-preview.png" alt="Verified" className={styles.verifiedBadge} />
              )}
            </span>
            <span className={styles.profileType}>{businessType}</span>
            {location && <span className={styles.profileLocation}>{location}</span>}
          </div>
        </div>

        {/* Status */}
        <div className={`${styles.statusBar} ${sellerOpen ? styles.statusOpen : styles.statusClosed}`}>
          <span className={styles.statusDot} />
          <span>{statusText}</span>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalOrders > 0 ? (totalOrders >= 1000 ? `${Math.floor(totalOrders/1000)}k+` : totalOrders) : '0'}</span>
            <span className={styles.statLabel}>Orders</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: fillRate >= 90 ? '#8DC63F' : fillRate >= 70 ? '#FBBF24' : '#EF4444' }}>{fillRate}%</span>
            <span className={styles.statLabel}>Filled</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{responseTime ? (responseTime < 60 ? `~${responseTime}m` : `~${Math.round(responseTime/60)}h`) : '—'}</span>
            <span className={styles.statLabel}>Reply</span>
          </div>
        </div>

        {/* Member / years */}
        <div className={styles.infoRow}>
          {memberText && <span className={styles.infoItem}>{memberText}</span>}
          {yearsInBusiness && <span className={styles.infoItem}>{yearsInBusiness} year{yearsInBusiness > 1 ? 's' : ''} in business</span>}
        </div>

        {/* Payment & Trade options */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Payment & Trade</span>
          <div className={styles.optionsList}>
            {safeTrade.enabled && (
              <div className={styles.optionItem}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Safe Trade — {[safeTrade.paypal && 'PayPal', safeTrade.escrow && 'Escrow'].filter(Boolean).join(' & ') || 'Available'}</span>
              </div>
            )}
            {!safeTrade.enabled && (
              <div className={`${styles.optionItem} ${styles.optionOff}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Safe Trade not available</span>
              </div>
            )}
            <div className={`${styles.optionItem} ${acceptsCOD ? '' : styles.optionOff}`}>
              <span className={styles.optionIcon}>{acceptsCOD ? '💵' : '—'}</span>
              <span>{acceptsCOD ? 'Cash on Delivery accepted' : 'No Cash on Delivery'}</span>
            </div>
            {customBranding && customBranding !== 'Not available' && (
              <div className={styles.optionItem}>
                <span className={styles.optionIcon}>🏷️</span>
                <span>{customBranding}</span>
              </div>
            )}
            {isManufacturer && (
              <div className={styles.optionItem}>
                <span className={styles.optionIcon}>🏭</span>
                <span>Manufacturer / Maker</span>
              </div>
            )}
          </div>
        </div>

        {/* Opening hours */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Opening Hours</span>
          <div className={styles.hoursGrid}>
            {DAYS_ORDER.map(dayKey => {
              const day = hours[dayKey]
              const isToday = dayKey === todayKey
              const isClosed = !day || day.closed
              return (
                <div key={dayKey} className={`${styles.hoursRow} ${isToday ? styles.hoursToday : ''} ${isClosed ? styles.hoursClosed : ''}`}>
                  <span className={styles.hoursDay}>{DAY_MAP[dayKey]}</span>
                  <span className={styles.hoursTime}>
                    {isClosed ? 'Closed' : `${day.open} — ${day.close}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className={styles.badgesRow}>
            {badges.map(b => (
              <span key={b.label} className={styles.badge} style={{ color: b.color, background: b.bg, borderColor: b.color + '33' }}>
                {b.label}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>,
    document.body
  )
}
