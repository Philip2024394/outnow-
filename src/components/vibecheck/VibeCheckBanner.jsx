import styles from './VibeCheckBanner.module.css'

// Variant config keyed by the sender's session status
const VARIANTS = {
  active:     {
    accent: '#39FF14',
    bg:     '#0e0e0e',
    border: 'rgba(57,255,20,0.3)',
    icon:   '💚',
    title:  'Someone wants to meet you tonight',
    sub:    'Someone nearby is interested — find out who after they match',
    cta:    'See Who It Is',
  },
  live:       {
    accent: '#39FF14',
    bg:     '#0e0e0e',
    border: 'rgba(57,255,20,0.3)',
    icon:   '💚',
    title:  'Someone wants to meet you tonight',
    sub:    'Someone nearby is interested — find out who after they match',
    cta:    'See Who It Is',
  },
  invite_out: {
    accent: '#FFD60A',
    bg:     '#0e0e0e',
    border: 'rgba(255,214,10,0.35)',
    icon:   '✨',
    title:  'Someone wants to invite you out tonight',
    sub:    "You've caught someone's eye — find out who after they match",
    cta:    'See the Invite',
  },
  scheduled:  {
    accent: '#FF9500',
    bg:     '#0e0e0e',
    border: 'rgba(255,149,0,0.3)',
    icon:   '🕐',
    title:  'Someone wants to meet you later',
    sub:    'Someone is keen to meet up — identity revealed on mutual match',
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
