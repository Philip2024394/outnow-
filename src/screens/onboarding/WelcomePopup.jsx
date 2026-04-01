import { useState } from 'react'
import styles from './WelcomePopup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'
const TC_URL = import.meta.env.VITE_TC_URL ?? 'https://imoutnow.com/terms'
const PP_URL = import.meta.env.VITE_PP_URL ?? 'https://imoutnow.com/privacy'

const STEPS = [
  {
    id: 'swipe',
    img: 'https://ik.imagekit.io/dateme/No%20swiping%20on%20screen.png',
    accent: '#39FF14',
    title: 'No Swiping',
    body: 'Forget endless swiping. IMOUTNOW connects you with real people who are actually out right now — no endless browsing required.',
  },
  {
    id: 'chat',
    icon: '💬',
    accent: '#A855F7',
    title: 'No Chatting',
    body: "Skip the awkward back-and-forth. There's no messaging — if it's mutual, you both get notified and decide to meet in person.",
  },
  {
    id: 'like',
    icon: '❤️',
    accent: '#FF6B35',
    title: 'Just Like & Wait',
    body: "See someone out nearby? Hit like. When they like back you both get a notification instantly. That's the whole app.",
  },
  {
    id: 'safety',
    icon: '🛡️',
    accent: '#F5A623',
    title: 'Your Safety Matters',
    body: null, // renders custom safety list
  },
  {
    id: 'terms',
    icon: null,
    accent: '#39FF14',
    title: 'Before You Start',
    body: null, // renders T&C checkbox
  },
]

const SAFETY_TIPS = [
  { icon: '📍', text: 'Always meet in a public place' },
  { icon: '👥', text: 'Tell a friend where you\'re going' },
  { icon: '🤝', text: 'Bring someone along if you prefer' },
  { icon: '🔒', text: 'Block or report anyone who makes you uncomfortable' },
]

export default function WelcomePopup({ onDone }) {
  const [step, setStep]       = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [agreed, setAgreed]   = useState(false)

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const finish = () => {
    setLeaving(true)
    setTimeout(onDone, 350)
  }

  const next = () => {
    if (isLast) {
      if (!agreed) return
      finish()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className={`${styles.backdrop} ${leaving ? styles.backdropLeaving : ''}`}>
      <div className={`${styles.card} ${leaving ? styles.cardLeaving : ''}`}>

        {/* Logo */}
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

        {/* Step content */}
        {current.id !== 'safety' && current.id !== 'terms' && (
          <div className={styles.stepWrap}>
            <div
              className={styles.stepIcon}
              style={{ boxShadow: `0 0 32px ${current.accent}40`, borderColor: `${current.accent}30` }}
            >
              {current.img
                ? <img src={current.img} alt={current.title} className={styles.stepIconImg} />
                : current.icon
              }
            </div>
            <h2 className={styles.stepTitle}>{current.title}</h2>
            <p className={styles.stepBody}>{current.body}</p>
          </div>
        )}

        {/* Safety step */}
        {current.id === 'safety' && (
          <div className={styles.safetyWrap}>
            <div className={styles.safetyIcon}>🛡️</div>
            <h2 className={styles.stepTitle}>Your Safety Matters</h2>
            <p className={styles.safetyIntro}>
              IMOUTNOW is designed to be safe and fun. When used correctly, it&apos;s a great way to meet people.
            </p>
            <div className={styles.safetyList}>
              {SAFETY_TIPS.map(tip => (
                <div key={tip.text} className={styles.safetyRow}>
                  <span className={styles.safetyEmoji}>{tip.icon}</span>
                  <span className={styles.safetyText}>{tip.text}</span>
                </div>
              ))}
            </div>
            <div className={styles.safetyNote}>
              The application, if used in the correct manner, is safe for all.
            </div>
          </div>
        )}

        {/* Terms step */}
        {current.id === 'terms' && (
          <div className={styles.termsWrap}>
            <div className={styles.termsIconRow}>
              <span className={styles.termsIconBig}>📋</span>
            </div>
            <h2 className={styles.stepTitle}>Before You Start</h2>
            <p className={styles.termsIntro}>
              We need you to confirm you have read and agree to our Terms &amp; Conditions. These protect you and every member of the IMOUTNOW community.
            </p>
            <a
              href={TC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tcLink}
            >
              Read Terms &amp; Conditions →
            </a>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              <span className={styles.checkText}>
                I am 18 or over and I agree to the{' '}
                <a href={TC_URL} target="_blank" rel="noopener noreferrer" className={styles.tcInline}>
                  Terms &amp; Conditions
                </a>{' '}
                and{' '}
                <a href={PP_URL} target="_blank" rel="noopener noreferrer" className={styles.tcInline}>
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>
        )}

        {/* Progress dots */}
        <div className={styles.dots}>
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`}
              style={i === step ? { background: current.accent } : {}}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className={styles.btn}
          style={{ background: isLast && !agreed ? '#333' : current.accent }}
          onClick={next}
          disabled={isLast && !agreed}
        >
          {isLast ? "Let's go \uD83D\uDE80" : 'Next'}
        </button>

        {/* Skip */}
        {!isLast && (
          <button className={styles.skip} onClick={finish}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
