import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './HanggerNewsSheet.module.css'

const SECTIONS = {
  weekly:       { label: 'Weekly Recap',  color: '#8DC63F', bg: 'rgba(141,198,63,0.08)'  },
  marketplace:  { label: 'Marketplace',   color: '#F59E0B', bg: 'rgba(245,158,11,0.08)'  },
  street:       { label: 'Street Food',   color: '#EF4444', bg: 'rgba(239,68,68,0.08)'   },
  dating:       { label: 'Dating',        color: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
  announcement: { label: 'From Hangger',  color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

// Demo posts shown when Supabase is unavailable
const DEMO_POSTS = [
  {
    id: 'd1', section: 'weekly', emoji: '📰',
    title: 'Hangger had its biggest week yet',
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
    title: 'Coming soon — Hangger Premium',
    body: 'We\'re launching Hangger Premium next month with profile boosts, unlimited unlocks, and early access to new features. Stay tuned for the announcement.',
    stat_label: null, stat_value: null,
    highlight: null,
    updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
]

export default function HanggerNewsSheet({ open, onClose }) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

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

  const latestUpdate = posts[0]?.updated_at ?? posts[0]?.created_at

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>

        {/* ── Header ── */}
        <div className={styles.masthead}>
          <div className={styles.mastheadTop}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className={styles.mastheadTitle}>
            <span className={styles.mastheadFlag}>HANGGER</span>
            <span className={styles.mastheadNews}>NEWS</span>
          </div>
          <div className={styles.mastheadMeta}>
            {latestUpdate && `Last updated ${timeAgo(latestUpdate)}`}
            {' · '}
            Indonesia Edition
          </div>
          <div className={styles.mastheadRule} />
        </div>

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
                  {/* Section badge */}
                  <div className={styles.cardSection}>
                    <span className={styles.cardEmoji}>{post.emoji}</span>
                    <span className={styles.cardSectionLabel}>{sec.label}</span>
                    <span className={styles.cardAge}>{timeAgo(post.updated_at ?? post.created_at)}</span>
                  </div>

                  {/* Title */}
                  <h3 className={styles.cardTitle}>{post.title}</h3>

                  {/* Stat pill */}
                  {post.stat_label && post.stat_value && (
                    <div className={styles.statPill}>
                      <span className={styles.statValue}>{post.stat_value}</span>
                      <span className={styles.statLabel}>{post.stat_label}</span>
                    </div>
                  )}

                  {/* Body */}
                  <p className={styles.cardBody}>{post.body}</p>

                  {/* Highlight callout */}
                  {post.highlight && (
                    <div className={styles.highlight}>
                      {post.highlight}
                    </div>
                  )}
                </article>
              )
            })
          )}

          <p className={styles.footer}>
            Hangger News is updated by the Hangger team every few days.
          </p>
        </div>
      </div>
    </div>
  )
}
