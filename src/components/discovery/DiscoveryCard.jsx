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

  const isScheduled = session.status === 'scheduled'
  const activity = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const emoji = activityEmoji(session.activityType)
  const isMutual = mutualSessions.has(session.id)
  const hasExpressedInterest = myInterests.has(session.id)

  function fmtScheduledFull(ms) {
    if (!ms) return 'later'
    const d = new Date(ms)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    if (isToday) return `Tonight at ${timeStr}`
    if (isTomorrow) return `Tomorrow at ${timeStr}`
    return d.toLocaleDateString([], { weekday: 'long' }) + ' at ' + timeStr
  }

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

        {/* Timer / Scheduled badge */}
        <div className={styles.timerRow}>
          <div className={[styles.dot, isScheduled ? styles.dotScheduled : isMutual ? styles.dotMutual : ''].join(' ')} />
          {isScheduled
            ? <span className={styles.scheduledBadge}>🕐 {fmtScheduledFull(session.scheduledFor)}</span>
            : <CountdownTimer expiresAtMs={session.expiresAtMs} />
          }
          {isMutual && !isScheduled && (
            <span className={styles.mutualBadge}>💜 Mutual</span>
          )}
        </div>

        {/* Status hint */}
        {isScheduled ? (
          <div className={styles.scheduledBanner}>
            Planning ahead — like them now and they'll know before they go out
          </div>
        ) : isMutual ? (
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
          {isScheduled ? (
            /* Scheduled: express interest before they go live */
            <Button
              variant="mutual"
              size="lg"
              fullWidth
              loading={inviteLoading}
              disabled={hasExpressedInterest}
              onClick={handleInvite}
            >
              {hasExpressedInterest ? '✓ Interest sent' : '🧡 I\'m interested — save my spot'}
            </Button>
          ) : (
            <>
              <Button
                variant={isMutual ? 'otw' : 'ghost'}
                size="lg"
                fullWidth
                loading={otwLoading}
                onClick={handleOtw}
              >
                {isMutual ? '🚀 OTW — I\'m on my way!' : '👟 OTW'}
              </Button>
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
            </>
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
