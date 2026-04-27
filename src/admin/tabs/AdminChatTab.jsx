/**
 * AdminChatTab — Admin access to any user's chat + send messages as admin or impersonate
 */
import { useState, useRef, useEffect } from 'react'

const DEMO_USERS = [
  { id: 'u1', name: 'Ava Mitchell', type: 'user', photo: 'https://i.pravatar.cc/40?img=1' },
  { id: 'u2', name: 'Jordan Lee', type: 'user', photo: 'https://i.pravatar.cc/40?img=2' },
  { id: 'd1', name: 'Agus Prasetyo', type: 'driver', photo: 'https://i.pravatar.cc/40?img=12', vehicle_type: 'bike_ride' },
  { id: 'd2', name: 'Budi Santoso', type: 'driver', photo: 'https://i.pravatar.cc/40?img=15', vehicle_type: 'car_taxi' },
  { id: 'v1', name: 'Warung Bu Sari', type: 'vendor', photo: 'https://i.pravatar.cc/40?img=20' },
  { id: 'v2', name: 'Bakso Pak Budi', type: 'vendor', photo: 'https://i.pravatar.cc/40?img=25' },
]

const DEMO_MESSAGES = {
  u1: [
    { id: 1, from: 'u1', text: 'Hi, my order is late', time: '14:20' },
    { id: 2, from: 'admin', text: 'Sorry about that. Let me check with the driver.', time: '14:21' },
    { id: 3, from: 'u1', text: 'It\'s been 45 minutes already', time: '14:22' },
  ],
  d1: [
    { id: 1, from: 'd1', text: 'I\'m stuck in traffic on Malioboro', time: '14:15' },
    { id: 2, from: 'admin', text: 'Customer is waiting. Please update ETA.', time: '14:16' },
  ],
}

export default function AdminChatTab() {
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState({})
  const [input, setInput] = useState('')
  const [sendAs, setSendAs] = useState('admin') // 'admin' | 'user' | 'driver' | 'vendor' | 'system'
  const [search, setSearch] = useState('')
  const chatRef = useRef(null)

  useEffect(() => { setMessages(DEMO_MESSAGES) }, [])
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages, selectedUser])

  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return
    const userMsgs = messages[selectedUser.id] ?? []
    const newMsg = {
      id: Date.now(),
      from: sendAs,
      fromLabel: sendAs === 'admin' ? 'INDOO Admin' : sendAs === 'system' ? 'System' : selectedUser.name,
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      impersonated: sendAs !== 'admin' && sendAs !== 'system',
    }
    setMessages(prev => ({ ...prev, [selectedUser.id]: [...userMsgs, newMsg] }))
    setInput('')
  }

  const filteredUsers = DEMO_USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
  const currentMessages = selectedUser ? (messages[selectedUser.id] ?? []) : []

  const typeColors = { user: '#3B82F6', driver: '#8DC63F', vendor: '#FACC15', admin: '#EF4444', system: '#888' }

  return (
    <div style={{ padding: 28, display: 'flex', gap: 20, height: 'calc(100vh - 80px)' }}>

      {/* User list */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>💬 All Chats</h3>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredUsers.map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u)} style={{
              width: '100%', padding: '10px 12px', border: 'none', cursor: 'pointer',
              background: selectedUser?.id === u.id ? 'rgba(141,198,63,0.1)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
            }}>
              <img src={u.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${typeColors[u.type]}` }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block' }}>{u.type === 'driver' ? (u.vehicle_type === 'car_taxi' ? '🚕 ' : '🏍 ') : ''}{u.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: typeColors[u.type], textTransform: 'uppercase' }}>{u.type}</span>
              </div>
              {(messages[u.id]?.length ?? 0) > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{messages[u.id].length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {!selectedUser ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Select a user to view their chat</span>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={selectedUser.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{selectedUser.name}</span>
                <span style={{ fontSize: 10, color: typeColors[selectedUser.type], fontWeight: 700, marginLeft: 8, textTransform: 'uppercase' }}>{selectedUser.type}</span>
                {selectedUser.type === 'driver' && selectedUser.vehicle_type && (
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginLeft: 8 }}>{selectedUser.vehicle_type === 'car_taxi' ? '🚕 Car Taxi' : '🏍 Bike Ride'}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentMessages.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.from === 'admin' || msg.from === 'system' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14,
                    background: msg.from === 'admin' ? '#8DC63F' : msg.from === 'system' ? 'rgba(255,255,255,0.1)' : msg.impersonated ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.06)',
                    borderBottomRightRadius: (msg.from === 'admin' || msg.from === 'system') ? 4 : 14,
                    borderBottomLeftRadius: (msg.from !== 'admin' && msg.from !== 'system') ? 4 : 14,
                  }}>
                    {msg.impersonated && <span style={{ fontSize: 9, color: '#EF4444', fontWeight: 800, display: 'block', marginBottom: 4 }}>IMPERSONATED</span>}
                    <span style={{ fontSize: 13, color: msg.from === 'admin' ? '#000' : '#fff', fontWeight: 600 }}>{msg.text}</span>
                    <span style={{ fontSize: 9, color: msg.from === 'admin' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4, textAlign: 'right' }}>{msg.time} · {msg.fromLabel ?? msg.from}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Send as selector + input */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, lineHeight: '28px' }}>Send as:</span>
                {['admin', selectedUser.type, 'system'].map(role => (
                  <button key={role} onClick={() => setSendAs(role)} style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: sendAs === role ? typeColors[role] ?? '#888' : 'rgba(255,255,255,0.06)',
                    color: sendAs === role ? '#000' : 'rgba(255,255,255,0.5)',
                    border: sendAs === role ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    textTransform: 'capitalize',
                  }}>
                    {role}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage() }} placeholder="Type message..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none' }} />
                <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Send</button>
              </div>
              {sendAs !== 'admin' && sendAs !== 'system' && (
                <span style={{ fontSize: 10, color: '#EF4444', marginTop: 6, display: 'block' }}>⚠️ Impersonation mode — message will appear as if sent by {selectedUser.name}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
