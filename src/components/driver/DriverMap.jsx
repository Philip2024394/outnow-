import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import styles from './DriverMap.module.css'

const TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN
const TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${TOKEN}`

const DEFAULT_CENTER = [-7.797, 110.370] // Yogyakarta

function makeDriverIcon(driver, isSelected) {
  const emoji = driver.type === 'car_taxi' ? '🚗' : '🛵'
  const border = isSelected ? '2px solid #8DC63F' : '2px solid rgba(255,255,255,0.2)'
  const shadow = isSelected ? '0 0 12px rgba(141,198,63,0.7)' : '0 2px 6px rgba(0,0,0,0.6)'
  const html = `<div style="
    width:36px;height:36px;border-radius:50%;
    background:rgba(10,10,10,0.85);
    border:${border};box-shadow:${shadow};
    display:flex;align-items:center;justify-content:center;
    font-size:18px;line-height:1;
  ">${emoji}</div>`
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] })
}

function makeUserIcon() {
  const html = `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#8DC63F;border:2px solid #fff;
    box-shadow:0 0 10px rgba(141,198,63,0.8);
  "></div>`
  return L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] })
}

function DriverMarkers({ drivers, selectedId }) {
  const map = useMap()
  const refs = useRef({})

  useEffect(() => {
    const current = new Set(drivers.map(d => d.id))
    Object.keys(refs.current).forEach(id => {
      if (!current.has(id)) { refs.current[id].remove(); delete refs.current[id] }
    })
    drivers.forEach(d => {
      if (!d.online) return
      const icon = makeDriverIcon(d, d.id === selectedId)
      if (refs.current[d.id]) {
        refs.current[d.id].setIcon(icon)
      } else {
        refs.current[d.id] = L.marker([d.lat, d.lng], { icon }).addTo(map)
      }
    })
  }, [drivers, selectedId, map])

  useEffect(() => () => Object.values(refs.current).forEach(m => m.remove()), [map])
  return null
}

function UserMarker({ coords }) {
  const map = useMap()
  const ref = useRef(null)
  useEffect(() => {
    if (!coords) return
    if (ref.current) { ref.current.setLatLng([coords.lat, coords.lng]) }
    else { ref.current = L.marker([coords.lat, coords.lng], { icon: makeUserIcon(), zIndexOffset: 999 }).addTo(map) }
    return () => { ref.current?.remove(); ref.current = null }
  }, [coords, map])
  return null
}

export default function DriverMap({ userCoords, driverType = 'bike_ride', selectedDriverId = null, drivers = [] }) {
  const center = userCoords ? [userCoords.lat, userCoords.lng] : DEFAULT_CENTER

  const displayDrivers = drivers.length > 0 ? drivers : MOCK_DRIVERS
  const filtered = displayDrivers.filter(d => d.online && d.type === driverType)

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        center={center}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        className={styles.map}
        style={{ height: '280px', width: '100%' }}
      >
        <TileLayer url={TILE_URL} tileSize={512} zoomOffset={-1} />
        <DriverMarkers drivers={filtered} selectedId={selectedDriverId} />
        <UserMarker coords={userCoords} />
      </MapContainer>
    </div>
  )
}

// Fallback mock drivers (used when no live drivers are available)
const MOCK_DRIVERS = [
  { id: 'd1', name: 'Budi',   type: 'bike_ride', lat: -7.797, lng: 110.370, online: true  },
  { id: 'd2', name: 'Ani',    type: 'bike_ride', lat: -7.803, lng: 110.363, online: true  },
  { id: 'd3', name: 'Citra',  type: 'car_taxi',  lat: -7.791, lng: 110.378, online: true  },
  { id: 'd4', name: 'Hendra', type: 'bike_ride', lat: -7.808, lng: 110.355, online: false },
  { id: 'd5', name: 'Sari',   type: 'car_taxi',  lat: -7.787, lng: 110.383, online: true  },
]
