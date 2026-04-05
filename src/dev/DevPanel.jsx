/**
 * DEV PANEL — Admin design tool
 * Floating overlay button that opens a panel to preview every popup,
 * banner, sheet, and notification in the app with mock data.
 * Only mounts when import.meta.env.DEV === true (or localStorage dev_panel='1').
 */
import { useState, useEffect } from 'react'

// ── UI ──────────────────────────────────────────────────────────────
import Toast from '@/components/ui/Toast'

// ── Banners ─────────────────────────────────────────────────────────
import MeetRequestBanner   from '@/components/meet/MeetRequestBanner'
import MeetAcceptedBanner  from '@/components/meet/MeetAcceptedBanner'
import ProximityBanner     from '@/components/map/ProximityBanner'

// ── Vibe Check ───────────────────────────────────────────────────────
import VibeCheckSheet  from '@/components/vibecheck/VibeCheckSheet'
import VibeCheckBanner from '@/components/vibecheck/VibeCheckBanner'

// ── Profile sliders ──────────────────────────────────────────────────
import DiscoveryCard from '@/components/discovery/DiscoveryCard'

// ── List sheets ──────────────────────────────────────────────────────
import DiscoveryListSheet from '@/components/discovery/DiscoveryListSheet'
import VenueListSheet     from '@/components/map/VenueListSheet'

// ── Venue ────────────────────────────────────────────────────────────
import VenueSheet from '@/components/map/VenueSheet'

// ── Go Live / Session ────────────────────────────────────────────────
import GoLiveSheet    from '@/components/golive/GoLiveSheet'
import InviteOutSheet from '@/components/golive/InviteOutSheet'
import RatingSheet    from '@/components/session/RatingSheet'
import StillHerePrompt from '@/components/session/StillHerePrompt'

// ── Modals / Gates ───────────────────────────────────────────────────
import SOSModal    from '@/components/safety/SOSModal'
import ReportSheet from '@/components/moderation/ReportSheet'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import MapFilterSheet, { DEFAULT_MAP_FILTERS } from '@/components/map/MapFilterSheet'

// ── Screens ──────────────────────────────────────────────────────────
import ChatScreen          from '@/screens/ChatScreen'
import MatchScreen         from '@/screens/MatchScreen'
import NotificationsScreen from '@/screens/NotificationsScreen'
import LikedMeScreen       from '@/screens/LikedMeScreen'
import WalletScreen        from '@/screens/WalletScreen'
import ProfileScreen       from '@/screens/ProfileScreen'

import styles from './DevPanel.module.css'

// ─────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────
const now = Date.now()

const MOCK_SESSION_NOW = {
  id: 'dev-now-1', userId: 'dev-u1',
  displayName: 'Sophie', age: 27,
  photoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png',
  photos: ['https://ik.imagekit.io/nepgaxllc/uk1.png','https://ik.imagekit.io/nepgaxllc/uk3.png','https://ik.imagekit.io/nepgaxllc/uk5.png'],
  bio: 'Love a good cocktail bar and terrible karaoke 🎤 Always up for spontaneous plans and meeting new people.',
  activityType: 'drinks', activities: ['drinks','food','hangout'],
  lookingFor: 'Dating', area: 'Soho', city: 'London',
  status: 'active', distanceKm: 0.3, tier: 'vip',
  expiresAtMs: now + 45 * 60 * 1000, startedAtMs: now - 15 * 60 * 1000,
  lat: 51.5135, lng: -0.1322,
}

const MOCK_SESSION_INVITE = {
  id: 'dev-invite-1', userId: 'dev-u2',
  displayName: 'Zara', age: 24,
  photoURL: 'https://ik.imagekit.io/nepgaxllc/uk2.png',
  photos: ['https://ik.imagekit.io/nepgaxllc/uk2.png','https://ik.imagekit.io/nepgaxllc/uk4.png'],
  bio: 'Coffee snob ☕ and gallery hopper. Open to meeting someone interesting.',
  activityType: 'coffee', activities: ['coffee','culture'],
  lookingFor: 'Friendship', area: 'Shoreditch', city: 'London',
  status: 'invite_out', distanceKm: 0.5, tier: 'pro',
  lat: 51.522, lng: -0.076,
}

