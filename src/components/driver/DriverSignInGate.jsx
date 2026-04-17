/**
 * DriverSignInGate
 * Blocking screen shown when driver taps "Go Online" and has unpaid commission.
 * Driver must transfer outstanding amount to Indoo bank account and
 * upload proof — admin verifies and marks paid before driver can go online.
 *
 * No bypass — driver cannot go online until commission is cleared.
 */
import { useState, useRef } from 'react'
import styles from './DriverSignInGate.module.css'

const INDOO_BANK = {
  name:   'BCA',
  number: '7890 1234 56',
  holder: 'PT Indoo Indonesia',
}

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

export default function DriverSignInGate({ open, driverName, commissions = [], onProofSubmitted, _forceSubmitted = false }) {
  const [proofUrl,   setProofUrl]   = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [submitted,  setSubmitted]  = useState(_forceSubmitted)
  const fileRef = useRef(null)

  if (!open) return null

  const totalDue = commissions.reduce((s, c) => s + (c.amount ?? 0), 0)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    const url = URL.createObjectURL(file)
    await new Promise(r => setTimeout(r, 900))
    setProofUrl(url)
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!proofUrl) return
    setUploading(true)
    await new Promise(r => setTimeout(r, 700))
    setUploading(false)
    setSubmitted(true)
    onProofSubmitted?.({ proofUrl, totalDue })
  }

  return (
    <div className={styles.screen}>

      {submitted ? (
        <div className={styles.submittedState}>
          <span className={styles.submittedIcon}>📤</span>
          <span className={styles.submittedTitle}>Proof Submitted</span>
          <span className={styles.submittedSub}>
            Admin will verify your transfer and unlock your account.
            You'll be notified as soon as it's confirmed.
          </span>
          <div className={styles.submittedAmount}>{fmtRp(totalDue)}</div>
          <p className={styles.submittedNote}>
            Need help? Contact support via the menu.
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className={styles.gateIcon}>🔒</div>
          <h1 className={styles.gateTitle}>Commission Due</h1>
          <p className={styles.gateSub}>
            Clear your balance before going online, {driverName ?? 'driver'}.
          </p>

          {/* Outstanding card */}
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>Total outstanding</span>
            <span className={styles.balanceAmount}>{fmtRp(totalDue)}</span>
            <span className={styles.balanceSub}>10% commission on completed rides</span>
          </div>

          {/* Ride breakdown */}
          {commissions.length > 0 && (
            <div className={styles.rideList}>
              {commissions.map((c, i) => (
                <div key={c.id ?? i} className={styles.rideRow}>
                  <span className={styles.rideRef}>{c.orderRef ?? `Ride ${i + 1}`}</span>
                  <span className={styles.rideFare}>{fmtRp(c.fare ?? 0)} fare</span>
                  <span className={styles.rideComm}>{fmtRp(c.amount)} due</span>
                </div>
              ))}
            </div>
          )}

          {/* Bank transfer instructions */}
          <div className={styles.bankCard}>
            <div className={styles.bankCardTop}>
              <span className={styles.bankCardBrand}>Transfer to Indoo</span>
              <span className={styles.bankCardBank}>{INDOO_BANK.name}</span>
            </div>
            <div className={styles.bankCardNumber}>{INDOO_BANK.number}</div>
            <div className={styles.bankCardHolder}>{INDOO_BANK.holder}</div>
            <div className={styles.bankCardAmount}>
              Transfer exactly <strong>{fmtRp(totalDue)}</strong>
            </div>
          </div>

          {/* Proof upload */}
          {!proofUrl ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              <button
                className={styles.uploadBtn}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '⏳ Uploading…' : '📷 Upload Transfer Screenshot'}
              </button>
            </>
          ) : (
            <div className={styles.proofWrap}>
              <img src={proofUrl} alt="Transfer proof" className={styles.proofImg} />
              <span className={styles.proofLabel}>Screenshot uploaded ✓</span>
            </div>
          )}

          {proofUrl && (
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? '⏳ Submitting…' : 'Submit for Verification'}
            </button>
          )}

          <p className={styles.footerNote}>
            Account is blocked for online work until commission is verified by admin.
            Unpaid for 14 days = account suspension.
          </p>
        </>
      )}

    </div>
  )
}
