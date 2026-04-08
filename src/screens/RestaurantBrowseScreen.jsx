import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
// Kemenhub Zone 1 (Java/Bali) bike delivery rates
const BIKE_BASE = 9250
const BIKE_PER_KM = 1850
const MIN_FARE = 10000
const MAX_FARE = 80000
function calcDeliveryFare(distKm) {
  if (distKm == null) return null
  return Math.min(Math.max(BIKE_BASE + Math.round(distKm * BIKE_PER_KM), MIN_FARE), MAX_FARE)
}
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import styles from './RestaurantBrowseScreen.module.css'

// ── Demo restaurants ──────────────────────────────────────────────────────────
const DEMO_RESTAURANTS = [
  {
    id: 1, name: 'Warung Bu Sari', cuisine_type: 'Javanese',
    address: 'Jl. Malioboro 45, Yogyakarta', lat: -7.7928, lng: 110.3657,
    phone: '6281234567890', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Nasi Gudeg Komplit', description: 'Authentic Yogyakarta gudeg since 1985. Family recipe, slow-cooked overnight.',
    opening_hours: '07:00–21:00', is_open: true, rating: 4.8, review_count: 124,
    menu_items: [
      { id: 1, name: 'Nasi Gudeg Komplit', price: 28000, prep_time_min: 10, category: 'Main', description: 'Jackfruit curry, egg, chicken, krecek', photo_url: null },
      { id: 2, name: 'Nasi Gudeg Telur', price: 18000, prep_time_min: 8,  category: 'Main', description: 'Jackfruit curry with egg', photo_url: null },
      { id: 3, name: 'Es Teh Manis',     price: 5000,  prep_time_min: 2,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null },
      { id: 4, name: 'Es Jeruk',         price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Fresh orange juice', photo_url: null },
      { id: 5, name: 'Kerupuk',          price: 3000,  prep_time_min: 1,  category: 'Snacks', description: 'Crispy crackers', photo_url: null },
    ],
  },
  {
    id: 2, name: 'Bakso Pak Budi', cuisine_type: 'Indonesian',
    address: 'Jl. Kaliurang Km 5, Sleman', lat: -7.7601, lng: 110.3831,
    phone: '6281234567891', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Bakso Spesial', description: 'Famous meatball soup. Made fresh every morning.',
    opening_hours: '09:00–20:00', is_open: true, rating: 4.6, review_count: 89,
    menu_items: [
      { id: 6,  name: 'Bakso Spesial',  price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Giant meatball, noodles, broth', photo_url: null },
      { id: 7,  name: 'Bakso Biasa',    price: 15000, prep_time_min: 7,  category: 'Main',   description: 'Regular meatball soup', photo_url: null },
      { id: 8,  name: 'Mie Goreng',     price: 18000, prep_time_min: 10, category: 'Main',   description: 'Fried noodles', photo_url: null },
      { id: 9,  name: 'Es Campur',      price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Mixed ice dessert', photo_url: null },
    ],
  },
  {
    id: 3, name: 'Ayam Geprek Mbak Rina', cuisine_type: 'Indonesian',
    address: 'Jl. Parangtritis 22, Bantul', lat: -7.8347, lng: 110.3253,
    phone: '6281234567892', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Ayam Geprek Level 10', description: 'Crispy smashed chicken. Choose your heat level 1–10.',
    opening_hours: '10:00–22:00', is_open: false, rating: 4.9, review_count: 312,
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, prep_time_min: 12, category: 'Main',   description: 'Medium spicy smashed chicken + rice', photo_url: null },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, prep_time_min: 12, category: 'Main',   description: 'Max spicy — challenge level!', photo_url: null },
      { id: 12, name: 'Tahu Tempe',      price: 8000,  prep_time_min: 5,  category: 'Snacks', description: 'Fried tofu & tempeh', photo_url: null },
      { id: 13, name: 'Es Teh Tarik',    price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Pulled tea with milk', photo_url: null },
    ],
  },
]

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

function distanceColor(km) {
  if (km <= 3) return '#8DC63F'
  if (km <= 8) return '#F5C518'
  return '#ff8c42'
}

function Stars({ rating }) {
  const full = Math.floor(rating ?? 0)
  const half = (rating ?? 0) - full >= 0.5
  return (
    <span className={styles.stars}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

export default function RestaurantBrowseScreen({ onClose }) {
  const [restaurants,   setRestaurants]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeIndex,   setActiveIndex]   = useState(0)
  const [menuRestaurant,setMenuRestaurant] = useState(null)
  const containerRef = useRef(null)
  const { coords } = useGeolocation()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!supabase) {
        setRestaurants(DEMO_RESTAURANTS)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('restaurants')
        .select('*, menu_items(*)')
        .eq('status', 'approved')
        .order('rating', { ascending: false })
      setRestaurants(data?.length ? data : DEMO_RESTAURANTS)
      setLoading(false)
    }
    load()
  }, [])

  // Attach distance + delivery estimate to each restaurant
  const enriched = restaurants.map(r => {
    const distKm = coords && r.lat && r.lng
      ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
      : null
    const deliveryFare = calcDeliveryFare(distKm)
    return { ...r, distKm, deliveryFare }
  }).sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99))

  // Track which card is visible via scroll
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    setActiveIndex(idx)
  }

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Finding restaurants near you…</p>
      </div>
    </div>
  )

  return (
    <div className={styles.screen}>

      {/* Fixed header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Food & Delivery</span>
          <span className={styles.headerSub}>{enriched.length} restaurants near you</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.liveTag}>🔴 Live</span>
        </div>
      </div>

      {/* Scroll dots */}
      <div className={styles.dots}>
        {enriched.map((_, i) => (
          <div key={i} className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`} />
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

function RestaurantCard({ restaurant: r, onOpenMenu }) {
  const color = r.distKm != null ? distanceColor(r.distKm) : '#8DC63F'

  return (
    <div className={styles.card}>
      {/* Background */}
      <div
        className={styles.cardBg}
        style={{
          backgroundImage: r.cover_url
            ? `url("${r.cover_url}")`
            : `linear-gradient(135deg, #1a1a1a 0%, #111 100%)`,
        }}
      />
      <div className={styles.cardOverlay} />

      {/* Open/closed badge */}
      <div className={`${styles.statusBadge} ${r.is_open ? styles.statusOpen : styles.statusClosed}`}>
        {r.is_open ? '● Open Now' : '● Closed'}
        {r.is_open && r.opening_hours && (
          <span className={styles.hoursText}> · Closes {r.opening_hours.split('–')[1]}</span>
        )}
      </div>

      {/* Delivery cost badge */}
      {r.distKm != null && (
        <div className={styles.deliveryBadge} style={{ color, borderColor: color }}>
          🛵 {r.distKm} km · {r.deliveryFare ? `~${fmtRp(r.deliveryFare)} delivery` : '—'}
        </div>
      )}

      {/* Hero dish image placeholder */}
      <div className={styles.heroDishArea}>
        {r.hero_dish_url
          ? <img src={r.hero_dish_url} alt={r.hero_dish_name} className={styles.heroDishImg} />
          : (
            <div className={styles.heroDishPlaceholder}>
              <span className={styles.heroDishEmoji}>🍽</span>
              {r.hero_dish_name && <span className={styles.heroDishName}>{r.hero_dish_name}</span>}
            </div>
          )
        }
      </div>

      {/* Bottom info */}
      <div className={styles.cardBottom}>
        <div className={styles.cardMain}>
          <div className={styles.cuisinePill}>{r.cuisine_type}</div>
          <h2 className={styles.restaurantName}>{r.name}</h2>
          <div className={styles.ratingRow}>
            <Stars rating={r.rating} />
            <span className={styles.ratingNum}>{r.rating ?? '—'}</span>
            <span className={styles.ratingCount}>({r.review_count} reviews)</span>
          </div>
          <p className={styles.description}>{r.description}</p>
          <p className={styles.address}>📍 {r.address}</p>
        </div>

        {/* Menu preview pills */}
        {r.menu_items?.length > 0 && (
          <div className={styles.menuPreview}>
            {r.menu_items.slice(0, 3).map(item => (
              <div key={item.id} className={styles.menuPill}>
                <span className={styles.menuPillName}>{item.name}</span>
                <span className={styles.menuPillPrice}>{fmtRp(item.price)}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          className={`${styles.menuBtn} ${!r.is_open ? styles.menuBtnClosed : ''}`}
          onClick={onOpenMenu}
          disabled={!r.is_open}
        >
          {r.is_open ? `🍽 View Menu & Order` : '⏰ Currently Closed'}
        </button>

        {/* Swipe hint */}
        <div className={styles.swipeHint}>swipe up for next restaurant ↑</div>
      </div>
    </div>
  )
}
