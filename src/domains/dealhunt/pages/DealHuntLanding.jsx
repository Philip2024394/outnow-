import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import styles from './DealHuntLanding.module.css'
import DealReviewCarousel from '../components/DealReviewCarousel'

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

      {/* Discount badge — top right */}
      <div className={styles.discountBadge}>
        <img src={getDiscountImage(discount)} alt={`-${discount}%`} className={styles.discountImg} />
      </div>

      {/* HOT badge — top left */}
      {deal.is_hot && <div className={styles.hotBadge}>🔥 HOT</div>}

      {/* Right-side action buttons (TikTok style) */}
      <div className={styles.sideActions}>
        <button className={styles.sideBtn} onClick={() => onChat?.(deal)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chat</span>
        </button>
        <button className={styles.sideBtn} onClick={() => setReviewsOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{dealReviews.length || ''}</span>
          <span>Reviews</span>
        </button>
        <button className={styles.sideBtn} onClick={() => setMenuOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>{deal.domain === 'food' ? 'Menu' : 'Catalogue'}</span>
        </button>
        <button className={styles.sideBtn} onClick={() => { try { navigator.share?.({ title: deal.title, text: `${deal.title} only ${fmtRp(deal.deal_price)}! 🔥`, url: window.location.href }) } catch {} }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="#fff" strokeWidth="1.5"/></svg>
          <span>Share</span>
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

        {/* Claim button */}
        <button
          className={`${styles.claimBtn} ${expired || pct >= 100 ? styles.claimBtnDisabled : ''}`}
          onClick={() => !expired && pct < 100 && onClaim?.(deal)}
          disabled={expired || pct >= 100}
        >
          {pct >= 100 ? 'Sold Out!' : expired ? 'Deal Ended' : `🔥 Claim Now — ${fmtRp(deal.deal_price)}`}
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

export default function DealHuntLanding({ open, onClose, onSelectDeal, onCreateDeal, onViewSeller }) {
  const [showLanding, setShowLanding] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [userTouched, setUserTouched] = useState(false)

  // Reset to landing page every time Deal Hunt opens
  useEffect(() => {
    if (open) {
      setShowLanding(true)
      setActiveIndex(0)
      setUserTouched(false)
    }
  }, [open])
  const containerRef = useRef(null)
  const autoScrollRef = useRef(null)
  const deals = DEMO_DEALS

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== activeIndex && idx >= 0 && idx < deals.length) setActiveIndex(idx)
  }, [activeIndex, deals.length])

  // Auto-scroll through all deals once on first load, stop when user touches
  useEffect(() => {
    if (!open || userTouched) return
    let current = 0
    autoScrollRef.current = setInterval(() => {
      current++
      if (current >= deals.length) {
        clearInterval(autoScrollRef.current)
        // Scroll back to first deal
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      containerRef.current?.scrollTo({
        top: current * window.innerHeight,
        behavior: 'smooth',
      })
    }, 3000) // 3 seconds per deal
    return () => clearInterval(autoScrollRef.current)
  }, [open, userTouched, deals.length])

  // Stop auto-scroll on any touch
  const handleTouch = useCallback(() => {
    if (!userTouched) {
      setUserTouched(true)
      clearInterval(autoScrollRef.current)
    }
  }, [userTouched])

  if (!open) return null

  return createPortal(
    <div className={styles.screen} onTouchStart={handleTouch} onMouseDown={handleTouch}>

      {/* ── Landing splash ── */}
      {showLanding && (
        <div className={styles.landingSplash}>
          <img src={LANDING_BG} alt="" className={styles.landingBgImg} />
          <div className={styles.landingOverlay} />

          {/* Header */}
          <div className={styles.landingHeader}>
            <div className={styles.landingHeaderTop}>
              <span className={styles.landingHeaderBrand}>DEAL <span>HUNT</span></span>
              <span className={styles.landingHeaderLive}>● LIVE</span>
            </div>
            <p className={styles.landingHeaderSub}>Best Deals In Yogyakarta</p>

            {/* Running text ticker */}
            <div className={styles.landingTicker}>
              <div className={styles.landingTickerInner}>
                {[
                  { icon: '🔥', text: 'Sarah claimed Nasi Goreng deal · 2m ago' },
                  { icon: '💰', text: 'Budi grabbed Leather Wallet · 5m ago' },
                  { icon: '⚡', text: '87% claimed on Bakso Jumbo!' },
                  { icon: '🆕', text: 'New massage deal just dropped · 1m ago' },
                  { icon: '%', text: 'Wireless Earbuds 38% off · ending soon' },
                  { icon: '🔥', text: 'Couple Massage 40% off · 8 claimed' },
                  { icon: '💰', text: 'Honda Vario rental deal · 35% off' },
                  { icon: '⚡', text: 'Flash deal on Ojek Bandara!' },
                ].map((t, i) => (
                  <span key={i} className={styles.landingTickerItem}>
                    <span className={styles.landingTickerIcon}>{t.icon}</span>{t.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Side nav — Home + Join */}
          <div className={styles.landingSideNav}>
            <button className={styles.landingSideBtn} onClick={onClose}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
            <button className={styles.landingSideBtn} onClick={() => { setShowLanding(false); onCreateDeal?.() }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span>Join</span>
            </button>
          </div>

          <div className={styles.landingContent}>
            <h1 className={styles.landingTitle}>DEAL <span>HUNT</span></h1>
            <p className={styles.landingSub}>Get the best deals across all categories — food, products, services & more</p>
            <div className={styles.landingBtnWrap}>
              <div className={styles.fireParticles}>
                {[...Array(6)].map((_, i) => (
                  <span key={i} className={styles.fireParticle} style={{ '--i': i }} />
                ))}
              </div>
              <button className={styles.landingBtn} onClick={() => setShowLanding(false)}>
                Start Hunting 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      {!showLanding && <button className={styles.backBtn} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>}

      {/* Title + category/city context */}
      {!showLanding && <div className={styles.headerTitle}>
        <span className={styles.headerBrand}>DEAL <span style={{ color: '#8DC63F' }}>HUNT</span></span>
        <span className={styles.headerLive}>● LIVE</span>
      </div>}

      {/* Hide feed + header sub when landing is showing */}
      {showLanding && <style>{`.${styles.headerSub}, .${styles.feed}, .${styles.fab} { display: none !important; }`}</style>}
      <div className={styles.headerSub}>
        <span className={styles.headerCategory}>{DOMAIN_LABELS[deals[activeIndex]?.domain] ?? ''}</span>
        <span className={styles.headerDot}>·</span>
        <span className={styles.headerCity}>{deals[activeIndex]?.city ?? 'Indonesia'}</span>
      </div>

      {/* Snap-scroll vertical feed */}
      <div className={styles.feed} ref={containerRef} onScroll={handleScroll}>
        {deals.map((deal, i) => (
          <DealSlide
            key={deal.id}
            deal={deal}
            isActive={i === activeIndex}
            onClaim={(d) => onSelectDeal?.(d)}
            onChat={(d) => onSelectDeal?.(d)}
            onOpenMenu={(d) => onViewSeller?.(d)}
          />
        ))}
      </div>

      {/* FAB — create deal */}
      <button className={styles.fab} onClick={onCreateDeal}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>,
    document.body
  )
}
