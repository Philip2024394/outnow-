import { useState, useEffect, useRef } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { sendOtwRequest, expressInterest, sendWave } from '@/services/otwService'
import { useOverlay } from '@/contexts/OverlayContext'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import ActivityIcon from '@/components/ui/ActivityIcon'
import { VIBE_TAGS } from '@/utils/vibeTags'
import GiftPickerSheet from './GiftPickerSheet'
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

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png?updatedAt=1775081066476'

export default function DiscoveryCard({ open, session, mySession, onClose, showToast, onGuestAction }) {
  const { openReport, openOtwSent } = useOverlay()
  const { myInterests, mutualSessions } = useInterests()
  const [otwLoading, setOtwLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [waveLoading, setWaveLoading] = useState(false)
  const [waveSent, setWaveSent] = useState(false)
  const [venueInviteSent, setVenueInviteSent] = useState(false)
  const [giftPickerOpen, setGiftPickerOpen] = useState(false)
  const [pendingInviteType, setPendingInviteType] = useState(null)
  const [selectedGift, setSelectedGift] = useState(null)
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 120) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])
  const { show: showWaveIntro, dismiss: dismissWaveIntro } = useFeatureIntro('wave')

  // Photo carousel state — guard against null session (hooks must be called unconditionally)
  const photos = session?.photos?.length ? session.photos : session?.photoURL ? [session.photoURL] : []
  const [photoIdx, setPhotoIdx] = useState(0)
  const [direction, setDirection] = useState('forward') // 'forward' | 'backward'

  const handlePhotoBtn = () => {
    if (photos.length <= 1) return
    if (direction === 'forward') {
      if (photoIdx < photos.length - 1) {
        setPhotoIdx(i => i + 1)
      } else {
        // On last image — first press goes back, then keep going back
        setDirection('backward')
        setPhotoIdx(i => i - 1)
      }
    } else {
      if (photoIdx > 0) {
        setPhotoIdx(i => i - 1)
      } else {
        // Back at first — switch to forward
        setDirection('forward')
        setPhotoIdx(i => i + 1)
      }
    }
  }

  const isOnLast  = photos.length > 0 && photoIdx === photos.length - 1
  const showArrow = direction === 'forward' && isOnLast

  if (!session) return null

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const activity = ACTIVITY_TYPES.find(a => a.id === session.activityType)
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

  // Opens gift picker before sending — gift is null if skipped
  const handleGiftConfirm = async (gift) => {
    setSelectedGift(gift)
    setGiftPickerOpen(false)
    const type = pendingInviteType
    setPendingInviteType(null)

    if (type === 'venue') {
      setVenueInviteSent(true)
      const venue = mySession?.placeName ?? 'my spot'
      const giftMsg = gift ? ` — ${gift.emoji} ${gift.label} on me!` : '!'
      showToast(`📍 Invite sent — join me at ${venue}${giftMsg}`, 'success')
    } else {
      setInviteLoading(true)
      try {
        await expressInterest(session.userId, session.id)
        const giftMsg = gift ? ` with ${gift.emoji} ${gift.label} on me` : ''
        showToast(`Invite sent${giftMsg}! Waiting for them to reciprocate.`, 'success')
      } catch {
        showToast('Could not send invite. Try again.', 'error')
      }
      setInviteLoading(false)
    }
  }

  const handleInvite = () => {
    if (onGuestAction) { onGuestAction(); return }
    setPendingInviteType('meet')
    setGiftPickerOpen(true)
  }

  // User B presses OTW (requires mutual interest or direct OTW flow)
  const handleOtw = async () => {
    if (onGuestAction) { onGuestAction(); return }
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
    if (onGuestAction) { onGuestAction(); return }
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

  const handleVenueInvite = () => {
    setPendingInviteType('venue')
    setGiftPickerOpen(true)
  }

  const handleReport = () => {
    openReport(session)
    onClose()
  }

  const vibeTag    = VIBE_TAGS.find(v => v.id === session.vibe)
  const isGroup    = !!session.isGroup
  const groupMembers = session.groupMembers ?? []

  if (!open) return null

  return (
    <>
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <img src={BG_URL} alt="" className={styles.bgImage} />
        <div className={styles.frost} />
        <div className={`${styles.greenStrip} ${isScheduled ? styles.orangeStrip : ''} ${isInviteOut ? styles.yellowStrip : ''}`} />
        <div className={styles.handle} />
        <div className={styles.scrollContent}>
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

        {/* ── Card header — activity outside/above the photo ── */}
        {activity && (
          <div className={styles.cardHeader}>
            <div className={`${styles.statusTag} ${isInviteOut ? styles.statusTagInvite : isScheduled ? styles.statusTagLater : styles.statusTagNow}`}>
              <span className={styles.statusDot} />
              {isInviteOut ? 'Invite Out' : isScheduled ? 'Out Later' : 'Out Now'}
            </div>
            <div className={styles.activityHeader}>
              <span className={styles.activityHeaderIcon}>{activity.emoji ?? '🎯'}</span>
              <span className={styles.activityHeaderLabel}>{activity.label}</span>
            </div>
          </div>
        )}

        {/* ── Photo carousel banner ── */}
        {photos.length > 0 && (
          <div
            className={styles.photoBanner}
            style={{ '--status-color': isInviteOut ? '#FFD60A' : isScheduled ? '#FF9500' : '#39FF14' }}
          >
            <img
              key={photoIdx}
              src={photos[photoIdx]}
              alt={session.displayName}
              className={styles.photoBannerImg}
            />
            {/* Bottom-left: name + age */}
            <div className={styles.photoBannerMeta}>
              <span className={styles.photoBannerName}>
                {session.displayName ?? 'Someone'}
                {session.age ? <span className={styles.photoBannerAge}>, {session.age}</span> : null}
              </span>
            </div>

            {/* Top-left: distance */}
            {session.distanceKm != null && (
              <div className={styles.photoBannerDist}>
                📍 {session.distanceKm < 1
                  ? `${Math.round(session.distanceKm * 1000)}m`
                  : `${session.distanceKm.toFixed(1)}km`} away
              </div>
            )}

            {/* Fingerprint / back-arrow nav button — only if more than 1 photo */}
            {photos.length > 1 && (
              <button className={styles.photoNavBtn} onClick={handlePhotoBtn} aria-label="Next photo">
                {showArrow ? '←' : '👆'}
              </button>
            )}
          </div>
        )}


        {/* Profile */}
        <div className={styles.profile}>
          <Avatar
            src={session.photoURL}
            name={session.displayName}
            size={72}
            live={!isMutual && !isScheduled && !isInviteOut}
            mutual={isMutual}
            scheduled={isScheduled}
            inviteOut={isInviteOut}
          />
          <div className={styles.info}>
            <h2 className={styles.name}>
              {session.displayName ?? 'Someone'}
              {session.age && <span className={styles.nameAge}> {session.age}</span>}
            </h2>
            {(session.city || session.area) && (
              <div className={styles.cityLine}>
                📍 {session.city ?? session.area}
              </div>
            )}
            <div className={styles.activityRow}>
              <ActivityIcon activity={activity} size={22} className={styles.activityEmoji} />
              <span className={styles.activityLabel}>
                {activity?.label ?? (isScheduled ? 'Going out later' : 'Out now')}
              </span>
            </div>
            {isScheduled && session.placeName && (
              <div className={styles.venuePlan}>
                {session.placeName}
              </div>
            )}
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
          <button
            className={styles.fingerprintBtn}
            onClick={() => showToast?.('Identity verification coming soon', 'info')}
            aria-label="Verify identity"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C9.5 2 7.2 3 5.5 4.7"/>
              <path d="M2.5 8.5C2 9.6 1.8 10.8 2 12"/>
              <path d="M22 12c0-5.5-4.5-10-10-10"/>
              <path d="M12 8c-2.2 0-4 1.8-4 4 0 3.5 1.5 6.5 4 8.5"/>
              <path d="M20 12c0 4-2 7.5-5 9.5"/>
              <path d="M12 12v.01"/>
              <path d="M12 16c0 1.1-.4 2.1-1 2.9"/>
              <path d="M16 12c0 1.4-.3 2.8-.9 4"/>
            </svg>
          </button>
        </div>

        {/* Timer / Scheduled badge */}
        <div className={styles.timerRow}>
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
            I'm going out later — if you'd like to meet, hit the Let's Meet button below. Who knows? 😉
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
              {hasExpressedInterest ? '✓ Request Sent' : '🧡 Let\'s Meet'}
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
                    <span className={styles.redHeart}>❤️</span> Let's Meet
                  </Button>
                </div>
              )}
              {mySession?.placeName && !venueInviteSent && (
                <button
                  className={styles.venueInviteBtn}
                  onClick={handleVenueInvite}
                >
                  📍 Join me at {mySession.placeName}
                </button>
              )}
              {venueInviteSent && (
                <div className={styles.venueInviteSent}>
                  ✓ Invite sent{selectedGift ? ` — ${selectedGift.emoji} ${selectedGift.label} on me` : ''} — they can see where you are
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
        </div>{/* scrollContent */}
      </div>{/* sheet */}
    </div>{/* wrapper */}
    <GiftPickerSheet
      open={giftPickerOpen}
      recipientName={session.displayName}
      onSend={handleGiftConfirm}
      onSkip={() => handleGiftConfirm(null)}
    />
    </>
  )
}
