/**
 * DestinationDirectory — browse destinations by category.
 * Shows place cards with photo, distance, price.
 * Under 10km = one way. Over 10km = return trip.
 * Tap to auto-fill booking with destination + fixed price.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DIRECTORY_CATEGORIES, getDestinationsByCategory,
  calculateDirectoryPrice, fmtIDR,
} from '@/services/directoryService'
import styles from './DestinationDirectory.module.css'

export default function DestinationDirectory({ open, onClose, onSelectDestination, vehicleMode }) {
  const [category, setCategory] = useState('all')

  if (!open) return null

  const destinations = category === 'all'
    ? getDestinationsByCategory('all').slice(0, 20)
    : getDestinationsByCategory(category)

  const isBike = vehicleMode !== 'car_taxi'

  // Day/night background matching booking page
  const h = new Date().getHours()
  const isNight = h >= 18 || h < 6
  const bgImage = isBike
    ? (isNight ? 'https://ik.imagekit.io/nepgaxllc/Untitleddfsadfasdfdasdasdasdsdfasd.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdf.png')
    : (isNight ? 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdf.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddd.png')

  return createPortal(
    <div className={styles.page} style={{ backgroundImage: `url("${bgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center top' }}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>📍 Destinations</span>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Category chips */}
      <div className={styles.categories}>
        <button className={`${styles.catChip} ${category === 'all' ? styles.catChipActive : ''}`} onClick={() => setCategory('all')}>
          All
        </button>
        {DIRECTORY_CATEGORIES.map(c => (
          <button key={c.id} className={`${styles.catChip} ${category === c.id ? styles.catChipActive : ''}`} onClick={() => setCategory(c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Destination cards */}
      <div className={styles.body}>
        {destinations.length === 0 && (
          <div className={styles.empty}>No destinations in this category</div>
        )}

        {destinations.map(dest => {
          const pricing = calculateDirectoryPrice(dest)
          const price = isBike ? pricing.bike : pricing.car
          return (
            <button
              key={dest.id}
              className={styles.card}
              onClick={() => {
                onSelectDestination?.({
                  ...dest,
                  price,
                  isReturn: pricing.isReturn,
                  vehiclePrice: pricing,
                })
                onClose()
              }}
            >
              <div className={styles.cardLeft}>
                <span className={styles.cardIcon}>
                  {DIRECTORY_CATEGORIES.find(c => c.id === dest.category)?.icon ?? '📍'}
                </span>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{dest.name}</span>
                <span className={styles.cardAddress}>{dest.address}</span>
                <div className={styles.cardMeta}>
                  <span className={styles.cardDistance}>{dest.distanceKm} km</span>
                  {pricing.isReturn && <span className={styles.cardReturn}>↩ Return trip</span>}
                  {!pricing.isReturn && <span className={styles.cardOneWay}>→ One way</span>}
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.cardPrice}>{fmtIDR(price)}</span>
                <span className={styles.cardVehicle}>{isBike ? '🏍️' : '🚗'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
