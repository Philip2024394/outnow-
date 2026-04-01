import { useCallback, useRef } from 'react'
import { GoogleMap } from '@react-google-maps/api'
import { useOverlay } from '@/contexts/OverlayContext'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useLiveUsers } from '@/hooks/useLiveUsers'
import { useInterests } from '@/hooks/useInterests'
import LiveUserMarker from './LiveUserMarker'
import MyLocationDot from './MyLocationDot'

const MAP_OPTIONS = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#080808' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f0f0f' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#222222' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#141414' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060606' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#383838' }] },
  ],
}

const DEFAULT_CENTER = { lat: 51.505, lng: -0.09 } // London fallback

export default function MapView() {
  const mapRef = useRef(null)
  const { openDiscovery } = useOverlay()
  const { coords } = useGeolocation({ watch: true })
  const { sessions } = useLiveUsers()
  const { mutualSessions } = useInterests()

  const onLoad = useCallback((map) => {
    mapRef.current = map
    // Pan to user if available
    if (coords) {
      map.panTo({ lat: coords.lat, lng: coords.lng })
      map.setZoom(14)
    }
  }, [coords]) // eslint-disable-line

  const center = coords
    ? { lat: coords.lat, lng: coords.lng }
    : DEFAULT_CENTER

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerClassName="map-container"
        center={center}
        zoom={14}
        options={MAP_OPTIONS}
        onLoad={onLoad}
      >
        {/* My location dot */}
        {coords && <MyLocationDot lat={coords.lat} lng={coords.lng} />}

        {/* Live user markers */}
        {sessions.map((session) => (
          <LiveUserMarker
            key={session.id}
            session={session}
            isMutual={mutualSessions.has(session.id)}
            onClick={() => openDiscovery(session)}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
