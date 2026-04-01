'use strict'

const EARTH_RADIUS_M = 6371000

/**
 * Haversine distance in meters between two lat/lng points.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Fuzz a coordinate by a random distance between minM and maxM meters
 * in a random direction.
 */
function fuzzCoordinates(lat, lng, minM = 200, maxM = 500) {
  const radiusM = Math.random() * (maxM - minM) + minM
  const radiusDeg = radiusM / EARTH_RADIUS_M
  const angle = Math.random() * 2 * Math.PI
  const fuzzedLat = lat + (radiusDeg * Math.cos(angle) * 180) / Math.PI
  const fuzzedLng = lng + ((radiusDeg * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180) * 180) / Math.PI
  return { fuzzedLat, fuzzedLng }
}

module.exports = { haversineDistance, fuzzCoordinates }
