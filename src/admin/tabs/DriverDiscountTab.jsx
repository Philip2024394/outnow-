/**
 * DriverDiscountTab — Admin control for driver self-discount system.
 * Set/override discount %, activate/deactivate, view all drivers.
 */
import { useState, useEffect } from 'react'
import { DISCOUNT_OPTIONS, DISCOUNT_TERMS, getAllDriverDiscounts, adminSetDiscount, adminRemoveOverride, applyDriverDiscount } from '@/services/driverDiscountService'
import { formatRp } from '@/services/pricingService'

// Demo drivers for display
const DEMO_DRIVERS = [
  { driver_id: 'd1', name: 'Budi Santoso', type: 'bike', rating: 4.8, trips: 342, status: 'online', idle_hours: 0, discount_percent: 0, is_active: false, set_by: 'driver', admin_override: false },
  { driver_id: 'd2', name: 'Ani Rahayu', type: 'bike', rating: 4.6, trips: 218, status: 'online', idle_hours: 3, discount_percent: 5, is_active: true, set_by: 'driver', admin_override: false },
  { driver_id: 'd3', name: 'Hendra Putra', type: 'car', rating: 4.9, trips: 456, status: 'offline', idle_hours: 0, discount_percent: 0, is_active: false, set_by: 'driver', admin_override: false },
  { driver_id: 'd4', name: 'Sari Wulan', type: 'bike', rating: 4.3, trips: 89, status: 'online', idle_hours: 8, discount_percent: 0, is_active: false, set_by: 'driver', admin_override: false },
  { driver_id: 'd5', name: 'Citra Dewi', type: 'car', rating: 4.7, trips: 167, status: 'online', idle_hours: 1, discount_percent: 3, is_active: true, set_by: 'driver', admin_override: false },
  { driver_id: 'd6', name: 'Rizki Pratama', type: 'bike', rating: 4.1, trips: 34, status: 'online', idle_hours: 12, discount_percent: 0, is_active: false, set_by: 'driver', admin_override: false },
  { driver_id: 'd7', name: 'Dewi Anggraini', type: 'car', rating: 4.5, trips: 201, status: 'offline', idle_hours: 0, discount_percent: 7, is_active: true, set_by: 'admin', admin_override: true, admin_note: 'Off-peak activation' },
]

