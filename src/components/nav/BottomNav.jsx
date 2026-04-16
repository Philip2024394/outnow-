import { useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
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
  massage:     { icon: '💆', label: 'Join' },
}

export default function BottomNav({ activeTab = 'map', userPhotoURL, userName, isLive = false, isInviteOut = false, onProfileTap, onSOS, onSectionRegister, activeSection = 'default', rideType = 'bike', driverOnline = null, onToggleDriverStatus, onHanggerLive, hanggerLiveActive = false, isGuest = false, onToggleDock, dockVisible = true, onHome }) {
  const onLanding = activeSection !== 'default'
  const holdRef      = useRef(null)
  const frameRef     = useRef(null)
  const startRef     = useRef(null)
  const [holdPct, setHoldPct]     = useState(0)
  const [holding, setHolding]     = useState(false)
  const [toggled, setToggled]     = useState(false)   // flash on complete

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

  return (
    <nav className={styles.nav}>

      {/* Home — always takes user back to home */}
      <button className={`${styles.homeBtn} ${activeTab === 'map' ? styles.homeBtnActive : ''}`} onClick={onHome} aria-label="Home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className={styles.homeBtnLabel}>Home</span>
      </button>

      {/* SOS — hidden on landing pages */}
      {!onLanding && <button className={styles.sosBtn} onClick={onSOS} aria-label="SOS / Safety">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
        </svg>
        <span className={styles.sosBtnLabel}>SOS</span>
      </button>}

      {/* Section register — only shows when in a section, not on home */}
      {activeSection !== 'default' && (() => {
        const btn = SECTION_BTNS[activeSection] || SECTION_BTNS.default
        const isRides = activeSection === 'rides'
        const rideImg = rideType === 'car'
          ? 'https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566'
          : 'https://ik.imagekit.io/nepgaxllc/Sleek%20green%20and%20black%20scooter%20setup.png?updatedAt=1775634845237'
        return (
          <button
            className={styles.sectionBtn}
            onClick={onSectionRegister}
            aria-label={btn.label}
          >
            {isRides ? (
              <img src={rideImg} alt="" className={styles.sectionBtnImg} />
            ) : (
              <span className={styles.sectionBtnIcon}>{btn.icon}</span>
            )}
            <span className={styles.sectionBtnLabel}>{btn.label}</span>
          </button>
        )
      })()}

      {/* Live + Toggle — hidden on landing pages */}
      {!onLanding && <>
        <button
          className={`${styles.liveBtn} ${hanggerLiveActive ? styles.liveBtnActive : ''}`}
          onClick={onHanggerLive}
          aria-label="Hangger Live"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49"/>
            <path d="M7.76 7.76a6 6 0 0 0 0 8.49"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          <span className={styles.liveBtnLabel}>Live</span>
        </button>

        <button
          className={`${styles.dockToggleBtn} ${dockVisible ? styles.dockToggleActive : ''}`}
          onClick={onToggleDock}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {dockVisible ? (
              <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            )}
          </svg>
          <span className={styles.dockToggleLabel}>{dockVisible ? 'Hide' : 'Menu'}</span>
        </button>
      </>}

      {/* Profile — hold 3s to toggle driver online/offline */}
      <button
        ref={holdRef}
        className={[
          styles.avatarTab,
          activeTab === 'profile' ? styles.avatarTabActive : '',
          // Driver glow takes priority over live/invite glow
          driverOnline === true  ? styles.avatarDriverOnline  :
          driverOnline === false ? styles.avatarDriverOffline :
          isLive                 ? styles.avatarLive          :
          isInviteOut            ? styles.avatarInvite        : '',
          toggled     ? styles.avatarToggled : '',
        ].filter(Boolean).join(' ')}
        onClick={() => { if (!holding) onProfileTap?.() }}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        aria-label="My profile — hold to toggle driver status"
        style={{ touchAction: 'none' }}
      >
        {/* Hold progress ring — only shown while holding */}
        {holding && (
          <svg
            className={styles.holdRing}
            viewBox="0 0 44 44"
            width="44" height="44"
          >
            <circle
              cx="22" cy="22" r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2.5"
            />
            <circle
              cx="22" cy="22" r={RING_R}
              fill="none"
              stroke={driverOnline ? '#EF4444' : '#8DC63F'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 22 22)"
            />
          </svg>
        )}

        <Avatar
          src={userPhotoURL ?? 'https://i.pravatar.cc/68?img=12'}
          name={userName ?? 'Me'}
          size={30}
          live={isLive}
          inviteOut={isInviteOut}
        />

        {/* Driver status dot — only for driver accounts */}
        {driverOnline !== null && (
          <span className={`${styles.driverDot} ${driverOnline ? styles.driverDotOnline : styles.driverDotOffline}`} />
        )}

        {activeTab === 'profile' && !holding && (
          <span className={styles.tabLabel}>Me</span>
        )}
        {holding && (
          <span className={styles.holdLabel}>
            {driverOnline ? 'Go Offline' : 'Go Online'}
          </span>
        )}
      </button>

    </nav>
  )
}
