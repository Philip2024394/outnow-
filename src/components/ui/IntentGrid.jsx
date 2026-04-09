import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import styles from './IntentGrid.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// IntentGrid — popularity-driven tile grid for social intent selection
// Tile sizes reflect real % of people with that intent in the user's city.
// ─────────────────────────────────────────────────────────────────────────────

const TILES = [
  {
    value: 'marriage',
    label: 'Marriage',
    emoji: '💍',
    description: 'I want forever',
    bg:     'rgba(244,114,182,0.15)',
    bgSel:  'rgba(244,114,182,0.28)',
    border: 'rgba(244,114,182,0.35)',
    active: '#F472B6',
    glow:   'rgba(244,114,182,0.45)',
  },
  {
    value: 'dating',
    label: 'Relationship',
    img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasaaaaaaa-removebg-preview.png?updatedAt=1775627388475',
    description: 'Real dating',
    bg:     'rgba(232,69,140,0.15)',
    bgSel:  'rgba(232,69,140,0.28)',
    border: 'rgba(232,69,140,0.35)',
    active: '#E8458C',
    glow:   'rgba(232,69,140,0.45)',
  },
  {
    value: 'friendship',
    label: 'Friendship',
    emoji: '👯',
    description: 'Platonic only',
    bg:     'rgba(141,198,63,0.12)',
    bgSel:  'rgba(141,198,63,0.24)',
    border: 'rgba(141,198,63,0.3)',
    active: '#8DC63F',
    glow:   'rgba(141,198,63,0.4)',
  },
  {
    value: 'travel',
    label: 'Travel Partner',
    emoji: '✈️',
    description: 'Explore together',
    bg:     'rgba(56,189,248,0.12)',
    bgSel:  'rgba(56,189,248,0.24)',
    border: 'rgba(56,189,248,0.3)',
    active: '#38BDF8',
    glow:   'rgba(56,189,248,0.4)',
  },
  {
    value: 'date_night',
    label: 'Date Night',
    emoji: '🍽️',
    description: 'Casual fun',
    bg:     'rgba(249,115,22,0.12)',
    bgSel:  'rgba(249,115,22,0.24)',
    border: 'rgba(249,115,22,0.3)',
    active: '#F97316',
    glow:   'rgba(249,115,22,0.4)',
  },
  {
    value: 'business',
    label: 'Business',
    emoji: '💼',
    description: 'Career connections',
    bg:     'rgba(167,139,250,0.12)',
    bgSel:  'rgba(167,139,250,0.24)',
    border: 'rgba(167,139,250,0.3)',
    active: '#A78BFA',
    glow:   'rgba(167,139,250,0.4)',
  },
  {
    value: 'coaching',
    label: 'Mentorship',
    emoji: '🧠',
    description: 'Learn / Teach',
    bg:     'rgba(251,191,36,0.12)',
    bgSel:  'rgba(251,191,36,0.24)',
    border: 'rgba(251,191,36,0.3)',
    active: '#FBBF24',
    glow:   'rgba(251,191,36,0.4)',
  },
  {
    value: 'pen_pal',
    label: 'Pen Pal',
    emoji: '✉️',
    description: 'Letters, not meets',
    bg:     'rgba(110,231,183,0.12)',
    bgSel:  'rgba(110,231,183,0.24)',
    border: 'rgba(110,231,183,0.3)',
    active: '#6EE7B7',
    glow:   'rgba(110,231,183,0.4)',
  },
]

// Fallback demo popularities (sum ~100)
const DEMO_POP = {
  marriage: 35, dating: 28, friendship: 16, travel: 8,
  date_night: 5, business: 4, coaching: 3, pen_pal: 1,
}

// Rank → grid span
function getColSpan(rank) { return rank <= 3 ? 2 : 1 }
function getRowSpan(rank) { return rank <= 1 ? 2 : 1 }

