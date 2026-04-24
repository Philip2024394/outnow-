/**
 * LiveChatSheet — post-delivery issue reporting & live chat
 * Used for: wrong items, missing items, quality complaints, driver issues
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ISSUE_TYPES = [
  { id: 'wrong_item', label: 'Wrong Item', emoji: '🔄', desc: 'Received different item than ordered' },
  { id: 'missing_item', label: 'Missing Item', emoji: '📦', desc: 'Item missing from order' },
  { id: 'cold_food', label: 'Cold / Stale Food', emoji: '🥶', desc: 'Food arrived cold or not fresh' },
  { id: 'spilled', label: 'Spilled / Damaged', emoji: '💧', desc: 'Packaging opened or food spilled' },
  { id: 'late_delivery', label: 'Late Delivery', emoji: '⏰', desc: 'Order arrived much later than ETA' },
  { id: 'driver_issue', label: 'Driver Issue', emoji: '🏍️', desc: 'Problem with driver behavior' },
  { id: 'other', label: 'Other', emoji: '💬', desc: 'Something else went wrong' },
]

const QUICK_REPLIES = [
  'I want a refund',
  'Please redeliver the correct item',
  'I want to speak to the restaurant',
  'The driver was rude',
  'Food quality was poor',
]

// Demo bot responses based on issue type
const BOT_RESPONSES = {
  wrong_item: [
    { text: "I'm sorry you received the wrong item. Can you tell me which item was incorrect?", delay: 1200 },
    { text: "We've notified the restaurant. They'll prepare the correct item for redelivery. A driver will be assigned shortly.", delay: 3000 },
  ],
  missing_item: [
    { text: "Sorry about the missing item! Which item was not included in your order?", delay: 1200 },
    { text: "We've confirmed with the restaurant. The missing item will be sent to you — no extra charge. ETA ~15 min.", delay: 3000 },
  ],
  cold_food: [
    { text: "We apologize for the food quality. This feedback has been sent directly to the restaurant.", delay: 1200 },
    { text: "A partial refund of 20% has been credited to your INDOO wallet. We're working with the restaurant to prevent this.", delay: 3000 },
  ],
  spilled: [
    { text: "Sorry about the damaged packaging. Can you upload a photo so we can process your claim faster?", delay: 1200 },
    { text: "Thank you. We've issued a full refund for the affected items. The restaurant has been notified to improve packaging.", delay: 3000 },
  ],
  late_delivery: [
    { text: "We apologize for the delay. Traffic and weather can sometimes cause unexpected holdups.", delay: 1200 },
    { text: "A delivery fee refund has been applied to your account. We're optimizing driver routes in your area.", delay: 3000 },
  ],
  driver_issue: [
    { text: "We take driver conduct seriously. Can you describe what happened?", delay: 1200 },
    { text: "Thank you for reporting this. Our safety team will review this incident and take appropriate action. The driver has been flagged.", delay: 3000 },
  ],
  other: [
    { text: "I'm here to help! Please describe your issue and I'll do my best to resolve it.", delay: 1200 },
    { text: "Thank you for the details. I've escalated this to our support team. You'll receive an update within 30 minutes.", delay: 3000 },
  ],
}

export default function LiveChatSheet({ order, onClose }) {
  const [issueType, setIssueType] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [resolved, setResolved] = useState(false)
  const [typing, setTyping] = useState(false)
  const chatRef = useRef(null)
  const fileRef = useRef(null)
  const botQueueRef = useRef([])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, typing])

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), from: 'bot', text, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }])
  }

  const selectIssue = (issue) => {
    setIssueType(issue)
    // System message
    setMessages([{
      id: Date.now(),
      from: 'system',
      text: `Issue: ${issue.label} — ${issue.desc}`,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }])

    // Queue bot responses
    const responses = BOT_RESPONSES[issue.id] ?? BOT_RESPONSES.other
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      addBotMessage(responses[0].text)
      botQueueRef.current = responses.slice(1)
    }, responses[0].delay)
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text && !photoFile) return

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: text || (photoFile ? '📷 Photo attached' : ''),
      photo: photoFile ? URL.createObjectURL(photoFile) : null,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setPhotoFile(null)

    // Trigger next bot response from queue
    if (botQueueRef.current.length > 0) {
      const next = botQueueRef.current.shift()
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        addBotMessage(next.text)
        if (botQueueRef.current.length === 0) {
          // Final resolution
          setTimeout(() => {
            setResolved(true)
            addBotMessage("Is there anything else I can help with? If not, you can close this chat. Thank you for using INDOO! 💚")
          }, 2000)
        }
      }, next.delay)
    }

    // Save to localStorage
    const history = JSON.parse(localStorage.getItem('indoo_chat_history') || '[]')
    history.push({
      orderId: order?.id,
      issueType: issueType?.id,
      message: text,
      created_at: new Date().toISOString(),
    })
    localStorage.setItem('indoo_chat_history', JSON.stringify(history))
  }

  const handleQuickReply = (reply) => {
    setInput(reply)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9950, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: '#0a0a0a', borderBottom: '2px solid #8DC63F',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>INDOO Support</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {order ? `Order #${order.id}` : 'Live Chat'}
            {resolved && <span style={{ color: '#8DC63F', marginLeft: 8 }}>Resolved</span>}
          </span>
        </div>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F', boxShadow: '0 0 8px rgba(141,198,63,0.5)', animation: 'ping 2s ease-in-out infinite' }} />
      </div>

      {/* Issue type selector — shows first */}
      {!issueType && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>What went wrong?</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 20px' }}>Select an issue type so we can help you faster</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ISSUE_TYPES.map(issue => (
              <button key={issue.id} onClick={() => selectIssue(issue)} style={{
                padding: '16px', borderRadius: 16, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{issue.emoji}</span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{issue.label}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{issue.desc}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {issueType && (
        <>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                {msg.from === 'system' ? (
                  <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{msg.text}</span>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 16px', borderRadius: 18,
                    background: msg.from === 'user' ? '#8DC63F' : 'rgba(255,255,255,0.08)',
                    borderBottomRightRadius: msg.from === 'user' ? 4 : 18,
                    borderBottomLeftRadius: msg.from === 'bot' ? 4 : 18,
                  }}>
                    {msg.from === 'bot' && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F', display: 'block', marginBottom: 4 }}>INDOO Support</span>
                    )}
                    {msg.photo && (
                      <img src={msg.photo} alt="" style={{ width: '100%', maxWidth: 200, borderRadius: 12, marginBottom: 8, display: 'block' }} />
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600, color: msg.from === 'user' ? '#000' : '#fff', lineHeight: 1.5 }}>{msg.text}</span>
                    <span style={{ fontSize: 9, color: msg.from === 'user' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4, textAlign: 'right' }}>{msg.time}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 20px', borderRadius: 18, borderBottomLeftRadius: 4, background: 'rgba(255,255,255,0.08)', display: 'flex', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out infinite' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out 0.2s infinite' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'dotDance 1.4s ease-in-out 0.4s infinite' }} />
              </div>
            )}
          </div>

          {/* Quick reply chips */}
          {messages.length <= 2 && !typing && (
            <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_REPLIES.map(reply => (
                <button key={reply} onClick={() => handleQuickReply(reply)} style={{
                  padding: '8px 14px', borderRadius: 20,
                  background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.25)',
                  color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            background: 'rgba(10,10,10,0.95)',
          }}>
            {/* Photo upload */}
            <button onClick={() => fileRef.current?.click()} style={{
              width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, position: 'relative',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              {photoFile && <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: '#8DC63F', border: '2px solid #0a0a0a' }} />}
            </button>
            <input type="file" ref={fileRef} accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 24,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button onClick={sendMessage} style={{
              width: 44, height: 44, borderRadius: '50%', background: '#8DC63F',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes dotDance { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes ping { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  )
}
