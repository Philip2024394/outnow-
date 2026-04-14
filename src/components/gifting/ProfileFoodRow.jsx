/**
 * ProfileFoodRow.jsx
 * Horizontal menu slider showing ALL available dishes from all restaurants.
 * - Fetches from Supabase `restaurants` table (falls back to demo data)
 * - Background image cycles every 5 s
 * - Tap any dish → onOrder(item) → FoodOrderSheet opens (anonymous gift checkout)
 * - "Browse All →" pill at end → onBrowse() → FoodBrowseSheet
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ProfileFoodRow.module.css'

// ── Demo restaurants with real food images ────────────────────────────────────
const DEMO_RESTAURANTS = [
  {
    id: 'r1', name: 'Warung Soto Betawi', cuisine_type: 'soup', is_open: true,
    menu_items: [
      { id: 'm1', name: 'Soto Betawi',    price: 28000, image: null },
      { id: 'm2', name: 'Nasi Uduk',      price: 18000, image: null },
    ],
  },
  {
    id: 'r2', name: 'Mie Ayam Pak Budi', cuisine_type: 'noodles', is_open: true,
    menu_items: [
      { id: 'm3', name: 'Mie Ayam',       price: 22000, image: 'https://ik.imagekit.io/nepgaxllc/mie-ayam.jpg' },
      { id: 'm4', name: 'Bakso Campur',   price: 25000, image: null },
    ],
  },
  {
    id: 'r3', name: 'Nasi Padang Bu Sari', cuisine_type: 'rice', is_open: true,
    menu_items: [
      { id: 'm5', name: 'Rendang Sapi',   price: 35000, image: null },
      { id: 'm6', name: 'Ayam Pop',       price: 28000, image: null },
    ],
  },
  {
    id: 'r4', name: 'Bangkok Street', cuisine_type: 'noodles', is_open: true,
    menu_items: [
      { id: 'm7', name: 'Pad Thai Prawn', price: 72000, image: null },
      { id: 'm8', name: 'Tom Yum Soup',   price: 65000, image: null },
    ],
  },
  {
    id: 'r5', name: 'Kafe Hijau', cuisine_type: 'drinks', is_open: true,
    menu_items: [
      { id: 'm9',  name: 'Matcha Latte',  price: 38000, image: null },
      { id: 'm10', name: 'Cold Brew',     price: 32000, image: null },
    ],
  },
  {
    id: 'r6', name: 'Burger Republic', cuisine_type: 'burger', is_open: true,
    menu_items: [
      { id: 'm11', name: 'Classic Burger', price: 55000, image: null },
      { id: 'm12', name: 'Crispy Chicken', price: 52000, image: null },
    ],
  },
]

const BG_IMAGES = [
  'https://ik.imagekit.io/nepgaxllc/Fast%20food%20feast%20with%20delivery%20vibes.png',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=70',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=70',
]

const CUISINE_EMOJI = {
  soup: '🥣', rice: '🍚', noodles: '🍜', burger: '🍔',
  pizza: '🍕', drinks: '🥤', dessert: '🍨', default: '🍽️',
}

function fmtIDR(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

export default function ProfileFoodRow({ recipientCity, showToast, onOrder, onBrowse }) {
  const [menuItems, setMenuItems] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [bgIdx,     setBgIdx]     = useState(0)
  const [bgStamp,   setBgStamp]   = useState(Date.now())

  // Fetch all restaurant menu items
  useEffect(() => {
    async function load() {
      setLoading(true)
      let restaurants = DEMO_RESTAURANTS

      if (supabase) {
        let q = supabase
          .from('restaurants')
          .select('id, name, cuisine_type, is_open, menu_items(*)')
          .eq('status', 'approved')
          .order('rating', { ascending: false })
          .limit(20)
        if (recipientCity) q = q.ilike('city', `%${recipientCity}%`)
        const { data } = await q
        if (data?.length) restaurants = data
      }

      // Flatten: one entry per menu item, open restaurants first
      const flat = restaurants
        .filter(r => r.is_open !== false)
        .flatMap(r =>
          (r.menu_items ?? []).map(item => ({
            _itemId:      item.id,
            _restaurantId: r.id,
            product_id:   item.id,
            product_name: item.name,
            product_price: item.price,
            product_currency: 'IDR',
            product_image: item.image ?? null,
            seller_id:    r.id,
            seller_name:  r.name,
            seller_wa:    r.whatsapp ?? null,
            _emoji:       CUISINE_EMOJI[r.cuisine_type] ?? CUISINE_EMOJI.default,
          }))
        )

      setMenuItems(flat)
      setLoading(false)
    }
    load()
  }, [recipientCity])

  // Cycle background every 5 s
  useEffect(() => {
    if (BG_IMAGES.length < 2) return
    const id = setInterval(() => {
      setBgIdx(i => (i + 1) % BG_IMAGES.length)
      setBgStamp(Date.now())
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const bgUrl = `${BG_IMAGES[bgIdx]}?t=${bgStamp}`

  const handleOrder = (item) => {
    if (!onOrder) { showToast?.('Ordering unavailable', 'error'); return }
    onOrder(item)
  }

  return (
    <div className={styles.row}>
      {/* Cycling background */}
      <div className={styles.rowBg} style={{ backgroundImage: `url("${bgUrl}")` }} />

      {/* Label */}
      <div className={styles.label}>
        <span className={styles.labelEmoji}>🍔</span>
        <span className={styles.labelText}>Order Food</span>
        {!loading && menuItems.length > 0 && (
          <span className={styles.labelCount}>{menuItems.length} dishes</span>
        )}
      </div>

      {/* Horizontal scroll of all menu items */}
      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.loadingChip}>Finding dishes…</div>
        ) : menuItems.length === 0 ? (
          <div className={styles.loadingChip}>No dishes available nearby</div>
        ) : (
          menuItems.map(item => (
            <button
              key={item._itemId}
              className={styles.item}
              onClick={() => handleOrder(item)}
            >
              {item.product_image
                ? <img src={item.product_image} alt={item.product_name} className={styles.itemImg} />
                : <div className={styles.itemImgFallback}>{item._emoji}</div>
              }
              <div className={styles.itemName}>{item.product_name}</div>
              <div className={styles.itemRestaurant}>{item.seller_name}</div>
              <div className={styles.itemPrice}>{fmtIDR(item.product_price)}</div>
            </button>
          ))
        )}

        {/* Browse full sheet at the end */}
        {onBrowse && !loading && (
          <button className={styles.browseBtn} onClick={onBrowse}>
            <span className={styles.browseBtnIcon}>🍽️</span>
            <span className={styles.browseBtnLabel}>Browse All</span>
            <span className={styles.browseBtnArrow}>→</span>
          </button>
        )}
      </div>

      <div className={styles.hint}>Tap any dish to send it anonymously 🎁</div>
    </div>
  )
}
