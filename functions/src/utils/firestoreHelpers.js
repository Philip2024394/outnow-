'use strict'

const admin = require('firebase-admin')

function db() {
  return admin.firestore()
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp()
}

function incrementMinutes(minutes) {
  const d = new Date()
  d.setMinutes(d.getMinutes() + minutes)
  return admin.firestore.Timestamp.fromDate(d)
}

module.exports = { db, now, incrementMinutes }
