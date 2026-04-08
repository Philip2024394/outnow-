import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './BookingsTab.module.css'

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_BOOKINGS = [
  { id: 'BOOK_001', created_at: '2026-04-08T09:12:00Z', pickup_location: 'Jl. Malioboro 15, Yogyakarta', dropoff_location: 'Bandara Adisucipto', driver_id: 'Budi Santoso', fare: 28000, distance_km: 8.2, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_002', created_at: '2026-04-08T10:45:00Z', pickup_location: 'Hotel Tentrem, Yogyakarta',    dropoff_location: 'Prambanan Temple',    driver_id: 'Ani Rahayu',    fare: 45000, distance_km: 13.5,status: 'completed', service_type: 'ride' },
  { id: 'BOOK_003', created_at: '2026-04-08T11:30:00Z', pickup_location: 'UGM Campus',                  dropoff_location: 'Jl. Solo No. 8',      driver_id: 'Hendra Putra',  fare: 15000, distance_km: 3.8, status: 'cancelled', service_type: 'delivery' },
  { id: 'BOOK_004', created_at: '2026-04-07T14:20:00Z', pickup_location: 'Pasar Beringharjo',           dropoff_location: 'Kotagede',            driver_id: 'Budi Santoso',  fare: 22000, distance_km: 6.1, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_005', created_at: '2026-04-07T16:05:00Z', pickup_location: 'Jl. Kaliurang Km 5',         dropoff_location: 'Alun-Alun Kidul',     driver_id: 'Sari Wulan',    fare: 35000, distance_km: 10.2,status: 'completed', service_type: 'ride' },
  { id: 'BOOK_006', created_at: '2026-04-07T18:40:00Z', pickup_location: 'Toko Bakpia 25',             dropoff_location: 'Jl. Parangtritis',    driver_id: 'Citra Dewi',    fare: 55000, distance_km: 16.8,status: 'cancelled', service_type: 'delivery' },
  { id: 'BOOK_007', created_at: '2026-04-06T08:15:00Z', pickup_location: 'RS Sardjito',                dropoff_location: 'Jl. Magelang Km 3',   driver_id: 'Ani Rahayu',    fare: 18000, distance_km: 4.5, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_008', created_at: '2026-04-06T13:50:00Z', pickup_location: 'Stasiun Tugu',               dropoff_location: 'Sleman City Hall',    driver_id: 'Sari Wulan',    fare: 42000, distance_km: 12.0,status: 'completed', service_type: 'ride' },
]

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtRp(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

function monthLabel(y, m) {
  return new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

function buildCSV(rows) {
  const headers = ['Booking ID', 'Date & Time', 'Pickup', 'Dropoff', 'Driver', 'Service', 'Distance (km)', 'Fare (Rp)', 'Status']
  const lines = [
    headers.join(','),
    ...rows.map(b => [
      b.id,
      fmtDate(b.created_at),
      `"${(b.pickup_location ?? '').replace(/"/g, '""')}"`,
      `"${(b.dropoff_location ?? '').replace(/"/g, '""')}"`,
      `"${(b.driver_id ?? '').replace(/"/g, '""')}"`,
      b.service_type ?? 'ride',
      b.distance_km ?? '',
      b.status === 'cancelled' ? '' : (b.fare ?? ''),
      b.status,
    ].join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function BookingsTab() {
  const now = new Date()
  const [year,        setYear]        = useState(now.getFullYear())
  const [month,       setMonth]       = useState(now.getMonth() + 1)
  const [bookings,    setBookings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [deleting,    setDeleting]    = useState(null)   // booking id being deleted
  const [confirmAll,  setConfirmAll]  = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) {
      // Filter demo data by selected month
      const filtered = DEMO_BOOKINGS.filter(b => {
        const d = new Date(b.created_at)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      setBookings(filtered)
      setLoading(false)
      return
    }
    const from = new Date(year, month - 1, 1).toISOString()
    const to   = new Date(year, month,     1).toISOString()
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at', { ascending: false })
    setBookings(data ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    setDeleting(id)
    if (supabase) {
      await supabase.from('bookings').delete().eq('id', id)
    }
    setBookings(prev => prev.filter(b => b.id !== id))
    setDeleting(null)
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    if (supabase) {
      const from = new Date(year, month - 1, 1).toISOString()
      const to   = new Date(year, month,     1).toISOString()
      await supabase.from('bookings').delete().gte('created_at', from).lt('created_at', to)
    }
    setBookings([])
    setConfirmAll(false)
    setDeletingAll(false)
  }

  const handleDownload = () => {
    const csv      = buildCSV(bookings)
    const filename = `hangger-bookings-${year}-${String(month).padStart(2,'0')}.csv`
    downloadCSV(csv, filename)
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const completed  = bookings.filter(b => b.status === 'completed')
  const cancelled  = bookings.filter(b => b.status === 'cancelled')
  const totalFare  = completed.reduce((s, b) => s + (Number(b.fare) || 0), 0)

  // ── Month navigation ───────────────────────────────────────────────────────
  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => {
    const n = new Date(); if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  return (
    <div className={styles.root}>

      {/* ── Month selector ── */}
      <div className={styles.monthBar}>
        <button className={styles.monthNav} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>{monthLabel(year, month)}</span>
        <button className={styles.monthNav} onClick={nextMonth}>›</button>
      </div>

      {/* ── Stats ── */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{bookings.length}</span>
          <span className={styles.statLbl}>Total Bookings</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: '#8DC63F' }}>{completed.length}</span>
          <span className={styles.statLbl}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: '#ff6b6b' }}>{cancelled.length}</span>
          <span className={styles.statLbl}>Cancelled</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum} style={{ color: '#8DC63F', fontSize: 18 }}>{fmtRp(totalFare)}</span>
          <span className={styles.statLbl}>Total Fare Value</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button className={styles.downloadBtn} onClick={handleDownload} disabled={!bookings.length}>
          ⬇ Download CSV — {monthLabel(year, month)}
        </button>
        {!confirmAll
          ? <button className={styles.deleteAllBtn} onClick={() => setConfirmAll(true)} disabled={!bookings.length}>
              🗑 Delete Month
            </button>
          : <div className={styles.confirmRow}>
              <span className={styles.confirmText}>Delete all {bookings.length} bookings for {monthLabel(year, month)}?</span>
              <button className={styles.confirmYes} onClick={handleDeleteAll} disabled={deletingAll}>
                {deletingAll ? 'Deleting…' : 'Yes, delete all'}
              </button>
              <button className={styles.confirmNo} onClick={() => setConfirmAll(false)}>Cancel</button>
            </div>
        }
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className={styles.empty}>Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className={styles.empty}>No bookings for {monthLabel(year, month)}.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Date & Time</th>
                <th className={styles.th}>Pickup</th>
                <th className={styles.th}>Dropoff</th>
                <th className={styles.th}>Driver</th>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Fare</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className={`${styles.row} ${b.status === 'cancelled' ? styles.rowCancelled : ''}`}>
                  <td className={styles.td}>
                    <span className={styles.dateText}>{fmtDate(b.created_at)}</span>
                    <span className={styles.bookingId}>{b.id}</span>
                  </td>
                  <td className={styles.td}>{b.pickup_location ?? '—'}</td>
                  <td className={styles.td}>{b.dropoff_location ?? '—'}</td>
                  <td className={styles.td}>{b.driver_id ?? '—'}</td>
                  <td className={styles.td}>
                    <span className={styles.servicePill}>
                      {b.service_type === 'delivery' ? '📦 Delivery' : '👤 Ride'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {b.status === 'cancelled'
                      ? <span className={styles.noFare}>—</span>
                      : <span className={styles.fareText}>{fmtRp(b.fare)}</span>
                    }
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.statusPill} ${styles['pill_' + b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className={styles.tdAction}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(b.id)}
                      disabled={deleting === b.id}
                      title="Delete booking"
                    >
                      {deleting === b.id ? '…' : '🗑'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
