'use strict'

const functions = require('firebase-functions')
const Stripe = require('stripe')
const { db } = require('../utils/firestoreHelpers')

module.exports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { otwRequestId, sessionId, successUrl, cancelUrl } = data
  const uid = context.auth.uid

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const priceUsd = Number(process.env.OTW_PRICE_USD ?? 2.99)
  const priceInCents = Math.round(priceUsd * 100)

  const fsDb = db()

  // Verify OTW request belongs to this user and is accepted
  const requestDoc = await fsDb.collection('otwRequests').doc(otwRequestId).get()
  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'OTW request not found.')
  }

  const request = requestDoc.data()
  if (request.fromUserId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not your request.')
  }
  if (request.status !== 'accepted') {
    throw new functions.https.HttpsError('failed-precondition', 'Request must be accepted first.')
  }

  // Fetch session for display
  const sessionDoc = await fsDb.collection('sessions').doc(sessionId).get()
  const sessionData = sessionDoc.exists ? sessionDoc.data() : {}

  // Create Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Hangger — Unlock Location',
          description: `Meet ${sessionData.displayName ?? 'someone'} at ${sessionData.placeName ?? 'a nearby spot'}`,
        },
        unit_amount: priceInCents,
      },
      quantity: 1,
    }],
    metadata: {
      buyerUserId: uid,
      otwRequestId,
      sessionId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return { checkoutUrl: checkoutSession.url }
})
