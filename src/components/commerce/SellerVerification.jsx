/**
 * SellerVerification — KTP/ID upload for seller verification.
 * Seller uploads photo of their ID, admin reviews in ID Verify tab.
 * Verified sellers get the verified badge.
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './SellerVerification.module.css'

export default function SellerVerification({ open, onClose, onSubmit }) {
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef(null)

  if (!open) return null

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPhoto(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!photo || !fullName.trim() || !idNumber.trim()) return
    setSubmitting(true)
    // In production: upload to Supabase storage, create verification request
    onSubmit?.({ fullName: fullName.trim(), idNumber: idNumber.trim(), photoUrl: previewUrl })
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 800)
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {submitted ? (
          <div className={styles.successWrap}>
            <span className={styles.successIcon}>✅</span>
            <span className={styles.successTitle}>Verification Submitted</span>
            <span className={styles.successSub}>Admin will review your ID within 24-48 hours. You'll receive a notification when verified.</span>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.title}>Seller Verification</span>
              <span className={styles.subtitle}>Upload your KTP/ID to get the verified badge</span>
            </div>

            <div className={styles.body}>
              <div className={styles.benefits}>
                <span className={styles.benefitsTitle}>Why verify?</span>
                <div className={styles.benefit}>✓ Verified badge on your profile</div>
                <div className={styles.benefit}>✓ Buyers trust verified sellers more</div>
                <div className={styles.benefit}>✓ Higher visibility in search results</div>
                <div className={styles.benefit}>✓ Access to auction and flash sale features</div>
              </div>

              <label className={styles.fieldLabel}>Full Name (as on ID)</label>
              <input className={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full legal name" />

              <label className={styles.fieldLabel}>ID Number (KTP/Passport)</label>
              <input className={styles.input} value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="e.g. 3171XXXXXXXXXXXX" maxLength={20} />

              <label className={styles.fieldLabel}>Photo of ID</label>
              <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />

              {previewUrl ? (
                <div className={styles.previewWrap}>
                  <img src={previewUrl} alt="ID" className={styles.previewImg} />
                  <button className={styles.changeBtn} onClick={() => inputRef.current?.click()}>Change Photo</button>
                </div>
              ) : (
                <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Upload KTP / ID Photo
                </button>
              )}

              <div className={styles.notice}>
                Your ID is securely stored and only visible to admin for verification. It will not be shared with buyers or other sellers.
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!photo || !fullName.trim() || !idNumber.trim() || submitting}>
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
