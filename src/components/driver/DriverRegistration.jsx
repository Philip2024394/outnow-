/**
 * DriverRegistration — Full-screen registration for bike/car drivers.
 * Collects personal info, vehicle details, document photos.
 * Submits for admin review. Shows status if already applied.
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  VEHICLE_TYPES, submitApplication, getApplicationByPhone,
} from '@/services/driverRegistrationService'
import styles from './DriverRegistration.module.css'

function PhotoUpload({ label, value, onChange }) {
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }
  return (
    <div className={styles.photoUpload}>
      <span className={styles.label}>{label}</span>
      <label className={styles.photoArea}>
        {value ? (
          <>
            <img src={value} alt="" className={styles.photoPreview} />
            <span className={styles.photoCheck}>✓</span>
          </>
        ) : (
          <div className={styles.photoPlaceholder}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            Tap to upload
          </div>
        )}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </label>
    </div>
  )
}

export default function DriverRegistration({ open, onClose }) {
  const [driverType, setDriverType] = useState('')
  const [existingApp, setExistingApp] = useState(null)

  // Personal
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Yogyakarta')

  // Vehicle
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [plateNo, setPlateNo] = useState('')
  const [cc, setCc] = useState('')
  const [color, setColor] = useState('')

  // Documents
  const [ktpPhoto, setKtpPhoto] = useState(null)
  const [simPhoto, setSimPhoto] = useState(null)
  const [stnkPhoto, setStnkPhoto] = useState(null)
  const [vehiclePhoto, setVehiclePhoto] = useState(null)
  const [selfiePhoto, setSelfiePhoto] = useState(null)

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Check existing application
  useEffect(() => {
    if (open && phone.length >= 10) {
      const app = getApplicationByPhone(phone)
      if (app) setExistingApp(app)
    }
  }, [open, phone])

  if (!open) return null

  const isBike = driverType === 'bike'
  const canSubmit = driverType && fullName && phone && address && brand && model && plateNo && ktpPhoto && simPhoto && stnkPhoto && vehiclePhoto && selfiePhoto && termsAccepted

  function handleSubmit() {
    if (!canSubmit) return
    submitApplication({
      driverType,
      fullName, phone, address, city,
      vehicle: { brand, model, year, plateNo, cc, color },
      documents: { ktp: ktpPhoto, sim: simPhoto, stnk: stnkPhoto, vehicle: vehiclePhoto, selfie: selfiePhoto },
    })
    setSubmitted(true)
  }

  // Show status if already applied
  if (existingApp && !submitted) {
    return createPortal(
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className={styles.headerTitle}>Driver Application</span>
        </div>
        <div className={styles.statusScreen}>
          <span className={styles.statusIcon}>
            {existingApp.status === 'pending' ? '⏳' : existingApp.status === 'approved' ? '✅' : '❌'}
          </span>
          <span className={styles.statusTitle}>
            {existingApp.status === 'pending' ? 'Under Review' : existingApp.status === 'approved' ? 'Welcome, Driver!' : 'Application Rejected'}
          </span>
          <span className={`${styles.statusBadge} ${existingApp.status === 'pending' ? styles.statusPending : existingApp.status === 'approved' ? styles.statusApproved : styles.statusRejected}`}>
            {existingApp.status.toUpperCase()}
          </span>
          <span className={styles.statusText}>
            {existingApp.status === 'pending' && 'Your application is being reviewed by our team. This usually takes 1-2 business days. We will notify you once approved.'}
            {existingApp.status === 'approved' && 'Your driver account is active. You can now go online and start accepting rides.'}
            {existingApp.status === 'rejected' && `${existingApp.adminNote || 'Your application was not approved. Please check your documents and try again.'}`}
          </span>
          {existingApp.status === 'rejected' && (
            <button className={styles.reapplyBtn} onClick={() => setExistingApp(null)}>
              Reapply
            </button>
          )}
        </div>
      </div>,
      document.body
    )
  }

  // Success screen
  if (submitted) {
    return createPortal(
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className={styles.headerTitle}>Application Submitted</span>
        </div>
        <div className={styles.statusScreen}>
          <span className={styles.statusIcon}>🎉</span>
          <span className={styles.statusTitle}>Thank You!</span>
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>UNDER REVIEW</span>
          <span className={styles.statusText}>
            Your driver application has been submitted. Our team will review your documents within 1-2 business days. You'll be notified once approved.
          </span>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Become a Driver</span>
      </div>

      <div className={styles.body}>
        {/* Vehicle type */}
        <div className={styles.field}>
          <span className={styles.label}>What will you drive?</span>
          <div className={styles.typeRow}>
            {VEHICLE_TYPES.map(t => (
              <button key={t.id} className={`${styles.typeBtn} ${driverType === t.id ? styles.typeBtnActive : ''}`} onClick={() => setDriverType(t.id)}>
                <span className={styles.typeBtnIcon}>{t.icon}</span>
                <span className={styles.typeBtnLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Personal info */}
        <span className={styles.section}>Personal Information</span>
        <div className={styles.field}>
          <span className={styles.label}>Full Name (as on KTP) *</span>
          <input className={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full legal name" />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>Phone Number *</span>
            <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62 812..." type="tel" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>City</span>
            <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="Yogyakarta" />
          </div>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Address *</span>
          <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" />
        </div>

        {/* Vehicle details */}
        <span className={styles.section}>Vehicle Details</span>
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>Brand *</span>
            <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder={isBike ? 'Honda' : 'Toyota'} />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Model *</span>
            <input className={styles.input} value={model} onChange={e => setModel(e.target.value)} placeholder={isBike ? 'Beat' : 'Avanza'} />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>Year</span>
            <input className={styles.input} value={year} onChange={e => setYear(e.target.value)} placeholder="2022" type="number" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Plate Number *</span>
            <input className={styles.input} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="AB 1234 CD" />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <span className={styles.label}>CC</span>
            <input className={styles.input} value={cc} onChange={e => setCc(e.target.value)} placeholder={isBike ? '110' : '1300'} type="number" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Color</span>
            <input className={styles.input} value={color} onChange={e => setColor(e.target.value)} placeholder="Black" />
          </div>
        </div>

        {/* Document uploads */}
        <span className={styles.section}>Documents</span>
        <PhotoUpload label="KTP — ID Card *" value={ktpPhoto} onChange={setKtpPhoto} />
        <PhotoUpload label={`${isBike ? 'SIM C' : 'SIM A'} — Driving License *`} value={simPhoto} onChange={setSimPhoto} />
        <PhotoUpload label="STNK — Vehicle Registration *" value={stnkPhoto} onChange={setStnkPhoto} />
        <PhotoUpload label="Vehicle Photo (show plate) *" value={vehiclePhoto} onChange={setVehiclePhoto} />
        <PhotoUpload label="Selfie holding your KTP *" value={selfiePhoto} onChange={setSelfiePhoto} />

        {/* Terms */}
        <div className={styles.termsRow}>
          <button className={`${styles.checkbox} ${termsAccepted ? styles.checkboxChecked : ''}`} onClick={() => setTermsAccepted(!termsAccepted)}>
            ✓
          </button>
          <span className={styles.termsText}>
            I confirm all information is accurate. I agree to Indoo's driver terms, including 10% commission on all completed rides. I understand my account will be reviewed before activation.
          </span>
        </div>

        <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
          Submit Application
        </button>
      </div>
    </div>,
    document.body
  )
}
