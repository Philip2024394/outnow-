import { useState, useEffect, useRef } from 'react'
import { signOut } from '@/services/authService'
import { endSession } from '@/services/sessionService'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useMySession } from '@/hooks/useMySession'
import Avatar from '@/components/ui/Avatar'
import PrivacySheet from './PrivacySheet'
import SafetySheet from '@/components/safety/SafetySheet'
import { getSafetyContact } from '@/components/safety/SafetySheet'
import ContactUsPage from '@/components/ui/ContactUsPage'
import SuggestPlaceSheet from './SuggestPlaceSheet'
import VerifiedPage from './VerifiedPage'
import ContactOptionsSheet from './ContactOptionsSheet'
import GiftAddressSheet from '@/components/gifting/GiftAddressSheet'
import styles from './SettingsSheet.module.css'

function Row({ icon, label, sublabel, value, onClick, danger, toggle, toggled }) {
  return (
    <button className={`${styles.row} ${danger ? styles.rowDanger : ''}`} onClick={onClick}>
      <span className={styles.rowIcon}>{icon}</span>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {sublabel && <span className={styles.rowSub}>{sublabel}</span>}
      </div>
      {toggle
        ? <div className={`${styles.toggle} ${toggled ? styles.toggleOn : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
        : value
          ? <span className={styles.rowValue}>{value}</span>
          : <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
      }
    </button>
  )
}

function Divider({ label }) {
  return <div className={styles.divider}>{label && <span className={styles.dividerLabel}>{label}</span>}</div>
}

export default function SettingsSheet({ open, onClose, onOpenLikes, onOpenMyLikes, onEditProfile, onOpenBlockList, onUpgrade, onMySpot, showToast, onSOS, onOpenOrderHistory, onOpenIncomingGifts }) {
  const { permission, requestPermission } = usePushNotifications()
  const { userProfile } = useAuth()
  const { session: mySession } = useMySession()
  const [notifOn, setNotifOn] = useState(permission === 'granted')
  const [signingOut, setSigningOut] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [verifiedOpen, setVerifiedOpen]               = useState(false)
  const [contactOptionsOpen, setContactOptionsOpen]   = useState(false)
  const [contactUsOpen, setContactUsOpen] = useState(false)
  const [giftAddressOpen,    setGiftAddressOpen]      = useState(false)
  const safetyContact = getSafetyContact()
  const drawerRef = useRef(null)
  const startXRef = useRef(null)
  const currentXRef = useRef(0)

  // Swipe right to close
  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return
    const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX }
    const onTouchMove  = (e) => {
      if (startXRef.current === null) return
      const delta = e.touches[0].clientX - startXRef.current
      if (delta > 0) {
        currentXRef.current = delta
        drawer.style.transform = `translateX(${delta}px)`
        drawer.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      drawer.style.transition = ''
      if (currentXRef.current > 100) onClose()
      else drawer.style.transform = ''
      startXRef.current = null
      currentXRef.current = 0
    }
    drawer.addEventListener('touchstart', onTouchStart, { passive: true })
    drawer.addEventListener('touchmove',  onTouchMove,  { passive: true })
    drawer.addEventListener('touchend',   onTouchEnd)
    return () => {
      drawer.removeEventListener('touchstart', onTouchStart)
      drawer.removeEventListener('touchmove',  onTouchMove)
      drawer.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  const handleNotifToggle = async () => {
    if (notifOn) {
      setNotifOn(false)
      showToast?.('Notifications off. You can re-enable in browser settings.')
    } else {
      const result = await requestPermission()
      if (result === 'granted') {
        setNotifOn(true)
        showToast?.('Notifications enabled!', 'success')
      } else {
        showToast?.('Enable notifications in your browser settings.')
      }
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      if (mySession?.id) await endSession(mySession.id)
      await signOut()
      onClose()
    } catch {
      showToast?.('Could not sign out. Try again.', 'error')
    }
    setSigningOut(false)
  }

  if (!open) return null

  return (
    <>
      <div className={styles.wrapper}>
        {/* Backdrop — tap to close */}
        <div className={styles.backdrop} onClick={onClose} />

        {/* Drawer — slides in from right at 70% width */}
        <div ref={drawerRef} className={styles.drawer}>

          {/* Verified sub-page */}
          {verifiedOpen && (
            <VerifiedPage
              onBack={() => setVerifiedOpen(false)}
              isVerified={userProfile?.isVerified ?? false}
            />
          )}

          {/* Contact options sub-page (maker users) */}
          {contactOptionsOpen && (
            <ContactOptionsSheet
              onBack={() => setContactOptionsOpen(false)}
              showToast={showToast}
            />
          )}

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerUser}>
              <Avatar
                src={userProfile?.photoURL}
                name={userProfile?.displayName ?? 'You'}
                size={40}
              />
              <div className={styles.headerMeta}>
                <span className={styles.title}>{userProfile?.displayName ?? 'You'}</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.content}>
            {/* SOS — top of drawer */}
            <button className={styles.sosRow} onClick={() => { onClose(); setTimeout(() => onSOS?.(), 200) }}>
              <span className={styles.sosIcon}>🆘</span>
              <div className={styles.sosText}>
                <span className={styles.sosLabel}>Alert My Contact</span>
                <span className={styles.sosSub}>{safetyContact ? `Sends help alert to ${safetyContact.name}` : 'Set a safety contact first'}</span>
              </div>
              <span className={styles.sosArrow}>›</span>
            </button>

            {/* Upgrade */}
            <button className={styles.upgradeRow} onClick={() => { onClose(); setTimeout(() => onUpgrade?.(), 200) }}>
              <span className={styles.upgradeIcon}>✨</span>
              <div className={styles.upgradeText}>
                <span className={styles.upgradeLabel}>Boost Your Profile</span>
                <span className={styles.upgradeSub}>Show your photo on the map — from £2.99/mo</span>
              </div>
              <span className={styles.upgradeArrow}>›</span>
            </button>

            {/* My Map Spot */}
            <button className={styles.upgradeRow} style={{ borderColor: 'rgba(232,137,12,0.3)' }} onClick={() => { onClose(); setTimeout(() => onMySpot?.(), 200) }}>
              <span className={styles.upgradeIcon}>📍</span>
              <div className={styles.upgradeText}>
                <span className={styles.upgradeLabel} style={{ color: '#E8890C' }}>My Map Spot</span>
                <span className={styles.upgradeSub}>Own your postcode — from $0.99/mo</span>
              </div>
              <span className={styles.upgradeArrow}>›</span>
            </button>

            {/* Verified */}
            <button className={styles.verifiedRow} onClick={() => setVerifiedOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C518" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div className={styles.verifiedRowText}>
                <span className={styles.verifiedRowLabel}>Verified Profile</span>
                <span className={styles.verifiedRowSub}>
                  {userProfile?.isVerified ? 'Active — yellow badge on your card' : 'Get your verified badge — from £2.99/mo'}
                </span>
              </div>
              <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Business — contact options (maker users only) */}
            {['handmade', 'craft_supplies', 'property', 'professional'].includes(userProfile?.lookingFor) && (
              <>
                <Divider label="Business" />
                <Row
                  icon="📲"
                  label="Contact Options"
                  sublabel="Set your direct number and messaging platform"
                  onClick={() => setContactOptionsOpen(true)}
                />
              </>
            )}

            {/* Activity */}
            <Divider label="Activity" />
            <Row
              icon="❤️"
              label="Who Liked Me"
              sublabel="See profiles that liked you this week"
              onClick={() => { onClose(); setTimeout(() => onOpenLikes?.(), 200) }}
            />
            <Row
              icon="🤍"
              label="Liked Profiles"
              sublabel="Profiles you've saved with a heart"
              onClick={() => { onClose(); setTimeout(() => onOpenMyLikes?.(), 200) }}
            />
            <Row
              icon="👤"
              label="Edit Profile"
              sublabel="Update your photo, bio and preferences"
              onClick={() => { onClose(); setTimeout(() => onEditProfile?.(), 200) }}
            />

            {/* Notifications */}
            <Divider label="Notifications" />
            <Row
              icon="🔔"
              label="Push Notifications"
              sublabel={notifOn ? "On — you'll be alerted when someone is out" : 'Off — tap to enable'}
              toggle
              toggled={notifOn}
              onClick={handleNotifToggle}
            />
            <Row
              icon="📅"
              label="Friday Digest"
              sublabel="Weekly summary every Friday at 6pm"
              value="On"
              onClick={() => showToast?.('Friday digest is always on — we\'ll remind you every weekend.')}
            />

            {/* Privacy & Safety */}
            <Divider label="Privacy & Safety" />
            <Row
              icon="🎁"
              label="Gift Delivery Address"
              sublabel="Private address for anonymous gifts — never shown to senders"
              onClick={() => setGiftAddressOpen(true)}
            />
            <Row
              icon="🔒"
              label="Privacy Controls"
              sublabel="Manage what others can see about you"
              onClick={() => setPrivacyOpen(true)}
            />
            <Row
              icon="🛡️"
              label="Safety Check-In"
              sublabel={safetyContact ? `Set — notifying ${safetyContact.name}` : 'Add a trusted contact for when you go out'}
              value={safetyContact ? '✓' : null}
              onClick={() => setSafetyOpen(true)}
            />
            <Row
              icon="🛍️"
              label="My Gifts Sent"
              sublabel="View gifts and food you've sent"
              onClick={() => { onClose(); setTimeout(() => onOpenOrderHistory?.(), 200) }}
            />
            <Row
              icon="🎁"
              label="Incoming Gifts"
              sublabel="Gifts and meals being sent to you"
              onClick={() => { onClose(); setTimeout(() => onOpenIncomingGifts?.(), 200) }}
            />
            <Row
              icon="🚫"
              label="Blocked Users"
              sublabel="Manage people you've blocked"
              onClick={() => { onClose(); setTimeout(() => onOpenBlockList?.(), 200) }}
            />
            <Row
              icon="🛡️"
              label="Safety Centre"
              sublabel="Tips for staying safe while meeting up"
              onClick={() => showToast?.('Always meet in a public place. Trust your instincts.')}
            />

            {/* Community */}
            <Divider label="Community" />
            <Row
              icon="📍"
              label="Suggest a Place"
              sublabel="Know a great spot? Submit it to the map"
              onClick={() => setSuggestOpen(true)}
            />
            {/* Account */}
            <Divider label="Account" />
            <Row
              icon="ℹ️"
              label="About Indoo"
              sublabel="Version 0.1.0 — meet people out near you"
              onClick={() => showToast?.("Indoo v0.1.0 — who's hanging near you?")}
            />
            <Row
              icon="📞"
              label="Contact Us"
              sublabel="Get in touch with the INDOO team"
              onClick={() => setContactUsOpen(true)}
            />
            <Row
              icon="🚪"
              label={signingOut ? 'Signing out…' : 'Sign Out'}
              danger
              onClick={handleSignOut}
            />
          </div>
        </div>
      </div>

      <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <SafetySheet open={safetyOpen} onClose={() => setSafetyOpen(false)} />
      {contactUsOpen && <ContactUsPage onClose={() => setContactUsOpen(false)} />}
      <SuggestPlaceSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} showToast={showToast} />
      <GiftAddressSheet open={giftAddressOpen} onClose={() => setGiftAddressOpen(false)} showToast={showToast} />

    </>
  )
}
