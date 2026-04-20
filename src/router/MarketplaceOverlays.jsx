import { Suspense } from 'react'
import { createPortal } from 'react-dom'
import {
  MarketplaceSignUpScreen, AddProductSheet, SellerOrdersScreen,
  SellerWalletScreen, IndooWallet, SellerAnalytics,
  MarketplaceNotificationsScreen, MarketplaceCartScreen,
  BuyerDashboardScreen, UsedGoodsScreen, WantedBoardScreen,
  SellerReviewsScreen, WriteReviewScreen, SellerProductsScreen,
  MarketplaceChatScreen, ProfileScreen,
} from './appShellLazy'
import DriverRegistration from '@/components/driver/DriverRegistration'
import TherapistRegistration from '@/domains/massage/components/TherapistRegistration'

export default function MarketplaceOverlays({
  userProfile, user, rideVehicleType,
  // open states
  driverRegOpen, therapistRegOpen, marketplaceSignUpOpen,
  addProductOpen, sellerOrdersOpen, sellerWalletOpen,
  indooWalletOpen, sellerAnalyticsOpen, marketNotifOpen,
  marketCartOpen, buyerDashOpen, usedGoodsOpen, wantedBoardOpen,
  sellerReviewsOpen, writeReviewOpen, writeReviewOrder,
  sellerProductsOpen, marketChatOpen, marketProfileOpen,
  // setters
  setDriverRegOpen, setTherapistRegOpen, setMarketplaceSignUpOpen,
  setAddProductOpen, setSellerOrdersOpen, setSellerWalletOpen,
  setIndooWalletOpen, setSellerAnalyticsOpen, setMarketNotifOpen,
  setMarketCartOpen, setBuyerDashOpen, setUsedGoodsOpen,
  setWantedBoardOpen, setSellerReviewsOpen, setWriteReviewOpen,
  setWriteReviewOrder, setSellerProductsOpen, setMarketChatOpen,
  setMarketChatContact, setMarketProfileOpen, setSettingsOpen,
  setShopOpen, setMarketplaceLanding, setDockVisible,
}) {
  return (
    <>
      <DriverRegistration open={driverRegOpen} onClose={() => setDriverRegOpen(false)} driverType={rideVehicleType === 'car_taxi' ? 'car' : 'bike'} />
      <TherapistRegistration open={therapistRegOpen} onClose={() => setTherapistRegOpen(false)} />
      <Suspense fallback={null}>
        <MarketplaceSignUpScreen open={marketplaceSignUpOpen} onClose={() => setMarketplaceSignUpOpen(false)} onComplete={({ role }) => {
          setMarketplaceSignUpOpen(false)
          if (userProfile) {
            userProfile.marketplaceSetup = true
            userProfile.marketplaceRole = role
          }
          setShopOpen(true); setMarketplaceLanding(false); setDockVisible(false)
        }} />
      </Suspense>

      <Suspense fallback={null}>
        <AddProductSheet
          open={addProductOpen}
          onClose={() => setAddProductOpen(false)}
          onSaved={() => setAddProductOpen(false)}
          userId={user?.id ?? user?.uid}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SellerOrdersScreen open={sellerOrdersOpen} onClose={() => setSellerOrdersOpen(false)} onOpenChat={() => setMarketChatOpen(true)} />
      </Suspense>

      <Suspense fallback={null}>
        <IndooWallet open={indooWalletOpen} onClose={() => setIndooWalletOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <SellerWalletScreen open={sellerWalletOpen} onClose={() => setSellerWalletOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <SellerAnalytics open={sellerAnalyticsOpen} onClose={() => setSellerAnalyticsOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <MarketplaceNotificationsScreen open={marketNotifOpen} onClose={() => setMarketNotifOpen(false)} onOpenReviews={() => { setMarketNotifOpen(false); setSellerReviewsOpen(true) }} onOpenOrders={() => { setMarketNotifOpen(false); setSellerOrdersOpen(true) }} />
      </Suspense>

      <Suspense fallback={null}>
        <MarketplaceCartScreen open={marketCartOpen} onClose={() => setMarketCartOpen(false)} onWriteReview={(order) => { setWriteReviewOrder(order); setWriteReviewOpen(true) }} />
        <BuyerDashboardScreen open={buyerDashOpen} onClose={() => setBuyerDashOpen(false)} onOpenChat={(c) => { setMarketChatContact(c); setMarketChatOpen(true) }} onWriteReview={(order) => { setWriteReviewOrder(order); setWriteReviewOpen(true) }} />
        <UsedGoodsScreen open={usedGoodsOpen} onClose={() => setUsedGoodsOpen(false)} onOpenChat={(c) => { setMarketChatContact(c); setMarketChatOpen(true) }} onAlerts={() => setMarketNotifOpen(true)} onProfile={() => setMarketProfileOpen(true)} />
        <WantedBoardScreen open={wantedBoardOpen} onClose={() => setWantedBoardOpen(false)} onOpenChat={(c) => { setMarketChatContact(c); setMarketChatOpen(true) }} onAlerts={() => setMarketNotifOpen(true)} onProfile={() => setMarketProfileOpen(true)} />
      </Suspense>

      <Suspense fallback={null}>
        <SellerReviewsScreen open={sellerReviewsOpen} onClose={() => setSellerReviewsOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <WriteReviewScreen open={writeReviewOpen} onClose={() => { setWriteReviewOpen(false); setWriteReviewOrder(null) }} order={writeReviewOrder} />
      </Suspense>

      <Suspense fallback={null}>
        <SellerProductsScreen
          open={sellerProductsOpen}
          onClose={() => setSellerProductsOpen(false)}
          onAddProduct={() => { setAddProductOpen(true) }}
          onEditProduct={(p) => { setAddProductOpen(true) }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <MarketplaceChatScreen open={marketChatOpen} onClose={() => setMarketChatOpen(false)} />
      </Suspense>

      {marketProfileOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9800 }}>
          <Suspense fallback={null}>
            <ProfileScreen onClose={() => setMarketProfileOpen(false)} onOpenSettings={() => { setMarketProfileOpen(false); setSettingsOpen(true) }} />
          </Suspense>
        </div>,
        document.body
      )}
    </>
  )
}
