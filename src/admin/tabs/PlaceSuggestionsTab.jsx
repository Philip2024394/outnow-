import { useState, useEffect } from 'react'
import {
  getAllSuggestions, approveSuggestion, rejectSuggestion, deleteSuggestion, ACTIVITY_TYPES,
} from '@/services/placeSuggestionService'
import styles from './PlaceSuggestionsTab.module.css'

export default function PlaceSuggestionsTab() {
  const [suggestions, setSuggestions] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => { setSuggestions(getAllSuggestions()) }, [])

  const refresh = () => setSuggestions(getAllSuggestions())

  const filtered = filter === 'all' ? suggestions : suggestions.filter(s => s.status === filter)
  const pending  = suggestions.filter(s => s.status === 'pending').length
  const approved = suggestions.filter(s => s.status === 'approved').length
  const rejected = suggestions.filter(s => s.status === 'rejected').length

  function handleApprove(id) {
    approveSuggestion(id)
    refresh()
  }

  function handleReject(id) {
    rejectSuggestion(id)
    refresh()
  }

  function handleDelete(id) {
    deleteSuggestion(id)
    refresh()
  }

  function openWhatsApp(phone, placeName) {
    const msg = encodeURIComponent(`Hi! We're reviewing your place suggestion "${placeName}" on Indoo. We'd like to confirm a few details.`)
    const num = phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  function getActivityInfo(typeId) {
    return ACTIVITY_TYPES.find(a => a.id === typeId) || { icon: '📍', label: typeId }
  }

  function fmtDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={styles.page}>
      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statChip} style={{ '--c': '#F59E0B' }}>
          <span className={styles.statChipVal}>{pending}</span>
          <span className={styles.statChipLabel}>Pending</span>
        </div>
        <div className={styles.statChip} style={{ '--c': '#8DC63F' }}>
          <span className={styles.statChipVal}>{approved}</span>
          <span className={styles.statChipLabel}>Approved</span>
        </div>
        <div className={styles.statChip} style={{ '--c': '#EF4444' }}>
          <span className={styles.statChipVal}>{rejected}</span>
          <span className={styles.statChipLabel}>Rejected</span>
        </div>
        <div className={styles.statChip} style={{ '--c': 'rgba(255,255,255,0.4)' }}>
          <span className={styles.statChipVal}>{suggestions.length}</span>
          <span className={styles.statChipLabel}>Total</span>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 && <div className={styles.empty}>No suggestions {filter !== 'all' ? `with status "${filter}"` : ''}</div>}

        {filtered.map(s => {
          const act = getActivityInfo(s.activityType)
          return (
            <div key={s.id} className={styles.card}>
              {s.photo ? (
                <img src={s.photo} alt="" className={styles.cardPhoto} />
              ) : (
                <div className={styles.cardNoPhoto}>{act.icon}</div>
              )}

              <div className={styles.cardBody}>
                <span className={styles.cardName}>{s.placeName}</span>
                <span className={styles.cardType}>{act.icon} {act.label}</span>
                {s.address && <span className={styles.cardAddress}>{s.address}</span>}
                {s.lat && <span className={styles.cardGps}>📍 {s.lat.toFixed(5)}, {s.lng.toFixed(5)}</span>}
                {s.notes && <span className={styles.cardNotes}>"{s.notes}"</span>}

                <div className={styles.cardSubmitter}>
                  <span className={styles.submitterName}>{s.submitterName}</span>
                  <span className={styles.submitterWa}>{s.whatsapp}</span>
                  <span className={styles.submitterDate}>{fmtDate(s.submittedAt)}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {s.status === 'pending' ? (
                  <>
                    <button className={styles.approveBtn} onClick={() => handleApprove(s.id)}>Approve</button>
                    <button className={styles.rejectBtn} onClick={() => handleReject(s.id)}>Reject</button>
                    <button className={styles.waBtn} onClick={() => openWhatsApp(s.whatsapp, s.placeName)}>WhatsApp</button>
                  </>
                ) : (
                  <>
                    <span className={`${styles.statusBadge} ${s.status === 'approved' ? styles.statusApproved : styles.statusRejected}`}>
                      {s.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                    </span>
                    <button className={styles.rejectBtn} onClick={() => handleDelete(s.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
