import { useEffect, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { useOverlay, OVERLAY } from '@/contexts/OverlayContext'
import { useMySession } from '@/hooks/useMySession'
import { useOtwRequests } from '@/hooks/useOtwRequests'
import { useVenueUnlock } from '@/hooks/useVenueUnlock'
import { useInterests } from '@/hooks/useInterests'
import { useLiveUsers } from '@/hooks/useLiveUsers'

import MapHeader from '@/components/map/MapHeader'
import MapOverlay from '@/components/map/MapOverlay'
import { endSession } from '@/services/sessionService'
import ProfileStrip from '@/components/map/ProfileStrip'
import BottomNav from '@/components/nav/BottomNav'
import GoLiveSheet from '@/components/golive/GoLiveSheet'
import ActiveSessionBar from '@/components/session/ActiveSessionBar'
import StillHerePrompt from '@/components/session/StillHerePrompt'
import DiscoveryCard from '@/components/discovery/DiscoveryCard'
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
import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import BottomSheet from '@/components/ui/BottomSheet'
import Toast from '@/components/ui/Toast'
import DemoMapView from '@/demo/DemoMapView'
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

export default function AppShell({ returnParams }) {
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
  // null | 'live' | 'scheduled' — quick strip toggles
  const [hiddenType, setHiddenType] = useState(null)
  const hideLive      = hiddenType === 'live'
  const hideScheduled = hiddenType === 'scheduled'
  // Full map filter sheet
  const [mapFilterOpen, setMapFilterOpen] = useState(false)
  const [mapFilters, setMapFilters] = useState(DEFAULT_MAP_FILTERS)
  const hasActiveMapFilter = Object.entries(mapFilters).some(([k, v]) => v !== DEFAULT_MAP_FILTERS[k])
  const [activeTab, setActiveTab] = useState('map')
  const [selectedStripId, setSelectedStripId] = useState(null)

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

  const visibleSessions = sessions.filter(s => {
    if (s.status === 'scheduled' ? hideScheduled : hideLive) return false
    if (mapFilters.status === 'Out Now'    && s.status === 'scheduled') return false
    if (mapFilters.status === 'Out Later'  && s.status !== 'scheduled') return false
    if (mapFilters.activity !== 'All' && s.activityType?.toLowerCase() !== mapFilters.activity.toLowerCase()) return false
    if (mapFilters.city     !== 'All' && !s.area?.toLowerCase().includes(mapFilters.city.toLowerCase())) return false
    return true
  })

  const showToast = (message, type = 'info') => setToast({ message, type })

  return (
    <div className={styles.shell}>
      {/* Map fills full screen (hidden when on non-map tab) */}
      {HAS_MAPS_KEY
        ? <GoogleMapsWrapper />
        : <DemoMapView sessions={visibleSessions} onSelectUser={(s) => { setSelectedStripId(s.id); openDiscovery(s) }} />
      }

      {/* Full-screen tab screens */}
      {activeTab === 'match'   && <MatchScreen />}
      {activeTab === 'chat'    && <ChatScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + notifications + likes + settings */}
      <MapHeader
        onOpenNotifications={() => setNotifOpen(true)}
        notifCount={notifOpen ? 0 : DEMO_UNREAD_COUNT}
        onOpenLikes={() => setLikedMeOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Map overlay: out now count + activate button (or session bar) */}
      {mySession
        ? <ActiveSessionBar session={mySession} />
        : (
          <MapOverlay
            outNowCount={sessions.length}
            onActivate={openGoLive}
            isLive={false}
            sessionTimeLeft={null}
          />
        )
      }

      {/* When live, show countdown + FINISH OUT button — tapping opens rating sheet */}
      {mySession && (
        <MapOverlay
          outNowCount={sessions.length}
          isLive={true}
          sessionTimeLeft={sessionTimeLeft}
          onEnd={() => setRatingOpen(true)}
        />
      )}

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
          sessions={visibleSessions.slice(0, 3)}
          selectedId={selectedStripId}
          onSelect={(s) => { setSelectedStripId(s.id); openDiscovery(s) }}
          hideLive={hideLive}
          hideScheduled={hideScheduled}
          onToggleLive={() => setHiddenType(v => v === 'live' ? null : 'live')}
          onToggleScheduled={() => setHiddenType(v => v === 'scheduled' ? null : 'scheduled')}
          otwUserId={myOutgoingRequest?.toUserId ?? null}
        />
      )}

      {/* Bottom nav — only show on map tab (other screens have own headers) */}
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        unreadChats={activeTab !== 'chat' ? 1 : 0}
        hasActiveMapFilter={hasActiveMapFilter}
        onOpenFilter={() => setMapFilterOpen(true)}
      />

      <StillHerePrompt open={needsCheckIn && !!mySession} sessionId={mySession?.id} />

      {/* Sheets */}
      <DiscoveryCard
        open={overlay.type === OVERLAY.DISCOVERY}
        session={overlay.data}
        onClose={closeOverlay}
        showToast={showToast}
      />
      <GoLiveSheet open={overlay.type === OVERLAY.GO_LIVE} onClose={closeOverlay} showToast={showToast} />
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
      />

      <RatingSheet
        open={ratingOpen}
        onSubmit={() => {
          setRatingOpen(false)
          showToast('Thanks for your feedback!', 'success')
          endSession(mySession?.id)
        }}
        onSkip={() => {
          setRatingOpen(false)
          endSession(mySession?.id)
        }}
      />

      <BottomSheet open={reviewsOpen} onClose={() => setReviewsOpen(false)} title="">
        <ReviewsSection />
      </BottomSheet>

      <AddToHomeScreenBanner />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}
