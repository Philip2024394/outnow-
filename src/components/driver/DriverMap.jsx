/**
 * DriverMap — lightweight Google Maps embed for booking page
 * Shows user location + nearby drivers. No scroll blocking.
 */
import { useEffect, useRef } from 'react'
import styles from './DriverMap.module.css'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''
const DEFAULT_CENTER = { lat: -7.797, lng: 110.370 } // Yogyakarta

// INDOO dark map style
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a6a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

// Mock drivers for demo
const MOCK_DRIVERS = [
  { id: 'd1', name: 'Budi',   type: 'bike_ride', lat: -7.797, lng: 110.370, online: true  },
  { id: 'd2', name: 'Ani',    type: 'bike_ride', lat: -7.803, lng: 110.363, online: true  },
  { id: 'd3', name: 'Citra',  type: 'car_taxi',  lat: -7.791, lng: 110.378, online: true  },
  { id: 'd4', name: 'Hendra', type: 'bike_ride', lat: -7.808, lng: 110.355, online: false },
  { id: 'd5', name: 'Sari',   type: 'car_taxi',  lat: -7.787, lng: 110.383, online: true  },
]

export default function DriverMap({ userCoords, driverType = 'bike_ride', selectedDriverId = null, drivers = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const center = userCoords ?? DEFAULT_CENTER

  const displayDrivers = drivers.length > 0 ? drivers : MOCK_DRIVERS
  const filtered = displayDrivers.filter(d => d.online && d.type === driverType)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) return // already initialized

    // Try Google Maps
    if (window.google?.maps) {
      initGoogleMap()
      return
    }

    // Load Google Maps API
    if (API_KEY) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`
      script.async = true
      script.onload = () => initGoogleMap()
      script.onerror = () => initFallback()
      document.head.appendChild(script)
    } else {
      initFallback()
    }
  }, []) // eslint-disable-line

  function initGoogleMap() {
    if (!mapRef.current || !window.google?.maps) return
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      styles: MAP_STYLES,
      gestureHandling: 'none', // prevents scroll hijacking
      keyboardShortcuts: false,
    })
    mapInstanceRef.current = map

    // User marker
    new window.google.maps.Marker({
      position: center,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#8DC63F',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      zIndex: 10,
    })

    // Driver markers
    filtered.forEach(d => {
      const marker = new window.google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: d.id === selectedDriverId ? '#8DC63F' : '#fff',
          fillOpacity: 0.8,
          strokeColor: d.id === selectedDriverId ? '#8DC63F' : 'rgba(255,255,255,0.3)',
          strokeWeight: 1,
        },
        label: {
          text: d.type === 'car_taxi' ? '🚗' : '🛵',
          fontSize: '16px',
        },
      })
      markersRef.current.push(marker)
    })
  }

  function initFallback() {
    // CSS fallback map — dark grid with driver dots
    if (!mapRef.current) return
    mapRef.current.innerHTML = `
      <div style="position:relative;width:100%;height:100%;background:#1a1a2e;overflow:hidden">
        <div style="position:absolute;inset:0;opacity:0.06;background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(141,198,63,0.3) 40px)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#8DC63F;border:2px solid #fff;box-shadow:0 0 10px rgba(141,198,63,0.8);z-index:3"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:rgba(141,198,63,0.15);animation:pulse 2s ease-in-out infinite;z-index:2"></div>
        ${filtered.map((d, i) => {
          const x = 30 + (i * 15) % 60
          const y = 20 + (i * 20) % 60
          return `<div style="position:absolute;top:${y}%;left:${x}%;font-size:16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))">${d.type === 'car_taxi' ? '🚗' : '🛵'}</div>`
        }).join('')}
        <div style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(141,198,63,0.3);font-weight:600;letter-spacing:0.04em">INDOO MAP · ${filtered.length} drivers nearby</div>
      </div>
      <style>@keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6}50%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}</style>
    `
  }

  // Update center when coords change
  useEffect(() => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.panTo(userCoords)
    }
  }, [userCoords?.lat, userCoords?.lng])

  return (
    <div className={styles.mapWrap}>
      <div ref={mapRef} className={styles.map} style={{ touchAction: 'pan-y' }} />
    </div>
  )
}
