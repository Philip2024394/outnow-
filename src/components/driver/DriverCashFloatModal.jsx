import { useState } from 'react'
import styles from './DriverCashFloatModal.module.css'

/** Formats number as "Rp 50.000" Indonesian style */
function fmtRp(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Math.floor(n).toLocaleString('id-ID')
}

/** COD eligibility tier copy */
function eligibilityTier(amount) {
  if (amount <= 0)    return { icon: '🚫', label: 'No COD orders', sub: 'You will only receive non-COD food & ride bookings', color: '#555' }
  if (amount < 30000) return { icon: '⚠️', label: 'Very limited COD', sub: `Small orders only — up to ${fmtRp(amount)}`, color: '#FF9500' }
  if (amount < 75000) return { icon: '🟡', label: 'Some COD orders', sub: `Orders up to ${fmtRp(amount)} eligible`, color: '#FFB800' }
  if (amount < 150000)return { icon: '🟢', label: 'Good COD flow', sub: `Orders up to ${fmtRp(amount)} eligible — most restaurants`, color: '#34C759' }
  return                    { icon: '🔥', label: 'Full COD access', sub: `Orders up to ${fmtRp(amount)} — maximum bookings`, color: '#34C759' }
}

const QUICK_AMOUNTS = [50000, 100000, 150000, 200000, 300000]

export default function DriverCashFloatModal({ driverName = 'Driver', onConfirm, _forceAmount }) {
  const [raw, setRaw] = useState(_forceAmount != null ? String(_forceAmount) : '')

  const numericValue = parseInt(raw.replace(/\D/g, ''), 10) || 0
  const tier = eligibilityTier(numericValue)

  const handleInput = (e) => {
    // Strip non-digits, allow up to 7 digits (max Rp 9.999.999)
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7)
    setRaw(digits)
  }

  const handleQuick = (amount) => setRaw(String(amount))

  const handleConfirm = () => {
    onConfirm(numericValue)
  }

  const handleSkip = () => {
    onConfirm(0)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>💵</span>
          <div>
            <p className={styles.headerTitle}>Cash Float Declaration</p>
            <p className={styles.headerSub}>Hi {driverName} — before you go online</p>
          </div>
        </div>

        {/* Explainer banner */}
        <div className={styles.banner}>
          <span className={styles.bannerIcon}>🍽️</span>
          <p className={styles.bannerText}>
            For <strong>Cash-on-Delivery food orders</strong> the driver pays the restaurant upfront,
            then collects from the customer on delivery. Declaring your cash lets us match
            you to the right orders automatically.
          </p>
        </div>

        {/* Input */}
        <div className={styles.inputSection}>
          <label className={styles.inputLabel}>How much cash do you have right now?</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputPrefix}>Rp</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.input}
              placeholder="0"
              value={raw ? parseInt(raw, 10).toLocaleString('id-ID') : ''}
              onChange={handleInput}
              autoFocus
            />
          </div>

          {/* Quick-pick buttons */}
          <div className={styles.quickRow}>
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                className={`${styles.quickBtn} ${numericValue === a ? styles.quickBtnActive : ''}`}
                onClick={() => handleQuick(a)}
              >
                {fmtRp(a)}
              </button>
            ))}
          </div>
        </div>

        {/* Eligibility pill */}
        <div className={styles.eligibility} style={{ borderColor: tier.color + '55' }}>
          <span className={styles.eligIcon}>{tier.icon}</span>
          <div>
            <p className={styles.eligLabel} style={{ color: tier.color }}>{tier.label}</p>
            <p className={styles.eligSub}>{tier.sub}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>📦</span>
            <span className={styles.infoText}>COD orders with food total above your declared cash will <strong>not</strong> be assigned to you</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🔄</span>
            <span className={styles.infoText}>You can update your cash float anytime from the driver menu</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>🚴</span>
            <span className={styles.infoText}>Ride bookings and non-COD food orders are unaffected</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={false}
          >
            Go Online{numericValue > 0 ? ` · ${fmtRp(numericValue)} float` : ''}
          </button>
          <button className={styles.skipBtn} onClick={handleSkip}>
            No cash right now — skip COD orders
          </button>
        </div>

      </div>
    </div>
  )
}
