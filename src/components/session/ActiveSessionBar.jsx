import { useState } from 'react'
import { endSession } from '@/services/sessionService'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { activityEmoji } from '@/firebase/collections'
import styles from './ActiveSessionBar.module.css'

export default function ActiveSessionBar({ session }) {
  const [ending, setEnding] = useState(false)

  const handleEnd = async () => {
    setEnding(true)
    try {
      await endSession(session.id)
    } catch {
      setEnding(false)
    }
  }

  const emoji = activityEmoji(session.activityType)

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.liveDot} />
        <span className={styles.emoji}>{emoji}</span>
        <div className={styles.info}>
          <span className={styles.label}>You're live</span>
          <CountdownTimer expiresAtMs={session.expiresAtMs} />
        </div>
      </div>
      <button
        className={styles.endBtn}
        onClick={handleEnd}
        disabled={ending}
      >
        {ending ? '…' : 'End'}
      </button>
    </div>
  )
}
