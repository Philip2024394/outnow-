import { useState, useCallback, useMemo } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { goLive, scheduleLive } from '@/services/sessionService'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import GpsVerifier from './GpsVerifier'
import PlaceSearch from './PlaceSearch'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { VIBE_TAGS } from '@/utils/vibeTags'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './GoLiveSheet.module.css'

const DURATIONS = [
  { label: '30 min',   value: 30 },
  { label: '1 hour',   value: 60 },
  { label: '2 hours',  value: 120 },
  { label: '3 hours',  value: 180 },
  { label: '4 hours',  value: 240 },
  { label: 'Tonight',  value: 480,  hint: '~8h' },
  { label: '1 day',    value: 1440 },
  { label: 'Weekend',  value: 2880, hint: '2 days' },
  { label: '1 week',   value: 10080 },
]

function buildDayOptions() {
  const days = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    d.setHours(0, 0, 0, 0)
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      value: d,
    })
  }
  return days
}

function buildTimeOptions(selectedDay) {
  const times = []
  const now = new Date()
  const isToday = selectedDay && selectedDay.toDateString() === now.toDateString()
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const t = new Date(selectedDay || now)
      t.setHours(h, m, 0, 0)
      if (isToday && t <= now) continue
      times.push({
        label: t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        value: t,
      })
    }
  }
  return times
}

