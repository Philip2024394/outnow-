import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
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
import { useConnectionHealth, OfflineBanner } from '@/hooks/useConnectionHealth.jsx'

import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import BottomSheet from '@/components/ui/BottomSheet'
import Toast from '@/components/ui/Toast'
import VibeCheckBanner     from '@/components/vibecheck/VibeCheckBanner'

import TimeBackground from '@/components/ui/TimeBackground'
import FloatingIcons from '@/components/home/FloatingIcons'
import IntentGrid from '@/components/ui/IntentGrid'
import ReviewPrompt from '@/components/restaurant/ReviewPrompt'
import { buildOrderConversation, buildOfferConversation, buildChatConversation, buildIntroText } from './orderChatHandlers'
import AppShellBottomNav from './AppShellBottomNav'
import IndooFooter from '@/components/ui/IndooFooter'
import MarketplaceOverlays from './MarketplaceOverlays'

import '@/styles/map.css'
import styles from './AppShell.module.css'
import {
  ChatScreen, ProfileScreen, BookingScreen, AndongBookingScreen, ShopSearchScreen,
  DatingBubbleScreen, RestaurantBrowseScreen,
  QAFeedScreen, VibeBlastPage, NotificationsScreen, RideHistoryScreen,
  LikedMeScreen, LikedProfilesScreen, BlockedUsersScreen,
  RentalSearchScreen, MassageScreen, OrderHistoryScreen, IncomingGiftsScreen,
  SettingsSheet, DiscoveryCard, DiscoveryListSheet, SOSModal,
  PaymentGate, ReportSheet, ContactUnlockSheet, CityResultsSheet,
  CompanyBrowsePanel, DateIdeasSheet, UpgradeSheet, SpotClaimSheet,
  MySpotScreen, VibeCheckSheet, IndooNewsSheet, RatingSheet,
  ReviewsSection, DevPanel, LazyFallback,
  DealHuntLanding, DealDetail, CreateDealPage, MyDealsPage,
  SellRentSheet,
} from './appShellLazy'
import PostDealPublic from '@/domains/dealhunt/pages/PostDealPublic'
import DestinationDirectory from '@/components/booking/DestinationDirectory'
import DealPosterVerification from '@/domains/dealhunt/pages/DealPosterVerification'


