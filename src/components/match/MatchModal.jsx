import { useEffect, useState } from 'react'
import styles from './MatchModal.module.css'

export default function MatchModal({ profile, onChat, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay so animation triggers after mount
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const dismiss = (cb) => {
    setVisible(false)
    setTimeout(cb, 400)
  }

  return (
    <div className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}>
      {/* Confetti dots */}
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className={styles.confetti}
          style={{
            left: `${5 + (i * 5.5) % 90}%`,
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
            background: ['#39FF14','#FF6B35','#A855F7','#FFD60A','#FF3B64'][i % 5],
          }}
        />
      ))}

      <div className={`${styles.card} ${visible ? styles.cardVisible : ''}`}>
        {/* Avatars */}
        <div className={styles.avatarRow}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>😊</div>
            <span className={styles.avatarLabel}>You</span>
          </div>
          <div className={styles.heartBurst}>❤️</div>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{profile?.emoji ?? '😎'}</div>
            <span className={styles.avatarLabel}>{profile?.displayName ?? 'Them'}</span>
          </div>
        </div>

        <h2 className={styles.title}>It's a Match!</h2>
        <p className={styles.sub}>
          You and <strong>{profile?.displayName}</strong> both want to meet.
          <br />Send a free message to say hi.
        </p>

        {/* CTA */}
        <button className={styles.chatBtn} onClick={() => dismiss(onChat)}>
          💬 Send a message
        </button>
        <button className={styles.keepBtn} onClick={() => dismiss(onClose)}>
          Keep browsing
        </button>
      </div>
    </div>
  )
}
