import { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { ACTIVITY_TYPES } from '@/firebase/collections'
import ActivityIcon from '@/components/ui/ActivityIcon'
import OnMeSheet from './OnMeSheet'
import styles from './DiscoveryListSheet.module.css'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png?updatedAt=1775081066476'

const CONFIG = {
  now:    { label: 'Out Now',    strip: styles.stripNow,    badge: styles.badgeNow,    empty: 'No one is out right now nearby.' },
  invite: { label: 'Invite Out', strip: styles.stripInvite, badge: styles.badgeInvite, empty: 'No one is looking to go out right now.' },
  later:  { label: 'Out Later',  strip: styles.stripLater,  badge: styles.badgeLater,  empty: 'No one has scheduled a session yet.' },
}

export default function DiscoveryListSheet({ open, filter = 'now', sessions = [], onClose, onSelect }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)
  const [pendingSession, setPendingSession] = useState(null)

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

  const filtered = sessions.filter(s => {
    if (filter === 'now')    return s.status !== 'scheduled' && s.status !== 'invite_out'
    if (filter === 'invite') return s.status === 'invite_out'
    if (filter === 'later')  return s.status === 'scheduled'
    return false
  })

  return (
    <>
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={sheetRef} className={styles.sheet}>
        <img src={BG_URL} alt="" className={styles.bgImage} />

        {/* Coloured top strip */}
        <div className={`${styles.strip} ${cfg.strip}`} />
        <div className={styles.handle} />

        <div className={styles.scrollContent}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              {filter === 'invite' ? (
                <div className={styles.inviteHeader}>
                  <span className={styles.inviteTitle}>Invite Out</span>
                  <span className={styles.inviteSub}>Connect And Organise The Place</span>
                </div>
              ) : filter === 'now' ? (
                <div className={styles.inviteHeader}>
                  <span className={styles.inviteTitle}>Out Now</span>
                  <span className={styles.inviteSub}>Connect with people out near you</span>
                </div>
              ) : filter === 'later' ? (
                <div className={styles.inviteHeader}>
                  <span className={styles.inviteTitle}>Out Later</span>
                  <span className={styles.inviteSub}>Plan ahead — see who's going out soon</span>
                </div>
              ) : (
                <>
                  <span className={`${styles.badge} ${cfg.badge}`}>{cfg.label}</span>
                  <span className={styles.count}>{filtered.length} {filtered.length === 1 ? 'person' : 'people'}</span>
                </>
              )}
            </div>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          {/* Profile cards */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>{cfg.empty}</div>
          ) : (
            <div className={styles.list}>
              {filtered.map(s => {
                const isInviteOut  = s.status === 'invite_out'
                const isScheduled  = s.status === 'scheduled'

                const activities = (s.activities ?? [s.activityType]).slice(0, 3)

                return (
                  <button
                    key={s.id}
                    className={styles.card}
                    onClick={() => isInviteOut ? setPendingSession(s) : onSelect?.(s)}
                  >
                    <Avatar
                      src={s.photoURL}
                      name={s.displayName}
                      size={52}
                      live={!isScheduled && !isInviteOut}
                      scheduled={isScheduled}
                      inviteOut={isInviteOut}
                    />
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>
                        {s.displayName ?? 'Someone'}
                        {s.age && <span className={styles.cardAge}>, {s.age}</span>}
                        {s.isGroup && <span className={styles.groupTag}>👥 {s.groupSize}</span>}
                      </div>
                      {s.lookingFor && (
                        <div className={styles.cardSeeking}>{s.lookingFor}</div>
                      )}
                      <div className={styles.cardArea}>
                        📍 {s.city ?? s.area ?? 'Nearby'}
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      {isScheduled && s.scheduledFor && (
                        <span className={styles.cardTime}>
                          {new Date(s.scheduledFor).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                      <div className={styles.cardActivities}>
                        {activities.map(id => {
                          const a = ACTIVITY_TYPES.find(x => x.id === id)
                          return a ? (
                            <span key={id} className={styles.cardActivityPill}>
                              <ActivityIcon activity={a} size={18} />
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

    {pendingSession && (
      <OnMeSheet
        session={pendingSession}
        onSend={({ session, ...meta }) => { setPendingSession(null); onSelect?.(session, meta) }}
        onSkip={session => { setPendingSession(null); onSelect?.(session) }}
        onClose={() => setPendingSession(null)}
      />
    )}
    </>
  )
}
