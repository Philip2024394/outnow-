import { useState } from 'react'
import styles from './MembershipScreen.module.css'

/* ─────────────────────────────────────────────────────────────────
   PLAN DATA per category
───────────────────────────────────────────────────────────────── */
const CONFIGS = {
  dating: {
    emoji: '💕',
    label: 'Dating',
    accent: '#FF6BA3',
    shadow: 'rgba(255,107,163,0.45)',
    tagline: 'Meet real people near you — cheaper than Tinder, better than Hinge',
    bgImage: 'https://ik.imagekit.io/nepgaxllc/Untitleddsadasdasdsdasda.png?updatedAt=1775726643907',
    plans: [
      {
        id: 'spark',
        name: 'Spark',
        price: 'Rp 29K',
        period: '/month',
        badge: null,
        features: [
          '💘 Unlimited likes — no daily cap',
          '📍 Shown on the live dating map',
          '🔁 Undo your last swipe',
          '🚫 Ad-free experience',
          '⭐ 3 Super Likes per day',
        ],
        cta: 'Get Spark',
      },
      {
        id: 'match',
        name: 'Match',
        price: 'Rp 39K',
        period: '/month',
        badge: 'BEST VALUE',
        features: [
          '✅ Everything in Spark',
          '👀 See exactly who liked you',
          '💕 Send unlimited Date Invites',
          '📩 Read receipts on messages',
          '🗺️ Browse profiles in any city',
          '🔥 1 free Boost per week',
          '✨ Match badge on your profile',
        ],
        cta: 'Get Match',
      },
      {
        id: 'elite',
        name: 'Elite',
        price: 'Rp 49K',
        period: '/month',
        badge: null,
        features: [
          '✅ Everything in Match',
          '👑 Featured at top of discovery',
          '🛡️ Verified Elite badge',
          '⚡ Priority shown to new members',
          '💬 Message before matching',
          '🎯 Advanced interest filters',
          '🌟 5 Boosts per month included',
        ],
        cta: 'Get Elite',
      },
    ],
  },

  // market, bike_ride, car_ride, restaurant removed —
  // those sections use the per-transaction commission system (5% / 10%)
  // and no longer require a monthly subscription.
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function MembershipScreen({ category = 'dating', open, onClose }) {
  const cfg = CONFIGS[category] ?? CONFIGS.dating
  const defaultPlan = cfg.plans[1]?.id ?? cfg.plans[0]?.id
  const [selected, setSelected] = useState(defaultPlan)

  // Reset selection when category changes
  const plan = cfg.plans.find(p => p.id === selected) ?? cfg.plans[1] ?? cfg.plans[0]

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      style={cfg.bgImage ? {
        backgroundImage: `url('${cfg.bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      } : undefined}
    >
      {/* Dark scrim over background image */}
      {cfg.bgImage && <div className={styles.scrim} />}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.emoji}>{cfg.emoji}</span>
          <div>
            <div className={styles.title}>{cfg.label} Membership</div>
            <div className={styles.tagline}>{cfg.tagline}</div>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className={styles.scroll}>

        {/* Competitor comparison banner — dating only */}
        {category === 'dating' && (
          <div className={styles.vsBar}>
            <span className={styles.vsLabel}>vs</span>
            <div className={styles.vsItem}>
              <span className={styles.vsApp}>Tinder Gold</span>
              <span className={styles.vsPrice}>Rp 130K/mo</span>
            </div>
            <div className={styles.vsDivider} />
            <div className={styles.vsItem}>
              <span className={styles.vsApp}>Hinge+</span>
              <span className={styles.vsPrice}>Rp 110K/mo</span>
            </div>
            <div className={styles.vsDivider} />
            <div className={styles.vsItem}>
              <span className={styles.vsApp}>Bumble Premium</span>
              <span className={styles.vsPrice}>Rp 150K/mo</span>
            </div>
          </div>
        )}

        {/* Plan tabs */}
        <div className={styles.tabs}>
          {cfg.plans.map(p => (
            <button
              key={p.id}
              className={`${styles.tab} ${selected === p.id ? styles.tabActive : ''}`}
              style={selected === p.id ? {
                borderColor: cfg.accent,
                background: `${cfg.accent}18`,
              } : {}}
              onClick={() => setSelected(p.id)}
            >
              {p.badge && (
                <span className={styles.badge} style={{ background: cfg.accent }}>
                  {p.badge}
                </span>
              )}
              <span className={styles.tabName} style={selected === p.id ? { color: cfg.accent } : {}}>
                {p.name}
              </span>
              <span className={styles.tabPrice} style={selected === p.id ? { color: cfg.accent } : {}}>
                {p.price}
              </span>
            </button>
          ))}
        </div>

        {/* Selected plan detail */}
        <div className={styles.card} style={{ borderColor: `${cfg.accent}30` }}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPeriod}>per {plan.period.replace('/', '')}</div>
            </div>
            <div className={styles.priceBlock}>
              <span className={styles.price} style={{ color: cfg.accent }}>{plan.price}</span>
              <span className={styles.pricePeriod}>{plan.period}</span>
            </div>
          </div>
          <ul className={styles.features}>
            {plan.features.map((f, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.tick} style={{ color: cfg.accent }}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          className={styles.cta}
          style={{
            background: cfg.accent,
            boxShadow: `0 4px 20px ${cfg.shadow}`,
          }}
        >
          {plan.cta} — {plan.price}{plan.period}
        </button>
        <p className={styles.ctaSub}>Cancel anytime · No hidden fees</p>

        {/* All plans summary */}
        <div className={styles.allPlans}>
          {cfg.plans.map(p => (
            <button
              key={p.id}
              className={`${styles.planRow} ${selected === p.id ? styles.planRowActive : ''}`}
              style={selected === p.id ? { borderColor: cfg.accent } : {}}
              onClick={() => setSelected(p.id)}
            >
              <span className={styles.planRowName}>{p.name}</span>
              <span className={styles.planRowPrice} style={selected === p.id ? { color: cfg.accent } : {}}>
                {p.price}<span className={styles.planRowPeriod}>{p.period}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
