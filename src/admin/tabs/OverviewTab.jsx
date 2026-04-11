import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './OverviewTab.module.css'

// ── Animated counter ─────────────────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const raf = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ── SVG Line Chart ────────────────────────────────────────────────
function LineChart({ data, color = '#00E5FF', label }) {
  const W = 280, H = 80
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = 8 + (i / (data.length - 1)) * (W - 16)
    const y = H - 8 - ((v - min) / range) * (H - 16)
    return [x, y]
  })
  const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath  = `${linePath} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
  const gradId = `grad_${label?.replace(/\s/g, '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.lineChart}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" className={styles.linePath} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.8" />)}
    </svg>
  )
}

// ── SVG Bar Chart ─────────────────────────────────────────────────
function BarChart({ data, colors }) {
  const W = 340, H = 120
  const max = Math.max(...data.map(d => d.value))
  const barW = (W - 20) / data.length - 6
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.barChart}>
      {data.map((d, i) => {
        const bh = ((d.value / max) * (H - 28))
        const x  = 10 + i * ((W - 20) / data.length) + 3
        const y  = H - 18 - bh
        const c  = colors[i % colors.length]
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={c} opacity="0.8" rx="3" className={styles.bar} style={{ '--delay': `${i * 0.08}s` }} />
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fill={c}>{d.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Ring Chart ────────────────────────────────────────────────────
function RingChart({ segments }) {
  const R = 44, CX = 56, CY = 56, stroke = 14
  const circumference = 2 * Math.PI * R
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 0
  return (
    <svg viewBox="0 0 112 112" className={styles.ringChart}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference
        const gap  = circumference - dash
        const el = (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 1s ease', transform: 'rotate(-90deg)', transformOrigin: '56px 56px' }}
          />
        )
        offset += dash
        return el
      })}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{total.toLocaleString()}</text>
      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)">TOTAL</text>
    </svg>
  )
}

