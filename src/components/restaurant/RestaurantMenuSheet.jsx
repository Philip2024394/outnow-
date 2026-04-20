import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './RestaurantMenuSheet.module.css'
import WeeklyPromoSheet from './WeeklyPromoSheet'
import PaymentCard from './PaymentCard'
import FoodOrderStatus from '@/components/orders/FoodOrderStatus'
import { createFoodOrder, searchFoodDrivers } from '@/services/foodOrderService'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

// ── Demo food orders seed ──────────────────────────────────────────────────────
const DEMO_FOOD_ORDERS = [
  { id: 'food-001', restaurant: 'Warung Mak Beng', items: [{name: 'Nasi Goreng', qty: 2, price: 25000}], total: 60000, delivery: 10000, status: 'delivered', created_at: '2026-04-19T10:00:00Z' },
  { id: 'food-002', restaurant: 'Babi Guling Pak Malen', items: [{name: 'Babi Guling Set', qty: 1, price: 45000}], total: 55000, delivery: 10000, status: 'preparing', created_at: '2026-04-20T08:30:00Z' },
  { id: 'food-003', restaurant: 'Ayam Betutu Men Tempeh', items: [{name: 'Ayam Betutu', qty: 1, price: 55000}, {name: 'Es Jeruk', qty: 2, price: 8000}], total: 81000, delivery: 10000, status: 'pending', created_at: '2026-04-20T09:00:00Z' },
]

function seedDemoOrders() {
  const existing = localStorage.getItem('indoo_food_orders')
  if (!existing) {
    localStorage.setItem('indoo_food_orders', JSON.stringify(DEMO_FOOD_ORDERS))
    return DEMO_FOOD_ORDERS
  }
  return JSON.parse(existing)
}

function getFoodOrders() {
  return seedDemoOrders()
}

function saveFoodOrders(orders) {
  localStorage.setItem('indoo_food_orders', JSON.stringify(orders))
}

const STATUS_COLORS = {
  pending: '#F59E0B',
  awaiting_payment: '#F59E0B',
  preparing: '#3B82F6',
  on_delivery: '#8B5CF6',
  delivered: '#22C55E',
  cancelled: '#EF4444',
}

const STATUS_LABELS = {
  pending: 'Pending',
  awaiting_payment: 'Awaiting Payment',
  preparing: 'Preparing',
  on_delivery: 'On Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const EVENT_LABELS = {
  live_music:    '🎵 Live Music',
  birthday_setup:'🎂 Birthday Setup',
  private_room:  '🚪 Private Room',
  sound_system:  '🎤 Sound System',
  party_package: '🥂 Party Packages',
  wedding:       '💍 Weddings',
}

const CATEGORY_EMOJIS = {
  'Main':     '🍽',
  'Drinks':   '🥤',
  'Snacks':   '🍿',
  'Sides':    '🥗',
  'Desserts': '🧁',
  'Rice':     '🍚',
  'Noodles':  '🍜',
  'Grilled':  '🔥',
  'Seafood':  '🦐',
  'Breakfast':'🌅',
  'Soup':     '🍲',
  'Salad':    '🥗',
}

const CATEGORY_GRADIENTS = {
  'Main':     'linear-gradient(160deg, #1a0d00 0%, #0d0d0d 100%)',
  'Drinks':   'linear-gradient(160deg, #000d1a 0%, #0d0d0d 100%)',
  'Snacks':   'linear-gradient(160deg, #0d1a00 0%, #0d0d0d 100%)',
  'Sides':    'linear-gradient(160deg, #1a1500 0%, #0d0d0d 100%)',
  'Desserts': 'linear-gradient(160deg, #1a0015 0%, #0d0d0d 100%)',
}

