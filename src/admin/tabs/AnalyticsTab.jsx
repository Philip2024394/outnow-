import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AnalyticsTab.module.css'

function seed(i, base, v) { return Math.max(0, base + Math.floor(((i * 37) % 100 / 100) * v - v / 2)) }

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const WEEKS = ['Wk1','Wk2','Wk3','Wk4']

function MiniBar({ value, max, color }) {
  const pct = (value / max) * 100
  return (
    <div className={styles.miniBarTrack}>
      <div className={styles.miniBarFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function StatRow({ icon, label, value, sub, color, trend }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.rowIcon}>{icon}</span>
      <div className={styles.rowBody}>
        <div className={styles.rowTop}>
          <span className={styles.rowLabel}>{label}</span>
          <span className={styles.rowValue} style={{ color }}>{value.toLocaleString()}</span>
        </div>
        <div className={styles.rowSub}>
          <span>{sub}</span>
          {trend && <span className={styles.rowTrend} style={{ color: trend > 0 ? '#00FF9D' : '#FF4444' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>}
        </div>
        <MiniBar value={value} max={50000} color={color} />
      </div>
    </div>
  )
}

export default function AnalyticsTab() {
  const [range,   setRange]   = useState('7d')
  const [metrics, setMetrics] = useState({
    whatsappClicks: 0, chatOpens: 0, profileViews: 0,
    datingSwipes: 0,   matches: 0,   rideRequests: 0,
    marketViews: 0,    checkouts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (!supabase) { setLoading(false); return }
    // Try to pull from Supabase events table — falls back to realistic demo
    supabase.from('analytics_events')
      .select('event_type, count', { count: 'exact' })
      .then(({ data }) => {
        if (data?.length) {
          const m = {}
          data.forEach(r => { m[r.event_type] = r.count })
          setMetrics(prev => ({ ...prev, ...m }))
        } else {
          // Demo data
          setMetrics({
            whatsappClicks: 3847,
            chatOpens:      12904,
            profileViews:   41320,
            datingSwipes:   28140,
            matches:        1862,
            rideRequests:   4230,
            marketViews:    9410,
            checkouts:      623,
          })
        }
        setLoading(false)
      }).catch(() => {
        setMetrics({
          whatsappClicks: 3847,  chatOpens: 12904,
          profileViews:   41320, datingSwipes: 28140,
          matches:        1862,  rideRequests: 4230,
          marketViews:    9410,  checkouts: 623,
        })
        setLoading(false)
      })
  }, [range])

  // Bar chart data for WhatsApp clicks per day
  const waByDay   = DAYS.map((d, i)  => ({ label: d, value: seed(i, 550, 300) }))
  const chatByDay = DAYS.map((d, i)  => ({ label: d, value: seed(i+3, 1800, 600) }))
  const convRate  = ((metrics.checkouts / metrics.profileViews) * 100).toFixed(2)
  const matchRate = ((metrics.matches / metrics.datingSwipes) * 100).toFixed(1)

  const waMax   = Math.max(...waByDay.map(d => d.value))
  const chatMax = Math.max(...chatByDay.map(d => d.value))

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h2 className={styles.pageTitle}>📊 Analytics</h2>
        <div className={styles.rangeBar}>
          {['24h','7d','30d','90d'].map(r => (
            <button key={r} className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      {/* ── Key metrics grid ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard} style={{ '--c': '#25D366' }}>
          <div className={styles.metricIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.114 1.532 5.836L.036 23.964 6.3 22.492A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
          </div>
          <div className={styles.metricVal}>{metrics.whatsappClicks.toLocaleString()}</div>
          <div className={styles.metricLabel}>WhatsApp Clicks</div>
          <div className={styles.metricSub}>Users tapped "WhatsApp" on profiles</div>
        </div>

        <div className={styles.metricCard} style={{ '--c': '#00E5FF' }}>
          <div className={styles.metricIcon}>💬</div>
          <div className={styles.metricVal}>{metrics.chatOpens.toLocaleString()}</div>
          <div className={styles.metricLabel}>Chat Opens</div>
          <div className={styles.metricSub}>In-app chat sessions started</div>
        </div>

        <div className={styles.metricCard} style={{ '--c': '#F472B6' }}>
          <div className={styles.metricIcon}>👁️</div>
          <div className={styles.metricVal}>{metrics.profileViews.toLocaleString()}</div>
          <div className={styles.metricLabel}>Profile Views</div>
          <div className={styles.metricSub}>Unique card opens across all tabs</div>
        </div>

        <div className={styles.metricCard} style={{ '--c': '#00FF9D' }}>
          <div className={styles.metricIcon}>💕</div>
          <div className={styles.metricVal}>{metrics.matches.toLocaleString()}</div>
          <div className={styles.metricLabel}>Mutual Matches</div>
          <div className={styles.metricSub}>Match rate: {matchRate}%</div>
        </div>

        <div className={styles.metricCard} style={{ '--c': '#A855F7' }}>
          <div className={styles.metricIcon}>🏍️</div>
          <div className={styles.metricVal}>{metrics.rideRequests.toLocaleString()}</div>
          <div className={styles.metricLabel}>Ride Requests</div>
          <div className={styles.metricSub}>Bike + Taxi combined</div>
        </div>

        <div className={styles.metricCard} style={{ '--c': '#FFB800' }}>
          <div className={styles.metricIcon}>💳</div>
          <div className={styles.metricVal}>{metrics.checkouts.toLocaleString()}</div>
          <div className={styles.metricLabel}>Checkouts</div>
          <div className={styles.metricSub}>Conversion rate: {convRate}%</div>
        </div>
      </div>

      {/* ── WhatsApp by day ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>WhatsApp Clicks — Daily</span>
            <span className={styles.chartSub} style={{ color: '#25D366' }}>This Week</span>
          </div>
          <div className={styles.dayBars}>
            {waByDay.map((d, i) => (
              <div key={i} className={styles.dayBar}>
                <span className={styles.dayVal} style={{ color: '#25D366' }}>{d.value}</span>
                <div className={styles.dayBarTrack}>
                  <div className={styles.dayBarFill}
                    style={{ height: `${(d.value / waMax) * 100}%`, background: '#25D366', animationDelay: `${i * 0.1}s` }} />
                </div>
                <span className={styles.dayLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Chat Opens — Daily</span>
            <span className={styles.chartSub} style={{ color: '#00E5FF' }}>This Week</span>
          </div>
          <div className={styles.dayBars}>
            {chatByDay.map((d, i) => (
              <div key={i} className={styles.dayBar}>
                <span className={styles.dayVal} style={{ color: '#00E5FF' }}>{d.value}</span>
                <div className={styles.dayBarTrack}>
                  <div className={styles.dayBarFill}
                    style={{ height: `${(d.value / chatMax) * 100}%`, background: '#00E5FF', animationDelay: `${i * 0.1}s` }} />
                </div>
                <span className={styles.dayLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Conversion Funnel</span>
            <span className={styles.chartSub}>Dating flow</span>
          </div>
          <div className={styles.funnel}>
            {[
              { label: 'Profile Views',   value: metrics.profileViews, color: '#00E5FF' },
              { label: 'Card Taps',       value: Math.floor(metrics.profileViews * 0.4), color: '#A855F7' },
              { label: '"Let\'s Connect"',value: Math.floor(metrics.profileViews * 0.18), color: '#F472B6' },
              { label: 'Chat Opens',      value: metrics.chatOpens, color: '#FFB800' },
              { label: 'Matches',         value: metrics.matches, color: '#00FF9D' },
            ].map((step, i, arr) => (
              <div key={i} className={styles.funnelStep}>
                <div className={styles.funnelBar} style={{
                  width: `${(step.value / arr[0].value) * 100}%`,
                  background: step.color, opacity: 0.8,
                }} />
                <div className={styles.funnelMeta}>
                  <span className={styles.funnelLabel}>{step.label}</span>
                  <span className={styles.funnelVal} style={{ color: step.color }}>{step.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detailed rows ── */}
      <div className={styles.detailCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Engagement Breakdown</span>
          <span className={styles.chartSub}>All channels · {range}</span>
        </div>
        <div className={styles.statRows}>
          <StatRow icon="💬" label="Chat Opens"       value={metrics.chatOpens}     sub="In-app messaging sessions"     color="#00E5FF" trend={18}  />
          <StatRow icon="📱" label="WhatsApp Clicks"  value={metrics.whatsappClicks} sub="External redirect taps"       color="#25D366" trend={7}   />
          <StatRow icon="👁️" label="Profile Views"    value={metrics.profileViews}   sub="Card opens (dating + market)" color="#F472B6" trend={24}  />
          <StatRow icon="❤️" label="Dating Swipes"    value={metrics.datingSwipes}   sub="Likes sent"                   color="#F472B6" trend={12}  />
          <StatRow icon="🛍️" label="Market Views"     value={metrics.marketViews}    sub="Product card opens"           color="#A855F7" trend={-3}  />
          <StatRow icon="🚗" label="Ride Requests"    value={metrics.rideRequests}   sub="Bike + Taxi combined"         color="#FFB800" trend={9}   />
          <StatRow icon="💳" label="Checkout Starts"  value={metrics.checkouts}      sub="Stripe checkout initiated"    color="#00FF9D" trend={31}  />
        </div>
      </div>
    </div>
  )
}
