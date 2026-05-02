/**
 * WantedPropertyAdminTab — Admin tab for managing Wanted Property requests.
 * Shows all buyer requests, verify buyers, delete requests, filter/search.
 */
import { useState, useEffect } from 'react'
import { getWantedProperties, fmtBudget, TIMELINE_OPTIONS } from '@/services/wantedPropertyService'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

const PROPERTY_TYPES = ['All', 'Villa', 'Apartment', 'House', 'Kos', 'Tanah', 'Ruko', 'Penthouse', 'Studio']

export default function WantedPropertyAdminTab() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterTimeline, setFilterTimeline] = useState('all')

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    setLoading(true)
    const data = await getWantedProperties()
    setRequests(data)
    setLoading(false)
  }

  function toggleVerify(id) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, buyer_verified: !r.buyer_verified } : r))
  }

  function deleteRequest(id) {
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  // Apply local filters
  const filtered = requests.filter(r => {
    if (search && !r.location?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'All' && r.property_type !== filterType) return false
    if (filterTimeline !== 'all' && r.timeline !== filterTimeline) return false
    return true
  })

  const totalRequests = requests.length
  const buyingNowCount = requests.filter(r => r.timeline === 'buying_now').length
  const verifiedCount = requests.filter(r => r.buyer_verified).length

  const timelineLabel = (id) => TIMELINE_OPTIONS.find(t => t.id === id)?.label || id || '—'
  const timelineColor = (id) => TIMELINE_OPTIONS.find(t => t.id === id)?.color || 'rgba(255,255,255,0.4)'

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading wanted properties...</div>

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL REQUESTS', value: totalRequests, color: '#fff' },
          { label: 'BUYING NOW', value: buyingNowCount, color: '#EF4444' },
          { label: 'VERIFIED BUYERS', value: verifiedCount, color: '#8DC63F' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 120, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          placeholder="Search by location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
          {PROPERTY_TYPES.map(t => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
          ))}
        </select>
        <select style={selectStyle} value={filterTimeline} onChange={e => setFilterTimeline(e.target.value)}>
          <option value="all">All Timelines</option>
          {TIMELINE_OPTIONS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Buyer', 'Type', 'Location', 'Budget Range', 'Timeline', 'Listing', 'Status', 'Responses', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {r.buyer_name || 'Anonymous'}
                  {r.buyer_verified && <span style={{ marginLeft: 6, color: '#8DC63F', fontSize: 11 }}>✓</span>}
                </td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.property_type}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.location}</td>
                <td style={{ padding: '12px', fontSize: 12, fontWeight: 700, color: '#FACC15' }}>
                  {fmtBudget(r.budget_min)} — {fmtBudget(r.budget_max)}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: `${timelineColor(r.timeline)}15`, color: timelineColor(r.timeline) }}>
                    {timelineLabel(r.timeline)}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: 12, fontWeight: 700, color: r.listing_type === 'buy' ? '#60A5FA' : '#A78BFA', textTransform: 'uppercase' }}>
                  {r.listing_type || '—'}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: r.status === 'active' ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.06)', color: r.status === 'active' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.responses_count ?? 0}</td>
                <td style={{ padding: '12px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleVerify(r.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      background: r.buyer_verified ? 'rgba(245,158,11,0.12)' : 'rgba(141,198,63,0.12)',
                      color: r.buyer_verified ? '#F59E0B' : '#8DC63F',
                    }}
                  >
                    {r.buyer_verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button
                    onClick={() => deleteRequest(r.id)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No wanted property requests found</div>}
      </div>
    </div>
  )
}
