import { httpsCallable } from 'firebase/functions'
import { addDoc, deleteDoc, doc, collection, serverTimestamp } from 'firebase/firestore'
import { functions, db } from '@/firebase/config'
import { COLLECTIONS, INTEREST_STATUS } from '@/firebase/collections'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function sendOtwRequest(sessionId, toUserId) {
  if (!functions) {
    await delay(600)
    return { requestId: `demo-otw-${Date.now()}`, sessionId, toUserId }
  }
  const fn = httpsCallable(functions, 'sendOtwRequest')
  const result = await fn({ sessionId, toUserId })
  return result.data
}

export async function respondToOtw(requestId, accept) {
  if (!functions) { await delay(400); return { status: accept ? 'accepted' : 'declined' } }
  const fn = httpsCallable(functions, 'respondToOtw')
  const result = await fn({ requestId, accept })
  return result.data
}

export async function markOtwProceeding(requestId, etaMinutes) {
  if (!functions) { await delay(400); return { success: true, etaMinutes } }
  const fn = httpsCallable(functions, 'markOtwProceeding')
  const result = await fn({ requestId, etaMinutes })
  return result.data
}

export async function cancelOtw(requestId) {
  if (!functions) { await delay(300); return }
  await httpsCallable(functions, 'cancelOtw')({ requestId })
}

export async function expressInterest(toUserId, sessionId) {
  if (!db) { await delay(400); return }
  await addDoc(collection(db, COLLECTIONS.INTERESTS), {
    toUserId,
    sessionId,
    status: INTEREST_STATUS.PENDING,
    createdAt: serverTimestamp(),
  })
}

export async function withdrawInterest(interestDocId) {
  if (!db) return
  await deleteDoc(doc(db, COLLECTIONS.INTERESTS, interestDocId))
}

export async function sendWave(toUserId, sessionId) {
  if (!db) { await delay(400); return }
  await addDoc(collection(db, COLLECTIONS.WAVES ?? 'waves'), {
    toUserId,
    sessionId,
    createdAt: serverTimestamp(),
  })
}
