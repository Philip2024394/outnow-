import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './DriversTab.module.css'

const DOC_LABELS = {
  sim:          'SIM — Driver\'s License',
  stnk:         'STNK — Vehicle Registration',
  ktp:          'KTP — ID Card',
  vehicle_photo:'Vehicle Photo',
  selfie_sim:   'Selfie with SIM',
}

const FILTER_TABS = [
  { id: 'pending',  label: 'Pending',  color: '#F5C518' },
  { id: 'approved', label: 'Approved', color: '#8DC63F' },
  { id: 'rejected', label: 'Rejected', color: '#ff6b6b' },
  { id: 'all',      label: 'All',      color: '#888'    },
]

const DEMO_APPLICATIONS = [
  {
    id: 'app1', user_id: 'u1', status: 'pending', driver_type: 'bike_ride',
    created_at: '2026-04-07T09:12:00Z', admin_notes: null,
    document_urls: { sim: null, stnk: null, ktp: null, vehicle_photo: null, selfie_sim: null },
    profile: { display_name: 'Budi Santoso', city: 'Yogyakarta', photo_url: null },
  },
  {
    id: 'app2', user_id: 'u2', status: 'pending', driver_type: 'car_taxi',
    created_at: '2026-04-07T11:45:00Z', admin_notes: null,
    document_urls: { sim: null, stnk: null, ktp: null, vehicle_photo: null, selfie_sim: null },
    profile: { display_name: 'Dewi Rahayu', city: 'Jakarta', photo_url: null },
  },
  {
    id: 'app3', user_id: 'u3', status: 'approved', driver_type: 'bike_ride',
    created_at: '2026-04-05T08:00:00Z', admin_notes: null,
    document_urls: { sim: null, stnk: null, ktp: null, vehicle_photo: null, selfie_sim: null },
    profile: { display_name: 'Ahmad Fauzi', city: 'Surabaya', photo_url: null },
  },
]

