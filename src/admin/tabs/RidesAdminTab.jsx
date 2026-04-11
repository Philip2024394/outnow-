import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './RidesAdminTab.module.css'

const DRIVERS = [
  { id:'dr1', name:'Budi Setiawan',  type:'bike',  status:'on_ride',   rides:342, rating:4.8, phone:'+6281234567890', area:'Jakarta Selatan', online:true,  avatar:'https://i.pravatar.cc/48?img=11' },
  { id:'dr2', name:'Rudi Hartono',   type:'taxi',  status:'available', rides:891, rating:4.9, phone:'+6281234567891', area:'Jakarta Pusat',   online:true,  avatar:'https://i.pravatar.cc/48?img=12' },
  { id:'dr3', name:'Agus Santoso',   type:'bike',  status:'available', rides:156, rating:4.6, phone:'+6281234567892', area:'Tangerang',       online:true,  avatar:'https://i.pravatar.cc/48?img=13' },
  { id:'dr4', name:'Joko Widodo',    type:'taxi',  status:'offline',   rides:203, rating:4.7, phone:'+6281234567893', area:'Bekasi',          online:false, avatar:'https://i.pravatar.cc/48?img=14' },
  { id:'dr5', name:'Siti Rahayu',    type:'bike',  status:'on_ride',   rides:78,  rating:4.5, phone:'+6281234567894', area:'Depok',           online:true,  avatar:'https://i.pravatar.cc/48?img=15' },
  { id:'dr6', name:'Wahyu Prabowo',  type:'taxi',  status:'available', rides:512, rating:4.9, phone:'+6281234567895', area:'Jakarta Barat',   online:true,  avatar:'https://i.pravatar.cc/48?img=16' },
]

const ACTIVE_RIDES = [
  { id:'r1', driver:'Budi Setiawan',  passenger:'Maya Patel',   from:'Sudirman', to:'Senayan', type:'bike', fare:'Rp 18.000', mins: 8  },
  { id:'r2', driver:'Siti Rahayu',    passenger:'Jordan Lee',   from:'Kemang',   to:'Blok M',  type:'bike', fare:'Rp 12.000', mins: 4  },
]

const STATUS_COLOR = { on_ride: '#FFB800', available: '#00FF9D', offline: 'rgba(255,255,255,0.25)' }

