import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useAppOverlays } from './useAppOverlays'
import { createPortal } from 'react-dom'
import { useOverlay, OVERLAY } from '@/contexts/OverlayContext'
import { useMySession } from '@/hooks/useMySession'
import { useInterests } from '@/hooks/useInterests'
import { sortByRelevance, recordImpression, resetImpressions } from '@/utils/sessionScore'
import { isMakerSession } from '@/utils/sessionCategory'
import { useLiveUsers } from '@/hooks/useLiveUsers'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import { useMeetRequests } from '@/hooks/useMeetRequests'
import { supabase } from '@/lib/supabase'

import { useInviteOut } from '@/hooks/useInviteOut'
import InviteOutSheet from '@/components/golive/InviteOutSheet'
import MapHeader from '@/components/map/MapHeader'
import MapOverlay from '@/components/map/MapOverlay'
import { endSession } from '@/services/sessionService'
import { getSafetyContact } from '@/components/safety/SafetySheet'
import ProfileStrip from '@/components/map/ProfileStrip'
import BoostBanner from '@/components/ui/BoostBanner'
import StatusCheckInBanner from '@/components/status/StatusCheckInBanner'
import { useStatusCheckIn } from '@/hooks/useStatusCheckIn'
import BottomNav from '@/components/nav/BottomNav'
import SectionGateSheet, { checkSectionAccess } from '@/components/ui/SectionGateSheet'
import GoLiveSheet from '@/components/golive/GoLiveSheet'
import ActiveSessionBar from '@/components/session/ActiveSessionBar'
import StillHerePrompt from '@/components/session/StillHerePrompt'
import WaveBanner from '@/components/meet/WaveBanner'
import DateInvitePopup  from '@/components/dating/DateInvitePopup'
import { useDateInvites } from '@/hooks/useDateInvites'
import MeetAcceptedBanner from '@/components/meet/MeetAcceptedBanner'
import MapFilterSheet, { DEFAULT_MAP_FILTERS } from '@/components/map/MapFilterSheet'
import CountrySearchSheet, { COUNTRIES } from '@/components/map/CountrySearchSheet'
import MapSearchBar from '@/components/map/MapSearchBar'
import GlobalSearchSuggest from '@/components/search/GlobalSearchSuggest'
import { useIpCountry } from '@/hooks/useIpCountry'
import MomentumBanner from '@/components/map/MomentumBanner'
import ExtendSessionPrompt from '@/components/ui/ExtendSessionPrompt'
import { useLikedProfiles } from '@/hooks/useLikedProfiles'
import { DEMO_DATING_BUBBLES } from '@/demo/mockData'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'

import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import BottomSheet from '@/components/ui/BottomSheet'
import Toast from '@/components/ui/Toast'
import VibeCheckBanner     from '@/components/vibecheck/VibeCheckBanner'

import TimeBackground from '@/components/ui/TimeBackground'
import FloatingIcons from '@/components/home/FloatingIcons'
import IntentGrid from '@/components/ui/IntentGrid'
import ReviewPrompt from '@/components/restaurant/ReviewPrompt'
import DriverRegistration from '@/components/driver/DriverRegistration'
import TherapistRegistration from '@/domains/massage/components/TherapistRegistration'

import '@/styles/map.css'
import styles from './AppShell.module.css'

// ── Lazy-loaded heavy screens (only downloaded when user opens them) ──────────
const ChatScreen              = lazy(() => import('@/screens/ChatScreen'))
const ProfileScreen           = lazy(() => import('@/screens/ProfileScreen'))
const BookingScreen           = lazy(() => import('@/screens/BookingScreen'))
const ShopSearchScreen        = lazy(() => import('@/screens/ShopSearchScreen'))
const DatingBubbleScreen      = lazy(() => import('@/components/dating/DatingBubbleScreen'))
const CategoryDiscoveryScreen = lazy(() => import('@/screens/CategoryDiscoveryScreen'))
const RestaurantBrowseScreen  = lazy(() => import('@/screens/RestaurantBrowseScreen'))
const QAFeedScreen            = lazy(() => import('@/components/community/QAFeedScreen'))
const VibeBlastPage           = lazy(() => import('@/components/vibecheck/VibeBlastPage'))
const NotificationsScreen     = lazy(() => import('@/screens/NotificationsScreen'))
const RideHistoryScreen       = lazy(() => import('@/screens/RideHistoryScreen'))
const LikedMeScreen           = lazy(() => import('@/screens/LikedMeScreen'))
const LikedProfilesScreen     = lazy(() => import('@/screens/LikedProfilesScreen'))
const BlockedUsersScreen      = lazy(() => import('@/screens/BlockedUsersScreen'))
const RentalSearchScreen      = lazy(() => import('@/screens/RentalSearchScreen'))
const MassageScreen           = lazy(() => import('@/screens/MassageScreen'))
const OrderHistoryScreen      = lazy(() => import('@/screens/OrderHistoryScreen'))
const IncomingGiftsScreen     = lazy(() => import('@/screens/IncomingGiftsScreen'))
const SettingsSheet           = lazy(() => import('@/components/settings/SettingsSheet'))
const DiscoveryCard           = lazy(() => import('@/components/discovery/DiscoveryCard'))
const DiscoveryListSheet      = lazy(() => import('@/components/discovery/DiscoveryListSheet'))
const SOSModal                = lazy(() => import('@/components/safety/SOSModal'))
const PaymentGate             = lazy(() => import('@/components/payment/PaymentGate'))
const ReportSheet             = lazy(() => import('@/components/moderation/ReportSheet'))
const ContactUnlockSheet      = lazy(() => import('@/components/payment/ContactUnlockSheet'))
const CityResultsSheet        = lazy(() => import('@/components/map/CityResultsSheet'))
const CompanyBrowsePanel      = lazy(() => import('@/components/map/CompanyBrowsePanel'))
const DateIdeasSheet          = lazy(() => import('@/components/dating/DateIdeasSheet'))
const UpgradeSheet            = lazy(() => import('@/components/premium/UpgradeSheet'))
const SpotClaimSheet          = lazy(() => import('@/components/spots/SpotClaimSheet'))
const MySpotScreen            = lazy(() => import('@/screens/MySpotScreen'))
const VibeCheckSheet          = lazy(() => import('@/components/vibecheck/VibeCheckSheet'))
const HanggerNewsSheet        = lazy(() => import('@/components/news/HanggerNewsSheet'))
const RatingSheet             = lazy(() => import('@/components/session/RatingSheet'))
const ReviewsSection          = lazy(() => import('@/components/session/ReviewsSection'))
const DevPanel                = lazy(() => import('@/dev/DevPanel'))

// Minimal fallback for lazy screens
const LazyFallback = () => null


