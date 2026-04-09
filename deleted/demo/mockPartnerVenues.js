// Partner venues — businesses registered with Hangger
// Each venue has: type, offers[], images[], contact details

export const OFFER_TYPES = {
  PERCENT_OFF:    'percent_off',      // 10% off total bill
  BOGO:           'bogo',             // Buy 1 get 1 free
  FREE_ITEM:      'free_item',        // Free item with purchase
  FIXED_OFF:      'fixed_off',        // £X off bill
  HAPPY_HOUR:     'happy_hour',       // Time-based discount
  EARLY_BIRD:     'early_bird',       // Book before X, save Y%
  FREE_ENTRY:     'free_entry',       // Free entry (clubs/events)
  LOYALTY:        'loyalty',          // Nth purchase free
  WELCOME_DRINK:  'welcome_drink',    // Free welcome drink
  GROUP_DEAL:     'group_deal',       // Group of X get Y% off
  FREE_UPGRADE:   'free_upgrade',     // Free upgrade (hotel room, seat etc.)
  TASTING:        'tasting',          // Free tasting / sample
}

export const VENUE_CATEGORIES = [
  'Bar / Pub',
  'Restaurant',
  'Coffee Shop',
  'Gym / Sport',
  'Cinema',
  'Club / Nightlife',
  'Art / Gallery',
  'Market / Festival',
  'Hotel / Stay',
  'Spa / Wellness',
  'Bowling / Activities',
  'Rooftop / Terrace',
]

