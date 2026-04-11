import { useEffect, useRef, useState } from 'react'
import styles from './LiveMapTab.module.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Demo pins
const DEMO_PINS = {
  users:    [
    { id:'u1', lat:-6.2088, lng:106.8456, label:'Ava', type:'dating',  color:'#F472B6' },
    { id:'u2', lat:-6.1944, lng:106.8229, label:'Jordan', type:'dating', color:'#F472B6' },
    { id:'u3', lat:-6.2297, lng:106.8295, label:'Maya',   type:'market', color:'#A855F7' },
    { id:'u4', lat:-6.2615, lng:106.7811, label:'Kai',    type:'dating', color:'#F472B6' },
  ],
  drivers:  [
    { id:'d1', lat:-6.2100, lng:106.8500, label:'Budi',  type:'bike',   color:'#FFB800' },
    { id:'d2', lat:-6.1900, lng:106.8200, label:'Rudi',  type:'taxi',   color:'#00E5FF' },
    { id:'d3', lat:-6.2400, lng:106.8100, label:'Agus',  type:'bike',   color:'#FFB800' },
  ],
  restaurants: [
    { id:'r1', lat:-6.2050, lng:106.8450, label:'Nusantara',  type:'restaurant', color:'#F97316' },
    { id:'r2', lat:-6.2200, lng:106.8300, label:'Sushi Bali', type:'restaurant', color:'#F97316' },
  ],
}

export default function LiveMapTab() {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const [loaded,     setLoaded]     = useState(false)
  const [error,      setError]      = useState(null)
  const [filters,    setFilters]    = useState({ users: true, drivers: true, restaurants: true })
  const [pinCounts,  setPinCounts]  = useState({ users: 4, drivers: 3, restaurants: 2 })

  useEffect(() => {
    if (!MAPBOX_TOKEN) { setError('Mapbox token not set (VITE_MAPBOX_TOKEN)'); return }
    if (mapInstance.current) return

    // Use Leaflet (already installed) with Mapbox tiles
    import('leaflet').then(L => {
      if (mapInstance.current) return
      const map = L.default.map(mapRef.current, {
        center: [-6.2088, 106.8456],
        zoom: 12,
        zoomControl: true,
      })

      // Mapbox dark tiles
      L.default.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
        { attribution: '© Mapbox © OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 19 }
      ).addTo(map)

      // Add pins
      const addPins = (pins, visible) => {
        if (!visible) return []
        return pins.map(pin => {
          const icon = L.default.divIcon({
            html: `<div style="
              width:28px;height:28px;border-radius:50%;
              background:${pin.color};
              border:2px solid rgba(255,255,255,0.6);
              box-shadow:0 0 12px ${pin.color}88;
              display:flex;align-items:center;justify-content:center;
              font-size:10px;font-weight:800;color:#000;
              font-family:system-ui;">
              ${pin.type === 'bike' ? '🏍' : pin.type === 'taxi' ? '🚕' : pin.type === 'restaurant' ? '🍽' : '👤'}
            </div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })
          return L.default.marker([pin.lat, pin.lng], { icon })
            .bindPopup(`<b>${pin.label}</b><br/><small>${pin.type}</small>`)
            .addTo(map)
        })
      }

      addPins(DEMO_PINS.users,       filters.users)
      addPins(DEMO_PINS.drivers,     filters.drivers)
      addPins(DEMO_PINS.restaurants, filters.restaurants)

      mapInstance.current = map
      setLoaded(true)
    }).catch(e => { setError('Failed to load map: ' + e.message) })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

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
            { key: 'users',       label: '👤 Dating Users', color: '#F472B6', count: pinCounts.users },
            { key: 'drivers',     label: '🚗 Drivers',      color: '#FFB800', count: pinCounts.drivers },
            { key: 'restaurants', label: '🍽 Restaurants',  color: '#F97316', count: pinCounts.restaurants },
          ].map(f => (
            <button key={f.key}
              className={`${styles.filterChip} ${filters[f.key] ? styles.filterChipOn : ''}`}
              style={filters[f.key] ? { borderColor: f.color + '60', background: f.color + '15', color: f.color } : {}}
              onClick={() => setFilters(p => ({ ...p, [f.key]: !p[f.key] }))}>
              {f.label} <span className={styles.filterCount}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          LIVE
        </div>
      </div>

      {/* Map */}
      <div className={styles.mapWrap}>
        {!loaded && (
          <div className={styles.loadingOverlay}>
            <span className={styles.loadingSpinner} />
            <span className={styles.loadingText}>Loading Mapbox…</span>
          </div>
        )}
        <div ref={mapRef} className={styles.map} />
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {[
          { color: '#F472B6', label: 'Dating User' },
          { color: '#A855F7', label: 'Market User' },
          { color: '#FFB800', label: 'Bike Driver' },
          { color: '#00E5FF', label: 'Taxi Driver' },
          { color: '#F97316', label: 'Restaurant'  },
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
