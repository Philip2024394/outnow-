import { useState, useEffect, useRef, useCallback } from 'react'
import { endSession, postInviteOut } from '@/services/sessionService'
import { haversineKm } from '@/utils/distance'

const CHECK_IN_MS      = 3 * 60 * 60 * 1000  // 3 hours — time-based check-in
const AWAY_CONFIRM_MS  = 15 * 60 * 1000       // 15 min away → show banner
const AWAY_REVERT_MS   = 5  * 60 * 1000       // 5 min no response → auto-revert
const AWAY_KM          = 1                     // 1 km threshold
const GEO_MAX_AGE_MS   = 5  * 60 * 1000       // accept positions up to 5 min old
const GEO_TIMEOUT_MS   = 30 * 1000            // 30 sec timeout per position

/**
 * Manages two auto-downgrade triggers for an active session:
 *
 * 1. TIME — after 3 hours, show "Still out?" banner.
 *    No response in another 3 hours → auto-revert to invite_out.
 *
 * 2. DISTANCE — if user moves 1 km+ from their venue for 15+ minutes,
 *    show a "Looks like you've moved" banner.
 *    No response in 5 minutes → auto-revert to invite_out.
 *    "Still Out" re-anchors to their current position.
 */
export function useStatusCheckIn(session) {
  const [showBanner,  setShowBanner]  = useState(false)
  const [bannerReason, setBannerReason] = useState(null) // 'time' | 'location'

  // Timer refs
  const outerTimer      = useRef(null)
  const autoRevertTimer = useRef(null)
  const awayTimer       = useRef(null)   // fires after 15 min away
  const awayRevertTimer = useRef(null)   // fires after 5 min no response

  // State refs (avoid stale closures in callbacks)
  const trackedId    = useRef(null)
  const venueLatRef  = useRef(null)
  const venueLngRef  = useRef(null)
  const currentPosRef = useRef(null)     // latest GPS coords
  const watchIdRef   = useRef(null)      // geolocation watchId
  const awayStartRef = useRef(null)      // timestamp when user first moved away

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function clearTimers() {
    clearTimeout(outerTimer.current)
    clearTimeout(autoRevertTimer.current)
    clearTimeout(awayTimer.current)
    clearTimeout(awayRevertTimer.current)
    outerTimer.current = autoRevertTimer.current = awayTimer.current = awayRevertTimer.current = null
  }

  function stopWatching() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    awayStartRef.current = null
  }

  function clearAll() {
    clearTimers()
    stopWatching()
  }

  async function revertToInviteOut() {
    setShowBanner(false)
    setBannerReason(null)
    clearAll()
    trackedId.current = null
    try { await postInviteOut() } catch { /* silent */ }
  }

  // ─── Time-based check-in ──────────────────────────────────────────────────

  function scheduleTimeCheckIn(sessionId) {
    clearTimeout(outerTimer.current)
    clearTimeout(autoRevertTimer.current)

    outerTimer.current = setTimeout(() => {
      if (trackedId.current !== sessionId) return
      setShowBanner(true)
      setBannerReason('time')

      autoRevertTimer.current = setTimeout(() => {
        if (trackedId.current !== sessionId) return
        revertToInviteOut()
      }, CHECK_IN_MS)
    }, CHECK_IN_MS)
  }

  // ─── Distance-based check-in ──────────────────────────────────────────────

  const handlePositionUpdate = useCallback((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords
    currentPosRef.current = { lat, lng }

    const vLat = venueLatRef.current
    const vLng = venueLngRef.current
    if (vLat == null || vLng == null) return
    if (showBanner) return // don't layer banners

    const km = haversineKm(lat, lng, vLat, vLng)

    if (km >= AWAY_KM) {
      // Mark the moment they first moved away
      if (!awayStartRef.current) {
        awayStartRef.current = Date.now()

        awayTimer.current = setTimeout(() => {
          // Still away after 15 min — show the banner
          if (trackedId.current == null) return
          if (showBanner) return
          setShowBanner(true)
          setBannerReason('location')

          awayRevertTimer.current = setTimeout(() => {
            if (trackedId.current == null) return
            revertToInviteOut()
          }, AWAY_REVERT_MS)
        }, AWAY_CONFIRM_MS)
      }
    } else {
      // Back within 1 km — cancel any pending away trigger
      if (awayStartRef.current) {
        awayStartRef.current = null
        clearTimeout(awayTimer.current)
        clearTimeout(awayRevertTimer.current)
        awayTimer.current = awayRevertTimer.current = null
      }
    }
  }, [showBanner]) // eslint-disable-line

  function startWatching() {
    if (!navigator.geolocation) return
    stopWatching()
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      () => { /* permission denied or unavailable — silent */ },
      { enableHighAccuracy: false, maximumAge: GEO_MAX_AGE_MS, timeout: GEO_TIMEOUT_MS }
    )
  }

  // ─── Session lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    if (session?.status === 'active') {
      if (trackedId.current !== session.id) {
        trackedId.current  = session.id
        venueLatRef.current = session.lat  ?? null
        venueLngRef.current = session.lng  ?? null

        setShowBanner(false)
        setBannerReason(null)
        clearTimers()
        stopWatching()

        scheduleTimeCheckIn(session.id)

        // Only watch GPS if we have a venue anchor to compare against
        if (session.lat != null && session.lng != null) {
          startWatching()
        }
      }
    } else {
      clearAll()
      trackedId.current = null
      setShowBanner(false)
      setBannerReason(null)
    }

    return clearAll
  }, [session?.id, session?.status]) // eslint-disable-line

  // ─── Banner responses ─────────────────────────────────────────────────────

  async function handleStillOut() {
    setShowBanner(false)
    setBannerReason(null)
    clearTimeout(autoRevertTimer.current)
    clearTimeout(awayRevertTimer.current)
    autoRevertTimer.current = awayRevertTimer.current = null

    if (bannerReason === 'location' && currentPosRef.current) {
      // Re-anchor venue to wherever they are now
      venueLatRef.current = currentPosRef.current.lat
      venueLngRef.current = currentPosRef.current.lng
      awayStartRef.current = null
    }

    // Reschedule the 3-hour time check-in from now
    if (trackedId.current) scheduleTimeCheckIn(trackedId.current)
  }

  async function handleLeaving() {
    const sid = trackedId.current
    setShowBanner(false)
    setBannerReason(null)
    clearAll()
    trackedId.current = null
    if (sid) {
      try { await endSession(sid) } catch { /* silent */ }
    }
  }

  return { showBanner, bannerReason, handleStillOut, handleLeaving }
}
