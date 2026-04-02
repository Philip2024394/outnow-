import { useEffect, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { useOverlay, OVERLAY } from '@/contexts/OverlayContext'
import { useMySession } from '@/hooks/useMySession'
import { useOtwRequests } from '@/hooks/useOtwRequests'
import { useVenueUnlock } from '@/hooks/useVenueUnlock'
import { useInterests } from '@/hooks/useInterests'
import { useLiveUsers } from '@/hooks/useLiveUsers'

import { useInviteOut } from '@/hooks/useInviteOut'
import { useCoins } from '@/hooks/useCoins'
import InviteOutSheet from '@/components/golive/InviteOutSheet'
import MapHeader from '@/components/map/MapHeader'
import MapOverlay from '@/components/map/MapOverlay'
import { endSession } from '@/services/sessionService'
import { getSafetyContact } from '@/components/safety/SafetySheet'
import SOSModal from '@/components/safety/SOSModal'
import ProfileStrip from '@/components/map/ProfileStrip'
import BottomNav from '@/components/nav/BottomNav'
import GoLiveSheet from '@/components/golive/GoLiveSheet'
import ActiveSessionBar from '@/components/session/ActiveSessionBar'
import StillHerePrompt from '@/components/session/StillHerePrompt'
import DiscoveryCard from '@/components/discovery/DiscoveryCard'
import DiscoveryListSheet from '@/components/discovery/DiscoveryListSheet'
import OtwRequestBanner from '@/components/otw/OtwRequestBanner'
import OtwSentSheet from '@/components/otw/OtwSentSheet'
import PaymentGate from '@/components/payment/PaymentGate'
import VenueReveal from '@/components/payment/VenueReveal'
import ReportSheet from '@/components/moderation/ReportSheet'
import SettingsSheet from '@/components/settings/SettingsSheet'
import MapFilterSheet, { DEFAULT_MAP_FILTERS } from '@/components/map/MapFilterSheet'
import RatingSheet from '@/components/session/RatingSheet'
import ReviewsSection from '@/components/session/ReviewsSection'
import LikedMeScreen from '@/screens/LikedMeScreen'
import NotificationsScreen, { DEMO_UNREAD_COUNT } from '@/screens/NotificationsScreen'
import BlockedUsersScreen from '@/screens/BlockedUsersScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import ChatScreen from '@/screens/ChatScreen'
import MatchScreen from '@/screens/MatchScreen'
import VenueGroupChat from '@/components/venue/VenueGroupChat'
import { DEMO_VENUE_MESSAGES } from '@/demo/mockData'
import MomentsBar from '@/components/moments/MomentsBar'
import MomentViewer from '@/components/moments/MomentViewer'
import AddMomentSheet from '@/components/moments/AddMomentSheet'
import { DEMO_MOMENTS } from '@/demo/mockData'
import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import BottomSheet from '@/components/ui/BottomSheet'
import Toast from '@/components/ui/Toast'
import DemoMapView from '@/demo/DemoMapView'
import { DEMO_VENUES, getActiveVenues } from '@/demo/mockVenues'
import VenueSheet from '@/components/map/VenueSheet'
import VenueListSheet from '@/components/map/VenueListSheet'
import ProximityBanner from '@/components/map/ProximityBanner'
import { useVenueProximity } from '@/hooks/useVenueProximity'
import MapView from '@/components/map/MapView'

import '@/styles/map.css'
import styles from './AppShell.module.css'

const GOOGLE_MAPS_LIBRARIES = ['places']
const HAS_MAPS_KEY = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function GoogleMapsWrapper() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  if (loadError || !isLoaded) return null
  return <MapView />
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
  const { session: mySession, needsCheckIn } = useMySession()
  const { incomingRequest, myOutgoingRequest } = useOtwRequests()
  const { incomingInterests } = useInterests()
  const { sessions } = useLiveUsers()
  const [toast, setToast] = useState(null)
  const [likedMeOpen, setLikedMeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [blockListOpen, setBlockListOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [venueSheetOpen, setVenueSheetOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [venueListOpen, setVenueListOpen] = useState(false)
  const [venueChatVenue, setVenueChatVenue] = useState(null)
  const [momentViewerIndex, setMomentViewerIndex] = useState(null)
  const [addMomentOpen, setAddMomentOpen] = useState(false)
  const [extraMoments, setExtraMoments] = useState([])
  const [sosOpen, setSosOpen] = useState(false)
  const [inviteOutSheetOpen, setInviteOutSheetOpen] = useState(false)
  const { inviteOut, post: postInviteOut, goingLive, revertToInviteOut } = useInviteOut()
  const { earn: earnCoins } = useCoins()
  const allMoments = [...DEMO_MOMENTS, ...extraMoments]
  const [discoveryListFilter, setDiscoveryListFilter] = useState('now')
  const [discoveryListOpen,   setDiscoveryListOpen]   = useState(false)

  const openDiscoveryList = (filter) => {
    setDiscoveryListFilter(filter)
    setDiscoveryListOpen(true)
  }
  // Full map filter sheet
  const [mapFilterOpen, setMapFilterOpen] = useState(false)
  const [mapFilters, setMapFilters] = useState(DEFAULT_MAP_FILTERS)
  const hasActiveMapFilter = Object.entries(mapFilters).some(([k, v]) => v !== DEFAULT_MAP_FILTERS[k])
  const [activeTab, setActiveTab] = useState('map')

  const watchSessionId = returnParams?.sessionId ?? myOutgoingRequest?.sessionId ?? null
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

  const visibleSessions = sessions.filter(s => {
    if (mapFilters.status === 'Out Now'   && s.status === 'scheduled')  return false
    if (mapFilters.status === 'Out Later' && s.status !== 'scheduled')  return false
    if (mapFilters.activity !== 'All' && s.activityType?.toLowerCase() !== mapFilters.activity.toLowerCase()) return false
    if (mapFilters.city     !== 'All' && !s.area?.toLowerCase().includes(mapFilters.city.toLowerCase())) return false
    return true
  })

  const activeVenues = getActiveVenues(visibleSessions, DEMO_VENUES)
  const { proximityAlert, dismissAlert } = useVenueProximity(activeVenues)

  const showToast = (message, type = 'info') => setToast({ message, type })

  return (
    <div className={styles.shell}>
      {/* Map fills full screen (hidden when on non-map tab) */}
      {HAS_MAPS_KEY
        ? <GoogleMapsWrapper />
        : <DemoMapView
            sessions={visibleSessions}
            onSelectUser={(s) => openDiscovery(s)}
            activeVenues={activeVenues}
            onSelectVenue={(v) => { setSelectedVenue(v); setVenueSheetOpen(true) }}
          />
      }

      {/* Full-screen tab screens */}
      {activeTab === 'match'   && <MatchScreen   onClose={() => setActiveTab('map')} />}
      {activeTab === 'chat'    && <ChatScreen     onClose={() => setActiveTab('map')} />}
      {activeTab === 'profile' && <ProfileScreen  onClose={() => setActiveTab('map')} />}

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + notifications + likes + settings — map tab only */}
      {activeTab === 'map' && (
        <MapHeader
          onOpenNotifications={() => setNotifOpen(true)}
          notifCount={notifOpen ? 0 : DEMO_UNREAD_COUNT}
          onOpenLikes={() => setLikedMeOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Moments bar — map tab, below header */}
      {activeTab === 'map' && (
        <MomentsBar
          moments={allMoments}
          isLive={!!mySession}
          onAdd={() => setAddMomentOpen(true)}
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

      {/* Incoming OTW banner */}
      {incomingRequest && (
        <OtwRequestBanner request={incomingRequest} onAction={() => showToast} />
      )}

      {incomingInterests.length > 0 && !incomingRequest && (
        <div className={styles.interestBadge}>
          {incomingInterests.length} want to meet you
        </div>
      )}

      {/* Profile strip — max 4 nearest live users, only visible on map tab */}
      {activeTab === 'map' && (
        <ProfileStrip
          outNowCount={sessions.filter(s => s.status !== 'scheduled' && s.status !== 'invite_out').length}
          inviteOutCount={sessions.filter(s => s.status === 'invite_out').length}
          outLaterCount={sessions.filter(s => s.status === 'scheduled').length}
          onDiscoverNow={()    => openDiscoveryList('now')}
          onDiscoverInvite={() => openDiscoveryList('invite')}
          onDiscoverLater={()  => openDiscoveryList('later')}
        />
      )}

      {/* Bottom nav — map tab only */}
      {activeTab === 'map' && (
        <BottomNav
          activeTab={activeTab}
          onChange={setActiveTab}
          unreadChats={0}
          hasActiveMapFilter={hasActiveMapFilter}
          onOpenFilter={() => setMapFilterOpen(true)}
          onOpenVenues={() => setVenueListOpen(true)}
          activeVenueCount={activeVenues.length}
          userPhotoURL={null}
          userName="You"
          isLive={!!mySession}
          isInviteOut={!mySession && !!inviteOut}
          isScheduled={false}
          onProfileTap={() => setInviteOutSheetOpen(true)}
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
      />
      <VenueSheet
        open={venueSheetOpen}
        venue={selectedVenue}
        onClose={() => setVenueSheetOpen(false)}
        onSelectSession={(s) => { setVenueSheetOpen(false); setTimeout(() => openDiscovery(s), 250) }}
        onOpenChat={() => setVenueChatVenue(selectedVenue)}
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
      <GoLiveSheet open={overlay.type === OVERLAY.GO_LIVE} onClose={closeOverlay} showToast={showToast} activeVenues={activeVenues} />
      <OtwSentSheet open={overlay.type === OVERLAY.OTW_SENT} request={overlay.data} onClose={closeOverlay} />
      <PaymentGate open={overlay.type === OVERLAY.PAYMENT_GATE} request={overlay.data} onClose={closeOverlay} showToast={showToast} />
      <VenueReveal open={overlay.type === OVERLAY.VENUE_REVEAL} unlock={overlay.data} request={myOutgoingRequest} onClose={closeOverlay} />
      <ReportSheet open={overlay.type === OVERLAY.REPORT} session={overlay.data} onClose={closeOverlay} showToast={showToast} />
      {likedMeOpen && <LikedMeScreen onClose={() => setLikedMeOpen(false)} />}
      {notifOpen && <NotificationsScreen onClose={() => setNotifOpen(false)} />}
      {blockListOpen && <BlockedUsersScreen onClose={() => setBlockListOpen(false)} />}

      <MapFilterSheet
        open={mapFilterOpen}
        onClose={() => setMapFilterOpen(false)}
        filters={mapFilters}
        onChange={setMapFilters}
        onReset={() => setMapFilters(DEFAULT_MAP_FILTERS)}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenLikes={() => { setSettingsOpen(false); setTimeout(() => setLikedMeOpen(true), 200) }}
        onEditProfile={() => { setSettingsOpen(false); setTimeout(() => setActiveTab('profile'), 200) }}
        onOpenBlockList={() => { setSettingsOpen(false); setTimeout(() => setBlockListOpen(true), 200) }}
        showToast={showToast}
        onSOS={() => setSosOpen(true)}
      />

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
          postInviteOut(activity, message)
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
        onAdd={(m) => setExtraMoments(prev => [{
          ...m,
          id: `moment-user-${Date.now()}`,
          userId: 'me',
          displayName: 'You',
          sessionId: mySession?.id,
          createdAt: Date.now(),
          expiresAt: Date.now() + 6 * 60 * 60 * 1000,
        }, ...prev])}
      />

      <AddToHomeScreenBanner />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}
