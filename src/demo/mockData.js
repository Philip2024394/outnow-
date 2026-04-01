// Fake users scattered around a city centre (London default)
// Coords are fuzzed — approximate area only, as per real app behaviour

const BASE_LAT = 51.5074
const BASE_LNG = -0.1278

function offset(minM, maxM) {
  const r = (Math.random() * (maxM - minM) + minM) / 111320
  const angle = Math.random() * 2 * Math.PI
  return {
    lat: BASE_LAT + r * Math.cos(angle),
    lng: BASE_LNG + r * Math.sin(angle) / Math.cos(BASE_LAT * Math.PI / 180),
  }
}

const now = Date.now()

export const DEMO_USER = {
  uid: 'demo-me',
  displayName: 'You',
  photoURL: null,
  phoneNumber: null,
  email: 'demo@imoutnow.app',
}

export const DEMO_SESSIONS = [
  {
    id: 'demo-session-1',
    userId: 'demo-user-1',
    displayName: 'Jordan',
    photoURL: null,
    activityType: 'drinks',
    area: 'Soho, central',
    status: 'active',
    expiresAtMs: now + 45 * 60 * 1000,
    startedAtMs: now - 15 * 60 * 1000,
    ...offset(200, 600),
  },
  {
    id: 'demo-session-2',
    userId: 'demo-user-2',
    displayName: 'Mia',
    photoURL: null,
    activityType: 'coffee',
    area: 'Covent Garden',
    status: 'active',
    expiresAtMs: now + 30 * 60 * 1000,
    startedAtMs: now - 20 * 60 * 1000,
    ...offset(300, 700),
  },
  {
    id: 'demo-session-3',
    userId: 'demo-user-3',
    displayName: 'Raf',
    photoURL: null,
    activityType: 'food',
    area: 'Fitzrovia',
    status: 'active',
    expiresAtMs: now + 60 * 60 * 1000,
    startedAtMs: now - 10 * 60 * 1000,
    ...offset(400, 900),
  },
  {
    id: 'demo-session-4',
    userId: 'demo-user-4',
    displayName: 'Sam',
    photoURL: null,
    activityType: 'walk',
    area: 'Hyde Park area',
    status: 'active',
    expiresAtMs: now + 55 * 60 * 1000,
    startedAtMs: now - 5 * 60 * 1000,
    ...offset(500, 1000),
  },
  {
    id: 'demo-session-5',
    userId: 'demo-user-5',
    displayName: 'Priya',
    photoURL: null,
    activityType: 'hangout',
    area: 'Bloomsbury',
    status: 'active',
    expiresAtMs: now + 20 * 60 * 1000,
    startedAtMs: now - 40 * 60 * 1000,
    ...offset(200, 500),
  },
  {
    id: 'demo-session-6',
    userId: 'demo-user-6',
    displayName: 'Leo',
    photoURL: null,
    activityType: 'shopping',
    area: 'Oxford Street',
    status: 'active',
    expiresAtMs: now + 75 * 60 * 1000,
    startedAtMs: now - 5 * 60 * 1000,
    ...offset(300, 800),
  },
]

export const DEMO_CENTER = { lat: BASE_LAT, lng: BASE_LNG }

export const DEMO_LIKED_USERS = [
  { id: 'like-1', displayName: 'Ava', age: 26, online: true,  emoji: '😊', activityType: 'drinks',  area: 'Soho' },
  { id: 'like-2', displayName: 'Marcus', age: 30, online: true,  emoji: '😎', activityType: 'coffee',  area: 'Shoreditch' },
  { id: 'like-3', displayName: 'Zoe', age: 24, online: false, emoji: '🌸', activityType: 'food',    area: 'Camden' },
  { id: 'like-4', displayName: 'Kai', age: 28, online: true,  emoji: '🤙', activityType: 'hangout', area: 'Dalston' },
  { id: 'like-5', displayName: 'Sofia', age: 23, online: false, emoji: '✨', activityType: 'walk',    area: 'Notting Hill' },
  { id: 'like-6', displayName: 'Finn', age: 31, online: true,  emoji: '🎯', activityType: 'drinks',  area: 'Brixton' },
]
