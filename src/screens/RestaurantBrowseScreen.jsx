import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import styles from './RestaurantBrowseScreen.module.css'

const FOOD_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_04_21%20PM.png'

function FoodLanding({ onBrowse, onRegister, onClose }) {
  return (
    <div className={styles.landingPage} style={{ backgroundImage: `url("${FOOD_LANDING_BG}")` }}>
      <div className={styles.landingOverlay} />
      <button className={styles.landingBack} onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle}>Indoo Street</h1>
        <p className={styles.landingSub}>Discover street food, warung & restaurants near you</p>
        <button className={styles.landingBtn} onClick={onBrowse}>
          Order Food
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <SectionCTAButton
          section="restaurant"
          className={styles.landingBtnOutline}
          onReady={onRegister}
        />
      </div>
    </div>
  )
}

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
    address: 'Jl. Malioboro 45, Yogyakarta', city: 'Yogyakarta', lat: -7.7928, lng: 110.3657,
    phone: '6281234567890', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Nasi Gudeg Komplit',
    description: 'Authentic Yogyakarta gudeg since 1985. Slow-cooked overnight jackfruit curry — you taste the difference.',
    opening_hours: '07:00–21:00', is_open: true, rating: 4.8, review_count: 124,
    price_from: 5000, price_to: 28000, min_order: 20000,
    catering_available: true, seating_capacity: 40,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    bank: { name: 'BCA', account_number: '1234 5678 90', account_holder: 'Sari Warung Jogja' },
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
    address: 'Jl. Kaliurang Km 3, Yogyakarta', city: 'Yogyakarta', lat: -7.7745, lng: 110.3802,
    phone: '6281234567894', cover_url: null, hero_dish_url: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdfsdfsasdassdasd.png',
    hero_dish_name: 'Nasi Goreng Istimewa',
    description: 'Wok-fired fried rice cooked over charcoal. High heat, smoky flavour, zero shortcuts.',
    opening_hours: '10:00–23:00', is_open: true, rating: 4.7, review_count: 208,
    price_from: 15000, price_to: 35000, min_order: 15000,
    catering_available: false, seating_capacity: 20,
    event_features: [],
    featured_this_week: false, dine_in_discount: 15, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1100 0987 6543', account_holder: 'Harto Wijaya' },
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
    address: 'Jl. Parangtritis 8, Yogyakarta', city: 'Yogyakarta', lat: -7.8012, lng: 110.3678,
    phone: '6281234567895', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Bubur Ayam Komplit',
    description: 'Morning institution since 1978. Silky rice porridge, shredded chicken, century egg. Queue forms before sunrise.',
    opening_hours: '05:30–11:00', is_open: true, rating: 4.9, review_count: 445,
    price_from: 8000, price_to: 22000, min_order: 10000,
    catering_available: true, seating_capacity: 60,
    event_features: ['birthday_setup'],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BRI', account_number: '0096 0100 2233 5566', account_holder: 'Iyem Sukarti' },
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
    address: 'Jl. Solo 12, Klaten', city: 'Yogyakarta', lat: -7.7065, lng: 110.6073,
    phone: '6281234567896', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Rendang Daging Sapi',
    description: 'Authentic West Sumatran food. 23 dishes cooked fresh every morning. Rendang slow-cooked 4 hours minimum.',
    opening_hours: '08:00–20:00', is_open: true, rating: 4.6, review_count: 187,
    price_from: 5000, price_to: 45000, min_order: 25000,
    catering_available: true, seating_capacity: 100,
    event_features: ['birthday_setup', 'private_room', 'party_package'],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BNI', account_number: '0441 2233 4455', account_holder: 'Sari Rasa Padang' },
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
    address: 'Jl. Kaliurang Km 5, Sleman', city: 'Yogyakarta', lat: -7.7601, lng: 110.3831,
    phone: '6281234567891', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Bakso Spesial',
    description: 'Famous meatball soup. Made fresh every morning from scratch.',
    opening_hours: '09:00–20:00', is_open: true, rating: 4.6, review_count: 89,
    price_from: 8000, price_to: 25000, min_order: 15000,
    catering_available: false, seating_capacity: 25,
    event_features: [],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BCA', account_number: '7788 9900 1122', account_holder: 'Budi Santoso' },
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
    address: 'Jl. Parangtritis 22, Bantul', city: 'Yogyakarta', lat: -7.8347, lng: 110.3253,
    phone: '6281234567892', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Ayam Geprek Level 10',
    description: 'Crispy smashed chicken. Choose your heat level 1–10. We dare you.',
    opening_hours: '10:00–22:00', is_open: true, rating: 4.9, review_count: 312,
    price_from: 7000, price_to: 30000, min_order: 20000,
    catering_available: true, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup', 'sound_system', 'private_room'],
    featured_this_week: true, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1420 0055 6677', account_holder: 'Rina Ayam Geprek' },
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, prep_time_min: 12, category: 'Main',   description: 'Medium spicy + rice', photo_url: null, is_available: true },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, prep_time_min: 12, category: 'Main',   description: 'Max heat — challenge!', photo_url: null, is_available: true },
      { id: 12, name: 'Tahu Tempe',      price: 8000,  prep_time_min: 5,  category: 'Sides',  description: 'Fried tofu & tempeh', photo_url: null, is_available: true },
      { id: 13, name: 'Es Teh Tarik',    price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Pulled milk tea', photo_url: null, is_available: true },
    ],
  },

  // ── SEAFOOD ──────────────────────────────────────────────────────────────────
  {
    id: 7, name: 'Seafood Pak Dhe Bejo', cuisine_type: 'Seafood', category: 'seafood',
    address: 'Jl. Laksda Adisucipto 88, Yogyakarta', city: 'Yogyakarta', lat: -7.7822, lng: 110.4021,
    phone: '6281234567897', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Udang Bakar Madu',
    description: 'Freshest seafood in Yogya — delivered from Samas beach every morning. Grilled over coconut shell charcoal.',
    opening_hours: '11:00–22:00', is_open: true, rating: 4.7, review_count: 256,
    price_from: 25000, price_to: 120000, min_order: 35000,
    catering_available: true, seating_capacity: 120,
    event_features: ['birthday_setup', 'private_room', 'party_package', 'sound_system'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    bank: { name: 'BCA', account_number: '3344 5566 7788', account_holder: 'Bejo Seafood Resto' },
    menu_items: [
      { id: 50, name: 'Udang Bakar Madu',    price: 85000, prep_time_min: 15, category: 'Main',   description: 'Honey-glazed grilled prawns, butter garlic sauce', photo_url: null, is_available: true },
      { id: 51, name: 'Cumi Goreng Tepung',  price: 55000, prep_time_min: 12, category: 'Main',   description: 'Crispy battered squid rings, chilli mayo', photo_url: null, is_available: true },
      { id: 52, name: 'Ikan Bakar Bumbu Bali', price: 75000, prep_time_min: 18, category: 'Main', description: 'Whole grilled snapper, Balinese spice paste', photo_url: null, is_available: true },
      { id: 53, name: 'Kepiting Saus Tiram', price: 120000, prep_time_min: 20, category: 'Main',  description: 'Blue crab in oyster sauce, wok-fried to order', photo_url: null, is_available: true },
      { id: 54, name: 'Nasi Putih',          price:   5000, prep_time_min: 2,  category: 'Sides', description: 'Steamed white rice', photo_url: null, is_available: true },
      { id: 55, name: 'Kangkung Belacan',    price:  18000, prep_time_min: 8,  category: 'Sides', description: 'Stir-fried water spinach, shrimp paste', photo_url: null, is_available: true },
      { id: 56, name: 'Sambal Matah',        price:   8000, prep_time_min: 2,  category: 'Sides', description: 'Raw Balinese shallot & lemongrass sambal', photo_url: null, is_available: true },
      { id: 57, name: 'Es Kelapa Muda',      price:  15000, prep_time_min: 2,  category: 'Drinks', description: 'Young coconut served whole', photo_url: null, is_available: true },
      { id: 58, name: 'Jus Alpukat Susu',    price:  18000, prep_time_min: 4,  category: 'Drinks', description: 'Creamy avocado blended with condensed milk', photo_url: null, is_available: true },
      { id: 59, name: 'Es Teh Manis',        price:   5000, prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
    ],
  },

  // ── BURGERS / WESTERN ────────────────────────────────────────────────────────
  {
    id: 8, name: 'Steak 48 Jogja', cuisine_type: 'Western', category: 'burgers',
    address: 'Jl. Magelang Km 4.5, Yogyakarta', city: 'Yogyakarta', lat: -7.7615, lng: 110.3511,
    phone: '6281234567898', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Ribeye 200g',
    description: 'Proper steaks grilled over open flame. Australian grain-fed beef. No shortcuts, no frozen imports.',
    opening_hours: '11:00–23:00', is_open: true, rating: 4.5, review_count: 178,
    price_from: 35000, price_to: 185000, min_order: 45000,
    catering_available: false, seating_capacity: 60,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BNI', account_number: '0812 3344 5566', account_holder: 'Steak 48 Jogja' },
    menu_items: [
      { id: 60, name: 'Ribeye 200g',         price: 185000, prep_time_min: 20, category: 'Main',   description: 'Australian grain-fed ribeye, choice of sauce & side', photo_url: null, is_available: true },
      { id: 61, name: 'Sirloin 180g',        price: 155000, prep_time_min: 18, category: 'Main',   description: 'Lean, tender sirloin. Best medium-rare.', photo_url: null, is_available: true },
      { id: 62, name: 'Beef Burger Komplit',  price:  65000, prep_time_min: 15, category: 'Main',   description: 'Double patty, cheddar, caramelised onion, house sauce', photo_url: null, is_available: true },
      { id: 63, name: 'Chicken Cordon Bleu', price:  75000, prep_time_min: 18, category: 'Main',   description: 'Stuffed chicken, ham, Swiss cheese, brown sauce', photo_url: null, is_available: true },
      { id: 64, name: 'Pasta Carbonara',     price:  55000, prep_time_min: 12, category: 'Main',   description: 'Spaghetti, guanciale, pecorino, egg yolk', photo_url: null, is_available: true },
      { id: 65, name: 'Truffle Fries',       price:  35000, prep_time_min: 8,  category: 'Sides',  description: 'Crispy fries, truffle oil, parmesan, parsley', photo_url: null, is_available: true },
      { id: 66, name: 'Garden Salad',        price:  28000, prep_time_min: 5,  category: 'Sides',  description: 'Mixed greens, cherry tomato, balsamic vinaigrette', photo_url: null, is_available: true },
      { id: 67, name: 'Lemon Ice Tea',       price:  22000, prep_time_min: 3,  category: 'Drinks', description: 'Fresh lemon, mint, sparkling water', photo_url: null, is_available: true },
      { id: 68, name: 'Chocolate Milkshake', price:  32000, prep_time_min: 5,  category: 'Drinks', description: 'Thick Belgian chocolate milkshake', photo_url: null, is_available: true },
    ],
  },

  // ── DRINKS / CAFE ────────────────────────────────────────────────────────────
  {
    id: 9, name: 'Kopi Klotok Maguwo', cuisine_type: 'Cafe', category: 'drinks',
    address: 'Jl. Maguwo 15, Sleman', city: 'Yogyakarta', lat: -7.7891, lng: 110.4234,
    phone: '6281234567899', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Kopi Joss',
    description: 'Iconic Jogja coffeehouse. Famous for Kopi Joss — black coffee with a glowing red charcoal dropped in. Must try.',
    opening_hours: '06:00–24:00', is_open: true, rating: 4.8, review_count: 521,
    price_from: 7000, price_to: 45000, min_order: 15000,
    catering_available: false, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup'],
    featured_this_week: true, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BCA', account_number: '5566 7788 9900', account_holder: 'Kopi Klotok Maguwo' },
    menu_items: [
      { id: 70, name: 'Kopi Joss',           price: 12000, prep_time_min: 5,  category: 'Drinks', description: 'Black coffee with charcoal — the legendary Jogja drink', photo_url: null, is_available: true },
      { id: 71, name: 'Kopi Susu Gula Aren', price: 18000, prep_time_min: 5,  category: 'Drinks', description: 'Espresso, palm sugar syrup, fresh milk over ice', photo_url: null, is_available: true },
      { id: 72, name: 'Matcha Latte',        price: 22000, prep_time_min: 4,  category: 'Drinks', description: 'Ceremonial matcha, oat milk, light sweetness', photo_url: null, is_available: true },
      { id: 73, name: 'Teh Tarik Spesial',   price: 15000, prep_time_min: 4,  category: 'Drinks', description: 'Pulled milk tea, frothy, rich — two mugs minimum', photo_url: null, is_available: true },
      { id: 74, name: 'Es Kopi Vietnam',     price: 20000, prep_time_min: 5,  category: 'Drinks', description: 'Drip coffee, condensed milk, crushed ice', photo_url: null, is_available: true },
      { id: 75, name: 'Roti Bakar Keju',     price: 22000, prep_time_min: 8,  category: 'Food',   description: 'Toasted bread, butter, condensed milk, cheese', photo_url: null, is_available: true },
      { id: 76, name: 'Pisang Goreng Keju',  price: 18000, prep_time_min: 8,  category: 'Food',   description: 'Crispy fried banana, melted cheese drizzle', photo_url: null, is_available: true },
      { id: 77, name: 'Indomie Goreng',      price: 15000, prep_time_min: 8,  category: 'Food',   description: 'The classic — dressed with egg, shallots, chilli', photo_url: null, is_available: true },
      { id: 78, name: 'Singkong Goreng',     price: 12000, prep_time_min: 10, category: 'Food',   description: 'Cassava chips, coconut sambal', photo_url: null, is_available: true },
    ],
  },

  // ── STREET FOOD ──────────────────────────────────────────────────────────────
  {
    id: 10, name: 'Sate & Gule Pak Sabar', cuisine_type: 'Javanese', category: 'street_food',
    address: 'Alun-Alun Selatan, Yogyakarta', city: 'Yogyakarta', lat: -7.8108, lng: 110.3642,
    phone: '6281234567800', cover_url: null, hero_dish_url: null,
    hero_dish_name: 'Sate Kambing 10pcs',
    description: 'Street legend since 1971. Goat satay grilled to order over coconut charcoal. The smoke alone draws a crowd.',
    opening_hours: '17:00–01:00', is_open: true, rating: 4.8, review_count: 634,
    price_from: 3000, price_to: 55000, min_order: 20000,
    catering_available: true, seating_capacity: 30,
    event_features: ['birthday_setup', 'party_package'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BRI', account_number: '0096 0100 7788 4321', account_holder: 'Sabar Supriyanto' },
    menu_items: [
      { id: 80, name: 'Sate Kambing 10pcs',  price: 55000, prep_time_min: 15, category: 'Main',   description: 'Goat satay, charcoal grilled, kecap manis, sambal', photo_url: null, is_available: true },
      { id: 81, name: 'Sate Ayam 10pcs',     price: 35000, prep_time_min: 12, category: 'Main',   description: 'Chicken satay, peanut sauce, lontong', photo_url: null, is_available: true },
      { id: 82, name: 'Gule Kambing',        price: 35000, prep_time_min: 5,  category: 'Main',   description: 'Spiced goat curry, warm & rich, eat with lontong', photo_url: null, is_available: true },
      { id: 83, name: 'Tongseng Kambing',    price: 38000, prep_time_min: 8,  category: 'Main',   description: 'Goat in sweet spiced coconut broth, cabbage, tomato', photo_url: null, is_available: true },
      { id: 84, name: 'Lontong',             price:  5000, prep_time_min: 1,  category: 'Sides',  description: 'Compressed rice cake — perfect with satay', photo_url: null, is_available: true },
      { id: 85, name: 'Kerupuk',             price:  3000, prep_time_min: 1,  category: 'Sides',  description: 'Prawn crackers', photo_url: null, is_available: true },
      { id: 86, name: 'Es Teh Manis',        price:  5000, prep_time_min: 1,  category: 'Drinks', description: 'Sweet iced tea', photo_url: null, is_available: true },
      { id: 87, name: 'Jeruk Panas',         price:  7000, prep_time_min: 3,  category: 'Drinks', description: 'Hot fresh orange juice — great with goat dishes', photo_url: null, is_available: true },
    ],
  },
]


// ── Countdown helpers ─────────────────────────────────────────────────────────
function parseOpenTime(openingHours) {
  const part = (openingHours ?? '').split('–')[0].trim()
  const [h, m] = part.split(':').map(Number)
  return isNaN(h) ? null : { h, m }
}

function secsUntilOpen(openingHours) {
  const t = parseOpenTime(openingHours)
  if (!t) return null
  const now    = new Date()
  const target = new Date(now)
  target.setHours(t.h, t.m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.max(0, Math.floor((target - now) / 1000))
}

function fmtCountdown(secs) {
  if (secs == null) return null
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h} hr ${String(m).padStart(2,'0')} min`
}

// ── Option B: smart-sorted categories ────────────────────────────────────────
// Street Food card → Indonesian street food types first, restaurants fill below
// Restaurant card  → restaurant/western types first, street food fills below
const STREET_FOOD_CATS = new Set(['rice', 'noodles', 'street_food', 'snacks', 'breakfast', 'vegetarian'])
const RESTAURANT_CATS  = new Set(['burgers', 'seafood', 'grilled', 'desserts', 'drinks'])

function primaryForCategory(restaurantCategory, selectedCategoryId) {
  if (selectedCategoryId === 'street_food') return STREET_FOOD_CATS.has(restaurantCategory)
  if (selectedCategoryId === 'all')         return RESTAURANT_CATS.has(restaurantCategory)
  return true // unknown category id → treat everything as primary
}

// ── Sales algorithm — scores each restaurant ──────────────────────────────────
// Higher score = shown earlier in the snap-scroll list
function scoreRestaurant(r, hour) {
  let s = 0
  if (r.is_open)            s += 10000          // open always beats closed
  if (r.featured_this_week) s += 500
  s += (r.rating ?? 0) * 60                     // 4.9 = +294

  // Time-of-day affinity — match category to meal period
  const cat = r.category
  if (hour >= 5  && hour < 11 && cat === 'breakfast') s += 800
  if (hour >= 10 && hour < 15 && (cat === 'rice' || cat === 'noodles')) s += 400
  if (hour >= 11 && hour < 16 && cat === 'grilled')   s += 300
  if (hour >= 14 && hour < 17 && cat === 'snacks')    s += 350
  if (hour >= 17 && hour < 23 && (cat === 'seafood' || cat === 'grilled')) s += 400
  if ((hour >= 20 || hour < 2) && cat === 'drinks')   s += 300
  if (hour >= 9  && hour < 21 && cat === 'burgers')   s += 200

  // Proximity bonus (max 200pts for <1 km)
  if (r.distKm != null) s += Math.max(0, 200 - r.distKm * 40)

  // Repeat-order discount set = restaurant is actively incentivising returns
  if (r.repeat_discount_percent > 0) s += 150

  return s
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

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantBrowseScreen({ onClose, onBackToCategories, category, scrollToId, onOrderViaChat }) {
  const [showLanding, setShowLanding] = useState(true)
  const [showVideo, setShowVideo] = useState(false)
  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [menuRestaurant, setMenuRestaurant] = useState(null)
  const [tick,           setTick]           = useState(0)
  const containerRef = useRef(null)
  const { coords }   = useGeolocation()

  // Tick every 30s so countdown timers stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!supabase) {
        // Always load all — Option B sorting happens client-side
        setRestaurants(DEMO_RESTAURANTS)
        setLoading(false)
        return
      }
      // Always fetch all approved restaurants — Option B sorting is client-side
      const { data } = await supabase
        .from('restaurants')
        .select('*, menu_items(*)')
        .eq('status', 'approved')
        .order('featured_this_week', { ascending: false })
        .order('rating', { ascending: false })
      setRestaurants(data?.length ? data : DEMO_RESTAURANTS)
      setLoading(false)
    }
    load()
  }, [category])

  // Enrich with distance + delivery fare, then apply Option B sort:
  // primary group (matches selected category) first, secondary fills below,
  // each group sorted by score. A divider sentinel separates the two groups.
  const hour = new Date().getHours()
  void tick // consumed here so countdown interval triggers re-score
  const catId = category?.id

  const withMeta = restaurants.map(r => {
    const distKm = coords && r.lat && r.lng
      ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
      : null
    return { ...r, distKm, deliveryFare: calcDeliveryFare(distKm) }
  })

  const primary   = withMeta.filter(r =>  primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))
  const secondary = withMeta.filter(r => !primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))

  // Divider label depends on which card was tapped
  const dividerLabel = catId === 'street_food' ? 'Also Nearby' : 'More Street Food'
  const divider = { isDivider: true, label: dividerLabel }

  // Flatten: primary → divider (only if secondary exists) → secondary
  const enriched = secondary.length
    ? [...primary, divider, ...secondary]
    : primary

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
  const catLabel  = category ? category.label : 'MAKAN'
  const catEmoji  = category ? category.emoji  : '🍽'
  const catColor  = category ? category.color  : '#8DC63F'

  if (showLanding) return (
    <FoodLanding
      onBrowse={() => { markSectionVisited('food'); setShowLanding(false); setShowVideo(true) }}
      onRegister={() => { markSectionVisited('food'); setShowLanding(false) }}
      onClose={onClose}
    />
  )

  if (showVideo) return (
    <div className={styles.videoPage}>
      <div className={styles.videoCard} onClick={() => setShowVideo(false)}>
        <video
          src="https://ik.imagekit.io/nepgaxllc/street%20food.mp4?updatedAt=1776064212346"
          className={styles.videoPlayer}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className={styles.videoOverlay}>
          <h2 className={styles.videoTitle}>Indoo Street</h2>
          <p className={styles.videoSub}>Tap to explore street food</p>
        </div>
      </div>
    </div>
  )

  if (loading) return (
    <div className={styles.screen}>
      <div className={styles.loadingWrap}>
        <div className={styles.loadingSpinner} style={{ borderTopColor: catColor }} />
        <p className={styles.loadingText}>MAKAN — finding {catLabel.toLowerCase()} near you…</p>
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
            {enriched.filter(r => !r.isDivider).length} restaurants near you
          </span>
        </div>

        <div className={styles.headerRight}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Motorcyclist%20approaching%20motorcycle%20near%20Borobudur.png"
            alt=""
            className={styles.headerHeroImg}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Scroll dots — dividers don't get a dot */}
      <div className={styles.dots}>
        {enriched.map((r, i) => r.isDivider ? null : (
          <div
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            style={i === activeIndex ? { background: catColor } : {}}
          />
        ))}
      </div>

      {/* Full-height swipeable cards */}
      <div className={styles.cardContainer} ref={containerRef} onScroll={handleScroll}>
        {enriched.map((r, i) => r.isDivider
          ? (
            <div key="divider" className={styles.dividerCard}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>{r.label}</span>
              <div className={styles.dividerLine} />
            </div>
          ) : (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              isActive={i === activeIndex}
              onOpenMenu={() => setMenuRestaurant(r)}
            />
          )
        )}
      </div>

      {/* Menu sheet */}
      {menuRestaurant && (
        <RestaurantMenuSheet
          restaurant={menuRestaurant}
          onClose={() => setMenuRestaurant(null)}
          onOrderViaChat={onOrderViaChat ?? null}
        />
      )}
    </div>
  )
}

// ── Restaurant card ───────────────────────────────────────────────────────────
function RestaurantCard({ restaurant: r, onOpenMenu }) {
  const [openTime, closeTime] = (r.opening_hours ?? '').split('–')
  const countdown = !r.is_open ? fmtCountdown(secsUntilOpen(r.opening_hours)) : null

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

        {r.repeat_discount_percent > 0 && r.is_open && (
          <div className={styles.repeatBadge}>
            🔁 Order again within {r.repeat_discount_days ?? 3} days — {r.repeat_discount_percent}% off
          </div>
        )}

        {!r.is_open && countdown && (
          <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Opening in</span>
            <span className={styles.countdownTime}>{countdown}</span>
          </div>
        )}

        <button
          className={`${styles.menuBtn} ${!r.is_open ? styles.menuBtnClosed : ''}`}
          onClick={onOpenMenu}
          disabled={!r.is_open}
        >
          {r.is_open ? 'View Menu & Order' : '⏰ Closed'}
        </button>

        <div className={styles.cardFooter}>
          <span className={styles.footerDot} />
          <span>MAKAN by Hangger</span>
          <span className={styles.footerDot} />
        </div>
      </div>
    </div>
  )
}
