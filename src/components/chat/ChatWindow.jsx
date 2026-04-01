import { useState, useRef, useEffect } from 'react'
import styles from './ChatWindow.module.css'

const UNLOCK_PRICE = '$0.99'
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow({ conversation: conv, onBack, onSend, onUnlock }) {
  const [text, setText] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

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
  const canType    = isUnlocked || isFree

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

        <div style={{ width: 40 }} />
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {/* Locked state — blur preview */}
        {isLocked && (
          <div className={styles.lockedOverlay}>
            <div className={styles.blurredMsg}>
              <div className={styles.blurBubble} />
              <div className={styles.blurBubble} style={{ width: '60%' }} />
            </div>
            <div className={styles.lockCard}>
              <span className={styles.lockEmoji}>🔒</span>
              <h3 className={styles.lockTitle}>{conv.displayName} sent you a message</h3>
              <p className={styles.lockSub}>Pay {UNLOCK_PRICE} to read and reply. No phone numbers — chat stays in app.</p>
              <button
                className={styles.unlockBtn}
                onClick={handleUnlock}
                disabled={unlocking}
              >
                {unlocking ? 'Processing…' : `Unlock Chat · ${UNLOCK_PRICE}`}
              </button>
              <p className={styles.lockNote}>One-time unlock for this conversation</p>
            </div>
          </div>
        )}

        {/* Pending — I sent first message, waiting */}
        {isPending && conv.messages.map(msg => (
          <div key={msg.id} className={`${styles.bubble} ${styles.bubbleMine}`}>
            <span className={styles.bubbleText}>{msg.text}</span>
            <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
          </div>
        ))}
        {isPending && (
          <div className={styles.pendingNotice}>
            <span className={styles.pendingIcon}>⏳</span>
            <p>Waiting for {conv.displayName} to unlock the chat.</p>
            <p className={styles.pendingSub}>They'll pay {UNLOCK_PRICE} to read and reply.</p>
          </div>
        )}

        {/* Free — no messages yet */}
        {isFree && conv.messages.length === 0 && (
          <div className={styles.freeNotice}>
            <span className={styles.freeIcon}>💬</span>
            <h3 className={styles.freeTitle}>Your first message is free</h3>
            <p className={styles.freeSub}>Say hi to {conv.displayName}. If they reply, they pay {UNLOCK_PRICE} to unlock the chat.</p>
          </div>
        )}

        {/* Unlocked messages */}
        {isUnlocked && conv.messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.bubble} ${msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs}`}
          >
            <span className={styles.bubbleText}>{msg.text}</span>
            <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

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
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!text.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Locked — no input */}
      {isLocked && (
        <div className={styles.inputBarDisabled}>
          <span>🔒 Unlock to reply</span>
        </div>
      )}
    </div>
  )
}
