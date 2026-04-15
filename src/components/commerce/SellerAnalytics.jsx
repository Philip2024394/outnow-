/**
 * SellerAnalytics — revenue charts, conversion funnel, top products.
 * Opens from seller dashboard.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './SellerAnalytics.module.css'

// Demo data
const DEMO_REVENUE = [
  { day: 'Mon', amount: 450000 },
  { day: 'Tue', amount: 320000 },
  { day: 'Wed', amount: 780000 },
  { day: 'Thu', amount: 550000 },
  { day: 'Fri', amount: 920000 },
  { day: 'Sat', amount: 1200000 },
  { day: 'Sun', amount: 680000 },
]

const DEMO_FUNNEL = [
  { label: 'Product Views', count: 1240, pct: 100 },
  { label: 'Added to Cart', count: 186, pct: 15 },
  { label: 'Checkout Started', count: 94, pct: 7.6 },
  { label: 'Payment Sent', count: 67, pct: 5.4 },
  { label: 'Order Complete', count: 52, pct: 4.2 },
]

const DEMO_TOP = [
  { name: 'Leather Crossbody Bag', sold: 18, revenue: 21600000 },
  { name: 'Slim Card Wallet', sold: 14, revenue: 4480000 },
  { name: 'Wireless Earbuds Pro', sold: 12, revenue: 4200000 },
  { name: 'Bifold Leather Wallet', sold: 8, revenue: 3600000 },
  { name: 'Leather Keychain', sold: 22, revenue: 2090000 },
]

function fmtIDR(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

export default function SellerAnalytics({ open, onClose }) {
  const [period, setPeriod] = useState('7d')

  if (!open) return null

  const maxRev = Math.max(...DEMO_REVENUE.map(d => d.amount))
  const totalRev = DEMO_REVENUE.reduce((s, d) => s + d.amount, 0)

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>Analytics</span>
          <div className={styles.periodTabs}>
            {['7d', '30d', '90d'].map(p => (
              <button key={p} className={`${styles.periodTab} ${period === p ? styles.periodActive : ''}`} onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.body}>
          {/* Revenue stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statVal}>Rp {fmtIDR(totalRev)}</span>
              <span className={styles.statLabel}>Revenue</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>52</span>
              <span className={styles.statLabel}>Orders</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>4.2%</span>
              <span className={styles.statLabel}>Conversion</span>
            </div>
          </div>

          {/* Revenue chart */}
          <div className={styles.chartSection}>
            <span className={styles.chartTitle}>Revenue (last 7 days)</span>
            <div className={styles.chart}>
              {DEMO_REVENUE.map(d => (
                <div key={d.day} className={styles.chartBar}>
                  <div className={styles.barFill} style={{ height: `${(d.amount / maxRev) * 100}%` }} />
                  <span className={styles.barLabel}>{d.day}</span>
                  <span className={styles.barValue}>{fmtIDR(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion funnel */}
          <div className={styles.chartSection}>
            <span className={styles.chartTitle}>Conversion Funnel</span>
            <div className={styles.funnel}>
              {DEMO_FUNNEL.map((f, i) => (
                <div key={i} className={styles.funnelRow}>
                  <div className={styles.funnelBar} style={{ width: `${f.pct}%` }} />
                  <div className={styles.funnelInfo}>
                    <span className={styles.funnelLabel}>{f.label}</span>
                    <span className={styles.funnelCount}>{f.count} ({f.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          <div className={styles.chartSection}>
            <span className={styles.chartTitle}>Top Products</span>
            {DEMO_TOP.map((p, i) => (
              <div key={i} className={styles.topRow}>
                <span className={styles.topRank}>#{i + 1}</span>
                <span className={styles.topName}>{p.name}</span>
                <div className={styles.topRight}>
                  <span className={styles.topSold}>{p.sold} sold</span>
                  <span className={styles.topRev}>Rp {fmtIDR(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
