/**
 * MarketplaceChatScreen — premium marketplace chat with Supabase persistence,
 * locked camera (unless subscribed), keyboard-aware input bar,
 * commission-based seller chat blocking, conversations drawer,
 * block/report system, and online status.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getOrCreateConversation,
  fetchMessages,
  sendMessage as sendMsg,
  isSellerChatBlocked,
  subscribeToMessages,
} from '@/services/marketplaceChatService'
import { checkSpam, recordStrike, isUserBanned, getWarningMessage } from '@/utils/spamFilter'
import styles from './MarketplaceChatScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const DEMO_MESSAGES = [
  { id: 'm1', from: 'buyer', text: 'Hi, is this still available?', time: '10:30', read: true },
  { id: 'm2', from: 'seller', text: 'Yes! Available and ready to ship', time: '10:31', read: true },
  { id: 'm3', from: 'buyer', text: 'Can I get a discount for 2 pieces?', time: '10:32', read: true },
  { id: 'm4', from: 'seller', text: 'Sure, I can do 10% off for 2+ items', time: '10:33', read: true },
  { id: 'm5', from: 'buyer', text: 'Great! Adding to cart now', time: '10:35', read: true },
]

const MOCK_CONVERSATIONS = [
  { id: 'c1', name: 'Pak Wayan', lastMsg: 'Siap kak, besok pagi saya antarkan', timeAgo: '2m ago', unread: 3, online: true, avatar: null },
  { id: 'c2', name: 'Ibu Sari', lastMsg: 'Villa sudah ready untuk check-in', timeAgo: '1h ago', unread: 0, online: false, avatar: null },
  { id: 'c3', name: 'Mas Rizky', lastMsg: 'Sound system bisa diantar ke venue', timeAgo: '3h ago', unread: 1, online: true, avatar: null },
  { id: 'c4', name: 'Sarah M.', lastMsg: 'Is the bike still available?', timeAgo: '5h ago', unread: 0, online: false, avatar: null },
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export default function MarketplaceChatScreen({ open, onClose, contact, onViewProfile }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [text, setText] = useState('')
  const [isSubscribed] = useState(false)
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [convId, setConvId] = useState(null)
  const [sellerBlocked, setSellerBlocked] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const [spamWarning, setSpamWarning] = useState('')
  const [chatBanned, setChatBanned] = useState(false)
  const [showDepositFlow, setShowDepositFlow] = useState(false)
  const [depositPaid, setDepositPaid] = useState(false)
  const [depositProof, setDepositProof] = useState(null)

  // New premium states
  const [isOnline, setIsOnline] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerSearch, setDrawerSearch] = useState('')
  const [conversations, setConversations] = useState([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Spam')
  const [reportDescription, setReportDescription] = useState('')
  const [confirmAction, setConfirmAction] = useState(null) // { title, text, onConfirm }
  const [toast, setToast] = useState('')
  const [typing, setTyping] = useState(false)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const unsubRef = useRef(null)
  const fileInputRef = useRef(null)

  // Determine if current user is buyer or seller in this conversation
  const sellerId = contact?.sellerId ?? contact?.userId ?? null
  const buyerId = user?.id

  // Online status simulation
  useEffect(() => {
    if (!open) return
    setIsOnline(true)
    const timer = setTimeout(() => setIsOnline(false), 30000)
    return () => clearTimeout(timer)
  }, [open])

  // Load conversations from localStorage
  useEffect(() => {
    if (!open) return
    try {
      const stored = localStorage.getItem('indoo_chat_history')
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setConversations(parsed)
      } else {
        setConversations(MOCK_CONVERSATIONS)
        localStorage.setItem('indoo_chat_history', JSON.stringify(MOCK_CONVERSATIONS))
      }
    } catch {
      setConversations(MOCK_CONVERSATIONS)
    }
  }, [open])

  // Load conversation + messages from Supabase
  useEffect(() => {
    if (!open || !user?.id || !sellerId) return

    const isSelf = user.id === sellerId
    setIsSeller(isSelf)

    const loadChat = async () => {
      const bId = isSelf ? (contact?.buyerId ?? user.id) : user.id
      const sId = isSelf ? user.id : sellerId

      const conv = await getOrCreateConversation(bId, sId)
      if (!conv) return

      setConvId(conv.id)
      setSellerBlocked(conv.seller_blocked ?? false)

      const msgs = await fetchMessages(conv.id)
      if (msgs.length) {
        setMessages(msgs.map(m => ({
          id: m.id,
          from: m.sender_id === sId ? 'seller' : 'buyer',
          text: m.text,
          image: m.image_url,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true,
        })))
      }

      // Subscribe to realtime
      unsubRef.current?.()
      unsubRef.current = subscribeToMessages(conv.id, (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, {
            id: newMsg.id,
            from: newMsg.sender_id === sId ? 'seller' : 'buyer',
            text: newMsg.text,
            image: newMsg.image_url,
            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          }]
        })
      })
    }

    loadChat()
    return () => { unsubRef.current?.() }
  }, [open, user?.id, sellerId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  // Detect keyboard open via viewport resize
  useEffect(() => {
    if (!open) return
    const initialHeight = window.visualViewport?.height ?? window.innerHeight
    const handleResize = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight
      setKeyboardOpen(currentHeight < initialHeight - 100)
    }
    window.visualViewport?.addEventListener('resize', handleResize)
    return () => window.visualViewport?.removeEventListener('resize', handleResize)
  }, [open])

  // Show toast helper
  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  if (!open) return null

  const canSend = !(isSeller && sellerBlocked)

  const sendMessage = async () => {
    if (!text.trim() || !canSend) return
    if (isUserBanned()) { setChatBanned(true); return }

    // Spam filter check
    const spamResult = checkSpam(text)
    if (spamResult.isSpam) {
      const strike = recordStrike()
      if (strike.banned) {
        setChatBanned(true)
        setSpamWarning(`Chat disabled for ${strike.minutesLeft} minutes.`)
      } else {
        setSpamWarning(getWarningMessage(spamResult.severity) + ` (${strike.strikesLeft} warning${strike.strikesLeft > 1 ? 's' : ''} left)`)
      }
      setTimeout(() => setSpamWarning(''), 5000)
      return
    }

    const msgText = text.trim()
    setText('')

    // Optimistic UI
    const tempId = `temp_${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      from: isSeller ? 'seller' : 'buyer',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }])

    if (convId && user?.id) {
      const saved = await sendMsg(convId, user.id, { text: msgText })
      if (saved) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: saved.id, read: true } : m))
      }
    }

    // Simulate typing indicator + reply
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      // Mark sent messages as read
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, read: true } : m))
    }, 2000)

    inputRef.current?.focus()
  }

  const handleCameraClick = () => {
    if (!canSend) return
    if (isSubscribed) {
      const url = prompt('Paste image URL:')
      if (url?.trim()) {
        const tempId = `temp_${Date.now()}`
        setMessages(prev => [...prev, {
          id: tempId,
          from: isSeller ? 'seller' : 'buyer',
          image: url.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true,
        }])
        if (convId && user?.id) {
          sendMsg(convId, user.id, { imageUrl: url.trim() })
        }
      }
    } else {
      setShowLockedModal(true)
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    showToast(`Attached: ${file.name}`)
    e.target.value = ''
  }

  // Block user
  const handleBlockUser = () => {
    setShowOptions(false)
    setConfirmAction({
      title: 'Block User',
      text: `Are you sure you want to block ${contactName}? You will no longer receive messages from them.`,
      onConfirm: () => {
        try {
          const blocked = JSON.parse(localStorage.getItem('indoo_blocked_users') || '[]')
          const entry = { userId: sellerId, name: contactName, blockedAt: new Date().toISOString() }
          blocked.push(entry)
          localStorage.setItem('indoo_blocked_users', JSON.stringify(blocked))
        } catch { /* ignore */ }
        setConfirmAction(null)
        showToast('User blocked')
        setTimeout(() => onClose?.(), 800)
      },
    })
  }

  // Report user
  const handleReportSubmit = () => {
    try {
      const reports = JSON.parse(localStorage.getItem('indoo_reports') || '[]')
      reports.push({
        userId: sellerId,
        name: contactName,
        reason: reportReason,
        description: reportDescription,
        reportedAt: new Date().toISOString(),
      })
      localStorage.setItem('indoo_reports', JSON.stringify(reports))
    } catch { /* ignore */ }
    setShowReportModal(false)
    setReportReason('Spam')
    setReportDescription('')
    showToast('Report submitted')
  }

  // Clear chat
  const handleClearChat = () => {
    setShowOptions(false)
    setConfirmAction({
      title: 'Clear Chat',
      text: 'Are you sure you want to clear all messages? This cannot be undone.',
      onConfirm: () => {
        setMessages([])
        setConfirmAction(null)
        showToast('Chat cleared')
      },
    })
  }

  const contactName = contact?.buyer || contact?.seller || contact?.displayName || 'Chat'
  const contactAvatar = contact?.avatar || contact?.profileImage || null

  // Filtered drawer conversations
  const filteredConvs = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(drawerSearch.toLowerCase()) ||
    (c.lastMsg || c.lastMessage || '').toLowerCase().includes(drawerSearch.toLowerCase())
  )

  const myRole = isSeller ? 'seller' : 'buyer'
  const theirRole = isSeller ? 'buyer' : 'seller'

  return createPortal(
    <div className={styles.screen}>
      {/* ─── Premium Header ─── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className={styles.contactsBtn} onClick={() => setShowDrawer(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className={styles.headerCenter} onClick={() => onViewProfile?.(contact)}>
          {contactAvatar ? (
            <img src={contactAvatar} alt="" className={`${styles.headerAvatar} ${isOnline ? styles.headerAvatarOnline : styles.headerAvatarOffline}`} />
          ) : (
            <div className={`${styles.headerAvatar} ${isOnline ? styles.headerAvatarOnline : styles.headerAvatarOffline}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#8DC63F', background: 'rgba(141,198,63,0.15)' }}>
              {getInitials(contactName)}
            </div>
          )}
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{contactName}</span>
            <span className={isOnline ? styles.headerStatusOnline : styles.headerStatusOffline}>
              {sellerBlocked && isSeller ? 'Messaging locked' : isOnline ? 'Online' : 'Last seen 2h ago'}
            </span>
          </div>
        </div>
        <button className={styles.optionsBtn} onClick={() => setShowOptions(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>

        {/* Options dropdown */}
        {showOptions && (
          <>
            <div className={styles.optionsOverlay} onClick={() => setShowOptions(false)} />
            <div className={styles.optionsDropdown}>
              <button className={styles.optionsItem} onClick={() => { setShowOptions(false); onViewProfile?.(contact) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </button>
              <button className={`${styles.optionsItem} ${styles.optionsItemDanger}`} onClick={handleBlockUser}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Block User
              </button>
              <button className={styles.optionsItem} onClick={() => { setShowOptions(false); setShowReportModal(true) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                Report User
              </button>
              <button className={`${styles.optionsItem} ${styles.optionsItemDanger}`} onClick={handleClearChat}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Clear Chat
              </button>
            </div>
          </>
        )}
      </div>

      {/* Commission block banner for seller */}
      {isSeller && sellerBlocked && (
        <div className={styles.blockedBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span>Pay outstanding commission to unlock messaging</span>
        </div>
      )}

      {/* ─── Messages ─── */}
      <div className={styles.messages} ref={listRef}>
        {messages.map(msg => {
          if (msg.from === 'system') {
            return (
              <div key={msg.id} className={styles.bubbleSystem}>
                <span className={styles.bubbleText}>{msg.text}</span>
              </div>
            )
          }

          const isMe = msg.from === myRole
          return (
            <div key={msg.id} className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowThem}`}>
              {!isMe && (
                <div
                  className={styles.msgAvatar}
                  onClick={() => onViewProfile?.(contact)}
                >
                  {contactAvatar ? (
                    <img src={contactAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(contactName)
                  )}
                </div>
              )}
              <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                {msg.image ? (
                  <img src={msg.image} alt="" className={styles.bubbleImg} />
                ) : (
                  <span className={styles.bubbleText}>{msg.text}</span>
                )}
                <span className={styles.bubbleTime}>
                  {msg.time}
                  {isMe && <span className={styles.readReceipt}>{msg.read ? ' \u2713\u2713' : ' \u2713'}</span>}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Typing indicator */}
      {typing && <div className={styles.typingIndicator}>{contactName} is typing...</div>}

      {/* ─── Premium Input Bar ─── */}
      <div className={`${styles.inputBar} ${keyboardOpen ? styles.inputBarRaised : ''}`}>
        {isSeller && sellerBlocked ? (
          <div className={styles.blockedInputMsg}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Messaging locked — pay commission to respond
          </div>
        ) : (
          <>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelected} />
            <button className={styles.attachBtn} onClick={handleAttachClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.49"/></svg>
            </button>
            <input
              ref={inputRef}
              className={styles.textInput}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              onFocus={() => setKeyboardOpen(true)}
              onBlur={() => setTimeout(() => setKeyboardOpen(false), 100)}
              placeholder="Type a message..."
            />
            {!text.trim() && (
              <button className={styles.cameraBtn} onClick={handleCameraClick}>
                {isSubscribed ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                )}
              </button>
            )}
            <button className={`${styles.sendBtn} ${text.trim() ? styles.sendBtnActive : ''}`} onClick={sendMessage} disabled={!text.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Spam warning */}
      {spamWarning && (
        <div style={{ position: 'absolute', bottom: 70, left: 16, right: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, textAlign: 'center', zIndex: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>{spamWarning}</span>
        </div>
      )}

      {/* Chat banned */}
      {chatBanned && (
        <div style={{ position: 'absolute', bottom: 70, left: 16, right: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, textAlign: 'center', zIndex: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>Chat disabled — too many violations. Try again in 15 minutes.</span>
        </div>
      )}

      {/* Place Order button — no fee for buyers */}
      {!depositPaid && !isSeller && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={() => {
            setDepositPaid(true)
            setMessages(prev => [...prev, {
              id: `sys_${Date.now()}`,
              from: 'system',
              text: 'Order placed! Seller has been notified. They will contact you to arrange delivery.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }])
          }} style={{ width: '100%', padding: '14px 0', background: '#8DC63F', border: 'none', borderRadius: 14, color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(141,198,63,0.3)' }}>
            Place Order
          </button>
        </div>
      )}

      {/* Order confirmed */}
      {depositPaid && !isSeller && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(141,198,63,0.1)' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>Order Placed — Seller has been notified</span>
          </div>
        </div>
      )}

      {/* ─── Conversations Drawer ─── */}
      {showDrawer && (
        <>
          <div className={styles.drawerOverlay} onClick={() => setShowDrawer(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Messages</span>
              <button className={styles.drawerCloseBtn} onClick={() => setShowDrawer(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <input
              className={styles.drawerSearch}
              value={drawerSearch}
              onChange={e => setDrawerSearch(e.target.value)}
              placeholder="Search conversations..."
            />
            <div className={styles.drawerList}>
              {filteredConvs.map(conv => (
                <button key={conv.id} className={styles.convItem} onClick={() => { setShowDrawer(false); showToast(`Switched to ${conv.name}`) }}>
                  <div className={styles.convAvatarWrap}>
                    <div className={styles.convAvatar}>{getInitials(conv.name)}</div>
                    {conv.online && <div className={styles.convOnlineDot} />}
                    {conv.unread > 0 && <div className={styles.convBadge}>{conv.unread}</div>}
                  </div>
                  <div className={styles.convInfo}>
                    <span className={styles.convName}>{conv.name}</span>
                    <span className={styles.convPreview}>{conv.lastMsg}</span>
                  </div>
                  <span className={styles.convTime}>{conv.timeAgo}</span>
                </button>
              ))}
              {filteredConvs.length === 0 && (
                <div style={{ padding: '24px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No conversations found</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Report Modal ─── */}
      {showReportModal && (
        <div className={styles.reportOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.reportModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.reportTitle}>Report {contactName}</h3>
            <select className={styles.reportSelect} value={reportReason} onChange={e => setReportReason(e.target.value)}>
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Fraud">Fraud</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              className={styles.reportTextarea}
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder="Describe the issue (optional)..."
            />
            <button className={styles.reportSubmitBtn} onClick={handleReportSubmit}>Submit Report</button>
            <button className={styles.reportCancelBtn} onClick={() => setShowReportModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ─── Confirm Dialog ─── */}
      {confirmAction && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmAction(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>{confirmAction.title}</h3>
            <p className={styles.confirmText}>{confirmAction.text}</p>
            <div className={styles.confirmBtnRow}>
              <button className={styles.confirmBtnCancel} onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className={styles.confirmBtnDanger} onClick={confirmAction.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Locked camera modal */}
      {showLockedModal && (
        <div className={styles.lockedOverlay} onClick={() => setShowLockedModal(false)}>
          <div className={styles.lockedModal} onClick={e => e.stopPropagation()}>
            <span className={styles.lockedIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </span>
            <h3 className={styles.lockedTitle}>Image Sharing Locked</h3>
            <p className={styles.lockedText}>Upgrade to a monthly subscription to send images, photos, and payment screenshots in chat.</p>
            <button className={styles.lockedUpgradeBtn}>Upgrade — Rp 29,900/month</button>
            <button className={styles.lockedCloseBtn} onClick={() => setShowLockedModal(false)}>Maybe Later</button>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
