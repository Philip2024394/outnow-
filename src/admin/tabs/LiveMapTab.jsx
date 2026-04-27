import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './LiveMapTab.module.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_DRIVERS = [
  { id:'dr1', name:'Budi Santoso',   type:'bike', lat:-6.2100, lng:106.8500, status:'online',  rating:4.9, trips:312, phone:'+62811000001' },
  { id:'dr2', name:'Rudi Hartono',   type:'taxi', lat:-6.1900, lng:106.8200, status:'online',  rating:4.7, trips:541, phone:'+62811000002' },
  { id:'dr3', name:'Agus Prasetyo',  type:'bike', lat:-6.2400, lng:106.8100, status:'busy',    rating:4.8, trips:198, phone:'+62811000003' },
  { id:'dr4', name:'Wahyu Setiawan', type:'taxi', lat:-6.2250, lng:106.8600, status:'online',  rating:4.6, trips:427, phone:'+62811000004' },
  { id:'dr5', name:'Doni Firmansyah',type:'bike', lat:-6.1800, lng:106.8350, status:'offline', rating:4.5, trips:89,  phone:'+62811000005' },
  { id:'dr6', name:'Hendra Wijaya',  type:'taxi', lat:-6.2600, lng:106.8000, status:'online',  rating:4.9, trips:673, phone:'+62811000006' },
]

const DEMO_BOOKINGS = [
  { id:'bk1', name:'Ava Mitchell',   lat:-6.2180, lng:106.8420, type:'taxi', age:24, city:'Jakarta',  photoURL:'https://i.pravatar.cc/80?img=1',  waiting:'2m', dest:'SCBD Tower' },
  { id:'bk2', name:'Jordan Lee',     lat:-6.1970, lng:106.8270, type:'bike', age:27, city:'Jakarta',  photoURL:'https://i.pravatar.cc/80?img=2',  waiting:'45s', dest:'Grand Indonesia' },
  { id:'bk3', name:'Maya Patel',     lat:-6.2320, lng:106.8350, type:'taxi', age:22, city:'Bali',     photoURL:'https://i.pravatar.cc/80?img=3',  waiting:'4m', dest:'Kemang Village' },
  { id:'bk4', name:'Kai Thompson',   lat:-6.2490, lng:106.7950, type:'bike', age:29, city:'Depok',    photoURL:'https://i.pravatar.cc/80?img=4',  waiting:'1m', dest:'UI Campus' },
  { id:'bk5', name:'Priya Sharma',   lat:-6.1750, lng:106.8450, type:'taxi', age:31, city:'Jakarta',  photoURL:'https://i.pravatar.cc/80?img=5',  waiting:'6m', dest:'Thamrin City' },
  { id:'bk6', name:'Sam Okafor',     lat:-6.2050, lng:106.8550, type:'bike', age:26, city:'Jakarta',  photoURL:'https://i.pravatar.cc/80?img=8',  waiting:'30s', dest:'Sudirman MRT' },
]

const DEMO_RESTAURANTS = [
  { id:'r1', lat:-6.2050, lng:106.8450, label:'Nusantara Grill' },
  { id:'r2', lat:-6.2200, lng:106.8300, label:'Sushi Bali' },
  { id:'r3', lat:-6.1950, lng:106.8180, label:'Warung Padang' },
]

// Slight random drift for live effect
function drift(base, amount = 0.001) {
  return base + (Math.random() - 0.5) * amount
}

