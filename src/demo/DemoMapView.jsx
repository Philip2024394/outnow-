import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { divIcon, marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { activityEmoji } from '@/firebase/collections'
import { DEMO_CENTER } from './mockData'
import styles from './DemoMapView.module.css'

function formatScheduledTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Tonight ${timeStr}`
  if (isTomorrow) return `Tomorrow ${timeStr}`
  return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + timeStr
}

// Fix default icon paths broken by Vite bundling
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LiveMarkers({ sessions, onSelect }) {
  const map = useMap()

  useEffect(() => {
    const markers = []

    sessions.forEach((session) => {
      const emoji = activityEmoji(session.activityType)
      const initial = (session.displayName ?? 'U')[0].toUpperCase()

      const isScheduled = session.status === 'scheduled'
      const scheduledLabel = isScheduled ? formatScheduledTime(session.scheduledFor) : ''

      const icon = divIcon({
        className: '',
        html: isScheduled
          ? `<div class="demo-marker demo-marker--scheduled">
               <div class="demo-marker__clock">🕐</div>
               <div class="demo-marker__avatar demo-marker__avatar--scheduled">${initial}</div>
               <div class="demo-marker__activity">${emoji}</div>
               <div class="demo-marker__time-label">${scheduledLabel}</div>
             </div>`
          : `<div class="demo-marker">
               <div class="demo-marker__pulse"></div>
               <div class="demo-marker__pulse demo-marker__pulse--slow"></div>
               <div class="demo-marker__avatar">${initial}</div>
               <div class="demo-marker__activity">${emoji}</div>
             </div>`,
        iconSize: [52, 64],
        iconAnchor: [26, 26],
      })

      const m = marker([session.lat, session.lng], { icon })
      m.on('click', () => onSelect(session))
      m.addTo(map)
      markers.push(m)
    })

    return () => markers.forEach(m => m.remove())
  }, [sessions, map, onSelect])

  return null
}

function MyDot() {
  const map = useMap()

  useEffect(() => {
    const icon = divIcon({
      className: '',
      html: `<div class="demo-my-dot">
               <div class="demo-my-dot__ring"></div>
               <div class="demo-my-dot__ring demo-my-dot__ring--2"></div>
               <div class="demo-my-dot__center"></div>
             </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    const m = marker([DEMO_CENTER.lat, DEMO_CENTER.lng], { icon }).addTo(map)
    return () => m.remove()
  }, [map])

  return null
}

function EmptyMapState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📍</span>
      <p className={styles.emptyTitle}>Nobody out yet</p>
      <p className={styles.emptySub}>Be the first — tap I'M OUT NOW and get discovered</p>
    </div>
  )
}

export default function DemoMapView({ sessions, onSelectUser }) {
  return (
    <div className={styles.wrapper}>
      {sessions.length === 0 && <EmptyMapState />}
      <MapContainer
        center={[DEMO_CENTER.lat, DEMO_CENTER.lng]}
        zoom={14}
        zoomControl={false}
        attributionControl={true}
        className={styles.map}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <MyDot />
        <LiveMarkers sessions={sessions} onSelect={onSelectUser} />
      </MapContainer>
    </div>
  )
}
