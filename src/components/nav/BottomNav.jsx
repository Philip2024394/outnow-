import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Avatar from '@/components/ui/Avatar'
import ContactUsPage from '@/components/ui/ContactUsPage'
import styles from './BottomNav.module.css'

const RING_R    = 20          // SVG circle radius
const RING_CIRC = 2 * Math.PI * RING_R  // ≈ 125.7
const HOLD_MS   = 3000

const SECTION_BTNS = {
  default:     { icon: '🏍️', label: 'Driver', svgPath: 'M12 8v4l3 3' },
  rides:       { icon: '🏍️', label: 'Driver' },
  marketplace: { icon: '🛍️', label: 'Seller' },
  food:        { icon: '🍽️', label: 'Chef' },
  dating:      { icon: '💕', label: 'Profile' },
  rentals:     { icon: '🚗', label: 'List' },
  massage:     { icon: '💆', label: 'Register' },
}

export default function BottomNav({ activeTab = 'map', userPhotoURL, userName, isLive = false, isInviteOut = false, onProfileTap, onSOS, onSectionRegister, activeSection = 'default', rideType = 'bike', driverOnline = null, onToggleDriverStatus, onIndooLive, indooLiveActive = false, isGuest = false, onToggleDock, dockVisible = true, onHome, theme = 'default', onChat, onAlerts, onProfile, onCart, onSignUp, onAddProduct, onOrders, onAnalytics, onMyShop, onWallet, onDashboard, notifCount = 0 }) {
  const onLanding = activeSection !== 'default'
  const isMarketTheme = theme === 'marketplace' || theme === 'buyer'
  const isSellerTheme = theme === 'seller'
  const isBothTheme = theme === 'both'
  const showBuyerBtns = isMarketTheme || isBothTheme
  const showSellerBtns = isSellerTheme || isBothTheme
  const holdRef      = useRef(null)
  const frameRef     = useRef(null)
  const startRef     = useRef(null)
  const [holdPct, setHoldPct]     = useState(0)
  const [holding, setHolding]     = useState(false)
  const [toggled, setToggled]     = useState(false)   // flash on complete
  const [contactUsOpen, setContactUsOpen] = useState(false)

  const startHold = (e) => {
    // Only trigger hold if this is a driver account
    if (driverOnline === null) return
    e.preventDefault()
    setHolding(true)
    setHoldPct(0)
    startRef.current = Date.now()
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - startRef.current) / HOLD_MS) * 100)
      setHoldPct(pct)
      if (pct < 100) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setHolding(false)
        setHoldPct(0)
        setToggled(true)
        onToggleDriverStatus?.()
        setTimeout(() => setToggled(false), 800)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  const cancelHold = () => {
    cancelAnimationFrame(frameRef.current)
    setHolding(false)
    setHoldPct(0)
  }

  // Derived ring values
  const dashOffset = RING_CIRC - (RING_CIRC * holdPct) / 100

  return createPortal(
    <nav className={`${styles.nav} ${(showBuyerBtns || showSellerBtns) ? styles.navMarket : ''}`}>

      {/* Profile avatar — top of nav */}
      {!showBuyerBtns && !showSellerBtns && (
        <button
          className={`${styles.avatarTab} ${activeTab === 'profile' ? styles.avatarTabActive : ''}`}
          onClick={() => onProfileTap?.()}
          aria-label="My profile"
        >
          <img
            src={(() => { try { const p = JSON.parse(localStorage.getItem('indoo_demo_profile') || '{}'); return p.photo || localStorage.getItem('indoo_user_avatar') || userPhotoURL || 'https://i.pravatar.cc/68?img=12' } catch { return userPhotoURL || 'https://i.pravatar.cc/68?img=12' } })()}
            alt=""
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid #8DC63F' }}
          />
          <span className={styles.tabLabel}>Me</span>
        </button>
      )}

      {/* Home — marketplace/seller only */}
      {(showBuyerBtns || showSellerBtns) && (
        <button className={`${styles.homeBtn} ${styles.homeBtnActive}`} onClick={onHome} aria-label="Home">
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaa-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span className={styles.homeBtnLabel}>Home</span>
        </button>
      )}

      {/* Chat — marketplace theme only */}
      {showBuyerBtns && (
        <button className={styles.marketBtn} onClick={() => { console.log('[NAV] Chat clicked, onChat:', typeof onChat); onChat?.() }} aria-label="Chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className={styles.marketBtnLabel}>Chat</span>
        </button>
      )}

      {/* Alerts — marketplace theme only */}
      {showBuyerBtns && (
        <button className={styles.marketBtn} onClick={() => { console.log('[NAV] Alerts clicked'); onAlerts?.() }} aria-label="Alerts" style={{ position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 100, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid rgba(0,0,0,0.7)', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>{notifCount}</span>
          )}
          <span className={styles.marketBtnLabel}>Alerts</span>
        </button>
      )}

      {/* Cart — marketplace theme only */}
      {showBuyerBtns && (
        <button className={styles.marketBtn} onClick={() => { console.log('[NAV] Cart clicked'); onCart?.() }} aria-label="Cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span className={styles.marketBtnLabel}>Cart</span>
        </button>
      )}

      {/* Dashboard — marketplace buyer */}
      {showBuyerBtns && (
        <button className={styles.marketBtn} onClick={() => { onDashboard?.() }} aria-label="Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span className={styles.marketBtnLabel}>Dashboard</span>
        </button>
      )}

      {/* Create Account — marketplace theme only */}
      {showBuyerBtns && !showSellerBtns && (
        <button className={styles.homeBtn} onClick={() => { console.log('[NAV] SignUp clicked'); onSignUp?.() }} aria-label="Profile">
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaaddd-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span className={styles.homeBtnLabel}>Profile</span>
        </button>
      )}

      {/* ═══ SELLER DASHBOARD NAV ═══ */}
      {showSellerBtns && (
        <>
          <button className={`${styles.homeBtn} ${styles.homeBtnMarketActive}`} onClick={onHome} aria-label="Home">
            <img src="https://ik.imagekit.io/nepgaxllc/Untitledsssaa-removebg-preview.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span className={styles.homeBtnLabel}>Browse</span>
          </button>
          <button className={styles.sellerBtn} onClick={() => { console.log('[NAV] Add clicked'); onAddProduct?.() }} aria-label="Add Product">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className={styles.sellerBtnLabel}>Add</span>
          </button>
          <button className={styles.sellerBtn} onClick={() => { console.log('[NAV] Orders clicked'); onOrders?.() }} aria-label="Orders">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className={styles.sellerBtnLabel}>Orders</span>
          </button>
          <button className={styles.sellerBtn} onClick={() => { console.log('[NAV] Stats clicked'); onAnalytics?.() }} aria-label="Analytics">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span className={styles.sellerBtnLabel}>Stats</span>
          </button>
          <button className={styles.sellerBtn} onClick={() => { console.log('[NAV] Shop clicked'); onMyShop?.() }} aria-label="My Shop">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7"/><path d="M9 22V12h6v10"/>
              <rect x="3" y="9" width="18" height="13" rx="1" fill="none"/>
            </svg>
            <span className={styles.sellerBtnLabel}>Shop</span>
          </button>
          <button className={styles.sellerBtn} onClick={() => { console.log('[NAV] Wallet clicked'); onWallet?.() }} aria-label="Wallet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span className={styles.sellerBtnLabel}>Wallet</span>
          </button>
        </>
      )}


      {/* Compliance & Contact buttons — default theme only */}
      {!showBuyerBtns && !showSellerBtns && (
        <>
          <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <button className={styles.tab} onClick={() => setContactUsOpen(true)} aria-label="Contact">
            <span style={{ fontSize: 16 }}>📞</span>
            <span className={styles.tabLabel}>Contact</span>
          </button>
          <button className={styles.tab} onClick={() => window.open('/privacy', '_blank')} aria-label="Privacy">
            <span style={{ fontSize: 16 }}>🔒</span>
            <span className={styles.tabLabel}>Privacy</span>
          </button>
          <button className={styles.tab} onClick={() => window.open('/terms', '_blank')} aria-label="Terms">
            <span style={{ fontSize: 16 }}>📋</span>
            <span className={styles.tabLabel}>Terms</span>
          </button>
          <button className={styles.tab} onClick={() => window.open('/refund', '_blank')} aria-label="Refund">
            <span style={{ fontSize: 16 }}>💰</span>
            <span className={styles.tabLabel}>Refund</span>
          </button>
        </>
      )}

      {/* Contact Us page overlay */}
      {contactUsOpen && <ContactUsPage onClose={() => setContactUsOpen(false)} />}

    </nav>,
    document.body
  )
}
