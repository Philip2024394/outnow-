import BottomNav from '@/components/nav/BottomNav'
import { supabase } from '@/lib/supabase'

export default function AppShellBottomNav({
  isGuest, triggerGate, dockVisible, shopOpen, marketplaceLanding,
  userProfile, user, categorySessions, activeSection, rideVehicleType,
  activeTab, inviteOut, mySession, newNowCount, newInviteCount,
  dateIdeasOpen, indooLiveOpen, driverOnline, notifCount,
  // callbacks
  setMarketChatOpen, setMarketNotifOpen, setNotifOpen,
  setMarketProfileOpen, setMarketCartOpen, setOrderHistoryOpen,
  setMarketplaceSignUpOpen, setAddProductOpen, setSellerOrdersOpen,
  setSellerAnalyticsOpen, setSellerProductsOpen, setIndooWalletOpen,
  setBuyerDashOpen, setDockVisible, setDriverRegOpen, setShopOpen,
  setMarketplaceLanding, setFoodOpen, setFoodBrowseOpen,
  setDatingIntentOpen, setDatingGridOpen, setDatingOnLanding,
  setMassageOpen, setMassageOnLanding, setRideOpen, setRideOnLanding,
  setActiveSection, setActiveTab, setCompanyPanelOpen,
  setSellerDashOpen, setSellerWalletOpen, setWriteReviewOpen,
  setWriteReviewOrder, setSellerReviewsOpen, setMarketNotifOpenFn,
  setTherapistRegOpen, setDateIdeasOpen, setIndooLiveOpen,
  setSosOpen, setDriverOnline, openDiscoveryList,
}) {
  return (
    <BottomNav
      isGuest={isGuest}
      dockVisible={dockVisible}
      theme={(() => {
        if (!shopOpen) return 'default'
        if (shopOpen && marketplaceLanding) return 'marketplace'
        const role = userProfile?.marketplaceRole || JSON.parse(localStorage.getItem('indoo_profile') || '{}').marketplaceRole
        if (role === 'both') return 'both'
        if (role === 'seller') return 'seller'
        return 'buyer'
      })()}
      onChat={() => { setMarketChatOpen(true) }}
      onAlerts={() => { shopOpen ? setMarketNotifOpen(true) : setNotifOpen(true) }}
      onProfile={() => { setMarketProfileOpen(true) }}
      onCart={() => { shopOpen ? setMarketCartOpen(true) : setOrderHistoryOpen(true) }}
      onSignUp={() => { setMarketplaceSignUpOpen(true) }}
      onAddProduct={() => { setAddProductOpen(true) }}
      onOrders={() => { setSellerOrdersOpen(true) }}
      onAnalytics={() => { setSellerAnalyticsOpen(true) }}
      onMyShop={() => { setSellerProductsOpen(true) }}
      onWallet={() => { setIndooWalletOpen(true) }}
      onDashboard={() => { setBuyerDashOpen(true) }}
      onToggleDock={() => setDockVisible(v => !v)}
      activeSection={activeSection}
      rideType={rideVehicleType === 'car_taxi' ? 'car' : 'bike'}
      onSectionRegister={() => {
        if (isGuest) { triggerGate(); return }
        if (activeSection === 'rides')       { setDriverRegOpen(true) }
        if (activeSection === 'marketplace') { setShopOpen(true); setMarketplaceLanding(true) }
        if (activeSection === 'food')        { setFoodOpen(true) }
        if (activeSection === 'dating')      { setDatingIntentOpen(true) }
        if (activeSection === 'rentals')     { setActiveTab('rentals') }
        if (activeSection === 'massage')     { setTherapistRegOpen(true) }
        if (activeSection === 'default')     { setDriverRegOpen(true) }
      }}
      onHome={() => {
        setSellerOrdersOpen(false)
        setSellerWalletOpen(false)
        setSellerAnalyticsOpen(false)
        setAddProductOpen(false)
        setMarketChatOpen(false)
        setMarketProfileOpen(false)
        setMarketNotifOpen(false)
        setMarketCartOpen(false)
        setSellerReviewsOpen(false)
        setWriteReviewOpen(false)
        setWriteReviewOrder(null)
        setSellerProductsOpen(false)
        setNotifOpen(false)
        setOrderHistoryOpen(false)
        setMarketplaceSignUpOpen(false)
        setSellerDashOpen(false)
        setShopOpen(false)
        setMarketplaceLanding(true)
        setRideOpen(false)
        setRideOnLanding(true)
        setFoodOpen(false)
        setFoodBrowseOpen(false)
        setDatingIntentOpen(false)
        setDatingGridOpen(false)
        setDatingOnLanding(true)
        setMassageOpen(false)
        setMassageOnLanding(true)
        setActiveSection('default')
        setDockVisible(true)
        setActiveTab('map')
      }}
      activeTab={activeTab}
      onChange={(tab) => {
        if (isGuest && tab !== 'map') { triggerGate(); return }
        setActiveTab(tab)
        if (tab === 'map') {
          setDockVisible(true)
          setCompanyPanelOpen(false)
        }
      }}
      unreadChats={0}
      notifCount={notifCount ?? 0}
      userPhotoURL={userProfile?.photoURL ?? null}
      userName={userProfile?.displayName ?? 'You'}
      isLive={!!mySession}
      isInviteOut={!mySession && !!inviteOut}
      onProfileTap={() => { if (isGuest) { triggerGate(); return } setActiveTab('profile') }}
      onDiscoverNow={()    => openDiscoveryList('now')}
      onDiscoverInvite={() => openDiscoveryList('invite')}
      outNowCount={categorySessions.filter(s => s.status !== 'invite_out').length}
      inviteOutCount={categorySessions.filter(s => s.status === 'invite_out').length}
      newNowCount={newNowCount}
      newInviteCount={newInviteCount}
      onDateIdeas={() => setDateIdeasOpen(true)}
      dateIdeasActive={dateIdeasOpen}
      onSOS={() => setSosOpen(true)}
      onIndooLive={() => setIndooLiveOpen(true)}
      indooLiveActive={indooLiveOpen}
      driverOnline={driverOnline}
      onToggleDriverStatus={() => {
        if (driverOnline === null) return
        const next = !driverOnline
        setDriverOnline(next)
        localStorage.setItem('indoo_driver_online', String(next))
        if (supabase && (user?.id ?? user?.uid)) {
          supabase
            .from('profiles')
            .update({ driver_online: next })
            .eq('id', user.id ?? user.uid)
            .then(() => {})
        }
      }}
    />
  )
}
