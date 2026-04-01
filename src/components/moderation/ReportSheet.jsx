import { useState } from 'react'
import { reportUser, blockUser } from '@/services/moderationService'
import { useBlockList } from '@/hooks/useBlockList'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import styles from './ReportSheet.module.css'

const REPORT_REASONS = [
  { id: 'fake', label: 'Fake profile or location' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment or threats' },
  { id: 'spam', label: 'Spam or scam' },
  { id: 'other', label: 'Other' },
]

export default function ReportSheet({ open, session, onClose, showToast }) {
  const { addBlock } = useBlockList()
  const [selectedReason, setSelectedReason] = useState(null)
  const [wantBlock, setWantBlock] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const handleSubmit = async () => {
    if (!selectedReason) return
    setLoading(true)
    try {
      await reportUser({
        reportedUserId: session.userId,
        sessionId: session.id,
        reason: selectedReason,
      })
      if (wantBlock) {
        await blockUser(session.userId)
        addBlock(session.userId)
      }
      showToast('Report submitted. They\'ve been removed from your map.', 'success')
      onClose()
    } catch {
      showToast('Could not submit report. Try again.', 'error')
    }
    setLoading(false)
  }

  const handleBlockOnly = async () => {
    setLoading(true)
    try {
      await blockUser(session.userId)
      addBlock(session.userId)
      showToast('User blocked.', 'success')
      onClose()
    } catch {
      showToast('Could not block. Try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Report">
      <div className={styles.content}>
        <p className={styles.sub}>
          What's wrong with this user?
        </p>

        <div className={styles.reasons}>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.id}
              className={[
                styles.reason,
                selectedReason === r.id ? styles.selected : '',
              ].join(' ')}
              onClick={() => setSelectedReason(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className={styles.blockRow}>
          <input
            type="checkbox"
            checked={wantBlock}
            onChange={(e) => setWantBlock(e.target.checked)}
            className={styles.checkbox}
          />
          Also block this user
        </label>

        <Button
          variant="danger"
          size="lg"
          fullWidth
          disabled={!selectedReason}
          loading={loading}
          onClick={handleSubmit}
        >
          Submit Report
        </Button>

        <button className={styles.blockOnlyBtn} onClick={handleBlockOnly} disabled={loading}>
          Just block, don't report
        </button>
      </div>
    </BottomSheet>
  )
}
