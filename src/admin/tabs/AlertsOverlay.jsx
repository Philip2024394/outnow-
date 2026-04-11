import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AlertsOverlay.module.css'

const SEV = { CRITICAL: 'CRITICAL', WARNING: 'WARNING', INFO: 'INFO' }

function runChecks() {
  const issues = []
  const env = import.meta.env

  if (!env.VITE_STRIPE_PUBLISHABLE_KEY)
    issues.push({ id: 'stripe_key', sev: SEV.CRITICAL, title: 'Stripe Key Missing', desc: 'VITE_STRIPE_PUBLISHABLE_KEY is not set. All payments will fail.', fix: 'Add to .env: VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...' })
  if (!env.VITE_STRIPE_PRICE_VIBE_BLAST)
    issues.push({ id: 'vibe_blast_price', sev: SEV.WARNING, title: 'Vibe Blast Price ID Missing', desc: 'VITE_STRIPE_PRICE_VIBE_BLAST is empty — Vibe Blasting checkout will fail.', fix: 'Create a one-time $1.99 product in Stripe → copy price ID to .env' })
  if (!env.VITE_STRIPE_PRICE_SOCIAL_BOOST)
    issues.push({ id: 'social_boost', sev: SEV.WARNING, title: 'Social Boost Price Missing', desc: 'VITE_STRIPE_PRICE_SOCIAL_BOOST is not set — subscription checkout will fail.', fix: 'Add Social Boost price ID from Stripe dashboard to .env' })
  if (!env.VITE_STRIPE_PRICE_MAKER_LISTING)
    issues.push({ id: 'maker_listing', sev: SEV.WARNING, title: 'Maker Listing Price Missing', desc: 'VITE_STRIPE_PRICE_MAKER_LISTING is not set.', fix: 'Add Maker Listing price ID to .env' })
  if (!env.VITE_STRIPE_PRICE_SPOT_USER_MONTHLY)
    issues.push({ id: 'spot_price', sev: SEV.INFO, title: 'Map Spot Prices Missing', desc: 'VITE_STRIPE_PRICE_SPOT_USER_MONTHLY and related keys are not set.', fix: 'Add spot subscription prices from Stripe to .env' })
  if (!env.VITE_MAPBOX_TOKEN)
    issues.push({ id: 'mapbox', sev: SEV.CRITICAL, title: 'Mapbox Token Missing', desc: 'VITE_MAPBOX_TOKEN is not set — all maps will fail to render.', fix: 'Add your Mapbox token to .env: VITE_MAPBOX_TOKEN=pk.eyJ1...' })

  return issues
}

const SEV_CONFIG = {
  CRITICAL: { color: '#FF4444', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.3)', icon: '🔴', label: 'CRITICAL' },
  WARNING:  { color: '#FFB800', bg: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.3)',  icon: '🟡', label: 'WARNING'  },
  INFO:     { color: '#00E5FF', bg: 'rgba(0,229,255,0.06)',  border: 'rgba(0,229,255,0.2)',  icon: '🔵', label: 'INFO'     },
}

