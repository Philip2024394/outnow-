'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { db, now } = require('../utils/firestoreHelpers')

const OTW_EXPIRY_MINUTES = 5
const RATE_LIMIT_MINUTES = 10 // One OTW per 10 min per user

module.exports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { sessionId, toUserId } = data
  const fromUserId = context.auth.uid

  if (fromUserId === toUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot send OTW to yourself.')
  }

  const fsDb = db()

  // Verify session is active
  const sessionDoc = await fsDb.collection('sessions').doc(sessionId).get()
  if (!sessionDoc.exists || sessionDoc.data().status !== 'active') {
    throw new functions.https.HttpsError('not-found', 'Session is no longer active.')
  }
  if (sessionDoc.data().userId !== toUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid session.')
  }

  // Check if not blocked
  const blockCheck = await fsDb
    .collection('blocks').doc(toUserId)
    .collection('blockedUsers').doc(fromUserId)
    .get()
  if (blockCheck.exists) {
    throw new functions.https.HttpsError('permission-denied', 'You cannot contact this user.')
  }

  // Rate limit: no existing pending OTW from this user in the last RATE_LIMIT_MINUTES
  const rateLimitCutoff = new Date()
  rateLimitCutoff.setMinutes(rateLimitCutoff.getMinutes() - RATE_LIMIT_MINUTES)

  const recentRequests = await fsDb
    .collection('otwRequests')
    .where('fromUserId', '==', fromUserId)
    .where('createdAt', '>', admin.firestore.Timestamp.fromDate(rateLimitCutoff))
    .limit(1)
    .get()

  if (!recentRequests.empty) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Please wait before sending another request.'
    )
  }

  // No duplicate pending request to same session
  const duplicate = await fsDb
    .collection('otwRequests')
    .where('fromUserId', '==', fromUserId)
    .where('sessionId', '==', sessionId)
    .where('status', '==', 'pending')
    .limit(1)
    .get()

  if (!duplicate.empty) {
    throw new functions.https.HttpsError('already-exists', 'You already sent a request.')
  }

  // Fetch sender profile
  const senderDoc = await fsDb.collection('users').doc(fromUserId).get()
  const senderData = senderDoc.data() ?? {}

  // Set expiry
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + OTW_EXPIRY_MINUTES)

  const requestRef = await fsDb.collection('otwRequests').add({
    fromUserId,
    fromDisplayName: senderData.displayName ?? 'Someone',
    fromPhotoURL: senderData.photoURL ?? null,
    toUserId,
    sessionId,
    status: 'pending',
    createdAt: now(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  })

  return { requestId: requestRef.id }
})
