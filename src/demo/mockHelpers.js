// Shared mock data helpers
export const BASE_LAT = 51.5074
export const BASE_LNG = -0.1278

export function offset(minM, maxM) {
  const r = (Math.random() * (maxM - minM) + minM) / 111320
  const angle = Math.random() * 2 * Math.PI
  const lat = BASE_LAT + r * Math.cos(angle)
  const lng = BASE_LNG + r * Math.sin(angle) / Math.cos(BASE_LAT * Math.PI / 180)
  const r2 = (Math.random() * 300 + 200) / 111320
  const a2 = Math.random() * 2 * Math.PI
  return {
    lat,
    lng,
    fuzzedLat: lat + r2 * Math.cos(a2),
    fuzzedLng: lng + r2 * Math.sin(a2) / Math.cos(lat * Math.PI / 180),
  }
}

export const now = Date.now()

const _ukHour = parseInt(
  new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false }),
  10
)
export const _isUKLateNight = _ukHour >= 0 && _ukHour < 7

export function tonight() {
  const d = new Date()
  d.setHours(20, 0, 0, 0)
  return d.getTime()
}

export function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(14, 0, 0, 0)
  return d.getTime()
}