export default function AppShell({ returnParams, triggerGoLive }) {
  const { overlay, closeOverlay, openGoLive, openDiscovery } = useOverlay()
  const { userProfile, user } = useAuth()
  const { triggerGate } = useGuestGate()
  const isGuest = !user
  const { session: mySession, needsCheckIn } = useMySession()
  const { showBanner: showCheckIn, bannerReason, handleStillOut, handleLeaving } = useStatusCheckIn(mySession)
  const { incomingInterests, mutualSessions } = useInterests()
  const { incomingMeetRequest, acceptedMeetSession, simulateAcceptance, clearAccepted, clearIncoming } = useMeetRequests()
  const [pendingConv, setPendingConv] = useState(null)
  const [declinedUserIds] = useState(new Set())
  const ipCountry = useIpCountry()
  const [browseCountry, setBrowseCountry] = useState('Indonesia')
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState(null)
  const [companyQuery, setCompanyQuery] = useState('')
  const [mapCategory] = useState('all') // 'all' | 'maker'
  const [dateIdeasTarget,  setDateIdeasTarget]  = useState(null)
  const [datingIntent,     setDatingIntent]     = useState(null)
  const [foodCategory,   setFoodCategory]   = useState(null)
  const [foodScrollToId, setFoodScrollToId] = useState(null)
  const { incomingInvite: dateInvite, clearInvite: clearDateInvite } = useDateInvites(user?.id ?? null)

  // ── Overlay / modal / sheet open states ─────────────────────────────────────
  const {
    countrySearchOpen, setCountrySearchOpen,
    cityResultsOpen,   setCityResultsOpen,
    companyPanelOpen,  setCompanyPanelOpen,
    dateIdeasOpen,     setDateIdeasOpen,
    datingIntentOpen,  setDatingIntentOpen,
    datingGridOpen,    setDatingGridOpen,
    rideOpen,          setRideOpen,
    foodOpen,          setFoodOpen,
    foodBrowseOpen,    setFoodBrowseOpen,
    likedMeOpen,       setLikedMeOpen,
    likedProfilesOpen, setLikedProfilesOpen,
    settingsOpen,      setSettingsOpen,
    notifOpen,         setNotifOpen,
    rideHistoryOpen,   setRideHistoryOpen,
    blockListOpen,     setBlockListOpen,
    ratingOpen,        setRatingOpen,
    reviewsOpen,       setReviewsOpen,
    sosOpen,           setSosOpen,
    upgradeOpen,       setUpgradeOpen,
    spotClaimOpen,     setSpotClaimOpen,
    mySpotOpen,        setMySpotOpen,
    inviteOutSheetOpen,  setInviteOutSheetOpen,
    discoveryListOpen,   setDiscoveryListOpen,
    vibeCheckOpen,       setVibeCheckOpen,
    vibeBroadcastOpen,   setVibeBroadcastOpen,
    newsOpen,            setNewsOpen,
    hanggerLiveOpen,     setHanggerLiveOpen,
    mapFilterOpen,       setMapFilterOpen,
    orderHistoryOpen,    setOrderHistoryOpen,
    incomingGiftsOpen,   setIncomingGiftsOpen,
  } = useAppOverlays()

  // Effective country: explicit browse selection → IP detection → profile country
  const effectiveCountry = browseCountry ?? ipCountry ?? userProfile?.country ?? null
  const { sessions: rawSessions } = useLiveUsers({ browseCountry: effectiveCountry })
  const filterFlag = COUNTRIES.find(c => c.name.toLowerCase() === effectiveCountry?.toLowerCase())?.flag ?? null
  const { coords: viewerCoords } = useGeolocation()

  // Attach distanceKm to every session using viewer's GPS position
  const sessions = useMemo(() =>
    rawSessions.map(s => ({
      ...s,
      distanceKm: (viewerCoords && s.lat != null && s.lng != null)
        ? haversineKm(viewerCoords.lat, viewerCoords.lng, s.lat, s.lng)
        : s.distanceKm ?? null,
    })),
  [rawSessions, viewerCoords])
  const { unreadCount: notifUnreadCount, serviceUnreadCounts } = useNotifications()
  const [toast, setToast] = useState(null)
  const { likedProfiles, saveLike, removeLike } = useLikedProfiles()
  const [contactUnlockSession, setContactUnlockSession] = useState(null)
  const { inviteOut, post: postInviteOut, goingLive, revertToInviteOut } = useInviteOut()
  const [boostToast, setBoostToast] = useState(null)
  const [discoveryListFilter, setDiscoveryListFilter] = useState('now')
  const [newNowCount,    setNewNowCount]    = useState(0)
  const [newInviteCount, setNewInviteCount] = useState(0)
  const seenNowRef    = useRef(-1)
  const seenInviteRef = useRef(-1)
  // Driver online/offline — null means not a bike/car service account
  const isDriverAccount = userProfile?.isDriver === true &&
    (userProfile?.driverType === 'bike_ride' || userProfile?.driverType === 'car_taxi')
  const [driverOnline, setDriverOnline] = useState(null)
  useEffect(() => {
    if (!isDriverAccount) { setDriverOnline(null); return }
    // Prefer localStorage (reflects last toggle) then fall back to DB value
    const stored = localStorage.getItem('hangger_driver_online')
    setDriverOnline(stored !== null ? stored === 'true' : (userProfile?.driverOnline ?? false))
  }, [isDriverAccount, userProfile?.driverOnline])
  const [vibeBanner, setVibeBanner]         = useState(null) // { status: 'active'|'invite_out'|'scheduled' }

  const openDiscoveryList = (filter) => {
    if (filter === 'now') {
      seenNowRef.current = categorySessions.filter(s => s.status !== 'invite_out').length
      setNewNowCount(0)
    } else if (filter === 'invite') {
      seenInviteRef.current = categorySessions.filter(s => s.status === 'invite_out').length
      setNewInviteCount(0)
    }
    setDiscoveryListFilter(filter)
    setDiscoveryListOpen(true)
  }
  // Full map filter sheet
  const [mapFilters, setMapFilters] = useState(DEFAULT_MAP_FILTERS)
  const [activeTab, setActiveTab] = useState('map')
  const [dockVisible, setDockVisible] = useState(true)
  const [rideOnLanding, setRideOnLanding] = useState(true)
  const [activeSection, setActiveSection] = useState('default')
  const [driverRegOpen, setDriverRegOpen] = useState(false)
  const [therapistRegOpen, setTherapistRegOpen] = useState(false)
  const [marketplaceLanding, setMarketplaceLanding] = useState(true)
  const [shopOpen, setShopOpen] = useState(false)
  const [massageOpen, setMassageOpen] = useState(false)
  const [massageOnLanding, setMassageOnLanding] = useState(true)
  const [datingOnLanding, setDatingOnLanding] = useState(true)
  const [sectionGate, setSectionGate] = useState(null) // 'dating' | 'marketplace' | null
  const [rideVehicleType, setRideVehicleType] = useState('bike_ride') // 'bike_ride' | 'car_taxi'
  const [giftForSession, setGiftForSession] = useState(null)

  // Send new users (no display name yet) straight to profile setup

  useEffect(() => {
    if (userProfile !== null && !userProfile.displayName) {
      setActiveTab('profile')
    }
  }, [userProfile])

  // Time left on session in ms
  const sessionTimeLeft = mySession ? Math.max(0, mySession.expiresAtMs - Date.now()) : null

  // Extend-session prompt — show when <= 15 min remaining on an active session
  const [extendDismissed, setExtendDismissed] = useState(false)
  const showExtendPrompt = !!(
    mySession?.status === 'active' &&
    sessionTimeLeft !== null &&
    sessionTimeLeft <= 15 * 60 * 1000 &&
    sessionTimeLeft > 0 &&
    !extendDismissed
  )
  // Reset dismiss flag whenever a new session starts or is extended
  useEffect(() => { setExtendDismissed(false) }, [mySession?.id, mySession?.expiresAtMs])

  useEffect(() => {
    if (!returnParams) return
    if (returnParams.unlockStatus === 'success') showToast('Payment successful! Fetching location…', 'success')
    else if (returnParams.unlockStatus === 'cancelled') showToast('Payment cancelled.')
  }, [returnParams]) // eslint-disable-line

  // Open Go Live sheet immediately if nudged from onboarding
  useEffect(() => {
    if (triggerGoLive) openGoLive()
  }, [triggerGoLive]) // eslint-disable-line


  // Safety check-in — notify when session goes live
  // Also records the time-of-day bucket for notification suppression (P6)
  const prevSessionRef = useRef(null)
  useEffect(() => {
    const wasLive = !!prevSessionRef.current
    const isLive  = !!mySession
    if (!wasLive && isLive) {
      const contact = getSafetyContact()
      if (contact) showToast(`🛡️ Check-in sent to ${contact.name}`, 'success')
      // Fire-and-forget: record which time window this user goes live in
      if (supabase && user?.id) {
        supabase.rpc('upsert_behaviour_bucket', { p_user_id: user.id })
      }
    }
    prevSessionRef.current = mySession
  }, [mySession]) // eslint-disable-line


  const visibleSessions = useMemo(() => {
    const filtered = sessions.filter(s => {
      if (s.status === 'scheduled')                                         return false
      if (declinedUserIds.has(s.userId))                                   return false
      if (mapFilters.status === 'Out Now'   && s.status === 'invite_out') return false
      if (mapFilters.activity !== 'All' && s.activityType?.toLowerCase() !== mapFilters.activity.toLowerCase()) return false
      if (mapFilters.city     !== 'All' && !s.area?.toLowerCase().includes(mapFilters.city.toLowerCase())) return false
      return true
    })
    return sortByRelevance(filtered, mySession, mutualSessions)
  }, [sessions, declinedUserIds, mapFilters, mySession, mutualSessions]) // eslint-disable-line

  // Anti-fatigue: record an impression each time the visible feed changes.
  // Seeded profiles are exempt. Scores will apply the penalty on next recompute.
  useEffect(() => {
    visibleSessions.forEach(s => { if (!s.isSeeded) recordImpression(s.id) })
  }, [visibleSessions])

  // Wrap openDiscovery so opening a profile resets its fatigue counter
  // and increments category affinity for the viewed session's category.
  const handleOpenDiscovery = (s) => {
    resetImpressions(s.id)
    if (supabase && user?.id && s.lookingFor) {
      supabase.rpc('increment_category_affinity', { p_user_id: user.id, p_category: s.lookingFor })
    }
    openDiscovery(s)
  }


  // Category + city filtered sessions for the map and ProfileStrip counts
  const categorySessions = useMemo(() => {
    // Dating profiles are hidden from the general map — only visible when dating mode is active
    const nonDating = visibleSessions.filter(s => s.lookingFor !== 'dating')
    let result = mapCategory === 'maker'
      ? nonDating.filter(isMakerSession)
      : mapCategory === 'dating'
      ? visibleSessions.filter(s => s.lookingFor === 'dating')
      : nonDating
    if (cityFilter) {
      const cl = cityFilter.toLowerCase()
      result = result.filter(s =>
        s.city?.toLowerCase() === cl ||
        s.area?.toLowerCase().includes(cl)
      )
    }
    return result
  }, [visibleSessions, mapCategory, cityFilter])

  // Drawer shows makers always when open (city filter optional)
  const companySessions = useMemo(() =>
    companyPanelOpen ? visibleSessions.filter(isMakerSession) : []
  , [companyPanelOpen, visibleSessions])


  // Update "new since last seen" badge counts when sessions change
  useEffect(() => {
    const nowCount    = categorySessions.filter(s => s.status !== 'invite_out').length
    const inviteCount = categorySessions.filter(s => s.status === 'invite_out').length
    setNewNowCount(Math.max(0, nowCount - seenNowRef.current))
    setNewInviteCount(Math.max(0, inviteCount - seenInviteRef.current))
  }, [categorySessions])

  const showToast = (message, type = 'info') => setToast({ message, type })

  // ── Order via chat — shared handler for marketplace + restaurant ─────────────
  // Called by ProductDetailSheet, SellerProfileSheet, RestaurantMenuSheet.
  // Builds a pendingConv with an injected orderCard message then opens chat tab.
  const handleOrderViaChat = ({ product, restaurant, variantStr, qty, items, subtotal, deliveryFee, total, notes, ref, sellerName, sellerId, seller }) => {
    const isRestaurant = !!restaurant
    const targetId     = isRestaurant ? (restaurant.id ?? restaurant.user_id) : (sellerId ?? seller?.id)
    const targetName   = isRestaurant ? restaurant.name : (sellerName ?? seller?.brandName ?? seller?.displayName ?? 'Seller')
    const targetPhoto  = isRestaurant ? (restaurant.photo ?? restaurant.image ?? null) : (seller?.photoURL ?? null)
    const convId       = `order-${isRestaurant ? 'restaurant' : 'marketplace'}-${targetId}`
    const orderRef     = ref ?? `#${isRestaurant ? 'MAKAN' : 'SHOP'}_${Date.now().toString().slice(-8)}`

    // Build items array for marketplace single-product orders
    const orderItems = items ?? (product ? [{
      name:    product.name,
      qty:     qty ?? 1,
      price:   product.price ?? 0,
      variant: variantStr ?? null,
    }] : [])

    const orderSubtotal = subtotal ?? orderItems.reduce((s, i) => s + (i.price * i.qty), 0)
    const orderTotal    = total    ?? orderSubtotal + (deliveryFee ?? 0)

    const orderCard = {
      type:        isRestaurant ? 'restaurant' : 'marketplace',
      ref:         orderRef,
      sellerName:  targetName,
      sellerId:    targetId,
      items:       orderItems,
      subtotal:    orderSubtotal,
      deliveryFee: deliveryFee ?? null,
      total:       orderTotal,
      notes:       notes ?? '',
      status:      'pending',
      updatedAt:   Date.now(),
      safeTrade:       product?.safeTrade ?? null,
      cashOnDelivery:  product?.cashOnDelivery ?? false,
    }

    const openingMsg = {
      id:        `order-${Date.now()}`,
      senderId:  user?.id ?? 'me',
      fromMe:    true,
      orderCard,
      time:      Date.now(),
    }

    setPendingConv({
      id:              convId,
      userId:          targetId,
      displayName:     targetName,
      photoURL:        targetPhoto,
      emoji:           isRestaurant ? '🍽️' : '🛍️',
      online:          true,
      status:          'free',
      openedAt:        Date.now(),
      lastMessage:     `${isRestaurant ? '🍽️' : '🛍️'} Order ${orderRef}`,
      lastMessageTime: Date.now(),
      unread:          0,
      messages:        [openingMsg],
    })
    setActiveTab('chat')
  }

  // ── Make an Offer — creates a chat conversation with an offer card ──
  const handleMakeOffer = ({ product, qty, offerPrice, listedPrice, totalOffer, message, sellerName, sellerId }) => {
    const targetId   = sellerId
    const targetName = sellerName ?? 'Seller'
    const convId     = `offer-marketplace-${targetId}-${Date.now()}`
    const offerRef   = `#OFFER_${Date.now().toString().slice(-8)}`

    const offerCard = {
      ref:          offerRef,
      productName:  product?.name ?? 'Product',
      productImage: product?.image ?? null,
      qty,
      offerPrice,
      listedPrice,
      totalOffer,
      message:      message ?? '',
      status:       'pending',
      updatedAt:    Date.now(),
    }

    const openingMsg = {
      id:       `offer-${Date.now()}`,
      senderId: user?.id ?? 'me',
      fromMe:   true,
      offerCard,
      time:     Date.now(),
    }

    setPendingConv({
      id:              convId,
      userId:          targetId,
      displayName:     targetName,
      emoji:           '💰',
      online:          true,
      status:          'free',
      openedAt:        Date.now(),
      lastMessage:     `💰 Offer ${offerRef}`,
      lastMessageTime: Date.now(),
      unread:          0,
      messages:        [openingMsg],
    })
    setActiveTab('chat')
  }

  return (
    <div className={styles.shell}>
      {/* Time-based background fills full screen */}
      <TimeBackground />

      {/* Floating activity icons — visible when dock is on */}
      {dockVisible && !rideOpen && !massageOpen && !shopOpen && !foodOpen && !datingGridOpen && activeTab === 'map' && (
        <FloatingIcons
          sessions={visibleSessions}
          serviceCounts={serviceUnreadCounts}
          onSelectSession={(s) => handleOpenDiscovery(s)}
          onFoodClick={() => { setDockVisible(false); setActiveSection('food'); setFoodOpen(true) }}
          onRideClick={(type) => { if (isGuest) { triggerGate(); return } setActiveSection('rides'); setRideVehicleType(type ?? 'bike_ride'); setRideOpen(true) }}
          onShoppingClick={() => {
            if (isGuest) { triggerGate(); return }
            setActiveSection('marketplace'); setShopOpen(true); setMarketplaceLanding(true)
          }}
          onDatingClick={() => {
            setActiveSection('dating'); setDatingGridOpen(true)
          }}
          onMassageClick={() => { if (isGuest) { triggerGate(); return } setDockVisible(false); setActiveSection('massage'); setMassageOpen(true) }}
          onRentalsClick={() => { if (isGuest) { triggerGate(); return } setDockVisible(false); setActiveSection('rentals'); setActiveTab('rentals') }}
        />
      )}

      {/* Date Ideas side drawer */}
      <Suspense fallback={<LazyFallback />}>
      <DateIdeasSheet
        open={dateIdeasOpen}
        targetSession={dateIdeasTarget}
        onClose={() => { setDateIdeasOpen(false); setDateIdeasTarget(null) }}
      />
      </Suspense>

      {/* Step 1 — Intent picker: what kind of connection? */}
      <IntentGrid
        open={datingIntentOpen}
        value={datingIntent}
        city={mySession?.city ?? userProfile?.city ?? null}
        mode="dating"
        onChange={(intent) => {
          setDatingIntent(intent)
          setDatingIntentOpen(false)
          setDatingGridOpen(true)
        }}
        onBrowseAll={() => setDatingIntentOpen(false)}
      />

      {/* Step 2 — Floating bubble profiles matching that intent */}
      <Suspense fallback={<LazyFallback />}>
      <DatingBubbleScreen
        open={datingGridOpen}
        activity={{ emoji: '💕', label: datingIntent ? datingIntent.charAt(0).toUpperCase() + datingIntent.slice(1).replace(/_/g, ' ') : 'Dating' }}
        sessions={[
          ...visibleSessions.filter(s =>
            datingIntent ? s.lookingFor === datingIntent : ['dating','marriage','date_night','friendship','travel','pen_pal'].includes(s.lookingFor)
          ),
          ...DEMO_DATING_BUBBLES.filter(s =>
            datingIntent ? s.lookingFor === datingIntent : true
          ),
        ]}
        mutualSessions={mutualSessions}
        myProfile={userProfile}
        onClose={() => { setDatingGridOpen(false); setDatingOnLanding(true) }}
        onSelectSession={(s) => { setDatingGridOpen(false); handleOpenDiscovery(s) }}
        onLandingChange={(onLanding) => { setDatingOnLanding(onLanding); if (!onLanding) setDockVisible(false) }}
        onOpenDateIdeas={(s) => { setDatingGridOpen(false); setDateIdeasTarget(s); setDateIdeasOpen(true) }}
        onConnect={(session) => {
          closeOverlay()
          setDatingGridOpen(false)
          setFoodOpen(false)
          setRideOpen(false)
          setPendingConv({
            id: `dating-${session.userId ?? session.id}`,
            userId: session.userId ?? session.id,
            displayName: session.displayName ?? 'New Match',
            photoURL: session.photoURL ?? null,
            age: session.age ?? null,
            area: session.area ?? session.city ?? null,
            emoji: '💕',
            online: true,
            status: 'free',
            openedAt: Date.now(),
            lastMessage: null,
            lastMessageTime: Date.now(),
            unread: 0,
            messages: [],
          })
          setActiveTab('chat')
        }}
      />
      </Suspense>

      {/* Full-screen tab screens */}
      <Suspense fallback={<LazyFallback />}>
        {activeTab === 'chat'    && <ChatScreen key={pendingConv?.id ?? 'chat'} onClose={() => setActiveTab('map')} pendingConv={pendingConv} />}
        {activeTab === 'profile' && <ProfileScreen onClose={() => setActiveTab('map')} onOpenSettings={() => setSettingsOpen(true)} />}
        {activeTab === 'rentals' && <RentalSearchScreen onClose={() => { setActiveTab('map'); setDockVisible(true) }} />}
      </Suspense>

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + notifications + likes + settings — map tab only, hidden when a section with its own header is open */}
      {activeTab === 'map' && !shopOpen && !(foodOpen && foodBrowseOpen) && !(massageOpen && !massageOnLanding) && (
        <MapHeader
          onOpenNotifications={() => setNotifOpen(true)}
          notifCount={notifUnreadCount}
          onAccountClick={() => {
            if (isGuest) { triggerGate(); return }
            setActiveTab('profile')
          }}
        />
      )}

      {/* Search bar + inline auto-suggest — map tab only, hidden when a section with its own search is open */}
      {activeTab === 'map' && !shopOpen && !(foodOpen && foodBrowseOpen) && !(massageOpen && !massageOnLanding) && (
        <MapSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => {}}
          onClear={() => setSearchQuery('')}
          onSubmit={() => { if (searchQuery.trim()) setCityResultsOpen(true) }}
          filterFlag={filterFlag}
          onFilterTap={() => setCountrySearchOpen(true)}
          placeholder={companyPanelOpen ? 'Find businesses near you…' : 'Search people, food, market, rides…'}
        >
          <GlobalSearchSuggest
            query={searchQuery}
            sessions={categorySessions}
            onClose={() => setSearchQuery('')}
            onNavigate={(cat, item, type) => {
              setSearchQuery('')
              // Session / person — open discovery card
              if (type === 'session' && item) { handleOpenDiscovery(item); return }
              // Product — open shopping tab (product deep-link future)
              if (type === 'product' || cat === 'product') { setActiveSection('marketplace'); setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false); return }
              // Seller — open shopping tab
              if (type === 'seller' && cat === 'shopping') { setActiveSection('marketplace'); setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false); return }
              if (type === 'seller' && cat === 'food')     { setFoodOpen(true); return }
              if (type === 'seller' && cat === 'massage')  { setActiveSection('massage'); setMassageOpen(true); return }
              // Category shortcuts
              if (cat === 'food')     { setFoodOpen(true); return }
              if (cat === 'ride')     { if (isGuest) { triggerGate(); return } setRideOpen(true); return }
              if (cat === 'taxi')     { if (isGuest) { triggerGate(); return } setRideOpen(true); return }
              if (cat === 'dating')   { setDatingIntentOpen(true); return }
              if (cat === 'shopping') { setActiveSection('marketplace'); setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false); return }
              if (cat === 'massage')  { setActiveSection('massage'); setMassageOpen(true); return }
              // People fallback — open discovery if item present
              if (item) handleOpenDiscovery(item)
            }}
          />
        </MapSearchBar>
      )}


      {mySession && (
        <ActiveSessionBar
          session={mySession}
          onEnded={() => setRatingOpen(true)}
          onCancelled={() => revertToInviteOut()}
        />
      )}
      <MapOverlay isLive={!!mySession} sessionTimeLeft={sessionTimeLeft} />


      {/* User B: incoming wave — slides in from right, auto-dismisses after 5s */}
      {incomingMeetRequest && (
        <WaveBanner
          request={incomingMeetRequest}
          onDismiss={clearIncoming}
          onViewProfile={() => {
            const session = sessions.find(s => s.id === incomingMeetRequest.sessionId) ?? {
              id: incomingMeetRequest.sessionId ?? incomingMeetRequest.id,
              userId: incomingMeetRequest.fromUserId,
              displayName: incomingMeetRequest.fromDisplayName ?? 'Someone',
              photoURL: incomingMeetRequest.fromPhotoURL ?? null,
              photos: incomingMeetRequest.fromPhotoURL ? [incomingMeetRequest.fromPhotoURL] : [],
              status: 'active',
            }
            clearIncoming()
            handleOpenDiscovery(session)
          }}
        />
      )}

      {/* User A: their request was accepted — tap to open chat */}
      {acceptedMeetSession && !incomingMeetRequest && (
        <MeetAcceptedBanner
          session={acceptedMeetSession}
          onTapToChat={() => {
            const _src = sessions.find(s => s.id === acceptedMeetSession.sessionId)
            closeOverlay()
            setDatingGridOpen(false)
            setFoodOpen(false)
            setRideOpen(false)
            setPendingConv({
              id: `meet-${acceptedMeetSession.sessionId ?? acceptedMeetSession.id}`,
              userId: acceptedMeetSession.fromUserId ?? 'unknown',
              displayName: acceptedMeetSession.fromDisplayName ?? 'New Match',
              photoURL: acceptedMeetSession.fromPhotoURL ?? null,
              age: _src?.age ?? null,
              area: _src?.area ?? _src?.city ?? null,
              emoji: '💌',
              online: true,
              status: 'free',
              openedAt: Date.now(),
              lastMessage: null,
              lastMessageTime: Date.now(),
              unread: 0,
              messages: [],
            })
            setActiveTab('chat')
            clearAccepted()
          }}
          onDismiss={clearAccepted}
        />
      )}

      {dateInvite && (
        <DateInvitePopup
          invite={dateInvite}
          onAccept={(inv) => {
            clearDateInvite()
            setPendingConv({
              id: `date-${inv.from_user_id}`,
              userId: inv.from_user_id,
              displayName: inv.profiles?.display_name ?? 'New Match',
              photoURL: inv.profiles?.photo_url ?? null,
              age: inv.profiles?.age ?? null,
              area: inv.profiles?.city ?? null,
              emoji: '💕',
              online: true,
              status: 'free',
              openedAt: Date.now(),
              lastMessage: null,
              lastMessageTime: Date.now(),
              unread: 0,
              messages: [],
            })
            setActiveTab('chat')
          }}
          onDismiss={clearDateInvite}
        />
      )}

      {incomingInterests.length > 0 && (
        <div className={styles.interestBadge}>
          {incomingInterests.length} want to meet you
        </div>
      )}

      {/* Boost banner */}
      {boostToast && (
        <BoostBanner filter={boostToast} onDone={() => setBoostToast(null)} />
      )}

      {showCheckIn && (
        <StatusCheckInBanner
          reason={bannerReason}
          onStillOut={handleStillOut}
          onLeaving={handleLeaving}
        />
      )}

      {/* Bottom nav bar — visible on map tab, hidden on marketplace/food/massage */}
      {activeTab === 'map' && !shopOpen && !foodOpen && !massageOpen && (
        <ProfileStrip
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'chat')          setActiveTab('chat')
            else if (tab === 'profile') setActiveTab('profile')
            else if (tab === 'notifications') setNotifOpen(true)
            else setActiveTab('map')
          }}
          notifCount={notifUnreadCount}
          unreadCount={notifUnreadCount}
          userPhoto={userProfile?.photoURL ?? user?.photoURL ?? null}
        />
      )}

      <Suspense fallback={<LazyFallback />}>
      {rideOpen && <BookingScreen onClose={() => { setRideOpen(false); setRideOnLanding(true); setDockVisible(true) }} initialVehicle={rideVehicleType} onLandingChange={(onLanding) => { setRideOnLanding(onLanding); if (!onLanding) setDockVisible(false) }} />}
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      {massageOpen && <MassageScreen onClose={() => { setMassageOpen(false); setMassageOnLanding(true); setDockVisible(true); setActiveSection('default') }} onLandingChange={(onLanding) => { setMassageOnLanding(onLanding); if (!onLanding) setDockVisible(false) }} />}
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      {shopOpen && <ShopSearchScreen onClose={() => { setShopOpen(false); setDockVisible(true); setGiftForSession(null); setActiveSection('default'); setMarketplaceLanding(true) }} userCity={userProfile?.city} userCountry={userProfile?.country} giftFor={giftForSession} onGiftDismiss={() => setGiftForSession(null)} showToast={showToast} onOrderViaChat={handleOrderViaChat} onMakeOffer={handleMakeOffer} onLandingChange={(onLanding) => { setMarketplaceLanding(onLanding); if (!onLanding) setDockVisible(false) }} onHome={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('map') }} onChat={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('chat') }} onAlerts={() => setNotifOpen(true)} onProfile={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('profile') }} />}
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      {foodOpen && !foodBrowseOpen && (
        <CategoryDiscoveryScreen
          onClose={() => setFoodOpen(false)}
          onSelectCategory={(cat, restaurantId) => {
            setFoodCategory(cat)
            setFoodScrollToId(restaurantId ?? null)
            setFoodBrowseOpen(true)
          }}
        />
      )}
      {foodOpen && foodBrowseOpen && (
        <RestaurantBrowseScreen
          category={foodCategory}
          scrollToId={foodScrollToId}
          onBackToCategories={() => setFoodBrowseOpen(false)}
          onClose={() => { setFoodBrowseOpen(false); setFoodOpen(false) }}
          onOrderViaChat={handleOrderViaChat}
        />
      )}
      </Suspense>

      {/* Review prompt — floats globally, fires after any MAKAN WhatsApp order */}
      <ReviewPrompt userId={user?.id} />


      {/* Go-live nudge — visible when user has no active session */}
      {activeTab === 'map' && !mySession && !inviteOut && !isGuest && (
        <button className={styles.goLiveNudge} onClick={() => setInviteOutSheetOpen(true)}>
          <span className={styles.goLiveNudgeDot} />
          You're invisible — tap to hang 🚀
        </button>
      )}

      <StillHerePrompt open={needsCheckIn && !!mySession} sessionId={mySession?.id} />

      {/* Extend session prompt — appears when <= 15min left on active session */}
      {showExtendPrompt && (
        <ExtendSessionPrompt
          session={mySession}
          onEnd={async () => {
            await endSession(mySession.id)
            setExtendDismissed(true)
          }}
          onDismiss={() => setExtendDismissed(true)}
        />
      )}

      {/* Momentum banner — "🔥 X people out in [City]" floating pill */}
      {!mySession && userProfile?.city && (
        <MomentumBanner city={userProfile.city} />
      )}

      {/* Sheets */}
      <Suspense fallback={<LazyFallback />}>
      <DiscoveryCard
        open={overlay.type === OVERLAY.DISCOVERY}
        session={overlay.data}
        mySession={mySession}
        onClose={closeOverlay}
        showToast={showToast}
        onGuestAction={isGuest ? triggerGate : null}
        onMeetSent={(session) => {
          if (supabase && user?.id && session.lookingFor) {
            supabase.rpc('increment_category_affinity', { p_user_id: user.id, p_category: session.lookingFor })
          }
          closeOverlay()   // close DiscoveryCard so banner (z-index 900) is not blocked by it (z-index 9300)
          simulateAcceptance(session)
        }}
        onConnect={(session, firstMessage) => {
          closeOverlay()
          setDatingGridOpen(false)
          // Use user's typed message if provided, otherwise build auto-intro
          let openingText = firstMessage ?? null
          if (!openingText) {
            const myName    = userProfile?.displayName ?? user?.displayName ?? 'Someone'
            const myAge     = userProfile?.age ?? null
            const myCountry = userProfile?.country ?? null
            const myFor     = userProfile?.lookingFor ?? session.lookingFor ?? null
            const lookingForLabel = myFor
              ? myFor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : null
            const introParts = [
              `Hi! I'm ${myName}`,
              myAge     ? `${myAge} years old` : null,
              myCountry ? `from ${myCountry}`  : null,
              lookingForLabel ? `looking for ${lookingForLabel}` : null,
            ].filter(Boolean)
            openingText = introParts.join(', ') + ' 👋'
          }
          const openingMsg = {
            id:       `intro-${Date.now()}`,
            senderId: user?.id ?? 'me',
            text:     openingText,
            time:     Date.now(),
            fromMe:   true,
          }
          const convId = `dating-${session.userId ?? session.id}`
          setPendingConv(prev => {
            // If same conv already open (re-open from connected state), keep messages
            if (prev?.id === convId) {
              const alreadyHas = prev.messages?.some(m => m.text === openingText)
              return {
                ...prev,
                openedAt: prev.openedAt ?? Date.now(),
                messages: alreadyHas || !firstMessage ? prev.messages : [...(prev.messages ?? []), openingMsg],
                lastMessage: openingText,
                lastMessageTime: Date.now(),
              }
            }
            return {
              id: convId,
              userId: session.userId ?? session.id,
              displayName: session.displayName ?? 'New Match',
              photoURL: session.photoURL ?? null,
              age: session.age ?? null,
              area: session.area ?? session.city ?? null,
              emoji: '💕',
              online: true,
              status: 'free',
              openedAt: Date.now(),
              lastMessage: openingText,
              lastMessageTime: Date.now(),
              unread: 0,
              messages: [openingMsg],
            }
          })
          setActiveTab('chat')
        }}
        onLike={saveLike}
        onUnlockContact={isMakerSession(overlay.data ?? {}) ? (s) => setContactUnlockSession(s) : null}
        onGift={(session) => { closeOverlay(); setGiftForSession(session); setActiveSection('marketplace'); setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false) }}
      />
      <ContactUnlockSheet
        open={!!contactUnlockSession}
        session={contactUnlockSession}
        buyerUserId={user?.id ?? 'demo-me'}
        buyerCountry={effectiveCountry}
        onClose={() => setContactUnlockSession(null)}
      />
      </Suspense>
      <GoLiveSheet open={overlay.type === OVERLAY.GO_LIVE} onClose={closeOverlay} showToast={showToast} />
      <Suspense fallback={<LazyFallback />}>
      <PaymentGate open={overlay.type === OVERLAY.PAYMENT_GATE} request={overlay.data} onClose={closeOverlay} showToast={showToast} />
      <ReportSheet open={overlay.type === OVERLAY.REPORT} session={overlay.data} onClose={closeOverlay} showToast={showToast} />
      {likedMeOpen && <LikedMeScreen onClose={() => setLikedMeOpen(false)} />}
      {notifOpen && (
        <NotificationsScreen
          onClose={() => setNotifOpen(false)}
          userId={user?.id}
          userProfile={userProfile}
          onOpenRideHistory={() => { setNotifOpen(false); setRideHistoryOpen(true) }}
          onOpenChat={(sender) => {
            setNotifOpen(false)
            setPendingConv({
              id:              `notif-${sender.fromUserId ?? Date.now()}`,
              userId:          sender.fromUserId ?? null,
              displayName:     sender.displayName ?? 'New Message',
              photoURL:        sender.photoURL ?? null,
              emoji:           '💬',
              online:          true,
              status:          'free',
              openedAt:        Date.now(),
              lastMessage:     null,
              lastMessageTime: Date.now(),
              unread:          0,
              messages:        [],
            })
            setActiveTab('chat')
          }}
          stripProps={{
            activeTab: 'notifications',
            onTabChange: (tab) => {
              if (tab === 'map')          { setNotifOpen(false) }
              else if (tab === 'chat')    { setNotifOpen(false); setActiveTab('chat') }
              else if (tab === 'profile') { setNotifOpen(false); setActiveTab('profile') }
            },
            notifCount: 0,
            unreadCount: 0,
            userPhoto: userProfile?.photoURL ?? user?.photoURL ?? null,
          }}
        />
      )}
      {rideHistoryOpen && (
        <RideHistoryScreen
          userId={user?.id}
          userName={user?.displayName ?? userProfile?.display_name}
          onClose={() => setRideHistoryOpen(false)}
          stripProps={{
            activeTab: 'notifications',
            onTabChange: (tab) => {
              if (tab === 'map')          { setRideHistoryOpen(false) }
              else if (tab === 'chat')    { setRideHistoryOpen(false); setActiveTab('chat') }
              else if (tab === 'profile') { setRideHistoryOpen(false); setActiveTab('profile') }
              else if (tab === 'notifications') { setRideHistoryOpen(false); setNotifOpen(true) }
            },
            notifCount: 0,
            unreadCount: 0,
            userPhoto: userProfile?.photoURL ?? user?.photoURL ?? null,
          }}
        />
      )}
      {blockListOpen      && <BlockedUsersScreen  onClose={() => setBlockListOpen(false)} />}
      {orderHistoryOpen   && <OrderHistoryScreen  onClose={() => setOrderHistoryOpen(false)} />}
      {incomingGiftsOpen  && <IncomingGiftsScreen onClose={() => setIncomingGiftsOpen(false)} />}
      </Suspense>

      <CountrySearchSheet
        open={countrySearchOpen}
        onClose={() => setCountrySearchOpen(false)}
        currentCountry={effectiveCountry}
        homeCountry={userProfile?.country ?? ipCountry}
        userTier={userProfile?.tier ?? null}
        onSelect={country => { setBrowseCountry(country); setCityFilter(null); setCompanyPanelOpen(false) }}
        onUpgrade={() => { setCountrySearchOpen(false); setActiveTab('profile') }}
      />

      <Suspense fallback={<LazyFallback />}>
      <CityResultsSheet
        open={cityResultsOpen}
        query={searchQuery}
        sessions={categorySessions}
        browseCountry={effectiveCountry}
        onSelectCity={city => { setCityFilter(city); setCompanyQuery(searchQuery); setSearchQuery(''); setCityResultsOpen(false); setCompanyPanelOpen(true) }}
        onClose={() => setCityResultsOpen(false)}
      />

      <CompanyBrowsePanel
        open={companyPanelOpen}
        sessions={companySessions}
        query={companyQuery}
        city={cityFilter}
        viewerCountry={effectiveCountry}
        countryFlag={filterFlag}
        onSelect={s => { setCompanyPanelOpen(false); handleOpenDiscovery(s) }}
        onClose={() => setCompanyPanelOpen(false)}
      />

      </Suspense>

      <MapFilterSheet
        open={mapFilterOpen}
        onClose={() => setMapFilterOpen(false)}
        filters={mapFilters}
        onChange={setMapFilters}
        onReset={() => setMapFilters(DEFAULT_MAP_FILTERS)}
      />


      <Suspense fallback={<LazyFallback />}>
      <UpgradeSheet
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        showToast={showToast}
        lookingFor={userProfile?.lookingFor}
        onClaimSpot={() => setSpotClaimOpen(true)}
      />

      <SpotClaimSheet
        open={spotClaimOpen}
        onClose={() => setSpotClaimOpen(false)}
        showToast={showToast}
      />

      <MySpotScreen
        open={mySpotOpen}
        onClose={() => setMySpotOpen(false)}
        onClaimSpot={() => { setMySpotOpen(false); setSpotClaimOpen(true) }}
      />

      </Suspense>

      {createPortal(
        <Suspense fallback={<LazyFallback />}>
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onOpenLikes={() => { setSettingsOpen(false); setTimeout(() => setLikedMeOpen(true), 200) }}
          onOpenMyLikes={() => { setSettingsOpen(false); setTimeout(() => setLikedProfilesOpen(true), 200) }}
          onEditProfile={() => { setSettingsOpen(false); setTimeout(() => setActiveTab('profile'), 200) }}
          onOpenBlockList={() => { setSettingsOpen(false); setTimeout(() => setBlockListOpen(true), 200) }}
          onOpenOrderHistory={() => { setSettingsOpen(false); setTimeout(() => setOrderHistoryOpen(true), 200) }}
          onOpenIncomingGifts={() => { setSettingsOpen(false); setTimeout(() => setIncomingGiftsOpen(true), 200) }}
          onUpgrade={() => { setSettingsOpen(false); setTimeout(() => setUpgradeOpen(true), 200) }}
          onMySpot={() => { setSettingsOpen(false); setTimeout(() => setMySpotOpen(true), 200) }}
          showToast={showToast}
          onSOS={() => setSosOpen(true)}
        />
        </Suspense>,
        document.body
      )}

      {likedProfilesOpen && (
        <LikedProfilesScreen
          onClose={() => setLikedProfilesOpen(false)}
          likedProfiles={likedProfiles}
          onRemove={removeLike}
        />
      )}

      <Suspense fallback={<LazyFallback />}>
      <SOSModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        session={mySession}
      />

      <VibeBlastPage
        open={vibeBroadcastOpen}
        onClose={() => setVibeBroadcastOpen(false)}
        userId={user?.id ?? user?.uid}
        userProfile={userProfile}
      />

      <HanggerNewsSheet
        open={newsOpen}
        onClose={() => setNewsOpen(false)}
      />

      <QAFeedScreen
        mode="live"
        open={hanggerLiveOpen}
        onClose={() => setHanggerLiveOpen(false)}
        onOrderViaChat={handleOrderViaChat}
        user={user}
        viewerSession={null}
        viewerProfile={userProfile ?? null}
        targetUserId={null}
        onConnect={(profile) => {
          setHanggerLiveOpen(false)
          // Reuse the dating card connect flow — profile shape is compatible
          const session = {
            userId:      profile.userId,
            displayName: profile.displayName,
            photoURL:    profile.photoURL ?? null,
            age:         profile.age ?? null,
            area:        profile.city ?? profile.area ?? null,
          }
          const myName    = userProfile?.displayName ?? user?.displayName ?? 'Someone'
          const openingText = `Hi ${profile.displayName?.split(' ')[0] ?? 'there'}! I found you on Hangger Live 👋 I'm ${myName}`
          const openingMsg = {
            id:       `intro-${Date.now()}`,
            senderId: user?.id ?? 'me',
            text:     openingText,
            time:     Date.now(),
            fromMe:   true,
          }
          const convId = `live-${profile.userId}`
          setPendingConv(prev => {
            if (prev?.id === convId) return prev
            return {
              id: convId,
              ...session,
              emoji: '💬',
              online: true,
              status: 'free',
              openedAt: Date.now(),
              lastMessage: openingText,
              lastMessageTime: Date.now(),
              messages: [openingMsg],
            }
          })
          setActiveTab('chat')
        }}
      />

      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      <RatingSheet
        open={ratingOpen}
        session={mySession}
        onSubmit={() => {
          setRatingOpen(false)
          showToast('Thanks for your feedback!', 'success')
          const contact = getSafetyContact()
          if (contact) setTimeout(() => showToast(`🛡️ ${contact.name} notified you're home safe`, 'success'), 1200)
          endSession(mySession?.id)
          revertToInviteOut()
        }}
        onSkip={() => {
          setRatingOpen(false)
          const contact = getSafetyContact()
          if (contact) showToast(`🛡️ ${contact.name} notified you're home safe`, 'success')
          endSession(mySession?.id)
          revertToInviteOut()
        }}
      />
      <DiscoveryListSheet
        open={discoveryListOpen}
        filter={discoveryListFilter}
        sessions={visibleSessions}
        onClose={() => setDiscoveryListOpen(false)}
        onSelect={(s) => { setDiscoveryListOpen(false); setTimeout(() => handleOpenDiscovery(s), 200) }}
      />
      <InviteOutSheet
        open={inviteOutSheetOpen}
        onClose={() => setInviteOutSheetOpen(false)}
        isMaker={isMakerSession({ lookingFor: userProfile?.lookingFor })}
        onPost={async (activity, message, makerMeta) => {
          if (mySession) { try { await endSession(mySession.id) } catch {} }
          postInviteOut({ activityType: activity, message, tier: userProfile?.tier ?? null, ...makerMeta })
        }}
        onGoLive={(makerMeta) => { goingLive(); openGoLive(makerMeta) }}
        currentStatus={!!mySession ? 'live' : !!inviteOut ? 'invite' : null}
      />

      <BottomSheet open={reviewsOpen} onClose={() => setReviewsOpen(false)} title="">
        <Suspense fallback={<LazyFallback />}><ReviewsSection /></Suspense>
      </BottomSheet>
      </Suspense>


      <VibeCheckSheet
        open={vibeCheckOpen}
        sessions={visibleSessions}
        onClose={() => setVibeCheckOpen(false)}
        onVibeYes={(session) => setVibeBanner({ status: session.status })}
      />

      <VibeCheckBanner
        banner={vibeBanner}
        onDismiss={() => setVibeBanner(null)}
        onView={() => { setVibeBanner(null); showToast('Anonymous until they connect back 💚', 'info') }}
      />

      <AddToHomeScreenBanner />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      {/* Section gate — one-time setup popup */}
      <SectionGateSheet
        open={!!sectionGate}
        section={sectionGate}
        onClose={() => setSectionGate(null)}
        onComplete={(data) => {
          // Save setup data to profile
          if (data.datingSetup) {
            userProfile.datingSetup = true
            userProfile.relationshipGoal = data.relationshipGoal
            userProfile.datingInterests = data.datingInterests
          }
          if (data.marketplaceSetup) {
            userProfile.marketplaceSetup = true
            userProfile.marketplaceRole = data.marketplaceRole
            userProfile.marketplaceCategories = data.marketplaceCategories
          }
          setSectionGate(null)
          // Now enter the section
          if (data.datingSetup) setDatingIntentOpen(true)
          if (data.marketplaceSetup) { setShopOpen(true); setMarketplaceLanding(true) }
        }}
      />

      <DriverRegistration open={driverRegOpen} onClose={() => setDriverRegOpen(false)} driverType={rideVehicleType === 'car_taxi' ? 'car' : 'bike'} />
      <TherapistRegistration open={therapistRegOpen} onClose={() => setTherapistRegOpen(false)} />

      {/* Dev panel — home page only */}
      {activeTab === 'map' && !shopOpen && !foodOpen && !rideOpen && !massageOpen && !datingGridOpen && (
        <Suspense fallback={null}><DevPanel /></Suspense>
      )}

      {/* Side nav — visible on marketplace with orange theme */}
      {(!rideOpen || rideOnLanding) && (!massageOpen || massageOnLanding) && (!datingGridOpen || datingOnLanding) && activeTab !== 'rentals' && activeTab !== 'chat' && <BottomNav
          isGuest={isGuest}
          dockVisible={dockVisible}
          theme={shopOpen ? 'marketplace' : 'default'}
          onChat={() => { setShopOpen(false); setMarketplaceLanding(true); setDockVisible(true); setActiveSection('default'); setActiveTab('chat') }}
          onAlerts={() => { setNotifOpen(true) }}
          onProfile={() => { setShopOpen(false); setMarketplaceLanding(true); setDockVisible(true); setActiveSection('default'); setActiveTab('profile') }}
          onCart={() => { setOrderHistoryOpen(true) }}
          onSignUp={() => { setShopOpen(false); setMarketplaceLanding(true); setDockVisible(true); setActiveSection('default'); setActiveTab('profile') }}
          onToggleDock={() => setDockVisible(v => !v)}
          activeSection={activeSection}
          rideType={rideVehicleType === 'car_taxi' ? 'car' : 'bike'}
          onSectionRegister={() => {
            if (isGuest) { triggerGate(); return }
            if (activeSection === 'rides')       { setDriverRegOpen(true) }
            if (activeSection === 'marketplace') { setShopOpen(true); setMarketplaceLanding(true) }
            if (activeSection === 'food')        { setFoodOpen(true) }
            if (activeSection === 'dating')      { setDatingIntentOpen(true) }
            if (activeSection === 'rentals')     { setActiveTab('rentals') }
            if (activeSection === 'massage')     { setTherapistRegOpen(true) }
            if (activeSection === 'default')     { setDriverRegOpen(true) }
          }}
          onHome={() => {
            setActiveTab('map')
            setDockVisible(true)
            setActiveSection('default')
            setRideOpen(false)
            setRideOnLanding(true)
            setFoodOpen(false)
            setFoodBrowseOpen(false)
            setDatingIntentOpen(false)
            setDatingGridOpen(false)
            setDatingOnLanding(true)
            setMassageOpen(false)
            setMassageOnLanding(true)
            setShopOpen(false)
            setMarketplaceLanding(true)
          }}
          activeTab={activeTab}
          onChange={(tab) => {
            if (isGuest && tab !== 'map') { triggerGate(); return }
            setActiveTab(tab)
            if (tab === 'map') {
              setDockVisible(true)
              setCompanyPanelOpen(false)
            }
          }}
          unreadChats={0}
          userPhotoURL={userProfile?.photoURL ?? null}
          userName={userProfile?.displayName ?? 'You'}
          isLive={!!mySession}
          isInviteOut={!mySession && !!inviteOut}
          onProfileTap={() => { if (isGuest) { triggerGate(); return } setActiveTab('profile') }}
          onDiscoverNow={()    => openDiscoveryList('now')}
          onDiscoverInvite={() => openDiscoveryList('invite')}
          outNowCount={categorySessions.filter(s => s.status !== 'invite_out').length}
          inviteOutCount={categorySessions.filter(s => s.status === 'invite_out').length}
          newNowCount={newNowCount}
          newInviteCount={newInviteCount}
          onDateIdeas={() => setDateIdeasOpen(true)}
          dateIdeasActive={dateIdeasOpen}
          onSOS={() => setSosOpen(true)}
          onHanggerLive={() => setHanggerLiveOpen(true)}
          hanggerLiveActive={hanggerLiveOpen}
          driverOnline={driverOnline}
          onToggleDriverStatus={() => {
            if (driverOnline === null) return
            const next = !driverOnline
            setDriverOnline(next)
            localStorage.setItem('hangger_driver_online', String(next))
            if (supabase && (user?.id ?? user?.uid)) {
              supabase
                .from('profiles')
                .update({ driver_online: next })
                .eq('id', user.id ?? user.uid)
                .then(() => {})
            }
          }}
        />}
    </div>
  )
}
