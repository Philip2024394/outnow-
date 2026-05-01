/**
 * PropertyCard — Flip card for property listings (House, Villa, Kos, Factory).
 * Front: Image carousel + price + specs + owner
 * Back: Full details + certificate + facilities + contact
 * No payment buttons — owners transfer commission to admin directly.
 */
import { useState } from 'react'
import {
  SPEC_CONFIG, CERTIFICATE_TYPES, PROPERTY_CATEGORIES,
  PROXIMITY_TAGS, QUICK_LABELS, fmtPropertyPrice, getCertificateInfo, getCategoryConfig,
} from '@/services/propertyListingService'

export default function PropertyCard({ property, onSave, isSaved }) {
  const [flipped, setFlipped] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const p = property
  const cat = getCategoryConfig(p.category)
  const cert = getCertificateInfo(p.certificate)
  const price = fmtPropertyPrice(p.price, p.listing_type, p.price_period)
  const imgs = p.images?.length ? p.images : ['']

  return (
    <div style={{ marginBottom: 14 }}>
      {!flipped ? (
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(141,198,63,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Green top glow */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.25), transparent)', zIndex: 2, pointerEvents: 'none' }} />

          {/* Image carousel */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0a0a', overflow: 'hidden', borderRadius: '18px 18px 0 0' }}>
            {imgs[imgIdx] ? (
              <img src={imgs[imgIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'rgba(255,255,255,0.08)' }}>{cat.icon}</div>
            )}
            {/* Bottom gradient */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }} />

            {/* Image dots */}
            {imgs.length > 1 && (
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 3 }}>
                {imgs.map((_, i) => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i) }} style={{
                    width: imgIdx === i ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                    background: imgIdx === i ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }} />
                ))}
              </div>
            )}

            {/* Badges on image */}
            <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 3 }}>
              {/* Rent/Sale badge */}
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 900, color: '#000', background: p.listing_type === 'sale' ? '#FACC15' : '#8DC63F' }}>
                {p.listing_type === 'sale' ? 'DIJUAL' : 'DISEWA'}
              </span>
              {/* Certificate badge */}
              <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#fff', background: cert.color + '30', border: `1px solid ${cert.color}50` }}>
                {cert.label} {cert.type === 'freehold' ? '· Freehold' : cert.type === 'leasehold' && p.certificate_years ? `· ${p.certificate_years}yr` : ''}
              </span>
              {/* Foreigner eligible */}
              {(cert.foreignEligible || p.foreigner_eligible) && (
                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#60A5FA', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)' }}>
                  🌍 Foreigner Eligible
                </span>
              )}
              {/* Verified */}
              {p.owner?.verified && (
                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, color: '#8DC63F', background: 'rgba(141,198,63,0.15)', border: '1px solid rgba(141,198,63,0.3)' }}>
                  ✓ Terverifikasi
                </span>
              )}
            </div>

            {/* Save button */}
            <div onClick={(e) => { e.stopPropagation(); onSave?.(p.id) }} style={{
              position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? '#EF4444' : 'none'} stroke={isSaved ? '#EF4444' : '#fff'} strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </div>

            {/* Category icon */}
            <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 20, zIndex: 3 }}>{cat.icon}</span>
          </div>

          {/* Info section */}
          <div style={{ padding: '12px 14px 14px' }}>
            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#FACC15', fontFamily: 'monospace' }}>{price.main}</span>
              {price.sub && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{price.sub}</span>}
              {p.negotiable && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(250,204,21,0.1)', color: '#FACC15', fontWeight: 700, marginLeft: 4 }}>Nego</span>}
            </div>

            {/* Title */}
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>

            {/* Location */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
              {p.city}
            </div>

            {/* Primary specs */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {cat.primarySpecs.map(key => {
                const val = p.specs?.[key]
                if (val == null || val === false) return null
                const cfg = SPEC_CONFIG[key]
                if (!cfg) return null
                return (
                  <span key={key} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {cfg.icon} {cfg.boolean ? cfg.label : `${val}${cfg.suffix}`}
                  </span>
                )
              })}
            </div>

            {/* Owner strip + flip button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <img src={p.owner?.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(141,198,63,0.3)' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.owner?.name}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{p.owner?.type === 'owner' ? 'Pemilik' : 'Agen'}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFlipped(true) }} style={{
                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(141,198,63,0.3)',
                background: 'rgba(141,198,63,0.1)', color: '#8DC63F', fontSize: 11, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Detail ›</button>
            </div>
          </div>
        </div>

      ) : (
        /* ── BACK (Detail view) ── */
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(141,198,63,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          animation: 'propCardFlip 0.3s ease',
        }}>
          <style>{`@keyframes propCardFlip { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.25), transparent)' }} />

          {/* Back header */}
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); setFlipped(false) }} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.city} · {cat.label}</div>
            </div>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{price.main}</span>
          </div>

          {/* Scrollable back content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 14px' }}>

            {/* Certificate section */}
            <div style={{ padding: '8px 10px', borderRadius: 10, background: `${cert.color}10`, border: `1px solid ${cert.color}25`, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: cert.color }}>{cert.label} — {cert.full}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {cert.type === 'freehold' ? 'Hak milik penuh (perpetual)' :
                 cert.type === 'leasehold' ? `Leasehold${p.certificate_years ? ` · ${p.certificate_years} tahun tersisa` : ''}` :
                 'Dokumen belum terdaftar — verifikasi diperlukan'}
              </div>
              {cert.foreignEligible && <div style={{ fontSize: 9, color: '#60A5FA', marginTop: 3 }}>🌍 Eligible for foreign ownership</div>}
              {cert.type === 'warning' && <div style={{ fontSize: 9, color: '#EF4444', marginTop: 3 }}>⚠️ Girik harus dikonversi ke SHM sebelum Feb 2026</div>}
              {p.building_permit && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Izin Bangunan: {p.building_permit}</div>}
            </div>

            {/* All specs grid */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.6)', marginBottom: 6 }}>SPESIFIKASI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {cat.specs.map(key => {
                const val = p.specs?.[key]
                if (val == null) return null
                const cfg = SPEC_CONFIG[key]
                if (!cfg) return null
                return (
                  <div key={key} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{cfg.label || key}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{cfg.boolean ? (val ? 'Ya' : 'Tidak') : `${val}${cfg.suffix}`}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Facilities */}
            {p.facilities?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.6)', marginBottom: 6 }}>FASILITAS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {p.facilities.map(f => (
                    <span key={f} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>✓ {f}</span>
                  ))}
                </div>
              </>
            )}

            {/* Kos rules */}
            {p.rules && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.6)', marginBottom: 6 }}>PERATURAN</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {p.rules.overnight_guests === false && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>✕ Tamu menginap</span>}
                  {p.rules.pets === false && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>✕ Hewan peliharaan</span>}
                  {p.rules.smoking === false && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>✕ Merokok</span>}
                  {p.rules.curfew && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(250,204,21,0.1)', color: '#FACC15', fontWeight: 600 }}>🕐 Jam malam {p.rules.curfew}</span>}
                </div>
              </>
            )}

            {/* Description */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(141,198,63,0.6)', marginBottom: 4 }}>DESKRIPSI</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{p.description}</div>

            {/* Proximity tags */}
            {p.proximity?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {p.proximity.map(id => {
                  const tag = PROXIMITY_TAGS.find(t => t.id === id)
                  if (!tag) return null
                  return <span key={id} style={{ fontSize: 9, padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>{tag.icon} {tag.label}</span>
                })}
              </div>
            )}

            {/* Owner contact */}
            <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <img src={p.owner?.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(141,198,63,0.3)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.owner?.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.owner?.type === 'owner' ? 'Pemilik Langsung' : 'Agen'} · Bergabung {p.owner?.joined}</div>
                </div>
                {p.owner?.verified && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(141,198,63,0.1)', color: '#8DC63F', fontWeight: 700 }}>✓ Verified</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href={p.owner?.phone ? `https://wa.me/${p.owner.phone.replace(/\D/g, '')}` : '#'} target="_blank" rel="noopener noreferrer" style={{
                  flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)',
                  color: '#25D366', fontSize: 12, fontWeight: 800, textAlign: 'center', textDecoration: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                  WhatsApp
                </a>
                <a href={`tel:${p.owner?.phone}`} style={{
                  flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.25)',
                  color: '#8DC63F', fontSize: 12, fontWeight: 800, textAlign: 'center', textDecoration: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Telepon
                </a>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>👁️ {p.views} views</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>❤️ {p.saves} saves</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Updated {p.updated_at}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
