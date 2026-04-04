import { useState, useEffect, useRef } from 'react'
import { endSession, postInviteOut } from '@/services/sessionService'

const CHECK_IN_MS = 3 * 60 * 60 * 1000 // 3 hours

export function useStatusCheckIn(session) {
  const [showBanner, setShowBanner] = useState(false)
  const outerTimer = useRef(null)
  const autoRevertTimer = useRef(null)
  const trackedId = useRef(null)

  function clearAll() {
    clearTimeout(outerTimer.current)
    clearTimeout(autoRevertTimer.current)
    outerTimer.current = null
    autoRevertTimer.current = null
  }

  function scheduleCheckIn(sessionId) {
    clearAll()
    trackedId.current = sessionId

    // After 3 hours: show the "Still out?" banner
    outerTimer.current = setTimeout(() => {
      if (trackedId.current !== sessionId) return
      setShowBanner(true)

      // If no response in another 3 hours: auto-revert to invite_out
      autoRevertTimer.current = setTimeout(async () => {
        if (trackedId.current !== sessionId) return
        setShowBanner(false)
        try { await postInviteOut() } catch { /* silent */ }
      }, CHECK_IN_MS)
    }, CHECK_IN_MS)
  }

  useEffect(() => {
    if (session?.status === 'active') {
      // Only start a new timer when the session ID changes (new go-live)
      if (trackedId.current !== session.id) {
        scheduleCheckIn(session.id)
      }
    } else {
      // Session ended, cancelled, or switched — clear everything
      clearAll()
      trackedId.current = null
      setShowBanner(false)
    }

    return clearAll
  }, [session?.id, session?.status]) // eslint-disable-line

  async function handleStillOut() {
    setShowBanner(false)
    clearTimeout(autoRevertTimer.current)
    autoRevertTimer.current = null
    // Reschedule next check-in in another 3 hours
    if (trackedId.current) scheduleCheckIn(trackedId.current)
  }

  async function handleLeaving() {
    const sid = trackedId.current
    setShowBanner(false)
    clearAll()
    trackedId.current = null
    if (sid) {
      try { await endSession(sid) } catch { /* silent */ }
    }
  }

  return { showBanner, handleStillOut, handleLeaving }
}
