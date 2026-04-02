import { useEffect, useRef, useState } from 'react'
import { useCoins } from '@/hooks/useCoins'
import { ALL_COUNTRIES, detectCountryByIP } from '@/utils/countries'
import styles from './ProfileSetup.module.css'

const LOGO_URL    = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'
const VIDEO_URL   = import.meta.env.VITE_ONBOARDING_VIDEO_URL ?? ''

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

const LOOKING_FOR  = ['A date', 'New friends', 'Networking', 'Just browsing']
const GENDERS      = ['Man', 'Woman', 'Gay', 'Lesbian', 'Bisexual', 'Non-binary', 'Trans', 'Queer', 'Prefer not to say']
const VENUE_TYPES  = ['Bar / Pub 🍺', 'Restaurant 🍽️', 'Coffee shop ☕', 'Gym / Sport 🏋️', 'Park / Outdoors 🌳', 'Cinema 🎬', 'Club / Nightlife 🎵', 'Art / Gallery 🎨', 'Market / Festival 🎪']

// ─── Background video (or animated gradient fallback) ──────────────────────
function BgVideo() {
  if (!VIDEO_URL) {
    return <div className={styles.bgGradient} />
  }
  return (
    <video
      src={VIDEO_URL}
      className={styles.bgVideo}
      autoPlay muted loop playsInline
    />
  )
}

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

  // Slide 0
  const [name, setName]       = useState('')
  const [age, setAge]         = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity]       = useState('')

  // Slide 1
  const [gender, setGender]     = useState('')
  const [lookingFor, setLooking] = useState('')
  const [venueType, setVenue]   = useState('')

  // Slide 2
  const [photoEmoji] = useState(['😊','😎','🌸','🤙','✨','🎯','🔥','🦋'][Math.floor(Math.random()*8)])
  const [bio, setBio] = useState('')

  useEffect(() => {
    detectCountryByIP().then(found => { if (found) setCountry(found.name) })
  }, [])

  const canAdvance = [
    name.trim().length >= 2 && Number(age) >= 18 && Number(age) <= 99 && !!country,
    !!gender && !!lookingFor,
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
      // Slide 0 — no reward, just advance
      setSlide(1)
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
    setTimeout(() => onDone({ name, age, gender, country, city, lookingFor, venueType, bio, photoEmoji }), 350)
  }

  const requestNotifThenFinish = async () => {
    try { await Notification.requestPermission() } catch {}
    handleFinish()
  }

  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ''}`}>
      <BgVideo />
      <div className={styles.veil} />

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((slide + 1) / 3) * 100}%` }} />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <img src={LOGO_URL} alt="imoutnow" className={styles.logo} />
        <span className={styles.stepLabel}>Step {slide + 1} of 3</span>
      </div>

      {/* Slide content — keyed so slide-up re-triggers on each change */}
      <div className={styles.inner}>
        <div key={slide} className={styles.slideContent}>

          {/* ── SLIDE 0: Name, Age, Country, City ── */}
          {slide === 0 && (
            <>
              <img
                src="https://ik.imagekit.io/dateme/What's%20your%20name_%20in%20green.png"
                alt="What's your name?"
                className={styles.stepImg}
              />
              <input
                className={styles.input}
                placeholder="First name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={24}
                autoFocus
              />
              <input
                className={styles.input}
                placeholder="Age"
                value={age}
                onChange={e => setAge(e.target.value.replace(/\D/, ''))}
                inputMode="numeric"
                maxLength={2}
              />
              {age && Number(age) < 18 && <p className={styles.error}>You must be 18 or over.</p>}
              <div className={styles.selectWrap}>
                <span className={styles.selectIcon}>
                  {country ? (ALL_COUNTRIES.find(c => c.name === country)?.flag ?? '🏳️') : '🏳️'}
                </span>
                <select className={styles.select} value={country} onChange={e => setCountry(e.target.value)}>
                  <option value="">Select your country…</option>
                  {ALL_COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
                <svg className={styles.selectChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <input
                className={styles.input}
                placeholder="City (e.g. London)"
                value={city}
                onChange={e => setCity(e.target.value)}
                maxLength={40}
              />
            </>
          )}

          {/* ── SLIDE 1: Gender, Intent, Venue ── */}
          {slide === 1 && (
            <>
              <h2 className={styles.title}>Tell us about you</h2>
              <p className={styles.sub}>Helps us show you the right people  •  Earns <strong className={styles.green}>+5 🪙</strong></p>
              <label className={styles.groupLabel}>I am a…</label>
              <div className={styles.chipGrid}>
                {GENDERS.map(g => (
                  <button key={g} className={`${styles.chip} ${gender === g ? styles.chipActive : ''}`} onClick={() => setGender(g)}>{g}</button>
                ))}
              </div>
              <label className={styles.groupLabel}>I'm here to…</label>
              <div className={styles.chipGrid}>
                {LOOKING_FOR.map(l => (
                  <button key={l} className={`${styles.chip} ${lookingFor === l ? styles.chipActive : ''}`} onClick={() => setLooking(l)}>{l}</button>
                ))}
              </div>
              <label className={styles.groupLabel}>My ideal first meet…</label>
              <div className={styles.chipGrid}>
                {VENUE_TYPES.map(v => (
                  <button key={v} className={`${styles.chip} ${venueType === v ? styles.chipActive : ''}`} onClick={() => setVenue(v)}>{v}</button>
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
          className={styles.nextBtn}
          disabled={!canAdvance}
          onClick={handleContinue}
        >
          {slide === 2 ? "Complete  🚀" : 'Continue →'}
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
