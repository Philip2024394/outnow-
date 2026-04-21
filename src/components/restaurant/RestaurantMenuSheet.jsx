import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './RestaurantMenuSheet.module.css'
import WeeklyPromoSheet from './WeeklyPromoSheet'
import PaymentCard from './PaymentCard'
import FoodOrderStatus from '@/components/orders/FoodOrderStatus'
import { createFoodOrder, searchFoodDrivers } from '@/services/foodOrderService'
import { FOOD_CATEGORIES_FULL } from '@/constants/foodCategories'
import { fmtRp, getFoodOrders, saveFoodOrders } from './menuSheetConstants'
import MenuItemCard from './MenuItemCard'
import { FREE_ITEM_BADGES } from '@/constants/restaurantPromos'
import { DISH_TAGS } from '@/constants/foodCustomizations'

// Auto-detect tags from item name/description/category
const SPICY_WORDS = ['pedas','sambal','geprek','balado','rica','cabai','chili','hot','spicy','cabe']
const GARLIC_WORDS = ['bawang','garlic','aglio']
const VEGGIE_WORDS = ['vegetarian','vegan','sayur','salad','gado','pecel','karedok','tahu','tempe']
const SEAFOOD_WORDS = ['ikan','udang','kepiting','cumi','seafood','fish','shrimp','crab','squid','gurame']
const NUT_WORDS = ['kacang','nut','almond','peanut']

