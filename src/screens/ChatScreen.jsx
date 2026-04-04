import { useState, useEffect } from 'react'
import { useConversations } from '@/hooks/useConversations'
import ChatWindow from '@/components/chat/ChatWindow'
import styles from './ChatScreen.module.css'

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

export default function ChatScreen({ onClose, pendingConv, openConvId }) {
  const { conversations, updateConversation } = useConversations()
  // Initialise directly from pendingConv so we never wait for a useEffect render cycle
  const [openConv, setOpenConv] = useState(pendingConv?.id ?? openConvId ?? null)

  // Always keep pendingConv in the list — survives any setConversations overwrite
  const allConvs = (() => {
    if (!pendingConv) return conversations
    if (conversations.some(c => c.id === pendingConv.id)) return conversations
    return [pendingConv, ...conversations]
  })()

  // Sync openConv if pendingConv changes after mount
  useEffect(() => {
    if (!pendingConv) return
    setOpenConv(pendingConv.id)
  }, [pendingConv]) // eslint-disable-line

  // Auto-open when new locked conv arrives (someone messaged us)
  useEffect(() => {
    const locked = allConvs.find(c => c.status === 'locked' && c.unread > 0)
    if (locked && !openConv) setOpenConv(locked.id)
  }, [allConvs]) // eslint-disable-line

  if (openConv) {
    const conv = allConvs.find(c => c.id === openConv)
    if (conv) return (
      <ChatWindow
        conversation={conv}
        onBack={() => setOpenConv(null)}
        onConvUpdate={(updates) => updateConversation(conv.id, updates)}
      />
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Messages</span>
        <button className={styles.homeBtn} onClick={onClose} aria-label="Home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>

      <div className={styles.scroll}>
        {/* 30-day history notice */}
        <div className={styles.expiryNotice}>
          <span className={styles.expiryIcon}>⏳</span>
          <span className={styles.expiryText}>Chat history is saved for <strong>30 days</strong> after unlock — save any contact details you want to keep before they expire.</span>
        </div>

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
                  : <span className={styles.avatarEmoji}>{conv.emoji ?? '💬'}</span>
                }
              </div>
              {conv.sessionStatus && (
                <span className={[
                  styles.statusDot,
                  conv.sessionStatus === 'active' || conv.sessionStatus === 'live' ? styles.dotLive :
                  conv.sessionStatus === 'invite_out' ? styles.dotInvite : styles.dotLater
                ].join(' ')} />
              )}
            </div>

            {/* Info */}
            <div className={styles.convInfo}>
              <div className={styles.convTop}>
                <span className={styles.convName}>{conv.displayName}</span>
                <span className={styles.convTime}>{timeAgo(conv.lastMessageTime)}</span>
              </div>
              <div className={styles.convBottom}>
                <span className={styles.convPreview}>
                  {conv.lastMessage ?? "Say hi — chat is free!"}
                </span>
                {conv.unread > 0 && (
                  <span className={styles.unreadBadge}>{conv.unread}</span>
                )}
                {conv.status !== 'unlocked' && !conv.unread && (
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
