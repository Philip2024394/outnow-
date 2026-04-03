import { useEffect, useRef, useState } from 'react'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import { activityEmoji } from '@/firebase/collections'
import styles from './VenueSheet.module.css'


function venueCoinCost(count) {
  if (count <= 3)  return 5
  if (count <= 8)  return 10
  if (count <= 15) return 15
  return 20
}

export default function VenueSheet({ open, venue, onClose, onSelectSession, onOpenChat, userTier, onSpendCoins }) {
  const { show: showDealIntro, dismiss: dismissDealIntro } = useFeatureIntro('venue_deals')
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => { setUnlocked(false) }, [venue?.id])

  const isPremium = userTier === 'pro' || userTier === 'vip'
  const coinCost  = venue ? venueCoinCost(venue.count) : 5
  const isUnlocked = unlocked || isPremium

  const handleUnlock = () => {
    onSpendCoins?.(coinCost)
    setUnlocked(true)
  }

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 120) onClose?.()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  const [codeCopied, setCodeCopied] = useState(false)

  const discountCode = venue?.name
    ? venue.name.replace(/^the\s+/i, '').slice(0, 2).toUpperCase() + '-3637-ION'
    : null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (!open || !venue) return null

  const breakdown = {}
  ;(venue.sessions ?? []).forEach(s => {
    breakdown[s.activityType] = (breakdown[s.activityType] ?? 0) + 1
  })

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.sheet}>
        {/* Green top strip */}
        <div className={styles.greenStrip} />

        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Scrollable content */}
        <div className={styles.content}>

          {venue.deal && showDealIntro && (
            <FeatureIntro
              emoji="🏷️"
              title="Venue Deals"
              bullets={[
                'Partner venues offer exclusive deals to IMOUTNOW users',
                'Just show this screen at the bar or door to claim',
                'Deals are live tonight only — first come, first served',
              ]}
              onDone={dismissDealIntro}
            />
          )}

          {/* Header */}
          <div className={styles.header}>
            <span className={styles.venueEmoji}>{venue.emoji}</span>
            <div className={styles.headerText}>
              <h2 className={styles.venueName}>{venue.name}</h2>
              <span className={styles.venueType}>{venue.type}</span>
            </div>
          </div>

          <p className={styles.address}>📍 {venue.address}</p>

          {/* Live count */}
          <div className={styles.countRow}>
            <span className={styles.countDot} />
            <span className={styles.countText}>
              <strong className={styles.countNum}>{venue.count}</strong>
              {venue.count === 1 ? ' person' : ' people'} out here now
            </span>
          </div>

          {/* Group chat button */}
          <button
            className={styles.chatBtn}
            onClick={() => { onClose?.(); setTimeout(() => onOpenChat?.(), 250) }}
          >
            <span className={styles.chatBtnDot} />
            <span className={styles.chatBtnText}>💬 Join Venue Chat</span>
            <span className={styles.chatBtnSub}>{venue.count} {venue.count === 1 ? 'person' : 'people'} in the room</span>
          </button>

          {/* IMOUTNOW discount banner */}
          {venue.discount?.confirmed && (
            <div className={styles.discountBanner}>
              <div className={styles.discountTop}>
                <div className={styles.discountLeft}>
                  <span className={styles.discountPct}>{venue.discount.percent}% OFF</span>
                  <span className={styles.discountType}>
                    {venue.discount.type === 'all' ? 'Full Menu' : venue.discount.type}
                  </span>
                </div>
                <div className={styles.discountRight}>
                  <span className={styles.discountTag}>🏷️ IMOUTNOW exclusive</span>
                  <span className={styles.discountClaim}>Show this screen to claim</span>
                </div>
              </div>
              <button className={styles.codeRow} onClick={handleCopyCode}>
                <span className={styles.codeLabel}>Your code</span>
                <span className={styles.codeValue}>{discountCode}</span>
                <span className={`${styles.codeCopy} ${codeCopied ? styles.codeCopied : ''}`}>
                  {codeCopied ? '✓ Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          )}

          {/* Deal card */}
          {venue.deal && (
            <div className={styles.dealCard}>
              <div className={styles.dealHeader}>
                <span className={styles.dealEmoji}>{venue.deal.emoji}</span>
                <div className={styles.dealInfo}>
                  <span className={styles.dealTitle}>{venue.deal.title}</span>
                  <span className={styles.dealValid}>Valid until {venue.deal.validUntil}</span>
                </div>
                <span className={styles.dealBadge}>🏷️ Deal</span>
              </div>
              <p className={styles.dealDesc}>{venue.deal.description}</p>
            </div>
          )}

          {/* Activity breakdown */}
          <div className={styles.chips}>
            {Object.entries(breakdown).map(([type, n]) => (
              <span key={type} className={styles.chip}>
                {activityEmoji(type)} {type} {n > 1 ? `×${n}` : ''}
              </span>
            ))}
          </div>

          {/* Who's there — coin gate */}
          <div className={styles.sectionLabel}>Who's here</div>
          {isUnlocked ? (
            <div className={styles.peopleList}>
              {(venue.sessions ?? []).map(s => (
                <button
                  key={s.id}
                  className={styles.personRow}
                  onClick={() => { onSelectSession?.(s); onClose?.() }}
                >
                  <div className={styles.personAvatar}>
                    {s.photoURL
                      ? <img src={s.photoURL} alt={s.displayName} className={styles.personAvatarImg} />
                      : <span className={styles.personAvatarInitial}>{s.displayName?.[0]?.toUpperCase()}</span>
                    }
                    <span className={styles.personOnlineDot} />
                  </div>
                  <span className={styles.personName}>{s.displayName?.split(' ')[0]}</span>
                  <span className={styles.personActivity}>{activityEmoji(s.activityType)}</span>
                  <span className={styles.personArrow}>›</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.venueGate}>
              <div className={styles.venueGateBlur}>
                {(venue.sessions ?? []).slice(0, 3).map(s => (
                  <div key={s.id} className={styles.venueGateRow}>
                    <div className={styles.venueGateAvatar}>
                      {s.displayName?.[0]?.toUpperCase()}
                    </div>
                    <div className={styles.venueGateName}>••••••</div>
                  </div>
                ))}
              </div>
              <div className={styles.venueGateOverlay}>
                <span className={styles.venueGateLock}>🔒</span>
                <p className={styles.venueGateTitle}>See who's inside</p>
                <p className={styles.venueGateSub}>
                  {venue.count} {venue.count === 1 ? 'person' : 'people'} at this venue right now
                </p>
                <button className={styles.venueGateBtn} onClick={handleUnlock}>
                  🪙 {coinCost} Coins — Unlock
                </button>
                {isPremium && (
                  <p className={styles.venueGateFree}>Free for Pro & VIP members</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
