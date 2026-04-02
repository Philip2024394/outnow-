import { useState, useEffect } from 'react'
import { useCoins } from '@/hooks/useCoins'
import { ALL_COUNTRIES, detectCountryByIP } from '@/utils/countries'
import styles from './ProfileSetup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

function countryFlag(name) {
  return ALL_COUNTRIES.find(c => c.name === name)?.flag ?? '🏳️'
}

const LOOKING_FOR  = ['A date', 'New friends', 'Networking', 'Just browsing']
const GENDERS      = ['Man', 'Woman', 'Gay', 'Lesbian', 'Bisexual', 'Non-binary', 'Trans', 'Queer', 'Prefer not to say']
const VENUE_TYPES  = ['Bar / Pub 🍺', 'Restaurant 🍽️', 'Coffee shop ☕', 'Gym / Sport 🏋️', 'Park / Outdoors 🌳', 'Cinema / Theatre 🎬', 'Club / Nightlife 🎵', 'Art / Gallery 🎨', 'Market / Festival 🎪', 'Other 📍']

const SLIDE_REWARDS = {
  0: null,                // name/age — no reward, just basics
  1: { key: 'ACTIVITIES_SET', label: '+5 🪙 Intent saved!',  amount: 5  },
  2: { key: 'PROFILE_PHOTO',  label: '+10 🪙 Photo added!', amount: 10 },
}

export default function ProfileSetup({ onDone }) {
  const { earn } = useCoins()
  const [slide, setSlide]     = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [coinPop, setCoinPop] = useState(null) // text shown on coin reward

  // Slide 0 — name, age, country, city
  const [name, setName]       = useState('')
  const [age, setAge]         = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity]       = useState('')

  // Slide 1 — gender, intent, venue preference
  const [gender, setGender]     = useState('')
  const [lookingFor, setLooking] = useState('')
  const [venueType, setVenue]   = useState('')

  // Slide 2 — photo, bio
  const [photoEmoji]            = useState(['😊','😎','🌸','🤙','✨','🎯','🔥','🦋'][Math.floor(Math.random()*8)])
  const [bio, setBio]           = useState('')

  useEffect(() => {
    detectCountryByIP().then(found => { if (found) setCountry(found.name) })
  }, [])

  const canAdvance = [
    name.trim().length >= 2 && Number(age) >= 18 && Number(age) <= 99 && !!country,
    !!gender && !!lookingFor,
    true, // photo + bio are optional
  ][slide]

  const showCoinPop = (text) => {
    setCoinPop(text)
    setTimeout(() => setCoinPop(null), 2000)
  }

  const advance = () => {
    const reward = SLIDE_REWARDS[slide]
    if (reward) {
      earn(reward.key)
      showCoinPop(reward.label)
      // Delay slide change so user sees the reward flash
      setTimeout(() => setSlide(s => s + 1), 600)
    } else {
      setSlide(s => s + 1)
    }
  }

  const finish = () => {
    const reward = SLIDE_REWARDS[2]
    if (bio.trim() && reward) earn('BIO_WRITTEN')
    if (reward) earn(reward.key)
    setLeaving(true)
    setTimeout(() => onDone({ name, age, gender, country, city, lookingFor, venueType, bio, photoEmoji }), 350)
  }

  const requestNotif = async () => {
    try { await Notification.requestPermission() } catch {}
    finish()
  }

  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ''}`}>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((slide + 1) / 3) * 100}%` }} />
      </div>

      <div className={styles.header}>
        <img src={LOGO_URL} alt="imoutnow.com" className={styles.logo} />
        <span className={styles.stepLabel}>Step {slide + 1} of 3</span>
      </div>

      {/* Coin reward pop */}
      {coinPop && (
        <div className={styles.coinPop}>{coinPop}</div>
      )}

      <div className={styles.inner}>

        {/* ── SLIDE 0: Name, Age, Country, City ── */}
        {slide === 0 && (
          <div className={styles.slideContent}>
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
            {age && Number(age) < 18 && (
              <p className={styles.error}>You must be 18 or over.</p>
            )}

            <div className={styles.selectWrap}>
              <span className={styles.selectIcon}>{country ? countryFlag(country) : '🏳️'}</span>
              <select
                className={styles.select}
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
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
          </div>
        )}

        {/* ── SLIDE 1: Gender, Intent, Venue preference ── */}
        {slide === 1 && (
          <div className={styles.slideContent}>
            <h2 className={styles.title}>Tell us about you</h2>
            <p className={styles.sub}>Helps us show you the right people</p>

            <label className={styles.groupLabel}>I am a…</label>
            <div className={styles.chipGrid}>
              {GENDERS.map(g => (
                <button
                  key={g}
                  className={`${styles.chip} ${gender === g ? styles.chipActive : ''}`}
                  onClick={() => setGender(g)}
                >{g}</button>
              ))}
            </div>

            <label className={styles.groupLabel}>I'm here to…</label>
            <div className={styles.chipGrid}>
              {LOOKING_FOR.map(l => (
                <button
                  key={l}
                  className={`${styles.chip} ${lookingFor === l ? styles.chipActive : ''}`}
                  onClick={() => setLooking(l)}
                >{l}</button>
              ))}
            </div>

            <label className={styles.groupLabel}>My ideal first meet…</label>
            <div className={styles.chipGrid}>
              {VENUE_TYPES.map(v => (
                <button
                  key={v}
                  className={`${styles.chip} ${venueType === v ? styles.chipActive : ''}`}
                  onClick={() => setVenue(v)}
                >{v}</button>
              ))}
            </div>

            <div className={styles.rewardHint}>
              Complete this step and earn <strong>+5 🪙</strong>
            </div>
          </div>
        )}

        {/* ── SLIDE 2: Photo + Bio ── */}
        {slide === 2 && (
          <div className={styles.slideContent}>
            <div className={styles.photoBig}>{photoEmoji}</div>
            <h2 className={styles.title}>Add a photo & short bio</h2>
            <p className={styles.sub}>Profiles with photos get 3× more matches</p>

            <button className={styles.photoBtn}>📷 Choose photo  +10 🪙</button>

            <textarea
              className={styles.bioInput}
              placeholder="A short line about yourself… (optional)"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={3}
            />
            {bio.trim().length > 0 && (
              <span className={styles.rewardHint}>Bio earns you <strong>+5 🪙</strong> too!</span>
            )}

            <div className={styles.notifBlock}>
              <div className={styles.notifIcon}>🔔</div>
              <p className={styles.notifText}>Turn on notifications so you never miss a match nearby</p>
              <button className={styles.notifBtn} onClick={requestNotif}>
                Allow notifications
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer CTA */}
      <div className={styles.footer}>
        <button
          className={styles.nextBtn}
          disabled={!canAdvance}
          onClick={slide < 2 ? advance : finish}
        >
          {slide === 2 ? "Let's go 🚀" : 'Continue →'}
        </button>
        {slide < 2 && (
          <button className={styles.skipLink} onClick={() => setSlide(s => s + 1)}>
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
