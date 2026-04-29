/**
 * DriverNavMap — Full-screen Mapbox GL navigation map for active trips.
 * Shows driver position, route polyline, destination marker.
 * Auto-recenters after 5s of user interaction.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
const RECENTER_DELAY = 5000

// Load Mapbox GL JS dynamically (reuse pattern from DriverMap.jsx)
let mapboxLoaded = null
function loadMapbox() {
  if (mapboxLoaded) return mapboxLoaded
  mapboxLoaded = new Promise((resolve, reject) => {
    if (!document.getElementById('mapbox-nav-css')) {
      const link = document.createElement('link')
      link.id = 'mapbox-nav-css'
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

export default function DriverNavMap({ driverPos, bearing, route, destination, isOffRoute }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [userInteracting, setUserInteracting] = useState(false)
  const recenterTimerRef = useRef(null)
  const [showRecenter, setShowRecenter] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return
    let cancelled = false

    loadMapbox().then(mapboxgl => {
      if (cancelled || !containerRef.current || mapRef.current) return

      mapboxgl.accessToken = MAPBOX_TOKEN
      const center = driverPos || { lat: -7.797, lng: 110.370 } // Yogyakarta default

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center: [center.lng, center.lat],
        zoom: 16,
        pitch: 45,
        bearing: bearing || 0,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      // Detect user interaction
      map.on('dragstart', () => { setUserInteracting(true); setShowRecenter(true); startRecenterTimer() })
      map.on('zoomstart', () => { setUserInteracting(true); setShowRecenter(true); startRecenterTimer() })

      map.on('load', () => {
        if (cancelled) return
        setMapReady(true)

        // Add route source (empty initially)
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#8DC63F',
            'line-width': 6,
            'line-opacity': 0.85,
          }
        })
        // Route outline for depth
        map.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#4a8c1a',
            'line-width': 10,
            'line-opacity': 0.3,
          }
        }, 'route-line')
      })

      mapRef.current = map
    }).catch(() => {})

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      clearTimeout(recenterTimerRef.current)
    }
  }, [])

  // Auto-recenter timer
  const startRecenterTimer = useCallback(() => {
    clearTimeout(recenterTimerRef.current)
    recenterTimerRef.current = setTimeout(() => {
      recenter()
    }, RECENTER_DELAY)
  }, [])

  const recenter = useCallback(() => {
    if (!mapRef.current || !driverPos) return
    setUserInteracting(false)
    setShowRecenter(false)
    clearTimeout(recenterTimerRef.current)
    mapRef.current.flyTo({
      center: [driverPos.lng, driverPos.lat],
      bearing: bearing || 0,
      pitch: 45,
      zoom: 16,
      duration: 1000,
    })
  }, [driverPos, bearing])

  // Update driver marker position
  useEffect(() => {
    if (!mapRef.current || !mapReady || !driverPos) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    if (!driverMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="width:28px;height:28px;position:relative">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(141,198,63,0.25);animation:navPulse 2s ease-in-out infinite"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;background:#8DC63F;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>
          <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%) rotate(${bearing}deg);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #8DC63F"></div>
        </div>
      `
      driverMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([driverPos.lng, driverPos.lat])
        .addTo(mapRef.current)

      // Inject pulse animation
      if (!document.getElementById('nav-pulse-style')) {
        const style = document.createElement('style')
        style.id = 'nav-pulse-style'
        style.textContent = '@keyframes navPulse { 0%,100% { transform:scale(1);opacity:0.6 } 50% { transform:scale(1.5);opacity:0 } }'
        document.head.appendChild(style)
      }
    } else {
      driverMarkerRef.current.setLngLat([driverPos.lng, driverPos.lat])
    }

    // Follow driver if not user-interacting
    if (!userInteracting) {
      mapRef.current.easeTo({
        center: [driverPos.lng, driverPos.lat],
        bearing: bearing || 0,
        duration: 1000,
      })
    }
  }, [driverPos, bearing, mapReady, userInteracting])

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current || !mapReady || !destination) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    if (!destMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`
      destMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([destination.lng, destination.lat])
        .addTo(mapRef.current)
    } else {
      destMarkerRef.current.setLngLat([destination.lng, destination.lat])
    }
  }, [destination, mapReady])

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current || !mapReady || !route?.decodedPath) return
    const source = mapRef.current.getSource('route')
    if (!source) return

    const coordinates = route.decodedPath.map(p => [p.lng, p.lat])
    source.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates }
    })
  }, [route, mapReady])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Off-route warning */}
      {isOffRoute && (
        <div style={{
          position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 12, fontWeight: 800, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⚠️</span> Re-routing...
        </div>
      )}

      {/* Recenter button */}
      {showRecenter && (
        <button
          onClick={recenter}
          style={{
            position: 'absolute', bottom: 160, right: 16, zIndex: 10,
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            border: '2px solid rgba(141,198,63,0.4)',
            color: '#8DC63F', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
          </svg>
        </button>
      )}
    </div>
  )
}
