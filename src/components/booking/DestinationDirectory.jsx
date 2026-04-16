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
import SuggestPlaceSheet from './SuggestPlaceSheet'
import styles from './DestinationDirectory.module.css'

// Seeded shuffle so order stays stable during the session
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let _shuffled = null
function getShuffledDestinations() {
  if (!_shuffled) _shuffled = shuffleArray(getDestinationsByCategory('all'))
  return _shuffled
}

export default function DestinationDirectory({ open, onClose, onSelectDestination, vehicleMode }) {
  const [search, setSearch] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)

  if (!open) return null

  let destinations = getShuffledDestinations()

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase()
    destinations = destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q) || d.category.includes(q)
    )
  }

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
        <div className={styles.headerRight}>
          <button className={styles.suggestBtn} onClick={() => setSuggestOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Suggest
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search destinations..."
        />
        {search && <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>}
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

      <SuggestPlaceSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>,
    document.body
  )
}
