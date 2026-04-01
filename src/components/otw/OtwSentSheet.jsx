import { useEffect } from 'react'
import { useOtwRequests } from '@/hooks/useOtwRequests'
import { cancelOtw } from '@/services/otwService'
import { useOverlay } from '@/contexts/OverlayContext'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import { activityEmoji } from '@/firebase/collections'
import styles from './OtwSentSheet.module.css'

/**
 * Shown to User B after sending an OTW request.
 * Transitions automatically when User A accepts → open payment gate.
 */
export default function OtwSentSheet({ open, request, onClose }) {
  const { myOutgoingRequest } = useOtwRequests()
  const { openPayment, closeOverlay } = useOverlay()

  // React to status changes from Firestore
  useEffect(() => {
    if (!myOutgoingRequest) return
    if (myOutgoingRequest.status === 'accepted') {
      closeOverlay()
      setTimeout(() => openPayment(myOutgoingRequest), 300)
    } else if (myOutgoingRequest.status === 'declined' || myOutgoingRequest.status === 'cancelled') {
      onClose()
    }
  }, [myOutgoingRequest?.status]) // eslint-disable-line

  const handleCancel = async () => {
    if (request?.id) {
      try { await cancelOtw(request.id) } catch {}
    }
    onClose()
  }

  const session = request?.session

  return (
    <BottomSheet open={open} onClose={handleCancel}>
      <div className={styles.content}>
        <div className={styles.icon}>👟</div>

        <h2 className={styles.heading}>Request sent</h2>

        {session && (
          <div className={styles.sessionInfo}>
            <span>{activityEmoji(session.activityType)}</span>
            <span>{session.area ?? 'Nearby'}</span>
          </div>
        )}

        <div className={styles.waiting}>
          <div className={styles.dots}>
            <span /><span /><span />
          </div>
          <p>Waiting for them to accept…</p>
        </div>

        <p className={styles.note}>
          Request expires in 5 minutes if not answered.
        </p>

        <Button variant="ghost" fullWidth onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </BottomSheet>
  )
}
