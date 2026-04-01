import { useState } from 'react'
import styles from './WelcomePopup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const STEPS = [
  {
    icon: '📍',
    title: 'Say you\'re out',
    body: 'Tap I\'M OUT NOW, pick your vibe — coffee, drinks, dinner, walk. You\'re live for up to 2 hours.',
    color: '#39FF14',
  },
  {
    icon: '👀',
    title: 'Browse who\'s nearby',
    body: 'See real people out right now. Check their vibe, distance and intent — then like if you\'re interested.',
    color: '#A855F7',
  },
  {
    icon: '🚶',
    title: 'Get a notification & meet',
    body: 'When it\'s mutual you both get notified instantly. No waiting. No long chats. Just meet.',
    color: '#FF6B35',
  },
]

export default function WelcomePopup({ onDone }) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) {
      setLeaving(true)
      setTimeout(onDone, 350)
    } else {
      setStep(s => s + 1)
    }
  }

  const current = STEPS[step]

  return (
    <div className={`${styles.backdrop} ${leaving ? styles.backdropLeaving : ''}`}>
      <div className={`${styles.card} ${leaving ? styles.cardLeaving : ''}`}>

        {/* Logo */}
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

        {/* Safety badge */}
        <div className={styles.safeBadge}>
          <span>🛡️</span>
          <span>Safe for women · Verified profiles · Easy block & report</span>
        </div>

        {/* Step content */}
        <div className={styles.stepWrap}>
          <div className={styles.stepIcon} style={{ boxShadow: `0 0 32px ${current.color}40` }}>
            {current.icon}
          </div>
          <h2 className={styles.stepTitle}>{current.title}</h2>
          <p className={styles.stepBody}>{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ''}`}
              style={i === step ? { background: current.color } : {}}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className={styles.btn}
          style={{ background: current.color }}
          onClick={next}
        >
          {isLast ? 'Let\'s go 🚀' : 'Next'}
        </button>

        {/* Skip */}
        {!isLast && (
          <button className={styles.skip} onClick={() => { setLeaving(true); setTimeout(onDone, 350) }}>
            Skip intro
          </button>
        )}

        {/* Tagline */}
        <p className={styles.tagline}>Dating at its best. No chat. No waiting. Just meet.</p>
      </div>
    </div>
  )
}
