import { useState } from 'react'
import { goLive, scheduleLive, postInviteOut } from '@/services/sessionService'
import { useAuth } from '@/hooks/useAuth'
import PlaceSearch from '@/components/golive/PlaceSearch'
import styles from './GoOutSetup.module.css'

// Vibe options — matches VIBE_EMOJI in LiveUserMarker and vibe column in sessions table
const VIBES = [
  { key: 'party',      label: 'Party',   emoji: '🎉' },
  { key: 'chill',      label: 'Chill',   emoji: '😎' },
  { key: 'networking', label: 'Network', emoji: '💼' },
  { key: 'dates',      label: 'Dating',  emoji: '❤️' },
  { key: 'workout',    label: 'Active',  emoji: '💪' },
  { key: 'culture',    label: 'Culture', emoji: '🎨' },
]

export default function GoOutSetup({ pendingStatus, activityType, userCity, userCoords, onDone, onSkip }) {
  const { userProfile } = useAuth()
  const tier = userProfile?.tier ?? null

  const [placeName, setPlaceName] = useState('')
  const [placeId,   setPlaceId]   = useState(null)
  const [areaName,  setAreaName]  = useState('')
  const [goNow,     setGoNow]     = useState(true)
  const [lateDay,   setLateDay]   = useState('today')
  const [lateTime,  setLateTime]  = useState('')
  const [vibe,      setVibe]      = useState(null)
  const [saving,    setSaving]    = useState(false)

  const isLaterOut  = pendingStatus === 'later_out'
  const isInviteOut = pendingStatus === 'invite_out'

  const heading = isInviteOut ? 'Invite Out 💌'
                : isLaterOut  ? "Set When You're Out 🕐"
                : 'Where Are You Going? 🚀'

  const sub = isInviteOut
    ? "You'll appear in discovery as wanting an invite. Pick a spot or area below."
    : isLaterOut
    ? "Tell us when you're heading out and where you're planning to go."
    : 'Choose a venue or add your location so people nearby can see you.'

  function handlePlaceSelect(place) {
    setPlaceName(place.name)
    setPlaceId(place.placeId ?? null)
    setAreaName('')
  }

  function handleAreaSelect(place) {
    setAreaName(place.name)
    setPlaceName('')
    setPlaceId(null)
  }

  const resolvedName = placeName || areaName

  async function handleConfirm() {
    setSaving(true)
    try {
      if (isInviteOut) {
        await postInviteOut({ activityType, message: resolvedName, vibe, tier })
      } else if (isLaterOut && !goNow) {
        const base = new Date()
        if (lateDay === 'tomorrow') base.setDate(base.getDate() + 1)
        const [hh, mm] = lateTime.split(':').map(Number)
        base.setHours(hh, mm, 0, 0)
        await scheduleLive({
          activityType, placeName: resolvedName, placeId,
          scheduledFor: base.toISOString(), vibe, tier,
        })
      } else {
        await goLive({ activityType, placeName: resolvedName, placeId, vibe, tier })
      }
      onDone?.()
    } catch { /* silent */ }
    setSaving(false)
  }

  const canConfirm = isInviteOut ? true : goNow ? true : !!lateTime
  const cityLabel  = userCity ? ` in ${userCity}` : ''

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>

        {/* Green accent line */}
        <div className={styles.accentLine} />

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.sub}>{sub}</p>
        </div>

        {/* Venue + Area fields */}
        <div className={styles.fieldBlock}>
          <p className={styles.venueTeaser}>
            🔥 Hottest spots &amp; live deals{cityLabel} — tap to explore
          </p>

          <label className={styles.fieldLabel}>Venue</label>
          <PlaceSearch
            userCoords={userCoords ?? null}
            onSelect={handlePlaceSelect}
          />

          <div className={styles.orDivider}>
            <span className={styles.orLine} />
            <span className={styles.orText}>OR</span>
            <span className={styles.orLine} />
          </div>

          <label className={styles.fieldLabel}>Area{userCity ? ` in ${userCity}` : ''}</label>
          <PlaceSearch
            userCoords={userCoords ?? null}
            areasOnly
            cityContext={userCity ?? null}
            onSelect={handleAreaSelect}
          />

          <p className={styles.fieldNote}>
            Your location is <strong>never visible to other users</strong> and{' '}
            <strong>cannot be used to track you</strong> — used only for private distance matching.
          </p>
        </div>

        {/* ── VIBE SELECTOR ─────────────────────────────────────────────── */}
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel}>Vibe tonight</label>
          <div className={styles.vibeRow}>
            {VIBES.map(v => (
              <button
                key={v.key}
                className={`${styles.vibeChip} ${vibe === v.key ? styles.vibeChipActive : ''}`}
                onClick={() => setVibe(prev => prev === v.key ? null : v.key)}
                type="button"
              >
                <span className={styles.vibeEmoji}>{v.emoji}</span>
                <span className={styles.vibeLabel}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time selection — only for im_out and later_out */}
        {!isInviteOut && (
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>When?</label>
            <div className={styles.timeToggle}>
              <button
                className={`${styles.timeBtn} ${goNow ? styles.timeBtnActive : ''}`}
                onClick={() => setGoNow(true)}
              >
                🚀 Going Out Now
              </button>
              <button
                className={`${styles.timeBtn} ${!goNow ? styles.timeBtnActive : ''}`}
                onClick={() => setGoNow(false)}
              >
                🕐 Set a Time
              </button>
            </div>
            {!goNow && (
              <div className={styles.timePicker}>
                <select
                  className={styles.timeSelect}
                  value={lateDay}
                  onChange={e => setLateDay(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>
                <input
                  type="time"
                  className={styles.timeSelect}
                  value={lateTime}
                  onChange={e => setLateTime(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Confirm */}
        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={saving || !canConfirm}
        >
          {saving
            ? 'Setting up…'
            : isInviteOut
            ? 'Post Invite Out 💌'
            : goNow
            ? 'Go Live Now 🚀'
            : 'Schedule My Night 🌙'}
        </button>

        <button className={styles.skipBtn} onClick={onSkip}>
          Skip for now — I'll set this later
        </button>
      </div>
    </div>
  )
}
