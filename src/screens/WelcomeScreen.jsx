import { useEffect, useState } from 'react'
import styles from './WelcomeScreen.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdf-removebg-preview.png'

const SLIDES = [
  {
    emoji: '📍',
    title: 'People Are Out\nNear You Right Now',
    sub: 'Hangger shows you who is actually out — in your city, tonight.',
  },
  {
    emoji: '🤝',
    title: 'Meet. Connect.\nNo Swiping.',
    sub: 'See live profiles on the map. Send a nudge. Meet up.',
  },
  {
    emoji: '🛒',
    title: 'Buy, Sell &\nDo Business Live',
    sub: 'Makers, traders, services — all on the same map. Zero commission.',
  },
]

const PATHS = [
  {
    id: 'social',
    emoji: '🤝',
    label: 'Meet People',
    sub: 'Connect with people out near you tonight',
    color: '#8DC63F',
  },
  {
    id: 'maker',
    emoji: '🛍️',
    label: "I'm a Maker / Seller",
    sub: 'Showcase your products & find local customers',
    color: '#F5C518',
  },
]

export default function WelcomeScreen({ onDone }) {
  const [slide, setSlide]     = useState(0)
  const [showPath, setShowPath] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Auto-advance every 2.8s — stops at last slide to wait for user tap
  useEffect(() => {
    if (showPath) return
    const t = setTimeout(() => {
      if (slide < SLIDES.length - 1) setSlide(s => s + 1)
    }, 2800)
    return () => clearTimeout(t)
  }, [slide, showPath])

  function handleContinue() {
    if (slide < SLIDES.length - 1) {
      setSlide(s => s + 1)
    } else {
      setShowPath(true)
    }
  }

  function handlePickPath(pathId) {
    localStorage.setItem('user_path', pathId)
    setExiting(true)
    setTimeout(onDone, 500)
  }

  const current = SLIDES[slide]

  return (
    <div className={`${styles.screen} ${exiting ? styles.screenExit : ''}`}>
      <div className={styles.glow} />

      {!showPath ? (
        <>
          <div className={styles.body}>
            <img src={LOGO_URL} alt="Hangger" className={styles.wordmark} />

            <div className={styles.slide} key={slide}>
              <div className={styles.emoji}>{current.emoji}</div>
              <h1 className={styles.title}>{current.title}</h1>
              <p className={styles.sub}>{current.sub}</p>
            </div>

            <div className={styles.dots}>
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
                  onClick={() => setSlide(i)}
                />
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.continueBtn} onClick={handleContinue}>
              {slide === SLIDES.length - 1 ? "Let's Go →" : 'Skip'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.body}>
            <img src={LOGO_URL} alt="Hangger" className={styles.wordmark} />
            <div className={styles.slide}>
              <div className={styles.emoji}>👋</div>
              <h1 className={styles.title}>What brings\nyou here?</h1>
              <p className={styles.sub}>We'll set things up to match how you use the app.</p>
            </div>
          </div>

          <div className={styles.pathCards}>
            {PATHS.map(({ id, emoji, label, sub, color }) => (
              <button
                key={id}
                className={styles.pathCard}
                style={{ '--path-color': color }}
                onClick={() => handlePickPath(id)}
              >
                <span className={styles.pathEmoji}>{emoji}</span>
                <div className={styles.pathText}>
                  <span className={styles.pathLabel}>{label}</span>
                  <span className={styles.pathSub}>{sub}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.pathArrow}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
