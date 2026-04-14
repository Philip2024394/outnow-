import { useState, useRef, useEffect } from 'react'
import { formatDistance, walkMinutes } from '@/utils/distance'
import { useInterests } from '@/hooks/useInterests'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import { useOverlay } from '@/contexts/OverlayContext'
import { LANGUAGE_FLAGS } from '@/utils/lookingForLabels'
import styles from './DatingCard.module.css'
import GiftSetupPrompt from '@/components/gifting/GiftSetupPrompt'
import ProfileWishlistRow from '@/components/gifting/ProfileWishlistRow'
import WishlistSheet from '@/components/gifting/WishlistSheet'
import FoodOrderSheet from '@/components/gifting/FoodOrderSheet'
import FoodWishlistSheet from '@/components/gifting/FoodWishlistSheet'
import FoodBrowseSheet from '@/components/gifting/FoodBrowseSheet'
import RestaurantMenuSheet from '@/components/gifting/RestaurantMenuSheet'
import FoodOrderStatus from '@/components/orders/FoodOrderStatus'
import PaymentTransferScreen from '@/components/orders/PaymentTransferScreen'
import { getProfileWishlist } from '@/services/wishlistService'
import { supabase } from '@/lib/supabase'
import { CUISINE_TYPES, CUISINE_EMOJIS, CUISINE_IMAGES } from '@/constants/cuisineTypes'
import DateIdeasSheet from '@/components/dating/DateIdeasSheet'
import VibeBlasterSheet from '@/components/dating/VibeBlasterSheet'
import QAFeedScreen from '@/components/community/QAFeedScreen'
import VibeCheckSheet from '../panels/VibeCheckSheet'
import EchoFeedbackModal from '../panels/EchoFeedbackModal'
import VoiceIntroBar from '../panels/VoiceIntroBar'


const RELATIONSHIP_GOAL_LABELS = {
  casual:  '😊 Casual & Fun',
  serious: '💍 Something Serious',
  open:    '🌻 Open to Everything',
  friends: '👋 Friends First',
}
function SidePanelBtn({ label, onClick, active, pulse, color }) {
  return (
    <button
      className={`${styles.sideBtn} ${active ? styles.sideBtnActive : ''} ${pulse ? styles.sideBtnPulse : ''}`}
      style={active && color ? { background: `${color}25`, borderColor: color } : {}}
      onClick={onClick}
      aria-label={label}
    >
      <span className={styles.sideBtnLabel}>{label}</span>
    </button>
  )
}

