import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ZONE_INFO, formatRp } from '@/services/pricingService'
import styles from './DriversTab.module.css'

const DISPUTE_STATUS_COLORS = { pending: '#F5C518', cleared: '#8DC63F', confirmed: '#ff6b6b' }

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
  const [applications,   setApplications]   = useState([])
  const [flaggedDrivers, setFlaggedDrivers] = useState([])
  const [disputes,       setDisputes]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState('pending')
  const [expanded,       setExpanded]       = useState(null)
  const [rejectModal,    setRejectModal]    = useState(null)
  const [rejectNote,     setRejectNote]     = useState('')
  const [actionLoading,  setActionLoading]  = useState(null)
  const [lightbox,       setLightbox]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) {
      setApplications(DEMO_APPLICATIONS)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('driver_applications')
      .select(`*, profile:profiles(display_name, city, photo_url, last_selfie_url, last_selfie_at)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DriversTab load error:', error)
      setApplications(DEMO_APPLICATIONS)
    } else {
      setApplications(data ?? [])
    }

    // Fetch drivers with 1+ cancellations, ordered worst first
    if (supabase) {
      const { data: flagged } = await supabase
        .from('profiles')
        .select('id, display_name, city, driver_type, cancellation_count, photo_url')
        .eq('is_driver', true)
        .gt('cancellation_count', 0)
        .order('cancellation_count', { ascending: false })
        .limit(20)
      setFlaggedDrivers(flagged ?? [])

      // Fetch pending disputes
      const { data: disp } = await supabase
        .from('ride_disputes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setDisputes(disp ?? [])
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

  const handleDeactivate = async (app) => {
    setActionLoading(app.id)
    try {
      if (supabase) {
        await supabase.from('profiles')
          .update({ is_driver: false, driver_online: false, driver_deactivated: true })
          .eq('id', app.user_id)
        await supabase.from('driver_applications')
          .update({ status: 'rejected', admin_notes: 'Account deactivated by admin', updated_at: new Date().toISOString() })
          .eq('id', app.id)
      }
      setApplications(prev => prev.map(a =>
        a.id === app.id ? { ...a, status: 'rejected', admin_notes: 'Account deactivated by admin' } : a
      ))
    } catch (err) { alert('Deactivate failed: ' + err.message) }
    finally { setActionLoading(null) }
  }

  const handleSetProfileStatus = async (app, profileStatus) => {
    setActionLoading(app.id + '_ps')
    try {
      if (supabase) {
        await supabase.from('driver_applications')
          .update({ profile_status: profileStatus, updated_at: new Date().toISOString() })
          .eq('id', app.id)
      }
      setApplications(prev => prev.map(a =>
        a.id === app.id ? { ...a, profile_status: profileStatus } : a
      ))
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(null) }
  }

  const visible = filter === 'all' ? applications : applications.filter(a => a.status === filter)

  const countFor = (s) => applications.filter(a => a.status === s).length

  if (loading) return <div className={styles.loading}>Loading driver applications…</div>

  return (
    <div className={styles.root}>

      {/* ── Flagged drivers — cancellation warnings ── */}
      {flaggedDrivers.length > 0 && (
        <div className={styles.flaggedSection}>
          <div className={styles.flaggedHeader}>
            <span className={styles.flaggedIcon}>⚠️</span>
            <span className={styles.flaggedTitle}>Drivers With Cancellation Warnings</span>
            <span className={styles.flaggedCount}>{flaggedDrivers.length}</span>
          </div>
          {flaggedDrivers.map(d => (
            <div key={d.id} className={`${styles.flaggedRow} ${d.cancellation_count >= 2 ? styles.flaggedRowCritical : ''}`}>
              <div className={styles.flaggedInfo}>
                <span className={styles.flaggedName}>{d.display_name}</span>
                <span className={styles.flaggedMeta}>{d.driver_type === 'car_taxi' ? '🚕 Car' : '🏍 Bike'} · {d.city ?? '—'}</span>
              </div>
              <span className={styles.flaggedBadge}>
                ⚠️ {d.cancellation_count} {d.cancellation_count === 1 ? 'WARNING' : 'WARNINGS'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Disputes panel ── */}
      {disputes.length > 0 && (
        <div className={styles.disputesSection}>
          <div className={styles.disputesHeader}>
            <span>📋 Cancellation Disputes</span>
            <span className={styles.flaggedCount}>{disputes.filter(d => d.status === 'pending').length} pending</span>
          </div>
          {disputes.map(d => (
            <div key={d.id} className={styles.disputeRow}>
              <div className={styles.disputeTop}>
                <div className={styles.disputeInfo}>
                  <span className={styles.disputeName}>{d.user_name ?? d.user_id}</span>
                  <span className={styles.disputeMeta}>
                    Driver: <strong>{d.driver_name}</strong> · {d.driver_type === 'car_taxi' ? '🚕 Car' : '🏍 Bike'} · {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className={styles.disputeMeta}>📍 {d.pickup_location} → {d.dropoff_location}</span>
                  <span className={styles.disputeMeta}>Booking: {d.booking_id}</span>
                </div>
                <span className={styles.disputeStatus} style={{ color: DISPUTE_STATUS_COLORS[d.status] ?? '#888' }}>
                  {d.status}
                </span>
              </div>
              <p className={styles.disputeExplanation}>"{d.explanation}"</p>
              {d.status === 'pending' && supabase && (
                <div className={styles.disputeActions}>
                  <button
                    className={styles.disputeClearBtn}
                    onClick={async () => {
                      await supabase.from('ride_disputes').update({ status: 'cleared' }).eq('id', d.id)
                      await supabase.from('profiles').rpc('decrement_cancellation_count', { driver_name: d.driver_name })
                      setDisputes(prev => prev.map(x => x.id === d.id ? { ...x, status: 'cleared' } : x))
                    }}
                  >✅ Clear Warning</button>
                  <button
                    className={styles.disputeConfirmBtn}
                    onClick={async () => {
                      await supabase.from('ride_disputes').update({ status: 'confirmed' }).eq('id', d.id)
                      setDisputes(prev => prev.map(x => x.id === d.id ? { ...x, status: 'confirmed' } : x))
                    }}
                  >❌ Confirm Warning</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Government fare rates reference card ── */}
      <div className={styles.rateCard}>
        <div className={styles.rateCardHeader}>
          <span>🔒 Government Regulated Fare Rates</span>
          <span className={styles.rateCardSub}>Kemenhub Permenhub — legal tariffs across Indonesia</span>
        </div>
        <div className={styles.rateZones}>
          {[1, 2, 3].map(n => {
            const info = ZONE_INFO[n]
            return (
              <div key={n} className={styles.rateZone}>
                <span className={styles.rateZoneLabel}>Zone {n}</span>
                <span className={styles.rateZoneName}>{info.label}</span>
                <div className={styles.rateZoneRates}>
                  <span>🏍 {formatRp(info.bike_per_km)}<span className={styles.rateUnit}>/km</span></span>
                  <span>🚕 {formatRp(info.car_per_km)}<span className={styles.rateUnit}>/km</span></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
                    <span className={styles.driverName}>{name}{app.status === 'approved' && <span style={{ color: '#22C55E', marginLeft: 4, fontSize: 13 }} title="Verified driver">✅</span>}</span>
                    <span className={styles.driverMeta}>{city} · {app.driver_type === 'car_taxi' ? '🚕 Car Taxi' : '🏍 Bike Ride'} · {dateStr}</span>
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

                    {/* Latest go-online selfie */}
                    {app.profile?.last_selfie_url && (
                      <div className={styles.selfieRow}>
                        <button
                          className={styles.selfieThumb}
                          onClick={() => setLightbox(app.profile.last_selfie_url)}
                          title="View latest go-online selfie"
                        >
                          <img src={app.profile.last_selfie_url} alt="Latest selfie" className={styles.selfieImg} />
                        </button>
                        <div className={styles.selfieInfo}>
                          <span className={styles.selfieLabel}>🪪 Latest Identity Check</span>
                          <span className={styles.selfieMeta}>
                            {app.profile.last_selfie_at
                              ? new Date(app.profile.last_selfie_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Unknown time'}
                          </span>
                          <span className={styles.selfieNote}>Taken when driver last went online</span>
                        </div>
                      </div>
                    )}

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
                    <div className={styles.actions}>
                      {app.status !== 'approved' && (<>
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
                      </>)}

                      {/* Profile status toggle */}
                      <button
                        className={`${styles.btn} ${app.profile_status === 'complete' ? styles.btnProfileComplete : styles.btnProfileWaiting}`}
                        onClick={() => handleSetProfileStatus(app, app.profile_status === 'complete' ? 'waiting_details' : 'complete')}
                        disabled={actionLoading === app.id + '_ps'}
                        title="Toggle whether the driver's profile details are complete"
                      >
                        {actionLoading === app.id + '_ps' ? '…' : app.profile_status === 'complete' ? '✓ Profile Complete' : '⏳ Waiting Details'}
                      </button>

                      {/* Deactivate — only for approved drivers */}
                      {app.status === 'approved' && (
                        <button
                          className={`${styles.btn} ${styles.btnDeactivate}`}
                          onClick={() => handleDeactivate(app)}
                          disabled={isBusy}
                          title="Deactivate this driver — removes online access immediately"
                        >
                          {isBusy ? '…' : '⛔ Deactivate Driver'}
                        </button>
                      )}
                    </div>

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
