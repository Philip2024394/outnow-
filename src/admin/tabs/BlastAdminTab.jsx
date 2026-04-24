/**
 * BlastAdminTab — Admin approval for paid deal blasts
 */
import { useState, useEffect } from 'react'
import { getPendingBlasts, approveBlast, rejectBlast } from '@/domains/dealhunt/pages/DealBlast'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

export default function BlastAdminTab() {
  const [blasts, setBlasts] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('indoo_deal_blasts') || '[]')
    setBlasts(all)
  }, [])

  const reload = () => setBlasts(JSON.parse(localStorage.getItem('indoo_deal_blasts') || '[]'))
  const filtered = blasts.filter(b => b.status === filter)

  return (
    <div style={{ padding: 28, maxWidth: 800 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>🚀 Deal Blasts</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
        {blasts.filter(b => b.status === 'pending').length} pending · Revenue: {fmtRp(blasts.filter(b => b.status === 'sent').reduce((s, b) => s + b.price, 0))}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'sent', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: filter === f ? (f === 'pending' ? '#FACC15' : f === 'sent' ? '#8DC63F' : '#EF4444') : 'rgba(255,255,255,0.06)',
            color: filter === f ? '#000' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 800, textTransform: 'capitalize',
          }}>
            {f} ({blasts.filter(b => b.status === f).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No {filter} blasts</div>}
        {filtered.map(b => (
          <div key={b.id} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {b.banner_url && <img src={b.banner_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{b.deal_title}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(b.price)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              {b.package} · {b.users?.toLocaleString()} users · {b.city} · {b.payment_method} · Ref: {b.transaction_code}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{new Date(b.created_at).toLocaleString()}</div>
            {b.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => { approveBlast(b.id); reload() }} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Approve & Send</button>
                <button onClick={() => { rejectBlast(b.id, 'Does not meet guidelines'); reload() }} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
