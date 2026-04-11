/**
 * DEV PANEL — Admin design tool
 * Floating overlay button that opens a panel to preview every popup,
 * banner, sheet, and screen in the app with mock data.
 * Only mounts when import.meta.env.DEV === true (or localStorage dev_panel='1').
 */
import { useState, useEffect } from 'react'

// ── UI ──────────────────────────────────────────────────────────────
import Toast from '@/components/ui/Toast'
import LanguageToast from '@/components/ui/LanguageToast'

// ── Onboarding ───────────────────────────────────────────────────────
import LandingScreen         from '@/screens/LandingScreen'
import JoinSheet             from '@/screens/onboarding/JoinSheet'
import AddToHomeScreenBanner from '@/components/pwa/AddToHomeScreenBanner'
import DateIdeasSheet        from '@/components/dating/DateIdeasSheet'

// ── Modals / Gates ───────────────────────────────────────────────────
import SOSModal    from '@/components/safety/SOSModal'
import ReportSheet from '@/components/moderation/ReportSheet'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import UnlockGate  from '@/components/chat/UnlockGate'

// ── Membership ───────────────────────────────────────────────────────
import MembershipScreen    from '@/components/membership/MembershipScreen'

// ── Food delivery ─────────────────────────────────────────────────────
import DriverSearchSheet      from '@/components/gifting/DriverSearchSheet'
import RestaurantMenuSheet     from '@/components/gifting/RestaurantMenuSheet'
import DriverFoodOrderAlert    from '@/components/driver/DriverFoodOrderAlert'
import FoodOrderStatus         from '@/components/orders/FoodOrderStatus'
import PaymentTransferScreen   from '@/components/orders/PaymentTransferScreen'

// ── Ride bookings ─────────────────────────────────────────────────────
import DriverIncomingBooking   from '@/components/driver/DriverIncomingBooking'

// ── Screens ──────────────────────────────────────────────────────────
import ChatScreen          from '@/screens/ChatScreen'
import ChatWindow          from '@/components/chat/ChatWindow'
import NotificationsScreen from '@/screens/NotificationsScreen'
import LikedMeScreen       from '@/screens/LikedMeScreen'
import ProfileScreen       from '@/screens/ProfileScreen'
import LocationGateScreen  from '@/screens/LocationGateScreen'

import styles from './DevPanel.module.css'

// ─────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: 'dev-u1',
  displayName: 'Sophie',
  age: 27,
  photoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png',
  bio: 'Love a good cocktail bar and terrible karaoke 🎤',
  area: 'Bali',
  city: 'Denpasar',
}

const MOCK_CONV_BASE = {
  id: 'dev-conv-1',
  status: 'active',
  unread: 0,
  isUserA: true,
  messages: [
    { id: 'm1', fromMe: false, text: 'Hey! How are you?', time: Date.now() - 60000 },
    { id: 'm2', fromMe: true,  text: 'Doing great, thanks! You?', time: Date.now() - 30000, read: true },
    { id: 'm3', fromMe: false, text: 'Amazing! Want to meet up?', time: Date.now() - 10000 },
  ],
}

const MOCK_CONVS = {
  dating: { ...MOCK_CONV_BASE, id: 'dev-conv-dating', displayName: 'Sophie', age: 26, area: 'Bali', emoji: '💕', photoURL: 'https://ik.imagekit.io/nepgaxllc/uk1.png' },
  market: { ...MOCK_CONV_BASE, id: 'dev-conv-market', displayName: 'Bali Crafts Co.', area: 'Ubud', emoji: '🛍️', photoURL: null },
  food:   { ...MOCK_CONV_BASE, id: 'dev-conv-food',   displayName: 'Warung Sari', area: 'Seminyak', emoji: '🍽️', photoURL: null },
}

const MOCK_RESTAURANT = {
  id: 'dev-r1',
  name: 'Warung Sari Rasa',
  cuisine_type: 'Javanese',
  rating: 4.8,
  lat: -8.409518, lng: 115.188919,
  menu_items: [
    { id: 'mi1', name: 'Nasi Gudeg Komplit', price: 32000, is_available: true, image: 'https://ik.imagekit.io/nepgaxllc/Traditional%20Javanese%20feast%20on%20banana%20leaves.png' },
    { id: 'mi2', name: 'Soto Ayam Kampung', price: 25000, is_available: true, image: null },
    { id: 'mi3', name: 'Tempe Bacem',       price: 12000, is_available: true, image: null },
    { id: 'mi4', name: 'Es Teh Manis',      price: 8000,  is_available: true, image: null },
    { id: 'mi5', name: 'Bakmi Jawa Goreng', price: 28000, is_available: true, image: null },
    { id: 'mi6', name: 'Klepon',            price: 15000, is_available: false, image: null },
  ],
}


