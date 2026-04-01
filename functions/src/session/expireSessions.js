'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { db, now } = require('../utils/firestoreHelpers')

/**
 * Runs every 5 minutes via Cloud Scheduler.
 * Marks expired sessions and triggers "Still here?" prompts.
 */
exports.expireSessions = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
  const fsDb = db()
  const batch = fsDb.batch()
  let count = 0

  // Expire sessions past their expiry time
  const expired = await fsDb
    .collection('sessions')
    .where('status', '==', 'active')
    .where('expiresAt', '<=', admin.firestore.Timestamp.now())
    .get()

  expired.forEach(doc => {
    batch.update(doc.ref, { status: 'expired', endedAt: now() })
    count++
  })

  // Trigger "Still here?" for sessions that hit the 30-min checkpoint
  const needsCheckIn = await fsDb
    .collection('sessions')
    .where('status', '==', 'active')
    .where('needsCheckIn', '==', false)
    .where('checkInPromptAt', '<=', admin.firestore.Timestamp.now())
    .get()

  needsCheckIn.forEach(doc => {
    batch.update(doc.ref, { needsCheckIn: true })
    count++
  })

  if (count > 0) {
    await batch.commit()
    console.log(`Processed ${count} session updates.`)
  }
})

/**
 * End a session immediately (callable from client via endSession service).
 */
exports.endSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { sessionId } = data
  const uid = context.auth.uid

  const sessionRef = db().collection('sessions').doc(sessionId)
  const session = await sessionRef.get()

  if (!session.exists) {
    throw new functions.https.HttpsError('not-found', 'Session not found.')
  }
  if (session.data().userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your session.')
  }

  await sessionRef.update({ status: 'ended', endedAt: now() })
  return { success: true }
})

/**
 * Confirm "Still here?" check-in.
 */
exports.confirmCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { sessionId } = data
  const uid = context.auth.uid
  const fsDb = db()

  const sessionRef = fsDb.collection('sessions').doc(sessionId)
  const session = await sessionRef.get()

  if (!session.exists || session.data().userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Session not found.')
  }

  // Reset check-in timer for another 30 minutes
  const nextCheckIn = new Date()
  nextCheckIn.setMinutes(nextCheckIn.getMinutes() + 30)

  await sessionRef.update({
    needsCheckIn: false,
    lastCheckedInAt: now(),
    checkInPromptAt: admin.firestore.Timestamp.fromDate(nextCheckIn),
  })

  return { success: true }
})
