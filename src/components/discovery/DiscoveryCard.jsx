import { useState } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { sendOtwRequest, expressInterest, sendWave } from '@/services/otwService'
import { useOverlay } from '@/contexts/OverlayContext'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { activityEmoji, ACTIVITY_TYPES } from '@/firebase/collections'
import { VIBE_TAGS } from '@/utils/vibeTags'
import styles from './DiscoveryCard.module.css'

const HEART_POSITIONS = [
  { left: '15%', delay: '0s',    duration: '2.2s' },
  { left: '32%', delay: '0.5s',  duration: '2.6s' },
  { left: '50%', delay: '1.0s',  duration: '2.0s' },
  { left: '68%', delay: '0.3s',  duration: '2.8s' },
  { left: '82%', delay: '1.4s',  duration: '2.3s' },
  { left: '42%', delay: '1.8s',  duration: '2.5s' },
]

function FloatingHearts() {
  return (
    <div className={styles.heartsWrap} aria-hidden="true">
      {HEART_POSITIONS.map((h, i) => (
        <span
          key={i}
          className={styles.floatHeart}
          style={{ left: h.left, animationDelay: h.delay, animationDuration: h.duration }}
        >
          ❤️
        </span>
      ))}
    </div>
  )
}

export default function DiscoveryCard({ open, session, onClose, showToast }) {
  const { openReport, openOtwSent } = useOverlay()
  const { myInterests, mutualSessions } = useInterests()
  const [otwLoading, setOtwLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [waveLoading, setWaveLoading] = useState(false)
  const [waveSent, setWaveSent] = useState(false)
  const { show: showWaveIntro, dismiss: dismissWaveIntro } = useFeatureIntro('wave')

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

  const handleWave = async () => {
    setWaveLoading(true)
    try {
      await sendWave(session.userId, session.id)
      setWaveSent(true)
      showToast('👋 Wave sent!', 'success')
    } catch {
      showToast('Could not send wave. Try again.', 'error')
    }
    setWaveLoading(false)
  }

  const handleReport = () => {
    openReport(session)
    onClose()
  }

  const vibeTag    = VIBE_TAGS.find(v => v.id === session.vibe)
  const isGroup    = !!session.isGroup
  const groupMembers = session.groupMembers ?? []

  return (
    <BottomSheet open={open} onClose={onClose}>
      {showWaveIntro && (
        <FeatureIntro
          emoji="👋"
          title="Wave at Someone"
          bullets={[
            'A wave is a light, no-pressure way to say you noticed them',
            'No commitment — just a friendly nudge that you\'re nearby',
            'If they wave back or send OTW, you\'ll know there\'s a match',
          ]}
          onDone={dismissWaveIntro}
        />
      )}
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
            {vibeTag && (
              <div className={styles.vibeBadge}>
                {vibeTag.emoji} {vibeTag.label}
              </div>
            )}
            {isGroup && (
              <div className={styles.groupBadge}>
                <span className={styles.groupIcon}>👥</span>
                <span className={styles.groupText}>Group of {session.groupSize}</span>
              </div>
            )}
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

        {/* Group members strip */}
        {isGroup && groupMembers.length > 0 && (
          <div className={styles.membersRow}>
            {groupMembers.map((m, i) => (
              <div key={i} className={styles.memberChip}>
                <div className={styles.memberAvatar}>
                  {m.isAnon ? '?' : m.displayName[0].toUpperCase()}
                </div>
                <span className={styles.memberName}>{m.isAnon ? 'Friend' : m.displayName}</span>
              </div>
            ))}
          </div>
        )}

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
                {isMutual ? '🚀 OTW — I\'m on my way!' : isGroup ? `👥 OTW — Join the group` : '👟 OTW'}
              </Button>
              {!isMutual && (
                <button
                  className={`${styles.waveBtn} ${waveSent ? styles.waveSent : ''}`}
                  disabled={waveSent || waveLoading}
                  onClick={handleWave}
                >
                  {waveSent ? '✓ Waved' : waveLoading ? '…' : '👋 Wave'}
                </button>
              )}
              {!hasExpressedInterest && !isMutual && (
                <div className={styles.inviteWrap}>
                  <FloatingHearts />
                  <Button
                    variant="mutual"
                    size="lg"
                    fullWidth
                    loading={inviteLoading}
                    onClick={handleInvite}
                  >
                    <span className={styles.redHeart}>❤️</span> Invite them to meet
                  </Button>
                </div>
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
