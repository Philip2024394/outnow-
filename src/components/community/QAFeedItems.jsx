import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './QAFeedScreen.module.css'

export const GRAD_PALETTES = [
  'linear-gradient(160deg,#1a0828 0%,#3d0f52 50%,#1a0015 100%)',
  'linear-gradient(160deg,#0d1f3c 0%,#1e3a6e 50%,#0d1b33 100%)',
  'linear-gradient(160deg,#1a1a0a 0%,#3d3a0a 50%,#1a1a10 100%)',
  'linear-gradient(160deg,#0a1f1a 0%,#0f3d30 50%,#0a1a16 100%)',
  'linear-gradient(160deg,#1f0a0a 0%,#3d1010 50%,#1a0a0a 100%)',
]

export function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Category badge config — covers all profile types
const CATEGORY_BADGE = {
  dating:      { label: '💕 Dating',      cls: 'introBadgeDating'      },
  marketplace: { label: '🛍️ Marketplace', cls: 'introBadgeMarket'      },
  restaurant:  { label: '🍽️ Restaurant',  cls: 'introBadgeRestaurant'  },
  driver:      { label: '🛵 Driver',       cls: 'introBadgeDriver'      },
  community:   { label: '🌍 Community',   cls: 'introBadgeCommunity'   },
}

// ── Share sheet popup ────────────────────────────────────────────────────────
export function ShareSheet({ profile, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${profile.userId}`
    : `https://indoo.id/profile/${profile.userId}`
  const text = `Check out ${profile.displayName}'s live feed on Indoo!`

  const share = (platform) => {
    const enc = encodeURIComponent
    const links = {
      whatsapp:  `https://wa.me/?text=${enc(text + ' ' + url)}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      x:         `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
      tiktok:    null, // no web intent — copy instead
      instagram: null, // no web intent — copy instead
    }
    if (links[platform]) {
      window.open(links[platform], '_blank', 'noopener,noreferrer')
    } else {
      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    }
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200) })
  }

  return createPortal(
    <div className={styles.shareBackdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.shareSheet}>
        <div className={styles.shareHandle} />
        <div className={styles.shareHeader}>
          <div className={styles.shareHeaderInfo}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt={profile.displayName} className={styles.shareAvatar} />
              : <div className={styles.shareAvatarFallback}>{profile.displayName[0]?.toUpperCase()}</div>
            }
            <div>
              <div className={styles.shareTitle}>Share {profile.displayName}'s feed</div>
              <div className={styles.shareUrl}>{url.replace('https://', '')}</div>
            </div>
          </div>
          <button className={styles.shareClose} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.shareGrid}>
          {[
            { id: 'whatsapp',  icon: '💬', label: 'WhatsApp',  color: '#25D366' },
            { id: 'facebook',  icon: '📘', label: 'Facebook',  color: '#1877F2' },
            { id: 'x',         icon: '✕',  label: 'X',         color: '#000'    },
            { id: 'tiktok',    icon: '🎵', label: 'TikTok',    color: '#010101' },
            { id: 'instagram', icon: '📸', label: 'Instagram', color: '#E1306C' },
          ].map(s => (
            <button
              key={s.id}
              className={styles.shareBtn}
              style={{ '--sc': s.color }}
              onClick={() => share(s.id)}
              aria-label={`Share on ${s.label}`}
            >
              <span className={styles.shareBtnIcon}>{s.icon}</span>
              <span className={styles.shareBtnLabel}>{s.label}</span>
            </button>
          ))}
        </div>

        <button className={`${styles.copyLinkBtn} ${copied ? styles.copyLinkBtnDone : ''}`} onClick={copyLink}>
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Link copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Profile intro slide (Indoo Live only) ──────────────────────────────────
export function ProfileIntroSlide({ profile, postCount, category, isOwn, onChat, onShare, bio }) {
  const badge = CATEGORY_BADGE[category] ?? CATEGORY_BADGE.community
  const gradIdx = profile.userId
    ? profile.userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRAD_PALETTES.length
    : 0

  return (
    <div className={styles.introSlide}>
      {profile.photoURL ? (
        <img src={profile.photoURL} alt={profile.displayName} className={styles.introBg} />
      ) : (
        <div className={styles.introBgGrad} style={{ background: GRAD_PALETTES[gradIdx] }} />
      )}
      <div className={styles.introOverlay} />

      {/* Right-side floating actions */}
      {!isOwn && (
        <div className={styles.introActions}>
          {/* Chat button */}
          <button className={styles.introActionBtn} onClick={onChat} aria-label="Open private chat">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className={styles.introActionLabel}>Chat</span>
            <span className={styles.introActionSub}>Free 20 min</span>
          </button>

          {/* Share button */}
          <button className={styles.introActionBtn} onClick={onShare} aria-label="Share profile">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className={styles.introActionLabel}>Share</span>
          </button>
        </div>
      )}

      <div className={styles.introContent}>
        {profile.photoURL && (
          <img src={profile.photoURL} alt={profile.displayName} className={styles.introAvatar} />
        )}
        {isOwn && <span className={styles.introOwnLabel}>Your Feed</span>}
        <div className={styles.introName}>{profile.displayName}</div>
        {bio && <p className={styles.introBio}>{bio.slice(0, 350)}</p>}
        {profile.age && <div className={styles.introMeta}>{profile.age} years old</div>}
        {(profile.city || profile.area) && (
          <div className={styles.introMeta}>📍 {profile.city ?? profile.area}</div>
        )}
        <div className={styles.introStats}>
          <span className={styles.introStatPill}>
            {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : 'New profile'}
          </span>
          <span className={`${styles.introCatBadge} ${styles[badge.cls]}`}>{badge.label}</span>
        </div>
        <div className={styles.introSwipeHint}>
          <span>{isOwn ? 'Your posts are first' : 'Swipe to see their feed'}</span>
          <span className={styles.introArrow}>↓</span>
        </div>
      </div>
    </div>
  )
}

