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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png']

function PhotoUpload({ label, value, onChange, bgImage }) {
  const [error, setError] = useState(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError('Only JPG or PNG files accepted')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large — max 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }
  return (
    <div className={styles.photoUpload}>
      <span className={styles.photoLabel}>{label}</span>
      <label className={styles.photoArea} style={bgImage && !value ? { backgroundImage: `url("${bgImage}")`, backgroundSize: label.includes('plate') ? 'cover' : 'contain', backgroundPosition: label.includes('plate') ? 'center calc(50% + 15px)' : 'center', backgroundRepeat: 'no-repeat' } : {}}>
        {value ? (
          <div className={styles.photoUploaded}>
            <img src={value} alt="" className={styles.photoPreview} />
            <div className={styles.photoUploadedOverlay}>
              <button className={styles.photoDeleteBtn} onClick={(e) => { e.preventDefault(); onChange(null) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.photoPlaceholder}>
            <span className={styles.uploadBtn}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload
            </span>
          </div>
        )}
        <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFile} />
      </label>
      <span className={styles.photoFormats}>JPG or PNG · Max 5MB</span>
      {error && <span className={styles.photoError}>{error}</span>}
    </div>
  )
}

export default function DriverRegistration({ open, onClose, driverType = 'bike' }) {
  const [existingApp, setExistingApp] = useState(null)

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Personal
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('Yogyakarta')
  const [postcode, setPostcode] = useState('')

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

  // Experience
  const [prevEmployer, setPrevEmployer] = useState([])

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
  const hasStartedFilling = fullName || phone || email || address || brand || model
  const passwordMatch = password && password === confirmPassword
  const passwordValid = password.length >= 6
  const canSubmit = email && passwordValid && passwordMatch && fullName && phone && address && brand && model && plateNo && ktpPhoto && simPhoto && stnkPhoto && vehiclePhoto && selfiePhoto && termsAccepted

  function handleSubmit() {
    if (!canSubmit) return
    submitApplication({
      driverType,
      email, password,
      fullName, phone, address, city,
      vehicle: { brand, model, year, plateNo, cc, color },
      previousEmployers: prevEmployer,
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
    <div className={`${styles.page} ${hasStartedFilling ? styles.pageDimmed : ''}`}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Driver Application</span>
        <span className={styles.headerRef}>IO-{Math.floor(10000 + Math.random() * 90000)}</span>
      </div>

      <div className={styles.body}>
        {/* Spacer for hero background visibility */}
        <div className={styles.heroSpacer} />

        {/* Account */}
        <div className={styles.card}>
          <span className={styles.section}>Create Account</span>
          <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" type="email" />
          <div className={styles.row}>
            <div className={styles.passWrap}>
              <input className={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6)" type={showPass ? 'text' : 'password'} />
              <button className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} type="button">
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <div className={styles.passWrap}>
              <input className={styles.input} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" type={showConfirmPass ? 'text' : 'password'} />
              <button className={styles.eyeBtn} onClick={() => setShowConfirmPass(v => !v)} type="button">
                {showConfirmPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          {password && !passwordValid && <span className={styles.fieldError}>Password must be at least 6 characters</span>}
          {password && confirmPassword && !passwordMatch && <span className={styles.fieldError}>Passwords do not match</span>}
        </div>

        {/* Personal info */}
        <div className={styles.card}>
          <span className={styles.section}>Personal Information</span>
          <span className={styles.warning}>Incorrect applications will be reported</span>
          <input className={styles.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name (as on KTP)" />
          <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" type="tel" />
          <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street Address" />
          <div className={styles.row}>
            <input className={styles.input} value={district} onChange={e => setDistrict(e.target.value)} placeholder="District / Kecamatan" />
            <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
          </div>
          <input className={styles.input} value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="Postcode" style={{ maxWidth: '50%' }} />
        </div>

        {/* Vehicle details */}
        <div className={styles.card}>
          <span className={styles.section}>{isBike ? 'Bike' : 'Car'} Details</span>
          <div className={styles.row}>
            <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder={isBike ? 'Brand (Honda)' : 'Brand (Toyota)'} />
            <input className={styles.input} value={model} onChange={e => setModel(e.target.value)} placeholder={isBike ? 'Model (Beat)' : 'Model (Avanza)'} />
          </div>
          <div className={styles.row}>
            <input className={styles.input} value={year} onChange={e => setYear(e.target.value)} placeholder="Year (2022)" type="number" />
            <input className={styles.input} value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="Plate (AB 1234 CD)" />
          </div>
          <div className={styles.row}>
            <input className={styles.input} value={cc} onChange={e => setCc(e.target.value)} placeholder={isBike ? 'CC (110)' : 'CC (1300)'} type="number" />
            <input className={styles.input} value={color} onChange={e => setColor(e.target.value)} placeholder="Color (Black)" />
          </div>
        </div>

        {/* Previous employment */}
        <div className={styles.card}>
          <span className={styles.section}>Previous Experience</span>
          <span className={styles.expLabel}>Have you worked with any of these platforms?</span>
          <div className={styles.expGrid}>
            {['Gojek', 'Grab', 'Maxim', 'InDriver', 'ShopeeFood', 'None'].map(emp => (
              <button key={emp} className={`${styles.expChip} ${prevEmployer.includes(emp) ? styles.expChipActive : ''}`}
                onClick={() => {
                  if (emp === 'None') { setPrevEmployer(['None']); return }
                  setPrevEmployer(prev => {
                    const filtered = prev.filter(e => e !== 'None')
                    return filtered.includes(emp) ? filtered.filter(e => e !== emp) : [...filtered, emp]
                  })
                }}
              >
                {emp}
              </button>
            ))}
          </div>
        </div>

        {/* Document uploads */}
        <div className={styles.card}>
          <span className={styles.section}>Upload Documents</span>
          <div className={styles.photoRow}>
            <PhotoUpload label="KTP — ID Card" value={ktpPhoto} onChange={setKtpPhoto} bgImage={isBike ? 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdsssdasda-removebg-preview.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdsssdasdadfsdfdasdaasdasfdsadasda-removebg-preview.png'} />
            <PhotoUpload label={`${isBike ? 'SIM C' : 'SIM A'} — License`} value={simPhoto} onChange={setSimPhoto} bgImage={isBike ? 'https://ik.imagekit.io/nepgaxllc/fffs-removebg-preview.png' : 'https://ik.imagekit.io/nepgaxllc/fffssd-removebg-preview.png'} />
          </div>
          <PhotoUpload label="Vehicle Photo (show plate number)" value={vehiclePhoto} onChange={setVehiclePhoto} bgImage={isBike ? 'https://ik.imagekit.io/nepgaxllc/Untitledsdasd.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdsss.png'} />
          <div className={styles.photoRow}>
            <PhotoUpload label="STNK — Registration" value={stnkPhoto} onChange={setStnkPhoto} />
            <PhotoUpload label="Selfie with KTP" value={selfiePhoto} onChange={setSelfiePhoto} bgImage={isBike ? 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdsssdasdadfsdfdasdaasdasfdsad.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledsdfsdfsdsssdasdadfsdfdasdaasdas.png'} />
          </div>
        </div>

        {/* Terms */}
        <div className={styles.card}>
          <div className={styles.termsRow}>
            <button className={`${styles.checkbox} ${termsAccepted ? styles.checkboxChecked : ''}`} onClick={() => setTermsAccepted(!termsAccepted)}>
              ✓
            </button>
            <span className={styles.termsText}>
              I have read and agree to the Indoo Driver Terms & Conditions. I commit to maintaining safe driving practices, keeping my vehicle in roadworthy condition, and upholding all standards required as an Indoo driver.
            </span>
          </div>

          <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
