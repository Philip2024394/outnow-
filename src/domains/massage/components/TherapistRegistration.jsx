/**
 * TherapistRegistration — Create account for massage therapists.
 * Collects: name, email, password, phone, location, massage types, pricing, photo.
 * Submits for admin review → approved → dashboard unlocks.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './TherapistRegistration.module.css'

const MASSAGE_TYPES = [
  'Traditional', 'Swedish', 'Deep Tissue', 'Thai', 'Balinese',
  'Shiatsu', 'Hot Stone', 'Aromatherapy', 'Sports', 'Reflexology',
  'Prenatal', 'Couples', 'Head & Shoulder',
]

const STORAGE_KEY = 'indoo_therapist_applications'

function submitApplication(data) {
  const apps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const entry = { id: 'mt_' + Date.now(), ...data, status: 'pending', submittedAt: new Date().toISOString() }
  apps.unshift(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  return entry
}

export default function TherapistRegistration({ open, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Yogyakarta')
  const [types, setTypes] = useState([])
  const [price60, setPrice60] = useState('')
  const [price90, setPrice90] = useState('')
  const [price120, setPrice120] = useState('')
  const [experience, setExperience] = useState('')
  const [bio, setBio] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const toggleType = (t) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  const canSubmit = name && email && password.length >= 6 && phone && types.length > 0 && price60

  function handleSubmit() {
    if (!canSubmit) return
    submitApplication({
      name, email, password, phone, area, city,
      massageTypes: types,
      price60: Number(price60), price90: Number(price90), price120: Number(price120),
      yearsOfExperience: Number(experience) || 0,
      description: bio,
    })
    setSubmitted(true)
  }

  return createPortal(
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Therapist Application</span>
      </div>

      {submitted ? (
        <div className={styles.successScreen}>
          <span className={styles.successIcon}>🎉</span>
          <span className={styles.successTitle}>Application Submitted</span>
          <span className={styles.successText}>Our team will review your application within 1-2 business days. You'll be notified once approved.</span>
        </div>
      ) : (
        <div className={styles.body}>
          {/* Account */}
          <div className={styles.card}>
            <span className={styles.section}>Create Account</span>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
            <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" type="email" />
            <input className={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6)" type="password" />
            <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone / WhatsApp" type="tel" />
          </div>

          {/* Location */}
          <div className={styles.card}>
            <span className={styles.section}>Location</span>
            <div className={styles.row}>
              <input className={styles.input} value={area} onChange={e => setArea(e.target.value)} placeholder="Area (Sleman)" />
              <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
            </div>
          </div>

          {/* Services */}
          <div className={styles.card}>
            <span className={styles.section}>Massage Types</span>
            <div className={styles.chipGrid}>
              {MASSAGE_TYPES.map(t => (
                <button key={t} className={`${styles.chip} ${types.includes(t) ? styles.chipActive : ''}`} onClick={() => toggleType(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className={styles.card}>
            <span className={styles.section}>Pricing (Rp)</span>
            <div className={styles.row}>
              <input className={styles.input} value={price60} onChange={e => setPrice60(e.target.value)} placeholder="60 min" type="number" />
              <input className={styles.input} value={price90} onChange={e => setPrice90(e.target.value)} placeholder="90 min" type="number" />
              <input className={styles.input} value={price120} onChange={e => setPrice120(e.target.value)} placeholder="120 min" type="number" />
            </div>
          </div>

          {/* About */}
          <div className={styles.card}>
            <span className={styles.section}>About You</span>
            <input className={styles.input} value={experience} onChange={e => setExperience(e.target.value)} placeholder="Years of Experience" type="number" />
            <textarea className={styles.input} value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio — describe your specialties" rows={3} style={{ resize: 'vertical', minHeight: 60 }} />
          </div>

          <button className={styles.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
