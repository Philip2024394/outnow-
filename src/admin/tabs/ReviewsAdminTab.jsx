/**
 * ReviewsAdminTab — Moderate all reviews across rental + places.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

const DEMO_REVIEWS = [
  { id: 'r1', listing_ref: 'ph1', reviewer_name: 'Budi Santoso', rating: 5, comment: 'Rumah sangat bagus, lokasi strategis dekat kampus UGM.', created_at: '2026-04-28', type: 'rental' },
  { id: 'r2', listing_ref: 'pv1', reviewer_name: 'Sarah Chen', rating: 4, comment: 'Beautiful villa with great views. Pool was amazing.', created_at: '2026-04-25', type: 'rental' },
  { id: 'r3', listing_ref: 'place1', reviewer_name: 'Rina Kusuma', rating: 5, comment: 'Best restaurant in Yogyakarta. Must visit!', created_at: '2026-04-20', type: 'places' },
  { id: 'r4', listing_ref: 'pk1', reviewer_name: 'Dewi Anggraini', rating: 3, comment: 'Kos OK tapi AC sering rusak.', created_at: '2026-04-18', type: 'rental' },
]

export default function ReviewsAdminTab() {
  const [reviews, setReviews] = useState(DEMO_REVIEWS)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (supabase) {
        try {
          const [r1, r2] = await Promise.all([
            supabase.from('rental_reviews').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('places_reviews').select('*').order('created_at', { ascending: false }).limit(50),
          ])
          const all = [
            ...(r1.data || []).map(r => ({ ...r, type: 'rental' })),
            ...(r2.data || []).map(r => ({ ...r, type: 'places' })),
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          if (all.length) { setReviews(all); setLoading(false); return }
        } catch {}
      }
      setReviews(DEMO_REVIEWS)
      setLoading(false)
    }
    load()
  }, [])

  async function deleteReview(id, type) {
    setReviews(prev => prev.filter(r => r.id !== id))
    if (supabase) {
      const table = type === 'places' ? 'places_reviews' : 'rental_reviews'
      try { await supabase.from(table).delete().eq('id', id) } catch {}
    }
  }

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.type === filter)
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL REVIEWS', value: reviews.length, color: '#fff' },
          { label: 'AVG RATING', value: `⭐ ${avgRating}`, color: '#FACC15' },
          { label: 'RENTAL', value: reviews.filter(r => r.type === 'rental').length, color: '#8DC63F' },
          { label: 'PLACES', value: reviews.filter(r => r.type === 'places').length, color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 120, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'rental', 'places'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
            background: filter === f ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            border: filter === f ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? '#8DC63F' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{r.reviewer_name}</span>
                  <span style={{ fontSize: 12, color: '#FACC15' }}>{'⭐'.repeat(r.rating)}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: r.type === 'places' ? 'rgba(96,165,250,0.12)' : 'rgba(141,198,63,0.12)', fontSize: 10, fontWeight: 800, color: r.type === 'places' ? '#60A5FA' : '#8DC63F' }}>{r.type}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 4 }}>{r.comment}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{r.created_at?.split('T')[0]} · Ref: {r.listing_ref}</div>
              </div>
              <button onClick={() => deleteReview(r.id, r.type)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}>Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No reviews</div>}
      </div>
    </div>
  )
}
