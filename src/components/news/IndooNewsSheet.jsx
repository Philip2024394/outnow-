import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './IndooNewsSheet.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

// ── Same time-based backgrounds as location / onboarding screens ──
const BG_IMAGES = {
  sunrise: 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  day:     'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  sunset:  'https://ik.imagekit.io/nepgaxllc/Untitledfsdfdfdf33dsdsd.png?updatedAt=1775555858291',
  night:   'https://ik.imagekit.io/nepgaxllc/Untitledfsdf.png?updatedAt=1775555383465',
}

function getWIBHour() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utcMs + 7 * 3_600_000).getHours() + new Date(utcMs + 7 * 3_600_000).getMinutes() / 60
}
function getBGPhase(h) {
  if (h >= 5   && h < 7.5)  return 'sunrise'
  if (h >= 7.5 && h < 17.5) return 'day'
  if (h >= 17.5 && h < 19.5) return 'sunset'
  return 'night'
}
function getSunsetProgress(h) {
  if (h < 17.5 || h >= 19.5) return 0
  return (h - 17.5) / 2
}

const SECTIONS = {
  weekly:       { label: 'Weekly Recap',  color: '#8DC63F', bg: 'rgba(141,198,63,0.08)'  },
  marketplace:  { label: 'Marketplace',   color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  street:       { label: 'Street Food',   color: '#EAB308', bg: 'rgba(234,179,8,0.08)'   },
  dating:       { label: 'Dating',        color: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
  announcement: { label: 'From Indoo',  color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const DEMO_POSTS = [
  {
    id: 'd1', section: 'weekly', emoji: '📰',
    title: 'Indoo had its biggest week yet',
    body: 'Over 1,200 sessions went live across Indonesia this week — a new record. Jakarta and Bali led the way with the most active users per city.',
    stat_label: 'Sessions This Week', stat_value: '1,247',
    highlight: null,
    updated_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'd2', section: 'marketplace', emoji: '🛍️',
    title: 'Marketplace traffic up 34% this week',
    body: 'Batik fabric, handmade jewellery, and artisan coffee beans were the three most searched products. Saturday afternoon had the highest browse activity.',
    stat_label: 'Products Searched', stat_value: '892',
    highlight: '🏆 Top Seller of the Week: Budi Batik Studio · 38 orders',
    updated_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 'd3', section: 'street', emoji: '🍜',
    title: 'Street food orders hit a new high',
    body: 'Mie Goreng and Nasi Padang dominated orders this week. Friday evening between 6–8pm was the busiest window across all cities.',
    stat_label: 'Orders Placed', stat_value: '3,104',
    highlight: '📍 Hottest Street: Jl. Sabang, Jakarta — 214 orders',
    updated_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'd4', section: 'dating', emoji: '💚',
    title: 'Coffee dates are winning in Bali',
    body: 'The ☕ "Feeling like a coffee" vibe was broadcast 340 times this week. Bali users matched at the highest rate — 1 in 4 vibe broadcasts resulted in a chat.',
    stat_label: 'Vibe Broadcasts', stat_value: '340',
    highlight: '💌 Most matched city: Bali · 89 new connections',
    updated_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'd5', section: 'announcement', emoji: '📣',
    title: 'Coming soon — Indoo Premium',
    body: 'We\'re launching Indoo Premium next month with profile boosts, unlimited unlocks, and early access to new features. Stay tuned for the announcement.',
    stat_label: null, stat_value: null,
    highlight: null,
    updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
]

export default function IndooNewsSheet({ open, onClose }) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [hour, setHour]       = useState(getWIBHour)
  const [imgLoaded, setImgLoaded] = useState({})

  useEffect(() => {
    const id = setInterval(() => setHour(getWIBHour()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('hangger_news')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        if (error) throw error
        setPosts(data?.length ? data : DEMO_POSTS)
      } catch {
        setPosts(DEMO_POSTS)
      }
      setLoading(false)
    })()
  }, [open])

  if (!open) return null

  const bgPhase   = getBGPhase(hour)
  const bgUrl     = BG_IMAGES[bgPhase]
  const isNight   = bgPhase === 'night'
  const sunsetPct = getSunsetProgress(hour)
  const latestUpdate = posts[0]?.updated_at ?? posts[0]?.created_at

  return (
    <div className={styles.page}>

      {/* Time-based background layers */}
      <div className={styles.bgBase} />
      <div
        className={`${styles.bgLayer} ${imgLoaded[bgUrl] ? styles.bgLayerVisible : ''}`}
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {!isNight && (
        <img src={bgUrl} alt="" style={{ display: 'none' }}
          onLoad={() => setImgLoaded(p => ({ ...p, [bgUrl]: true }))} />
      )}
      {sunsetPct > 0 && (
        <div className={styles.bgSunsetOverlay} style={{ opacity: sunsetPct * 0.55 }} />
      )}
      <div className={styles.baseDim} />
      <div className={styles.cityShimmer} />

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerBrand}>
            <img src={LOGO_URL} alt="Indoo" className={styles.headerLogo} draggable={false} />
            <span className={styles.headerNews}>news</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.headerMeta}>
          {latestUpdate && `Last updated ${timeAgo(latestUpdate)}`}
          {' · '}Indonesia Edition
        </div>
        <div className={styles.headerRule} />
      </header>

      {/* ── Content ── */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <span>📰</span>
            <p>No news yet — check back soon.</p>
          </div>
        ) : (
          posts.map(post => {
            const sec = SECTIONS[post.section] ?? SECTIONS.weekly
            return (
              <article
                key={post.id}
                className={styles.card}
                style={{ '--sec-color': sec.color, '--sec-bg': sec.bg }}
              >
                <div className={styles.cardSection}>
                  <span className={styles.cardEmoji}>{post.emoji}</span>
                  <span className={styles.cardSectionLabel}>{sec.label}</span>
                  <span className={styles.cardAge}>{timeAgo(post.updated_at ?? post.created_at)}</span>
                </div>

                <h3 className={styles.cardTitle}>{post.title}</h3>

                {post.stat_label && post.stat_value && (
                  <div className={styles.statPill}>
                    <span className={styles.statValue}>{post.stat_value}</span>
                    <span className={styles.statLabel}>{post.stat_label}</span>
                  </div>
                )}

                <p className={styles.cardBody}>{post.body}</p>

                {post.highlight && (
                  <div className={styles.highlight}>{post.highlight}</div>
                )}
              </article>
            )
          })
        )}

        <p className={styles.footer}>
          Indoo News is updated by the Indoo team every few days.
        </p>
      </div>
    </div>
  )
}
