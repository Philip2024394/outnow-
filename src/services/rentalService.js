/**
 * Rental Service — demo listings for the rentals module.
 * Categories: Motorcycles, Cars, Property, Electronics, Fashion, Audio, Party & Event
 */

const STORAGE_KEY = 'indoo_rental_listings'

export const RENTAL_CATEGORIES = [
  { id: 'all',          label: 'All',           emoji: '🏷️' },
  { id: 'Motorcycles',  label: 'Motorcycles',   emoji: '🏍️' },
  { id: 'Cars',         label: 'Cars',          emoji: '🚗' },
  { id: 'Property',     label: 'Property',      emoji: '🏠' },
  { id: 'Electronics',  label: 'Electronics',   emoji: '📷' },
  { id: 'Fashion',      label: 'Fashion',       emoji: '👗' },
  { id: 'Audio & Sound',label: 'Audio & Sound', emoji: '🔊' },
  { id: 'Party & Event',label: 'Party & Event', emoji: '🎉' },
]

export const DEMO_LISTINGS = [
  {"id":"00af49f5","title":"Canon EOS 200D Mark II - DSLR Lengkap","description":"Kamera DSLR Canon EOS 200D Mark II. Lengkap dengan lensa kit 18-55mm, charger, kartu memori 64GB, tas kamera.","category":"Electronics","sub_category":"Camera","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":150000,"price_week":850000,"price_month":2800000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],"features":["Lensa kit 18-55mm","Memory card 64GB","Tas kamera","Charger"],"rating":4.7,"review_count":12,"view_count":89,"extra_fields":{"brand":"Canon","model":"EOS 200D Mark II"}},
  {"id":"18836211","title":"Villa Tepi Pantai Bali - 3 Kamar","description":"Villa mewah tepi pantai di Seminyak, Bali. 3 kamar tidur, 3 kamar mandi, kolam renang pribadi, view laut.","category":"Property","sub_category":"Villa","city":"Bali","address":"Seminyak, Kuta, Bali","price_day":1500000,"price_week":9000000,"price_month":30000000,"condition":"new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800&q=80"],"features":["Kolam renang","View laut","Dapur lengkap","AC semua kamar","Staff 24 jam"],"rating":4.9,"review_count":34,"view_count":245,"extra_fields":{"bedrooms":3,"bathrooms":3,"property_type":"Villa"}},
  {"id":"26588984","title":"Honda Beat 2022 - Hitam Mulus","description":"Motor matic Honda Beat tahun 2022 kondisi sangat mulus, kilometer rendah. Cocok untuk harian di kota. Sudah service rutin, ban baru. Helm disediakan.","category":"Motorcycles","sub_category":"Matic","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":75000,"price_week":450000,"price_month":1500000,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],"features":["Helm included","Service rutin","STNK asli"],"rating":4.8,"review_count":23,"view_count":312,"extra_fields":{"cc":110,"year":2022,"brand":"Honda","transmission":"matic","helmet_count":2,"delivery_available":true}},
  {"id":"2f39d2a5","title":"Toyota Avanza 2020 - 7 Seater","description":"Mobil keluarga Toyota Avanza 2020, 7 penumpang, AC dingin, audio lengkap. Cocok untuk liburan keluarga.","category":"Cars","sub_category":"MPV","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":350000,"price_week":2100000,"price_month":7000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80"],"features":["AC dingin","Musik Bluetooth","GPS","Asuransi"],"rating":4.6,"review_count":18,"view_count":156,"extra_fields":{"year":2020,"brand":"Toyota","model":"Avanza","seats":7,"transmission":"manual","driver_available":true}},
  {"id":"437cb0ca","title":"Kebaya Pengantin Adat Jawa Putih Emas","description":"Kebaya pengantin adat Jawa putih emas, beludru premium. Tersedia ukuran S-XL. Include kain jarik, selendang, dan aksesoris lengkap.","category":"Fashion","sub_category":"Kebaya","city":"Yogyakarta","address":"Malioboro, Yogyakarta","price_day":500000,"price_week":null,"price_month":null,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80"],"features":["Termasuk jarik","Selendang","Aksesoris","Dry clean"],"rating":4.9,"review_count":8,"view_count":67,"extra_fields":{"size":"S-XL","material":"Beludru","occasion":"Pernikahan Adat"}},
  {"id":"74a93124","title":"Honda Jazz 2019 - Hatchback Sport","description":"Honda Jazz sporty 2019, transmisi CVT, AC, audio. Kondisi terawat, tidak pernah banjir.","category":"Cars","sub_category":"Hatchback","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":280000,"price_week":1680000,"price_month":5500000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80"],"features":["AC dingin","Bluetooth","Kamera mundur","Asuransi all risk"],"rating":4.5,"review_count":15,"view_count":198,"extra_fields":{"year":2019,"brand":"Honda","model":"Jazz","seats":5,"transmission":"cvt","delivery_available":true}},
  {"id":"a8eaba86","title":"Yamaha NMAX 2021 - Putih Sport","description":"NMAX 2021 kondisi prima, sudah dipasang aksesoris lengkap. Nyaman untuk touring maupun harian.","category":"Motorcycles","sub_category":"Matic","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":120000,"price_week":700000,"price_month":2400000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80"],"features":["Helm included","Box belakang","GPS tracker"],"rating":4.7,"review_count":19,"view_count":267,"extra_fields":{"cc":155,"year":2021,"brand":"Yamaha","transmission":"matic","delivery_available":true}},
  {"id":"af272948","title":"Sound System 5000W - DJ Setup Komplit","description":"Paket sound system komplit untuk event, pesta, atau konser kecil. Subwoofer 18 inch x2, speaker full range, mixer 16 channel, mic wireless x4. Include operator.","category":"Audio & Sound","sub_category":"Speaker","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":3500000,"price_week":null,"price_month":null,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80"],"features":["Include operator","Subwoofer 18 x2","Mixer 16ch","Mic wireless x4","Antar-jemput"],"rating":4.8,"review_count":6,"view_count":45,"extra_fields":{"brand":"JBL/Yamaha","power_watts":5000}},
  {"id":"c776bed7","title":"Kos Premium AC Wifi di Sleman","description":"Kamar kos nyaman di Sleman Yogyakarta. Full furnished, AC, wifi kencang, dapur bersama, parkir motor.","category":"Property","sub_category":"Kos","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":120000,"price_week":700000,"price_month":2000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"],"features":["AC","Wifi 50Mbps","Kamar mandi dalam","Dapur bersama","Parkir motor"],"rating":4.4,"review_count":9,"view_count":134,"extra_fields":{"bedrooms":1,"property_type":"Kos","wifi_included":true}},
  {"id":"e1c35d8f","title":"Tenda Pesta 10x20m - 200 Orang","description":"Sewa tenda pesta ukuran 10x20 meter, bisa menampung 200 orang. Include pemasangan dan lampu.","category":"Party & Event","sub_category":"Tenda","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":2500000,"price_week":15000000,"price_month":null,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"],"features":["Include pasang & bongkar","Lampu dekorasi","Alas karpet","Antar-jemput"],"rating":4.6,"review_count":11,"view_count":78,"extra_fields":{"capacity":200,"setup_included":true}},
]

export function fmtIDR(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

export function getListings() {
  return DEMO_LISTINGS.filter(l => l.status === 'active')
}

export function getListingsByCategory(catId) {
  if (catId === 'all') return getListings()
  return getListings().filter(l => l.category === catId)
}

export function searchListings(query) {
  if (!query.trim()) return getListings()
  const q = query.toLowerCase()
  return getListings().filter(l =>
    l.title.toLowerCase().includes(q) ||
    l.description.toLowerCase().includes(q) ||
    l.category.toLowerCase().includes(q) ||
    l.sub_category.toLowerCase().includes(q) ||
    l.city.toLowerCase().includes(q) ||
    (l.features || []).some(f => f.toLowerCase().includes(q))
  )
}

export function getConditionLabel(c) {
  const map = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' }
  return map[c] || c
}
