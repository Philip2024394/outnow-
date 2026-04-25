import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import FoodFooterNav from '@/components/restaurant/FoodFooterNav'
import FoodDashboard from '@/components/restaurant/FoodDashboard'
import LiveChatSheet from '@/components/restaurant/LiveChatSheet'
import { getRestaurantExtras } from '@/services/vendorExtrasService'
import PromoBannerPage from '@/components/restaurant/PromoBannerPage'
import { getFoodOrders } from '@/components/restaurant/menuSheetConstants'
import styles from './RestaurantBrowseScreen.module.css'

// Footer nav button styles
const footerBtnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minWidth: 48 }
const footerLabelStyle = { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }

const FOOD_LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_04_21%20PM.png'

function FoodLanding({ onBrowse, onClose, onSelectVendorType }) {
  return (
    <div className={styles.landingPage} style={{ backgroundImage: `url("${FOOD_LANDING_BG}")` }}>
      <div className={styles.landingOverlay} />

      {/* Side nav — Home button only */}
      <div style={{
        position: 'fixed', right: 6, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
        padding: '10px 6px', borderRadius: 24,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
      }}>
        <button onClick={onClose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', width: 42 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.03em' }}>Home</span>
        </button>
      </div>

      <div className={styles.landingContent}>
        <h1 className={styles.landingTitle} style={{ textAlign: 'left' }}><span style={{ background: 'linear-gradient(90deg, #fff 0%, #fff 58%, #8DC63F 58%, #8DC63F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>INDOO</span> <span style={{ fontSize: '0.55em', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>STREET</span></h1>
        <p className={styles.landingSub}>What are you in the mood for?</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button
            onClick={() => onSelectVendorType('street_vendor')}
            style={{
              flex: 1, padding: '16px 12px', borderRadius: 16, border: '1.5px solid rgba(250,204,21,0.3)',
              background: 'rgba(250,204,21,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, backdropFilter: 'blur(12px)',
            }}
          >
            <img src="https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png?updatedAt=1777005204904" alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>Street Food</span>
          </button>
          <button
            onClick={() => onSelectVendorType('restaurant')}
            style={{
              flex: 1, padding: '16px 12px', borderRadius: 16, border: '1.5px solid rgba(250,204,21,0.3)',
              background: 'rgba(250,204,21,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, backdropFilter: 'blur(12px)',
            }}
          >
            <img src="https://ik.imagekit.io/nepgaxllc/odf-removebg-preview.png" alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F' }}>Restaurant</span>
          </button>
        </div>
        <button
          onClick={onBrowse}
          style={{ marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Browse all food
        </button>
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
    id: 1, name: 'Warung Bu Sari', cuisine_type: 'Javanese', category: 'rice', vendor_type: 'restaurant',
    address: 'Jl. Malioboro 45, Yogyakarta', city: 'Yogyakarta', lat: -7.7928, lng: 110.3657,
    phone: '6281234567890', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
    hero_dish_name: 'Nasi Gudeg Komplit',
    description: 'Authentic Yogyakarta gudeg since 1985. Slow-cooked overnight jackfruit curry — you taste the difference.',
    opening_hours: '07:00–21:00', is_open: true, rating: 4.8, review_count: 124,
    price_from: 5000, price_to: 28000, min_order: 20000,
    catering_available: true, seating_capacity: 40,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    tour_guide_package: { min_pax: 20, price_per_pax: 25000, discount: 15, includes: 'Gudeg + rice + egg + tea', bus_parking: false },
    bank: { name: 'BCA', account_number: '1234 5678 90', account_holder: 'Sari Warung Jogja', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-1234567890-SariWarung' },
    menu_items: [
      { id: 1,  name: 'Nasi Gudeg Komplit',  price: 28000, prep_time_min: 10, category: 'Rice',           description: 'Slow-cooked overnight jackfruit curry served with a perfectly boiled egg, shredded free-range chicken, crispy krecek beef skin, and fluffy steamed white rice. A Yogyakarta classic since 1985 — every spoonful tells the story of patience and tradition passed down through three generations.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 2,  name: 'Nasi Gudeg Telur',    price: 18000, prep_time_min: 8,  category: 'Rice',           description: 'The classic Jogja combo — sweet jackfruit curry simmered in coconut milk for six hours, paired with a whole hard-boiled egg soaked in rich brown spice broth. Served on a bed of warm rice with sambal krecek on the side for that perfect kick of heat and crunch.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 3,  name: 'Nasi Gudeg Ayam',     price: 25000, prep_time_min: 10, category: 'Rice',           description: 'Tender shredded chicken slow-cooked alongside young jackfruit in a fragrant blend of palm sugar, galangal, and bay leaves. The meat falls apart at the touch of a fork, drenched in sweet coconut gravy — a comfort dish that locals queue for before sunrise every morning.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 4,  name: 'Krecek Sapi',         price: 12000, prep_time_min: 5,  category: 'Snacks & Bites', description: 'Crispy dried beef skin braised in a fiery coconut-chilli sauce until it absorbs every drop of flavour. The texture is addictive — crunchy on the outside, slightly chewy within. A beloved Javanese side dish that transforms any plate of rice into something extraordinary and unforgettable.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 5,  name: 'Tempe Bacem',         price: 8000,  prep_time_min: 3,  category: 'Gorengan',       description: 'Thick slabs of local tempeh braised in a sweet Javanese marinade of palm sugar, coriander, galangal, and bay leaves until deeply caramelised. Then lightly fried to golden perfection — crispy edges with a soft, nutty centre. The ultimate plant-based protein snack loved across all of Java.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 6,  name: 'Tahu Goreng',         price: 6000,  prep_time_min: 3,  category: 'Gorengan',       description: 'Fresh handmade tofu from the local market, deep-fried in clean oil until the outside is shatteringly crisp and golden while the inside stays silky smooth and pillowy soft. Served piping hot with a side of sweet kecap manis and sliced bird-eye chilli for dipping.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 7,  name: 'Kerupuk Udang',       price: 4000,  prep_time_min: 1,  category: 'Snacks & Bites', description: 'Light, airy prawn crackers made fresh daily from a generations-old family recipe. Real shrimp pounded into tapioca starch, sun-dried on bamboo racks, then flash-fried to order so every piece puffs up crisp and full of ocean flavour. The perfect crunchy companion to any Indonesian meal.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 8,  name: 'Es Teh Manis',        price: 5000,  prep_time_min: 2,  category: 'Tea & Coffee',   description: 'Javanese sweet iced tea brewed strong from premium local tea leaves, sweetened with pure cane sugar while still hot, then poured over a generous glass of crushed ice. Simple, refreshing, and absolutely essential — the drink that every Indonesian reaches for first on a hot afternoon.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 9,  name: 'Es Jeruk Peras',      price: 8000,  prep_time_min: 3,  category: 'Juice & Smoothie', description: 'Hand-squeezed fresh local oranges — no concentrate, no preservatives, just pure citrus goodness served over ice with a touch of simple syrup. Each glass takes four whole oranges, pressed to order so the vitamins hit you at peak freshness. Tangy, sweet, and bursting with natural energy.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 10, name: 'Wedang Jahe',         price: 7000,  prep_time_min: 3,  category: 'Tea & Coffee',   description: 'A warming traditional Javanese ginger drink made from freshly pounded young ginger root, simmered with lemongrass, pandan leaf, and palm sugar until aromatic and golden. Served steaming hot — soothes the throat, warms the belly, and pairs beautifully with gudeg on cool evening visits.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
    ],
  },
  {
    id: 4, name: 'Nasi Goreng Pak Harto', cuisine_type: 'Indonesian', category: 'rice', vendor_type: 'street_vendor',
    address: 'Jl. Kaliurang Km 3, Yogyakarta', city: 'Yogyakarta', lat: -7.7745, lng: 110.3802,
    phone: '6281234567894', cover_url: null, hero_dish_url: 'https://ik.imagekit.io/nepgaxllc/Untitledddddddddddsfsdfadsfasdfsdfsasdassdasd.png',
    hero_dish_name: 'Nasi Goreng Istimewa',
    description: 'Wok-fired fried rice cooked over charcoal. High heat, smoky flavour, zero shortcuts.',
    opening_hours: '10:00–23:00', is_open: true, rating: 4.7, review_count: 208,
    price_from: 15000, price_to: 35000, min_order: 15000,
    catering_available: false, seating_capacity: 20,
    event_features: [],
    featured_this_week: false, dine_in_discount: 15, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1100 0987 6543', account_holder: 'Harto Wijaya', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Mandiri-11000987654-HartoWijaya' },
    menu_items: [
      { id: 20, name: 'Nasi Goreng Istimewa', price: 28000, prep_time_min: 12, category: 'Rice',             description: 'Our signature charcoal wok-fired fried rice. Cooked over intense flame for that smoky aroma you can smell from the street. Topped with a fried egg, shredded chicken, fresh vegetables, and our secret homemade shrimp paste that took years to perfect.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 21, name: 'Nasi Goreng Seafood',  price: 35000, prep_time_min: 15, category: 'Rice',             description: 'Premium seafood fried rice loaded with fresh prawns, tender squid rings, and sweet crab meat. Every grain of rice is kissed by the charcoal wok flame and seasoned with garlic butter, fish sauce, and a touch of white pepper. The ocean on a plate.', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 22, name: 'Nasi Goreng Kampung',  price: 20000, prep_time_min: 10, category: 'Rice',             description: 'Village-style fried rice the way your grandmother made it — simple, honest, and packed with flavour. Salted anchovies, free-range egg, bird-eye chilli, and fresh herbs from the morning market. No shortcuts, no fancy tricks, just pure Javanese soul food.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 23, name: 'Nasi Goreng Pete',     price: 22000, prep_time_min: 10, category: 'Rice',             description: 'Not for the faint-hearted. Stinky beans (petai) fried with rice, sambal terasi, egg, and anchovies over charcoal heat. The bold, pungent flavour of pete combined with smoky wok breath creates something unforgettable. You either love it or you run from it.', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 24, name: 'Sate Ayam 5pcs',       price: 18000, prep_time_min: 10, category: 'Satay & Grilled',  description: 'Five skewers of tender chicken thigh, marinated overnight in turmeric and coriander, grilled over real coconut shell charcoal until perfectly caramelised. Served with our creamy peanut sauce made fresh daily, plus lontong rice cake and pickled shallots.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 25, name: 'Kerupuk Kampung',      price: 3000,  prep_time_min: 1,  category: 'Snacks & Bites',   description: 'Homestyle cassava crackers made by hand in our kitchen every morning. Sun-dried on bamboo trays then flash-fried to golden perfection. Light, airy, and impossibly crunchy — the perfect companion to any rice dish. Simple pleasures done right, the village way.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 26, name: 'Es Kelapa Muda',       price: 12000, prep_time_min: 2,  category: 'Juice & Smoothie', description: 'Fresh young coconut cracked open to order. The water is pure, sweet, and ice-cold — nature\'s electrolyte drink. We scoop the soft jelly flesh into the glass with crushed ice and a drizzle of palm sugar syrup. Maximum refreshment after a spicy meal.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 27, name: 'Es Teh Tarik',         price: 8000,  prep_time_min: 3,  category: 'Tea & Coffee',     description: 'Malaysian-style pulled milk tea — premium black tea brewed strong, mixed with creamy condensed milk, then dramatically pulled between two cups to create a thick frothy top. Served over crushed ice. Rich, smooth, and dangerously addictive with every sip.', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 28, name: 'Jus Alpukat',          price: 12000, prep_time_min: 4,  category: 'Juice & Smoothie', description: 'Thick, creamy Indonesian-style avocado juice blended with condensed milk, a shot of chocolate syrup, and crushed ice. Not a health drink — this is pure indulgence. Each glass uses one whole ripe avocado, hand-picked for perfect ripeness. Dessert in a glass.', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
    ],
  },
  {
    id: 5, name: 'Bubur Ayam Mbok Iyem', cuisine_type: 'Sundanese', category: 'rice', vendor_type: 'street_vendor',
    address: 'Jl. Parangtritis 8, Yogyakarta', city: 'Yogyakarta', lat: -7.8012, lng: 110.3678,
    phone: '6281234567895', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    hero_dish_name: 'Bubur Ayam Komplit',
    description: 'Morning institution since 1978. Silky rice porridge, shredded chicken, century egg. Queue forms before sunrise.',
    opening_hours: '05:30–11:00', is_open: true, rating: 4.9, review_count: 445,
    price_from: 8000, price_to: 22000, min_order: 10000,
    catering_available: true, seating_capacity: 60,
    event_features: ['birthday_setup'],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BRI', account_number: '0096 0100 2233 5566', account_holder: 'Iyem Sukarti', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BRI-0096010022335566' },
    menu_items: [
      { id: 30, name: 'Bubur Ayam Komplit',   price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Rice porridge, shredded chicken, century egg, crispy shallots, ginger broth', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 31, name: 'Bubur Ayam Polos',     price: 14000, prep_time_min: 6,  category: 'Main',   description: 'Plain rice porridge with chicken, soy sauce, crackers', photo_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', is_available: true },
      { id: 32, name: 'Bubur Kacang Hijau',   price: 12000, prep_time_min: 5,  category: 'Main',   description: 'Mung bean sweet porridge with coconut milk', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 33, name: 'Cakwe',                price: 8000,  prep_time_min: 2,  category: 'Sides',  description: 'Crispy fried dough — dunk it in the porridge', photo_url: null, is_available: true },
      { id: 34, name: 'Telur Asin',           price: 6000,  prep_time_min: 1,  category: 'Sides',  description: 'Salted duck egg', photo_url: null, is_available: true },
      { id: 35, name: 'Kopi Tubruk',          price: 7000,  prep_time_min: 3,  category: 'Drinks', description: 'Traditional Indonesian black coffee — grounds included', photo_url: null, is_available: true },
      { id: 36, name: 'Teh Panas',            price: 4000,  prep_time_min: 2,  category: 'Drinks', description: 'Hot plain tea', photo_url: null, is_available: true },
    ],
  },
  {
    id: 6, name: 'Nasi Padang Sari Rasa', cuisine_type: 'Padang', category: 'rice', vendor_type: 'restaurant',
    address: 'Jl. Solo 12, Klaten', city: 'Yogyakarta', lat: -7.7065, lng: 110.6073,
    phone: '6281234567896', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    hero_dish_name: 'Rendang Daging Sapi',
    description: 'Authentic West Sumatran food. 23 dishes cooked fresh every morning. Rendang slow-cooked 4 hours minimum.',
    opening_hours: '08:00–20:00', is_open: true, rating: 4.6, review_count: 187,
    price_from: 5000, price_to: 45000, min_order: 25000,
    catering_available: true, seating_capacity: 100,
    event_features: ['birthday_setup', 'private_room', 'party_package'],
    featured_this_week: false, status: 'approved',
    tour_guide_package: { min_pax: 25, price_per_pax: 35000, discount: 20, includes: 'Rendang + rice + gulai + drink', bus_parking: true },
    bank: { name: 'BNI', account_number: '0441 2233 4455', account_holder: 'Sari Rasa Padang', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BNI-044122334455' },
    menu_items: [
      { id: 40, name: 'Rendang Daging Sapi',  price: 45000, prep_time_min: 5,  category: 'Main',   description: 'Dry-cooked beef in coconut milk & spices — 4 hrs slow cooked', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 41, name: 'Ayam Pop',             price: 30000, prep_time_min: 5,  category: 'Main',   description: 'White coconut milk poached chicken, sambal hijau', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 42, name: 'Gulai Ikan',           price: 32000, prep_time_min: 5,  category: 'Main',   description: 'Fish curry in turmeric coconut gravy', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
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
    id: 2, name: 'Bakso Pak Budi', cuisine_type: 'Indonesian', category: 'noodles', vendor_type: 'street_vendor',
    address: 'Jl. Kaliurang Km 5, Sleman', city: 'Yogyakarta', lat: -7.7601, lng: 110.3831,
    phone: '6281234567891', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    hero_dish_name: 'Bakso Spesial',
    description: 'Famous meatball soup. Made fresh every morning from scratch.',
    opening_hours: '09:00–20:00', is_open: true, rating: 4.6, review_count: 89,
    price_from: 8000, price_to: 25000, min_order: 15000,
    catering_available: false, seating_capacity: 25,
    event_features: [],
    featured_this_week: false, status: 'approved',
    bank: { name: 'BCA', account_number: '7788 9900 1122', account_holder: 'Budi Santoso', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-77889900112' },
    menu_items: [
      { id: 6,  name: 'Bakso Spesial',  price: 22000, prep_time_min: 8,  category: 'Main',   description: 'Giant meatball, noodles, broth', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 7,  name: 'Bakso Biasa',    price: 15000, prep_time_min: 7,  category: 'Main',   description: 'Regular meatball soup', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 8,  name: 'Mie Goreng',     price: 18000, prep_time_min: 10, category: 'Main',   description: 'Fried noodles', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', is_available: true },
      { id: 9,  name: 'Es Campur',      price: 8000,  prep_time_min: 3,  category: 'Drinks', description: 'Mixed ice dessert', photo_url: null, is_available: true },
    ],
  },

  // ── GRILLED ─────────────────────────────────────────────────────────────────
  {
    id: 3, name: 'Ayam Geprek Mbak Rina', cuisine_type: 'Indonesian', category: 'grilled', vendor_type: 'street_vendor',
    address: 'Jl. Parangtritis 22, Bantul', city: 'Yogyakarta', lat: -7.8347, lng: 110.3253,
    phone: '6281234567892', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800',
    hero_dish_name: 'Ayam Geprek Level 10',
    description: 'Crispy smashed chicken — choose your heat level 1–10. We dare you.',
    opening_hours: '10:00–22:00', is_open: true, rating: 4.9, review_count: 312,
    price_from: 7000, price_to: 30000, min_order: 20000,
    catering_available: true, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup', 'sound_system', 'private_room'],
    featured_this_week: true, status: 'approved',
    bank: { name: 'Mandiri', account_number: '1420 0055 6677', account_holder: 'Rina Ayam Geprek', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Mandiri-14200055667' },
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, prep_time_min: 12, category: 'Main',   description: 'Medium spicy + rice', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, prep_time_min: 12, category: 'Main',   description: 'Max heat — challenge!', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 12, name: 'Tahu Tempe',      price: 8000,  prep_time_min: 5,  category: 'Sides',  description: 'Fried tofu & tempeh', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 13, name: 'Es Teh Tarik',    price: 7000,  prep_time_min: 2,  category: 'Drinks', description: 'Pulled milk tea', photo_url: null, is_available: true },
    ],
  },

  // ── SEAFOOD ──────────────────────────────────────────────────────────────────
  {
    id: 7, name: 'Seafood Pak Dhe Bejo', cuisine_type: 'Seafood', category: 'seafood', vendor_type: 'restaurant',
    address: 'Jl. Laksda Adisucipto 88, Yogyakarta', city: 'Yogyakarta', lat: -7.7822, lng: 110.4021,
    phone: '6281234567897', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    hero_dish_name: 'Udang Bakar Madu',
    description: 'Freshest seafood in Yogya — delivered from Samas beach every morning. Grilled over coconut shell charcoal.',
    opening_hours: '11:00–22:00', is_open: true, rating: 4.7, review_count: 256,
    price_from: 25000, price_to: 120000, min_order: 35000,
    catering_available: true, seating_capacity: 120,
    event_features: ['birthday_setup', 'private_room', 'party_package', 'sound_system'],
    featured_this_week: true, dine_in_discount: 10, status: 'approved',
    tour_guide_package: { min_pax: 20, price_per_pax: 45000, discount: 15, includes: 'Seafood platter + rice + drink + dessert', bus_parking: true },
    bank: { name: 'BCA', account_number: '3344 5566 7788', account_holder: 'Bejo Seafood Resto', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-33445566778' },
    menu_items: [
      { id: 50, name: 'Udang Bakar Madu',    price: 85000, prep_time_min: 15, category: 'Main',   description: 'Honey-glazed grilled prawns, butter garlic sauce', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 51, name: 'Cumi Goreng Tepung',  price: 55000, prep_time_min: 12, category: 'Main',   description: 'Crispy battered squid rings, chilli mayo', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
      { id: 52, name: 'Ikan Bakar Bumbu Bali', price: 75000, prep_time_min: 18, category: 'Main', description: 'Whole grilled snapper, Balinese spice paste', photo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', is_available: true },
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
    id: 8, name: 'Steak 48 Jogja', cuisine_type: 'Western', category: 'burgers', vendor_type: 'restaurant',
    address: 'Jl. Magelang Km 4.5, Yogyakarta', city: 'Yogyakarta', lat: -7.7615, lng: 110.3511,
    phone: '6281234567898', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    hero_dish_name: 'Ribeye 200g',
    description: 'Proper steaks grilled over open flame. Australian grain-fed beef. No shortcuts, no frozen imports.',
    opening_hours: '11:00–23:00', is_open: true, rating: 4.5, review_count: 178,
    price_from: 35000, price_to: 185000, min_order: 45000,
    catering_available: false, seating_capacity: 60,
    event_features: ['birthday_setup', 'private_room'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BNI', account_number: '0812 3344 5566', account_holder: 'Steak 48 Jogja', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BNI-08123344556' },
    menu_items: [
      { id: 60, name: 'Ribeye 200g',         price: 185000, prep_time_min: 20, category: 'Main',   description: 'Australian grain-fed ribeye, choice of sauce & side', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 61, name: 'Sirloin 180g',        price: 155000, prep_time_min: 18, category: 'Main',   description: 'Lean, tender sirloin. Best medium-rare.', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
      { id: 62, name: 'Beef Burger Komplit',  price:  65000, prep_time_min: 15, category: 'Main',   description: 'Double patty, cheddar, caramelised onion, house sauce', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', is_available: true },
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
    id: 9, name: 'Kopi Klotok Maguwo', cuisine_type: 'Cafe', category: 'drinks', vendor_type: 'restaurant',
    address: 'Jl. Maguwo 15, Sleman', city: 'Yogyakarta', lat: -7.7891, lng: 110.4234,
    phone: '6281234567899', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800',
    hero_dish_name: 'Kopi Joss',
    description: 'Iconic Jogja coffeehouse. Famous for Kopi Joss — black coffee with a glowing red charcoal dropped in. Must try.',
    opening_hours: '06:00–24:00', is_open: true, rating: 4.8, review_count: 521,
    price_from: 7000, price_to: 45000, min_order: 15000,
    catering_available: false, seating_capacity: 80,
    event_features: ['live_music', 'birthday_setup'],
    featured_this_week: true, dine_in_discount: 0, status: 'approved',
    bank: { name: 'BCA', account_number: '5566 7788 9900', account_holder: 'Kopi Klotok Maguwo', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BCA-55667788990' },
    menu_items: [
      { id: 70, name: 'Kopi Joss',           price: 12000, prep_time_min: 5,  category: 'Drinks', description: 'Black coffee with charcoal — the legendary Jogja drink', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 71, name: 'Kopi Susu Gula Aren', price: 18000, prep_time_min: 5,  category: 'Drinks', description: 'Espresso, palm sugar syrup, fresh milk over ice', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
      { id: 72, name: 'Matcha Latte',        price: 22000, prep_time_min: 4,  category: 'Drinks', description: 'Ceremonial matcha, oat milk, light sweetness', photo_url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', is_available: true },
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
    id: 10, name: 'Sate & Gule Pak Sabar', cuisine_type: 'Javanese', category: 'street_food', vendor_type: 'street_vendor',
    address: 'Alun-Alun Selatan, Yogyakarta', city: 'Yogyakarta', lat: -7.8108, lng: 110.3642,
    phone: '6281234567800', cover_url: null, hero_dish_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    hero_dish_name: 'Sate Kambing 10pcs',
    description: 'Street legend since 1971. Goat satay grilled to order over coconut charcoal. The smoke alone draws a crowd.',
    opening_hours: '17:00–01:00', is_open: true, rating: 4.8, review_count: 634,
    price_from: 3000, price_to: 55000, min_order: 20000,
    catering_available: true, seating_capacity: 30,
    event_features: ['birthday_setup', 'party_package'],
    featured_this_week: false, dine_in_discount: 0, status: 'approved',
    tour_guide_package: { min_pax: 15, price_per_pax: 30000, discount: 10, includes: 'Sate 10pcs + lontong + tea', bus_parking: false },
    bank: { name: 'BRI', account_number: '0096 0100 7788 4321', account_holder: 'Sabar Supriyanto', qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BRI-00960100778843' },
    menu_items: [
      { id: 80, name: 'Sate Kambing 10pcs',  price: 55000, prep_time_min: 15, category: 'Main',   description: 'Goat satay, charcoal grilled, kecap manis, sambal', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 81, name: 'Sate Ayam 10pcs',     price: 35000, prep_time_min: 12, category: 'Main',   description: 'Chicken satay, peanut sauce, lontong', photo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', is_available: true },
      { id: 82, name: 'Gule Kambing',        price: 35000, prep_time_min: 5,  category: 'Main',   description: 'Spiced goat curry, warm & rich, eat with lontong', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', is_available: true },
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

// ── Favorite helpers ──────────────────────────────────────────────────────────
function getFavorites() {
  return JSON.parse(localStorage.getItem('indoo_fav_restaurants') || '[]')
}

function isFavorite(restaurantId) {
  return getFavorites().some(f => f.id === restaurantId)
}

function toggleFavorite(restaurant) {
  const favs = getFavorites()
  const exists = favs.some(f => f.id === restaurant.id)
  const updated = exists
    ? favs.filter(f => f.id !== restaurant.id)
    : [...favs, { id: restaurant.id, name: restaurant.name, image: restaurant.cover_url, cuisine: restaurant.cuisine_type }]
  localStorage.setItem('indoo_fav_restaurants', JSON.stringify(updated))
  return updated
}

// ── Promo banners for cuisine grid ───────────────────────────────────────────
const CUISINE_BANNERS = [
  {
    id: 'banner1',
    restaurantId: 1,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2024,%202026,%2006_22_44%20PM.png',
    title: 'Warung Bu Sari',
    promo: '15% OFF Gudeg',
    color: '#8DC63F',
  },
  {
    id: 'banner2',
    restaurantId: 7,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_55%20AM.png',
    title: 'Seafood Pak Dhe Bejo',
    promo: 'Free Juice Today',
    color: '#8DC63F',
  },
  {
    id: 'banner3',
    restaurantId: 3,
    image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2025,%202026,%2004_22_09%20AM.png',
    title: 'Ayam Geprek Mbak Rina',
    promo: 'Free French Fries',
    color: '#8DC63F',
  },
  {
    id: 'banner4',
    restaurantId: 9,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600',
    title: 'Kopi Klotok Maguwo',
    promo: 'Happy Hour 3-5pm',
    color: '#8DC63F',
  },
]

const CUISINE_GROUPS = [
  { country: 'Indonesian', flag: '🇮🇩', items: [
    { id: 'rice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvv-removebg-preview.png', label: 'Rice' },
    { id: 'noodles', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png', label: 'Noodles' },
    { id: 'chicken', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddd-removebg-preview.png', label: 'Chicken' },
    { id: 'satay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasda-removebg-preview.png', label: 'Satay' },
    { id: 'seafood', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassss-removebg-preview.png', label: 'Seafood' },
    { id: 'tofu_tempe', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddd-removebg-preview.png', label: 'Tempe' },
    { id: 'siomay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddddd-removebg-preview.png', label: 'Siomay' },
    { id: 'ketoprak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssddffdddd-removebg-preview.png', label: 'Ketoprak' },
    { id: 'padang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfss-removebg-preview.png', label: 'Padang' },
    { id: 'gudeg', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssd-removebg-preview.png', label: 'Gudeg' },
    { id: 'rendang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdss-removebg-preview.png', label: 'Rendang' },
    { id: 'soup', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdas-removebg-preview.png', label: 'Soup' },
    { id: 'porridge', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssdd-removebg-preview.png', label: 'Porridge' },
    { id: 'duck', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssss-removebg-preview.png', label: 'Duck' },
    { id: 'fish', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssdd-removebg-preview.png', label: 'Fish' },
    { id: 'grilled', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdasss-removebg-preview.png', label: 'Snacks' },
    { id: 'martabak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddf-removebg-preview.png', label: 'Martabak' },
  ]},
  { country: 'Western', flag: '🍔', items: [
    { id: 'burgers', img: 'https://ik.imagekit.io/nepgaxllc/od-removebg-preview.png', label: 'Burgers' },
    { id: 'steak', img: 'https://ik.imagekit.io/nepgaxllc/odf-removebg-preview.png', label: 'Steak' },
    { id: 'pizza', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsada-removebg-preview.png', label: 'Pizza' },
    { id: 'pasta', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadadd-removebg-preview.png', label: 'Pasta' },
    { id: 'breakfast', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaa-removebg-preview.png', label: 'Breakfast' },
    { id: 'salad', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasds-removebg-preview.png', label: 'Vegetarian' },
    { id: 'healthy', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddd-removebg-preview.png', label: 'Healthy' },
  ]},
  { country: 'Chinese', flag: '🇨🇳', items: [
    { id: 'chinese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxccc-removebg-preview.png', label: 'Chinese' },
  ]},
  { country: 'Japanese', flag: '🇯🇵', items: [
    { id: 'japanese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddss-removebg-preview.png', label: 'Japanese' },
  ]},
  { country: 'Korean', flag: '🇰🇷', items: [
    { id: 'korean', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxc-removebg-preview.png', label: 'Korean' },
  ]},
  { country: 'Indian', flag: '🇮🇳', items: [
    { id: 'indian', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddss-removebg-preview.png', label: 'Indian' },
  ]},
  { country: 'Drinks & Desserts', flag: '🥤', items: [
    { id: 'drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfs-removebg-preview.png', label: 'Iced Drinks' },
    { id: 'traditional_drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfss-removebg-preview.png', label: 'Traditional' },
    { id: 'coffee', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssda-removebg-preview.png', label: 'Tea & Coffee' },
    { id: 'juice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssdaasda-removebg-preview.png', label: 'Juice' },
    { id: 'cakes', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasd-removebg-preview.png', label: 'Cakes' },
    { id: 'desserts', img: 'https://ik.imagekit.io/nepgaxllc/odfssd-removebg-preview.png', label: 'Desserts' },
    { id: 'snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaad-removebg-preview.png', label: 'Snacks' },
  ]},
]

// Flat list for banner insertion logic
const CUISINE_ITEMS = CUISINE_GROUPS.flatMap(g => g.items)

// Banners appear after these ROW numbers (0-based): after row 1 and row 5
const CuisineGridWithBanners = memo(function CuisineGridWithBanners({ onSelect }) {


  const circleStyle = {
    width: 64, height: 64, borderRadius: '50%', cursor: 'pointer',
    backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledsdfsssq.png)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.15s', margin: '0 auto',
  }

  // Build output — grouped by country with flag headers + banners
  const output = []

  CUISINE_GROUPS.forEach((group, gi) => {
    // Country header (skip for "All")
    const slogans = {
      'Indonesian': 'Authentic flavours from across the archipelago',
      'Western': 'Classic comfort food & international favourites',
      'Chinese': 'Dim sum, stir-fry & Tionghoa classics',
      'Japanese': 'Sushi, ramen & Tokyo street food',
      'Korean': 'BBQ, kimchi & Seoul favourites',
      'Indian': 'Curry, naan & rich spices',
      'Drinks & Desserts': 'Cool down with local & international treats',
    }
    if (group.country !== 'All') {
      output.push(
        <div key={`header-${gi}`} style={{ padding: '10px 4px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{group.flag}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{group.country}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slogans[group.country] ?? ''}</span>
        </div>
      )
    }

    // Cuisine items in rows of 4 (round cards fit better in 4)
    for (let i = 0; i < group.items.length; i += 4) {
      const row = group.items.slice(i, i + 4)
      output.push(
        <div key={`row-${gi}-${i}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {row.map(c => (
            <button key={c.label} onClick={() => onSelect(c.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
              onPointerDown={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(0.9)' }}
              onPointerUp={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(1)' }}
              onPointerLeave={e => { const el = e.currentTarget.firstChild; if (el) el.style.transform = 'scale(1)' }}
            >
              <div style={circleStyle}>
                {c.img ? <img src={c.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} /> : <span style={{ fontSize: 26 }}>{c.emoji}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
            </button>
          ))}
        </div>
      )


    }
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 100px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {output}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  )
})

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantBrowseScreen({ onClose, onBackToCategories, category, scrollToId, onOrderViaChat }) {
  const [showLanding, setShowLanding] = useState(false) // skip landing, go straight to cuisine picker
  const [vendorFilter, setVendorFilter] = useState(null) // null = all, 'restaurant', 'street_vendor'
  const [foodOrdersOpen, setFoodOrdersOpen] = useState(false)
  const [foodDashOpen, setFoodDashOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [promoBrowseOpen, setPromoBrowseOpen] = useState(false)

  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [menuRestaurant, setMenuRestaurant] = useState(null)
  const [selectedDish, setSelectedDish] = useState(null) // { dish, restaurant }
  const [viewRestaurant, setViewRestaurant] = useState(null) // restaurant object for full card view
  const [dishSearch, setDishSearch] = useState('') // search within dish feed
  const [cuisineSearch, setCuisineSearch] = useState('') // search on cuisine picker
  const [pickerTab, setPickerTab] = useState('cuisine') // 'cuisine' | 'deals' | 'discounts' | 'chefs'
  const [cartItems, setCartItems] = useState([]) // direct cart from dish detail
  const [cartToast, setCartToast] = useState(null) // toast message
  const [dishNote, setDishNote] = useState('') // special request note
  const [dishQty, setDishQty] = useState(1) // main dish quantity
  const [vendorExtras, setVendorExtras] = useState(null) // { sauces: [], drinks: [], sides: [] }
  const [dishExtras, setDishExtras] = useState([]) // selected extras [{label, qty}]
  const [extrasTab, setExtrasTab] = useState('sauces') // 'sauces' | 'drinks' | 'sides'
  const [dishSort, setDishSort] = useState('rating') // 'price' | 'rating' | 'distance'
  const [allergenFilters, setAllergenFilters] = useState([]) // active allergen filters
  const [dishDiscountOnly, setDishDiscountOnly] = useState(false) // show only discounted dishes
  const [tick,           setTick]           = useState(0)
  const [showFavOnly,    setShowFavOnly]    = useState(false)
  const [showCuisinePicker, setShowCuisinePicker] = useState(true) // show cuisine picker on entry
  const [cuisineFilter, setCuisineFilter] = useState(null)
  const [selectedCuisine, setSelectedCuisine] = useState(null) // cuisine selected from grid, filters discounts tab
  const [favTick,        setFavTick]        = useState(0)
  const containerRef = useRef(null)
  const { coords }   = useGeolocation()

  // Tick every 30s so countdown timers stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // Load vendor extras when dish is selected
  useEffect(() => {
    if (!selectedDish?.restaurant?.id) { setVendorExtras(null); return }
    getRestaurantExtras(selectedDish.restaurant.id).then(setVendorExtras)
  }, [selectedDish?.restaurant?.id])

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

  // Use haversine for initial fast render, then upgrade with Google Directions
  // Distance calculation — haversine for browse list (fast, no API calls)
  // Google Directions only used when user actually places an order
  const withMeta = useMemo(() => restaurants.map(r => {
    const distKm = coords && r.lat && r.lng
      ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
      : null
    return { ...r, distKm, deliveryFare: calcDeliveryFare(distKm) }
  }), [restaurants, coords?.lat, coords?.lng])

  // Apply vendor type filter (street_vendor / restaurant / null = all)
  const vendorFiltered = useMemo(() => withMeta
    .filter(r => !vendorFilter || (r.vendor_type ?? 'restaurant') === vendorFilter)
    .filter(r => !cuisineFilter || r.category === cuisineFilter || r.cuisine_type?.toLowerCase().includes(cuisineFilter.toLowerCase())),
  [withMeta, vendorFilter, cuisineFilter])

  const primary   = vendorFiltered.filter(r =>  primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))
  const secondary = vendorFiltered.filter(r => !primaryForCategory(r.category, catId))
                             .sort((a, b) => scoreRestaurant(b, hour) - scoreRestaurant(a, hour))

  // Divider label depends on which card was tapped
  const dividerLabel = catId === 'street_food' ? 'Also Nearby' : 'More Street Food'
  const divider = { isDivider: true, label: dividerLabel }

  // Flatten: primary → divider (only if secondary exists) → secondary
  // Apply favorites filter if active
  void favTick // re-render when favorites change
  const applyFavFilter = (list) => showFavOnly ? list.filter(r => isFavorite(r.id)) : list
  const enriched = secondary.length
    ? [...applyFavFilter(primary), divider, ...applyFavFilter(secondary)].filter(r => r.isDivider ? applyFavFilter(secondary).length > 0 : true)
    : applyFavFilter(primary)

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

  return (<div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 100 }}>
    <div style={{ display: showLanding ? undefined : 'none' }}>
      <FoodLanding
        onBrowse={() => { markSectionVisited('food'); setVendorFilter(null); setShowLanding(false) }}
        onClose={onClose}
        onSelectVendorType={(type) => { markSectionVisited('food'); setVendorFilter(type); setShowLanding(false); setShowCuisinePicker(true) }}
      />
    </div>

    {loading && !showLanding && (
      <div className={styles.screen}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner} style={{ borderTopColor: catColor }} />
          <p className={styles.loadingText}>INDOO Street — finding {catLabel.toLowerCase()} near you…</p>
        </div>
      </div>
    )}

    {/* ── Cuisine picker ── */}
    {showCuisinePicker && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Blurred background image */}
        <img src="https://ik.imagekit.io/nepgaxllc/sizzling.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />
        {/* Dark tint */}
        <div style={{
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 10px', flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>What are you craving?</span>
          </div>
          {/* Search bar with autocomplete */}
          <div style={{ position: 'relative', marginTop: 8 }}>
            <input
              value={cuisineSearch}
              onChange={e => setCuisineSearch(e.target.value)}
              placeholder="🔍 Search any dish or restaurant..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {cuisineSearch.trim().length >= 1 && (
              <button onClick={() => setCuisineSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            )}
            {/* Autocomplete dropdown */}
            {cuisineSearch.trim().length >= 1 && (() => {
              const q = cuisineSearch.toLowerCase().trim()
              const dishResults = withMeta.flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url && (i.name ?? '').toLowerCase().includes(q)).slice(0, 2).map(i => ({ type: 'dish', item: i, restaurant: r }))).slice(0, 5)
              const restResults = withMeta.filter(r => (r.name ?? '').toLowerCase().includes(q) || (r.cuisine_type ?? '').toLowerCase().includes(q)).slice(0, 3).map(r => ({ type: 'restaurant', restaurant: r }))
              const results = [...dishResults, ...restResults]
              if (results.length === 0) return null
              return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 20, maxHeight: 300, overflowY: 'auto' }}>
                  {results.map((r, i) => r.type === 'dish' ? (
                    <button key={`s-d-${i}`} onClick={() => { setSelectedDish({ dish: r.item, restaurant: r.restaurant }); setShowCuisinePicker(false); setCuisineFilter(r.item.category?.toLowerCase() ?? 'all'); setCuisineSearch('') }} style={{
                      width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}>
                      <img src={r.item.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{r.item.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.restaurant.name} · Rp {r.item.price.toLocaleString('id-ID').replace(/,/g, '.')}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700 }}>🍽️</span>
                    </button>
                  ) : (
                    <button key={`s-r-${i}`} onClick={() => { setCuisineSearch(''); setShowCuisinePicker(false); setCuisineFilter(null); setMenuRestaurant(r.restaurant) }} style={{
                      width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🏪</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{r.restaurant.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.restaurant.cuisine_type} · ★ {r.restaurant.rating}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700 }}>Restaurant</span>
                    </button>
                  ))}
                  {/* Search all button */}
                  <button onClick={() => { setCuisineFilter(cuisineSearch.trim()); setDishSearch(cuisineSearch.trim()); setShowCuisinePicker(false); setCuisineSearch('') }} style={{
                    width: '100%', padding: '12px 14px', border: 'none', backgroundColor: 'rgba(141,198,63,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: '0 0 14px 14px',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>🔍 See all results for "{cuisineSearch.trim()}"</span>
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
        <style>{`
          @keyframes cuisineRunLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
          @keyframes popularScroll { from { transform: translateX(0); } to { transform: translateX(-30%); } }
          @keyframes tickerDeal { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>

        {/* Toggle tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', position: 'relative', zIndex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'cuisine', label: '🍽️ Cuisine' },
            { id: 'deals', label: `🔥 ${['Super Sunday','Mega Monday','Tasty Tuesday','Wicked Wednesday','Thirsty Thursday','Crunchy Friday','Sizzle Saturday'][new Date().getDay()]}` },
            { id: 'discounts', label: '💰 Discounts' },
          ].map(t => (
            <button key={t.id} onClick={() => { setPickerTab(t.id); if (t.id === 'cuisine') setSelectedCuisine(null) }} style={{
              padding: '8px 14px', borderRadius: 12, whiteSpace: 'nowrap', flexShrink: 0,
              backgroundColor: pickerTab === t.id ? '#8DC63F' : 'rgba(0,0,0,0.5)',
              border: pickerTab === t.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: pickerTab === t.id ? '#000' : '#fff',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>

          {/* ── TAB: Daily Deals ── */}
          {pickerTab === 'deals' && <div style={{ padding: '8px 12px' }}>

          {/* Today's Deal — daily themed */}
          {(() => {
            const DAILY_THEMES = [
              { day: 0, name: 'Super Sunday', icon: '🌟', color: '#8DC63F', discount: 20 },
              { day: 1, name: 'Mega Monday', icon: '💥', color: '#8DC63F', discount: 25 },
              { day: 2, name: 'Tasty Tuesday', icon: '😋', color: '#8DC63F', discount: 15 },
              { day: 3, name: 'Wicked Wednesday', icon: '🔥', color: '#8DC63F', discount: 30 },
              { day: 4, name: 'Thirsty Thursday', icon: '🥤', color: '#8DC63F', discount: 20 },
              { day: 5, name: 'Crunchy Friday', icon: '🍗', color: '#8DC63F', discount: 25 },
              { day: 6, name: 'Sizzle Saturday', icon: '🥩', color: '#8DC63F', discount: 20 },
            ]
            const today = DAILY_THEMES[new Date().getDay()]
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999)
            void tick // trigger re-render for live countdown
            const msLeft = endOfDay - Date.now()
            const hrsLeft = Math.floor(msLeft / 3600000)
            const minsLeft = Math.floor((msLeft % 3600000) / 60000)
            const secsLeft = Math.floor((msLeft % 60000) / 1000)
            // Get 3 deal items from top restaurants
            const dealItems = withMeta.flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 2).map(i => ({ ...i, restaurant: r, dealPrice: Math.round(i.price * (1 - today.discount / 100)) })))

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{today.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: today.color, display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>{today.name}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Up to {today.discount}% off selected dishes</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: today.color, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>⏰ {hrsLeft}h {String(minsLeft).padStart(2,'0')}m</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dealItems.map((d, i) => (
                    <button key={`deal-${i}`} onClick={() => { setSelectedDish({ dish: { ...d, price: d.dealPrice }, restaurant: d.restaurant }); setShowCuisinePicker(false); setCuisineFilter(d.category?.toLowerCase() ?? 'all') }} style={{
                      width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(250,204,21,0.3)', padding: 0, background: 'none', cursor: 'pointer', display: 'flex', textAlign: 'left', height: 90,
                    }}>
                      <div style={{ width: 110, flexShrink: 0, position: 'relative' }}>
                        <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', top: 6, left: 6, padding: '3px 7px', borderRadius: 6, backgroundColor: today.color, fontSize: 11, fontWeight: 900, color: '#000' }}>-{today.discount}%</span>
                        <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 16 }}>{(d.restaurant.vendor_type ?? 'restaurant') === 'street_vendor' ? '🛒' : '🍽️'}</span>
                      </div>
                      <div style={{ flex: 1, padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'block' }}>{d.restaurant.name}</span>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          {(() => {
                            const txt = (d.name+' '+(d.description??'')).toLowerCase()
                            const tags = []
                            if (['pedas','sambal','geprek','spicy','balado','rica','cabai','cabe'].some(w => txt.includes(w))) {
                              const hot = txt.includes('level 10') || txt.includes('extra hot') || txt.includes('very hot') ? 3 : txt.includes('hot') || txt.includes('pedas') ? 2 : 1
                              tags.push(<span key="spicy" style={{ fontSize: 14, fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 2 }}>{'🌶️'.repeat(hot)} {hot === 3 ? 'Very Hot' : hot === 2 ? 'Hot' : 'Medium'}</span>)
                            }
                            if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push(<span key="garlic" style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 2 }}>🧄 Garlic Flavour</span>)
                            if (['vegetarian','vegan','sayur','tahu','tempe','salad','gado','pecel'].some(w => txt.includes(w))) tags.push(<span key="veg" style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', display: 'flex', alignItems: 'center', gap: 2 }}>🥬 No Meat</span>)
                            if (['halal'].some(w => txt.includes(w))) tags.push(<span key="halal" style={{ fontSize: 14, fontWeight: 800, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 2 }}>☪️ Halal Certified</span>)
                            return tags
                          })()}
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: today.color, position: 'absolute', right: 12, bottom: 10 }}>Rp {(d.dealPrice ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
          </div>}

          {/* ── TAB: Discounts ── */}
          {pickerTab === 'discounts' && <div style={{ padding: '8px 12px' }}>
                {(() => {
                  const openDish = (d) => { setSelectedDish({ dish: { ...d, price: d.dealPrice ?? d.price, original_price: d.dealPrice ? d.price : d.original_price }, restaurant: d.restaurant }); setShowCuisinePicker(false); setCuisineFilter(d.category?.toLowerCase() ?? 'all') }

                  const DCard = ({ d, onClick }) => {
                    const hasDiscount = (d.original_price && d.original_price > d.price) || d.discountPct
                    const discPct = d.discountPct || (d.original_price && d.original_price > d.price ? Math.round(((d.original_price - d.price) / d.original_price) * 100) : 0)
                    return (
                      <button onClick={onClick} style={{ width: '100%', borderRadius: 14, overflow: 'hidden', border: `1px solid ${hasDiscount ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.08)'}`, padding: 0, background: 'none', cursor: 'pointer', display: 'flex', textAlign: 'left', height: 80 }}>
                        <div style={{ width: 100, flexShrink: 0, position: 'relative' }}>
                          <img src={d.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {discPct > 0 && <span style={{ position: 'absolute', top: 6, left: 6, padding: '3px 7px', borderRadius: 6, backgroundColor: '#EF4444', fontSize: 11, fontWeight: 900, color: '#fff' }}>{discPct}% OFF</span>}
                        </div>
                        <div style={{ flex: 1, padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{d.name}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{d.restaurant?.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'absolute', right: 12, bottom: 10 }}>
                            {hasDiscount && d.original_price && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>Rp {d.original_price.toLocaleString('id-ID').replace(/,/g, '.')}</span>}
                            <span style={{ fontSize: 15, fontWeight: 900, color: '#8DC63F' }}>Rp {(d.dealPrice ?? d.price ?? 0).toLocaleString('id-ID').replace(/,/g, '.')}</span>
                          </div>
                        </div>
                      </button>
                    )
                  }

                  // When a cuisine is selected, show filtered results
                  if (selectedCuisine) {
                    const filter = selectedCuisine.toLowerCase()
                    const cuisineDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
                      if (!item.photo_url) return false
                      const itemCat = (item.category ?? '').toLowerCase()
                      const itemName = (item.name ?? '').toLowerCase()
                      return itemCat.includes(filter) || itemName.includes(filter) || (r.cuisine_type ?? '').toLowerCase().includes(filter)
                    }).map(item => ({ ...item, restaurant: r })))

                    // Split: discounted first, then regular
                    const discounted = cuisineDishes.filter(d => d.original_price && d.original_price > d.price)
                      .sort((a, b) => {
                        const aPct = ((a.original_price - a.price) / a.original_price)
                        const bPct = ((b.original_price - b.price) / b.original_price)
                        return bPct - aPct
                      })
                    const regular = cuisineDishes.filter(d => !(d.original_price && d.original_price > d.price))
                      .sort((a, b) => (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0))

                    // Other cuisine deals
                    const cuisineIds = new Set(cuisineDishes.map(d => d.id))
                    const otherDeals = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
                      if (!item.photo_url || cuisineIds.has(item.id)) return false
                      return item.original_price && item.original_price > item.price
                    }).map(item => ({ ...item, restaurant: r }))).slice(0, 8)

                    return (<div>
                      {/* Discounted dishes */}
                      {discounted.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>🔥</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>Discounted</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{discounted.length} deals</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {discounted.map((d, i) => <DCard key={`disc-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {/* Regular dishes */}
                      {regular.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>🍽️</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>All {selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1)} Dishes</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{regular.length} dishes</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {regular.map((d, i) => <DCard key={`reg-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {/* More deals from other cuisines */}
                      {otherDeals.length > 0 && (<>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>💰</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>More Deals</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>other cuisines</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                          {otherDeals.map((d, i) => <DCard key={`other-${i}`} d={d} onClick={() => openDish(d)} />)}
                        </div>
                      </>)}

                      {cuisineDishes.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🍽️</span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>No {selectedCuisine} dishes found</span>
                        </div>
                      )}
                    </div>)
                  }

                  // Default: no cuisine selected — show general deals
                  const allDiscounted = withMeta.flatMap(r => {
                    const disc = r.dine_in_discount > 0 ? r.dine_in_discount : (r.featured_this_week ? 15 : 10)
                    return (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 2).map((i, idx) => ({
                      ...i, restaurant: r, discountPct: disc,
                      dealPrice: Math.round(i.price * (1 - disc / 100)),
                      endsIn: 1 + ((i.id ?? idx) % 6),
                    }))
                  })
                  const flash = [...allDiscounted].sort((a, b) => a.endsIn - b.endsIn).slice(0, 5)
                  const biggest = [...allDiscounted].sort((a, b) => b.discountPct - a.discountPct).slice(0, 5)
                  const freeDelivery = withMeta.filter(r => r.featured_this_week).flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 1).map(i => ({ ...i, restaurant: r }))).slice(0, 4)
                  const chefPicks = withMeta.filter(r => (r.rating ?? 0) >= 4.7).flatMap(r => (r.menu_items ?? []).filter(i => i.photo_url).slice(0, 1).map(i => ({ ...i, restaurant: r }))).sort((a, b) => (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0)).slice(0, 5)

                  return (<div>
                    {/* 1. Free Delivery */}
                    {freeDelivery.length > 0 && (<>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>🏍️</span>
                        <div>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Free Delivery</span>
                          <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>No delivery charge today</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {freeDelivery.map((d, i) => <DCard key={`free-${i}`} d={d} onClick={() => openDish(d)} />)}
                      </div>
                    </>)}

                    {/* 2. Flash Deals */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>⚡</span>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Flash Deals</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Ending soon — grab them now</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {flash.map((d, i) => <DCard key={`flash-${i}`} d={d} onClick={() => openDish(d)} />)}
                    </div>

                    {/* 3. Biggest Savings */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>💰</span>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Biggest Savings</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Highest discount first</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {biggest.map((d, i) => <DCard key={`big-${i}`} d={d} onClick={() => openDish(d)} />)}
                    </div>

                    {/* 4. Chef's Picks */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>👨‍🍳</span>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', display: 'block', textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}>Chef's Picks</span>
                        <span style={{ fontSize: 13, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>★ 4.7+ rated from top kitchens</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      {chefPicks.map((d, i) => <DCard key={`chef-${i}`} d={{ ...d, discountPct: null, endsIn: null }} onClick={() => openDish(d)} />)}
                    </div>
                  </div>)
                })()}
          </div>}


          {/* ── TAB: Cuisine ── */}
          {pickerTab === 'cuisine' && (
            <CuisineGridWithBanners
              onSelect={(id) => {
                setSelectedCuisine(id)
                setPickerTab('discounts')
              }}
            />
          )}
      </div>
      </div>
    )}

    {/* ── Dish Feed — shows when cuisine selected ── */}
    {cuisineFilter && !showLanding && !showCuisinePicker && !menuRestaurant && !selectedDish && (() => {
      // Aggregate all dishes matching the cuisine filter from all restaurants
      const allDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
        if (!item.photo_url) return false
        const itemCat = (item.category ?? '').toLowerCase()
        const itemName = (item.name ?? '').toLowerCase()
        const filter = cuisineFilter.toLowerCase()
        return itemCat.includes(filter) || itemName.includes(filter) || (r.category ?? '').includes(filter) || (r.cuisine_type ?? '').toLowerCase().includes(filter)
      }).map(item => {
        const txt = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
        const tags = []
        if (['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe'].some(w => txt.includes(w))) tags.push({ icon: '🌶️', label: 'Spicy' })
        if (['bawang','garlic','aglio'].some(w => txt.includes(w))) tags.push({ icon: '🧄', label: 'Garlic' })
        if (['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe'].some(w => txt.includes(w))) tags.push({ icon: '🥬', label: 'Vegan' })
        if (['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame'].some(w => txt.includes(w))) tags.push({ icon: '🦐', label: 'Seafood' })
        if (['kacang','nut','almond','peanut'].some(w => txt.includes(w))) tags.push({ icon: '🥜', label: 'Nuts' })
        if (['halal'].some(w => txt.includes(w))) tags.push({ icon: '☪️', label: 'Halal' })
        return { ...item, isSpicy: tags.some(t => t.label === 'Spicy'), tags, restaurant: r }
      }))

      // Filter by search
      let filteredDishes = dishSearch.trim()
        ? allDishes.filter(d => d.name.toLowerCase().includes(dishSearch.toLowerCase()) || d.restaurant.name.toLowerCase().includes(dishSearch.toLowerCase()))
        : allDishes

      // Allergen filters
      const ALLERGEN_OPTS = [
        { id: 'no_spicy', label: 'No Spicy', icon: '🌶️' },
        { id: 'no_nuts', label: 'No Nuts', icon: '🥜' },
        { id: 'no_seafood', label: 'No Seafood', icon: '🦐' },
        { id: 'vegan', label: 'Vegan', icon: '🥬' },
      ]
      if (allergenFilters.length > 0) {
        filteredDishes = filteredDishes.filter(d => {
          for (const f of allergenFilters) {
            if (f === 'no_spicy' && d.tags.some(t => t.label === 'Spicy')) return false
            if (f === 'no_nuts' && d.tags.some(t => t.label === 'Nuts')) return false
            if (f === 'no_seafood' && d.tags.some(t => t.label === 'Seafood')) return false
            if (f === 'vegan' && !d.tags.some(t => t.label === 'Vegan')) return false
          }
          return true
        })
      }

      // Discount filter
      if (dishDiscountOnly) {
        filteredDishes = filteredDishes.filter(d => (d.original_price && d.original_price > d.price) || d.restaurant.discount_percent > 0 || d.restaurant.has_deal)
      }

      // Sort — discounted dishes always float to top
      filteredDishes = [...filteredDishes].sort((a, b) => {
        const aDiscount = (a.original_price && a.original_price > a.price) ? 1 : 0
        const bDiscount = (b.original_price && b.original_price > b.price) ? 1 : 0
        if (aDiscount !== bDiscount) return bDiscount - aDiscount // discounted first
        if (dishSort === 'price') return (a.price ?? 0) - (b.price ?? 0)
        if (dishSort === 'distance') return (a.restaurant.distKm ?? 99) - (b.restaurant.distKm ?? 99)
        return (b.restaurant.rating ?? 0) - (a.restaurant.rating ?? 0) // default: rating
      })

      // More deals from other cuisines (shown after main list)
      const filteredIds = new Set(filteredDishes.map(d => `${d.id}-${d.restaurant.id}`))
      const moreDealsDishes = withMeta.flatMap(r => (r.menu_items ?? []).filter(item => {
        if (!item.photo_url) return false
        if (!(item.original_price && item.original_price > item.price)) return false
        const key = `${item.id}-${r.id}`
        if (filteredIds.has(key)) return false // already in main list
        return true
      }).map(item => {
        const txt = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
        const tags = []
        if (['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe'].some(w => txt.includes(w))) tags.push({ icon: '🌶️', label: 'Spicy' })
        if (['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe'].some(w => txt.includes(w))) tags.push({ icon: '🥬', label: 'Vegan' })
        if (['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame'].some(w => txt.includes(w))) tags.push({ icon: '🦐', label: 'Seafood' })
        return { ...item, isSpicy: tags.some(t => t.label === 'Spicy'), tags, restaurant: r }
      })).slice(0, 12)

      const fmtPrice = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
      const cartTotal = cartItems.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0)
      const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

      // Add to cart handler
      const addToCart = (dish) => {
        setCartItems(prev => {
          const existing = prev.find(c => c.id === dish.id && c.restaurant.id === dish.restaurant.id)
          if (existing) return prev.map(c => c.id === dish.id && c.restaurant.id === dish.restaurant.id ? { ...c, qty: c.qty + 1 } : c)
          return [...prev, { ...dish, qty: 1 }]
        })
        setCartToast(`${dish.name} added to cart`)
        setTimeout(() => setCartToast(null), 2000)
      }

      const getQty = (dishId, restId) => cartItems.find(c => c.id === dishId && c.restaurant?.id === restId)?.qty ?? 0
      const removeFromCart = (dishId, restId) => {
        setCartItems(prev => {
          const item = prev.find(c => c.id === dishId && c.restaurant?.id === restId)
          if (!item) return prev
          if (item.qty <= 1) return prev.filter(c => !(c.id === dishId && c.restaurant?.id === restId))
          return prev.map(c => c.id === dishId && c.restaurant?.id === restId ? { ...c, qty: c.qty - 1 } : c)
        })
      }

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 105, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Blurred background */}
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png?updatedAt=1776728675957" alt="" style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', objectFit: 'cover', filter: 'blur(12px)', zIndex: 0, opacity: 0.3 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 0 }} />
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 6px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <button onClick={() => { setCuisineFilter(null); setDishSearch(''); setShowCuisinePicker(true) }} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', flex: 1 }}>{cuisineFilter.charAt(0).toUpperCase() + cuisineFilter.slice(1)}</span>
              <button onClick={() => setDishDiscountOnly(v => !v)} style={{
                padding: '6px 12px', borderRadius: 10, whiteSpace: 'nowrap',
                backgroundColor: dishDiscountOnly ? '#8DC63F' : 'rgba(0,0,0,0.4)',
                border: dishDiscountOnly ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: dishDiscountOnly ? '#000' : 'rgba(255,255,255,0.6)',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
              }}>💰 Discounts</button>
              {/* Cart icon */}
              {cartItems.length > 0 && (
                <button onClick={() => { setSelectedDish(null); setCuisineFilter(null); setMenuRestaurant(cartItems[0]?.restaurant) }} style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="cart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', padding: '0 3px' }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
                </button>
              )}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{filteredDishes.length}</span>
            </div>
            {/* Search bar */}
            <input
              value={dishSearch}
              onChange={e => setDishSearch(e.target.value)}
              placeholder="🔍 Search dishes..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {/* Sort + allergen filters */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {[{ id: 'rating', label: '⭐ Rating' }, { id: 'price', label: '💰 Price' }, { id: 'distance', label: '📍 Nearest' }].map(s => (
                <button key={s.id} onClick={() => setDishSort(s.id)} style={{
                  padding: '5px 10px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: dishSort === s.id ? 'rgba(141,198,63,0.2)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${dishSort === s.id ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                  color: dishSort === s.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                }}>{s.label}</button>
              ))}
              <span style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />
              {ALLERGEN_OPTS.map(f => {
                const active = allergenFilters.includes(f.id)
                return (
                  <button key={f.id} onClick={() => setAllergenFilters(prev => active ? prev.filter(x => x !== f.id) : [...prev, f.id])} style={{
                    padding: '5px 10px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
                    backgroundColor: active ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${active ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#EF4444' : 'rgba(255,255,255,0.5)',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  }}>{f.icon} {f.label}</button>
                )
              })}
            </div>
          </div>

          {/* Dish grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 100px', position: 'relative', zIndex: 1 }}>
            {filteredDishes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🍽️</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 6 }}>No dishes found</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Try a different cuisine</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {filteredDishes.map((dish, i) => (
                  <button key={`${dish.id}-${i}`} onClick={() => setSelectedDish({ dish, restaurant: dish.restaurant })} style={{
                    borderRadius: 16, overflow: 'hidden', position: 'relative',
                    border: '1px solid rgba(255,255,255,0.08)', padding: 0, background: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', textAlign: 'left',
                  }}>
                    {/* Dish image */}
                    <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                      <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                      {/* Price badge */}
                      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {dish.original_price && dish.original_price > dish.price && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{fmtPrice(dish.original_price)}</span>
                        )}
                        <div style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#8DC63F' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>{fmtPrice(dish.price)}</span>
                        </div>
                      </div>
                      {/* Discount badge */}
                      {dish.original_price && dish.original_price > dish.price && (
                        <div style={{ position: 'absolute', top: 6, left: 6, padding: '3px 6px', borderRadius: 6, backgroundColor: '#EF4444' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                        </div>
                      )}
                      {dish.isSpicy && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 18 }}>🌶️</span>}
                      <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 14 }}>{(dish.restaurant.vendor_type ?? 'restaurant') === 'street_vendor' ? '🛒' : '🍽️'}</span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 10px 12px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{dish.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{dish.restaurant.name}</span>
                        {dish.restaurant.rating && <span style={{ fontSize: 10, color: '#FACC15', fontWeight: 800 }}>★ {dish.restaurant.rating}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {dish.restaurant.deliveryFare != null && (
                          <span style={{ fontSize: 10, color: '#8DC63F', fontWeight: 700 }}>🏍️ {fmtPrice(dish.restaurant.deliveryFare)}</span>
                        )}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>~{(dish.prep_time_min ?? 15) + Math.round((dish.restaurant.distKm ?? 3) * 2.5)} min</span>
                      </div>
                      {dish.restaurant.min_order && dish.price < dish.restaurant.min_order && (
                        <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 700, marginTop: 2, display: 'block' }}>Min order {fmtPrice(dish.restaurant.min_order)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* More Deals from other cuisines */}
            {!dishDiscountOnly && moreDealsDishes.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>More Deals</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>from other cuisines</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {moreDealsDishes.map((dish, i) => (
                    <button key={`deal-${dish.id}-${i}`} onClick={() => setSelectedDish({ dish, restaurant: dish.restaurant })} style={{
                      borderRadius: 16, overflow: 'hidden', position: 'relative',
                      border: '1px solid rgba(255,255,255,0.08)', padding: 0, background: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                    }}>
                      <div style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
                        <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{fmtPrice(dish.original_price)}</span>
                          <div style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#8DC63F' }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#000' }}>{fmtPrice(dish.price)}</span>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', top: 6, left: 6, padding: '3px 6px', borderRadius: 6, backgroundColor: '#EF4444' }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px 10px 12px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block', lineHeight: 1.3 }}>{dish.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{dish.restaurant.name}</span>
                          {dish.restaurant.rating && <span style={{ fontSize: 10, color: '#FACC15', fontWeight: 800 }}>★ {dish.restaurant.rating}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating cart total bar */}
          {cartCount > 0 && (
            <div style={{
              position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 9510,
              padding: '12px 16px', borderRadius: 16,
              backgroundColor: '#8DC63F', boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }} onClick={() => { if (cartItems[0]?.restaurant) { setSelectedDish(null); setCuisineFilter(null); setMenuRestaurant(cartItems[0].restaurant) } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🛒</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#000' }}>{fmtPrice(cartTotal)} →</span>
            </div>
          )}

          {/* Cart toast */}
          {cartToast && (
            <div style={{ position: 'fixed', bottom: cartCount > 0 ? 140 : 90, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 12, backgroundColor: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}>
              ✓ {cartToast}
            </div>
          )}

          {/* Footer nav */}
          <FoodFooterNav
            onHome={onClose}
            onChat={() => setChatOpen(true)}
            onNotifications={() => {}}
            onProfile={() => {}}
            activeTab={null}
          />
        </div>
      )
    })()}

    {/* ── Dish Detail Page — hero dish + restaurant's other dishes ── */}
    {selectedDish && (() => {
      const { dish, restaurant } = selectedDish
      const fmtP = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
      const dishScrollRef = { current: null }

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 115, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative', zIndex: 2 }}>
            <button onClick={() => { setSelectedDish(null); setCuisineFilter(null); setShowCuisinePicker(true) }} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{restaurant.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {restaurant.rating && <span style={{ fontSize: 12, color: '#FACC15', fontWeight: 800 }}>★ {restaurant.rating}</span>}
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>· {restaurant.cuisine_type}</span>
              </div>
            </div>
            {/* Cart icon — always visible */}
            <button onClick={() => { if (cartItems.length > 0) { setSelectedDish(null); setCuisineFilter(null); setMenuRestaurant(cartItems[0]?.restaurant) } }} style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="cart" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              {cartItems.length > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', padding: '0 3px' }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
              )}
            </button>
          </div>

          {/* Scrollable content */}
          <div ref={el => { dishScrollRef.current = el }} style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, padding: '0 0 20px' }}>
            {/* Background image — scrolls with content */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100vh', pointerEvents: 'none', zIndex: 0 }}>
              <img src="https://ik.imagekit.io/nepgaxllc/sizzling.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.8) 70%, #0a0a0a 100%)' }} />
            </div>

            {/* ── Dish hero + extras panel side by side ── */}
            {(() => {
              // Use vendor extras from Supabase, fallback to demo data
              const DEMO_EXTRAS = {
                sauces: [
                  { label: 'Extra Sambal', price: 3000 },
                  { label: 'Kecap Manis', price: 2000 },
                  { label: 'Chilli Oil', price: 3000 },
                  { label: 'Peanut Sauce', price: 3000 },
                  { label: 'Sambal Matah', price: 4000 },
                ],
                drinks: [
                  { label: 'Es Teh Manis', price: 5000 },
                  { label: 'Es Jeruk', price: 8000 },
                  { label: 'Kopi Susu', price: 12000 },
                  { label: 'Air Mineral', price: 4000 },
                  { label: 'Es Kelapa', price: 10000 },
                ],
                sides: [
                  { label: 'Extra Rice', price: 5000 },
                  { label: 'Fried Egg', price: 5000 },
                  { label: 'French Fries', price: 8000 },
                  { label: 'Kerupuk', price: 3000 },
                  { label: 'Extra Cheese', price: 8000 },
                ],
              }
              const hasVendorExtras = vendorExtras && (vendorExtras.sauces?.length > 0 || vendorExtras.drinks?.length > 0 || vendorExtras.sides?.length > 0)
              const EXTRAS = hasVendorExtras ? vendorExtras : DEMO_EXTRAS
              const ALL_EXTRAS = Object.values(EXTRAS).flat()
              const extrasCost = dishExtras.reduce((s, e) => s + (ALL_EXTRAS.find(x => x.label === e.label)?.price ?? 0) * (e.qty ?? 1), 0)
              const totalPrice = (dish.price * dishQty) + extrasCost

              return (
                <>
                  {/* Dish name above the row */}
                  <div style={{ margin: '8px 14px 20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2, flex: 1 }}>{dish.name}</span>
                      {dish.original_price && dish.original_price > dish.price && (
                        <span style={{ padding: '3px 7px', borderRadius: 6, backgroundColor: '#EF4444', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{Math.round(((dish.original_price - dish.price) / dish.original_price) * 100)}% OFF</span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>🏍️ {(dish.prep_time_min ?? 15) + Math.round((restaurant.distKm ?? 3) * 2.5)}min</span>
                    </div>
                    {dish.description && <span style={{ fontSize: 12, color: '#fff', display: 'block', marginTop: 6, lineHeight: 1.4 }}>{dish.description.slice(0, 100)}</span>}
                  </div>

                  {/* Top row: dish image left + extras panel right */}
                  <div style={{ display: 'flex', gap: 10, margin: '0 14px', position: 'relative', alignItems: 'flex-start', zIndex: 1 }}>

                    {/* Left — image + delivery time */}
                    <div style={{ width: 160, flexShrink: 0 }}>
                      <div style={{ width: 160, height: 160, borderRadius: 18, overflow: 'hidden', position: 'relative', border: '2px solid #8DC63F' }}>
                        <img src={dish.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                        {/* Star rating */}
                        {restaurant.rating && (
                          <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: 10, color: '#FACC15' }}>★</span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{restaurant.rating}</span>
                          </div>
                        )}
                        {/* Tags */}
                        {dish.tags?.length > 0 && (
                          <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            {dish.tags.slice(0, 3).map(t => (
                              <span key={t.label} style={{ padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span>{t.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{t.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Qty selector — below image */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                        <button onClick={() => setDishQty(q => Math.max(1, q - 1))} style={{
                          width: 44, height: 36, borderRadius: 8, background: 'rgba(141,198,63,0.15)', border: 'none',
                          color: '#8DC63F', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}>−</button>
                        <span style={{ width: 36, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>{dishQty}</span>
                        <button onClick={() => setDishQty(q => q + 1)} style={{
                          width: 44, height: 36, borderRadius: 8, background: 'rgba(141,198,63,0.15)', border: 'none',
                          color: '#8DC63F', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}>+</button>
                      </div>
                    </div>

                    {/* Right — extras basket panel, min height matches image+delivery */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '2px solid #8DC63F', background: '#000', overflow: 'hidden' }}>
                      {/* Panel header */}
                      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', display: 'block', lineHeight: 1.2 }}>Order Now</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block', marginTop: 2 }}>{fmtP(totalPrice)}</span>
                      </div>

                      {/* Selected extras list */}
                      <div style={{ padding: '6px 10px' }}>
                        {dishExtras.length === 0 ? (
                          <div style={{ padding: '8px 0', opacity: 0.35, textAlign: 'center' }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Add extras below</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {dishExtras.map(item => (
                              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
                                <button onClick={() => setDishExtras(prev => prev.filter(e => e.label !== item.label))} style={{
                                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                  color: '#EF4444', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 6,
                                }}>✕</button>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', flex: 1, lineHeight: 1.2 }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Itemized breakdown + Delivery fee */}
                      <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#000' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{dish.name} x{dishQty}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{fmtP(dish.price * dishQty)}</span>
                        </div>
                        {extrasCost > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Extras</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>+{fmtP(extrasCost)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Delivery</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{fmtP(restaurant.deliveryFare ?? Math.max(5000, Math.round((restaurant.distKm ?? 3) * 2500)))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Easy Extra Adding */}
                  <div style={{ padding: '12px 14px', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block', marginBottom: 3, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Add Extras</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 8, textAlign: 'center' }}>Tap + to add sauces, drinks or sides to your order</span>

                    {/* Toggle tabs */}
                    <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {[
                        { id: 'sauces', label: '🌶️ Sauces' },
                        { id: 'drinks', label: '🥤 Drinks' },
                        { id: 'sides', label: '🍟 Sides' },
                      ].map(t => {
                        const tabCount = dishExtras.filter(e => (EXTRAS[t.id] ?? []).some(ex => ex.label === e.label)).reduce((s, e) => s + e.qty, 0)
                        return (
                        <button key={t.id} onClick={() => setExtrasTab(t.id)} style={{
                          flex: 1, padding: '12px 4px', background: 'none', border: 'none',
                          borderBottom: extrasTab === t.id ? '3px solid #8DC63F' : '3px solid transparent',
                          color: extrasTab === t.id ? '#8DC63F' : '#fff',
                          fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                          position: 'relative',
                        }}>{t.label}{tabCount > 0 && <span style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 8, backgroundColor: '#8DC63F', color: '#000', fontSize: 10, fontWeight: 900 }}>{tabCount}</span>}</button>
                        )
                      })}
                    </div>

                    {/* Extras options per tab */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 12 }}>
                      {(EXTRAS[extrasTab] ?? []).map(ex => {
                        const existing = dishExtras.find(e => e.label === ex.label)
                        const qty = existing?.qty ?? 0
                        return (
                          <div key={ex.label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>{ex.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginRight: 10 }}>Rp {ex.price.toLocaleString('id-ID').replace(/,/g, '.')}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                              <button onClick={() => setDishExtras(prev => qty <= 1 ? prev.filter(e => e.label !== ex.label) : prev.map(e => e.label === ex.label ? { ...e, qty: e.qty - 1 } : e))} style={{
                                width: 44, height: 44, borderRadius: 10, background: 'rgba(141,198,63,0.15)', border: 'none',
                                color: '#8DC63F', fontSize: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                              }}>−</button>
                              <span style={{ width: 34, textAlign: 'center', fontSize: 18, fontWeight: 900, color: qty > 0 ? '#8DC63F' : 'rgba(255,255,255,0.2)' }}>{qty}</span>
                              <button onClick={() => setDishExtras(prev => {
                                if (existing) return prev.map(e => e.label === ex.label ? { ...e, qty: e.qty + 1 } : e)
                                return [...prev, { label: ex.label, qty: 1 }]
                              })} style={{
                                width: 44, height: 44, borderRadius: 10, background: 'rgba(141,198,63,0.15)', border: 'none',
                                color: '#8DC63F', fontSize: 20, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                              }}>+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Special Instructions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Special Instructions</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{dishNote.length}/150</span>
                    </div>
                    <textarea
                      value={dishNote}
                      onChange={e => setDishNote(e.target.value)}
                      placeholder="No chili, extra spicy, less salt..."
                      maxLength={150}
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12, resize: 'none', lineHeight: 1.4 }}
                    />

                  </div>
                </>
              )
            })()}

          </div>

          {/* Sticky Add to Cart footer */}
          {(() => {
            const DEMO_EX = [
              { label: 'Extra Sambal', price: 3000 }, { label: 'Kecap Manis', price: 2000 }, { label: 'Chilli Oil', price: 3000 }, { label: 'Peanut Sauce', price: 3000 }, { label: 'Sambal Matah', price: 4000 },
              { label: 'Es Teh Manis', price: 5000 }, { label: 'Es Jeruk', price: 8000 }, { label: 'Kopi Susu', price: 12000 }, { label: 'Air Mineral', price: 4000 }, { label: 'Es Kelapa', price: 10000 },
              { label: 'Extra Rice', price: 5000 }, { label: 'Fried Egg', price: 5000 }, { label: 'French Fries', price: 8000 }, { label: 'Kerupuk', price: 3000 }, { label: 'Extra Cheese', price: 8000 },
            ]
            const ALL_EX = vendorExtras ? Object.values(vendorExtras).flat() : DEMO_EX
            const exCost = dishExtras.reduce((s, e) => s + (ALL_EX.find(x => x.label === e.label)?.price ?? 0) * (e.qty ?? 1), 0)
            const total = (dish.price * dishQty) + exCost
            const fmtFooter = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID').replace(/,/g, '.')
            return (
              <div style={{ padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 10px)', background: 'transparent', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                <button onClick={() => {
                  setCartItems(prev => {
                    const existing = prev.find(c => c.id === dish.id && c.restaurant?.id === restaurant.id)
                    if (existing) return prev.map(c => c.id === dish.id && c.restaurant?.id === restaurant.id ? { ...c, qty: c.qty + dishQty } : c)
                    return [...prev, { ...dish, restaurant, qty: dishQty, note: dishNote, extras: dishExtras, extrasPrice: exCost }]
                  })
                  setCartToast(`${dishQty}x ${dish.name} added to cart`)
                  setTimeout(() => setCartToast(null), 2000)
                  setDishNote(''); setDishExtras([]); setDishQty(1)
                }} style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  backgroundColor: '#8DC63F', border: 'none', color: '#000',
                  fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 25px rgba(141,198,63,0.5), 0 8px 40px rgba(141,198,63,0.3)',
                }}>
                  Add to Cart — {fmtFooter(total)}
                </button>
              </div>
            )
          })()}
        </div>
      )
    })()}

    {/* ── Full-screen Restaurant Card page ── */}
    {viewRestaurant && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 120, backgroundColor: '#0a0a0a' }}>
        {/* Back button */}
        <button onClick={() => setViewRestaurant(null)} style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', left: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <RestaurantCard
          restaurant={viewRestaurant}
          onOpenMenu={() => { setViewRestaurant(null); setSelectedDish(null); setCuisineFilter(null); setMenuRestaurant(viewRestaurant) }}
          onToggleFavorite={() => { toggleFavorite(viewRestaurant); setFavTick(t => t + 1) }}
          isFav={isFavorite(viewRestaurant.id)}
        />
      </div>
    )}

    <div className={styles.screen} style={{ display: showLanding || loading || showCuisinePicker || cuisineFilter ? 'none' : undefined }}>

      {/* Fixed header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, flex: 1 }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', display: 'inline' }}><span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F', marginLeft: -2 }}>OO</span></span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginLeft: 5 }}>STREET</span>
        </div>
      </div>

      {/* Vendor type toggle — compact text under header */}
      <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 48px)', left: 12, right: 70, zIndex: 200, display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { id: null, label: 'All' },
          { id: 'street_vendor', label: 'Street Food' },
          { id: 'restaurant', label: 'Restaurant' },
        ].map((tab, i) => (
          <span key={tab.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>|</span>}
            <button
              onClick={() => setVendorFilter(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer',
                fontSize: 11, fontWeight: vendorFilter === tab.id ? 900 : 600,
                color: vendorFilter === tab.id ? '#8DC63F' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          </span>
        ))}
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
              onToggleFavorite={() => { toggleFavorite(r); setFavTick(t => t + 1) }}
              isFav={isFavorite(r.id)}
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

      {/* Customer food dashboard */}
      {foodDashOpen && (
        <FoodDashboard onClose={() => setFoodDashOpen(false)} />
      )}

      {/* ── Floating footer nav — Home | Chat | Notifications | Profile ── */}
      {!showLanding && !foodDashOpen && !selectedDish && (
        <FoodFooterNav
          onHome={onClose}
          onChat={() => setChatOpen(true)}
          onNotifications={() => { /* TODO: open notifications */ }}
          onProfile={() => { /* TODO: open profile */ }}
          activeTab={chatOpen ? 'chat' : null}
        />
      )}

      {/* Live Chat */}
      {chatOpen && (
        <LiveChatSheet
          order={getFoodOrders()[0] ?? null}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Promo banners */}
      {promoBrowseOpen && (
        <PromoBannerPage
          onClose={() => setPromoBrowseOpen(false)}
        />
      )}
    </div>
  </div>)
}

// ── Restaurant card ───────────────────────────────────────────────────────────
const RestaurantCard = memo(function RestaurantCard({ restaurant: r, onOpenMenu, onToggleFavorite, isFav }) {
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
        <span className={styles.cuisinePill}>{r.city || r.cuisine_type}</span>

        {/* Who's in the Kitchen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
          <div style={{ display: 'flex' }}>
            {[
              'https://i.pravatar.cc/100?img=1',
              'https://i.pravatar.cc/100?img=5',
              'https://i.pravatar.cc/100?img=9',
              'https://i.pravatar.cc/100?img=14',
              'https://i.pravatar.cc/100?img=20',
            ].map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #0a0a0a', marginLeft: i === 0 ? 0 : -6, objectFit: 'cover' }} />
            ))}
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid #0a0a0a', marginLeft: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>
              +{Math.floor(10 + Math.random() * 50)}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>In the Kitchen</span>
        </div>

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
          {r.is_open ? 'View Menu' : '⏰ Closed'}
        </button>

      </div>
    </div>
  )
})
