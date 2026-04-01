import { useState } from 'react'
import { confirmCheckIn, endSession } from '@/services/sessionService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import styles from './StillHerePrompt.module.css'

export default function StillHerePrompt({ open, sessionId }) {
  const [loading, setLoading] = useState(null) // 'yes' | 'no'

  const handleYes = async () => {
    setLoading('yes')
    try { await confirmCheckIn(sessionId) } catch {}
    setLoading(null)
  }

  const handleNo = async () => {
    setLoading('no')
    try { await endSession(sessionId) } catch {}
    setLoading(null)
  }

  return (
    <Modal open={open} onClose={handleNo}>
      <div className={styles.content}>
        <div className={styles.icon}>📍</div>
        <h2 className={styles.heading}>Still here?</h2>
        <p className={styles.sub}>
          You've been live for 30 minutes. Are you still at this location?
        </p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading === 'yes'}
            onClick={handleYes}
          >
            Yes, still here
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            loading={loading === 'no'}
            onClick={handleNo}
          >
            No, I'm leaving
          </Button>
        </div>
      </div>
    </Modal>
  )
}
