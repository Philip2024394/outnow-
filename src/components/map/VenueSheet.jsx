import { useEffect, useRef, useState } from 'react'
import styles from './VenueSheet.module.css'

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatHours(hours) {
  if (!hours) return null
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h % 12 || 12
    return `${h12}.${m.toString().padStart(2, '0')}${ampm}`
  }
  return `Time ${fmt(hours.open)} / ${fmt(hours.close)}`
}

export default function VenueSheet({ open, venue, onClose, onOpenChat }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const currentYRef = useRef(0)
  const [proximity, setProximity] = useState(null)
  const [distanceM, setDistanceM] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

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

  useEffect(() => {
    if (!open || !venue) return
    setProximity(null)
    setDistanceM(null)

    // Stable mock distance per venue for demo (0.4km – 4.8km range)
    const mockDist = venue.lat
      ? Math.round(((venue.lat * 1000) % 44 + 4)) * 100
      : 1800

    if (!navigator.geolocation) {
      setDistanceM(mockDist)
      setProximity('far')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, venue.lat, venue.lng)
        const safe = isNaN(dist) ? mockDist : dist
        setDistanceM(safe)
        setProximity(safe <= 100 ? 'near' : 'far')
      },
      () => {
        setDistanceM(mockDist)
        setProximity('far')
      },
      { timeout: 8000, maximumAge: 30000 }
    )
  }, [open, venue])

  const discountCode = venue?.name
    ? venue.name.replace(/^the\s+/i, '').slice(0, 2).toUpperCase() + '-3637-ION'
    : null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (!open || !venue) return null

  const canChat = proximity === 'near'
  const hoursLabel = formatHours(venue.hours)

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.sheet} style={{ '--venue-color': venue.count > 0 ? '#8DC63F' : '#4DA6FF' }}>

        <div className={styles.handle} onClick={onClose} />

        <div className={styles.content}>

          <div className={styles.header}>
            <span className={styles.venueEmoji}>{venue.emoji}</span>
            <div className={styles.headerText}>
              <h2 className={styles.venueName}>{venue.name}</h2>
              <p className={styles.address}>📍 {venue.address}</p>
              {(venue.serves ?? []).length > 0 && (
                <p className={styles.serves}>
                  <span className={styles.servesLabel}>Serves</span>
                  {venue.serves.map((item, i) => (
                    <span key={item}>
                      {i > 0 && <span className={styles.servesDot}> • </span>}
                      {item}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className={styles.countRow}>
            <span className={styles.countDot} />
            <span className={styles.countText}>
              <strong className={styles.countNum}>{venue.count}</strong>
              {venue.count === 1 ? ' Person Here Now' : ' People Here Now'}
            </span>
          </div>

          <button
            className={`${styles.chatBtn} ${!canChat ? styles.chatBtnDisabled : ''}`}
            disabled={!canChat}
            onClick={() => { if (canChat) { onClose?.(); setTimeout(() => onOpenChat?.(), 250) } }}
          >
            {canChat
              ? <span className={styles.chatBtnText}>💬 Join Chat</span>
              : <span className={styles.chatBtnText}>
                  <span className={styles.chatBtnLine1}>💬 Group Chat</span>
                  <span className={styles.chatBtnLine2}>
                    🔒 Activates at Premises
                    {distanceM != null && (
                      <span className={styles.chatBtnDist}>
                        {' · '}
                        {distanceM >= 1000
                          ? `${(distanceM / 1000).toFixed(1)}km away`
                          : `${Math.round(distanceM)}m away`}
                      </span>
                    )}
                  </span>
                </span>
            }
          </button>

          {hoursLabel && (
            <div className={styles.hoursRow}>
              <span className={styles.hoursText}>{hoursLabel}</span>
            </div>
          )}

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
                  <img
                    src="https://ik.imagekit.io/nepgaxllc/Untitledxczxc-removebg-preview.png?updatedAt=1775162044064"
                    alt="IMOUTNOW"
                    className={styles.discountLogo}
                  />
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

        </div>
      </div>
    </div>
  )
}
