import { useState, useCallback, useMemo } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/hooks/useAuth'
import { goLive, scheduleLive } from '@/services/sessionService'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import GpsVerifier from './GpsVerifier'
import PlaceSearch from './PlaceSearch'
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/firebase/collections'
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

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function buildSelectedTime(day, hour12, minute, ampm) {
  if (!day) return null
  let h = parseInt(hour12, 10)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  const t = new Date(day)
  t.setHours(h, parseInt(minute, 10), 0, 0)
  return t
}

export default function GoLiveSheet({ open, onClose, showToast, activeVenues = [] }) {
  const { userProfile } = useAuth()
  const { coords } = useGeolocation()
  const [mode, setMode] = useState('now') // 'now' | 'later'
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [socialLink, setSocialLink] = useState('')
  const [gpsCoords, setGpsCoords] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedVibe, setSelectedVibe] = useState(null)
  const [isGroup, setIsGroup] = useState(false)
  const [groupSize, setGroupSize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [trendingExpanded, setTrendingExpanded] = useState(false)
  const { show: showVibeIntro, dismiss: dismissVibeIntro } = useFeatureIntro('vibe_tags')
  const { show: showGroupIntro, dismiss: dismissGroupIntro } = useFeatureIntro('group_outing')

  const dayOptions = useMemo(() => buildDayOptions(), [])
  const [selectedDay, setSelectedDay] = useState(dayOptions[0].value)
  const [timeHour,   setTimeHour]   = useState('08')
  const [timeMinute, setTimeMinute] = useState('00')
  const [timeAmPm,   setTimeAmPm]   = useState('PM')
  const selectedTime = buildSelectedTime(selectedDay, timeHour, timeMinute, timeAmPm)

  const handleGpsReady = useCallback((c) => setGpsCoords(c), [])
  const handlePlaceSelect = useCallback((place) => {
    setSelectedPlace(place)
    setError(null)
  }, [])

  const handleSubmit = async () => {
    if (mode === 'now' && !gpsCoords) { setError('Waiting for location…'); return }
    if (!selectedPlace) { setError('Select a place first.'); return }
    if (!selectedActivity) { setError('What are you up to?'); return }
    if (mode === 'later' && !selectedTime) { setError('Select a day first.'); return }

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
        tier: userProfile?.tier ?? null,
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

  const canSubmit = selectedPlace && selectedActivity && (mode === 'now' ? !!gpsCoords : true)

  return (
    <BottomSheet open={open} onClose={onClose} title="" borderColor={mode === 'now' ? '#8DC63F' : '#E8890C'}>
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
            'People can request to join your whole group, not just you',
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
              {/* Now shortcut — switches back to Out Now mode */}
              <button
                className={styles.dayBtn}
                onClick={() => setMode('now')}
              >
                🟢 Now
              </button>
              {dayOptions.map((d) => (
                <button
                  key={d.value.toDateString()}
                  className={[styles.dayBtn, selectedDay?.toDateString() === d.value.toDateString() ? styles.dayBtnActive : ''].join(' ')}
                  onClick={() => { setSelectedDay(d.value); setTimeHour('08'); setTimeMinute('00'); setTimeAmPm('PM') }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className={styles.timePicker}>
              {/* Hour */}
              <div className={styles.timeColumn}>
                <span className={styles.timeColLabel}>Hour</span>
                <div className={styles.timeScroll}>
                  {HOURS.map(h => (
                    <button key={h} className={`${styles.timeBtn} ${timeHour === h ? styles.timeBtnActive : ''}`} onClick={() => setTimeHour(h)}>{h}</button>
                  ))}
                </div>
              </div>
              <span className={styles.timeColon}>:</span>
              {/* Minute */}
              <div className={styles.timeColumn}>
                <span className={styles.timeColLabel}>Min</span>
                <div className={styles.timeScroll}>
                  {MINUTES.map(m => (
                    <button key={m} className={`${styles.timeBtn} ${timeMinute === m ? styles.timeBtnActive : ''}`} onClick={() => setTimeMinute(m)}>{m}</button>
                  ))}
                </div>
              </div>
              {/* AM / PM */}
              <div className={styles.timeColumn}>
                <span className={styles.timeColLabel}>AM/PM</span>
                <div className={styles.ampmCol}>
                  {['AM', 'PM'].map(p => (
                    <button key={p} className={`${styles.ampmBtn} ${timeAmPm === p ? styles.timeBtnActive : ''}`} onClick={() => setTimeAmPm(p)}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity — two-step: category grid → activity chips */}
        <div className={styles.section}>
          <div className={styles.activityHeader}>
            <label className={styles.label}>I'm going for…</label>
            {selectedCategory && (
              <button className={styles.backBtn} onClick={() => setSelectedCategory(null)}>
                ← Back
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <div className={styles.categoryGrid}>
              {ACTIVITY_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={styles.categoryTile}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.activities}>
              {ACTIVITY_TYPES.filter(a => a.category === selectedCategory).map(a => (
                <button
                  key={a.id}
                  className={[styles.activityChip, selectedActivity === a.id ? styles.activitySelected : ''].join(' ')}
                  onClick={() => setSelectedActivity(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vibe */}
        <div className={styles.section}>
          <label className={styles.label}>What's the vibe? <span className={styles.optional}>optional</span></label>
          <div className={styles.activities}>
            {VIBE_TAGS.map(v => (
              <button
                key={v.id}
                className={[styles.activityChip, selectedVibe === v.id ? styles.activitySelected : ''].join(' ')}
                onClick={() => setSelectedVibe(prev => prev === v.id ? null : v.id)}
              >
                {v.label}
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
            <div className={styles.trendingCard}>
              {/* Always-visible top venue */}
              <button
                className={styles.trendingRow}
                onClick={() => handlePlaceSelect({ placeId: activeVenues[0].id, name: activeVenues[0].name, types: [activeVenues[0].type?.toLowerCase() ?? 'establishment'] })}
              >
                <span className={styles.trendingEmoji}>{activeVenues[0].emoji}</span>
                <div className={styles.trendingInfo}>
                  <span className={styles.trendingName}>{activeVenues[0].name}</span>
                  <span className={styles.trendingMeta}>{activeVenues[0].type} · {activeVenues[0].address}</span>
                </div>
                <span className={styles.trendingCount}>{activeVenues[0].count} {activeVenues[0].count === 1 ? 'person' : 'people'}</span>
              </button>

              {/* Dropdown for remaining venues */}
              {activeVenues.length > 1 && (
                <>
                  {trendingExpanded && activeVenues.slice(1).map(v => (
                    <button
                      key={v.id}
                      className={`${styles.trendingRow} ${styles.trendingRowBorder}`}
                      onClick={() => handlePlaceSelect({ placeId: v.id, name: v.name, types: [v.type?.toLowerCase() ?? 'establishment'] })}
                    >
                      <span className={styles.trendingEmoji}>{v.emoji}</span>
                      <div className={styles.trendingInfo}>
                        <span className={styles.trendingName}>{v.name}</span>
                        <span className={styles.trendingMeta}>{v.type} · {v.address}</span>
                      </div>
                      <span className={styles.trendingCount}>{v.count} {v.count === 1 ? 'person' : 'people'}</span>
                    </button>
                  ))}
                  <button
                    className={styles.trendingToggle}
                    onClick={() => setTrendingExpanded(v => !v)}
                  >
                    {trendingExpanded
                      ? '▲ Show less'
                      : `▼ ${activeVenues.length - 1} more place${activeVenues.length - 1 > 1 ? 's' : ''}`}
                  </button>
                </>
              )}
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
