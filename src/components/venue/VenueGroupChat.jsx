import { useState, useRef, useEffect } from 'react'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './VenueGroupChat.module.css'

const MY_USER_ID = 'me'

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function SystemMessage({ text }) {
  return <div className={styles.systemMsg}>{text}</div>
}

export default function VenueGroupChat({ venue, initialMessages = [], onClose }) {
  const { show: showIntro, dismiss: dismissIntro } = useFeatureIntro('venue_group_chat')
  const [messages, setMessages] = useState([
    { id: 'sys-1', type: 'system', text: `Welcome to ${venue.name} chat — everyone here tonight can see this` },
    ...initialMessages,
  ])
  const [text, setText]   = useState('')
  const [joined, setJoined] = useState(false)
  const bottomRef          = useRef(null)
  const inputRef           = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleJoin = () => {
    setJoined(true)
    setMessages(prev => [...prev, {
      id: `sys-join-${Date.now()}`,
      type: 'system',
      text: 'You joined the room 👋',
    }])
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || !joined) return
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      userId: MY_USER_ID,
      displayName: 'You',
      text: trimmed,
      createdAt: Date.now(),
    }])
    setText('')
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className={styles.screen}>
      {showIntro && (
        <FeatureIntro
          emoji="💬"
          title="Venue Group Chat"
          bullets={[
            'Everyone checked in here tonight can chat together',
            'Messages and photos auto-delete when the night ends',
            'Photos stay in this room — no saving, no forwarding',
            'Be kind — this is your local community for the night',
          ]}
          onDone={dismissIntro}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.headerEmoji}>{venue.emoji}</span>
          <div>
            <span className={styles.headerName}>{venue.name}</span>
            <span className={styles.headerSub}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#8DC63F', boxShadow: '0 0 6px #8DC63F', marginRight: 5, verticalAlign: 'middle' }} />
              {venue.count} {venue.count === 1 ? 'person' : 'people'} here tonight
            </span>
          </div>
        </div>
        <button className={styles.backBtn} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>

      {/* Privacy banner */}
      <div className={styles.privacyBanner}>
        🔒 Chat auto-deletes when the night ends · Photos stay in this room only
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => {
          if (msg.type === 'system') return <SystemMessage key={msg.id} text={msg.text} />
          const isMe = msg.userId === MY_USER_ID
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ''}`}>
              {!isMe && (
                <div className={styles.avatar}>
                  {msg.displayName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className={styles.bubble}>
                {!isMe && (
                  <span className={styles.senderName}>{msg.displayName}</span>
                )}
                <p className={styles.msgText}>{msg.text}</p>
                <span className={styles.msgTime}>{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Join prompt or input */}
      {!joined ? (
        <div className={styles.joinBar}>
          <p className={styles.joinText}>
            Join the room to chat with everyone at {venue.name} tonight
          </p>
          <button className={styles.joinBtn} onClick={handleJoin}>
            Join Room 👋
          </button>
        </div>
      ) : (
        <div className={styles.inputBar}>
          <input
            ref={inputRef}
            className={styles.input}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Say something to the room…"
            maxLength={300}
            autoComplete="off"
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
