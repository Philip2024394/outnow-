'use strict'

const functions = require('firebase-functions')
const Stripe = require('stripe')
const admin = require('firebase-admin')
const { db, now } = require('../utils/firestoreHelpers')

/**
 * Stripe webhook handler.
 * On checkout.session.completed:
 *   1. Mark OTW request as 'paid'
 *   2. Write venueUnlocks doc so client can read exact venue details
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers['stripe-signature'],
      webhookSecret
    )
  } catch (err) {
    console.error('Stripe webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true })
  }

  const session = event.data.object
  const { buyerUserId, otwRequestId, sessionId } = session.metadata ?? {}

  if (!buyerUserId || !otwRequestId || !sessionId) {
    console.error('Missing metadata in Stripe session:', session.id)
    return res.status(400).send('Missing metadata')
  }

  const fsDb = db()

  // Idempotency: check if already processed
  const unlockDocId = `${buyerUserId}_${sessionId}`
  const existingUnlock = await fsDb.collection('venueUnlocks').doc(unlockDocId).get()
  if (existingUnlock.exists) {
    console.log('Already processed unlock:', unlockDocId)
    return res.json({ received: true })
  }

  // Fetch exact venue details (written by goLive CF, never exposed to client directly)
  const venueDetailsDoc = await fsDb.collection('venueDetails').doc(sessionId).get()
  if (!venueDetailsDoc.exists) {
    console.error('No venue details found for session:', sessionId)
    return res.status(500).send('Venue details not found')
  }
  const venue = venueDetailsDoc.data()

  // Atomic write: update request status + create unlock doc
  const batch = fsDb.batch()

  batch.update(fsDb.collection('otwRequests').doc(otwRequestId), {
    status: 'paid',
    paidAt: now(),
    stripeSessionId: session.id,
  })

  batch.set(fsDb.collection('venueUnlocks').doc(unlockDocId), {
    buyerUserId,
    otwRequestId,
    sessionId,
    venueName: venue.venueName,
    venueAddress: venue.venueAddress,
    venueLat: venue.venueLat,
    venueLng: venue.venueLng,
    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    stripeSessionId: session.id,
  })

  await batch.commit()
  console.log('Venue unlocked:', unlockDocId)

  res.json({ received: true })
})
