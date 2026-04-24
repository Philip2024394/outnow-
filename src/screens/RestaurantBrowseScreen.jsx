import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import RestaurantMenuSheet from '@/components/restaurant/RestaurantMenuSheet'
import SectionCTAButton from '@/components/ui/SectionCTAButton'
import { hasVisitedSection, markSectionVisited } from '@/services/sectionVisitService'
import FoodFooterNav from '@/components/restaurant/FoodFooterNav'
import FoodDashboard from '@/components/restaurant/FoodDashboard'
import LiveChatSheet from '@/components/restaurant/LiveChatSheet'
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
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>Street Food</span>
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
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FACC15' }}>Restaurant</span>
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
    color: '#FACC15',
  },
  {
    id: 'banner4',
    restaurantId: 9,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600',
    title: 'Kopi Klotok Maguwo',
    promo: 'Happy Hour 3-5pm',
    color: '#FACC15',
  },
]

const CUISINE_ITEMS = [
  { id: null, emoji: '🍛', label: 'All Food' },
  { id: 'rice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvv-removebg-preview.png', label: 'Rice' },
  { id: 'noodles', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvd-removebg-preview.png', label: 'Noodles' },
  { id: 'chicken', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddd-removebg-preview.png', label: 'Chicken' },
  { id: 'satay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasda-removebg-preview.png', label: 'Satay' },
  { id: 'grilled', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdasss-removebg-preview.png', label: 'Fried Snacks' },
  { id: 'seafood', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassss-removebg-preview.png', label: 'Seafood' },
  { id: 'tofu_tempe', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddd-removebg-preview.png', label: 'Tofu & Tempe' },
  { id: 'siomay', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccddddd-removebg-preview.png', label: 'Siomay' },
  { id: 'ketoprak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssddffdddd-removebg-preview.png', label: 'Ketoprak' },
  { id: 'burgers', img: 'https://ik.imagekit.io/nepgaxllc/od-removebg-preview.png', label: 'Burgers' },
  { id: 'soup', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdas-removebg-preview.png', label: 'Soup' },
  { id: 'padang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfss-removebg-preview.png', label: 'Padang' },
  { id: 'gudeg', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssd-removebg-preview.png', label: 'Gudeg' },
  { id: 'street_food', emoji: '🥘', label: 'Street Food' },
  { id: 'drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfs-removebg-preview.png', label: 'Iced Drinks' },
  { id: 'traditional_drinks', img: 'https://ik.imagekit.io/nepgaxllc/odfss-removebg-preview.png', label: 'Traditional' },
  { id: 'coffee', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssda-removebg-preview.png', label: 'Tea & Coffee' },
  { id: 'juice', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddsssdaasda-removebg-preview.png', label: 'Juice' },
  { id: 'cakes', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasd-removebg-preview.png', label: 'Cakes' },
  { id: 'desserts', img: 'https://ik.imagekit.io/nepgaxllc/odfssd-removebg-preview.png', label: 'Desserts' },
  { id: 'porridge', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssdd-removebg-preview.png', label: 'Porridge' },
  { id: 'rendang', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdss-removebg-preview.png', label: 'Rendang' },
  { id: 'duck', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssss-removebg-preview.png', label: 'Duck' },
  { id: 'fish', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddfssdssssdd-removebg-preview.png', label: 'Fish' },
  { id: 'pizza', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsada-removebg-preview.png', label: 'Pizza' },
  { id: 'pasta', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadadd-removebg-preview.png', label: 'Pasta' },
  { id: 'japanese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddss-removebg-preview.png', label: 'Japanese' },
  { id: 'korean', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxc-removebg-preview.png', label: 'Korean' },
  { id: 'chinese', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxccc-removebg-preview.png', label: 'Chinese' },
  { id: 'indian', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddddsadaddsscxcccdddddss-removebg-preview.png', label: 'Indian' },
  { id: 'breakfast', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaa-removebg-preview.png', label: 'Breakfast' },
  { id: 'snacks', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaad-removebg-preview.png', label: 'Snacks' },
  { id: 'salad', img: 'https://ik.imagekit.io/nepgaxllc/odfssddasds-removebg-preview.png', label: 'Vegetarian' },
  { id: 'healthy', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaaaddd-removebg-preview.png', label: 'Healthy' },
  { id: 'steak', img: 'https://ik.imagekit.io/nepgaxllc/odf-removebg-preview.png', label: 'Steak' },
  { id: 'martabak', img: 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdaaavvvdddddasdassssddddf-removebg-preview.png', label: 'Martabak' },
]

// Banners appear after these ROW numbers (0-based): after row 1 and row 5
const BANNER_AFTER_ROW = [1, 5]

function CuisineGridWithBanners({ onSelect, restaurants, onOpenRestaurant }) {
  const [expandedBanner, setExpandedBanner] = useState(null)
  const [bannerIdx, setBannerIdx] = useState({})

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIdx(prev => {
        const next = { ...prev }
        BANNER_AFTER_ROW.forEach((_, i) => {
          const pool = i === 0 ? CUISINE_BANNERS.slice(0, 2) : CUISINE_BANNERS.slice(2, 4)
          next[i] = ((prev[i] ?? 0) + 1) % pool.length
        })
        return next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const cardStyle = {
    padding: '14px 8px', borderRadius: 16, cursor: 'pointer',
    backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledsdfsssq.png)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    transition: 'transform 0.15s',
  }

  // Split cuisine items into rows of 3
  const allRows = []
  for (let i = 0; i < CUISINE_ITEMS.length; i += 3) {
    allRows.push(CUISINE_ITEMS.slice(i, i + 3))
  }

  // Build output with banners injected
  const output = []
  let bannerSlot = 0

  allRows.forEach((row, rowIdx) => {
    // Render the cuisine row
    output.push(
      <div key={`row-${rowIdx}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {row.map(c => (
          <button key={c.label} onClick={() => onSelect(c.id)} style={cardStyle}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {c.img ? <img src={c.img} alt="" style={{ width: 86, height: 86, objectFit: 'contain' }} /> : <span style={{ fontSize: 32 }}>{c.emoji}</span>}
            <span style={{ fontSize: 13, fontWeight: 900, color: '#000' }}>{c.label}</span>
          </button>
        ))}
      </div>
    )

    // Insert banner after this row?
    if (BANNER_AFTER_ROW.includes(rowIdx)) {
      const slot = bannerSlot
      const pool = slot === 0 ? CUISINE_BANNERS.slice(0, 2) : CUISINE_BANNERS.slice(2, 4)
      const b = pool[(bannerIdx[slot] ?? 0) % pool.length]
      const isExpanded = expandedBanner === slot

      output.push(
        <div key={`banner-${slot}`}>
          {/* Banner row: 1 cuisine card + wide banner */}
          <button
            onClick={() => setExpandedBanner(isExpanded ? null : slot)}
            style={{
              width: '100%', height: 160, borderRadius: 16, overflow: 'hidden',
              position: 'relative', cursor: 'pointer', border: `1.5px solid ${b.color}44`,
              padding: 0, background: 'none', display: 'block',
              boxShadow: `0 2px 12px ${b.color}22`,
            }}
          >
            <img src={b.image} alt="" key={b.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.5s ease' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
              {pool.map((_, di) => (
                <span key={di} style={{ width: 6, height: 6, borderRadius: '50%', background: di === ((bannerIdx[slot] ?? 0) % pool.length) ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </button>

          {/* Sleeve — opens down */}
          {isExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, animation: 'fadeIn 0.25s ease' }}>
              {CUISINE_BANNERS.map(promo => {
                const r = restaurants.find(x => x.id === promo.restaurantId)
                return (
                  <button key={promo.id} onClick={() => { if (r) onOpenRestaurant(r) }} style={{
                    width: '100%', height: 72, borderRadius: 14, overflow: 'hidden',
                    position: 'relative', cursor: 'pointer', border: `1px solid ${promo.color}33`,
                    padding: 0, background: 'none', display: 'block',
                  }}>
                    <img src={promo.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'block' }}>{promo.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: promo.color }}>{promo.promo}</span>
                    </div>
                    <div style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 8, background: promo.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )
      bannerSlot++
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
}

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
  const [tick,           setTick]           = useState(0)
  const [showFavOnly,    setShowFavOnly]    = useState(false)
  const [showCuisinePicker, setShowCuisinePicker] = useState(true) // show cuisine picker on entry
  const [cuisineFilter, setCuisineFilter] = useState(null)
  const [favTick,        setFavTick]        = useState(0)
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

  // Use haversine for initial fast render, then upgrade with Google Directions
  // Distance calculation — haversine for browse list (fast, no API calls)
  // Google Directions only used when user actually places an order
  const withMeta = restaurants.map(r => {
    const distKm = coords && r.lat && r.lng
      ? Math.round(haversineKm(coords.lat, coords.lng, r.lat, r.lng) * 10) / 10
      : null
    return { ...r, distKm, deliveryFare: calcDeliveryFare(distKm) }
  })

  // Apply vendor type filter (street_vendor / restaurant / null = all)
  const vendorFiltered = withMeta
    .filter(r => !vendorFilter || (r.vendor_type ?? 'restaurant') === vendorFilter)
    .filter(r => !cuisineFilter || r.category === cuisineFilter || r.cuisine_type?.toLowerCase().includes(cuisineFilter.toLowerCase()))

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
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png?updatedAt=1776728675957" alt="" style={{ position: 'absolute', inset: -20, width: 'calc(100% + 40px)', height: 'calc(100% + 40px)', objectFit: 'cover', filter: 'blur(12px)', zIndex: 0 }} />
        {/* Dark tint */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 0 }} />
        <div style={{
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 14px', flexShrink: 0, position: 'relative', zIndex: 1,
          borderBottom: '2px solid #8DC63F', borderRadius: '0 0 20px 20px',
          overflow: 'hidden', marginBottom: 14,
        }}>
          {/* Running green light on bottom edge */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'cuisineRunLight 3s linear infinite', opacity: 0.8 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>What are you craving?</span>
          </div>
        </div>
        <style>{`@keyframes cuisineRunLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }`}</style>
        <CuisineGridWithBanners
          onSelect={(id) => { setCuisineFilter(id); setShowCuisinePicker(false) }}
          restaurants={DEMO_RESTAURANTS}
          onOpenRestaurant={(r) => { setCuisineFilter(null); setShowCuisinePicker(false); setMenuRestaurant(r) }}
        />
      </div>
    )}

    <div className={styles.screen} style={{ display: showLanding || loading || showCuisinePicker ? 'none' : undefined }}>

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
      {!showLanding && !foodDashOpen && (
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
function RestaurantCard({ restaurant: r, onOpenMenu, onToggleFavorite, isFav }) {
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
}
