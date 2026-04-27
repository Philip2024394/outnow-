/**
 * DriverMap — Mapbox GL for booking/ride page
 */
import { useEffect, useRef, useState } from 'react'
import styles from './DriverMap.module.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
const DEFAULT_CENTER = { lat: -7.797, lng: 110.370 }

const MOCK_DRIVERS = [
  { id: 'd1', type: 'bike_ride', lat: -7.799, lng: 110.372, online: true },
  { id: 'd2', type: 'bike_ride', lat: -7.803, lng: 110.363, online: true },
  { id: 'd3', type: 'car_taxi',  lat: -7.791, lng: 110.378, online: true },
  { id: 'd4', type: 'bike_ride', lat: -7.808, lng: 110.355, online: false },
  { id: 'd5', type: 'car_taxi',  lat: -7.787, lng: 110.383, online: true },
]

// Load Mapbox GL JS + CSS dynamically
let mapboxLoaded = null
function loadMapbox() {
  if (mapboxLoaded) return mapboxLoaded
  mapboxLoaded = new Promise((resolve, reject) => {
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link')
      link.id = 'mapbox-css'
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css'
      document.head.appendChild(link)
    }
    if (window.mapboxgl) { resolve(window.mapboxgl); return }
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js'
    script.onload = () => resolve(window.mapboxgl)
    script.onerror = () => reject(new Error('Mapbox failed'))
    document.head.appendChild(script)
  })
  return mapboxLoaded
}

export default function DriverMap({ userCoords, driverType = 'bike_ride', selectedDriverId = null, drivers = [] }) {
  const mapRef = useRef(null)
  const mapObjRef = useRef(null)
  const [error, setError] = useState(false)
  const center = userCoords ?? DEFAULT_CENTER
  const displayDrivers = drivers.length > 0 ? drivers : MOCK_DRIVERS
  const filtered = displayDrivers.filter(d => d.online && d.type === driverType)

  useEffect(() => {
    if (!mapRef.current) { setError(true); return }
    let cancelled = false

    loadMapbox().then(mapboxgl => {
      if (cancelled || !mapRef.current || mapObjRef.current) return

      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center.lng, center.lat],
        zoom: 14,
        attributionControl: false,
        interactive: false,
      })
      mapObjRef.current = map

      map.on('load', () => {
        if (cancelled) return

        // User marker
        const userEl = document.createElement('div')
        userEl.innerHTML = '<div style="width:16px;height:16px;border-radius:50%;background:#8DC63F;border:2px solid #fff;box-shadow:0 0 10px rgba(141,198,63,0.8)"></div>'
        new mapboxgl.Marker({ element: userEl }).setLngLat([center.lng, center.lat]).addTo(map)

        // Driver markers
        filtered.forEach(d => {
          const el = document.createElement('div')
          const isSelected = d.id === selectedDriverId
          const size = isSelected ? 36 : 28
          const imgUrl = d.type === 'car_taxi'
            ? 'https://ik.imagekit.io/nepgaxllc/Untitledsfsdfsfsd-removebg-preview.png'
            : 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasaaaaaaaaaa-removebg-preview.png'
          el.innerHTML = `<img src="${imgUrl}" style="width:${size}px;height:${size}px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));${isSelected ? 'border:2px solid #8DC63F;border-radius:50%;' : ''}" />`
          new mapboxgl.Marker({ element: el }).setLngLat([d.lng, d.lat]).addTo(map)
        })
      })
    }).catch(() => { if (!cancelled) setError(true) })

    return () => { cancelled = true; if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null } }
  }, [])

  useEffect(() => {
    if (mapObjRef.current && userCoords) mapObjRef.current.easeTo({ center: [userCoords.lng, userCoords.lat], duration: 500 })
  }, [userCoords?.lat, userCoords?.lng])

  if (error) {
    return (
      <div className={styles.mapWrap}>
        <div className={styles.map} style={{ position: 'relative', background: '#1a1a2e', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, background: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#8DC63F', border: '2px solid #fff', boxShadow: '0 0 10px rgba(141,198,63,0.8)', zIndex: 3 }} />
          {filtered.map((d, i) => (
            <div key={d.id} style={{ position: 'absolute', top: `${20 + (i * 20) % 60}%`, left: `${30 + (i * 15) % 60}%`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
              <img src={d.type === 'car_taxi' ? 'https://ik.imagekit.io/nepgaxllc/Untitledsfsdfsfsd-removebg-preview.png' : 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasaaaaaaaaaa-removebg-preview.png'} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(141,198,63,0.3)', fontWeight: 600 }}>INDOO · {filtered.length} drivers nearby</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mapWrap}>
      <div className={styles.map} ref={mapRef} />
    </div>
  )
}