function buildWhatsAppMessage(restaurant, cart, address, deliveryFare, maxPrepMin) {
  const lines = cart.map(i => {
    let line = `• ${i.name} × ${i.qty} — ${fmtRp(i.price * i.qty)}`
    if (i.prep_time_min) line += ` (${i.prep_time_min} min prep)`
    if (i.note?.trim())  line += `\n   📝 ${i.note.trim()}`
    return line
  })
  const foodTotal  = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const grandTotal = foodTotal + (deliveryFare ?? 0)
  const ref        = `#MAKAN_${Date.now().toString().slice(-8)}`
  const msg = [
    `🍽 *Order from ${restaurant.name}*`,
    `MAKAN by Indoo — ${ref}`,
    '———————————————',
    ...lines,
    '———————————————',
    maxPrepMin > 0 ? `⏱ Est. prep time: ${maxPrepMin} min` : '',
    `🍴 Food total: ${fmtRp(foodTotal)}`,
    deliveryFare != null ? `🛵 Est. delivery: ~${fmtRp(deliveryFare)}` : '🛵 Delivery: calculating',
    `💰 *Est. total: ~${fmtRp(grandTotal)}*`,
    address ? `📍 Deliver to: ${address}` : '',
  ].filter(Boolean).join('\n')
  return { msg, ref }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantMenuSheet({ restaurant, onClose, onOrderViaChat }) {
  const items      = restaurant.menu_items ?? []
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const [cart,           setCart]           = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartExpanded,   setCartExpanded]   = useState(false)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [eventsOpen,     setEventsOpen]     = useState(false)
  const [socialsOpen,    setSocialsOpen]    = useState(false)
  const [address,        setAddress]        = useState('')
  const [showAddrInput,  setShowAddrInput]  = useState(false)
  const [editingNoteId,  setEditingNoteId]  = useState(null)
  const [promosOpen,     setPromosOpen]     = useState(false)
  const [locating,       setLocating]       = useState(false)
  const [paymentData,    setPaymentData]    = useState(null)  // { total, orderRef }
  const [ordersOpen,     setOrdersOpen]     = useState(false)
  const [foodOrders,     setFoodOrders]     = useState([])
  const [orderProcessing, setOrderProcessing] = useState(false)
  const [orderConfirm,   setOrderConfirm]   = useState(null)   // { id, total, estimatedMin }
  const [reviewOrder,    setReviewOrder]    = useState(null)    // order to review
  const [reviewStars,    setReviewStars]    = useState(0)
  const [reviewComment,  setReviewComment]  = useState('')
  const [toast,          setToast]          = useState(null)
  const [paymentStep,    setPaymentStep]    = useState(false)   // show payment step on confirmation
  const [paymentProofFile, setPaymentProofFile] = useState(null)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [driverSearching, setDriverSearching] = useState(false)
  const [assignedDriver,  setAssignedDriver]  = useState(null)
  const [trackingOrder,   setTrackingOrder]   = useState(null)

  const feedRef     = useRef(null)
  const itemRefs    = useRef([])
  const collapseRef = useRef(null)

  // ── Cart persistence — restore on mount, save on change, auto-clear 24 h ──
  const CART_KEY = `makan_cart_${restaurant.id}`
  const CART_TTL = 24 * 60 * 60 * 1000
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY))
      if (saved && Date.now() - saved.ts < CART_TTL) setCart(saved.cart)
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cart.length > 0) localStorage.setItem(CART_KEY, JSON.stringify({ cart, ts: Date.now() }))
    else localStorage.removeItem(CART_KEY)
  }, [cart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load food orders on mount (seeds demo if empty)
  useEffect(() => { setFoodOrders(getFoodOrders()) }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Filter items by active category
  const visibleItems = activeCategory
    ? items.filter(i => i.category === activeCategory)
    : items

  // ── Cart helpers ──
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
    // Spring open + auto-collapse after 2.5s
    setCartExpanded(true)
    clearTimeout(collapseRef.current)
    collapseRef.current = setTimeout(() => setCartExpanded(false), 2500)
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id)
      return ex?.qty <= 1
        ? prev.filter(c => c.id !== id)
        : prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const updateNote = (id, note) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c))
  }

  const cartCount   = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFare = restaurant.deliveryFare ?? null
  const grandTotal  = cartTotal + (deliveryFare ?? 0)
  const maxPrepMin  = cart.length > 0
    ? Math.max(...cart.map(i => i.prep_time_min ?? 0))
    : 0
  const qtyFor = (id) => cart.find(c => c.id === id)?.qty ?? 0

  // ── Jump to category in feed ──
  const jumpToCategory = useCallback((cat) => {
    setActiveCategory(cat)
    setDrawerOpen(false)
    // Small delay so filtered items render before scroll
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = 0
    }, 60)
  }, [])

  // ── GPS location → address ──
  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          setAddress(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
        } catch {
          setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  // ── Cancel a pending order ──
  const handleCancelOrder = (orderId) => {
    const orders = getFoodOrders().map(o =>
      o.id === orderId && (o.status === 'pending' || o.status === 'awaiting_payment')
        ? { ...o, status: 'cancelled' }
        : o
    )
    saveFoodOrders(orders)
    setFoodOrders(orders)
    setToast('Order cancelled')
  }

  // ── Submit review for delivered order ──
  const handleSubmitReview = () => {
    if (!reviewStars || !reviewOrder) return
    const reviews = JSON.parse(localStorage.getItem('indoo_food_reviews') || '[]')
    reviews.push({
      order_id: reviewOrder.id,
      restaurant: reviewOrder.restaurant,
      stars: reviewStars,
      comment: reviewComment.trim() || null,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('indoo_food_reviews', JSON.stringify(reviews))
    setReviewOrder(null)
    setReviewStars(0)
    setReviewComment('')
    setToast('Thank you for your review!')
  }

  // ── Payment proof upload + driver assignment ──
  const fileInputRef = useRef(null)

  const handlePaymentProofUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) setPaymentProofFile(file)
  }

  const handleSubmitPayment = async () => {
    if (!orderConfirm) return
    setPaymentSubmitted(true)

    // Update order status in localStorage
    const orders = getFoodOrders()
    const updatedOrders = orders.map(o =>
      o.id === orderConfirm.id ? { ...o, status: o.payment_method === 'cod' ? 'cod_pending' : 'payment_submitted', payment_method: o.payment_method || 'transfer' } : o
    )
    saveFoodOrders(updatedOrders)
    setFoodOrders(updatedOrders)

    // Search for driver and assign
    setDriverSearching(true)
    try {
      const drivers = await searchFoodDrivers(restaurant.lat, restaurant.lng)
      let driver = drivers?.[0] ?? null

      // Demo fallback — always provide a driver
      if (!driver) {
        driver = { id: 'driver-demo', display_name: 'Pak Andi', phone: '081234567890', vehicle_model: 'Honda Beat' }
      }

      setAssignedDriver(driver)

      // Build order data for createFoodOrder
      const currentOrder = updatedOrders.find(o => o.id === orderConfirm.id)
      try {
        const createdOrder = await createFoodOrder({
          restaurant,
          items: currentOrder?.items ?? [],
          driver,
          sender: null,
          deliveryFee: currentOrder?.delivery ?? 10000,
          deliveryDistanceKm: null,
          driverDistanceKm: null,
          comment: null,
        })

        // Update localStorage order with driver info
        const finalOrders = getFoodOrders().map(o =>
          o.id === orderConfirm.id ? {
            ...o,
            status: 'driver_heading',
            driver_name: driver.display_name ?? driver.name,
            driver_phone: driver.phone,
            driver_vehicle: driver.vehicle_model ?? driver.vehicle,
            driver_id: driver.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address ?? null,
            delivery_address: currentOrder?.address ?? null,
            cash_ref: createdOrder?.cash_ref ?? `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          } : o
        )
        saveFoodOrders(finalOrders)
        setFoodOrders(finalOrders)
      } catch {
        // Local fallback — still assign driver even if createFoodOrder fails (demo mode)
        const finalOrders = getFoodOrders().map(o =>
          o.id === orderConfirm.id ? {
            ...o,
            status: 'driver_heading',
            driver_name: driver.display_name ?? driver.name,
            driver_phone: driver.phone,
            driver_vehicle: driver.vehicle_model ?? driver.vehicle,
            driver_id: driver.id,
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address ?? null,
            delivery_address: currentOrder?.address ?? null,
            cash_ref: `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          } : o
        )
        saveFoodOrders(finalOrders)
        setFoodOrders(finalOrders)
      }

      // Save a notification for restaurant alert
      const notifs = JSON.parse(localStorage.getItem('indoo_notifications') || '[]')
      notifs.unshift({
        id: `notif-${Date.now()}`,
        type: 'food_order_incoming',
        orderId: orderConfirm.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items: currentOrder?.items ?? [],
        total: currentOrder?.total ?? orderConfirm.total,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('indoo_notifications', JSON.stringify(notifs))

    } catch {
      // Fallback demo driver
      const demoDriver = { id: 'driver-demo', display_name: 'Pak Andi', phone: '081234567890', vehicle_model: 'Honda Beat' }
      setAssignedDriver(demoDriver)
      const finalOrders = getFoodOrders().map(o =>
        o.id === orderConfirm.id ? {
          ...o,
          status: 'driver_heading',
          driver_name: demoDriver.display_name,
          driver_phone: demoDriver.phone,
          driver_vehicle: demoDriver.vehicle_model,
          driver_id: demoDriver.id,
          restaurant_name: restaurant.name,
        } : o
      )
      saveFoodOrders(finalOrders)
      setFoodOrders(finalOrders)
    } finally {
      setDriverSearching(false)
    }
  }

  const handleOpenTracking = () => {
    const currentOrder = getFoodOrders().find(o => o.id === orderConfirm?.id)
    if (currentOrder) {
      setTrackingOrder(currentOrder)
      setOrderConfirm(null)
      setPaymentStep(false)
      setPaymentSubmitted(false)
      setAssignedDriver(null)
      setPaymentProofFile(null)
    }
  }

  // ── Order handler — Place Order with processing animation ──
  const handleOrder = () => {
    if (!showAddrInput) { setShowAddrInput(true); return }

    // Show processing animation
    setCartExpanded(false)
    setOrderProcessing(true)

    setTimeout(() => {
      const orderId = `FOOD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const order = {
        id: orderId,
        restaurant: restaurant.name,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: grandTotal,
        delivery: deliveryFare ?? 10000,
        status: 'pending',
        address: address || null,
        created_at: new Date().toISOString(),
      }

      const orders = getFoodOrders()
      orders.unshift(order)
      saveFoodOrders(orders)
      setFoodOrders(orders)

      setOrderProcessing(false)
      setOrderConfirm({
        id: orderId,
        total: grandTotal,
        estimatedMin: maxPrepMin + 20,
      })

      setCart([])
      setShowAddrInput(false)
    }, 2500)
  }

  useEffect(() => () => clearTimeout(collapseRef.current), [])

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{restaurant.name}</span>
          {activeCategory && (
            <button className={styles.clearCat} onClick={() => setActiveCategory(null)}>
              {activeCategory} · All items ×
            </button>
          )}
        </div>
      </div>

      {/* ── Growing cart badge (top-right) ── */}
      <div
        className={`${styles.cartBadge} ${cartExpanded ? styles.cartBadgeOpen : ''}`}
        onClick={() => {
          setCartExpanded(e => !e)
          clearTimeout(collapseRef.current)
        }}
      >
        {/* Icon row */}
        <div className={styles.cartBadgeTop}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
        </div>

        {/* Expanded: last 3 items + total + order */}
        {cartExpanded && cart.length > 0 && (
          <div className={styles.cartDropdown} onClick={e => e.stopPropagation()}>
            {cart.slice(-3).map(item => (
              <div key={item.id} className={styles.cartRowWrap}>
                <div className={styles.cartRow}>
                  <span className={styles.cartQty}>{item.qty}×</span>
                  <span className={styles.cartName}>{item.name}</span>
                  <span className={styles.cartPrice}>{fmtRp(item.price * item.qty)}</span>
                  <button
                    className={`${styles.cartEditBtn} ${editingNoteId === item.id ? styles.cartEditBtnActive : ''}`}
                    onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)}
                    title="Customise"
                  >✏</button>
                </div>

                {/* Existing note preview */}
                {item.note?.trim() && editingNoteId !== item.id && (
                  <span className={styles.cartNotePreview}>📝 {item.note}</span>
                )}

                {/* Inline note editor */}
                {editingNoteId === item.id && (
                  <div className={styles.cartNoteWrap}>
                    <input
                      className={styles.cartNoteInput}
                      placeholder="e.g. no chili, extra sauce, less rice…"
                      value={item.note ?? ''}
                      onChange={e => updateNote(item.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      maxLength={120}
                    />
                    <button
                      className={styles.cartNoteDone}
                      onClick={() => setEditingNoteId(null)}
                    >Done</button>
                  </div>
                )}
              </div>
            ))}
            {cart.length > 3 && (
              <span className={styles.cartMore}>+{cart.length - 3} more items</span>
            )}
            <div className={styles.cartDivider} />

            {/* Prep time */}
            {maxPrepMin > 0 && (
              <div className={styles.cartMeta}>
                <span className={styles.cartMetaIcon}>⏱</span>
                <span className={styles.cartMetaLabel}>Est. prep time</span>
                <span className={styles.cartMetaValue}>{maxPrepMin} min</span>
              </div>
            )}

            {/* Delivery fare — always shown */}
            <div className={styles.cartMeta}>
              <span className={styles.cartMetaIcon}>🛵</span>
              <span className={styles.cartMetaLabel}>Delivery</span>
              <span className={styles.cartMetaValue}>
                {deliveryFare !== null ? fmtRp(deliveryFare) : 'Calculating…'}
              </span>
            </div>

            <div className={styles.cartDivider} />

            <div className={styles.cartTotal}>
              <span>Total est.</span>
              <span style={{ color: '#F59E0B' }}>
                {deliveryFare !== null ? fmtRp(grandTotal) : `${fmtRp(cartTotal)} + delivery`}
              </span>
            </div>

            {showAddrInput && (
              <div className={styles.addrWrap} onClick={e => e.stopPropagation()}>
                <input
                  className={styles.addrInput}
                  placeholder="📍 Your delivery address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  autoFocus
                />
                <button
                  className={styles.locateBtn}
                  onClick={handleUseLocation}
                  disabled={locating}
                  title="Use my location"
                >
                  {locating ? '…' : '🎯'}
                </button>
              </div>
            )}

            <button className={styles.orderBtn} onClick={handleOrder}>
              {showAddrInput
                ? onOrderViaChat ? '💬 Send Order via Chat' : '📲 Send Order via WhatsApp'
                : 'Order Now →'}
            </button>
          </div>
        )}

        {cartExpanded && cart.length === 0 && (
          <div className={styles.cartEmpty}>Cart is empty</div>
        )}
      </div>

      {/* ── Right floating panel ── */}
      <div className={styles.floatingPanel}>
        {/* Promos */}
        <button
          className={styles.panelBtn}
          onClick={() => setPromosOpen(true)}
          title="Weekly deals"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className={styles.panelLabel}>Deals</span>
        </button>

        {/* Categories */}
        <button
          className={styles.panelBtn}
          onClick={() => setDrawerOpen(true)}
          title="Browse categories"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span className={styles.panelLabel}>Menu</span>
        </button>

        {/* Events */}
        {(restaurant.seating_capacity || restaurant.catering_available || restaurant.event_features?.length > 0) && (
          <button
            className={styles.panelBtn}
            onClick={() => setEventsOpen(true)}
            title="Events & venue"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className={styles.panelLabel}>Events</span>
          </button>
        )}

        {/* Socials */}
        {(restaurant.instagram || restaurant.tiktok || restaurant.facebook) && (
          <button
            className={styles.panelBtn}
            onClick={() => setSocialsOpen(true)}
            title="Social media"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className={styles.panelLabel}>Follow</span>
          </button>
        )}

        {/* My Orders */}
        <button
          className={styles.panelBtn}
          onClick={() => { setFoodOrders(getFoodOrders()); setOrdersOpen(true) }}
          title="My Orders"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            <line x1="8" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="16" y2="14"/>
            <line x1="8" y1="18" x2="12" y2="18"/>
          </svg>
          <span className={styles.panelLabel}>Orders</span>
        </button>
      </div>

      <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>F3</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)' }}>MENU</span></div>
      {/* ── Now in the Kitchen ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', flexShrink: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex' }}>
          {[
            'https://i.pravatar.cc/100?img=1',
            'https://i.pravatar.cc/100?img=5',
            'https://i.pravatar.cc/100?img=9',
            'https://i.pravatar.cc/100?img=14',
            'https://i.pravatar.cc/100?img=20',
            'https://i.pravatar.cc/100?img=25',
            'https://i.pravatar.cc/100?img=33',
          ].map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #0a0a0a', marginLeft: i === 0 ? 0 : -8, objectFit: 'cover', position: 'relative', zIndex: 7 - i }} />
          ))}
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(141,198,63,0.15)', border: '2px solid #0a0a0a', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#8DC63F' }}>
            +{Math.floor(40 + Math.random() * 140)}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Now in the Kitchen</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', marginLeft: 'auto', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }} />
      </div>

      {/* ── Full-screen snap-scroll menu feed ── */}
      <div className={styles.feed} ref={feedRef}>
        {visibleItems.length === 0 ? (
          <div className={styles.emptyFeed}>No items in this category</div>
        ) : (
          visibleItems.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={qtyFor(item.id)}
              onAdd={() => addToCart(item)}
              onRemove={() => removeFromCart(item.id)}
              itemRef={el => { itemRefs.current[i] = el }}
            />
          ))
        )}
      </div>

      {/* ── Category floating grid (left side) ── */}
      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawerGrid} onClick={e => e.stopPropagation()}>
            {/* All items */}
            <button
              className={`${styles.drawerCat} ${!activeCategory ? styles.drawerCatActive : ''}`}
              onClick={() => jumpToCategory(null)}
            >
              <span className={styles.drawerCatEmoji}>🍽</span>
              <span className={styles.drawerCatName}>All</span>
              <span className={styles.drawerCatCount}>{items.length}</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.drawerCat} ${activeCategory === cat ? styles.drawerCatActive : ''}`}
                onClick={() => jumpToCategory(cat)}
              >
                <span className={styles.drawerCatEmoji}>{CATEGORY_EMOJIS[cat] ?? '🍽'}</span>
                <span className={styles.drawerCatName}>{cat}</span>
                <span className={styles.drawerCatCount}>{items.filter(i => i.category === cat).length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Events / venue left drawer ── */}
      {eventsOpen && (
        <div className={styles.panelBackdrop} onClick={() => setEventsOpen(false)}>
          <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
            <h3 className={styles.infoPanelTitle}>Events & Venue</h3>
            <p className={styles.infoPanelSub}>{restaurant.name}</p>

            {restaurant.seating_capacity && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🪑</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Seating Capacity</span>
                  <span className={styles.infoValue}>Up to {restaurant.seating_capacity} guests</span>
                </div>
              </div>
            )}

            {restaurant.catering_available && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🍽</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Catering</span>
                  <span className={styles.infoValue}>Available for external events</span>
                </div>
              </div>
            )}

            {restaurant.event_features?.map(f => (
              <div key={f} className={styles.infoRow}>
                <span className={styles.infoIcon}>{EVENT_LABELS[f]?.split(' ')[0] ?? '✓'}</span>
                <div className={styles.infoText}>
                  <span className={styles.infoValue}>{EVENT_LABELS[f]?.split(' ').slice(1).join(' ') ?? f}</span>
                </div>
              </div>
            ))}

            <button
              className={styles.eventEnquiryBtn}
              onClick={() => {
                if (onOrderViaChat) {
                  onOrderViaChat({ restaurant, items: [], subtotal: 0, deliveryFee: 0, total: 0, notes: 'Event enquiry — please send details about availability and packages.', ref: `#EVENT_${Date.now().toString().slice(-6)}` })
                } else {
                  const msg = `Hi ${restaurant.name}, I'd like to enquire about hosting an event at your venue. Please send me details about availability and packages.`
                  window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
                }
              }}
            >
              💬 Enquire via Chat
            </button>
          </div>
        </div>
      )}

      {/* ── Weekly promos sheet ── */}
      {promosOpen && <WeeklyPromoSheet onClose={() => setPromosOpen(false)} restaurant={restaurant} />}

      {/* ── Payment card ── */}
      {paymentData && (
        <PaymentCard
          restaurant={restaurant}
          total={paymentData.total}
          orderRef={paymentData.orderRef}
          onDone={() => setPaymentData(null)}
        />
      )}

      {/* ── My Orders slide-up panel ── */}
      {ordersOpen && (
        <div className={styles.panelBackdrop} onClick={() => setOrdersOpen(false)}>
          <div className={styles.ordersPanel} onClick={e => e.stopPropagation()}>
            <h3 className={styles.infoPanelTitle}>My Orders</h3>
            <p className={styles.infoPanelSub}>Your food order history</p>

            {foodOrders.length === 0 ? (
              <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 20 }}>No orders yet</p>
            ) : (
              foodOrders.map(order => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <span className={styles.orderRestName}>{order.restaurant}</span>
                    <span
                      className={styles.orderStatusBadge}
                      style={{ background: `${STATUS_COLORS[order.status] ?? '#666'}20`, color: STATUS_COLORS[order.status] ?? '#666', border: `1px solid ${STATUS_COLORS[order.status] ?? '#666'}40` }}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className={styles.orderItems}>
                    {order.items.map((it, idx) => (
                      <span key={idx} className={styles.orderItemLine}>{it.qty}x {it.name}</span>
                    ))}
                  </div>
                  <div className={styles.orderCardFooter}>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {/* Cancel button for pending/awaiting_payment */}
                  {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                    <button
                      className={styles.orderCancelBtn}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                  {/* Review button for delivered orders */}
                  {order.status === 'delivered' && !JSON.parse(localStorage.getItem('indoo_food_reviews') || '[]').some(r => r.order_id === order.id) && (
                    <button
                      className={styles.orderReviewBtn}
                      onClick={() => { setReviewOrder(order); setReviewStars(0); setReviewComment('') }}
                    >
                      Rate this order
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Order processing overlay ── */}
      {orderProcessing && (
        <div className={styles.processingOverlay}>
          <div className={styles.processingCard}>
            <div className={styles.processingSpinner} />
            <h3 className={styles.processingTitle}>Placing your order...</h3>
            <p className={styles.processingSub}>Sending to {restaurant.name}</p>
          </div>
        </div>
      )}

      {/* ── Order confirmation overlay with payment flow ── */}
      {orderConfirm && (
        <div className={styles.processingOverlay} onClick={() => { if (!paymentStep) setOrderConfirm(null) }}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Step 1: Confirmation */}
            {!paymentStep && !paymentSubmitted && (
              <>
                <div className={styles.confirmCheck}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3 className={styles.confirmTitle}>Order Confirmed!</h3>
                <p className={styles.confirmOrderId}>{orderConfirm.id}</p>
                <div className={styles.confirmDetails}>
                  <div className={styles.confirmRow}>
                    <span>Total</span>
                    <span style={{ color: '#F59E0B', fontWeight: 900 }}>{fmtRp(orderConfirm.total)}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span>Est. Delivery</span>
                    <span style={{ fontWeight: 800 }}>{orderConfirm.estimatedMin} min</span>
                  </div>
                </div>
                {/* Payment method selector */}
                <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
                  <button onClick={() => setPaymentStep(true)} style={{
                    flex: 1, padding: '14px 8px', borderRadius: 16,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(141,198,63,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ fontSize: 24 }}>🏦</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Bank Transfer</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Pay restaurant direct</span>
                  </button>
                  <button onClick={() => {
                    // COD — skip payment, go straight to driver assignment
                    const orders = getFoodOrders()
                    const updated = orders.map(o =>
                      o.id === orderConfirm.id ? { ...o, status: 'cod_pending', payment_method: 'cod' } : o
                    )
                    saveFoodOrders(updated)
                    setFoodOrders(updated)
                    setPaymentSubmitted(true)
                    handleSubmitPayment()
                  }} style={{
                    flex: 1, padding: '14px 8px', borderRadius: 16,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255,215,0,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <span style={{ fontSize: 24 }}>💵</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>COD</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Cash on Delivery</span>
                  </button>
                </div>
                <button className={styles.orderCancelBtn} onClick={() => setOrderConfirm(null)} style={{ marginTop: 8 }}>
                  Cancel
                </button>
              </>
            )}

            {/* Step 2: Payment details + screenshot upload */}
            {paymentStep && !paymentSubmitted && (
              <>
                <h3 className={styles.confirmTitle} style={{ marginTop: 4 }}>Bank Transfer</h3>
                <p className={styles.confirmOrderId}>{orderConfirm.id}</p>

                {/* Bank details card */}
                <div style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px',
                  margin: '12px 0', width: '100%',
                }}>
                  {(restaurant.bank_name || restaurant.bank?.name) ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Bank</span>
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 800 }}>{restaurant.bank_name ?? restaurant.bank?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Account</span>
                        <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 900, letterSpacing: '0.05em' }}>{restaurant.bank_account_number ?? restaurant.account_number ?? restaurant.bank?.account_number}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Name</span>
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{restaurant.bank_account_holder ?? restaurant.account_holder ?? restaurant.bank?.account_holder}</span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: 0 }}>
                      Contact restaurant for payment details
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Transfer Amount</span>
                  <span style={{ fontSize: 15, color: '#F59E0B', fontWeight: 900 }}>{fmtRp(orderConfirm.total)}</span>
                </div>

                {/* Screenshot upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePaymentProofUpload}
                />
                <button
                  className={styles.confirmDoneBtn}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: paymentProofFile
                      ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                      : 'rgba(255,255,255,0.08)',
                    border: paymentProofFile ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                    marginBottom: 8,
                  }}
                >
                  {paymentProofFile ? `Screenshot: ${paymentProofFile.name.slice(0, 25)}` : 'Upload Payment Screenshot'}
                </button>

                <button
                  className={styles.confirmDoneBtn}
                  onClick={handleSubmitPayment}
                  disabled={driverSearching}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    opacity: driverSearching ? 0.6 : 1,
                  }}
                >
                  {driverSearching ? 'Submitting...' : 'Submit Payment'}
                </button>

                <button className={styles.orderCancelBtn} onClick={() => setPaymentStep(false)} style={{ marginTop: 4 }}>
                  Back
                </button>
              </>
            )}

            {/* Step 3: Payment submitted — driver assignment */}
            {paymentSubmitted && (
              <>
                {driverSearching ? (
                  <>
                    <div className={styles.processingSpinner} />
                    <h3 className={styles.confirmTitle}>Searching for driver...</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
                      Finding a nearby driver for your order
                    </p>
                  </>
                ) : assignedDriver ? (
                  <>
                    <div className={styles.confirmCheck}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h3 className={styles.confirmTitle}>Driver Assigned!</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                      Heading to restaurant
                    </p>

                    {/* Driver info card */}
                    <div style={{
                      background: 'rgba(255,255,255,0.06)', borderRadius: 14,
                      border: '1px solid rgba(141,198,63,0.2)', padding: '14px 16px',
                      margin: '8px 0', width: '100%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'rgba(141,198,63,0.15)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          🏍️
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                            {assignedDriver.display_name ?? assignedDriver.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            {assignedDriver.vehicle_model ?? assignedDriver.vehicle ?? 'Motorcycle'}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                            {assignedDriver.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className={styles.confirmDoneBtn} onClick={handleOpenTracking} style={{ background: 'linear-gradient(135deg, #8DC63F 0%, #6BA530 100%)' }}>
                      Track Order
                    </button>
                    <button className={styles.orderCancelBtn} onClick={() => {
                      setOrderConfirm(null)
                      setPaymentStep(false)
                      setPaymentSubmitted(false)
                      setAssignedDriver(null)
                      setPaymentProofFile(null)
                    }} style={{ marginTop: 4 }}>
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className={styles.confirmTitle}>Payment Submitted</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
                      Waiting for restaurant confirmation
                    </p>
                    <button className={styles.confirmDoneBtn} onClick={handleSubmitPayment}>
                      Retry Driver Search
                    </button>
                    <button className={styles.orderCancelBtn} onClick={() => {
                      setOrderConfirm(null)
                      setPaymentStep(false)
                      setPaymentSubmitted(false)
                    }} style={{ marginTop: 4 }}>
                      Close
                    </button>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Review modal ── */}
      {reviewOrder && (
        <div className={styles.processingOverlay} onClick={() => setReviewOrder(null)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Rate Your Order</h3>
            <p className={styles.infoPanelSub} style={{ textAlign: 'center' }}>{reviewOrder.restaurant}</p>
            <div className={styles.reviewStarsRow}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={styles.reviewStarBtn}
                  style={{ color: n <= reviewStars ? '#F59E0B' : 'rgba(255,255,255,0.15)' }}
                  onClick={() => setReviewStars(n)}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className={styles.reviewCommentInput}
              placeholder="Tell us about your experience (optional)"
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <button
              className={styles.confirmDoneBtn}
              onClick={handleSubmitReview}
              disabled={!reviewStars}
              style={{ opacity: reviewStars ? 1 : 0.4 }}
            >
              Submit Review
            </button>
            <button
              className={styles.orderCancelBtn}
              onClick={() => setReviewOrder(null)}
              style={{ marginTop: 4 }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <div className={styles.toastNotif}>
          {toast}
        </div>
      )}

      {/* ── Socials left drawer ── */}
      {socialsOpen && (
        <div className={styles.panelBackdrop} onClick={() => setSocialsOpen(false)}>
          <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
            <h3 className={styles.infoPanelTitle}>Follow Us</h3>
            <p className={styles.infoPanelSub}>{restaurant.name}</p>

            {restaurant.instagram && (
              <a className={styles.socialLink} href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>📸</span>
                <span className={styles.socialName}>Instagram</span>
                <span className={styles.socialHandle}>@{restaurant.instagram}</span>
              </a>
            )}
            {restaurant.tiktok && (
              <a className={styles.socialLink} href={`https://tiktok.com/@${restaurant.tiktok}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>🎵</span>
                <span className={styles.socialName}>TikTok</span>
                <span className={styles.socialHandle}>@{restaurant.tiktok}</span>
              </a>
            )}
            {restaurant.facebook && (
              <a className={styles.socialLink} href={`https://facebook.com/${restaurant.facebook}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>👥</span>
                <span className={styles.socialName}>Facebook</span>
                <span className={styles.socialHandle}>{restaurant.facebook}</span>
              </a>
            )}

            {!restaurant.instagram && !restaurant.tiktok && !restaurant.facebook && (
              <p className={styles.noSocials}>No social links added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Menu item card — full-screen ──────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove, itemRef }) {
  const bg = item.photo_url
    ? `url("${item.photo_url}")`
    : CATEGORY_GRADIENTS[item.category] ?? 'linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)'

  return (
    <div className={styles.itemCard} ref={itemRef}>
      {/* Background */}
      <div className={styles.itemBg} style={{ backgroundImage: bg }} />
      <div className={styles.itemOverlay} />

      {/* Category pill top-left */}
      {item.category && (
        <div className={styles.itemCatPill}>{item.category}</div>
      )}

      {/* Prep time top-right */}
      {item.prep_time_min && (
        <div className={styles.itemPrep}>⏱ {item.prep_time_min} min</div>
      )}

      {/* Sold out overlay */}
      {item.is_available === false && (
        <div className={styles.soldOutOverlay}>
          <span className={styles.soldOutText}>Sold Out</span>
        </div>
      )}

      {/* Bottom content */}
      <div className={styles.itemBottom}>
        <h2 className={styles.itemName}>{item.name}</h2>
        {item.description && (
          <p className={styles.itemDesc}>{item.description}</p>
        )}
        <div className={styles.itemFooter}>
          <span className={styles.itemPrice}>{fmtRp(item.price)}</span>

          {item.is_available !== false && (
            qty > 0 ? (
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={onRemove}>−</button>
                <span className={styles.qtyNum}>{qty}</span>
                <button className={styles.qtyBtn} onClick={onAdd}>+</button>
              </div>
            ) : (
              <button className={styles.addBtn} onClick={onAdd}>
                + Add
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