const MOCK_SESSION_NO_PHOTO = {
  id: 'dev-nophoto-1', userId: 'dev-u9',
  displayName: 'Alex', age: 26,
  photoURL: null, photos: [],
  bio: 'Haven\'t added a photo yet — but I\'m out here!',
  activityType: 'drinks', activities: ['drinks','hangout'],
  lookingFor: 'Dating', area: 'Soho', city: 'London',
  status: 'active', distanceKm: 0.4, tier: null,
  expiresAtMs: now + 45 * 60 * 1000, startedAtMs: now - 10 * 60 * 1000,
  lat: 51.513, lng: -0.132,
}

const MOCK_SESSION_LATER = {
  id: 'dev-later-1', userId: 'dev-u3',
  displayName: 'Grace', age: 29,
  photoURL: 'https://ik.imagekit.io/nepgaxllc/uk6.png',
  photos: ['https://ik.imagekit.io/nepgaxllc/uk6.png','https://ik.imagekit.io/nepgaxllc/uk8.png'],
  bio: 'Foodie and part-time art gallery wanderer 🍷 Looking for genuine connection.',
  activityType: 'food', activities: ['food','drinks','culture'],
  lookingFor: 'Dating', area: 'Fitzrovia', city: 'London',
  status: 'scheduled', distanceKm: 1.4, tier: null,
  scheduledFor: now + 4 * 60 * 60 * 1000,
  lat: 51.5196, lng: -0.1357,
}

const MOCK_VENUE = {
  id: 'dev-venue-1', name: 'The Neon Tap', emoji: '🍺', type: 'Bar',
  address: '23 Old Compton St, Soho', lat: 51.5133, lng: -0.1320,
  deal: { emoji: '🍺', title: 'First drink £4', description: 'Show this screen at the bar', validUntil: '11pm tonight' },
  discount: { percent: 15, type: 'drinks', confirmed: true },
}

const MOCK_VENUES = [MOCK_VENUE, {
  id: 'dev-venue-2', name: 'Monmouth Coffee', emoji: '☕', type: 'Café',
  address: '27 Monmouth St, Covent Garden', lat: 51.5138, lng: -0.1269,
}]

const MOCK_MEET_REQUEST = {
  id: 'dev-meet-req-1', fromUserId: 'dev-u1',
  fromDisplayName: 'Sophie',
  fromPhotoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png',
  sessionId: 'dev-now-1', status: 'pending',
}

const MOCK_MEET_ACCEPTED = {
  id: 'dev-meet-acc-1', sessionId: 'dev-now-1',
  fromUserId: 'dev-u1',
  fromDisplayName: 'Sophie',
  fromPhotoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png',
  status: 'accepted',
}

const MOCK_PROXIMITY_ALERT = {
  venue: MOCK_VENUE, distanceM: 85,
}

const ALL_SESSIONS = [MOCK_SESSION_NOW, MOCK_SESSION_INVITE, MOCK_SESSION_LATER,
  { ...MOCK_SESSION_NOW, id: 'dev-now-2', displayName: 'Emma', age: 25, photoURL: 'https://ik.imagekit.io/nepgaxllc/uk3.png', distanceKm: 0.6 },
]

