import { useState } from 'react'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const now = Date.now()
const hAgo = (n) => new Date(now - n * 3600000).toISOString()

const DEMO = [
  { id: 'cn1', order_ref: '#IM-4821', conversation_id: 'order-abc123', buyer_id: 'b1', buyer_name: 'Ava Mitchell', seller_id: 's1', seller_name: 'Bali Crafts Co.', cancelled_by: 'buyer', order_total: 245000, items: [{ name: 'Handmade Bracelet', qty: 2 }], reason: 'manual', status: 'pending', admin_notes: '', created_at: hAgo(2) },
  { id: 'cn2', order_ref: '#IM-4822', conversation_id: 'order-def456', buyer_id: 'b2', buyer_name: 'Jordan Lee', seller_id: 's2', seller_name: 'Warung Sari Rasa', cancelled_by: 'seller', order_total: 81000, items: [{ name: 'Nasi Goreng Special', qty: 1 }, { name: 'Es Teh', qty: 2 }], reason: 'manual', status: 'pending', admin_notes: '', created_at: hAgo(5) },
  { id: 'cn3', order_ref: '#IM-4823', conversation_id: 'order-ghi789', buyer_id: 'b3', buyer_name: 'Maya Patel', seller_id: 's3', seller_name: 'Toko Batik Mega', cancelled_by: 'seller', order_total: 340000, items: [{ name: 'Batik Shirt', qty: 1 }], reason: 'manual', status: 'investigated', admin_notes: 'Seller out of stock', created_at: hAgo(18) },
  { id: 'cn4', order_ref: '#IM-4824', conversation_id: 'order-jkl012', buyer_id: 'b4', buyer_name: 'Kai Thompson', seller_id: 's4', seller_name: 'Ayam Geprek Mbak Rina', cancelled_by: 'buyer', order_total: 56000, items: [{ name: 'Ayam Geprek Level 5', qty: 1 }], reason: 'manual', status: 'resolved', admin_notes: 'Buyer changed mind, refund processed', created_at: hAgo(48) },
  { id: 'cn5', order_ref: '#IM-4825', conversation_id: 'order-mno345', buyer_id: 'b5', buyer_name: 'Priya Sharma', seller_id: 's5', seller_name: 'Butik Kebaya Sari', cancelled_by: 'seller', order_total: 890000, items: [{ name: 'Custom Kebaya', qty: 1 }], reason: 'manual', status: 'pending', admin_notes: '', created_at: hAgo(8) },
  { id: 'cn6', order_ref: '#IM-4826', conversation_id: 'order-pqr678', buyer_id: 'b6', buyer_name: 'Sam Okafor', seller_id: 's6', seller_name: 'Bakso Pak Budi', cancelled_by: 'buyer', order_total: 32000, items: [{ name: 'Bakso Urat', qty: 2 }], reason: 'system', status: 'pending', admin_notes: '', created_at: hAgo(12) },
  { id: 'cn7', order_ref: '#IM-4827', conversation_id: 'order-stu901', buyer_id: 'b7', buyer_name: 'Chloe Brennan', seller_id: 's7', seller_name: 'Toko Elektronik Jaya', cancelled_by: 'seller', order_total: 2800000, items: [{ name: 'Wireless Earbuds', qty: 1 }, { name: 'Phone Case', qty: 2 }], reason: 'manual', status: 'investigated', admin_notes: 'High value — seller unresponsive', created_at: hAgo(72) },
  { id: 'cn8', order_ref: '#IM-4828', conversation_id: 'order-vwx234', buyer_id: 'b8', buyer_name: 'Ravi Gupta', seller_id: 's8', seller_name: 'Nasi Goreng Pak Harto', cancelled_by: 'buyer', order_total: 28000, items: [{ name: 'Nasi Goreng Biasa', qty: 1 }], reason: 'manual', status: 'resolved', admin_notes: 'Duplicate order', created_at: hAgo(96) },
]

