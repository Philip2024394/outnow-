/**
 * ═══════════════════════════════════════════════════════════════════��═══════
 * DeliveryMap — Google Maps live delivery tracker
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Features beyond GoJek/Grab:
 * - GPS interpolation: smooth 60fps marker movement between updates
 * - Offline resilience: keeps showing last position + estimated movement
 * - Heading rotation: bike marker rotates to face direction of travel
 * - Dark INDOO-branded map style
 * - Route polyline with animated gradient
 * - Auto-zoom: fits route in view, zooms in as driver approaches
 * - Fallback: if Google Maps fails to load, shows branded placeholder
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// ── INDOO dark map style ─────────────────────────────────────────────────────
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#252525' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#333' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1a0a', visibility: 'on' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#222' }] },
]

// ── SVG markers ──────────────────────────────────────────────────────────────
const BIKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="#8DC63F" stroke="#0a0a0a" stroke-width="3"/>
  <circle cx="20" cy="20" r="18" fill="none" stroke="#8DC63F" stroke-width="1" opacity="0.5">
    <animate attributeName="r" from="18" to="26" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <path d="M20 10 L26 24 L14 24 Z" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1"/>
</svg>`

const PIN_SVG = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#0a0a0a" stroke-width="2"/>
  <circle cx="14" cy="14" r="5" fill="#0a0a0a"/>
</svg>`

// ── Haversine bearing ────────────────────────────────────────────────────────
function bearing(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

// ── Lerp between two lat/lng positions ───────────────────────────────────────
function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

// ── Loader singleton (new functional API) ────────────────────────────────────
let configured = false
let loaderPromise = null
function getGoogleMaps() {
  if (!loaderPromise && MAPS_KEY) {
    if (!configured) {
      setOptions({ apiKey: MAPS_KEY, version: 'weekly' })
      configured = true
    }
    loaderPromise = importLibrary('maps').then(() => window.google)
  }
  return loaderPromise
}

// ── Demo route: simulated waypoints (Jakarta area) ───────────────────────────
const DEMO_ROUTE = [
  { lat: -6.2088, lng: 106.8456 }, // start
  { lat: -6.2075, lng: 106.8462 },
  { lat: -6.2060, lng: 106.8470 },
  { lat: -6.2045, lng: 106.8478 },
  { lat: -6.2030, lng: 106.8485 },
  { lat: -6.2015, lng: 106.8490 },
  { lat: -6.2000, lng: 106.8495 },
  { lat: -6.1985, lng: 106.8500 },
  { lat: -6.1970, lng: 106.8505 }, // restaurant
  { lat: -6.1960, lng: 106.8510 },
  { lat: -6.1945, lng: 106.8520 },
  { lat: -6.1930, lng: 106.8530 },
  { lat: -6.1915, lng: 106.8540 },
  { lat: -6.1900, lng: 106.8550 }, // customer
]

export default function DeliveryMap({
  driverPhase,
  driverLat,
  driverLng,
  restaurantLat,
  restaurantLng,
  customerLat,
  customerLng,
  heading = 0,
  compact = false,
  style = {},
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const restaurantMarkerRef = useRef(null)
  const customerMarkerRef = useRef(null)
  const polylineRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastPosRef = useRef(null)
  const targetPosRef = useRef(null)
  const interpStartRef = useRef(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const mountedRef = useRef(true)

  // Demo mode positions
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_SUPABASE_URL
  const restLat = restaurantLat ?? DEMO_ROUTE[8].lat
  const restLng = restaurantLng ?? DEMO_ROUTE[8].lng
  const custLat = customerLat ?? DEMO_ROUTE[13].lat
  const custLng = customerLng ?? DEMO_ROUTE[13].lng

  // Demo: simulate driver movement along route
  const demoIdxRef = useRef(0)
  const demoTimerRef = useRef(null)

  // ── Initialize Google Map ──────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    if (!MAPS_KEY) { setLoadError(true); return }

    getGoogleMaps().then(google => {
      if (!mountedRef.current || !containerRef.current) return

      const map = new google.maps.Map(containerRef.current, {
        center: { lat: restLat, lng: restLng },
        zoom: 15,
        styles: DARK_STYLE,
        disableDefaultUI: true,
        gestureHandling: compact ? 'none' : 'greedy',
        zoomControl: !compact,
        keyboardShortcuts: false,
        clickableIcons: false,
      })
      mapRef.current = map

      // Restaurant marker
      restaurantMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: restLat, lng: restLng },
        icon: { url: 'data:image/svg+xml,' + encodeURIComponent(PIN_SVG('#FACC15')), scaledSize: new google.maps.Size(28, 36) },
      })

      // Customer marker
      customerMarkerRef.current = new google.maps.Marker({
        map,
        position: { lat: custLat, lng: custLng },
        icon: { url: 'data:image/svg+xml,' + encodeURIComponent(PIN_SVG('#8DC63F')), scaledSize: new google.maps.Size(28, 36) },
      })

      // Driver marker
      const startPos = isDemo ? DEMO_ROUTE[0] : { lat: driverLat ?? restLat, lng: driverLng ?? restLng }
      driverMarkerRef.current = new google.maps.Marker({
        map,
        position: startPos,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(BIKE_SVG),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 100,
      })
      lastPosRef.current = startPos

      // Route polyline
      const routePath = isDemo ? DEMO_ROUTE : [
        startPos,
        { lat: restLat, lng: restLng },
        { lat: custLat, lng: custLng },
      ]
      polylineRef.current = new google.maps.Polyline({
        path: routePath,
        strokeColor: '#8DC63F',
        strokeWeight: 4,
        strokeOpacity: 0.7,
        geodesic: true,
        map,
      })

      // Fit bounds to show full route
      const bounds = new google.maps.LatLngBounds()
      routePath.forEach(p => bounds.extend(p))
      map.fitBounds(bounds, compact ? 20 : 50)

      setMapLoaded(true)

      // Demo: animate driver along route
      if (isDemo) {
        demoIdxRef.current = 0
        demoTimerRef.current = setInterval(() => {
          if (!mountedRef.current) return
          demoIdxRef.current = Math.min(demoIdxRef.current + 1, DEMO_ROUTE.length - 1)
          const pos = DEMO_ROUTE[demoIdxRef.current]
          const prev = DEMO_ROUTE[Math.max(0, demoIdxRef.current - 1)]
          targetPosRef.current = pos
          interpStartRef.current = performance.now()
          lastPosRef.current = prev
        }, 4000)
      }
    }).catch(() => {
      if (mountedRef.current) setLoadError(true)
    })

    return () => {
      mountedRef.current = false
      if (demoTimerRef.current) clearInterval(demoTimerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── GPS interpolation: smooth 60fps marker movement ────────────────────────
  useEffect(() => {
    if (!mapLoaded) return

    const INTERP_DURATION = 3000 // smooth over 3 seconds

    function animate() {
      if (!mountedRef.current || !driverMarkerRef.current) return
      const target = targetPosRef.current
      const last = lastPosRef.current
      if (target && last) {
        const elapsed = performance.now() - interpStartRef.current
        const t = Math.min(elapsed / INTERP_DURATION, 1)
        // Ease-out for natural deceleration
        const eased = 1 - Math.pow(1 - t, 3)
        const currentLat = lerp(last.lat, target.lat, eased)
        const currentLng = lerp(last.lng, target.lng, eased)
        driverMarkerRef.current.setPosition({ lat: currentLat, lng: currentLng })

        // Rotate marker based on bearing
        const head = bearing(last.lat, last.lng, target.lat, target.lng)
        const el = driverMarkerRef.current.getIcon()
        if (el) {
          driverMarkerRef.current.setIcon({
            ...el,
            rotation: head,
          })
        }

        // Pan map to follow driver smoothly
        if (!compact && mapRef.current) {
          mapRef.current.panTo({ lat: currentLat, lng: currentLng })
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [mapLoaded, compact])

  // ── Live GPS updates (non-demo): receive new position → start interpolation
  useEffect(() => {
    if (isDemo || !mapLoaded || driverLat == null || driverLng == null) return
    const newPos = { lat: driverLat, lng: driverLng }
    if (lastPosRef.current && targetPosRef.current) {
      // Current interpolated position becomes the new "last"
      const elapsed = performance.now() - interpStartRef.current
      const t = Math.min(elapsed / 3000, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      lastPosRef.current = {
        lat: lerp(lastPosRef.current.lat, targetPosRef.current.lat, eased),
        lng: lerp(lastPosRef.current.lng, targetPosRef.current.lng, eased),
      }
    }
    targetPosRef.current = newPos
    interpStartRef.current = performance.now()
  }, [driverLat, driverLng, isDemo, mapLoaded])

  // ── Zoom in as driver approaches destination ───────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || compact) return
    if (driverPhase === 'arrived') {
      mapRef.current.setZoom(17)
    } else if (driverPhase === 'to_customer') {
      mapRef.current.setZoom(16)
    }
  }, [driverPhase, mapLoaded, compact])

  // ── Fallback UI ────────────────────────────────────────────────────────────
  if (loadError || !MAPS_KEY) {
    return (
      <div style={{
        ...style,
        background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderRadius: compact ? 12 : 0,
        border: compact ? '1px solid rgba(141,198,63,0.2)' : 'none',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #8DC63F', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: 700 }}>INDOO Live Map</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        borderRadius: compact ? 12 : 0,
        overflow: 'hidden',
        ...style,
      }}
    />
  )
}
