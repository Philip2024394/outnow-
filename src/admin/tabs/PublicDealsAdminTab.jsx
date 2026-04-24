/**
 * PublicDealsAdminTab — Admin approval queue for user-posted deals
 */
import { useState, useEffect } from 'react'
import { getPublicDeals, approvePublicDeal, rejectPublicDeal } from '@/domains/dealhunt/pages/PostDealPublic'

const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')

export default function PublicDealsAdminTab() {
  const [deals, setDeals] = useState([])
  const [filter, setFilter] = useState('pending')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    setDeals(getPublicDeals())
  }, [])

  const reload = () => setDeals(getPublicDeals())

  const handleApprove = (id) => {
    approvePublicDeal(id)
    reload()
  }

  const handleReject = () => {
    if (!rejectId) return
    rejectPublicDeal(rejectId, rejectReason.trim() || 'Does not meet posting guidelines')
    setRejectId(null)
    setRejectReason('')
    reload()
  }

  const filtered = deals.filter(d => d.status === filter)

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Deal Hunt — User Posts</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>{deals.filter(d => d.status === 'pending').length} pending approval</p>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'active', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 10,
            backgroundColor: filter === f ? (f === 'pending' ? '#FACC15' : f === 'active' ? '#8DC63F' : '#EF4444') : 'rgba(255,255,255,0.06)',
            border: 'none', color: filter === f ? '#000' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize',
          }}>
            {f} ({deals.filter(d => d.status === f).length})
          </button>
        ))}
      </div>

      {/* Deal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No {filter} deals</div>
        )}
        {filtered.map(deal => (
          <div key={deal.id} style={{
            padding: 16, borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Images */}
            {deal.images?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
                {deal.images.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                ))}
              </div>
            )}

            {/* Info */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>{deal.title}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: 2 }}>{deal.category} · {deal.quantity} available</span>
              {deal.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', lineHeight: 1.4 }}>{deal.description}</p>}
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{fmtRp(deal.original_price)}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{fmtRp(deal.deal_price)}</span>
              <span style={{ padding: '3px 8px', borderRadius: 6, backgroundColor: 'rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 900, color: '#8DC63F' }}>{deal.discount_pct}% OFF</span>
            </div>

            {/* Seller info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📱 {deal.whatsapp}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {deal.address}</span>
              {deal.lat && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>GPS: {deal.lat?.toFixed(4)}, {deal.lng?.toFixed(4)}</span>}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Posted: {new Date(deal.created_at).toLocaleString()}</span>
            </div>

            {/* Actions */}
            {deal.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleApprove(deal.id)} style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  backgroundColor: '#8DC63F', border: 'none', color: '#000',
                  fontSize: 14, fontWeight: 900, cursor: 'pointer',
                }}>
                  Approve
                </button>
                <button onClick={() => { setRejectId(deal.id); setRejectReason('') }} style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#EF4444', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                }}>
                  Reject
                </button>
              </div>
            )}
            {deal.status === 'rejected' && deal.reject_reason && (
              <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>Rejected: {deal.reject_reason}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div onClick={() => setRejectId(null)} style={{ position: 'fixed', inset: 0, zIndex: 10003, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#1a1a1e', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Reject Deal</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." style={{
              width: '100%', height: 80, padding: 12, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => setRejectId(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#EF4444', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
