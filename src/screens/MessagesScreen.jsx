import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CHAT_KEY = 'indoo_chat_history'

function getChatHistory() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') }
  catch { return [] }
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

/* ── Green Glow Line ── */
function GlowLine() {
  return (
    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />
  )
}

export default function MessagesScreen({ open, onClose, onOpenChat }) {
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    if (open) {
      setConversations(getChatHistory())
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>14</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>MESSAGES</span></div>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Messages</span>
          {conversations.length > 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(141,198,63,0.12)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>{conversations.length}</span>
          )}
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {conversations.length === 0 ? (
          <div style={{
            position: 'relative', textAlign: 'center', padding: '60px 24px',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20, overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
            marginTop: 40,
          }}>
            <GlowLine />
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No Messages Yet</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Start a conversation by chatting with a listing owner</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conversations.map((conv, i) => (
              <button
                key={conv.listingId || i}
                onClick={() => onOpenChat && onOpenChat(conv.listing || conv)}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(141,198,63,0.08)',
                  borderRadius: 20, cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                {/* Green glow line at top */}
                <GlowLine />

                {/* Circular image with green border */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)', flexShrink: 0,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(141,198,63,0.25)',
                  boxShadow: '0 0 10px rgba(141,198,63,0.1)',
                }}>
                  {conv.image ? (
                    <img src={conv.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>

                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {conv.title || conv.sellerName || 'Chat'}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, flexShrink: 0 }}>
                      {timeAgo(conv.lastMessageTime || conv.updatedAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {conv.lastMessage || 'No messages yet'}
                  </div>
                </div>

                {/* Unread green dot */}
                {conv.unread && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#8DC63F', flexShrink: 0,
                    boxShadow: '0 0 8px rgba(141,198,63,0.5)',
                  }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
