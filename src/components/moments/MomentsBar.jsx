import { useEffect, useState } from 'react'
import styles from './MomentsBar.module.css'

const VISIBLE = 3
const ROTATE_MS = 4000

export default function MomentsBar({ moments = [], isLive, onAdd, onView }) {
  const [offset, setOffset] = useState(0)

  // Rotate visible moments every 4s when there are more than 3
  useEffect(() => {
    if (moments.length <= VISIBLE) { setOffset(0); return }
    const id = setInterval(() => {
      setOffset(prev => (prev + 1) % moments.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [moments.length])

  if (moments.length === 0 && !isLive) return null

  // Pick 3 with wrap-around
  const visible = moments.length > 0
    ? Array.from({ length: Math.min(VISIBLE, moments.length) }, (_, i) => {
        const idx = (offset + i) % moments.length
        return { moment: moments[idx], originalIndex: idx }
      })
    : []

  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        {/* Add square — only when live */}
        {isLive && (
          <button className={styles.addCard} onClick={onAdd} aria-label="Add moment">
            <span className={styles.addPlus}>+</span>
            <span className={styles.addLabel}>Add</span>
          </button>
        )}

        {/* 3 moment squares */}
        {visible.map(({ moment, originalIndex }) => (
          <button
            key={moment.id}
            className={styles.card}
            onClick={() => onView(originalIndex)}
            aria-label={`${moment.displayName}'s moment`}
          >
            <div
              className={styles.cardInner}
              style={moment.photoURL
                ? { backgroundImage: `url(${moment.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: moment.gradient }
              }
            >
              {!moment.photoURL && <span className={styles.cardEmoji}>{moment.emoji}</span>}
              <div className={styles.cardOverlay}>
                <span className={styles.cardName}>{moment.displayName}</span>
              </div>
            </div>
          </button>
        ))}

        {/* Dot indicator when rotating */}
        {moments.length > VISIBLE && (
          <div className={styles.dots}>
            {moments.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i >= offset && i < offset + VISIBLE ? styles.dotActive : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
