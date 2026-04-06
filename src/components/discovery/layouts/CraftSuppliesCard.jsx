import { useState, useRef, useEffect } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import { getCategoryCopy } from '@/constants/categoryCopy'
import styles from './CraftSuppliesCard.module.css'

/** Profile layout for Handy Craft Supplies */
export default function CraftSuppliesCard({ open, session, onClose, showToast, onGuestAction, onMeetSent, onLike }) {
  useOverlay()
  const { user }  = useAuth()
  const { myInterests, mutualSessions } = useInterests()
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent,    setMeetSent]    = useState(false)
  const [liked,       setLiked]       = useState(false)
  const [hearts,      setHearts]      = useState([])
  const [photoIdx,    setPhotoIdx]    = useState(0)
  const [bioOpen,     setBioOpen]     = useState(false)
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) { currentYRef.current = delta; sheet.style.transform = `translateY(${delta}px)`; sheet.style.transition = 'none' }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 120) onClose()
      else sheet.style.transform = ''
      startYRef.current = null; currentYRef.current = 0
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

  if (!open || !session) return null

  const copy = getCategoryCopy(session.lookingFor)

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#8DC63F'

  const photos      = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []
  const activity    = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const isMutual    = mutualSessions.has(session.id)
  const hasInterest = myInterests.has(session.id)

  const profileStars = 3 + (session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3)

  const joinedLabel = (() => {
    if (!session.userJoinedAt) return 'Joined'
    const d = new Date(session.userJoinedAt)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `Joined ${dd}/${mm}/${yyyy}`
  })()

  const timerLabel = isScheduled ? `🕐 Scheduled` : isInviteOut ? joinedLabel : null

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    if (meetSent) return
    if (session.isSeeded) {
      setMeetSent(true)
      showToast?.(`💌 Invite sent to ${session.displayName}!`, 'success')
      onMeetSent?.(session); return
    }
    setMeetLoading(true)
    try {
      await sendMeetRequest(
        { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
        session.userId, session.id
      )
      setMeetSent(true)
      showToast?.(`💬 Message sent to ${session.displayName}!`, 'success')
      onMeetSent?.(session)
    } catch { showToast?.('Could not send. Try again.', 'error') }
    setMeetLoading(false)
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true); onLike?.(session)
    const batch = Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, left: 38 + (Math.random() * 40 - 20), delay: i * 0.12, size: 14 + Math.random() * 10 }))
    setHearts(batch)
    setTimeout(() => setHearts([]), 2000)
    if (isMutual) {
      showToast?.(`🎉 Connected! Chat with ${session.displayName} is opening!`, 'success')
      setTimeout(() => onMeetSent?.(session), 900)
    } else {
      showToast?.(`❤️ You liked ${session.displayName}!`, 'success')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={{ '--status-color': statusColor }}>
        <div className={styles.handle} onClick={onClose} />
        <div className={styles.scrollContent}>
          <div className={styles.card}>

            {/* Category header */}
            <div className={styles.categoryHeader}>
              <span className={styles.categoryEmoji}>{copy.emoji}</span>
              <div>
                <span className={styles.categoryLabel}>{copy.slogan}</span>
                {session.brandName && (
                  <span className={styles.categorySlogan}>{session.brandName}</span>
                )}
              </div>
            </div>

            {/* Photo */}
            {photos.length > 0 && (
              <div className={styles.photoBanner}>
                <img key={photoIdx} src={photos[photoIdx]} alt={session.displayName} className={styles.photoBannerImg} />
                <div className={styles.photoBannerMeta}>
                  {session.isVerified && (
                    <div className={styles.verifiedBadge}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
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
                    <span className={styles.photoBannerCity}>📍 {session.city ?? session.area}</span>
                  )}
                </div>
                {formatDistance(session.distanceKm) != null && (
                  <div className={styles.photoBannerDist}>
                    {walkMinutes(session.distanceKm) != null && <>🚶 {walkMinutes(session.distanceKm)} min · </>}
                    {formatDistance(session.distanceKm)}
                  </div>
                )}
                <button className={styles.fingerprintBtn} onClick={() => setBioOpen(true)} aria-label="View profile">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .13-5.35 0-6"/>
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  </svg>
                </button>
                <button className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`} onClick={handleLike} aria-label="Like">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#fff' : 'none'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {hearts.map(h => (
                  <span key={h.id} className={styles.floatingHeart} style={{ right: `${h.left}px`, fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}>❤️</span>
                ))}
              </div>
            )}

            {/* Craft Supplies rows */}
            {session.priceMin && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{copy.priceLabel}</span>
                <span className={styles.infoValue}>{session.priceMin}</span>
              </div>
            )}
            {activity && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{copy.specialityLabel}</span>
                <span className={styles.infoValue}>{activity.emoji} {activity.label}</span>
              </div>
            )}
            {(session.speakingNative || session.speakingSecond) && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Speaking</span>
                <span className={styles.infoValue}>
                  {[session.speakingNative, session.speakingSecond].filter(Boolean).map((lang, i, arr) => (
                    <span key={lang}>{LANGUAGE_FLAGS[lang] ?? ''} {lang}{i < arr.length - 1 ? ' · ' : ''}</span>
                  ))}
                </span>
              </div>
            )}

            {/* Bio snippet */}
            {session.bio && (() => {
              const clean = session.bio.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()
              return (
                <button className={styles.bioSnippet} onClick={() => setBioOpen(true)}>
                  <span className={styles.bioSnippetText}>{clean.slice(0, 160)}...</span>
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

            {/* Let's Connect */}
            <div className={styles.actions}>
              <button
                className={`${styles.connectBtn} ${meetSent || hasInterest ? styles.connectBtnSent : ''}`}
                disabled={meetSent || hasInterest || meetLoading}
                onClick={handleLetsMeet}
              >
                <span>{meetLoading ? '…' : meetSent || hasInterest ? '✓ Connected' : copy.ctaActive}</span>
                {!meetSent && !hasInterest && !meetLoading && (
                  <>
                    {isOutNow    && <span className={styles.btnFlashOut}>{copy.statusActive}</span>}
                    {isInviteOut && <span className={styles.btnFlashInvite}>{copy.statusWants}</span>}
                    {isScheduled && <span className={styles.btnFlashLater}>{copy.statusBooked}</span>}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ── Craft Supplies bio overlay (page 2) ── */}
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
              <p className={styles.bioBodyText}>{session.bio ?? `${session.displayName} supplies craft materials and is open to connect.`}</p>

              {photos.length > 1 && (
                <div className={styles.bioThumbStrip}>
                  <button className={styles.bioThumbArrow} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} disabled={photoIdx === 0}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div className={styles.thumbList}>
                    {photos.map((url, i) => (
                      <button key={i} className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`} onClick={() => setPhotoIdx(i)}>
                        <img src={url} alt="" className={styles.thumbImg} />
                      </button>
                    ))}
                  </div>
                  <button className={styles.bioThumbArrow} onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))} disabled={photoIdx === photos.length - 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}

              {session.priceMin && (
                <div className={styles.bioMeta}>
                  <span className={styles.bioMetaLabel}>Supplies Available On Request</span>
                </div>
              )}
              {session.market && (
                <div className={styles.bioMeta}>
                  <span className={styles.bioMetaValue}>{session.market}</span>
                </div>
              )}

              <div className={styles.bioNavRow}>
                <button className={styles.bioNavBtn} onClick={() => setPhotoIdx(i => Math.max(0, i - 1))} disabled={photoIdx === 0 || photos.length <= 1}>← Previous</button>
                <button className={styles.bioNavBtn} onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))} disabled={photoIdx === photos.length - 1 || photos.length <= 1}>Next →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
