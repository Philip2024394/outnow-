import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './DatingAdminTab.module.css'

const DEMO_VIOLATIONS = [
  { id:'v1', user_id:'u1', blocked_text:'my whatsapp is 08123456789', reason:'phone', role:'seller', reviewed:false, created_at:'2026-04-15T10:23:00Z', user_name:'Budi Seller', violation_count:3 },
  { id:'v2', user_id:'u2', blocked_text:'add me on instagram @myshop', reason:'social', role:'seller', reviewed:false, created_at:'2026-04-15T09:45:00Z', user_name:'Rina Shop', violation_count:1 },
  { id:'v3', user_id:'u3', blocked_text:'check my website www.mystore.com', reason:'link', role:'buyer', reviewed:false, created_at:'2026-04-14T22:10:00Z', user_name:'Andi Buyer', violation_count:2 },
  { id:'v4', user_id:'u4', blocked_text:'hubungi saya di nol delapan satu dua tiga empat lima enam', reason:'phone', role:'seller', reviewed:true, created_at:'2026-04-14T18:30:00Z', user_name:'Maya Craft', violation_count:5 },
  { id:'v5', user_id:'u5', blocked_text:'find me on tokopedia', reason:'social', role:'buyer', reviewed:true, created_at:'2026-04-13T14:00:00Z', user_name:'Dian P.', violation_count:1 },
]

const REASON_CONFIG = {
  phone:  { label: 'Phone Number', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  link:   { label: 'Link / URL',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  social: { label: 'Social Media', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
}

export default function ViolationsTab() {
  const [violations, setViolations] = useState(DEMO_VIOLATIONS)
  const [filter, setFilter] = useState('all') // all | unreviewed | phone | link | social
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    supabase.from('content_violations')
      .select('*, profiles!content_violations_user_id_fkey(display_name, violation_count)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data?.length) {
          setViolations(data.map(v => ({
            ...v,
            user_name: v.profiles?.display_name ?? 'Unknown',
            violation_count: v.profiles?.violation_count ?? 0,
          })))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleMarkReviewed = (id) => {
    setViolations(prev => prev.map(v => v.id === id ? { ...v, reviewed: true } : v))
    supabase?.from('content_violations').update({ reviewed: true }).eq('id', id).catch(() => {})
  }

  const handleBanUser = (userId) => {
    if (!confirm('Ban this user? They will not be able to use the marketplace.')) return
    supabase?.from('profiles').update({ is_banned: true }).eq('id', userId).catch(() => {})
    setViolations(prev => prev.map(v => v.user_id === userId ? { ...v, banned: true } : v))
  }

  const filtered = violations.filter(v => {
    if (filter === 'unreviewed') return !v.reviewed
    if (filter === 'phone' || filter === 'link' || filter === 'social') return v.reason === filter
    return true
  })

  const unrevCount = violations.filter(v => !v.reviewed).length

  return (
    <div className={styles.page}>
      <div className={styles.statsBar}>
        {[
          { label: 'Total Violations', value: violations.length, color: '#ef4444' },
          { label: 'Unreviewed', value: unrevCount, color: '#f59e0b' },
          { label: 'Phone Attempts', value: violations.filter(v => v.reason === 'phone').length, color: '#ef4444' },
          { label: 'Social Attempts', value: violations.filter(v => v.reason === 'social').length, color: '#a855f7' },
          { label: 'Link Attempts', value: violations.filter(v => v.reason === 'link').length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className={styles.statChip} style={{ '--c': s.color }}>
            <span className={styles.statChipVal}>{s.value}</span>
            <span className={styles.statChipLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterBtns}>
          {[
            { id: 'all', label: 'All' },
            { id: 'unreviewed', label: `Unreviewed (${unrevCount})` },
            { id: 'phone', label: 'Phone' },
            { id: 'social', label: 'Social' },
            { id: 'link', label: 'Links' },
          ].map(f => (
            <button key={f.id} className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{['User','Role','Type','Blocked Text','Total Violations','Status','Time','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(v => {
              const rc = REASON_CONFIG[v.reason] ?? REASON_CONFIG.phone
              const timeAgo = Math.floor((Date.now() - new Date(v.created_at).getTime()) / 60000)
              const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo/60)}h ago` : `${Math.floor(timeAgo/1440)}d ago`
              return (
                <tr key={v.id} style={{ opacity: v.reviewed ? 0.5 : 1 }}>
                  <td><span className={styles.name}>{v.user_name ?? 'Unknown'}</span></td>
                  <td>
                    <span style={{
                      padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700,
                      background: v.role === 'seller' ? 'rgba(168,85,247,0.15)' : 'rgba(0,229,255,0.15)',
                      color: v.role === 'seller' ? '#a855f7' : '#00E5FF',
                      border: `1px solid ${v.role === 'seller' ? 'rgba(168,85,247,0.3)' : 'rgba(0,229,255,0.3)'}`,
                      textTransform:'uppercase',
                    }}>
                      {v.role ?? '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, background:rc.bg, color:rc.color, border:`1px solid ${rc.color}44` }}>
                      {rc.label}
                    </span>
                  </td>
                  <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'rgba(255,255,255,0.6)' }}>
                    "{v.blocked_text}"
                  </td>
                  <td>
                    <span style={{ color: v.violation_count >= 5 ? '#ef4444' : v.violation_count >= 3 ? '#f59e0b' : '#00FF9D', fontWeight:700, fontFamily:'monospace' }}>
                      {v.violation_count}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${v.reviewed ? styles.active : styles.pending}`}>
                      {v.banned ? 'Banned' : v.reviewed ? 'Reviewed' : 'Pending'}
                    </span>
                  </td>
                  <td className={styles.dim} style={{ fontFamily:'monospace', fontSize:11 }}>{timeStr}</td>
                  <td>
                    <div className={styles.actions}>
                      {!v.reviewed && (
                        <button className={styles.actionBtn} title="Mark Reviewed" onClick={() => handleMarkReviewed(v.id)}>✓</button>
                      )}
                      {v.violation_count >= 3 && !v.banned && (
                        <button className={`${styles.actionBtn} ${styles.danger}`} title="Ban User" onClick={() => handleBanUser(v.user_id)}>🚫</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {loading && <div style={{ textAlign:'center', padding:20, color:'rgba(255,255,255,0.3)' }}>Loading...</div>}
    </div>
  )
}
