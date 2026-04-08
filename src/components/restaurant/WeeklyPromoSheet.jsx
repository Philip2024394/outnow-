import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './WeeklyPromoSheet.module.css'

// ── Named deal days ───────────────────────────────────────────────────────────
export const DEAL_DAYS = {
  0: { name: 'Sunday Blues',     emoji: '😌', color: '#a78bfa', sub: 'Comfort food & chill vibes' },
  1: { name: 'Monday Rush',      emoji: '⚡', color: '#38bdf8', sub: 'Beat the week with a deal'  },
  2: { name: 'Tuesday Twos',     emoji: '2️⃣', color: '#f472b6', sub: 'Two for one, all day long'  },
  3: { name: 'Wednesday Win',    emoji: '🏆', color: '#F5C518', sub: 'Midweek treat, you earned it'},
  4: { name: 'Thirsty Thursday', emoji: '🥤', color: '#fb923c', sub: 'Drinks deals & happy hours'  },
  5: { name: 'Crunchy Friday',   emoji: '🔥', color: '#ff6b35', sub: 'Fried, grilled & bold'       },
  6: { name: 'Saturday Live',    emoji: '🎵', color: '#8DC63F', sub: 'Live music & great food'     },
}

// ── Demo promos (replaced by Supabase when live) ──────────────────────────────
const DEMO_PROMOS = [
  { id: 1, restaurant: 'Nasi Goreng Pak Nasio', day: 1, start: '14:00', end: '17:00', offer: '20% Off',   detail: 'All rice dishes',       color: '#F5C518' },
  { id: 2, restaurant: 'Ayam Geprek Bu Tini',   day: 2, start: '11:00', end: '14:00', offer: 'Free Drink',detail: 'With any main order',   color: '#8DC63F' },
  { id: 3, restaurant: 'Bakso Pak Budi',        day: 3, start: '17:00', end: '21:00', offer: '2 for 1',   detail: 'Select noodle bowls',   color: '#38bdf8' },
  { id: 4, restaurant: 'Warung Seafood Mbak Sri',day: 4, start: '12:00', end: '15:00', offer: '15% Off',  detail: 'Seafood platters',       color: '#fb923c' },
  { id: 5, restaurant: 'Geprek Corner',         day: 5, start: '17:00', end: '22:00', offer: '2 for 1',   detail: 'Ayam geprek, all levels',color: '#ff6b35' },
  { id: 6, restaurant: 'Kopi & Musik Warung',   day: 6, start: '19:00', end: '23:00', offer: 'Free Kopi', detail: 'With any food order',   color: '#a78bfa' },
  { id: 7, restaurant: 'Pisang Goreng Mbok Tum',day: 0, start: '10:00', end: '13:00', offer: '30% Off',   detail: 'All snack items',        color: '#f472b6' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function secondsUntil(timeStr) {
  const d       = new Date()
  const [h, m]  = timeStr.split(':').map(Number)
  const target  = new Date(d); target.setHours(h, m, 0, 0)
  return Math.max(0, Math.floor((target - d) / 1000))
}

function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function getPromoStatus(promo) {
  const today  = new Date().getDay()
  const now    = nowMinutes()
  const start  = parseTime(promo.start)
  const end    = parseTime(promo.end)

  if (promo.day === today) {
    if (now >= end)   return 'expired'
    if (now >= start) return 'active'
    return 'soon'     // today but not yet started
  }

  // Work out if this day has passed this week
  const diff = promo.day - today
  return diff > 0 ? 'upcoming' : 'expired'
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Main component ────────────────────────────────────────────────────────────
export default function WeeklyPromoSheet({ onClose }) {
  const [claimed,   setClaimed]   = useState(new Set())
  const [tick,      setTick]      = useState(0)   // forces re-render every second

  // Tick every second so countdowns stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const handleClaim = useCallback(async (promo) => {
    // Optimistic update
    setClaimed(prev => new Set([...prev, promo.id]))
    // Server-side atomic claim via RPC (validates day/time window server-side)
    if (supabase) {
      const { data } = await supabase.rpc('claim_promo', { p_promo_id: promo.id })
      if (data && !data.ok) {
        // Server rejected — roll back
        setClaimed(prev => { const next = new Set(prev); next.delete(promo.id); return next })
      }
    }
  }, [])

  // Sort: active first, then soon, then upcoming by day, then expired
  const ORDER = { active: 0, soon: 1, upcoming: 2, expired: 3 }
  const sorted = [...DEMO_PROMOS].sort((a, b) => {
    const sa = ORDER[getPromoStatus(a)]
    const sb = ORDER[getPromoStatus(b)]
    if (sa !== sb) return sa - sb
    return a.day - b.day
  })

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.logo}>MAKAN</span>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <h2 className={styles.title}>This Week's Deals</h2>
          <p className={styles.sub}>Tap to claim when unlocked</p>
        </div>

        {/* Promo cards */}
        <div className={styles.list}>
          {sorted.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              status={getPromoStatus(promo)}
              claimed={claimed.has(promo.id)}
              onClaim={() => handleClaim(promo)}
              tick={tick}
            />
          ))}
        </div>

        <p className={styles.footer}>MAKAN by Hangger · Weekly Deals</p>
      </div>
    </div>
  )
}

