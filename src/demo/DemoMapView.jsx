import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, marker } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { activityImage, ACTIVITY_TYPES } from '@/firebase/collections'

const MAKER_CRAFT_IMG = 'https://ik.imagekit.io/nepgaxllc/UntitledsdfasdfdddfsdfsdzxcZXcxxx.png'
const MAKER_CATEGORIES = ['handmade', 'craft_supplies', 'property', 'professional']

const BUSINESS_BADGE = {
  handmade:       { emoji: '🪡', label: 'Maker'     },
  craft_supplies: { emoji: '🎨', label: 'Craft'     },
  property:       { emoji: '🏠', label: 'Property'  },
  professional:   { emoji: '💼', label: 'Service'   },
  fashion:        { emoji: '👗', label: 'Fashion'   },
  food:           { emoji: '🍜', label: 'Food'      },
  beauty:         { emoji: '💅', label: 'Beauty'    },
  tech:           { emoji: '💻', label: 'Tech'      },
  fitness:        { emoji: '💪', label: 'Fitness'   },
  default:        { emoji: '🏪', label: 'Business'  },
}
import { DEMO_CENTER } from './mockData'
import { spreadMarkers } from '@/utils/spreadMarkers'
import styles from './DemoMapView.module.css'


// Fix default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LiveMarkers({ sessions, onSelect, homeMode = false }) {
  const map = useMap()

  useEffect(() => {
    const cluster = L.layerGroup()

    spreadMarkers(sessions, 'lat', 'lng').forEach((session) => {
      const initial = (session.displayName ?? 'U')[0].toUpperCase()
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
      // Home mode forces all user (non-maker) pins to render as yellow regardless of real status
      const isInviteOut = isMaker ? session.status === 'invite_out' : (homeMode || session.status === 'invite_out')

      // Business badge pin for maker sessions
      if (isMaker) {
        const badge     = BUSINESS_BADGE[session.lookingFor] ?? BUSINESS_BADGE[activityCategory] ?? BUSINESS_BADGE.default
        const product   = session.productWord ?? null
        const sellerType = session.sellerType ?? 'Maker'
        const pinLabel  = product ? `${product} ${sellerType}` : badge.label
        const badgeIcon = divIcon({
          className: '',
          html: `<div class="biz-badge${isInviteOut ? ' biz-badge--invite' : ''}">
                   <span class="biz-badge__emoji">${badge.emoji}</span>
                   <span class="biz-badge__label">${pinLabel}</span>
                   <div class="biz-badge__tip"></div>
                 </div>`,
          iconSize: [130, 44],
          iconAnchor: [65, 44],
        })
        const m = marker([session.lat, session.lng], { icon: badgeIcon })
        m.on('click', () => onSelect(session))
        cluster.addLayer(m)
        return
      }

      // Status dot — color by mode
      const dotClass = isInviteOut
        ? 'demo-marker__status-dot demo-marker__status-dot--invite'
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
    map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom ?? 14, { duration: 1.2 })
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

const MIN_ZOOM = 3
const HOME_ZOOM = 14

function EmptyMapState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📍</span>
      <p className={styles.emptyTitle}>Nobody out yet</p>
      <p className={styles.emptySub}>Be the first — tap Hanging Out and get discovered</p>
    </div>
  )
}

export default function DemoMapView({ sessions, onSelectUser, allVenues = [], activeVenues = [], onSelectVenue, venuesOn = false, onMapMove, flyTarget, homeMode = false, initialZoom = HOME_ZOOM }) {
  return (
    <div className={styles.wrapper}>
      {!venuesOn && sessions.length === 0 && <EmptyMapState />}
      <MapContainer
        center={[DEMO_CENTER.lat, DEMO_CENTER.lng]}
        zoom={initialZoom}
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
          : <LiveMarkers sessions={sessions} onSelect={onSelectUser} homeMode={homeMode} />
        }
      </MapContainer>
    </div>
  )
}
