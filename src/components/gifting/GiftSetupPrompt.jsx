/**
 * GiftSetupPrompt.jsx
 * Shown when a user taps the 🛍️ Gift button on their OWN profile,
 * OR when they open the shopping screen without a confirmed delivery address.
 *
 * Explains two things:
 *  1. You can shop the marketplace as a buyer
 *  2. Others can send YOU anonymous gifts — but you need a confirmed address
 *
 * Privacy notice included: address is never shared with senders.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasGiftAddress } from '@/services/giftService'
import GiftAddressSheet from './GiftAddressSheet'
import styles from './GiftSetupPrompt.module.css'

export default function GiftSetupPrompt({ open, onClose, onShop, onWishlist, showToast }) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null

  const [addressSaved,     setAddressSaved]     = useState(false)
  const [addressChecked,   setAddressChecked]   = useState(false)
  const [addressSheetOpen, setAddressSheetOpen] = useState(false)

  useEffect(() => {
    if (!open || !userId || addressChecked) return
    hasGiftAddress(userId).then(has => {
      setAddressSaved(has)
      setAddressChecked(true)
    })
  }, [open, userId, addressChecked])

  // Re-check after address sheet closes
  const handleAddressSheetClose = () => {
    setAddressSheetOpen(false)
    setAddressChecked(false) // trigger re-check
  }

  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.container} onClick={e => e.stopPropagation()}>

          <div className={styles.handle} />

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.headerEmoji}>🛍️</span>
            <div className={styles.headerText}>
              <h2 className={styles.title}>Indoo Marketplace</h2>
              <p className={styles.subtitle}>Shop local sellers or receive anonymous gifts from admirers</p>
            </div>
          </div>

          {/* Option 1 — Shop */}
          <button className={styles.optionCard} onClick={onShop}>
            <div className={styles.optionIcon}>🏪</div>
            <div className={styles.optionBody}>
              <div className={styles.optionTitle}>Browse the Marketplace</div>
              <div className={styles.optionSub}>
                Discover local sellers — fashion, food, handmade, electronics and more
              </div>
            </div>
            <svg className={styles.optionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Option 2 — My Wishlist */}
          <button className={[styles.optionCard, styles.optionCardWishlist].join(' ')} onClick={onWishlist}>
            <div className={styles.optionIcon}>🎁</div>
            <div className={styles.optionBody}>
              <div className={styles.optionTitle}>My Wishlist</div>
              <div className={styles.optionSub}>
                Pin up to 5 marketplace items — admirers can send them as anonymous gifts before or after a date
              </div>
            </div>
            <svg className={styles.optionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Option 3 — Receive gifts */}
          <div className={[styles.optionCard, styles.optionCardGift].join(' ')}>
            <div className={styles.optionIcon}>🎁</div>
            <div className={styles.optionBody}>
              <div className={styles.optionTitle}>
                Receive Anonymous Gifts
                {addressSaved && <span className={styles.confirmedBadge}>✓ Confirmed</span>}
              </div>
              <div className={styles.optionSub}>
                Admirers can send you real gifts from local sellers, delivered to your door — completely anonymously
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className={styles.privacyNotice}>
            <span className={styles.privacyIcon}>🔒</span>
            <p className={styles.privacyText}>
              <strong>Your address is never shared with the person sending the gift.</strong>{' '}
              Sellers receive your address only to complete delivery, under strict confidentiality.
              It auto-deletes 7 days after your gift is delivered.
            </p>
          </div>

          {/* CTA — if no address saved */}
          {addressChecked && !addressSaved && (
            <button
              className={styles.ctaBtn}
              onClick={() => setAddressSheetOpen(true)}
            >
              🔒 Confirm My Delivery Address
            </button>
          )}

          {addressChecked && addressSaved && (
            <div className={styles.allSetRow}>
              <span className={styles.allSetCheck}>✓</span>
              <span className={styles.allSetText}>Your delivery address is confirmed — you can receive gifts</span>
            </div>
          )}

          <button className={styles.dismissBtn} onClick={onClose}>
            Maybe later
          </button>

        </div>
      </div>

      <GiftAddressSheet
        open={addressSheetOpen}
        onClose={handleAddressSheetClose}
        showToast={showToast}
      />
    </>
  )
}
