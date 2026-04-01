import { useState } from 'react'
import { DEMO_CONVERSATIONS } from '@/demo/mockData'
import ChatWindow from '@/components/chat/ChatWindow'
import styles from './ChatScreen.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'



function timeAgo(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function ChatScreen() {
  const [conversations, setConversations] = useState(
    IS_DEMO ? DEMO_CONVERSATIONS : []
  )
  const [openConv, setOpenConv] = useState(null)

  const handleSendMessage = (convId, text) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c
      const newMsg = { id: `m-${Date.now()}`, fromMe: true, text, time: Date.now() }
      return {
        ...c,
        status: c.status === 'free' ? 'pending' : c.status,
        messages: [...c.messages, newMsg],
        lastMessage: text,
        lastMessageTime: Date.now(),
      }
    }))
  }

  const handleUnlock = (convId) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, status: 'unlocked', unread: 0 } : c
    ))
  }

  if (openConv) {
    const conv = conversations.find(c => c.id === openConv)
    return (
      <ChatWindow
        conversation={conv}
        onBack={() => setOpenConv(null)}
        onSend={(text) => handleSendMessage(conv.id, text)}
        onUnlock={() => handleUnlock(conv.id)}
      />
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Messages</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.scroll}>
        {conversations.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💬</span>
            <p className={styles.emptyText}>No messages yet</p>
            <p className={styles.emptySub}>Connect with people out now to start chatting</p>
          </div>
        )}

        {conversations.map(conv => (
          <button
            key={conv.id}
            className={styles.convRow}
            onClick={() => setOpenConv(conv.id)}
          >
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {conv.photoURL
                  ? <img src={conv.photoURL} alt={conv.displayName} className={styles.avatarImg} />
                  : <span className={styles.avatarEmoji}>{conv.emoji}</span>
                }
              </div>
              {conv.online && <span className={styles.onlineDot} />}
            </div>

            {/* Info */}
            <div className={styles.convInfo}>
              <div className={styles.convTop}>
                <span className={styles.convName}>{conv.displayName}</span>
                <span className={styles.convTime}>{timeAgo(conv.lastMessageTime)}</span>
              </div>
              <div className={styles.convBottom}>
                <span className={`${styles.convPreview} ${conv.status === 'locked' ? styles.locked : ''}`}>
                  {conv.status === 'locked' && <span className={styles.lockIcon}>🔒</span>}
                  {conv.lastMessage ?? 'Send the first message — it\'s free!'}
                </span>
                {conv.unread > 0 && conv.status !== 'locked' && (
                  <span className={styles.unreadBadge}>{conv.unread}</span>
                )}
                {conv.status === 'locked' && (
                  <span className={styles.lockBadge}>Unlock</span>
                )}
                {conv.status === 'free' && (
                  <span className={styles.freeBadge}>FREE</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
