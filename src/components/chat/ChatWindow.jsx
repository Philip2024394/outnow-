import { useState, useRef, useEffect, useCallback } from 'react'
import { filterMessage, BLOCK_MESSAGES } from '@/utils/contentFilter'
import { useAuth } from '@/hooks/useAuth'
import { UNLOCK_PRICE } from '@/utils/pricing'
import styles from './ChatWindow.module.css'
const CHAT_WINDOW_MS = 10 * 60 * 1000
const URGENT_MS      = 2  * 60 * 1000
const IS_DEMO        = import.meta.env.VITE_DEMO_MODE === 'true'

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function useChatTimer(openedAt) {
  const [msLeft, setMsLeft] = useState(null)
  useEffect(() => {
    if (!openedAt) return
    const tick = () => setMsLeft(Math.max(0, CHAT_WINDOW_MS - (Date.now() - openedAt)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openedAt])
  const expired = msLeft === 0
  const urgent  = msLeft !== null && msLeft > 0 && msLeft <= URGENT_MS
  const mins    = msLeft !== null ? Math.floor(msLeft / 60000) : null
  const secs    = msLeft !== null ? Math.floor((msLeft % 60000) / 1000) : null
  const display = msLeft !== null
    ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : null
  return { display, expired, urgent, msLeft }
}

export default function ChatWindow({ conversation: conv, onBack, onSend, onUnlock }) {
  const { user } = useAuth()
  const [text, setText]           = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [blockedMsg, setBlockedMsg] = useState(null)
  const [liked, setLiked]         = useState({})   // msgId → true
  const messagesEndRef             = useRef(null)

  const { display: timerDisplay, expired, urgent } = useChatTimer(conv.openedAt ?? null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages])

  useEffect(() => {
    if (!blockedMsg) return
    const id = setTimeout(() => setBlockedMsg(null), 3500)
    return () => clearTimeout(id)
  }, [blockedMsg])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || expired) return
    const { blocked, reason } = filterMessage(trimmed)
    if (blocked) { setBlockedMsg(BLOCK_MESSAGES[reason]); return }
    onSend(trimmed)
    setText('')
  }, [text, expired, onSend])

  const handleUnlock = async () => {
    setUnlocking(true)
    if (IS_DEMO) { await new Promise(r => setTimeout(r, 1200)); onUnlock() }
    setUnlocking(false)
  }

  const toggleLike = (msgId) =>
    setLiked(prev => ({ ...prev, [msgId]: !prev[msgId] }))

  const isLocked   = conv.status === 'locked'
  const isPending  = conv.status === 'pending'
  const isFree     = conv.status === 'free'
  const isUnlocked = conv.status === 'unlocked'
  const canType    = (isUnlocked || isFree) && !expired

  const myInitial   = user?.displayName?.[0]?.toUpperCase() ?? 'Me'
  const myPhoto     = user?.photoURL ?? null
  const themInitial = conv.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.window}>

      {/* ── Header (arched, green line) ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className={styles.headerUser}>
          <div className={styles.headerAvatar}>
            {conv.photoURL
              ? <img src={conv.photoURL} alt={conv.displayName} className={styles.headerAvatarImg} />
              : <span className={styles.headerAvatarEmoji}>{conv.emoji}</span>
            }
            {conv.online && <span className={styles.headerOnlineDot} />}
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{conv.displayName}</span>
            <span className={styles.headerAge}>{conv.age ? `${conv.age} yrs` : ''}</span>
          </div>
        </div>

        {timerDisplay && (isUnlocked || isFree) ? (
          <div className={`${styles.timer} ${urgent ? styles.timerUrgent : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className={styles.timerDisplay}>{timerDisplay}</span>
          </div>
        ) : (
          <div style={{ width: 64 }} />
        )}
      </div>

      {/* ── Urgent contact banner ── */}
      {urgent && !expired && (
        <div className={styles.urgentBanner}>
          <span className={styles.urgentIcon}>⚡</span>
          <span>
            Share contact details before this chat closes — <strong>{timerDisplay}</strong> left
          </span>
        </div>
      )}

      {/* ── Regular notice ── */}
      {!urgent && (isUnlocked || isFree) && timerDisplay && !expired && (
        <div className={styles.windowNotice}>
          🟢 10-min chat window — make it count, then meet IRL
        </div>
      )}

      {/* ── Messages ── */}
      <div className={styles.messages}>

        {/* Locked */}
        {isLocked && (
          <div className={styles.lockedOverlay}>
            <div className={styles.blurredMsg}>
              <div className={styles.blurBubble} />
              <div className={styles.blurBubble} style={{ width: '55%' }} />
            </div>
            <div className={styles.lockCard}>
              <span className={styles.lockEmoji}>🔒</span>
              <h3 className={styles.lockTitle}>{conv.displayName} sent you a message</h3>
              <p className={styles.lockSub}>Pay {UNLOCK_PRICE} to read and reply. No numbers shared — meet in person.</p>
              <button className={styles.unlockBtn} onClick={handleUnlock} disabled={unlocking}>
                {unlocking ? 'Processing…' : `Unlock Chat · ${UNLOCK_PRICE}`}
              </button>
              <p className={styles.lockNote}>One-time unlock · 10-minute window</p>
            </div>
          </div>
        )}

        {/* Pending */}
        {isPending && conv.messages.map(msg => (
          <div key={msg.id} className={`${styles.row} ${styles.rowMine}`}>
            <div className={styles.bubbleWrap}>
              <div className={`${styles.bubble} ${styles.bubbleMine}`}>
                <span className={styles.bubbleText}>{msg.text}</span>
                <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
              </div>
              <button className={`${styles.likeBtn} ${liked[msg.id] ? styles.likeBtnActive : ''}`} onClick={() => toggleLike(msg.id)}>
                ❤️
              </button>
            </div>
            <div className={styles.bubbleAvatar}>
              {myPhoto
                ? <img src={myPhoto} alt="Me" className={styles.bubbleAvatarImg} />
                : <span className={styles.bubbleAvatarInitial}>{myInitial}</span>
              }
            </div>
          </div>
        ))}
        {isPending && (
          <div className={styles.pendingNotice}>
            <span>⏳</span>
            <p>Waiting for {conv.displayName} to unlock.</p>
            <p className={styles.pendingSub}>They pay {UNLOCK_PRICE} to read and reply.</p>
          </div>
        )}

        {/* Free — no messages yet */}
        {isFree && conv.messages.length === 0 && (
          <div className={styles.freeNotice}>
            <span className={styles.freeIcon}>💬</span>
            <h3 className={styles.freeTitle}>Your first message is free</h3>
            <p className={styles.freeSub}>Say hi to {conv.displayName}. They pay {UNLOCK_PRICE} to reply — then you both get 10 minutes.</p>
          </div>
        )}

        {/* Unlocked messages */}
        {isUnlocked && conv.messages.map(msg => (
          <div key={msg.id} className={`${styles.row} ${msg.fromMe ? styles.rowMine : styles.rowTheirs}`}>
            {/* Their avatar on left */}
            {!msg.fromMe && (
              <div className={styles.bubbleAvatar}>
                {conv.photoURL
                  ? <img src={conv.photoURL} alt={conv.displayName} className={styles.bubbleAvatarImg} />
                  : <span className={styles.bubbleAvatarInitial}>{themInitial}</span>
                }
              </div>
            )}

            <div className={styles.bubbleWrap}>
              <div className={`${styles.bubble} ${msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs}`}>
                <span className={styles.bubbleText}>{msg.text}</span>
                <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
              </div>
              <button
                className={`${styles.likeBtn} ${liked[msg.id] ? styles.likeBtnActive : ''}`}
                onClick={() => toggleLike(msg.id)}
              >
                ❤️
              </button>
            </div>

            {/* My avatar on right */}
            {msg.fromMe && (
              <div className={styles.bubbleAvatar}>
                {myPhoto
                  ? <img src={myPhoto} alt="Me" className={styles.bubbleAvatarImg} />
                  : <span className={styles.bubbleAvatarInitial}>{myInitial}</span>
                }
              </div>
            )}
          </div>
        ))}

        {/* Expired */}
        {expired && (isUnlocked || isFree) && (
          <div className={styles.expiredCard}>
            <span className={styles.expiredIcon}>🤝</span>
            <h3 className={styles.expiredTitle}>Time's up — go meet them!</h3>
            <p className={styles.expiredSub}>The chat window has closed. If you connected, go say hi in person.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked hint */}
      {blockedMsg && (
        <div className={styles.blockedHint}><span>🚫</span> {blockedMsg}</div>
      )}

      {/* ── Input bar ── */}
      {canType && (
        <div className={styles.inputBar}>
          {/* Flag / report */}
          <button className={styles.flagBtn} aria-label="Report">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </button>

          <input
            className={styles.input}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Message…"
            autoComplete="off"
          />

          <button
            className={`${styles.sendBtn} ${text.trim() ? styles.sendBtnActive : ''}`}
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      )}

      {isLocked && (
        <div className={styles.inputBarDisabled}><span>🔒 Unlock to reply</span></div>
      )}
      {expired && (
        <div className={styles.inputBarDisabled}><span>⏱ Chat window closed — meet in person</span></div>
      )}
    </div>
  )
}
