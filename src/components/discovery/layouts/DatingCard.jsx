import { useState, useRef, useEffect } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import styles from './DatingCard.module.css'
import DateIdeasSheet from '@/components/dating/DateIdeasSheet'
import VibeCheckSheet from '../panels/VibeCheckSheet'
import WingmanSheet from '../panels/WingmanSheet'
import EchoFeedbackModal from '../panels/EchoFeedbackModal'
import QuickReplyBar from '../panels/QuickReplyBar'
import VoiceIntroBar from '../panels/VoiceIntroBar'

const RELATIONSHIP_GOAL_LABELS = {
  casual:  '😊 Casual & Fun',
  serious: '💍 Something Serious',
  open:    '🌻 Open to Everything',
  friends: '👋 Friends First',
}
const SIGN_EMOJIS = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' }
const MOOD_COLORS = { warm: '#F97316', cool: '#38BDF8', pink: '#F472B6' }

function SidePanelBtn({ emoji, label, onClick, active, pulse, color }) {
  return (
    <button
      className={`${styles.sideBtn} ${active ? styles.sideBtnActive : ''} ${pulse ? styles.sideBtnPulse : ''}`}
      style={active && color ? { background: `${color}25`, borderColor: color } : {}}
      onClick={onClick}
      aria-label={label}
    >
      <span className={styles.sideBtnEmoji}>{emoji}</span>
      <span className={styles.sideBtnLabel}>{label}</span>
    </button>
  )
}

