import { useState } from 'react'
import { respondToOtw } from '@/services/otwService'
import styles from './OtwRequestBanner.module.css'
import Spinner from '@/components/ui/Spinner'

/**
 * Persistent top banner when User A receives an OTW request.
 * Shows sender name + Accept/Decline buttons.
 */
export default function OtwRequestBanner({ request, onAction }) {
  const [loading, setLoading] = useState(null) // 'accept' | 'decline'

  const handle = async (accept) => {
    setLoading(accept ? 'accept' : 'decline')
    try {
      await respondToOtw(request.id, accept)
    } catch {
      // Non-critical: the hook will refresh state
    }
    setLoading(null)
  }

  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.icon}>👟</span>
        <div className={styles.text}>
          <span className={styles.name}>{request.fromDisplayName ?? 'Someone'}</span>
          <span className={styles.sub}>wants to join you</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={[styles.btn, styles.decline].join(' ')}
          onClick={() => handle(false)}
          disabled={!!loading}
        >
          {loading === 'decline' ? <Spinner size={14} /> : '✕'}
        </button>
        <button
          className={[styles.btn, styles.accept].join(' ')}
          onClick={() => handle(true)}
          disabled={!!loading}
        >
          {loading === 'accept' ? <Spinner size={14} color="#000" /> : '✓'}
        </button>
      </div>
    </div>
  )
}
