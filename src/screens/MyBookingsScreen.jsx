import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function MyBookingsScreen({ open, onClose }) {
  const [bookings, setBookings] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (open) {
      try {
        const data = JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')
        setBookings(data.reverse())
      } catch { setBookings([]) }
    }
  }, [open])

  if (!open) return null

  const cancelBooking = (refOrId) => {
    if (!confirm('Cancel this booking?')) return
    try {
      const data = JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')
      const updated = data.map(b => (b.ref === refOrId || b.id === refOrId) ? { ...b, status: 'cancelled' } : b)
      localStorage.setItem('indoo_rental_bookings', JSON.stringify(updated))
      setBookings(updated.reverse())
      setToast('Booking cancelled')
      setTimeout(() => setToast(''), 2500)
    } catch {}
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return { background: '#8DC63F', color: '#000' }
      case 'pending':   return { background: '#FFD700', color: '#000' }
      case 'completed': return { background: 'rgba(255,255,255,0.2)', color: '#fff' }
      case 'cancelled': return { background: '#EF4444', color: '#fff' }
      default:          return { background: '#FFD700', color: '#000' }
    }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)',
      display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
    }}>
      {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>9</div>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>BOOKINGS</span>
      </div>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>My Bookings</span>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: '50%', background: '#8DC63F',
          border: 'none', color: '#000', fontSize: 13, fontWeight: 900,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {bookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', marginTop: 40,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.7 }}>📭</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No Bookings Yet</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Your rental bookings will appear here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bookings.map((b, i) => {
              /* Normalize both booking formats */
              const img = b.image || b.listing_image || ''
              const title = b.title || b.listing_title || 'Untitled Listing'
              const bookerName = b.name || b.renter_name || '—'
              const wa = b.whatsapp || b.renter_phone || '—'
              const pickup = b.pickupDate || b.start_date || '—'
              const total = b.totalPrice || b.total || b.total_price || 0
              const ref = b.ref || b.id || '—'
              const status = b.status || 'pending'
              const badge = getStatusBadge(status)

              return (
                <div key={ref || i} style={{
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
                  position: 'relative',
                }}>
                  {/* Green glow line */}
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />

                  {/* Image section — 16:9 */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0a0a' }}>
                    {img ? (
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 36, opacity: 0.3 }}>🏍️</span>
                      </div>
                    )}
                    {/* Gradient overlay at bottom of image */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }} />

                    {/* Status badge on image */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      padding: '4px 10px', borderRadius: 8,
                      fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                      background: badge.background, color: badge.color,
                      letterSpacing: 0.5,
                    }}>{status}</div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    {/* Title */}
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{title}</div>

                    {/* Ref number */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: 0.5, marginBottom: 12 }}>REF: {ref}</div>

                    {/* Info section */}
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.04)',
                      marginBottom: 10,
                    }}>
                      {/* Name + WhatsApp row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{bookerName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>WHATSAPP</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', marginTop: 2 }}>{wa}</div>
                        </div>
                      </div>

                      {/* Pickup + Days + Total row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>PICKUP</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pickup}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>DAYS</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{b.days || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 0.5 }}>TOTAL</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F', marginTop: 2 }}>{total ? `Rp ${Number(total).toLocaleString('id-ID')}` : '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {b.notes && (
                      <div style={{
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 8,
                        fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic',
                        marginBottom: 10,
                      }}>{b.notes}</div>
                    )}

                    {/* Cancel button for pending */}
                    {(status === 'pending') && (
                      <button onClick={() => cancelBooking(b.ref || b.id)} style={{
                        width: '100%', padding: '10px 0', borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#EF4444', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>Cancel Booking</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 12,
          background: 'rgba(239,68,68,0.95)', color: '#fff',
          fontSize: 12, fontWeight: 800, zIndex: 100000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}
    </div>,
    document.body
  )
}
