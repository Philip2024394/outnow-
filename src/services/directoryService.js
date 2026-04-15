/**
 * Destination Directory Service
 * Real GPS coordinates for Yogyakarta destinations.
 * Auto-pricing: under 10km = one way, over 10km = return trip.
 * Bike: Rp 5,000 base + Rp 3,000/km
 * Car: Rp 10,000 base + Rp 4,000/km
 */

// City center reference point (Malioboro, Yogyakarta)
const CITY_CENTER = { lat: -7.7928, lng: 110.3653 }
const ONE_WAY_LIMIT_KM = 10

// Pricing
const BIKE_BASE = 5000
const BIKE_PER_KM = 3000
const CAR_BASE = 10000
const CAR_PER_KM = 4000

// Haversine distance
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function roundPrice(n) {
  return Math.round(n / 1000) * 1000
}

export function calculateDirectoryPrice(destination) {
  const km = destination.distanceKm
  const isReturn = km > ONE_WAY_LIMIT_KM
  const tripKm = isReturn ? km * 2 : km

  return {
    bike: roundPrice(BIKE_BASE + tripKm * BIKE_PER_KM),
    car: roundPrice(CAR_BASE + tripKm * CAR_PER_KM),
    isReturn,
    oneWayKm: km,
    tripKm,
  }
}