/** Full-screen profile layout for Dating & Romance */
export default function DatingCard({ open, session, mySession, onClose, showToast, onGuestAction, onMeetSent, onConnect, onLike }) {
  useOverlay()
  const { user }  = useAuth()
  const { myInterests, mutualSessions } = useInterests()

  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent,    setMeetSent]    = useState(false)
  const [liked,       setLiked]       = useState(false)
  const [hearts,      setHearts]      = useState([])
  const [photoIdx,    setPhotoIdx]    = useState(0)

  // Panel state
  const [panel,     setPanel]     = useState(null) // 'dateIdeas' | 'vibeCheck' | 'wingman' | 'bio'
  const [moodOpen,  setMoodOpen]  = useState(false)
  const [echoOpen,  setEchoOpen]  = useState(false)

  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  // Swipe-down dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) { currentYRef.current = delta; sheet.style.transform = `translateY(${Math.min(delta * 0.4, 80)}px)`; sheet.style.transition = 'none' }
    }
    const onTouchEnd = () => {
      sheet.style.transition = 'transform 0.3s ease'
      if (currentYRef.current > 100) onClose()
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

  // Reset panels on open
  useEffect(() => { if (open) { setPanel(null); setPhotoIdx(0); setMeetSent(false); setLiked(false) } }, [open])

  if (!open || !session) return null

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#E8458C'
  const moodColor   = MOOD_COLORS[session.moodLight] ?? null

  const photos      = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []
  const isMutual    = mutualSessions.has(session.id)
  const hasInterest = myInterests.has(session.id)

  const matchBase    = 55 + (session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 36)
  const matchPercent = Math.min(99, matchBase + (isMutual ? 8 : 0) + (hasInterest ? 4 : 0))

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    if (meetSent) return
    if (session.isSeeded) {
      setMeetSent(true)
      onMeetSent?.(session)
      onConnect?.(session)
      return
    }
    setMeetLoading(true)
    try {
      await sendMeetRequest(
        { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
        session.userId, session.id
      )
      setMeetSent(true)
      onMeetSent?.(session)
      onConnect?.(session)
    } catch { showToast?.('Could not send. Try again.', 'error') }
    setMeetLoading(false)
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true); onLike?.(session)
    const batch = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      left: 30 + (Math.random() * 40 - 20),
      delay: i * 0.12,
      size: 14 + Math.random() * 10,
    }))
    setHearts(batch)
    setTimeout(() => setHearts([]), 2000)
    if (isMutual) {
      showToast?.(`🎉 It's a match! Chat with ${session.displayName} is opening!`, 'success')
      setTimeout(() => onMeetSent?.(session), 900)
    } else {
      showToast?.(`💕 You liked ${session.displayName}!`, 'success')
    }
  }

  const togglePanel = (name) => setPanel(p => p === name ? null : name)

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.card} style={moodColor ? { '--mood-color': moodColor } : {}}>

        {/* ── Background photo ── */}
        {photos.length > 0 ? (
          <img key={photoIdx} src={photos[photoIdx]} alt={session.displayName} className={styles.bgPhoto} />
        ) : (
          <div className={styles.noPhotoBg}>
            <span className={styles.noPhotoEmoji}>💕</span>
            <span className={styles.noPhotoName}>{session.displayName ?? 'Someone special'}</span>
          </div>
        )}

        {/* Mood ring */}
        {moodColor && <div className={styles.moodRing} />}

        {/* Gradient overlay */}
        <div className={styles.photoOverlay} />

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className={styles.photoDots}>
            {photos.map((_, i) => (
              <button key={i} className={`${styles.photoDot} ${i === photoIdx ? styles.photoDotActive : ''}`} onClick={() => setPhotoIdx(i)} />
            ))}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div className={styles.topBadges}>
            <div className={styles.datingBadge}>💕 Dating &amp; Romance</div>
            {session.isVerified && (
              <div className={styles.verifiedBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#E8458C" stroke="#E8458C" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Verified</span>
              </div>
            )}
            {moodColor && (
              <div className={styles.moodBadge} style={{ background: `${moodColor}22`, borderColor: `${moodColor}55`, color: moodColor }}>
                {session.moodLight === 'warm' ? '🧡 Open' : session.moodLight === 'cool' ? '💙 Busy' : '🩷 On a date'}
              </div>
            )}
          </div>
          <button className={styles.reportBtn} onClick={() => showToast?.('Report submitted — we review within 24h.', 'success')}>🛡️</button>
        </div>

        {/* ── Right side panel ── */}
        <div className={styles.sidePanel}>
          <SidePanelBtn emoji={liked ? '❤️' : '🤍'} label="Like"   active={liked}              color="#E8458C" onClick={handleLike} />
          <SidePanelBtn emoji="💡"                    label="Ideas"  active={panel === 'dateIdeas'}              onClick={() => togglePanel('dateIdeas')} />
          <SidePanelBtn emoji="🎭"                    label="Vibe"   active={panel === 'vibeCheck'}             onClick={() => togglePanel('vibeCheck')} />
          <SidePanelBtn emoji="🌈"                    label="Mood"   active={moodOpen}                          onClick={() => setMoodOpen(m => !m)} />
          <SidePanelBtn emoji="🦅"                    label="Wing"   active={panel === 'wingman'}               onClick={() => togglePanel('wingman')} />
          {session.lastSeenDaysAgo >= 7 && (
            <SidePanelBtn emoji="🔁" label="Reset" pulse onClick={() => showToast?.('🔁 Second Chance sent — they\'ll see a purple ring.', 'success')} />
          )}
        </div>

        {/* Floating hearts */}
        {hearts.map(h => (
          <span key={h.id} className={styles.floatingHeart} style={{ right: `${h.left + 60}px`, bottom: '40%', fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}>💕</span>
        ))}

        {/* ── Bottom overlay ── */}
        <div className={styles.bottomOverlay}>

          {/* Voice intro */}
          {session.voiceIntroUrl && (
            <VoiceIntroBar voiceIntroUrl={session.voiceIntroUrl} displayName={session.displayName} />
          )}

          {/* Name + age */}
          <div className={styles.nameRow}>
            <span className={styles.name}>{session.displayName ?? 'Someone'}</span>
            {session.age && <span className={styles.age}>, {session.age}</span>}
            {isOutNow && <span className={styles.liveDot} />}
            {session.starSign && (
              <span className={styles.starSign}>{SIGN_EMOJIS[session.starSign] ?? '✨'} {session.starSign}</span>
            )}
          </div>

          {/* Location + match */}
          <div className={styles.metaRow}>
            {(session.city || session.area) && <span className={styles.city}>📍 {session.city ?? session.area}</span>}
            {formatDistance(session.distanceKm) != null && (
              <span className={styles.distance}>
                {walkMinutes(session.distanceKm) != null ? `🚶 ${walkMinutes(session.distanceKm)} min` : formatDistance(session.distanceKm)}
              </span>
            )}
            <span className={styles.matchBadge}>{matchPercent}% Match</span>
          </div>

          {/* Dating-specific info chips */}
          <div className={styles.infoChips}>
            {session.relationshipGoal && (
              <span className={styles.chip}>{RELATIONSHIP_GOAL_LABELS[session.relationshipGoal] ?? session.relationshipGoal}</span>
            )}
            {session.height && <span className={styles.chip}>📏 {session.height}</span>}
            {(session.speakingNative || session.speakingSecond) && (
              <span className={styles.chip}>
                {[session.speakingNative, session.speakingSecond].filter(Boolean)
                  .map(l => `${LANGUAGE_FLAGS[l] ?? ''} ${l}`).join(' · ')}
              </span>
            )}
          </div>

          {/* Timer */}
          <div className={styles.statusRow}>
            {isScheduled || isInviteOut
              ? <span className={styles.statusBadge} style={{ borderColor: statusColor, color: statusColor }}>
                  {isScheduled ? '🕐 Scheduled' : 'Joined'}
                </span>
              : <CountdownTimer expiresAtMs={session.expiresAtMs} />
            }
          </div>

          {/* Bio snippet */}
          {session.bio && (
            <button className={styles.bioSnippet} onClick={() => togglePanel('bio')}>
              <span className={styles.bioText}>
                {session.bio.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().slice(0, 120)}…
              </span>
            </button>
          )}

          {/* Quick replies */}
          <QuickReplyBar targetSession={session} showToast={showToast} onGuestAction={onGuestAction} />

          {/* Connect */}
          <button
            className={`${styles.connectBtn} ${meetSent || hasInterest ? styles.connectBtnSent : ''}`}
            disabled={meetSent || hasInterest || meetLoading}
            onClick={handleLetsMeet}
          >
            {meetLoading ? '…' : meetSent || hasInterest ? '✓ Connected' : "Let's Connect"}
            {!meetSent && !hasInterest && !meetLoading && (
              <span className={styles.connectTag} style={{ background: statusColor }}>
                {isOutNow ? 'Out Now' : isInviteOut ? 'Invite' : 'Later'}
              </span>
            )}
          </button>
        </div>

        {/* ── Mood info popup ── */}
        {moodOpen && (
          <div className={styles.moodPopup}>
            <button className={styles.moodPopupClose} onClick={() => setMoodOpen(false)}>✕</button>
            <p className={styles.moodPopupTitle}>🌈 Mood Light</p>
            {[
              { key: 'warm', label: '🧡 Open to chat', color: '#F97316' },
              { key: 'cool', label: '💙 Working, slow reply', color: '#38BDF8' },
              { key: 'pink', label: '🩷 Already on a date', color: '#F472B6' },
            ].map(m => (
              <div key={m.key} className={styles.moodRow}>
                <div className={styles.moodDot} style={{ background: m.color }} />
                <span className={styles.moodLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Sliding panels ── */}

        {/* Bio */}
        {panel === 'bio' && (
          <div className={styles.bioOverlay}>
            <div className={styles.bioHandle} onClick={() => setPanel(null)} />
            {photos.length > 0 && (
              <div className={styles.bioImgWrap}>
                <img src={photos[photoIdx]} alt={session.displayName} className={styles.bioImgEl} />
                <div className={styles.bioImgGrad} />
                {session.starSign && (
                  <div className={styles.starSignBadge}>
                    <span>{SIGN_EMOJIS[session.starSign] ?? '✨'}</span>
                    <span>{session.starSign}</span>
                  </div>
                )}
              </div>
            )}
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>{session.bio ?? `${session.displayName} is looking for someone special.`}</p>
              {photos.length > 1 && (
                <div className={styles.thumbRow}>
                  {photos.map((url, i) => (
                    <button key={i} className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={url} alt="" className={styles.thumbImg} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Ideas */}
        {panel === 'dateIdeas' && (
          <DateIdeasSheet open={true} targetSession={session} onClose={() => setPanel(null)} />
        )}

        {/* Vibe Check */}
        <VibeCheckSheet
          open={panel === 'vibeCheck'}
          targetSession={session}
          onClose={() => setPanel(null)}
          showToast={showToast}
        />

        {/* Wingman */}
        <WingmanSheet
          open={panel === 'wingman'}
          targetSession={session}
          onClose={() => setPanel(null)}
          showToast={showToast}
        />

        {/* Echo Feedback */}
        <EchoFeedbackModal
          open={echoOpen}
          targetSession={session}
          onClose={() => setEchoOpen(false)}
          showToast={showToast}
        />
      </div>
    </div>
  )
}
