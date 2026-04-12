import styles from './SellerBlockedModal.module.css'

/**
 * Shown to a seller whose account has been blocked for commission avoidance.
 * Explains why, gives two exit paths: pay outstanding balance or upgrade to
 * monthly subscription (which waives per-sale commission).
 */
export default function SellerBlockedModal({ open, onPayBalance, onUpgrade, onClose }) {
  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.iconWrap}>
          <span className={styles.icon}>🚫</span>
        </div>

        <h2 className={styles.title}>Account Suspended</h2>
        <p className={styles.body}>
          Your seller account has been suspended due to an unpaid commission balance.
          You must settle your outstanding balance or upgrade to a monthly subscription
          to restore full access.
        </p>

        <div className={styles.infoRow}>
          <span className={styles.infoIcon}>💬</span>
          <span className={styles.infoText}>
            Buyers can still message you, but you <strong>cannot reply</strong> until your
            balance is cleared.
          </span>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPay} onClick={onPayBalance}>
            💰 Pay Outstanding Balance
          </button>
          <button className={styles.btnUpgrade} onClick={onUpgrade}>
            ⭐ Upgrade to Monthly Plan
          </button>
        </div>

        <p className={styles.hint}>
          Monthly subscribers pay no per-sale commission — unlimited selling for a flat fee.
        </p>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  )
}
