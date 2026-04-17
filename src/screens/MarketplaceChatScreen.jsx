/**
 * MarketplaceChatScreen — marketplace chat with Supabase persistence,
 * locked camera (unless subscribed), keyboard-aware input bar,
 * and commission-based seller chat blocking.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getOrCreateConversation,
  fetchMessages,
  sendMessage as sendMsg,
  isSellerChatBlocked,
  subscribeToMessages,
} from '@/services/marketplaceChatService'
import styles from './MarketplaceChatScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

const DEMO_MESSAGES = [
  { id: 'm1', from: 'buyer', text: 'Hi, is this still available?', time: '10:30' },
  { id: 'm2', from: 'seller', text: 'Yes! Available and ready to ship', time: '10:31' },
  { id: 'm3', from: 'buyer', text: 'Can I get a discount for 2 pieces?', time: '10:32' },
  { id: 'm4', from: 'seller', text: 'Sure, I can do 10% off for 2+ items 😊', time: '10:33' },
  { id: 'm5', from: 'buyer', text: 'Great! Adding to cart now', time: '10:35' },
]

export default function MarketplaceChatScreen({ open, onClose, contact }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [text, setText] = useState('')
  const [isSubscribed] = useState(false)
  const [showLockedModal, setShowLockedModal] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [convId, setConvId] = useState(null)
  const [sellerBlocked, setSellerBlocked] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const unsubRef = useRef(null)

  // Determine if current user is buyer or seller in this conversation
  const sellerId = contact?.sellerId ?? contact?.userId ?? null
  const buyerId = user?.id

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

  if (!open) return null

  const canSend = !(isSeller && sellerBlocked)

  const sendMessage = async () => {
    if (!text.trim() || !canSend) return

    const msgText = text.trim()
    setText('')

    // Optimistic UI
    const tempId = `temp_${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      from: isSeller ? 'seller' : 'buyer',
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])

    if (convId && user?.id) {
      const saved = await sendMsg(convId, user.id, { text: msgText })
      if (saved) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: saved.id } : m))
      }
    }

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
        }])
        if (convId && user?.id) {
          sendMsg(convId, user.id, { imageUrl: url.trim() })
        }
      }
    } else {
      setShowLockedModal(true)
    }
  }

  const contactName = contact?.buyer || contact?.seller || contact?.displayName || 'Chat'

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="" className={styles.headerLogo} />
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{contactName}</span>
          <span className={styles.headerStatus}>{sellerBlocked && isSeller ? 'Messaging locked' : 'Online'}</span>
        </div>
      </div>

      {/* Commission block banner for seller */}
      {isSeller && sellerBlocked && (
        <div className={styles.blockedBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span>Pay outstanding commission to unlock messaging</span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages} ref={listRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.bubble} ${msg.from === 'buyer' ? styles.bubbleMe : styles.bubbleThem}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className={styles.bubbleImg} />
            ) : (
              <span className={styles.bubbleText}>{msg.text}</span>
            )}
            <span className={styles.bubbleTime}>{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className={`${styles.inputBar} ${keyboardOpen ? styles.inputBarRaised : ''}`}>
        {isSeller && sellerBlocked ? (
          <div className={styles.blockedInputMsg}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Messaging locked — pay commission to respond
          </div>
        ) : (
          <>
            <button className={styles.cameraBtn} onClick={handleCameraClick}>
              {isSubscribed ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              )}
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
            <button className={`${styles.sendBtn} ${text.trim() ? styles.sendBtnActive : ''}`} onClick={sendMessage} disabled={!text.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Locked camera modal */}
      {showLockedModal && (
        <div className={styles.lockedOverlay} onClick={() => setShowLockedModal(false)}>
          <div className={styles.lockedModal} onClick={e => e.stopPropagation()}>
            <span className={styles.lockedIcon}>🔒</span>
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
