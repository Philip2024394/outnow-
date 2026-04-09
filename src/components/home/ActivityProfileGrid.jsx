import { useState } from 'react'
import { createPortal } from 'react-dom'
import { sendMeetRequest } from '@/services/meetService'
import { useAuth } from '@/hooks/useAuth'
import styles from './ActivityProfileGrid.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen profile browse page — 3 cards per row, tap to open full card
// ─────────────────────────────────────────────────────────────────────────────

function calcAge(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  const diff  = Date.now() - birth.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

const DATING_VALUES = ['marriage', 'dating', 'date_night', 'friendship', 'travel', 'meet_new']

export default function ActivityProfileGrid({ open, activity, sessions = [], onClose, onSelectSession }) {
  const { user } = useAuth()
  const [sentIds,   setSentIds]   = useState(new Set())
  const [loadingId, setLoadingId] = useState(null)

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

  const isDating = DATING_VALUES.includes(activity.label) ||
                   activity.emoji === '💕' ||
                   DATING_VALUES.includes(activity.value)
  const accent   = isDating ? '#E8458C' : '#8DC63F'
  const accentBg = isDating ? 'rgba(232,69,140,0.18)' : 'rgba(141,198,63,0.18)'

  return createPortal(
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header} style={{ borderBottomColor: `${accent}33` }}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.headerText}>
          <span className={styles.headerTitle} style={{ color: accent }}>
            {activity.emoji} {activity.label}
          </span>
          <span className={styles.headerSub}>
            {sessions.length === 0
              ? 'Nobody nearby yet'
              : `${sessions.length} ${sessions.length === 1 ? 'person' : 'people'} nearby`}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {sessions.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyEmoji}>{activity.emoji}</span>
            <p>Nobody nearby for this yet.</p>
            <p className={styles.emptySub}>Check back soon or try another category.</p>
          </div>
        ) : (
          sessions.map(s => {
            const photo   = s.photos?.[0] ?? s.photoURL ?? null
            const age     = calcAge(s.dob)
            const sent    = sentIds.has(s.id)
            const loading = loadingId === s.id

            return (
              <button
                key={s.id}
                className={styles.card}
                onClick={() => onSelectSession(s)}
                aria-label={`View ${s.displayName}'s profile`}
              >
                {/* Photo */}
                <div className={styles.photoWrap}>
                  {photo
                    ? <img src={photo} alt={s.displayName} className={styles.photo} />
                    : <div className={styles.photoPlaceholder}>
                        <span>{(s.displayName ?? '?')[0].toUpperCase()}</span>
                      </div>
                  }

                  {/* Gradient overlay */}
                  <div className={styles.photoGrad} />

                  {/* Name + age pinned to bottom */}
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{s.displayName ?? 'Someone'}</span>
                    {age && <span className={styles.cardAge}>{age}</span>}
                  </div>

                  {/* Handshake / wave button — top right */}
                  <button
                    className={styles.waveBtn}
                    style={sent
                      ? { background: accentBg, borderColor: accent, color: accent }
                      : {}
                    }
                    onClick={(e) => handleWave(e, s)}
                    disabled={sent || !!loadingId}
                    aria-label={sent ? 'Hello sent' : 'Send hello'}
                  >
                    {loading ? (
                      <span className={styles.waveDots}>···</span>
                    ) : sent ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      /* Handshake icon */
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3"/>
                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                      </svg>
                    )}
                  </button>

                  {/* Live dot */}
                  {s.status === 'active' && (
                    <span className={styles.liveDot} style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>,
    document.body
  )
}
