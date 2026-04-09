import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sendMeetRequest } from '@/services/meetService'
import { useLikedProfiles } from '@/hooks/useLikedProfiles'
import { useAuth } from '@/hooks/useAuth'
import styles from './DatingBubbleScreen.module.css'

// ── Physics ──────────────────────────────────────────────────────────────────
const R            = 48          // bubble radius px
const GAP          = 10
const MIN_D        = R * 2 + GAP
const MAX_SPD      = 0.55        // slow drift
const MIN_SPD      = 0.12
const ENTRY_SPD    = 0.18        // slower on entry for float-in feel
const DAMP         = 0.96
const MAX_BUBBLES  = 9           // 3 cols × 3 rows fits comfortably
const LIFETIME_MIN = 7000
const LIFETIME_MAX = 7000   // fixed 7s before exit begins
const MINIMIZE_SPD = 0.065
const HEADER_H     = 74

const MOOD_COLORS  = { warm: '#F97316', cool: '#38BDF8', pink: '#F472B6' }
const DEFAULT_GLOW = '#E8458C'

const SHAPES    = ['♡','♡','♡','✦','·','·']
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i, shape: SHAPES[i % SHAPES.length],
  left:  `${5  + (i * 5.8) % 90}%`,
  size:  9  + (i * 3.3) % 13,
  dur:   `${7  + (i * 1.4) % 6}s`,
  delay: `${-(i * 0.85) % 8}s`,
  drift: `${-12 + (i * 4.7) % 24}px`,
  peak:  0.12 + (i * 0.04) % 0.2,
  blur:  i % 3 === 0,
  pink:  SHAPES[i % SHAPES.length] === '♡',
}))

const MATCH_HEARTS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left:  `${3  + (i * 4.1) % 94}%`,
  size:  14 + (i * 4.3) % 22,
  dur:   `${4  + (i * 0.9) % 4}s`,
  delay: `${-(i * 0.4) % 4}s`,
  drift: `${-20 + (i * 6.1) % 40}px`,
}))

const BURST_PARTICLES = [
  { dx: '-14px', delay: '0s',    size: 10 },
  { dx: '-7px',  delay: '0.04s', size: 8  },
  { dx: '0px',   delay: '0.08s', size: 11 },
  { dx: '7px',   delay: '0.04s', size: 8  },
  { dx: '14px',  delay: '0s',    size: 10 },
]

const HOW_IT_WORKS = [
  { icon: '👆', text: 'Tap a profile to save it to your tray' },
  { icon: '♡',  text: 'Heart to like — it\'s a match if they like back' },
  { icon: '🔄', text: 'New profiles float in every few seconds' },
  { icon: '⊞',  text: 'Top right button switches between floating and grid view' },
]

function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function clampSpeed(b) {
  const spd = Math.hypot(b.vx, b.vy)
  if (spd > MAX_SPD) { b.vx *= MAX_SPD / spd; b.vy *= MAX_SPD / spd }
  if (spd > 0.01 && spd < MIN_SPD) { b.vx *= MIN_SPD / spd; b.vy *= MIN_SPD / spd }
}

