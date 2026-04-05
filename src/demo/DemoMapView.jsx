import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, marker } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { activityImage, ACTIVITY_TYPES } from '@/firebase/collections'

const MAKER_CRAFT_IMG = 'https://ik.imagekit.io/nepgaxllc/UntitledsdfasdfdddfsdfsdzxcZXcxxx.png'
const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']
import { DEMO_CENTER } from './mockData'
import { spreadMarkers } from '@/utils/spreadMarkers'
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
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LiveMarkers({ sessions, onSelect }) {
  const map = useMap()

  useEffect(() => {
    const cluster = L.layerGroup()

    spreadMarkers(sessions, 'lat', 'lng').forEach((session) => {
      const initial = (session.displayName ?? 'U')[0].toUpperCase()
      const isScheduled  = session.status === 'scheduled'
      const isInviteOut  = session.status === 'invite_out'
      const scheduledLabel = isScheduled ? formatScheduledTime(session.scheduledFor) : ''
      const actImg = activityImage(session.activityType)
      const activityCategory = ACTIVITY_TYPES.find(a => a.id === session.activityType)?.category
      const isMaker = MAKER_CATEGORIES.includes(session.lookingFor) || activityCategory === 'handmade'
      const avatarInner = session.photoURL
        ? `<img src="${session.photoURL}" class="demo-marker__photo" alt="" />`
        : isMaker
        ? `<img src="${MAKER_CRAFT_IMG}" class="demo-marker__photo" alt="" />`
        : actImg
        ? `<img src="${actImg}" class="demo-marker__activity-img" alt="" />`
        : initial
      const isReplied = !!session.hasReplied

      // Status dot — color by mode, pulsing, no dot for offline
      const dotClass = isInviteOut
        ? 'demo-marker__status-dot demo-marker__status-dot--invite'
        : isScheduled
        ? 'demo-marker__status-dot demo-marker__status-dot--later'
        : 'demo-marker__status-dot demo-marker__status-dot--now'
      const statusDot = `<div class="${dotClass}"></div>`

      const icon = divIcon({
        className: '',
        html: isReplied
          ? `<div class="demo-marker demo-marker--replied">
               <div class="demo-marker__reply-badge">💌</div>
               <div class="demo-marker__pulse demo-marker__pulse--slow"></div>
               <div class="demo-marker__avatar">${avatarInner}</div>
               ${statusDot}
             </div>`
          : isScheduled
          ? `<div class="demo-marker demo-marker--scheduled">
               <div class="demo-marker__clock">🕐</div>
               <div class="demo-marker__avatar demo-marker__avatar--scheduled">${avatarInner}</div>
               ${statusDot}
               <div class="demo-marker__time-label">${scheduledLabel}</div>
             </div>`
          : isInviteOut
          ? `<div class="demo-marker demo-marker--invite">
               <div class="demo-marker__avatar demo-marker__avatar--invite">${avatarInner}</div>
               ${statusDot}
             </div>`
          : `<div class="demo-marker">
               <div class="demo-marker__pulse"></div>
               <div class="demo-marker__pulse demo-marker__pulse--slow"></div>
               <div class="demo-marker__avatar">${avatarInner}</div>
               ${statusDot}
             </div>`,
        iconSize: [80, 100],
        iconAnchor: [40, 50],
      })

      const m = marker([session.lat, session.lng], { icon })
      m.on('click', () => onSelect(session))
      cluster.addLayer(m)
    })

    map.addLayer(cluster)
    return () => map.removeLayer(cluster)
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


function MapEventsHandler({ onMapMove, flyTarget }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter()
      onMapMove?.({ lat: c.lat, lng: c.lng })
    },
  })

  useEffect(() => {
    if (!flyTarget) return
    map.flyTo([flyTarget.lat, flyTarget.lng], 14, { duration: 1.2 })
  }, [flyTarget, map])

  return null
}

function VenueMarkers({ venues, onSelectVenue }) {
  const map = useMap()

  useEffect(() => {
    const cluster = L.layerGroup()

    spreadMarkers(venues, 'lat', 'lng').forEach((venue) => {
      const isActive = venue.count > 0
      const icon = divIcon({
        className: '',
        html: `<div class="venue-marker${isActive ? ' venue-marker--active' : ''}">
                 ${isActive ? `<div class="venue-marker__count">${venue.count}</div>` : ''}
                 <div class="venue-marker__bubble">
                   <span class="venue-marker__emoji">${venue.emoji}</span>
                 </div>
                 <div class="venue-marker__label">${venue.name}</div>
               </div>`,
        iconSize: [80, 60],
        iconAnchor: [40, 22],
      })

      const m = marker([venue.lat, venue.lng], { icon })
      m.on('click', () => onSelectVenue(venue))
      cluster.addLayer(m)
    })

    map.addLayer(cluster)
    return () => map.removeLayer(cluster)
  }, [venues, map, onSelectVenue])

  return null
}

const MIN_ZOOM = 5   // below this you'd see blank polar/edge tiles
const HOME_ZOOM = 14

function ZoomPanWatcher({ onDrift }) {
  const map = useMapEvents({
    zoomend: () => check(),
    moveend: () => check(),
  })

  function check() {
    const zoom = map.getZoom()
    const center = map.getCenter()
    const dLat = Math.abs(center.lat - DEMO_CENTER.lat)
    const dLng = Math.abs(center.lng - DEMO_CENTER.lng)
    const drifted = zoom < 10 || dLat > 1.5 || dLng > 1.5
    onDrift(drifted)
  }

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

export default function DemoMapView({ sessions, onSelectUser, allVenues = [], activeVenues = [], onSelectVenue, venuesOn = false, onMapMove, flyTarget }) {
  const [drifted, setDrifted] = useState(false)
  const [homeFly, setHomeFly] = useState(null)

  const handleReturnHome = useCallback(() => {
    setHomeFly({ lat: DEMO_CENTER.lat, lng: DEMO_CENTER.lng, zoom: HOME_ZOOM, ts: Date.now() })
    setDrifted(false)
  }, [])

  return (
    <div className={styles.wrapper}>
      {!venuesOn && sessions.length === 0 && <EmptyMapState />}

      {drifted && (
        <button className={styles.returnBtn} onClick={handleReturnHome}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          My area
        </button>
      )}

      <MapContainer
        center={[DEMO_CENTER.lat, DEMO_CENTER.lng]}
        zoom={HOME_ZOOM}
        minZoom={MIN_ZOOM}
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
          keepBuffer={8}
          updateWhenIdle={false}
          updateWhenZooming={false}
        />
        <MapEventsHandler onMapMove={onMapMove} flyTarget={homeFly ?? flyTarget} />
        <ZoomPanWatcher onDrift={setDrifted} />
        <MyDot />
        {venuesOn
          ? <VenueMarkers
              venues={allVenues.map(v => ({
                ...v,
                count: activeVenues.find(a => a.id === v.id)?.count ?? 0,
              }))}
              onSelectVenue={onSelectVenue ?? (() => {})}
            />
          : <LiveMarkers sessions={sessions} onSelect={onSelectUser} />
        }
      </MapContainer>
    </div>
  )
}
