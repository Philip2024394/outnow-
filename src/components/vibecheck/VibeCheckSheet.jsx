import { useState, useEffect } from 'react'
import { useCoins } from '@/hooks/useCoins'
import styles from './VibeCheckSheet.module.css'

const COINS_PER_VOTE     = 2
const COINS_COMPLETE     = 5
const PROFILES_PER_ROUND = 6

function statusLabel(status) {
  if (status === 'invite_out') return { text: 'Invite Out', cls: styles.badgeInvite }
  if (status === 'scheduled')  return { text: 'Out Later',  cls: styles.badgeLater  }
  return                              { text: 'Out Now',    cls: styles.badgeNow    }
}

export default function VibeCheckSheet({ open, sessions = [], onClose, onVibeYes }) {
  const { earnRepeat } = useCoins()
  const [idx, setIdx]           = useState(0)
  const [coinsEarned, setCoins] = useState(0)
  const [yesCount, setYesCount] = useState(0)
  const [done, setDone]         = useState(false)
  const [flash, setFlash]       = useState(null) // 'yes' | 'pass'

  // Reset when opened
  useEffect(() => {
    if (open) { setIdx(0); setCoins(0); setYesCount(0); setDone(false); setFlash(null) }
  }, [open])

  if (!open) return null

  const pool     = sessions.slice(0, PROFILES_PER_ROUND)
  const total    = pool.length
  const current  = pool[idx]
  const progress = total > 0 ? (idx / total) * 100 : 0

  const advance = () => {
    if (idx + 1 >= total) {
      earnRepeat('VIBE_CHECK_COMPLETE')
      setCoins(c => c + COINS_COMPLETE)
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setFlash(null)
    }
  }

  const handleVote = (yes) => {
    setFlash(yes ? 'yes' : 'pass')
    if (yes) {
      setYesCount(c => c + 1)
      setCoins(c => c + COINS_PER_VOTE)
      earnRepeat('VIBE_CHECK_VOTE')
      onVibeYes?.(current)
    }
    setTimeout(advance, 320)
  }

  if (!current && !done) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          <div className={styles.handle} />
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>👀</span>
            <p className={styles.emptyText}>No one nearby to check right now</p>
            <p className={styles.emptySub}>Come back when more people are out</p>
            <button className={styles.doneBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Completion screen ──────────────────────────────────────────────────────
  if (done) return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.completionWrap}>
          <span className={styles.completionIcon}>✨</span>
          <h2 className={styles.completionTitle}>Vibe Check Done!</h2>
          <p className={styles.completionSub}>
            You sent vibes to <strong>{yesCount}</strong> {yesCount === 1 ? 'person' : 'people'} —
            they'll get a heads-up that someone nearby is interested.
          </p>
          <div className={styles.coinsEarned}>
            <span className={styles.coinIcon}>🪙</span>
            <span className={styles.coinAmt}>+{coinsEarned} coins earned</span>
          </div>
          <p className={styles.completionNote}>
            Their identity stays anonymous until they respond with interest
          </p>
          <button className={styles.doneBtn} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )

  // ── Main voting card ───────────────────────────────────────────────────────
  const badge   = statusLabel(current.status)
  const photo   = current.photos?.[0] ?? current.photoURL
  const hasPhoto = !!photo

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>✨ Vibe Check</span>
            <span className={styles.headerSub}>Who would you meet tonight?</span>
          </div>
          <div className={styles.coinPill}>
            <span>🪙</span>
            <span>+{coinsEarned}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>{idx + 1} of {total}</div>

        {/* Profile card */}
        <div className={`${styles.card} ${flash === 'yes' ? styles.cardYes : flash === 'pass' ? styles.cardPass : ''}`}>

          {/* Photo / no-photo */}
          <div className={styles.photoWrap}>
            {hasPhoto
              ? <img src={photo} alt={current.displayName} className={styles.photo} />
              : (
                <div className={styles.noPhoto}>
                  <span className={styles.noPhotoInitial}>
                    {current.displayName?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )
            }
            <div className={styles.photoGradient} />

            {/* Status badge */}
            <span className={`${styles.statusBadge} ${badge.cls}`}>{badge.text}</span>

            {/* Flash overlay */}
            {flash === 'yes'  && <div className={styles.flashYes}>💚 Yes!</div>}
            {flash === 'pass' && <div className={styles.flashPass}>✕ Pass</div>}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.nameLine}>
              <span className={styles.name}>{current.displayName ?? 'Someone'}</span>
              {current.age && <span className={styles.age}>, {current.age}</span>}
            </div>
            <div className={styles.meta}>
              {current.activityType && (
                <span className={styles.metaItem}>
                  {current.activityType === 'drinks'  ? '🍹' :
                   current.activityType === 'food'    ? '🍽️' :
                   current.activityType === 'coffee'  ? '☕' :
                   current.activityType === 'dancing' ? '💃' :
                   current.activityType === 'culture' ? '🎨' : '✨'}
                  {' '}{current.activityType.charAt(0).toUpperCase() + current.activityType.slice(1)}
                </span>
              )}
              {(current.city || current.area) && (
                <span className={styles.metaItem}>📍 {current.city ?? current.area}</span>
              )}
              {current.distanceKm != null && (
                <span className={styles.metaItem}>
                  {current.distanceKm < 1
                    ? `${Math.round(current.distanceKm * 1000)}m away`
                    : `${current.distanceKm.toFixed(1)}km away`}
                </span>
              )}
            </div>
            {current.bio?.trim() && (
              <p className={styles.bio}>{current.bio}</p>
            )}
          </div>
        </div>

        {/* Voting buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.voteBtn} ${styles.passBtn}`}
            onClick={() => handleVote(false)}
            disabled={!!flash}
            aria-label="Pass"
          >
            <span className={styles.voteBtnIcon}>✕</span>
            <span className={styles.voteBtnLabel}>Pass</span>
          </button>
          <button
            className={`${styles.voteBtn} ${styles.yesBtn}`}
            onClick={() => handleVote(true)}
            disabled={!!flash}
            aria-label="Yes"
          >
            <span className={styles.voteBtnIcon}>💚</span>
            <span className={styles.voteBtnLabel}>Yes!</span>
          </button>
        </div>

        <p className={styles.hint}>+{COINS_PER_VOTE} coins per vote · anonymous until mutual</p>
      </div>
    </div>
  )
}