// Entry from a random edge at slow float speed
function randomEntry(W, H) {
  const edge = Math.floor(Math.random() * 3)
  const spd  = ENTRY_SPD + Math.random() * 0.1
  const arenaH = H - HEADER_H
  if (edge === 0) {
    return { x: -R - 5, y: HEADER_H + R + Math.random() * (arenaH - R * 2 - 30), vx: spd, vy: (Math.random() - 0.5) * spd * 0.5 }
  } else if (edge === 1) {
    return { x: W + R + 5, y: HEADER_H + R + Math.random() * (arenaH - R * 2 - 30), vx: -spd, vy: (Math.random() - 0.5) * spd * 0.5 }
  } else {
    return { x: R + Math.random() * (W - R * 2), y: H + R + 5, vx: (Math.random() - 0.5) * spd * 0.5, vy: -spd }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DatingBubbleScreen({
  open, activity, sessions = [], mutualSessions, myProfile,
  onClose, onSelectSession,
}) {
  const { user }                          = useAuth()
  const { saveLike, removeLike, isLiked } = useLikedProfiles()

  const [likedIds,     setLikedIds]     = useState(new Set())
  const [burstIds,     setBurstIds]     = useState(new Set())
  const [tray,         setTray]         = useState([])
  const [viewerOpen,   setViewerOpen]   = useState(false)
  const [viewerIdx,    setViewerIdx]    = useState(0)
  const [matchSession, setMatchSession] = useState(null)
  const [displaySlots, setDisplaySlots] = useState([])
  const [showTip,      setShowTip]      = useState(false)
  const [view,         setView]         = useState('float')  // 'float' | 'grid'

  const containerRef   = useRef(null)
  const bubbleRefs     = useRef([])
  const physics        = useRef([])
  const rafId          = useRef(null)
  const size           = useRef({ w: 390, h: 700 })
  const nextIdx        = useRef(0)
  const selectedIds    = useRef(new Set())
  const minimizeTimers = useRef({})
  const shownMatches   = useRef(new Set())

  // Show how-it-works tip on first open — only closes via Understand button
  useEffect(() => {
    if (open) setShowTip(true)
  }, [open])

  // Mutual match detector
  useEffect(() => {
    if (!mutualSessions?.size) return
    for (const sessionId of mutualSessions) {
      if (shownMatches.current.has(sessionId)) continue
      const s = displaySlots.find(x => x?.id === sessionId)
        ?? sessions.find(x => x?.id === sessionId)
      if (s) { shownMatches.current.add(sessionId); setMatchSession(s) }
    }
  }, [mutualSessions, displaySlots, sessions])

  // ── Physics init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || sessions.length === 0) { setDisplaySlots([]); physics.current = []; return }
    if (rafId.current) cancelAnimationFrame(rafId.current)
    selectedIds.current = new Set()
    setTray([])

    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
    }

    const { w } = size.current
    const count = Math.min(sessions.length, MAX_BUBBLES)
    const cols  = Math.max(1, Math.floor(w / (MIN_D + 16)))
    const initSlots = sessions.slice(0, count)
    nextIdx.current = count % sessions.length

    const now = Date.now()
    const initPhysics = initSlots.map((_, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      const jitter = () => (Math.random() - 0.5) * 20
      return {
        x:                R + 16 + col * (MIN_D + 16) + jitter(),
        y:                HEADER_H + R + 20 + row * (MIN_D + 30) + jitter(),
        vx:               (Math.random() - 0.5) * MAX_SPD,
        vy:               (Math.random() - 0.5) * MAX_SPD,
        frozen:           false,
        dying:            false,
        entering:         true,
        minimizeProgress: 0,
        opacity:          1,
        dieAt:            now + LIFETIME_MIN + (i * 1100) + Math.random() * 1200,
      }
    })

    setDisplaySlots(initSlots)
    physics.current = initPhysics
    let slots = [...initSlots]

    function swapSlot(i) {
      const shown = new Set(slots.filter(Boolean).map(s => s.id))
      let candidate = null
      for (let t = 0; t < sessions.length; t++) {
        const s = sessions[nextIdx.current % sessions.length]
        nextIdx.current = (nextIdx.current + 1) % sessions.length
        if (!shown.has(s.id)) { candidate = s; break }
      }
      if (!candidate) {
        nextIdx.current = (nextIdx.current + 1) % sessions.length
        candidate = sessions[nextIdx.current % sessions.length]
      }
      slots = [...slots]; slots[i] = candidate
      const entry = randomEntry(size.current.w, size.current.h)
      physics.current[i] = {
        ...entry,
        frozen: false, dying: false, entering: true,
        minimizeProgress: 0, opacity: 1,
        dieAt: Date.now() + LIFETIME_MIN + Math.random() * (LIFETIME_MAX - LIFETIME_MIN),
      }
      setDisplaySlots([...slots])
    }

    function tick() {
      const { w: W, h: H } = size.current
      const bs = physics.current, now = Date.now()

      for (let i = 0; i < bs.length; i++) {
        const b = bs[i], el = bubbleRefs.current[i]
        if (!b || !el) continue

        // ── Float-in entry: full opacity, drift in from edge, no wall bounce ──
        if (b.entering) {
          b.x += b.vx
          b.y += b.vy
          el.style.opacity   = '1'
          el.style.transform = `translate(${b.x - R}px, ${b.y - R}px)`
          // Done entering once fully inside arena bounds
          if (b.x - R > 0 && b.x + R < W && b.y - R > HEADER_H && b.y + R < H - 28) {
            b.entering = false
            clampSpeed(b)
          }
          continue
        }

        // ── Minimize (shrink to tray) ──
        if (b.minimizeProgress > 0) {
          b.minimizeProgress = Math.min(1, b.minimizeProgress + MINIMIZE_SPD)
          const s = 1 - b.minimizeProgress
          el.style.opacity   = s
          el.style.transform = `translate(${b.x - R}px, ${b.y - R}px) scale(${s})`
          if (b.minimizeProgress >= 1) {
            b.minimizeProgress = 0; b.frozen = false; swapSlot(i)
          }
          continue
        }

        // ── Natural lifetime expiry ──
        if (!b.frozen && !b.dying && now > b.dieAt) b.dying = true

        // ── Exit: gently steer toward nearest wall, slow float off ──
        if (b.dying) {
          const dL = b.x, dR = W - b.x, dB = H - b.y
          // Nudge velocity toward nearest wall — small increment = slow drift
          if      (dL <= dR && dL <= dB)     b.vx = Math.max(b.vx - 0.008, -MAX_SPD * 1.4)
          else if (dR < dL && dR <= dB)      b.vx = Math.min(b.vx + 0.008,  MAX_SPD * 1.4)
          else                               b.vy = Math.min(b.vy + 0.008,  MAX_SPD * 1.4)
          // Swap once fully off-screen
          if (b.x + R < 0 || b.x - R > W || b.y + R < HEADER_H || b.y - R > H + 20) {
            swapSlot(i); continue
          }
        }

        // ── Normal movement ──
        if (!b.frozen) {
          b.x += b.vx; b.y += b.vy
          if (!b.dying) {
            if (b.x - R < 0)        { b.x = R;            b.vx =  Math.abs(b.vx) }
            if (b.x + R > W)        { b.x = W - R;        b.vx = -Math.abs(b.vx) }
            if (b.y - R < HEADER_H) { b.y = HEADER_H + R; b.vy =  Math.abs(b.vy) }
            if (b.y + R + 28 > H)   { b.y = H - R - 28;   b.vy = -Math.abs(b.vy) }
            clampSpeed(b)  // only clamp while drifting normally, not during exit
          }
        }

        el.style.transform = `translate(${b.x - R}px, ${b.y - R}px)`
      }

      // ── Separation + elastic collisions (all bubbles, including entering/dying) ──
      for (let i = 0; i < bs.length - 1; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const dx = bs[j].x - bs[i].x, dy = bs[j].y - bs[i].y
          const dist = Math.hypot(dx, dy)
          if (dist < MIN_D && dist > 0.01) {
            const nx = dx / dist, ny = dy / dist
            // Full overlap correction — push both apart completely
            const ov = (MIN_D - dist) / 2
            if (!bs[i].frozen) { bs[i].x -= nx * ov; bs[i].y -= ny * ov }
            if (!bs[j].frozen) { bs[j].x += nx * ov; bs[j].y += ny * ov }

            // Velocity exchange only for normal (non-entering, non-dying) bubbles
            const iActive = !bs[i].frozen && !bs[i].entering && !bs[i].dying
            const jActive = !bs[j].frozen && !bs[j].entering && !bs[j].dying
            if (iActive && jActive) {
              const dot = (bs[i].vx - bs[j].vx) * nx + (bs[i].vy - bs[j].vy) * ny
              if (dot > 0) {
                bs[i].vx = (bs[i].vx - dot * nx) * DAMP; bs[i].vy = (bs[i].vy - dot * ny) * DAMP
                bs[j].vx = (bs[j].vx + dot * nx) * DAMP; bs[j].vy = (bs[j].vy + dot * ny) * DAMP
                clampSpeed(bs[i]); clampSpeed(bs[j])
              }
            } else if (bs[i].frozen && jActive) {
              const dot = bs[j].vx * (-nx) + bs[j].vy * (-ny)
              if (dot > 0) { bs[j].vx = (bs[j].vx + dot * nx * 2) * DAMP; bs[j].vy = (bs[j].vy + dot * ny * 2) * DAMP; clampSpeed(bs[j]) }
            } else if (iActive && bs[j].frozen) {
              const dot = bs[i].vx * nx + bs[i].vy * ny
              if (dot > 0) { bs[i].vx = (bs[i].vx - dot * nx * 2) * DAMP; bs[i].vy = (bs[i].vy - dot * ny * 2) * DAMP; clampSpeed(bs[i]) }
            }
          }
        }
      }

      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      Object.values(minimizeTimers.current).forEach(clearTimeout)
      minimizeTimers.current = {}
    }
  }, [open, sessions])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const obs = new ResizeObserver(([e]) => { size.current = { w: e.contentRect.width, h: e.contentRect.height } })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [open])

  // ── Select / deselect ────────────────────────────────────────────────────
  const handleBubbleTap = (s, i) => {
    if (selectedIds.current.has(s.id)) {
      clearTimeout(minimizeTimers.current[s.id])
      delete minimizeTimers.current[s.id]
      selectedIds.current.delete(s.id)
      if (physics.current[i]) physics.current[i].frozen = false
      setTray(prev => prev.filter(x => x.id !== s.id))
      return
    }
    selectedIds.current.add(s.id)
    if (physics.current[i]) physics.current[i].frozen = true

    minimizeTimers.current[s.id] = setTimeout(() => {
      selectedIds.current.delete(s.id)
      const idx = displaySlots.findIndex(x => x?.id === s.id)
      if (idx !== -1 && physics.current[idx]) physics.current[idx].minimizeProgress = 0.01
      setTray(prev => prev.some(x => x.id === s.id) ? prev : [...prev, s])
      delete minimizeTimers.current[s.id]
    }, 5000)
  }

  // ── Heart like ───────────────────────────────────────────────────────────
  const handleHeart = async (e, s) => {
    e.stopPropagation()
    if (likedIds.has(s.id)) {
      setLikedIds(prev => { const n = new Set(prev); n.delete(s.id); return n })
      removeLike(s.id); return
    }
    setLikedIds(prev => new Set([...prev, s.id]))
    saveLike(s)
    setBurstIds(prev => new Set([...prev, s.id]))
    setTimeout(() => setBurstIds(prev => { const n = new Set(prev); n.delete(s.id); return n }), 850)
    try {
      if (!s.isSeeded)
        await sendMeetRequest(
          { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
          s.userId, s.id
        )
    } catch {}
  }

  const removeTrayItem = id => {
    clearTimeout(minimizeTimers.current[id])
    delete minimizeTimers.current[id]
    setTray(prev => prev.filter(x => x.id !== id))
  }

  // ── Viewer swipe ─────────────────────────────────────────────────────────
  const touchStartY = useRef(null)
  const handleViewerTouchStart = e => { touchStartY.current = e.touches[0].clientY }
  const handleViewerTouchEnd   = e => {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (delta < -50 && viewerIdx < tray.length - 1) setViewerIdx(i => i + 1)
    if (delta >  50 && viewerIdx > 0)               setViewerIdx(i => i - 1)
  }

  if (!open || !activity) return null
  const viewerSession = tray[viewerIdx] ?? null
  const myPhoto = myProfile?.photos?.[0] ?? myProfile?.photoURL ?? null
  const myName  = myProfile?.displayName ?? user?.displayName ?? 'You'

  return createPortal(
    <div className={styles.page}>

      {/* Particles */}
      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map(p => (
          <span key={p.id} className={styles.particle} style={{
            left: p.left, fontSize: p.size, animationDelay: p.delay,
            '--dur': p.dur, '--drift': p.drift, '--peak': p.peak,
            color:  p.pink ? '#F472B6' : 'rgba(255,255,255,0.5)',
            filter: p.blur ? 'blur(1px)' : undefined,
          }}>{p.shape}</span>
        ))}
      </div>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>{activity.emoji} {activity.label}</span>
          <span className={styles.headerSub}>
            {sessions.length === 0
              ? 'Nobody nearby yet'
              : `${sessions.length} ${sessions.length === 1 ? 'person' : 'people'} nearby`}
          </span>
        </div>

        {/* Single toggle — float ↔ grid */}
        <button
          className={styles.viewToggle}
          onClick={() => setView(v => v === 'float' ? 'grid' : 'float')}
          aria-label={view === 'float' ? 'Switch to grid view' : 'Switch to floating view'}
        >
          {view === 'float' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3"  y="3"  width="7" height="7" rx="1.5"/><rect x="14" y="3"  width="7" height="7" rx="1.5"/>
              <rect x="3"  y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="3"/><circle cx="12" cy="6" r="3"/><circle cx="19" cy="15" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className={styles.gridView}>
          {sessions.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji}>{activity.emoji}</span>
              <p>Nobody nearby for {activity.label} yet.</p>
            </div>
          )}
          {sessions.map(s => {
            const photo   = s.photos?.[0] ?? s.photoURL ?? null
            const age     = calcAge(s.dob)
            const liked   = likedIds.has(s.id) || isLiked(s.id)
            const bursting = burstIds.has(s.id)
            const isLive  = s.status === 'active'
            const glow    = MOOD_COLORS[s.moodLight] ?? DEFAULT_GLOW
            return (
              <div
                key={s.id}
                className={[styles.gridCard, isLive ? styles.gridCardLive : ''].join(' ')}
                style={isLive ? { '--glow': glow } : {}}
                onClick={() => onSelectSession(s)}
              >
                <div className={styles.gridPhoto}>
                  {photo
                    ? <img src={photo} alt={s.displayName} className={styles.gridImg} />
                    : <span className={styles.gridInit}>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                  }
                  <div className={styles.gridGrad} />
                  {isLive && <span className={styles.gridLiveDot} style={{ background: glow, boxShadow: `0 0 6px ${glow}` }} />}
                  <div className={styles.gridInfo}>
                    <div className={styles.gridNameRow}>
                      <span className={styles.gridName}>{s.displayName ?? 'Someone'}</span>
                      {age && <span className={styles.gridAge}>{age}</span>}
                    </div>
                    {(s.city || s.area) && (
                      <span className={styles.gridCity}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {s.area ?? s.city}
                      </span>
                    )}
                  </div>
                  {/* Heart */}
                  <button
                    className={[styles.gridHeart, liked ? styles.gridHeartLiked : ''].join(' ')}
                    style={liked ? { background: 'rgba(244,114,182,0.25)', borderColor: '#F472B6' } : {}}
                    onClick={e => handleHeart(e, s)}
                    aria-label={liked ? 'Unlike' : 'Like'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24"
                      fill={liked ? '#F472B6' : 'none'}
                      stroke={liked ? '#F472B6' : 'currentColor'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  {/* Burst */}
                  {bursting && (
                    <div className={styles.burstContainer} aria-hidden="true">
                      {BURST_PARTICLES.map((p, j) => (
                        <span key={j} className={styles.burstParticle} style={{ '--dx': p.dx, animationDelay: p.delay, fontSize: p.size }}>♡</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Float Arena */}
      <div className={styles.arena} ref={containerRef} style={{ display: view === 'grid' ? 'none' : undefined }}>
        {displaySlots.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>{activity.emoji}</span>
            <p>Nobody nearby for {activity.label} yet.</p>
            <p className={styles.emptySub}>Check back soon.</p>
          </div>
        )}

        {displaySlots.map((s, i) => {
          if (!s) return null
          const photo    = s.photos?.[0] ?? s.photoURL ?? null
          const age      = calcAge(s.dob)
          const glow     = MOOD_COLORS[s.moodLight] ?? DEFAULT_GLOW
          const liked    = likedIds.has(s.id) || isLiked(s.id)
          const bursting = burstIds.has(s.id)
          const isLive   = s.status === 'active'
          const isSel    = selectedIds.current.has(s.id)

          return (
            <div
              key={i}
              ref={el => { bubbleRefs.current[i] = el }}
              className={styles.bubble}
              style={{ width: R * 2, height: R * 2 + 30 }}
            >
              <button
                className={styles.bubbleBtn}
                style={{
                  width: R * 2, height: R * 2,
                  boxShadow: isSel
                    ? `0 0 0 3px #fff, 0 0 0 5px ${glow}, 0 0 28px ${glow}99`
                    : `0 0 0 3px ${glow}, 0 0 22px ${glow}66`,
                }}
                onClick={() => handleBubbleTap(s, i)}
                aria-label={`View ${s.displayName}`}
              >
                {photo
                  ? <img src={photo} alt={s.displayName} className={styles.bubbleImg} />
                  : <span className={styles.bubbleInit}>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                }
                {isLive && <span className={styles.liveDot} style={{ background: glow, boxShadow: `0 0 6px ${glow}` }} />}
                {isSel  && <span className={styles.selBadge} style={{ background: glow }}>✓</span>}
              </button>

              {/* Heart */}
              <button
                className={[styles.heartBtn, liked ? styles.heartBtnLiked : ''].join(' ')}
                style={liked ? { background: 'rgba(244,114,182,0.2)', borderColor: '#F472B6' } : {}}
                onClick={e => handleHeart(e, s)}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <svg
                  className={[styles.heartIcon, liked ? styles.heartIconFilled : ''].join(' ')}
                  width="14" height="14" viewBox="0 0 24 24"
                  fill={liked ? '#F472B6' : 'none'}
                  stroke={liked ? '#F472B6' : 'currentColor'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>

              {/* Burst hearts */}
              {bursting && (
                <div className={styles.burstContainer} aria-hidden="true">
                  {BURST_PARTICLES.map((p, j) => (
                    <span key={j} className={styles.burstParticle} style={{ '--dx': p.dx, animationDelay: p.delay, fontSize: p.size }}>♡</span>
                  ))}
                </div>
              )}

              <div className={styles.bubbleLabel}>
                <span className={styles.bubbleName}>{s.displayName ?? 'Someone'}</span>
                {age && <span className={styles.bubbleAge}>{age}</span>}
              </div>
            </div>
          )
        })}

        {/* Tray — no container, avatars float at bottom-left */}
        <div className={styles.tray}>
          {tray.map(s => {
            const photo = s.photos?.[0] ?? s.photoURL ?? null
            const glow  = MOOD_COLORS[s.moodLight] ?? DEFAULT_GLOW
            return (
              <div key={s.id} className={styles.trayItem} style={{ borderColor: glow }}>
                <button className={styles.trayAvatarBtn} onClick={() => { setViewerIdx(tray.indexOf(s)); setViewerOpen(true) }}>
                  {photo
                    ? <img src={photo} alt={s.displayName} className={styles.trayAvatarImg} />
                    : <span className={styles.trayAvatarInit}>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                  }
                </button>
                <button className={styles.trayRemove} onClick={() => removeTrayItem(s.id)} aria-label="Remove">×</button>
              </div>
            )
          })}

          {tray.length > 0 && (
            <button className={styles.trayCta} onClick={() => { setViewerIdx(0); setViewerOpen(true) }}>
              View {tray.length} {tray.length === 1 ? 'profile' : 'profiles'} →
            </button>
          )}
        </div>
      </div>

      {/* ── How it works tip — shown on arrival, auto-dismiss 5s ─────────── */}
      {showTip && (
        <div className={styles.tip}>
          <p className={styles.tipTitle}>How it works</p>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className={styles.tipRow}>
              <span className={styles.tipIcon}>{item.icon}</span>
              <span className={styles.tipText}>{item.text}</span>
            </div>
          ))}
          <button className={styles.tipUnderstand} onClick={e => { e.stopPropagation(); setShowTip(false) }}>
            Understand
          </button>
        </div>
      )}

      {/* Stacked viewer */}
      {viewerOpen && viewerSession && (
        <div className={styles.viewer} onTouchStart={handleViewerTouchStart} onTouchEnd={handleViewerTouchEnd}>
          <div className={styles.viewerPhoto}>
            {(viewerSession.photos?.[0] ?? viewerSession.photoURL)
              ? <img src={viewerSession.photos?.[0] ?? viewerSession.photoURL} alt={viewerSession.displayName} className={styles.viewerImg} />
              : <div className={styles.viewerInitial}>{(viewerSession.displayName ?? '?')[0].toUpperCase()}</div>
            }
            <div className={styles.viewerGrad} />
          </div>
          <div className={styles.viewerInfo}>
            <span className={styles.viewerName}>{viewerSession.displayName ?? 'Someone'}</span>
            {calcAge(viewerSession.dob) && <span className={styles.viewerAge}>{calcAge(viewerSession.dob)}</span>}
          </div>
          <div className={styles.viewerDots}>
            {tray.map((_, idx) => (
              <span key={idx} className={[styles.viewerDot, idx === viewerIdx ? styles.viewerDotOn : ''].join(' ')} />
            ))}
          </div>
          {tray.length > 1 && <p className={styles.viewerHint}>swipe up · down to navigate</p>}
          {viewerIdx > 0 && (
            <button className={styles.viewerNavUp} onClick={() => setViewerIdx(i => i - 1)} aria-label="Previous">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
          )}
          {viewerIdx < tray.length - 1 && (
            <button className={styles.viewerNavDown} onClick={() => setViewerIdx(i => i + 1)} aria-label="Next">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          )}
          <button className={styles.viewerClose} onClick={() => setViewerOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button className={styles.viewerCta} onClick={() => { setViewerOpen(false); onSelectSession(viewerSession) }}>
            Connect with {viewerSession.displayName?.split(' ')[0] ?? 'them'}
          </button>
        </div>
      )}

      {/* Match overlay */}
      {matchSession && (
        <div className={styles.matchOverlay}>
          <div className={styles.matchHearts} aria-hidden="true">
            {MATCH_HEARTS.map(h => (
              <span key={h.id} className={styles.matchHeart} style={{
                left: h.left, fontSize: h.size, animationDelay: h.delay,
                '--dur': h.dur, '--drift': h.drift,
              }}>♡</span>
            ))}
          </div>
          <div className={styles.matchContent}>
            <p className={styles.matchEyebrow}>it's a match</p>
            <h2 className={styles.matchTitle}>💕</h2>
            <p className={styles.matchSub}>You and {matchSession.displayName?.split(' ')[0]} liked each other</p>
            <div className={styles.matchAvatars}>
              <div className={styles.matchAvatar}>
                {myPhoto ? <img src={myPhoto} alt={myName} className={styles.matchAvatarImg} /> : <span className={styles.matchAvatarInit}>{myName[0].toUpperCase()}</span>}
              </div>
              <span className={styles.matchHeartsIcon}>♡</span>
              <div className={styles.matchAvatar}>
                {(matchSession.photos?.[0] ?? matchSession.photoURL)
                  ? <img src={matchSession.photos?.[0] ?? matchSession.photoURL} alt={matchSession.displayName} className={styles.matchAvatarImg} />
                  : <span className={styles.matchAvatarInit}>{(matchSession.displayName ?? '?')[0].toUpperCase()}</span>
                }
              </div>
            </div>
            <button className={styles.matchCta} onClick={() => { setMatchSession(null); onSelectSession(matchSession) }}>Start chatting</button>
            <button className={styles.matchSkip} onClick={() => setMatchSession(null)}>Maybe later</button>
          </div>
        </div>
      )}

    </div>,
    document.body
  )
}
