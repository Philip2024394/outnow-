import { useState, useRef, useEffect } from 'react'
import styles from './VoiceIntroBar.module.css'

/**
 * Plays a ≤7-second voice intro clip stored on the user's profile.
 * Auto-plays muted on card open; user taps to hear with audio.
 * Falls back gracefully if no URL is present.
 */
export default function VoiceIntroBar({ voiceIntroUrl, displayName }) {
  const audioRef   = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0) // 0–100
  const [muted,    setMuted]    = useState(true)
  const rafRef     = useRef(null)

  // Auto-play muted when URL appears
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !voiceIntroUrl) return
    audio.muted = true
    audio.play().catch(() => {})
    setPlaying(true)
    setMuted(true)
  }, [voiceIntroUrl])

  // Progress bar RAF loop
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const tick = () => {
      if (!audio.duration) return
      setProgress((audio.currentTime / audio.duration) * 100)
      rafRef.current = requestAnimationFrame(tick)
    }
    if (playing) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing])

  if (!voiceIntroUrl) return null

  const handleToggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.muted = false
      setMuted(false)
      audio.currentTime = 0
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  const handleUnmute = (e) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    audio.muted = false
    setMuted(false)
  }

  const handleEnded = () => {
    setPlaying(false)
    setProgress(0)
  }

  return (
    <div className={styles.bar} onClick={handleToggle}>
      <audio
        ref={audioRef}
        src={voiceIntroUrl}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Waveform icon */}
      <div className={`${styles.waveIcon} ${playing ? styles.waveIconPlaying : ''}`}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className={styles.waveLine} style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      <div className={styles.info}>
        <span className={styles.label}>
          🎙 {displayName ? `${displayName}'s intro` : 'Voice intro'}
        </span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Play/pause icon */}
      <div className={styles.playBtn}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        )}
      </div>

      {/* Muted badge — tap to unmute */}
      {muted && playing && (
        <button className={styles.mutedBadge} onClick={handleUnmute} aria-label="Unmute">
          🔇 Tap to hear
        </button>
      )}
    </div>
  )
}
