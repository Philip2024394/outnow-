import { useState, useRef, useEffect } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { lookingForText, LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import styles from './MakerCard.module.css'

/** Profile layout for Handmade · Property · Professional categories */
export default function MakerCard({ open, session, onClose, showToast, onGuestAction, onMeetSent, onLike, onUnlockContact, buyerCountry }) {
  useOverlay()
  const { user }  = useAuth()
  const { myInterests, mutualSessions } = useInterests()
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent,    setMeetSent]    = useState(false)
  const [liked,       setLiked]       = useState(false)
  const [hearts,      setHearts]      = useState([])
  const [photoIdx,    setPhotoIdx]    = useState(0)
  const [bioOpen,     setBioOpen]     = useState(false)
  const [socialOpen,  setSocialOpen]  = useState(false)
  const [infoOpen,    setInfoOpen]    = useState(false)
  const sheetRef   = useRef(null)
  const startYRef  = useRef(null)
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

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#8DC63F'

  const photos    = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []
  const activity  = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const isMutual  = mutualSessions.has(session.id)
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

  const timerLabel = isScheduled
    ? `🕐 Scheduled`
    : isInviteOut ? joinedLabel : null

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
      <div ref={sheetRef} className={styles.sheet} style={{
        '--status-color': statusColor,
        ...(infoOpen ? { height: `${Math.min(92, 46 + [session?.instagram, session?.tiktok, session?.facebook, session?.youtube, session?.website].filter(Boolean).length * 8)}dvh` } : {})
      }}>
        <div className={styles.handle} onClick={onClose} />
        <div className={styles.scrollContent}>
          <div className={styles.card}>

            {/* Category header */}
            {(() => {
              const EMOJI_MAP = [
                {value:'open',emoji:'🌍'},{value:'handmade',emoji:'🧵'},
                {value:'craft_supplies',emoji:'🪡'},{value:'property',emoji:'🏠'},
                {value:'professional',emoji:'💼'}
              ]
              const lfEmoji = EMOJI_MAP.find(o => o.value === session.lookingFor)?.emoji ?? '🏪'
              const lfLabel = lookingForText(session.lookingFor)?.replace(/^\S+\s/, '') ?? 'Makers'
              return (
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryEmoji}>{lfEmoji}</span>
                  <div className={styles.categoryHeaderInner}>
                    <span className={styles.categoryLabel}>{lfLabel}</span>
                    <span className={styles.categorySlogan}>
                      {['handmade','craft_supplies'].includes(session.lookingFor) ? 'Make & Sell' : 'Seller Profile'}
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Photo */}
            {photos.length > 0 && (
              <div className={styles.photoBanner}>
                <img key={photoIdx} src={photos[photoIdx]} alt={session.displayName} className={styles.photoBannerImg} />
                {session.isVerified && (
                  <div className={styles.verifiedBadge}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span className={styles.verifiedText}>Verified</span>
                  </div>
                )}
                <div className={styles.photoBannerMeta}>
                  <span className={styles.photoBannerName}>
                    {session.displayName ?? 'Someone'}
                    {session.age ? <span className={styles.photoBannerAge}>, {session.age}</span> : null}
                    <span className={`${styles.liveDot} ${isInviteOut ? styles.liveDotInvite : isScheduled ? styles.liveDotLater : ''}`} />
                  </span>
                  {(session.city || session.area) && (
                    <span className={styles.photoBannerCity}>📍 {session.city ?? session.area}</span>
                  )}
                </div>
                <button className={styles.fingerprintBtn} onClick={() => setBioOpen(true)} aria-label="View profile">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Maker-specific rows */}
            {session.tradeRole && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Here to</span>
                <span className={styles.infoValue}>
                  {(() => {
                    const isMaker = ['handmade','craft_supplies'].includes(session.lookingFor)
                    if (session.tradeRole === 'buying') return '🛍️ Buying'
                    if (isMaker) return '🧵 Make & Sell'
                    return session.tradeRole === 'both' ? '🏷️ Selling & Buying' : '🏷️ Selling'
                  })()}
                </span>
              </div>
            )}
            {session.tradeRole !== 'buying' && session.priceMin && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Prices Start</span>
                <span className={styles.infoValue}>{session.priceMin}{session.priceMax ? ` – ${session.priceMax}` : ''}</span>
              </div>
            )}
            {session.tradeRole === 'buying' && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Looking for</span>
                <span className={styles.infoValue}>{activity ? `${activity.emoji} ${activity.label}` : lookingForText(session.lookingFor)}</span>
              </div>
            )}
            {activity && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Speciality</span>
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

            {/* Unlock Contact (maker) or Let's Connect (social) */}
            <div className={styles.actions}>
              {onUnlockContact ? (
                <button className={styles.unlockBtn} onClick={() => onUnlockContact(session)}>
                  {(buyerCountry ?? '').toLowerCase() === (session?.country ?? '').toLowerCase() ? (
                    isOutNow    ? <>I'm Out — Free To Chat</> :
                    isInviteOut ? <>Invite Out — Send Message</> :
                                  <>Out Later — Send Message</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Unlock Contact
                    </>
                  )}
                </button>
              ) : (
                <button
                  className={`${styles.connectBtn} ${meetSent || hasInterest ? styles.connectBtnSent : ''}`}
                  disabled={meetSent || hasInterest || meetLoading}
                  onClick={handleLetsMeet}
                >
                  <span>{meetLoading ? '…' : meetSent || hasInterest ? '✓ Connected' : "Let's Connect"}</span>
                  {!meetSent && !hasInterest && !meetLoading && (
                    <>
                      {isOutNow    && <span className={styles.btnFlashOut}>I'm Out Now</span>}
                      {isInviteOut && <span className={styles.btnFlashInvite}>Invite Out</span>}
                      {isScheduled && <span className={styles.btnFlashLater}>Out Later</span>}
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Social Media page (seller premium feature) ── */}
        {infoOpen && (
          <div className={styles.socialInfoPage}>
            <div className={styles.bioHandle} onClick={() => setInfoOpen(false)} />

            {/* Image banner — fixed height */}
            <div className={styles.socialInfoBanner}>
              <img src={photos[photoIdx] ?? session.photoURL} alt={session.displayName} className={styles.socialInfoBannerImg} />
              <div className={styles.socialInfoBannerGrad} />
            </div>

            {/* Content — grows naturally */}
            <div className={styles.socialInfoContent}>
              <p className={styles.socialPageTitle}>Social Media</p>
              <p className={styles.socialPageSub}>Connect with {session.brandName ?? session.displayName} directly</p>

              {(session.instagram || session.tiktok || session.facebook || session.youtube || session.website) ? (
                <div className={styles.socialPageLinks}>
                  {session.instagram && (
                    <a href={`https://instagram.com/${session.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.socialPageRow}>
                      <span className={styles.socialPageRowIcon} style={{ background: '#E1306C' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </span>
                      <div className={styles.socialPageRowInfo}>
                        <span className={styles.socialPageRowPlatform}>Instagram</span>
                        <span className={styles.socialPageRowHandle}>@{session.instagram}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialPageArrow}><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  )}
                  {session.tiktok && (
                    <a href={`https://tiktok.com/@${session.tiktok}`} target="_blank" rel="noopener noreferrer" className={styles.socialPageRow}>
                      <span className={styles.socialPageRowIcon} style={{ background: '#010101' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                      </span>
                      <div className={styles.socialPageRowInfo}>
                        <span className={styles.socialPageRowPlatform}>TikTok</span>
                        <span className={styles.socialPageRowHandle}>@{session.tiktok}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialPageArrow}><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  )}
                  {session.facebook && (
                    <a href={`https://facebook.com/${session.facebook}`} target="_blank" rel="noopener noreferrer" className={styles.socialPageRow}>
                      <span className={styles.socialPageRowIcon} style={{ background: '#1877F2' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </span>
                      <div className={styles.socialPageRowInfo}>
                        <span className={styles.socialPageRowPlatform}>Facebook</span>
                        <span className={styles.socialPageRowHandle}>{session.facebook}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialPageArrow}><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  )}
                  {session.youtube && (
                    <a href={`https://youtube.com/@${session.youtube}`} target="_blank" rel="noopener noreferrer" className={styles.socialPageRow}>
                      <span className={styles.socialPageRowIcon} style={{ background: '#FF0000' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </span>
                      <div className={styles.socialPageRowInfo}>
                        <span className={styles.socialPageRowPlatform}>YouTube</span>
                        <span className={styles.socialPageRowHandle}>@{session.youtube}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialPageArrow}><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  )}
                  {session.website && (
                    <a href={session.website} target="_blank" rel="noopener noreferrer" className={styles.socialPageRow}>
                      <span className={styles.socialPageRowIcon} style={{ background: '#8DC63F' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </span>
                      <div className={styles.socialPageRowInfo}>
                        <span className={styles.socialPageRowPlatform}>Website</span>
                        <span className={styles.socialPageRowHandle}>{session.website.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialPageArrow}><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                  )}
                </div>
              ) : (
                <div className={styles.socialPageLocked}>
                  <span className={styles.socialPageLockedIcon}>📵</span>
                  <p className={styles.socialPageLockedText}>Social media not enabled</p>
                  <p className={styles.socialPageLockedSub}>Sellers can enable this for £1.50/month.</p>
                </div>
              )}
            </div>

            {/* Back button — pinned to footer */}
            <div className={styles.socialInfoBackWrap}>
              <button className={styles.socialInfoBack} onClick={() => { setInfoOpen(false); setBioOpen(true) }}>← Back to Profile</button>
            </div>
          </div>
        )}

        {/* ── Social overlay (page 2b) ── */}
        {socialOpen && (
          <div className={styles.socialOverlay}>
            <div className={styles.bioHandle} onClick={() => setSocialOpen(false)} />
            <div className={styles.bioFullImg}>
              <img src={photos[photoIdx] ?? session.photoURL} alt={session.displayName} className={styles.bioFullImgEl} />
              <div className={styles.bioImgGradient} />
              <button className={styles.bioBackBtn} onClick={() => setSocialOpen(false)} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              {session.isVerified && (
                <div className={styles.socialVerifiedBanner}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <div className={styles.socialVerifiedText}>
                    <span className={styles.socialVerifiedTitle}>Verified Seller</span>
                    <span className={styles.socialVerifiedSub}>Identity confirmed via social media</span>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.socialBody}>
              <p className={styles.socialBodyTitle}>{session.brandName ?? session.displayName}</p>
              {session.instagram && (
                <a href={`https://instagram.com/${session.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.socialRow}>
                  <span className={styles.socialRowIcon}>📸</span>
                  <div className={styles.socialRowInfo}>
                    <span className={styles.socialRowPlatform}>Instagram</span>
                    <span className={styles.socialRowHandle}>@{session.instagram}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialRowArrow}><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {session.tiktok && (
                <a href={`https://tiktok.com/@${session.tiktok}`} target="_blank" rel="noopener noreferrer" className={styles.socialRow}>
                  <span className={styles.socialRowIcon}>🎵</span>
                  <div className={styles.socialRowInfo}>
                    <span className={styles.socialRowPlatform}>TikTok</span>
                    <span className={styles.socialRowHandle}>@{session.tiktok}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialRowArrow}><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {session.facebook && (
                <a href={`https://facebook.com/${session.facebook}`} target="_blank" rel="noopener noreferrer" className={styles.socialRow}>
                  <span className={styles.socialRowIcon}>👍</span>
                  <div className={styles.socialRowInfo}>
                    <span className={styles.socialRowPlatform}>Facebook</span>
                    <span className={styles.socialRowHandle}>{session.facebook}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialRowArrow}><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {session.website && (
                <a href={session.website} target="_blank" rel="noopener noreferrer" className={styles.socialRow}>
                  <span className={styles.socialRowIcon}>🌐</span>
                  <div className={styles.socialRowInfo}>
                    <span className={styles.socialRowPlatform}>Website</span>
                    <span className={styles.socialRowHandle}>{session.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.socialRowArrow}><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              )}
              {!session.instagram && !session.tiktok && !session.facebook && !session.website && !session.youtube && (
                <p className={styles.socialEmpty}>No social links added yet</p>
              )}
            </div>
          </div>
        )}

        {/* ── Maker bio overlay (page 2) ── */}
        {bioOpen && (
          <div className={styles.bioOverlay}>
            <div className={styles.bioHandle} onClick={() => setBioOpen(false)} />
            <div className={styles.bioFullImg}>
              <img src={photos[photoIdx]} alt={session.displayName} className={styles.bioFullImgEl} />
              <div className={styles.bioImgGradient} />
              {session.brandName && (
                <div className={styles.bioBrandLabel}>
                  <span className={styles.bioBrandKey}>Brand</span>
                  <span className={styles.bioBrandValue}>{session.brandName}</span>
                </div>
              )}
              {/* Glossy button — opens social media page */}
              <button className={styles.socialPageGlossyBtn} onClick={() => { setBioOpen(false); setInfoOpen(true) }} aria-label="Social media">
                <img src="https://ik.imagekit.io/nepgaxllc/Glossy%20button%20with%20gray%20_s_.png" alt="Social Media" className={styles.socialPageGlossyImg} />
              </button>
            </div>
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>{session.bio ?? `${session.displayName} is a maker looking to connect.`}</p>

              {photos.length > 0 && (
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

              {/* Maker-specific meta */}
              {session.priceMin && (
                <div className={styles.bioMeta}>
                  <span className={styles.bioMetaLabel}>Custom Designs On Request</span>
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
