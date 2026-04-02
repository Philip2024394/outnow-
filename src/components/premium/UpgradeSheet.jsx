import { useState } from 'react'
import styles from './UpgradeSheet.module.css'

const PACKAGES = [
  {
    id: 'boost',
    name: 'Boost',
    price: '£2.99',
    period: '/month',
    tagline: 'Stand out on the map',
    features: [
      'Your photo shown on the map',
      'Larger profile circle',
      'More visible to nearby users',
      'Cancel anytime',
    ],
    cta: 'Get Boost',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£6.99',
    period: '/month',
    tagline: 'Everything you need',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Boost',
      'See who liked your profile',
      'Unlimited OTW requests',
      'Priority in discovery list',
      'Pro badge on profile',
    ],
    cta: 'Get Pro',
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '£12.99',
    period: '/month',
    tagline: 'The full experience',
    features: [
      'Everything in Pro',
      'Crown icon on map — always noticed',
      'Featured at top of discovery list',
      'Verified badge on profile',
      'Early access to new features',
    ],
    cta: 'Get VIP',
  },
]

const LIFETIME = {
  price: '£49.99',
  label: 'Lifetime Boost',
  sub: 'One-time payment — photo on map forever',
}

export default function UpgradeSheet({ open, onClose, showToast }) {
  const [selected, setSelected] = useState('pro')

  if (!open) return null

  const pkg = PACKAGES.find(p => p.id === selected)

  const handleSubscribe = () => {
    showToast?.(`${pkg.name} plan coming soon — stay tuned!`, 'info')
  }

  const handleLifetime = () => {
    showToast?.('Lifetime Boost coming soon — stay tuned!', 'info')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.header}>
          <span className={styles.headerIcon}>✨</span>
          <h2 className={styles.title}>Upgrade Your Profile</h2>
          <p className={styles.subtitle}>Show your photo on the map and get noticed by people nearby</p>
        </div>

        {/* Package tabs */}
        <div className={styles.tabs}>
          {PACKAGES.map(p => (
            <button
              key={p.id}
              className={`${styles.tab} ${selected === p.id ? styles.tabActive : ''}`}
              onClick={() => setSelected(p.id)}
            >
              {p.badge && <span className={styles.tabBadge}>{p.badge}</span>}
              <span className={styles.tabName}>{p.name}</span>
              <span className={styles.tabPrice}>{p.price}</span>
            </button>
          ))}
        </div>

        {/* Selected package detail */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div>
              <div className={styles.cardName}>{pkg.name}</div>
              <div className={styles.cardTagline}>{pkg.tagline}</div>
            </div>
            <div className={styles.cardPricing}>
              <span className={styles.cardPrice}>{pkg.price}</span>
              <span className={styles.cardPeriod}>{pkg.period}</span>
            </div>
          </div>

          <ul className={styles.features}>
            {pkg.features.map((f, i) => (
              <li key={i} className={styles.feature}>
                <span className={styles.featureTick}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribe CTA */}
        <button className={styles.ctaBtn} onClick={handleSubscribe}>
          {pkg.cta} — {pkg.price}{pkg.period}
        </button>

        <p className={styles.ctaSub}>Cancel anytime. No commitment.</p>

        {/* Lifetime option */}
        <button className={styles.lifetimeBtn} onClick={handleLifetime}>
          <div className={styles.lifetimeLeft}>
            <span className={styles.lifetimeName}>{LIFETIME.label}</span>
            <span className={styles.lifetimeSub}>{LIFETIME.sub}</span>
          </div>
          <span className={styles.lifetimePrice}>{LIFETIME.price}</span>
        </button>
      </div>
    </div>
  )
}
