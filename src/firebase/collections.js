// Firestore collection path constants
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  OTW_REQUESTS: 'otwRequests',
  INTERESTS: 'interests',        // mutual like/invite docs
  VENUE_UNLOCKS: 'venueUnlocks',
  REPORTS: 'reports',
  BLOCKS: 'blocks',
}

// Sub-collection paths
export const BLOCKS_SUB = (userId) => `blocks/${userId}/blockedUsers`

// Interest doc ID format: {fromUserId}_{toUserId}_{sessionId}
export const interestId = (fromUid, toUid, sessionId) =>
  `${fromUid}_${toUid}_${sessionId}`

// Venue unlock doc ID format: {buyerUserId}_{sessionId}
export const unlockId = (buyerUid, sessionId) =>
  `${buyerUid}_${sessionId}`

// OTW Request statuses
export const OTW_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  PAID: 'paid',
  PROCEEDING: 'proceeding',
  COMPLETED: 'completed',
}

// Interest / mutual invite statuses
export const INTEREST_STATUS = {
  PENDING: 'pending',   // one side expressed interest
  MUTUAL: 'mutual',     // both sides matched
}

// Session statuses
export const SESSION_STATUS = {
  INVITE_OUT: 'invite_out', // wants to go out — yellow, visible on map
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  ENDED: 'ended',
}

// Activity types with labels and emoji
const COFFEE_IMG = 'https://ik.imagekit.io/dateme/Untitledsdff-removebg-preview.png'
const DRINKS_IMG = 'https://ik.imagekit.io/dateme/Untitleddsdddd-removebg-preview%20(1).png'
const FOOD_IMG   = 'https://ik.imagekit.io/dateme/Untitledvv-removebg-preview.png'

export const ACTIVITY_TYPES = [
  { id: 'coffee',   label: 'Coffee',   emoji: '☕', img: COFFEE_IMG },
  { id: 'drinks',   label: 'Drinks',   emoji: '🍺', img: DRINKS_IMG },
  { id: 'food',     label: 'Food',     emoji: '🍕', img: FOOD_IMG   },
  { id: 'walk',     label: 'Walk',     emoji: '🚶' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'hangout',  label: 'Hangout',  emoji: '👥' },
  { id: 'workout',  label: 'Workout',  emoji: '💪' },
  { id: 'culture',  label: 'Culture',  emoji: '🎨' },
]

export const activityEmoji = (activityId) =>
  ACTIVITY_TYPES.find(a => a.id === activityId)?.emoji ?? '📍'
