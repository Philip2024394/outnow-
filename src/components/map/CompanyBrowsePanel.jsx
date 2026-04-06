import { useEffect, useRef } from 'react'
import { ACTIVITY_TYPES } from '@/firebase/collections'
// ACTIVITY_TYPES used by resolveIcon only
import styles from './CompanyBrowsePanel.module.css'

const KEYWORD_EMOJI = {
  handbag: '👜', bag: '👜', bags: '👜', purse: '👜', tote: '👜', clutch: '👜',
  shoe: '👟', shoes: '👟', sneaker: '👟', trainer: '👟', boot: '👢',
  jewel: '💍', jewelry: '💍', jewellery: '💍', ring: '💍', necklace: '📿',
  watch: '⌚', watches: '⌚',
  cloth: '👗', clothing: '👗', dress: '👗', shirt: '👕', outfit: '👗',
  hat: '🎩', cap: '🧢', scarf: '🧣',
  fabric: '🧵', textile: '🧵', sew: '🧵', stitch: '🧵',
  candle: '🕯️', soap: '🧴', skincare: '🧴', beauty: '💄', perfume: '🌸',
  cake: '🎂', bread: '🥖', bake: '🎂', pastry: '🥐', cookie: '🍪',
  plant: '🌱', flower: '💐', garden: '🌸',
  wood: '🪵', furniture: '🪑',
  toy: '🧸', kids: '🧸',
  art: '🎨', paint: '🎨', print: '🖨️', photo: '📷',
  book: '📚', stationery: '✏️',
  ceramic: '🏺', pottery: '🏺',
  leather: '🧳', leatherwork: '🧳', wallet: '👛',
  resin: '💎', crystal: '💎', gem: '💎',
}

function resolveIcon(query) {
  if (!query) return null
  const q = query.toLowerCase().trim()
  const byType = ACTIVITY_TYPES.find(a => a.id === q || a.label.toLowerCase() === q || a.id.includes(q) || q.includes(a.id))
  if (byType) return byType.emoji
  for (const [kw, emoji] of Object.entries(KEYWORD_EMOJI)) {
    if (q.includes(kw) || kw.includes(q)) return emoji
  }
  return '🏪'
}

export default function CompanyBrowsePanel({ open, sessions, query, city, countryFlag, onSelect, onClose }) {
  const productIcon = resolveIcon(query)
  const panelRef = useRef(null)

  // Swipe left to close
  const startXRef = useRef(null)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const onTouchStart = e => { startXRef.current = e.touches[0].clientX }
    const onTouchEnd   = e => {
      if (startXRef.current !== null && startXRef.current - e.changedTouches[0].clientX > 60) onClose()
      startXRef.current = null
    }
    panel.addEventListener('touchstart', onTouchStart, { passive: true })
    panel.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      panel.removeEventListener('touchstart', onTouchStart)
      panel.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onClose])

  if (!open) return null

  return (
    <>
    <div className={styles.overlay}>
      <div ref={panelRef} className={styles.panel}>
        {/* Sticky header — query name left, city right */}
        <div className={styles.header}>
          <span className={styles.headerQuery}>{query || 'Makers'}</span>
          {city && (
            <span className={styles.headerCity}>
              {countryFlag && <span className={styles.headerFlag}>{countryFlag}</span>}
              {city}
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>{productIcon ?? '🔍'}</span>
            <p className={styles.emptyText}>No sellers found</p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {sessions.map(s => {
              const initial = (s.brandName ?? s.displayName ?? '?')[0].toUpperCase()
              const statusColor = s.status === 'active' ? '#8DC63F' : s.status === 'invite_out' ? '#F5C518' : '#E8890C'
              const statusLabel = s.status === 'active' ? 'Im Out' : s.status === 'invite_out' ? 'Invite Out' : 'Out Later'
              const dist = s.distanceKm != null ? `${s.distanceKm.toFixed(1)}km` : null

              return (
                <li key={s.id}>
                  <div className={styles.card} role="button" tabIndex={0} style={{ '--status-color': statusColor }} onClick={() => onSelect(s)} onKeyDown={e => e.key === 'Enter' && onSelect(s)}>

                    {/* Full-bleed landscape image */}
                    {(s.photoURL ?? s.photos?.[0])
                      ? <img className={styles.cardImg} src={s.photoURL ?? s.photos?.[0]} alt={s.brandName ?? s.displayName} />
                      : <div className={styles.cardImgFallback}>{initial}</div>
                    }

                    {/* Top-left: distance */}
                    {dist && (
                      <div className={styles.topLeft}>
                        <span className={styles.distBadge}>📍 {dist}</span>
                      </div>
                    )}

                    {/* Top-right: status badge with pulse */}
                    <span className={styles.statusBadge}>
                      <span className={styles.statusPulse} />
                      {statusLabel}
                    </span>

                    {/* Bottom gradient overlay */}
                    <div className={styles.cardFooter}>
                      <div className={styles.cardInfo}>
                        <div className={styles.brandNameRow}>
                          <span className={styles.brandName}>{s.brandName ?? s.displayName}</span>
                          {s.isVerified && (
                            <span className={styles.verifiedBadgeMini} title="Verified Seller">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </span>
                          )}
                        </div>
                        {(s.priceMin || s.priceMax) && (
                          <span className={styles.priceRange}>
                            from {s.priceMin ?? s.priceMax}rp
                          </span>
                        )}
                      </div>{/* cardInfo */}

                      {/* Bottom-right: fingerprint button */}
                      <button className={styles.fpBtn} onClick={e => { e.stopPropagation(); onSelect(s) }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.fpIcon}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                          <path d="M8.5 8.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" />
                          <path d="M6 12c0-3.31 2.69-6 6-6" />
                          <path d="M12 10c1.1 0 2 .9 2 2v4" />
                          <path d="M10 12c0-1.1.9-2 2-2" />
                          <path d="M9 15.5c.5 1.5 2 2.5 3 2.5" />
                          <path d="M18 12c0 3.31-2.69 6-6 6" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {/* Tap outside to close */}
      <div className={styles.backdrop} onClick={onClose} />
    </div>
    </>
  )
}
