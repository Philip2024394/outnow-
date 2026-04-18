/**
 * RentalSignUpScreen — rental marketplace onboarding.
 * User picks: "List a Rental" (owner) or "Looking to Rent" (renter).
 * Has brand header + side nav panel.
 */
import React from 'react'

import styles from './RentalSignUpScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'
const BG_IMAGE = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasda.png?updatedAt=1776095672208'

export default function RentalSignUpScreen({ open, onClose, onListRental, onRentItems }) {
  if (!open) return null

  return (
    <div className={styles.screen} style={{ backgroundImage: `url("${BG_IMAGE}")` }}>


      {/* Main content */}
      <div className={styles.main}>
        {/* Header — brand logo */}
        <div className={styles.header}>
          <img src={MARKET_LOGO} alt="Indoo Rentals" className={styles.headerLogo} />
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Join Indoo Rentals</h1>
          <p className={styles.heroSub}>Rent anything, anywhere in Indonesia — or list your items and start earning</p>
        </div>

        {/* Options */}
        <div className={styles.options}>
          <button className={styles.optionCard} onClick={() => onListRental?.()}>
            <div className={styles.optionIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="12" x2="12" y2="18"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>List a Rental</span>
              <span className={styles.optionDesc}>I have items to rent out — motors, cars, property, equipment and more</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button className={styles.optionCard} onClick={() => onRentItems?.()}>
            <div className={styles.optionIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Looking to Rent</span>
              <span className={styles.optionDesc}>I want to find and rent items — bikes, cars, villas, cameras and more</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>No commission on your first 3 listings — start earning today</p>
      </div>
    </div>
  )
}
