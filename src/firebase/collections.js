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
const COFFEE_IMG    = 'https://ik.imagekit.io/dateme/Untitledsdff-removebg-preview.png'
const DRINKS_IMG    = 'https://ik.imagekit.io/dateme/Untitleddsdddd-removebg-preview%20(1).png'
const FOOD_IMG      = 'https://ik.imagekit.io/dateme/Untitledvv-removebg-preview.png'
const GYM_IMG       = 'https://ik.imagekit.io/nepgaxllc/Untitleddssss-removebg-preview.png'
const ART_IMG       = 'https://ik.imagekit.io/nepgaxllc/Untitledffff-removebg-preview.png'
const SHOPPING_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfsddd-removebg-preview.png'
const WALKING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfasdfsdf-removebg-preview.png'
const CYCLING_IMG   = 'https://ik.imagekit.io/nepgaxllc/dddd-removebg-preview.png'
const SWIMMING_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitledfdsdf-removebg-preview.png'
const HIKING_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitleddsdsd-removebg-preview.png'
const YOGA_IMG      = 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasda-removebg-preview.png'
const TENNIS_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitledfdsfdf-removebg-preview.png'
const RUNNING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfsdfsdf-removebg-preview.png'
const TRAVEL_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsdfsdf-removebg-preview.png'
const KARAOKE_IMG   = 'https://ik.imagekit.io/nepgaxllc/aa-removebg-preview.png'
const HANGOUT_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdfds-removebg-preview.png'
const BEACH_IMG     = 'https://ik.imagekit.io/nepgaxllc/Untitledfdasdfa-removebg-preview.png'
const TICKETS_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitledgsdfgsd-removebg-preview.png'
const WINE_IMG      = 'https://ik.imagekit.io/nepgaxllc/Untitleddasda-removebg-preview.png'
const FASTFOOD_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitledasdasda-removebg-preview.png'
const BOWLING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfcc-removebg-preview.png'
const CINEMA_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdg.png'
const PIZZA_IMG     = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfdsdfsd-removebg-preview.png'
const COCKTAILS_IMG = 'https://ik.imagekit.io/nepgaxllc/Untitledcocktail-removebg-preview.png'

export const ACTIVITY_TYPES = [
  { id: 'coffee',    label: 'Coffee',    emoji: '☕', img: COFFEE_IMG    },
  { id: 'drinks',    label: 'Drinks',    emoji: '🍺', img: DRINKS_IMG    },
  { id: 'food',      label: 'Food',      emoji: '🍕', img: FOOD_IMG      },
  { id: 'cocktails', label: 'Cocktails', emoji: '🍸', img: COCKTAILS_IMG },
  { id: 'wine',      label: 'Wine',      emoji: '🍷', img: WINE_IMG      },
  { id: 'pizza',     label: 'Pizza',     emoji: '🍕', img: PIZZA_IMG     },
  { id: 'fastfood',  label: 'Fast Food', emoji: '🍔', img: FASTFOOD_IMG  },
  { id: 'cinema',    label: 'Cinema',    emoji: '🎬', img: CINEMA_IMG    },
  { id: 'bowling',   label: 'Bowling',   emoji: '🎳', img: BOWLING_IMG   },
  { id: 'tickets',   label: 'Events',    emoji: '🎟️', img: TICKETS_IMG   },
  { id: 'walk',      label: 'Walk',      emoji: '🚶', img: WALKING_IMG  },
  { id: 'hiking',    label: 'Hiking',    emoji: '🥾', img: HIKING_IMG   },
  { id: 'swimming',  label: 'Swimming',  emoji: '🏊', img: SWIMMING_IMG },
  { id: 'cycling',   label: 'Cycling',   emoji: '🚴', img: CYCLING_IMG  },
  { id: 'yoga',      label: 'Yoga',      emoji: '🧘', img: YOGA_IMG     },
  { id: 'gym',       label: 'Gym',       emoji: '🏋️', img: GYM_IMG      },
  { id: 'tennis',    label: 'Tennis',    emoji: '🎾', img: TENNIS_IMG   },
  { id: 'running',   label: 'Running',   emoji: '🏃', img: RUNNING_IMG  },
  { id: 'shopping',  label: 'Shopping',  emoji: '🛍️', img: SHOPPING_IMG },
  { id: 'hangout',   label: 'Hangout',   emoji: '👥', img: HANGOUT_IMG  },
  { id: 'art',       label: 'Art',       emoji: '🎨', img: ART_IMG      },
  { id: 'gaming',    label: 'Gaming',    emoji: '🎮' },
  { id: 'music',     label: 'Music',     emoji: '🎵' },
  { id: 'travel',    label: 'Travel',    emoji: '✈️', img: TRAVEL_IMG   },
  { id: 'karaoke',   label: 'Karaoke',   emoji: '🎤', img: KARAOKE_IMG  },
  { id: 'beach',     label: 'Beach',     emoji: '🏖️', img: BEACH_IMG    },
]

export const activityEmoji = (activityId) =>
  ACTIVITY_TYPES.find(a => a.id === activityId)?.emoji ?? '📍'

export const activityImage = (activityId) =>
  ACTIVITY_TYPES.find(a => a.id === activityId)?.img ?? null
