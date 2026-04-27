/**
 * DeliveryMap — Mapbox GL live delivery tracker
 *
 * Features:
 * - GPS interpolation: smooth 60fps marker movement
 * - Offline resilience: keeps showing last position
 * - Dark INDOO-branded map style
 * - Route polyline
 * - Auto-zoom: fits route, zooms as driver approaches
 * - Fallback: branded placeholder if Mapbox fails
 * - Phase-aware demo: bike moves on the correct segment per driverPhase
 */
import { useRef, useEffect, useState } from 'react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

// Demo route: Yogyakarta area
const DEMO_ROUTE = [
  [-7.7928, 110.3657], // 0  start
  [-7.7915, 110.3665], // 1
  [-7.7900, 110.3672], // 2
  [-7.7885, 110.3680], // 3
  [-7.7870, 110.3688], // 4
  [-7.7855, 110.3695], // 5
  [-7.7840, 110.3702], // 6
  [-7.7825, 110.3710], // 7
  [-7.7810, 110.3718], // 8  restaurant
  [-7.7795, 110.3725], // 9
  [-7.7780, 110.3733], // 10
  [-7.7765, 110.3740], // 11
  [-7.7750, 110.3748], // 12
  [-7.7735, 110.3755], // 13 customer
]

// Segment boundaries keyed by phase
const PHASE_SEGMENTS = {
  to_restaurant: { start: 0, end: 8 },
  to_customer:   { start: 8, end: 13 },
  arrived:       { start: 13, end: 13 },
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }

function bearing(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

// Load Mapbox GL JS + CSS dynamically
let mapboxLoaded = null
function loadMapbox() {
  if (mapboxLoaded) return mapboxLoaded
  mapboxLoaded = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link')
      link.id = 'mapbox-css'
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css'
      document.head.appendChild(link)
    }
    // JS
    if (window.mapboxgl) { resolve(window.mapboxgl); return }
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js'
    script.onload = () => resolve(window.mapboxgl)
    script.onerror = () => reject(new Error('Mapbox failed to load'))
    document.head.appendChild(script)
  })
  return mapboxLoaded
}

