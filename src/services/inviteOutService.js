import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function postInviteOut({ activityType, message }) {
  if (!functions) {
    await delay(600)
    return { sessionId: `demo-invite-out-${Date.now()}` }
  }
  const fn = httpsCallable(functions, 'postInviteOut')
  const result = await fn({ activityType, message })
  return result.data
}

export async function cancelInviteOut(sessionId) {
  if (!functions) { await delay(300); return }
  await httpsCallable(functions, 'cancelInviteOut')({ sessionId })
}
