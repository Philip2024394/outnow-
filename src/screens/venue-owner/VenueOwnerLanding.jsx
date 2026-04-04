import { useState } from 'react'
import styles from './VenueOwnerLanding.module.css'

const STATS = [
  { num: '2,400+', label: 'Active users\nin London'     },
  { num: '68%',    label: 'Check the map\nbefore going out' },
  { num: '3.2×',   label: 'More likely to\nvisit a listed venue' },
]

const FREE_FEATURES = [
  { icon: '📍', text: 'Listed on the venue map' },
  { icon: '🔵', text: 'Blue marker — visible to all users' },
  { icon: '🏷️', text: 'Basic venue profile (name, address, type)' },
]

const PREMIUM_FEATURES = [
  { icon: '🟢', text: 'Green glowing marker — stands out from the crowd' },
  { icon: '👥', text: 'Live people count badge on your pin' },
  { icon: '💬', text: 'Dedicated venue group chat room' },
  { icon: '🏷️', text: 'Discount banner + exclusive promo code' },
  { icon: '📊', text: 'Monthly visitor & engagement analytics' },
  { icon: '🚀', text: 'Priority map placement — shown first' },
]

const CHAT_MESSAGES = [
  { text: 'Just arrived at the bar 🍸', right: false },
  { text: 'Anyone up for a game of pool?', right: true  },
  { text: 'Come join our table! 👋', right: false },
  { text: 'On my way — save me a seat 😄', right: true  },
]

