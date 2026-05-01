/**
 * PlacesListingsTab — Admin manage business listing applications.
 * Approve/reject, track revenue, view analytics.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

const DEMO = [
  { id: 'd1', business_name: 'Warung Gudeg Bu Tjitro', owner_name: 'Bu Tjitro', whatsapp: '081234567890', category: 'restaurant', tier: 'basic', fee_paid: 100000, status: 'pending', view_count: 0, ride_count: 0, rating_avg: 0, referral_code: 'INDOO-WARU1234', created_at: '2026-05-01T10:00:00Z' },
  { id: 'd2', business_name: 'Bali Diving Center', owner_name: 'Pak Made', whatsapp: '087654321098', category: 'diving', tier: 'premium', fee_paid: 250000, status: 'approved', verified: true, view_count: 156, ride_count: 23, rating_avg: 4.7, referral_code: 'INDOO-BALI5678', activated_at: '2026-04-15T08:00:00Z', expires_at: '2027-04-15T08:00:00Z', created_at: '2026-04-14T10:00:00Z' },
]

export default function PlacesListingsTab() {
  const [listings, setListings] = useState(DEMO)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadListings() }, [])

  async function loadListings() {
    if (!supabase) return
    setLoading(true)
    try {
      const { data } = await supabase.from('places_listings').select('*').order('created_at', { ascending: false })
      if (data?.length) setListings(data)
    } catch {}
    setLoading(false)
  }

  async function handleApprove(id) {
    const now = new Date()
    const expires = new Date(now)
    expires.setFullYear(expires.getFullYear() + 1)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'approved', verified: true, activated_at: now.toISOString(), expires_at: expires.toISOString() } : l))
    if (supabase) {
      try { await supabase.from('places_listings').update({ status: 'approved', verified: true, activated_at: now.toISOString(), expires_at: expires.toISOString() }).eq('id', id) } catch {}
    }
  }

  async function handleReject(id) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
    if (supabase) {
      try { await supabase.from('places_listings').update({ status: 'rejected' }).eq('id', id) } catch {}
    }
  }

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter)
  const pending = listings.filter(l => l.status === 'pending').length
  const approved = listings.filter(l => l.status === 'approved').length
  const revenue = listings.filter(l => l.status === 'approved').reduce((s, l) => s + (l.fee_paid || 0), 0)

  return (
    <div style={{ padding: 0 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL', value: listings.length, color: '#fff' },
          { label: 'PENDING', value: pending, color: '#F59E0B' },
          { label: 'APPROVED', value: approved, color: '#8DC63F' },
          { label: 'REVENUE', value: `Rp ${revenue.toLocaleString('id-ID')}`, color: '#FACC15' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 140, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'approved', 'rejected', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            background: filter === f ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700,
            textTransform: 'capitalize',
          }}>{f} {f === 'pending' && pending > 0 ? `(${pending})` : ''}</button>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Business', 'Owner', 'Category', 'Tier', 'Fee', 'Status', 'Views', 'Rides', 'Rating', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => {
              const isExpiring = l.expires_at && (new Date(l.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontSize: 14, fontWeight: 800, color: '#fff' }}>{l.business_name}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{l.owner_name}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{l.category}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: l.tier === 'premium' ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.04)', color: l.tier === 'premium' ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{l.tier === 'premium' ? '⭐ Premium' : 'Basic'}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#FACC15' }}>Rp {(l.fee_paid || 0).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: l.status === 'approved' ? 'rgba(141,198,63,0.12)' : l.status === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: l.status === 'approved' ? '#8DC63F' : l.status === 'pending' ? '#F59E0B' : '#EF4444' }}>
                      {l.status}{isExpiring ? ' ⚠️' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#60A5FA', fontWeight: 700 }}>{l.view_count || 0}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#8DC63F', fontWeight: 700 }}>{l.ride_count || 0}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#FACC15', fontWeight: 700 }}>{l.rating_avg ? `⭐ ${l.rating_avg}` : '—'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                    {l.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(l.id)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(141,198,63,0.15)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Approve</button>
                        <button onClick={() => handleReject(l.id)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Reject</button>
                      </>
                    )}
                    <a href={`https://wa.me/${(l.whatsapp || '').replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(37,211,102,0.12)', color: '#25D366', fontSize: 11, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No listings</div>}
      </div>
    </div>
  )
}
