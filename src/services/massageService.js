/**
 * Massage Service — therapist profiles, bookings, reviews.
 * Demo mode with localStorage. Production uses Supabase.
 */

const STORAGE_KEY = 'indoo_massage_therapists'
const BOOKINGS_KEY = 'indoo_massage_bookings'

export const MASSAGE_TYPES = [
  'Traditional', 'Swedish', 'Deep Tissue', 'Thai', 'Balinese',
  'Shiatsu', 'Hot Stone', 'Aromatherapy', 'Sports', 'Reflexology',
]

export const AVAILABILITY = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
}

// Demo therapist profiles
const DEMO_THERAPISTS = [
  {
    id: 'th1', name: 'Dewi Sari', age: 28, yearsOfExperience: 6,
    profileImage: 'https://i.pravatar.cc/300?img=45',
    description: 'Certified Balinese massage therapist with 6+ years experience. Specialized in deep tissue and aromatherapy techniques. Available for home, hotel, and villa services.',
    location: 'Yogyakarta', area: 'Sleman',
    lat: -7.7713, lng: 110.3776,
    massageTypes: ['Balinese', 'Deep Tissue', 'Aromatherapy'],
    price60: 150000, price90: 200000, price120: 250000,
    rating: 4.9, reviewCount: 87,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English'],
    phone: '+6281234567890',
  },
  {
    id: 'th2', name: 'Putu Ayu', age: 32, yearsOfExperience: 10,
    profileImage: 'https://i.pravatar.cc/300?img=47',
    description: 'Master therapist trained in traditional Javanese and Thai techniques. 10 years of professional experience serving international clients.',
    location: 'Yogyakarta', area: 'Kraton',
    lat: -7.8052, lng: 110.3642,
    massageTypes: ['Thai', 'Traditional', 'Swedish'],
    price60: 180000, price90: 250000, price120: 300000,
    rating: 4.8, reviewCount: 124,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'Females Only',
    languages: ['Indonesian', 'English', 'Japanese'],
    phone: '+6281234567891',
  },
  {
    id: 'th3', name: 'Wayan Surya', age: 35, yearsOfExperience: 12,
    profileImage: 'https://i.pravatar.cc/300?img=52',
    description: 'Sports massage specialist with background in physiotherapy. Ideal for athletes and active individuals. Deep tissue and sports recovery focus.',
    location: 'Yogyakarta', area: 'Gejayan',
    lat: -7.7838, lng: 110.3775,
    massageTypes: ['Sports', 'Deep Tissue', 'Swedish'],
    price60: 200000, price90: 275000, price120: 350000,
    rating: 4.7, reviewCount: 56,
    status: 'Busy', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English'],
    phone: '+6281234567892',
    busyUntil: new Date(Date.now() + 45 * 60000).toISOString(),
  },
  {
    id: 'th4', name: 'Nia Rahmawati', age: 26, yearsOfExperience: 4,
    profileImage: 'https://i.pravatar.cc/300?img=44',
    description: 'Specializing in relaxation and aromatherapy massage. Trained at Bali International Spa Academy. Gentle, calming techniques for stress relief.',
    location: 'Yogyakarta', area: 'Prawirotaman',
    lat: -7.8127, lng: 110.3677,
    massageTypes: ['Aromatherapy', 'Swedish', 'Hot Stone'],
    price60: 130000, price90: 175000, price120: 220000,
    rating: 4.6, reviewCount: 34,
    status: 'Available', isVerified: false, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian'],
    phone: '+6281234567893',
  },
  {
    id: 'th5', name: 'Kadek Yoga', age: 30, yearsOfExperience: 8,
    profileImage: 'https://i.pravatar.cc/300?img=53',
    description: 'Hotel and villa massage specialist. Expert in Balinese, hot stone and reflexology. Premium service for discerning clients.',
    location: 'Yogyakarta', area: 'Malioboro',
    lat: -7.7928, lng: 110.3653,
    massageTypes: ['Balinese', 'Hot Stone', 'Reflexology'],
    price60: 175000, price90: 230000, price120: 280000,
    rating: 4.9, reviewCount: 98,
    status: 'Available', isVerified: true, isLive: true,
    clientPreferences: 'All',
    languages: ['Indonesian', 'English', 'Mandarin'],
    phone: '+6281234567894',
  },
  {
    id: 'th6', name: 'Sri Wahyuni', age: 29, yearsOfExperience: 7,
    profileImage: 'https://i.pravatar.cc/300?img=46',
    description: 'Traditional Javanese massage expert. Specializes in prenatal massage and women-only services. Gentle yet effective techniques passed down through generations.',
    location: 'Yogyakarta', area: 'Kaliurang',
    lat: -7.6035, lng: 110.4240,
    massageTypes: ['Traditional', 'Shiatsu', 'Reflexology'],
    price60: 140000, price90: 190000, price120: 240000,
    rating: 4.8, reviewCount: 67,
    status: 'Offline', isVerified: true, isLive: false,
    clientPreferences: 'Females Only',
    languages: ['Indonesian', 'Javanese'],
    phone: '+6281234567895',
  },
]

export function getTherapists() { return DEMO_THERAPISTS }

export function getTherapistById(id) {
  return DEMO_THERAPISTS.find(t => t.id === id) || null
}

export function searchTherapists({ query, massageType, city, status }) {
  let results = DEMO_THERAPISTS
  if (query) {
    const q = query.toLowerCase()
    results = results.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.area.toLowerCase().includes(q) ||
      t.massageTypes.some(m => m.toLowerCase().includes(q))
    )
  }
  if (massageType && massageType !== 'all') {
    results = results.filter(t => t.massageTypes.includes(massageType))
  }
  if (status && status !== 'all') {
    results = results.filter(t => t.status === status)
  }
  return results
}

export function fmtPrice(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
