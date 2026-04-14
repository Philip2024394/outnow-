/**
 * FoodBrowseSheet.jsx
 *
 * Restaurant picker scoped to the recipient's city.
 * Users can add multiple items from ONE restaurant to a cart,
 * then checkout via FoodOrderSheet.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FoodOrderSheet from './FoodOrderSheet'
import styles from './FoodBrowseSheet.module.css'

const CUISINE_EMOJIS = {
  noodles: '🍜', rice: '🍚', meatball: '🍖', soup: '🥣',
  burger:  '🍔', pizza: '🍕', snacks: '🍿', drinks: '🥤',
  dessert: '🍨', default: '🍽️',
}

const DEMO_RESTAURANTS = [
  {
    id: 'r1', name: 'Warung Soto Betawi', cuisine_type: 'soup', city: 'Jakarta',
    cover_image: null, is_open: true, rating: 4.7,
    menu_items: [
      { id: 'm1', name: 'Soto Betawi',  price: 28000, image: null, description: 'Rich coconut milk beef soup' },
      { id: 'm2', name: 'Nasi Uduk',    price: 18000, image: null, description: 'Fragrant coconut rice' },
      { id: 'm9', name: 'Teh Botol',    price: 8000,  image: null, description: 'Chilled sweet tea' },
      { id: 'm10', name: 'Es Jeruk',    price: 10000, image: null, description: 'Fresh orange juice' },
    ],
  },
  {
    id: 'r2', name: 'Mie Ayam Pak Budi', cuisine_type: 'noodles', city: 'Jakarta',
    cover_image: null, is_open: true, rating: 4.5,
    menu_items: [
      { id: 'm3', name: 'Mie Ayam',     price: 22000, image: null, description: 'Chicken noodle bowl' },
      { id: 'm4', name: 'Bakso Campur', price: 25000, image: null, description: 'Mixed meatball soup' },
      { id: 'm11', name: 'Pangsit Goreng', price: 12000, image: null, description: 'Crispy fried wonton' },
      { id: 'm12', name: 'Es Teh',      price: 7000,  image: null, description: 'Iced sweet tea' },
    ],
  },
  {
    id: 'r3', name: 'Nasi Padang Bu Sari', cuisine_type: 'rice', city: 'Jakarta',
    cover_image: null, is_open: false, rating: 4.8,
    menu_items: [
      { id: 'm5', name: 'Rendang Sapi', price: 35000, image: null, description: 'Slow-cooked beef rendang' },
      { id: 'm6', name: 'Ayam Pop',     price: 28000, image: null, description: 'Steamed Padang-style chicken' },
    ],
  },
]

const EMPTY_CART = { restaurantId: null, restaurantName: null, items: {} }

export default function FoodBrowseSheet({ open, recipientCity, giftFor, onClose, showToast }) {
  const [restaurants,      setRestaurants]      = useState([])
  const [loading,          setLoading]          = useState(true)
  const [expanded,         setExpanded]         = useState(null)
  const [orderItem,        setOrderItem]        = useState(null)
  const [search,           setSearch]           = useState('')
  const [cart,             setCart]             = useState(EMPTY_CART)
  const [clearConfirm,     setClearConfirm]     = useState(null) // { restaurant, item }

  useEffect(() => {
    if (!open) return
    setSearch(''); setExpanded(null); setOrderItem(null); setCart(EMPTY_CART)
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

    if (recipientCity) q = q.ilike('city', `%${recipientCity}%`)

    const { data, error } = await q
    setRestaurants((!error && data?.length) ? data : DEMO_RESTAURANTS)
    setLoading(false)
  }

  // ── Cart logic ────────────────────────────────────────────────────────────

  function addToCart(restaurant, item) {
    // Different restaurant — ask first
    if (cart.restaurantId && cart.restaurantId !== restaurant.id) {
      setClearConfirm({ restaurant, item })
      return
    }
    doAdd(restaurant, item)
  }

  function doAdd(restaurant, item) {
    setCart(prev => ({
      restaurantId:   restaurant.id,
      restaurantName: restaurant.name,
      items: {
        ...prev.items,
        [item.id]: prev.items[item.id]
          ? { ...prev.items[item.id], qty: prev.items[item.id].qty + 1 }
          : { ...item, qty: 1 },
      },
    }))
    setClearConfirm(null)
  }

  function removeFromCart(itemId) {
    setCart(prev => {
      const updated = { ...prev.items }
      if (updated[itemId]?.qty > 1) {
        updated[itemId] = { ...updated[itemId], qty: updated[itemId].qty - 1 }
      } else {
        delete updated[itemId]
      }
      const hasItems = Object.keys(updated).length > 0
      return hasItems
        ? { ...prev, items: updated }
        : EMPTY_CART
    })
  }

  const cartItems    = Object.values(cart.items)
  const cartCount    = cartItems.reduce((s, i) => s + i.qty, 0)
  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)

  function handleViewCart() {
    setOrderItem({
      items:  cartItems,
      seller: { id: cart.restaurantId, brandName: cart.restaurantName },
    })
  }

  const filtered = restaurants.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine_type?.toLowerCase().includes(search.toLowerCase())
  )

  if (!open) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>

          <div className={styles.handle} />

          <div className={styles.header}>
            <div className={styles.headerText}>
              <span className={styles.title}>Order Food</span>
              <span className={styles.sub}>
                Restaurants near {recipientCity ?? 'their location'} — delivered anonymously
              </span>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search restaurants or cuisine…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Restaurant list */}
          <div className={`${styles.list} ${cartCount > 0 ? styles.listWithCart : ''}`}>
            {loading ? (
              <div className={styles.loading}>Finding restaurants nearby…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyEmoji}>🍽️</span>
                <p>No restaurants found near {recipientCity ?? 'their location'}.</p>
              </div>
            ) : filtered.map(r => {
              const emoji  = CUISINE_EMOJIS[r.cuisine_type] ?? CUISINE_EMOJIS.default
              const isOpen = r.is_open !== false
              const isExp  = expanded === r.id

              return (
                <div key={r.id} className={`${styles.card} ${!isOpen ? styles.cardClosed : ''}`}>
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

                  {isExp && isOpen && (
                    <div className={styles.menu}>
                      {(!r.menu_items || r.menu_items.length === 0) ? (
                        <div className={styles.menuEmpty}>No menu items yet</div>
                      ) : r.menu_items.map(item => {
                        const qty = cart.restaurantId === r.id ? (cart.items[item.id]?.qty ?? 0) : 0
                        return (
                          <div key={item.id} className={styles.menuItem}>
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
                            <div className={styles.menuItemRight}>
                              <span className={styles.menuItemPrice}>
                                Rp {Number(item.price).toLocaleString('id-ID')}
                              </span>
                              {qty > 0 ? (
                                <div className={styles.qtyRow}>
                                  <button className={styles.qtyBtn} onClick={() => removeFromCart(item.id)}>−</button>
                                  <span className={styles.qtyVal}>{qty}</span>
                                  <button className={styles.qtyBtn} onClick={() => addToCart(r, item)}>+</button>
                                </div>
                              ) : (
                                <button className={styles.addBtn} onClick={() => addToCart(r, item)}>+</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {isExp && !isOpen && (
                    <div className={styles.closedNote}>This restaurant is currently closed</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Floating cart bar ── */}
          {cartCount > 0 && (
            <div className={styles.cartBar}>
              <div className={styles.cartBarLeft}>
                <span className={styles.cartBarCount}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                <span className={styles.cartBarFrom}>{cart.restaurantName}</span>
              </div>
              <span className={styles.cartBarTotal}>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
              <button className={styles.cartBarBtn} onClick={handleViewCart}>
                View Order →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Different-restaurant confirmation ── */}
      {clearConfirm && (
        <div className={styles.confirmBackdrop} onClick={() => setClearConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Start a new order?</p>
            <p className={styles.confirmSub}>
              Adding from <strong>{clearConfirm.restaurant.name}</strong> will clear your current cart from <strong>{cart.restaurantName}</strong>.
            </p>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmKeep} onClick={() => setClearConfirm(null)}>Keep current</button>
              <button className={styles.confirmNew} onClick={() => doAdd(clearConfirm.restaurant, clearConfirm.item)}>Start new order</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout ── */}
      {orderItem && (
        <FoodOrderSheet
          open={!!orderItem}
          items={orderItem.items}
          seller={orderItem.seller}
          giftFor={giftFor}
          onClose={() => setOrderItem(null)}
          showToast={showToast}
        />
      )}
    </>
  )
}
