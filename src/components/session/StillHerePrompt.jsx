import { useState, useEffect } from 'react'
import { confirmCheckIn, endSession } from '@/services/sessionService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from './StillHerePrompt.module.css'

const HOUR_MS = 60 * 60 * 1000

export default function StillHerePrompt({ open: dbOpen, sessionId }) {
  const [timerOpen, setTimerOpen] = useState(false)
  const [loading, setLoading]     = useState(null) // 'yes' | 'no'

  // Show every hour while session is active
  useEffect(() => {
    if (!sessionId) return
    const t = setInterval(() => setTimerOpen(true), HOUR_MS)
    return () => clearInterval(t)
  }, [sessionId])

  const isOpen = dbOpen || timerOpen

  const handleYes = async () => {
    setLoading('yes')
    setTimerOpen(false)
    try { await confirmCheckIn(sessionId) } catch {}
    setLoading(null)
  }

  const handleNo = async () => {
    setLoading('no')
    setTimerOpen(false)
    try { await endSession(sessionId) } catch {}
    setLoading(null)
  }

  return (
    <Modal open={isOpen} onClose={() => {}}>
      <div className={styles.content}>
        <div className={styles.icon}>📍</div>
        <h2 className={styles.heading}>Still here?</h2>
        <p className={styles.sub}>
          Are you still out at this location?
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading === 'yes'}
            onClick={handleYes}
          >
            ✅ Still here
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            loading={loading === 'no'}
            onClick={handleNo}
          >
            🚶 No, I'm leaving
          </Button>
        </div>
      </div>
    </Modal>
  )
}
