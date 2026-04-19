/**
 * RentalSignUpScreen — rental marketplace onboarding.
 * User picks: "List a Rental" (owner) or "Looking to Rent" (renter).
 * Has brand header + side nav panel.
 */
import React from 'react'

import styles from './RentalSignUpScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'
const BG_IMAGE = 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasda.png?updatedAt=1776095672208'

export default function RentalSignUpScreen({ open, onClose, onListRental, onRentItems, onSellItem, onBuyItem }) {
  if (!open) return null

  return (
    <div className={styles.screen} style={{ backgroundImage: `url("${BG_IMAGE}")` }}>

      {/* Main content */}
      <div className={styles.main}>
        {/* Header — brand logo */}
        <div className={styles.header}>
          <img src={MARKET_LOGO} alt="Indoo Done Deal" className={styles.headerLogo} />
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Join Indoo Done Deal</h1>
          <p className={styles.heroSub}>Rentals & Sales — rent, buy or sell across Indonesia</p>
        </div>

        {/* Options — 4 cards */}
        <div className={styles.options}>
          <button className={styles.optionCard} onClick={() => onListRental?.()}>
            <div className={styles.optionIcon} style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 24 }}>🔑</span>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle} style={{ color: '#8DC63F' }}>List a Rental</span>
              <span className={styles.optionDesc}>List your motors, cars, property or equipment for rent</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button className={styles.optionCard} onClick={() => onSellItem?.()}>
            <div className={styles.optionIcon} style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <span style={{ fontSize: 24 }}>💰</span>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle} style={{ color: '#FFD700' }}>Sell an Item</span>
              <span className={styles.optionDesc}>Put your vehicle or equipment up for sale</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button className={styles.optionCard} onClick={() => onBuyItem?.()}>
            <div className={styles.optionIcon} style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
              <span style={{ fontSize: 24 }}>🛒</span>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle} style={{ color: '#FFD700' }}>Buy an Item</span>
              <span className={styles.optionDesc}>Browse vehicles and equipment for sale</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button className={styles.optionCard} onClick={() => onRentItems?.()}>
            <div className={styles.optionIcon} style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 24 }}>🏍️</span>
            </div>
            <div className={styles.optionText}>
              <span className={styles.optionTitle} style={{ color: '#8DC63F' }}>Rent an Item</span>
              <span className={styles.optionDesc}>Find motors, cars, villas and more to rent</span>
            </div>
            <svg className={styles.optionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>Free to join · Your first order is on us</p>
      </div>
    </div>
  )
}
