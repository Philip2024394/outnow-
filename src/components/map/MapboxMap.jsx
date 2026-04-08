import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapboxMap.module.css'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${TOKEN}`
const TILE_ATTRIBUTION = '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'

const DEFAULT_CENTER = [51.5074, -0.1278]
const DEFAULT_ZOOM   = 14

// Status → colour
const STATUS_COLOR = {
  now:        '#8DC63F',
  invite_out: '#F5C518',
  scheduled:  '#E8890C',
  dating:     '#FF6B9D',
}

function makeMarkerIcon(session) {
  const color = STATUS_COLOR[session.status] ?? STATUS_COLOR.now
  const initial = (session.displayName ?? '?')[0].toUpperCase()
  const html = `
    <div style="
      width:36px;height:36px;border-radius:50%;
      border:2.5px solid ${color};
      box-shadow:0 0 8px ${color}88;
      background:#111;
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;position:relative;
    ">
      ${session.photoURL
        ? `<img src="${session.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : `<span style="font-size:15px;font-weight:800;color:${color};">${initial}</span>`
      }
      <div style="
        position:absolute;bottom:1px;right:1px;
        width:9px;height:9px;border-radius:50%;
        background:${color};border:1.5px solid #111;
      "></div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20] })
}

function makeUserIcon() {
  const html = `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        width:20px;height:20px;border-radius:50%;
        background:#8DC63F;border:2px solid #fff;
        box-shadow:0 0 10px rgba(141,198,63,0.8);
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:36px;height:36px;border-radius:50%;
        background:rgba(141,198,63,0.25);
        animation:none;
      "></div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 10] })
}

// Fly to a target whenever flyTarget changes
function FlyController({ flyTarget }) {
  const map = useMap()
  const prevTs = useRef(null)
  useEffect(() => {
    if (!flyTarget || flyTarget.ts === prevTs.current) return
    prevTs.current = flyTarget.ts
    map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom ?? DEFAULT_ZOOM, { duration: 1.2 })
  }, [flyTarget, map])
  return null
}

// Renders / updates session markers imperatively (fast, no React re-render per marker)
function SessionMarkers({ sessions, onSessionClick }) {
  const map = useMap()
  const markersRef = useRef({})

  useEffect(() => {
    const current = new Set(sessions.map(s => s.id))

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!current.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Add / update markers
    sessions.forEach(s => {
      if (s.lat == null || s.lng == null) return
      if (markersRef.current[s.id]) {
        markersRef.current[s.id].setLatLng([s.lat, s.lng])
        markersRef.current[s.id].setIcon(makeMarkerIcon(s))
      } else {
        const m = L.marker([s.lat, s.lng], { icon: makeMarkerIcon(s) })
          .addTo(map)
          .on('click', () => onSessionClick?.(s))
        markersRef.current[s.id] = m
      }
    })
  }, [sessions, map, onSessionClick])

  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}
    }
  }, [map])

  return null
}

// User position dot
function UserMarker({ coords }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    if (!coords) return
    if (markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng])
    } else {
      markerRef.current = L.marker([coords.lat, coords.lng], { icon: makeUserIcon(), zIndexOffset: 1000 }).addTo(map)
    }
    return () => { if (markerRef.current) { markerRef.current.remove(); markerRef.current = null } }
  }, [coords, map])

  return null
}

export default function MapboxMap({ sessions = [], userCoords, flyTarget, onSessionClick }) {
  const center = userCoords
    ? [userCoords.lat, userCoords.lng]
    : DEFAULT_CENTER

  const sessionsWithCoords = sessions.filter(s => s.lat != null && s.lng != null)

  return (
    <div className={styles.wrap}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className={styles.map}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} tileSize={512} zoomOffset={-1} />
        <FlyController flyTarget={flyTarget} />
        <SessionMarkers sessions={sessionsWithCoords} onSessionClick={onSessionClick} />
        <UserMarker coords={userCoords} />
      </MapContainer>
    </div>
  )
}
