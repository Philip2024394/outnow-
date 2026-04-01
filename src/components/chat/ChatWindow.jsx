import { useState, useRef, useEffect, useCallback } from 'react'
import { filterMessage, BLOCK_MESSAGES } from '@/utils/contentFilter'
import styles from './ChatWindow.module.css'

const UNLOCK_PRICE = '$0.99'
const CHAT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function useChatTimer(openedAt) {
  const [msLeft, setMsLeft] = useState(null)

  useEffect(() => {
    if (!openedAt) return
    const tick = () => {
      const left = Math.max(0, CHAT_WINDOW_MS - (Date.now() - openedAt))
      setMsLeft(left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [openedAt])

  const expired = msLeft === 0
  const mins = msLeft !== null ? Math.floor(msLeft / 60000) : null
  const secs = msLeft !== null ? Math.floor((msLeft % 60000) / 1000) : null
  const display = msLeft !== null
    ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : null
  const urgent = msLeft !== null && msLeft < 120000 // last 2 mins

  return { display, expired, urgent }
}

export default function ChatWindow({ conversation: conv, onBack, onSend, onUnlock }) {
  const [text, setText] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [blockedMsg, setBlockedMsg] = useState(null)
  const messagesEndRef = useRef(null)

  const { display: timerDisplay, expired, urgent } = useChatTimer(conv.openedAt ?? null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages])

  // Clear blocked message hint after 3s
  useEffect(() => {
    if (!blockedMsg) return
    const id = setTimeout(() => setBlockedMsg(null), 3500)
    return () => clearTimeout(id)
  }, [blockedMsg])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || expired) return

    const { blocked, reason } = filterMessage(trimmed)
    if (blocked) {
      setBlockedMsg(BLOCK_MESSAGES[reason])
      return
    }

    onSend(trimmed)
    setText('')
  }, [text, expired, onSend])

  const handleUnlock = async () => {
    setUnlocking(true)
    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 1200))
      onUnlock()
    }
    setUnlocking(false)
  }

  const isLocked   = conv.status === 'locked'
  const isPending  = conv.status === 'pending'
  const isFree     = conv.status === 'free'
  const isUnlocked = conv.status === 'unlocked'
  const canType    = (isUnlocked || isFree) && !expired

  return (
    <div className={styles.window}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className={styles.headerUser}>
          <div className={styles.headerAvatar}>
            {conv.photoURL
              ? <img src={conv.photoURL} alt={conv.displayName} className={styles.headerAvatarImg} />
              : <span>{conv.emoji}</span>
            }
            {conv.online && <span className={styles.onlineDot} />}
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{conv.displayName}</span>
            <span className={styles.headerStatus}>{conv.online ? 'Online now' : 'Offline'}</span>
          </div>
        </div>

        {/* 10-min countdown — only show when chat is active */}
        {timerDisplay && (isUnlocked || isFree) && (
          <div className={[styles.timer, urgent ? styles.timerUrgent : ''].join(' ')}>
            <span className={styles.timerIcon}>⏱</span>
            <span className={styles.timerDisplay}>{timerDisplay}</span>
          </div>
        )}
        {!(timerDisplay && (isUnlocked || isFree)) && <div style={{ width: 60 }} />}
      </div>

      {/* Chat window notice */}
      {(isUnlocked || isFree) && timerDisplay && !expired && (
        <div className={[styles.windowNotice, urgent ? styles.windowNoticeUrgent : ''].join(' ')}>
          {urgent
            ? "Almost out of time — swap numbers in person! 🏃"
            : "10-min chat window — make it count, then meet IRL 🟢"
          }
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages}>
        {/* Locked state */}
        {isLocked && (
          <div className={styles.lockedOverlay}>
            <div className={styles.blurredMsg}>
              <div className={styles.blurBubble} />
              <div className={styles.blurBubble} style={{ width: '60%' }} />
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
          <div key={msg.id} className={`${styles.bubble} ${styles.bubbleMine}`}>
            <span className={styles.bubbleText}>{msg.text}</span>
            <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
          </div>
        ))}
        {isPending && (
          <div className={styles.pendingNotice}>
            <span className={styles.pendingIcon}>⏳</span>
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
          <div key={msg.id} className={`${styles.bubble} ${msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs}`}>
            <span className={styles.bubbleText}>{msg.text}</span>
            <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
          </div>
        ))}

        {/* Expired state */}
        {expired && (isUnlocked || isFree) && (
          <div className={styles.expiredCard}>
            <span className={styles.expiredIcon}>🤝</span>
            <h3 className={styles.expiredTitle}>Time's up — go meet them!</h3>
            <p className={styles.expiredSub}>The chat window closed. If you liked each other, you already know where they are. Go say hi.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked message hint */}
      {blockedMsg && (
        <div className={styles.blockedHint}>
          <span>🚫</span> {blockedMsg}
        </div>
      )}

      {/* Input bar */}
      {canType && (
        <div className={styles.inputBar}>
          {isFree && (
            <div className={styles.freeTag}>
              <span className={styles.freeTagDot} />
              First message free
            </div>
          )}
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isFree ? 'Send your free message…' : 'Message…'}
              autoComplete="off"
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className={styles.inputBarDisabled}>
          <span>🔒 Unlock to reply</span>
        </div>
      )}

      {expired && (
        <div className={styles.inputBarDisabled}>
          <span>⏱ Chat window closed — meet in person</span>
        </div>
      )}
    </div>
  )
}
