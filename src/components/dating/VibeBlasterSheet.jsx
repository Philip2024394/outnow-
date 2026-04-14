/**
 * VibeBlasterSheet.jsx
 * Full-page "Vibe Blaster" feature — lets a dating user broadcast their activity
 * preference to all dating members in the same city.
 *
 * Flow: filter → terms → blasting (animation) → done
 * Paid: $1.99/use, 1 per week, 1 free blast with every new account.
 */

import { useState, useEffect, useRef } from 'react'
import styles from './VibeBlasterSheet.module.css'

const ACTIVITIES = [
  'Rooftop Drinks',
  'Restaurant Meal',
  'Dance Club',
  'Hiking Walk',
  'Afternoon Coffee',
  'Evening Meal',
  'Late Night Snacks',
  'Afternoon Gym',
  'Shopping',
  'Visit the Beach',
]

const TERMS = [
  'You must be 18 years of age or older to use Vibe Blaster.',
  'If you decide to meet, choose a busy public place with people present around you.',
  'Always tell a trusted friend or family member who you are meeting and where.',
]

const DAY_IMG   = 'https://ik.imagekit.io/nepgaxllc/Blast%20of%20vibrant%20Indonesian%20heritage.png?updatedAt=1775895523165'
const NIGHT_IMG = 'https://ik.imagekit.io/nepgaxllc/Pressing%20the%20glow%20of%20Indonesia%27s%20heritage.png?updatedAt=1775895674991'

// Activity emojis for visual flair
const ACTIVITY_EMOJI = {
  'Rooftop Drinks':    '🥂',
  'Restaurant Meal':   '🍽️',
  'Dance Club':        '🎶',
  'Hiking Walk':       '🥾',
  'Afternoon Coffee':  '☕',
  'Evening Meal':      '🌆',
  'Late Night Snacks': '🌙',
  'Afternoon Gym':     '💪',
  'Shopping':          '🛍️',
  'Visit the Beach':   '🏖️',
}

