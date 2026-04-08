import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import { lookingForText } from '@/utils/lookingForLabels'
import { formatDistance } from '@/utils/distance'
import ActivityIcon from '@/components/ui/ActivityIcon'
import styles from './DiscoveryListSheet.module.css'

const CONFIG = {
  now:    { label: 'Hanging Out',   badge: styles.badgeNow,    empty: 'Nobody is hanging out nearby right now.' },
  invite: { label: 'Want to Hang',  badge: styles.badgeInvite, empty: 'Nobody is looking to hang out right now.' },
  dating: { label: 'Dating & Romance', badge: styles.badgeDating, empty: 'No dating profiles nearby right now.' },
}

export default function DiscoveryListSheet({ open, filter = 'now', sessions = [], onClose, onSelect }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

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

  if (!open) return null

  const cfg = CONFIG[filter] ?? CONFIG.now
  const themeColor = filter === 'invite' ? '#F5C518' : filter === 'dating' ? '#F472B6' : '#8DC63F'

  const byFilter = sessions.filter(s => {
    if (filter !== 'dating' && s.lookingFor === 'dating') return false
    if (filter === 'now')    return s.status !== 'scheduled' && s.status !== 'invite_out'
    if (filter === 'invite') return s.status === 'invite_out'
    if (filter === 'dating') return s.lookingFor === 'dating'
    return false
  })

  const q = query.trim().toLowerCase()
  const filtered = q.length < 2 ? byFilter : byFilter.filter(s => {
    const name       = (s.displayName ?? '').toLowerCase()
    const area       = (s.city ?? s.area ?? '').toLowerCase()
    const seeking    = lookingForText(s.lookingFor ?? '').toLowerCase()
    const activities = (s.activities ?? [s.activityType])
      .map(id => ACTIVITY_TYPES.find(x => x.id === id)?.label ?? '')
      .join(' ').toLowerCase()
    return name.includes(q) || area.includes(q) || activities.includes(q) || seeking.includes(q)
  })

  return (
    <>
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet} style={{ '--theme-color': themeColor }}>

        <div className={styles.handle} onClick={onClose} />

        <div className={styles.scrollContent}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.inviteHeader}>
                <span className={styles.inviteTitle}>
                  {filter === 'invite' ? 'Want to Hang' : filter === 'dating' ? 'Dating & Romance' : 'Hanging Out'}
                </span>
                <span className={styles.inviteSub}>
                  {filter === 'invite'
                    ? 'Connect and organise where to meet'
                    : filter === 'dating'
                    ? 'People nearby open to dating right now'
                    : 'People hanging out near you right now'}
                </span>
              </div>
            </div>
            <span className={styles.count}>
              {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search by name, activity, area…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query.length > 0 && (
              <button className={styles.searchClear} onClick={() => setQuery('')} aria-label="Clear">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Profile cards */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {q.length >= 2 ? `No results for "${query}"` : cfg.empty}
            </div>
          ) : (
            <div className={styles.list}>
              {filtered.map(s => {
                const isInviteOut = s.status === 'invite_out'
                const activities  = (s.activities ?? [s.activityType]).slice(0, 1)

                return (
                  <button
                    key={s.id}
                    className={styles.card}
                    onClick={() => onSelect?.(s)}
                  >
                    <Avatar
                      src={s.photoURL ?? s.photos?.[0] ?? null}
                      name={s.displayName}
                      size={52}
                      live={filter !== 'dating' && !isInviteOut}
                      inviteOut={filter !== 'dating' && isInviteOut}
                      dating={filter === 'dating'}
                    />
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>
                        {s.displayName ?? 'Someone'}
                        {s.age && <span className={styles.cardAge}>, {s.age}</span>}
                        {s.isGroup && <span className={styles.groupTag}>👥 {s.groupSize}</span>}
                      </div>
                      {s.lookingFor && (
                        <div className={styles.cardSeeking}>{lookingForText(s.lookingFor)}</div>
                      )}
                      <div className={styles.cardArea}>
                        📍 {s.city ?? s.area ?? 'Nearby'}
                        {formatDistance(s.distanceKm) && (
                          <span className={styles.cardDistance}> · {formatDistance(s.distanceKm)}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <div className={styles.cardActivities}>
                        {activities.map(id => {
                          const a = ACTIVITY_TYPES.find(x => x.id === id)
                          return a ? (
                            <span key={id} className={styles.cardActivityPill}>
                              <ActivityIcon activity={a} size={26} />
                              <span className={styles.cardActivityLabel}>{a.label}</span>
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  )
}
