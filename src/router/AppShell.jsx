import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useOverlay, OVERLAY } from '@/contexts/OverlayContext'
import { useMySession } from '@/hooks/useMySession'
import { useVenueUnlock } from '@/hooks/useVenueUnlock'
import { useInterests } from '@/hooks/useInterests'
import { sortByRelevance, recordImpression, resetImpressions } from '@/utils/sessionScore'
import { isMakerSession } from '@/utils/sessionCategory'
import { useLiveUsers } from '@/hooks/useLiveUsers'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import { useMeetRequests } from '@/hooks/useMeetRequests'
import { supabase } from '@/lib/supabase'

import { useInviteOut } from '@/hooks/useInviteOut'
import { useCoins } from '@/hooks/useCoins'
import InviteOutSheet from '@/components/golive/InviteOutSheet'
import MapHeader from '@/components/map/MapHeader'
import MapOverlay from '@/components/map/MapOverlay'
import { endSession } from '@/services/sessionService'
import { getSafetyContact } from '@/components/safety/SafetySheet'
import SOSModal from '@/components/safety/SOSModal'
import ProfileStrip from '@/components/map/ProfileStrip'
import BoostBanner from '@/components/ui/BoostBanner'
import StatusCheckInBanner from '@/components/status/StatusCheckInBanner'
import { useStatusCheckIn } from '@/hooks/useStatusCheckIn'
import BottomNav from '@/components/nav/BottomNav'
import GoLiveSheet from '@/components/golive/GoLiveSheet'
import ActiveSessionBar from '@/components/session/ActiveSessionBar'
import StillHerePrompt from '@/components/session/StillHerePrompt'
import DiscoveryCard from '@/components/discovery/DiscoveryCard'
import DiscoveryListSheet from '@/components/discovery/DiscoveryListSheet'
import WaveBanner from '@/components/meet/WaveBanner'
import DateInvitePopup from '@/components/dating/DateInvitePopup'
import { useDateInvites } from '@/hooks/useDateInvites'
import MeetAcceptedBanner from '@/components/meet/MeetAcceptedBanner'
import PaymentGate from '@/components/payment/PaymentGate'
import VenueReveal from '@/components/payment/VenueReveal'
import ReportSheet from '@/components/moderation/ReportSheet'
import SettingsSheet from '@/components/settings/SettingsSheet'
import MapFilterSheet, { DEFAULT_MAP_FILTERS } from '@/components/map/MapFilterSheet'
import CountrySearchSheet, { COUNTRIES } from '@/components/map/CountrySearchSheet'
import MapSearchBar from '@/components/map/MapSearchBar'
import SearchResultsSheet from '@/components/map/SearchResultsSheet'
import CityResultsSheet from '@/components/map/CityResultsSheet'
import CompanyBrowsePanel from '@/components/map/CompanyBrowsePanel'
import ContactUnlockSheet from '@/components/payment/ContactUnlockSheet'
import { useIpCountry } from '@/hooks/useIpCountry'
import MomentumBanner from '@/components/map/MomentumBanner'
import ExtendSessionPrompt from '@/components/ui/ExtendSessionPrompt'
import RatingSheet from '@/components/session/RatingSheet'
import ReviewsSection from '@/components/session/ReviewsSection'
import LikedMeScreen from '@/screens/LikedMeScreen'
import LikedProfilesScreen from '@/screens/LikedProfilesScreen'
import { useLikedProfiles } from '@/hooks/useLikedProfiles'
import NotificationsScreen from '@/screens/NotificationsScreen'
import RideHistoryScreen from '@/screens/RideHistoryScreen'
import BlockedUsersScreen from '@/screens/BlockedUsersScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import WalletScreen from '@/screens/WalletScreen'
import ChatScreen from '@/screens/ChatScreen'
import MatchScreen from '@/screens/MatchScreen'
import VenueGroupChat from '@/components/venue/VenueGroupChat'
import { DEMO_VENUE_MESSAGES } from '@/demo/mockData'
import MomentsBar from '@/components/moments/MomentsBar'
import MomentViewer from '@/components/moments/MomentViewer'
import AddMomentSheet from '@/components/moments/AddMomentSheet'
import { useMoments } from '@/hooks/useMoments'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useGuestGate } from '@/contexts/GuestGateContext'

