import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import styles from './RestaurantBrowseScreen.module.css'

// Kemenhub Zone 1 (Java/Bali) bike delivery rates
const BIKE_BASE   = 9250
const BIKE_PER_KM = 1850
const MIN_FARE    = 10000
const MAX_FARE    = 80000

function calcDeliveryFare(distKm) {
  if (distKm == null) return null
  return Math.min(Math.max(BIKE_BASE + Math.round(distKm * BIKE_PER_KM), MIN_FARE), MAX_FARE)
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RESTAURANTS = [
  // ── RICE ────────────────────────────────────────────────────────────────────
  {
    id: 1, name: 'Warung Bu Sari', cuisine_type: 'Javanese', category: 'rice',
    address: 'Jl. Malioboro 45, Yogyakarta', lat: -7.7928, lng: 110.3657,
    phone: '6281234567890', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Nasi Gudeg Komplit',
    description: 'Authentic Yogyakarta gudeg since 1985. Slow-cooked overnight jackfruit curry — you taste the difference.',
    opening_hours: '07:00–21:00', is_open: true, rating: 4.8, review_count: 124,
    price_from: 5000, price_to: 28000, min_order: 20000,
    catering_available: true, seating_capacity: 40,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: true, dine_in_discount: 10,
    menu_items: [
      { id: 1,  name: 'Nasi Gudeg Komplit',  price: 28000, prep_time_min: 10, category: 'Main',   description: 'Jackfruit curry, egg, chicken, krecek on white rice', photo_url: null, is_available: true },
      { id: 2,  name: 'Nasi Gudeg Telur',    price: 18000, prep_time_min: 8,  category: 'Main',   description: 'Jackfruit curry with egg — the classic', photo_url: null, is_available: true },
      { id: 3,  name: 'Nasi Gudeg Ayam',     price: 25000, prep_time_min: 10, category: 'Main',   description: 'Shredded slow-cooked chicken, jackfruit, rice', photo_url: null, is_available: true },
      { id: 4,  name: 'Krecek Sapi',         price: 12000, prep_time_min: 5,  category: 'Sides',  description: 'Crispy beef skin in spicy coconut sauce', photo_url: null, is_available: true },
      { id: 5,  name: 'Tempe Bacem',         price: 8000,  prep_time_min: 3,  category: 'Sides',  description: 'Sweet Javanese braised tempeh', photo_url: null, is_available: true },
      { id: 6,  name: 'Tahu Goreng',         price: 6000,  prep_time_min: 3,  category: 'Sides',  description: 'Crispy deep-fried tofu', photo_url: null, is_available: true },
      { id: 7,  name: 'Kerupuk Udang',       price: 4000,  prep_time_min: 1,  category: 'Sides',  description: 'Prawn crackers', photo_url: null, is_available: true },
      { id: 8,  name: 'Es Teh Manis',        price: 5000,  prep_time_min: 2,  category: 'Drinks', description: 'Sweet iced tea — Javanese style', photo_url: null, is_available: true },
      { id: 9,  name: 'Es Jeruk Peras',      price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Hand-squeezed fresh orange juice', photo_url: null, is_available: true },
      { id: 10, name: 'Wedang Jahe',         price: 7000,  prep_time_min: 3,  category: 'Drinks', description: 'Warm ginger drink — perfect with gudeg', photo_url: null, is_available: true },
    ],
  },
  {
    id: 4, name: 'Nasi Goreng Pak Harto', cuisine_type: 'Indonesian', category: 'rice',
    address: 'Jl. Kaliurang Km 3, Yogyakarta', lat: -7.7745, lng: 110.3802,
    phone: '6281234567894', cover_url: null, hero_dish_url: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdfsdfsasdassdasd.png',
    hero_dish_name: 'Nasi Goreng Istimewa',
    description: 'Wok-fired fried rice cooked over charcoal. High heat, smoky flavour, zero shortcuts.',
    opening_hours: '10:00–23:00', is_open: true, rating: 4.7, review_count: 208,
    price_from: 15000, price_to: 35000, min_order: 15000,
    catering_available: false, seating_capacity: 20,
    event_features: [],
    featured_this_week: false, dine_in_discount: 15,
    menu_items: [
      { id: 20, name: 'Nasi Goreng Istimewa', price: 28000, prep_time_min: 12, category: 'Main',   description: 'Charcoal wok, egg, chicken, vegetables, shrimp paste', photo_url: null, is_available: true },
      { id: 21, name: 'Nasi Goreng Seafood',  price: 35000, prep_time_min: 15, category: 'Main',   description: 'Prawns, squid, crab meat — full seafood loaded', photo_url: null, is_available: true },
      { id: 22, name: 'Nasi Goreng Kampung',  price: 20000, prep_time_min: 10, category: 'Main',   description: 'Village style — anchovies, egg, chilli', photo_url: null, is_available: true },
      { id: 23, name: 'Nasi Goreng Pete',     price: 22000, prep_time_min: 10, category: 'Main',   description: 'Stinky beans fried rice — bold flavour lovers only', photo_url: null, is_available: true },
      { id: 24, name: 'Sate Ayam 5pcs',       price: 18000, prep_time_min: 10, category: 'Sides',  description: 'Charcoal chicken satay with peanut sauce', photo_url: null, is_available: true },
      { id: 25, name: 'Kerupuk Kampung',      price: 3000,  prep_time_min: 1,  category: 'Sides',  description: 'Homestyle crackers', photo_url: null, is_available: true },
      { id: 26, name: 'Es Kelapa Muda',       price: 12000, prep_time_min: 2,  category: 'Drinks', description: 'Young coconut ice — straight from the shell', photo_url: null, is_available: true },
      { id: 27, name: 'Es Teh Tarik',         price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Pulled milk tea over ice', photo_url: null, is_available: true },
      { id: 28, name: 'Jus Alpukat',          price: 12000, prep_time_min: 4,  category: 'Drinks', description: 'Thick creamy avocado juice', photo_url: null, is_available: true },
    ],
  },
  {
    id: 5, name: 'Bubur Ayam Mbok Iyem', cuisine_type: 'Sundanese', category: 'rice',
    address: 'Jl. Parangtritis 8, Yogyakarta', lat: -7.8012, lng: 110.3678,
    phone: '6281234567895', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Bubur Ayam Komplit',
    description: 'Morning institution since 1978. Silky rice porridge, shredded chicken, century egg. Queue forms before sunrise.',
    opening_hours: '05:30–11:00', is_open: true, rating: 4.9, review_count: 445,
    price_from: 8000, price_to: 22000, min_order: 10000,
    catering_available: true, seating_capacity: 60,
    event_features: ['birthday_setup'],
    featured_this_week: false,
    menu_items: [
      { id: 30, name: 'Bubur Ayam Komplit',   price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Rice porridge, shredded chicken, century egg, crispy shallots, ginger broth', photo_url: null, is_available: true },
      { id: 31, name: 'Bubur Ayam Polos',     price: 14000, prep_time_min: 6,  category: 'Main',   description: 'Plain rice porridge with chicken, soy sauce, crackers', photo_url: null, is_available: true },
      { id: 32, name: 'Bubur Kacang Hijau',   price: 12000, prep_time_min: 5,  category: 'Main',   description: 'Mung bean sweet porridge with coconut milk', photo_url: null, is_available: true },
      { id: 33, name: 'Cakwe',                price: 8000,  prep_time_min: 2,  category: 'Sides',  description: 'Crispy fried dough — dunk it in the porridge', photo_url: null, is_available: true },
      { id: 34, name: 'Telur Asin',           price: 6000,  prep_time_min: 1,  category: 'Sides',  description: 'Salted duck egg', photo_url: null, is_available: true },
      { id: 35, name: 'Kopi Tubruk',          price: 7000,  prep_time_min: 3,  category: 'Drinks', description: 'Traditional Indonesian black coffee — grounds included', photo_url: null, is_available: true },
      { id: 36, name: 'Teh Panas',            price: 4000,  prep_time_min: 2,  category: 'Drinks', description: 'Hot plain tea', photo_url: null, is_available: true },
    ],
  },
  {
    id: 6, name: 'Nasi Padang Sari Rasa', cuisine_type: 'Padang', category: 'rice',
    address: 'Jl. Solo 12, Klaten', lat: -7.7065, lng: 110.6073,
    phone: '6281234567896', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Rendang Daging Sapi',
    description: 'Authentic West Sumatran food. 23 dishes cooked fresh every morning. Rendang slow-cooked 4 hours minimum.',
    opening_hours: '08:00–20:00', is_open: true, rating: 4.6, review_count: 187,
    price_from: 5000, price_to: 45000, min_order: 25000,
    catering_available: true, seating_capacity: 100,
    event_features: ['birthday_setup', 'private_room', 'party_package'],
    featured_this_week: false,
    menu_items: [
      { id: 40, name: 'Rendang Daging Sapi',  price: 45000, prep_time_min: 5,  category: 'Main',   description: 'Dry-cooked beef in coconut milk & spices — 4 hrs slow cooked', photo_url: null, is_available: true },
      { id: 41, name: 'Ayam Pop',             price: 30000, prep_time_min: 5,  category: 'Main',   description: 'White coconut milk poached chicken, sambal hijau', photo_url: null, is_available: true },
      { id: 42, name: 'Gulai Ikan',           price: 32000, prep_time_min: 5,  category: 'Main',   description: 'Fish curry in turmeric coconut gravy', photo_url: null, is_available: true },
      { id: 43, name: 'Nasi Putih',           price: 5000,  prep_time_min: 1,  category: 'Main',   description: 'Steamed white rice', photo_url: null, is_available: true },
      { id: 44, name: 'Gulai Daun Singkong',  price: 10000, prep_time_min: 3,  category: 'Sides',  description: 'Cassava leaves in coconut curry', photo_url: null, is_available: true },
      { id: 45, name: 'Perkedel Jagung',      price: 8000,  prep_time_min: 3,  category: 'Sides',  description: 'Crispy corn fritters', photo_url: null, is_available: true },
      { id: 46, name: 'Sambal Hijau',         price: 5000,  prep_time_min: 1,  category: 'Sides',  description: 'Green chilli sambal — Padang style', photo_url: null, is_available: true },
      { id: 47, name: 'Es Cincau',            price: 8000,  prep_time_min: 2,  category: 'Drinks', description: 'Grass jelly iced drink with palm sugar', photo_url: null, is_available: true },
      { id: 48, name: 'Es Teh Manis',         price: 5000,  prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
      { id: 49, name: 'Jus Jambu',            price: 10000, prep_time_min: 4,  category: 'Drinks', description: 'Fresh guava juice', photo_url: null, is_available: false },
    ],
  },

  // ── NOODLES ─────────────────────────────────────────────────────────────────
  {
    id: 2, name: 'Bakso Pak Budi', cuisine_type: 'Indonesian', category: 'noodles',
    address: 'Jl. Kaliurang Km 5, Sleman', lat: -7.7601, lng: 110.3831,
    phone: '6281234567891', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Bakso Spesial',
    description: 'Famous meatball soup. Made fresh every morning from scratch.',
    opening_hours: '09:00–20:00', is_open: true, rating: 4.6, review_count: 89,
    price_from: 8000, price_to: 25000, min_order: 15000,
    catering_available: false, seating_capacity: 25,
    event_features: [],
    featured_this_week: false,
    menu_items: [
      { id: 6,  name: 'Bakso Spesial',  price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Giant meatball, noodles, broth', photo_url: null, is_available: true },
      { id: 7,  name: 'Bakso Biasa',    price: 15000, prep_time_min: 7,  category: 'Main',   description: 'Regular meatball soup', photo_url: null, is_available: true },
      { id: 8,  name: 'Mie Goreng',     price: 18000, prep_time_min: 10, category: 'Main',   description: 'Fried noodles', photo_url: null, is_available: true },
      { id: 9,  name: 'Es Campur',      price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Mixed ice dessert', photo_url: null, is_available: true },
    ],
  },

  // ── GRILLED ─────────────────────────────────────────────────────────────────
  {
    id: 3, name: 'Ayam Geprek Mbak Rina', cuisine_type: 'Indonesian', category: 'grilled',
    address: 'Jl. Parangtritis 22, Bantul', lat: -7.8347, lng: 110.3253,
    phone: '6281234567892', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Ayam Geprek Level 10',
    description: 'Crispy smashed chicken. Choose your heat level 1–10. We dare you.',
    opening_hours: '10:00–22:00', is_open: false, rating: 4.9, review_count: 312,
    price_from: 7000, price_to: 30000, min_order: 20000,
    catering_available: true, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup', 'sound_system', 'private_room'],
    featured_this_week: true,
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, prep_time_min: 12, category: 'Main',   description: 'Medium spicy + rice', photo_url: null, is_available: true },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, prep_time_min: 12, category: 'Main',   description: 'Max heat — challenge!', photo_url: null, is_available: true },
      { id: 12, name: 'Tahu Tempe',      price: 8000,  prep_time_min: 5,  category: 'Sides',  description: 'Fried tofu & tempeh', photo_url: null, is_available: true },
      { id: 13, name: 'Es Teh Tarik',    price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Pulled milk tea', photo_url: null, is_available: true },
    ],
  },
]


function Stars({ rating }) {
  const full = Math.floor(rating ?? 0)
  const half = (rating ?? 0) - full >= 0.5
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantBrowseScreen({ onClose, onBackToCategories, category, scrollToId }) {
  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [menuRestaurant, setMenuRestaurant] = useState(null)
  const containerRef = useRef(null)
  const { coords }   = useGeolocation()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!supabase) {
        const filtered = category && category.id !== 'all'
          ? DEMO_RESTAURANTS.filter(r => r.category === category.id)
          : DEMO_RESTAURANTS
        setRestaurants(filtered.length ? filtered : DEMO_RESTAURANTS)
        setLoading(false)
        return
      }
      let q = supabase
        .from('restaurants')
        .select('*, menu_items(*)')
        .eq('status', 'approved')
        .order('featured_this_week', { ascending: false })
        .order('rating', { ascending: false })
      if (category && category.id !== 'all') q = q.eq('category', category.id)
      const { data } = await q
      setRestaurants(data?.length ? data : DEMO_RESTAURANTS)
      setLoading(false)
    }
    load()
  }, [category])

  // Enrich with distance + delivery fare, sort nearest first
  const enriched = restaurants
    .map(r => {
      const distKm = coords && r.lat && r.lng
        ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
        : null
      return { ...r, distKm, deliveryFare: calcDeliveryFare(distKm) }
    })
    .sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99))

  // Track visible card on scroll
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    setActiveIndex(Math.round(el.scrollTop / el.clientHeight))
  }

  // Jump to specific restaurant if scrollToId supplied
  useEffect(() => {
    if (!scrollToId || !enriched.length) return
    const idx = enriched.findIndex(r => r.id === scrollToId)
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * containerRef.current.clientHeight
      setActiveIndex(idx)
    }
  }, [scrollToId, enriched.length])

  // Category header info
  const catLabel  = category ? category.label : 'Food & Delivery'
  const catEmoji  = category ? category.emoji  : '🍽'
  const catColor  = category ? category.color  : '#8DC63F'

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} style={{ borderTopColor: catColor }} />
        <p className={styles.loadingText}>Finding {catLabel.toLowerCase()} near you…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.screen}>

      {/* Fixed header */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={onBackToCategories ?? onClose}
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>
            {catEmoji} {catLabel}
          </span>
          <span className={styles.headerSub}>
            {enriched.length} restaurant{enriched.length !== 1 ? 's' : ''} near you
          </span>
        </div>

        <div className={styles.headerRight} />
      </div>

      {/* Scroll dots */}
      <div className={styles.dots}>
        {enriched.map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            style={i === activeIndex ? { background: catColor } : {}}
          />
        ))}
      </div>

      {/* Full-height swipeable cards */}
      <div className={styles.cardContainer} ref={containerRef} onScroll={handleScroll}>
        {enriched.map((r, i) => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            isActive={i === activeIndex}
            onOpenMenu={() => setMenuRestaurant(r)}
          />
        ))}
      </div>

      {/* Menu sheet */}
      {menuRestaurant && (
        <RestaurantMenuSheet
          restaurant={menuRestaurant}
          onClose={() => setMenuRestaurant(null)}
        />
      )}
    </div>
  )
}