export default function DeliveryMap({
  driverPhase = 'to_restaurant',
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  compact = false,
  style = {},
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastPosRef = useRef(null)
  const targetPosRef = useRef(null)
  const interpStartRef = useRef(0)
  const demoIdxRef = useRef(0)
  const demoTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const phaseRef = useRef(driverPhase)
  const [loadError, setLoadError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL
  const restLat = restaurantLat ?? DEMO_ROUTE[8][0]
  const restLng = restaurantLng ?? DEMO_ROUTE[8][1]
  const custLat = customerLat ?? DEMO_ROUTE[13][0]
  const custLng = customerLng ?? DEMO_ROUTE[13][1]

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = driverPhase
  }, [driverPhase])

  useEffect(() => {
    mountedRef.current = true

    // Inject pulse animation CSS once
    if (!document.getElementById('mapbox-pulse-style')) {
      const s = document.createElement('style')
      s.id = 'mapbox-pulse-style'
      s.textContent = '@keyframes driverPulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }'
      document.head.appendChild(s)
    }

    loadMapbox().then(mapboxgl => {
      if (!mountedRef.current || !containerRef.current) return

      mapboxgl.accessToken = MAPBOX_TOKEN

      // Bike starts at position [0] (the start of the route)
      const initialPos = isDemo
        ? [DEMO_ROUTE[0][1], DEMO_ROUTE[0][0]]
        : [driverLng ?? restLng, driverLat ?? restLat]

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialPos,
        zoom: 14,
        attributionControl: false,
        interactive: !compact,
      })
      mapRef.current = map

      map.on('load', () => {
        if (!mountedRef.current) return

        // Route line — always show the FULL path
        const routeCoords = isDemo
          ? DEMO_ROUTE.map(p => [p[1], p[0]])
          : [[restLng, restLat], [custLng, custLat]]

        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#8DC63F',
            'line-width': 4,
            'line-opacity': 0.7,
          },
        })

        // Restaurant marker
        const restEl = document.createElement('div')
        restEl.innerHTML = '<div style="width:28px;height:28px;background:#FACC15;border-radius:50%;border:3px solid #0a0a0a;display:flex;align-items:center;justify-content:center"><span style="font-size:12px">🍽️</span></div>'
        new mapboxgl.Marker({ element: restEl }).setLngLat([restLng, restLat]).addTo(map)

        // Customer marker
        const custEl = document.createElement('div')
        custEl.innerHTML = '<div style="width:28px;height:28px;background:#8DC63F;border-radius:50%;border:3px solid #0a0a0a;display:flex;align-items:center;justify-content:center"><span style="font-size:12px">📍</span></div>'
        new mapboxgl.Marker({ element: custEl }).setLngLat([custLng, custLat]).addTo(map)

        // Driver marker — starts at position [0]
        const driverEl = document.createElement('div')
        driverEl.innerHTML = `<div style="width:44px;height:44px;position:relative">
          <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #8DC63F;animation:driverPulse 1.5s infinite"></div>
          <img src="https://ik.imagekit.io/nepgaxllc/Untitledasdasdasaaaaaaaaaa-removebg-preview.png" style="width:44px;height:44px;object-fit:contain;transition:transform 0.5s ease" id="indoo-driver-icon" />
        </div>`
        driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl }).setLngLat(initialPos).addTo(map)
        lastPosRef.current = { lat: DEMO_ROUTE[0][0], lng: DEMO_ROUTE[0][1] }

        // Fit bounds to the current phase segment
        fitBoundsForPhase(map, mapboxgl, phaseRef.current)

        setMapLoaded(true)

        // Demo: animate driver along the current phase's segment only
        if (isDemo) {
          const seg = PHASE_SEGMENTS[phaseRef.current] || PHASE_SEGMENTS.to_restaurant
          demoIdxRef.current = seg.start

          demoTimerRef.current = setInterval(() => {
            if (!mountedRef.current) return

            const currentSeg = PHASE_SEGMENTS[phaseRef.current] || PHASE_SEGMENTS.to_restaurant

            // If arrived, don't move
            if (phaseRef.current === 'arrived') return

            // Only advance within the current segment
            if (demoIdxRef.current >= currentSeg.end) return

            demoIdxRef.current = Math.min(demoIdxRef.current + 1, currentSeg.end)
            const pos = DEMO_ROUTE[demoIdxRef.current]
            targetPosRef.current = { lat: pos[0], lng: pos[1] }
            interpStartRef.current = performance.now()
            const prev = DEMO_ROUTE[Math.max(currentSeg.start, demoIdxRef.current - 1)]
            lastPosRef.current = { lat: prev[0], lng: prev[1] }
          }, 4000)
        }
      })
    }).catch(() => {
      if (mountedRef.current) setLoadError(true)
    })

    return () => {
      mountedRef.current = false
      if (demoTimerRef.current) clearInterval(demoTimerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  // GPS interpolation loop
  useEffect(() => {
    if (!mapLoaded) return
    const INTERP_DURATION = 3000

    function animate() {
      if (!mountedRef.current || !driverMarkerRef.current) return
      const target = targetPosRef.current
      const last = lastPosRef.current
      if (target && last) {
        const elapsed = performance.now() - interpStartRef.current
        const t = Math.min(elapsed / INTERP_DURATION, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const currentLat = lerp(last.lat, target.lat, eased)
        const currentLng = lerp(last.lng, target.lng, eased)
        driverMarkerRef.current.setLngLat([currentLng, currentLat])

        // Rotate driver icon based on bearing — +180 because the bike image faces DOWN
        const head = bearing(last.lat, last.lng, target.lat, target.lng)
        const icon = document.getElementById('indoo-driver-icon')
        if (icon) icon.style.transform = `rotate(${head + 180}deg)`

        if (!compact && mapRef.current) {
          mapRef.current.easeTo({ center: [currentLng, currentLat], duration: 1000 })
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [mapLoaded, compact])

  // Live GPS updates (non-demo)
  useEffect(() => {
    if (isDemo || !mapLoaded || driverLat == null || driverLng == null) return
    if (lastPosRef.current && targetPosRef.current) {
      const elapsed = performance.now() - interpStartRef.current
      const t = Math.min(elapsed / 3000, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      lastPosRef.current = {
        lat: lerp(lastPosRef.current.lat, targetPosRef.current.lat, eased),
        lng: lerp(lastPosRef.current.lng, targetPosRef.current.lng, eased),
      }
    }
    targetPosRef.current = { lat: driverLat, lng: driverLng }
    interpStartRef.current = performance.now()
  }, [driverLat, driverLng, isDemo, mapLoaded])

  // Phase change: reset demo index to new segment start & adjust map bounds
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    if (isDemo) {
      const seg = PHASE_SEGMENTS[driverPhase] || PHASE_SEGMENTS.to_restaurant
      demoIdxRef.current = seg.start

      // Snap the bike to the segment start immediately
      const startPos = DEMO_ROUTE[seg.start]
      lastPosRef.current = { lat: startPos[0], lng: startPos[1] }
      targetPosRef.current = null
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([startPos[1], startPos[0]])
      }
    }

    // Fit map bounds to the current phase area
    if (!compact && window.mapboxgl) {
      fitBoundsForPhase(mapRef.current, window.mapboxgl, driverPhase)
    }

    // Zoom adjustments
    if (!compact) {
      if (driverPhase === 'arrived') {
        mapRef.current.easeTo({ zoom: 17, duration: 1000 })
      } else if (driverPhase === 'to_customer') {
        mapRef.current.easeTo({ zoom: 16, duration: 1000 })
      }
    }
  }, [driverPhase, mapLoaded, compact, isDemo])

  // Fallback UI if Mapbox fails to load
  if (loadError) {
    return (
      <div style={{ ...style, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: compact ? 12 : 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #8DC63F', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: 700 }}>INDOO Live Map</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: compact ? 12 : 0, overflow: 'hidden', ...style }}
    />
  )
}

/**
 * Fit map bounds to the relevant area for the given phase.
 */
function fitBoundsForPhase(map, mapboxgl, phase) {
  const seg = PHASE_SEGMENTS[phase] || PHASE_SEGMENTS.to_restaurant
  const bounds = new mapboxgl.LngLatBounds()
  for (let i = seg.start; i <= seg.end; i++) {
    bounds.extend([DEMO_ROUTE[i][1], DEMO_ROUTE[i][0]])
  }
  map.fitBounds(bounds, { padding: 60, duration: 1000 })
}