// ─────────────────────────────────────────────────────────────────────
// GROUPS — the panel menu
// ─────────────────────────────────────────────────────────────────────
const GROUPS = [
  {
    label: 'BANNERS',
    color: '#F5C518',
    items: [
      { id: 'meetRequest',  label: '💌 Meet Request (User B)' },
      { id: 'meetAccepted', label: '✅ Meet Accepted (User A)' },
      { id: 'proximity',    label: '📍 Venue Proximity' },
    ],
  },
  {
    label: 'TOAST',
    color: '#8DC63F',
    items: [
      { id: 'toastSuccess', label: '✅ Toast — Success' },
      { id: 'toastError',   label: '❌ Toast — Error' },
      { id: 'toastInfo',    label: 'ℹ️ Toast — Info' },
    ],
  },
  {
    label: 'PROFILE SLIDERS',
    color: '#8DC63F',
    items: [
      { id: 'profileNow',     label: '🟢 Out Now Profile' },
      { id: 'profileInvite',  label: '💛 Invite Out Profile' },
      { id: 'profileLater',   label: '🟠 Later Out Profile' },
      { id: 'profileNoPhoto', label: '📷 No Photo Profile' },
    ],
  },
  {
    label: 'LIST SHEETS',
    color: '#E8890C',
    items: [
      { id: 'listNow',    label: '🟢 Out Now List' },
      { id: 'listInvite', label: '💛 Invite Out List' },
      { id: 'listLater',  label: '🟠 Later Out List' },
      { id: 'venueList',  label: '🏠 Venue List' },
    ],
  },
  {
    label: 'VENUE',
    color: '#E8890C',
    items: [
      { id: 'venueSheet', label: '🏠 Venue Sheet' },
    ],
  },
  {
    label: 'SESSION / GO LIVE',
    color: '#FF6B6B',
    items: [
      { id: 'goLive',        label: '🔴 Go Live Sheet' },
      { id: 'inviteOut',     label: '💌 Invite Out Sheet' },
      { id: 'rating',        label: '⭐ Rating Sheet' },
      { id: 'stillHere',     label: '⏰ Still Here Prompt' },
      { id: 'mapFilter',     label: '🔍 Map Filter Sheet' },
    ],
  },
  {
    label: 'MODALS',
    color: '#FF6B6B',
    items: [
      { id: 'sos',           label: '🆘 SOS Modal' },
      { id: 'report',        label: '🚩 Report Sheet' },
      { id: 'upgrade',       label: '⭐ Upgrade Sheet' },
    ],
  },
  {
    label: 'VIBE CHECK',
    color: '#8DC63F',
    items: [
      { id: 'vibeCheckSheet',   label: '✨ Vibe Check Sheet' },
      { id: 'vibeBannerNow',    label: '💚 Vibe Banner – Out Now' },
      { id: 'vibeBannerInvite', label: '✨ Vibe Banner – Invite Out' },
      { id: 'vibeBannerLater',  label: '🕐 Vibe Banner – Out Later' },
    ],
  },
  {
    label: 'SCREENS',
    color: '#A78BFA',
    items: [
      { id: 'chat',          label: '💬 Chat Screen' },
      { id: 'match',         label: '❤️ Match Screen' },
      { id: 'notifications', label: '🔔 Notifications Screen' },
      { id: 'likedMe',       label: '👀 Liked Me Screen' },
      { id: 'wallet',        label: '💰 Wallet Screen' },
      { id: 'profile',       label: '👤 Profile Screen' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
const IS_ENABLED = import.meta.env.DEV || localStorage.getItem('dev_panel') === '1'

export default function DevPanel() {
  if (!IS_ENABLED) return null

  const [panelOpen, setPanelOpen]           = useState(false)
  const [active, setActive]                 = useState(null)
  const [toast, setToast]                   = useState(null)
  const [profileSession, setProfileSession] = useState(null)
  const [devPendingConv, setDevPendingConv] = useState(null) // chat opened by accepting

  useEffect(() => {
    document.documentElement.style.setProperty('--dev-panel-width', panelOpen ? '260px' : '0px')
    return () => document.documentElement.style.setProperty('--dev-panel-width', '0px')
  }, [panelOpen])

  const open  = (id) => { setActive(id); setPanelOpen(false) }
  const close = ()   => { setActive(null); setProfileSession(null) }
  const showToast = (message, type = 'info') => setToast({ message, type })

  const trigger = (id) => {
    if (id === 'toastSuccess') { setActive(null); showToast('Session posted successfully!', 'success'); return }
    if (id === 'toastError')   { setActive(null); showToast('Something went wrong. Try again.', 'error');   return }
    if (id === 'toastInfo')    { setActive(null); showToast('Feature available for Pro members.', 'info');   return }
    open(id)
  }

  return (
    <>
      {/* ── Floating toggle ── */}
      <button
        className={styles.toggle}
        onClick={() => setPanelOpen(v => !v)}
        title="Dev Panel"
      >
        {panelOpen ? '✕' : 'DEV'}
      </button>

      {/* ── Side panel ── */}
      {panelOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>DEV PANEL</span>
            <span className={styles.panelSub}>Tap any item to preview</span>
          </div>
          <div className={styles.panelScroll}>
            {GROUPS.map(group => (
              <div key={group.label} className={styles.group}>
                <span className={styles.groupLabel} style={{ color: group.color }}>
                  {group.label}
                </span>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    className={`${styles.item} ${active === item.id ? styles.itemActive : ''}`}
                    onClick={() => trigger(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          PREVIEWS — rendered above everything
      ───────────────────────────────────────── */}

      {/* BANNERS */}
      {active === 'meetRequest' && (
        <div className={styles.bannerWrap}>
          <MeetRequestBanner
            request={MOCK_MEET_REQUEST}
            onAccepted={() => {
              close()
              setDevPendingConv({
                id: `meet-${MOCK_MEET_REQUEST.sessionId}`,
                userId: MOCK_MEET_REQUEST.fromUserId,
                displayName: MOCK_MEET_REQUEST.fromDisplayName,
                photoURL: MOCK_MEET_REQUEST.fromPhotoURL,
                age: MOCK_SESSION_NOW.age,
                area: MOCK_SESSION_NOW.area,
                emoji: '💌',
                online: true,
                status: 'free',
                openedAt: Date.now(),
                lastMessage: null,
                lastMessageTime: Date.now(),
                unread: 0,
                messages: [],
              })
            }}
            onDeclined={close}
            onViewProfile={() => setProfileSession(MOCK_SESSION_NOW)}
          />
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {devPendingConv && (
        <div className={styles.screenOverlay}>
          <ChatScreen
            onClose={() => setDevPendingConv(null)}
            pendingConv={devPendingConv}
          />
        </div>
      )}

      {/* Profile opened by tapping banner avatar */}
      <DiscoveryCard
        open={!!profileSession}
        session={profileSession ?? MOCK_SESSION_NOW}
        mySession={null}
        onClose={() => setProfileSession(null)}
        showToast={showToast}
      />

      {active === 'meetAccepted' && (
        <div className={styles.bannerWrap}>
          <MeetAcceptedBanner
            session={MOCK_MEET_ACCEPTED}
            onTapToChat={() => {
              close()
              setDevPendingConv({
                id: `meet-${MOCK_MEET_ACCEPTED.sessionId}`,
                userId: MOCK_MEET_ACCEPTED.fromUserId,
                displayName: MOCK_MEET_ACCEPTED.fromDisplayName,
                photoURL: MOCK_MEET_ACCEPTED.fromPhotoURL,
                age: MOCK_SESSION_NOW.age,
                area: MOCK_SESSION_NOW.area,
                emoji: '💌',
                online: true,
                status: 'free',
                openedAt: Date.now(),
                lastMessage: null,
                lastMessageTime: Date.now(),
                unread: 0,
                messages: [],
              })
            }}
            onDismiss={close}
          />
        </div>
      )}


      {active === 'proximity' && (
        <div className={styles.bannerWrap}>
          <ProximityBanner
            alert={MOCK_PROXIMITY_ALERT}
            onDismiss={close}
            onTap={close}
          />
        </div>
      )}

      {/* PROFILE SLIDERS */}
      <DiscoveryCard
        open={active === 'profileNow'}
        session={MOCK_SESSION_NOW}
        mySession={null}
        onClose={close}
        showToast={showToast}
      />
      <DiscoveryCard
        open={active === 'profileInvite'}
        session={MOCK_SESSION_INVITE}
        mySession={null}
        onClose={close}
        showToast={showToast}
      />
      <DiscoveryCard
        open={active === 'profileLater'}
        session={MOCK_SESSION_LATER}
        mySession={null}
        onClose={close}
        showToast={showToast}
      />
      <DiscoveryCard
        open={active === 'profileNoPhoto'}
        session={MOCK_SESSION_NO_PHOTO}
        mySession={null}
        onClose={close}
        showToast={showToast}
      />

      {/* LIST SHEETS */}
      <DiscoveryListSheet
        open={active === 'listNow'}
        filter="now"
        sessions={ALL_SESSIONS}
        onClose={close}
        onSelect={(s) => { close(); showToast(`Selected: ${s.displayName}`, 'info') }}
      />
      <DiscoveryListSheet
        open={active === 'listInvite'}
        filter="invite"
        sessions={ALL_SESSIONS}
        onClose={close}
        onSelect={(s) => { close(); showToast(`Selected: ${s.displayName}`, 'info') }}
      />
      <DiscoveryListSheet
        open={active === 'listLater'}
        filter="later"
        sessions={ALL_SESSIONS}
        onClose={close}
        onSelect={(s) => { close(); showToast(`Selected: ${s.displayName}`, 'info') }}
      />
      <VenueListSheet
        open={active === 'venueList'}
        venues={MOCK_VENUES}
        onClose={close}
        onSelectVenue={(v) => { close(); showToast(`Selected: ${v.name}`, 'info') }}
      />

      {/* VENUE */}
      <VenueSheet
        open={active === 'venueSheet'}
        venue={MOCK_VENUE}
        onClose={close}
        onSelectSession={(s) => { close(); showToast(`Session: ${s.displayName}`, 'info') }}
        onOpenChat={close}
        userTier="pro"
        onSpendCoins={(cost) => showToast(`Spent ${cost} coins`, 'success')}
      />

      {/* SESSION / GO LIVE */}
      <GoLiveSheet
        open={active === 'goLive'}
        onClose={close}
        showToast={showToast}
        activeVenues={MOCK_VENUES}
      />
      <InviteOutSheet
        open={active === 'inviteOut'}
        onClose={close}
        onPost={(activity) => { close(); showToast(`Posted: ${activity}`, 'success') }}
        onGoLive={close}
        onGoLater={close}
        currentStatus={null}
      />
      <RatingSheet
        open={active === 'rating'}
        session={MOCK_SESSION_NOW}
        onSubmit={() => { close(); showToast('Rating submitted!', 'success') }}
        onSkip={close}
      />
      <MapFilterSheet
        open={active === 'mapFilter'}
        onClose={close}
        filters={DEFAULT_MAP_FILTERS}
        onChange={() => {}}
        onReset={() => {}}
      />

      {active === 'stillHere' && (
        <div className={styles.fullOverlay}>
          <StillHerePrompt open sessionId={MOCK_SESSION_NOW.id} />
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {/* MODALS */}
      <SOSModal
        open={active === 'sos'}
        onClose={close}
        session={MOCK_SESSION_NOW}
      />
      <ReportSheet
        open={active === 'report'}
        session={MOCK_SESSION_NOW}
        onClose={close}
        showToast={showToast}
      />
      <UpgradeSheet
        open={active === 'upgrade'}
        onClose={close}
        showToast={showToast}
        lookingFor="handmade"
      />

      {/* SCREENS — full screen overlays */}
      {active === 'chat' && (
        <div className={styles.screenOverlay}>
          <ChatScreen onClose={close} />
        </div>
      )}
      {active === 'match' && (
        <div className={styles.screenOverlay}>
          <MatchScreen onClose={close} />
        </div>
      )}
      {active === 'notifications' && (
        <div className={styles.screenOverlay}>
          <NotificationsScreen onClose={close} />
        </div>
      )}
      {active === 'likedMe' && (
        <div className={styles.screenOverlay}>
          <LikedMeScreen onClose={close} />
        </div>
      )}
      {active === 'wallet' && (
        <div className={styles.screenOverlay}>
          <WalletScreen onClose={close} />
        </div>
      )}
      {active === 'profile' && (
        <div className={styles.screenOverlay}>
          <ProfileScreen onClose={close} />
        </div>
      )}

      {/* VIBE CHECK */}
      <VibeCheckSheet
        open={active === 'vibeCheckSheet'}
        sessions={ALL_SESSIONS}
        onClose={close}
        onVibeYes={(s) => showToast(`Vibe sent to ${s.displayName} 💚`, 'success')}
      />

      {active === 'vibeBannerNow' && (
        <div className={styles.bannerWrap}>
          <VibeCheckBanner
            banner={{ status: 'active' }}
            onDismiss={close}
            onView={() => { close(); showToast('Anonymous until they connect back 💚', 'info') }}
          />
        </div>
      )}
      {active === 'vibeBannerInvite' && (
        <div className={styles.bannerWrap}>
          <VibeCheckBanner
            banner={{ status: 'invite_out' }}
            onDismiss={close}
            onView={() => { close(); showToast('Anonymous until they connect back ✨', 'info') }}
          />
        </div>
      )}
      {active === 'vibeBannerLater' && (
        <div className={styles.bannerWrap}>
          <VibeCheckBanner
            banner={{ status: 'scheduled' }}
            onDismiss={close}
            onView={() => { close(); showToast('Anonymous until they connect back 🕐', 'info') }}
          />
        </div>
      )}

      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </>
  )
}
