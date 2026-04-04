import styles from './VibeCheckBanner.module.css'

// Variant config keyed by the sender's session status
const VARIANTS = {
  active:     {
    accent: '#8DC63F',
    bg:     '#0e0e0e',
    border: 'rgba(141,198,63,0.3)',
    icon:   '💚',
    title:  'Someone nearby wants to meet up',
    sub:    'Someone out near you sent you an interest — tap to see who',
    cta:    'See Who It Is',
  },
  live:       {
    accent: '#8DC63F',
    bg:     '#0e0e0e',
    border: 'rgba(141,198,63,0.3)',
    icon:   '💚',
    title:  'Someone nearby wants to meet up',
    sub:    'Someone out near you sent you an interest — tap to see who',
    cta:    'See Who It Is',
  },
  invite_out: {
    accent: '#F5C518',
    bg:     '#0e0e0e',
    border: 'rgba(245,197,24,0.35)',
    icon:   '✨',
    title:  'Someone wants to invite you out',
    sub:    'Someone near you is keen to connect — tap to see their invite',
    cta:    'See the Invite',
  },
  scheduled:  {
    accent: '#E8890C',
    bg:     '#0e0e0e',
    border: 'rgba(232,137,12,0.3)',
    icon:   '🕐',
    title:  'Someone wants to meet up later',
    sub:    'Someone nearby is planning an outing and wants you along',
    cta:    'See Who It Is',
  },
}

/**
 * VibeCheckBanner
 * Shown to the target user when someone gives them a "Yes" in Vibe Check.
 *
 * @prop {object|null} banner  – { status: 'active'|'invite_out'|'scheduled', count?: number }
 * @prop {function}    onDismiss
 * @prop {function}    onView   – called when user taps CTA (open matching flow)
 */
export default function VibeCheckBanner({ banner, onDismiss, onView }) {
  if (!banner) return null

  const v = VARIANTS[banner.status] ?? VARIANTS.active

  return (
    <div
      className={styles.banner}
      style={{ '--accent': v.accent, '--bg': v.bg, '--border': v.border }}
      role="status"
    >
      <span className={styles.icon}>{v.icon}</span>

      <div className={styles.body}>
        <span className={styles.title}>{v.title}</span>
        <span className={styles.sub}>{v.sub}</span>
      </div>

      <button
        className={styles.cta}
        onClick={(e) => { e.stopPropagation(); onView?.() }}
      >
        {v.cta}
      </button>

      <button
        className={styles.close}
        onClick={(e) => { e.stopPropagation(); onDismiss?.() }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
