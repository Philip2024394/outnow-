import { useEffect, useState } from 'react'
import styles from './WelcomeScreen.module.css'

const SLIDES = [
  {
    emoji: '📍',
    title: 'People Are Out\nNear You Right Now',
    sub: 'IMOUTNOW shows you who is actually out — in your city, tonight.',
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

export default function WelcomeScreen({ onDone }) {
  const [slide, setSlide] = useState(0)
  const [exiting, setExiting] = useState(false)

  // Auto-advance every 2.8 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      if (slide < SLIDES.length - 1) {
        setSlide(s => s + 1)
      } else {
        handleDone()
      }
    }, 2800)
    return () => clearTimeout(t)
  }, [slide]) // eslint-disable-line

  function handleDone() {
    setExiting(true)
    setTimeout(onDone, 500)
  }

  const current = SLIDES[slide]

  return (
    <div className={`${styles.screen} ${exiting ? styles.screenExit : ''}`}>
      {/* Background glow */}
      <div className={styles.glow} />

      <div className={styles.body}>
        {/* Logo wordmark */}
        <div className={styles.wordmark}>IMOUTNOW</div>

        {/* Slide content */}
        <div className={styles.slide} key={slide}>
          <div className={styles.emoji}>{current.emoji}</div>
          <h1 className={styles.title}>{current.title}</h1>
          <p className={styles.sub}>{current.sub}</p>
        </div>

        {/* Dot indicators */}
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

      {/* Skip / Continue button */}
      <div className={styles.footer}>
        <button className={styles.continueBtn} onClick={handleDone}>
          {slide === SLIDES.length - 1 ? "Let's Go →" : 'Skip'}
        </button>
      </div>
    </div>
  )
}
