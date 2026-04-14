import { useState, useRef, useEffect, useCallback } from 'react'
import { filterMessage, BLOCK_MESSAGES } from '@/utils/contentFilter'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage, sendImageMessage, sendContactMessage, unlockConversation, likeMessage, markConversationRead, postSellerContactReveal, saveOrderConversation } from '@/services/conversationService'
import { getSellerContactDetails } from '@/services/unlockService'
import { supabase } from '@/lib/supabase'
import { hasUnpaidCommission, recordCommission, COMMISSION_RATES } from '@/services/commissionService'
import { useChatPresence } from '@/hooks/useChatPresence'
import ContactShareSheet from './ContactShareSheet'
import VideoCheckBubble from './VideoCheckBubble'
import VideoCheckWindow from './VideoCheckWindow'
import { useVideoCheck } from '@/hooks/useVideoCheck'
import { useUnlocks } from '@/hooks/useUnlocks'
import UnlockGate from './UnlockGate'
import OrderCard from '@/components/orders/OrderCard'
import styles from './ChatWindow.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const WARN_DAYS      = 5

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCountdown(ms) {
  if (ms == null || ms < 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const THEME_CONFIG = {
  dating: {
    windowClass: 'windowDating',
    headerClass: 'headerDating',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_pink-removebg-preview.png',
  },
  market: {
    windowClass: 'windowMarket',
    headerClass: 'headerMarket',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_market_place-removebg-preview.png',
  },
  food: {
    windowClass: 'windowFood',
    headerClass: 'headerFood',
    icon: 'https://ik.imagekit.io/nepgaxllc/chat_chef-removebg-preview.png',
  },
}

export default function ChatWindow({ conversation: conv, allConversations = [], onBack, onSwitchConv, onConvUpdate, isDating = false, chatTheme = null, role = null, sellerUserId = null, _forceCommissionLocked = false }) {
  // Support legacy isDating prop
  const theme = chatTheme ?? (isDating ? 'dating' : null)
  const themeConfig = THEME_CONFIG[theme] ?? null
  const { user } = useAuth()
  const { notify } = usePushNotifications()

  // Online/offline presence for the other person
  const otherUserId = conv.otherUserId ?? conv.userId ?? null
  const { isOnline } = useChatPresence(otherUserId)

  // Chat switcher panel
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const otherConvs = allConversations.filter(c => c.id !== conv.id)

  // Real-time messages — falls back to conv.messages in demo
  const { messages, setMessages } = useMessages(conv.id, conv.messages ?? [])

  // Persist the opening order-card message to Supabase on first mount.
  // conv.userId is the seller's auth UUID; if it's a demo/integer ID the call
  // is a no-op inside saveOrderConversation.
  useEffect(() => {
    const opening = conv.messages?.[0]
    if (!opening?.orderCard || !conv.id.startsWith('order-')) return
    saveOrderConversation(conv.userId, opening.orderCard).then(result => {
      if (!result) return
      // Swap the local temp ID for the real Supabase UUID so status-change
      // updates can find the row with .eq('id', msgId)
      setMessages(prev => prev.map(m =>
        m.id === opening.id ? { ...m, id: result.msgId } : m
      ))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [text, setText]                     = useState('')
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

  // ── Typing indicator via Supabase Realtime presence ───────────────────────
  const typingChannelRef  = useRef(null)
  const typingTimeoutRef  = useRef(null)
  const myUserId = user?.uid ?? user?.id ?? null

  useEffect(() => {
    if (!supabase || !conv.id || !myUserId) return
    const ch = supabase.channel(`typing:${conv.id}`, { config: { presence: { key: myUserId } } })
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      // Check if other user is typing (any presence key that isn't mine)
      const otherTyping = Object.keys(state).some(k => k !== myUserId && state[k]?.[0]?.typing)
      setIsTyping(otherTyping)
    }).subscribe()
    typingChannelRef.current = ch
    return () => { supabase.removeChannel(ch); typingChannelRef.current = null }
  }, [conv.id, myUserId]) // eslint-disable-line

  const broadcastTyping = useCallback((isCurrentlyTyping) => {
    if (!typingChannelRef.current) return
    typingChannelRef.current.track({ typing: isCurrentlyTyping })
  }, [])

  const handleTextChange = useCallback((e) => {
    setText(e.target.value)
    broadcastTyping(true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000)
  }, [broadcastTyping])

  const contactUnlocked = conv.status === 'unlocked'

  // ── 20-min free chat + unlock system (dating only) ───────────────────────
  const isDatingTheme = theme === 'dating'
  const [unlockGateOpen, setUnlockGateOpen] = useState(false)
  const isBuyer = role === 'buyer'
  const {
    timeLeftMs:            _timeLeftMs,
    isUnlocked:            _chatUnlocked,
    showUnlockPrompt,
    unlockBalance,
    unlockWithCredit,
    unlockWithSubscription,
    dismissPrompt,
  } = useUnlocks(conv.id, role)

  // 20-min window only applies to dating — market/food/ride are commission-gated only
  const timeLeftMs   = isDatingTheme ? _timeLeftMs   : null
  const chatUnlocked = isDatingTheme ? _chatUnlocked : true

  // After buyer pays, auto-post seller's contact details into the conversation
  const handleBuyerUnlockComplete = useCallback(async () => {
    await unlockWithCredit()
    const sellerId = sellerUserId ?? conv.otherUserId ?? null
    if (!sellerId) return
    try {
      const details = await getSellerContactDetails(sellerId, user?.uid ?? user?.id)
      const msg     = await postSellerContactReveal(conv.id, user?.uid ?? user?.id, details)
      setMessages(prev => [...prev, msg])
    } catch (e) {
      console.warn('contact reveal failed', e)
    }
  }, [unlockWithCredit, sellerUserId, conv.otherUserId, conv.id, user]) // eslint-disable-line

  // Auto-open gate when prompt fires — dating only
  useEffect(() => {
    if (isDatingTheme && showUnlockPrompt) setUnlockGateOpen(true)
  }, [isDatingTheme, showUnlockPrompt])

  // Block sending when time is up — dating only (market/food: commission lock handles it)
  const chatBlocked = !chatUnlocked && timeLeftMs !== null && timeLeftMs <= 0

  // Commission lock — seller cannot send until outstanding commission is paid
  const [commissionLocked, setCommissionLocked] = useState(_forceCommissionLocked)
  const isSeller = role === 'seller'

  useEffect(() => {
    if (_forceCommissionLocked) { setCommissionLocked(true); return }
    if (!isSeller) return
    const sellerId = user?.uid ?? user?.id
    if (!sellerId) return
    const commType = theme === 'food' ? 'restaurant' : 'marketplace'
    hasUnpaidCommission(sellerId, commType).then(setCommissionLocked)
  }, [isSeller, user, _forceCommissionLocked, theme]) // eslint-disable-line

  const {
    phase:          videoPhase,
    localStream,
    remoteStream,
    countdown,
    error:          videoError,
    isAvailable:    videoAvailable,
    sendRequest:    sendVideoRequest,
    acceptRequest:  acceptVideoRequest,
    declineRequest: declineVideoRequest,
    endCall:        endVideoCall,
  } = useVideoCheck(conv.id)

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const { blocked, reason } = filterMessage(trimmed)
    if (blocked) { setBlockedMsg(BLOCK_MESSAGES[reason]); return }
    setText('')
    broadcastTyping(false)
    clearTimeout(typingTimeoutRef.current)
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

  // Contact sharing in social chat is intentionally free — payment only applies to
  // business contact number reveal via ContactUnlockSheet
  const handleUnlockContact = async () => {
    await unlockConversation(conv.id)
    onConvUpdate?.({ status: 'unlocked', unlockedAt: Date.now(), unread: 0 })
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

  // Update order card status locally + persist to Supabase
  const handleOrderStatusChange = (msgId, newStatus) => {
    const order = messages.find(m => m.id === msgId)?.orderCard
    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, orderCard: { ...m.orderCard, status: newStatus, updatedAt: Date.now() } }
        : m
    ))
    try {
      supabase?.from('messages').update({
        order_card: { ...order, status: newStatus, updatedAt: Date.now() }
      }).eq('id', msgId).then(() => {})
    } catch { /* silent */ }

    // Record commission and lock seller chat when payment is confirmed
    // food chat → 10% restaurant rate, all others → 5% marketplace rate
    if (newStatus === 'complete' && isSeller && order) {
      const sellerId = user?.uid ?? user?.id
      const commType = theme === 'food' ? 'restaurant' : 'marketplace'
      const rate     = COMMISSION_RATES[commType]
      if (sellerId && order.total) {
        recordCommission(sellerId, order.orderId ?? msgId, order.total, commType)
          .then(() => setCommissionLocked(true))
        onConvUpdate?.({ lastMessage: `💰 ${Math.round(rate * 100)}% commission pending`, lastMessageTime: Date.now() })
      }
    }

    const label = newStatus === 'confirmed' ? '✓ Order confirmed' : newStatus === 'complete' ? '✓ Order completed' : '✗ Order cancelled'
    onConvUpdate?.({ lastMessage: label, lastMessageTime: Date.now() })
  }

  const isLiked = (msg) => msg.liked || !!liked[msg.id]

  const myInitial   = user?.displayName?.[0]?.toUpperCase() ?? 'Me'
  const myPhoto     = user?.photoURL ?? null
  const themInitial = conv.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={`${styles.window} ${themeConfig ? styles[themeConfig.windowClass] : ''}`}>

      {/* ── Header ── */}
      <div className={`${styles.header} ${themeConfig ? styles[themeConfig.headerClass] : ''}`}>
        {/* Left: avatar + name + online status */}
        <div className={styles.headerUser}>
          <div className={styles.headerAvatar}>
            {conv.photoURL
              ? <img src={conv.photoURL} alt={conv.displayName} className={styles.headerAvatarImg} />
              : <span className={styles.headerAvatarEmoji}>{conv.emoji}</span>
            }
            {/* Presence dot — green online, red offline */}
            <span className={`${styles.presenceDot} ${isOnline ? styles.presenceDotOnline : styles.presenceDotOffline}`} />
          </div>
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{conv.displayName}</span>
            {/* Online / Offline label */}
            <span className={`${styles.presenceLabel} ${isOnline ? styles.presenceLabelOnline : styles.presenceLabelOffline}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>

          {/* Chat switcher — only if there are other convs */}
          {otherConvs.length > 0 && (
            <button
              className={`${styles.switcherBtn} ${switcherOpen ? styles.switcherBtnActive : ''}`}
              onClick={() => setSwitcherOpen(v => !v)}
              aria-label="Switch chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{otherConvs.length}</span>
              {otherConvs.some(c => c.unread > 0) && <span className={styles.switcherBadge} />}
            </button>
          )}

          {/* ID Check button */}
          {videoAvailable && videoPhase === 'idle' && (
            <button
              className={styles.idCheckBtn}
              onClick={sendVideoRequest}
              aria-label="Request live ID check"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>ID Check</span>
            </button>
          )}

          {/* Share contact button */}
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

        {/* Free chat timer notice — dating only */}
        {isDatingTheme && !chatBlocked && (
          <div className={styles.headerNoticeRow}>
            {chatUnlocked
              ? '✅ Chat unlocked · share contact anytime'
              : <>💬 20 min free chat&nbsp;&nbsp;{timeLeftMs != null && <span className={styles.headerNoticeTimer}>{formatCountdown(timeLeftMs)}</span>}</>
            }
          </div>
        )}
      </div>

      {/* ── Chat switcher slide-out panel ── */}
      {switcherOpen && (
        <div className={styles.switcherPanel}>
          <div className={styles.switcherPanelTitle}>Switch Chat</div>
          {otherConvs.map(c => (
            <button
              key={c.id}
              className={styles.switcherRow}
              onClick={() => { setSwitcherOpen(false); onSwitchConv?.(c.id) }}
            >
              <div className={styles.switcherAvatar}>
                {c.photoURL
                  ? <img src={c.photoURL} alt={c.displayName} className={styles.switcherAvatarImg} />
                  : <span className={styles.switcherAvatarInitial}>{c.displayName?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>
              <div className={styles.switcherInfo}>
                <span className={styles.switcherName}>{c.displayName}</span>
                <span className={styles.switcherLast}>{c.lastMessage ?? 'No messages yet'}</span>
              </div>
              {c.unread > 0 && (
                <span className={styles.switcherUnread}>{c.unread > 9 ? '9+' : c.unread}</span>
              )}
            </button>
          ))}
        </div>
      )}



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
              {/* Order card — marketplace or restaurant order */}
              {msg.orderCard ? (
                <OrderCard
                  orderCard={msg.orderCard}
                  fromMe={msg.fromMe}
                  onStatusChange={(newStatus) => handleOrderStatusChange(msg.id, newStatus)}
                />
              ) : msg.isContactReveal ? (
                <div className={styles.revealCard}>
                  <div className={styles.revealHeader}>
                    <span className={styles.revealIcon}>🔓</span>
                    <span className={styles.revealTitle}>
                      {msg.sellerDetails?.displayName
                        ? `${msg.sellerDetails.displayName}'s contact details`
                        : 'Seller contact details'}
                    </span>
                  </div>
                  <div className={styles.revealRows}>
                    {msg.sellerDetails?.phone && (
                      <div className={styles.revealRow}><span>📱</span><span>{msg.sellerDetails.phone}</span></div>
                    )}
                    {msg.sellerDetails?.instagram && (
                      <div className={styles.revealRow}><span>📸</span><span>@{msg.sellerDetails.instagram}</span></div>
                    )}
                    {msg.sellerDetails?.tiktok && (
                      <div className={styles.revealRow}><span>🎵</span><span>@{msg.sellerDetails.tiktok}</span></div>
                    )}
                    {msg.sellerDetails?.facebook && (
                      <div className={styles.revealRow}><span>📘</span><span>{msg.sellerDetails.facebook}</span></div>
                    )}
                    {msg.sellerDetails?.youtube && (
                      <div className={styles.revealRow}><span>▶️</span><span>{msg.sellerDetails.youtube}</span></div>
                    )}
                    {msg.sellerDetails?.website && (
                      <div className={styles.revealRow}><span>🌐</span><span>{msg.sellerDetails.website}</span></div>
                    )}
                  </div>
                  <p className={styles.revealNote}>Chat unlocked · 30 days</p>
                </div>
              ) : msg.contactType ? (
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
                  <span className={styles.bubbleTime}>
                    {formatTime(msg.time)}
                    {msg.fromMe && (
                      <span className={`${styles.readTick} ${msg.read ? styles.readTickRead : styles.readTickDelivered}`}>
                        {msg.read ? '✓✓' : '✓✓'}
                      </span>
                    )}
                  </span>
                  {isLiked(msg) && (
                    <div className={styles.floatingHearts} aria-hidden="true">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={styles.floatHeart} style={{ '--i': i }}>♥</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!msg.isContactReveal && !msg.contactType && (
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

      {/* ── Video check bubble (request / incoming) ── */}
      {(videoPhase === 'requesting' || videoPhase === 'incoming') && (
        <VideoCheckBubble
          phase={videoPhase}
          displayName={conv.displayName}
          onAccept={acceptVideoRequest}
          onDecline={declineVideoRequest}
        />
      )}

      {/* ── Video check error ── */}
      {videoError && (
        <div className={styles.blockedHint}><span>📷</span> {videoError}</div>
      )}

      {/* ── Commission lock banner (seller only) ── */}
      {commissionLocked && isSeller && (
        <div className={styles.commissionBanner}>
          <span>💰</span>
          <span>Commission payment pending — pay to reply to buyers</span>
        </div>
      )}

      {/* ── Blocked banner ── */}
      {chatBlocked && !commissionLocked && (
        <button className={styles.blockedBanner} onClick={() => setUnlockGateOpen(true)}>
          <span>🔒</span>
          <span>Free chat time ended — tap to unlock and continue</span>
          <span className={styles.blockedBannerArrow}>›</span>
        </button>
      )}

      {/* ── Input bar — always visible ── */}
      <div className={styles.inputBar}>
        <button className={styles.flagBtn} aria-label="Report">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </button>

        {/* Hidden file input — only wired when unlocked */}
        {chatUnlocked && (
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        )}

        {/* Camera button — locked until chat is unlocked */}
        <button
          className={`${styles.cameraBtn} ${!chatUnlocked ? styles.cameraBtnLocked : ''}`}
          onClick={() => chatUnlocked ? imageInputRef.current?.click() : setUnlockGateOpen(true)}
          aria-label={chatUnlocked ? 'Attach image' : 'Unlock to send photos'}
          title={chatUnlocked ? 'Attach image' : 'Upgrade or unlock chat to send photos'}
        >
          {chatUnlocked ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className={styles.cameraBtnLockedLabel}>Pro</span>
            </>
          )}
        </button>

        <input
          className={styles.input}
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => e.key === 'Enter' && !chatBlocked && !commissionLocked && handleSend()}
          placeholder={commissionLocked && isSeller ? 'Pay commission to reply…' : chatBlocked ? 'Unlock to continue chatting…' : 'Message…'}
          disabled={chatBlocked || (commissionLocked && isSeller)}
          autoComplete="off"
        />

        <button
          className={`${styles.sendBtn} ${text.trim() && !chatBlocked && !(commissionLocked && isSeller) ? styles.sendBtnActive : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || chatBlocked || (commissionLocked && isSeller)}
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
        onUnlockContact={handleUnlockContact}
        onSend={(contact) => {
          setShareOpen(false)
          handleShareContact(contact)
        }}
      />

      {/* ── Unlock gate modal — dating only ── */}
      {isDatingTheme && unlockGateOpen && (
        <UnlockGate
          unlockBalance={unlockBalance}
          isBuyer={isBuyer}
          onUnlockWithCredit={async () => {
            if (isBuyer) {
              await handleBuyerUnlockComplete()
            } else {
              await unlockWithCredit()
            }
            setUnlockGateOpen(false)
          }}
          onUnlockWithPlan={(plan) => { unlockWithSubscription(plan); setUnlockGateOpen(false) }}
          onDismiss={() => { dismissPrompt(); setUnlockGateOpen(false) }}
          expired={timeLeftMs !== null && timeLeftMs <= 0}
          theme={theme}
        />
      )}

      {/* ── Live video window — floats above input bar ── */}
      <VideoCheckWindow
        phase={videoPhase}
        localStream={localStream}
        remoteStream={remoteStream}
        countdown={countdown}
        displayName={conv.displayName}
        onEnd={endVideoCall}
      />
    </div>
  )
}
