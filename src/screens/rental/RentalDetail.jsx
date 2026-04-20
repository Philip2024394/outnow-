import { useState } from 'react'
import { getConditionLabel } from '@/services/rentalService'
import { saveItem, isItemSaved } from '../SavedItemsScreen'

function PageBadge({ num, label }) {
  return (
    <div style={{ position: 'fixed', top: 6, left: 6, zIndex: 99990, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>{num}</div>
      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

export { PageBadge }

export default function RentalDetail({ listing, onClose, onChat, onBook, onReview }) {
  const [saved, setSaved] = useState(() => isItemSaved(listing?.id))
  if (!listing) return null

  const fmtK = n => !n ? '\u2014' : n >= 1000000 ? (n/1000000).toFixed(1).replace('.0','') + 'jt' : n >= 1000 ? Math.round(n/1000) + 'k' : n

  const handleSave = () => {
    if (saved) return
    saveItem({ id: listing.id, title: listing.title, city: listing.city, price: listing.price_day || listing.buy_now, image: listing.images?.[0], category: listing.category })
    setSaved(true)
  }

  const helmetCount = listing.extra_fields?.helmet_count || (listing.features?.some(f => /helm/i.test(f)) ? 1 : 0)
  const hasRaincoat = listing.features?.some(f => /rain|jas hujan/i.test(f))
  const hasDropOff = listing.extra_fields?.delivery_available || listing.features?.some(f => /deliver|drop|antar/i.test(f))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      <PageBadge num="8b" label="Product Detail" />

      {/* Full-bleed background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img src={listing.images?.[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', pointerEvents: 'none' }} />
      </div>

      {/* Floating top buttons */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={handleSave} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#EF4444' : 'none'} stroke={saved ? '#EF4444' : '#fff'} strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      {/* Floating badges on image */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {listing.rating && <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', fontSize: 12, fontWeight: 800, color: '#FFD700' }}>{'\u2605'} {listing.rating}{listing.review_count ? <span style={{ color: 'rgba(255,255,255,0.4)' }}> ({listing.review_count})</span> : ''}</span>}
          {listing.extra_fields?.transmission && <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{listing.extra_fields.transmission === 'matic' ? 'Automatic' : listing.extra_fields.transmission}</span>}
          <span style={{ padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', fontSize: 12, fontWeight: 800, color: '#8DC63F' }}>{getConditionLabel(listing.condition)}</span>
        </div>
      </div>

      {/* Glass info panel */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1.5px solid rgba(141,198,63,0.1)',
        borderRadius: '24px 24px 0 0',
        padding: '20px 16px 16px',
        maxHeight: '55%', overflowY: 'auto',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)', pointerEvents: 'none' }} />
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {listing.extra_fields?.brand ? `${listing.extra_fields.brand} ${listing.extra_fields.model || ''}`.trim() : listing.title}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 3 }}>
              {listing.extra_fields?.cc
                ? [listing.extra_fields.cc && `${listing.extra_fields.cc}cc`, listing.extra_fields.year, listing.extra_fields.transmission].filter(Boolean).join(' \u00b7 ')
                : listing.category
              }
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#8DC63F', fontFamily: 'monospace' }}>{fmtK(listing.price_day)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/day</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{listing.city || 'Indonesia'}</span>
        </div>

        {(helmetCount > 0 || hasRaincoat || hasDropOff) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: '10px 12px', background: 'rgba(141,198,63,0.04)', borderRadius: 12, border: '1px solid rgba(141,198,63,0.1)' }}>
            {helmetCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssss-removebg-preview.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />x{helmetCount}</span>}
            {hasRaincoat && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssdd-removebg-preview.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />x1</span>}
            {hasDropOff && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddsdssssddss-removebg-preview.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />Drop off</span>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'DAY', price: listing.price_day },
            { label: 'WEEK', price: listing.price_week },
            { label: 'MONTH', price: listing.price_month },
          ].map((p, i) => (
            <div key={i} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: 3 }}>{p.label}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)' }}>{p.price ? fmtK(p.price) : '\u2014'}</div>
            </div>
          ))}
        </div>

        {listing.description && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 14 }}>
            {listing.description}
          </div>
        )}

        {listing.features?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {listing.features.map((f, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{f}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <button onClick={() => onChat?.(listing)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Chat
          </button>
          <button onClick={() => onBook?.(listing)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 20px rgba(141,198,63,0.3)' }}>
            {'\ud83d\udd11'} Book Now
          </button>
        </div>

        <button onClick={() => onReview?.(listing)} style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)', color: '#FFD700', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {'\u2b50'} Reviews ({listing.review_count || 0})
        </button>
      </div>
    </div>
  )
}
