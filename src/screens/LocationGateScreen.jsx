import { useState, useEffect } from 'react'
import styles from './LocationGateScreen.module.css'

// Same images as home screen TimeBackground
const IMAGES = {
  sunrise: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  day:     'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  night:   'https://ik.imagekit.io/nepgaxllc/Untitledfsdf.png?updatedAt=1775555383465',
}

function getWIBHour() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wibMs = utcMs + 7 * 3_600_000
  const wib   = new Date(wibMs)
  return wib.getHours() + wib.getMinutes() / 60
}

function getPhase(h) {
  if (h >= 5   && h < 7.5)  return 'sunrise'
  if (h >= 7.5 && h < 17.5) return 'day'
  if (h >= 17.5 && h < 19.5) return 'sunset'
  return 'night'
}

function getSunsetProgress(h) {
  if (h < 17.5 || h >= 19.5) return 0
  return (h - 17.5) / 2
}

function isInIndonesia(lat, lng) {
  return lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141
}

// States: idle → scanning → (auto onConfirmed) | denied | wrong_country
export default function LocationGateScreen({ onConfirmed }) {
  const [status, setStatus]       = useState('idle')
  const [hour, setHour]           = useState(getWIBHour)
  const [imgLoaded, setImgLoaded] = useState({})

  useEffect(() => {
    const id = setInterval(() => setHour(getWIBHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  const phase    = getPhase(hour)
  const progress = getSunsetProgress(hour)
  const isSunset = phase === 'sunset'
  const isNight  = phase === 'night'
  const isDay    = phase === 'day'

  const overlayOpacity   = isSunset ? Math.sin(progress * Math.PI) * 0.45 : 0
  const bgSrc            = isDay ? IMAGES.day : isNight ? IMAGES.night : IMAGES.sunrise
  const nightFadeOpacity = isSunset ? progress : 0

  const markLoaded = (key) => setImgLoaded(prev => ({ ...prev, [key]: true }))

  const handleTap = async () => {
    if (status === 'scanning') return
    setStatus('scanning')

    const [geoResult] = await Promise.all([
      new Promise(resolve => {
        if (!navigator.geolocation) { resolve({ ok: false, error: 'denied' }); return }
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            if (isInIndonesia(latitude, longitude)) resolve({ ok: true })
            else resolve({ ok: false, error: 'wrong_country' })
          },
          () => resolve({ ok: false, error: 'denied' }),
          { timeout: 12000, maximumAge: 0 }
        )
      }),
      // Minimum 4 seconds of scanning animation
      new Promise(r => setTimeout(r, 4000)),
    ])

    if (geoResult.ok) {
      onConfirmed()
    } else {
      setStatus(geoResult.error)
    }
  }

  const circleClass = [
    styles.fpCircle,
    status === 'idle'          && styles.fpIdle,
    status === 'scanning'      && styles.fpScanning,
    (status === 'denied' || status === 'wrong_country') && styles.fpDenied,
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.overlay}>

      {/* ── Time-based background images ── */}
      <img
        key={bgSrc}
        src={bgSrc}
        alt=""
        className={`${styles.bgLayer} ${imgLoaded[bgSrc] ? styles.bgLayerVisible : ''}`}
        onLoad={() => markLoaded(bgSrc)}
        draggable={false}
      />
      {isSunset && (
        <img
          src={IMAGES.night}
          alt=""
          className={styles.bgLayer}
          style={{ opacity: nightFadeOpacity, transition: 'opacity 4s ease' }}
          draggable={false}
        />
      )}
      {overlayOpacity > 0 && (
        <div className={styles.sunsetOverlay} style={{ opacity: overlayOpacity }} />
      )}
      <div className={styles.baseDim} />
      <div className={styles.cityShimmer} />

      {/* ── Card ── */}
      <div className={styles.card}>

        {/* Fingerprint circle */}
        <button
          className={circleClass}
          onClick={handleTap}
          disabled={status === 'scanning'}
          aria-label="Tap to confirm location"
        >
          <img
            src="https://ik.imagekit.io/nepgaxllc/Detailed%20white%20fingerprint%20on%20transparent%20background.png"
            alt="fingerprint"
            className={styles.fpSvg}
            draggable={false}
          />

          {/* Scan line — visible only while scanning */}
          {status === 'scanning' && <div className={styles.scanLine} />}
        </button>

        {/* Error label directly under circle */}
        {(status === 'denied' || status === 'wrong_country') && (
          <p className={styles.locationAlert}>
            {status === 'wrong_country'
              ? 'Indoo is Indonesia-only right now'
              : 'Turn On Location On Your Phone'}
          </p>
        )}

        <h2 className={styles.title}>
          {status === 'scanning'     ? 'Detecting Location…'  :
           status === 'denied'       ? 'Location Required'    :
           status === 'wrong_country'? 'Not Available Here'   :
                                       'Confirm Your Location'}
        </h2>
        <p className={styles.message}>
          {status === 'scanning'
            ? 'Please wait while we verify your location.'
            : 'Tap the fingerprint to verify your location and join the community.'}
        </p>

      </div>
    </div>
  )
}