// ── Demo data helpers ────────────────────────────────────────────
function seedData(n, base, variance, day = 0) {
  return Array.from({ length: n }, (_, i) => {
    const seed = (i * 37 + day * 13) % 100
    return Math.max(0, base + Math.floor((seed / 100) * variance - variance / 2))
  })
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`)

export default function OverviewTab() {
  const [stats, setStats] = useState({ users: 0, active: 0, revenue: 0, rides: 0 })
  const [realStats, setRealStats] = useState(null)
  const [feed, setFeed] = useState([])

  const totalUsers  = useCountUp(realStats?.users  ?? 4821)
  const activeNow   = useCountUp(realStats?.active  ?? 127)
  const revenueToday = useCountUp(realStats?.revenue ?? 389)
  const ridesToday  = useCountUp(realStats?.rides   ?? 63)

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]).then(([usersRes, activeRes]) => {
      setRealStats(prev => ({
        ...prev,
        users:  usersRes.count  ?? 4821,
        active: activeRes.count ?? 127,
      }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const events = [
      { t: '0s ago',  icon: '💕', msg: 'New match: Ava & Jordan in Jakarta' },
      { t: '12s ago', icon: '🛍️', msg: 'Market listing uploaded: Vintage Watch' },
      { t: '28s ago', icon: '🚗', msg: 'Ride completed: Ravi → SCBD (Rp 45k)' },
      { t: '44s ago', icon: '🍽️', msg: 'Restaurant booking: Table for 3 @ Nusantara' },
      { t: '1m ago',  icon: '⚡', msg: 'Vibe Blast purchased by @maya_patel' },
      { t: '2m ago',  icon: '💬', msg: '14 new chat opens in Dating section' },
      { t: '3m ago',  icon: '🎯', msg: 'Profile view spike: +340% Jakarta' },
      { t: '5m ago',  icon: '👤', msg: 'New user registration: Kai Thompson' },
    ]
    setFeed(events)
    const t = setInterval(() => {
      setFeed(prev => {
        const copy = [...prev]
        copy.unshift({ t: 'just now', icon: ['💕','🚗','👤','💬'][Math.floor(Math.random()*4)], msg: 'Live activity update' })
        return copy.slice(0, 10)
      })
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const weeklyUsers    = seedData(7, 85, 60)
  const weeklyRevenue  = seedData(7, 250, 180)
  const hourlyActive   = seedData(24, 40, 60)

  const barData = [
    { label: 'Dating',  value: 1840, },
    { label: 'Market',  value: 1120, },
    { label: 'Food',    value: 890,  },
    { label: 'Rides',   value: 620,  },
    { label: 'Vibes',   value: 351,  },
  ]

  const ringSegments = [
    { label: 'Dating',  value: 38, color: '#F472B6' },
    { label: 'Market',  value: 23, color: '#A855F7' },
    { label: 'Food',    value: 18, color: '#F97316' },
    { label: 'Rides',   value: 13, color: '#00E5FF' },
    { label: 'Vibes',   value: 8,  color: '#00FF9D' },
  ]

  return (
    <div className={styles.page}>

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
        {[
          { label: 'Total Users',   value: totalUsers,   unit: '',    color: '#00E5FF', icon: '👥', trend: '+12%' },
          { label: 'Active Now',    value: activeNow,    unit: '',    color: '#00FF9D', icon: '🟢', trend: '+5%'  },
          { label: 'Revenue Today', value: `$${revenueToday}`, unit: '', color: '#F472B6', icon: '💰', trend: '+28%' },
          { label: 'Rides Today',   value: ridesToday,   unit: '',    color: '#A855F7', icon: '🚗', trend: '+9%'  },
        ].map(s => (
          <div key={s.label} className={styles.statCard} style={{ '--accent': s.color }}>
            <div className={styles.statTop}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statTrend}>{s.trend} ↑</span>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statBar}>
              <div className={styles.statBarFill} style={{ background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>

        {/* Weekly signups */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>User Signups — 7 Day</span>
            <span className={styles.chartSub}>New registrations</span>
          </div>
          <LineChart data={weeklyUsers} color="#00E5FF" label="signups" />
          <div className={styles.chartLabels}>
            {DAYS.map(d => <span key={d} className={styles.chartLabel}>{d}</span>)}
          </div>
        </div>

        {/* Weekly revenue */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Revenue — 7 Day ($)</span>
            <span className={styles.chartSub}>All payment sources</span>
          </div>
          <LineChart data={weeklyRevenue} color="#F472B6" label="revenue" />
          <div className={styles.chartLabels}>
            {DAYS.map(d => <span key={d} className={styles.chartLabel}>{d}</span>)}
          </div>
        </div>

        {/* Category bar */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Activity by Feature</span>
            <span className={styles.chartSub}>Sessions this week</span>
          </div>
          <BarChart data={barData} colors={['#F472B6','#A855F7','#F97316','#00E5FF','#00FF9D']} />
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className={styles.bottomRow}>

        {/* Ring chart */}
        <div className={styles.ringCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Feature Usage Split</span>
            <span className={styles.chartSub}>% of total sessions</span>
          </div>
          <div className={styles.ringWrap}>
            <RingChart segments={ringSegments} />
            <div className={styles.ringLegend}>
              {ringSegments.map(s => (
                <div key={s.label} className={styles.legendRow}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendLabel}>{s.label}</span>
                  <span className={styles.legendVal} style={{ color: s.color }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live feed */}
        <div className={styles.feedCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>⚡ Live Activity Feed</span>
            <span className={styles.chartSub + ' ' + styles.liveDot}>LIVE</span>
          </div>
          <div className={styles.feedList}>
            {feed.map((e, i) => (
              <div key={i} className={styles.feedItem} style={{ opacity: 1 - i * 0.07 }}>
                <span className={styles.feedIcon}>{e.icon}</span>
                <span className={styles.feedMsg}>{e.msg}</span>
                <span className={styles.feedTime}>{e.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly active */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Active Users — 24h</span>
            <span className={styles.chartSub}>Hourly breakdown</span>
          </div>
          <LineChart data={hourlyActive} color="#00FF9D" label="hourly" />
          <div className={styles.chartLabels}>
            {[0,4,8,12,16,20].map(h => <span key={h} className={styles.chartLabel}>{h}h</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}
