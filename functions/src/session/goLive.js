'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { haversineDistance, fuzzCoordinates } = require('../utils/geo')
const { db, now, incrementMinutes } = require('../utils/firestoreHelpers')

const GPS_MATCH_RADIUS_M = 200   // User must be within 200m of selected place
const SESSION_DURATION_MIN = 90  // Sessions last 90 minutes
const CHECKIN_PROMPT_MIN = 30    // "Still here?" at 30 minutes

module.exports = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.')
  }

  const { lat, lng, placeId, placeName, venueCategory, activityType } = data
  const uid = context.auth.uid

  // Validate inputs
  if (!lat || !lng || !placeId || !placeName || !activityType) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.')
  }

  // Check for existing active session
  const existingQuery = await db()
    .collection('sessions')
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .limit(1)
    .get()

  if (!existingQuery.empty) {
    throw new functions.https.HttpsError('already-exists', 'You already have an active session.')
  }

  // Fetch place details from Places API to get real coordinates
  const placeDetails = await fetchPlaceDetails(placeId)
  if (!placeDetails) {
    throw new functions.https.HttpsError('not-found', 'Could not verify this location.')
  }

  // Verify user GPS vs. place coordinates
  const distance = haversineDistance(lat, lng, placeDetails.lat, placeDetails.lng)
  if (distance > GPS_MATCH_RADIUS_M) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `You must be within ${GPS_MATCH_RADIUS_M}m of the selected place. You are ${Math.round(distance)}m away.`
    )
  }

  // Reject home/private places (no establishment type)
  const validTypes = placeDetails.types?.some(t =>
    ['bar', 'cafe', 'restaurant', 'food', 'establishment', 'store', 'gym',
     'park', 'museum', 'shopping_mall', 'movie_theater', 'night_club', 'library'].includes(t)
  )
  if (!validTypes) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Only public establishments are allowed.'
    )
  }

  // Fuzz coordinates for map display
  const { fuzzedLat, fuzzedLng } = fuzzCoordinates(placeDetails.lat, placeDetails.lng)

  // Get user profile for display
  const userDoc = await db().collection('users').doc(uid).get()
  const userData = userDoc.data() ?? {}

  // Derive area label (neighborhood from place vicinity)
  const area = placeDetails.vicinity
    ? placeDetails.vicinity.split(',').slice(-2).join(',').trim()
    : 'Nearby area'

  // Create session
  const sessionRef = db().collection('sessions').doc()
  const expiresAt = incrementMinutes(SESSION_DURATION_MIN)
  const checkInAt = incrementMinutes(CHECKIN_PROMPT_MIN)

  await sessionRef.set({
    userId: uid,
    displayName: userData.displayName ?? 'User',
    photoURL: userData.photoURL ?? null,
    status: 'active',
    activityType,
    venueCategory: venueCategory ?? placeDetails.types?.[0] ?? 'establishment',
    // Fuzzed coords shown on map
    fuzzedLat,
    fuzzedLng,
    area,
    // Exact coords stored server-side only
    exactLat: placeDetails.lat,
    exactLng: placeDetails.lng,
    placeId,
    placeName,
    startedAt: now(),
    expiresAt,
    checkInPromptAt: checkInAt,
    lastCheckedInAt: now(),
    needsCheckIn: false,
  })

  // Store exact venue in separate, payment-gated collection
  await db().collection('venueDetails').doc(sessionRef.id).set({
    sessionId: sessionRef.id,
    userId: uid,
    venueName: placeName,
    venueAddress: placeDetails.formattedAddress ?? placeDetails.vicinity ?? placeName,
    venueLat: placeDetails.lat,
    venueLng: placeDetails.lng,
  })

  return { sessionId: sessionRef.id }
})

async function fetchPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    // Fallback: no server-side Places API key configured
    // In production this should throw; for dev, we skip the server check
    return null
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,types,vicinity,formatted_address&key=${apiKey}`
  const response = await fetch(url)
  const json = await response.json()

  if (json.status !== 'OK' || !json.result) return null

  return {
    lat: json.result.geometry.location.lat,
    lng: json.result.geometry.location.lng,
    types: json.result.types,
    vicinity: json.result.vicinity,
    formattedAddress: json.result.formatted_address,
  }
}
