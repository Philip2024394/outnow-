import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import styles from './ActivityProfileGrid.module.css'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsadfasdf.png'


export default function ActivityProfileGrid({ open, activity, sessions = [], onClose, onSelectSession }) {
  const sheetRef    = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)
  const { user } = useAuth()
  const [sentIds, setSentIds] = useState(new Set())
  const [loadingId, setLoadingId] = useState(null)

  const handleTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
  const handleTouchMove  = (e) => {
    if (startYRef.current === null) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0 && sheetRef.current) {
      currentYRef.current = delta
      sheetRef.current.style.transform = `translateY(${delta}px)`
      sheetRef.current.style.transition = 'none'
    }
  }
  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = ''
      if (currentYRef.current > 100) onClose()
      else sheetRef.current.style.transform = ''
    }
    startYRef.current = null
    currentYRef.current = 0
  }

  const handleWave = async (e, session) => {
    e.stopPropagation()
    if (sentIds.has(session.id) || loadingId) return
    setLoadingId(session.id)
    try {
      if (!session.isSeeded) {
        await sendMeetRequest(
          { id: user?.id, displayName: user?.displayName ?? null, photoURL: user?.photoURL ?? null },
          session.userId,
          session.id
        )
      }
      setSentIds(prev => new Set([...prev, session.id]))
    } catch { /* silent fail */ }
    setLoadingId(null)
  }

  if (!open || !activity) return null

  const isInviteOut = (s) => s.status === 'invite_out'
  const isScheduled = (s) => s.status === 'scheduled'
  const dotColor    = (s) => isInviteOut(s) ? '#F5C518' : isScheduled(s) ? '#E8890C' : '#8DC63F'

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.68),rgba(0,0,0,0.68)),url('${BG_IMG}')` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        <div className={styles.handle} onClick={onClose} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerEmoji}>{activity.emoji}</span>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>{activity.label}</span>
            <span className={styles.headerSub}>
              {sessions.length === 0
                ? 'Nobody nearby for this yet'
                : `${sessions.length} ${sessions.length === 1 ? 'person' : 'people'} nearby`}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {sessions.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji}>{activity.emoji}</span>
              <p>Nobody is up for {activity.label.toLowerCase()} nearby right now.</p>
              <p className={styles.emptySub}>Check back later or try another activity.</p>
            </div>
          ) : (
            sessions.map(s => {
              const photo   = s.photos?.[0] ?? s.photoURL ?? null
              const sent    = sentIds.has(s.id)
              const loading = loadingId === s.id
              const color   = dotColor(s)


              return (
                <div key={s.id} className={styles.card}>
                  {/* Avatar wrap — image + name overlay + wave rim button */}
                  <div className={styles.avatarWrap}>
                    {/* Tap opens profile */}
                    <button
                      className={styles.avatarBtn}
                      onClick={() => onSelectSession(s)}
                      aria-label={`View ${s.displayName}'s profile`}
                    >
                      {photo
                        ? <img src={photo} alt={s.displayName} className={styles.avatarImg} />
                        : <span className={styles.avatarInitial}>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                      }
                      {/* Name overlay at bottom of circle */}
                      <span className={styles.nameOverlay}>{s.displayName ?? 'Someone'}</span>
                    </button>

                    {/* Wave button on the top-right rim */}
                    <button
                      className={`${styles.waveBtn} ${sent ? styles.waveBtnSent : ''}`}
                      onClick={(e) => handleWave(e, s)}
                      disabled={sent || !!loadingId}
                      aria-label={sent ? 'Hello sent' : 'Send hello'}
                    >
                      {loading ? (
                        <span className={styles.waveDots}>···</span>
                      ) : sent ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3"/>
                          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Status pill below avatar */}
                  <span
                    className={styles.statusPill}
                    style={{ color, borderColor: `${color}55`, background: '#000' }}
                  >
                    {isInviteOut(s) ? 'Invite Out' : "I'm Out"}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
