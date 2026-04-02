import { useEffect, useRef, useState } from 'react'
import { detectCountryByIP } from '@/utils/countries'
import styles from './VideoIntro.module.css'

const VIDEO_URL = 'https://ik.imagekit.io/nepgaxllc/good.mp4'

// ISO codes where English is the primary or official language
const ENGLISH_COUNTRY_CODES = new Set([
  'US','GB','CA','AU','NZ','IE',        // core English-speaking
  'ZA','NG','GH','KE','UG','TZ','ZW',   // English-official Africa
  'ZM','MW','BW','NA','LS','SZ','RW',
  'SG','PH','MY','IN','PK',             // English-official Asia
  'JM','TT','BB','BS','BZ','GY',        // Caribbean / Americas
  'LR','SL','GM','SH','MU',             // other English-official
])

export default function VideoIntro({ onDone }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('checking') // checking | playing | skip

  // Step 1: detect country on mount
  useEffect(() => {
    detectCountryByIP().then(country => {
      if (country && ENGLISH_COUNTRY_CODES.has(country.code)) {
        setStatus('playing')
      } else {
        // Non-English country — skip straight to slider
        onDone()
      }
    }).catch(() => {
      // IP detection failed — show video anyway (safe default)
      setStatus('playing')
    })
  }, []) // eslint-disable-line

  // Step 2: once status is 'playing', start the video
  useEffect(() => {
    if (status !== 'playing' || !videoRef.current) return
    videoRef.current.play().catch(() => {
      // Browser blocked autoplay (e.g. no user gesture yet) — skip to slider
      onDone()
    })
  }, [status]) // eslint-disable-line

  if (status === 'checking') return null
  if (status === 'skip')     return null

  return (
    <div className={styles.screen}>
      <video
        ref={videoRef}
        src={VIDEO_URL}
        className={styles.video}
        muted
        playsInline
        onEnded={onDone}
      />

      {/* Skip button — fades in after 3 seconds */}
      <button className={styles.skipBtn} onClick={onDone}>
        Skip  ›
      </button>
    </div>
  )
}