// ── Promo card ────────────────────────────────────────────────────────────────
function PromoCard({ promo, status, claimed, onClaim, tick }) {
  // tick is passed from parent's setInterval — referencing it here forces
  // this component to re-render every second so countdowns stay live
  void tick

  const dealDay = DEAL_DAYS[promo.day]
  const isLocked = status === 'soon' || status === 'upcoming'
  const isExpired = status === 'expired'
  const isActive = status === 'active'

  const soonSecs = status === 'soon' ? secondsUntil(promo.start) : 0

  return (
    <div
      className={`${styles.card}
        ${isActive  ? styles.cardActive  : ''}
        ${isExpired ? styles.cardExpired : ''}
        ${claimed   ? styles.cardClaimed : ''}
      `}
      style={{ '--accent': promo.color }}
    >
      {/* Card background glow */}
      <div className={styles.cardGlow} style={{ background: `radial-gradient(ellipse at top left, ${promo.color}22 0%, transparent 70%)` }} />

      {/* Top row: deal day name + day label */}
      <div className={styles.cardTop}>
        <span className={styles.dealDayEmoji}>{dealDay.emoji}</span>
        <div className={styles.dealDayInfo}>
          <span className={styles.dealDayName} style={{ color: isExpired ? '#444' : promo.color }}>
            {dealDay.name}
          </span>
          <span className={styles.dealDaySub}>{dealDay.sub}</span>
        </div>
        <span className={styles.dayTag}>{DAY_NAMES[promo.day]}</span>
      </div>

      {/* Offer — big text */}
      <div className={styles.offerWrap}>
        <span className={styles.offerText} style={{ color: isExpired ? '#333' : '#fff' }}>
          {promo.offer}
        </span>
        <span className={styles.offerDetail}>{promo.detail}</span>
      </div>

      {/* Restaurant + time window */}
      <div className={styles.meta}>
        <span className={styles.restaurant}>{promo.restaurant}</span>
        <span className={styles.timeWindow}>🕐 {promo.start} – {promo.end}</span>
      </div>

      {/* Status footer */}
      <div className={styles.cardFooter}>
        {claimed ? (
          <div className={styles.claimedBadge}>✓ Claimed — show to staff</div>
        ) : isActive ? (
          <button className={styles.claimBtn} style={{ background: promo.color }} onClick={onClaim}>
            Claim Now
          </button>
        ) : status === 'soon' ? (
          <div className={styles.lockedRow}>
            <span className={styles.lockIcon}>🔒</span>
            <span className={styles.countdownText}>Unlocks in {fmtCountdown(soonSecs)}</span>
          </div>
        ) : status === 'upcoming' ? (
          <div className={styles.lockedRow}>
            <span className={styles.lockIcon}>🔒</span>
            <span className={styles.countdownText}>Unlocks {DAY_NAMES[promo.day]} at {promo.start}</span>
          </div>
        ) : (
          <div className={styles.expiredLabel}>Expired</div>
        )}
      </div>

      {/* Lock overlay for locked cards */}
      {isLocked && <div className={styles.lockOverlay} />}
    </div>
  )
}
