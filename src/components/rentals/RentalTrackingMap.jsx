/**
 * RentalTrackingMap — Live GPS tracking for active rentals.
 * Seller sees the renter's phone location on a Mapbox map.
 * Shows path trail, geofence boundary, and alerts.
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  getTrackingHistory, getLatestLocation, recordLocation, isWithinGeofence,
} from '@/services/rentalTrackingService'
import styles from './RentalTrackingMap.module.css'

export default function RentalTrackingMap({ booking, onClose }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const pathRef = useRef(null)
  const circleRef = useRef(null)
  const [latest, setLatest] = useState(null)
  const [geofence, setGeofence] = useState(null)
  const [history, setHistory] = useState([])

  if (!booking) return null

  // Simulate GPS tracking in demo mode — move the dot around
  useEffect(() => {
    // Seed some demo tracking data if none exists
    const existing = getTrackingHistory(booking.id)
    if (existing.length === 0) {
      // Simulate a path from city center outward
      const base = { lat: -7.7928, lng: 110.3653 }
      for (let i = 0; i < 20; i++) {
        recordLocation(booking.id,
          base.lat + (Math.random() - 0.5) * 0.02 + i * 0.001,
          base.lng + (Math.random() - 0.5) * 0.02 + i * 0.0015,
        )
      }
    }

    function tick() {
      const hist = getTrackingHistory(booking.id)
      const last = hist.length > 0 ? hist[hist.length - 1] : null
      if (last) {
        // Simulate movement
        recordLocation(booking.id,
          last.lat + (Math.random() - 0.5) * 0.003,
          last.lng + (Math.random() - 0.5) * 0.003,
        )
      }
      const updated = getTrackingHistory(booking.id)
      setHistory(updated)
      const newest = updated[updated.length - 1]
      setLatest(newest)
      if (newest) setGeofence(isWithinGeofence(newest.lat, newest.lng))
    }

    tick()
    const interval = setInterval(tick, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [booking.id])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    import('leaflet').then(mod => {
      const L = mod.default
      if (!mapRef.current || mapInstance.current) return

      const center = latest ? [latest.lat, latest.lng] : [-7.7928, 110.3653]
      const map = L.map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })

      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (token) {
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`, {
          tileSize: 512, zoomOffset: -1, maxZoom: 19,
        }).addTo(map)
      } else {
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map)
      }

      // Geofence circle (30km radius)
      circleRef.current = L.circle([-7.7928, 110.3653], {
        radius: 30000,
        color: 'rgba(141,198,63,0.3)',
        fillColor: 'rgba(141,198,63,0.05)',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '8 4',
      }).addTo(map)

      // Vehicle marker
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;background:#8DC63F;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(141,198,63,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: '',
      })
      markerRef.current = L.marker(center, { icon }).addTo(map)

      // Path trail
      pathRef.current = L.polyline([], {
        color: '#8DC63F',
        weight: 3,
        opacity: 0.6,
        dashArray: '6 4',
      }).addTo(map)

      mapInstance.current = map
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        markerRef.current = null
        pathRef.current = null
        circleRef.current = null
      }
    }
  }, [])

  // Update marker and path when location changes
  useEffect(() => {
    if (!mapInstance.current || !latest) return

    markerRef.current?.setLatLng([latest.lat, latest.lng])
    mapInstance.current.panTo([latest.lat, latest.lng], { animate: true, duration: 1 })

    if (pathRef.current && history.length > 1) {
      pathRef.current.setLatLngs(history.map(h => [h.lat, h.lng]))
    }
  }, [latest, history])

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.headerTitle}>{booking.vehicleName}</span>
          <span className={styles.headerSub}>{booking.renterName} · {booking.renterPhone}</span>
        </div>
        <div className={styles.statusLive}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>LIVE</span>
        </div>
      </div>

      <div className={styles.mapWrap}>
        <div className={styles.map} ref={mapRef} />

        <div className={styles.infoPanel}>
          <div className={styles.infoPanelInner}>
            {/* Geofence alert */}
            {geofence && !geofence.within && (
              <div className={styles.geofenceAlert}>
                <span className={styles.geofenceIcon}>⚠️</span>
                <span className={styles.geofenceText}>Vehicle is {geofence.distanceKm}km from city — outside {geofence.radiusKm}km geofence</span>
              </div>
            )}

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status</span>
              <span className={`${styles.infoValue} ${geofence?.within ? styles.infoValueGreen : styles.infoValueRed}`}>
                {geofence?.within ? '✓ Within geofence' : '⚠ Outside geofence'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Distance from city</span>
              <span className={styles.infoValue}>{geofence?.distanceKm || '-'} km</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Last update</span>
              <span className={styles.infoValue}>{latest ? fmtTime(latest.timestamp) : '-'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>GPS points recorded</span>
              <span className={styles.infoValue}>{history.length}</span>
            </div>
            <span className={styles.pathInfo}>Location updates every 60 seconds · Green trail shows path</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
