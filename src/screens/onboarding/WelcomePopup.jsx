import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { shuffleBios } from './bios'
import styles from './WelcomePopup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'
const TC_URL = import.meta.env.VITE_TC_URL ?? 'https://imoutnow.com/terms'
const PP_URL = import.meta.env.VITE_PP_URL ?? 'https://imoutnow.com/privacy'

const ITEM_H = 112 // px — height of each bio row in the carousel

const STEPS = [
  {
    id: 'discover',
    icon: '📍',
    accent: '#8DC63F',
    title: "See Who's Out Near You",
    body: "imoutnow shows real people who are actually out nearby right now — on a live map. No endless profiles, no swiping. If they're out, you'll see them.",
  },
  {
    id: 'meet',
    icon: '💌',
    accent: '#8DC63F',
    title: 'Send a Meet Request',
    body: "See someone you'd like to meet? Tap their profile and send a request. If they accept, a chat window opens instantly between you both.",
  },
  {
    id: 'unlock',
    icon: '🔓',
    accent: '#8DC63F',
    title: 'Share Contact · £1.99',
    body: "Chat is completely free. When you're both ready to share personal contact details, either of you pays £1.99 once — then sharing is free forever. No pressure, no time limit.",
  },
  {
    id: 'safety',
    icon: '🛡️',
    accent: '#8DC63F',
    title: 'Your Safety Matters',
    body: null,
  },
  {
    id: 'bio',
    icon: '✏️',
    accent: '#8DC63F',
    title: 'Pick Your Bio',
    body: null,
  },
  {
    id: 'terms',
    icon: null,
    accent: '#8DC63F',
    title: 'Before You Start',
    body: null,
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

  // Bio carousel
  const bios           = useMemo(() => shuffleBios(), [])
  const startIdx       = useMemo(() => Math.floor(Math.random() * bios.length), [bios])
  const [bioIdx, setBioIdx] = useState(startIdx)
  const selectedBioRef = useRef(bios[startIdx])
  const bioScrollRef   = useRef(null)
  const scrollRafRef   = useRef(null)

  // Scroll carousel to the random start index on mount
  useEffect(() => {
    const el = bioScrollRef.current
    if (!el) return
    el.scrollTop = startIdx * ITEM_H
  }, [startIdx])

  const handleBioScroll = useCallback(() => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
    scrollRafRef.current = requestAnimationFrame(() => {
      const el = bioScrollRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, bios.length - 1))
      setBioIdx(clamped)
      selectedBioRef.current = bios[clamped]
    })
  }, [bios])

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const finish = () => {
    setLeaving(true)
    setTimeout(() => onDone(selectedBioRef.current), 350)
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
        <img src={LOGO_URL} alt="imoutnow.com" className={styles.logo} />

        {/* Generic info steps */}
        {current.id !== 'safety' && current.id !== 'bio' && current.id !== 'terms' && (
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
              imoutnow.com is designed to be safe and fun. When used correctly, it&apos;s a great way to meet people.
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

        {/* Bio picker step */}
        {current.id === 'bio' && (
          <div className={styles.bioWrap}>
            <h2 className={styles.stepTitle}>Pick Your Bio</h2>
            <p className={styles.bioHint}>Scroll up or down · the one in the middle is yours</p>

            <div className={styles.bioPicker}>
              {/* Fade overlays */}
              <div className={styles.bioFadeTop} />
              <div className={styles.bioFadeBot} />
              {/* Center selection highlight */}
              <div className={styles.bioHighlight} />

              <div
                ref={bioScrollRef}
                className={styles.bioScroll}
                onScroll={handleBioScroll}
              >
                {/* Top spacer so first item can center */}
                <div className={styles.bioSpacer} />
                {bios.map((bio, i) => (
                  <div
                    key={i}
                    className={`${styles.bioItem} ${i === bioIdx ? styles.bioItemActive : ''}`}
                    style={{ height: ITEM_H }}
                  >
                    {bio}
                  </div>
                ))}
                {/* Bottom spacer */}
                <div className={styles.bioSpacer} />
              </div>
            </div>

            <p className={styles.bioNote}>You can edit this anytime from your profile</p>
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
              We need you to confirm you have read and agree to our Terms &amp; Conditions. These protect you and every member of the imoutnow.com community.
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
          {isLast ? "Let's go 🚀" : current.id === 'bio' ? 'Use this bio' : 'Next'}
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