export default function LiveMapTab() {
  const mapRef       = useRef(null)
  const mapInstance  = useRef(null)
  const markersRef   = useRef({})
  const leafletRef   = useRef(null)

  const [loaded,     setLoaded]     = useState(false)
  const [error,      setError]      = useState(null)
  const [filters,    setFilters]    = useState({ bikes: true, taxis: true, bookings: true, restaurants: false })
  const [drivers,    setDrivers]    = useState(DEMO_DRIVERS)
  const [bookings]                  = useState(DEMO_BOOKINGS)
  const [selected,   setSelected]   = useState(null)   // { type:'driver'|'booking', data }

  // Build popup HTML for a driver marker
  const driverPopupHtml = (d) => `
    <div style="font-family:system-ui;min-width:160px;color:#fff;background:#0d0d1a;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <div style="font-weight:800;font-size:14px;margin-bottom:2px">${d.type === 'bike' ? '🏍' : '🚕'} ${d.name} ${d.status !== 'offline' ? '<span style="color:#22C55E;font-size:12px" title="Verified">✅</span>' : ''}</div>
        <div style="font-size:11px;color:${d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#FFB800' : '#FF4444'};font-weight:700;text-transform:uppercase">${d.status}</div>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.8">
        ⭐ ${d.rating} &nbsp;·&nbsp; ${d.trips} trips<br/>
        📞 ${d.phone}
      </div>
    </div>`

  // Build popup HTML for a booking (customer) marker — no inline button, we use click event
  const bookingPopupHtml = (b) => `
    <div style="font-family:system-ui;min-width:200px;color:#fff;background:#0d0d1a;border-radius:10px;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px">
        <img src="${b.photoURL}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #FF4444"/>
        <div>
          <div style="font-weight:800;font-size:14px">${b.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5)">${b.age} · ${b.city}</div>
        </div>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.9">
        ${b.type === 'bike' ? '🏍 Book Bike' : '🚕 Book Car'} &nbsp;→&nbsp; <b>${b.dest}</b><br/>
        ⏱ Waiting: <span style="color:#FF4444;font-weight:700">${b.waiting}</span>
      </div>
    </div>`

  const buildMap = useCallback((L) => {
    if (mapInstance.current) return
    const map = L.map(mapRef.current, { center: [-6.2088, 106.8456], zoom: 13, zoomControl: true })

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      { attribution: '© Mapbox © OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 19 }
    ).addTo(map)

    const makeIcon = (emoji, color, size = 32, pulse = false) => L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2.5px solid rgba(255,255,255,0.7);
        box-shadow:0 0 14px ${color}99,0 0 0 0 ${color}55;
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.45}px;
        ${pulse ? `animation:pulseRed 1.4s ease-in-out infinite;` : ''}
      ">${emoji}</div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })

    // Add driver markers
    DEMO_DRIVERS.forEach(d => {
      if (d.status === 'offline') return
      const color = d.type === 'bike' ? '#FFB800' : '#00E5FF'
      const icon  = makeIcon(d.type === 'bike' ? '🏍' : '🚕', color)
      const marker = L.marker([d.lat, d.lng], { icon })
        .bindPopup(driverPopupHtml(d), { className: 'dark-popup', maxWidth: 260 })
        .addTo(map)
      markersRef.current[d.id] = { marker, type: 'driver', data: d }
    })

    // Add booking (customer) markers — red pulsing dots
    DEMO_BOOKINGS.forEach(b => {
      const icon = makeIcon(b.type === 'bike' ? '🏍' : '🚕', '#FF4444', 28, true)
      const marker = L.marker([b.lat, b.lng], { icon })
        .bindPopup(bookingPopupHtml(b), { className: 'dark-popup', maxWidth: 260 })
        .addTo(map)
      marker.on('click', () => setSelected({ type: 'booking', data: b }))
      markersRef.current[b.id] = { marker, type: 'booking', data: b }
    })

    // Restaurant markers
    DEMO_RESTAURANTS.forEach(r => {
      const icon = makeIcon('🍽', '#F97316', 26)
      L.marker([r.lat, r.lng], { icon })
        .bindPopup(`<div style="font-family:system-ui;color:#fff;background:#0d0d1a;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:700">${r.label}</div>`, { className: 'dark-popup' })
        .addTo(map)
    })

    mapInstance.current = map
    leafletRef.current  = L
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!MAPBOX_TOKEN) { setError('Mapbox token not set (VITE_MAPBOX_TOKEN)'); return }
    if (mapInstance.current) return

    import('leaflet').then(mod => buildMap(mod.default)).catch(e => setError('Failed to load map: ' + e.message))

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [buildMap])

  // Simulate driver location drift every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        if (d.status === 'offline') return d
        const updated = { ...d, lat: drift(d.lat, 0.0012), lng: drift(d.lng, 0.0012) }
        const entry = markersRef.current[d.id]
        if (entry && mapInstance.current && leafletRef.current) {
          entry.marker.setLatLng([updated.lat, updated.lng])
        }
        return updated
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  // Toggle layers visibility
  useEffect(() => {
    if (!mapInstance.current) return
    Object.entries(markersRef.current).forEach(([, entry]) => {
      const map = mapInstance.current
      const show =
        (entry.type === 'driver' && entry.data.type === 'bike'  && filters.bikes) ||
        (entry.type === 'driver' && entry.data.type === 'taxi'  && filters.taxis) ||
        (entry.type === 'booking'                               && filters.bookings)
      if (show) { if (!map.hasLayer(entry.marker)) entry.marker.addTo(map) }
      else      { if ( map.hasLayer(entry.marker)) map.removeLayer(entry.marker) }
    })
  }, [filters])

  const onlineBikes  = drivers.filter(d => d.type === 'bike' && d.status !== 'offline').length
  const onlineTaxis  = drivers.filter(d => d.type === 'taxi' && d.status !== 'offline').length

  if (error) return (
    <div className={styles.errorState}>
      <span className={styles.errorIcon}>🗺️</span>
      <p className={styles.errorTitle}>Map unavailable</p>
      <p className={styles.errorDesc}>{error}</p>
      <code className={styles.errorCode}>Add VITE_MAPBOX_TOKEN to .env</code>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        <span className={styles.filterTitle}>Live Map — Jakarta</span>
        <div className={styles.filters}>
          {[
            { key:'bikes',       label:'🏍 Bike Drivers', color:'#FFB800', count: onlineBikes },
            { key:'taxis',       label:'🚕 Taxi Drivers', color:'#00E5FF', count: onlineTaxis },
            { key:'bookings',    label:'🔴 Active Bookings', color:'#FF4444', count: bookings.length },
            { key:'restaurants', label:'🍽 Restaurants',  color:'#F97316', count: DEMO_RESTAURANTS.length },
          ].map(f => (
            <button key={f.key}
              className={`${styles.filterChip} ${filters[f.key] ? styles.filterChipOn : ''}`}
              style={filters[f.key] ? { borderColor: f.color + '60', background: f.color + '15', color: f.color } : {}}
              onClick={() => setFilters(p => ({ ...p, [f.key]: !p[f.key] }))}>
              {f.label} <span className={styles.filterCount}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className={styles.livePill}><span className={styles.liveDot} />LIVE</div>
      </div>

      <div className={styles.mapRow}>
        {/* Map */}
        <div className={styles.mapWrap}>
          {!loaded && (
            <div className={styles.loadingOverlay}>
              <span className={styles.loadingSpinner} />
              <span className={styles.loadingText}>Loading map…</span>
            </div>
          )}
          <div ref={mapRef} className={styles.map} />

          {/* Inject pulse keyframe & dark popup styles */}
          <style>{`
            @keyframes pulseRed {
              0%   { box-shadow: 0 0 0 0 rgba(255,68,68,0.7), 0 0 14px rgba(255,68,68,0.6); }
              70%  { box-shadow: 0 0 0 10px rgba(255,68,68,0), 0 0 14px rgba(255,68,68,0.6); }
              100% { box-shadow: 0 0 0 0 rgba(255,68,68,0),   0 0 14px rgba(255,68,68,0.6); }
            }
            .dark-popup .leaflet-popup-content-wrapper,
            .dark-popup .leaflet-popup-tip {
              background: #0d0d1a !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
              padding: 0 !important;
              border-radius: 10px !important;
            }
            .dark-popup .leaflet-popup-content { margin: 0 !important; }
            .dark-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; font-size:18px !important; right:8px !important; top:6px !important; }
          `}</style>
        </div>

        {/* Side panel — booking details */}
        {selected?.type === 'booking' && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <span className={styles.sidePanelTitle}>📋 Booking Request</span>
              <button className={styles.sidePanelClose} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className={styles.customerCard}>
              <img src={selected.data.photoURL} className={styles.customerPhoto} alt="" />
              <div className={styles.customerName}>{selected.data.name}</div>
              <div className={styles.customerMeta}>{selected.data.age} years · {selected.data.city}</div>
              <div className={styles.bookingBadge} style={{ background: selected.data.type === 'bike' ? 'rgba(255,184,0,0.15)' : 'rgba(0,229,255,0.15)', color: selected.data.type === 'bike' ? '#FFB800' : '#00E5FF', borderColor: selected.data.type === 'bike' ? '#FFB80040' : '#00E5FF40' }}>
                {selected.data.type === 'bike' ? '🏍 Book Bike' : '🚕 Book Car'}
              </div>
            </div>
            <div className={styles.bookingInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Destination</span>
                <span className={styles.infoVal}>{selected.data.dest}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Waiting</span>
                <span className={styles.infoVal} style={{ color:'#FF4444', fontWeight:700 }}>{selected.data.waiting}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Request type</span>
                <span className={styles.infoVal}>{selected.data.type === 'bike' ? 'Motorcycle' : 'Car'}</span>
              </div>
            </div>
            <div className={styles.sidePanelActions}>
              <button className={styles.actionGreen}>✓ Assign Driver</button>
              <button className={styles.actionRed}>✕ Cancel Booking</button>
            </div>
          </div>
        )}

        {/* Side panel — driver list */}
        {!selected && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <span className={styles.sidePanelTitle}>🚗 Driver Status</span>
            </div>
            <div className={styles.driverList}>
              {drivers.map(d => (
                <div key={d.id} className={styles.driverRow}
                  onClick={() => {
                    const entry = markersRef.current[d.id]
                    if (entry && mapInstance.current) {
                      mapInstance.current.setView([d.lat, d.lng], 15)
                      entry.marker.openPopup()
                    }
                  }}>
                  <span className={styles.driverTypeIcon}>{d.type === 'bike' ? '🏍' : '🚕'}</span>
                  <div className={styles.driverInfo}>
                    <span className={styles.driverName}>{d.name}{d.status !== 'offline' && <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 11 }} title="Verified driver">✅</span>}</span>
                    <span className={styles.driverSub}>⭐ {d.rating} · {d.trips} trips</span>
                  </div>
                  <span className={styles.driverStatus} style={{
                    color: d.status === 'online' ? '#00FF9D' : d.status === 'busy' ? '#FFB800' : '#FF4444',
                    borderColor: d.status === 'online' ? '#00FF9D30' : d.status === 'busy' ? '#FFB80030' : '#FF444430',
                    background: d.status === 'online' ? 'rgba(0,255,157,0.08)' : d.status === 'busy' ? 'rgba(255,184,0,0.08)' : 'rgba(255,68,68,0.08)',
                  }}>{d.status}</span>
                </div>
              ))}
            </div>
            <div className={styles.bookingHeader}>
              <span className={styles.sidePanelTitle}>🔴 Active Bookings</span>
              <span className={styles.bookingCountBadge}>{bookings.length}</span>
            </div>
            <div className={styles.bookingList}>
              {bookings.map(b => (
                <div key={b.id} className={styles.bookingRow}
                  onClick={() => {
                    setSelected({ type:'booking', data: b })
                    if (mapInstance.current) mapInstance.current.setView([b.lat, b.lng], 15)
                  }}>
                  <img src={b.photoURL} className={styles.bookingAvatar} alt="" />
                  <div className={styles.bookingInfo2}>
                    <span className={styles.bookingName}>{b.name}</span>
                    <span className={styles.bookingDest}>{b.type === 'bike' ? '🏍' : '🚕'} → {b.dest}</span>
                  </div>
                  <span className={styles.bookingWait}>{b.waiting}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {[
          { color: '#FFB800', label: 'Bike Driver' },
          { color: '#00E5FF', label: 'Taxi Driver' },
          { color: '#FF4444', label: 'Active Booking (tap for profile)' },
          { color: '#F97316', label: 'Restaurant' },
        ].map(l => (
          <div key={l.label} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
            <span className={styles.legendLabel}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
