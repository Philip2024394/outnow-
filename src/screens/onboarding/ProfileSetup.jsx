import { useEffect, useRef, useState } from 'react'
import { useCoins } from '@/hooks/useCoins'
import { ALL_COUNTRIES, detectCountryByIP, flagEmoji } from '@/utils/countries'
import styles from './ProfileSetup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

// Coins that fly from behind the reward card down to the footer badge
const FLY_COINS = [
  { sx: '-70px', mx: '-110px', delay: '0s'    },
  { sx: '-45px', mx: '-75px',  delay: '0.07s' },
  { sx: '-15px', mx: '-35px',  delay: '0.13s' },
  { sx:   '0px', mx:   '0px',  delay: '0.04s' },
  { sx:  '15px', mx:  '35px',  delay: '0.16s' },
  { sx:  '45px', mx:  '75px',  delay: '0.09s' },
  { sx:  '70px', mx: '110px',  delay: '0.12s' },
  { sx: '-30px', mx: '-55px',  delay: '0.2s'  },
  { sx:  '30px', mx:  '55px',  delay: '0.18s' },
  { sx:   '0px', mx: '-25px',  delay: '0.25s' },
]

// Confetti coins on completion screen — burst outward in a circle
const CONFETTI = [
  { tx:    '0px', ty: '-200px', delay: '0s'    },
  { tx:  '120px', ty: '-160px', delay: '0.05s' },
  { tx:  '190px', ty:  '-60px', delay: '0.1s'  },
  { tx:  '190px', ty:   '80px', delay: '0.08s' },
  { tx:  '120px', ty:  '180px', delay: '0.12s' },
  { tx:    '0px', ty:  '210px', delay: '0.06s' },
  { tx: '-120px', ty:  '180px', delay: '0.15s' },
  { tx: '-190px', ty:   '80px', delay: '0.09s' },
  { tx: '-190px', ty:  '-60px', delay: '0.11s' },
  { tx: '-120px', ty: '-160px', delay: '0.04s' },
  { tx:   '60px', ty: '-130px', delay: '0.19s' },
  { tx:  '-60px', ty: '-130px', delay: '0.22s' },
]

const SLIDE_REWARDS = [
  null,                                          // slide 0 — basics, no reward
  { key: 'ACTIVITIES_SET', amount: 5  },         // slide 1 — intent + venue
  { key: 'PROFILE_PHOTO',  amount: 10 },         // slide 2 — photo + bio
]

const GENDERS      = ['Male', 'Female']
const LOOKING_FOR  = ['Man', 'Woman']
const INTENT       = ['A date tonight', 'Something casual', 'Something serious', 'Open to anything']
const VENUE_TYPES  = ['Bar / Pub 🍺', 'Restaurant 🍽️', 'Coffee shop ☕', 'Gym / Sport 🏋️', 'Park / Outdoors 🌳', 'Cinema 🎬', 'Club / Nightlife 🎵', 'Art / Gallery 🎨', 'Market / Festival 🎪']

// ─── Coin burst overlay (per-slide reward) ─────────────────────────────────
function CoinBurst({ amount, onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1900)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className={styles.burstOverlay}>
      {/* Flying coins */}
      {FLY_COINS.map((c, i) => (
        <span
          key={i}
          className={styles.flyingCoin}
          style={{ '--sx': c.sx, '--mx': c.mx, animationDelay: c.delay }}
        >
          🪙
        </span>
      ))}
      {/* Reward card — on top of coins */}
      <div className={styles.burstCard}>
        <img src={LOGO_URL} alt="" className={styles.burstLogo} />
        <div className={styles.burstAmount}>+{amount} 🪙</div>
        <p className={styles.burstSub}>Added to your wallet!</p>
      </div>
    </div>
  )
}