const MOCK_FOOD_ORDER = {
  id: 'dev-order-1',
  cash_ref: 'FD-7X2K',
  status: 'driver_heading',
  restaurant_name: 'Warung Sari Rasa',
  restaurant_id: 'dev-r1',
  restaurant_bank_name: 'BCA',
  restaurant_bank_account: '1234567890',
  restaurant_bank_holder: 'Warung Sari Rasa',
  driver_name: 'Budi Santoso',
  driver_vehicle: 'Honda Vario · Blue',
  driver_plate: 'AB 1234 XY',
  driver_phone: '+6281234567890',
  recipient_name: 'Rina',
  subtotal: 57000,
  delivery_fee: 15000,
  total: 72000,
  payment_deadline: new Date(Date.now() + 8 * 60 * 1000).toISOString(), // 8 min from now
  items: [
    { name: 'Nasi Gudeg Komplit', qty: 1, price: 32000 },
    { name: 'Soto Ayam Kampung',  qty: 1, price: 25000 },
  ],
}

const MOCK_INCOMING_BOOKING = {
  id: 'BOOK_DEV_001',
  pickup_location:  'Jl. Malioboro No. 12, Yogyakarta',
  dropoff_location: 'Prambanan Temple, Sleman',
  fare:             28000,
  distance_km:      4.2,
  created_at:       new Date().toISOString(),
  expires_at:       new Date(Date.now() + 45 * 1000).toISOString(),
  status:           'pending',
  passenger: { display_name: 'Rina Kartika', rating: 4.8, photo_url: null },
}

const MOCK_DRIVER_ORDER = {
  ...MOCK_FOOD_ORDER,
  pickup_code: 'AB3X7K',
  items: MOCK_FOOD_ORDER.items,
}

const MOCK_DRIVER = {
  id: 'dev-driver-1',
  display_name: 'Budi Santoso',
  vehicle_model: 'Honda Vario',
  vehicle_color: 'Blue',
  plate_prefix: 'AB 1234 XY',
  rating: 4.9,
  etaMin: 5,
  total_trips: 1234,
  years_experience: 3,
  acceptance_rate: 98,
  languages: ['id', 'en'],
  photo_url: null,
}

