'use strict'

const functions = require('firebase-functions')
const { db, now } = require('../utils/firestoreHelpers')

/**
 * User A accepts or declines an OTW request.
 */
exports.respondToOtw = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { requestId, accept } = data
  const uid = context.auth.uid
  const fsDb = db()

  const requestRef = fsDb.collection('otwRequests').doc(requestId)
  const requestDoc = await requestRef.get()

  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Request not found.')
  }

  const request = requestDoc.data()

  if (request.toUserId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your request to respond to.')
  }
  if (request.status !== 'pending') {
    throw new functions.https.HttpsError('failed-precondition', 'Request is no longer pending.')
  }

  const newStatus = accept ? 'accepted' : 'declined'
  await requestRef.update({ status: newStatus, respondedAt: now() })

  return { status: newStatus }
})

/**
 * User B marks themselves as OTW after paying and confirms ETA.
 * Notifies User A they are coming.
 * ETA is stored but their location is NOT shared — only ETA is shown.
 */
exports.markOtwProceeding = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { requestId, etaMinutes } = data
  const uid = context.auth.uid
  const fsDb = db()

  const requestRef = fsDb.collection('otwRequests').doc(requestId)
  const requestDoc = await requestRef.get()

  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Request not found.')
  }

  const request = requestDoc.data()
  if (request.fromUserId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your request.')
  }
  if (request.status !== 'paid') {
    throw new functions.https.HttpsError('failed-precondition', 'Payment not completed.')
  }

  // Calculate ETA timestamp
  const eta = new Date()
  if (etaMinutes && etaMinutes > 0) {
    eta.setMinutes(eta.getMinutes() + etaMinutes)
  }

  await requestRef.update({
    status: 'proceeding',
    etaMinutes: etaMinutes ?? null,
    etaAt: etaMinutes ? require('firebase-admin').firestore.Timestamp.fromDate(eta) : null,
    proceedingAt: now(),
    // NOTE: NO location data stored here — only ETA
  })

  return { success: true, etaMinutes }
})

/**
 * Cancel an OTW request (from either side).
 */
exports.cancelOtw = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { requestId } = data
  const uid = context.auth.uid
  const fsDb = db()

  const requestRef = fsDb.collection('otwRequests').doc(requestId)
  const requestDoc = await requestRef.get()

  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Request not found.')
  }

  const request = requestDoc.data()
  const isParticipant = request.fromUserId === uid || request.toUserId === uid
  if (!isParticipant) {
    throw new functions.https.HttpsError('permission-denied', 'Not your request.')
  }

  await requestRef.update({ status: 'cancelled', cancelledAt: now() })
  return { success: true }
})