// Fallback restaurants used when Supabase is unavailable — matches real schema
const FALLBACK_RESTAURANTS = [
  {
    id: 1, name: 'Warung Bu Sari', cuisine_type: 'Javanese', rating: 4.8,
    hero_dish_name: 'Nasi Gudeg Komplit', hero_dish_url: null,
    menu_items: [
      { id: 1,  name: 'Nasi Gudeg Komplit', price: 28000, photo_url: null, description: 'Jackfruit curry, egg, chicken on rice', is_available: true },
      { id: 2,  name: 'Nasi Gudeg Telur',   price: 18000, photo_url: null, description: 'Jackfruit curry with egg',               is_available: true },
      { id: 8,  name: 'Es Teh Manis',       price:  5000, photo_url: null, description: 'Sweet iced tea',                         is_available: true },
      { id: 9,  name: 'Es Jeruk Peras',     price:  8000, photo_url: null, description: 'Hand-squeezed orange juice',              is_available: true },
    ],
  },
  {
    id: 2, name: 'Bakso Pak Budi', cuisine_type: 'Indonesian', rating: 4.6,
    hero_dish_name: 'Bakso Spesial', hero_dish_url: null,
    menu_items: [
      { id: 6,  name: 'Bakso Spesial',  price: 22000, photo_url: null, description: 'Giant meatball, noodles, broth', is_available: true },
      { id: 7,  name: 'Bakso Biasa',    price: 15000, photo_url: null, description: 'Regular meatball soup',          is_available: true },
      { id: 8,  name: 'Mie Goreng',     price: 18000, photo_url: null, description: 'Fried noodles',                  is_available: true },
      { id: 9,  name: 'Es Campur',      price:  8000, photo_url: null, description: 'Mixed ice dessert drink',        is_available: true },
    ],
  },
  {
    id: 3, name: 'Ayam Geprek Mbak Rina', cuisine_type: 'Indonesian', rating: 4.9,
    hero_dish_name: 'Ayam Geprek Level 10', hero_dish_url: null,
    menu_items: [
      { id: 10, name: 'Ayam Geprek L5',  price: 25000, photo_url: null, description: 'Medium spicy + rice',  is_available: true },
      { id: 11, name: 'Ayam Geprek L10', price: 25000, photo_url: null, description: 'Max heat — challenge!', is_available: true },
      { id: 12, name: 'Tahu Tempe',      price:  8000, photo_url: null, description: 'Fried tofu & tempeh',   is_available: true },
      { id: 13, name: 'Es Teh Tarik',    price:  7000, photo_url: null, description: 'Pulled milk tea',       is_available: true },
    ],
  },
  {
    id: 7, name: 'Seafood Pak Dhe Bejo', cuisine_type: 'Indonesian', rating: 4.7,
    hero_dish_name: 'Udang Bakar Madu', hero_dish_url: null,
    menu_items: [
      { id: 50, name: 'Udang Bakar Madu',   price: 85000, photo_url: null, description: 'Honey-glazed grilled prawns', is_available: true },
      { id: 51, name: 'Cumi Goreng Tepung', price: 55000, photo_url: null, description: 'Crispy battered squid rings', is_available: true },
      { id: 57, name: 'Es Kelapa Muda',     price: 15000, photo_url: null, description: 'Young coconut served whole',  is_available: true },
      { id: 58, name: 'Jus Alpukat Susu',   price: 18000, photo_url: null, description: 'Creamy avocado milk blend',   is_available: true },
    ],
  },
  {
    id: 9, name: 'Kopi Klotok Maguwo', cuisine_type: 'Cafe', rating: 4.8,
    hero_dish_name: 'Kopi Joss', hero_dish_url: null,
    menu_items: [
      { id: 70, name: 'Kopi Joss',           price: 12000, photo_url: null, description: 'Black coffee with charcoal', is_available: true },
      { id: 71, name: 'Kopi Susu Gula Aren', price: 18000, photo_url: null, description: 'Espresso, palm sugar, milk', is_available: true },
      { id: 75, name: 'Roti Bakar Keju',     price: 22000, photo_url: null, description: 'Toasted bread with cheese',  is_available: true },
      { id: 77, name: 'Indomie Goreng',      price: 15000, photo_url: null, description: 'Classic fried noodles',      is_available: true },
    ],
  },
  {
    id: 10, name: 'Sate & Gule Pak Sabar', cuisine_type: 'Javanese', rating: 4.8,
    hero_dish_name: 'Sate Kambing 10pcs', hero_dish_url: null,
    menu_items: [
      { id: 80, name: 'Sate Kambing 10pcs', price: 55000, photo_url: null, description: 'Goat satay, charcoal grilled',       is_available: true },
      { id: 81, name: 'Sate Ayam 10pcs',    price: 35000, photo_url: null, description: 'Chicken satay, peanut sauce',        is_available: true },
      { id: 82, name: 'Gule Kambing',       price: 35000, photo_url: null, description: 'Spiced goat curry with lontong',     is_available: true },
      { id: 86, name: 'Es Teh Manis',       price:  5000, photo_url: null, description: 'Sweet iced tea',                     is_available: true },
    ],
  },
]

