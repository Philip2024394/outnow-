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
import VibeBlasterSheet      from '@/components/dating/VibeBlasterSheet'
import QAFeedScreen          from '@/components/community/QAFeedScreen'

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
import DriverWarningScreen     from '@/components/driver/DriverWarningScreen'

// ── Screens ──────────────────────────────────────────────────────────
import ChatScreen          from '@/screens/ChatScreen'
import ChatWindow          from '@/components/chat/ChatWindow'
import NotificationsScreen from '@/screens/NotificationsScreen'
import LikedMeScreen       from '@/screens/LikedMeScreen'
import ProfileScreen       from '@/screens/ProfileScreen'
import LocationGateScreen  from '@/screens/LocationGateScreen'

// ── Commerce & Chat Checkout ──────────────────────────────────────────
import OrderCard           from '@/components/orders/OrderCard'
import SellerProfileSheet  from '@/components/commerce/SellerProfileSheet'
import BuyerProfileSheet   from '@/components/commerce/BuyerProfileSheet'
import FlashSalePage       from '@/components/commerce/FlashSalePage'
import AuctionPage         from '@/components/commerce/AuctionPage'
import SafeTradeModal      from '@/components/commerce/SafeTradeModal'
import SellerTrustCard     from '@/components/commerce/SellerTrustCard'
import SellerAnalytics     from '@/components/commerce/SellerAnalytics'
import SellerVerification  from '@/components/commerce/SellerVerification'
import ProductReviewPage   from '@/components/commerce/ProductReviewPage'
import MakeOfferSheet      from '@/components/commerce/MakeOfferSheet'
import SectionGateSheet    from '@/components/ui/SectionGateSheet'
import PurchaseHistoryScreen from '@/screens/PurchaseHistoryScreen'
import OrderProcessingOverlay from '@/components/orders/OrderProcessingOverlay'
import ShopSearchScreen    from '@/screens/ShopSearchScreen'
import RestaurantBrowseScreen from '@/screens/RestaurantBrowseScreen'
import RestaurantMenuSheetNew from '@/components/restaurant/RestaurantMenuSheet'

import styles from './DevPanel.module.css'

// ── Commission ───────────────────────────────────────────────────────
import SellerBlockedModal          from '@/components/commerce/SellerBlockedModal'
import DeliveryOptionsSheet        from '@/components/commerce/DeliveryOptionsSheet'
import SellerCommissionScreen      from '@/screens/SellerCommissionScreen'
import RestaurantCommissionScreen  from '@/screens/RestaurantCommissionScreen'

// ── Driver trip & commission flow ────────────────────────────────────
import DriverTripEndSheet          from '@/components/driver/DriverTripEndSheet'
import DriverSignInGate            from '@/components/driver/DriverSignInGate'
import DriverCashFloatModal        from '@/components/driver/DriverCashFloatModal'

// ── Restaurant payment flow ──────────────────────────────────────────
import PaymentMethodSelector       from '@/components/restaurant/PaymentMethodSelector'
import BankTransferChatCard        from '@/components/restaurant/BankTransferChatCard'
import RestaurantOrderAlert        from '@/components/restaurant/RestaurantOrderAlert'
import RestaurantPaymentConfirmSheet from '@/components/restaurant/RestaurantPaymentConfirmSheet'
import RestaurantOrderQRSheet      from '@/components/restaurant/RestaurantOrderQRSheet'

