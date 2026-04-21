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
  const [qrZoom, setQrZoom] = useState(false)
  const [copyMsg, setCopyMsg] = useState(false)
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
  const [driverOnWay, setDriverOnWay] = useState(null)
  const [driverPhase, setDriverPhase] = useState('to_restaurant')
  const [driverImgIdx, setDriverImgIdx] = useState(0)

  // ── Master cleanup: cancel ALL pending timers on unmount ──
  const timerRefs = useRef([])
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
    }
  }, [])

  const safeTimeout = (fn, ms) => {
    const id = setTimeout(() => { if (mountedRef.current) fn() }, ms)
    timerRefs.current.push(id)
    return id
  }

  // Rotate driver images safely
  const DRIVER_ON_WAY_IMAGES = [
    'https://ik.imagekit.io/nepgaxllc/Motorcycle%20view%20on%20city%20street.png?updatedAt=1776062865270',
    'https://ik.imagekit.io/nepgaxllc/Speeding%20through%20the%20vibrant%20city%20streets.png?updatedAt=1776061842808',
    'https://ik.imagekit.io/nepgaxllc/Rider%20in%20motion%20on%20busy%20urban%20street.png?updatedAt=1776062079269',
    'https://ik.imagekit.io/nepgaxllc/Neon%20green%20speed%20through%20city%20streets.png?updatedAt=1776062258594',
    'https://ik.imagekit.io/nepgaxllc/Up%20close%20on%20the%20green%20ride.png?updatedAt=1776062117020',
  ]
  useEffect(() => {
    if (driverPhase !== 'to_customer' || !driverOnWay) return
    setDriverImgIdx(0)
    const id = setInterval(() => {
      if (mountedRef.current) setDriverImgIdx(i => (i + 1) % DRIVER_ON_WAY_IMAGES.length)
    }, 4000)
    return () => clearInterval(id)
  }, [driverPhase, !!driverOnWay]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Order handler — crash-safe with cleanup ──
  const handleOrder = () => {
    if (!showAddrInput) { setShowAddrInput(true); return }

    // Snapshot cart data BEFORE any async delays
    const orderSnapshot = {
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total: grandTotal,
      delivery: deliveryFare ?? (orderType === 'delivery' ? 10000 : 0),
      orderType,
      paymentMethod,
      transactionCode: paymentMethod === 'bank' ? transactionCode : null,
      address: orderType === 'delivery' ? (address || null) : null,
      restaurantName: restaurant.name,
      eta: eta + 10,
    }

    setCartExpanded(false)
    setOrderProcessing(true)
    setOrderReceived(false)

    const driverSearchTime = 6000 + Math.random() * 4000

    // Step 2: Driver found
    safeTimeout(() => {
      setOrderReceived(true)
    }, driverSearchTime)

    // Step 3: Transition to driver page
    safeTimeout(() => {
      const orderId = `FOOD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const order = {
        id: orderId,
        restaurant: orderSnapshot.restaurantName,
        items: orderSnapshot.items,
        total: orderSnapshot.total,
        delivery: orderSnapshot.delivery,
        order_type: orderSnapshot.orderType,
        payment_method: orderSnapshot.paymentMethod,
        transaction_code: orderSnapshot.transactionCode,
        status: 'driver_assigned',
        address: orderSnapshot.address,
        created_at: new Date().toISOString(),
      }

      const orders = getFoodOrders()
      orders.unshift(order)
      saveFoodOrders(orders)
      setFoodOrders(orders)

      setOrderProcessing(false)
      setOrderReceived(false)
      setDriverPhase('to_restaurant')
      setDriverOnWay({
        orderId,
        eta: orderSnapshot.eta,
        restaurant: orderSnapshot.restaurantName,
        driverName: 'Agus Prasetyo',
        driverPlate: 'AB 1234 XY',
        driverPhoto: 'https://i.pravatar.cc/100?img=12',
        phone: '6281234567999',
        bikeBrand: 'Honda Vario 150',
        rating: 4.9,
      })

      // Subscribe to real delivery phase updates via Supabase
      import('@/services/deliveryTrackingService').then(({ subscribeToDeliveryPhase }) => {
        if (!mountedRef.current) return
        const unsub = subscribeToDeliveryPhase(orderId, (phase) => {
          if (!mountedRef.current) return
          if (phase === 'picked_up' || phase === 'on_the_way') setDriverPhase('to_customer')
          else if (phase === 'almost_there' || phase === 'arrived') setDriverPhase('arrived')
        })
        timerRefs.current.push(() => unsub?.())
      }).catch(() => { /* no Supabase — demo fallback handles it */ })

      // Demo fallback auto-progress (only in demo mode)
      if (import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL) {
        safeTimeout(() => setDriverPhase('to_customer'), 10000)
        safeTimeout(() => setDriverPhase('arrived'), 40000)
      }

      setCart([])
      setShowAddrInput(false)
      setPaymentMethod(null)
      setTransactionCode('')
    }, driverSearchTime + 4000)
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

          {/* Order type toggle — under header */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {[
              { id: 'delivery', label: 'Delivery', icon: 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237' },
              { id: 'dinein', label: 'Dine In' },
              { id: 'pickup', label: 'Pickup' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setOrderType(opt.id)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10,
                background: orderType === opt.id ? '#8DC63F' : 'transparent',
                border: 'none',
                color: orderType === opt.id ? '#000' : 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'background 0.2s, color 0.2s',
              }}>
                {opt.icon ? <img src={opt.icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Delivery context — under toggle */}
          <div style={{ padding: '8px 16px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            {orderType === 'delivery' && (
              <div className={styles.addrWrap}>
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
              <div style={{ padding: '6px 0', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>🍽️ Walk-in / Eat at restaurant</div>
            )}
            {orderType === 'pickup' && (
              <div style={{ padding: '6px 0', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>🏪 Pick up at restaurant</div>
            )}
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
                      <button onClick={() => removeFromCart(item.id)} style={{ width: 30, height: 30, borderRadius: 8, background: '#333', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => addToCart(item)} style={{ width: 30, height: 30, borderRadius: 8, background: '#333', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)} style={{
                        marginLeft: 'auto', padding: '4px 10px', borderRadius: 8,
                        background: '#8DC63F',
                        border: 'none',
                        color: '#000',
                        fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {item.note?.trim() ? '📝' : '+'} Note
                      </button>
                    </div>
                    {/* Note preview */}
                    {item.note?.trim() && editingNoteId !== item.id && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 4, display: 'block', paddingLeft: 4 }}>📝 {item.note}</span>
                    )}
                    {/* Note slide-down editor */}
                    {editingNoteId === item.id && (
                      <div style={{ marginTop: 8, animation: 'fadeIn 0.2s ease' }}>
                        <textarea
                          className={styles.cartNoteInput}
                          style={{ resize: 'none', height: 60, lineHeight: 1.4, width: '100%', boxSizing: 'border-box' }}
                          placeholder="e.g. no chili, extra sauce, less rice, extra spicy…"
                          value={item.note ?? ''}
                          onChange={e => { if (e.target.value.length <= 150) updateNote(item.id, e.target.value) }}
                          autoFocus
                          maxLength={150}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{(item.note ?? '').length}/150</span>
                          <button className={styles.cartNoteDone} onClick={() => setEditingNoteId(null)}>Done</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Delivery / Dine In / Pickup card */}
                {orderType === 'delivery' && (deliveryFare ?? 0) > 0 && (
                  <div className={styles.cartPageItem} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>Delivery</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>~{eta} min · Payment To Driver</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15' }}>{fmtRp(deliveryFare)}</span>
                  </div>
                )}
                {orderType === 'dinein' && (
                  <div className={styles.cartPageItem} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🍽️</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>Dine In</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>~{avgPrepTime} min prep · Eat at restaurant</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Free</span>
                  </div>
                )}
                {orderType === 'pickup' && (
                  <div className={styles.cartPageItem} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>🏪</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>Pickup</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>~{avgPrepTime} min prep · Collect at restaurant</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>Free</span>
                  </div>
                )}

                {/* Total Order */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Total Order</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(grandTotal)}</span>
                </div>

                <div className={styles.cartDivider} style={{ margin: '0 0 12px' }} />

                {/* Payment method selection */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                    {paymentMethod === 'cod' ? 'Pay driver on arrival · Total order' : paymentMethod === 'bank' ? 'Food payment only · Delivery paid to driver on arrival' : 'Select how to pay'}
                  </span>
                  <div style={{ height: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setPaymentMethod('bank')} style={{
                      flex: 1, padding: '14px 8px', borderRadius: 12,
                      background: '#000',
                      border: `1.5px solid ${paymentMethod === 'bank' ? '#8DC63F' : 'rgba(255,255,255,0.12)'}`,
                      color: paymentMethod === 'bank' ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>🏦</span>
                      <span>Bank Transfer</span>
                      <span style={{ fontSize: 13, color: '#8DC63F', fontWeight: 900, animation: 'priceGlow 2s ease-in-out infinite' }}>Save 3%</span>
                    </button>
                    <button onClick={() => setPaymentMethod('cod')} style={{
                      flex: 1, padding: '14px 8px', borderRadius: 12,
                      background: '#000',
                      border: `1.5px solid ${paymentMethod === 'cod' ? '#8DC63F' : 'rgba(255,255,255,0.12)'}`,
                      color: paymentMethod === 'cod' ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 20 }}>💵</span>
                      <span>Cash on Delivery</span>
                    </button>
                  </div>
                  {paymentMethod === 'bank' && restaurant.bank && (
                    <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* Saved + Copy row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#FACC15' }}>Saved 3%</span>
                        <button onClick={() => { navigator.clipboard?.writeText(restaurant.bank.account_number); setCopyMsg(true); safeTimeout(() => setCopyMsg(false), 2000) }} style={{ padding: '4px 12px', borderRadius: 8, background: '#8DC63F', border: 'none', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{copyMsg ? '✓ Copied' : 'Copy'}</button>
                      </div>
                      {/* Row 1: Bank + account + QR */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{restaurant.bank.name} · {restaurant.bank.account_number}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{restaurant.bank.account_holder}</div>
                        </div>
                        {restaurant.bank.qr_url && (
                          <div onClick={() => setQrZoom(true)} style={{ flexShrink: 0, cursor: 'pointer', padding: 6, background: '#fff', borderRadius: 12, border: '2px solid rgba(141,198,63,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                            <img src={restaurant.bank.qr_url} alt="QR" style={{ width: 72, height: 72, borderRadius: 6, display: 'block' }} />
                          </div>
                        )}
                      </div>
                      {/* Row 2: Amount */}
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Food Only</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#FACC15' }}>{fmtRp(Math.round(cartTotal * 0.97))}</span>
                      </div>
                      {/* Row 3: Transaction code */}
                      <input value={transactionCode} onChange={e => setTransactionCode(e.target.value)} placeholder="Transaction code" className={styles.bankCodeInput} style={{ marginTop: 10 }} />
                    </div>
                  )}

                  {/* QR code fullscreen zoom */}
                  {qrZoom && restaurant.bank?.qr_url && (
                    <div onClick={() => setQrZoom(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                      <img src={restaurant.bank.qr_url} alt="QR Code" style={{ width: '75vw', maxWidth: 300, height: 'auto', borderRadius: 16, border: '2px solid rgba(255,255,255,0.1)' }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Scan to Pay</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Tap anywhere to close</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'none' }}>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Fixed bottom */}
          {cart.length > 0 && (
            <div className={styles.cartPageFooter}>
              {paymentMethod === 'bank' && orderType === 'delivery' && (deliveryFare ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 12px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Pay Driver On Delivery</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(deliveryFare)}</span>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 12px' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Pay Driver On Arrival</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(grandTotal)}</span>
                </div>
              )}
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
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Finding your driver...</p>
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

      {/* ── Driver tracking — full page ── */}
      {driverOnWay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9850, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2019,%202026,%2012_07_28%20AM.png?updatedAt=1776532065659" alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Order #{driverOnWay?.orderId ?? '—'}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: '#8DC63F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
              </div>
              <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{driverOnWay?.restaurant ?? ''}</span>
            </div>
            <button onClick={() => setDriverOnWay(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>

          {/* Visual delivery tracking */}
          <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
            {/* Phase image — full screen */}
            <img
              src={
                driverPhase === 'to_restaurant'
                  ? 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2016,%202026,%2006_36_14%20PM.png?updatedAt=1776339391906'
                  : driverPhase === 'to_customer'
                    ? (DRIVER_ON_WAY_IMAGES[driverImgIdx % DRIVER_ON_WAY_IMAGES.length] ?? DRIVER_ON_WAY_IMAGES[0])
                    : 'https://ik.imagekit.io/nepgaxllc/Rider_s%20view%20of%20a%20sport%20motorcycle%20dashboard.png?updatedAt=1776155502901'
              }
              alt=""
              key={driverPhase === 'to_customer' ? driverImgIdx : driverPhase}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.8s ease' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />

            {/* Status banner — top */}
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 2 }}>
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8DC63F', animation: 'ping 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', flex: 1 }}>
                  {driverPhase === 'to_restaurant' && 'Driver on the way to restaurant'}
                  {driverPhase === 'to_customer' && 'Food picked up — on the way to you'}
                  {driverPhase === 'arrived' && 'Driver has arrived!'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#8DC63F', flexShrink: 0 }}>~{driverOnWay?.eta ?? 0} min</span>
              </div>
            </div>

            {/* ETA + distance — bottom center */}
            <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, zIndex: 2, display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', display: 'block' }}>{driverOnWay?.eta ?? 0}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>MIN</span>
                </div>
                <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', display: 'block' }}>2.3</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>KM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver character overlay — sits between map and footer */}
          <img src="https://ik.imagekit.io/nepgaxllc/Untitlediuooiuoifsdfsdf-removebg-preview.png?updatedAt=1775659748531" alt="" style={{ position: 'absolute', right: 10, bottom: 220, width: 120, height: 120, objectFit: 'contain', zIndex: 3, pointerEvents: 'none' }} />

          {/* Bottom panel — driver info + progress */}
          <div style={{
            flexShrink: 0, padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden',
            backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/Untitledcasdasdddddd-removebg-preview.png)',
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          }}>
            {/* Driver card */}
            <div className={styles.driverCard}>
              {/* Animated glow ring behind profile */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #8DC63F', animation: 'ping 2s ease-in-out infinite', opacity: 0.4 }} />
                <img src={driverOnWay?.driverPhoto ?? ''} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #8DC63F', position: 'relative', zIndex: 1 }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{driverOnWay?.driverName ?? 'Driver'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>⭐ {driverOnWay?.rating ?? '—'}</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.7)', display: 'block', marginTop: 2, fontWeight: 700 }}>INDOO Verified Driver</span>

                {/* Bike row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src="https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'block' }}>{driverOnWay?.bikeBrand ?? ''}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{driverOnWay?.driverPlate ?? ''}</span>
                  </div>
                  <span className={styles.activePulse}>Active</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <a href={`tel:${driverOnWay?.phone ?? ''}`} style={{ width: 48, height: 48, borderRadius: 14, background: '#111', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <button onClick={() => { /* TODO: open in-app chat with driver */ }} style={{ width: 48, height: 48, borderRadius: 14, background: '#8DC63F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            </div>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', position: 'relative', zIndex: 1 }}>
              {/* Confirmed — always done */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 8, color: '#8DC63F', fontWeight: 700 }}>Confirmed</span>
              </div>
              {/* Bar: Confirmed → Pickup */}
              <div style={{ flex: 1, height: 3, borderRadius: 2, margin: '0 4px 12px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', ...(driverPhase === 'to_restaurant' ? { animation: 'barLoad 1.5s ease-in-out infinite' } : driverPhase !== 'to_restaurant' ? { width: '100%' } : {}) }} />
              </div>
              {/* Pickup */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {driverPhase === 'to_customer' || driverPhase === 'arrived' ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', animation: driverPhase === 'to_restaurant' ? 'ping 1.5s ease-in-out infinite' : 'none' }} />
                )}
                <span style={{ fontSize: 8, color: '#8DC63F', fontWeight: 700 }}>Pickup</span>
              </div>
              {/* Bar: Pickup → On Way */}
              <div style={{ flex: 1, height: 3, borderRadius: 2, margin: '0 4px 12px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                {driverPhase === 'to_customer' && <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', animation: 'barLoad 1.5s ease-in-out infinite' }} />}
                {(driverPhase === 'arrived') && <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', width: '100%' }} />}
              </div>
              {/* On Way */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {driverPhase === 'arrived' ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: driverPhase === 'to_customer' ? '#8DC63F' : 'rgba(255,255,255,0.1)', animation: driverPhase === 'to_customer' ? 'ping 1.5s ease-in-out infinite' : 'none' }} />
                )}
                <span style={{ fontSize: 8, color: driverPhase === 'to_customer' || driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>On Way</span>
              </div>
              {/* Bar: On Way → Arrived */}
              <div style={{ flex: 1, height: 3, borderRadius: 2, margin: '0 4px 12px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
                {driverPhase === 'arrived' && <div style={{ position: 'absolute', inset: 0, background: '#8DC63F', width: '100%' }} />}
              </div>
              {/* Arrived */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 8, color: driverPhase === 'arrived' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Arrived</span>
              </div>
            </div>
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
