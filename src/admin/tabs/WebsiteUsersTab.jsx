/**
 * WebsiteUsersTab — Admin view of website sign-ups + property listings.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

export default function WebsiteUsersTab() {
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    // Load website users from localStorage (demo) or Supabase
    const localUsers = JSON.parse(localStorage.getItem('indoo_web_users') || '[]')

    if (supabase) {
      try {
        // Get property listings
        const { data: listingsData } = await supabase
          .from('rental_listings')
          .select('*')
          .eq('category', 'Property')
          .order('created_at', { ascending: false })
          .limit(50)
        if (listingsData) setListings(listingsData)
      } catch {}
    }

    setUsers(localUsers.length ? localUsers : [
      { name: 'Demo User', email: 'demo@test.com', accountType: 'buyer', city: 'Yogyakarta', createdAt: '2026-05-01' },
    ])
    setLoading(false)
  }

  const totalListings = listings.length
  const activeListings = listings.filter(l => l.status === 'active' || l.status === 'live').length
  const soldListings = listings.filter(l => l.status === 'sold').length

  return (
    <div style={{ padding: 0 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'WEBSITE USERS', value: users.length, color: '#fff' },
          { label: 'TOTAL LISTINGS', value: totalListings, color: '#8DC63F' },
          { label: 'ACTIVE', value: activeListings, color: '#FACC15' },
          { label: 'SOLD', value: soldListings, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 140, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>🌐 Website Sign-ups</h3>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'Email', 'Type', 'City', 'Joined'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 14, fontWeight: 800, color: '#fff' }}>{u.name}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: u.accountType === 'agent' ? 'rgba(96,165,250,0.12)' : u.accountType === 'developer' ? 'rgba(250,204,21,0.12)' : 'rgba(141,198,63,0.12)', color: u.accountType === 'agent' ? '#60A5FA' : u.accountType === 'developer' ? '#FACC15' : '#8DC63F' }}>{u.accountType || 'buyer'}</span>
                </td>
                <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{u.city || '—'}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{u.createdAt?.split('T')[0] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No website users yet</div>}
      </div>

      {/* Recent Listings */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12, marginTop: 24 }}>🏠 Recent Property Listings</h3>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Title', 'Type', 'City', 'Status', 'Price', 'Created'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.slice(0, 20).map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{l.title}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.sub_category || l.category}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l.city}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: l.status === 'active' || l.status === 'live' ? 'rgba(141,198,63,0.12)' : l.status === 'sold' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', color: l.status === 'active' || l.status === 'live' ? '#8DC63F' : l.status === 'sold' ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>{l.status}</span>
                </td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#FACC15' }}>{l.buy_now ? 'Sale' : l.price_month ? `Rp ${(l.price_month/1e6).toFixed(0)}M/mo` : '—'}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{l.created_at?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {listings.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No listings in Supabase — showing demo data on website</div>}
      </div>
    </div>
  )
}
