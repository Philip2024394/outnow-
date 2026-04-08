import { useState, useEffect, useRef, useCallback } from 'react'
import { setDriverOnline, updateDriverLocation, getDriverOnlineStatus } from '@/services/bookingService'
import styles from './OnlineToggle.module.css'

const LOCATION_INTERVAL_MS = 10_000

export default function OnlineToggle({ userId }) {
  const [online,  setOnline]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const intervalRef = useRef(null)
  const watchRef    = useRef(null)

  // Load current status on mount
  useEffect(() => {
    getDriverOnlineStatus(userId).then(status => {
      setOnline(status)
      setLoading(false)
      if (status) startTracking(userId)
    })
    return () => stopTracking()
  }, [userId]) // eslint-disable-line

  const startTracking = useCallback((uid) => {
    if (!navigator.geolocation) return
    // Immediate first ping
    navigator.geolocation.getCurrentPosition(pos => {
      updateDriverLocation(uid, { lat: pos.coords.latitude, lng: pos.coords.longitude })
    }, () => {})
    // Recurring updates
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        updateDriverLocation(uid, { lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, () => {})
    }, LOCATION_INTERVAL_MS)
  }, [])

  const stopTracking = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    if (watchRef.current !== null) {
      navigator.geolocation?.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }

  const toggle = async () => {
    if (saving) return
    setSaving(true)
    const next = !online
    try {
      if (next) {
        // Go online — get coords first if available
        let coords = null
        await new Promise(resolve => {
          navigator.geolocation?.getCurrentPosition(
            pos => { coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; resolve() },
            () => resolve(),
            { timeout: 4000 }
          )
        })
        await setDriverOnline(userId, true, coords)
        startTracking(userId)
      } else {
        stopTracking()
        await setDriverOnline(userId, false)
      }
      setOnline(next)
    } catch (e) {
      console.error('Toggle error:', e)
    }
    setSaving(false)
  }

  if (loading) return null

  return (
    <button
      className={`${styles.toggleBtn} ${online ? styles.online : styles.offline}`}
      onClick={toggle}
      disabled={saving}
      aria-label={online ? 'Go offline' : 'Go online'}
    >
      <span className={styles.dot} />
      <span className={styles.label}>
        {saving ? '…' : online ? 'ONLINE' : 'OFFLINE'}
      </span>
      {online && <span className={styles.pulse} />}
    </button>
  )
}
