import styles from './VerifiedPage.module.css'

const PERKS = [
  { icon: '✓', text: 'Yellow verified badge on your profile card' },
  { icon: '✓', text: 'Priority placement in search & filters' },
  { icon: '✓', text: 'Trusted profile — more connect requests' },
  { icon: '✓', text: 'Verified tag visible to everyone nearby' },
  { icon: '✓', text: 'Access to verified-only events & meetups' },
]

const PLANS = [
  { region: 'UK / Europe', price: '£2.99', period: 'per month' },
  { region: 'USA / Canada', price: '$3.99', period: 'per month' },
  { region: 'Indonesia', price: 'Rp 49,000', period: 'per month' },
  { region: 'Rest of World', price: '$2.99', period: 'per month' },
]

export default function VerifiedPage({ onBack, isVerified = false }) {
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Verified Profile</span>
      </div>

      <div className={styles.scroll}>

        {/* Status banner */}
        {isVerified ? (
          <div className={styles.activeBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div className={styles.activeBannerText}>
              <span className={styles.activeBannerTitle}>You're Verified</span>
              <span className={styles.activeBannerSub}>Your yellow badge is live on your profile</span>
            </div>
          </div>
        ) : (
          <div className={styles.heroBanner}>
            <div className={styles.heroBadge}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className={styles.heroTitle}>Get Verified</h2>
            <p className={styles.heroSub}>Stand out from the crowd. Build trust. Get more connections.</p>
          </div>
        )}

        {/* Perks */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>What you get</span>
          {PERKS.map((p, i) => (
            <div key={i} className={styles.perkRow}>
              <span className={styles.perkIcon}>{p.icon}</span>
              <span className={styles.perkText}>{p.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        {!isVerified && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Pricing by region</span>
            {PLANS.map((pl, i) => (
              <div key={i} className={styles.priceRow}>
                <span className={styles.priceRegion}>{pl.region}</span>
                <div className={styles.priceRight}>
                  <span className={styles.priceAmount}>{pl.price}</span>
                  <span className={styles.pricePeriod}>{pl.period}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {isVerified ? (
          <button className={styles.manageBtn}>
            Manage Subscription
          </button>
        ) : (
          <>
            <button className={styles.subscribeBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#000" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Get Verified — from £2.99/mo
            </button>
            <p className={styles.disclaimer}>Cancel anytime. No lock-in. Price varies by region.</p>
          </>
        )}

      </div>
    </div>
  )
}
