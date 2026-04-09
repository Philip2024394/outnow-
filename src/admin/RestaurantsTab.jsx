import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './RestaurantsTab.module.css'

const DEMO = [
  { id: 1, name: 'Warung Bu Sari',         cuisine_type: 'Javanese',   address: 'Jl. Malioboro 45, Yogyakarta', phone: '6281234567890', status: 'pending',  is_open: false, rating: null, review_count: 0, created_at: '2026-04-09T08:00:00Z', owner_id: 'u1', menu_items: [{ id:1 },{ id:2 }] },
  { id: 2, name: 'Bakso Pak Budi',          cuisine_type: 'Indonesian', address: 'Jl. Kaliurang Km 5, Sleman',  phone: '6281234567891', status: 'approved', is_open: true,  rating: 4.6, review_count: 89, created_at: '2026-04-08T11:00:00Z', owner_id: 'u2', menu_items: [{ id:3 },{ id:4 },{ id:5 }] },
  { id: 3, name: 'Ayam Geprek Mbak Rina',   cuisine_type: 'Indonesian', address: 'Jl. Parangtritis 22, Bantul', phone: '6281234567892', status: 'approved', is_open: false, rating: 4.9, review_count: 312, created_at: '2026-04-07T09:30:00Z', owner_id: 'u3', menu_items: [{ id:6 },{ id:7 },{ id:8 },{ id:9 }] },
  { id: 4, name: 'Soto Ayam Bu Tinah',      cuisine_type: 'Javanese',   address: 'Jl. Solo Km 8, Klaten',      phone: '6281234567893', status: 'rejected', is_open: false, rating: null, review_count: 0, created_at: '2026-04-06T14:00:00Z', owner_id: 'u4', menu_items: [] },
]

