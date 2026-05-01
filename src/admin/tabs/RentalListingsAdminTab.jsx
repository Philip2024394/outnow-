/**
 * RentalListingsAdminTab — Approve, reject, feature property listings.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_LISTINGS } from '@/services/rentalService'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

export default function RentalListingsAdminTab() {
  const [listings, setListings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadListings() }, [])

  async function loadListings() {
    setLoading(true)
    if (supabase) {
      try {
        const { data } = await supabase.from('rental_listings').select('*').order('created_at', { ascending: false }).limit(100)
        if (data?.length) { setListings(data); setLoading(false); return }
      } catch {}
    }
    setListings(DEMO_LISTINGS.filter(l => l.category === 'Property'))
    setLoading(false)
  }

  async function updateStatus(id, status) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    if (supabase) { try { await supabase.from('rental_listings').update({ status }).eq('id', id) } catch {} }
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing?')) return
    setListings(prev => prev.filter(l => l.id !== id))
    if (supabase) { try { await supabase.from('rental_listings').delete().eq('id', id) } catch {} }
  }

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter)
  const active = listings.filter(l => l.status === 'active' || l.status === 'live').length
  const sold = listings.filter(l => l.status === 'sold').length
  const rented = listings.filter(l => l.status === 'rented').length

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL', value: listings.length, color: '#fff' },
          { label: 'ACTIVE', value: active, color: '#8DC63F' },
          { label: 'SOLD', value: sold, color: '#EF4444' },
          { label: 'RENTED', value: rented, color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 120, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'active', 'live', 'sold', 'rented', 'paused'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            background: filter === f ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Title', 'Type', 'City', 'Price', 'Status', 'Owner', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.sub_category || l.category}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.city}</td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#FACC15' }}>{l.buy_now ? 'Sale' : l.price_month ? `${(l.price_month/1e6).toFixed(0)}M/mo` : '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: l.status === 'active' || l.status === 'live' ? 'rgba(141,198,63,0.12)' : l.status === 'sold' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', color: l.status === 'active' || l.status === 'live' ? '#8DC63F' : l.status === 'sold' ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>{l.status}</span>
                </td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.owner_type || 'owner'}</td>
                <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                  {l.status !== 'active' && <button onClick={() => updateStatus(l.id, 'active')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(141,198,63,0.12)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Activate</button>}
                  {l.status === 'active' && <button onClick={() => updateStatus(l.id, 'paused')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Pause</button>}
                  <button onClick={() => deleteListing(l.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No listings</div>}
      </div>
    </div>
  )
}
