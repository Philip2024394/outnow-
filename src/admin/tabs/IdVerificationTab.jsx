/**
 * IdVerificationTab — admin review for user identity documents.
 * Lists profiles with id_verification_status = 'pending'.
 * Admin can Approve (sets id_verified=true) or Reject.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './IdVerificationTab.module.css'

const DEMO_ITEMS = [
  { id: 'u1', display_name: 'Maya R.',  photo_url: 'https://i.pravatar.cc/48?img=1', id_document_url: null, id_verification_status: 'pending', country: 'Indonesia', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'u2', display_name: 'James T.', photo_url: 'https://i.pravatar.cc/48?img=7', id_document_url: null, id_verification_status: 'pending', country: 'Australia', created_at: new Date(Date.now() - 7200000).toISOString() },
]

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function IdVerificationTab() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending') // 'pending' | 'approved' | 'rejected' | 'all'
  const [working,  setWorking]  = useState(null) // userId being processed

  useEffect(() => { load() }, [filter]) // eslint-disable-line

  async function load() {
    setLoading(true)
    try {
      if (!supabase) throw new Error('demo')
      let q = supabase
        .from('profiles')
        .select('id, display_name, photo_url, id_document_url, id_verification_status, id_verified, country, created_at')
        .not('id_verification_status', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100)
      if (filter !== 'all') q = q.eq('id_verification_status', filter)
      const { data, error } = await q
      if (error) throw error
      setItems(data ?? [])
    } catch {
      setItems(filter === 'pending' || filter === 'all' ? DEMO_ITEMS : [])
    }
    setLoading(false)
  }

  async function approve(userId) {
    setWorking(userId)
    try {
      if (supabase) {
        await supabase.from('profiles').update({
          id_verified:            true,
          id_verification_status: 'approved',
          updated_at:             new Date().toISOString(),
        }).eq('id', userId)
      }
      setItems(prev => prev.map(i => i.id === userId
        ? { ...i, id_verified: true, id_verification_status: 'approved' }
        : i
      ))
    } catch { /* silent */ }
    setWorking(null)
  }

  async function reject(userId) {
    setWorking(userId)
    try {
      if (supabase) {
        await supabase.from('profiles').update({
          id_verified:            false,
          id_verification_status: 'rejected',
          updated_at:             new Date().toISOString(),
        }).eq('id', userId)
      }
      setItems(prev => prev.map(i => i.id === userId
        ? { ...i, id_verified: false, id_verification_status: 'rejected' }
        : i
      ))
    } catch { /* silent */ }
    setWorking(null)
  }

  const counts = {
    pending:  items.filter(i => i.id_verification_status === 'pending').length,
    approved: items.filter(i => i.id_verification_status === 'approved').length,
    rejected: items.filter(i => i.id_verification_status === 'rejected').length,
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>ID Verification</h2>
          <p className={styles.sub}>Review user identity documents — approve to show ⭐ on their dating profile</p>
        </div>
        <button className={styles.refreshBtn} onClick={load} disabled={loading}>↻ Refresh</button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat} style={{ borderColor: 'rgba(251,191,36,0.3)' }}>
          <span className={styles.statNum} style={{ color: '#FBBF24' }}>{counts.pending}</span>
          <span className={styles.statLbl}>Pending</span>
        </div>
        <div className={styles.stat} style={{ borderColor: 'rgba(74,222,128,0.3)' }}>
          <span className={styles.statNum} style={{ color: '#4ADE80' }}>{counts.approved}</span>
          <span className={styles.statLbl}>Approved</span>
        </div>
        <div className={styles.stat} style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
          <span className={styles.statNum} style={{ color: '#F87171' }}>{counts.rejected}</span>
          <span className={styles.statLbl}>Rejected</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filters}>
        {['pending','approved','rejected','all'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && counts.pending > 0 && (
              <span className={styles.filterBadge}>{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.loadingWrap}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} style={{ animationDelay: '0.2s' }} />
          <span className={styles.loadingDot} style={{ animationDelay: '0.4s' }} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyWrap}>
          <span>✅</span>
          <p>No {filter === 'all' ? '' : filter} submissions</p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              {/* Avatar */}
              <div className={styles.avatarWrap}>
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.display_name} className={styles.avatar} />
                  : <div className={styles.avatarFallback}>{(item.display_name ?? '?')[0].toUpperCase()}</div>
                }
              </div>

              {/* Info */}
              <div className={styles.info}>
                <div className={styles.name}>
                  {item.id_verified && <span className={styles.verifiedStar}>⭐</span>}
                  {item.display_name ?? 'Unknown'}
                </div>
                <div className={styles.meta}>
                  {item.country && <span>{item.country}</span>}
                  <span>Submitted {timeAgo(item.created_at)}</span>
                </div>
                <div className={styles.statusRow}>
                  <span className={`${styles.statusPill} ${styles[`status_${item.id_verification_status}`]}`}>
                    {item.id_verification_status}
                  </span>
                </div>
              </div>

              {/* Document preview */}
              <div className={styles.docWrap}>
                {item.id_document_url ? (
                  <a href={item.id_document_url} target="_blank" rel="noreferrer" className={styles.docLink}>
                    📄 View Document
                  </a>
                ) : (
                  <span className={styles.docMissing}>No document (demo)</span>
                )}
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {item.id_verification_status !== 'approved' && (
                  <button
                    className={styles.approveBtn}
                    onClick={() => approve(item.id)}
                    disabled={working === item.id}
                  >
                    {working === item.id ? '…' : '✓ Approve'}
                  </button>
                )}
                {item.id_verification_status !== 'rejected' && (
                  <button
                    className={styles.rejectBtn}
                    onClick={() => reject(item.id)}
                    disabled={working === item.id}
                  >
                    {working === item.id ? '…' : '✕ Reject'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
