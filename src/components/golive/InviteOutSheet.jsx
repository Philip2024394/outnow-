import { useState } from 'react'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import ActivityIcon from '@/components/ui/ActivityIcon'
import styles from './InviteOutSheet.module.css'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png?updatedAt=1775081066476'

// currentStatus: 'invite' | 'live' | 'later' | null
export default function InviteOutSheet({ open, onClose, onPost, onGoLive, onGoLater, currentStatus = null }) {
  const [activity, setActivity] = useState(null)
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)

  const handlePost = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onPost?.(activity, message)
      onClose()
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleGoLive = () => {
    onClose()
    setTimeout(() => onGoLive?.(), 200)
  }

  const handleGoLater = () => {
    onClose()
    setTimeout(() => onGoLater?.(), 200)
  }

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <img src={BG_URL} alt="" className={styles.bgImage} />
        <div className={styles.frost} />
        <div className={styles.yellowStrip} />
        <div className={styles.handle} onClick={onClose} />

        <div className={styles.scrollContent}>
          <div className={styles.header}>
            <div className={styles.yellowDot} />
            <h2 className={styles.title}>Want to go out?</h2>
          </div>
          <p className={styles.sub}>
            Let people nearby know you're looking for plans. Your pin appears yellow on the map.
          </p>

          {/* Activity */}
          <div className={styles.section}>
            <span className={styles.label}>What are you up for?</span>
            <div className={styles.chipGrid}>
              {ACTIVITY_TYPES.map(a => (
                <button
                  key={a.id}
                  className={`${styles.chip} ${activity === a.id ? styles.chipActive : ''}`}
                  onClick={() => setActivity(a.id === activity ? null : a.id)}
                  type="button"
                >
                  <ActivityIcon activity={a} size={18} /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional message */}
          <div className={styles.section}>
            <span className={styles.label}>Add a message (optional)</span>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Anyone fancy a casual drink tonight?"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={350}
              rows={2}
            />
          </div>

          {/* Actions — hide the button matching current status */}
          <div className={styles.actions}>
            {currentStatus !== 'invite' && (
              <button
                className={styles.postBtn}
                onClick={handlePost}
                disabled={loading}
              >
                <div className={styles.btnLeft}>
                  <span className={styles.btnDot}>🟡</span>
                  <span className={styles.btnText}>{loading ? 'Posting…' : 'Post Invite Out'}</span>
                </div>
                <span className={styles.btnIcon}>📍</span>
              </button>
            )}

            {currentStatus !== 'live' && (
              <button className={styles.liveBtn} onClick={handleGoLive}>
                <div className={styles.btnLeft}>
                  <span className={styles.btnDot}>🟢</span>
                  <span className={styles.btnText}>I'm Out Now</span>
                </div>
                <span className={styles.btnIcon}>📍</span>
              </button>
            )}

            {currentStatus !== 'later' && (
              <button className={styles.laterBtn} onClick={handleGoLater}>
                <div className={styles.btnLeft}>
                  <span className={styles.btnDot}>🟠</span>
                  <span className={styles.btnText}>Going Out Later</span>
                </div>
                <span className={styles.btnIcon}>🕐</span>
              </button>
            )}
          </div>

          <p className={styles.disclaimer}>
            Your invite disappears when you go live or end your session.
          </p>
        </div>
      </div>
    </div>
  )
}
