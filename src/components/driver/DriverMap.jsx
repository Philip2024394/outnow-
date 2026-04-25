/**
 * DriverMap — Google Maps for booking page
 * Uses same loader pattern as DeliveryMap (functional API)
 */
import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import styles from './DriverMap.module.css'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? import.meta.env.VITE_GOOGLE_DIRECTIONS_KEY ?? ''
const DEFAULT_CENTER = { lat: -7.797, lng: 110.370 }

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a6a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

const MOCK_DRIVERS = [
  { id: 'd1', type: 'bike_ride', lat: -7.799, lng: 110.372, online: true },
  { id: 'd2', type: 'bike_ride', lat: -7.803, lng: 110.363, online: true },
  { id: 'd3', type: 'car_taxi',  lat: -7.791, lng: 110.378, online: true },
  { id: 'd4', type: 'bike_ride', lat: -7.808, lng: 110.355, online: false },
  { id: 'd5', type: 'car_taxi',  lat: -7.787, lng: 110.383, online: true },
]

// Shared loader — same pattern as DeliveryMap.jsx
let loaderPromise = null
function loadGoogle() {
  if (loaderPromise) return loaderPromise
  if (!API_KEY) return Promise.reject('no key')
  try { setOptions({ apiKey: API_KEY, version: 'weekly' }) } catch {}
  loaderPromise = importLibrary('maps').then(() => window.google)
  return loaderPromise
}

export default function DriverMap({ userCoords, driverType = 'bike_ride', selectedDriverId = null, drivers = [] }) {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const [error, setError] = useState(false)
  const center = userCoords ?? DEFAULT_CENTER
  const displayDrivers = drivers.length > 0 ? drivers : MOCK_DRIVERS
  const filtered = displayDrivers.filter(d => d.online && d.type === driverType)

  useEffect(() => {
    if (!mapRef.current || !API_KEY) { setError(true); return }
    let cancelled = false

    loadGoogle().then(google => {
      if (cancelled || !mapRef.current || mapObjRef.current) return

      const map = new google.maps.Map(mapRef.current, {
        center, zoom: 14,
        disableDefaultUI: true,
        styles: MAP_STYLES,
        gestureHandling: 'none',
        keyboardShortcuts: false,
      })
      mapObjRef.current = map

      // User marker — green dot
      new google.maps.Marker({
        position: center, map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#8DC63F', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        zIndex: 10,
      })

      // Driver markers
      filtered.forEach(d => {
        new google.maps.Marker({
          position: { lat: d.lat, lng: d.lng }, map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: d.id === selectedDriverId ? '#8DC63F' : '#fff', fillOpacity: 0.7, strokeColor: 'rgba(255,255,255,0.3)', strokeWeight: 1 },
        })
      })
    }).catch(() => { if (!cancelled) setError(true) })

    return () => { cancelled = true }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (mapObjRef.current && userCoords) mapObjRef.current.panTo(userCoords)
  }, [userCoords?.lat, userCoords?.lng])

  if (error) {
    return (
      <div className={styles.mapWrap}>
        <div className={styles.map} style={{ position: 'relative', background: '#1a1a2e', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#8DC63F', border: '2px solid #fff', boxShadow: '0 0 10px rgba(141,198,63,0.8)', zIndex: 3 }} />
          {filtered.map((d, i) => (
            <div key={d.id} style={{ position: 'absolute', top: `${20 + (i * 20) % 60}%`, left: `${30 + (i * 15) % 60}%`, fontSize: 16, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
              {d.type === 'car_taxi' ? '🚗' : '🛵'}
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(141,198,63,0.3)', fontWeight: 600 }}>INDOO · {filtered.length} drivers nearby</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mapWrap}>
      <div ref={mapRef} className={styles.map} style={{ touchAction: 'pan-y' }} />
    </div>
  )
}
