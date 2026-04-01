import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function goLive({ lat, lng, placeId, placeName, venueCategory, activityType }) {
  if (!functions) {
    await delay(1200)
    return { sessionId: `demo-my-session-${Date.now()}` }
  }
  const fn = httpsCallable(functions, 'goLive')
  const result = await fn({ lat, lng, placeId, placeName, venueCategory, activityType })
  return result.data
}

export async function endSession(sessionId) {
  if (!functions) { await delay(400); return }
  await httpsCallable(functions, 'endSession')({ sessionId })
}

export async function confirmCheckIn(sessionId) {
  if (!functions) { await delay(300); return }
  await httpsCallable(functions, 'confirmCheckIn')({ sessionId })
}

export async function scheduleLive({ lat, lng, placeId, placeName, venueCategory, activityType, durationMinutes, socialLink, scheduledFor }) {
  if (!functions) {
    await delay(800)
    return { sessionId: `demo-my-scheduled-${Date.now()}`, scheduledFor }
  }
  const fn = httpsCallable(functions, 'scheduleLive')
  const result = await fn({ lat, lng, placeId, placeName, venueCategory, activityType, durationMinutes, socialLink, scheduledFor })
  return result.data
}

export async function cancelScheduled(sessionId) {
  if (!functions) { await delay(300); return }
  await httpsCallable(functions, 'cancelScheduled')({ sessionId })
}
