/**
 * PropertyMap — Leaflet map showing property location pin.
 * Works on both app and website.
 */
import { useEffect, useRef } from 'react'

// Leaflet is imported globally in main.jsx
const L = typeof window !== 'undefined' ? window.L : null

const DEFAULT_CENTER = [-7.7928, 110.3653] // Yogyakarta
const DEFAULT_ZOOM = 14

export default function PropertyMap({ lat, lng, title, height = 200, style = {} }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)

  const mapLat = lat || DEFAULT_CENTER[0]
  const mapLng = lng || DEFAULT_CENTER[1]

  useEffect(() => {
    if (!L || !containerRef.current) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

    const map = L.map(containerRef.current, {
      center: [mapLat, mapLng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Custom green marker
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:#8DC63F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="transform:rotate(45deg);font-size:14px">🏠</div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    L.marker([mapLat, mapLng], { icon }).addTo(map)
      .bindPopup(`<b style="font-size:13px">${title || 'Property Location'}</b>`)

    mapRef.current = map

    // Fix: invalidate size after render
    setTimeout(() => map.invalidateSize(), 200)

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [mapLat, mapLng, title])

  if (!L) {
    return (
      <div style={{ height, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, ...style }}>
        📍 Map not available
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', ...style }}>
      <div ref={containerRef} style={{ height, width: '100%' }} />
    </div>
  )
}