export default function RidesAdminTab() {
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [messages,   setMessages]   = useState({})
  const [msgInput,   setMsgInput]   = useState('')
  const [filter,     setFilter]     = useState('all')
  const [sending,    setSending]    = useState(false)
  const chatEndRef = useRef(null)

  // Load chat history for selected driver
  useEffect(() => {
    if (!selectedDriver) return
    if (messages[selectedDriver.id]) return // already loaded
    // Try Supabase, fall back to demo
    supabase.from('admin_driver_messages')
      .select('*')
      .eq('driver_id', selectedDriver.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setMessages(prev => ({ ...prev, [selectedDriver.id]: data.map(m => ({
            id: m.id, from: m.sender, text: m.text, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })) }))
        } else {
          setMessages(prev => ({
            ...prev,
            [selectedDriver.id]: [
              { id: 1, from: 'driver', text: `Hi, ${selectedDriver.name} here. Ready for duty.`, time: '09:14' },
              { id: 2, from: 'admin',  text: 'Great! Please make sure GPS is on.', time: '09:15' },
              { id: 3, from: 'driver', text: 'Confirmed, GPS is active.', time: '09:16' },
            ]
          }))
        }
      }).catch(() => {
        setMessages(prev => ({
          ...prev,
          [selectedDriver.id]: [
            { id: 1, from: 'driver', text: `Hey, ${selectedDriver.name} ready for rides.`, time: '09:00' },
          ]
        }))
      })
  }, [selectedDriver])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedDriver])

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedDriver) return
    setSending(true)
    const msg = { id: Date.now(), from: 'admin', text: msgInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

    setMessages(prev => ({
      ...prev,
      [selectedDriver.id]: [...(prev[selectedDriver.id] ?? []), msg]
    }))
    setMsgInput('')

    // Try insert to Supabase
    supabase.from('admin_driver_messages').insert({
      driver_id: selectedDriver.id,
      sender: 'admin',
      text: msg.text,
      created_at: new Date().toISOString(),
    }).catch(() => {})

    // Simulate driver reply
    setTimeout(() => {
      const replies = ['Got it!', 'Understood 👍', 'On my way.', 'Confirmed.', 'Will do, thanks!']
      const reply = { id: Date.now() + 1, from: 'driver', text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => ({ ...prev, [selectedDriver.id]: [...(prev[selectedDriver.id] ?? []), reply] }))
    }, 1200 + Math.random() * 1800)

    setSending(false)
  }

  const driverMsgs = selectedDriver ? (messages[selectedDriver.id] ?? []) : []

  const filtered = DRIVERS.filter(d => {
    if (filter === 'bike')  return d.type === 'bike'
    if (filter === 'taxi')  return d.type === 'taxi'
    if (filter === 'online') return d.online
    return true
  })

  const online     = DRIVERS.filter(d => d.online).length
  const onRide     = DRIVERS.filter(d => d.status === 'on_ride').length
  const available  = DRIVERS.filter(d => d.status === 'available').length

  return (
    <div className={styles.page}>
      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Drivers', value: DRIVERS.length, color: '#00E5FF' },
          { label: 'Online',        value: online,          color: '#00FF9D' },
          { label: 'On Ride',       value: onRide,          color: '#FFB800' },
          { label: 'Available',     value: available,       color: '#A855F7' },
          { label: 'Active Rides',  value: ACTIVE_RIDES.length, color: '#F472B6' },
        ].map(s => (
          <div key={s.label} className={styles.statChip} style={{ '--c': s.color }}>
            <span className={styles.statChipVal}>{s.value}</span>
            <span className={styles.statChipLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.mainRow}>
        {/* ── Driver list ── */}
        <div className={styles.driverPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>🚗 Drivers</span>
            <div className={styles.typeBtns}>
              {['all','bike','taxi','online'].map(f => (
                <button key={f} className={`${styles.typeBtn} ${filter === f ? styles.typeBtnActive : ''}`}
                  onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className={styles.driverList}>
            {filtered.map(d => (
              <button key={d.id} className={`${styles.driverRow} ${selectedDriver?.id === d.id ? styles.driverRowActive : ''}`}
                onClick={() => setSelectedDriver(d)}>
                <div className={styles.driverAvatarWrap}>
                  <img src={d.avatar} alt="" className={styles.driverAvatar} />
                  <span className={styles.onlineDot} style={{ background: d.online ? '#00FF9D' : 'rgba(255,255,255,0.2)', boxShadow: d.online ? '0 0 6px #00FF9D' : 'none' }} />
                </div>
                <div className={styles.driverInfo}>
                  <span className={styles.driverName}>{d.name}</span>
                  <span className={styles.driverMeta}>
                    <span className={styles.driverType}>{d.type === 'bike' ? '🏍' : '🚕'}</span>
                    {d.area} · ⭐{d.rating}
                  </span>
                </div>
                <span className={styles.driverStatus} style={{ color: STATUS_COLOR[d.status] }}>
                  {d.status.replace('_', ' ')}
                </span>
                {(messages[d.id]?.length > 0) && (
                  <span className={styles.unreadDot} />
                )}
              </button>
            ))}
          </div>

          {/* Active rides */}
          <div className={styles.activeRidesSection}>
            <div className={styles.panelTitle} style={{ padding: '12px 16px 8px', fontSize: 12 }}>⚡ Active Rides</div>
            {ACTIVE_RIDES.map(r => (
              <div key={r.id} className={styles.rideRow}>
                <div className={styles.rideInfo}>
                  <span className={styles.rideDriver}>{r.driver}</span>
                  <span className={styles.rideMeta}>{r.from} → {r.to} · {r.type === 'bike' ? '🏍' : '🚕'}</span>
                </div>
                <div className={styles.rideRight}>
                  <span className={styles.rideFare}>{r.fare}</span>
                  <span className={styles.rideMins}>{r.mins} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={styles.chatPanel}>
          {selectedDriver ? (
            <>
              <div className={styles.chatHeader}>
                <img src={selectedDriver.avatar} alt="" className={styles.chatAvatar} />
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatName}>{selectedDriver.name}</span>
                  <span className={styles.chatMeta}>
                    {selectedDriver.type === 'bike' ? '🏍 Bike' : '🚕 Taxi'} · {selectedDriver.area} ·
                    <span style={{ color: STATUS_COLOR[selectedDriver.status] }}> {selectedDriver.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <a href={`tel:${selectedDriver.phone}`} className={styles.callBtn}>📞 Call</a>
                <a href={`https://wa.me/${selectedDriver.phone.replace('+', '')}`} target="_blank" rel="noreferrer" className={styles.waBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.114 1.532 5.836L.036 23.964 6.3 22.492A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                  WhatsApp
                </a>
              </div>

              <div className={styles.chatMessages}>
                {driverMsgs.map(m => (
                  <div key={m.id} className={`${styles.bubble} ${m.from === 'admin' ? styles.bubbleAdmin : styles.bubbleDriver}`}>
                    <span className={styles.bubbleText}>{m.text}</span>
                    <span className={styles.bubbleTime}>{m.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className={styles.chatInput}>
                <input
                  className={styles.msgInput}
                  placeholder={`Message ${selectedDriver.name}…`}
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className={styles.sendBtn} onClick={sendMessage} disabled={sending || !msgInput.trim()}>
                  {sending ? '…' : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.chatEmpty}>
              <span className={styles.emptyIcon}>🚗</span>
              <p className={styles.emptyText}>Select a driver to open chat</p>
              <p className={styles.emptySub}>You can message, call, or WhatsApp any driver directly from here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