function getAutoTags(item) {
  const text = `${item.name ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase()
  const tags = []
  if (SPICY_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'spicy'))
  if (GARLIC_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'garlic'))
  if (VEGGIE_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'vegetarian'))
  if (SEAFOOD_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'seafood_allergen'))
  if (NUT_WORDS.some(w => text.includes(w))) tags.push(DISH_TAGS.find(t => t.id === 'nuts'))
  // Manual tags from item.tags field if vendor sets them
  if (item.tags) {
    item.tags.forEach(tagId => {
      const t = DISH_TAGS.find(dt => dt.id === tagId)
      if (t && !tags.find(x => x?.id === t.id)) tags.push(t)
    })
  }
  return tags.filter(Boolean)
}
import OrderConfirmOverlay from './OrderConfirmOverlay'
import OrdersPanel from './OrdersPanel'
import CategoryDrawer from './CategoryDrawer'
import EventsDrawer from './EventsDrawer'
import SocialsDrawer from './SocialsDrawer'
import ReviewModal from './ReviewModal'
import CustomizeSheet from './CustomizeSheet'

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantMenuSheet({ restaurant, onClose, onOrderViaChat }) {
  const items      = restaurant.menu_items ?? []
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const [cart,           setCart]           = useState(() => {
    // Pre-populate demo cart for preview
    const demoItems = (restaurant.menu_items ?? []).filter(i => i.photo_url).slice(0, 3)
    return demoItems.length ? demoItems.map((item, i) => ({ ...item, qty: i === 0 ? 2 : 1 })) : []
  })
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
  const [orderType,      setOrderType]      = useState('delivery')
  const [paymentMethod,  setPaymentMethod]  = useState(null) // 'bank' | 'cod' | null
  const [transactionCode, setTransactionCode] = useState('')
  const [paymentStep,    setPaymentStep]    = useState(false)   // show payment step on confirmation
  const [paymentProofFile, setPaymentProofFile] = useState(null)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [driverSearching, setDriverSearching] = useState(false)
  const [assignedDriver,  setAssignedDriver]  = useState(null)
  const [trackingOrder,   setTrackingOrder]   = useState(null)
  const [customizeItem,   setCustomizeItem]   = useState(null)

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

  // ── Dish badges from localStorage ──
  const [dishBadges, setDishBadges] = useState([])
  useEffect(() => {
    try {
      const sellerId = restaurant.user_id ?? restaurant.id
      const saved = JSON.parse(localStorage.getItem(`indoo_dish_badges_${sellerId}`) || '[]')
      setDishBadges(saved)
    } catch {}
  }, [restaurant])

  // ── Daily specials from localStorage ──
  const [todaySpecial, setTodaySpecial] = useState(null)
  useEffect(() => {
    try {
      const sellerId = restaurant.user_id ?? restaurant.id
      const saved = JSON.parse(localStorage.getItem(`indoo_daily_specials_${sellerId}`) || '[]')
      const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
      const special = saved.find(s => s.day === today && s.enabled && s.dishName)
      setTodaySpecial(special)
    } catch {}
  }, [restaurant])

  // Filter items by active category — only show items with owner-uploaded photos
  // Sort by popularity: featured/first items shown first (hero dish at top)
  const visibleItems = (activeCategory
    ? items.filter(i => i.category === activeCategory && i.photo_url)
    : items.filter(i => i.photo_url)
  ).sort((a, b) => {
    // Hero dish (matches restaurant hero_dish_name) always first
    if (a.name === restaurant.hero_dish_name) return -1
    if (b.name === restaurant.hero_dish_name) return 1
    // Then by price descending (premium items = popular)
    return (b.price ?? 0) - (a.price ?? 0)
  })

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
    collapseRef.current = setTimeout(() => { setCartExpanded(false); setShowAddrInput(false) }, 2500)
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
  const deliveryFare = orderType === 'delivery' ? (restaurant.deliveryFare ?? null) : 0
  const grandTotal  = cartTotal + (deliveryFare ?? 0)
  const maxPrepMin  = cart.length > 0
    ? Math.max(...cart.map(i => i.prep_time_min ?? 0))
    : 0
  const avgPrepTime = cart.length > 0
    ? Math.round(cart.reduce((sum, item) => sum + (item.prep_time_min ?? 15), 0) / cart.length)
    : 15
  const deliveryMinutes = orderType === 'delivery' ? Math.round(5 + ((deliveryFare ?? 15000) / 4000)) : 0
  const eta = avgPrepTime + deliveryMinutes
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

  const [orderReceived, setOrderReceived] = useState(false)
  const [driverOnWay, setDriverOnWay] = useState(null) // { orderId, eta, restaurant }

  // ── Order handler — Place Order with processing animation ──
  const handleOrder = () => {
    if (!showAddrInput) { setShowAddrInput(true); return }

    // Step 1: Show processing page (printer printing)
    setCartExpanded(false)
    setOrderProcessing(true)
    setOrderReceived(false)

    // Step 2: After 4.5s show "Order Received" (paper out)
    setTimeout(() => {
      setOrderReceived(true)
    }, 4500)

    // Step 3: After 8s, save order and show driver page
    setTimeout(() => {
      const orderId = `FOOD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const order = {
        id: orderId,
        restaurant: restaurant.name,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: grandTotal,
        delivery: deliveryFare ?? (orderType === 'delivery' ? 10000 : 0),
        order_type: orderType,
        payment_method: paymentMethod,
        transaction_code: paymentMethod === 'bank' ? transactionCode : null,
        status: 'driver_assigned',
        address: orderType === 'delivery' ? (address || null) : null,
        created_at: new Date().toISOString(),
      }

      const orders = getFoodOrders()
      orders.unshift(order)
      saveFoodOrders(orders)
      setFoodOrders(orders)

      setOrderProcessing(false)
      setOrderReceived(false)
      setDriverOnWay({ orderId, eta: eta + 10, restaurant: restaurant.name })

      setCart([])
      setShowAddrInput(false)
      setPaymentMethod(null)
      setTransactionCode('')
    }, 8000)
  }

  useEffect(() => () => clearTimeout(collapseRef.current), [])

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{restaurant.name}</span>
          {activeCategory && (
            <button className={styles.clearCat} onClick={() => setActiveCategory(null)}>
              {activeCategory} · All items ×
            </button>
          )}
        </div>
        <button className={styles.backBtn} onClick={onClose} aria-label="Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>
      </div>

      {/* Cart backdrop */}
      {cartExpanded && <div className={styles.cartBackdrop} onClick={() => { setCartExpanded(false); setShowAddrInput(false) }} />}

      {/* ── Growing cart badge (top-right) ── */}
      <div
        className={`${styles.cartBadge} ${cartExpanded ? styles.cartBadgeOpen : ''}`}
        onClick={() => {
          setCartExpanded(e => { if (e) setShowAddrInput(false); return !e })
          clearTimeout(collapseRef.current)
        }}
      >
        {/* Icon row */}
        <div className={styles.cartBadgeTop}>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitleddasdasdasdasss-removebg-preview.png?updatedAt=1775737452452" alt="Cart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
        </div>

      </div>

      {/* ── Full-page cart ── */}
      {cartExpanded && (
        <div className={styles.cartPage}>
          {/* Cart header */}
          <div className={styles.cartPageHeader}>
            <button className={styles.cartPageBack} onClick={() => { setCartExpanded(false); setShowAddrInput(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <span className={styles.cartPageTitle}>{restaurant.name}</span>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: restaurant.is_open ? '#8DC63F' : '#ef4444', marginTop: 3 }}>
                {restaurant.is_open ? <><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#8DC63F', marginRight: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />Kitchen full speed — orders dispatched on time</> : '🔴 Kitchen is closed'}
              </span>
            </div>
          </div>

          {/* Cart items list */}
          <div className={styles.cartPageBody}>
            {cart.length === 0 ? (
              <div className={styles.cartEmpty}>Your cart is empty</div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className={styles.cartPageItem}>
                    <div className={styles.cartPageItemRow}>
                      <span className={styles.cartPageQty}>{item.qty}×</span>
                      <span className={styles.cartPageName}>{item.name}</span>
                      <span className={styles.cartPagePrice}>{fmtRp(item.price * item.qty)}</span>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <button onClick={() => removeFromCart(item.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => addToCart(item)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: editingNoteId === item.id ? '#FACC15' : 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer' }}>✏ Note</button>
                    </div>
                    {/* Note */}
                    {item.note?.trim() && editingNoteId !== item.id && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4, display: 'block' }}>📝 {item.note}</span>
                    )}
                    {editingNoteId === item.id && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          className={styles.cartNoteInput}
                          placeholder="e.g. no chili, extra sauce…"
                          value={item.note ?? ''}
                          onChange={e => updateNote(item.id, e.target.value)}
                          autoFocus
                          maxLength={120}
                        />
                        <button className={styles.cartNoteDone} onClick={() => setEditingNoteId(null)}>Done</button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Divider */}
                <div className={styles.cartDivider} style={{ margin: '16px 0' }} />

                {/* Order type toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'delivery', label: 'Delivery', icon: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237' },
                    { id: 'dinein', label: '🍽️ Dine In' },
                    { id: 'pickup', label: '🏪 Pickup' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setOrderType(opt.id)} style={{
                      flex: 1, padding: '12px 6px', borderRadius: 12,
                      background: orderType === opt.id ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)',
                      border: `1.5px solid ${orderType === opt.id ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                      color: orderType === opt.id ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      {opt.icon ? <img src={opt.icon} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} /> : null}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Delivery address */}
                {orderType === 'delivery' && (
                  <div className={styles.addrWrap} style={{ marginBottom: 12 }}>
                    <input
                      className={styles.addrInput}
                      placeholder="📍 Your delivery address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    />
                    <button className={styles.locateBtn} onClick={handleUseLocation} disabled={locating}>
                      {locating ? '…' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                    </button>
                  </div>
                )}
                {orderType === 'dinein' && (
                  <div style={{ padding: '12px 0', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>🍽️ Walk-in / Eat at restaurant</div>
                )}
                {orderType === 'pickup' && (
                  <div style={{ padding: '12px 0', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>🏪 Pick up at restaurant</div>
                )}

                {/* Summary */}
                <div className={styles.cartDivider} style={{ margin: '8px 0' }} />

                {maxPrepMin > 0 && (
                  <div className={styles.cartMeta} style={{ padding: '6px 0' }}>
                    <span className={styles.cartMetaIcon}>⏱</span>
                    <span className={styles.cartMetaLabel}>Est. prep time</span>
                    <span className={styles.cartMetaValue}>{maxPrepMin} min</span>
                  </div>
                )}

                <div className={styles.cartMeta} style={{ padding: '6px 0' }}>
                  <span className={styles.cartMetaIcon}>{orderType === 'delivery' ? <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} /> : orderType === 'dinein' ? '🍽️' : '🏪'}</span>
                  <span className={styles.cartMetaLabel}>{orderType === 'delivery' ? 'Delivery' : orderType === 'dinein' ? 'Dine In' : 'Pickup'}</span>
                  <span className={styles.cartMetaValue}>{orderType === 'delivery' ? (deliveryFare !== null ? fmtRp(deliveryFare) : 'Calculating…') : 'Free'}</span>
                </div>

                {orderType === 'dinein' && restaurant.dine_in_discount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>
                    <span>🎉</span>
                    <span>{restaurant.dine_in_discount}% dine-in discount</span>
                  </div>
                )}

                <div className={styles.cartDivider} style={{ margin: '8px 0' }} />

                {/* Payment method selection */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>Payment Method</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPaymentMethod('bank')} style={{
                      flex: 1, padding: '14px 8px', borderRadius: 12,
                      background: paymentMethod === 'bank' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)',
                      border: `1.5px solid ${paymentMethod === 'bank' ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                      color: paymentMethod === 'bank' ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>🏦</span>
                      <span>Bank Transfer</span>
                    </button>
                    <button onClick={() => setPaymentMethod('cod')} style={{
                      flex: 1, padding: '14px 8px', borderRadius: 12,
                      background: paymentMethod === 'cod' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)',
                      border: `1.5px solid ${paymentMethod === 'cod' ? '#8DC63F' : 'rgba(255,255,255,0.08)'}`,
                      color: paymentMethod === 'cod' ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>💵</span>
                      <span>Cash on Delivery</span>
                    </button>
                  </div>
                  {paymentMethod === 'bank' && restaurant.bank && (
                    <div style={{ marginTop: 10, padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Transfer to:</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{restaurant.bank.name} — {restaurant.bank.account_number}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{restaurant.bank.account_holder}</div>
                      <div style={{ color: '#FACC15', fontWeight: 900, fontSize: 16, marginTop: 8 }}>
                        {orderType !== 'delivery' ? fmtRp(grandTotal) : deliveryFare !== null ? fmtRp(grandTotal) : `${fmtRp(cartTotal)} + delivery`}
                      </div>
                      <div className={styles.cartDivider} style={{ margin: '10px 0' }} />
                      <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontSize: 11 }}>Enter transaction/reference code from your bank receipt:</div>
                      <input
                        value={transactionCode}
                        onChange={e => setTransactionCode(e.target.value)}
                        placeholder="e.g. TRX-123456789"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '12px 14px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', fontSize: 14, fontFamily: 'inherit', fontWeight: 700,
                          outline: 'none', letterSpacing: '0.02em',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.cartDivider} style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '4px 0' }}>
                  <span>Estimated time</span>
                  <span>{eta} min</span>
                </div>

                <div className={styles.cartTotal} style={{ padding: '8px 0' }}>
                  <span>Total</span>
                  <span style={{ color: '#FACC15' }}>
                    {orderType !== 'delivery' ? fmtRp(grandTotal) : deliveryFare !== null ? fmtRp(grandTotal) : `${fmtRp(cartTotal)} + delivery`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Fixed bottom button */}
          {cart.length > 0 && (
            <div className={styles.cartPageFooter}>
              <button
                className={styles.orderBtn}
                style={{
                  fontSize: 16, padding: 16, borderRadius: 16,
                  opacity: (paymentMethod === 'cod' || (paymentMethod === 'bank' && transactionCode.trim())) ? 1 : 0.4,
                  cursor: (paymentMethod === 'cod' || (paymentMethod === 'bank' && transactionCode.trim())) ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (paymentMethod === 'cod') handleOrder()
                  else if (paymentMethod === 'bank' && transactionCode.trim()) handleOrder()
                }}
              >
                {!paymentMethod ? 'Select Payment Method' : paymentMethod === 'bank' && !transactionCode.trim() ? 'Enter Transaction Code' : 'Confirm Order'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Right floating panel ── */}
      <div className={styles.floatingPanel}>
        {/* Home — back to restaurant browse */}
        <button
          className={styles.panelBtn}
          onClick={onClose}
          title="Back to restaurants"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className={styles.panelLabel}>Home</span>
        </button>

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
          onClick={() => setDrawerOpen(o => !o)}
          title="Browse categories"
          style={drawerOpen ? { boxShadow: '0 0 8px 3px rgba(250,204,21,0.35)' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={drawerOpen ? '#FACC15' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span className={styles.panelLabel} style={drawerOpen ? { color: '#FACC15' } : {}}>Menu</span>
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

      {/* ── Today's special banner ── */}
      {todaySpecial && (
        <div style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top) + 60px)', left: 12, right: 12,
          zIndex: 15, padding: '10px 14px', borderRadius: 14,
          background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.3)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s ease',
        }}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>Today's Special: {todaySpecial.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{todaySpecial.dishName} — {todaySpecial.offerId?.replace('_', ' ')?.replace('discount ', '')}</div>
          </div>
        </div>
      )}

      {/* ── Full-screen snap-scroll menu feed ── */}
      <div className={styles.feed} ref={feedRef}>
        {visibleItems.length === 0 ? (
          <div className={styles.emptyFeed}>No items in this category</div>
        ) : (
          visibleItems.map((item, i) => {
            const itemBadge = dishBadges.find(b => b.dishId === item.id)
            const badgeData = itemBadge ? FREE_ITEM_BADGES.find(fb => fb.id === itemBadge.badgeId) : null
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={qtyFor(item.id)}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
                onCustomize={(itm) => setCustomizeItem(itm)}
                itemRef={el => { itemRefs.current[i] = el }}
                badge={badgeData}
                tags={getAutoTags(item)}
              />
            )
          })
        )}
      </div>

      {/* ── Category floating grid (left side) ── */}
      {drawerOpen && (
        <CategoryDrawer
          items={items}
          categories={categories}
          activeCategory={activeCategory}
          onClose={() => setDrawerOpen(false)}
          onJumpToCategory={jumpToCategory}
        />
      )}

      {/* ── Events / venue left drawer ── */}
      {eventsOpen && (
        <EventsDrawer
          restaurant={restaurant}
          onClose={() => setEventsOpen(false)}
          onOrderViaChat={onOrderViaChat}
        />
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
        <OrdersPanel
          foodOrders={foodOrders}
          onClose={() => setOrdersOpen(false)}
          onCancelOrder={handleCancelOrder}
          onReviewOrder={(order) => { setReviewOrder(order); setReviewStars(0); setReviewComment('') }}
          onReorder={(items) => {
            items.forEach(item => addToCart(item))
            setCartExpanded(true)
            setOrdersOpen(false)
            setToast('Previous order added to cart!')
          }}
        />
      )}

      {/* ── Order processing overlay ── */}
      {orderProcessing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9900, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Full-screen background image */}
          <img
            src={!orderReceived
              ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_44_19%20AM.png'
              : 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2021,%202026,%2006_43_19%20AM.png'
            }
            alt={!orderReceived ? 'Processing' : 'Order Received'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Overlay for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.5) 100%)' }} />
          {/* Text at bottom */}
          <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2 }}>
            {!orderReceived ? (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>Processing Order</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.2s ease-in-out infinite' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.2s ease-in-out 0.3s infinite' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.2s ease-in-out 0.6s infinite' }} />
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Please wait...</p>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>Order Received!</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{restaurant.name} has your order</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Driver on the way — full page ── */}
      {driverOnWay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9850, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Order #{driverOnWay.orderId}</span>
            <button onClick={() => setDriverOnWay(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14 }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
            {/* Scooter icon */}
            <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="Driver" style={{ width: 120, height: 120, objectFit: 'contain', animation: 'pulse 2s ease-in-out infinite' }} />

            {/* Status */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Driver On The Way</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Your order from {driverOnWay.restaurant} is being delivered</p>
            </div>

            {/* ETA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 14, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)' }}>
              <span style={{ fontSize: 16 }}>⏱</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>~{driverOnWay.eta} min</span>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Confirmed</span>
              </div>
              <div style={{ width: 40, height: 2, background: '#8DC63F' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 9, color: '#8DC63F', fontWeight: 700 }}>On The Way</span>
              </div>
              <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Delivered</span>
              </div>
            </div>

            {/* Payment badge */}
            <div style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Payment: </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FACC15' }}>{paymentMethod === 'bank' ? 'Bank Transfer ✓' : 'Cash on Delivery'}</span>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setDriverOnWay(null)} style={{ width: '100%', padding: 16, borderRadius: 16, background: '#8DC63F', color: '#000', border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* ── Order confirmation overlay with payment flow ── */}
      <OrderConfirmOverlay
        orderConfirm={orderConfirm}
        setOrderConfirm={setOrderConfirm}
        paymentStep={paymentStep}
        setPaymentStep={setPaymentStep}
        paymentSubmitted={paymentSubmitted}
        setPaymentSubmitted={setPaymentSubmitted}
        driverSearching={driverSearching}
        assignedDriver={assignedDriver}
        setAssignedDriver={setAssignedDriver}
        paymentProofFile={paymentProofFile}
        setPaymentProofFile={setPaymentProofFile}
        restaurant={restaurant}
        handleSubmitPayment={handleSubmitPayment}
        handlePaymentProofUpload={handlePaymentProofUpload}
        handleOpenTracking={handleOpenTracking}
        getFoodOrders={getFoodOrders}
        saveFoodOrders={saveFoodOrders}
        setFoodOrders={setFoodOrders}
      />

      {/* ── Customize sheet ── */}
      <CustomizeSheet
        open={!!customizeItem}
        item={customizeItem}
        onClose={() => setCustomizeItem(null)}
        onConfirm={(customized) => {
          addToCart({ ...customized.item, price: customized.totalPrice, customization: customized })
          setCustomizeItem(null)
        }}
      />

      {/* ── Review modal ── */}
      <ReviewModal
        reviewOrder={reviewOrder}
        reviewStars={reviewStars}
        setReviewStars={setReviewStars}
        reviewComment={reviewComment}
        setReviewComment={setReviewComment}
        onSubmit={handleSubmitReview}
        onClose={() => setReviewOrder(null)}
      />

      {/* ── Toast notification ── */}
      {toast && (
        <div className={styles.toastNotif}>
          {toast}
        </div>
      )}

      {/* ── Socials left drawer ── */}
      {socialsOpen && (
        <SocialsDrawer
          restaurant={restaurant}
          onClose={() => setSocialsOpen(false)}
        />
      )}
    </div>
  )
}
