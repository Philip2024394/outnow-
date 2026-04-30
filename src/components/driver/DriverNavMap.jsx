/**
 * DriverNavMap — Ultimate full-screen Mapbox GL navigation map.
 *
 * Features:
 * - 3D buildings + navigation-night style
 * - Glowing animated route polyline with traveled/remaining segments
 * - Navigation chevron marker (rotates with bearing)
 * - Pulsing destination pin with label
 * - Route overview toggle (zoom to fit entire route)
 * - 3D street-view / 2D top-down perspective toggle
 * - Speed display HUD
 * - Recenter button with auto-recenter timer
 * - Off-route warning banner
 */
import { useEffect, useRef, useState, useCallback } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''
const RECENTER_DELAY = 5000

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

// Inject CSS animations once
function injectStyles() {
  if (document.getElementById('nav-ultimate-style')) return
  const style = document.createElement('style')
  style.id = 'nav-ultimate-style'
  style.textContent = `
    @keyframes navPulseRing { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.2);opacity:0} }
    @keyframes destPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.8);opacity:0} }
    @keyframes routeGlow { 0%{line-dashoffset:0} 100%{line-dashoffset:40} }
    @keyframes speedPulse { 0%,100%{box-shadow:0 0 12px rgba(141,198,63,0.3)} 50%{box-shadow:0 0 24px rgba(141,198,63,0.6)} }
    @keyframes offRoutePulse { 0%,100%{opacity:0.85} 50%{opacity:1} }
    .nav-ctrl-btn {
      width:44px; height:44px; border-radius:12px; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      background:rgba(15,15,20,0.85); backdrop-filter:blur(16px);
      border:1.5px solid rgba(255,255,255,0.08);
      box-shadow:0 4px 20px rgba(0,0,0,0.5);
      transition:all 0.2s ease;
    }
    .nav-ctrl-btn:active { transform:scale(0.92); }
    .nav-ctrl-btn.active { border-color:rgba(141,198,63,0.5); background:rgba(141,198,63,0.12); }
  `
  document.head.appendChild(style)
}

