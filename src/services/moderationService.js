import { httpsCallable } from 'firebase/functions'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { functions, db } from '@/firebase/config'
import { BLOCKS_SUB } from '@/firebase/collections'
import { auth } from '@/firebase/config'

const handleReportFn = httpsCallable(functions, 'handleReport')

/**
 * Report a user with a reason.
 * Cloud Function writes the report doc and handles auto-moderation.
 */
export async function reportUser({ reportedUserId, sessionId, reason }) {
  await handleReportFn({ reportedUserId, sessionId, reason })
}

/**
 * Block a user immediately on the client side.
 * This removes them from the map instantly without waiting for server.
 */
export async function blockUser(blockedUserId) {
  const currentUid = auth.currentUser?.uid
  if (!currentUid) return

  const blockRef = doc(db, BLOCKS_SUB(currentUid), blockedUserId)
  await setDoc(blockRef, {
    blockedUserId,
    createdAt: serverTimestamp(),
  })
}