// ── Yogyakarta Directory ─────────────────────────────────────────────────────
export const DIRECTORY_CATEGORIES = [
  { id: 'airport',    icon: '✈️', label: 'Airports' },
  { id: 'temple',     icon: '🛕', label: 'Temples' },
  { id: 'beach',      icon: '🏖️', label: 'Beaches' },
  { id: 'nightlife',  icon: '🍸', label: 'Nightlife' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurants' },
  { id: 'art',        icon: '🎨', label: 'Art & Culture' },
  { id: 'hospital',   icon: '🏥', label: 'Hospitals' },
  { id: 'transport',  icon: '🚉', label: 'Transport' },
  { id: 'shopping',   icon: '🛍️', label: 'Shopping' },
  { id: 'university', icon: '🎓', label: 'Universities' },
  { id: 'government', icon: '🏛️', label: 'Government' },
  { id: 'nature',     icon: '🌿', label: 'Nature' },
  { id: 'food',       icon: '🍔', label: 'Food Areas' },
]

export const YOGYAKARTA_DESTINATIONS = [
  // Airports
  { id: 'jog', name: 'Adisucipto Airport (JOG)', category: 'airport', lat: -7.7882, lng: 110.4317, address: 'Jl. Solo Km 9, Sleman' },
  { id: 'yia', name: 'YIA International Airport', category: 'airport', lat: -7.9008, lng: 110.0577, address: 'Kulon Progo, DIY' },

  // Temples
  { id: 'prambanan', name: 'Prambanan Temple', category: 'temple', lat: -7.7520, lng: 110.4915, address: 'Jl. Raya Solo-Yogya, Sleman' },
  { id: 'borobudur', name: 'Borobudur Temple', category: 'temple', lat: -7.6079, lng: 110.2038, address: 'Magelang, Central Java' },
  { id: 'ratuboko', name: 'Ratu Boko Palace', category: 'temple', lat: -7.7704, lng: 110.4892, address: 'Prambanan, Sleman' },
  { id: 'kraton', name: 'Kraton (Sultan Palace)', category: 'temple', lat: -7.8052, lng: 110.3642, address: 'Jl. Rotowijayan, Kraton' },
  { id: 'tamansari', name: 'Taman Sari Water Castle', category: 'temple', lat: -7.8100, lng: 110.3593, address: 'Jl. Taman, Kraton' },

  // Beaches
  { id: 'parangtritis', name: 'Parangtritis Beach', category: 'beach', lat: -8.0253, lng: 110.3286, address: 'Parangtritis, Bantul' },
  { id: 'timang', name: 'Timang Beach', category: 'beach', lat: -8.1464, lng: 110.6294, address: 'Gunungkidul, DIY' },
  { id: 'indrayanti', name: 'Indrayanti Beach', category: 'beach', lat: -8.1504, lng: 110.6127, address: 'Gunungkidul, DIY' },
  { id: 'drini', name: 'Drini Beach', category: 'beach', lat: -8.1483, lng: 110.5766, address: 'Gunungkidul, DIY' },

  // Hospitals
  { id: 'sardjito', name: 'RSUP Dr Sardjito', category: 'hospital', lat: -7.7685, lng: 110.3735, address: 'Jl. Kesehatan, Sleman' },
  { id: 'siloam', name: 'Siloam Hospital', category: 'hospital', lat: -7.7478, lng: 110.3893, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'bethesda', name: 'RS Bethesda', category: 'hospital', lat: -7.7835, lng: 110.3783, address: 'Jl. Jend. Sudirman 70' },
  { id: 'panti_rapih', name: 'RS Panti Rapih', category: 'hospital', lat: -7.7772, lng: 110.3844, address: 'Jl. Cik Di Tiro 30' },

  // Transport
  { id: 'tugu', name: 'Tugu Station', category: 'transport', lat: -7.7893, lng: 110.3614, address: 'Jl. Mangkubumi, Gedongtengen' },
  { id: 'lempuyangan', name: 'Lempuyangan Station', category: 'transport', lat: -7.7879, lng: 110.3768, address: 'Jl. Lempuyangan, Danurejan' },
  { id: 'giwangan', name: 'Giwangan Bus Terminal', category: 'transport', lat: -7.8236, lng: 110.3883, address: 'Jl. Imogiri Timur, Umbulharjo' },
  { id: 'jombor', name: 'Jombor Bus Terminal', category: 'transport', lat: -7.7468, lng: 110.3586, address: 'Jl. Magelang Km 5, Sleman' },

  // Shopping
  { id: 'malioboro', name: 'Malioboro Street', category: 'shopping', lat: -7.7928, lng: 110.3653, address: 'Jl. Malioboro, Gedongtengen' },
  { id: 'amplaz', name: 'Ambarukmo Plaza', category: 'shopping', lat: -7.7821, lng: 110.4017, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'hartono', name: 'Hartono Mall', category: 'shopping', lat: -7.7512, lng: 110.4109, address: 'Jl. Ring Road Utara, Sleman' },
  { id: 'jogja_city', name: 'Jogja City Mall', category: 'shopping', lat: -7.7757, lng: 110.3899, address: 'Jl. Magelang, Sleman' },
  { id: 'beringharjo', name: 'Pasar Beringharjo', category: 'shopping', lat: -7.7981, lng: 110.3658, address: 'Jl. Pabringan, Gondomanan' },

  // Universities
  { id: 'ugm', name: 'Universitas Gadjah Mada', category: 'university', lat: -7.7713, lng: 110.3776, address: 'Bulaksumur, Sleman' },
  { id: 'uny', name: 'Universitas Negeri Yogya', category: 'university', lat: -7.7728, lng: 110.3863, address: 'Jl. Colombo, Sleman' },
  { id: 'uii', name: 'Universitas Islam Indonesia', category: 'university', lat: -7.6896, lng: 110.4103, address: 'Jl. Kaliurang Km 14, Sleman' },
  { id: 'umy', name: 'Universitas Muhammadiyah', category: 'university', lat: -7.8147, lng: 110.3239, address: 'Jl. Brawijaya, Bantul' },

  // Government
  { id: 'immigration', name: 'Immigration Office', category: 'government', lat: -7.7546, lng: 110.3827, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'polda', name: 'Police HQ (Polda DIY)', category: 'government', lat: -7.7826, lng: 110.3887, address: 'Jl. Ring Road Utara' },
  { id: 'gubernur', name: 'Governor Office', category: 'government', lat: -7.7960, lng: 110.3690, address: 'Jl. Malioboro, Gedongtengen' },

  // Nature
  { id: 'jomblang', name: 'Jomblang Cave', category: 'nature', lat: -7.9546, lng: 110.6357, address: 'Gunungkidul, DIY' },
  { id: 'pindul', name: 'Pindul Cave (Tubing)', category: 'nature', lat: -7.9447, lng: 110.6054, address: 'Gunungkidul, DIY' },
  { id: 'kalibiru', name: 'Kalibiru National Park', category: 'nature', lat: -7.8161, lng: 110.1047, address: 'Kulon Progo, DIY' },
  { id: 'merapi', name: 'Mount Merapi Viewpoint', category: 'nature', lat: -7.6646, lng: 110.4265, address: 'Kaliurang, Sleman' },

  // Nightlife — Bars & Clubs
  { id: 'boshe', name: 'Boshe VVIP Club', category: 'nightlife', lat: -7.7825, lng: 110.3895, address: 'Jl. Magelang Km 6, Sleman' },
  { id: 'liquid', name: 'Liquid Next Level', category: 'nightlife', lat: -7.7835, lng: 110.3780, address: 'Jl. Magelang, Sleman' },
  { id: 'hugos', name: 'Hugo\'s Cafe & Bar', category: 'nightlife', lat: -7.8108, lng: 110.3670, address: 'Jl. Prawirotaman II' },
  { id: 'momobar', name: 'Momo Bar Prawirotaman', category: 'nightlife', lat: -7.8115, lng: 110.3685, address: 'Jl. Prawirotaman, Mergangsan' },
  { id: 'jazzspot', name: 'Jazz Spot Jogja', category: 'nightlife', lat: -7.7940, lng: 110.3620, address: 'Jl. Pakuningratan, Jetis' },
  { id: 'viavia', name: 'ViaVia Jogja', category: 'nightlife', lat: -7.8120, lng: 110.3665, address: 'Jl. Prawirotaman 30' },

  // Restaurants
  { id: 'gudeg_yu_djum', name: 'Gudeg Yu Djum', category: 'restaurant', lat: -7.7835, lng: 110.3880, address: 'Jl. Kaliurang Km 4, Sleman' },
  { id: 'bale_raos', name: 'Bale Raos (Royal Cuisine)', category: 'restaurant', lat: -7.8055, lng: 110.3625, address: 'Kraton Yogyakarta' },
  { id: 'mediterranean', name: 'Mediterranea Restaurant', category: 'restaurant', lat: -7.7753, lng: 110.3890, address: 'Jl. Laksda Adisucipto, Sleman' },
  { id: 'milas', name: 'Milas Vegetarian', category: 'restaurant', lat: -7.8125, lng: 110.3672, address: 'Jl. Prawirotaman, Mergangsan' },
  { id: 'sate_klathak', name: 'Sate Klathak Pak Pong', category: 'restaurant', lat: -7.8340, lng: 110.3460, address: 'Jl. Imogiri Barat, Bantul' },
  { id: 'house_raminten', name: 'House of Raminten', category: 'restaurant', lat: -7.7820, lng: 110.3752, address: 'Jl. FM Noto 7, Kotabaru' },
  { id: 'jejamuran', name: 'Jejamuran (Mushroom)', category: 'restaurant', lat: -7.6865, lng: 110.3420, address: 'Jl. Magelang Km 12, Sleman' },
  { id: 'abhayagiri', name: 'Abhayagiri Restaurant', category: 'restaurant', lat: -7.6150, lng: 110.4235, address: 'Kaliurang, Sleman (mountain view)' },

  // Art & Culture
  { id: 'affandi', name: 'Affandi Museum', category: 'art', lat: -7.7810, lng: 110.3965, address: 'Jl. Laksda Adisucipto 167' },
  { id: 'sonobudoyo', name: 'Sonobudoyo Museum', category: 'art', lat: -7.8000, lng: 110.3635, address: 'Jl. Pangurakan, Kraton' },
  { id: 'ullen_sentalu', name: 'Ullen Sentalu Museum', category: 'art', lat: -7.5990, lng: 110.4175, address: 'Kaliurang, Sleman' },
  { id: 'taman_budaya', name: 'Taman Budaya Yogyakarta', category: 'art', lat: -7.7930, lng: 110.3745, address: 'Jl. Sriwedani, Gondomanan' },
  { id: 'batik_center', name: 'Batik Craft Center', category: 'art', lat: -7.8040, lng: 110.3660, address: 'Jl. Tirtodipuran, Mantrijeron' },
  { id: 'cemeti', name: 'Cemeti Art House', category: 'art', lat: -7.8080, lng: 110.3745, address: 'Jl. D.I. Panjaitan 41' },

  // Food Areas
  { id: 'prawirotaman', name: 'Jl. Prawirotaman', category: 'food', lat: -7.8127, lng: 110.3677, address: 'Prawirotaman, Mergangsan' },
  { id: 'kaliurang', name: 'Kaliurang Food Street', category: 'food', lat: -7.6035, lng: 110.4240, address: 'Jl. Kaliurang, Sleman' },
  { id: 'alun_selatan', name: 'Alun-Alun Kidul (Night)', category: 'food', lat: -7.8122, lng: 110.3637, address: 'Alun-Alun Selatan, Kraton' },
].map(d => ({
  ...d,
  distanceKm: Math.round(distanceKm(CITY_CENTER.lat, CITY_CENTER.lng, d.lat, d.lng) * 10) / 10,
}))

export function getDestinationsByCategory(categoryId) {
  if (categoryId === 'all') return YOGYAKARTA_DESTINATIONS
  return YOGYAKARTA_DESTINATIONS.filter(d => d.category === categoryId)
}

export function fmtIDR(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}
