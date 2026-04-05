import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { useOverlay, OVERLAY } from '@/contexts/OverlayContext'
import { useMySession } from '@/hooks/useMySession'
import { useVenueUnlock } from '@/hooks/useVenueUnlock'
import { useInterests } from '@/hooks/useInterests'
import { sortByRelevance } from '@/utils/sessionScore'
import { isMakerSession } from '@/utils/sessionCategory'
import { useLiveUsers } from '@/hooks/useLiveUsers'
import { useGeolocation } from '@/hooks/useGeolocation'
import { haversineKm } from '@/utils/distance'
import { useMeetRequests } from '@/hooks/useMeetRequests'

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
import MeetRequestBanner from '@/components/meet/MeetRequestBanner'
import MeetAcceptedBanner from '@/components/meet/MeetAcceptedBanner'
import { createMeetConversation } from '@/services/meetService'
import { sendMessage } from '@/services/conversationService'
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
import RatingSheet from '@/components/session/RatingSheet'
import ReviewsSection from '@/components/session/ReviewsSection'
import LikedMeScreen from '@/screens/LikedMeScreen'
import LikedProfilesScreen from '@/screens/LikedProfilesScreen'
import { useLikedProfiles } from '@/hooks/useLikedProfiles'
import NotificationsScreen from '@/screens/NotificationsScreen'
import BlockedUsersScreen from '@/screens/BlockedUsersScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import WalletScreen from '@/screens/WalletScreen'
import ChatScreen from '@/screens/ChatScreen'
import MatchScreen from '@/screens/MatchScreen'
import VenueGroupChat from '@/components/venue/VenueGroupChat'
import { DEMO_VENUE_MESSAGES, DEMO_CENTER } from '@/demo/mockData'
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
import DemoMapView from '@/demo/DemoMapView'
import { DEMO_VENUES, getActiveVenues } from '@/demo/mockVenues'
import VenueSheet from '@/components/map/VenueSheet'
import VenueListSheet from '@/components/map/VenueListSheet'
import VenuePartnerSheet from '@/components/venue/VenuePartnerSheet'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import { PARTNER_VENUES } from '@/demo/mockPartnerVenues'
import ProximityBanner from '@/components/map/ProximityBanner'
import { useVenueProximity } from '@/hooks/useVenueProximity'
import MapView from '@/components/map/MapView'
import VibeCheckSheet  from '@/components/vibecheck/VibeCheckSheet'
import VibeCheckBanner from '@/components/vibecheck/VibeCheckBanner'

import '@/styles/map.css'
import styles from './AppShell.module.css'

const GOOGLE_MAPS_LIBRARIES = ['places']
const HAS_MAPS_KEY = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function GoogleMapsWrapper({ sessions, onSelectUser }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  if (loadError || !isLoaded) return null
  return <MapView sessions={sessions} onSelectUser={onSelectUser} />
}

const DEMO_UNLOCK = {
  venueName: 'The Blue Anchor',
  venueAddress: '13 Lower Mall, London W6 9DJ',
  venueLat: 51.489,
  venueLng: -0.232,
  unlockedAt: new Date(),
}

