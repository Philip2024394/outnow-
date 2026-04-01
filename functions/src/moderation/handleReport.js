'use strict'

const functions = require('firebase-functions')
const { db, now } = require('../utils/firestoreHelpers')

const REPORTS_BEFORE_AUTO_DISABLE = 5

module.exports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { reportedUserId, sessionId, reason } = data
  const reporterId = context.auth.uid

  if (!reportedUserId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing fields.')
  }

  const fsDb = db()
  const batch = fsDb.batch()

  // Write report
  const reportRef = fsDb.collection('reports').doc()
  batch.set(reportRef, {
    reporterId,
    reportedUserId,
    sessionId: sessionId ?? null,
    reason,
    createdAt: now(),
  })

  // Auto-block from reporter's side
  const blockRef = fsDb.collection('blocks').doc(reporterId)
    .collection('blockedUsers').doc(reportedUserId)
  batch.set(blockRef, { blockedUserId: reportedUserId, createdAt: now() })

  await batch.commit()

  // Check if this user has too many reports → auto-disable their session
  const recentReports = await fsDb
    .collection('reports')
    .where('reportedUserId', '==', reportedUserId)
    .get()

  if (recentReports.size >= REPORTS_BEFORE_AUTO_DISABLE) {
    // End their active session
    const activeSessions = await fsDb
      .collection('sessions')
      .where('userId', '==', reportedUserId)
      .where('status', '==', 'active')
      .get()

    const sessionBatch = fsDb.batch()
    activeSessions.forEach(doc => {
      sessionBatch.update(doc.ref, { status: 'ended', endedAt: now(), endReason: 'moderation' })
    })
    if (!activeSessions.empty) {
      await sessionBatch.commit()
    }
  }

  return { success: true }
})
