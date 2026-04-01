import { useEffect, useRef, useState } from 'react'
import styles from './MomentViewer.module.css'

const DURATION_MS = 5000

function timeAgo(ms) {
  const diff = Date.now() - ms
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export default function MomentViewer({ moments, startIndex = 0, onClose }) {
  const [index, setIndex]       = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  const moment = moments[index]

  const advance = () => {
    if (index < moments.length - 1) {
      setIndex(i => i + 1)
    } else {
      onClose?.()
    }
  }

  const goBack = () => {
    if (index > 0) setIndex(i => i - 1)
  }

  // Progress bar + auto-advance
  useEffect(() => {
    setProgress(0)
    startRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / DURATION_MS) * 100, 100)
      setProgress(pct)
      if (pct < 100) {
        timerRef.current = requestAnimationFrame(tick)
      } else {
        advance()
      }
    }

    timerRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(timerRef.current)
  }, [index]) // eslint-disable-line

  if (!moment) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* Tap zones */}
      <div className={styles.tapBack}  onClick={e => { e.stopPropagation(); goBack()  }} />
      <div className={styles.tapFwd}   onClick={e => { e.stopPropagation(); advance() }} />

      {/* Story card */}
      <div
        className={styles.card}
        style={{ background: moment.gradient }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className={styles.progressRow}>
          {moments.map((_, i) => (
            <div key={i} className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: i < index ? '100%' : i === index ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitial}>
              {moment.displayName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{moment.displayName}</span>
            <span className={styles.timeAgo}>{timeAgo(moment.createdAt)}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Main content */}
        <div className={styles.content}>
          <span className={styles.mainEmoji}>{moment.emoji}</span>
        </div>

        {/* Caption */}
        <div className={styles.footer}>
          <p className={styles.caption}>{moment.caption}</p>
          <span className={styles.expiry}>
            🕐 Gone in {Math.ceil((moment.expiresAt - Date.now()) / 3600000)}h
          </span>
        </div>
      </div>
    </div>
  )
}