// ── Restaurant card ───────────────────────────────────────────────────────────
function RestaurantCard({ restaurant: r, onOpenMenu }) {
  const [openTime, closeTime] = (r.opening_hours ?? '').split('–')

  return (
    <div className={styles.card}>

      {/* Background — cover > hero dish > gradient */}
      <div
        className={styles.cardBg}
        style={{
          backgroundImage: r.cover_url
            ? `url("${r.cover_url}")`
            : r.hero_dish_url
              ? `url("${r.hero_dish_url}")`
              : `linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)`,
        }}
      />
      <div className={styles.cardOverlay} />

      {/* Top badges */}
      <div className={styles.topBadges}>
        {/* Hours badge */}
        <span className={`${styles.statusBadge} ${r.is_open ? styles.statusOpen : styles.statusClosed}`}>
          <span className={styles.statusDot} />
          {r.is_open
            ? closeTime ? `Open · until ${closeTime}` : 'Open Now'
            : openTime  ? `Opens ${openTime}` : 'Closed'
          }
        </span>

      </div>

      {/* Bottom info — clean and sparse */}
      <div className={styles.cardBottom}>
        <span className={styles.cuisinePill}>{r.cuisine_type}</span>

        {r.dine_in_discount > 0 && (
          <div className={styles.dineBlock}>
            <span className={styles.dinePct}>{r.dine_in_discount}% Off</span>
            <span className={styles.dineLabel}>Come Dine With Us</span>
          </div>
        )}

        <h2 className={styles.restaurantName}>{r.name}</h2>

        <div className={styles.ratingRow}>
          <Stars rating={r.rating} />
          <span className={styles.ratingNum}>{r.rating ?? '—'}</span>
          <span className={styles.ratingCount}>· {r.review_count} reviews</span>
        </div>

        <p className={styles.description}>{r.description}</p>

        <button
          className={`${styles.menuBtn} ${!r.is_open ? styles.menuBtnClosed : ''}`}
          onClick={onOpenMenu}
          disabled={!r.is_open}
        >
          {r.is_open ? 'View Menu & Order' : '⏰ Closed'}
        </button>

        <div className={styles.cardFooter}>
          <span className={styles.footerDot} />
          <span>Hangger Food</span>
          <span className={styles.footerDot} />
        </div>
      </div>
    </div>
  )
}
