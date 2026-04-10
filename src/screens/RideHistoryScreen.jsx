import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getDisputeTimeLeftMs, formatCountdown } from '@/services/disputeService'
import DisputeSheet from '@/components/ride/DisputeSheet'
import ProfileStrip from '@/components/map/ProfileStrip'
import styles from './RideHistoryScreen.module.css'

const DEMO_RIDES = [
  { id: 'BOOK_001', created_at: '2026-04-08T09:12:00Z', pickup_location: 'Jl. Malioboro 15, Yogyakarta', dropoff_location: 'Bandara Adisucipto', driver_name: 'Budi Santoso', driver_type: 'bike_ride', fare: 28000, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_002', created_at: '2026-04-08T10:45:00Z', pickup_location: 'Hotel Tentrem, Yogyakarta',    dropoff_location: 'Prambanan Temple',    driver_name: 'Ani Rahayu',   driver_type: 'car_taxi',  fare: 45000, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_003', created_at: '2026-04-08T11:30:00Z', pickup_location: 'UGM Campus',                  dropoff_location: 'Jl. Solo No. 8',      driver_name: 'Hendra Putra', driver_type: 'bike_ride', fare: null,  status: 'cancelled', service_type: 'delivery' },
  { id: 'BOOK_004', created_at: '2026-04-07T14:20:00Z', pickup_location: 'Pasar Beringharjo',           dropoff_location: 'Kotagede',            driver_name: 'Budi Santoso', driver_type: 'bike_ride', fare: 22000, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_005', created_at: '2026-04-07T16:05:00Z', pickup_location: 'Jl. Kaliurang Km 5',         dropoff_location: 'Alun-Alun Kidul',     driver_name: 'Sari Wulan',   driver_type: 'car_taxi',  fare: 35000, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_006', created_at: '2026-04-06T08:15:00Z', pickup_location: 'RS Sardjito',                dropoff_location: 'Jl. Magelang Km 3',   driver_name: 'Ani Rahayu',   driver_type: 'bike_ride', fare: 18000, status: 'completed', service_type: 'ride' },
  { id: 'BOOK_007', created_at: '2026-04-06T13:50:00Z', pickup_location: 'Stasiun Tugu',               dropoff_location: 'Sleman City Hall',     driver_name: 'Sari Wulan',   driver_type: 'car_taxi',  fare: null,  status: 'cancelled', service_type: 'ride' },
]

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function fmtRp(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function RideHistoryScreen({ userId, userName, onClose, stripProps }) {
  const [rides,       setRides]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('all')
  const [disputeRide, setDisputeRide] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase || !userId) {
      setRides(DEMO_RIDES)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, created_at, pickup_location, dropoff_location,
        fare, status, service_type,
        driver:profiles!driver_id(display_name, driver_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('RideHistoryScreen load error:', error)
      setRides(DEMO_RIDES)
    } else {
      setRides((data ?? []).map(b => ({
        ...b,
        driver_name: b.driver?.display_name ?? '—',
        driver_type: b.driver?.driver_type  ?? 'bike_ride',
      })))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const visible = filter === 'all' ? rides : rides.filter(r => r.status === filter)

  const completed  = rides.filter(r => r.status === 'completed')
  const totalSpent = completed.reduce((sum, r) => sum + (r.fare ?? 0), 0)
  const cancelled  = rides.filter(r => r.status === 'cancelled').length

  // Cancellation count per driver
  const cancelCountByDriver = rides.reduce((acc, r) => {
    if (r.status === 'cancelled') acc[r.driver_name] = (acc[r.driver_name] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <img src="https://ik.imagekit.io/nepgaxllc/Green%20and%20black%20speed%20machines.png?updatedAt=1775635360641" alt="" className={styles.headerImg} aria-hidden="true" />
        <span className={styles.title}>Ride History</span>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
      </div>

      {/* Stats strip */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{completed.length}</span>
          <span className={styles.statLbl}>Completed</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNum}>{fmtRp(totalSpent)}</span>
          <span className={styles.statLbl}>Total Spent</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNum}>{cancelled}</span>
          <span className={styles.statLbl}>Cancelled</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading your rides…</div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>No {filter === 'all' ? '' : filter} rides yet.</div>
        ) : (
          visible.map(ride => (
            <div key={ride.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.vehicleIcon}>
                  {ride.service_type === 'delivery'
                    ? '📦'
                    : ride.driver_type === 'car_taxi'
                      ? <img src="https://ik.imagekit.io/nepgaxllc/Sporty%20green%20and%20black%20hatchback.png?updatedAt=1775634925566" alt="car" className={styles.vehicleIconImg} />
                      : <img src="https://ik.imagekit.io/nepgaxllc/Riders%20on%20a%20sleek%20scooter.png?updatedAt=1775657336879" alt="bike" className={styles.vehicleIconImg} />
                  }
                </span>
                <div className={styles.cardMeta}>
                  <span className={styles.cardDate}>{fmtDate(ride.created_at)}</span>
                  <span className={styles.cardDriver}>Driver: {ride.driver_name}</span>
                </div>
                <span className={`${styles.statusPill} ${styles['pill_' + ride.status]}`}>
                  {ride.status}
                </span>
              </div>

              <div className={styles.cardRoute}>
                <div className={styles.routeRow}>
                  <span className={styles.routeDot} style={{ background: '#8DC63F' }} />
                  <span className={styles.routeText}>{ride.pickup_location ?? '—'}</span>
                </div>
                <div className={styles.routeLine} />
                <div className={styles.routeRow}>
                  <span className={styles.routeDot} style={{ background: '#F5C518' }} />
                  <span className={styles.routeText}>{ride.dropoff_location ?? '—'}</span>
                </div>
              </div>

              {ride.status === 'completed' && ride.fare != null && (
                <div className={styles.cardFare}>{fmtRp(ride.fare)}</div>
              )}
              {ride.status === 'cancelled' && (
                <div className={styles.cancelActions}>
                  {cancelCountByDriver[ride.driver_name] > 0 && (
                    <img
                      src="https://ik.imagekit.io/nepgaxllc/Order%20canceled%20warning%20banner.png"
                      alt="Cancelled warning"
                      className={styles.warningBadge}
                      title={`${cancelCountByDriver[ride.driver_name]} cancellation(s)`}
                    />
                  )}
                  {(() => {
                    const countdown = formatCountdown(getDisputeTimeLeftMs(ride.created_at))
                    return (
                      <button
                        className={`${styles.disputeBtn} ${!countdown ? styles.disputeBtnExpired : ''}`}
                        onClick={() => countdown && setDisputeRide(ride)}
                        disabled={!countdown}
                      >
                        {countdown ? 'Dispute' : 'Dispute Expired'}
                        <span className={styles.disputeTimer}>
                          {countdown ? `⏱ ${countdown}` : '24h passed'}
                        </span>
                      </button>
                    )
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {disputeRide && (
        <DisputeSheet
          ride={disputeRide}
          userId={userId}
          userName={userName}
          onClose={() => setDisputeRide(null)}
        />
      )}

      {stripProps && <ProfileStrip {...stripProps} />}
    </div>
  )
}
