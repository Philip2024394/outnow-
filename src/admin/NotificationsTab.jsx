import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdminDashboard.module.css'

const TYPE_EMOJI = {
  date_invite:   '💕',
  date_accepted: '🎉',
  wave:          '👋',
  like:          '💚',
  message:       '💬',
  ride:          '🏍️',
  ride_accepted: '✅',
  system:        '🛡️',
  digest:        '📅',
  connect:       '🤝',
  match:         '🤝',
  gift:          '🎁',
}

const TYPE_FILTER = ['all', 'date_invite', 'date_accepted', 'wave', 'like', 'message', 'ride', 'system']

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsTab() {
  const [notifs,      setNotifs]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [testTitle,   setTestTitle]   = useState('')
  const [testBody,    setTestBody]    = useState('')
  const [testUserId,  setTestUserId]  = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testSent,    setTestSent]    = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase
      .from('notifications')
      .select('*, from_profile:profiles!from_user_id(display_name), user_profile:profiles!user_id(display_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setNotifs(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = typeFilter === 'all'
    ? notifs
    : notifs.filter(n => n.type === typeFilter)

  const unreadCount = notifs.filter(n => !n.read).length

  const handleSendTest = async () => {
    if (!supabase || !testTitle || !testUserId) return
    setTestSending(true)
    await supabase.from('notifications').insert({
      id:         `NOTIF_TEST_${Date.now()}`,
      user_id:    testUserId.trim(),
      type:       'system',
      title:      testTitle.trim(),
      body:       testBody.trim() || null,
      read:       false,
      created_at: new Date().toISOString(),
    })
    setTestSending(false)
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  return (
    <div className={styles.tabContent}>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderTopColor: '#8DC63F' }}>
          <span className={styles.statLabel}>Total Sent</span>
          <span className={styles.statValue}>{notifs.length}</span>
          <span className={styles.statSub}>last 100</span>
        </div>
        <div className={styles.statCard} style={{ borderTopColor: '#E8458C' }}>
          <span className={styles.statLabel}>Unread</span>
          <span className={styles.statValue}>{unreadCount}</span>
          <span className={styles.statSub}>awaiting users</span>
        </div>
        <div className={styles.statCard} style={{ borderTopColor: '#F5A623' }}>
          <span className={styles.statLabel}>Date Invites</span>
          <span className={styles.statValue}>{notifs.filter(n => n.type === 'date_invite').length}</span>
          <span className={styles.statSub}>sent via dating</span>
        </div>
        <div className={styles.statCard} style={{ borderTopColor: '#A855F7' }}>
          <span className={styles.statLabel}>Ride Alerts</span>
          <span className={styles.statValue}>{notifs.filter(n => n.type === 'ride' || n.type === 'ride_accepted').length}</span>
          <span className={styles.statSub}>hangger rides</span>
        </div>
      </div>

      {/* Send test notification */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Send Test Notification</h3>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="User ID (UUID)"
            value={testUserId}
            onChange={e => setTestUserId(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Title"
            value={testTitle}
            onChange={e => setTestTitle(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Body (optional)"
            value={testBody}
            onChange={e => setTestBody(e.target.value)}
          />
          <button
            className={styles.btn}
            disabled={testSending || !testTitle || !testUserId}
            onClick={handleSendTest}
          >
            {testSent ? '✓ Sent' : testSending ? 'Sending…' : 'Send'}
          </button>
        </div>
        {!supabase && (
          <p className={styles.tdMuted} style={{ marginTop: 8, fontSize: 12 }}>
            Demo mode — connect Supabase to send real notifications
          </p>
        )}
      </div>

      {/* Filter pills */}
      <div className={styles.section}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {TYPE_FILTER.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={styles.pill}
              style={{
                cursor: 'pointer',
                background: typeFilter === t ? '#8DC63F' : 'transparent',
                color: typeFilter === t ? '#000' : '#aaa',
                border: `1px solid ${typeFilter === t ? '#8DC63F' : '#333'}`,
                padding: '4px 12px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {TYPE_EMOJI[t] ?? '🔔'} {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.tdMuted}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.tdMuted}>No notifications found</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>To</th>
                <th>From</th>
                <th>Title</th>
                <th>Body</th>
                <th>Read</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => (
                <tr key={n.id} style={{ opacity: n.read ? 0.55 : 1 }}>
                  <td>{TYPE_EMOJI[n.type] ?? '🔔'} {n.type}</td>
                  <td className={styles.tdBold}>{n.user_profile?.display_name ?? n.user_id?.slice(0, 8)}</td>
                  <td className={styles.tdMuted}>{n.from_profile?.display_name ?? '—'}</td>
                  <td>{n.title}</td>
                  <td className={styles.tdMuted} style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body ?? '—'}</td>
                  <td>{n.read ? '✓' : <span style={{ color: '#8DC63F', fontWeight: 700 }}>●</span>}</td>
                  <td className={styles.tdMuted}>{timeAgo(n.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