// ─── Completion banner ─────────────────────────────────────────────────────
function CompletionBanner({ total, onGo }) {
  return (
    <div className={styles.completionOverlay}>
      {/* Confetti coins burst */}
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={styles.confettiCoin}
          style={{ '--tx': c.tx, '--ty': c.ty, animationDelay: c.delay }}
        >
          🪙
        </span>
      ))}
      <div className={styles.completionCard}>
        <img src={LOGO_URL} alt="" className={styles.completionLogo} />
        <div className={styles.completionCoinsWrap}>
          <span className={styles.completionCoinIcon}>🪙</span>
          <span className={styles.completionCoinsNum}>{total}</span>
        </div>
        <h2 className={styles.completionTitle}>You're all set!</h2>
        <p className={styles.completionSub}>
          Your coins are in your wallet — use them to send gifts on first meets.
        </p>
        <button className={styles.completionBtn} onClick={onGo}>
          Let's go out 🚀
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ProfileSetup({ onDone }) {
  const { earn } = useCoins()

  const [slide, setSlide]             = useState(0)
  const [leaving, setLeaving]         = useState(false)
  const [showBurst, setShowBurst]     = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [earnedTotal, setEarnedTotal] = useState(0)
  const [badgePulseTick, setBadgePulseTick] = useState(0)
  const [showSlider, setShowSlider]   = useState(false)
  const [coinFallActive, setCoinFallActive] = useState(false)
  const nameCoinRef  = useRef(null)
  const btnRef       = useRef(null)
  const btnCoinRef   = useRef(null)
  const [fallCoins, setFallCoins] = useState([])

  // Slide the card up as soon as the screen mounts (video has already ended/faded)
  useEffect(() => {
    const t = setTimeout(() => setShowSlider(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Slide 0
  const [name, setName]           = useState('')
  const [country, setCountry]     = useState('')   // selected country name
  const [countryQ, setCountryQ]   = useState('')   // typeahead query
  const [showSugg, setShowSugg]   = useState(false)
  const countryRef                = useRef(null)
  const countryInputRef           = useRef(null)

  // Slide 1
  const [gender, setGender]     = useState('')
  const [lookingFor, setLooking] = useState('')
  const [intent, setIntent]     = useState('')
  const [venueType, setVenue]   = useState('')

  // Slide 2
  const [photoEmoji] = useState(['😊','😎','🌸','🤙','✨','🎯','🔥','🦋'][Math.floor(Math.random()*8)])
  const [bio, setBio] = useState('')

  useEffect(() => {
    detectCountryByIP().then(found => {
      if (found) { setCountry(found.name); setCountryQ(found.name) }
    })
  }, [])

  // Close country suggestions when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) setShowSugg(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])


  const countrySuggestions = (() => {
    const q = countryQ.trim().toLowerCase()
    if (!q) return []
    const starts   = ALL_COUNTRIES.filter(c => c.name.toLowerCase().startsWith(q))
    const contains = ALL_COUNTRIES.filter(c => !c.name.toLowerCase().startsWith(q) && c.name.toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, 8)
  })()

  const canAdvance = [
    name.trim().length >= 2 && !!country && !!gender,
    !!gender && !!lookingFor && !!intent,
    true,
  ][slide]

  const handleContinue = () => {
    const reward = SLIDE_REWARDS[slide]
    if (reward) {
      earn(reward.key)
      if (slide === 2 && bio.trim()) earn('BIO_WRITTEN')
      setEarnedTotal(t => t + reward.amount + (slide === 2 && bio.trim() ? 5 : 0))
      setShowBurst(true)
    } else {
      // Slide 0 — coins fall into button, show total for 2s, then advance
      const coinBadgeRect = btnCoinRef.current?.getBoundingClientRect()
      const nameRect      = nameCoinRef.current?.getBoundingClientRect()
      if (coinBadgeRect && nameRect) {
        const endX = coinBadgeRect.left + coinBadgeRect.width / 2
        const endY = coinBadgeRect.top  + coinBadgeRect.height / 2
        setFallCoins([
          { id: 'name', startX: nameRect.left + nameRect.width / 2, startY: nameRect.top, endX, endY, label: '+6 🪙' },
        ])
        setCoinFallActive(true)
        // Coins land — show total
        setTimeout(() => {
          setEarnedTotal(6)
          setBadgePulseTick(t => t + 1)
          setCoinFallActive(false)
          setFallCoins([])
        }, 800)
        // 2 seconds showing total, then advance
        setTimeout(() => {
          setSlide(1)
        }, 2800)
      } else {
        setSlide(1)
      }
    }
  }

  const handleBurstComplete = () => {
    setShowBurst(false)
    setBadgePulseTick(t => t + 1)
    if (slide < 2) {
      setSlide(s => s + 1)
    } else {
      setShowCompletion(true)
    }
  }

  const handleFinish = () => {
    setLeaving(true)
    setTimeout(() => onDone({ name, gender, country, lookingFor, intent, venueType, bio, photoEmoji }), 350)
  }

  const requestNotifThenFinish = async () => {
    try { await Notification.requestPermission() } catch {}
    handleFinish()
  }

  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ''}`}>

      {showSlider && (
      <div className={styles.sliderCard}>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((slide + 1) / 3) * 100}%` }} />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleWrap} style={{flex:1}}>
          <span className={styles.headerTitle}>
            {['Who are you?', '', 'Your profile'][slide]}
          </span>
          {slide === 0 && <span className={styles.headerSub}>Let's get to know you</span>}
        </div>
        <span className={styles.stepLabel}>Step {slide + 1} of 3</span>
      </div>

      {/* Slide content — keyed so slide-up re-triggers on each change */}
      <div className={styles.inner}>
        <div key={slide} className={styles.slideContent}>

          {/* ── SLIDE 0: Name, Age, Country, City ── */}
          {slide === 0 && (
            <>
              <div className={styles.inputWrap}>
                <input
                  className={`${styles.input} ${styles.inputGlow}`}
                  placeholder="First name"
                  value={name}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^\p{L}]/gu, '')
                    setName(cleaned)
                  }}
                  maxLength={24}
                  autoComplete="given-name"
                  autoFocus
                  style={{ paddingRight: '64px' }}
                />
                <span ref={nameCoinRef} className={styles.inputInlineHint}>+5 🪙</span>
              </div>
              <p className={styles.fieldLabel}>Dating Country</p>
              <div className={styles.countryWrap} ref={countryRef}>
                <div className={styles.countryInputRow}>
                  {country && (
                    <span className={styles.countryFlag}>
                      {flagEmoji(ALL_COUNTRIES.find(c => c.name === country)?.code ?? '')}
                    </span>
                  )}
                  <input
                    ref={countryInputRef}
                    className={styles.countryInput}
                    placeholder="Search country…"
                    value={countryQ}
                    onChange={e => {
                      setCountryQ(e.target.value)
                      setCountry('')
                      setShowSugg(true)
                    }}
                    onFocus={() => setShowSugg(true)}
                    autoComplete="off"
                  />
                  {country && (
                    <button type="button" className={styles.countryClear}
                      onClick={() => { setCountry(''); setCountryQ(''); setShowSugg(true) }}>
                      ✕
                    </button>
                  )}
                </div>
                {showSugg && countrySuggestions.length > 0 && (
                  <ul className={styles.suggList}>
                    {countrySuggestions.map(c => (
                      <li
                        key={c.code}
                        className={styles.suggItem}
                        onMouseDown={() => {
                          setCountry(c.name)
                          setCountryQ(c.name)
                          setShowSugg(false)
                        }}
                      >
                        <span className={styles.suggFlag}>{flagEmoji(c.code)}</span>
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label className={styles.groupLabel}>I am</label>
              <div className={styles.chipGrid}>
                {GENDERS.map(g => (
                  <button key={g} className={`${styles.chip} ${gender === g ? styles.chipActive : ''}`} onClick={() => setGender(g)}>
                    {g} <span className={styles.chipCoin}>{gender === g ? '🪙' : '+1 🪙'}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── SLIDE 1: Gender, Intent, Venue ── */}
          {slide === 1 && (
            <>
              <h2 className={styles.title}>Tell us about you</h2>
              <p className={styles.sub}>Helps us show you the right people  •  Earns <strong className={styles.green}>+5 🪙</strong></p>
              <label className={styles.groupLabel}>Looking for</label>
              <div className={styles.chipGrid}>
                {LOOKING_FOR.map(l => (
                  <button key={l} className={`${styles.chip} ${lookingFor === l ? styles.chipActive : ''}`} onClick={() => setLooking(l)}>
                    {l} <span className={styles.chipCoin}>{lookingFor === l ? '🪙' : '+1 🪙'}</span>
                  </button>
                ))}
              </div>
              <label className={styles.groupLabel}>I want</label>
              <div className={styles.chipGrid}>
                {INTENT.map(i => (
                  <button key={i} className={`${styles.chip} ${intent === i ? styles.chipActive : ''}`} onClick={() => setIntent(i)}>
                    {i} <span className={styles.chipCoin}>{intent === i ? '🪙' : '+1 🪙'}</span>
                  </button>
                ))}
              </div>
              <label className={styles.groupLabel}>My ideal first meet…</label>
              <div className={styles.chipGrid}>
                {VENUE_TYPES.map(v => (
                  <button key={v} className={`${styles.chip} ${venueType === v ? styles.chipActive : ''}`} onClick={() => setVenue(v)}>
                    {v} <span className={styles.chipCoin}>{venueType === v ? '🪙' : '+1 🪙'}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── SLIDE 2: Photo + Bio + Notifications ── */}
          {slide === 2 && (
            <>
              <div className={styles.photoBig}>{photoEmoji}</div>
              <h2 className={styles.title}>Add a photo & bio</h2>
              <p className={styles.sub}>Photo earns <strong className={styles.green}>+10 🪙</strong>  •  Bio earns <strong className={styles.green}>+5 🪙</strong></p>
              <button className={styles.photoBtn}>📷 Add photo  +10 🪙</button>
              <textarea
                className={styles.bioInput}
                placeholder="A short line about yourself… (optional)"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={160}
                rows={3}
              />
              <div className={styles.notifBlock}>
                <span className={styles.notifEmoji}>🔔</span>
                <p className={styles.notifText}>Never miss a match — allow notifications</p>
                <button className={styles.notifInlineBtn} onClick={requestNotifThenFinish}>
                  Allow
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Coin badge — pulses when coins land */}
        {earnedTotal > 0 && (
          <div key={badgePulseTick} className={styles.coinBadge}>
            🪙 <span>{earnedTotal}</span> earned
          </div>
        )}

        <button
          ref={btnRef}
          className={`${styles.nextBtn} ${canAdvance ? styles.nextBtnPulse : ''}`}
          disabled={!canAdvance}
          onClick={handleContinue}
        >
          <span>
            {slide === 0 ? (() => {
              const steps = [
                name.trim().length >= 2,
                !!country,
                !!gender,
              ]
              const done = steps.filter(Boolean).length
              const chars = [1, 5, 9, 13][done]
              return 'Collect coins'.slice(0, chars)
            })() : 'Collect coins'}
          </span>
          <span ref={btnCoinRef} className={styles.nextBtnCoins}>
            🪙 {String(earnedTotal).padStart(3, '0')}
          </span>
        </button>

        {slide > 0 && (
          <button className={styles.skipLink} onClick={() => {
            if (slide < 2) setSlide(s => s + 1)
            else handleFinish()
          }}>
            Skip
          </button>
        )}
      </div>

      </div>
      )}

      {/* Slide 0 — flying coins from fields to button */}
      {coinFallActive && fallCoins.map(c => (
        <span
          key={c.id}
          className={styles.fallingCoin}
          style={{
            left: c.startX,
            top:  c.startY,
            '--end-x': `${c.endX - c.startX}px`,
            '--end-y': `${c.endY - c.startY}px`,
            animationDelay: `${(c.delay ?? 0)}ms`,
          }}
        >
          {c.label}
        </span>
      ))}


      {/* Per-slide coin burst */}
      {showBurst && (
        <CoinBurst
          amount={SLIDE_REWARDS[slide]?.amount ?? 0}
          onComplete={handleBurstComplete}
        />
      )}

      {/* Completion banner */}
      {showCompletion && (
        <CompletionBanner total={earnedTotal} onGo={handleFinish} />
      )}
    </div>
  )
}
