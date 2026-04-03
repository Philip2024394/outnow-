import { useState, useEffect, useRef } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { expressInterest } from '@/services/otwService'
import { useOverlay } from '@/contexts/OverlayContext'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import Button from '@/components/ui/Button'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { VIBE_TAGS } from '@/utils/vibeTags'
import styles from './DiscoveryCard.module.css'


const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png?updatedAt=1775081066476'


export default function DiscoveryCard({ open, session, mySession, onClose, showToast, onGuestAction }) {
  useOverlay()
  const { myInterests, mutualSessions } = useInterests()
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent, setMeetSent] = useState(false)
  const [liked, setLiked] = useState(false)
  const [hearts, setHearts] = useState([])
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

  // Photo carousel state
  const photos = session?.photos?.length ? session.photos : session?.photoURL ? [session.photoURL] : []
  const [photoIdx, setPhotoIdx] = useState(0)

  const goPrev = () => setPhotoIdx(i => Math.max(0, i - 1))
  const goNext = () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))

  if (!session) return null

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const activity = ACTIVITY_TYPES.find(a => a.id === session.activityType)

  const ACTIVITY_SLOGANS = {
    drinks:  'Up for drinks tonight',
    food:    'Looking for somewhere to eat',
    coffee:  'Coffee & good conversation',
    walk:    'Fresh air & good company',
    hangout: 'Down to hang out tonight',
    culture: 'Exploring the city tonight',
    other:   'Out and about tonight',
  }
  const activitySlogan = session.message
    ?? ACTIVITY_SLOGANS[session.activityType]
    ?? 'Out and about tonight'
  const isMutual = mutualSessions.has(session.id)
  const hasExpressedInterest = myInterests.has(session.id)

  // Match percentage — based on shared activities, mutual status, same area
  const matchPercent = (() => {
    let score = 52
    const myActs = mySession?.activities ?? []
    const theirActs = session.activities ?? []
    const overlap = myActs.filter(a => theirActs.includes(a)).length
    score += Math.min(overlap * 7, 21)
    if (mySession?.activityType === session.activityType) score += 12
    if (isMutual) score += 15
    if (mySession?.area && session.area && mySession.area === session.area) score += 5
    // Seed extra consistency from session id
    const seed = session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10
    score += seed
    return Math.min(score, 99)
  })()
  const isHighMatch = matchPercent >= 80

  // Profile star rating (3–5) — seeded from session id for consistency
  const profileStars = (() => {
    const seed = session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return 3 + (seed % 3) // 3, 4, or 5
  })()

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

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    if (meetSent) return
    setMeetLoading(true)
    try {
      await expressInterest(session.userId, session.id)
      setMeetSent(true)
      showToast(`💬 Message sent to ${session.displayName ?? 'them'}!`, 'success')
    } catch (err) {
      const msg = err?.code === 'functions/already-exists'
        ? 'Already sent — waiting for their reply.'
        : 'Could not send. Try again.'
      showToast(msg, 'error')
    }
    setMeetLoading(false)
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true)
    // Spawn 6 hearts at slightly varied horizontal positions
    const batch = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      left: 38 + (Math.random() * 40 - 20), // % offset from right edge area
      delay: i * 0.12,
      size: 14 + Math.random() * 10,
    }))
    setHearts(batch)
    setTimeout(() => setHearts([]), 2000)
    showToast?.(`❤️ You liked ${session.displayName ?? 'this profile'}!`, 'success')
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
      <div className={styles.card} style={{ '--status-color': isInviteOut ? '#FFD60A' : isScheduled ? '#FF9500' : '#39FF14' }}>

        {/* ── Card header — activity outside/above the photo ── */}
        {activity && (
          <div className={styles.cardHeader} style={{ '--status-color': isInviteOut ? '#FFD60A' : isScheduled ? '#FF9500' : '#39FF14' }}>
            <div className={styles.activityHeader}>
              <span className={styles.activityHeaderIcon}>{activity.emoji ?? '🎯'}</span>
              <div className={styles.activityHeaderText}>
                <span className={styles.activityHeaderLabel}>{activity.label}</span>
                <span className={styles.activityHeaderSlogan}>{activitySlogan}</span>
              </div>
            </div>
            <div className={styles.matchBadge}>
              {isHighMatch && <span className={styles.matchStar}>⭐</span>}
              <span className={styles.matchPercent}>{matchPercent}%</span>
              <span className={styles.matchLabel}>Match</span>
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
            {/* Bottom-left: name + age + location */}
            <div className={styles.photoBannerMeta}>
              <span className={styles.photoBannerName}>
                {session.displayName ?? 'Someone'}
                {session.age ? <span className={styles.photoBannerAge}>, {session.age}</span> : null}
                {!isScheduled && !isInviteOut && <span className={styles.liveDot} />}
              </span>
              {(session.city || session.area) && (
                <span className={styles.photoBannerCity}>
                  📍 {session.city ?? session.area}
                </span>
              )}
            </div>

            {/* Top-left: walk time + distance */}
            {session.distanceKm != null && (
              <div className={styles.photoBannerDist}>
                🚶 {Math.max(1, Math.round(session.distanceKm / 0.083))} min
                {' · '}
                {session.distanceKm < 1
                  ? `${Math.round(session.distanceKm * 1000)}m`
                  : `${session.distanceKm.toFixed(1)}km`}
              </div>
            )}

            {/* Close — top-right of photo */}
            <button className={styles.photoCloseBtn} onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Like button — bottom-right of photo */}
            <button
              className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
              onClick={handleLike}
              aria-label="Like photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Floating hearts */}
            {hearts.map(h => (
              <span
                key={h.id}
                className={styles.floatingHeart}
                style={{ right: `${h.left}px`, fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}
              >❤️</span>
            ))}
          </div>
        )}

        {/* ── Thumbnail strip ── */}
        {photos.length > 1 && (
          <div className={styles.thumbStrip}>
            <button
              className={styles.thumbArrow}
              onClick={goPrev}
              disabled={photoIdx === 0}
              aria-label="Previous photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className={styles.thumbList}>
              {photos.map((url, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`}
                  onClick={() => setPhotoIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                >
                  <img src={url} alt="" className={styles.thumbImg} />
                </button>
              ))}
            </div>

            <button
              className={styles.thumbArrow}
              onClick={goNext}
              disabled={photoIdx === photos.length - 1}
              aria-label="Next photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Profile */}
        <div className={styles.profile}>
          <div className={styles.info}>
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
          </div>
        </div>


        {/* Looking for */}
        {session.lookingFor && (
          <div className={styles.lookingForRow}>
            <span className={styles.lookingForLabel}>Here for</span>
            <span className={styles.lookingForText}>{session.lookingFor}</span>
          </div>
        )}

        {/* Timer / Scheduled badge */}
        <div className={styles.timerRow}>
          {isScheduled ? (
            <>
              <span className={styles.scheduledBadge}>🕐 {fmtScheduledFull(session.scheduledFor)}</span>
              <div className={styles.profileStars}>
                {'★'.repeat(profileStars)}{'☆'.repeat(5 - profileStars)}
                <span className={styles.profileStarsLabel}>Active</span>
              </div>
            </>
          ) : (
            <>
              <CountdownTimer expiresAtMs={session.expiresAtMs} />
              {isMutual && <span className={styles.mutualBadge}>💜 Mutual</span>}
            </>
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

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            variant="mutual"
            size="lg"
            fullWidth
            loading={meetLoading}
            disabled={meetSent || hasExpressedInterest}
            onClick={handleLetsMeet}
          >
            {meetSent || hasExpressedInterest ? '✓ Message Sent' : 'Let\'s Meet Who Knows'}
          </Button>
        </div>
      </div>
        </div>{/* scrollContent */}
      </div>{/* sheet */}
    </div>{/* wrapper */}
    </>
  )
}
