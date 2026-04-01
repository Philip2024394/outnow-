import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useInterests } from '@/hooks/useInterests'
import { sendOtwRequest, expressInterest } from '@/services/otwService'
import { useOverlay } from '@/contexts/OverlayContext'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { activityEmoji, ACTIVITY_TYPES } from '@/firebase/collections'
import styles from './DiscoveryCard.module.css'

export default function DiscoveryCard({ open, session, onClose, showToast }) {
  const { user } = useAuth()
  const { openReport, openOtwSent } = useOverlay()
  const { myInterests, mutualSessions } = useInterests()
  const [otwLoading, setOtwLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)

  if (!session) return null

  const activity = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const emoji = activityEmoji(session.activityType)
  const isMutual = mutualSessions.has(session.id)
  const hasExpressedInterest = myInterests.has(session.id)
  const minutesLeft = session.expiresAtMs
    ? Math.max(0, Math.floor((session.expiresAtMs - Date.now()) / 60000))
    : 0

  // User A invites User B to their location
  const handleInvite = async () => {
    setInviteLoading(true)
    try {
      await expressInterest(session.userId, session.id)
      showToast('Invite sent! Waiting for them to reciprocate.', 'success')
    } catch {
      showToast('Could not send invite. Try again.', 'error')
    }
    setInviteLoading(false)
  }

  // User B presses OTW (requires mutual interest or direct OTW flow)
  const handleOtw = async () => {
    setOtwLoading(true)
    try {
      const result = await sendOtwRequest(session.id, session.userId)
      openOtwSent({ ...result, sessionId: session.id, toUserId: session.userId, session })
      onClose()
    } catch (err) {
      const msg = err?.code === 'functions/already-exists'
        ? 'You already sent a request.'
        : err?.code === 'functions/resource-exhausted'
        ? 'Too many requests. Wait a moment.'
        : 'Could not send request. Try again.'
      showToast(msg, 'error')
    }
    setOtwLoading(false)
  }

  const handleReport = () => {
    openReport(session)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className={styles.card}>
        {/* Profile */}
        <div className={styles.profile}>
          <Avatar
            src={session.photoURL}
            name={session.displayName}
            size={72}
            live={!isMutual}
            mutual={isMutual}
          />
          <div className={styles.info}>
            <h2 className={styles.name}>{session.displayName ?? 'Someone'}</h2>
            <div className={styles.activityRow}>
              <span className={styles.activityEmoji}>{emoji}</span>
              <span className={styles.activityLabel}>
                {activity?.label ?? 'Out now'}
              </span>
            </div>
            <div className={styles.area}>
              📍 {session.area ?? 'Nearby area'}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className={styles.timerRow}>
          <div className={[styles.dot, isMutual ? styles.dotMutual : ''].join(' ')} />
          <CountdownTimer expiresAtMs={session.expiresAtMs} />
          {isMutual && (
            <span className={styles.mutualBadge}>💜 Mutual</span>
          )}
        </div>

        {/* Status hint */}
        {isMutual ? (
          <div className={styles.mutualBanner}>
            You both want to meet — press OTW to connect!
          </div>
        ) : hasExpressedInterest ? (
          <div className={styles.pendingBanner}>
            Invite sent — waiting for them to reciprocate
          </div>
        ) : null}

        {/* Actions */}
        <div className={styles.actions}>
          {/* OTW: always available, shows as primary when mutual */}
          <Button
            variant={isMutual ? 'otw' : 'ghost'}
            size="lg"
            fullWidth
            loading={otwLoading}
            onClick={handleOtw}
          >
            {isMutual ? '🚀 OTW — I\'m on my way!' : '👟 OTW'}
          </Button>

          {/* Invite: express interest for mutual match */}
          {!hasExpressedInterest && !isMutual && (
            <Button
              variant="mutual"
              size="lg"
              fullWidth
              loading={inviteLoading}
              onClick={handleInvite}
            >
              💜 Invite them to meet
            </Button>
          )}
        </div>

        {/* Report */}
        <button className={styles.reportBtn} onClick={handleReport}>
          Report or Block
        </button>
      </div>
    </BottomSheet>
  )
}
