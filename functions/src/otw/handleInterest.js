'use strict'

const functions = require('firebase-functions')
const { db, now } = require('../utils/firestoreHelpers')

/**
 * Firestore trigger: when a new interest doc is created,
 * check if the other side already expressed interest → mark both as 'mutual'.
 */
exports.onInterestCreated = functions.firestore
  .document('interests/{interestId}')
  .onCreate(async (snap, context) => {
    const interest = snap.data()
    const fsDb = db()

    // Look for a reverse interest: from toUserId → fromUserId on the same session
    const reverseQuery = await fsDb
      .collection('interests')
      .where('fromUserId', '==', interest.toUserId)
      .where('toUserId', '==', interest.fromUserId)
      .where('sessionId', '==', interest.sessionId)
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    if (reverseQuery.empty) return // No mutual yet

    // Both sides expressed interest → mark both as mutual
    const batch = fsDb.batch()
    batch.update(snap.ref, { status: 'mutual', mutualAt: now() })
    batch.update(reverseQuery.docs[0].ref, { status: 'mutual', mutualAt: now() })
    await batch.commit()

    console.log(`Mutual interest created between ${interest.fromUserId} and ${interest.toUserId}`)
  })