export default function AppShell({ returnParams, triggerGoLive }) {
  const { overlay, closeOverlay, openGoLive, openDiscovery } = useOverlay()
  const { userProfile, user } = useAuth()
  const { triggerGate } = useGuestGate()
  const isGuest = !user && localStorage.getItem('indoo_registered') !== 'true'
  const { isOnline, wasOffline } = useConnectionHealth()
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
    andongOpen,        setAndongOpen,
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
    indooLiveOpen,     setIndooLiveOpen,
    mapFilterOpen,       setMapFilterOpen,
    orderHistoryOpen,    setOrderHistoryOpen,
    incomingGiftsOpen,   setIncomingGiftsOpen,
  } = useAppOverlays()

  // Effective country: explicit browse selection → IP detection → profile country
  const effectiveCountry = browseCountry ?? ipCountry ?? userProfile?.country ?? null
  const { sessions: rawSessions } = useLiveUsers({ browseCountry: effectiveCountry })
  const filterFlag = '🇮🇩'
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
  // Driver online/offline toggle removed — drivers use separate dashboards (/driver, /cardrive)
  const driverOnline = null
  const setDriverOnline = () => {}
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
  const [marketplaceSignUpOpen, setMarketplaceSignUpOpen] = useState(false)
  const [marketplaceLanding, setMarketplaceLanding] = useState(true)
  const [sellerDashOpen, setSellerDashOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [sellerOrdersOpen, setSellerOrdersOpen] = useState(false)
  const [sellerWalletOpen, setSellerWalletOpen] = useState(false)
  const [indooWalletOpen, setIndooWalletOpen] = useState(false)
  const [sellerAnalyticsOpen, setSellerAnalyticsOpen] = useState(false)
  const [marketChatOpen, setMarketChatOpen] = useState(false)
  const [marketChatContact, setMarketChatContact] = useState(null)
  const [marketProfileOpen, setMarketProfileOpen] = useState(false)
  const [marketNotifOpen, setMarketNotifOpen] = useState(false)
  const [marketCartOpen, setMarketCartOpen] = useState(false)
  const [buyerDashOpen, setBuyerDashOpen] = useState(false)
  const [usedGoodsOpen, setUsedGoodsOpen] = useState(false)
  const [wantedBoardOpen, setWantedBoardOpen] = useState(false)
  const [sellerReviewsOpen, setSellerReviewsOpen] = useState(false)
  const [writeReviewOpen, setWriteReviewOpen] = useState(false)
  const [writeReviewOrder, setWriteReviewOrder] = useState(null)
  const [sellerProductsOpen, setSellerProductsOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [massageOpen, setMassageOpen] = useState(false)
  const [massageOnLanding, setMassageOnLanding] = useState(true)
  const [datingOnLanding, setDatingOnLanding] = useState(true)
  const [sectionGate, setSectionGate] = useState(null) // 'dating' | 'marketplace' | null
  const [rideVehicleType, setRideVehicleType] = useState('bike_ride') // 'bike_ride' | 'car_taxi'
  const [giftForSession, setGiftForSession] = useState(null)
  const [dealHuntOpen, setDealHuntOpen] = useState(false)
  const [sellRentOpen, setSellRentOpen] = useState(false)
  const [placesOpen, setPlacesOpen] = useState(false)
  const [rentalInitialView, setRentalInitialView] = useState(null)
  const [rentalInitialMode, setRentalInitialMode] = useState(null)
  const [rentalListingOpen, setRentalListingOpen] = useState(false)
  const [dealDetailOpen, setDealDetailOpen] = useState(null)
  const [createDealOpen, setCreateDealOpen] = useState(false)
  const [postDealOpen, setPostDealOpen] = useState(false)
  const [myDealsOpen, setMyDealsOpen] = useState(false)

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
  const handleOrderViaChat = (params) => {
    setPendingConv(buildOrderConversation({ ...params, userId: user?.id }))
    setActiveTab('chat')
  }

  // ── Make an Offer — creates a chat conversation with an offer card ──
  const handleMakeOffer = (params) => {
    setPendingConv(buildOfferConversation({ ...params, userId: user?.id }))
    setActiveTab('chat')
  }

  return (
    <div className={styles.shell}>
      {/* Offline/Online banner */}
      <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />
      {/* Time-based background fills full screen */}
      <TimeBackground />

      {/* Floating activity icons — visible when dock is on */}
      {dockVisible && activeTab === 'map' && !rideOpen && !andongOpen && !massageOpen && !shopOpen && !foodOpen && !datingGridOpen && !dealHuntOpen && !sellRentOpen && !placesOpen && !notifOpen && !rideHistoryOpen && !settingsOpen && !countrySearchOpen && (
        <FloatingIcons
          sessions={visibleSessions}
          serviceCounts={serviceUnreadCounts}
          onSelectSession={(s) => handleOpenDiscovery(s)}
          onFoodClick={() => { setDockVisible(false); setActiveSection('food'); setFoodOpen(true) }}
          onRideClick={(type) => { if (isGuest) { triggerGate(); return } setActiveSection('rides'); setRideVehicleType(type ?? 'bike_ride'); setRideOpen(true); setDockVisible(false) }}
          onShoppingClick={() => {
            if (isGuest) { triggerGate(); return }
            setDockVisible(false); setActiveSection('rentals'); setRentalInitialMode('sale'); setRentalInitialView(null); setActiveTab('rentals')
          }}
          onDatingClick={() => {
            setActiveSection('dating'); setDatingGridOpen(true)
          }}
          onMassageClick={() => { if (isGuest) { triggerGate(); return } setDockVisible(false); setActiveSection('massage'); setMassageOpen(true) }}
          onRentalsClick={() => { if (isGuest) { triggerGate(); return } setDockVisible(false); setActiveSection('rentals'); setRentalInitialMode('rent'); setRentalInitialView(null); setActiveTab('rentals') }}
          onAndongClick={() => { if (isGuest) { triggerGate(); return } setAndongOpen(true); setDockVisible(false) }}
          onDealHuntClick={() => { setDealHuntOpen(true); setDockVisible(false) }}
          onSellRentClick={() => { setSellRentOpen(true); setDockVisible(false) }}
          onPlacesClick={() => { setPlacesOpen(true); setDockVisible(false) }}
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
          closeOverlay(); setDatingGridOpen(false); setFoodOpen(false); setRideOpen(false)
          setPendingConv(buildChatConversation({ userId: session.userId ?? session.id, displayName: session.displayName, photoURL: session.photoURL, age: session.age, area: session.area ?? session.city, emoji: '💕' }))
          setActiveTab('chat')
        }}
      />
      </Suspense>

      {/* Full-screen tab screens */}
      <Suspense fallback={<LazyFallback />}>
        {activeTab === 'chat' && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#080808', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setActiveTab('map')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>←</button>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Messages</span>
            </div>

            {/* Empty state */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
              <span style={{ fontSize: 48 }}>💬</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>No Active Chats</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
                Chat messages will appear here when you have an active ride or food delivery order.
                Book a ride or order food to start chatting with your driver.
              </span>
              <button onClick={() => setActiveTab('map')} style={{ marginTop: 16, padding: '14px 32px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer' }}>
                Go to Home
              </button>
            </div>

            <IndooFooter label="Messages" onHome={() => setActiveTab('map')} onClose={() => setActiveTab('map')} />
          </div>
        )}
        {activeTab === 'profile' && <ProfileScreen onClose={() => setActiveTab('map')} onOpenSettings={() => setSettingsOpen(true)} />}
        {activeTab === 'rentals' && <div style={{ position: 'fixed', inset: 0, background: '#080808', zIndex: 99 }} />}
        {activeTab === 'rentals' && <RentalSearchScreen onClose={() => { setActiveTab('map'); setDockVisible(true); setRentalInitialView(null); setRentalInitialMode(null); setRentalListingOpen(false) }} initialView={rentalInitialView} initialListingMode={rentalInitialMode} initialListingOpen={rentalListingOpen} />}
      </Suspense>

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + notifications + likes + settings — map tab only, hidden when any module is open */}
      {activeTab === 'map' && !shopOpen && !foodOpen && !rideOpen && !dealHuntOpen && !(massageOpen && !massageOnLanding) && !notifOpen && !rideHistoryOpen && !placesOpen && (
        <MapHeader
          onOpenNotifications={() => setNotifOpen(true)}
          notifCount={notifUnreadCount}
          onAccountClick={() => {
            if (isGuest) { triggerGate(); return }
            setActiveTab('profile')
          }}
        />
      )}

      {/* Search bar + inline auto-suggest — map tab only, hidden when a module is open */}
      {activeTab === 'map' && !shopOpen && !foodOpen && !rideOpen && !dealHuntOpen && !(massageOpen && !massageOnLanding) && !notifOpen && !rideHistoryOpen && (
        <MapSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => {}}
          onClear={() => setSearchQuery('')}
          onSubmit={() => { if (searchQuery.trim()) setCityResultsOpen(true) }}
          filterFlag={filterFlag}
          onFilterTap={() => {}}
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
            closeOverlay(); setDatingGridOpen(false); setFoodOpen(false); setRideOpen(false)
            setPendingConv({ ...buildChatConversation({ userId: acceptedMeetSession.fromUserId ?? 'unknown', displayName: acceptedMeetSession.fromDisplayName, photoURL: acceptedMeetSession.fromPhotoURL, age: _src?.age, area: _src?.area ?? _src?.city, emoji: '💌' }), id: `meet-${acceptedMeetSession.sessionId ?? acceptedMeetSession.id}` })
            setActiveTab('chat'); clearAccepted()
          }}
          onDismiss={clearAccepted}
        />
      )}

      {dateInvite && (
        <DateInvitePopup
          invite={dateInvite}
          onAccept={(inv) => {
            clearDateInvite()
            setPendingConv({ ...buildChatConversation({ userId: inv.from_user_id, displayName: inv.profiles?.display_name, photoURL: inv.profiles?.photo_url, age: inv.profiles?.age, area: inv.profiles?.city, emoji: '💕' }), id: `date-${inv.from_user_id}` })
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
      {andongOpen && <AndongBookingScreen onClose={() => { setAndongOpen(false); setDockVisible(true) }} />}
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      {massageOpen && <MassageScreen onClose={() => { setMassageOpen(false); setMassageOnLanding(true); setDockVisible(true); setActiveSection('default') }} onLandingChange={(onLanding) => { setMassageOnLanding(onLanding); if (!onLanding) setDockVisible(false) }} />}
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
      {shopOpen && <ShopSearchScreen onClose={() => { setShopOpen(false); setDockVisible(true); setGiftForSession(null); setActiveSection('default'); setMarketplaceLanding(true) }} userCity={userProfile?.city} userCountry={userProfile?.country} giftFor={giftForSession} onGiftDismiss={() => setGiftForSession(null)} showToast={showToast} onOrderViaChat={handleOrderViaChat} onMakeOffer={handleMakeOffer} onLandingChange={(onLanding) => { setMarketplaceLanding(onLanding); if (!onLanding) setDockVisible(false) }} onHome={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('map') }} onChat={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('chat') }} onAlerts={() => setNotifOpen(true)} onProfile={() => { setShopOpen(false); setDockVisible(true); setActiveSection('default'); setMarketplaceLanding(true); setActiveTab('profile') }} onOpenUsedGoods={() => setUsedGoodsOpen(true)} onOpenWanted={() => setWantedBoardOpen(true)} />}
      </Suspense>

      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 100 }} />}>
      {foodOpen && (
        <RestaurantBrowseScreen
          category={foodCategory}
          scrollToId={foodScrollToId}
          onBackToCategories={() => setFoodBrowseOpen(false)}
          onClose={() => { setFoodBrowseOpen(false); setFoodOpen(false); setDockVisible(true); setActiveSection('default') }}
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
          const openingText = firstMessage ?? buildIntroText({ ...userProfile, lookingFor: userProfile?.lookingFor ?? session.lookingFor }, user)
          const openingMsg = { id: `intro-${Date.now()}`, senderId: user?.id ?? 'me', text: openingText, time: Date.now(), fromMe: true }
          const convId = `dating-${session.userId ?? session.id}`
          setPendingConv(prev => {
            if (prev?.id === convId) {
              const alreadyHas = prev.messages?.some(m => m.text === openingText)
              return { ...prev, openedAt: prev.openedAt ?? Date.now(), messages: alreadyHas || !firstMessage ? prev.messages : [...(prev.messages ?? []), openingMsg], lastMessage: openingText, lastMessageTime: Date.now() }
            }
            return buildChatConversation({ userId: session.userId ?? session.id, displayName: session.displayName, photoURL: session.photoURL, age: session.age, area: session.area ?? session.city, emoji: '💕', lastMessage: openingText, messages: [openingMsg] })
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
      {notifOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9800 }}>
        <NotificationsScreen
          onClose={() => setNotifOpen(false)}
          userId={user?.id}
          userProfile={userProfile}
          onOpenRideHistory={() => { setNotifOpen(false); setRideHistoryOpen(true) }}
          onOpenChat={(sender) => {
            setNotifOpen(false)
            setPendingConv({ ...buildChatConversation({ userId: sender.fromUserId, displayName: sender.displayName ?? 'New Message', photoURL: sender.photoURL, emoji: '💬' }), id: `notif-${sender.fromUserId ?? Date.now()}` })
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
        </div>,
        document.body
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
      {orderHistoryOpen   && createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 9400 }}><OrderHistoryScreen onClose={() => setOrderHistoryOpen(false)} /></div>, document.body)}
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

      <IndooNewsSheet
        open={newsOpen}
        onClose={() => setNewsOpen(false)}
      />

      <QAFeedScreen
        mode="live"
        open={indooLiveOpen}
        onClose={() => setIndooLiveOpen(false)}
        onOrderViaChat={handleOrderViaChat}
        user={user}
        viewerSession={null}
        viewerProfile={userProfile ?? null}
        targetUserId={null}
        onConnect={(profile) => {
          setIndooLiveOpen(false)
          const myName = userProfile?.displayName ?? user?.displayName ?? 'Someone'
          const openingText = `Hi ${profile.displayName?.split(' ')[0] ?? 'there'}! I found you on Indoo Live 👋 I'm ${myName}`
          const openingMsg = { id: `intro-${Date.now()}`, senderId: user?.id ?? 'me', text: openingText, time: Date.now(), fromMe: true }
          const convId = `live-${profile.userId}`
          setPendingConv(prev => {
            if (prev?.id === convId) return prev
            return { ...buildChatConversation({ userId: profile.userId, displayName: profile.displayName, photoURL: profile.photoURL, age: profile.age, area: profile.city ?? profile.area, emoji: '💬', lastMessage: openingText, messages: [openingMsg] }), id: convId }
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

      <MarketplaceOverlays
        userProfile={userProfile} user={user} rideVehicleType={rideVehicleType}
        driverRegOpen={driverRegOpen} therapistRegOpen={therapistRegOpen}
        marketplaceSignUpOpen={marketplaceSignUpOpen} addProductOpen={addProductOpen}
        sellerOrdersOpen={sellerOrdersOpen} sellerWalletOpen={sellerWalletOpen}
        indooWalletOpen={indooWalletOpen} sellerAnalyticsOpen={sellerAnalyticsOpen}
        marketNotifOpen={marketNotifOpen} marketCartOpen={marketCartOpen}
        buyerDashOpen={buyerDashOpen} usedGoodsOpen={usedGoodsOpen}
        wantedBoardOpen={wantedBoardOpen} sellerReviewsOpen={sellerReviewsOpen}
        writeReviewOpen={writeReviewOpen} writeReviewOrder={writeReviewOrder}
        sellerProductsOpen={sellerProductsOpen} marketChatOpen={marketChatOpen}
        marketProfileOpen={marketProfileOpen}
        setDriverRegOpen={setDriverRegOpen} setTherapistRegOpen={setTherapistRegOpen}
        setMarketplaceSignUpOpen={setMarketplaceSignUpOpen} setAddProductOpen={setAddProductOpen}
        setSellerOrdersOpen={setSellerOrdersOpen} setSellerWalletOpen={setSellerWalletOpen}
        setIndooWalletOpen={setIndooWalletOpen} setSellerAnalyticsOpen={setSellerAnalyticsOpen}
        setMarketNotifOpen={setMarketNotifOpen} setMarketCartOpen={setMarketCartOpen}
        setBuyerDashOpen={setBuyerDashOpen} setUsedGoodsOpen={setUsedGoodsOpen}
        setWantedBoardOpen={setWantedBoardOpen} setSellerReviewsOpen={setSellerReviewsOpen}
        setWriteReviewOpen={setWriteReviewOpen} setWriteReviewOrder={setWriteReviewOrder}
        setSellerProductsOpen={setSellerProductsOpen} setMarketChatOpen={setMarketChatOpen}
        setMarketChatContact={setMarketChatContact} setMarketProfileOpen={setMarketProfileOpen}
        setSettingsOpen={setSettingsOpen} setShopOpen={setShopOpen}
        setMarketplaceLanding={setMarketplaceLanding} setDockVisible={setDockVisible}
      />

      {/* ── Sell / Rent ── */}
      <Suspense fallback={<LazyFallback />}>
        {sellRentOpen && (
          <SellRentSheet
            open={sellRentOpen}
            onClose={() => { setSellRentOpen(false); setDockVisible(true) }}
            onOpenRentalListing={(cat) => {
              setSellRentOpen(false)
              setDockVisible(false)
              setActiveSection('rentals')
              setRentalInitialMode('rent')
              setRentalInitialView(cat === 'vehicles' ? 'vehicles' : cat === 'property' ? 'property' : cat === 'fashion' ? 'fashion' : (cat === 'equipment' || cat === 'electronics' || cat === 'audio') ? 'equipment' : 'categories')
              setActiveTab('rentals')
            }}
            onOpenRentalSell={(cat) => {
              setSellRentOpen(false)
              setDockVisible(false)
              setActiveSection('rentals')
              setRentalInitialMode('sale')
              setRentalInitialView(cat === 'vehicles' ? 'vehicles' : cat === 'property' ? 'property' : cat === 'fashion' ? 'fashion' : (cat === 'equipment' || cat === 'electronics' || cat === 'audio') ? 'equipment' : 'categories')
              setActiveTab('rentals')
            }}
            onOpenAddProduct={() => {
              setSellRentOpen(false)
              setAddProductOpen(true)
            }}
            onOpenCreateDeal={() => {
              setSellRentOpen(false)
              setPostDealOpen(true)
            }}
            onJoinSellRent={() => {
              setSellRentOpen(false)
              setDockVisible(false)
              setActiveSection('rentals')
              setRentalListingOpen(true)
              setRentalInitialView(null)
              setActiveTab('rentals')
            }}
          />
        )}
      </Suspense>

      {/* ── Places (standalone module) ── */}
      {placesOpen && (
        <DestinationDirectory
          open={placesOpen}
          onClose={() => { setPlacesOpen(false); setDockVisible(true) }}
          vehicleMode={null}
          onSelectDestination={(dest) => {
            setPlacesOpen(false)
            setDockVisible(false)
            setActiveSection('rides')
            setRideVehicleType(dest._selectedVehicle || 'bike_ride')
            setRideOpen(true)
          }}
        />
      )}

      {/* ── Deal Hunt ── */}
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#8DC63F', fontSize: 14 }}>Loading Deal Hunt...</span></div>}>
        <DealHuntLanding
          open={dealHuntOpen}
          onClose={() => { setDealHuntOpen(false); setDockVisible(true) }}
          onSelectDeal={(deal) => { setDealDetailOpen({ ...deal, endTime: deal.endTime ?? deal.end_time, dealPrice: deal.dealPrice ?? deal.deal_price, originalPrice: deal.originalPrice ?? deal.original_price, quantityAvailable: deal.quantityAvailable ?? deal.quantity_available, quantityClaimed: deal.quantityClaimed ?? deal.quantity_claimed, sellerName: deal.sellerName ?? deal.seller_name, sellerPhoto: deal.sellerPhoto ?? deal.seller_photo, sellerRating: deal.sellerRating ?? deal.seller_rating, image: deal.image ?? deal.images?.[0] ?? null, claimed: deal.claimed ?? deal.quantity_claimed ?? 0, totalSlots: deal.totalSlots ?? deal.quantity_available ?? 50, description: deal.description ?? deal.sub ?? '', seller: deal.seller ?? { name: deal.seller_name ?? deal.sellerName ?? '', photo: deal.seller_photo ?? deal.sellerPhoto ?? '', rating: deal.seller_rating ?? deal.sellerRating ?? 0, id: deal.seller_id ?? '' }, discount: deal.discount ?? (deal.original_price && deal.deal_price ? Math.round((1 - (deal.deal_price ?? deal.dealPrice) / (deal.original_price ?? deal.originalPrice)) * 100) : 0) }) }}
          onCreateDeal={() => setPostDealOpen(true)}
          notifCount={notifUnreadCount}
          onNotifications={() => { setDealHuntOpen(false); setNotifOpen(true) }}
          onProfile={() => { setDealHuntOpen(false); setActiveTab('profile') }}
          onViewSeller={(deal) => {
            setDealHuntOpen(false)
            if (deal.domain === 'food') { setFoodOpen(true) }
            else if (deal.domain === 'massage') { setMassageOpen(true); setMassageOnLanding(false) }
            else if (deal.domain === 'rentals') { setActiveTab('rentals') }
            else { setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false) }
          }}
        />
        {dealDetailOpen && (
          <DealDetail
            deal={dealDetailOpen}
            open={!!dealDetailOpen}
            onClose={() => setDealDetailOpen(null)}
            onClaim={() => {}}
            onSelectDeal={(deal) => setDealDetailOpen({ ...deal, endTime: deal.endTime ?? deal.end_time, dealPrice: deal.dealPrice ?? deal.deal_price, originalPrice: deal.originalPrice ?? deal.original_price, quantityAvailable: deal.quantityAvailable ?? deal.quantity_available, quantityClaimed: deal.quantityClaimed ?? deal.quantity_claimed, sellerName: deal.sellerName ?? deal.seller_name, sellerPhoto: deal.sellerPhoto ?? deal.seller_photo, sellerRating: deal.sellerRating ?? deal.seller_rating, image: deal.image ?? deal.images?.[0] ?? null, claimed: deal.claimed ?? deal.quantity_claimed ?? 0, totalSlots: deal.totalSlots ?? deal.quantity_available ?? 50, description: deal.description ?? deal.sub ?? '', seller: deal.seller ?? { name: deal.seller_name ?? deal.sellerName ?? '', photo: deal.seller_photo ?? deal.sellerPhoto ?? '', rating: deal.seller_rating ?? deal.sellerRating ?? 0, id: deal.seller_id ?? '' }, discount: deal.discount ?? (deal.original_price && deal.deal_price ? Math.round((1 - (deal.deal_price ?? deal.dealPrice) / (deal.original_price ?? deal.originalPrice)) * 100) : 0) })}
            onChat={() => {
              setDealDetailOpen(null)
              setDealHuntOpen(false)
              setPendingConv(buildChatConversation({
                userId: dealDetailOpen.seller_id ?? 'deal-seller',
                displayName: dealDetailOpen.seller_name ?? 'Seller',
                emoji: '🔥',
                lastMessage: `🔥 Deal: ${dealDetailOpen.title}`,
              }))
              setActiveTab('chat')
            }}
          />
        )}
        <CreateDealPage
          open={createDealOpen}
          onClose={() => setCreateDealOpen(false)}
          onSaved={() => setCreateDealOpen(false)}
          userId={user?.id ?? user?.uid}
        />
        {postDealOpen && (
          <DealPosterVerification
            onClose={() => setPostDealOpen(false)}
            onCreateDeal={() => { setCreateDealOpen(true) }}
          />
        )}
        <PostDealPublic
          open={false}
          onClose={() => {}}
          onPosted={() => {}}
        />
        <MyDealsPage
          open={myDealsOpen}
          onClose={() => setMyDealsOpen(false)}
          userId={user?.id ?? user?.uid}
        />
      </Suspense>

      {/* Dev panel removed for production */}

      {/* Side nav — visible on marketplace with orange theme */}
      {(!rideOpen || rideOnLanding) && (!massageOpen || massageOnLanding) && (!datingGridOpen || datingOnLanding) && activeTab !== 'rentals' && activeTab !== 'chat' && !shopOpen && !foodOpen && !dealHuntOpen && !notifOpen && !rideHistoryOpen && <AppShellBottomNav
          isGuest={isGuest} triggerGate={triggerGate} dockVisible={dockVisible}
          shopOpen={shopOpen} marketplaceLanding={marketplaceLanding}
          userProfile={userProfile} user={user} categorySessions={categorySessions}
          activeSection={activeSection} rideVehicleType={rideVehicleType}
          activeTab={activeTab} inviteOut={inviteOut} mySession={mySession}
          newNowCount={newNowCount} newInviteCount={newInviteCount}
          dateIdeasOpen={dateIdeasOpen} indooLiveOpen={indooLiveOpen}
          driverOnline={driverOnline} notifCount={notifUnreadCount}
          setMarketChatOpen={setMarketChatOpen} setMarketNotifOpen={setMarketNotifOpen}
          setNotifOpen={setNotifOpen} setMarketProfileOpen={setMarketProfileOpen}
          setMarketCartOpen={setMarketCartOpen} setOrderHistoryOpen={setOrderHistoryOpen}
          setMarketplaceSignUpOpen={setMarketplaceSignUpOpen} setAddProductOpen={setAddProductOpen}
          setSellerOrdersOpen={setSellerOrdersOpen} setSellerAnalyticsOpen={setSellerAnalyticsOpen}
          setSellerProductsOpen={setSellerProductsOpen} setIndooWalletOpen={setIndooWalletOpen}
          setBuyerDashOpen={setBuyerDashOpen} setDockVisible={setDockVisible}
          setDriverRegOpen={setDriverRegOpen} setShopOpen={setShopOpen}
          setMarketplaceLanding={setMarketplaceLanding} setFoodOpen={setFoodOpen}
          setFoodBrowseOpen={setFoodBrowseOpen} setDatingIntentOpen={setDatingIntentOpen}
          setDatingGridOpen={setDatingGridOpen} setDatingOnLanding={setDatingOnLanding}
          setMassageOpen={setMassageOpen} setMassageOnLanding={setMassageOnLanding}
          setRideOpen={setRideOpen} setRideOnLanding={setRideOnLanding}
          setActiveSection={setActiveSection} setActiveTab={setActiveTab}
          setCompanyPanelOpen={setCompanyPanelOpen} setSellerDashOpen={setSellerDashOpen}
          setSellerWalletOpen={setSellerWalletOpen} setWriteReviewOpen={setWriteReviewOpen}
          setWriteReviewOrder={setWriteReviewOrder} setSellerReviewsOpen={setSellerReviewsOpen}
          setTherapistRegOpen={setTherapistRegOpen} setDateIdeasOpen={setDateIdeasOpen}
          setIndooLiveOpen={setIndooLiveOpen} setSosOpen={setSosOpen}
          setDriverOnline={setDriverOnline} openDiscoveryList={openDiscoveryList}
        />}
    </div>
  )
}