// ─────────────────────────────────────────────────────────────────────
// GROUPS — the panel menu
// ─────────────────────────────────────────────────────────────────────
const GROUPS = [
  {
    label: '⚡ QUICK LINKS',
    color: '#F59E0B',
    items: [
      { id: 'joinPhone',    label: '🔑 Sign In' },
      { id: 'joinProfile',  label: '✏️ Create Account' },
      { id: 'setLocation',  label: '📍 Set Location' },
    ],
  },
  {
    label: 'ONBOARDING',
    color: '#8DC63F',
    items: [
      { id: 'landing',     label: '🏠 Landing Screen' },
      { id: 'joinPhone',   label: '📱 Join — Phone Step' },
      { id: 'joinOtp',     label: '🔐 Join — OTP Step' },
      { id: 'joinProfile', label: '👤 Join — Profile Step' },
      { id: 'langToast',   label: '🌐 Language Toast' },
      { id: 'pwa',         label: '📲 Add to Home Screen' },
      { id: 'dateIdeas',   label: '💕 Date Ideas Drawer' },
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
    label: 'MODALS',
    color: '#FF6B6B',
    items: [
      { id: 'sos',        label: '🆘 SOS Modal' },
      { id: 'report',     label: '🚩 Report Sheet' },
      { id: 'upgrade',    label: '⭐ Upgrade Sheet' },
      { id: 'unlockGate', label: '🔒 Chat Unlock Gate' },
    ],
  },
  {
    label: 'SCREENS',
    color: '#A78BFA',
    items: [
      { id: 'chat',          label: '💬 Chat Screen' },
      { id: 'chat_dating',   label: '💕 Chat — Dating' },
      { id: 'chat_market',   label: '🛍️ Chat — Market' },
      { id: 'chat_food',     label: '🍽️ Chat — Food' },
      { id: 'match',         label: '❤️ Dating / Match Screen' },
      { id: 'notifications', label: '🔔 Notifications Screen' },
      { id: 'likedMe',       label: '👀 Liked Me Screen' },
      { id: 'profile',       label: '👤 Profile Screen' },
    ],
  },
  {
    label: 'FOOD DELIVERY',
    color: '#E8458C',
    items: [
      { id: 'driverSearching',   label: '🔍 Finding Driver — Searching'  },
      { id: 'driverFound',       label: '✅ Finding Driver — Found'      },
      { id: 'restaurantMenu',    label: '🍽️ Restaurant Menu'             },
      { id: 'paymentTransfer',   label: '💳 Payment Transfer Screen'     },
      { id: 'paymentSubmitted',  label: '🧾 Payment Submitted (waiting)' },
      { id: 'driverAlert',       label: '🏍️ Driver Order Alert'          },
      { id: 'foodOrderStatus',   label: '📦 Order Status Card'           },
      { id: 'driverRideIncoming', label: '🔔 Driver — Incoming Ride Request' },
    ],
  },
  {
    label: 'MEMBERSHIP',
    color: '#FF6BA3',
    items: [
      { id: 'membership_dating',     label: '💕 Dating Membership' },
      { id: 'membership_market',     label: '🛍️ Market Membership' },
      { id: 'membership_bike_ride',  label: '🛵 Bike Ride Membership' },
      { id: 'membership_car_ride',   label: '🚗 Car Ride Membership' },
      { id: 'membership_restaurant', label: '🍽️ Restaurant Membership' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
const IS_ENABLED = import.meta.env.DEV || localStorage.getItem('dev_panel') === '1'

export default function DevPanel() {
  if (!IS_ENABLED) return null

  const [panelOpen, setPanelOpen]         = useState(false)
  const [active, setActive]               = useState(null)
  const [toast, setToast]                 = useState(null)
  const [showLangToast, setShowLangToast] = useState(false)
  const [showPWA,      setShowPWA]        = useState(false)
  const [showDateIdeas, setShowDateIdeas] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--dev-panel-width', panelOpen ? '260px' : '0px')
    return () => document.documentElement.style.setProperty('--dev-panel-width', '0px')
  }, [panelOpen])

  const open  = (id) => { setActive(id); setPanelOpen(false) }
  const close = ()   => { setActive(null); setShowLangToast(false); setShowPWA(false); setShowDateIdeas(false) }
  const showToast = (message, type = 'info') => setToast({ message, type })

  const trigger = (id) => {
    if (id === 'toastSuccess') { setActive(null); showToast('Saved successfully!', 'success'); return }
    if (id === 'toastError')   { setActive(null); showToast('Something went wrong. Try again.', 'error'); return }
    if (id === 'toastInfo')    { setActive(null); showToast('Feature available for Pro members.', 'info'); return }
    if (id === 'langToast')   { setShowLangToast(true);  setPanelOpen(false); return }
    if (id === 'pwa')         { setShowPWA(true);        setPanelOpen(false); return }
    if (id === 'dateIdeas')   { setShowDateIdeas(true);  setPanelOpen(false); return }
    if (id === 'setLocation') { open('setLocation');     return }
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
                    className={
                      group.label.includes('QUICK')
                        ? `${styles.quickItem} ${active === item.id ? styles.itemActive : ''}`
                        : `${styles.item} ${active === item.id ? styles.itemActive : ''}`
                    }
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

      {/* ── ONBOARDING ── */}
      {active === 'landing' && (
        <div className={styles.screenOverlay}>
          <LandingScreen
            onGetStarted={() => { close(); showToast('→ Get Started tapped', 'info') }}
            onSignIn={() => { close(); showToast('→ Sign In tapped', 'info') }}
            onBrowse={close}
          />
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      <JoinSheet open={active === 'joinPhone'}   initialStep="phone"   onClose={close} />
      <JoinSheet open={active === 'joinOtp'}     initialStep="otp"     onClose={close} />
      <JoinSheet open={active === 'joinProfile'} initialStep="profile" onClose={close} />

      {showLangToast && (
        <>
          <LanguageToast _forceVisible />
          <button className={styles.devClose} style={{ top: 'auto', bottom: 120 }} onClick={close}>CLOSE</button>
        </>
      )}

      {showPWA && (
        <div className={styles.fullOverlay}>
          <AddToHomeScreenBanner _forceVisible />
          <button className={styles.devClose} onClick={() => { setShowPWA(false); close() }}>CLOSE</button>
        </div>
      )}

      <DateIdeasSheet
        open={false}
        _forceOpen={showDateIdeas}
        onClose={() => { setShowDateIdeas(false); close() }}
      />

      {/* ── MODALS ── */}
      <SOSModal    open={active === 'sos'}    onClose={close} session={MOCK_USER} />
      <ReportSheet open={active === 'report'} session={MOCK_USER} onClose={close} showToast={showToast} />
      <UpgradeSheet
        open={active === 'upgrade'}
        onClose={close}
        showToast={showToast}
        lookingFor="dating"
      />
      {active === 'unlockGate' && (
        <div className={styles.fullOverlay}>
          <UnlockGate
            unlockBalance={2}
            onUnlockWithCredit={() => { close(); showToast('Unlocked with credit!', 'success') }}
            onUnlockWithPlan={(plan) => { close(); showToast(`Subscribed: ${plan}`, 'success') }}
            onDismiss={close}
            expired={false}
          />
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {/* ── SCREENS ── */}
      {active === 'chat' && (
        <div className={styles.screenOverlay}>
          <ChatScreen onClose={close} />
        </div>
      )}
      {active === 'chat_dating' && (
        <div className={styles.screenOverlay}>
          <ChatWindow conversation={MOCK_CONVS.dating} chatTheme="dating" onBack={close} />
        </div>
      )}
      {active === 'chat_market' && (
        <div className={styles.screenOverlay}>
          <ChatWindow conversation={MOCK_CONVS.market} chatTheme="market" onBack={close} />
        </div>
      )}
      {active === 'chat_food' && (
        <div className={styles.screenOverlay}>
          <ChatWindow conversation={MOCK_CONVS.food} chatTheme="food" onBack={close} />
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
      {active === 'setLocation' && (
        <div className={styles.screenOverlay}>
          <LocationGateScreen onConfirmed={() => { close(); showToast('✅ Location confirmed!', 'success') }} />
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}
      {active === 'profile' && (
        <div className={styles.screenOverlay}>
          <ProfileScreen onClose={close} />
        </div>
      )}

      {/* ── FOOD DELIVERY ── */}
      <DriverSearchSheet
        open={active === 'driverSearching'}
        restaurant={MOCK_RESTAURANT}
        items={[{ id: 'mi1', name: 'Nasi Gudeg Komplit', price: 32000, qty: 1 }]}
        deliveryFee={15000}
        comment=""
        onConfirmed={() => { close(); showToast('Order placed! 🏍️', 'success') }}
        onClose={close}
      />
      <DriverSearchSheet
        open={active === 'driverFound'}
        restaurant={MOCK_RESTAURANT}
        items={[{ id: 'mi1', name: 'Nasi Gudeg Komplit', price: 32000, qty: 1 }, { id: 'mi2', name: 'Soto Ayam Kampung', price: 25000, qty: 2 }]}
        deliveryFee={15000}
        comment=""
        _forcePhase="found"
        _forceDriver={MOCK_DRIVER}
        onConfirmed={() => { close(); showToast('Order placed! 🏍️', 'success') }}
        onClose={close}
      />
      <RestaurantMenuSheet
        open={active === 'restaurantMenu'}
        restaurant={MOCK_RESTAURANT}
        onClose={close}
      />
      {active === 'paymentTransfer' && (
        <PaymentTransferScreen
          order={MOCK_FOOD_ORDER}
          onSubmitted={() => { showToast('Screenshot submitted ✓', 'success') }}
          onExpired={() => { close(); showToast('Order expired — time ran out', 'error') }}
        />
      )}
      {active === 'paymentSubmitted' && (
        <PaymentTransferScreen
          order={{ ...MOCK_FOOD_ORDER, status: 'payment_submitted', payment_deadline: new Date(Date.now() + 4 * 60 * 1000).toISOString() }}
          onSubmitted={() => { showToast('Screenshot submitted ✓', 'success') }}
          onExpired={() => { close(); showToast('Order expired — time ran out', 'error') }}
        />
      )}

      {active === 'driverAlert' && (
        <DriverFoodOrderAlert
          order={MOCK_DRIVER_ORDER}
          driverId="dev-driver-1"
          onDismiss={close}
        />
      )}
      {active === 'foodOrderStatus' && (
        <FoodOrderStatus
          order={MOCK_FOOD_ORDER}
          onClose={close}
        />
      )}

      {active === 'driverRideIncoming' && (
        <DriverIncomingBooking
          booking={MOCK_INCOMING_BOOKING}
          driverId="dev-driver-1"
          onAccepted={() => { close(); showToast('Ride accepted ✓', 'success') }}
          onDeclined={() => { close(); showToast('Ride declined', 'error') }}
        />
      )}

      {/* ── MEMBERSHIP ── */}
      {['dating', 'market', 'bike_ride', 'car_ride', 'restaurant'].map(cat => (
        <MembershipScreen
          key={cat}
          category={cat}
          open={active === `membership_${cat}`}
          onClose={close}
        />
      ))}

      {/* Toast */}
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </>
  )
}
