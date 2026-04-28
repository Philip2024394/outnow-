import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import styles from './DealHuntLanding.module.css'
import DealBlast from './DealBlast'
import DealChat from '../components/DealChat'

// ── Promo banners — full-screen, no text, random rotation ────────────────────
const PROMO_BANNERS = [
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_41_31%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_38_42%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_35_03%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_29_29%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_46_04%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_51_11%20AM.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2008_55_19%20AM.png',
]
function getRandomBanner(exclude) {
  const available = PROMO_BANNERS.filter(b => b !== exclude)
  return available[Math.floor(Math.random() * available.length)]
}

// ── Demo deals with larger images ─────────────────────────────────────────────
const DEMO_DEALS = [
  { id: 'd1', title: 'Nasi Goreng Spesial', domain: 'food', sub: 'Nasi goreng kampung dengan telur mata sapi, kerupuk, dan acar segar', seller_name: 'Warung Bu Sari', seller_photo: 'https://i.pravatar.cc/80?img=1', seller_rating: 4.8, original_price: 35000, deal_price: 19000, quantity_available: 50, quantity_claimed: 38, end_time: Date.now() + 3*3600000, images: ['https://picsum.photos/seed/nasgor/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd2', title: 'Leather Wallet Handmade', domain: 'marketplace', sub: 'Dompet kulit asli buatan tangan, jahitan rapi, tahan lama', seller_name: 'Kulit Asli', seller_photo: 'https://i.pravatar.cc/80?img=5', seller_rating: 4.6, original_price: 250000, deal_price: 149000, quantity_available: 20, quantity_claimed: 14, end_time: Date.now() + 5*3600000, images: ['https://picsum.photos/seed/wallet/1080/1920'], city: 'Jakarta' },
  { id: 'd3', title: 'Full Body Massage 90min', domain: 'massage', sub: 'Relaksasi total dengan aromaterapi dan hot stone pilihan', seller_name: 'Zen Spa Jogja', seller_photo: 'https://i.pravatar.cc/80?img=9', seller_rating: 4.9, original_price: 200000, deal_price: 120000, quantity_available: 15, quantity_claimed: 11, end_time: Date.now() + 2*3600000, images: ['https://picsum.photos/seed/massage/1080/1920'], city: 'Yogyakarta', is_hot: true },
  { id: 'd4', title: 'Honda Vario 125 Sewa Harian', domain: 'rentals', sub: 'Motor matic terawat, helm & jas hujan gratis, antar jemput', seller_name: 'Jogja Rental', seller_photo: 'https://i.pravatar.cc/80?img=14', seller_rating: 4.7, original_price: 100000, deal_price: 65000, quantity_available: 8, quantity_claimed: 5, end_time: Date.now() + 7*3600000, images: ['https://picsum.photos/seed/vario/1080/1920'], city: 'Yogyakarta' },
  { id: 'd5', title: 'Bakso Jumbo + Es Teh', domain: 'food', sub: 'Bakso urat jumbo dengan kuah kaldu sapi spesial, es teh manis', seller_name: 'Bakso Pak Budi', seller_photo: 'https://i.pravatar.cc/80?img=20', seller_rating: 4.8, original_price: 25000, deal_price: 15000, quantity_available: 100, quantity_claimed: 87, end_time: Date.now() + 1*3600000, images: ['https://picsum.photos/seed/bakso/1080/1920'], city: 'Semarang', is_hot: true },
  { id: 'd6', title: 'Wireless Earbuds Pro', domain: 'marketplace', sub: 'TWS noise cancelling, 30 jam battery, waterproof IPX5', seller_name: 'TechMax ID', seller_photo: 'https://i.pravatar.cc/80?img=25', seller_rating: 4.5, original_price: 450000, deal_price: 279000, quantity_available: 30, quantity_claimed: 12, end_time: Date.now() + 6*3600000, images: ['https://picsum.photos/seed/earbuds/1080/1920'], city: 'Jakarta' },
  { id: 'd7', title: 'Ojek Bandara Jogja', domain: 'rides', sub: 'Antar jemput bandara Adisucipto, motor bersih, driver ramah', seller_name: 'IndooRide Partner', seller_photo: 'https://i.pravatar.cc/80?img=33', seller_rating: 4.6, original_price: 80000, deal_price: 45000, quantity_available: 25, quantity_claimed: 18, end_time: Date.now() + 4*3600000, images: ['https://picsum.photos/seed/ojek/1080/1920'], city: 'Yogyakarta' },
  { id: 'd8', title: 'Couple Massage + Sauna', domain: 'massage', sub: 'Paket romantis 120 menit untuk berdua, include sauna & teh herbal', seller_name: 'Bali Spa', seller_photo: 'https://i.pravatar.cc/80?img=44', seller_rating: 4.9, original_price: 500000, deal_price: 299000, quantity_available: 10, quantity_claimed: 8, end_time: Date.now() + 1.5*3600000, images: ['https://picsum.photos/seed/couple/1080/1920'], city: 'Bali', is_hot: true },
]

const DISCOUNT_IMAGES = {
  10: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaa-removebg-preview.png',
  15: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaad-removebg-preview.png',
  20: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaada-removebg-preview.png',
  25: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadaf-removebg-preview.png',
  30: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafd-removebg-preview.png',
  35: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafde-removebg-preview.png',
  40: 'https://ik.imagekit.io/nepgaxllc/Untitledsdaaadafdedd-removebg-preview.png',
  45: 'https://ik.imagekit.io/nepgaxllc/6789.png',
  50: 'https://ik.imagekit.io/nepgaxllc/Untitledttt-removebg-preview.png',
}

function getDiscountImage(pct) {
  const tiers = [10, 15, 20, 25, 30, 35, 40, 45, 50]
  const closest = tiers.reduce((prev, curr) => Math.abs(curr - pct) < Math.abs(prev - pct) ? curr : prev)
  return DISCOUNT_IMAGES[closest]
}

const DOMAIN_COLORS = { food: '#F97316', marketplace: '#8DC63F', massage: '#A855F7', rentals: '#3B82F6', rides: '#EAB308' }
const DOMAIN_LABELS = { food: 'Makanan', marketplace: 'Market', massage: 'Massage', rentals: 'Rental', rides: 'Ojek' }

// ── Mock menu/catalogue items per seller ──────────────────────────────────────
const SELLER_ITEMS = {
  'Warung Bu Sari': [
    { id: 'm1', name: 'Nasi Goreng Spesial', price: 35000, image: 'https://picsum.photos/seed/ng1/200/200', category: 'Rice' },
    { id: 'm2', name: 'Mie Goreng Jawa', price: 30000, image: 'https://picsum.photos/seed/mg1/200/200', category: 'Noodles' },
    { id: 'm3', name: 'Ayam Penyet', price: 28000, image: 'https://picsum.photos/seed/ap1/200/200', category: 'Chicken' },
    { id: 'm4', name: 'Es Teh Manis', price: 5000, image: 'https://picsum.photos/seed/et1/200/200', category: 'Drinks' },
    { id: 'm5', name: 'Es Jeruk Segar', price: 8000, image: 'https://picsum.photos/seed/ej1/200/200', category: 'Drinks' },
    { id: 'm6', name: 'Soto Ayam', price: 25000, image: 'https://picsum.photos/seed/sa1/200/200', category: 'Soup' },
  ],
  'Bakso Pak Budi': [
    { id: 'm7', name: 'Bakso Jumbo', price: 25000, image: 'https://picsum.photos/seed/bk1/200/200', category: 'Bakso' },
    { id: 'm8', name: 'Bakso Urat', price: 30000, image: 'https://picsum.photos/seed/bu1/200/200', category: 'Bakso' },
    { id: 'm9', name: 'Mie Ayam', price: 20000, image: 'https://picsum.photos/seed/ma1/200/200', category: 'Noodles' },
    { id: 'm10', name: 'Es Teh', price: 5000, image: 'https://picsum.photos/seed/et2/200/200', category: 'Drinks' },
  ],
  'Kulit Asli': [
    { id: 'p1', name: 'Leather Wallet', price: 250000, image: 'https://picsum.photos/seed/lw1/200/200', category: 'Wallets' },
    { id: 'p2', name: 'Leather Belt', price: 180000, image: 'https://picsum.photos/seed/lb1/200/200', category: 'Belts' },
    { id: 'p3', name: 'Card Holder', price: 120000, image: 'https://picsum.photos/seed/ch1/200/200', category: 'Accessories' },
    { id: 'p4', name: 'Keychain Leather', price: 45000, image: 'https://picsum.photos/seed/kl1/200/200', category: 'Accessories' },
    { id: 'p5', name: 'Laptop Sleeve', price: 350000, image: 'https://picsum.photos/seed/ls1/200/200', category: 'Bags' },
  ],
  'TechMax ID': [
    { id: 'p6', name: 'Wireless Earbuds Pro', price: 450000, image: 'https://picsum.photos/seed/we1/200/200', category: 'Audio' },
    { id: 'p7', name: 'USB-C Hub 7in1', price: 285000, image: 'https://picsum.photos/seed/uh1/200/200', category: 'Accessories' },
    { id: 'p8', name: 'Phone Stand Magnetic', price: 95000, image: 'https://picsum.photos/seed/ps1/200/200', category: 'Accessories' },
    { id: 'p9', name: 'Portable Charger 20K', price: 320000, image: 'https://picsum.photos/seed/pc1/200/200', category: 'Power' },
  ],
  _default: [
    { id: 'g1', name: 'Service Package A', price: 150000, image: 'https://picsum.photos/seed/sp1/200/200', category: 'Services' },
    { id: 'g2', name: 'Service Package B', price: 250000, image: 'https://picsum.photos/seed/sp2/200/200', category: 'Services' },
    { id: 'g3', name: 'Premium Package', price: 400000, image: 'https://picsum.photos/seed/sp3/200/200', category: 'Premium' },
  ],
}

const DEMO_REVIEW_DATA = [
  { id: 'r1', deal_title: 'Nasi Goreng Spesial', stars: 5, photo_url: 'https://picsum.photos/seed/rev1/200/200', caption: 'Enak banget! Porsi besar', reviewer_name: 'Sari', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r2', deal_title: 'Nasi Goreng Spesial', stars: 4, photo_url: 'https://picsum.photos/seed/rev2/200/200', caption: 'Sambalnya mantap', reviewer_name: 'Budi', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'r3', deal_title: 'Leather Wallet Handmade', stars: 5, photo_url: 'https://picsum.photos/seed/rev3/200/200', caption: 'Kualitas kulit bagus', reviewer_name: 'Rina', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'r4', deal_title: 'Bakso Jumbo + Es Teh', stars: 5, photo_url: 'https://picsum.photos/seed/rev4/200/200', caption: 'Bakso terenak di Semarang!', reviewer_name: 'Agus', created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 'r5', deal_title: 'Full Body Massage 90min', stars: 4, photo_url: 'https://picsum.photos/seed/rev5/200/200', caption: 'Relax banget, recommended', reviewer_name: 'Dewi', created_at: new Date(Date.now() - 432000000).toISOString() },
]

function fmtRp(n) { return `Rp${(n ?? 0).toLocaleString('id-ID')}` }

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, endTime - now)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, expired: diff <= 0, urgent: diff < 3600000 && diff > 0 }
}

