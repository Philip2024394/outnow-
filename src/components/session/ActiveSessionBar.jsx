import { useState, useEffect } from 'react'
import { endSession, cancelScheduled } from '@/services/sessionService'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { activityEmoji } from '@/firebase/collections'
import styles from './ActiveSessionBar.module.css'

function useCountdownToTime(ms) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (!ms) return
    const tick = () => {
      const diff = Math.max(0, ms - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setDisplay(h > 0 ? `${h}h ${m}m` : `${m}m`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [ms])
  return display
}

export default function ActiveSessionBar({ session }) {
  const [ending, setEnding] = useState(false)
  const isScheduled = session.status === 'scheduled'
  const countdown = useCountdownToTime(isScheduled ? session.scheduledFor : null)

  const handleEnd = async () => {
    setEnding(true)
    try {
      if (isScheduled) await cancelScheduled(session.id)
      else await endSession(session.id)
    } catch {
      setEnding(false)
    }
  }

  const emoji = activityEmoji(session.activityType)

  function fmtTime(ms) {
    if (!ms) return ''
    return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className={[styles.bar, isScheduled ? styles.barScheduled : ''].join(' ')}>
      <div className={styles.left}>
        <div className={[styles.liveDot, isScheduled ? styles.liveDotScheduled : ''].join(' ')} />
        <span className={styles.emoji}>{emoji}</span>
        <div className={styles.info}>
          {isScheduled ? (
            <>
              <span className={[styles.label, styles.labelScheduled].join(' ')}>Out Later — {fmtTime(session.scheduledFor)}</span>
              <span className={styles.sublabel}>Goes live in {countdown}</span>
            </>
          ) : (
            <>
              <span className={styles.label}>You're live</span>
              <CountdownTimer expiresAtMs={session.expiresAtMs} />
            </>
          )}
        </div>
      </div>
      <button className={styles.endBtn} onClick={handleEnd} disabled={ending}>
        {ending ? '…' : isScheduled ? 'Cancel' : 'End'}
      </button>
    </div>
  )
}