export default function VibeBlasterSheet({ open, onClose, showToast, myProfile }) {
  const [activity, setActivity] = useState('')
  const [ageMin,   setAgeMin]   = useState(18)
  const [ageMax,   setAgeMax]   = useState(40)
  const [gender,   setGender]   = useState('any')
  const [phase,    setPhase]    = useState('filter')  // filter | terms | blasting | done
  const [blastPct,   setBlastPct]   = useState(0)
  const [blastCount, setBlastCount] = useState(0)
  const [targetCount, setTargetCount] = useState(0)
  const timerRef = useRef(null)

  const hour  = new Date().getHours()
  const isDay = hour >= 7 && hour < 19
  const bgImg = isDay ? DAY_IMG : NIGHT_IMG

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      clearInterval(timerRef.current)
      setPhase('filter')
      setActivity('')
      setAgeMin(18)
      setAgeMax(40)
      setGender('any')
      setBlastPct(0)
      setBlastCount(0)
    }
  }, [open])

  // Blast counter animation
  useEffect(() => {
    if (phase !== 'blasting') return
    const total = Math.floor(Math.random() * 48) + 18 // 18–66 profiles
    setTargetCount(total)
    let pct   = 0
    let count = 0
    timerRef.current = setInterval(() => {
      pct += Math.random() * 2.8 + 0.8
      if (pct >= 100) {
        pct   = 100
        count = total
        setBlastPct(100)
        setBlastCount(total)
        clearInterval(timerRef.current)
        setTimeout(() => setPhase('done'), 900)
        return
      }
      count = Math.round((pct / 100) * total)
      setBlastPct(pct)
      setBlastCount(count)
    }, 60)
    return () => clearInterval(timerRef.current)
  }, [phase])

  if (!open) return null

  const canBlast = !!activity

  const handleBlastNow = () => {
    if (!canBlast) { showToast?.('Please select an activity first', 'error'); return }
    setPhase('terms')
  }

  const handleAgree = () => {
    // TODO: supabase insert into vibe_blasts, send push notifications to matching users
    setPhase('blasting')
  }

  return (
    <div className={styles.wrapper}>
      {/* Background image + gradient */}
      <div
        className={styles.bg}
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className={`${styles.bgOverlay} ${isDay ? styles.bgOverlayDay : styles.bgOverlayNight}`} />

      {/* ── FILTER phase ── */}
      {phase === 'filter' && (
        <div className={styles.page}>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <div className={styles.titleBlock}>
              <span className={styles.titleBadge}>⚡ Vibe Blaster</span>
              <p className={styles.titleSub}>Send your vibe to dating members in your city</p>
            </div>
            <div className={styles.priceBadge}>
              <span className={styles.priceMain}>$1.99</span>
              <span className={styles.priceSub}>per blast</span>
            </div>
          </div>

          {/* Free credit note */}
          <div className={styles.freeNote}>
            <span className={styles.freeNoteIcon}>🎁</span>
            <span className={styles.freeNoteText}>1 free Vibe Blast included with every new account · 1 blast per week</span>
          </div>

          {/* Filters */}
          <div className={styles.filtersCard}>
            {/* Activity */}
            <div className={styles.filterGroup}>
              <p className={styles.filterHeader}>Who is Interested in...</p>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={activity}
                  onChange={e => setActivity(e.target.value)}
                >
                  <option value="">Choose an activity</option>
                  {ACTIVITIES.map(a => (
                    <option key={a} value={a}>{ACTIVITY_EMOJI[a]}  {a}</option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▾</span>
              </div>
              {activity && (
                <div className={styles.activityPreview}>
                  <span className={styles.activityEmoji}>{ACTIVITY_EMOJI[activity]}</span>
                  <span className={styles.activityName}>{activity}</span>
                </div>
              )}
            </div>

            {/* Age range */}
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Age Range</p>
              <div className={styles.ageRow}>
                <div className={styles.ageInput}>
                  <input
                    type="number" min={18} max={ageMax - 1}
                    value={ageMin}
                    onChange={e => setAgeMin(Math.max(18, Math.min(+e.target.value, ageMax - 1)))}
                    className={styles.ageNum}
                  />
                  <span className={styles.ageNumLabel}>min</span>
                </div>
                <span className={styles.ageDash}>—</span>
                <div className={styles.ageInput}>
                  <input
                    type="number" min={ageMin + 1} max={80}
                    value={ageMax}
                    onChange={e => setAgeMax(Math.max(ageMin + 1, Math.min(+e.target.value, 80)))}
                    className={styles.ageNum}
                  />
                  <span className={styles.ageNumLabel}>max</span>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Looking For</p>
              <div className={styles.genderPills}>
                {['any', 'male', 'female'].map(g => (
                  <button
                    key={g}
                    className={`${styles.genderPill} ${gender === g ? styles.genderPillActive : ''}`}
                    onClick={() => setGender(g)}
                  >
                    {g === 'any' ? 'Everyone' : g === 'male' ? '👨 Male' : '👩 Female'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Blast button */}
          <div className={styles.footer}>
            <button
              className={`${styles.blastBtn} ${!canBlast ? styles.blastBtnOff : ''}`}
              onClick={handleBlastNow}
              disabled={!canBlast}
            >
              <span className={styles.blastBtnIcon}>⚡</span>
              Blast Now
            </button>
            <p className={styles.footerHint}>Members in your city will receive an instant notification</p>
          </div>
        </div>
      )}

      {/* ── TERMS phase ── */}
      {phase === 'terms' && (
        <div className={styles.page}>
          <div className={styles.termsPage}>
            <div className={styles.termsCard}>
              <div className={styles.termsIconWrap}>
                <span className={styles.termsIcon}>⚠️</span>
              </div>
              <h2 className={styles.termsTitle}>Before You Blast</h2>
              <p className={styles.termsSub}>By sending a Vibe Blast you confirm and agree to the following safety terms:</p>

              <div className={styles.termsList}>
                {TERMS.map((term, i) => (
                  <div key={i} className={styles.termRow}>
                    <span className={styles.termNum}>{i + 1}</span>
                    <p className={styles.termText}>{term}</p>
                  </div>
                ))}
              </div>

              <div className={styles.blastPreview}>
                <span className={styles.blastPreviewIcon}>{ACTIVITY_EMOJI[activity]}</span>
                <div>
                  <p className={styles.blastPreviewLabel}>Your blast</p>
                  <p className={styles.blastPreviewActivity}>{activity}</p>
                  <p className={styles.blastPreviewMeta}>{ageMin}–{ageMax} yrs · {gender === 'any' ? 'Everyone' : gender === 'male' ? 'Male' : 'Female'}</p>
                </div>
              </div>

              <button className={styles.agreeBtn} onClick={handleAgree}>
                I Agree — Send My Vibe ⚡
              </button>
              <button className={styles.termsBackBtn} onClick={() => setPhase('filter')}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLASTING animation phase ── */}
      {phase === 'blasting' && (
        <div className={styles.page}>
          <div className={styles.blastingPage}>
            <div className={styles.blastingGlow} />

            <div className={styles.blastingEmoji}>{ACTIVITY_EMOJI[activity] ?? '⚡'}</div>

            <h2 className={styles.blastingActivity}>{activity}</h2>
            <p className={styles.blastingLabel}>Sending your vibe...</p>

            {/* Progress bar */}
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${blastPct}%` }}
              />
            </div>

            {/* Counter */}
            <div className={styles.countWrap}>
              <span className={styles.countNum}>{blastCount}</span>
              <span className={styles.countLabel}>members reached</span>
            </div>

            {/* Pulse rings */}
            <div className={styles.pulseRing1} />
            <div className={styles.pulseRing2} />
          </div>
        </div>
      )}

      {/* ── DONE phase ── */}
      {phase === 'done' && (
        <div className={styles.page}>
          <div className={styles.donePage}>
            <div className={styles.doneGlow} />
            <div className={styles.doneEmoji}>💫</div>
            <h2 className={styles.doneTitle}>Vibe Sent!</h2>
            <p className={styles.doneSub}>
              Your <strong>{activity}</strong> blast reached{' '}
              <strong>{targetCount} members</strong> in your city.
            </p>
            <div className={styles.doneInfoCard}>
              <div className={styles.doneInfoRow}>
                <span className={styles.doneInfoIcon}>📩</span>
                <span className={styles.doneInfoText}>First 10 replies can open a chat with you</span>
              </div>
              <div className={styles.doneInfoRow}>
                <span className={styles.doneInfoIcon}>⏱️</span>
                <span className={styles.doneInfoText}>Notifications expire for others in 3 hours</span>
              </div>
              <div className={styles.doneInfoRow}>
                <span className={styles.doneInfoIcon}>🔔</span>
                <span className={styles.doneInfoText}>Your replies stay in your notifications until deleted</span>
              </div>
            </div>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