// ── Flash countdown timer ────────────────────────────────────────────────────
function FlashCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()))
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  if (remaining <= 0) return <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>Expired</span>
  const m = Math.floor(remaining / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return <span>{m}:{String(s).padStart(2, '0')}</span>
}

// ── Single post slide ────────────────────────────────────────────────────────
export function PostSlide({ post, index, myUserId, onLike, onDislike, onFlag, onHere, flaggedIds, likedIds, dislikedIds, hereIds, viewerCount }) {
  const [flagConfirm, setFlagConfirm] = useState(false)
  const [likeHearts,  setLikeHearts]  = useState([])
  const isFlagged  = flaggedIds.has(post.userId)
  const isLiked    = likedIds.has(post.id)
  const isDisliked = dislikedIds.has(post.id)
  const isHere     = hereIds.has(post.id)
  const isOwn      = post.userId === myUserId
  const bg         = GRAD_PALETTES[index % GRAD_PALETTES.length]

  function spawnLikeHearts() {
    const batch = Array.from({ length: 7 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 44,
      size: Math.floor(Math.random() * 8) + 10,
      delay: i * 0.07,
    }))
    setLikeHearts(batch)
    setTimeout(() => setLikeHearts([]), 1200)
  }

  return (
    <div className={styles.slide}>
      {post.photoURL ? (
        <img src={post.photoURL} alt="" className={styles.slideBg} />
      ) : (
        <div className={styles.slideBgGrad} style={{ background: bg }} />
      )}
      <div className={styles.slideOverlay} />

      {isFlagged ? (
        <div className={styles.flaggedOverlay}>
          <span>🚩</span>
          <p>This post has been flagged and is under review</p>
        </div>
      ) : (
        <>
          {/* ── Top-left: "I'm here too" (non-own) ── */}
          {!isOwn && (
            <button
              className={`${styles.slideCornerBtn} ${styles.slideCornerTL} ${isHere ? styles.slideCornerHere : ''}`}
              onClick={() => onHere(post.id)}
              aria-label="I'm here too"
            >
              <span className={styles.slideCornerEmoji}>🔥</span>
              <span className={styles.slideCornerCount}>
                {(post.hereCount + (isHere ? 1 : 0)) > 0 ? post.hereCount + (isHere ? 1 : 0) : ''}
              </span>
            </button>
          )}

          {/* ── Top-right: viewer count + flash badge ── */}
          <div className={styles.slideCornerTR}>
            {viewerCount != null && (
              <span className={styles.viewerPill}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {viewerCount}
              </span>
            )}
            {post.isFlash && post.flashExpiresAt && (
              <span className={styles.flashBadge}>⚡ <FlashCountdown expiresAt={post.flashExpiresAt} /></span>
            )}
          </div>

          {/* ── Author + text (centre-bottom) ── */}
          <div className={styles.slideContent}>
            {post.stickerEmoji && (
              <span className={styles.slideSticker}>{post.stickerEmoji}</span>
            )}
            <div className={styles.slideAuthor}>
              {post.photoURL ? (
                <img src={post.photoURL} alt={post.displayName} className={styles.slideAvatarSmall} />
              ) : (
                <div className={styles.slideAvatarInitial}>{(post.displayName ?? '?')[0].toUpperCase()}</div>
              )}
              <div>
                <span className={styles.slideName}>{post.displayName}</span>
                <span className={styles.slideTime}>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <p className={styles.slideQuestion}>{post.text}</p>
          </div>

          {/* ── Bottom-left: Dislike ── */}
          <button
            className={`${styles.slideCornerBtn} ${styles.slideCornerBL} ${isDisliked ? styles.slideCornerDisliked : ''}`}
            onClick={() => onDislike(post.id)}
            aria-label="Dislike"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
            </svg>
            {(post.dislikes + (isDisliked ? 1 : 0)) > 0 && (
              <span className={styles.slideCornerCount}>{post.dislikes + (isDisliked ? 1 : 0)}</span>
            )}
          </button>

          {/* ── Bottom-right: Like ── */}
          <button
            className={`${styles.slideCornerBtn} ${styles.slideCornerBR} ${isLiked ? styles.slideCornerLiked : ''}`}
            onClick={() => { onLike(post.id); spawnLikeHearts() }}
            aria-label="Like"
          >
            {likeHearts.map(h => (
              <span key={h.id} className={styles.likeHeart}
                style={{ '--lh-x': `${h.x}px`, fontSize: `${h.size}px`, animationDelay: `${h.delay}s` }}>❤️</span>
            ))}
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            {(post.likes + (isLiked ? 1 : 0)) > 0 && (
              <span className={styles.slideCornerCount}>{post.likes + (isLiked ? 1 : 0)}</span>
            )}
          </button>

          {/* ── Flag — compact strip above bottom-left ── */}
          {!isOwn && (
            flagConfirm ? (
              <div className={styles.flagConfirm}>
                <span className={styles.flagConfirmQ}>Flag?</span>
                <button className={styles.flagYes} onClick={() => { onFlag(post.userId, post.id); setFlagConfirm(false) }}>Yes</button>
                <button className={styles.flagNo}  onClick={() => setFlagConfirm(false)}>No</button>
              </div>
            ) : (
              <button className={styles.slideFlagBtn} onClick={() => setFlagConfirm(true)} aria-label="Flag post">
                🚩
              </button>
            )
          )}
        </>
      )}
    </div>
  )
}
