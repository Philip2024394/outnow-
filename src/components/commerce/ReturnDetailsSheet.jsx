/**
 * ReturnDetailsSheet
 * Slide-out container showing return policy details for a product.
 * 14-day return window. Buyer pays return if product matches listing,
 * seller pays if product does not match. Links to full Terms & Conditions.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ReturnDetailsSheet.module.css'

const DEFAULT_POLICY = {
  returnsAccepted: true,
  returnWindow: 14,
  conditions: [
    'Item must be unused and in original packaging',
    'If the product matches the listing, the buyer pays return shipping',
    'If the product does not match the listing details, the seller pays return shipping',
    'Refund processed within 3-5 business days after item is received',
  ],
  refundMethod: 'Original payment method',
  exchangeAvailable: true,
  notes: null,
}

export default function ReturnDetailsSheet({ open, onClose, product }) {
  const [showTerms, setShowTerms] = useState(false)

  if (!open) return null

  const policy = product?.returnPolicy ?? DEFAULT_POLICY

  // ── Full Terms & Conditions page ──
  if (showTerms) {
    return createPortal(
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.termsPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.termsHeader}>
            <button className={styles.termsBackBtn} onClick={() => setShowTerms(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <span className={styles.termsTitle}>Terms & Conditions of Sale</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className={styles.termsContent}>
            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>1. Contract Between Buyer and Seller</h3>
              <p className={styles.termsText}>
                All items purchased on the Indoo Market constitute a contract directly between the buyer and the seller. Indoo Market operates as a marketplace platform and is not a party to any transaction. Indoo Market does not involve itself in or bear responsibility for disputes arising between buyers and sellers.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>2. Product Listings & Communication</h3>
              <p className={styles.termsText}>
                The seller is responsible for listing products with accurate specifications, descriptions, and images. Buyers are encouraged to request additional information via the in-app chat before confirming payment. The full chat conversation prior to purchase forms part of the transaction record and may be referenced in the event of a dispute.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>3. Safe Trade Recommendation</h3>
              <p className={styles.termsText}>
                Indoo Market strongly advises all buyers to request PayPal or Escrow payment via Safe Trade for every purchase. In the event of a misunderstanding or dispute between buyer and seller, PayPal or the Escrow service will independently investigate the matter and determine the outcome. This provides both parties with impartial protection.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>4. Display & Visual Variations</h3>
              <p className={styles.termsText}>
                The following details may vary slightly depending on the buyer's device, screen resolution, and display settings. Such variations are inherent to digital commerce and shall not be considered a default or misrepresentation by the seller:
              </p>
              <ul className={styles.termsList}>
                <li>Colour may appear differently across screens and devices</li>
                <li>Size may vary due to different measuring systems or photographic perspective</li>
                <li>Minor differences in texture, finish, or shade visible in photos versus the physical product</li>
              </ul>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>5. Returns & Refunds</h3>
              <p className={styles.termsText}>
                Buyers have 14 days from the date of delivery to initiate a return. If the product matches the listing description, the buyer is responsible for return shipping costs. If the product does not match the listing details, the seller must cover return shipping costs and issue a full refund. Items must be returned unused and in their original packaging.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>6. Seller Dispatch & Condition</h3>
              <p className={styles.termsText}>
                The seller is responsible for dispatching the product in perfect condition, securely packaged and ready for transit. Indoo Market strongly advises sellers to insure all goods against damage during delivery or loss in transit.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>7. Delivery & Transit</h3>
              <p className={styles.termsText}>
                Once the product has been dispatched, delivery times and transit conditions are managed by the selected delivery company and are outside the control of the seller. Any issues regarding delivery delays, missed deliveries, or transit damage should be raised directly with the delivery company. The seller shall not be held responsible for matters beyond their control during transit. However, the seller is obliged to assist the buyer in resolving any delivery issues in good faith, including providing tracking information and liaising with the carrier where necessary.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>8. Insurance & Risk</h3>
              <p className={styles.termsText}>
                Indoo Market strongly advises both sellers and buyers to insure goods against damage during delivery or loss in transit. Neither Indoo Market nor the seller shall be liable for uninsured items lost or damaged during shipping unless the seller has failed to package the item adequately.
              </p>
            </div>

            <div className={styles.termsSection}>
              <h3 className={styles.termsSectionTitle}>9. Limitation of Liability</h3>
              <p className={styles.termsText}>
                Indoo Market provides the platform for buyers and sellers to connect and transact. Indoo Market does not guarantee the quality, safety, or legality of items listed, the accuracy of listings, the ability of sellers to sell, or the ability of buyers to pay. All transactions are conducted at the sole risk of the buyer and seller.
              </p>
            </div>

            <div className={styles.termsFooter}>
              <p className={styles.termsFooterText}>
                By purchasing on Indoo Market, you agree to these terms and conditions. These terms are subject to change. Last updated: April 2026.
              </p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // ── Return Policy panel ──
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.title}>Return Policy</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Return status */}
          <div className={styles.statusCard}>
            <div className={`${styles.statusDot} ${policy.returnsAccepted ? styles.statusGreen : styles.statusRed}`} />
            <span className={styles.statusText}>
              {policy.returnsAccepted ? 'Returns accepted' : 'No returns'}
            </span>
          </div>

          {policy.returnsAccepted && (
            <>
              {/* Return window */}
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Return Window</span>
                  <span className={styles.infoValue}>{policy.returnWindow} days from delivery</span>
                </div>
              </div>

              {/* Who pays return shipping */}
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Return Shipping</span>
                  <span className={styles.infoValue}>Buyer pays if product matches listing</span>
                  <span className={styles.infoValueSub}>Seller pays if product does not match listing</span>
                </div>
              </div>

              {/* Refund method */}
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Refund Method</span>
                  <span className={styles.infoValue}>{policy.refundMethod}</span>
                </div>
              </div>

              {/* Exchange */}
              <div className={styles.infoBlock}>
                <div className={styles.infoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </div>
                <div className={styles.infoBody}>
                  <span className={styles.infoLabel}>Exchange</span>
                  <span className={styles.infoValue}>
                    {policy.exchangeAvailable ? 'Exchange available' : 'No exchanges'}
                  </span>
                </div>
              </div>

              {/* Conditions */}
              {policy.conditions?.length > 0 && (
                <div className={styles.conditionsBlock}>
                  <span className={styles.conditionsTitle}>Conditions</span>
                  <ul className={styles.conditionsList}>
                    {policy.conditions.map((c, i) => (
                      <li key={i} className={styles.conditionItem}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Seller notes */}
              {policy.notes && (
                <div className={styles.notesBlock}>
                  <span className={styles.notesLabel}>Seller Note</span>
                  <p className={styles.notesText}>{policy.notes}</p>
                </div>
              )}
            </>
          )}

          {!policy.returnsAccepted && (
            <div className={styles.noReturnsMsg}>
              This seller does not accept returns on this product. Please contact the seller via chat for any issues.
            </div>
          )}

          {/* Terms & Conditions link */}
          <button className={styles.termsLink} onClick={() => setShowTerms(true)}>
            Terms & Conditions of Sale
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
