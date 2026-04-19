import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import RentalCalendar from '@/components/calendar/RentalCalendar'

const STORAGE_KEYS = [
  'indoo_my_listings',
  'indoo_my_car_listings',
  'indoo_my_truck_listings',
  'indoo_my_bus_listings',
  'indoo_event_listings',
  'indoo_my_property_listings',
  'indoo_my_bicycle_listings',
]

function loadAllListings() {
  const all = []
  STORAGE_KEYS.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      if (Array.isArray(data)) all.push(...data)
    } catch { /* skip */ }
  })
  return all
}

function persistListing(listing) {
  for (const key of STORAGE_KEYS) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      const idx = data.findIndex(l => l.id === listing.id)
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...listing }
        localStorage.setItem(key, JSON.stringify(data))
        return
      }
    } catch { /* skip */ }
  }
}

function deleteListing(id) {
  for (const key of STORAGE_KEYS) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = data.filter(l => l.id !== id)
      if (filtered.length !== data.length) {
        localStorage.setItem(key, JSON.stringify(filtered))
        return
      }
    } catch { /* skip */ }
  }
}

/* Pulse keyframes injected once */
const PULSE_ID = 'indoo-pulse-keyframes'
function ensurePulseAnimation() {
  if (document.getElementById(PULSE_ID)) return
  const style = document.createElement('style')
  style.id = PULSE_ID
  style.textContent = `@keyframes indooPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`
  document.head.appendChild(style)
}

export default function MyListingsScreen({ open, onClose, onEdit }) {
  const [listings, setListings] = useState([])
  const [calendarListing, setCalendarListing] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (open) {
      ensurePulseAnimation()
      setListings(loadAllListings())
    }
  }, [open])

  if (!open) return null

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const toggleStatus = (listing) => {
    const newStatus = listing.status === 'live' ? 'offline' : 'live'
    const updated = { ...listing, status: newStatus }
    persistListing(updated)
    setListings(prev => prev.map(l => l.id === listing.id ? updated : l))
    showToast(newStatus === 'live' ? 'Listing is now LIVE' : 'Listing is now OFFLINE')
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this listing?')) return
    deleteListing(id)
    setListings(prev => prev.filter(l => l.id !== id))
    showToast('Listing deleted')
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>11</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>LISTINGS</span></div>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏪</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>My Listings</span>
          {listings.length > 0 && (
            <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(141,198,63,0.12)', fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>{listings.length}</span>
          )}
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)', marginTop: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.7 }}>📦</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No Listings Yet</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Create a listing to start selling or renting</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {listings.map((listing) => {
              const isLive = listing.status === 'live'
              const imgSrc = listing.image || (Array.isArray(listing.images) && listing.images[0]) || null
              return (
                <div key={listing.id} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)', position: 'relative' }}>
                  {/* Green glow line */}
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />

                  {/* 16:9 Image */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'rgba(255,255,255,0.03)' }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,255,255,0.08)' }}>📷</div>
                    )}
                    {/* Gradient overlay at bottom of image */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />

                    {/* LIVE / OFF badge top-left */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, background: isLive ? 'rgba(141,198,63,0.85)' : 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#fff', boxShadow: isLive ? '0 2px 8px rgba(141,198,63,0.3)' : '0 2px 8px rgba(239,68,68,0.3)', zIndex: 3 }}>
                      {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'indooPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />}
                      {isLive ? 'LIVE' : 'OFF'}
                    </div>
                  </div>

                  {/* Info below image */}
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title || 'Untitled'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {listing.category && (
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 9, fontWeight: 700, color: '#8DC63F' }}>{listing.category}</span>
                      )}
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{listing.price ? `Rp ${Number(listing.price).toLocaleString('id-ID')}` : '—'}</span>
                    </div>

                    {/* Action buttons row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Toggle live/offline */}
                      <button onClick={() => toggleStatus(listing)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: isLive ? 'rgba(239,68,68,0.1)' : 'rgba(141,198,63,0.1)', border: `1px solid ${isLive ? 'rgba(239,68,68,0.25)' : 'rgba(141,198,63,0.25)'}`, color: isLive ? '#EF4444' : '#8DC63F', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isLive ? 'Go Offline' : 'Go Live'}</button>

                      {/* Edit */}
                      <button onClick={() => { if (onEdit) { onClose(); onEdit(listing) } else showToast('Edit coming soon') }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Edit">✏️</button>

                      {/* Calendar */}
                      <button onClick={() => setCalendarListing(listing)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Calendar">📅</button>

                      {/* Delete */}
                      <button onClick={() => handleDelete(listing.id)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Delete">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 12, background: 'rgba(141,198,63,0.95)', color: '#000', fontSize: 12, fontWeight: 800, zIndex: 100000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'slideDown 0.3s ease' }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>

      {/* Calendar for listing */}
      {calendarListing && (
        <RentalCalendar open={true} onClose={() => setCalendarListing(null)} listingRef={calendarListing.ref || calendarListing.id} listingTitle={calendarListing.title} mode="owner" />
      )}
    </div>,
    document.body
  )
}