// ── Single full-screen deal slide ─────────────────────────────────────────────
function fmtRpShort(n) { return n >= 1000000 ? `${(n/1000000).toFixed(1).replace('.0','')}jt` : `Rp${(n??0).toLocaleString('id-ID')}` }

// ── Mock owner menus using real category images ───────────────────────────────
const MOCK_OWNER_MENU = [
  {
    catId: 'noodles', label: 'Noodles', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_35_10%20AM.png?updatedAt=1776710128590',
    dishes: [
      { id: 'n1', name: 'Mie Goreng Jawa', price: 28000 },
      { id: 'n2', name: 'Mie Ayam Bakso', price: 25000 },
      { id: 'n3', name: 'Kwetiau Seafood', price: 35000 },
    ],
  },
  {
    catId: 'rice', label: 'Rice', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_36_12%20AM.png?updatedAt=1776710188384',
    dishes: [
      { id: 'r1', name: 'Nasi Goreng Spesial', price: 35000 },
      { id: 'r2', name: 'Nasi Campur Bali', price: 32000 },
      { id: 'r3', name: 'Nasi Uduk Komplit', price: 22000 },
    ],
  },
  {
    catId: 'fried_chicken', label: 'Chicken', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_58_16%20AM.png',
    dishes: [
      { id: 'c1', name: 'Ayam Geprek Sambal', price: 25000 },
      { id: 'c2', name: 'Ayam Bakar Madu', price: 30000 },
      { id: 'c3', name: 'Chicken Katsu', price: 28000 },
    ],
  },
  {
    catId: 'satay', label: 'Satay', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_03_59%20AM.png',
    dishes: [
      { id: 's1', name: 'Sate Ayam 10pcs', price: 25000 },
      { id: 's2', name: 'Sate Kambing 10pcs', price: 35000 },
    ],
  },
  {
    catId: 'soups', label: 'Soups', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2001_55_38%20AM.png',
    dishes: [
      { id: 'sp1', name: 'Soto Ayam', price: 22000 },
      { id: 'sp2', name: 'Bakso Jumbo', price: 25000 },
      { id: 'sp3', name: 'Sop Buntut', price: 45000 },
    ],
  },
  {
    catId: 'tea_coffee', label: 'Drinks', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_00_14%20AM.png',
    dishes: [
      { id: 'd1', name: 'Es Teh Manis', price: 5000 },
      { id: 'd2', name: 'Kopi Susu', price: 15000 },
      { id: 'd3', name: 'Es Jeruk Segar', price: 8000 },
    ],
  },
  {
    catId: 'desserts', label: 'Desserts', image: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2002_02_58%20AM.png',
    dishes: [
      { id: 'ds1', name: 'Es Campur', price: 12000 },
      { id: 'ds2', name: 'Pisang Goreng Keju', price: 15000 },
    ],
  },
]