export default function DriverNavMap({
  driverPos, bearing, route, destination, pickup, isOffRoute,
  speedKmh = 0, closestIdx = 0, onOpenChat, onToggleFooter, footerVisible = true,
  onToggleDirections, directionsVisible = false, children, destinationLabel,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const chevronElRef = useRef(null)
  const destMarkerRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [userInteracting, setUserInteracting] = useState(false)
  const recenterTimerRef = useRef(null)
  const [showRecenter, setShowRecenter] = useState(false)
  const [isOverview, setIsOverview] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const initialOverviewDone = useRef(false)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return
    let cancelled = false
    injectStyles()

    loadMapbox().then(mapboxgl => {
      if (cancelled || !containerRef.current || mapRef.current) return

      mapboxgl.accessToken = MAPBOX_TOKEN
      const center = driverPos || { lat: -7.797, lng: 110.370 }

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center: [center.lng, center.lat],
        zoom: 17.5,
        pitch: 70,
        bearing: bearing || 0,
        attributionControl: false,
        antialias: true,
      })

      // Detect user interaction
      const onInteract = () => { setUserInteracting(true); setShowRecenter(true); startRecenterTimer() }
      map.on('dragstart', onInteract)
      map.on('zoomstart', onInteract)
      map.on('pitchstart', onInteract)

      map.on('load', () => {
        if (cancelled) return
        setMapReady(true)

        // 3D buildings layer
        const layers = map.getStyle().layers
        const labelLayer = layers?.find(l => l.type === 'symbol' && l.layout?.['text-field'])
        map.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#1a1a2e',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7,
          }
        }, labelLayer?.id)

        // Route glow (outermost)
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        })
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8DC63F', 'line-width': 18, 'line-opacity': 0.12, 'line-blur': 8 }
        })
        map.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#5a9e20', 'line-width': 10, 'line-opacity': 0.35 }
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8DC63F', 'line-width': 6, 'line-opacity': 0.9 }
        })

        // Traveled path (gray overlay)
        map.addSource('route-traveled', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        })
        map.addLayer({
          id: 'route-traveled-line',
          type: 'line',
          source: 'route-traveled',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#555555', 'line-width': 6, 'line-opacity': 0.7 }
        })
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
    recenterTimerRef.current = setTimeout(() => recenter(), RECENTER_DELAY)
  }, [])

  const recenter = useCallback(() => {
    if (!mapRef.current || !driverPos) return
    setUserInteracting(false)
    setShowRecenter(false)
    setIsOverview(false)
    clearTimeout(recenterTimerRef.current)
    mapRef.current.flyTo({
      center: [driverPos.lng, driverPos.lat],
      bearing: bearing || 0,
      pitch: is3D ? 70 : 0,
      zoom: is3D ? 17.5 : 16,
      duration: 1200,
    })
  }, [driverPos, bearing, is3D])

  // Route overview — fit entire route in view
  const toggleOverview = useCallback(() => {
    if (!mapRef.current || !route?.decodedPath?.length) return
    if (isOverview) {
      recenter()
      return
    }
    setIsOverview(true)
    setUserInteracting(true)

    const path = route.decodedPath
    const bounds = new window.mapboxgl.LngLatBounds()
    path.forEach(p => bounds.extend([p.lng, p.lat]))
    if (destination) bounds.extend([destination.lng, destination.lat])
    if (pickup) bounds.extend([pickup.lng, pickup.lat])
    if (driverPos) bounds.extend([driverPos.lng, driverPos.lat])

    mapRef.current.fitBounds(bounds, {
      padding: { top: 120, bottom: 200, left: 60, right: 60 },
      pitch: 30,
      bearing: 0,
      duration: 1200,
    })
  }, [route, destination, pickup, driverPos, isOverview, recenter])

  // Toggle 3D/2D
  const toggle3D = useCallback(() => {
    if (!mapRef.current) return
    const next = !is3D
    setIs3D(next)
    mapRef.current.easeTo({
      pitch: next ? 70 : 0,
      zoom: next ? 17.5 : 15,
      duration: 800,
    })
  }, [is3D])

  // Update driver marker (navigation chevron)
  useEffect(() => {
    if (!mapRef.current || !mapReady || !driverPos) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    if (!driverMarkerRef.current) {
      const el = document.createElement('div')
      el.style.cssText = 'width:52px;height:52px;position:relative;'
      el.innerHTML = `
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(141,198,63,0.15);animation:navPulseRing 2s ease-in-out infinite"></div>
          <svg width="36" height="36" viewBox="0 0 36 36" style="position:relative;z-index:2;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">
            <defs>
              <linearGradient id="chevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a8e650"/>
                <stop offset="100%" stop-color="#6ba020"/>
              </linearGradient>
            </defs>
            <path d="M18 2 L30 28 L18 22 L6 28 Z" fill="url(#chevGrad)" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
      `
      chevronElRef.current = el
      driverMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map',
        pitchAlignment: 'map',
      })
        .setRotation(bearing || 0)
        .setLngLat([driverPos.lng, driverPos.lat])
        .addTo(mapRef.current)
    } else {
      driverMarkerRef.current.setLngLat([driverPos.lng, driverPos.lat])
      driverMarkerRef.current.setRotation(bearing || 0)
    }

    // Follow driver if not user-interacting
    if (!userInteracting && !isOverview) {
      mapRef.current.easeTo({
        center: [driverPos.lng, driverPos.lat],
        bearing: bearing || 0,
        duration: 1200,
      })
    }
  }, [driverPos, bearing, mapReady, userInteracting, isOverview])

  // Update pickup marker (start flag)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    // Remove marker if pickup is null
    if (!pickup) {
      if (pickupMarkerRef.current) { pickupMarkerRef.current.remove(); pickupMarkerRef.current = null }
      return
    }
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    if (!pickupMarkerRef.current) {
      const el = document.createElement('div')
      el.style.cssText = 'width:52px;height:64px;position:relative;z-index:10;pointer-events:none;'
      el.innerHTML = `
        <div style="position:absolute;left:10px;bottom:0;width:3px;height:52px;background:linear-gradient(to bottom,#8DC63F,#5a9e20);border-radius:2px;box-shadow:0 0 6px rgba(141,198,63,0.4)"></div>
        <div style="position:absolute;left:13px;top:0;width:30px;height:20px;background:linear-gradient(135deg,#8DC63F,#6ba020);border-radius:2px 4px 4px 0;box-shadow:0 2px 8px rgba(141,198,63,0.4);display:flex;align-items:center;justify-content:center">
          <span style="font-size:7px;font-weight:900;color:#fff;letter-spacing:0.5px">START</span>
        </div>
        <div style="position:absolute;left:6px;bottom:0;width:10px;height:10px;border-radius:50%;background:rgba(141,198,63,0.2);animation:destPulse 2s ease-in-out infinite"></div>
        <div style="position:absolute;left:8px;bottom:2px;width:6px;height:6px;border-radius:50%;background:#8DC63F;box-shadow:0 0 6px rgba(141,198,63,0.6)"></div>
      `
      pickupMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(mapRef.current)
    } else {
      pickupMarkerRef.current.setLngLat([pickup.lng, pickup.lat])
    }
  }, [pickup, mapReady])

  // Update destination marker (finish flag)
  useEffect(() => {
    if (!mapRef.current || !mapReady || !destination) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    // Remove old marker if destination changed significantly
    if (destMarkerRef.current) {
      const cur = destMarkerRef.current.getLngLat()
      if (Math.abs(cur.lat - destination.lat) > 0.0001 || Math.abs(cur.lng - destination.lng) > 0.0001) {
        destMarkerRef.current.remove()
        destMarkerRef.current = null
      }
    }

    if (!destMarkerRef.current) {
      const el = document.createElement('div')
      el.style.cssText = 'width:52px;height:64px;position:relative;z-index:10;pointer-events:none;'
      el.innerHTML = `
        <div style="position:absolute;left:10px;bottom:0;width:3px;height:52px;background:linear-gradient(to bottom,#EF4444,#B91C1C);border-radius:2px;box-shadow:0 0 6px rgba(239,68,68,0.4)"></div>
        <div style="position:absolute;left:13px;top:0;width:30px;height:20px;overflow:hidden;border-radius:2px 4px 4px 0;box-shadow:0 2px 8px rgba(239,68,68,0.4)">
          <div style="width:100%;height:100%;background:repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 0 0/10px 10px;opacity:0.9"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span style="font-size:7px;font-weight:900;color:#EF4444;letter-spacing:0.5px;text-shadow:0 0 3px rgba(0,0,0,0.8)">${destinationLabel || 'FINISH'}</span>
          </div>
        </div>
        <div style="position:absolute;left:6px;bottom:0;width:10px;height:10px;border-radius:50%;background:rgba(239,68,68,0.2);animation:destPulse 2s ease-in-out infinite"></div>
        <div style="position:absolute;left:8px;bottom:2px;width:6px;height:6px;border-radius:50%;background:#EF4444;box-shadow:0 0 6px rgba(239,68,68,0.6)"></div>
      `
      destMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([destination.lng, destination.lat])
        .addTo(mapRef.current)
    } else {
      destMarkerRef.current.setLngLat([destination.lng, destination.lat])
    }
  }, [destination, mapReady])

  // Initial route overview — show route for 3s then follow driver
  useEffect(() => {
    if (!mapRef.current || !mapReady || initialOverviewDone.current) return
    if (!destination) return
    initialOverviewDone.current = true

    const bounds = new window.mapboxgl.LngLatBounds()
    bounds.extend([destination.lng, destination.lat])
    if (pickup) bounds.extend([pickup.lng, pickup.lat])
    if (driverPos) bounds.extend([driverPos.lng, driverPos.lat])

    mapRef.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 200, left: 60, right: 60 },
      pitch: 30,
      bearing: 0,
      duration: 1000,
    })

    // After 3s, zoom to follow driver
    setTimeout(() => {
      if (!mapRef.current || !driverPos) return
      mapRef.current.flyTo({
        center: [driverPos.lng, driverPos.lat],
        bearing: bearing || 0,
        pitch: 70,
        zoom: 17.5,
        duration: 1500,
      })
    }, 3000)
  }, [mapReady, pickup, destination])

  // Update route polyline + traveled segment
  useEffect(() => {
    if (!mapRef.current || !mapReady || !route?.decodedPath) return

    const source = mapRef.current.getSource('route')
    const traveledSource = mapRef.current.getSource('route-traveled')
    if (!source) return

    const fullCoords = route.decodedPath.map(p => [p.lng, p.lat])
    source.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: fullCoords }
    })

    // Update traveled portion
    if (traveledSource && closestIdx > 0) {
      const traveled = fullCoords.slice(0, closestIdx + 1)
      traveledSource.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: traveled }
      })
    }
  }, [route, mapReady, closestIdx])

  // Floating control buttons (left side)
  const btnStyle = {
    display: 'flex', flexDirection: 'column', gap: 8,
    position: 'absolute', left: 12, zIndex: 15,
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Off-route warning */}
      {isOffRoute && (
        <div style={{
          position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(200,40,40,0.95))',
          backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: 13, fontWeight: 800, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px rgba(239,68,68,0.4)',
          animation: 'offRoutePulse 1s ease-in-out infinite',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Re-routing...
        </div>
      )}

      {/* Right-side nav panel */}
      <div style={{
        position: 'absolute', right: 12, top: 110, zIndex: 15,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Directions toggle */}
        {onToggleDirections && (
          <button
            className={`nav-ctrl-btn ${directionsVisible ? 'active' : ''}`}
            onClick={onToggleDirections}
            title={directionsVisible ? 'Hide directions' : 'Show directions'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={directionsVisible ? '#8DC63F' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </button>
        )}

        {/* Route overview */}
        <button
          className={`nav-ctrl-btn ${isOverview ? 'active' : ''}`}
          onClick={toggleOverview}
          title={isOverview ? 'Back to navigation' : 'Route overview'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isOverview ? '#8DC63F' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        </button>

        {/* 3D / 2D toggle */}
        <button
          className={`nav-ctrl-btn ${is3D ? 'active' : ''}`}
          onClick={toggle3D}
          title={is3D ? 'Switch to 2D' : 'Switch to 3D street view'}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: is3D ? '#8DC63F' : '#aaa' }}>
            {is3D ? '3D' : '2D'}
          </span>
        </button>

        {/* Recenter */}
        {showRecenter && (
          <button className="nav-ctrl-btn" onClick={recenter} title="Recenter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
            </svg>
          </button>
        )}

        {/* Toggle footer (customer details) */}
        {onToggleFooter && (
          <button
            className={`nav-ctrl-btn ${!footerVisible ? 'active' : ''}`}
            onClick={onToggleFooter}
            title={footerVisible ? 'Hide details' : 'Show details'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={footerVisible ? '#aaa' : '#8DC63F'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {footerVisible
                ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
          </button>
        )}
      </div>

      {/* Render children overlays inside the map stacking context */}
      {children}
    </div>
  )
}