export default function CancellationsTab() {
  const [data, setData] = useState(DEMO)
  const [filterBy, setFilterBy] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedItems, setExpandedItems] = useState({})

  const today = new Date().toDateString()
  const todayCount = data.filter(c => new Date(c.created_at).toDateString() === today).length
  const bySellerCount = data.filter(c => c.cancelled_by === 'seller').length
  const byBuyerCount = data.filter(c => c.cancelled_by === 'buyer').length

  const filtered = data.filter(c => {
    if (filterBy === 'seller' && c.cancelled_by !== 'seller') return false
    if (filterBy === 'buyer' && c.cancelled_by !== 'buyer') return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.order_ref.toLowerCase().includes(q) ||
        c.buyer_name.toLowerCase().includes(q) ||
        c.seller_name.toLowerCase().includes(q) ||
        c.conversation_id.toLowerCase().includes(q)
      )
    }
    return true
  })

  const updateStatus = (id, newStatus) => {
    setData(d => d.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  const toggleItems = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const statusStyle = (status) => {
    if (status === 'pending') return { background: 'rgba(255,149,0,0.1)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.25)' }
    if (status === 'investigated') return { background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.25)' }
    if (status === 'resolved') return { background: 'rgba(52,199,89,0.1)', color: '#34C759', border: '1px solid rgba(52,199,89,0.25)' }
    return {}
  }

  const statusLabel = (status) => {
    if (status === 'pending') return 'Pending Review'
    if (status === 'investigated') return 'Investigated'
    if (status === 'resolved') return 'Resolved'
    return status
  }

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <h2 style={{ color: '#00E5FF', fontFamily: 'monospace', marginBottom: 20, fontSize: 18 }}>
        Order Cancellations
      </h2>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: data.length, color: '#00E5FF' },
          { label: 'Today', value: todayCount, color: '#FF9500' },
          { label: 'By Seller', value: bySellerCount, color: '#EF4444' },
          { label: 'By Buyer', value: byBuyerCount, color: '#FBBF24' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 140px', padding: '14px 18px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'seller', 'buyer'].map(f => (
            <button
              key={f}
              onClick={() => setFilterBy(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                background: filterBy === f ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: filterBy === f ? '#00E5FF' : 'rgba(255,255,255,0.5)',
                border: filterBy === f ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {f === 'all' ? 'All' : f === 'seller' ? 'By Seller' : 'By Buyer'}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search order ref, buyer, seller..."
          style={{
            flex: '1 1 200px', padding: '8px 14px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Date/Time', 'Order Ref', 'Conv ID', 'Buyer', 'Seller', 'Cancelled By', 'Total', 'Items', 'Reason', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600, fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  No cancellations match this filter
                </td>
              </tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11 }}>
                  {fmtDate(c.created_at)}
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{c.order_ref}</td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}>
                  {c.conversation_id.length > 16 ? c.conversation_id.slice(0, 16) + '...' : c.conversation_id}
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.buyer_name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.buyer_id}</div>
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.seller_name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.seller_id}</div>
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: c.cancelled_by === 'seller' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                    color: c.cancelled_by === 'seller' ? '#EF4444' : '#FBBF24',
                    border: `1px solid ${c.cancelled_by === 'seller' ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.25)'}`,
                  }}>
                    {c.cancelled_by === 'seller' ? 'Seller' : 'Buyer'}
                  </span>
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#FF9500' }}>
                  {fmtRp(c.order_total)}
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => toggleItems(c.id)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit',
                    }}
                  >
                    {expandedItems[c.id] ? 'Hide' : `${c.items.length} item${c.items.length !== 1 ? 's' : ''}`}
                  </button>
                  {expandedItems[c.id] && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                      {c.items.map((item, i) => (
                        <div key={i}>{item.qty}x {item.name}</div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  {c.reason}
                </td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    ...statusStyle(c.status),
                  }}>
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                        color: '#00E5FF', fontFamily: 'inherit',
                      }}
                      title="View Chat"
                    >
                      Chat
                    </button>
                    {c.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(c.id, 'investigated')}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)',
                          color: '#FF9500', fontFamily: 'inherit',
                        }}
                      >
                        Investigate
                      </button>
                    )}
                    {(c.status === 'pending' || c.status === 'investigated') && (
                      <button
                        onClick={() => updateStatus(c.id, 'resolved')}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)',
                          color: '#34C759', fontFamily: 'inherit',
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