export default function AppShell({ returnParams, triggerGoLive }) {
  const { overlay, closeOverlay, openGoLive, openVenueReveal, openDiscovery } = useOverlay()
  const { userProfile, user } = useAuth()
  const { triggerGate } = useGuestGate()
  const isGuest = !user
  const { session: mySession, needsCheckIn } = useMySession()
  const { showBanner: showCheckIn, bannerReason, handleStillOut, handleLeaving } = useStatusCheckIn(mySession)
  const { incomingInterests, mutualSessions } = useInterests()
  const { incomingMeetRequest, acceptedMeetSession, simulateAcceptance, clearAccepted, clearIncoming } = useMeetRequests()
  const [pendingConv, setPendingConv] = useState(null)
  const [declinedUserIds, setDeclinedUserIds] = useState(new Set())
  const ipCountry = useIpCountry()
  const [countrySearchOpen, setCountrySearchOpen] = useState(false)
  const [browseCountry, setBrowseCountry] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityResultsOpen, setCityResultsOpen] = useState(false)
  const [cityFilter, setCityFilter] = useState(null)
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [mapCategory, setMapCategory] = useState('all') // 'all' | 'maker'

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
  const [notifOpen, setNotifOpen] = useState(false)
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
  const [contactUnlockSession, setContactUnlockSession] = useState(null)
  const [inviteOutSheetOpen, setInviteOutSheetOpen] = useState(false)
  const { inviteOut, post: postInviteOut, goingLive, revertToInviteOut } = useInviteOut()
  const { earn: earnCoins, spend: spendCoins } = useCoins()
  const allMoments = moments
  const [boostToast, setBoostToast] = useState(null)
  const [mapFilter,           setMapFilter]           = useState('invite')
  const [discoveryListFilter, setDiscoveryListFilter] = useState('now')
  const [discoveryListOpen,   setDiscoveryListOpen]   = useState(false)
  const [newNowCount,    setNewNowCount]    = useState(0)
  const [newInviteCount, setNewInviteCount] = useState(0)
  const [newLaterCount,  setNewLaterCount]  = useState(0)
  const seenNowRef    = useRef(-1)
  const seenInviteRef = useRef(-1)
  const seenLaterRef  = useRef(-1)
  const [mapCenter,    setMapCenter]    = useState({ lat: DEMO_CENTER.lat, lng: DEMO_CENTER.lng })
  const [flyTarget,    setFlyTarget]    = useState(null)
  const [vibeCheckOpen, setVibeCheckOpen]   = useState(false)
  const [vibeBanner, setVibeBanner]         = useState(null) // { status: 'active'|'invite_out'|'scheduled' }

  const handleMapMove = ({ lat, lng }) => {
    setMapCenter({ lat, lng })
  }

  const openDiscoveryList = (filter) => {
    if (filter === 'now') {
      seenNowRef.current = categorySessions.filter(s => s.status !== 'scheduled' && s.status !== 'invite_out').length
      setNewNowCount(0)
    } else if (filter === 'invite') {
      seenInviteRef.current = categorySessions.filter(s => s.status === 'invite_out').length
      setNewInviteCount(0)
    } else if (filter === 'later') {
      seenLaterRef.current = categorySessions.filter(s => s.status === 'scheduled').length
      setNewLaterCount(0)
    }
    setFlyTarget({ lat: DEMO_CENTER.lat, lng: DEMO_CENTER.lng })
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
  useEffect(() => {
    if (userProfile !== null && !userProfile.displayName) {
      setActiveTab('profile')
    }
  }, [userProfile])

  const watchSessionId = returnParams?.sessionId ?? null
  const { unlock } = useVenueUnlock(watchSessionId)

  // Time left on session in ms
  const sessionTimeLeft = mySession ? Math.max(0, mySession.expiresAtMs - Date.now()) : null

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

  // Out Later auto-reset at 3am local time
  useEffect(() => {
    if (!mySession || mySession.status !== 'scheduled') return

    const msUntil3am = () => {
      const now  = new Date()
      const next = new Date(now)
      next.setHours(3, 0, 0, 0)
      if (next <= now) next.setDate(next.getDate() + 1)
      return next.getTime() - now.getTime()
    }

    // If it's already past 3am today and the session was posted before today's 3am, reset now
    const now       = new Date()
    const today3am  = new Date(now); today3am.setHours(3, 0, 0, 0)
    const postedAt  = mySession.startedAtMs ?? mySession.scheduledFor ?? 0
    if (now >= today3am && postedAt < today3am.getTime()) {
      endSession(mySession.id)
      revertToInviteOut()
      return
    }

    // Otherwise schedule a timeout for the next 3am
    const t = setTimeout(() => {
      endSession(mySession.id)
      revertToInviteOut()
    }, msUntil3am())

    return () => clearTimeout(t)
  }, [mySession, revertToInviteOut]) // eslint-disable-line

  // Safety check-in — notify when session goes live
  const prevSessionRef = useRef(null)
  useEffect(() => {
    const wasLive = !!prevSessionRef.current
    const isLive  = !!mySession
    if (!wasLive && isLive) {
      const contact = getSafetyContact()
      if (contact) showToast(`🛡️ Check-in sent to ${contact.name}`, 'success')
    }
    prevSessionRef.current = mySession
  }, [mySession]) // eslint-disable-line

  const visibleSessions = useMemo(() => {
    const filtered = sessions.filter(s => {
      if (declinedUserIds.has(s.userId))                                   return false
      if (mapFilters.status === 'Out Now'   && s.status === 'scheduled')   return false
      if (mapFilters.status === 'Out Later' && s.status !== 'scheduled')   return false
      if (mapFilters.activity !== 'All' && s.activityType?.toLowerCase() !== mapFilters.activity.toLowerCase()) return false
      if (mapFilters.city     !== 'All' && !s.area?.toLowerCase().includes(mapFilters.city.toLowerCase())) return false
      return true
    })
    return sortByRelevance(filtered, mySession, mutualSessions)
  }, [sessions, declinedUserIds, mapFilters, mySession, mutualSessions]) // eslint-disable-line

  // Category + city filtered sessions for the map and ProfileStrip counts
  const categorySessions = useMemo(() => {
    let result = mapCategory === 'maker' ? visibleSessions.filter(isMakerSession) : visibleSessions
    if (cityFilter) {
      const cl = cityFilter.toLowerCase()
      result = result.filter(s =>
        s.city?.toLowerCase() === cl ||
        s.area?.toLowerCase().includes(cl)
      )
    }
    return result
  }, [visibleSessions, mapCategory, cityFilter])

  // Drawer shows makers; map shows everyone including makers (pins update with city/search)
  const companySessions = useMemo(() =>
    companyPanelOpen ? categorySessions.filter(isMakerSession) : []
  , [companyPanelOpen, categorySessions])

  const mapSessions = useMemo(() => {
    const base = categorySessions
    if (mapFilter === 'now')    return base.filter(s => s.status !== 'scheduled' && s.status !== 'invite_out')
    if (mapFilter === 'invite') return base.filter(s => s.status === 'invite_out')
    if (mapFilter === 'later')  return base.filter(s => s.status === 'scheduled')
    return base
  }, [categorySessions, mapFilter])

  // acceptedMeetSession — banner shown, chat opened only when user taps it

  // Cap visible sessions at 50 nearest to map center.
  // The current user's own session is always included regardless of distance.
  const cappedSessions = useMemo(() => {
    const MAX = 50
    if (mapSessions.length <= MAX) return mapSessions
    const myUserId = user?.uid ?? null
    const mine   = myUserId ? mapSessions.filter(s => s.userId === myUserId) : []
    const others  = mapSessions.filter(s => s.userId !== myUserId)
    const { lat: cLat, lng: cLng } = mapCenter
    const sorted = [...others].sort((a, b) => {
      const da = (a.lat - cLat) ** 2 + (a.lng - cLng) ** 2
      const db = (b.lat - cLat) ** 2 + (b.lng - cLng) ** 2
      return da - db
    })
    return [...mine, ...sorted.slice(0, MAX - mine.length)]
  }, [mapSessions, mapCenter, user])

  // Update "new since last seen" badge counts when sessions change
  useEffect(() => {
    const nowCount    = categorySessions.filter(s => s.status !== 'scheduled' && s.status !== 'invite_out').length
    const inviteCount = categorySessions.filter(s => s.status === 'invite_out').length
    const laterCount  = categorySessions.filter(s => s.status === 'scheduled').length
    setNewNowCount(Math.max(0, nowCount - seenNowRef.current))
    setNewInviteCount(Math.max(0, inviteCount - seenInviteRef.current))
    setNewLaterCount(Math.max(0, laterCount - seenLaterRef.current))
  }, [categorySessions])

  const activeVenues = getActiveVenues(visibleSessions, DEMO_VENUES)
  const { proximityAlert, dismissAlert } = useVenueProximity(activeVenues)

  const showToast = (message, type = 'info') => setToast({ message, type })

  return (
    <div className={styles.shell}>
      {/* Map fills full screen — blurred when company drawer is open */}
      <div className={`${styles.mapWrap} ${companyPanelOpen ? styles.mapWrapBlurred : ''}`}>
        {HAS_MAPS_KEY
          ? <GoogleMapsWrapper sessions={cappedSessions} onSelectUser={(s) => openDiscovery(s)} />
          : <DemoMapView
              sessions={cappedSessions}
              onSelectUser={(s) => openDiscovery(s)}
              allVenues={DEMO_VENUES}
              activeVenues={activeVenues}
              onSelectVenue={(v) => { setSelectedVenue(v); setVenueSheetOpen(true) }}
              venuesOn={venuesOn}
              onMapMove={handleMapMove}
              flyTarget={flyTarget}
            />
        }
      </div>

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
          cityFilter={cityFilter}
          onClearCity={() => setCityFilter(null)}
        />
      )}

      {/* Search results sheet — not used in search flow (city slider opens instead) */}
      <SearchResultsSheet
        open={false}
        query={searchQuery}
        sessions={categorySessions}
        mapCategory={mapCategory}
        userCity={userProfile?.city ?? null}
        onSelect={(s) => { setSearchQuery(''); openDiscovery(s) }}
        onClose={() => setSearchQuery('')}
      />

      {/* Moments bar — map tab, below header */}
      {activeTab === 'map' && (
        <MomentsBar
          moments={allMoments}
          isLive={!!mySession}
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


      {/* User B: incoming meet request — accept/decline */}
      {incomingMeetRequest && (
        <MeetRequestBanner
          request={incomingMeetRequest}
          onViewProfile={() => {
            const session = sessions.find(s => s.id === incomingMeetRequest.sessionId) ?? {
              id: incomingMeetRequest.sessionId ?? incomingMeetRequest.id,
              userId: incomingMeetRequest.fromUserId,
              displayName: incomingMeetRequest.fromDisplayName ?? 'Someone',
              photoURL: incomingMeetRequest.fromPhotoURL ?? null,
              photos: incomingMeetRequest.fromPhotoURL ? [incomingMeetRequest.fromPhotoURL] : [],
              status: 'active',
            }
            openDiscovery(session)
          }}
          onAccepted={async (req, greeting) => {
            clearIncoming()
            const _reqSrc = sessions.find(s => s.id === req.sessionId)
            const myUserId = user?.uid ?? user?.id ?? null

            // Try to create a persisted conversation in Supabase
            let convId = `meet-${req.sessionId ?? req.id}`
            try {
              const realId = await createMeetConversation(req.fromUserId, req.sessionId ?? null)
              if (realId) convId = realId
            } catch { /* fallback to local meet- id */ }

            // For real Supabase convs, save greeting to DB so it survives refresh
            const isRealConv = !convId.startsWith('meet-')
            const firstMsg = []
            if (greeting) {
              if (isRealConv && myUserId) {
                try { await sendMessage(convId, myUserId, greeting) } catch {}
              } else {
                firstMsg.push({ id: `greeting-${Date.now()}`, fromMe: true, text: greeting, time: Date.now() })
              }
            }

            const conv = {
              id: convId,
              userId: req.fromUserId ?? 'unknown',
              displayName: req.fromDisplayName ?? 'New Match',
              photoURL: req.fromPhotoURL ?? null,
              age: _reqSrc?.age ?? null,
              area: _reqSrc?.area ?? _reqSrc?.city ?? null,
              emoji: '💌',
              online: true,
              status: 'free',
              openedAt: Date.now(),
              lastMessage: greeting || null,
              lastMessageTime: Date.now(),
              unread: 0,
              messages: firstMsg,
              waitingForReply: !!greeting,
            }
            setPendingConv(conv)
            setActiveTab('chat')
          }}
          onDeclined={() => {
            clearIncoming()
            if (incomingMeetRequest?.fromUserId) {
              setDeclinedUserIds(prev => new Set([...prev, incomingMeetRequest.fromUserId]))
            }
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

      {/* Profile strip — hidden when company drawer is open */}
      {activeTab === 'map' && !companyPanelOpen && (
        <ProfileStrip
          outNowCount={categorySessions.filter(s => s.status !== 'scheduled' && s.status !== 'invite_out').length}
          inviteOutCount={categorySessions.filter(s => s.status === 'invite_out').length}
          outLaterCount={categorySessions.filter(s => s.status === 'scheduled').length}
          newNowCount={newNowCount}
          newInviteCount={newInviteCount}
          newLaterCount={newLaterCount}
          activeFilter={mapFilter}
          mapCategory={mapCategory}
          onCategoryChange={setMapCategory}
          onDiscoverNow={()    => openDiscoveryList('now')}
          onDiscoverInvite={() => openDiscoveryList('invite')}
          onDiscoverLater={()  => openDiscoveryList('later')}
          onBoost={(filter) => {
            setMapFilter(filter)
            setBoostToast(filter)
          }}
        />
      )}

      {/* Bottom nav — map tab only */}
      {activeTab === 'map' && (
        <BottomNav
          activeTab={activeTab}
          onChange={(tab) => { if (isGuest && tab !== 'map') { triggerGate(); return } setActiveTab(tab); if (tab === 'map') { setVenuesOn(false); setCompanyPanelOpen(false) } }}
          unreadChats={0}
          onOpenVenues={() => setVenueListOpen(true)}
          activeVenueCount={activeVenues.length}
          venuesOn={venuesOn}
          onToggleVenues={() => setVenuesOn(v => !v)}
          userPhotoURL={userProfile?.photoURL ?? null}
          userName={userProfile?.displayName ?? 'You'}
          isLive={!!mySession}
          isInviteOut={!mySession && !!inviteOut}
          isScheduled={false}
          onProfileTap={() => { if (isGuest) { triggerGate(); return } setInviteOutSheetOpen(true) }}
        />
      )}

      <StillHerePrompt open={needsCheckIn && !!mySession} sessionId={mySession?.id} />

      {/* Sheets */}
      <DiscoveryCard
        open={overlay.type === OVERLAY.DISCOVERY}
        session={overlay.data}
        mySession={mySession}
        onClose={closeOverlay}
        showToast={showToast}
        onGuestAction={isGuest ? triggerGate : null}
        onMeetSent={(session) => simulateAcceptance(session)}
        onLike={saveLike}
        onUnlockContact={isMakerSession(overlay.data ?? {}) ? (s) => setContactUnlockSession(s) : null}
        buyerCountry={effectiveCountry}
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
        onSelectSession={(s) => { setVenueSheetOpen(false); setTimeout(() => openDiscovery(s), 250) }}
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
      {notifOpen && <NotificationsScreen onClose={() => setNotifOpen(false)} />}
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
        onSelect={s => { setCompanyPanelOpen(false); openDiscovery(s) }}
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
        onSelect={(s) => { setDiscoveryListOpen(false); setTimeout(() => openDiscovery(s), 200) }}
      />
      <InviteOutSheet
        open={inviteOutSheetOpen}
        onClose={() => setInviteOutSheetOpen(false)}
        onPost={async (activity, message) => {
          if (mySession) { try { await endSession(mySession.id) } catch {} }
          postInviteOut({ activityType: activity, message, tier: userProfile?.tier ?? null })
          earnCoins('FIRST_INVITE_OUT')
        }}
        onGoLive={() => { goingLive(); openGoLive() }}
        onGoLater={() => { goingLive(); openGoLive() }}
        currentStatus={mySession?.status === 'scheduled' ? 'later' : !!mySession ? 'live' : !!inviteOut ? 'invite' : null}
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
