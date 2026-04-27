import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ui/ImageUpload'
import styles from './RidesAdminTab.module.css'

const INIT_DRIVERS = [
  { id:'dr1', name:'Budi Setiawan',  type:'bike',  status:'on_ride',   rides:342, rating:4.8, phone:'+6281234567890', area:'Jakarta Selatan', online:true,  avatar:'https://i.pravatar.cc/48?img=11', vehicle:'Honda Beat 2022',        plateNo:'B 1234 XYZ', licenseId:'SIM-A-001', lat:-6.2100, lng:106.8500, address:'Jl. Fatmawati Raya No.12, Cilandak' },
  { id:'dr2', name:'Rudi Hartono',   type:'taxi',  status:'available', rides:891, rating:4.9, phone:'+6281234567891', area:'Jakarta Pusat',   online:true,  avatar:'https://i.pravatar.cc/48?img=12', vehicle:'Toyota Avanza 2021',     plateNo:'B 5678 ABC', licenseId:'SIM-B-002', lat:-6.1900, lng:106.8200, address:'Jl. Sudirman Kav.52, Senayan' },
  { id:'dr3', name:'Agus Santoso',   type:'bike',  status:'available', rides:156, rating:4.6, phone:'+6281234567892', area:'Tangerang',       online:true,  avatar:'https://i.pravatar.cc/48?img=13', vehicle:'Yamaha Vario 2023',      plateNo:'T 9012 DEF', licenseId:'SIM-A-003', lat:-6.2400, lng:106.8100, address:'Jl. MH Thamrin No.5, Tangerang' },
  { id:'dr4', name:'Joko Widodo',    type:'taxi',  status:'offline',   rides:203, rating:4.7, phone:'+6281234567893', area:'Bekasi',          online:false, avatar:'https://i.pravatar.cc/48?img=14', vehicle:'Daihatsu Xenia 2020',    plateNo:'B 3456 GHI', licenseId:'SIM-B-004', lat:-6.2615, lng:106.9920, address:'Jl. Kalimalang Raya No.88, Bekasi' },
  { id:'dr5', name:'Siti Rahayu',    type:'bike',  status:'on_ride',   rides:78,  rating:4.5, phone:'+6281234567894', area:'Depok',           online:true,  avatar:'https://i.pravatar.cc/48?img=15', vehicle:'Honda Scoopy 2022',      plateNo:'D 7890 JKL', licenseId:'SIM-A-005', lat:-6.3700, lng:106.8300, address:'Jl. Margonda Raya No.200, Depok' },
  { id:'dr6', name:'Wahyu Prabowo',  type:'taxi',  status:'available', rides:512, rating:4.9, phone:'+6281234567895', area:'Jakarta Barat',   online:true,  avatar:'https://i.pravatar.cc/48?img=16', vehicle:'Mitsubishi Xpander 2023', plateNo:'B 2345 MNO', licenseId:'SIM-B-006', lat:-6.1800, lng:106.7500, address:'Jl. Daan Mogot No.117, Cengkareng' },
]

// ── Mini map for selected driver ──────────────────────────────────────────────
function DriverMiniMap({ driver }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || !driver.lat) return
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }

    import('leaflet').then(mod => {
      const L = mod.default
      if (!mapRef.current || instanceRef.current) return
      const map = L.map(mapRef.current, {
        center: [driver.lat, driver.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      })

      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (token) {
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`, { tileSize:512, zoomOffset:-1, maxZoom:19 }).addTo(map)
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map)
      }

      const icon = L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:50%;background:${driver.type==='bike'?'#FFB800':'#00E5FF'};border:2px solid #fff;box-shadow:0 0 12px ${driver.type==='bike'?'#FFB800':'#00E5FF'}88;display:flex;align-items:center;justify-content:center;font-size:11px;">${driver.type==='bike'?'🏍':'🚕'}</div>`,
        className: '', iconSize:[24,24], iconAnchor:[12,12],
      })
      L.marker([driver.lat, driver.lng], { icon }).addTo(map)
      instanceRef.current = map
    }).catch(() => {})

    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null } }
  }, [driver.id, driver.lat, driver.lng])

  if (!driver.lat) return null

  return (
    <div style={{ flexShrink:0 }}>
      <div ref={mapRef} style={{ width:'100%', height:140, borderRadius:'0 0 0 0', background:'#1a1a2e' }} />
      <div style={{ padding:'8px 16px', background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12 }}>📍</span>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600, lineHeight:1.4 }}>{driver.address}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{driver.area} · {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</div>
        </div>
      </div>
    </div>
  )
}

