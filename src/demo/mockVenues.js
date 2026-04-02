// London venues for the venue verification badge feature
// Coordinates are approximate — clustered near BASE_LAT/BASE_LNG (51.5074, -0.1278)

export const DEMO_VENUES = [
  {
    id: 'venue-soho-bar',
    name: 'The Neon Tap',
    emoji: '🍺',
    type: 'Bar',
    address: '23 Old Compton St, Soho',
    lat: 51.5133,
    lng: -0.1320,
    deal: {
      emoji: '🍺',
      title: 'First drink £4',
      description: 'Show this screen at the bar to claim your welcome drink',
      validUntil: '11pm tonight',
    },
    discount: { percent: 15, type: 'drinks', confirmed: true },
  },
  {
    id: 'venue-cg-cafe',
    name: 'Monmouth Coffee',
    emoji: '☕',
    type: 'Café',
    address: '27 Monmouth St, Covent Garden',
    lat: 51.5138,
    lng: -0.1269,
  },
  {
    id: 'venue-fitz-bistro',
    name: 'Barrica',
    emoji: '🍷',
    type: 'Wine Bar',
    address: '62 Goodge St, Fitzrovia',
    lat: 51.5196,
    lng: -0.1357,
    deal: {
      emoji: '🍷',
      title: '2-for-1 wine until 8pm',
      description: 'Any glass of house wine — show this screen to the staff',
      validUntil: '8pm tonight',
    },
  },
  {
    id: 'venue-hyde-pub',
    name: 'The Victoria',
    emoji: '🍺',
    type: 'Pub',
    address: '10a Strathearn Pl, Hyde Park',
    lat: 51.5062,
    lng: -0.1730,
  },
  {
    id: 'venue-bloomsbury-pub',
    name: 'The Museum Tavern',
    emoji: '🍺',
    type: 'Pub',
    address: '49 Great Russell St, Bloomsbury',
    lat: 51.5183,
    lng: -0.1264,
    deal: {
      emoji: '🎯',
      title: 'Free bar snacks with any round',
      description: 'Order a round of drinks and snacks are on us — show this screen',
      validUntil: '10pm tonight',
    },
  },
  {
    id: 'venue-oxford-bar',
    name: 'Dirty Martini',
    emoji: '🍸',
    type: 'Cocktail Bar',
    address: '11 Hanover Sq, Oxford St',
    lat: 51.5134,
    lng: -0.1432,
  },
]

// Returns only venues that have at least one live session,
// enriched with { count, sessions[] }
export function getActiveVenues(sessions, venues) {
  const sessionsByVenue = {}
  sessions.forEach(s => {
    if (!s.venueId) return
    if (!sessionsByVenue[s.venueId]) sessionsByVenue[s.venueId] = []
    sessionsByVenue[s.venueId].push(s)
  })
  return venues
    .filter(v => (sessionsByVenue[v.id]?.length ?? 0) > 0)
    .map(v => ({
      ...v,
      count: sessionsByVenue[v.id].length,
      sessions: sessionsByVenue[v.id],
    }))
}