export default function GoLiveSheet({ open, onClose, showToast, activeVenues = [] }) {
  const { coords } = useGeolocation()
  const [mode, setMode] = useState('now') // 'now' | 'later'
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [socialLink, setSocialLink] = useState('')
  const [gpsCoords, setGpsCoords] = useState(null)
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [isGroup, setIsGroup] = useState(false)
  const [groupSize, setGroupSize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { show: showVibeIntro, dismiss: dismissVibeIntro } = useFeatureIntro('vibe_tags')
  const { show: showGroupIntro, dismiss: dismissGroupIntro } = useFeatureIntro('group_outing')

  const dayOptions = useMemo(() => buildDayOptions(), [])
  const [selectedDay, setSelectedDay] = useState(dayOptions[0].value)
  const timeOptions = useMemo(() => buildTimeOptions(selectedDay), [selectedDay])
  const [selectedTime, setSelectedTime] = useState(null)

  const handleGpsReady = useCallback((c) => setGpsCoords(c), [])
  const handlePlaceSelect = useCallback((place) => {
    setSelectedPlace(place)
    setError(null)
  }, [])

  const handleSubmit = async () => {
    if (mode === 'now' && !gpsCoords) { setError('Waiting for location…'); return }
    if (!selectedPlace) { setError('Select a place first.'); return }
    if (!selectedActivity) { setError('What are you up to?'); return }
    if (mode === 'later' && !selectedTime) { setError('Pick a time.'); return }

    setLoading(true)
    setError(null)

    try {
      const venueCategory = selectedPlace.types?.[0] ?? 'establishment'
      const payload = {
        lat: gpsCoords?.lat ?? 0,
        lng: gpsCoords?.lng ?? 0,
        placeId: selectedPlace.placeId,
        placeName: selectedPlace.name,
        venueCategory,
        activityType: selectedActivity,
        durationMinutes: selectedDuration,
        socialLink: socialLink.trim() || null,
        vibe: selectedVibe,
        isGroup: isGroup || null,
        groupSize: isGroup ? groupSize : null,
      }
      if (mode === 'later') {
        await scheduleLive({ ...payload, scheduledFor: selectedTime.getTime() })
        showToast("Scheduled! You'll go live at " + selectedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), 'success')
      } else {
        await goLive(payload)
        showToast("You're live! 🟢", 'success')
      }
      onClose()
    } catch (err) {
      const msg = err?.code === 'functions/failed-precondition'
        ? 'You must be at the selected location to go live.'
        : err?.message ?? 'Could not submit. Try again.'
      setError(msg)
    }
    setLoading(false)
  }

  const canSubmit = selectedPlace && selectedActivity && (mode === 'now' ? !!gpsCoords : !!selectedTime)

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {showVibeIntro && (
        <FeatureIntro
          emoji="🎉"
          title="Set Your Vibe"
          bullets={[
            'Tell people what kind of night you\'re after — dancing, quiet drinks, anything goes',
            'Your vibe shows on your profile so the right people find you',
            'Totally optional — skip it if you\'re keeping it open',
          ]}
          onDone={dismissVibeIntro}
        />
      )}
      {showGroupIntro && (
        <FeatureIntro
          emoji="👥"
          title="Group Outing"
          bullets={[
            'Going out with friends? Let others know you\'re a group',
            'People can OTW to join your whole group, not just you',
            'Anonymous members show as "Friend" to protect their privacy',
          ]}
          onDone={dismissGroupIntro}
        />
      )}
      <div className={styles.sheetHeader}>
        <span className={styles.headerTag}>What's the plan?</span>
      </div>

      <div className={styles.content}>
        {/* Mode toggle */}
        <div className={styles.modeToggle}>
          <button
            className={[styles.modeBtn, mode === 'now' ? styles.modeBtnActive : ''].join(' ')}
            onClick={() => setMode('now')}
          >
            🟢 Out Now
          </button>
          <button
            className={[styles.modeBtn, mode === 'later' ? styles.modeBtnLater : ''].join(' ')}
            onClick={() => setMode('later')}
          >
            🟠 Out Later
          </button>
        </div>

        {/* GPS — only needed for Out Now */}
        {mode === 'now' && <GpsVerifier onReady={handleGpsReady} />}

        {/* Out Later: day + time picker */}
        {mode === 'later' && (
          <div className={styles.section}>
            <label className={styles.label}>When are you going out?</label>
            <div className={styles.dayScroll}>
              {dayOptions.map((d) => (
                <button
                  key={d.value.toDateString()}
                  className={[styles.dayBtn, selectedDay?.toDateString() === d.value.toDateString() ? styles.dayBtnActive : ''].join(' ')}
                  onClick={() => { setSelectedDay(d.value); setSelectedTime(null) }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className={styles.timeScroll}>
              {timeOptions.map((t) => (
                <button
                  key={t.value.getTime()}
                  className={[styles.timeBtn, selectedTime?.getTime() === t.value.getTime() ? styles.timeBtnActive : ''].join(' ')}
                  onClick={() => setSelectedTime(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className={styles.section}>
          <label className={styles.label}>I'm going for…</label>
          <div className={styles.activities}>
            {ACTIVITY_TYPES.map((a) => (
              <button
                key={a.id}
                className={[styles.activityBtn, selectedActivity === a.id ? styles.activitySelected : ''].join(' ')}
                onClick={() => setSelectedActivity(a.id)}
              >
                <span className={styles.activityEmoji}>{a.emoji}</span>
                <span className={styles.activityLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className={styles.section}>
          <label className={styles.label}>What's the vibe? <span className={styles.optional}>optional</span></label>
          <div className={styles.activities}>
            {VIBE_TAGS.map(v => (
              <button
                key={v.id}
                className={[styles.activityBtn, selectedVibe === v.id ? styles.activitySelected : ''].join(' ')}
                onClick={() => setSelectedVibe(prev => prev === v.id ? null : v.id)}
              >
                <span className={styles.activityEmoji}>{v.emoji}</span>
                <span className={styles.activityLabel}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Group outing */}
        <div className={styles.section}>
          <div className={styles.groupToggleRow}>
            <div className={styles.groupToggleText}>
              <span className={styles.label}>Going with others?</span>
              <span className={styles.groupSub}>Let people know you're a group</span>
            </div>
            <button
              className={`${styles.groupToggle} ${isGroup ? styles.groupToggleOn : ''}`}
              onClick={() => setIsGroup(v => !v)}
            >
              <div className={styles.groupToggleThumb} />
            </button>
          </div>
          {isGroup && (
            <div className={styles.groupSizeRow}>
              <span className={styles.groupSizeLabel}>How many?</span>
              <div className={styles.groupSizes}>
                {[2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`${styles.groupSizeBtn} ${groupSize === n ? styles.groupSizeBtnActive : ''}`}
                    onClick={() => setGroupSize(n)}
                  >
                    {n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className={styles.section}>
          <label className={styles.label}>Staying out for…</label>
          <div className={styles.durations}>
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                className={[styles.durationBtn, selectedDuration === d.value ? styles.durationSelected : ''].join(' ')}
                onClick={() => setSelectedDuration(d.value)}
              >
                <span>{d.label}</span>
                {d.hint && <span className={styles.durationHint}>{d.hint}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Trending venues */}
        {activeVenues.length > 0 && (
          <div className={styles.section}>
            <label className={styles.label}>🔥 People are here right now</label>
            <div className={styles.trendingRow}>
              {activeVenues.slice(0, 4).map(v => (
                <button
                  key={v.id}
                  className={styles.trendingChip}
                  onClick={() => handlePlaceSelect({ placeId: v.id, name: v.name, types: [v.type?.toLowerCase() ?? 'establishment'] })}
                >
                  <span className={styles.trendingEmoji}>{v.emoji}</span>
                  <span className={styles.trendingName}>{v.name}</span>
                  <span className={styles.trendingCount}>{v.count} {v.count === 1 ? 'person' : 'people'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Place */}
        <div className={styles.section}>
          <label className={styles.label}>{mode === 'later' ? 'Where are you planning to go?' : 'Where are you?'}</label>
          <p className={styles.placeSub}>
            Select a public place — only your estimated area is shown to others. Your exact location is never shared unless you choose to share it in chat.
          </p>
          <PlaceSearch userCoords={gpsCoords ?? coords} onSelect={handlePlaceSelect} />
          {selectedPlace && (
            <div className={styles.selectedPlace}>
              <span>📍</span> {selectedPlace.name}
            </div>
          )}
        </div>

        {/* Social link */}
        <div className={styles.section}>
          <label className={styles.label}>Share the spot (optional)</label>
          <div className={styles.socialInputWrap}>
            <span className={styles.socialIcon}>🔗</span>
            <input
              type="url"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              placeholder="Instagram or Google Maps link…"
              className={styles.socialInput}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="url"
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button size="lg" fullWidth loading={loading} disabled={!canSubmit} onClick={handleSubmit}>
          {mode === 'later' ? "Schedule — I'm Out Later 🟠" : "I'm Out Now 🟢"}
        </Button>
      </div>
    </BottomSheet>
  )
}
