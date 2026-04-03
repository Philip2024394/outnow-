import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, marker } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { activityEmoji } from '@/firebase/collections'
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
      const emoji = activityEmoji(session.activityType)
      const initial = (session.displayName ?? 'U')[0].toUpperCase()
      const isScheduled  = session.status === 'scheduled'
      const isInviteOut  = session.status === 'invite_out'
      const scheduledLabel = isScheduled ? formatScheduledTime(session.scheduledFor) : ''
      const tier = session.tier ?? null
      const avatarInner = (tier && session.photoURL)
        ? `<img src="${session.photoURL}" class="demo-marker__photo" alt="" />`
        : initial
      const tierClass = tier ? ` demo-marker--${tier}` : ''
      const avatarTierClass = tier ? ` demo-marker__avatar--${tier}` : ''
      const crownHtml = tier === 'vip' ? `<div class="demo-marker__crown">👑</div>` : ''
      const isReplied = !!session.hasReplied

      const icon = divIcon({
        className: '',
        html: isReplied
          ? `<div class="demo-marker demo-marker--replied${tierClass}">
               <div class="demo-marker__reply-badge">💌</div>
               <div class="demo-marker__pulse demo-marker__pulse--slow"></div>
               <div class="demo-marker__avatar${avatarTierClass}">${avatarInner}</div>
               <div class="demo-marker__activity">${emoji}</div>
             </div>`
          : isScheduled
          ? `<div class="demo-marker demo-marker--scheduled${tierClass}">
               <div class="demo-marker__clock">🕐</div>
               <div class="demo-marker__avatar demo-marker__avatar--scheduled${avatarTierClass}">${avatarInner}</div>
               <div class="demo-marker__activity">${emoji}</div>
               <div class="demo-marker__time-label">${scheduledLabel}</div>
             </div>`
          : isInviteOut
          ? `<div class="demo-marker demo-marker--invite${tierClass}">
               <div class="demo-marker__avatar demo-marker__avatar--invite${avatarTierClass}">${avatarInner}</div>
               <div class="demo-marker__activity">${emoji}</div>
             </div>`
          : `<div class="demo-marker${tierClass}">
               ${crownHtml}
               <div class="demo-marker__pulse"></div>
               <div class="demo-marker__pulse demo-marker__pulse--slow"></div>
               <div class="demo-marker__avatar${avatarTierClass}">${avatarInner}</div>
               <div class="demo-marker__activity">${emoji}</div>
             </div>`,
        iconSize: [52, 68],
        iconAnchor: [26, 26],
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
  return (
    <div className={styles.wrapper}>
      {!venuesOn && sessions.length === 0 && <EmptyMapState />}
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
          keepBuffer={8}
          updateWhenIdle={false}
          updateWhenZooming={false}
        />
        <MapEventsHandler onMapMove={onMapMove} flyTarget={flyTarget} />
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
