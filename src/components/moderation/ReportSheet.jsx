import { useState } from 'react'
import { blockUser } from '@/services/moderationService'
import { useBlockList } from '@/hooks/useBlockList'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import styles from './ReportSheet.module.css'

export default function ReportSheet({ open, session, onClose, showToast }) {
  const { addBlock } = useBlockList()
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const handleBlock = async () => {
    setLoading(true)
    try {
      await blockUser(session.userId)
      addBlock(session.userId)
      showToast('User blocked and removed from your map.', 'success')
      onClose()
    } catch {
      showToast('Could not block. Try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Block User">
      <div className={styles.content}>
        <div className={styles.iconWrap}>🚫</div>
        <p className={styles.heading}>Block {session.displayName ?? 'this user'}?</p>
        <p className={styles.sub}>
          They will be removed from your map and can no longer contact you. This cannot be undone from here — manage your block list in Settings.
        </p>

        <Button
          variant="danger"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleBlock}
        >
          Block User
        </Button>

        <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