// Step 1 — cuisine type circles
function CuisineCarousel({ restaurants, onSelect, onClose }) {
  const scrollRef = useRef(null)
  const scroll = dir => scrollRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  // All cuisine types from master list — vendor count from available restaurants
  const cuisines = CUISINE_TYPES.map(type => ({
    type,
    count: restaurants.filter(r => r.cuisine_type === type).length,
    emoji: CUISINE_EMOJIS[type] ?? '🍽️',
    image: CUISINE_IMAGES[type] ?? null,
  }))

  return (
    <div className={styles.foodCarouselWrap}>
      <div className={styles.foodCarouselHeader}>
        <span className={styles.foodCarouselTitle}>What are you craving?</span>
        <button className={styles.foodCarouselClose} onClick={onClose}>✕</button>
      </div>
      <div className={styles.foodCarouselRow}>
        <button className={styles.foodCarouselArrow} onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
        <div className={styles.foodCarouselScroll} ref={scrollRef}>
          {cuisines.map(c => (
            <button key={c.type} className={styles.foodDish} onClick={() => onSelect(c.type)}>
              <div className={styles.foodDishImg}>
                {c.image
                  ? <img src={c.image} alt={c.type} className={styles.foodDishPhoto}
                      onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                  : null}
                <div className={styles.foodDishFallback} style={c.image ? { display: 'none' } : {}}>{c.emoji}</div>
              </div>
              <span className={styles.foodDishName}>{c.type}</span>
              <span className={styles.foodDishCuisine}>{c.count} vendor{c.count !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        <button className={styles.foodCarouselArrow} onClick={() => scroll(1)} aria-label="Scroll right">›</button>
      </div>
    </div>
  )
}

// Step 2 — restaurants in selected cuisine
function RestaurantListPanel({ cuisine, restaurants, onSelect, onBack }) {
  const filtered = restaurants.filter(r => r.cuisine_type === cuisine)
  return (
    <div className={`${styles.foodCarouselWrap} ${styles.foodCarouselWrapBg}`}>
      <div className={styles.foodCarouselHeader}>
        <button className={styles.foodCarouselBack} onClick={onBack}>‹</button>
        <span className={styles.foodCarouselTitle}>{cuisine}</span>
        <button className={styles.foodCarouselClose} onClick={onBack}>✕</button>
      </div>
      <div className={styles.restaurantListScroll}>
        {filtered.map(r => {
          const coverImg = r.cover_url ?? r.photo_url ?? CUISINE_IMAGES[r.cuisine_type] ?? null
          return (
          <button key={r.id} className={styles.restaurantCard} onClick={() => onSelect(r)}>
            <div className={styles.restaurantCardImg}>
              {coverImg
                ? <img src={coverImg} alt={r.name} className={styles.restaurantCardPhoto}
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }} />
                : null}
              <span style={coverImg ? { display: 'none' } : {}}>{CUISINE_EMOJIS[r.cuisine_type] ?? '🏪'}</span>
            </div>
            <div className={styles.restaurantCardInfo}>
              <span className={styles.restaurantCardName}>{r.name}</span>
              <div className={styles.restaurantCardMeta}>
                {r.rating && <span className={styles.restaurantCardRating}>★ {Number(r.rating).toFixed(1)}</span>}
                <span className={styles.restaurantCardCuisine}>{(r.menu_items ?? []).length} items</span>
              </div>
            </div>
            <span className={styles.restaurantCardArrow}>›</span>
          </button>
        )})}
      </div>
    </div>
  )
}

/** Full-screen profile layout for Dating & Romance */
export default function DatingCard({ open, session, onClose, showToast, onGuestAction, onMeetSent, onConnect, onLike, onGift }) {
  useOverlay()
  const { user }  = useAuth()
  const { myInterests, mutualSessions } = useInterests()

  const [meetLoading, setMeetLoading] = useState(false)
  const [meetSent,    setMeetSent]    = useState(false)
  const [liked,       setLiked]       = useState(false)
  const [hearts,      setHearts]      = useState([])
  const [photoIdx,    setPhotoIdx]    = useState(0)

  // Panel state
  const [panel,          setPanel]          = useState(null) // 'dateIdeas' | 'vibeCheck' | 'bio'
  const [echoOpen,       setEchoOpen]       = useState(false)
  const [giftSetupOpen,  setGiftSetupOpen]  = useState(false)
  const [wishlistOpen,    setWishlistOpen]    = useState(false)
  const [profileWishlist, setProfileWishlist] = useState([])
  const [foodOpen,        setFoodOpen]        = useState(false)  // own profile: wishlist manager
  const [foodBrowseOpen,  setFoodBrowseOpen]  = useState(false)  // others: restaurant picker
  const [foodCart,      setFoodCart]      = useState([])
  const [foodCartOpen,  setFoodCartOpen]  = useState(false)
  const [foodOrderItem,       setFoodOrderItem]       = useState(null)
  const [vibeBlasterOpen,     setVibeBlasterOpen]     = useState(false)
  const [qaFeedOpen,          setQaFeedOpen]          = useState(false)
  const [connectText,         setConnectText]         = useState('')
  const [heartSent,           setHeartSent]           = useState(false)
  const [heartRain,           setHeartRain]           = useState([])
  const [foodPanelOpen,       setFoodPanelOpen]       = useState(false)
  const [cuisineStep,         setCuisineStep]         = useState(null) // null=cuisine list, string=restaurant list
  const [menuSheetRestaurant, setMenuSheetRestaurant] = useState(null)
  const [paymentOrder,        setPaymentOrder]        = useState(null)  // awaiting transfer
  const [liveOrder,           setLiveOrder]           = useState(null)  // tracking card
  const [nearbyRestaurants,   setNearbyRestaurants]   = useState(FALLBACK_RESTAURANTS)
  const [restaurantsLoaded,   setRestaurantsLoaded]   = useState(false)

  const isOwnProfile = !!(user && session && (user.uid === session.userId || user.id === session.userId))

  const updateFoodCartQty = (id, delta) => {
    setFoodCart(prev => {
      const next = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0)
      return next
    })
  }

  const formatCartIDR = (n) => {
    if (!n) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
    return `${Number(n).toLocaleString('id-ID')}rp`
  }

  const cartTotal = foodCart.reduce((s, c) => s + c.price * c.qty, 0)

  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  // Swipe-down dismiss
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) { currentYRef.current = delta; sheet.style.transform = `translateY(${Math.min(delta * 0.4, 80)}px)`; sheet.style.transition = 'none' }
    }
    const onTouchEnd = () => {
      sheet.style.transition = 'transform 0.3s ease'
      if (currentYRef.current > 100) onClose()
      else sheet.style.transform = ''
      startYRef.current = null; currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  // Reset panels on open/close — also reset restaurant fetch so each profile gets fresh data
  useEffect(() => {
    if (open) {
      setPanel(null); setPhotoIdx(0); setMeetSent(false); setLiked(false)
      setNearbyRestaurants(FALLBACK_RESTAURANTS); setRestaurantsLoaded(false)
    } else {
      setFoodCart([]); setFoodCartOpen(false); setFoodOrderItem(null)
      setFoodPanelOpen(false); setCuisineStep(null)
    }
  }, [open])

  // Fetch nearby restaurants when food panel first opens
  useEffect(() => {
    if (!foodPanelOpen || restaurantsLoaded) return
    const city = session?.city ?? session?.area ?? null
    async function load() {
      try {
        let q = supabase
          .from('restaurants')
          .select('*, menu_items(*)')
          .eq('status', 'approved')
          .order('rating', { ascending: false })
          .limit(8)
        if (city) q = q.ilike('city', `%${city}%`)
        const { data } = await q
        setNearbyRestaurants(data?.length ? data : FALLBACK_RESTAURANTS)
      } catch {
        setNearbyRestaurants(FALLBACK_RESTAURANTS)
      }
      setRestaurantsLoaded(true)
    }
    load()
  }, [foodPanelOpen, restaurantsLoaded, session])

  // Fetch other profile's product wishlist
  useEffect(() => {
    if (!open || !session?.userId || isOwnProfile) { setProfileWishlist([]); return }
    getProfileWishlist(session.userId, 'product').then(setProfileWishlist)
  }, [open, session?.userId, isOwnProfile])

  if (!open || !session) return null

  const isScheduled = session.status === 'scheduled'
  const isInviteOut = session.status === 'invite_out'
  const isOutNow    = !isScheduled && !isInviteOut
  const statusColor = isInviteOut ? '#F5C518' : isScheduled ? '#E8890C' : '#E8458C'
  const MOOD_COLORS = { warm: '#E8458C', cool: '#FBBF24', pink: '#F472B6' }
  const moodColor   = MOOD_COLORS[session.moodLight] ?? null

  const photos      = session.photos?.length ? session.photos : session.photoURL ? [session.photoURL] : []
  const isMutual    = mutualSessions.has(session.id)
  const hasInterest = myInterests.has(session.id)

  const matchBase    = 55 + (session.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 36)
  const matchPercent = Math.min(99, matchBase + (isMutual ? 8 : 0) + (hasInterest ? 4 : 0))

  const handleLetsMeet = async () => {
    if (onGuestAction) { onGuestAction(); return }
    // Already connected — re-open chat window
    if (meetSent || hasInterest) {
      onConnect?.(session, connectText.trim() || null)
      setConnectText('')
      return
    }
    const firstMsg = connectText.trim() || null
    if (session.isSeeded) {
      setMeetSent(true)
      setConnectText('')
      onMeetSent?.(session)
      onConnect?.(session, firstMsg)
      return
    }
    setMeetLoading(true)
    try {
      await sendMeetRequest(
        { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
        session.userId, session.id
      )
      setMeetSent(true)
      setConnectText('')
      onMeetSent?.(session)
      onConnect?.(session, firstMsg)
    } catch { showToast?.('Could not send. Try again.', 'error') }
    setMeetLoading(false)
  }

  const handleHeartPress = async () => {
    if (heartSent || isOwnProfile) return
    setHeartSent(true)
    // Spawn heart rain — hearts fall down the full screen
    const batch = Array.from({ length: 22 }, (_, i) => ({
      id: Date.now() + i,
      left:  Math.random() * 88 + 6,       // % from left
      delay: Math.random() * 1.8,
      size:  Math.floor(Math.random() * 18) + 18,
      rot:   Math.floor(Math.random() * 30) - 15,
    }))
    setHeartRain(batch)
    setTimeout(() => setHeartRain([]), 3200)
    // Persist "liked me" notification to both users
    try {
      const myId    = user?.id ?? user?.uid
      const myName  = user?.displayName ?? 'Someone'
      const myPhoto = user?.photoURL ?? null
      if (supabase && myId && session.userId) {
        await supabase.from('notifications').insert({
          user_id:       session.userId,
          from_user_id:  myId,
          type:          'liked_me',
          title:         `${myName} sent you love 💕`,
          body:          `${myName} tapped the heart on your profile`,
          from_photo_url: myPhoto,
        })
      }
    } catch { /* silent */ }
  }

  const handleLike = () => {
    if (liked) return
    setLiked(true); onLike?.(session)
    const batch = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      left: 30 + (Math.random() * 40 - 20),
      delay: i * 0.12,
      size: 14 + Math.random() * 10,
    }))
    setHearts(batch)
    setTimeout(() => setHearts([]), 2000)
    if (isMutual) {
      showToast?.(`🎉 It's a match! Chat with ${session.displayName} is opening!`, 'success')
      setTimeout(() => onMeetSent?.(session), 900)
    } else {
      showToast?.(`💕 You liked ${session.displayName}!`, 'success')
    }
  }

  const togglePanel = (name) => setPanel(p => p === name ? null : name)

  return (
    <>
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.card} style={moodColor ? { '--mood-color': moodColor } : {}}>

        {/* ── Background photo ── */}
        {photos.length > 0 ? (
          <img key={photoIdx} src={photos[photoIdx]} alt={session.displayName} className={styles.bgPhoto} />
        ) : (
          <div className={styles.noPhotoBg}>
            <span className={styles.noPhotoEmoji}>💕</span>
            <span className={styles.noPhotoName}>{session.displayName ?? 'Someone special'}</span>
          </div>
        )}

        {/* Mood ring */}
        {moodColor && <div className={styles.moodRing} />}

        {/* Gradient overlay */}
        <div className={styles.photoOverlay} />

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className={styles.photoDots}>
            {photos.map((_, i) => (
              <button key={i} className={`${styles.photoDot} ${i === photoIdx ? styles.photoDotActive : ''}`} onClick={() => setPhotoIdx(i)} />
            ))}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div className={styles.topBadges}>
            <div className={styles.datingBadge}>Dating &amp; Romance</div>
            {session.isVerified && (
              <div className={styles.verifiedBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#E8458C" stroke="#E8458C" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Verified</span>
              </div>
            )}
            {moodColor && (
              <div className={styles.moodBadge} style={{ background: `${moodColor}22`, borderColor: `${moodColor}55`, color: moodColor }}>
                {session.moodLight === 'warm' ? 'Open' : session.moodLight === 'cool' ? 'Busy' : 'On a date'}
              </div>
            )}
          </div>
          <button className={styles.reportBtn} onClick={() => showToast?.('Report submitted — we review within 24h.', 'success')}>Report</button>
          {!isOwnProfile && foodCart.length > 0 && (
            <button className={styles.cartBtn} onClick={() => setFoodCartOpen(o => !o)} aria-label="Food cart">
              Cart
              <span className={styles.cartCount}>{foodCart.reduce((s, c) => s + c.qty, 0)}</span>
            </button>
          )}
        </div>

        {/* ── Food cart dropdown ── */}
        {foodCartOpen && !isOwnProfile && (
          <div className={styles.cartDropdown} onClick={e => e.stopPropagation()}>
            <div className={styles.cartDropHead}>
              <span className={styles.cartDropTitle}>Gift Cart ({foodCart.length})</span>
              <button className={styles.cartDropClose} onClick={() => setFoodCartOpen(false)}>✕</button>
            </div>
            {foodCart.length === 0
              ? <div className={styles.cartEmpty}>Cart is empty</div>
              : <>
                  {foodCart.map(item => (
                    <div key={item.id} className={styles.cartItemRow}>
                      {item.image
                        ? <img src={item.image} alt={item.name} className={styles.cartItemImg} />
                        : <div className={styles.cartItemImgFallback}>—</div>
                      }
                      <div className={styles.cartItemInfo}>
                        <div className={styles.cartItemName}>{item.name}</div>
                        <div className={styles.cartItemPrice}>{formatCartIDR(item.price * item.qty)}</div>
                      </div>
                      <div className={styles.cartQtyRow}>
                        <button className={styles.cartQtyBtn} onClick={() => updateFoodCartQty(item.id, -1)}>
                          {item.qty === 1 ? '×' : '−'}
                        </button>
                        <span className={styles.cartQtyNum}>{item.qty}</span>
                        <button className={styles.cartQtyBtn} onClick={() => updateFoodCartQty(item.id, 1)}>+</button>
                      </div>
                      <button
                        className={styles.cartSendBtn}
                        onClick={() => {
                          setFoodCartOpen(false)
                          setFoodOrderItem({
                            product: { id: item.id, name: item.name, price: item.price, currency: item.currency, image: item.image, image_url: item.image },
                            seller:  { id: item.sellerId, displayName: item.sellerName, brandName: item.sellerName },
                          })
                        }}
                      >Send</button>
                    </div>
                  ))}
                  <div className={styles.cartFoot}>
                    <div className={styles.cartTotal}>
                      <span className={styles.cartTotalLabel}>Est. total</span>
                      <span className={styles.cartTotalVal}>{formatCartIDR(cartTotal)}</span>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* ── Right side panel ── */}
        <div className={styles.sidePanel}>
          <SidePanelBtn label="Like"    active={liked}                 color="#E8458C" onClick={handleLike} />
          <SidePanelBtn label="Message"                                               onClick={() => { if (onGuestAction) { onGuestAction(); return } onConnect?.(session) }} />
          <SidePanelBtn label="Ideas"   active={panel === 'dateIdeas'}                onClick={() => togglePanel('dateIdeas')} />
          <SidePanelBtn label="Vibe"    active={vibeBlasterOpen}                      onClick={() => setVibeBlasterOpen(true)} />
          <SidePanelBtn label="Q&A"     active={qaFeedOpen}                           onClick={() => setQaFeedOpen(true)} />
          <SidePanelBtn label="Food"    active={!isOwnProfile && foodPanelOpen} color="#E8458C" onClick={() => isOwnProfile ? setFoodOpen(true) : setFoodPanelOpen(o => !o)} />
          <SidePanelBtn label="Gift"                                                  onClick={() => isOwnProfile ? setGiftSetupOpen(true) : onGift?.(session)} />
          {session.lastSeenDaysAgo >= 7 && (
            <SidePanelBtn label="Reset" pulse onClick={() => showToast?.('Second Chance sent — they\'ll see a purple ring.', 'success')} />
          )}
        </div>

        {/* Floating hearts (Like button) */}
        {hearts.map(h => (
          <span key={h.id} className={styles.floatingHeart} style={{ right: `${h.left + 60}px`, bottom: '40%', fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}>💕</span>
        ))}

        {/* Heart rain (heart button) — falls down full screen */}
        {heartRain.map(h => (
          <span
            key={h.id}
            className={styles.heartRain}
            style={{ left: `${h.left}%`, fontSize: `${h.size}px`, animationDelay: `${h.delay}s`, '--rot': `${h.rot}deg` }}
          >💕</span>
        ))}

        {/* ── Bottom overlay ── */}
        <div className={styles.bottomOverlay}>

          {/* Voice intro */}
          {session.voiceIntroUrl && (
            <VoiceIntroBar voiceIntroUrl={session.voiceIntroUrl} displayName={session.displayName} />
          )}

          {/* Name + age inline */}
          <div className={styles.nameRow}>
            {session.idVerified && (
              <span className={styles.idVerifiedStar} title="ID Verified">⭐</span>
            )}
            <span className={styles.name}>{session.displayName ?? 'Someone'}</span>
            {session.age && (
              <span className={styles.nameAge}>{session.age}</span>
            )}
            {isOutNow && <span className={styles.liveDot} />}
            {session.starSign && (
              <span className={styles.starSign}>{session.starSign}</span>
            )}
          </div>

          {/* Bio — 3 lines max, directly under name */}
          {session.bio && (
            <p className={styles.bioInline} onClick={() => togglePanel('bio')}>
              {session.bio.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim()}
            </p>
          )}

          {/* Country */}
          {session.country && (
            <p className={styles.countryLine}>📍 {session.country}</p>
          )}

          {/* Languages spoken */}
          {(session.speakingNative || session.speakingSecond) && (
            <div className={styles.langRow}>
              {session.speakingNative && (
                <span className={styles.langChip}>
                  {LANGUAGE_FLAGS[session.speakingNative] ?? '🌐'} {session.speakingNative}
                </span>
              )}
              {session.speakingSecond && (
                <span className={styles.langChip}>
                  {LANGUAGE_FLAGS[session.speakingSecond] ?? '🌐'} {session.speakingSecond}
                </span>
              )}
            </div>
          )}

          {/* Location + distance */}
          <div className={styles.metaRow}>
            {(session.city || session.area) && <span className={styles.city}>{session.city ?? session.area}</span>}
            {formatDistance(session.distanceKm) != null && (
              <span className={styles.distance}>
                {walkMinutes(session.distanceKm) != null ? `${walkMinutes(session.distanceKm)} min walk` : formatDistance(session.distanceKm)}
              </span>
            )}
          </div>

          {/* Dating-specific info chips */}
          <div className={styles.infoChips}>
            {session.relationshipGoal && (
              <span className={styles.chip}>{RELATIONSHIP_GOAL_LABELS[session.relationshipGoal] ?? session.relationshipGoal}</span>
            )}
            {session.height && <span className={styles.chip}>{session.height}</span>}
          </div>

          {/* Wishlist strip — other profiles only */}
          {!isOwnProfile && profileWishlist.length > 0 && (
            <ProfileWishlistRow
              items={profileWishlist}
              recipient={session}
              showToast={showToast}
            />
          )}

          {/* ── Food panel — Step 1: cuisine types ── */}
          {!isOwnProfile && foodPanelOpen && !cuisineStep && (
            <CuisineCarousel
              restaurants={nearbyRestaurants}
              onSelect={setCuisineStep}
              onClose={() => { setFoodPanelOpen(false); setCuisineStep(null) }}
            />
          )}

          {/* ── Food panel — Step 2: restaurants in cuisine ── */}
          {!isOwnProfile && foodPanelOpen && cuisineStep && (
            <RestaurantListPanel
              cuisine={cuisineStep}
              restaurants={nearbyRestaurants}
              onSelect={r => { setFoodPanelOpen(false); setCuisineStep(null); setMenuSheetRestaurant(r) }}
              onBack={() => setCuisineStep(null)}
            />
          )}

          {/* ── Chat input row (replaces Let's Connect button) ── */}
          <div className={styles.connectRow}>
            <span className={styles.connectMatchPill}>{matchPercent}%</span>
            <input
              className={styles.connectInput}
              value={connectText}
              onChange={e => setConnectText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleLetsMeet()}
              placeholder={
                meetSent || hasInterest
                  ? '✓ Connected — open chat'
                  : `Message ${session.displayName?.split(' ')[0] ?? 'them'}…`
              }
              disabled={meetLoading}
            />
            <button
              className={`${styles.connectSendBtn} ${meetSent || hasInterest ? styles.connectSendBtnDone : ''}`}
              onClick={handleLetsMeet}
              disabled={meetLoading}
              aria-label="Connect"
            >
              {meetLoading ? (
                <span style={{ fontSize: 13 }}>…</span>
              ) : meetSent || hasInterest ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
            {!isOwnProfile && (
              <button
                className={`${styles.heartBtn} ${heartSent ? styles.heartBtnSent : ''}`}
                onClick={handleHeartPress}
                disabled={heartSent}
                aria-label="Send love"
              >
                💕
              </button>
            )}
          </div>
        </div>


        {/* ── Sliding panels ── */}

        {/* Bio */}
        {panel === 'bio' && (
          <div className={styles.bioOverlay}>
            <div className={styles.bioHandle} onClick={() => setPanel(null)} />
            {photos.length > 0 && (
              <div className={styles.bioImgWrap}>
                <img src={photos[photoIdx]} alt={session.displayName} className={styles.bioImgEl} />
                <div className={styles.bioImgGrad} />
                {session.starSign && (
                  <div className={styles.starSignBadge}>
                    <span>{session.starSign}</span>
                  </div>
                )}
              </div>
            )}
            <div className={styles.bioBody}>
              <p className={styles.bioBodyText}>{session.bio ?? `${session.displayName} is looking for someone special.`}</p>
              {photos.length > 1 && (
                <div className={styles.thumbRow}>
                  {photos.map((url, i) => (
                    <button key={i} className={`${styles.thumb} ${i === photoIdx ? styles.thumbActive : ''}`} onClick={() => setPhotoIdx(i)}>
                      <img src={url} alt="" className={styles.thumbImg} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Ideas */}
        {panel === 'dateIdeas' && (
          <DateIdeasSheet open={true} targetSession={session} onClose={() => setPanel(null)} />
        )}

        {/* Vibe Check */}
        <VibeCheckSheet
          open={panel === 'vibeCheck'}
          targetSession={session}
          onClose={() => setPanel(null)}
          showToast={showToast}
        />


        {/* Echo Feedback */}
        <EchoFeedbackModal
          open={echoOpen}
          targetSession={session}
          onClose={() => setEchoOpen(false)}
          showToast={showToast}
        />

      </div>
    </div>

    {/* Vibe Blaster */}
    <VibeBlasterSheet
      open={vibeBlasterOpen}
      onClose={() => setVibeBlasterOpen(false)}
      showToast={showToast}
    />

    {/* Q&A Live Feed — QAFeedScreen portals itself to document.body */}
    <QAFeedScreen
      open={qaFeedOpen}
      onClose={() => setQaFeedOpen(false)}
      user={user}
      viewerSession={{ ...session, category: 'dating' }}
      targetUserId={session?.userId ?? session?.id ?? null}
    />

    {/* Gift setup prompt — own profile only */}
    <GiftSetupPrompt
      open={giftSetupOpen}
      onClose={() => setGiftSetupOpen(false)}
      onShop={() => { setGiftSetupOpen(false); onGift?.(session) }}
      onWishlist={() => { setGiftSetupOpen(false); setWishlistOpen(true) }}
      showToast={showToast}
    />

    {/* Wishlist manager — own profile only */}
    <WishlistSheet
      open={wishlistOpen}
      onClose={() => setWishlistOpen(false)}
      showToast={showToast}
    />

    {/* Food cravings manager — own profile only */}
    <FoodWishlistSheet
      open={foodOpen}
      onClose={() => setFoodOpen(false)}
      showToast={showToast}
    />

    {/* Restaurant picker — order food for someone else */}
    <FoodBrowseSheet
      open={foodBrowseOpen}
      recipientCity={session.city ?? session.area ?? null}
      giftFor={session}
      onClose={() => setFoodBrowseOpen(false)}
      showToast={showToast}
    />

    {/* Restaurant full menu — opened when a carousel dish is tapped */}
    <RestaurantMenuSheet
      open={!!menuSheetRestaurant}
      restaurant={menuSheetRestaurant}
      giftFor={session}
      onClose={() => setMenuSheetRestaurant(null)}
      onOrderPlaced={order => { setMenuSheetRestaurant(null); setPaymentOrder(order) }}
    />

    {paymentOrder && (
      <PaymentTransferScreen
        order={paymentOrder}
        onSubmitted={() => setLiveOrder(paymentOrder)}
        onExpired={() => { setPaymentOrder(null); showToast?.('Order expired — payment not received in time') }}
      />
    )}

    {liveOrder && (
      <FoodOrderStatus
        order={liveOrder}
        onClose={() => { setLiveOrder(null); setPaymentOrder(null) }}
      />
    )}

    {/* Food order sheet — fallback for any direct single-item path */}
    <FoodOrderSheet
      open={!!foodOrderItem}
      product={foodOrderItem?.product ?? null}
      seller={foodOrderItem?.seller ?? null}
      giftFor={session}
      onClose={() => setFoodOrderItem(null)}
      showToast={showToast}
    />
    </>
  )
}