// ── Domain-specific mock catalogues (used in demo mode only) ─────────────────
const MOCK_CATALOGUES = {
  food: MOCK_OWNER_MENU,
  marketplace: [
    { catId: 'bags', label: 'Bags & Wallets', dishes: [
      { id: 'mp1', name: 'Handmade Leather Tote', price: 450000 },
      { id: 'mp2', name: 'Canvas Sling Bag', price: 185000 },
      { id: 'mp3', name: 'Minimalist Card Wallet', price: 95000 },
    ]},
    { catId: 'accessories', label: 'Accessories', dishes: [
      { id: 'mp4', name: 'Beaded Bracelet Set', price: 65000 },
      { id: 'mp5', name: 'Silver Ring — Handcrafted', price: 280000 },
      { id: 'mp6', name: 'Batik Silk Scarf', price: 175000 },
    ]},
    { catId: 'clothing', label: 'Clothing', dishes: [
      { id: 'mp7', name: 'Linen Oversized Shirt', price: 225000 },
      { id: 'mp8', name: 'Batik Print Shorts', price: 145000 },
    ]},
  ],
  massage: [
    { catId: 'body', label: 'Full Body', dishes: [
      { id: 'ms1', name: 'Traditional Javanese Massage — 60min', price: 150000 },
      { id: 'ms2', name: 'Deep Tissue — 90min', price: 220000 },
      { id: 'ms3', name: 'Aromatherapy — 60min', price: 180000 },
    ]},
    { catId: 'foot', label: 'Reflexology', dishes: [
      { id: 'ms4', name: 'Foot Reflexology — 45min', price: 95000 },
      { id: 'ms5', name: 'Hot Stone Feet — 60min', price: 130000 },
    ]},
    { catId: 'combo', label: 'Packages', dishes: [
      { id: 'ms6', name: 'Couple Spa Package — 120min', price: 500000 },
      { id: 'ms7', name: 'Full Day Wellness — 4hrs', price: 850000 },
    ]},
  ],
  rentals: [
    { catId: 'bikes', label: 'Motorcycles', dishes: [
      { id: 'rn1', name: 'Honda Vario 125 — per day', price: 75000 },
      { id: 'rn2', name: 'Yamaha NMAX — per day', price: 120000 },
      { id: 'rn3', name: 'Honda PCX 160 — per day', price: 150000 },
    ]},
    { catId: 'cars', label: 'Cars', dishes: [
      { id: 'rn4', name: 'Toyota Avanza — per day', price: 350000 },
      { id: 'rn5', name: 'Honda Jazz — per day', price: 400000 },
    ]},
    { catId: 'other', label: 'Other', dishes: [
      { id: 'rn6', name: 'Bicycle — per day', price: 35000 },
      { id: 'rn7', name: 'Portable Speaker — per day', price: 50000 },
    ]},
  ],
  rides: [
    { catId: 'promo', label: 'Ride Promos', dishes: [
      { id: 'rd1', name: 'Bike Ride — 5km', price: 15000 },
      { id: 'rd2', name: 'Car Taxi — 10km', price: 45000 },
      { id: 'rd3', name: 'Airport Transfer', price: 120000 },
    ]},
  ],
  property: [
    { catId: 'rooms', label: 'Rooms', dishes: [
      { id: 'pr1', name: 'Kos AC — monthly', price: 1500000 },
      { id: 'pr2', name: 'Studio Apartment — monthly', price: 3500000 },
    ]},
    { catId: 'villa', label: 'Villas', dishes: [
      { id: 'pr3', name: 'Bali Villa 2BR — per night', price: 850000 },
      { id: 'pr4', name: 'Jogja Guesthouse — per night', price: 350000 },
    ]},
  ],
}

