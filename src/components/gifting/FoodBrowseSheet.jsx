/**
 * FoodBrowseSheet.jsx
 *
 * Restaurant picker scoped to the RECIPIENT's city (not the buyer's).
 * Tapping a menu item opens FoodOrderSheet pre-filled so the buyer
 * can send a meal anonymously. Recipient's address is never revealed.
 *
 * Data: queries `restaurants` table filtered by recipientCity.
 * Falls back to demo data when Supabase is unavailable.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FoodOrderSheet from './FoodOrderSheet'
import styles from './FoodBrowseSheet.module.css'

const CUISINE_EMOJIS = {
  noodles:  '🍜', rice: '🍚', meatball: '🍖', soup: '🥣',
  burger:   '🍔', pizza: '🍕', snacks: '🍿', drinks: '🥤',
  dessert:  '🍨', default: '🍽️',
}

const DEMO_RESTAURANTS = [
  {
    id: 'r1', name: 'Warung Soto Betawi', cuisine_type: 'soup', city: 'Jakarta',
    cover_image: null, is_open: true, rating: 4.7,
    menu_items: [
      { id: 'm1', name: 'Soto Betawi', price: 28000, image: null, description: 'Rich coconut milk beef soup' },
      { id: 'm2', name: 'Nasi Uduk',   price: 18000, image: null, description: 'Fragrant coconut rice' },
    ],
  },
  {
    id: 'r2', name: 'Mie Ayam Pak Budi', cuisine_type: 'noodles', city: 'Jakarta',
    cover_image: null, is_open: true, rating: 4.5,
    menu_items: [
      { id: 'm3', name: 'Mie Ayam',       price: 22000, image: null, description: 'Chicken noodle bowl' },
      { id: 'm4', name: 'Bakso Campur',   price: 25000, image: null, description: 'Mixed meatball soup' },
    ],
  },
  {
    id: 'r3', name: 'Nasi Padang Bu Sari', cuisine_type: 'rice', city: 'Jakarta',
    cover_image: null, is_open: false, rating: 4.8,
    menu_items: [
      { id: 'm5', name: 'Rendang Sapi',   price: 35000, image: null, description: 'Slow-cooked beef rendang' },
      { id: 'm6', name: 'Ayam Pop',       price: 28000, image: null, description: 'Steamed Padang-style chicken' },
    ],
  },
]

export default function FoodBrowseSheet({ open, recipientCity, giftFor, onClose, showToast }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState(null)   // restaurant id
  const [orderItem,   setOrderItem]   = useState(null)   // { product, seller }
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    if (!open) return
    setSearch(''); setExpanded(null); setOrderItem(null)
    fetchRestaurants()
  }, [open, recipientCity]) // eslint-disable-line

  async function fetchRestaurants() {
    setLoading(true)
    if (!supabase) { setRestaurants(DEMO_RESTAURANTS); setLoading(false); return }

    let q = supabase
      .from('restaurants')
      .select('*, menu_items(*)')
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .limit(30)

    // Filter by recipient city — show all if city unknown
    if (recipientCity) {
      q = q.ilike('city', `%${recipientCity}%`)
    }

    const { data, error } = await q
    if (error || !data?.length) {
      setRestaurants(DEMO_RESTAURANTS)
    } else {
      setRestaurants(data)
    }
    setLoading(false)
  }

  const filtered = restaurants.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine_type?.toLowerCase().includes(search.toLowerCase())
  )

  if (!open) return null

  return (
    <>
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.title}>🍔 Order Food</span>
            <span className={styles.sub}>
              Restaurants near {recipientCity ?? 'their location'} — delivered to them anonymously
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search restaurants or cuisine…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className={styles.list}>
          {loading ? (
            <div className={styles.loading}>Finding restaurants nearby…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji}>🍽️</span>
              <p>No restaurants found near {recipientCity ?? 'their location'}.</p>
            </div>
          ) : filtered.map(r => {
            const emoji   = CUISINE_EMOJIS[r.cuisine_type] ?? CUISINE_EMOJIS.default
            const isOpen  = r.is_open !== false
            const isExp   = expanded === r.id
            return (
              <div key={r.id} className={`${styles.card} ${!isOpen ? styles.cardClosed : ''}`}>
                {/* Restaurant row */}
                <button className={styles.cardRow} onClick={() => setExpanded(isExp ? null : r.id)}>
                  <div className={styles.cardThumb}>
                    {r.cover_image
                      ? <img src={r.cover_image} alt={r.name} className={styles.cardImg} />
                      : <span className={styles.cardEmoji}>{emoji}</span>
                    }
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{r.name}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardCuisine}>{emoji} {r.cuisine_type ?? 'Food'}</span>
                      {r.rating && <span className={styles.cardRating}>⭐ {Number(r.rating).toFixed(1)}</span>}
                      <span className={`${styles.cardStatus} ${isOpen ? styles.cardStatusOpen : styles.cardStatusClosed}`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <span className={styles.chevron}>{isExp ? '▲' : '▼'}</span>
                </button>

                {/* Menu items */}
                {isExp && isOpen && (
                  <div className={styles.menu}>
                    {(!r.menu_items || r.menu_items.length === 0) ? (
                      <div className={styles.menuEmpty}>No menu items yet</div>
                    ) : r.menu_items.map(item => (
                      <button
                        key={item.id}
                        className={styles.menuItem}
                        onClick={() => setOrderItem({
                          product: {
                            id:       item.id,
                            name:     item.name,
                            price:    item.price,
                            image:    item.image ?? null,
                            currency: 'IDR',
                          },
                          seller: {
                            id:        r.id,
                            brandName: r.name,
                            city:      r.city,
                          },
                        })}
                      >
                        <div className={styles.menuItemLeft}>
                          {item.image
                            ? <img src={item.image} alt={item.name} className={styles.menuImg} />
                            : <span className={styles.menuImgFallback}>{emoji}</span>
                          }
                          <div className={styles.menuItemBody}>
                            <div className={styles.menuItemName}>{item.name}</div>
                            {item.description && <div className={styles.menuItemDesc}>{item.description}</div>}
                          </div>
                        </div>
                        <div className={styles.menuItemPrice}>
                          Rp {Number(item.price).toLocaleString('id-ID')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {isExp && !isOpen && (
                  <div className={styles.closedNote}>This restaurant is currently closed</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>

    {/* Food order checkout */}
    {orderItem && (
      <FoodOrderSheet
        open={!!orderItem}
        product={orderItem.product}
        seller={orderItem.seller}
        giftFor={giftFor}
        onClose={() => setOrderItem(null)}
        showToast={showToast}
      />
    )}
    </>
  )
}
