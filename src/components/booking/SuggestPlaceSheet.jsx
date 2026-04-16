/**
 * SuggestPlaceSheet — users suggest a new place for the directory.
 * Collects: place name, activity type, photo, GPS location, submitter name + WhatsApp.
 * Submissions go to admin for review.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ACTIVITY_TYPES, submitSuggestion } from '@/services/placeSuggestionService'
import styles from './SuggestPlaceSheet.module.css'

export default function SuggestPlaceSheet({ open, onClose }) {
  const [placeName, setPlaceName] = useState('')
  const [activity, setActivity] = useState('')
  const [address, setAddress] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [gps, setGps] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitterName, setSubmitterName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [notes, setNotes] = useState('')
  const [customActivity, setCustomActivity] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const canSubmit = placeName.trim() && activity && (activity !== 'other' || customActivity.trim()) && submitterName.trim() && whatsapp.trim()

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhoto(ev.target.result)
      setPhotoPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  function handleGps() {
    if (gps) { setGps(null); return }
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function handleSubmit() {
    if (!canSubmit) return
    submitSuggestion({
      placeName: placeName.trim(),
      activityType: activity === 'other' ? `other: ${customActivity.trim()}` : activity,
      address: address.trim(),
      lat: gps?.lat || null,
      lng: gps?.lng || null,
      photo,
      submitterName: submitterName.trim(),
      whatsapp: whatsapp.trim(),
      notes: notes.trim(),
    })
    setSubmitted(true)
  }

  function handleClose() {
    setPlaceName(''); setActivity(''); setCustomActivity(''); setAddress(''); setPhoto(null); setPhotoPreview(null)
    setGps(null); setSubmitterName(''); setWhatsapp(''); setNotes(''); setSubmitted(false)
    onClose()
  }

  return createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <div className={styles.sheetHeader}>
          <div>
            <span className={styles.sheetTitle}>Suggest a Place</span>
            <span className={styles.sheetSub}>Let people know your place</span>
          </div>
          <button className={styles.sheetClose} onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className={styles.successMsg}>
            <span className={styles.successIcon}>🎉</span>
            <span className={styles.successTitle}>Thank you!</span>
            <span className={styles.successText}>
              Your suggestion has been submitted for review.<br/>
              Our team will check it and may contact you via WhatsApp for more details.
            </span>
            <button className={styles.successClose} onClick={handleClose}>Close</button>
          </div>
        ) : (
          <div className={styles.form}>

            {/* Place name */}
            <div className={styles.field}>
              <span className={styles.label}>Place Name *</span>
              <input className={styles.input} value={placeName} onChange={e => setPlaceName(e.target.value)} placeholder="e.g. Warung Pak Dedi" />
            </div>

            {/* Activity type */}
            <div className={styles.field}>
              <span className={styles.label}>Activity Type *</span>
              <div className={styles.activityGrid}>
                {ACTIVITY_TYPES.map(a => (
                  <button key={a.id} className={`${styles.activityBtn} ${activity === a.id ? styles.activityBtnActive : ''}`} onClick={() => setActivity(a.id)}>
                    <span className={styles.activityIcon}>{a.icon}</span>
                    <span className={styles.activityLabel}>{a.label}</span>
                  </button>
                ))}
              </div>
              {activity === 'other' && (
                <div className={styles.otherField}>
                  <span className={styles.otherLabel}>What type of place is it?</span>
                  <input className={styles.input} value={customActivity} onChange={e => setCustomActivity(e.target.value)} placeholder="e.g. Bowling, Cinema, Laundry..." />
                </div>
              )}
            </div>

            {/* Address */}
            <div className={styles.field}>
              <span className={styles.label}>Address</span>
              <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address or area" />
            </div>

            {/* Photo */}
            <div className={styles.field}>
              <span className={styles.label}>Photo</span>
              <label className={styles.photoArea}>
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="" className={styles.photoPreview} />
                    <button className={styles.photoRemove} onClick={e => { e.preventDefault(); setPhoto(null); setPhotoPreview(null) }}>✕</button>
                  </>
                ) : (
                  <div className={styles.photoPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                    Tap to add photo
                  </div>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              </label>
            </div>

            {/* GPS */}
            <div className={styles.field}>
              <span className={styles.label}>Pin Location</span>
              {gps ? (
                <div className={styles.gpsSet}>
                  <span className={styles.gpsCheck}>✓</span>
                  <div className={styles.gpsSetInfo}>
                    <span className={styles.gpsSetLabel}>Location set</span>
                    <span className={styles.gpsCoords}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span>
                  </div>
                  <button className={styles.gpsClear} onClick={() => setGps(null)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <button className={styles.gpsBtn} onClick={handleGps} disabled={gpsLoading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/><circle cx="12" cy="12" r="9"/>
                  </svg>
                  {gpsLoading ? 'Getting location...' : 'Pin my location'}
                </button>
              )}
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Submitter info */}
            <div className={styles.field}>
              <span className={styles.label}>Your Name *</span>
              <input className={styles.input} value={submitterName} onChange={e => setSubmitterName(e.target.value)} placeholder="Full name" />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>WhatsApp Number *</span>
              <input className={styles.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+62 812 3456 7890" type="tel" />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Notes (optional)</span>
              <textarea className={`${styles.input} ${styles.textarea}`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opening hours, specialties, anything helpful..." />
            </div>

            <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
              Submit Suggestion
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