export default function DriverDiscountTab() {
  const [drivers, setDrivers] = useState(DEMO_DRIVERS)
  const [filter, setFilter] = useState('all') // all, active, idle, admin
  const [editDriver, setEditDriver] = useState(null)
  const [editPercent, setEditPercent] = useState(0)
  const [editNote, setEditNote] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [bulkPercent, setBulkPercent] = useState(5)

  const filtered = drivers.filter(d => {
    if (filter === 'active') return d.is_active
    if (filter === 'idle') return d.idle_hours >= 4 && d.status === 'online'
    if (filter === 'admin') return d.admin_override
    return true
  })

  const activeCount = drivers.filter(d => d.is_active).length
  const idleCount = drivers.filter(d => d.idle_hours >= 4 && d.status === 'online').length
  const adminCount = drivers.filter(d => d.admin_override).length

  const handleSetDiscount = (driverId) => {
    setDrivers(prev => prev.map(d => d.driver_id === driverId ? {
      ...d, discount_percent: editPercent, is_active: editPercent > 0,
      set_by: 'admin', admin_override: true, admin_note: editNote || 'Admin set',
    } : d))
    setEditDriver(null)
    setEditPercent(0)
    setEditNote('')
  }

  const handleRemoveOverride = (driverId) => {
    setDrivers(prev => prev.map(d => d.driver_id === driverId ? {
      ...d, admin_override: false, set_by: 'driver', admin_note: null,
    } : d))
  }

  const handleBulkActivate = () => {
    setDrivers(prev => prev.map(d => {
      if (d.idle_hours >= 4 && d.status === 'online' && !d.is_active) {
        return { ...d, discount_percent: bulkPercent, is_active: true, set_by: 'admin', admin_override: true, admin_note: 'Bulk activation — idle driver' }
      }
      return d
    }))
  }

  const handleBulkDeactivate = () => {
    setDrivers(prev => prev.map(d => {
      if (d.admin_override) {
        return { ...d, admin_override: false, set_by: 'driver', admin_note: null }
      }
      return d
    }))
  }

  // Example fare preview
  const bikeFare10km = 30835 // INDOO normal 10km bike
  const carFare10km = 52220

  return (
    <div style={{ padding: 0 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Total Drivers', value: drivers.length, color: '#fff' },
          { label: 'Discount Active', value: activeCount, color: '#8DC63F' },
          { label: 'Idle (4h+)', value: idleCount, color: '#FACC15' },
          { label: 'Admin Override', value: adminCount, color: '#60A5FA' },
        ].map((s, i) => (
          <div key={i} style={{ minWidth: 100, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bulk actions */}
      <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Bulk Actions — Idle Drivers</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={bulkPercent} onChange={e => setBulkPercent(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}>
            {DISCOUNT_OPTIONS.filter(o => o.value > 0).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={handleBulkActivate} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Activate for {idleCount} idle drivers
          </button>
          <button onClick={handleBulkDeactivate} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Remove all overrides
          </button>
          <button onClick={() => setShowTerms(!showTerms)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            T&C
          </button>
        </div>
      </div>

      {/* Terms */}
      {showTerms && (
        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginBottom: 8 }}>Driver Discount Terms & Conditions</div>
          {DISCOUNT_TERMS.map((t, i) => (
            <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: '4px 0', borderTop: i ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{i + 1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fare preview */}
      <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Fare Preview — 10km ride</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {DISCOUNT_OPTIONS.map(o => {
            const bike = applyDriverDiscount(bikeFare10km, o.value)
            return (
              <div key={o.value} style={{ minWidth: 90, padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: o.value === 0 ? '#fff' : '#8DC63F' }}>{o.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Customer: {formatRp(bike.discountedFare)}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Driver: {formatRp(bike.driverGets)}</div>
                <div style={{ fontSize: 9, color: '#FACC15' }}>INDOO: {formatRp(bike.indooKeeps)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: `Active (${activeCount})` },
          { id: 'idle', label: `Idle (${idleCount})` },
          { id: 'admin', label: `Admin (${adminCount})` },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: filter === t.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === t.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
            fontSize: 11, fontWeight: 700,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Driver list */}
      {filtered.map(d => (
        <div key={d.driver_id} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${d.admin_override ? 'rgba(59,130,246,0.3)' : d.is_active ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: d.type === 'bike' ? 'rgba(141,198,63,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {d.type === 'bike' ? '🏍️' : '🚗'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                ⭐ {d.rating} · {d.trips} trips · {d.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                {d.idle_hours >= 4 && <span style={{ color: '#FACC15', marginLeft: 6 }}>⏰ Idle {d.idle_hours}h</span>}
              </div>
            </div>

            {/* Current discount badge */}
            <div style={{ textAlign: 'right' }}>
              {d.is_active ? (
                <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#8DC63F' }}>{d.discount_percent}% Off</span>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>No discount</span>
              )}
              {d.admin_override && (
                <div style={{ fontSize: 9, color: '#60A5FA', marginTop: 2 }}>Admin set</div>
              )}
            </div>
          </div>

          {d.admin_note && (
            <div style={{ fontSize: 10, color: 'rgba(59,130,246,0.7)', marginTop: 6, fontStyle: 'italic' }}>Admin: {d.admin_note}</div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={() => { setEditDriver(d.driver_id); setEditPercent(d.discount_percent) }} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(141,198,63,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 700,
            }}>Set Discount</button>
            {d.admin_override && (
              <button onClick={() => handleRemoveOverride(d.driver_id)} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 700,
              }}>Remove Override</button>
            )}
          </div>

          {/* Edit inline */}
          {editDriver === d.driver_id && (
            <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {DISCOUNT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setEditPercent(o.value)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid',
                    borderColor: editPercent === o.value ? 'rgba(141,198,63,0.5)' : 'rgba(255,255,255,0.08)',
                    background: editPercent === o.value ? 'rgba(141,198,63,0.15)' : 'transparent',
                    color: editPercent === o.value ? '#8DC63F' : 'rgba(255,255,255,0.4)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{o.value}%</button>
                ))}
              </div>
              <input
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Admin note (optional)..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleSetDiscount(d.driver_id)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Apply {editPercent}%
                </button>
                <button onClick={() => setEditDriver(null)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
