import { useState, useRef, useEffect } from 'react'
import styles from './MessagesTab.module.css'

// ── Demo contacts across all sections ─────────────────────────────────────────
const ALL_CONTACTS = [
  // Dating
  { id:'c1',  name:'Aria Santoso',     category:'dating',     avatar:'https://i.pravatar.cc/48?img=1',  city:'Jakarta',  sub:'Looking for dating',      online:true  },
  { id:'c2',  name:'Bima Wicaksono',   category:'dating',     avatar:'https://i.pravatar.cc/48?img=2',  city:'Surabaya', sub:'Looking for marriage',     online:false },
  { id:'c3',  name:'Citra Dewi',       category:'dating',     avatar:'https://i.pravatar.cc/48?img=3',  city:'Bali',     sub:'Looking for friendship',   online:true  },
  { id:'c4',  name:'Dian Permata',     category:'dating',     avatar:'https://i.pravatar.cc/48?img=4',  city:'Jakarta',  sub:'Looking for date night',   online:true  },
  // Market
  { id:'c5',  name:'Eko Prasetyo',     category:'market',     avatar:'https://i.pravatar.cc/48?img=5',  city:'Bandung',  sub:'Seller · Fashion',         online:false },
  { id:'c6',  name:'Farah Indah',      category:'market',     avatar:'https://i.pravatar.cc/48?img=6',  city:'Lombok',   sub:'Seller · Handmade',        online:true  },
  { id:'c7',  name:'Galuh Pertiwi',    category:'market',     avatar:'https://i.pravatar.cc/48?img=7',  city:'Jakarta',  sub:'Seller · Electronics',     online:true  },
  // Restaurants
  { id:'c8',  name:'Warung Bu Sari',   category:'food',       avatar:'https://picsum.photos/seed/warung/48', city:'Yogyakarta', sub:'Pending approval',   online:false },
  { id:'c9',  name:'Bakso Pak Budi',   category:'food',       avatar:'https://picsum.photos/seed/bakso/48',  city:'Sleman',     sub:'Approved · Open',    online:true  },
  { id:'c10', name:'Ayam Geprek Rina', category:'food',       avatar:'https://picsum.photos/seed/geprek/48', city:'Bantul',     sub:'Approved · Closed',   online:true  },
  // Bike drivers
  { id:'c11', name:'Budi Setiawan',    category:'bike',       avatar:'https://i.pravatar.cc/48?img=11', city:'Jakarta Selatan', sub:'🏍 Bike · On Ride',  online:true  },
  { id:'c12', name:'Agus Santoso',     category:'bike',       avatar:'https://i.pravatar.cc/48?img=13', city:'Tangerang',       sub:'🏍 Bike · Available', online:true  },
  { id:'c13', name:'Siti Rahayu',      category:'bike',       avatar:'https://i.pravatar.cc/48?img=15', city:'Depok',           sub:'🏍 Bike · On Ride',   online:true  },
  // Taxi/Car drivers
  { id:'c14', name:'Rudi Hartono',     category:'taxi',       avatar:'https://i.pravatar.cc/48?img=12', city:'Jakarta Pusat',  sub:'🚕 Taxi · Available',  online:true  },
  { id:'c15', name:'Joko Widodo',      category:'taxi',       avatar:'https://i.pravatar.cc/48?img=14', city:'Bekasi',         sub:'🚕 Taxi · Offline',    online:false },
  { id:'c16', name:'Wahyu Prabowo',    category:'taxi',       avatar:'https://i.pravatar.cc/48?img=16', city:'Jakarta Barat',  sub:'🚕 Taxi · Available',  online:true  },
  // Public users
  { id:'c17', name:'Maya Patel',       category:'public',     avatar:'https://i.pravatar.cc/48?img=20', city:'Jakarta',  sub:'Public user',              online:true  },
  { id:'c18', name:'Jordan Lee',       category:'public',     avatar:'https://i.pravatar.cc/48?img=21', city:'Jakarta',  sub:'Public user',              online:false },
  { id:'c19', name:'Kai Thompson',     category:'public',     avatar:'https://i.pravatar.cc/48?img=22', city:'Depok',    sub:'Public user',              online:true  },
  { id:'c20', name:'Priya Sharma',     category:'public',     avatar:'https://i.pravatar.cc/48?img=23', city:'Jakarta',  sub:'Public user',              online:true  },
]

