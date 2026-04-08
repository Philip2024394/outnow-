import { useState, useEffect, useRef } from 'react'
import { uploadDriverDocument, submitDriverApplication, getDriverApplication } from '@/services/driverService'
import styles from './DriverDocumentUpload.module.css'

const DOCS = [
  { key: 'sim',          label: 'SIM — Driver\'s License',     desc: 'Must show face, expiry date & license class (A = car · C = motorcycle)' },
  { key: 'stnk',         label: 'STNK — Vehicle Registration', desc: 'Must match your vehicle type with valid registration' },
  { key: 'ktp',          label: 'KTP — ID Card',               desc: 'Must match the name on your SIM' },
  { key: 'vehicle_photo',label: 'Vehicle Photo',               desc: 'Show the license plate clearly' },
  { key: 'selfie_sim',   label: 'Selfie with SIM',             desc: 'Your face and your SIM visible in the same photo' },
]

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT    = 'image/jpeg,image/png,image/jpg'

const STATUS_META = {
  pending:  { label: '⏳ Pending Approval',  cls: 'pending'  },
  approved: { label: '✅ Verified Driver',   cls: 'approved' },
  rejected: { label: '❌ Application Rejected', cls: 'rejected' },
}

export default function DriverDocumentUpload({ userId, driverType }) {
  const [application,  setApplication]  = useState(null)   // existing DB row
  const [loadingApp,   setLoadingApp]   = useState(true)
  const [previews,     setPreviews]     = useState({})      // docKey → data URL
  const [urls,         setUrls]         = useState({})      // docKey → Supabase public URL
  const [uploading,    setUploading]    = useState({})      // docKey → bool
  const [uploadErrors, setUploadErrors] = useState({})      // docKey → message
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState(null)
  const inputRefs = useRef({})

  // Load existing application on mount
  useEffect(() => {
    if (!userId) return
    getDriverApplication(userId).then(app => {
      setApplication(app)
      if (app?.document_urls) setUrls(app.document_urls)
    }).finally(() => setLoadingApp(false))
  }, [userId])

  const allUploaded = DOCS.every(d => !!urls[d.key])
  const canSubmit   = allUploaded && !submitting

  const handleFileChange = async (docKey, file) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setUploadErrors(e => ({ ...e, [docKey]: 'File must be under 5 MB' }))
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrors(e => ({ ...e, [docKey]: 'Only JPG or PNG allowed' }))
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreviews(p => ({ ...p, [docKey]: e.target.result }))
    reader.readAsDataURL(file)

    // Upload to Supabase
    setUploading(u => ({ ...u, [docKey]: true }))
    setUploadErrors(e => ({ ...e, [docKey]: null }))
    try {
      const publicUrl = await uploadDriverDocument(userId, docKey, file)
      setUrls(u => ({ ...u, [docKey]: publicUrl }))
    } catch (err) {
      setUploadErrors(e => ({ ...e, [docKey]: err.message ?? 'Upload failed' }))
    } finally {
      setUploading(u => ({ ...u, [docKey]: false }))
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const app = await submitDriverApplication(userId, driverType, urls)
      setApplication(app)
    } catch (err) {
      setSubmitError(err.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingApp) return <div className={styles.loading}>Loading driver status…</div>

  // ── Already submitted — show status ───────────────────────────────────────
  if (application) {
    const meta = STATUS_META[application.status] ?? STATUS_META.pending
    return (
      <div className={styles.statusWrap}>
        <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
          {meta.label}
        </span>
        {application.status === 'rejected' && (
          <>
            {application.admin_notes && (
              <p className={styles.adminNotes}>
                <strong>Reason:</strong> {application.admin_notes}
              </p>
            )}
            <button
              className={styles.resubmitBtn}
              onClick={() => setApplication(null)}
            >
              Resubmit Documents
            </button>
          </>
        )}
        {application.status === 'pending' && (
          <p className={styles.pendingNote}>
            Our team will review your documents within 24–48 hours.
          </p>
        )}
        {application.status === 'approved' && (
          <p className={styles.approvedNote}>
            You are now a verified Hangger driver. Go online from your profile to start receiving rides.
          </p>
        )}
      </div>
    )
  }

  // ── Upload form ────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>{driverType === 'car_taxi' ? '🚗' : '🛵'}</span>
        <div>
          <p className={styles.headerTitle}>Driver Documents</p>
          <p className={styles.headerSub}>Upload all 5 documents to submit your application. Max 5 MB each — JPG or PNG only.</p>
        </div>
      </div>

      <div className={styles.docList}>
        {DOCS.map(doc => {
          const preview = previews[doc.key] || (urls[doc.key] ? urls[doc.key] : null)
          const done    = !!urls[doc.key]
          const busy    = !!uploading[doc.key]
          const err     = uploadErrors[doc.key]

          return (
            <div key={doc.key} className={`${styles.docRow} ${done ? styles.docRowDone : ''}`}>
              {/* Preview / placeholder */}
              <button
                className={styles.previewBox}
                onClick={() => inputRefs.current[doc.key]?.click()}
                aria-label={`Upload ${doc.label}`}
              >
                {preview
                  ? <img src={preview} alt={doc.label} className={styles.previewImg} />
                  : <span className={styles.previewPlus}>＋</span>
                }
                {busy && <div className={styles.previewOverlay}><span className={styles.spinner} /></div>}
                {done && !busy && <div className={styles.previewCheck}>✓</div>}
              </button>

              {/* Text */}
              <div className={styles.docText}>
                <span className={styles.docLabel}>{doc.label}</span>
                <span className={styles.docDesc}>{doc.desc}</span>
                {err && <span className={styles.docError}>{err}</span>}
              </div>

              {/* Hidden file input */}
              <input
                ref={el => inputRefs.current[doc.key] = el}
                type="file"
                accept={ACCEPT}
                className={styles.hiddenInput}
                onChange={e => handleFileChange(doc.key, e.target.files?.[0])}
              />
            </div>
          )
        })}
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? 'Submitting…' : `Submit Application (${Object.keys(urls).length}/5 uploaded)`}
      </button>
    </div>
  )
}
