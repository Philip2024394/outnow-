import { useState } from 'react'
import { signOut } from '@/services/authService'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import BottomSheet from '@/components/ui/BottomSheet'
import PrivacySheet from './PrivacySheet'
import SafetySheet from '@/components/safety/SafetySheet'
import { getSafetyContact } from '@/components/safety/SafetySheet'
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

export default function SettingsSheet({ open, onClose, onOpenLikes, onEditProfile, onOpenBlockList, showToast }) {
  const { permission, requestPermission } = usePushNotifications()
  const [notifOn, setNotifOn] = useState(permission === 'granted')
  const [signingOut, setSigningOut] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const safetyContact = getSafetyContact()

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
      await signOut()
      onClose()
    } catch {
      showToast?.('Could not sign out. Try again.', 'error')
    }
    setSigningOut(false)
  }

  return (
    <>
    <BottomSheet open={open} onClose={onClose} title="">
      <div className={styles.sheet}>
        {/* Title */}
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
        </div>

        {/* Activity */}
        <Divider label="Activity" />
        <Row
          icon="❤️"
          label="Who Liked Me"
          sublabel="See profiles that liked you this week"
          onClick={() => { onClose(); setTimeout(() => onOpenLikes?.(), 200) }}
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
          sublabel={notifOn ? "On \u2014 you'll be alerted when someone is out" : 'Off \u2014 tap to enable'}
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

        {/* Account */}
        <Divider label="Account" />
        <Row
          icon="💳"
          label="Payment History"
          sublabel="View your unlocked chats"
          onClick={() => showToast?.('Payment history coming soon.')}
        />
        <Row
          icon="ℹ️"
          label="About IMOUTNOW"
          sublabel="Version 0.1.0 — real dating, real life"
          onClick={() => showToast?.('IMOUTNOW v0.1.0 — meet people, not profiles.')}
        />
        <Row
          icon="🚪"
          label={signingOut ? 'Signing out…' : 'Sign Out'}
          danger
          onClick={handleSignOut}
        />
      </div>
    </BottomSheet>
    <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    <SafetySheet open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </>
  )
}
