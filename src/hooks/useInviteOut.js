import { useState, useCallback } from 'react'
import { postInviteOut as postInviteOutService, cancelInviteOut as cancelInviteOutService } from '@/services/inviteOutService'

const STORAGE_KEY = 'hangger_invite_out'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveStored(data) {
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/**
 * Manages the current user's Invite Out state.
 * On first load (no stored state), defaults to invite_out — all new users start here.
 */
export function useInviteOut() {
  const [inviteOut, setInviteOut] = useState(() => {
    const stored = loadStored()
    // Default to a blank invite out so new users are immediately in this state
    if (stored === null) {
      const defaultState = { activityType: null, message: '', sessionId: null, postedAt: Date.now() }
      saveStored(defaultState)
      return defaultState
    }
    return stored
  })

  const post = useCallback(async (activityType, message = '') => {
    const result = await postInviteOutService({ activityType, message })
    const next = { activityType, message, sessionId: result.sessionId, postedAt: Date.now() }
    setInviteOut(next)
    saveStored(next)
    return result
  }, [])

  // Called when user goes live (Out Now / Out Later) — clears invite out
  const goingLive = useCallback(() => {
    setInviteOut(null)
    saveStored(null)
  }, [])

  // Called when session ends — reverts user back to invite out
  const revertToInviteOut = useCallback(async () => {
    let result
    try {
      result = await postInviteOutService({ activityType: null, message: '' })
    } catch { result = { sessionId: null } }
    const next = { activityType: null, message: '', sessionId: result.sessionId, postedAt: Date.now() }
    setInviteOut(next)
    saveStored(next)
  }, [])

  const cancel = useCallback(async () => {
    if (inviteOut?.sessionId) {
      try { await cancelInviteOutService(inviteOut.sessionId) } catch { /* ignore */ }
    }
    setInviteOut(null)
    saveStored(null)
  }, [inviteOut])

  return { inviteOut, post, goingLive, revertToInviteOut, cancel }
}
