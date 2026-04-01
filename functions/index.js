'use strict'

const admin = require('firebase-admin')
admin.initializeApp()

// Session management
const goLive = require('./src/session/goLive')
const { expireSessions, endSession, confirmCheckIn } = require('./src/session/expireSessions')

// OTW system
const sendOtwRequest = require('./src/otw/sendOtwRequest')
const { respondToOtw, markOtwProceeding, cancelOtw } = require('./src/otw/respondToOtw')

// Payments
const createCheckoutSession = require('./src/payments/createCheckoutSession')
const { stripeWebhook } = require('./src/payments/stripeWebhook')

// Moderation
const handleReport = require('./src/moderation/handleReport')

// Mutual interest
const { onInterestCreated } = require('./src/otw/handleInterest')

module.exports = {
  // Session
  goLive,
  expireSessions,
  endSession,
  confirmCheckIn,

  // OTW
  sendOtwRequest,
  respondToOtw,
  markOtwProceeding,
  cancelOtw,

  // Mutual interest
  onInterestCreated,

  // Payments
  createCheckoutSession,
  stripeWebhook,

  // Moderation
  handleReport,
}
