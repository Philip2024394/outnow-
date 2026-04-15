/**
 * SafeTradeModal
 * Center modal explaining what Safe Trade is (PayPal / Escrow protection)
 * and whether the seller offers it for this product.
 */
import { createPortal } from 'react-dom'
import styles from './SafeTradeModal.module.css'

export default function SafeTradeModal({ open, onClose, product, sellerName }) {
  if (!open) return null

  const safeTrade = product?.safeTrade ?? {}
  const offered = safeTrade.enabled ?? false
  const paypal = safeTrade.paypal ?? false
  const escrow = safeTrade.escrow ?? false

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.shieldIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 className={styles.title}>Safe Trade</h2>
          <p className={styles.subtitle}>Buyer protection for secure transactions</p>
        </div>

        {/* What is Safe Trade */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>What is Safe Trade?</h3>
          <p className={styles.sectionText}>
            Safe Trade protects both buyers and sellers by holding payment in a secure escrow until the buyer confirms they received the item as described. If there's a dispute, the payment service mediates.
          </p>
        </div>

        {/* How it works */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>How it works</h3>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>Buyer pays</span>
                <span className={styles.stepSub}>Payment is held securely by PayPal or Escrow</span>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>Seller ships</span>
                <span className={styles.stepSub}>Seller sends the item with tracking</span>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>Buyer confirms</span>
                <span className={styles.stepSub}>Buyer inspects and approves the item</span>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>4</div>
              <div className={styles.stepText}>
                <span className={styles.stepLabel}>Seller gets paid</span>
                <span className={styles.stepSub}>Funds are released to the seller</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller status */}
        <div className={styles.sellerStatus}>
          <div className={styles.sellerHeader}>
            <span className={styles.sellerLabel}>
              {sellerName ?? 'This seller'}
            </span>
            <div className={`${styles.statusBadge} ${offered ? styles.statusOn : styles.statusOff}`}>
              <span className={styles.statusDot} />
              {offered ? 'Offers Safe Trade' : 'Not available'}
            </div>
          </div>

          {offered && (
            <div className={styles.methods}>
              {paypal && (
                <div className={styles.methodCard}>
                  <div className={styles.methodIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.965L7.076 21.337z"/>
                    </svg>
                  </div>
                  <span className={styles.methodName}>PayPal</span>
                  <span className={styles.methodSub}>Buyer Protection</span>
                </div>
              )}
              {escrow && (
                <div className={styles.methodCard}>
                  <div className={styles.methodIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span className={styles.methodName}>Escrow</span>
                  <span className={styles.methodSub}>Held until confirmed</span>
                </div>
              )}
            </div>
          )}

          {!offered && (
            <p className={styles.notAvailableText}>
              This seller has not enabled Safe Trade for this product. You can still order via chat and arrange payment directly.
            </p>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
