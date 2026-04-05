import { useState, useEffect, useRef } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { lookingForText, LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import styles from './DiscoveryCard.module.css'
import MakerCard from './layouts/MakerCard'
import DatingCard from './layouts/DatingCard'
import CraftSuppliesCard from './layouts/CraftSuppliesCard'
import { quoteForUser } from '@/data/brandQuotes'
import { recordPhotoView } from '@/services/photoNudgeService'
import MicroShop from '@/components/ui/MicroShop'

const MAKER_CATEGORIES = ['handmade', 'property', 'professional']

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

export default function DiscoveryCard({ open, session, mySession, onClose, showToast, onGuestAction, onMeetSent, onLike, onUnlockContact, buyerCountry }) {
  useOverlay()
  const { user } = useAuth()
  const { myInterests, mutualSessions } = useInterests()
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent, setMeetSent] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [bioOpen, setBioOpen]   = useState(false)
  const [cardPage, setCardPage] = useState(0) // 0 = profile, 1 = shop
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

  // Reset to profile page whenever a new card opens
  useEffect(() => { if (open) setCardPage(0) }, [open])

  if (!open || !session) return null

  // Always show shop tab — tier gate is on the editor side (ProfileScreen), not viewer side
  const hasShop = !!session.userId

  // Route to specialised layouts
  if (session.lookingFor === 'dating')
    return <DatingCard open={open} session={session} mySession={mySession} onClose={onClose} showToast={showToast} onGuestAction={onGuestAction} onMeetSent={onMeetSent} onLike={onLike} />
  if (MAKER_CATEGORIES.includes(session.lookingFor))
    return <MakerCard open={open} session={session} mySession={mySession} onClose={onClose} showToast={showToast} onGuestAction={onGuestAction} onMeetSent={onMeetSent} onLike={onLike} onUnlockContact={onUnlockContact} buyerCountry={buyerCountry} />
  if (session.lookingFor === 'craft_supplies')
    return <CraftSuppliesCard open={open} session={session} onClose={onClose} showToast={showToast} onGuestAction={onGuestAction} onMeetSent={onMeetSent} onLike={onLike} />

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

  const joinedLabel = (() => {
    if (!session.userJoinedAt) return 'Joined'
    const d = new Date(session.userJoinedAt)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `Joined ${dd}/${mm}/${yyyy}`
  })()

  const timerLabel = isScheduled
    ? `🕐 ${fmtScheduledFull(session.scheduledFor)}`
    : isInviteOut
    ? joinedLabel
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


  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={{ '--status-color': statusColor }}>
        <div className={styles.handle} onClick={onClose} />

        <div className={styles.scrollContent} style={cardPage !== 0 ? { display: 'none' } : {}}>
          <div className={styles.card} style={{ '--status-color': statusColor }}>

            {/* Activity header */}
            {activity && (
              <div className={styles.cardHeader}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityHeaderIcon}>{activity.emoji ?? '🎯'}</span>
                  <div className={styles.activityHeaderText}>
                    <span className={styles.activityHeaderLabel}>{activity.label}</span>
                    <span className={styles.activityHeaderSlogan}>First Meet Preference</span>
                  </div>
                </div>
                <div className={styles.matchBadge}>
                  <span className={styles.matchPercent}>{matchPercent}%</span>
                  <span className={styles.matchLabel}>Active</span>
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
                {hasShop && (
                  <button
                    className={`${styles.shopIconBtn} ${cardPage === 1 ? styles.shopIconBtnActive : ''}`}
                    onClick={() => setCardPage(p => p === 1 ? 0 : 1)}
                    aria-label="Toggle shop"
                  >🛍️</button>
                )}
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
                  {session.isVerified && (
                    <div className={styles.verifiedBadge}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span className={styles.verifiedText}>Verified</span>
                    </div>
                  )}
                  <span className={styles.photoBannerName}>
                    {session.displayName ?? 'Someone'}
                    {session.age ? <span className={styles.photoBannerAge}>, {session.age}</span> : null}
                    <span className={`${styles.liveDot} ${isInviteOut ? styles.liveDotInvite : isScheduled ? styles.liveDotLater : ''}`} />
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


                {/* Shop toggle — top right of photo */}
                {hasShop && (
                  <button
                    className={`${styles.shopIconBtn} ${cardPage === 1 ? styles.shopIconBtnActive : ''}`}
                    onClick={() => setCardPage(p => p === 1 ? 0 : 1)}
                    aria-label="Toggle shop"
                  >
                    🛍️
                  </button>
                )}
              </div>
            )}


            {/* Here for */}
            {session.lookingFor && (
              <div className={styles.lookingForRow}>
                <div className={styles.lookingForLeft}>
                  <span className={styles.lookingForLabel}>Joined for</span>
                  <span className={styles.lookingForText}>{lookingForText(session.lookingFor)}</span>
                </div>
              </div>
            )}

            {(session.speakingNative || session.speakingSecond) && (
              <div className={styles.speakingRow}>
                <span className={styles.lookingForLabel}>Speaking</span>
                <span className={styles.speakingLangs}>
                  {[session.speakingNative, session.speakingSecond].filter(Boolean).map((lang, i, arr) => (
                    <span key={lang}>{LANGUAGE_FLAGS[lang] ?? ''} {lang}{i < arr.length - 1 ? ' · ' : ''}</span>
                  ))}
                </span>
              </div>
            )}

            {/* Bio snippet */}
            {session.bio && (() => {
              const cleanBio = session.bio.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
              const preview = cleanBio.slice(0, 160)
              return (
                <button className={styles.bioSnippet} onClick={() => setBioOpen(true)}>
                  <span className={styles.bioSnippetText}>{preview}...</span>
                </button>
              )
            })()}

            {/* Timer + stars */}
            <div className={styles.timerRow}>
              {timerLabel
                ? <span className={styles.scheduledBadge}>{timerLabel}</span>
                : <CountdownTimer expiresAtMs={session.expiresAtMs} />
              }
              <div className={styles.profileStars}>
                {'★'.repeat(profileStars)}{'☆'.repeat(5 - profileStars)}
                <span className={styles.profileStarsLabel}>Account Health</span>
              </div>
            </div>

            {/* Let's Meet button */}
            <div className={styles.actions}>
              <button
                className={`${styles.sendMsgBtn} ${meetSent || hasExpressedInterest ? styles.sendMsgBtnSent : ''}`}
                disabled={meetSent || hasExpressedInterest || meetLoading}
                onClick={handleLetsMeet}
              >
                <span>{meetLoading ? '…' : meetSent || hasExpressedInterest ? '✓ Connected' : 'Let\'s Connect'}</span>
                {!meetSent && !hasExpressedInterest && !meetLoading && (
                  <>
                    {isOutNow    && <span className={styles.btnFlashOut}>I'm Out Now</span>}
                    {isInviteOut && <span className={styles.btnFlashInvite}>Invite Out</span>}
                    {isScheduled && <span className={styles.btnFlashLater}>Out Later</span>}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Shop page ── */}
        {cardPage === 1 && (
          <div className={styles.shopSlideScroll}>
            <MicroShop userId={session.userId} visible={true} />
          </div>
        )}

        {/* ── Bio full-view overlay ── */}
        {bioOpen && (
          <div className={styles.bioOverlay}>
            <div className={styles.bioHandle} onClick={() => setBioOpen(false)} />
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
              {photos.length > 1 && (
                <div className={styles.bioThumbStrip}>
                  <button
                    className={styles.bioThumbArrow}
                    onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
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
                      >
                        <img src={url} alt="" className={styles.thumbImg} />
                      </button>
                    ))}
                  </div>
                  <button
                    className={styles.bioThumbArrow}
                    onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                    disabled={photoIdx === photos.length - 1}
                    aria-label="Next photo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}

              {session.priceStart && (
                <div className={styles.bioMeta} style={{ marginBottom: 6 }}>
                  <span className={styles.bioMetaLabel}>Prices Start</span>
                  <span className={styles.bioMetaDot}>·</span>
                  <span className={styles.bioMetaValue}>{session.priceStart}</span>
                </div>
              )}
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
              {session.market && (
                <div className={styles.bioMeta}>
                  <span className={styles.bioMetaLabel}>Market</span>
                  <span className={styles.bioMetaDot}>·</span>
                  <span className={styles.bioMetaValue}>{session.market}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
