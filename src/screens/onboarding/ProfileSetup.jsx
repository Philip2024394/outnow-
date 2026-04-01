import { useState, useEffect } from 'react'
import styles from './ProfileSetup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

// Detect country from timezone
function detectCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    if (tz.includes('London') || tz.includes('Europe/London')) return 'United Kingdom'
    if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles') || tz.includes('America/Denver')) return 'United States'
    if (tz.includes('Europe/Dublin')) return 'Ireland'
    if (tz.includes('Europe/Paris') || tz.includes('Europe/Berlin') || tz.includes('Europe/Amsterdam')) return 'Europe'
    if (tz.includes('Australia')) return 'Australia'
    if (tz.includes('America/Toronto') || tz.includes('America/Vancouver')) return 'Canada'
    if (tz.includes('Asia/Dubai')) return 'UAE'
  } catch {}
  return ''
}

const COUNTRIES = [
  'United Kingdom', 'United States', 'Ireland', 'Australia', 'Canada',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden',
  'Norway', 'Denmark', 'Portugal', 'Belgium', 'Switzerland',
  'UAE', 'South Africa', 'New Zealand', 'Singapore', 'Other',
]

const LOOKING   = ['Date', 'Meet now', 'Chat first', 'Just browsing']
const AVAILABLE = ['Right now', 'Today', 'Tonight', 'This weekend']
const MEET_FIRST = ['☕ Coffee', '🍺 Drinks', '🚶 Walk', '🍽️ Dinner']

const TOTAL_STEPS = 4

export default function ProfileSetup({ onDone }) {
  const [step, setStep]       = useState(0)
  const [leaving, setLeaving] = useState(false)

  // Profile fields
  const [name, setName]           = useState('')
  const [age, setAge]             = useState('')
  const [gender, setGender]       = useState('')
  const [country, setCountry]     = useState('')
  const [tagline, setTagline]     = useState('')
  const [lookingFor, setLooking]  = useState('')
  const [available, setAvailable] = useState('')
  const [meetFirst, setMeetFirst] = useState([])
  const [photoEmoji]              = useState(['😊','😎','🌸','🤙','✨','🎯','🔥','🦋'][Math.floor(Math.random()*8)])
  const [, setNotif]  = useState(false)

  useEffect(() => {
    const detected = detectCountry()
    if (detected) setCountry(detected)
  }, [])

  const toggleMeet = (v) =>
    setMeetFirst(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])

  const finish = () => {
    setLeaving(true)
    setTimeout(() => onDone({
      name, age, gender, country, tagline, lookingFor, available,
      meetFirst, photoEmoji,
    }), 350)
  }

  const canNext = [
    name.trim().length >= 2 && Number(age) >= 18 && Number(age) <= 99 && !!gender,
    !!lookingFor && !!available,
    true,
    true,
  ][step]

  const requestNotif = async () => {
    try {
      const perm = await Notification.requestPermission()
      setNotif(perm === 'granted')
    } catch {
      setNotif(false)
    }
    finish()
  }

  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ''}`}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className={styles.inner}>
        <img src={LOGO_URL} alt="imoutnow.com" className={styles.logo} />

        {/* ── STEP 0: Name + Country + Age + Gender ── */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <div className={styles.avatar}>{photoEmoji}</div>
            <h2 className={styles.title}>What's your name?</h2>
            <p className={styles.sub}>This is how others will see you on the map.</p>

            {/* Name */}
            <input
              className={styles.input}
              placeholder="First name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />

            {/* Country */}
            <div className={styles.selectWrap}>
              <span className={styles.selectIcon}>🌍</span>
              <select
                className={styles.select}
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <svg className={styles.selectChevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* Age + Gender row */}
            <div className={styles.ageGenderRow}>
              <input
                className={`${styles.input} ${styles.ageInput}`}
                placeholder="Age"
                value={age}
                onChange={e => setAge(e.target.value.replace(/\D/, ''))}
                inputMode="numeric"
                maxLength={2}
              />
              <div className={styles.genderPair}>
                {['Male', 'Female'].map(g => (
                  <button
                    key={g}
                    className={`${styles.genderBtn} ${gender === g ? styles.genderActive : ''}`}
                    onClick={() => setGender(g)}
                  >
                    {g === 'Male' ? '♂' : '♀'} {g}
                  </button>
                ))}
              </div>
            </div>

            {age && Number(age) < 18 && (
              <p className={styles.error}>You must be 18 or over to use imoutnow.com.</p>
            )}
          </div>
        )}

        {/* ── STEP 1: Intent + Meet type ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>What are you here for?</h2>
            <p className={styles.sub}>Be honest — it gets better results.</p>

            <label className={styles.groupLabel}>Looking for</label>
            <div className={styles.chipGrid}>
              {LOOKING.map(l => (
                <button
                  key={l}
                  className={`${styles.chip} ${lookingFor === l ? styles.chipActive : ''}`}
                  onClick={() => setLooking(l)}
                >{l}</button>
              ))}
            </div>

            <label className={styles.groupLabel}>Available</label>
            <div className={styles.chipGrid}>
              {AVAILABLE.map(a => (
                <button
                  key={a}
                  className={`${styles.chip} ${available === a ? styles.chipActive : ''}`}
                  onClick={() => setAvailable(a)}
                >{a}</button>
              ))}
            </div>

            <label className={styles.groupLabel}>Prefer to meet for (pick any)</label>
            <div className={styles.chipGrid}>
              {MEET_FIRST.map(m => (
                <button
                  key={m}
                  className={`${styles.chip} ${meetFirst.includes(m) ? styles.chipActive : ''}`}
                  onClick={() => toggleMeet(m)}
                >{m}</button>
              ))}
            </div>

            <input
              className={styles.input}
              placeholder="Quick tagline — e.g. Coffee now? 😊"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              maxLength={60}
            />
          </div>
        )}

        {/* ── STEP 2: Photo placeholder ── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.photoBig}>{photoEmoji}</div>
            <h2 className={styles.title}>Add a photo</h2>
            <p className={styles.sub}>Profiles with photos get 3× more matches. You can skip this for now.</p>
            <button className={styles.photoBtn}>📷 Choose photo</button>
          </div>
        )}

        {/* ── STEP 3: Notifications ── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.notifIcon}>🔔</div>
            <h2 className={styles.title}>Never miss a match</h2>
            <p className={styles.sub}>
              When someone nearby goes live that matches your vibe, we'll notify you instantly.
              No spam. Just real-time meet-up alerts.
            </p>

            <div className={styles.notifFeatures}>
              {[
                ['⚡', 'Instant match alerts'],
                ['📍', 'Someone near you is out'],
                ['❤️', 'Mutual interest notification'],
              ].map(([icon, text]) => (
                <div key={text} className={styles.notifFeature}>
                  <span className={styles.notifFeatureIcon}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button className={styles.notifBtn} onClick={requestNotif}>
              🔔 Turn on notifications
            </button>
            <button className={styles.notifSkip} onClick={finish}>
              Maybe later
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA — all steps except notifications */}
      {step < 3 && (
        <div className={styles.footer}>
          <button
            className={styles.nextBtn}
            disabled={!canNext}
            onClick={() => setStep(s => s + 1)}
          >
            {step === 1 ? 'Almost done →' : 'Continue →'}
          </button>
          <p className={styles.footerNote}>Step {step + 1} of {TOTAL_STEPS}</p>
        </div>
      )}
    </div>
  )
}