function getMockCatalogue(domain) {
  return MOCK_CATALOGUES[domain] ?? MOCK_CATALOGUES.marketplace
}

// ── Seller menu/catalogue left-side drawer ────────────────────────────────────
// Shows real seller products/menu based on deal domain.
// Food deals → restaurant menu items. Other deals → marketplace products. Falls back to domain mock.
function SellerDrawer({ deal, open, onClose, onAddItem }) {
  const [expandedCat, setExpandedCat] = useState(null)
  const [sellerItems, setSellerItems] = useState(null)

  useEffect(() => {
    if (!open || !deal) return
    // Try to load real seller data
    const loadItems = async () => {
      const { supabase } = await import('@/lib/supabase')
      if (!supabase) { setSellerItems(null); return }

      if (deal.domain === 'food') {
        // Load menu items from this seller's restaurant
        const { data } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', deal.seller_id)
          .eq('is_available', true)
          .order('category')
        if (data?.length) {
          // Group by category
          const grouped = {}
          data.forEach(item => {
            const cat = item.category || 'Other'
            if (!grouped[cat]) grouped[cat] = { catId: cat, label: cat, dishes: [] }
            grouped[cat].dishes.push({ id: item.id, name: item.name, price: item.price })
          })
          setSellerItems(Object.values(grouped))
          return
        }
      } else {
        // Load marketplace products from this seller
        const { data } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('seller_id', deal.seller_id)
          .eq('status', 'active')
          .order('category')
        if (data?.length) {
          const grouped = {}
          data.forEach(item => {
            const cat = item.category || 'Other'
            if (!grouped[cat]) grouped[cat] = { catId: cat, label: cat, dishes: [] }
            grouped[cat].dishes.push({ id: item.id, name: item.name, price: item.price })
          })
          setSellerItems(Object.values(grouped))
          return
        }
      }
      setSellerItems(null) // fallback to mock
    }
    loadItems()
  }, [open, deal])

  if (!open) return null

  const menu = sellerItems ?? getMockCatalogue(deal?.domain)
  const isFood = deal?.domain === 'food'

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{deal?.seller_name ?? 'Seller'}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 2 }}>
            {isFood ? 'Full Menu' : 'Full Catalogue'} · {menu.reduce((t, c) => t + (c.dishes?.length ?? 0), 0)} items
          </span>
        </div>
        {menu.map(cat => (
          <div key={cat.catId}>
            <button
              className={`${styles.drawerCard} ${expandedCat === cat.catId ? styles.drawerCardActive : ''}`}
              onClick={() => setExpandedCat(expandedCat === cat.catId ? null : cat.catId)}
            >
              {cat.image && <img src={cat.image} alt="" className={styles.drawerCardImg} />}
              <span className={styles.drawerCardName}>{cat.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{cat.dishes?.length ?? 0}</span>
            </button>

            {expandedCat === cat.catId && (
              <div className={styles.drawerDishes}>
                {(cat.dishes ?? []).map(dish => (
                  <button key={dish.id} className={styles.drawerDish} onClick={() => onAddItem?.(dish, deal)}>
                    <span className={styles.drawerDishName}>{dish.name}</span>
                    <span className={styles.drawerDishPrice}>{fmtRpShort(dish.price)}</span>
                    <span className={styles.drawerDishAdd}>+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DealSlide({ deal, isActive, onClaim, onChat, onViewSeller, onOpenMenu }) {
  const { h, m, s, expired, urgent } = useCountdown(deal.end_time)
  const pct = Math.round((deal.quantity_claimed / deal.quantity_available) * 100)
  const discount = Math.round((1 - deal.deal_price / deal.original_price) * 100)
  const almostGone = pct >= 80
  const dealReviews = useMemo(() => DEMO_REVIEW_DATA.filter(r => r.deal_title === deal.title), [deal.title])
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.slide}>
      {/* Full-screen background image */}
      <div className={styles.slideBg} style={{ backgroundImage: `url("${deal.images?.[0] ?? ''}")` }} />
      <div className={styles.slideScrim} />

      {/* Right-side action buttons — on card edge */}
      <div style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 14, zIndex: 5,
      }}>
        <button onClick={() => onChat?.(deal)} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexDirection: 'column', gap: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button onClick={() => setReviewsOpen(true)} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {dealReviews.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', padding: '0 3px' }}>{dealReviews.length}</span>}
        </button>
        <button onClick={() => setMenuOpen(true)} style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </button>
      </div>

      {/* Reviews panel — slides up from bottom */}
      {reviewsOpen && (
        <div className={styles.reviewsOverlay} onClick={() => setReviewsOpen(false)}>
          <div className={styles.reviewsPanel} onClick={e => e.stopPropagation()}>
            {/* Drag handle */}
            <div className={styles.reviewsDragHandle}><span /></div>

            {/* Header with avg rating */}
            <div className={styles.reviewsHeader}>
              <div className={styles.reviewsHeaderLeft}>
                <span className={styles.reviewsTitle}>Reviews</span>
                {dealReviews.length > 0 && (
                  <div className={styles.reviewsAvg}>
                    <span className={styles.reviewsAvgNum}>{(dealReviews.reduce((a, r) => a + r.stars, 0) / dealReviews.length).toFixed(1)}</span>
                    <span className={styles.reviewsAvgStars}>{'★'.repeat(Math.round(dealReviews.reduce((a, r) => a + r.stars, 0) / dealReviews.length))}</span>
                    <span className={styles.reviewsCount}>({dealReviews.length})</span>
                  </div>
                )}
              </div>
              <button className={styles.reviewsClose} onClick={() => setReviewsOpen(false)}>✕</button>
            </div>

            {/* Write review link */}
            <button className={styles.writeReviewBtn} onClick={() => { setReviewsOpen(false) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>Write a Review</span>
            </button>

            {/* Review cards */}
            {dealReviews.length === 0 ? (
              <div className={styles.reviewsEmpty}>
                <span className={styles.reviewsEmptyIcon}>⭐</span>
                <span>No reviews yet</span>
                <span className={styles.reviewsEmptySub}>Be the first to review this deal</span>
              </div>
            ) : (
              <div className={styles.reviewsList}>
                {dealReviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <img src={r.photo_url} alt="" className={styles.reviewImg} />
                    <div className={styles.reviewBody}>
                      <div className={styles.reviewTop}>
                        <span className={styles.reviewerName}>{r.reviewer_name}</span>
                        <span className={styles.reviewStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                      </div>
                      <p className={styles.reviewCaption}>{r.caption}</p>
                      <span className={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom overlay — deal info */}
      <div className={styles.slideBottom}>
        {/* Title */}
        <h2 className={styles.slideTitle}>{deal.title}</h2>

        {/* Description */}
        <p className={styles.slideSub}>{deal.sub}</p>

        {/* Seller + location */}
        <div className={styles.sellerRow}>
          <img src={deal.seller_photo ?? 'https://i.pravatar.cc/40'} alt="" className={styles.sellerThumb} />
          <span className={styles.sellerName}>{deal.seller_name}</span>
          {deal.seller_rating && <span className={styles.sellerRating}>★ {deal.seller_rating}</span>}
        </div>

        {/* Price row */}
        <div className={styles.priceRow}>
          <span className={styles.dealPrice}>{fmtRp(deal.deal_price)}</span>
          <span className={styles.origPrice}>{fmtRp(deal.original_price)}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{
                width: `${pct}%`,
                background: pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#8DC63F',
              }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span>{deal.quantity_claimed} of {deal.quantity_available} claimed</span>
            {almostGone && <span className={styles.almostGone}>Almost Gone!</span>}
          </div>
        </div>

        {/* Countdown */}
        <div className={`${styles.countdown} ${urgent ? styles.countdownUrgent : ''}`}>
          <span>⏰</span>
          <span className={styles.countdownDigits}>
            {expired ? 'EXPIRED' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
          </span>
        </div>

        {/* Bottom action strip — WhatsApp share + Save + Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
          <button onClick={(e) => {
            e.stopPropagation()
            const text = `🔥 ${deal.title} — ${discount}% OFF on INDOO!\nhttps://indoo.id`
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
          }} style={{ flex: 1, padding: '10px', borderRadius: 12, backgroundColor: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#25D366' }}>Share</span>
          </button>
          <button onClick={(e) => {
            e.stopPropagation()
            const sv = JSON.parse(localStorage.getItem('indoo_saved_deals') || '[]')
            if (!sv.some(d => d.id === deal.id)) { sv.push({ id: deal.id, title: deal.title }); localStorage.setItem('indoo_saved_deals', JSON.stringify(sv)) }
          }} style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Save</span>
          </button>
          <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>{deal.city}</span>
          </div>
        </div>

        {/* Claim button */}
        <button
          className={`${styles.claimBtn} ${expired || pct >= 100 ? styles.claimBtnDisabled : ''}`}
          onClick={() => !expired && pct < 100 && onClaim?.(deal)}
          disabled={expired || pct >= 100}
        >
          {pct >= 100 ? 'Sold Out!' : expired ? 'Deal Ended' : `🔥 Get This Deal — ${fmtRp(deal.deal_price)}`}
        </button>

        {/* Social proof */}
        <p className={styles.socialProof}>{Math.floor(Math.random() * 200 + 50)} people viewing this deal</p>
      </div>

      {/* Seller menu/catalogue drawer */}
      <SellerDrawer
        deal={deal}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddItem={(item, d) => { setMenuOpen(false); onChat?.(d) }}
      />
    </div>
  )
}

// ── Main TikTok-style feed ────────────────────────────────────────────────────
const LANDING_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2020,%202026,%2011_03_28%20PM.png'

const glassCard = { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)', borderRadius: 16, padding: 16 }
const profileInput = { width: '100%', padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

function DealHuntProfile({ onCreateDeal }) {
  // Load from all app sources
  const mainProfile = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
  const ownerProfile = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
  const vendorData = JSON.parse(localStorage.getItem('indoo_vendor_restaurant') || '{}')
  const addressData = JSON.parse(localStorage.getItem('indoo_default_address') || '{}')
  const ktpData = JSON.parse(localStorage.getItem('indoo_deal_ktp_verified') || '{}')
  const isKtpVerified = !!ktpData.verified

  // Editable state — pre-filled from merged data
  const [name, setName] = useState(mainProfile.display_name || mainProfile.name || ownerProfile.name || vendorData.name || '')
  const [email, setEmail] = useState(mainProfile.email || ownerProfile.email || '')
  const [phone, setPhone] = useState(mainProfile.phone || mainProfile.whatsapp || ownerProfile.phone || vendorData.phone || '')
  const [whatsapp, setWhatsapp] = useState(mainProfile.whatsapp || mainProfile.phone || ownerProfile.phone || '')
  const [city, setCity] = useState(mainProfile.city || ownerProfile.city || addressData.city || vendorData.city || '')
  const [address, setAddress] = useState(addressData.address || mainProfile.address || ownerProfile.address || vendorData.address || '')
  const [photo, setPhoto] = useState(mainProfile.photo_url || mainProfile.photoURL || ownerProfile.photo_url || '')
  const [saved, setSaved] = useState(false)
  const photoRef = useRef(null)

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhoto(url)
    // Save to main profile
    const existing = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
    existing.photo_url = url
    localStorage.setItem('indoo_profile', JSON.stringify(existing))
  }

  const handleSave = () => {
    const existing = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
    existing.display_name = name
    existing.name = name
    existing.email = email
    existing.phone = phone
    existing.whatsapp = whatsapp
    existing.city = city
    existing.address = address
    if (photo) existing.photo_url = photo
    localStorage.setItem('indoo_profile', JSON.stringify(existing))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      {/* Profile photo card */}
      <div style={{ ...glassCard, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: `3px solid ${isKtpVerified ? '#8DC63F' : 'rgba(255,255,255,0.15)'}` }}>
            {photo ? (
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
            )}
          </div>
          {/* Upload button */}
          <button onClick={() => photoRef.current?.click()} style={{
            position: 'absolute', bottom: 0, right: -4, width: 30, height: 30, borderRadius: '50%',
            backgroundColor: '#8DC63F', border: '3px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <input ref={photoRef} type="file" accept=".png,.jpg,.jpeg,.webp,.heic" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block' }}>PNG, JPG, JPEG, WEBP or HEIC</span>
      </div>

      {/* KTP verification */}
      <div style={{
        ...glassCard, marginBottom: 16,
        backgroundColor: isKtpVerified ? 'rgba(141,198,63,0.06)' : 'rgba(250,204,21,0.06)',
        border: `1.5px solid ${isKtpVerified ? 'rgba(141,198,63,0.2)' : 'rgba(250,204,21,0.2)'}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 28 }}>{isKtpVerified ? '✅' : '🪪'}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: isKtpVerified ? '#8DC63F' : '#FACC15', display: 'block' }}>
            {isKtpVerified ? 'Identity Verified' : 'Verification Required'}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {isKtpVerified ? 'KTP + Selfie confirmed' : 'Verify to post deals'}
          </span>
        </div>
        {!isKtpVerified && <button onClick={() => onCreateDeal?.()} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#FACC15', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Verify</button>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Deals Posted', value: JSON.parse(localStorage.getItem('indoo_public_deals') || '[]').length, icon: '📦' },
          { label: 'Deals Saved', value: JSON.parse(localStorage.getItem('indoo_saved_deals') || '[]').length, icon: '🔖' },
          { label: 'Blasts Sent', value: JSON.parse(localStorage.getItem('indoo_deal_blasts') || '[]').filter(b => b.status === 'sent').length, icon: '🚀' },
        ].map(s => (
          <div key={s.label} style={{ ...glassCard, textAlign: 'center', padding: 12 }}>
            <span style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>{s.icon}</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block' }}>{s.value}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div style={{ ...glassCard, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>✏️</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Edit Profile</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Full Name</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={profileInput} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Email</span>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" type="email" style={profileInput} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Phone</span>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="081234567890" type="tel" style={profileInput} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>WhatsApp</span>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="081234567890" type="tel" style={profileInput} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>City</span>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Yogyakarta" style={profileInput} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }}>Address</span>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Your pickup address" style={profileInput} />
          </div>
        </div>

        <button onClick={handleSave} style={{
          width: '100%', padding: 14, borderRadius: 14, marginTop: 14,
          backgroundColor: saved ? 'rgba(141,198,63,0.15)' : '#8DC63F',
          border: saved ? '1px solid #8DC63F' : 'none',
          color: saved ? '#8DC63F' : '#000',
          fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {saved ? '✓ Saved' : 'Save Profile'}
        </button>
      </div>
    </>
  )
}

// ── Helper: get deal status considering activation time ──────────────────────
function getDealStatus(deal) {
  const now = Date.now()
  if (!deal.active) return 'paused'
  if (deal.end_time && now > deal.end_time) return 'expired'
  if (deal.start_time && now < deal.start_time) return 'paused'
  return 'active'
}

function getDealTimeRemaining(deal) {
  if (!deal.end_time) return ''
  const diff = deal.end_time - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

// ── Toggle switch component ──────────────────────────────────────────────────
function ToggleSwitch({ on, onChange }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange?.(!on) }}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        backgroundColor: on ? '#8DC63F' : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: '#fff',
        transform: on ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

// ── IndooFooter ──────────────────────────────────────────────────────────────
function IndooFooter({ onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9500,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(16px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: 'calc(12px) 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
          INDOO · Deal Hunt
        </span>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Home</span>
        </button>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Close</span>
        </button>
      </div>
    </div>
  )
}

export default function DealHuntLanding({ open, onClose, onSelectDeal, onCreateDeal, onViewSeller, notifCount = 0, onNotifications, onProfile }) {
  const [activeTab, setActiveTab] = useState('browse') // 'browse' | 'mydeals'
  const [searchQuery, setSearchQuery] = useState('')
  const [myDeals, setMyDeals] = useState([])
  const [blastOpen, setBlastOpen] = useState(false)
  const [dealChatOpen, setDealChatOpen] = useState(null) // null or deal object
  const [, forceUpdate] = useState(0)

  // Load my deals from localStorage
  useEffect(() => {
    if (!open) return
    const raw = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]')
    setMyDeals(raw)
  }, [open, activeTab])

  // Get current user seller_id
  const currentSellerId = useMemo(() => {
    const profile = JSON.parse(localStorage.getItem('indoo_deal_poster_profile') || '{}')
    return profile.seller_id || null
  }, [open])

  // ── Browse Deals: active deals from other users ──────────────────────────
  const allPublicDeals = useMemo(() => {
    const stored = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]')
    // Combine stored deals with demo deals for a full feed
    const combined = [...DEMO_DEALS]
    stored.forEach(d => {
      if (!combined.some(c => c.id === d.id)) combined.push(d)
    })
    return combined
  }, [open, forceUpdate])

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 3600000

  const activeDeals = useMemo(() => {
    return allPublicDeals.filter(d => {
      // Filter out own deals if seller_id matches
      if (currentSellerId && d.seller_id === currentSellerId) return false
      // Must be active and within date range
      const endTime = d.end_time ?? (Date.now() + 3600000)
      if (endTime < now) return false
      if (d.active === false) return false
      return true
    }).filter(d => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (d.title?.toLowerCase().includes(q)) ||
             (d.category?.toLowerCase().includes(q)) ||
             (d.domain?.toLowerCase().includes(q)) ||
             (d.seller_name?.toLowerCase().includes(q))
    })
  }, [allPublicDeals, searchQuery, currentSellerId, now])

  const expiredThisWeek = useMemo(() => {
    return allPublicDeals.filter(d => {
      if (currentSellerId && d.seller_id === currentSellerId) return false
      const endTime = d.end_time ?? 0
      return endTime < now && endTime > sevenDaysAgo
    }).filter(d => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (d.title?.toLowerCase().includes(q)) ||
             (d.category?.toLowerCase().includes(q))
    })
  }, [allPublicDeals, searchQuery, currentSellerId, now, sevenDaysAgo])

  // ── My Deals: filtered by current user ──────────────────────────────────
  const myFilteredDeals = useMemo(() => {
    if (!currentSellerId) return myDeals
    return myDeals.filter(d => d.seller_id === currentSellerId)
  }, [myDeals, currentSellerId])

  // ── Toggle deal active/paused ──────────────────────────────────────────
  const handleToggleDeal = useCallback((dealId, newActive) => {
    const raw = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]')
    const updated = raw.map(d => {
      if (d.id !== dealId) return d
      if (newActive) {
        // Activate for 24 hours from now
        return {
          ...d,
          active: true,
          status: 'active',
          start_time: Date.now(),
          end_time: Date.now() + 24 * 3600000,
        }
      } else {
        return { ...d, active: false, status: 'paused' }
      }
    })
    localStorage.setItem('indoo_public_deals', JSON.stringify(updated))
    setMyDeals(updated)
  }, [])

  // ── Delete deal ──────────────────────────────────────────────────────────
  const handleDeleteDeal = useCallback((dealId) => {
    const raw = JSON.parse(localStorage.getItem('indoo_public_deals') || '[]')
    const filtered = raw.filter(d => d.id !== dealId)
    localStorage.setItem('indoo_public_deals', JSON.stringify(filtered))
    setMyDeals(filtered)
  }, [])

  // ── FAB handler ──────────────────────────────────────────────────────────
  const handleFabPress = useCallback(() => {
    const verified = localStorage.getItem('indoo_deal_poster_verified')
    if (verified) {
      onCreateDeal?.()
    } else {
      // Open verification flow — onCreateDeal handles routing to verification
      onCreateDeal?.()
    }
  }, [onCreateDeal])

  if (!open) return null

  // ── Render helper: deal card for Browse tab ────────────────────────────
  const renderBrowseCard = (deal) => {
    const discount = Math.round((1 - (deal.deal_price ?? deal.original_price) / deal.original_price) * 100)
    const endTime = deal.end_time ?? 0
    const isExpired = endTime < now
    const diff = endTime - now
    let timeLabel = 'Expired'
    if (!isExpired && diff > 0) {
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      timeLabel = h > 0 ? `${h}h ${m}m left` : `${m}m left`
    }

    return (
      <div
        key={deal.id}
        onClick={() => onSelectDeal?.(deal)}
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.15s',
        }}
      >
        {/* Deal image */}
        <div style={{ position: 'relative', width: '100%', height: 160 }}>
          <img
            src={deal.images?.[0] ?? deal.photo ?? 'https://picsum.photos/seed/deal/400/300'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Discount badge */}
          {discount > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              backgroundColor: '#FACC15',
              color: '#000',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(250,204,21,0.4)',
            }}>
              -{discount}%
            </div>
          )}
          {/* Time badge */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            backgroundColor: isExpired ? 'rgba(239,68,68,0.85)' : 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            color: isExpired ? '#fff' : '#8DC63F',
          }}>
            {timeLabel}
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '12px 14px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.3 }}>{deal.title}</h3>

          {/* Seller name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {deal.seller_photo && (
              <img src={deal.seller_photo} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{deal.seller_name ?? 'Seller'}</span>
          </div>

          {/* Prices */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(deal.deal_price)}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>{fmtRp(deal.original_price)}</span>
          </div>

          {/* Chat / Done Deal button */}
          <button
            onClick={(e) => { e.stopPropagation(); setDealChatOpen(deal) }}
            style={{
              width: '100%', marginTop: 10, padding: '9px 0',
              borderRadius: 10,
              backgroundColor: 'rgba(141,198,63,0.12)',
              border: '1.5px solid rgba(141,198,63,0.3)',
              color: '#8DC63F', fontSize: 12, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#8DC63F" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Done Deal
          </button>
        </div>
      </div>
    )
  }

  // ── Render helper: deal card for My Deals tab ──────────────────────────
  const renderMyDealCard = (deal) => {
    const status = getDealStatus(deal)
    const timeRemaining = getDealTimeRemaining(deal)
    const discount = deal.original_price && deal.deal_price
      ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
      : (deal.discount ?? 0)

    const statusColors = {
      active: { bg: 'rgba(141,198,63,0.12)', text: '#8DC63F', label: 'Active' },
      paused: { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)', label: 'Paused' },
      expired: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Expired' },
    }
    const st = statusColors[status] || statusColors.paused

    return (
      <div
        key={deal.id}
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Deal info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {deal.title}
              </h3>
              <span style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                backgroundColor: st.bg, color: st.text,
                flexShrink: 0,
              }}>
                {st.label}
              </span>
            </div>

            {/* Discount + time remaining */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
              {discount > 0 && (
                <span style={{
                  backgroundColor: 'rgba(250,204,21,0.15)', color: '#FACC15',
                  padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: 11,
                }}>
                  -{discount}%
                </span>
              )}
              {status === 'active' && timeRemaining && (
                <span style={{ color: '#8DC63F', fontWeight: 700, fontSize: 12 }}>{timeRemaining}</span>
              )}
              {status === 'expired' && (
                <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 12 }}>Expired</span>
              )}
            </div>
          </div>

          {/* Toggle switch */}
          <ToggleSwitch
            on={status === 'active'}
            onChange={(val) => handleToggleDeal(deal.id, val)}
          />
        </div>

        {/* Delete button row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => handleDeleteDeal(deal.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
              color: '#EF4444', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    )
  }

  return createPortal(
    <div className={styles.screen}>

      {/* ── Top tabs: Browse Deals / My Deals ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 9520,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 16px 0',
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { id: 'browse', label: 'Browse Deals' },
            { id: 'mydeals', label: 'My Deals' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.id ? '#8DC63F' : 'transparent'}`,
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '0 0 80px',
        height: 'calc(100% - 52px)',
        boxSizing: 'border-box',
      }}>

        {/* ══════════════════ BROWSE DEALS TAB ══════════════════ */}
        {activeTab === 'browse' && (
          <div style={{ padding: '12px 16px' }}>
            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 14px', height: 42,
              backgroundColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              marginBottom: 16,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search deals by title or category..."
                style={{
                  flex: 1, background: 'none', border: 'none', color: '#fff',
                  fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'rgba(255,255,255,0.4)', fontSize: 16,
                }}>
                  x
                </button>
              )}
            </div>

            {/* Active deals */}
            {activeDeals.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8DC63F', boxShadow: '0 0 8px rgba(141,198,63,0.5)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Active Deals ({activeDeals.length})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {activeDeals.map(renderBrowseCard)}
                </div>
              </>
            )}

            {activeDeals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0 24px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
                  {searchQuery ? '🔍' : '📦'}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  {searchQuery ? 'No deals match your search' : 'No active deals right now'}
                </span>
              </div>
            )}

            {/* This Week — expired within 7 days */}
            {expiredThisWeek.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    This Week ({expiredThisWeek.length})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, opacity: 0.65 }}>
                  {expiredThisWeek.map(renderBrowseCard)}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════ MY DEALS TAB ══════════════════ */}
        {activeTab === 'mydeals' && (
          <div style={{ padding: '12px 16px' }}>
            {myFilteredDeals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📦</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>No deals posted yet</span>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                  Tap the green "+" button to create your first deal
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Your Deals ({myFilteredDeals.length})
                  </span>
                </div>
                {myFilteredDeals.map(renderMyDealCard)}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Green "+" FAB — bottom-right, above footer ── */}
      <button
        onClick={handleFabPress}
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
          right: 20,
          zIndex: 9530,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#8DC63F',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(141,198,63,0.5), 0 0 0 4px rgba(141,198,63,0.15)',
          transition: 'transform 0.15s',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* ── IndooFooter ── */}
      <IndooFooter onClose={onClose} />

      {/* Deal Blast — paid promotion */}
      <DealBlast
        open={blastOpen}
        onClose={() => setBlastOpen(false)}
        deal={null}
      />

      {/* Deal Chat — anonymous buyer-seller chat */}
      {dealChatOpen && (
        <DealChat
          deal={dealChatOpen}
          onClose={() => setDealChatOpen(null)}
        />
      )}
    </div>,
    document.body
  )
}
