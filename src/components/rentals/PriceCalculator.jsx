/**
 * PriceCalculator — User picks dates, sees instant price breakdown.
 * Can request to book directly. Shows savings from weekly/monthly rates.
 */
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { calculateRentalPrice, createBookingRequest } from '@/services/rentalTrackingService'
import { fmtPrice } from '@/services/rentalListingService'
import styles from './PriceCalculator.module.css'

export default function PriceCalculator({ vehicle, onClose }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [addDriver, setAddDriver] = useState(false)
  const [booked, setBooked] = useState(false)

  if (!vehicle) return null

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    const diff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.ceil(diff))
  }, [startDate, endDate])

  const pricing = useMemo(() => {
    if (days <= 0) return null
    return calculateRentalPrice({
      priceDaily: vehicle.priceFrom || 75000,
      priceWeekly: (vehicle.priceFrom || 75000) * 6,
      priceMonthly: (vehicle.priceFrom || 75000) * 25,
      driverDaily: Math.round((vehicle.priceFrom || 75000) * 1.5),
      withDriver: true,
    }, days, addDriver)
  }, [days, addDriver, vehicle])

  const today = new Date().toISOString().split('T')[0]

  function handleBook() {
    if (!pricing) return
    createBookingRequest({
      listingId: vehicle.id,
      vehicleName: `${vehicle.name}`,
      renterName: 'Demo User',
      renterPhone: '',
      startDate,
      endDate,
      days,
      total: pricing.total,
      addDriver,
    })
    setBooked(true)
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Price Calculator</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {booked ? (
          <div className={styles.successMsg}>
            <span className={styles.successIcon}>🎉</span>
            <span className={styles.successTitle}>Booking Request Sent!</span>
            <span className={styles.successText}>
              The owner will review your request and contact you via WhatsApp to confirm.
            </span>
          </div>
        ) : (
          <div className={styles.body}>
            {/* Vehicle info */}
            <div className={styles.vehicleRow}>
              <span className={styles.vehicleIcon}>{vehicle.type === 'Matic' || vehicle.type === 'Sport' || vehicle.type === 'Trail' || vehicle.type === 'Adventure' ? '🏍️' : '🚗'}</span>
              <div>
                <span className={styles.vehicleName}>{vehicle.name}</span>
                <span className={styles.vehicleSpec}>{vehicle.cc}cc · {vehicle.type}</span>
              </div>
            </div>

            {/* Date picker */}
            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <span className={styles.dateLabel}>Pickup Date</span>
                <input type="date" className={styles.dateInput} value={startDate} onChange={e => setStartDate(e.target.value)} min={today} />
              </div>
              <div className={styles.dateField}>
                <span className={styles.dateLabel}>Return Date</span>
                <input type="date" className={styles.dateInput} value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || today} />
              </div>
            </div>

            {days > 0 && (
              <div className={styles.daysDisplay}>
                <span className={styles.daysCount}>{days}</span> day{days > 1 ? 's' : ''}
              </div>
            )}

            {/* Driver toggle */}
            <div className={styles.driverRow}>
              <div>
                <span className={styles.driverLabel}>Add Driver</span>
                <div className={styles.driverPrice}>{fmtPrice(Math.round((vehicle.priceFrom || 75000) * 1.5))}/day</div>
              </div>
              <button className={`${styles.toggle} ${addDriver ? styles.toggleOn : ''}`} onClick={() => setAddDriver(!addDriver)}>
                <span className={styles.toggleDot} />
              </button>
            </div>

            {/* Price breakdown */}
            {pricing && (
              <>
                <div className={styles.breakdown}>
                  {pricing.breakdown.map((b, i) => (
                    <div key={i} className={styles.breakdownRow}>
                      <span>{b.label}</span>
                      <span className={styles.breakdownVal}>{fmtPrice(b.amount)}</span>
                    </div>
                  ))}
                  <div className={styles.breakdownTotal}>
                    <span>Total</span>
                    <span>{fmtPrice(pricing.total)}</span>
                  </div>
                </div>

                {pricing.saved > 0 && (
                  <div className={styles.savedBadge}>
                    You save {fmtPrice(pricing.saved)} with weekly/monthly rate!
                  </div>
                )}

                <button className={styles.bookBtn} onClick={handleBook}>
                  Request to Book — {fmtPrice(pricing.total)}
                </button>
                <span className={styles.commNote}>10% service fee included · Chat with owner to confirm</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