export default function VenueOwnerLanding({ onClose, onGetStarted }) {
  const [selected, setSelected] = useState('premium')

  return (
    <div className={styles.screen}>

      {/* Sticky header */}
      <div className={styles.stickyHeader}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <img
          src="https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064"
          alt="IMOUTNOW"
          className={styles.headerLogo}
        />
        <div className={styles.headerPill}>For Venues</div>
      </div>

      <div className={styles.scroll}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>🏙️ London's Going-Out App</div>
          <h1 className={styles.heroTitle}>Bring More People<br />Through Your Door</h1>
          <p className={styles.heroSub}>Join thousands of users discovering where to go tonight. Get listed. Get found. Get busy.</p>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Untitleddsdsdsdsd.png"
            alt="Venues on the map"
            className={styles.heroImg}
          />
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {STATS.map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Plan toggle */}
        <div className={styles.planSection}>
          <h2 className={styles.planHeading}>Choose Your Plan</h2>

          {/* FREE card */}
          <button
            className={`${styles.planCard} ${selected === 'free' ? styles.planCardSelected : ''}`}
            onClick={() => setSelected('free')}
          >
            <div className={styles.planCardHeader}>
              <div className={styles.planCardLeft}>
                <div className={`${styles.planRadio} ${selected === 'free' ? styles.planRadioActive : ''}`} />
                <div>
                  <span className={styles.planName}>Basic Listing</span>
                  <span className={styles.planTagline}>Get on the map for free</span>
                </div>
              </div>
              <div className={styles.planPrice}>
                <span className={styles.planPriceFree}>FREE</span>
                <span className={styles.planPriceSub}>forever</span>
              </div>
            </div>
            <div className={styles.planFeatures}>
              {FREE_FEATURES.map(f => (
                <div key={f.text} className={styles.planFeatureRow}>
                  <span className={styles.planFeatureIcon}>{f.icon}</span>
                  <span className={styles.planFeatureText}>{f.text}</span>
                </div>
              ))}
            </div>
          </button>

          {/* PREMIUM card */}
          <button
            className={`${styles.planCard} ${styles.planCardPremium} ${selected === 'premium' ? styles.planCardSelected : ''}`}
            onClick={() => setSelected('premium')}
          >
            <div className={styles.premiumBadge}>⭐ Most Popular</div>
            <div className={styles.planCardHeader}>
              <div className={styles.planCardLeft}>
                <div className={`${styles.planRadio} ${styles.planRadioPremium} ${selected === 'premium' ? styles.planRadioActive : ''}`} />
                <div>
                  <span className={styles.planName}>Premium Listing</span>
                  <span className={styles.planTagline}>First month completely free</span>
                </div>
              </div>
              <div className={styles.planPrice}>
                <div className={styles.planPriceRow}>
                  <span className={styles.planPriceCurrency}>$</span>
                  <span className={styles.planPriceNum}>10</span>
                  <span className={styles.planPriceDecimal}>.99</span>
                </div>
                <span className={styles.planPriceSub}>/month</span>
              </div>
            </div>
            <div className={styles.freePill}>🎉 First 30 days free — no card charged</div>
            <div className={styles.planFeatures}>
              {PREMIUM_FEATURES.map(f => (
                <div key={f.text} className={styles.planFeatureRow}>
                  <span className={styles.planFeatureIcon}>{f.icon}</span>
                  <span className={`${styles.planFeatureText} ${styles.planFeatureTextPremium}`}>{f.text}</span>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* Map visual comparison */}
        <div className={styles.compareSection}>
          <h2 className={styles.sectionTitle}>See the Difference on the Map</h2>
          <div className={styles.compareRow}>
            <div className={styles.compareItem}>
              <div className={styles.markerFree}>
                <div className={styles.markerFreeBubble}>🍺</div>
                <span className={styles.markerLabel}>The Victoria</span>
              </div>
              <span className={styles.compareTag}>Free</span>
              <span className={styles.compareDesc}>Blue marker. Visible but quiet.</span>
            </div>
            <div className={styles.compareDivider}>vs</div>
            <div className={styles.compareItem}>
              <div className={styles.markerPremium}>
                <div className={styles.markerPremiumCount}>4</div>
                <div className={styles.markerPremiumBubble}>🍺</div>
                <span className={`${styles.markerLabel} ${styles.markerLabelPremium}`}>The Neon Tap</span>
              </div>
              <span className={`${styles.compareTag} ${styles.compareTagPremium}`}>Premium</span>
              <span className={styles.compareDesc}>Green glow. Live count. Stands out.</span>
            </div>
          </div>
        </div>

        {/* Chat feature */}
        <div className={styles.chatSection}>
          <div className={styles.chatSectionTop}>
            <span className={styles.chatIcon}>💬</span>
            <div>
              <h3 className={styles.chatTitle}>Your Own Venue Chat Room</h3>
              <p className={styles.chatSub}>People at your venue connect in real time. Groups form. Plans get made. They stay longer and spend more.</p>
            </div>
          </div>
          <div className={styles.chatWindow}>
            <div className={styles.chatWindowBar}>
              <span className={styles.chatWindowDot} />
              <span className={styles.chatWindowName}>The Neon Tap — Live Chat</span>
              <span className={styles.chatWindowCount}>6 people</span>
            </div>
            <div className={styles.chatMessages}>
              {CHAT_MESSAGES.map((m, i) => (
                <div key={i} className={`${styles.chatBubble} ${m.right ? styles.chatBubbleRight : ''}`}>
                  {m.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className={styles.testimonial}>
          <p className={styles.testimonialText}>"We saw a 30% increase in new faces within the first two weeks. The chat room keeps people at the bar longer."</p>
          <span className={styles.testimonialAuthor}>— James, The Neon Tap, Soho</span>
        </div>

        {/* CTA spacer */}
        <div style={{ height: 100 }} />

      </div>

      {/* Sticky CTA */}
      <div className={styles.stickyFooter}>
        {/* Social proof */}
        <div className={styles.socialProof}>
          <div className={styles.socialProofLeft}>
            <div className={styles.avatarStack}>
              {[
                'https://ik.imagekit.io/nepgaxllc/uk1.png',
                'https://ik.imagekit.io/nepgaxllc/uk3.png',
                'https://ik.imagekit.io/nepgaxllc/uk4.png',
                'https://ik.imagekit.io/nepgaxllc/uk5.png',
                'https://ik.imagekit.io/nepgaxllc/uk6.png',
                'https://ik.imagekit.io/nepgaxllc/uk8.png',
                'https://ik.imagekit.io/nepgaxllc/uk9.png',
                'https://ik.imagekit.io/nepgaxllc/uk10.png',
              ].map((src, i) => (
                <img key={i} src={src} alt="" className={styles.avatar} style={{ zIndex: i + 1 }} />
              ))}
            </div>
            <div className={styles.socialProofText}>
              <span className={styles.socialProofTitle}>At Venues Now</span>
              <span className={styles.socialProofSub}>Join 1,000's of people out now</span>
            </div>
          </div>
          <button className={styles.viewVenuesBtn} onClick={onClose}>View Venues →</button>
        </div>

        {/* Plan CTA */}
        <div className={styles.stickyFooterInner}>
          <div className={styles.stickyFooterText}>
            <span className={styles.stickyPlan}>
              {selected === 'premium' ? '⭐ Premium — First Month Free' : 'Basic — Free Forever'}
            </span>
            <span className={styles.stickyPrice}>
              {selected === 'premium' ? 'Then $10.99/mo · Cancel anytime' : 'No payment needed'}
            </span>
          </div>
          <button className={`${styles.ctaBtn} ${selected === 'premium' ? styles.ctaBtnPremium : styles.ctaBtnFree}`} onClick={() => onGetStarted(selected)}>
            {selected === 'premium' ? 'Start Free Trial →' : 'List for Free →'}
          </button>
        </div>
      </div>

    </div>
  )
}