const FILTER_TABS = [
  { id: 'pending',  label: 'Pending',  color: '#F59E0B' },
  { id: 'approved', label: 'Approved', color: '#F59E0B' },
  { id: 'rejected', label: 'Rejected', color: '#ff6b6b' },
  { id: 'all',      label: 'All',      color: '#888' },
]

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RestaurantsTab() {
  const [restaurants,    setRestaurants]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState('pending')
  const [expanded,       setExpanded]       = useState(null)
  const [actionLoading,  setActionLoading]  = useState(null)
  const [rejectModal,    setRejectModal]    = useState(null)
  const [rejectNote,     setRejectNote]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    if (!supabase) { setRestaurants(DEMO); setLoading(false); return }
    const { data, error } = await supabase
      .from('restaurants')
      .select('*, menu_items(id)')
      .order('created_at', { ascending: false })
    setRestaurants(error || !data?.length ? DEMO : data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status, notes = null) => {
    setActionLoading(id)
    if (supabase) {
      await supabase.from('restaurants').update({ status, admin_notes: notes, updated_at: new Date().toISOString() }).eq('id', id)
    }
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status, admin_notes: notes } : r))
    setActionLoading(null)
  }

  const handleApprove  = (id) => updateStatus(id, 'approved')
  const handleReject   = async () => {
    if (!rejectModal) return
    await updateStatus(rejectModal, 'rejected', rejectNote.trim() || null)
    setRejectModal(null); setRejectNote('')
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    if (supabase) {
      await supabase.from('restaurants')
        .update({ status: 'pending', admin_notes: '⚠️ Suspended by admin — contact support to reinstate', updated_at: new Date().toISOString() })
        .eq('id', id)
    }
    setRestaurants(prev => prev.map(r => r.id === id
      ? { ...r, status: 'pending', admin_notes: '⚠️ Suspended by admin — contact support to reinstate' } : r))
    setActionLoading(null)
  }

  const handleForceClose = async (id, currentlyOpen) => {
    setActionLoading(id)
    if (supabase) {
      await supabase.from('restaurants').update({ is_open: !currentlyOpen, updated_at: new Date().toISOString() }).eq('id', id)
    }
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_open: !currentlyOpen } : r))
    setActionLoading(null)
  }

  const handleToggleFeatured = async (id, currentlyFeatured) => {
    setActionLoading(id)
    if (supabase) {
      await supabase.from('restaurants').update({ featured_this_week: !currentlyFeatured, updated_at: new Date().toISOString() }).eq('id', id)
    }
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, featured_this_week: !currentlyFeatured } : r))
    setActionLoading(null)
  }

  const visible   = filter === 'all' ? restaurants : restaurants.filter(r => r.status === filter)
  const countFor  = (s) => restaurants.filter(r => r.status === s).length

  if (loading) return <div className={styles.loading}>Loading restaurants…</div>

  return (
    <div className={styles.root}>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{countFor('pending')}</span><span className={styles.statLbl}>Pending</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color: '#F59E0B' }}>{countFor('approved')}</span><span className={styles.statLbl}>Approved</span></div>
        <div className={styles.stat}><span className={styles.statNum} style={{ color: '#ff6b6b' }}>{countFor('rejected')}</span><span className={styles.statLbl}>Rejected</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{restaurants.length}</span><span className={styles.statLbl}>Total</span></div>
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

      {/* List */}
      {visible.length === 0
        ? <div className={styles.empty}>No {filter === 'all' ? '' : filter} restaurants.</div>
        : <div className={styles.list}>
            {visible.map(r => {
              const isExpanded = expanded === r.id
              const isBusy     = actionLoading === r.id
              return (
                <div key={r.id} className={`${styles.card} ${styles['status_' + r.status]}`}>
                  {/* Card header */}
                  <div className={styles.cardHeader} onClick={() => setExpanded(isExpanded ? null : r.id)}>
                    <div className={styles.restaurantIcon}>🍽</div>
                    <div className={styles.restaurantInfo}>
                      <span className={styles.restaurantName}>{r.name}</span>
                      <span className={styles.restaurantMeta}>
                        {r.cuisine_type} · {r.address} · {fmtDate(r.created_at)}
                      </span>
                      <span className={styles.restaurantMeta}>
                        📱 {r.phone} · {r.menu_items?.length ?? 0} menu items
                        {r.rating ? ` · ⭐ ${r.rating} (${r.review_count})` : ''}
                      </span>
                      {r.admin_notes && <span className={styles.adminNote}>Note: {r.admin_notes}</span>}
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.statusPill} ${styles['pill_' + r.status]}`}>{r.status}</span>
                      {r.status === 'approved' && (
                        <span className={`${styles.openPill} ${r.is_open ? styles.openPillOn : styles.openPillOff}`}>
                          {r.is_open ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>
                    <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div className={styles.actions}>
                      {r.status !== 'approved' && (
                        <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => handleApprove(r.id)} disabled={isBusy}>
                          {isBusy ? '…' : '✓ Approve'}
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => { setRejectModal(r.id); setRejectNote('') }} disabled={isBusy}>
                          ✕ Reject
                        </button>
                      )}
                      {r.status === 'rejected' && (
                        <button className={`${styles.btn} ${styles.btnResubmit}`} onClick={() => updateStatus(r.id, 'pending', 'Resubmission requested')} disabled={isBusy}>
                          ↩ Move to Pending
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button className={`${styles.btn} ${styles.btnSuspend}`} onClick={() => handleSuspend(r.id)} disabled={isBusy}>
                          ⚠ Suspend
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button className={`${styles.btn} ${r.is_open ? styles.btnClose : styles.btnOpen}`} onClick={() => handleForceClose(r.id, r.is_open)} disabled={isBusy}>
                          {r.is_open ? '🔒 Force Close' : '🔓 Force Open'}
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button className={`${styles.btn} ${r.featured_this_week ? styles.btnUnfeature : styles.btnFeature}`} onClick={() => handleToggleFeatured(r.id, r.featured_this_week)} disabled={isBusy}>
                          {r.featured_this_week ? '★ Unfeature' : '☆ Feature'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }

      {/* Reject modal */}
      {rejectModal && (
        <div className={styles.modalBackdrop} onClick={() => setRejectModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reject Restaurant</h3>
            <p className={styles.modalSub}>Provide a reason so the owner knows what to fix.</p>
            <textarea className={styles.notesInput} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. Address is incomplete — please provide full street address" rows={4} />
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnReject}`} onClick={handleReject}>Confirm Rejection</button>
              <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
