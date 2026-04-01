import { useState } from 'react'
import styles from './ProfileSetup.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const GENDERS   = ['Man', 'Woman', 'Non-binary', 'Prefer not to say']
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
  const [tagline, setTagline]     = useState('')
  const [lookingFor, setLooking]  = useState('')
  const [available, setAvailable] = useState('')
  const [meetFirst, setMeetFirst] = useState([])
  const [photoEmoji]              = useState(['😊','😎','🌸','🤙','✨','🎯','🔥','🦋'][Math.floor(Math.random()*8)])
  const [notifGranted, setNotif]  = useState(false)

  const toggleMeet = (v) =>
    setMeetFirst(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])

  const finish = () => {
    setLeaving(true)
    setTimeout(() => onDone({
      name, age, gender, tagline, lookingFor, available,
      meetFirst, photoEmoji,
    }), 350)
  }

  const canNext = [
    name.trim().length >= 2 && age >= 18 && age <= 99,
    !!gender,
    !!lookingFor && !!available,
    true, // notifications step always passable
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
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.logo} />

        {/* ── STEP 0: Name + Age ── */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <div className={styles.avatar}>{photoEmoji}</div>
            <h2 className={styles.title}>What's your name?</h2>
            <p className={styles.sub}>This is how others will see you on the map.</p>

            <input
              className={styles.input}
              placeholder="First name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />

            <div className={styles.ageRow}>
              <label className={styles.ageLabel}>Age</label>
              <input
                className={`${styles.input} ${styles.ageInput}`}
                placeholder="e.g. 26"
                value={age}
                onChange={e => setAge(e.target.value.replace(/\D/,''))}
                inputMode="numeric"
                maxLength={2}
              />
            </div>

            {age && (age < 18) && (
              <p className={styles.error}>You must be 18 or over to use IMOUTNOW.</p>
            )}
          </div>
        )}

        {/* ── STEP 1: Gender ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>I identify as…</h2>
            <p className={styles.sub}>Used to personalise your experience and keep the app safe.</p>
            <div className={styles.optionList}>
              {GENDERS.map(g => (
                <button
                  key={g}
                  className={`${styles.optionBtn} ${gender === g ? styles.optionActive : ''}`}
                  onClick={() => setGender(g)}
                >
                  {g}
                  {gender === g && <span className={styles.optionCheck}>✓</span>}
                </button>
              ))}
            </div>
            {gender === 'Woman' && (
              <div className={styles.safeNote}>
                🛡️ Women on IMOUTNOW get verified profile badges and priority safety controls.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Intent + Meet type ── */}
        {step === 2 && (
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
            {step === 2 ? 'Almost done →' : 'Continue →'}
          </button>
          <p className={styles.footerNote}>Step {step + 1} of {TOTAL_STEPS}</p>
        </div>
      )}
    </div>
  )
}