export default function DriversTab() {
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('pending')
  const [expanded,     setExpanded]     = useState(null)    // application id
  const [rejectModal,  setRejectModal]  = useState(null)    // application id
  const [rejectNote,   setRejectNote]   = useState('')
  const [actionLoading,setActionLoading]= useState(null)
  const [lightbox,     setLightbox]     = useState(null)    // image URL

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) {
      setApplications(DEMO_APPLICATIONS)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('driver_applications')
      .select(`*, profile:profiles(display_name, city, photo_url)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DriversTab load error:', error)
      setApplications(DEMO_APPLICATIONS)
    } else {
      setApplications(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (appId, userId, status, notes = null) => {
    setActionLoading(appId)
    try {
      if (supabase) {
        await supabase.from('driver_applications')
          .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
          .eq('id', appId)

        if (status === 'approved') {
          const app = applications.find(a => a.id === appId)
          await supabase.from('profiles')
            .update({ driver_status: 'approved', is_driver: true, driver_type: app?.driver_type ?? null })
            .eq('id', userId)
        }
      }
      setApplications(prev => prev.map(a =>
        a.id === appId ? { ...a, status, admin_notes: notes } : a
      ))
    } catch (err) {
      alert('Action failed: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (app) => updateStatus(app.id, app.user_id, 'approved')

  const handleReject = async () => {
    if (!rejectModal) return
    const app = applications.find(a => a.id === rejectModal)
    await updateStatus(app.id, app.user_id, 'rejected', rejectNote.trim() || null)
    setRejectModal(null)
    setRejectNote('')
  }

  const handleResubmit = (app) => updateStatus(app.id, app.user_id, 'pending', 'Resubmission requested by admin')

  const visible = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  const countFor = (s) => applications.filter(a => a.status === s).length

  if (loading) return <div className={styles.loading}>Loading driver applications…</div>

  return (
    <div className={styles.root}>

      {/* Summary stats */}
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{countFor('pending')}</span><span className={styles.statLbl}>Pending</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color: '#8DC63F' }}>{countFor('approved')}</span><span className={styles.statLbl}>Approved</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color: '#ff6b6b' }}>{countFor('rejected')}</span><span className={styles.statLbl}>Rejected</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{applications.length}</span><span className={styles.statLbl}>Total</span></div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {FILTER_TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.filterBtn} ${filter === t.id ? styles.filterBtnActive : ''}`}
            style={filter === t.id ? { color: t.color, borderColor: t.color } : {}}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
            {t.id !== 'all' && <span className={styles.filterCount}>{countFor(t.id)}</span>}
          </button>
        ))}
      </div>

      {/* Application list */}
      {visible.length === 0 ? (
        <div className={styles.empty}>No {filter === 'all' ? '' : filter} applications.</div>
      ) : (
        <div className={styles.list}>
          {visible.map(app => {
            const isExpanded = expanded === app.id
            const isBusy     = actionLoading === app.id
            const name       = app.profile?.display_name ?? 'Unknown'
            const city       = app.profile?.city ?? '—'
            const dateStr    = new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            const docUrls    = app.document_urls ?? {}

            return (
              <div key={app.id} className={`${styles.card} ${styles['status_' + app.status]}`}>
                {/* Card header */}
                <div className={styles.cardHeader} onClick={() => setExpanded(isExpanded ? null : app.id)}>
                  <div className={styles.driverAvatar}>
                    {app.profile?.photo_url
                      ? <img src={app.profile.photo_url} alt={name} className={styles.avatarImg} />
                      : <span className={styles.avatarInitial}>{name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className={styles.driverInfo}>
                    <span className={styles.driverName}>{name}</span>
                    <span className={styles.driverMeta}>{city} · {app.driver_type === 'car_taxi' ? '🚗 Car Taxi' : '🛵 Bike Ride'} · {dateStr}</span>
                    {app.admin_notes && <span className={styles.adminNote}>Note: {app.admin_notes}</span>}
                  </div>
                  <span className={`${styles.statusPill} ${styles['pill_' + app.status]}`}>
                    {app.status}
                  </span>
                  <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded documents */}
                {isExpanded && (
                  <div className={styles.docSection}>
                    <div className={styles.docGrid}>
                      {Object.entries(DOC_LABELS).map(([key, label]) => {
                        const url = docUrls[key]
                        return (
                          <div key={key} className={styles.docThumb}>
                            {url
                              ? <button className={styles.docImgBtn} onClick={() => setLightbox(url)} title={`View ${label}`}>
                                  <img src={url} alt={label} className={styles.docImg} />
                                  <span className={styles.docImgLabel}>{label}</span>
                                </button>
                              : <div className={styles.docMissing}>
                                  <span>📄</span>
                                  <span className={styles.docMissingLabel}>{label}</span>
                                  <span className={styles.docMissingNote}>Not uploaded</span>
                                </div>
                            }
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    {app.status !== 'approved' && (
                      <div className={styles.actions}>
                        <button
                          className={`${styles.btn} ${styles.btnApprove}`}
                          onClick={() => handleApprove(app)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : '✓ Approve'}
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnReject}`}
                          onClick={() => { setRejectModal(app.id); setRejectNote('') }}
                          disabled={isBusy}
                        >
                          ✕ Reject
                        </button>
                        {app.status === 'rejected' && (
                          <button
                            className={`${styles.btn} ${styles.btnResubmit}`}
                            onClick={() => handleResubmit(app)}
                            disabled={isBusy}
                          >
                            ↩ Request Resubmission
                          </button>
                        )}
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <div className={styles.approvedNote}>
                        ✅ Driver approved — they can now go online and receive ride requests.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className={styles.modalBackdrop} onClick={() => setRejectModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reject Application</h3>
            <p className={styles.modalSub}>Provide a reason so the driver knows what to fix and resubmit.</p>
            <textarea
              className={styles.notesInput}
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. SIM image is blurry — please resubmit a clear photo"
              rows={4}
            />
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnReject}`} onClick={handleReject}>
                Confirm Rejection
              </button>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setRejectModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbackdrop} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Document" className={styles.lightboxImg} />
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </div>
  )
}
