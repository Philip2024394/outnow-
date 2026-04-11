import { useState, useEffect, useRef } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import CountdownTimer from '@/components/ui/CountdownTimer'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { lookingForText, LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import { quoteForUser } from '@/data/brandQuotes'
import { recordPhotoView } from '@/services/photoNudgeService'
import { recordProfileView } from '@/services/profileService'
import { supabase } from '@/lib/supabase'
import MakerCard from './layouts/MakerCard'
import DatingCard from './layouts/DatingCard'
import MicroShop from '@/components/ui/MicroShop'
import DateIdeasSheet from '@/components/dating/DateIdeasSheet'
import VibeCheckSheet from './panels/VibeCheckSheet'
import WingmanSheet from './panels/WingmanSheet'
import EchoFeedbackModal from './panels/EchoFeedbackModal'
import QuickReplyBar from './panels/QuickReplyBar'
import VoiceIntroBar from './panels/VoiceIntroBar'
import styles from './DiscoveryCard.module.css'

const MAKER_CATEGORIES = [
  'handmade','craft_supplies','art_craft','buy_sell','fresh_produce','agri_goods',
  'fashion','electronics','vehicles','property','hardware','tools_equip','antiques',
  'import_export','vintage','trades','auto_repair','cleaning','garden','security',
  'laundry','tailoring','childcare','eldercare','pet_care','transport','healthcare',
  'beauty','fitness_pt','mental_health','alt_medicine','veterinary','pharmacy',
  'wellness','catering','restaurant','hotel_accom','tourism_guide','event_planning',
  'bar_nightclub','food_drink','creative','content_creator','music_perform','music',
  'photography','writing','fashion_design','business','technology','legal',
  'engineering','sales_leads','consulting','real_estate','marketing','media_pro',
  'professional','hiring','freelance','manufacturing','mining','education','coaching',
]

const ACTIVITY_SLOGANS = {
  drinks:  'Up for drinks tonight',
  food:    'Looking for somewhere to eat',
  coffee:  'Coffee & good conversation',
  walk:    'Fresh air & good company',
  hangout: 'Down to hang out tonight',
  culture: 'Exploring the city tonight',
  other:   'Out and about tonight',
}

// Mood light colors — set by the profile owner in their settings
const MOOD_COLORS = {
  warm:   '#E8458C', // 🩷 Online / open to chat
  cool:   '#FBBF24', // 🟡 Busy
  pink:   '#F472B6', // 💕 On a date right now
}

function fmtScheduledFull(ms) {
  if (!ms) return 'later'
  const d   = new Date(ms)
  const now = new Date()
  const isToday    = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Tonight at ${timeStr}`
  if (isTomorrow) return `Tomorrow at ${timeStr}`
  return d.toLocaleDateString([], { weekday: 'long' }) + ' at ' + timeStr
}

// ── Side panel button ──────────────────────────────────────────────────────────
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function DiscoveryCard({ open, session, mySession, onClose, showToast, onGuestAction, onMeetSent, onConnect, onLike, onUnlockContact, onGift }) {
  useOverlay()
  const { user } = useAuth()
  const { myInterests, mutualSessions } = useInterests()

  // Core state
  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent,    setMeetSent]    = useState(false)
  const [photoIdx,    setPhotoIdx]    = useState(0)
  const [liked,       setLiked]       = useState(false)
  const [hearts,      setHearts]      = useState([])

  // Panel visibility
  const [panel,       setPanel]       = useState(null) // 'dateIdeas' | 'vibeCheck' | 'wingman' | 'shop' | 'bio'
  const [moodOpen,    setMoodOpen]    = useState(false)
  const [echoOpen,    setEchoOpen]    = useState(false)

  // Ghost mode (long-press on photo)
  const [ghostMode,   setGhostMode]   = useState(false)
  const longPressRef  = useRef(null)
  const sheetRef      = useRef(null)
  const startYRef     = useRef(null)
  const currentYRef   = useRef(0)

  // Swipe-down to dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${Math.min(delta * 0.4, 80)}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = 'transform 0.3s ease'
      if (currentYRef.current > 100) onClose()
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

  useEffect(() => {
    if (open && session?.userId && !(session.photos?.length) && !session.photoURL) {
      recordPhotoView(session.userId)
    }
  }, [open, session?.userId]) // eslint-disable-line

  useEffect(() => {
    if (open && session?.userId && user?.id && session.userId !== user.id) {
      recordProfileView(session.userId)
    }
  }, [open, session?.userId, user?.id]) // eslint-disable-line

  useEffect(() => { if (open) { setPanel(null); setPhotoIdx(0); setMeetSent(false); setLiked(false) } }, [open])

  if (!open || !session) return null

  // Route to specialised layouts — all relationship intents use the dating card
  const DATING_INTENTS = ['dating', 'marriage', 'date_night', 'friendship', 'travel', 'pen_pal']
  const lookingForNorm = (session.lookingFor ?? '').toLowerCase()
  if (DATING_INTENTS.includes(lookingForNorm))
    return <DatingCard open={open} session={session} mySession={mySession} onClose={onClose} showToast={showToast} onGuestAction={onGuestAction} onMeetSent={onMeetSent} onConnect={onConnect} onLike={onLike} onGift={onGift} />
  if (MAKER_CATEGORIES.includes(lookingForNorm))
    return <MakerCard open={open} session={session} mySession={mySession} onClose={onClose} showToast={showToast} onGuestAction={onGuestAction} onMeetSent={onMeetSent} onLike={onLike} onUnlockContact={onUnlockContact} />

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#8DC63F'
  const moodColor   = MOOD_COLORS[session.moodLight] ?? null

  const photos = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []

  const isMutual   = mutualSessions.has(session.id)
  const hasInterest = myInterests.has(session.id)

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

  const slogan = session.message ?? ACTIVITY_SLOGANS[session.activityType] ?? 'Out and about tonight'

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

  // Long-press photo → Ghost Mode toggle
  const handlePhotoMouseDown = () => {
    longPressRef.current = setTimeout(() => {
      setGhostMode(g => !g)
      showToast?.(ghostMode ? '👁 Ghost mode off' : '👻 Ghost mode on — hidden from new viewers', 'success')
      if (supabase && user?.id) {
        supabase.from('profiles').update({ ghost_mode: !ghostMode }).eq('id', user.id)
      }
    }, 700)
  }
  const handlePhotoMouseUp = () => clearTimeout(longPressRef.current)

  const togglePanel = (name) => setPanel(p => p === name ? null : name)

  const timerLabel = isScheduled
    ? `🕐 ${fmtScheduledFull(session.scheduledFor)}`
    : isInviteOut ? `Joined` : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div
        ref={sheetRef}
        className={styles.card}
        style={moodColor ? { '--mood-color': moodColor } : {}}
      >
        {/* ── Background photo ── */}
        {photos.length > 0 ? (
          <img
            key={photoIdx}
            src={photos[photoIdx]}
            alt={session.displayName}
            className={styles.bgPhoto}
            onMouseDown={handlePhotoMouseDown}
            onMouseUp={handlePhotoMouseUp}
            onTouchStart={handlePhotoMouseDown}
            onTouchEnd={handlePhotoMouseUp}
          />
        ) : (
          <div className={styles.noPhotoBg}>
            <img
              src="https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064"
              alt="Hangger"
              className={styles.noPhotoLogo}
            />
            <span className={styles.noPhotoQuote}>"{quoteForUser(session.displayName ?? session.id)}"</span>
          </div>
        )}

        {/* Mood light ring border */}
        {moodColor && <div className={styles.moodRing} />}

        {/* Photo overlay gradient */}
        <div className={styles.photoOverlay} />

        {/* ── Photo dots (multiple photos) ── */}
        {photos.length > 1 && (
          <div className={styles.photoDots}>
            {photos.map((_, i) => (
              <button
                key={i}
                className={`${styles.photoDot} ${i === photoIdx ? styles.photoDotActive : ''}`}
                onClick={() => setPhotoIdx(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>

          <div className={styles.topBadges}>
            {session.isVerified && (
              <div className={styles.verifiedBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Verified</span>
              </div>
            )}
            {moodColor && (
              <div className={styles.moodBadge} style={{ background: `${moodColor}22`, borderColor: `${moodColor}55`, color: moodColor }}>
                {session.moodLight === 'warm' ? '🧡 Open to chat'
                  : session.moodLight === 'cool' ? '💙 Busy'
                  : '🩷 On a date'}
              </div>
            )}
          </div>

          <button className={styles.reportBtn} onClick={() => showToast?.('Report submitted — we review within 24h.', 'success')} aria-label="Report">
            🛡️
          </button>
        </div>

        {/* ── Right side panel ── */}
        <div className={styles.sidePanel}>
          <SidePanelBtn
            emoji={liked ? '❤️' : '🤍'}
            label="Like"
            active={liked}
            color="#E8458C"
            onClick={handleLike}
          />
          <SidePanelBtn
            emoji="💡"
            label="Ideas"
            active={panel === 'dateIdeas'}
            onClick={() => togglePanel('dateIdeas')}
          />
          <SidePanelBtn
            emoji="🎭"
            label="Vibe"
            active={panel === 'vibeCheck'}
            onClick={() => togglePanel('vibeCheck')}
          />
          <SidePanelBtn
            emoji="🌈"
            label="Mood"
            active={moodOpen}
            onClick={() => setMoodOpen(m => !m)}
          />
          <SidePanelBtn
            emoji="🦅"
            label="Wing"
            active={panel === 'wingman'}
            onClick={() => togglePanel('wingman')}
          />
          <SidePanelBtn
            emoji="🛍️"
            label="Shop"
            active={panel === 'shop'}
            onClick={() => togglePanel('shop')}
          />
          {/* 🔁 Second Chance — only for profiles seen 7+ days ago */}
          {session.lastSeenDaysAgo >= 7 && (
            <SidePanelBtn
              emoji="🔁"
              label="Reset"
              pulse
              onClick={() => showToast?.('🔁 Second Chance sent — they\'ll see a purple ring on your profile.', 'success')}
            />
          )}
        </div>

        {/* ── Floating hearts from like ── */}
        {hearts.map(h => (
          <span
            key={h.id}
            className={styles.floatingHeart}
            style={{ right: `${h.left + 60}px`, bottom: '40%', fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}
          >
            💕
          </span>
        ))}

        {/* ── Bottom overlay ── */}
        <div className={styles.bottomOverlay}>

          {/* Voice intro */}
          {session.voiceIntroUrl && (
            <VoiceIntroBar voiceIntroUrl={session.voiceIntroUrl} displayName={session.displayName} />
          )}

          {/* Name row */}
          <div className={styles.nameRow}>
            <span className={styles.name}>{session.displayName ?? 'Someone'}</span>
            {session.age && <span className={styles.age}>, {session.age}</span>}
            <span className={`${styles.liveDot} ${isInviteOut ? styles.liveDotInvite : isScheduled ? styles.liveDotLater : ''}`} />
          </div>

          {/* Location + distance */}
          <div className={styles.metaRow}>
            {(session.city || session.area) && (
              <span className={styles.city}>📍 {session.city ?? session.area}</span>
            )}
            {formatDistance(session.distanceKm) != null && (
              <span className={styles.distance}>
                {walkMinutes(session.distanceKm) != null ? `🚶 ${walkMinutes(session.distanceKm)} min` : formatDistance(session.distanceKm)}
              </span>
            )}
            <span className={styles.matchBadge}>{matchPercent}% Match</span>
          </div>

          {/* Status / timer */}
          <div className={styles.statusRow}>
            {timerLabel
              ? <span className={styles.statusBadge} style={{ borderColor: statusColor, color: statusColor }}>{timerLabel}</span>
              : <CountdownTimer expiresAtMs={session.expiresAtMs} />
            }
            {session.lookingFor && (
              <span className={styles.lookingForBadge}>{lookingForText(session.lookingFor)}</span>
            )}
          </div>

          {/* Bio snippet */}
          {session.bio && (
            <button className={styles.bioSnippet} onClick={() => togglePanel('bio')}>
              <span className={styles.bioText}>
                {session.bio.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim().slice(0, 120)}…
              </span>
            </button>
          )}

          {/* Quick reply emojis */}
          <QuickReplyBar
            targetSession={session}
            showToast={showToast}
            onGuestAction={onGuestAction}
          />

          {/* Connect button */}
          <button
            className={`${styles.connectBtn} ${meetSent || hasInterest ? styles.connectBtnSent : ''}`}
            disabled={meetSent || hasInterest || meetLoading}
            onClick={handleLetsMeet}
          >
            {meetLoading ? '…'
              : meetSent || hasInterest ? '✓ Connected'
              : "Let's Connect"}
            {!meetSent && !hasInterest && !meetLoading && (
              <span className={styles.connectTag} style={{ background: statusColor }}>
                {isOutNow ? "Out Now" : isInviteOut ? "Invite" : "Later"}
              </span>
            )}
          </button>
        </div>

        {/* ── Mood light info popup ── */}
        {moodOpen && (
          <div className={styles.moodPopup}>
            <button className={styles.moodPopupClose} onClick={() => setMoodOpen(false)}>✕</button>
            <p className={styles.moodPopupTitle}>🌈 Mood Light</p>
            {[
              { key: 'warm', label: '🧡 Open to chat right now', color: '#F97316' },
              { key: 'cool', label: '💙 Working — reply slow',   color: '#38BDF8' },
              { key: 'pink', label: '🩷 Already on a date idea',  color: '#F472B6' },
            ].map(m => (
              <div key={m.key} className={styles.moodRow}>
                <div className={styles.moodDot} style={{ background: m.color }} />
                <span className={styles.moodLabel}>{m.label}</span>
              </div>
            ))}
            <p className={styles.moodCurrent}>
              {session.moodLight
                ? `${session.displayName} is showing ${session.moodLight === 'warm' ? '🧡' : session.moodLight === 'cool' ? '💙' : '🩷'}`
                : `${session.displayName} hasn't set a mood`}
            </p>
          </div>
        )}

        {/* ── Ghost mode overlay ── */}
        {ghostMode && (
          <div className={styles.ghostOverlay}>
            <span className={styles.ghostEmoji}>👻</span>
            <span className={styles.ghostText}>Ghost Mode On</span>
            <span className={styles.ghostSub}>Hidden from people you haven't matched with in 7 days</span>
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
              </div>
            )}
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>
                {session.bio ?? `${session.displayName ?? 'They'} ${isOutNow ? 'is out right now' : 'is planning to head out'} — ${slogan.toLowerCase()}.`}
              </p>
              {(session.speakingNative || session.speakingSecond) && (
                <div className={styles.bioLangs}>
                  {[session.speakingNative, session.speakingSecond].filter(Boolean).map(lang => (
                    <span key={lang} className={styles.bioLangChip}>{LANGUAGE_FLAGS[lang] ?? ''} {lang}</span>
                  ))}
                </div>
              )}
              {photos.length > 1 && (
                <div className={styles.thumbRow}>
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
              )}
            </div>
          </div>
        )}

        {/* Shop */}
        {panel === 'shop' && (
          <div className={styles.shopOverlay}>
            <button className={styles.panelClose} onClick={() => setPanel(null)}>✕ Close</button>
            <MicroShop userId={session.userId} visible />
          </div>
        )}

        {/* Date Ideas */}
        {panel === 'dateIdeas' && (
          <DateIdeasSheet
            open={true}
            targetSession={session}
            onClose={() => setPanel(null)}
          />
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

        {/* Echo Feedback — shown after connect */}
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
