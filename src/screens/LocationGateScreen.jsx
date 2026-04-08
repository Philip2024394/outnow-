import { useState } from 'react'
import styles from './LocationGateScreen.module.css'

// Indonesia bounding box
function isInIndonesia(lat, lng) {
  return lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141
}

export default function LocationGateScreen({ onConfirmed }) {
  const [status, setStatus] = useState('idle') // idle | loading | denied | wrong_country

  const handleSetLocation = () => {
    if (!navigator.geolocation) { setStatus('denied'); return }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        if (isInIndonesia(latitude, longitude)) {
          localStorage.setItem('locationConfirmed', 'true')
          onConfirmed()
        } else {
          setStatus('wrong_country')
        }
      },
      () => setStatus('denied'),
      { timeout: 12000, maximumAge: 60000 }
    )
  }

  return (
    <div className={styles.root}>

      {/* Round map visual */}
      <div className={styles.mapCircle}>
        <div className={styles.grid} />
        <div className={styles.ring} />
        <div className={styles.pin}>
          <svg width="56" height="72" viewBox="0 0 56 72" fill="none">
            <path
              d="M28 0C12.536 0 0 12.536 0 28c0 21 28 44 28 44S56 49 56 28C56 12.536 43.464 0 28 0z"
              fill="#8DC63F"
            />
            <circle cx="28" cy="27" r="10" fill="#fff" />
          </svg>
        </div>
        <div className={styles.pulse} />
      </div>

      <h1 className={styles.title}>Welcome to Hangger</h1>
      <p className={styles.message}>
        For the security of our members we require location confirmed to be Indonesian.
      </p>

      {status === 'denied' && (
        <p className={styles.error}>
          Location access was denied. Please allow location in your browser settings and try again.
        </p>
      )}
      {status === 'wrong_country' && (
        <p className={styles.error}>
          Your location doesn't appear to be in Indonesia. Hangger is currently only available in Indonesia.
        </p>
      )}

      <button
        className={styles.btn}
        onClick={handleSetLocation}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Detecting location…' : 'Set My Location'}
      </button>

      <p className={styles.note}>We only use your location to verify country. It is never stored or shared.</p>
    </div>
  )
}
