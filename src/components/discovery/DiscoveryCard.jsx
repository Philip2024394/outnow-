import { useState, useEffect, useRef } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { lookingForText } from '@/utils/lookingForLabels'
import styles from './DiscoveryCard.module.css'

import { quoteForUser } from '@/data/brandQuotes'
import { recordPhotoView } from '@/services/photoNudgeService'

const ACTIVITY_SLOGANS = {
  drinks:  'Up for drinks tonight',
  food:    'Looking for somewhere to eat',
  coffee:  'Coffee & good conversation',
  walk:    'Fresh air & good company',
  hangout: 'Down to hang out tonight',
  culture: 'Exploring the city tonight',
  other:   'Out and about tonight',
}

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

export default function DiscoveryCard({ open, session, mySession, onClose, showToast, onGuestAction, onMeetSent }) {
  useOverlay()
  const { user } = useAuth()
  const { myInterests, mutualSessions } = useInterests()
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent, setMeetSent] = useState(false)
  const [liked, setLiked] = useState(false)
  const [hearts, setHearts] = useState([])
  const [photoIdx, setPhotoIdx] = useState(0)
  const [bioOpen, setBioOpen]   = useState(false)
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

  // Record that someone viewed a no-photo profile (must be before early return)
  useEffect(() => {
    if (open && session?.userId && !(session.photos?.length) && !session.photoURL) {
      recordPhotoView(session.userId)
    }
  }, [open, session?.userId]) // eslint-disable-line

  if (!open || !session) return null

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut

  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#8DC63F'

  const photos = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []

  const activity   = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const slogan     = session.message ?? ACTIVITY_SLOGANS[session.activityType] ?? 'Out and about tonight'
  const isMutual   = mutualSessions.has(session.id)
  const hasExpressedInterest = myInterests.has(session.id)

  const matchPercent = (() => {
    let score = 52
    const myActs    = mySession?.activities ?? []
    const theirActs = session.activities ?? []
    score += Math.min(myActs.filter(a => theirActs.includes(a)).length * 7, 21)
    if (mySession?.activityType === session.activityType) score += 12
    if (isMutual) score += 15
    if (mySession?.area && session.area && mySession.area === session.area) score += 5
    const seed = session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10
    return Math.min(score + seed, 99)
  })()

  const profileStars = 3 + (session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3)

  const timerLabel = isScheduled
    ? `🕐 ${fmtScheduledFull(session.scheduledFor)}`
    : isInviteOut
    ? '💌 Open Invite'
    : null // Out Now shows CountdownTimer component

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    if (meetSent) return
    if (session.isSeeded) {
      setMeetSent(true)
      showToast?.(`💌 Invite sent to ${session.displayName ?? 'them'}! They'll see it when they're next active.`, 'success')
      onMeetSent?.(session)
      return
    }
    setMeetLoading(true)
    try {
      await sendMeetRequest(
        { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
        session.userId,
        session.id
      )
      setMeetSent(true)
      showToast?.(`💬 Message sent to ${session.displayName ?? 'them'}!`, 'success')
      onMeetSent?.(session)
    } catch {
      showToast?.('Could not send. Try again.', 'error')
    }
    setMeetLoading(false)
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true)
    const batch = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      left: 38 + (Math.random() * 40 - 20),
      delay: i * 0.12,
      size: 14 + Math.random() * 10,
    }))
    setHearts(batch)
    setTimeout(() => setHearts([]), 2000)
    if (isMutual) {
      showToast?.(`🎉 It's mutual! Chat with ${session.displayName ?? 'them'} is opening — it's free!`, 'success')
      setTimeout(() => onMeetSent?.(session), 900)
    } else {
      showToast?.(`❤️ You liked ${session.displayName ?? 'this profile'}!`, 'success')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={{ '--status-color': statusColor }}>
        <div className={styles.handle} onClick={onClose} />
        <div className={styles.scrollContent}>
          <div className={styles.card} style={{ '--status-color': statusColor }}>

            {/* Activity header */}
            {activity && (
              <div className={styles.cardHeader}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityHeaderIcon}>{activity.emoji ?? '🎯'}</span>
                  <div className={styles.activityHeaderText}>
                    <span className={styles.activityHeaderLabel}>{activity.label}</span>
                    <span className={styles.activityHeaderSlogan}>{slogan}</span>
                  </div>
                </div>
                <div className={styles.matchBadge}>
                  {matchPercent >= 80 && <span className={styles.matchStar}>⭐</span>}
                  <span className={styles.matchPercent}>{matchPercent}%</span>
                  <span className={styles.matchLabel}>Match</span>
                </div>
              </div>
            )}

            {/* No-photo brand card */}
            {photos.length === 0 && (
              <div className={styles.noPhotoBanner}>
                <div className={styles.noPhotoInner}>
                  <img
                    src="https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064"
                    alt="imoutnow"
                    className={styles.noPhotoLogo}
                  />
                  <span className={styles.noPhotoQuote}>
                    "{quoteForUser(session.displayName ?? session.id)}"
                  </span>
                  <span className={styles.noPhotoLabel}>📷 {session.displayName ?? 'This user'} hasn't added a photo yet</span>
                </div>
              </div>
            )}

            {/* Photo */}
            {photos.length > 0 && (
              <div className={styles.photoBanner}>
                <img
                  key={photoIdx}
                  src={photos[photoIdx]}
                  alt={session.displayName}
                  className={styles.photoBannerImg}
                />
                <div className={styles.photoBannerMeta}>
                  <span className={styles.photoBannerName}>
                    {session.displayName ?? 'Someone'}
                    {session.age ? <span className={styles.photoBannerAge}>, {session.age}</span> : null}
                    {isOutNow && <span className={styles.liveDot} />}
                  </span>
                  {(session.city || session.area) && (
                    <span className={styles.photoBannerCity}>
                      📍 {session.city ?? session.area}
                    </span>
                  )}
                </div>
                {formatDistance(session.distanceKm) != null && (
                  <div className={styles.photoBannerDist}>
                    {walkMinutes(session.distanceKm) != null && (
                      <>🚶 {walkMinutes(session.distanceKm)} min · </>
                    )}
                    {formatDistance(session.distanceKm)}
                  </div>
                )}
                {/* Fingerprint — opens bio view */}
                <button
                  className={styles.fingerprintBtn}
                  onClick={() => setBioOpen(true)}
                  aria-label="View bio"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12a10 10 0 0 1 18-6"/>
                    <path d="M2 16h.01"/>
                    <path d="M21.8 16c.2-2 .13-5.35 0-6"/>
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                    <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  </svg>
                </button>

                <button
                  className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                  onClick={handleLike}
                  aria-label="Like"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {hearts.map(h => (
                  <span
                    key={h.id}
                    className={styles.floatingHeart}
                    style={{ right: `${h.left}px`, fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}
                  >❤️</span>
                ))}
              </div>
            )}

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className={styles.thumbStrip}>
                <button className={styles.thumbArrow} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} disabled={photoIdx === 0} aria-label="Previous">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className={styles.thumbList}>
                  {photos.map((url, i) => (
                    <button key={i} className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={url} alt="" className={styles.thumbImg} />
                    </button>
                  ))}
                </div>
                <button className={styles.thumbArrow} onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))} disabled={photoIdx === photos.length - 1} aria-label="Next">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Here for */}
            {session.lookingFor && (
              <div className={styles.lookingForRow}>
                <div className={styles.lookingForLeft}>
                  <span className={styles.lookingForLabel}>Here for</span>
                  <span className={styles.lookingForText}>{lookingForText(session.lookingFor)}</span>
                </div>
                {isOutNow    && <span className={styles.outNowFlash}>I'm Out Now</span>}
                {isInviteOut && <span className={styles.inviteOutFlash}>Invite Out</span>}
                {isScheduled && <span className={styles.laterOutFlash}>Out Later</span>}
              </div>
            )}

            {/* Timer + stars */}
            <div className={styles.timerRow}>
              {timerLabel
                ? <span className={styles.scheduledBadge}>{timerLabel}</span>
                : <CountdownTimer expiresAtMs={session.expiresAtMs} />
              }
              <div className={styles.profileStars}>
                {'★'.repeat(profileStars)}{'☆'.repeat(5 - profileStars)}
                <span className={styles.profileStarsLabel}>Active</span>
              </div>
            </div>

            {/* Let's Meet button */}
            <div className={styles.actions}>
              <button
                className={`${styles.sendMsgBtn} ${meetSent || hasExpressedInterest ? styles.sendMsgBtnSent : ''}`}
                disabled={meetSent || hasExpressedInterest || meetLoading}
                onClick={handleLetsMeet}
              >
                {meetLoading ? '…' : meetSent || hasExpressedInterest ? '✓ Message Sent' : 'Let\'s Meet Who Knows'}
              </button>
            </div>

          </div>
        </div>

        {/* ── Bio full-view overlay ── */}
        {bioOpen && (
          <div className={styles.bioOverlay}>
            <div className={styles.bioFullImg}>
              <img src={photos[photoIdx]} alt={session.displayName} className={styles.bioFullImgEl} />
              <div className={styles.bioImgGradient} />
              <button className={styles.bioBackBtn} onClick={() => setBioOpen(false)} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            </div>
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>
                {session.bio ?? `${session.displayName ?? 'They'} ${isOutNow ? "is out right now" : isInviteOut ? "has an open invite" : "is planning to head out"} and looking for good company. Spontaneous, fun-loving and always up for a great time — ${slogan.toLowerCase()}.`}
              </p>
              <div className={styles.bioNavRow}>
                <button
                  className={styles.bioNavBtn}
                  onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                  disabled={photoIdx === 0 || photos.length <= 1}
                >
                  ← Previous
                </button>
                <button
                  className={styles.bioNavBtn}
                  onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                  disabled={photoIdx === photos.length - 1 || photos.length <= 1}
                >
                  Next →
                </button>
              </div>
              <div className={styles.bioMeta}>
                {activity && <span>{activity.emoji} {activity.label}</span>}
                <span className={styles.bioMetaDot}>·</span>
                <span style={{ color: statusColor }}>
                  {isOutNow ? "I'm Out Now" : isInviteOut ? "Invite Out" : "Out Later"}
                </span>
                <span className={styles.bioMetaDot}>·</span>
                <span>{slogan}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