import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import BottomSheet from '@/components/ui/BottomSheet'
import Toast from '@/components/ui/Toast'
// DemoMapView removed — replaced by TimeBackground
import { DEMO_VENUES, getActiveVenues } from '@/demo/mockVenues'
import VenueSheet from '@/components/map/VenueSheet'
import VenueListSheet from '@/components/map/VenueListSheet'
import VenuePartnerSheet from '@/components/venue/VenuePartnerSheet'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import SpotClaimSheet from '@/components/spots/SpotClaimSheet'
import MySpotScreen from '@/screens/MySpotScreen'
import { PARTNER_VENUES } from '@/demo/mockPartnerVenues'
import ProximityBanner from '@/components/map/ProximityBanner'
import { useVenueProximity } from '@/hooks/useVenueProximity'
import VibeCheckSheet  from '@/components/vibecheck/VibeCheckSheet'
import VibeCheckBanner from '@/components/vibecheck/VibeCheckBanner'

import MapIntroOverlay from '@/components/ui/MapIntroOverlay'
import TimeBackground from '@/components/ui/TimeBackground'
import FloatingIcons from '@/components/home/FloatingIcons'
import ActivityProfileGrid from '@/components/home/ActivityProfileGrid'
import BookingScreen from '@/screens/BookingScreen'
import RestaurantBrowseScreen from '@/screens/RestaurantBrowseScreen'
import CategoryDiscoveryScreen, { FOOD_CATEGORIES } from '@/screens/CategoryDiscoveryScreen'
import { preloadVideos } from '@/utils/videoPreloader'

import '@/styles/map.css'
import styles from './AppShell.module.css'


const DEMO_UNLOCK = {
  venueName: 'The Blue Anchor',
  venueAddress: '13 Lower Mall, London W6 9DJ',
  venueLat: 51.489,
  venueLng: -0.232,
  unlockedAt: new Date(),
}

