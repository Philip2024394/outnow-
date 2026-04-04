import { useState, useRef, useEffect, useCallback } from 'react'
import { filterMessage, BLOCK_MESSAGES } from '@/utils/contentFilter'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage, sendImageMessage, sendContactMessage, unlockConversation, likeMessage, markConversationRead } from '@/services/conversationService'
import { supabase } from '@/lib/supabase'
import { UNLOCK_PRICE } from '@/utils/pricing' // used in ContactShareSheet via prop
import ContactShareSheet from './ContactShareSheet'
import styles from './ChatWindow.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const WARN_DAYS      = 5

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow({ conversation: conv, onBack, onConvUpdate }) {
  const { user } = useAuth()
  const { notify } = usePushNotifications()

  // Real-time messages — falls back to conv.messages in demo
  const { messages, setMessages } = useMessages(conv.id, conv.messages ?? [])

  const [text, setText]                     = useState('')
  const [unlockingContact, setUnlockingContact] = useState(false)
  const [blockedMsg, setBlockedMsg]         = useState(null)
  const [shareOpen, setShareOpen]           = useState(false)
  const [isTyping, setIsTyping]             = useState(false)
  const [liked, setLiked]                   = useState({})
  const messagesEndRef            = useRef(null)
  const notifiedRef               = useRef(false)
  const imageInputRef             = useRef(null)

  // 30-day history countdown
  const daysLeft = conv.unlockedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - conv.unlockedAt) / THIRTY_DAYS_MS * 30))
    : null
  const historyWarning = daysLeft !== null && daysLeft <= WARN_DAYS

  // Mark as read when opened
  useEffect(() => {
    if (conv.unread > 0) markConversationRead(conv.id, conv.isUserA)
  }, [conv.id]) // eslint-disable-line

  // Notify on first reply
  const firstMessageTime = messages[0]?.time ?? null
  useEffect(() => {
    if (!firstMessageTime || notifiedRef.current) return
    notifiedRef.current = true
    notify(
      `${conv.displayName} replied! 💬`,
      { body: "Your chat is unlocked — no time limit, share contact whenever you're ready.", tag: `chat-start-${conv.id}` }
    )
  }, [firstMessageTime]) // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!blockedMsg) return
    const id = setTimeout(() => setBlockedMsg(null), 3500)
    return () => clearTimeout(id)
  }, [blockedMsg])

  const contactUnlocked = conv.status === 'unlocked'

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const { blocked, reason } = filterMessage(trimmed)
    if (blocked) { setBlockedMsg(BLOCK_MESSAGES[reason]); return }
    setText('')
    const msg = await sendMessage(conv.id, user?.uid ?? user?.id, trimmed)
    if (!supabase || conv.id.startsWith('demo-') || conv.id.startsWith('conv-') || conv.id.startsWith('meet-')) {
      setMessages(prev => [...prev, { id: msg.id, fromMe: true, text: trimmed, time: Date.now() }])
    }
    if (IS_DEMO) {
      setTimeout(() => setIsTyping(true), 800)
      setTimeout(() => setIsTyping(false), 3300)
    }
    onConvUpdate?.({ lastMessage: trimmed, lastMessageTime: Date.now() })
  }, [text, conv.id, user, onConvUpdate]) // eslint-disable-line

  const handleUnlockContact = async () => {
    setUnlockingContact(true)
    try {
      await unlockConversation(conv.id)
      onConvUpdate?.({ status: 'unlocked', unlockedAt: Date.now(), unread: 0 })
    } finally {
      setUnlockingContact(false)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    e.target.value = ''
    const msg = await sendImageMessage(conv.id, user?.uid ?? user?.id, url)
    setMessages(prev => [...prev, { id: msg.id, fromMe: true, imageURL: url, time: Date.now() }])
    onConvUpdate?.({ lastMessage: '📷 Photo', lastMessageTime: Date.now() })
  }

  const handleShareContact = async ({ contactType, value }) => {
    const msg = await sendContactMessage(conv.id, user?.uid ?? user?.id, contactType, value)
    setMessages(prev => [...prev, { id: msg.id, fromMe: true, contactType, contactValue: value, time: Date.now() }])
    onConvUpdate?.({ lastMessage: `📋 ${contactType}`, lastMessageTime: Date.now() })
  }

  const toggleLike = (msg) => {
    const newLiked = !msg.liked && !liked[msg.id]
    setLiked(prev => ({ ...prev, [msg.id]: newLiked }))
    likeMessage(msg.id, newLiked)
  }

  const isLiked = (msg) => msg.liked || !!liked[msg.id]

  const myInitial   = user?.displayName?.[0]?.toUpperCase() ?? 'Me'
  const myPhoto     = user?.photoURL ?? null
  const themInitial = conv.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.window}>

      {/* ── Header ── */}
      <div className={styles.header}>
        {/* Left: avatar + name + sub */}
        <div className={styles.headerUser}>
          <div className={styles.headerAvatar}>
            {conv.photoURL
              ? <img src={conv.photoURL} alt={conv.displayName} className={styles.headerAvatarImg} />
              : <span className={styles.headerAvatarEmoji}>{conv.emoji}</span>
            }
            {conv.sessionStatus && (
              <span className={[
                styles.headerOnlineDot,
                conv.sessionStatus === 'active' || conv.sessionStatus === 'live' ? styles.dotLive :
                conv.sessionStatus === 'invite_out' ? styles.dotInvite : styles.dotLater
              ].join(' ')} />
            )}
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{conv.displayName}</span>
            <span className={styles.headerSub}>
              {[conv.age, conv.area ?? conv.city].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Share contact button — always visible */}
          <button
            className={styles.shareBtn}
            onClick={() => setShareOpen(true)}
            aria-label="Share contact"
          >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Share</span>
            </button>

          {/* Back button */}
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className={styles.windowNotice}>
        💬 Chat is free · tap Share to exchange contact details whenever you're ready
      </div>


      {/* ── Messages ── */}
      <div className={styles.messages}>

        {/* Chat rules — shown when no messages yet */}
        {messages.length === 0 && (
          <div className={styles.rulesCard}>
            <span className={styles.rulesIcon}>🛡️</span>
            <div className={styles.rulesBody}>
              <span className={styles.rulesTitle}>Chat Rules</span>
              <p className={styles.rulesText}>
                Do not share phone numbers, contact details, links or website URLs in this window.
                Use the <strong>Share</strong> button to exchange contact details safely.
                Violations result in your account being <strong>blocked</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Safety notice — shown when no messages yet */}
        {messages.length === 0 && (
          <div className={styles.safetyCard}>
            <span className={styles.safetyCardIcon}>⚠️</span>
            <div className={styles.safetyCardBody}>
              <span className={styles.safetyCardTitle}>Meet Safely</span>
              <p className={styles.safetyCardText}>
                For any first meeting, <strong>always meet in a busy public place</strong> with active foot traffic. Never meet somewhere private or isolated. Your safety is your responsibility.
              </p>
            </div>
          </div>
        )}

        {/* All messages */}
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.row} ${msg.fromMe ? styles.rowMine : styles.rowTheirs}`}>
            {!msg.fromMe && (
              <div className={styles.bubbleAvatar}>
                {conv.photoURL
                  ? <img src={conv.photoURL} alt={conv.displayName} className={styles.bubbleAvatarImg} />
                  : <span className={styles.bubbleAvatarInitial}>{themInitial}</span>
                }
              </div>
            )}

            <div className={styles.bubbleWrap}>
              {/* Contact card message */}
              {msg.contactType ? (
                <div className={styles.contactCard}>
                  <span className={styles.contactCardIcon}>
                    {{ phone:'📱', instagram:'📸', snapchat:'👻', tiktok:'🎵', facebook:'📘' }[msg.contactType] ?? '📋'}
                  </span>
                  <div className={styles.contactCardInfo}>
                    <span className={styles.contactCardLabel}>
                      {{ phone:'Phone Number', instagram:'Instagram', snapchat:'Snapchat', tiktok:'TikTok', facebook:'Facebook' }[msg.contactType] ?? 'Contact'}
                    </span>
                    <span className={styles.contactCardValue}>{msg.contactValue}</span>
                  </div>
                </div>
              ) : (
                /* Text or image bubble */
                <div className={`${styles.bubble} ${msg.fromMe ? styles.bubbleMine : styles.bubbleTheirs} ${msg.imageURL ? styles.bubbleImage : ''}`}>
                  {msg.imageURL
                    ? <img src={msg.imageURL} alt="attachment" className={styles.attachmentImg} />
                    : <span className={styles.bubbleText}>{msg.text}</span>
                  }
                  <span className={styles.bubbleTime}>{formatTime(msg.time)}</span>
                  {isLiked(msg) && (
                    <div className={styles.floatingHearts} aria-hidden="true">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={styles.floatHeart} style={{ '--i': i }}>♥</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!msg.contactType && (
                <button
                  className={`${styles.likeBtn} ${isLiked(msg) ? styles.likeBtnActive : ''}`}
                  onClick={() => toggleLike(msg)}
                  aria-label="Like"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked(msg) ? '#FF3B30' : 'none'} stroke={isLiked(msg) ? '#FF3B30' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
            </div>

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

        {/* Waiting for reply indicator — shown after meet-request greeting */}
        {conv.waitingForReply && messages.length > 0 && !messages.some(m => !m.fromMe) && !isTyping && (
          <div className={styles.waitingRow}>
            <div className={styles.waitingDots}>
              <span className={styles.waitingDot} style={{ '--d': '0s' }} />
              <span className={styles.waitingDot} style={{ '--d': '0.2s' }} />
              <span className={styles.waitingDot} style={{ '--d': '0.4s' }} />
            </div>
            <span className={styles.waitingText}>Waiting for {conv.displayName} to reply…</span>
          </div>
        )}

        {/* 30-day history warning */}
        {historyWarning && (
          <div className={styles.historyWarning}>
            <span>⏳</span>
            <span>Chat history clears in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> — save any details you need.</span>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className={`${styles.row} ${styles.rowTheirs}`}>
            <div className={styles.bubbleAvatar}>
              {conv.photoURL
                ? <img src={conv.photoURL} alt={conv.displayName} className={styles.bubbleAvatarImg} />
                : <span className={styles.bubbleAvatarInitial}>{themInitial}</span>
              }
            </div>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} style={{ '--d': '0s' }} />
              <span className={styles.typingDot} style={{ '--d': '0.18s' }} />
              <span className={styles.typingDot} style={{ '--d': '0.36s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blocked hint */}
      {blockedMsg && (
        <div className={styles.blockedHint}><span>🚫</span> {blockedMsg}</div>
      )}

      {/* ── Input bar — always visible ── */}
      <div className={styles.inputBar}>
        <button className={styles.flagBtn} aria-label="Report">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        {/* Camera button */}
        <button
          className={styles.cameraBtn}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Attach image"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
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

      <ContactShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        contactUnlocked={contactUnlocked}
        unlockPrice={UNLOCK_PRICE}
        unlockingContact={unlockingContact}
        onUnlockContact={handleUnlockContact}
        onSend={(contact) => {
          setShareOpen(false)
          handleShareContact(contact)
        }}
      />
    </div>
  )
}
