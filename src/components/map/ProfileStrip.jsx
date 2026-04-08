import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './ProfileStrip.module.css'

const HOLD_MS = 3000
const CIRCUMFERENCE = 2 * Math.PI * 22

const BUTTONS = [
  { filter: 'now',    label: 'Hangger', color: '#8DC63F', glow: 'rgba(141,198,63,0.45)' },
  { filter: 'invite', label: 'Hanging', color: '#F5C518', glow: 'rgba(245,197,24,0.45)' },
  { filter: 'haggle', label: 'Haggling', color: '#E8890C', glow: 'rgba(232,137,12,0.45)' },
]

function getTodayKey(filter) { return `boost_${filter}_${new Date().toDateString()}` }
function hasUsedBoost(filter) { return !!localStorage.getItem(getTodayKey(filter)) }
function markBoostUsed(filter) { localStorage.setItem(getTodayKey(filter), '1') }

export default function ProfileStrip({
  outNowCount    = 0,
  inviteOutCount = 0,
  businessCount  = 0,
  newNowCount    = 0,
  newInviteCount = 0,
  onBoost,
  onSelectFilter,
  activeFilter = null,
  onHanggle,
  hanggleActive = false,
}) {
  const counts    = { now: outNowCount, invite: inviteOutCount, haggle: businessCount }
  const newCounts = { now: newNowCount, invite: newInviteCount, haggle: 0 }

  const [holding, setHolding]     = useState(null)
  const [progress, setProgress]   = useState(0)
  const [fired, setFired]         = useState(null)
  const [boostUsed, setBoostUsed] = useState({
    now: hasUsedBoost('now'), invite: hasUsedBoost('invite'), haggle: false,
  })

  const rafRef      = useRef(null)
  const startRef    = useRef(null)
  const holdingRef  = useRef(null)

  const cancelHold = useCallback(() => {
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
      const p = Math.min((now - startRef.current) / HOLD_MS, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const strokeOffset = CIRCUMFERENCE * (1 - progress)

  const handleTap = (filter) => {
    if (filter === 'haggle') { onHanggle?.(); return }
    onSelectFilter?.(activeFilter === filter ? null : filter)
  }

  const isActive = (filter) =>
    filter === 'haggle' ? hanggleActive : activeFilter === filter

  return (
    <div className={styles.bar}>
      <div className={styles.pill}>
        {BUTTONS.map(({ filter, label, color, glow }) => {
          const active    = isActive(filter)
          const isHolding = holding === filter
          const isFired   = fired === filter
          const hasNew    = newCounts[filter] > 0

          return (
            <button
              key={filter}
              className={`${styles.btn} ${active ? styles.btnActive : ''} ${isFired ? styles.btnFired : ''}`}
              style={{
                '--btn-color': color,
                '--btn-glow':  glow,
              }}
              onClick={() => { if (!isHolding) handleTap(filter) }}
              onPointerDown={() => startHold(filter)}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              aria-label={label}
            >
              {/* Boost charge ring */}
              {(isHolding || isFired) && (
                <svg className={styles.ring} viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="22"
                    fill="none"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth="2.5"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={isFired ? 0 : strokeOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                    className={isFired ? styles.ringFired : ''}
                  />
                </svg>
              )}

              {/* New-activity pulse dot */}
              {hasNew && !isHolding && (
                <span className={styles.pulse} />
              )}

              <span className={styles.count}>{counts[filter]}</span>
              <span className={styles.label}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