// ── Mock Data & Groups ──────────────────────────────────────────────
import {
  MOCK_USER, MOCK_CONVS, MOCK_RESTAURANT, MOCK_FOOD_ORDER,
  MOCK_INCOMING_BOOKING, MOCK_DRIVER_ORDER, MOCK_DRIVER,
  MOCK_ORDER_CARD_MARKET, MOCK_ORDER_CARD_FOOD,
  MOCK_CONV_ORDER_MARKET, MOCK_CONV_ORDER_FOOD,
  MOCK_SELLER, MOCK_CONV_SELLER_LOCKED, MOCK_CONV_COMMISSION_PENDING,
  MOCK_COMPLETED_BOOKING, MOCK_DRIVER_COMMISSIONS,
  MOCK_REST_ORDER_COD, MOCK_REST_ORDER_BANK, MOCK_BANK_CARD_BASE,
} from './devMockData'
import { GROUPS } from './devPanelGroups'

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
    if (id === 'toast_commission_recorded') { setActive(null); showToast('Commission recorded — Rp 122.500 (10%) due within 72 hours', 'info'); return }
    if (id === 'toast_commission_paid')     { setActive(null); showToast('Commission paid — chat unlocked!', 'success'); return }
    if (id === 'toast_seller_blocked')      { setActive(null); showToast('Account blocked for commission avoidance', 'error'); return }
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
      {active === 'vibeBlaster' && (
        <VibeBlasterSheet open={true} onClose={close} showToast={showToast} />
      )}
      {active === 'qaFeed' && (
        <QAFeedScreen open={true} onClose={close} user={MOCK_USER} userProfile={MOCK_USER} />
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

      {active === 'driverWarningMissed' && (
        <DriverWarningScreen
          driverId="d1"
          warningType="missed"
          onDismiss={() => { close(); showToast('Warning dismissed', 'info') }}
        />
      )}

      {active === 'driverWarningDeclined' && (
        <DriverWarningScreen
          driverId="d1"
          warningType="declined"
          onDismiss={() => { close(); showToast('Warning dismissed', 'info') }}
        />
      )}

      {/* ── CHAT CHECKOUT ── */}
      {active === 'orderCard_market' && (
        <div className={styles.fullOverlay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <OrderCard orderCard={MOCK_ORDER_CARD_MARKET} fromMe={true} onStatusChange={(s) => showToast(`Status → ${s}`, 'info')} />
          </div>
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}
      {active === 'orderCard_food' && (
        <div className={styles.fullOverlay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <OrderCard orderCard={MOCK_ORDER_CARD_FOOD} fromMe={false} onStatusChange={(s) => showToast(`Status → ${s}`, 'info')} />
          </div>
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}
      {active === 'chat_order_market' && (
        <div className={styles.screenOverlay}>
          <ChatWindow conversation={MOCK_CONV_ORDER_MARKET} chatTheme="market" onBack={close} />
        </div>
      )}
      {active === 'chat_order_food' && (
        <div className={styles.screenOverlay}>
          <ChatWindow conversation={MOCK_CONV_ORDER_FOOD} chatTheme="food" onBack={close} />
        </div>
      )}
      {active === 'sellerProfile' && (
        <SellerProfileSheet
          seller={MOCK_SELLER}
          onClose={close}
          onOpenChat={() => showToast('Chat with seller tapped', 'info')}
          onOrderViaChat={(p) => showToast(`Order via chat: ${p.product?.name ?? 'item'}`, 'success')}
          showToast={showToast}
        />
      )}
      {active === 'buyerProfile' && (
        <BuyerProfileSheet open onClose={close} />
      )}
      {active === 'flashSale' && (
        <FlashSalePage open onClose={close} />
      )}
      {active === 'auctionPage' && (
        <AuctionPage open onClose={close} />
      )}
      {active === 'safeTrade' && (
        <SafeTradeModal open onClose={close} product={{ safeTrade: { enabled: true, paypal: true, escrow: true } }} sellerName="Demo Seller" />
      )}
      {active === 'sellerTrust' && (
        <SellerTrustCard open onClose={close} seller={{ ...MOCK_SELLER, ordersFilled: 127, ordersCanceled: 3, avgResponseMinutes: 15, verified: true }} />
      )}
      {active === 'sellerAnalytics' && (
        <SellerAnalytics open onClose={close} />
      )}
      {active === 'sellerVerify' && (
        <SellerVerification open onClose={close} onSubmit={() => showToast('Verification submitted', 'success')} />
      )}
      {active === 'productReviews' && (
        <ProductReviewPage open onClose={close} productName="Demo Product" productId="demo-1" />
      )}
      {active === 'makeOffer' && (
        <MakeOfferSheet open onClose={close} product={{ id: 'demo-1', name: 'Wireless Earbuds Pro', price: 350000 }} onSubmitOffer={() => showToast('Offer sent', 'success')} />
      )}
      {active === 'gateDating' && (
        <SectionGateSheet open section="dating" onClose={close} onComplete={(data) => { showToast('Dating profile set up!', 'success'); close() }} />
      )}
      {active === 'gateMarketplace' && (
        <SectionGateSheet open section="marketplace" onClose={close} onComplete={(data) => { showToast('Marketplace set up!', 'success'); close() }} />
      )}
      {active === 'purchaseHistory' && (
        <PurchaseHistoryScreen onClose={close} />
      )}
      {active === 'orderProcessing' && (
        <OrderProcessingOverlay open sellerName="Demo Seller" onClose={close} />
      )}
      {active === 'shopSearch' && (
        <div className={styles.screenOverlay}>
          <ShopSearchScreen
            onClose={close}
            showToast={showToast}
            onOrderViaChat={(p) => { close(); showToast(`Order: ${p.product?.name ?? 'item'} → chat`, 'success') }}
          />
        </div>
      )}
      {active === 'restaurantBrowse' && (
        <div className={styles.screenOverlay}>
          <RestaurantBrowseScreen
            onClose={close}
            onBackToCategories={close}
            onOrderViaChat={() => { close(); showToast(`Food order → chat`, 'success') }}
          />
        </div>
      )}
      {active === 'restaurantMenuChat' && (
        <RestaurantMenuSheetNew
          open={true}
          restaurant={MOCK_RESTAURANT}
          onClose={close}
          onOrderViaChat={(p) => { close(); showToast(`Food order via chat: ${p.items?.length ?? 0} items`, 'success') }}
        />
      )}

      {/* ── COMMISSION SYSTEM ── */}

      {active === 'seller_commission_screen' && (
        <div className={styles.screenOverlay}>
          <SellerCommissionScreen
            onClose={close}
            onUpgrade={() => { close(); showToast('Opening monthly plan…', 'info') }}
          />
        </div>
      )}

      {active === 'restaurant_commission_screen' && (
        <div className={styles.screenOverlay}>
          <RestaurantCommissionScreen
            onClose={close}
            onUpgrade={() => { close(); showToast('Opening monthly plan…', 'info') }}
          />
        </div>
      )}

      <DeliveryOptionsSheet
        open={active === 'delivery_options_sheet'}
        onClose={close}
        onSaved={(opts) => showToast(`Saved ${opts.length} delivery option${opts.length !== 1 ? 's' : ''}`, 'success')}
      />

      {active === 'commission_banner' && (
        <div className={styles.fullOverlay} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 16, padding: 32 }}>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, margin:0 }}>Commission banner — shown above input bar when seller has unpaid commission</p>
          <div style={{ width:'100%', maxWidth:420, background:'rgba(255,149,0,0.1)', borderTop:'1px solid rgba(255,149,0,0.3)', borderBottom:'1px solid rgba(255,149,0,0.3)', padding:'13px 16px', fontSize:13, fontWeight:700, color:'#FF9500', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <span>💰</span>
            <span>Commission payment pending — pay to reply to buyers</span>
          </div>
          <button className={styles.devClose} style={{ position:'static' }} onClick={close}>CLOSE</button>
        </div>
      )}

      {active === 'chat_seller_locked' && (
        <div className={styles.screenOverlay}>
          <ChatWindow
            conversation={MOCK_CONV_SELLER_LOCKED}
            chatTheme="market"
            role="seller"
            _forceCommissionLocked={true}
            onBack={close}
          />
        </div>
      )}

      {active === 'chat_restaurant_locked' && (
        <div className={styles.screenOverlay}>
          <ChatWindow
            conversation={{ ...MOCK_CONV_ORDER_FOOD, id: 'dev-conv-rest-locked' }}
            chatTheme="food"
            role="seller"
            _forceCommissionLocked={true}
            onBack={close}
          />
        </div>
      )}

      {active === 'chat_commission_pending' && (
        <div className={styles.screenOverlay}>
          <ChatWindow
            conversation={MOCK_CONV_COMMISSION_PENDING}
            chatTheme="market"
            role="seller"
            _forceCommissionLocked={true}
            onBack={close}
          />
        </div>
      )}

      <SellerBlockedModal
        open={active === 'seller_blocked_modal'}
        onPayBalance={() => { close(); showToast('Redirecting to balance payment…', 'info') }}
        onUpgrade={() => { close(); showToast('Opening monthly plan…', 'info') }}
        onClose={close}
      />

      {/* ── DRIVER COMMISSION ── */}

      <DriverTripEndSheet
        open={active === 'driver_trip_end_declare'}
        booking={MOCK_COMPLETED_BOOKING}
        onComplete={(r) => { close(); showToast(`Commission Rp ${Number(r.commission).toLocaleString('id-ID')} recorded ✓`, 'success') }}
        onCancelled={(r) => { close(); showToast(`Cancelled: ${r.reason}`, 'info') }}
      />

      {active === 'driver_trip_end_reason' && (
        <DriverTripEndSheet
          open={true}
          booking={MOCK_COMPLETED_BOOKING}
          _forceStep="cancel_reason"
          onComplete={() => { close(); showToast(`Commission recorded ✓`, 'success') }}
          onCancelled={(r) => { close(); showToast(`Cancelled: ${r.reason}`, 'info') }}
        />
      )}

      {active === 'driver_trip_end_complete' && (
        <DriverTripEndSheet
          open={true}
          booking={MOCK_COMPLETED_BOOKING}
          _forceStep="done"
          _forceDoneOutcome="complete"
          onComplete={() => {}}
          onCancelled={() => {}}
        />
      )}

      <DriverSignInGate
        open={active === 'driver_sign_in_gate'}
        driverName="Budi Santoso"
        commissions={MOCK_DRIVER_COMMISSIONS}
        onProofSubmitted={() => { showToast('Proof submitted — awaiting admin verification', 'info'); close() }}
      />

      {active === 'driver_sign_in_submitted' && (
        <DriverSignInGate
          open={true}
          driverName="Budi Santoso"
          commissions={MOCK_DRIVER_COMMISSIONS}
          _forceSubmitted
          onProofSubmitted={() => {}}
          onClose={close}
        />
      )}

      {active === 'driver_cash_float' && (
        <DriverCashFloatModal
          driverName="Budi Santoso"
          onConfirm={(amount) => { close(); showToast(amount > 0 ? `Float Rp ${Number(amount).toLocaleString('id-ID')} saved — going online` : 'No cash — COD orders skipped', 'success') }}
        />
      )}

      {active === 'driver_cash_float_filled' && (
        <DriverCashFloatModal
          driverName="Budi Santoso"
          _forceAmount={150000}
          onConfirm={(amount) => { close(); showToast(`Float Rp ${Number(amount).toLocaleString('id-ID')} saved`, 'success') }}
        />
      )}

      {/* ── RESTAURANT PAYMENT FLOW ── */}

      <PaymentMethodSelector
        open={active === 'payment_method_selector'}
        total={66000}
        onConfirm={(p) => { close(); showToast(`${p.paymentMethod} · ${p.finalTotal}`, 'info') }}
        onClose={close}
      />

      {active === 'bank_transfer_card_awaiting' && (
        <div className={styles.fullOverlay} style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ width:'100%', maxWidth:420 }}>
            <BankTransferChatCard
              card={{ ...MOCK_BANK_CARD_BASE, state: 'awaiting_proof' }}
              fromMe={true}
              onProofUploaded={() => showToast('Proof uploaded ✓', 'success')}
            />
          </div>
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {active === 'bank_transfer_card_uploaded' && (
        <div className={styles.fullOverlay} style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ width:'100%', maxWidth:420 }}>
            <BankTransferChatCard
              card={{ ...MOCK_BANK_CARD_BASE, state: 'proof_uploaded' }}
              fromMe={true}
            />
          </div>
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {active === 'bank_transfer_card_confirmed' && (
        <div className={styles.fullOverlay} style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ width:'100%', maxWidth:420 }}>
            <BankTransferChatCard
              card={{ ...MOCK_BANK_CARD_BASE, state: 'confirmed' }}
              fromMe={true}
            />
          </div>
          <button className={styles.devClose} onClick={close}>CLOSE</button>
        </div>
      )}

      {active === 'restaurant_order_alert_cod' && (
        <div className={styles.screenOverlay}>
          <RestaurantOrderAlert
            order={MOCK_REST_ORDER_COD}
            onAccept={() => { close(); showToast('Order accepted ✓', 'success') }}
            onDecline={() => { close(); showToast('Order declined', 'error') }}
          />
        </div>
      )}

      {active === 'restaurant_order_alert_bank' && (
        <div className={styles.screenOverlay}>
          <RestaurantOrderAlert
            order={MOCK_REST_ORDER_BANK}
            onAccept={() => { close(); showToast('Order accepted ✓', 'success') }}
            onDecline={() => { close(); showToast('Order declined', 'error') }}
          />
        </div>
      )}

      <RestaurantPaymentConfirmSheet
        open={active === 'restaurant_payment_confirm'}
        order={{ ...MOCK_REST_ORDER_BANK, proofUrl: null }}
        onConfirm={() => { close(); showToast('Payment confirmed · 10% commission recorded', 'success') }}
        onDispute={(d) => { close(); showToast(`Dispute submitted: ${d.note}`, 'error') }}
        onClose={close}
      />

      <RestaurantOrderQRSheet
        open={active === 'restaurant_qr_sheet'}
        order={{ ...MOCK_REST_ORDER_COD, driverId: 'dev-driver-1' }}
        onScanned={() => showToast('QR scanned · commission recorded ✓', 'success')}
        onClose={close}
      />

      <RestaurantOrderQRSheet
        open={active === 'restaurant_qr_sheet_scanned'}
        order={{ ...MOCK_REST_ORDER_COD, driverId: 'dev-driver-1' }}
        onScanned={() => showToast('QR scanned · commission recorded ✓', 'success')}
        onClose={close}
        _forceScanned
      />

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
