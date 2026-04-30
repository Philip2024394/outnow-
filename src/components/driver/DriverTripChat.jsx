/**
 * DriverTripChat — Chat with customer during active trip.
 * Same design as LiveChatSheet (food module).
 * Profile photos beside chat bubbles. Background image.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { sendMessage, onMessagesUpdated, QUICK_REPLIES } from '@/services/driverChatService'

const CHAT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2006_12_16%20AM.png?updatedAt=1777245159090'

export default function DriverTripChat({ booking, driverId, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const chatRef = useRef(null)
  const fileRef = useRef(null)
  const passenger = booking.passenger

  useEffect(() => {
    return onMessagesUpdated(booking.id, setMessages)
  }, [booking.id])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const handleSend = async (quickText) => {
    const text = (quickText || input).trim()
    if (!text && !photoFile) return
    if (sending) return
    setSending(true)
    setInput('')
    setPhotoFile(null)
    try {
      await sendMessage(booking.id, driverId, 'driver', text || '📷 Photo attached')
    } catch {}
    setSending(false)
  }

  const handleQuickReply = (reply) => {
    setInput(reply)
  }

  const driverAvatar = (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', background: '#8DC63F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#000',
    }}>D</div>
  )

  const passengerAvatar = (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
      background: '#1a1a1a', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid rgba(141,198,63,0.3)',
    }}>
      {passenger?.photo_url
        ? <img src={passenger.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>{passenger?.display_name?.[0] ?? '?'}</span>
      }
    </div>
  )

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 100002, display: 'flex', flexDirection: 'column',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${CHAT_BG})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.82)',
      }} />

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px',
        margin: '0 8px', marginTop: 8,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(141,198,63,0.3)',
        borderRadius: 18,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        position: 'relative', overflow: 'hidden', zIndex: 2,
      }}>
        {/* Green edge glow */}
        <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.8 }} />
        </div>

        {/* Customer photo */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1a1a1a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(141,198,63,0.4)', flexShrink: 0, position: 'relative' }}>
          {passenger?.photo_url
            ? <img src={passenger.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{passenger?.display_name?.[0] ?? '?'}</span>
          }
          {/* Online dot */}
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: '#22C55E', border: '2px solid rgba(0,0,0,0.7)' }} />
        </div>

        {/* Name + status + rating */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{passenger?.display_name ?? 'Passenger'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>Online</span>
            {passenger?.rating && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', display: 'flex', alignItems: 'center', gap: 2 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FACC15" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {passenger.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Close button — green */}
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'inline-block' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No messages yet — send a message or use quick replies</span>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isDriver = msg.sender_role === 'driver'
          const isSystem = msg.text?.startsWith('📍')

          if (isSystem) {
            return (
              <div key={msg.id || i} style={{ alignSelf: 'center', maxWidth: '90%' }}>
                <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(141,198,63,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(141,198,63,0.2)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{msg.text}</span>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id || i} style={{
              display: 'flex', gap: 8,
              flexDirection: isDriver ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
            }}>
              {/* Avatar */}
              {isDriver ? driverAvatar : passengerAvatar}

              {/* Bubble */}
              <div style={{
                maxWidth: '72%',
                padding: '12px 16px', borderRadius: 18,
                background: isDriver ? '#8DC63F' : 'rgba(0,0,0,0.55)',
                backdropFilter: isDriver ? 'none' : 'blur(12px)',
                border: isDriver ? 'none' : '1px solid rgba(255,255,255,0.08)',
                borderBottomRightRadius: isDriver ? 4 : 18,
                borderBottomLeftRadius: !isDriver ? 4 : 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {!isDriver && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F', display: 'block', marginBottom: 4 }}>
                    {passenger?.display_name ?? 'Passenger'}
                  </span>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: isDriver ? '#000' : '#fff', lineHeight: 1.5 }}>
                  {msg.text}
                </span>
                <span style={{ fontSize: 9, color: isDriver ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', display: 'block', marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick reply chips */}
      {messages.length <= 5 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {QUICK_REPLIES.driver.map(reply => (
            <button key={reply} onClick={() => handleQuickReply(reply)} style={{
              padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(141,198,63,0.3)',
              color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
        position: 'relative', zIndex: 2,
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
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="Type your message..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button onClick={() => handleSend()} style={{
          width: 44, height: 44, borderRadius: '50%', background: '#8DC63F',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }
        @keyframes ping { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  )
}
