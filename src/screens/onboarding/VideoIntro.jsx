import { useEffect, useRef, useState } from 'react'
import { detectCountryByIP } from '@/utils/countries'
import styles from './VideoIntro.module.css'

const VIDEO_URL   = 'https://ik.imagekit.io/nepgaxllc/good.mp4?updatedAt=1775120536152'
const POSTER_URL  = 'https://ik.imagekit.io/nepgaxllc/uk10dd.png'

// ISO codes where English is the primary or official language
const ENGLISH_COUNTRY_CODES = new Set([
  'US','GB','CA','AU','NZ','IE',        // core English-speaking
  'ZA','NG','GH','KE','UG','TZ','ZW',   // English-official Africa
  'ZM','MW','BW','NA','LS','SZ','RW',
  'SG','PH','MY','IN','PK',             // English-official Asia
  'JM','TT','BB','BS','BZ','GY',        // Caribbean / Americas
  'LR','SL','GM','SH','MU',             // other English-official
])

export default function VideoIntro({ onDone, forcePlay = false, bgOnly = false }) {
  const videoRef = useRef(null)
  const [status, setStatus]       = useState('checking') // checking | playing | skip
  const [ending, setEnding]       = useState(false)
  const [videoVisible, setVideoVisible] = useState(true)

  // Step 1: detect country on mount (skip detection if forcePlay)
  useEffect(() => {
    if (forcePlay) { setStatus('playing'); return }
    detectCountryByIP().then(country => {
      if (country && ENGLISH_COUNTRY_CODES.has(country.code)) {
        setStatus('playing')
      } else {
        onDone()
      }
    }).catch(() => {
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

  const handleEnd = () => {
    if (videoRef.current) videoRef.current.pause()
    setVideoVisible(false)   // instantly hide video — shows poster bg instead
    setEnding(true)          // start screen fade-out
    setTimeout(onDone, 420)
  }

  // bgOnly — stay mounted as poster background behind the slider cards (z-index below ProfileSetup)
  if (bgOnly) return (
    <div className={`${styles.screen} ${styles.bgOnly}`} style={{ backgroundImage: `url(${POSTER_URL})` }}>
      <img src={POSTER_URL} className={styles.poster} alt="" />
    </div>
  )

  if (status === 'checking') return null
  if (status === 'skip')     return null

  return (
    <div
      className={`${styles.screen} ${ending ? styles.fadeOut : ''}`}
      style={{ backgroundImage: `url(${POSTER_URL})` }}
    >
      {/* Poster rendered as img layer too — ensures it's loaded early */}
      <img src={POSTER_URL} className={styles.poster} alt="" />
      <video
        ref={videoRef}
        src={VIDEO_URL}
        className={styles.video}
        playsInline
        onEnded={handleEnd}
        style={{ opacity: videoVisible ? 1 : 0 }}
      />

      {/* Skip button — fades in after 3 seconds */}
      <button className={styles.skipBtn} onClick={handleEnd}>
        Skip  ›
      </button>
    </div>
  )
}