export default function AppShell({ returnParams, triggerGoLive }) {
  const { overlay, closeOverlay, openGoLive, openVenueReveal, openDiscovery, openPayment } = useOverlay()
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
  const [countrySearchOpen, setCountrySearchOpen] = useState(false)
  const [browseCountry, setBrowseCountry] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityResultsOpen, setCityResultsOpen] = useState(false)
  const [cityFilter, setCityFilter] = useState(null)
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [mapCategory, setMapCategory] = useState('all') // 'all' | 'maker'
  const [datingGridOpen, setDatingGridOpen] = useState(false)
  const [rideOpen,       setRideOpen]       = useState(false)
  const [foodOpen,       setFoodOpen]       = useState(false)
  const [foodCategory,   setFoodCategory]   = useState(null)
  const [foodBrowseOpen, setFoodBrowseOpen] = useState(false)
  const [foodScrollToId, setFoodScrollToId] = useState(null)
  const { incomingInvite: dateInvite, clearInvite: clearDateInvite } = useDateInvites(user?.id ?? null)

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
  const { moments, addMoment } = useMoments()
  useNotifications()
  const [toast, setToast] = useState(null)
  const [likedMeOpen, setLikedMeOpen] = useState(false)
  const [likedProfilesOpen, setLikedProfilesOpen] = useState(false)
  const { likedProfiles, saveLike, removeLike } = useLikedProfiles()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifOpen,       setNotifOpen]       = useState(false)
  const [rideHistoryOpen, setRideHistoryOpen] = useState(false)
  const [blockListOpen, setBlockListOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [venueSheetOpen, setVenueSheetOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [venueListOpen, setVenueListOpen] = useState(false)
  const [venueChatVenue, setVenueChatVenue] = useState(null)
  const [partnerSheetOpen, setPartnerSheetOpen] = useState(false)
  const [selectedPartner, setSelectedPartner]   = useState(null)
  const [venuesOn, setVenuesOn] = useState(false)
  const [momentViewerIndex, setMomentViewerIndex] = useState(null)
  const [addMomentOpen, setAddMomentOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [spotClaimOpen, setSpotClaimOpen] = useState(false)
  const [mySpotOpen, setMySpotOpen] = useState(false)
  const [contactUnlockSession, setContactUnlockSession] = useState(null)
  const [inviteOutSheetOpen, setInviteOutSheetOpen] = useState(false)
  const { inviteOut, post: postInviteOut, goingLive, revertToInviteOut } = useInviteOut()
  const { earn: earnCoins, spend: spendCoins } = useCoins()
  const allMoments = moments
  const [boostToast, setBoostToast] = useState(null)
  const [mapFilter,           setMapFilter]           = useState('home')
  const [discoveryListFilter, setDiscoveryListFilter] = useState('now')
  const [discoveryListOpen,   setDiscoveryListOpen]   = useState(false)
  const [newNowCount,    setNewNowCount]    = useState(0)
  const [newInviteCount, setNewInviteCount] = useState(0)
  const seenNowRef    = useRef(-1)
  const seenInviteRef = useRef(-1)
  const [vibeCheckOpen, setVibeCheckOpen]   = useState(false)
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
    setMapFilter(filter)
  }
  // Full map filter sheet
  const [mapFilterOpen, setMapFilterOpen] = useState(false)
  const [mapFilters, setMapFilters] = useState(DEFAULT_MAP_FILTERS)
  const hasActiveMapFilter = Object.entries(mapFilters).some(([k, v]) => v !== DEFAULT_MAP_FILTERS[k])
  const [activeTab, setActiveTab] = useState('map')

  // Send new users (no display name yet) straight to profile setup
  // Preload all category videos on app mount — silent background fetch.
  // By the time the user taps the food icon, videos are already cached.
  useEffect(() => {
    preloadVideos(FOOD_CATEGORIES.map(c => c.videoUrl))
  }, [])

  useEffect(() => {
    if (userProfile !== null && !userProfile.displayName) {
      setActiveTab('profile')
    }
  }, [userProfile])

  const watchSessionId = returnParams?.sessionId ?? null
  const { unlock } = useVenueUnlock(watchSessionId)

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

  useEffect(() => {
    const handler = () => {
      closeOverlay()
      setTimeout(() => openVenueReveal(DEMO_UNLOCK), 350)
    }
    window.addEventListener('demo:payment-success', handler)
    return () => window.removeEventListener('demo:payment-success', handler)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (unlock) openVenueReveal(unlock)
  }, [unlock]) // eslint-disable-line

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

  const isMakerUser = isMakerSession({ lookingFor: userProfile?.lookingFor })

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

  // Ambient mode: fewer than 3 real (non-seeded) active users visible.
  // Used to promote MomentsBar and planned sessions when the map is quiet.
  const isAmbientMode = useMemo(() =>
    visibleSessions.filter(s => !s.isSeeded && s.status === 'active').length < 3
  , [visibleSessions])

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


  // acceptedMeetSession — banner shown, chat opened only when user taps it
  const handleUnlockVenue = (session) => {
    openPayment({ id: session.id, sessionId: session.sessionId })
  }


  // Update "new since last seen" badge counts when sessions change
  useEffect(() => {
    const nowCount    = categorySessions.filter(s => s.status !== 'invite_out').length
    const inviteCount = categorySessions.filter(s => s.status === 'invite_out').length
    setNewNowCount(Math.max(0, nowCount - seenNowRef.current))
    setNewInviteCount(Math.max(0, inviteCount - seenInviteRef.current))
  }, [categorySessions])

  const activeVenues = getActiveVenues(visibleSessions, DEMO_VENUES)
  const { proximityAlert, dismissAlert } = useVenueProximity(activeVenues)

  const showToast = (message, type = 'info') => setToast({ message, type })

  return (
    <div className={styles.shell}>
      {/* Time-based background fills full screen */}
      <TimeBackground />

      {/* Floating activity icons — home screen only */}
      {activeTab === 'map' && (
        <FloatingIcons
          sessions={visibleSessions}
          onSelectSession={(s) => handleOpenDiscovery(s)}
          onFoodClick={() => setFoodOpen(true)}
        />
      )}

      {/* Dating profiles grid — opened from side nav dating button */}
      <ActivityProfileGrid
        open={datingGridOpen}
        activity={{ emoji: '💕', label: 'Dating' }}
        sessions={visibleSessions.filter(s => s.lookingFor === 'dating')}
        onClose={() => setDatingGridOpen(false)}
        onSelectSession={(s) => { setDatingGridOpen(false); handleOpenDiscovery(s) }}
      />

      {/* Full-screen tab screens */}
      {activeTab === 'match'   && <MatchScreen   onClose={() => setActiveTab('map')} />}
      {activeTab === 'chat'    && <ChatScreen key={pendingConv?.id ?? 'chat'} onClose={() => setActiveTab('map')} pendingConv={pendingConv} />}
      {activeTab === 'profile' && <ProfileScreen onClose={() => setActiveTab('map')} onOpenSettings={() => setSettingsOpen(true)} />}

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + notifications + likes + settings — map tab only */}
      {activeTab === 'map' && (
        <MapHeader
          onOpenNotifications={() => setActiveTab('chat')}
          notifCount={0}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenFilter={() => setMapFilterOpen(true)}
          hasActiveFilter={hasActiveMapFilter}
        />
      )}

      {/* Search bar — map tab only */}
      {activeTab === 'map' && (
        <MapSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => {}}
          onClear={() => setSearchQuery('')}
          onSubmit={() => { if (searchQuery.trim()) setCityResultsOpen(true) }}
          filterFlag={filterFlag}
          onFilterTap={() => setCountrySearchOpen(true)}
          placeholder={companyPanelOpen ? 'Find businesses near you…' : 'Search activity, product, service…'}
          cityFilter={cityFilter}
          onClearCity={() => setCityFilter(null)}
        />
      )}

      <SearchResultsSheet
        open={searchQuery.trim().length >= 2 && !cityResultsOpen}
        query={searchQuery}
        sessions={categorySessions}
        mapCategory={mapCategory}
        userCity={userProfile?.city ?? null}
        onSelect={(s) => { setSearchQuery(''); handleOpenDiscovery(s) }}
        onClose={() => setSearchQuery('')}
      />

      {/* Moments bar — map tab, below header */}
      {activeTab === 'map' && (
        <MomentsBar
          moments={allMoments}
          isLive={!!mySession || isMakerUser}
          ambient={isAmbientMode}
          onAdd={() => { if (isGuest) { triggerGate(); return } setAddMomentOpen(true) }}
          onView={(i) => setMomentViewerIndex(i)}
        />
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
          onUnlockVenue={handleUnlockVenue}
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

      {/* Profile strip */}
      {activeTab === 'map' && (
        <ProfileStrip
          outNowCount={categorySessions.filter(s => s.status !== 'invite_out').length}
          inviteOutCount={categorySessions.filter(s => s.status === 'invite_out').length}
          businessCount={visibleSessions.filter(isMakerSession).length}
          newNowCount={newNowCount}
          newInviteCount={newInviteCount}
          mapCategory={mapCategory}
          onCategoryChange={setMapCategory}
          activeFilter={mapFilter}
          onSelectFilter={(filter) => { setMapFilter(filter); setCompanyPanelOpen(false) }}
          onBoost={(filter) => {
            setMapFilter(filter)
            setBoostToast(filter)
          }}
          hanggleActive={companyPanelOpen}
          onHanggle={() => {
            if (companyPanelOpen) {
              setCompanyPanelOpen(false)
              setMapCategory('all')
              setCityFilter(null)
              setCompanyQuery('')
            } else {
              setMapCategory('maker')
              setCompanyQuery('')
              setCityFilter(null)
              setCompanyPanelOpen(true)
            }
          }}
        />
      )}

      {/* Bottom nav — map tab only */}
      {activeTab === 'map' && (
        <BottomNav
          activeTab={activeTab}
          onChange={(tab) => {
            if (isGuest && tab !== 'map') { triggerGate(); return }
            setActiveTab(tab)
            if (tab === 'map') {
              setVenuesOn(false)
              setCompanyPanelOpen(false)
              setMapFilter('home')
            }
          }}
          unreadChats={0}
          onOpenVenues={() => setVenueListOpen(true)}
          activeVenueCount={activeVenues.length}
          venuesOn={venuesOn}
          onToggleVenues={() => setVenuesOn(v => !v)}
          userPhotoURL={userProfile?.photoURL ?? null}
          userName={userProfile?.displayName ?? 'You'}
          isLive={!!mySession}
          isInviteOut={!mySession && !!inviteOut}
          onProfileTap={() => { if (isGuest) { triggerGate(); return } setInviteOutSheetOpen(true) }}
          onDiscoverNow={()    => openDiscoveryList('now')}
          onDiscoverInvite={() => openDiscoveryList('invite')}
          outNowCount={categorySessions.filter(s => s.status !== 'invite_out').length}
          inviteOutCount={categorySessions.filter(s => s.status === 'invite_out').length}
          newNowCount={newNowCount}
          newInviteCount={newInviteCount}
          businessCount={visibleSessions.filter(isMakerSession).length}
          hanggleActive={companyPanelOpen}
          onHanggle={() => {
            if (companyPanelOpen) {
              setCompanyPanelOpen(false)
              setMapCategory('all')
              setCityFilter(null)
              setCompanyQuery('')
            } else {
              setMapCategory('maker')
              setCompanyQuery('')
              setCityFilter(null)
              setCompanyPanelOpen(true)
            }
          }}
          datingActive={mapCategory === 'dating'}
          onDatingMode={() => {
            setDatingGridOpen(true)
            setCompanyPanelOpen(false)
          }}
          rideActive={rideOpen}
          onRide={() => { if (isGuest) { triggerGate(); return } setRideOpen(true) }}
        />
      )}

      {rideOpen && <BookingScreen onClose={() => setRideOpen(false)} />}

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
        />
      )}

      {/* First-use map intro — shown once, walks user through the UI */}
      {activeTab === 'map' && (
        <MapIntroOverlay onGoLive={() => setInviteOutSheetOpen(true)} />
      )}

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
          simulateAcceptance(session)
        }}
        onLike={saveLike}
        onUnlockContact={isMakerSession(overlay.data ?? {}) ? (s) => setContactUnlockSession(s) : null}
      />
      <ContactUnlockSheet
        open={!!contactUnlockSession}
        session={contactUnlockSession}
        buyerUserId={user?.id ?? 'demo-me'}
        buyerCountry={effectiveCountry}
        onClose={() => setContactUnlockSession(null)}
      />
      <VenueSheet
        open={venueSheetOpen}
        venue={selectedVenue}
        onClose={() => setVenueSheetOpen(false)}
        onSelectSession={(s) => { setVenueSheetOpen(false); setTimeout(() => handleOpenDiscovery(s), 250) }}
        onOpenChat={() => setVenueChatVenue(selectedVenue)}
        userTier={userProfile?.tier ?? null}
        onSpendCoins={(cost) => spendCoins(cost, 'Venue unlock')}
      />
      {venueChatVenue && (
        <VenueGroupChat
          venue={venueChatVenue}
          initialMessages={DEMO_VENUE_MESSAGES[venueChatVenue.id] ?? []}
          onClose={() => setVenueChatVenue(null)}
        />
      )}
      <VenueListSheet
        open={venueListOpen}
        venues={activeVenues}
        onClose={() => setVenueListOpen(false)}
        onSelectVenue={(v) => { setSelectedVenue(v); setVenueSheetOpen(true) }}
      />
      <VenuePartnerSheet
        open={partnerSheetOpen}
        venue={selectedPartner}
        venues={PARTNER_VENUES}
        onSelectVenue={(v) => setSelectedPartner(v)}
        onClose={() => { if (selectedPartner) { setSelectedPartner(null) } else { setPartnerSheetOpen(false) } }}
        sessions={visibleSessions}
      />
      <GoLiveSheet open={overlay.type === OVERLAY.GO_LIVE} onClose={closeOverlay} showToast={showToast} activeVenues={activeVenues} />
      <PaymentGate open={overlay.type === OVERLAY.PAYMENT_GATE} request={overlay.data} onClose={closeOverlay} showToast={showToast} />
      <VenueReveal open={overlay.type === OVERLAY.VENUE_REVEAL} unlock={overlay.data} onClose={closeOverlay} />
      <ReportSheet open={overlay.type === OVERLAY.REPORT} session={overlay.data} onClose={closeOverlay} showToast={showToast} />
      {likedMeOpen && <LikedMeScreen onClose={() => setLikedMeOpen(false)} />}
      {notifOpen && (
        <NotificationsScreen
          onClose={() => setNotifOpen(false)}
          userId={user?.id}
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
        />
      )}
      {rideHistoryOpen && (
        <RideHistoryScreen userId={user?.id} onClose={() => setRideHistoryOpen(false)} />
      )}
      {blockListOpen && <BlockedUsersScreen onClose={() => setBlockListOpen(false)} />}

      <CountrySearchSheet
        open={countrySearchOpen}
        onClose={() => setCountrySearchOpen(false)}
        currentCountry={effectiveCountry}
        homeCountry={userProfile?.country ?? ipCountry}
        userTier={userProfile?.tier ?? null}
        onSelect={country => { setBrowseCountry(country); setCityFilter(null); setCompanyPanelOpen(false) }}
        onUpgrade={() => { setCountrySearchOpen(false); setActiveTab('profile') }}
      />

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

      <MapFilterSheet
        open={mapFilterOpen}
        onClose={() => setMapFilterOpen(false)}
        filters={mapFilters}
        onChange={setMapFilters}
        onReset={() => setMapFilters(DEFAULT_MAP_FILTERS)}
      />

      {walletOpen && <WalletScreen onClose={() => setWalletOpen(false)} />}

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

      {createPortal(
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onOpenLikes={() => { setSettingsOpen(false); setTimeout(() => setLikedMeOpen(true), 200) }}
          onOpenMyLikes={() => { setSettingsOpen(false); setTimeout(() => setLikedProfilesOpen(true), 200) }}
          onEditProfile={() => { setSettingsOpen(false); setTimeout(() => setActiveTab('profile'), 200) }}
          onOpenBlockList={() => { setSettingsOpen(false); setTimeout(() => setBlockListOpen(true), 200) }}
          onOpenWallet={() => setWalletOpen(true)}
          onUpgrade={() => { setSettingsOpen(false); setTimeout(() => setUpgradeOpen(true), 200) }}
          onMySpot={() => { setSettingsOpen(false); setTimeout(() => setMySpotOpen(true), 200) }}
          showToast={showToast}
          onSOS={() => setSosOpen(true)}
        />,
        document.body
      )}

      {likedProfilesOpen && (
        <LikedProfilesScreen
          onClose={() => setLikedProfilesOpen(false)}
          likedProfiles={likedProfiles}
          onRemove={removeLike}
        />
      )}

      <SOSModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        session={mySession}
      />

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
          earnCoins('FIRST_INVITE_OUT')
        }}
        onGoLive={(makerMeta) => { goingLive(); openGoLive(makerMeta) }}
        currentStatus={!!mySession ? 'live' : !!inviteOut ? 'invite' : null}
      />

      <BottomSheet open={reviewsOpen} onClose={() => setReviewsOpen(false)} title="">
        <ReviewsSection />
      </BottomSheet>

      <ProximityBanner
        alert={proximityAlert}
        onDismiss={dismissAlert}
        onTap={(v) => { setSelectedVenue(v); setVenueSheetOpen(true) }}
      />

      {momentViewerIndex !== null && (
        <MomentViewer
          moments={allMoments}
          startIndex={momentViewerIndex}
          onClose={() => setMomentViewerIndex(null)}
        />
      )}
      <AddMomentSheet
        open={addMomentOpen}
        onClose={() => setAddMomentOpen(false)}
        onAdd={(m) => addMoment({ ...m, sessionId: mySession?.id })}
      />

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
    </div>
  )
}