export default function AlertsOverlay({ visible, onClose, onCountChange }) {
  const [issues,    setIssues]    = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [dbStatus,  setDbStatus]  = useState('checking') // 'ok' | 'error' | 'checking'
  const [lastCheck, setLastCheck] = useState(null)
  const [copied,    setCopied]    = useState(null)

  const refresh = useCallback(async () => {
    const found = runChecks()

    // Supabase ping
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1)
      if (error) {
        setDbStatus('error')
        found.unshift({ id: 'db_conn', sev: SEV.CRITICAL, title: 'Database Connection Failed', desc: `Supabase returned error: ${error.message}`, fix: 'Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' })
      } else {
        setDbStatus('ok')
      }
    } catch {
      setDbStatus('error')
      found.unshift({ id: 'db_conn', sev: SEV.CRITICAL, title: 'Database Unreachable', desc: 'Cannot connect to Supabase. App is offline.', fix: 'Check network and Supabase project status at supabase.com' })
    }

    setIssues(found)
    setLastCheck(new Date())
    const active = found.filter(i => !dismissed.has(i.id))
    onCountChange?.(active.length)
  }, [dismissed, onCountChange])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [refresh])

  const activeIssues = issues.filter(i => !dismissed.has(i.id))
  const criticals = activeIssues.filter(i => i.sev === SEV.CRITICAL)
  const hasCritical = criticals.length > 0

  const copyFix = (fix, id) => {
    navigator.clipboard.writeText(fix).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!visible) return null

  return (
    <div className={`${styles.overlay} ${hasCritical ? styles.overlayBlocking : ''}`}>
      {hasCritical && <div className={styles.scanlines} />}

      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>{hasCritical ? '🚨' : '⚠️'}</span>
            <div>
              <h2 className={styles.title}>System Alerts</h2>
              <p className={styles.sub}>
                {activeIssues.length === 0
                  ? '✅ All systems operational'
                  : `${activeIssues.length} issue${activeIssues.length > 1 ? 's' : ''} detected · Last checked ${lastCheck?.toLocaleTimeString() ?? '…'}`
                }
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.refreshBtn} onClick={refresh}>↻ Refresh</button>
            <button className={styles.closeBtn} onClick={onClose} title={hasCritical ? 'Close (critical issues remain)' : 'Close'}>✕</button>
          </div>
        </div>

        {/* DB status bar */}
        <div className={styles.statusBar}>
          <div className={`${styles.statusPill} ${dbStatus === 'ok' ? styles.pillGreen : dbStatus === 'error' ? styles.pillRed : styles.pillGray}`}>
            <span className={styles.statusDot} />
            Database: {dbStatus === 'ok' ? 'Connected' : dbStatus === 'error' ? 'ERROR' : 'Checking…'}
          </div>
          <div className={`${styles.statusPill} ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? styles.pillGreen : styles.pillRed}`}>
            <span className={styles.statusDot} />
            Stripe: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'NOT SET'}
          </div>
          <div className={`${styles.statusPill} ${import.meta.env.VITE_MAPBOX_TOKEN ? styles.pillGreen : styles.pillRed}`}>
            <span className={styles.statusDot} />
            Mapbox: {import.meta.env.VITE_MAPBOX_TOKEN ? 'OK' : 'NOT SET'}
          </div>
          <div className={styles.statusPill + ' ' + styles.pillGreen}>
            <span className={styles.statusDot} />
            React: Running
          </div>
        </div>

        <div className={styles.issueList}>
          {activeIssues.length === 0 && (
            <div className={styles.allClear}>
              <span className={styles.allClearIcon}>✅</span>
              <span className={styles.allClearText}>No issues detected. App is healthy.</span>
            </div>
          )}

          {activeIssues.map(issue => {
            const cfg = SEV_CONFIG[issue.sev]
            return (
              <div
                key={issue.id}
                className={styles.issueCard}
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className={styles.issueTop}>
                  <div className={styles.issueMeta}>
                    <span className={styles.issueSev} style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className={styles.issueTitle}>{issue.title}</span>
                  </div>
                  {issue.sev !== SEV.CRITICAL && (
                    <button className={styles.dismissBtn} onClick={() => setDismissed(p => new Set([...p, issue.id]))}>
                      Dismiss
                    </button>
                  )}
                </div>
                <p className={styles.issueDesc}>{issue.desc}</p>
                <div className={styles.fixRow}>
                  <span className={styles.fixLabel}>Fix:</span>
                  <code className={styles.fixCode}>{issue.fix}</code>
                  <button className={styles.copyBtn} style={{ borderColor: cfg.border, color: cfg.color }}
                    onClick={() => copyFix(issue.fix, issue.id)}>
                    {copied === issue.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {hasCritical && (
          <div className={styles.criticalFooter}>
            <span className={styles.criticalWarning}>
              ⛔ CRITICAL issues detected — app features will not work until resolved.
            </span>
            <span className={styles.criticalHint}>Fix the issues above, then click ↻ Refresh to re-check.</span>
          </div>
        )}
      </div>
    </div>
  )
}
