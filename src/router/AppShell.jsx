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
import LikedMeSheet from '@/components/likes/LikedMeSheet'
import ProfileScreen from '@/screens/ProfileScreen'
import ChatScreen from '@/screens/ChatScreen'
import MatchScreen from '@/screens/MatchScreen'
import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
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

  const showToast = (message, type = 'info') => setToast({ message, type })

  return (
    <div className={styles.shell}>
      {/* Map fills full screen (hidden when on non-map tab) */}
      {HAS_MAPS_KEY
        ? <GoogleMapsWrapper />
        : <DemoMapView sessions={sessions} onSelectUser={(s) => { setSelectedStripId(s.id); openDiscovery(s) }} />
      }

      {/* Full-screen tab screens */}
      {activeTab === 'match'   && <MatchScreen />}
      {activeTab === 'chat'    && <ChatScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <div className="map-top-fade" />
      <div className="map-bottom-fade" />

      {/* Header: logo + settings/likes */}
      <MapHeader onOpenLikes={() => setLikedMeOpen(true)} />

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

      {/* When live, show countdown on map */}
      {mySession && (
        <MapOverlay
          outNowCount={sessions.length}
          isLive={true}
          sessionTimeLeft={sessionTimeLeft}
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

      {/* Profile strip — nearest live users, only visible on map tab */}
      {activeTab === 'map' && (
        <ProfileStrip
          sessions={sessions.slice(0, 8)}
          selectedId={selectedStripId}
          onSelect={(s) => { setSelectedStripId(s.id); openDiscovery(s) }}
        />
      )}

      {/* Bottom nav — only show on map tab (other screens have own headers) */}
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        unreadChats={activeTab !== 'chat' ? 1 : 0}
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
      <LikedMeSheet open={likedMeOpen} onClose={() => setLikedMeOpen(false)} />

      <AddToHomeScreenBanner />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}
