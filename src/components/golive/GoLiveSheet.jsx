import { useState, useCallback } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { goLive } from '@/services/sessionService'
import BottomSheet from '@/components/ui/BottomSheet'
import Button from '@/components/ui/Button'
import GpsVerifier from './GpsVerifier'
import PlaceSearch from './PlaceSearch'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import styles from './GoLiveSheet.module.css'

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
]

export default function GoLiveSheet({ open, onClose, showToast }) {
  const { coords } = useGeolocation()
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [socialLink, setSocialLink] = useState('')
  const [gpsCoords, setGpsCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGpsReady = useCallback((c) => setGpsCoords(c), [])
  const handlePlaceSelect = useCallback((place) => {
    setSelectedPlace(place)
    setError(null)
  }, [])

  const handleGoLive = async () => {
    if (!gpsCoords) { setError('Waiting for location…'); return }
    if (!selectedPlace) { setError('Select a place first.'); return }
    if (!selectedActivity) { setError('What are you up to?'); return }

    setLoading(true)
    setError(null)

    try {
      const venueCategory = selectedPlace.types?.[0] ?? 'establishment'
      await goLive({
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        placeId: selectedPlace.placeId,
        placeName: selectedPlace.name,
        venueCategory,
        activityType: selectedActivity,
        durationMinutes: selectedDuration,
        socialLink: socialLink.trim() || null,
      })
      showToast("You're live! 🟢", 'success')
      onClose()
    } catch (err) {
      const msg = err?.code === 'functions/failed-precondition'
        ? 'You must be at the selected location to go live.'
        : err?.message ?? 'Could not go live. Try again.'
      setError(msg)
    }
    setLoading(false)
  }

  const canGoLive = gpsCoords && selectedPlace && selectedActivity

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {/* Sheet header */}
      <div className={styles.sheetHeader}>
        <span className={styles.headerTag}>What's the plan?</span>
      </div>

      <div className={styles.content}>
        {/* GPS */}
        <GpsVerifier onReady={handleGpsReady} />

        {/* Activity — shown first, prominent */}
        <div className={styles.section}>
          <label className={styles.label}>I'm going for…</label>
          <div className={styles.activities}>
            {ACTIVITY_TYPES.map((a) => (
              <button
                key={a.id}
                className={[
                  styles.activityBtn,
                  selectedActivity === a.id ? styles.activitySelected : '',
                ].join(' ')}
                onClick={() => setSelectedActivity(a.id)}
              >
                <span className={styles.activityEmoji}>{a.emoji}</span>
                <span className={styles.activityLabel}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        <div className={styles.section}>
          <label className={styles.label}>How long?</label>
          <div className={styles.durations}>
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                className={[
                  styles.durationBtn,
                  selectedDuration === d.value ? styles.durationSelected : '',
                ].join(' ')}
                onClick={() => setSelectedDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Place search */}
        <div className={styles.section}>
          <label className={styles.label}>Where are you?</label>
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

        <Button
          size="lg"
          fullWidth
          loading={loading}
          disabled={!canGoLive}
          onClick={handleGoLive}
        >
          I'm Out Now 🟢
        </Button>
      </div>
    </BottomSheet>
  )
}
