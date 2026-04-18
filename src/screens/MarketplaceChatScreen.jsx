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
import { checkSpam, recordStrike, isUserBanned, getWarningMessage } from '@/utils/spamFilter'
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
  const [spamWarning, setSpamWarning] = useState('')
  const [chatBanned, setChatBanned] = useState(false)
  const [showDepositFlow, setShowDepositFlow] = useState(false)
  const [depositPaid, setDepositPaid] = useState(false)
  const [depositProof, setDepositProof] = useState(null)
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
          msg.from === 'system' ? (
            <div key={msg.id} style={{ padding: '8px 14px', margin: '4px 20px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(141,198,63,0.7)', lineHeight: 1.4 }}>{msg.text}</span>
            </div>
          ) :
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

      {/* Spam warning */}
      {spamWarning && (
        <div style={{ position: 'absolute', bottom: 70, left: 16, right: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, textAlign: 'center', zIndex: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{spamWarning}</span>
        </div>
      )}

      {/* Chat banned */}
      {chatBanned && (
        <div style={{ position: 'absolute', bottom: 70, left: 16, right: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, textAlign: 'center', zIndex: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>Chat disabled — too many violations. Try again in 15 minutes.</span>
        </div>
      )}

      {/* Place Order — 10% booking fee */}
      {!depositPaid && !isSeller && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={() => setShowDepositFlow(true)} style={{ width: '100%', padding: '12px 0', background: '#8DC63F', border: 'none', borderRadius: 12, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 10px rgba(141,198,63,0.3)' }}>
            🛒 Place Order — 10% Booking Fee to Confirm
          </button>
        </div>
      )}

      {/* Order confirmed + WhatsApp */}
      {depositPaid && !isSeller && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(37,211,102,0.1)' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#25D366' }}>Order Confirmed — WhatsApp available for delivery details</span>
          </div>
        </div>
      )}

      {/* Deposit flow popup */}
      {showDepositFlow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#111', border: '1.5px solid rgba(255,215,0,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Confirm Your Order</span>
              <button onClick={() => setShowDepositFlow(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Pay a 10% booking fee to confirm your order. This secures the item and the seller will be notified. You'll also get the seller's WhatsApp for delivery details.
              </p>

              {/* Payment methods */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Pay via:</div>
                {[
                  { method: 'Bank BCA', detail: '1234 5678 90 · Indoo Indonesia' },
                  { method: 'GoPay / OVO', detail: '0812-3456-7890' },
                  { method: 'QRIS', detail: 'Scan QR at checkout' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700' }}>{p.method}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.detail}</span>
                  </div>
                ))}
              </div>

              {/* Upload proof */}
              {depositProof ? (
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <img src={depositProof} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }} />
                  <button onClick={() => setDepositProof(null)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => {
                  const inp = document.createElement('input')
                  inp.type = 'file'; inp.accept = 'image/*'
                  inp.onchange = e => { const f = e.target.files?.[0]; if (f) setDepositProof(URL.createObjectURL(f)) }
                  inp.click()
                }} style={{ width: '100%', padding: '20px', borderRadius: 12, border: '2px dashed rgba(255,215,0,0.15)', background: 'rgba(255,215,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 14 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700' }}>Upload Payment Proof</span>
                </button>
              )}

              <button onClick={() => {
                if (!depositProof) return
                setDepositPaid(true)
                setShowDepositFlow(false)
                setMessages(prev => [...prev, {
                  id: `sys_${Date.now()}`,
                  from: 'system',
                  text: '✅ Order confirmed! Booking fee received. Seller has been notified. WhatsApp contact is now available for delivery arrangements.',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }])
              }} disabled={!depositProof} style={{ width: '100%', padding: '14px', borderRadius: 14, background: depositProof ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: depositProof ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 800, cursor: depositProof ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

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