const CATS = [
  { id:'all',    label:'All',          icon:'💬', color:'#00E5FF' },
  { id:'dating', label:'Dating',       icon:'💕', color:'#F472B6' },
  { id:'market', label:'Marketplace',  icon:'🛍️', color:'#A855F7' },
  { id:'food',   label:'Restaurants',  icon:'🍽️', color:'#F97316' },
  { id:'bike',   label:'Bike Riders',  icon:'🏍', color:'#FFB800' },
  { id:'taxi',   label:'Taxi/Car',     icon:'🚕', color:'#00E5FF' },
  { id:'public', label:'Public Users', icon:'👤', color:'#00FF9D' },
]

const CAT_COLOR = Object.fromEntries(CATS.map(c => [c.id, c.color]))

// Seed demo messages per contact
function seedMessages(contact) {
  return [
    { id:1, from:'contact', text:`Hi, this is ${contact.name.split(' ')[0]}.`, time:'09:00' },
    { id:2, from:'admin',   text:'Hello! How can we help you today?',           time:'09:01' },
    { id:3, from:'contact', text:'I have a question about my account.',          time:'09:02' },
  ]
}

export default function MessagesTab() {
  const [category,        setCategory]        = useState('all')
  const [search,          setSearch]          = useState('')
  const [selected,        setSelected]        = useState(null)
  const [allMessages,     setAllMessages]     = useState({})
  const [input,           setInput]           = useState('')
  const [blastMode,       setBlastMode]       = useState(false)
  const [blastText,       setBlastText]       = useState('')
  const [blastSelected,   setBlastSelected]   = useState(new Set())
  const [blastSent,       setBlastSent]       = useState(false)
  const [toast,           setToast]           = useState(null)
  const chatEndRef = useRef(null)

  // Load demo messages when contact selected
  useEffect(() => {
    if (!selected) return
    if (allMessages[selected.id]) return
    setAllMessages(p => ({ ...p, [selected.id]: seedMessages(selected) }))
  }, [selected])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages, selected])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const sendMessage = () => {
    if (!input.trim() || !selected) return
    const msg = { id: Date.now(), from: 'admin', text: input.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }
    setAllMessages(p => ({ ...p, [selected.id]: [...(p[selected.id] ?? []), msg] }))
    setInput('')
    // Simulate reply after delay
    setTimeout(() => {
      const replies = ['Got it, thanks!', 'Understood 👍', 'OK, I will check.', 'Thank you for the info!', 'Noted!']
      const reply = { id: Date.now()+1, from: 'contact', text: replies[Math.floor(Math.random()*replies.length)], time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }
      setAllMessages(p => ({ ...p, [selected.id]: [...(p[selected.id] ?? []), reply] }))
    }, 1000 + Math.random() * 2000)
  }

  const sendBlast = () => {
    if (!blastText.trim() || blastSelected.size === 0) return
    const targets = blastMode === 'category'
      ? filtered
      : ALL_CONTACTS.filter(c => blastSelected.has(c.id))
    const msg = { id: Date.now(), from: 'admin', text: blastText.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) }
    const updates = {}
    targets.forEach(c => { updates[c.id] = [...(allMessages[c.id] ?? seedMessages(c)), msg] })
    setAllMessages(p => ({ ...p, ...updates }))
    setBlastText('')
    setBlastSelected(new Set())
    setBlastSent(true)
    setTimeout(() => setBlastSent(false), 2000)
    showToast(`✅ Message sent to ${targets.length} ${category === 'all' ? 'users' : CATS.find(c=>c.id===category)?.label}`)
    setBlastMode(false)
  }

  const filtered = ALL_CONTACTS.filter(c => {
    if (category !== 'all' && c.category !== category) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const msgs = selected ? (allMessages[selected.id] ?? []) : []
  const activeCat = CATS.find(c => c.id === category)
  const unread = (id) => (allMessages[id]?.filter(m => m.from === 'contact').length ?? 0)

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>
      )}

      {/* ── Left panel ── */}
      <div className={styles.left}>
        {/* Category tabs */}
        <div className={styles.catTabs}>
          {CATS.map(c => (
            <button key={c.id}
              className={`${styles.catTab} ${category === c.id ? styles.catTabActive : ''}`}
              style={category === c.id ? { color: c.color, borderBottomColor: c.color } : {}}
              onClick={() => { setCategory(c.id); setSelected(null) }}
              title={c.label}>
              <span>{c.icon}</span>
              <span className={styles.catTabLabel}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Search + Blast toggle */}
        <div className={styles.leftToolbar}>
          <input className={styles.search} placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
          <button
            className={`${styles.blastBtn} ${blastMode ? styles.blastBtnActive : ''}`}
            onClick={() => { setBlastMode(m => !m); setBlastSelected(new Set()) }}
            title="Blast message to multiple users">
            📢
          </button>
        </div>

        {/* Select-all for blast */}
        {blastMode && (
          <div className={styles.blastBar}>
            <button className={styles.selectAllBtn} onClick={() => {
              if (blastSelected.size === filtered.length) setBlastSelected(new Set())
              else setBlastSelected(new Set(filtered.map(c => c.id)))
            }}>
              {blastSelected.size === filtered.length ? '☑ Deselect All' : `☐ Select All ${activeCat?.label ?? ''}`}
            </button>
            <span className={styles.blastCount}>{blastSelected.size} selected</span>
          </div>
        )}

        {/* Contact list */}
        <div className={styles.contactList}>
          {filtered.length === 0 && <div className={styles.empty}>No contacts found</div>}
          {filtered.map(c => {
            const lastMsg = allMessages[c.id]?.slice(-1)[0]
            const isSelected = selected?.id === c.id
            const isChecked  = blastSelected.has(c.id)
            return (
              <div key={c.id}
                className={`${styles.contactRow} ${isSelected && !blastMode ? styles.contactRowActive : ''} ${isChecked ? styles.contactRowChecked : ''}`}
                style={isChecked ? { background: `${CAT_COLOR[c.category]}10`, borderColor: `${CAT_COLOR[c.category]}30` } : {}}
                onClick={() => {
                  if (blastMode) {
                    setBlastSelected(p => { const n = new Set(p); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })
                  } else {
                    setSelected(c)
                  }
                }}>
                {blastMode && (
                  <div className={styles.checkBox} style={{ borderColor: isChecked ? CAT_COLOR[c.category] : 'rgba(255,255,255,0.2)', background: isChecked ? CAT_COLOR[c.category] : 'transparent' }}>
                    {isChecked && '✓'}
                  </div>
                )}
                <div className={styles.avatarWrap}>
                  <img src={c.avatar} className={styles.avatar} alt="" />
                  <span className={styles.onlineDot} style={{ background: c.online ? '#00FF9D' : 'rgba(255,255,255,0.15)', boxShadow: c.online ? '0 0 5px #00FF9D' : 'none' }} />
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactTop}>
                    <span className={styles.contactName}>{c.name}</span>
                    <span className={styles.catBadge} style={{ color: CAT_COLOR[c.category], background: CAT_COLOR[c.category] + '15', borderColor: CAT_COLOR[c.category] + '30' }}>
                      {CATS.find(x => x.id === c.category)?.icon}
                    </span>
                  </div>
                  <span className={styles.contactSub}>{lastMsg ? lastMsg.text : c.sub}</span>
                </div>
                {unread(c.id) > 0 && !blastMode && (
                  <span className={styles.unreadBadge}>{unread(c.id)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.right}>
        {blastMode ? (
          /* ── Blast compose panel ── */
          <div className={styles.blastPanel}>
            <div className={styles.blastHeader}>
              <span className={styles.blastTitle}>📢 Blast Message</span>
              <button className={styles.blastClose} onClick={() => { setBlastMode(false); setBlastSelected(new Set()) }}>✕ Cancel</button>
            </div>
            <div className={styles.blastRecipients}>
              {blastSelected.size === 0
                ? <span className={styles.blastNone}>No recipients selected — check contacts on the left</span>
                : Array.from(blastSelected).map(id => {
                    const c = ALL_CONTACTS.find(x => x.id === id)
                    if (!c) return null
                    return (
                      <span key={id} className={styles.recipientChip} style={{ borderColor: CAT_COLOR[c.category] + '40', color: CAT_COLOR[c.category] }}>
                        {c.name}
                        <button onClick={() => setBlastSelected(p => { const n = new Set(p); n.delete(id); return n })}>×</button>
                      </span>
                    )
                  })
              }
            </div>
            <textarea
              className={styles.blastTextarea}
              value={blastText}
              onChange={e => setBlastText(e.target.value)}
              placeholder="Type your message to send to all selected users…"
              rows={6}
            />
            <div className={styles.blastFooter}>
              <span className={styles.blastInfo}>
                Sending to <b>{blastSelected.size}</b> user{blastSelected.size !== 1 ? 's' : ''}
              </span>
              <button
                className={styles.blastSendBtn}
                disabled={blastSelected.size === 0 || !blastText.trim() || blastSent}
                onClick={sendBlast}>
                {blastSent ? '✓ Sent!' : `📢 Send to ${blastSelected.size} users`}
              </button>
            </div>
          </div>
        ) : selected ? (
          /* ── Chat panel ── */
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.avatarWrap}>
                  <img src={selected.avatar} className={styles.chatAvatar} alt="" />
                  <span className={styles.onlineDot} style={{ background: selected.online ? '#00FF9D' : 'rgba(255,255,255,0.15)', boxShadow: selected.online ? '0 0 5px #00FF9D' : 'none', width:10, height:10 }} />
                </div>
                <div>
                  <div className={styles.chatName}>{selected.name}</div>
                  <div className={styles.chatMeta}>
                    <span className={styles.catBadge} style={{ color: CAT_COLOR[selected.category], background: CAT_COLOR[selected.category] + '15', borderColor: CAT_COLOR[selected.category] + '30' }}>
                      {CATS.find(c => c.id === selected.category)?.icon} {CATS.find(c => c.id === selected.category)?.label}
                    </span>
                    <span className={styles.chatCity}>📍 {selected.city}</span>
                    <span style={{ color: selected.online ? '#00FF9D' : 'rgba(255,255,255,0.3)', fontSize:11 }}>{selected.online ? '● Online' : '● Offline'}</span>
                  </div>
                </div>
              </div>
              <div className={styles.chatHeaderRight}>
                <button className={styles.blastOneBtn}
                  onClick={() => { setBlastMode(true); setBlastSelected(new Set([selected.id])) }}>
                  📢 Blast
                </button>
              </div>
            </div>

            <div className={styles.chatMessages}>
              {msgs.map(m => (
                <div key={m.id} className={`${styles.bubble} ${m.from === 'admin' ? styles.bubbleAdmin : styles.bubbleContact}`}>
                  <span className={styles.bubbleText}>{m.text}</span>
                  <span className={styles.bubbleTime}>{m.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className={styles.chatInput}>
              <input
                className={styles.msgInput}
                placeholder={`Message ${selected.name}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim()}>➤</button>
            </div>
          </>
        ) : (
          /* ── Empty state ── */
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p className={styles.emptyTitle}>Admin Messaging</p>
            <p className={styles.emptySub}>Select any user, driver, restaurant, or listing to start a conversation. Use 📢 to blast a message to an entire category.</p>
            <div className={styles.emptyCats}>
              {CATS.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} className={styles.emptyCatBtn} style={{ borderColor: c.color + '40', color: c.color }}
                  onClick={() => setCategory(c.id)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