const AREAS = ['Jakarta Selatan','Jakarta Pusat','Jakarta Barat','Jakarta Timur','Jakarta Utara','Tangerang','Bekasi','Depok','Bogor']

function DriverEditModal({ driver, onSave, onClose }) {
  const [form, setForm] = useState({
    name:      driver.name      || '',
    type:      driver.type      || 'bike',
    phone:     driver.phone     || '',
    area:      driver.area      || 'Jakarta Pusat',
    vehicle:   driver.vehicle   || '',
    plateNo:   driver.plateNo   || '',
    licenseId: driver.licenseId || '',
    avatar:    driver.avatar    || '',
    status:    driver.status    || 'available',
    online:    driver.online    ?? true,
  })
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const iStyle = {
    background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
    padding:'9px 12px', color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box',
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <div style={{ background:'#0d0d1a', border:'1px solid rgba(0,229,255,0.25)', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:'#00E5FF' }}>✏️ Edit Driver Profile</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:18, fontFamily:'inherit' }}>✕</button>
        </div>

        {/* Avatar upload */}
        <div style={{ padding:'18px 24px 0' }}>
          <ImageUpload
            value={form.avatar}
            onChange={url => setForm(p => ({ ...p, avatar: url }))}
            folder="driver-avatars"
            size={72}
            shape="circle"
            accentColor="#00E5FF"
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, padding:'18px 24px 0' }}>
          {[
            { key:'name',      label:'Full Name *' },
            { key:'phone',     label:'Phone Number' },
            { key:'vehicle',   label:'Vehicle Model' },
            { key:'plateNo',   label:'Plate Number' },
            { key:'licenseId', label:'License ID' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
              <input value={form[key]} onChange={f(key)} style={iStyle} />
            </div>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Type</label>
            <select value={form.type} onChange={f('type')} style={iStyle}>
              <option value="bike">🏍 Bike</option>
              <option value="taxi">🚕 Taxi / Car</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Area</label>
            <select value={form.area} onChange={f('area')} style={iStyle}>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Status</label>
            <select value={form.status} onChange={f('status')} style={iStyle}>
              <option value="available">Available</option>
              <option value="on_ride">On Ride</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Online</label>
            <select value={form.online ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, online: e.target.value === 'true' }))} style={iStyle}>
              <option value="true">Online</option>
              <option value="false">Offline</option>
            </select>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', padding:'18px 24px 24px' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ padding:'9px 24px', background:'rgba(0,229,255,0.12)', border:'1px solid rgba(0,229,255,0.3)', borderRadius:8, color:'#00E5FF', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Save Changes</button>
        </div>
      </div>
    </div>
  )
}

const ACTIVE_RIDES = [
  { id:'r1', driver:'Budi Setiawan',  passenger:'Maya Patel',   from:'Sudirman', to:'Senayan', type:'bike', fare:'Rp 18.000', mins: 8  },
  { id:'r2', driver:'Siti Rahayu',    passenger:'Jordan Lee',   from:'Kemang',   to:'Blok M',  type:'bike', fare:'Rp 12.000', mins: 4  },
]

const STATUS_COLOR = { on_ride: '#FFB800', available: '#00FF9D', offline: 'rgba(255,255,255,0.25)' }

