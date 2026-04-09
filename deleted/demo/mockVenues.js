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
    hours: { open: '16:00', close: '02:00' },
    serves: ['Drinks', 'Food', 'Cocktails'],
    bio: 'A buzzing Soho bar with craft beers, inventive cocktails and a crowd that knows how to have a good night. Live DJs every Thursday to Saturday.',
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
    hours: { open: '08:00', close: '18:30' },
    serves: ['Coffee', 'Food'],
    bio: 'One of London\'s most loved independent coffee shops. Single-origin brews, homemade pastries and a relaxed atmosphere in the heart of Covent Garden.',
  },
  {
    id: 'venue-fitz-bistro',
    name: 'Barrica',
    emoji: '🍷',
    type: 'Wine Bar',
    address: '62 Goodge St, Fitzrovia',
    lat: 51.5196,
    lng: -0.1357,
    hours: { open: '12:00', close: '23:00' },
    serves: ['Wine', 'Drinks', 'Food'],
    bio: 'Spanish-inspired wine bar with an exceptional list of natural and biodynamic wines. Perfect for a relaxed evening with sharing plates and great conversation.',
    discount: { percent: 20, type: 'wine', confirmed: true },
  },
  {
    id: 'venue-hyde-pub',
    name: 'The Victoria',
    emoji: '🍺',
    type: 'Pub',
    address: '10a Strathearn Pl, Hyde Park',
    lat: 51.5062,
    lng: -0.1730,
    hours: { open: '11:00', close: '23:30' },
    serves: ['Drinks', 'Food'],
    bio: 'A classic Victorian pub steps from Hyde Park. Real ales, a warm atmosphere and a beer garden that\'s packed in summer. The kind of local everyone wishes they had.',
  },
  {
    id: 'venue-bloomsbury-pub',
    name: 'The Museum Tavern',
    emoji: '🍺',
    type: 'Pub',
    address: '49 Great Russell St, Bloomsbury',
    lat: 51.5183,
    lng: -0.1264,
    hours: { open: '10:00', close: '23:00' },
    serves: ['Drinks', 'Food'],
    bio: 'Historic pub opposite the British Museum dating back to 1723. Karl Marx is said to have been a regular. Excellent range of ales and a genuinely unique atmosphere.',
    discount: { percent: 10, type: 'food', confirmed: true },
  },
  {
    id: 'venue-oxford-bar',
    name: 'Dirty Martini',
    emoji: '🍸',
    type: 'Cocktail Bar',
    address: '11 Hanover Sq, Oxford St',
    lat: 51.5134,
    lng: -0.1432,
    hours: { open: '17:00', close: '03:00' },
    serves: ['Cocktails', 'Drinks'],
    bio: 'Sleek cocktail bar known for its martini menu and late-night energy. Expert bartenders, great music and a sophisticated crowd. Dress to impress.',
    discount: { percent: 25, type: 'cocktails', confirmed: true },
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
