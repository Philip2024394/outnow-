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
const HEADER_H     = 74

const MOOD_COLORS  = { warm: '#FF4FA3', cool: '#FF4FA3', pink: '#F472B6' }
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
  { icon: '👆', text: 'Tap any profile bubble or grid photo to open their full profile' },
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
  const [matchSession, setMatchSession] = useState(null)
  const [displaySlots, setDisplaySlots] = useState([])
  const [showTip,      setShowTip]      = useState(false)
  const [view,         setView]         = useState('float')  // 'float' | 'grid'
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [filters,      setFilters]      = useState({ ageMin: 18, ageMax: 45, gender: null, lookingFor: null, city: '', onlineOnly: false, withPhoto: true })
  const [priorityCard, setPriorityCard] = useState(null)

  // Apply filters to sessions
  const filteredSessions = sessions.filter(s => {
    const age = calcAge(s.dob)
    if (age !== null && (age < filters.ageMin || age > filters.ageMax)) return false
    if (filters.gender && s.gender && s.gender !== filters.gender) return false
    if (filters.lookingFor && s.lookingFor && s.lookingFor !== filters.lookingFor) return false
    if (filters.city && !(s.city ?? s.area ?? '').toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.onlineOnly && s.status !== 'active' && s.status !== 'live') return false
    if (filters.withPhoto && !s.photos?.[0] && !s.photoURL) return false
    return true
  })

  // Priority card — cycle through new sessions every 20s
  useEffect(() => {
    if (!open || sessions.length === 0) return
    const newSession = sessions.find(s => !likedIds.has(s.id))
    if (newSession) setPriorityCard(newSession)
    const t = setInterval(() => {
      const next = sessions.find(s => !likedIds.has(s.id))
      setPriorityCard(next ?? null)
    }, 20000)
    return () => clearInterval(t)
  }, [open, sessions]) // eslint-disable-line

  const containerRef   = useRef(null)
  const bubbleRefs     = useRef([])
  const physics        = useRef([])
  const rafId          = useRef(null)
  const size           = useRef({ w: 390, h: 700 })
  const nextIdx        = useRef(0)
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
        x:        R + 16 + col * (MIN_D + 16) + jitter(),
        y:        HEADER_H + R + 20 + row * (MIN_D + 30) + jitter(),
        vx:       (Math.random() - 0.5) * MAX_SPD,
        vy:       (Math.random() - 0.5) * MAX_SPD,
        frozen:   false,
        dying:    false,
        entering: true,
        opacity:  1,
        dieAt:    now + LIFETIME_MIN + (i * 1100) + Math.random() * 1200,
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
        opacity: 1,
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
    }
  }, [open, sessions])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const obs = new ResizeObserver(([e]) => { size.current = { w: e.contentRect.width, h: e.contentRect.height } })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [open])

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

  if (!open || !activity) return null
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

        {/* Filter button */}
        <button
          className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnActive : ''}`}
          onClick={() => { setFilterOpen(v => !v); setShowTip(false) }}
          aria-label="Filters"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {(filters.onlineOnly || filters.withPhoto || filters.ageMin > 18 || filters.ageMax < 45 || filters.gender || filters.lookingFor || filters.city) && (
            <span className={styles.filterDot} />
          )}
        </button>

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

      {/* ── Filter sheet ── */}
      {filterOpen && (
        <div className={styles.filterSheet}>

          {/* Gender */}
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>Show me</span>
            <div className={styles.filterChips}>
              {[{ v: null, l: 'Everyone' }, { v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }].map(({ v, l }) => (
                <button key={String(v)} className={`${styles.filterChip} ${filters.gender === v ? styles.filterChipOn : ''}`}
                  onClick={() => setFilters(f => ({ ...f, gender: v }))}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Looking for */}
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>Looking for</span>
            <select
              className={styles.filterSelect}
              value={filters.lookingFor ?? ''}
              onChange={e => setFilters(f => ({ ...f, lookingFor: e.target.value || null }))}
            >
              <option value="">All</option>
              <option value="marriage">Marriage</option>
              <option value="dating">Dating</option>
              <option value="date_night">Date Night</option>
              <option value="friendship">Friendship</option>
              <option value="travel">Travel Partner</option>
              <option value="meet_new">Free Tonight</option>
            </select>
          </div>

          {/* City */}
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>City</span>
            <input
              type="text"
              className={styles.filterCityInput}
              placeholder="e.g. Bali, Jakarta…"
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            />
          </div>

          {/* Age range */}
          <div className={styles.filterBlock}>
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Age</span>
              <div className={styles.filterAgeInputs}>
                <input type="number" className={styles.filterAgeInput} min={18} max={filters.ageMax}
                  value={filters.ageMin} onChange={e => setFilters(f => ({ ...f, ageMin: +e.target.value }))} />
                <span className={styles.filterAgeDash}>–</span>
                <input type="number" className={styles.filterAgeInput} min={filters.ageMin} max={99}
                  value={filters.ageMax} onChange={e => setFilters(f => ({ ...f, ageMax: +e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Online + photo toggles */}
          <div className={styles.filterBlock}>
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Online only</span>
              <button className={`${styles.filterToggle} ${filters.onlineOnly ? styles.filterToggleOn : ''}`}
                onClick={() => setFilters(f => ({ ...f, onlineOnly: !f.onlineOnly }))}>
                {filters.onlineOnly ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>With photo only</span>
              <button className={`${styles.filterToggle} ${filters.withPhoto ? styles.filterToggleOn : ''}`}
                onClick={() => setFilters(f => ({ ...f, withPhoto: !f.withPhoto }))}>
                {filters.withPhoto ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button className={styles.filterReset}
              onClick={() => setFilters({ ageMin: 18, ageMax: 45, gender: null, lookingFor: null, city: '', onlineOnly: false, withPhoto: true })}>
              Reset
            </button>
            <button className={styles.filterUnderstand} onClick={() => setFilterOpen(false)}>
              Understand
            </button>
          </div>
        </div>
      )}

      {/* ── Priority card — floats from bottom-right ── */}
      {priorityCard && !filterOpen && (
        <div className={styles.priorityCard} onClick={() => { setPriorityCard(null); onSelectSession(priorityCard) }}>
          <div className={styles.priorityAvatar}>
            {(priorityCard.photos?.[0] ?? priorityCard.photoURL)
              ? <img src={priorityCard.photos?.[0] ?? priorityCard.photoURL} alt={priorityCard.displayName} className={styles.priorityAvatarImg} />
              : <span className={styles.priorityAvatarInit}>{(priorityCard.displayName ?? '?')[0].toUpperCase()}</span>
            }
          </div>
          <div className={styles.priorityInfo}>
            <span className={styles.priorityName}>
              {priorityCard.displayName ?? 'Someone'}
              {calcAge(priorityCard.dob) && <span className={styles.priorityAge}> · {calcAge(priorityCard.dob)}</span>}
            </span>
            <span className={styles.priorityJoin}>Join for Chat</span>
          </div>
          <div className={styles.priorityChatIcon}>
            <img src="https://ik.imagekit.io/nepgaxllc/chat_pink-removebg-preview.png" alt="Chat" className={styles.priorityChatImg} />
          </div>
          <button className={styles.priorityClose} onClick={e => { e.stopPropagation(); setPriorityCard(null) }}>✕</button>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className={styles.gridView}>
          {filteredSessions.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji}>{activity.emoji}</span>
              <p>Nobody nearby for {activity.label} yet.</p>
            </div>
          )}
          {filteredSessions.map(s => {
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
          const photo     = s.photos?.[0] ?? s.photoURL ?? null
          const age       = calcAge(s.dob)
          const glow      = MOOD_COLORS[s.moodLight] ?? DEFAULT_GLOW
          const liked     = likedIds.has(s.id) || isLiked(s.id)
          const bursting  = burstIds.has(s.id)
          const isLive    = s.status === 'active'

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
                  boxShadow: `0 0 0 3px ${glow}, 0 0 22px ${glow}66`,
                }}
                onClick={() => onSelectSession(s)}
                aria-label={`View ${s.displayName}`}
              >
                {photo
                  ? <img src={photo} alt={s.displayName} className={styles.bubbleImg} />
                  : <span className={styles.bubbleInit}>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                }
                {isLive && <span className={styles.liveDot} style={{ background: glow, boxShadow: `0 0 6px ${glow}` }} />}
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
            <button className={styles.matchCta} onClick={() => { setMatchSession(null); onSelectSession(matchSession) }}>View Profile</button>
            <button className={styles.matchSkip} onClick={() => setMatchSession(null)}>Maybe later</button>
          </div>
        </div>
      )}

    </div>,
    document.body
  )
}