export const PARTNER_VENUES = [
  {
    id: 'partner-neon-tap',
    name: 'The Neon Tap',
    category: 'Bar / Pub',
    emoji: '🍺',
    tagline: 'Craft beers, cold nights, warm crowd',
    address: '23 Old Compton St, Soho, London',
    lat: 51.5133,
    lng: -0.1320,
    phone: '+44 20 7437 0000',
    website: 'thenentap.co.uk',
    partnerSince: '2025',
    minDiscount: 15,
    country: 'United Kingdom',
    featured: true,
    images: [
      'https://ik.imagekit.io/nepgaxllc/uk10dd.png',
      'https://ik.imagekit.io/nepgaxllc/uk1.png',
    ],
    offers: [
      {
        id: 'o1',
        type: OFFER_TYPES.BOGO,
        title: 'Buy 1 Get 1 Free',
        detail: 'Any draught pint or house cocktail',
        validTimes: 'Mon–Thu, 5pm – 8pm',
        emoji: '🍺',
      },
      {
        id: 'o2',
        type: OFFER_TYPES.PERCENT_OFF,
        title: '15% off total bill',
        detail: 'Show your Hangger profile at the bar',
        validTimes: 'All week',
        emoji: '💸',
      },
    ],
  },
  {
    id: 'partner-barrica',
    name: 'Barrica',
    category: 'Bar / Pub',
    emoji: '🍷',
    tagline: 'Spanish wines & pintxos in the heart of Fitzrovia',
    address: '62 Goodge St, Fitzrovia, London',
    lat: 51.5196,
    lng: -0.1357,
    phone: '+44 20 7436 9448',
    website: 'barrica.co.uk',
    partnerSince: '2025',
    minDiscount: 10,
    country: 'United Kingdom',
    images: [
      'https://ik.imagekit.io/nepgaxllc/uk3.png',
      'https://ik.imagekit.io/nepgaxllc/uk4.png',
    ],
    offers: [
      {
        id: 'o1',
        type: OFFER_TYPES.HAPPY_HOUR,
        title: '2-for-1 wine',
        detail: 'Any glass of house wine or cava',
        validTimes: 'Daily until 8pm',
        emoji: '🍷',
      },
      {
        id: 'o2',
        type: OFFER_TYPES.FREE_ITEM,
        title: 'Free pintxos plate',
        detail: 'With any bottle of wine ordered for the table',
        validTimes: 'Fri & Sat evenings',
        emoji: '🫒',
      },
    ],
  },
  {
    id: 'partner-monmouth',
    name: 'Monmouth Coffee',
    category: 'Coffee Shop',
    emoji: '☕',
    tagline: 'Speciality coffee roasted with love',
    address: '27 Monmouth St, Covent Garden, London',
    lat: 51.5138,
    lng: -0.1269,
    phone: '+44 20 7232 3010',
    website: 'monmouthcoffee.co.uk',
    partnerSince: '2025',
    minDiscount: 10,
    country: 'United Kingdom',
    images: [
      'https://ik.imagekit.io/nepgaxllc/uk5.png',
      'https://ik.imagekit.io/nepgaxllc/uk6.png',
    ],
    offers: [
      {
        id: 'o1',
        type: OFFER_TYPES.BOGO,
        title: 'Buy 1 Get 1 Coffee',
        detail: 'Any filter or espresso drink',
        validTimes: 'Weekdays, 8am – 11am',
        emoji: '☕',
      },
      {
        id: 'o2',
        type: OFFER_TYPES.FREE_ITEM,
        title: 'Free pastry',
        detail: 'With any large coffee purchase',
        validTimes: 'All day',
        emoji: '🥐',
      },
      {
        id: 'o3',
        type: OFFER_TYPES.LOYALTY,
        title: '5th coffee free',
        detail: 'Stamp collected on your Hangger profile',
        validTimes: 'Ongoing',
        emoji: '🎟️',
      },
    ],
  },
  {
    id: 'partner-museum-tavern',
    name: 'The Museum Tavern',
    category: 'Bar / Pub',
    emoji: '🍺',
    tagline: 'Historic pub beside the British Museum since 1855',
    address: '49 Great Russell St, Bloomsbury, London',
    lat: 51.5183,
    lng: -0.1264,
    phone: '+44 20 7242 8987',
    website: 'themuseumtavern.co.uk',
    partnerSince: '2025',
    minDiscount: 10,
    country: 'United Kingdom',
    images: [
      'https://ik.imagekit.io/nepgaxllc/uk8.png',
      'https://ik.imagekit.io/nepgaxllc/uk9.png',
    ],
    offers: [
      {
        id: 'o1',
        type: OFFER_TYPES.FREE_ITEM,
        title: 'Free bar snacks',
        detail: 'With any round of drinks for 2+',
        validTimes: 'Daily until 10pm',
        emoji: '🥜',
      },
      {
        id: 'o2',
        type: OFFER_TYPES.PERCENT_OFF,
        title: '10% off food menu',
        detail: 'Show Hangger at the bar when ordering food',
        validTimes: 'All week',
        emoji: '🍽️',
      },
    ],
  },
  {
    id: 'partner-dirty-martini',
    name: 'Dirty Martini',
    category: 'Club / Nightlife',
    emoji: '🍸',
    tagline: 'Cocktail bar & club — dress to impress',
    address: '11 Hanover Sq, Oxford St, London',
    lat: 51.5134,
    lng: -0.1432,
    phone: '+44 20 7079 0679',
    website: 'dirtymartini.uk.com',
    partnerSince: '2025',
    minDiscount: 10,
    country: 'United Kingdom',
    featured: true,
    images: [
      'https://ik.imagekit.io/nepgaxllc/uk10dd.png',
      'https://ik.imagekit.io/nepgaxllc/uk1.png',
    ],
    offers: [
      {
        id: 'o1',
        type: OFFER_TYPES.FREE_ENTRY,
        title: 'Free entry before 10pm',
        detail: 'Show Hangger at the door — no guest list needed',
        validTimes: 'Fri & Sat',
        emoji: '🎟️',
      },
      {
        id: 'o2',
        type: OFFER_TYPES.WELCOME_DRINK,
        title: 'Free welcome cocktail',
        detail: 'One per person on arrival — any house cocktail',
        validTimes: 'Fri & Sat before 10pm',
        emoji: '🍸',
      },
      {
        id: 'o3',
        type: OFFER_TYPES.PERCENT_OFF,
        title: '20% off cocktail pitchers',
        detail: 'Groups of 3+ only — show Hangger',
        validTimes: 'All week',
        emoji: '💸',
      },
    ],
  },
]

// Colour used for partner venue map ring / badge
export const PARTNER_RING_COLOR = '#FFD60A'