export default function RidesAdminTab() {
  const [drivers,        setDrivers]        = useState(INIT_DRIVERS)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [editItem,       setEditItem]       = useState(null)
  const [messages,       setMessages]       = useState({})
  const [msgInput,       setMsgInput]       = useState('')
  const [filter,         setFilter]         = useState('all')
  const [sending,        setSending]        = useState(false)
  const [toast,          setToast]          = useState(null)
  const chatEndRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleEditSave = (updated) => {
    setDrivers(prev => prev.map(d => d.id === editItem.id ? {
      ...d,
      name:      updated.name,
      type:      updated.type,
      phone:     updated.phone,
      area:      updated.area,
      vehicle:   updated.vehicle,
      plateNo:   updated.plateNo,
      licenseId: updated.licenseId,
      avatar:    updated.avatar,
      status:    updated.status,
      online:    updated.online,
    } : d))
    // Update selectedDriver if it's the one being edited
    if (selectedDriver?.id === editItem.id) {
      setSelectedDriver(prev => ({ ...prev, ...updated }))
    }
    setEditItem(null)
    showToast(`✅ ${updated.name} updated`)
  }

  // Load chat history for selected driver
  useEffect(() => {
    if (!selectedDriver) return
    if (messages[selectedDriver.id]) return // already loaded
    if (!supabase) return
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
    if (!supabase) return
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

  const filtered = drivers.filter(d => {
    if (filter === 'bike')   return d.type === 'bike'
    if (filter === 'taxi')   return d.type === 'taxi'
    if (filter === 'online') return d.online
    return true
  })

  const online    = drivers.filter(d => d.online).length
  const onRide    = drivers.filter(d => d.status === 'on_ride').length
  const available = drivers.filter(d => d.status === 'available').length

  return (
    <div className={styles.page}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, background:'rgba(0,255,157,0.12)', border:'1px solid rgba(0,255,157,0.3)', color:'#00FF9D' }}>{toast}</div>
      )}
      {editItem && <DriverEditModal driver={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Drivers', value: drivers.length, color: '#00E5FF' },
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
              <div key={d.id} className={`${styles.driverRow} ${selectedDriver?.id === d.id ? styles.driverRowActive : ''}`}
                onClick={() => setSelectedDriver(d)}>
                <div className={styles.driverAvatarWrap}>
                  <img src={d.avatar} alt="" className={styles.driverAvatar} />
                  <span className={styles.onlineDot} style={{ background: d.online ? '#00FF9D' : 'rgba(255,255,255,0.2)', boxShadow: d.online ? '0 0 6px #00FF9D' : 'none' }} />
                </div>
                <div className={styles.driverInfo}>
                  <span className={styles.driverName}>{d.name}{(d.status === 'available' || d.status === 'on_ride') && <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 12 }} title="Verified driver">✅</span>}</span>
                  <span className={styles.driverMeta}>
                    <span className={styles.driverType}>{d.type === 'bike' ? '🏍' : '🚕'}</span>
                    {d.area} · ⭐{d.rating}
                  </span>
                </div>
                <span className={styles.driverStatus} style={{ color: STATUS_COLOR[d.status] }}>
                  {d.status.replace('_', ' ')}
                </span>
                {messages[d.id]?.length > 0 && <span className={styles.unreadDot} />}
                <button
                  className={styles.editDriverBtn}
                  onClick={e => { e.stopPropagation(); setEditItem(d) }}
                  title="Edit driver"
                >✏️</button>
              </div>
            ))}
          </div>

          {/* Active rides */}
          <div className={styles.activeRidesSection}>
            <div className={styles.panelTitle} style={{ padding: '12px 16px 8px', fontSize: 12 }}>⚡ Active Rides</div>
            {ACTIVE_RIDES.map(r => (
              <div key={r.id} className={styles.rideRow}>
                <div className={styles.rideInfo}>
                  <span className={styles.rideDriver}>{r.driver} <span style={{ color: '#22C55E', fontSize: 11 }} title="Verified driver">✅</span></span>
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
                  <span className={styles.chatName}>{selectedDriver.name}{(selectedDriver.status === 'available' || selectedDriver.status === 'on_ride') && <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 13 }} title="Verified driver">✅</span>}</span>
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

              <DriverMiniMap driver={selectedDriver} />

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
