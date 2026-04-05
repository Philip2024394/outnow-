import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './ProfileStrip.module.css'

const HOLD_MS = 3000
const CIRCUMFERENCE = 2 * Math.PI * 22 // radius 22

const BUTTONS = [
  { filter: 'now',    label: 'Out Now',    color: '#8DC63F' },
  { filter: 'invite', label: 'Invite Out', color: '#F5C518' },
]

// Read / write daily boost usage from localStorage
function getTodayKey(filter) {
  return `boost_${filter}_${new Date().toDateString()}`
}
function hasUsedBoost(filter) {
  return !!localStorage.getItem(getTodayKey(filter))
}
function markBoostUsed(filter) {
  localStorage.setItem(getTodayKey(filter), '1')
}

export default function ProfileStrip({
  outNowCount    = 0,
  inviteOutCount = 0,
  newNowCount    = 0,
  newInviteCount = 0,
  onBoost,          // onBoost(filter) — parent handles go-live + boost logic
  onSelectFilter,   // onSelectFilter(filter|null) — tap to pin-filter the map
  activeFilter = null,
}) {
  const counts    = { now: outNowCount, invite: inviteOutCount }
  const newCounts = { now: newNowCount, invite: newInviteCount }

  const [holding, setHolding]     = useState(null)   // filter key being held
  const [progress, setProgress]   = useState(0)      // 0–1
  const [fired, setFired]         = useState(null)   // filter that just fired (flash)
  const [boostUsed, setBoostUsed] = useState({
    now: hasUsedBoost('now'), invite: hasUsedBoost('invite'),
  })

  const holdTimer   = useRef(null)
  const rafRef      = useRef(null)
  const startRef    = useRef(null)
  const holdingRef  = useRef(null)

  const cancelHold = useCallback(() => {
    clearTimeout(holdTimer.current)
    cancelAnimationFrame(rafRef.current)
    setHolding(null)
    setProgress(0)
    holdingRef.current = null
  }, [])

  const startHold = useCallback((filter) => {
    if (boostUsed[filter]) return
    holdingRef.current = filter
    setHolding(filter)
    startRef.current = performance.now()

    const tick = (now) => {
      if (!holdingRef.current) return
      const elapsed = now - startRef.current
      const p = Math.min(elapsed / HOLD_MS, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Fired!
        const f = holdingRef.current
        markBoostUsed(f)
        setBoostUsed(prev => ({ ...prev, [f]: true }))
        setFired(f)
        setHolding(null)
        setProgress(0)
        holdingRef.current = null
        onBoost?.(f)
        setTimeout(() => setFired(null), 1200)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [boostUsed, onBoost])

  // Clean up on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    clearTimeout(holdTimer.current)
  }, [])

  const strokeOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className={styles.strip}>
      <div className={styles.discRow}>
        {BUTTONS.map(({ filter, label, color }) => {
          const isHolding = holding === filter
          const isFired   = fired === filter
          const used      = boostUsed[filter]

          return (
            <button
              key={filter}
              className={`${styles.colorBtn} ${isFired ? styles.colorBtnFired : ''} ${activeFilter === filter ? styles.colorBtnActive : ''}`}
              style={{ background: color }}
              onClick={() => { if (!isHolding) onSelectFilter?.(activeFilter === filter ? null : filter) }}
              onPointerDown={() => startHold(filter)}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
            >
              {/* Charging ring SVG */}
              {(isHolding || isFired) && (
                <svg className={styles.ringsvg} viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="22"
                    fill="none"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="3"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={isFired ? 0 : strokeOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                    className={isFired ? styles.ringFired : ''}
                  />
                </svg>
              )}

              {used && !isHolding && !isFired && (
                <span className={styles.boostUsedDot} style={{ background: 'rgba(255,255,255,0.6)' }} />
              )}

              {newCounts[filter] > 0 && (
                <span className={styles.notifBadge}>{newCounts[filter] > 9 ? '9+' : newCounts[filter]}</span>
              )}

              <span className={styles.colorBtnCount}>{counts[filter]}</span>
              <span className={styles.colorBtnLabel}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
