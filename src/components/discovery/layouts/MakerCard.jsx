import { useState, useRef, useEffect } from 'react'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import { WORLD_CUISINES } from '@/components/ui/CuisineSheet'
import { getPlatform } from '@/constants/messagingPlatforms'
import { getCategoryCopy } from '@/constants/categoryCopy'
import styles from './MakerCard.module.css'
import MicroShop from '@/components/ui/MicroShop'

/** Profile layout for Maker · Restaurant · Professional categories */
export default function MakerCard({ open, session, onClose, showToast, onGuestAction, onMeetSent, onUnlockContact }) {
  useOverlay()
  const { user }       = useAuth()
  const { myInterests } = useInterests()
  const [meetLoading,  setMeetLoading]  = useState(false)
  const [meetSent,     setMeetSent]     = useState(false)
  const [photoIdx,     setPhotoIdx]     = useState(0)
  const [bioOpen,      setBioOpen]      = useState(false)
  const [contactOpen,  setContactOpen]  = useState(false)
  const [cardPage,     setCardPage]     = useState(0)
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

  useEffect(() => { if (open) { setCardPage(0); setContactOpen(false) } }, [open])

  if (!open || !session) return null

  const copy = getCategoryCopy(session.lookingFor)

  // User's explicit choice overrides the category default
  const pageType = session.shopType ?? copy.pageType
  const pageIcon = pageType === 'menu' ? '📋' : pageType === 'services' ? '🗒️' : '🛍️'
  const hasShop  = pageType !== null && (!!session.userId || !!session.isSeeded)

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#8DC63F'

  const photos   = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []
  const activity = ACTIVITY_TYPES.find(a => a.id === session.activityType)
  const hasInterest = myInterests.has(session.id)

  const joinedLabel = (() => {
    if (!session.userJoinedAt) return 'Joined'
    const d  = new Date(session.userJoinedAt)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `Joined ${dd}/${mm}/${d.getFullYear()}`
  })()

  const timerLabel = isScheduled ? `🕐 Scheduled` : isInviteOut ? joinedLabel : null

  // ── Contact helpers ────────────────────────────────────────────────────────
  const contactPlatform = session.contactPlatform ? getPlatform(session.contactPlatform) : null
  // contact_number is never in the session — it lives in private_contacts and is
  // only revealed via ContactUnlockSheet after payment (or free for same-country).
  // The direct deep-link is therefore only available post-reveal, not from the card.
  const hasSocials = !!(session.instagram || session.tiktok || session.facebook || session.youtube || session.website)
  // Social media is a paid feature — show if session has links set (seeded demo or paid user)
  const showSocials = hasSocials && (session.isSeeded || session.tier === 'pro' || session.tier === 'basic')

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    if (meetSent) return
    if (session.isSeeded) {
      setMeetSent(true)
      showToast?.(`💌 Message sent to ${session.displayName}!`, 'success')
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={{ '--status-color': statusColor }}>
        <div className={styles.handle} onClick={onClose} />

        {/* ── Main profile page (no scroll) ── */}
        {cardPage === 0 && (
          <div className={styles.mainPage}>

            {/* Category header */}
            <div className={styles.categoryHeader}>
              <span className={styles.categoryEmoji}>{copy.emoji}</span>
              <div className={styles.categoryHeaderInner}>
                <span className={styles.categoryLabel}>{copy.slogan}</span>
                {session.brandName && (
                  <span className={styles.categorySlogan}>{session.brandName}</span>
                )}
              </div>
              {session.presenceStreak >= 7 && (
                <span className={styles.streakVerified} title={`${session.presenceStreak}-day streak`}>
                  Verified Active
                </span>
              )}
              {session.presenceStreak >= 2 && session.presenceStreak < 7 && (
                <span className={styles.streakBadge} title={`${session.presenceStreak}-day streak`}>
                  🔥 {session.presenceStreak}
                </span>
              )}
            </div>

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
                {/* Fingerprint — opens bio overlay */}
                <button className={styles.fingerprintBtn} onClick={() => setBioOpen(true)} aria-label="View bio">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .13-5.35 0-6"/>
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  </svg>
                </button>
                {/* Shop / menu tab toggle */}
                {hasShop && (
                  <button
                    className={`${styles.shopIconBtn} ${cardPage === 1 ? styles.shopIconBtnActive : ''}`}
                    onClick={() => setCardPage(p => p === 1 ? 0 : 1)}
                    aria-label="Toggle shop"
                  >{pageIcon}</button>
                )}
              </div>
            )}

            {/* Key info rows — max 3, most important */}
            <div className={styles.infoRows}>
              {session.tradeRole && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{copy.hereToLabel}</span>
                  <span className={styles.infoValue}>
                    {(() => {
                      const ROLE_LABELS = {
                        selling: '🏷️ Selling / Offering', buying: '🛍️ Buying', both: '🏷️ Buying & Selling',
                        leads: '📊 Lead Generation', networking: '🤝 Networking', collab: '🔗 Collaboration',
                        recruiting: '👥 Recruiting', showcasing: '🎯 Showcasing', investing: '💰 Investing',
                        socialising: '👋 Socialising', community: '🌍 Community', events: '🎉 Hosting Events',
                      }
                      return ROLE_LABELS[session.tradeRole] ?? '🏷️ Selling'
                    })()}
                  </span>
                </div>
              )}
              {!['buying','socialising','community','events'].includes(session.tradeRole) && session.priceMin && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{copy.priceLabel}</span>
                  <span className={styles.infoValue}>{session.priceMin}{session.priceMax ? ` – ${session.priceMax}` : ''}</span>
                </div>
              )}
              {session.cuisineType && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cuisine</span>
                  <span className={styles.infoValue}>
                    {(() => {
                      const c = WORLD_CUISINES.find(x => x.value === session.cuisineType)
                      return c ? `${c.emoji} ${c.label}` : session.cuisineType
                    })()}
                  </span>
                </div>
              )}
              {!session.cuisineType && activity && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{copy.specialityLabel}</span>
                  <span className={styles.infoValue}>{activity.emoji} {activity.label}</span>
                </div>
              )}
              {(() => {
                const raw = session.targetAudience
                const val = Array.isArray(raw) ? raw[0] : raw
                if (!val) return null
                const LABELS = { all: 'All Ages', women: 'Women', men: 'Men', children: 'Children', gifts: 'Gifts', teens: 'Teens', babies: 'Babies & Toddlers', elderly: 'Elderly', unisex: 'Unisex' }
                return (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>For</span>
                    <span className={styles.infoValue}>{LABELS[val] ?? val}</span>
                  </div>
                )
              })()}
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
              {timerLabel && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>{timerLabel}</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Single Contact footer — always visible on main page ── */}
        {cardPage === 0 && (
          <div className={styles.cardFooter}>
            <button
              className={styles.contactBtn}
              onClick={() => setContactOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Contact {session.brandName ?? session.displayName}
            </button>
          </div>
        )}

        {/* ── Shop / Menu / Services page (scrolls) ── */}
        {cardPage === 1 && (
          <div className={styles.shopSlideScroll}>
            <div className={styles.shopPageHeader}>
              <button className={styles.shopPageBack} onClick={() => setCardPage(0)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className={styles.shopPageTitle}>{pageIcon} {pageType === 'menu' ? 'Menu' : pageType === 'services' ? 'Services' : 'Shop'}</span>
              <button className={styles.shopPageContact} onClick={() => { setCardPage(0); setContactOpen(true) }}>Contact</button>
            </div>
            <MicroShop userId={session.userId} visible={true} mode={pageType ?? 'shop'} />
          </div>
        )}

        {/* ── Bio overlay ── */}
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
              <button className={styles.bioBackBtn} onClick={() => setBioOpen(false)} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            </div>
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>{session.bio ?? `${session.displayName} is here to connect.`}</p>
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
              <div className={styles.bioNavRow}>
                <button className={styles.bioNavBtn} onClick={() => setBioOpen(false)}>← Profile</button>
                <button className={styles.bioNavBtn} onClick={() => { setBioOpen(false); setContactOpen(true) }}>Contact →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Contact options sheet (in-card overlay) ── */}
        {contactOpen && (
          <>
            <div className={styles.contactSheetBackdrop} onClick={() => setContactOpen(false)} />
            <div className={styles.contactSheet}>
              <div className={styles.contactSheetHandle} onClick={() => setContactOpen(false)} />
              <div className={styles.contactSheetHeader}>
                <span className={styles.contactSheetTitle}>Contact {session.brandName ?? session.displayName}</span>
                <button className={styles.contactSheetClose} onClick={() => setContactOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.contactSheetList}>

                {/* In-app message — always first */}
                <button
                  className={`${styles.contactItem} ${(meetSent || hasInterest) ? styles.contactItemSent : ''}`}
                  disabled={meetSent || hasInterest || meetLoading}
                  onClick={() => { handleLetsMeet(); setContactOpen(false) }}
                >
                  <span className={styles.contactItemIcon} style={{ background: 'var(--status-color)' }}>💬</span>
                  <div className={styles.contactItemText}>
                    <span className={styles.contactItemLabel}>
                      {meetLoading ? 'Sending…' : meetSent || hasInterest ? '✓ Message Sent' : `Message on Hangger`}
                    </span>
                    <span className={styles.contactItemSub}>Free — send a direct message</span>
                  </div>
                  {!meetSent && !hasInterest && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                  )}
                </button>

                {/* Messaging platform — always locked; revealed via ContactUnlockSheet */}
                {contactPlatform && onUnlockContact && (
                  <button className={styles.contactItem} onClick={() => { setContactOpen(false); onUnlockContact(session) }}>
                    <span className={styles.contactItemIcon} style={{ background: contactPlatform.color, color: contactPlatform.textColor }}>{contactPlatform.abbr}</span>
                    <div className={styles.contactItemText}>
                      <span className={styles.contactItemLabel}>{contactPlatform.label}</span>
                      <span className={styles.contactItemSub} style={{ filter: 'blur(4px)', userSelect: 'none' }}>•••• ••••••••</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </button>
                )}

                {/* Social media links — paid feature (shown if data exists) */}
                {showSocials && (
                  <>
                    {session.instagram && (
                      <a href={`https://instagram.com/${session.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                        <span className={styles.contactItemIcon} style={{ background: '#E1306C' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </span>
                        <div className={styles.contactItemText}>
                          <span className={styles.contactItemLabel}>Instagram</span>
                          <span className={styles.contactItemSub}>@{session.instagram}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                    {session.tiktok && (
                      <a href={`https://tiktok.com/@${session.tiktok}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                        <span className={styles.contactItemIcon} style={{ background: '#010101' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
                        </span>
                        <div className={styles.contactItemText}>
                          <span className={styles.contactItemLabel}>TikTok</span>
                          <span className={styles.contactItemSub}>@{session.tiktok}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                    {session.facebook && (
                      <a href={`https://facebook.com/${session.facebook}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                        <span className={styles.contactItemIcon} style={{ background: '#1877F2' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </span>
                        <div className={styles.contactItemText}>
                          <span className={styles.contactItemLabel}>Facebook</span>
                          <span className={styles.contactItemSub}>{session.facebook}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                    {session.youtube && (
                      <a href={`https://youtube.com/@${session.youtube}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                        <span className={styles.contactItemIcon} style={{ background: '#FF0000' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </span>
                        <div className={styles.contactItemText}>
                          <span className={styles.contactItemLabel}>YouTube</span>
                          <span className={styles.contactItemSub}>@{session.youtube}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                    {session.website && (
                      <a href={session.website} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                        <span className={styles.contactItemIcon} style={{ background: 'var(--status-color)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </span>
                        <div className={styles.contactItemText}>
                          <span className={styles.contactItemLabel}>Website</span>
                          <span className={styles.contactItemSub}>{session.website.replace(/^https?:\/\//, '')}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.contactItemArrow}><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                  </>
                )}

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