export default function IntentGrid({ open, value, city, onChange, onBrowseAll }) {
  const [pops, setPops]           = useState(DEMO_POP)
  const [selected, setSelected]   = useState(null)
  const [visible, setVisible]     = useState(false)
  const [statsOn, setStatsOn]     = useState(false)

  useEffect(() => {
    if (!open) { setVisible(false); setStatsOn(false); return }
    setSelected(value ?? null)
    setVisible(false)
    setStatsOn(false)

    // Fetch real city data
    ;(async () => {
      try {
        let q = supabase.from('profiles').select('lookingFor').not('lookingFor', 'is', null).limit(2000)
        if (city) q = q.eq('city', city)
        const { data } = await q
        if (data && data.length >= 10) {
          const counts = {}
          data.forEach(r => { if (r.lookingFor) counts[r.lookingFor] = (counts[r.lookingFor] ?? 0) + 1 })
          const total = data.length
          const result = {}
          TILES.forEach(t => { result[t.value] = Math.round(((counts[t.value] ?? 0) / total) * 100) })
          setPops(result)
        }
      } catch { /* keep demo */ }
    })()

    // Staggered entrance
    const t1 = setTimeout(() => setVisible(true),  80)
    const t2 = setTimeout(() => setStatsOn(true), 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open, city, value])

  if (!open) return null

  // Sort by popularity to assign ranks (rank 0 = most popular)
  const sorted = [...TILES].sort((a, b) => (pops[b.value] ?? 0) - (pops[a.value] ?? 0))

  const handleConfirm = () => {
    if (!selected) return
    onChange(selected)
  }

  const selectedTile = TILES.find(t => t.value === selected)

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} />

      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.title}>I joined the app for</div>
            <div className={styles.sub}>
              {city ? `Sized by what people want in ${city}` : 'Sized by local popularity'}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {sorted.map((tile, rank) => {
            const pct      = pops[tile.value] ?? 0
            const colSpan  = getColSpan(rank)
            const rowSpan  = getRowSpan(rank)
            const isSel    = selected === tile.value
            const isBig    = rowSpan === 2
            const delay    = `${rank * 55}ms`

            return (
              <button
                key={tile.value}
                className={[
                  styles.tile,
                  visible  ? styles.tileIn  : '',
                  isSel    ? styles.tileSel : '',
                ].join(' ')}
                style={{
                  gridColumn:       `span ${colSpan}`,
                  gridRow:          `span ${rowSpan}`,
                  background:       isSel ? tile.bgSel : tile.bg,
                  borderColor:      isSel ? tile.active : tile.border,
                  boxShadow:        isSel ? `0 0 0 2px ${tile.active}, 0 4px 24px ${tile.glow}` : 'none',
                  animationDelay:   delay,
                  transitionDelay:  visible ? delay : '0ms',
                }}
                onClick={() => setSelected(isSel ? null : tile.value)}
              >
                {/* Icon */}
                {tile.img
                  ? <img src={tile.img} alt={tile.label} className={styles.tileImg} style={{ width: isBig ? 52 : 32, height: isBig ? 52 : 32 }} />
                  : <span className={styles.tileEmoji} style={{ fontSize: isBig ? 44 : 26 }}>{tile.emoji}</span>
                }

                {/* Label */}
                <span className={styles.tileLabel} style={{ fontSize: isBig ? 16 : 12, color: isSel ? tile.active : '#fff' }}>
                  {tile.label}
                </span>

                {/* Description — only on 2×2 tiles */}
                {isBig && (
                  <span className={styles.tileDesc}>{tile.description}</span>
                )}

                {/* City stat */}
                {pct > 0 && (
                  <span
                    className={[styles.tileStat, statsOn ? styles.tileStatOn : ''].join(' ')}
                    style={{ color: tile.active }}
                  >
                    {pct}%{city ? ` in ${city}` : ''}
                  </span>
                )}

                {/* Check mark */}
                {isSel && (
                  <span className={styles.tileCheck} style={{ background: tile.active }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={[styles.ctaBtn, selected ? styles.ctaBtnOn : ''].join(' ')}
            style={selected ? { background: selectedTile?.active, boxShadow: `0 4px 20px ${selectedTile?.glow}` } : {}}
            onClick={handleConfirm}
            disabled={!selected}
          >
            {selected ? `Continue with ${selectedTile?.label}` : 'Tap a tile to continue'}
          </button>
          <button className={styles.browseAllBtn} onClick={onBrowseAll}>
            Browse all 80+ categories →
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
