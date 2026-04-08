import { useEffect, useState } from 'react'
import styles from './WaveBanner.module.css'

/**
 * User B sees this when someone sends a wave.
 * Slides in from the bottom-right → centres → auto-dismisses after 5s → slides out left.
 * Tapping the avatar or "View Profile" opens the sender's profile.
 */
export default function WaveBanner({ request, onViewProfile, onDismiss }) {
  const [phase, setPhase] = useState('enter') // enter | centre | exit

  useEffect(() => {
    // After slide-in animation completes (0.4s), hold for 5s, then exit
    const holdTimer  = setTimeout(() => setPhase('exit'), 5400)
    const closeTimer = setTimeout(() => onDismiss?.(), 5400 + 400)
    return () => { clearTimeout(holdTimer); clearTimeout(closeTimer) }
  }, [onDismiss])

  const handleViewProfile = () => {
    onViewProfile?.()
    onDismiss?.()
  }

  const photo = request.fromPhotoURL ?? null
  const name  = request.fromDisplayName ?? 'Someone'

  return (
    <div className={`${styles.banner} ${phase === 'exit' ? styles.exit : ''}`}>
      {/* Avatar — tappable */}
      <button className={styles.avatarBtn} onClick={handleViewProfile} aria-label={`View ${name}'s profile`}>
        {photo
          ? <img src={photo} alt={name} className={styles.avatarImg} />
          : <span className={styles.avatarInitial}>{name[0].toUpperCase()}</span>
        }
        <span className={styles.waveEmoji}>👋</span>
      </button>

      {/* Text */}
      <div className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.sub}>sent you a wave</span>
      </div>

      {/* View profile button */}
      <button className={styles.viewBtn} onClick={handleViewProfile}>
        View
      </button>
    </div>
  )
}
