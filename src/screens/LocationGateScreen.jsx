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
          {/* Full fingerprint SVG — loop/whorl pattern */}
          <svg
            className={styles.fpSvg}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Whorl center */}
            <ellipse cx="50" cy="49" rx="3" ry="2.5" strokeWidth="1.9" />
            {/* Ridge 1 — tight inner loop */}
            <path d="M44 49 Q50 39 56 49 Q50 59 44 49" strokeWidth="1.9" />
            {/* Ridge 2 */}
            <path d="M38 49 Q50 31 62 49 Q50 67 38 49" strokeWidth="1.9" />
            {/* Ridge 3 */}
            <path d="M32 50 Q50 23 68 50 Q60 71 50 73 Q40 71 32 50" strokeWidth="1.9" />
            {/* Ridge 4 */}
            <path d="M26 52 Q50 16 74 52 Q65 76 50 78 Q35 76 26 52" strokeWidth="1.9" />
            {/* Ridge 5 */}
            <path d="M20 54 Q50 9 80 54 Q70 80 50 82 Q30 80 20 54" strokeWidth="1.9" />
            {/* Ridge 6 */}
            <path d="M14 57 Q50 3 86 57 Q75 84 50 86 Q25 84 14 57" strokeWidth="1.8" />
            {/* Ridge 7 — outer arch */}
            <path d="M8 62 Q50 -2 92 62 Q80 88 50 90 Q20 88 8 62" strokeWidth="1.8" />
            {/* Ridge 8 — outermost */}
            <path d="M3 67 Q50 -8 97 67 Q84 93 50 95 Q16 93 3 67" strokeWidth="1.7" />
            {/* Delta features at base */}
            <path d="M30 79 Q40 73 50 74 Q60 73 70 79" strokeWidth="1.8" />
            <path d="M35 87 Q42 82 50 83 Q58 82 65 87" strokeWidth="1.7" />
          </svg>

          {/* Scan line — visible only while scanning */}
          {status === 'scanning' && <div className={styles.scanLine} />}
        </button>

        {/* Error label directly under circle */}
        {(status === 'denied' || status === 'wrong_country') && (
          <p className={styles.locationAlert}>
            {status === 'wrong_country'
              ? 'Hangger is Indonesia-only right now'
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

        <p className={styles.note}>Your location is only used for country verification.</p>
      </div>
    </div>
  )
}
