/**
 * NewProjectDetail — Full detail page for a developer project.
 * Hero video/images, unit selector, payment calculator, site visit booking.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { fmtRp, STATUS_LABELS } from '@/services/newProjectService'
import IndooFooter from '@/components/ui/IndooFooter'

const glass = { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }

export default function NewProjectDetail({ open, onClose, project }) {
  const [activeImg, setActiveImg] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState(0)
  const [dpPct, setDpPct] = useState(20)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [visitName, setVisitName] = useState('')
  const [visitPhone, setVisitPhone] = useState('')
  const [visitSent, setVisitSent] = useState(false)

  if (!open || !project) return null

  const images = project.images?.length ? project.images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600']
  const units = project.units || []
  const unit = units[selectedUnit] || {}
  const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.pre_sale
  const soldPct = project.total_units > 0 ? Math.round((project.units_sold || 0) / project.total_units * 100) : 0

  // Payment calc
  const dp = unit.price ? Math.round(unit.price * dpPct / 100) : 0
  const loanAmount = unit.price ? unit.price - dp : 0
  const monthlyKpr = loanAmount > 0 ? Math.round(loanAmount * (8.5 / 100 / 12) * Math.pow(1 + 8.5 / 100 / 12, 240) / (Math.pow(1 + 8.5 / 100 / 12, 240) - 1)) : 0

  const handleVisitSubmit = () => {
    const msg = `Halo, saya ${visitName} ingin booking site visit untuk project ${project.project_name}. No HP: ${visitPhone}`
    window.open(`https://wa.me/${(project.contact_whatsapp || '').replace(/^0/, '62')}?text=${encodeURIComponent(msg)}`, '_blank')
    setVisitSent(true)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Hero */}
      <div style={{ height: '38%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {project.video_url ? (
          <video src={project.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
        ) : (
          <img src={images[activeImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.9))' }} />

        {/* Back */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 14, right: 14, padding: '5px 14px', borderRadius: 10, background: `${statusInfo.color}20`, border: `1.5px solid ${statusInfo.color}50`, fontSize: 12, fontWeight: 800, color: statusInfo.color }}>{statusInfo.label}</div>

        {/* Thumbs */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 60, left: 14, display: 'flex', gap: 6, zIndex: 5 }}>
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: activeImg === i ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: 0, opacity: activeImg === i ? 1 : 0.6 }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}

        {/* Title on hero */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{project.project_name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>by {project.developer_name} · {project.location}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 100px' }}>

        {/* Price + Progress */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Starting from</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(project.min_price)}</div>
          </div>
          <div style={{ ...glass, flex: 1, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Completion</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#60A5FA' }}>📅 {project.completion_date}</div>
          </div>
        </div>

        {/* Units sold progress */}
        <div style={{ ...glass, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Units Sold</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F' }}>{project.units_sold || 0} / {project.total_units}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${soldPct}%`, borderRadius: 3, background: soldPct > 80 ? '#EF4444' : '#8DC63F', transition: 'width 0.5s' }} />
          </div>
          {soldPct > 70 && <div style={{ marginTop: 4, fontSize: 11, color: '#EF4444', fontWeight: 700 }}>🔥 Almost sold out!</div>}
        </div>

        {/* Description */}
        {project.description && (
          <div style={{ ...glass, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{project.description}</div>
          </div>
        )}

        {/* Unit Selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>🏠 Unit Types</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10, scrollbarWidth: 'none' }}>
            {units.map((u, i) => (
              <button key={i} onClick={() => setSelectedUnit(i)} style={{
                padding: '8px 14px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                background: selectedUnit === i ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.04)',
                border: selectedUnit === i ? '1.5px solid rgba(250,204,21,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: selectedUnit === i ? '#FACC15' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700,
              }}>{u.type}</button>
            ))}
          </div>
          {unit.price && (
            <div style={{ ...glass, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{unit.type}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{unit.bedrooms}BR · {unit.bathrooms}BA · {unit.area_sqm}m²</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FACC15' }}>{fmtRp(unit.price)}</div>
                  {unit.available_count !== undefined && <div style={{ fontSize: 11, color: unit.available_count <= 3 ? '#EF4444' : '#8DC63F', fontWeight: 700 }}>{unit.available_count} units left</div>}
                </div>
              </div>
              {/* Price per m² */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Price/m²: {fmtRp(Math.round(unit.price / (unit.area_sqm || 1)))}</div>
            </div>
          )}
        </div>

        {/* Payment Calculator */}
        {unit.price > 0 && (
          <div style={{ ...glass, padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>💳 Payment Estimate</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Down Payment</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{dpPct}%</span>
            </div>
            <input type="range" min={10} max={50} step={5} value={dpPct} onChange={e => setDpPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#8DC63F', height: 6, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>DP ({dpPct}%)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{fmtRp(dp)}</div>
              </div>
              <div style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>KPR/mo (20yr)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FACC15' }}>{fmtRp(monthlyKpr)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Schedule */}
        {project.payment_schedule && (
          <div style={{ ...glass, padding: '14px 16px', marginBottom: 14, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', marginBottom: 6 }}>💰 Payment Schedule</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{project.payment_schedule}</div>
          </div>
        )}

        {/* Amenities */}
        {project.amenities?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>✨ Amenities</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {project.amenities.map(a => (
                <span key={a} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Brochure + Floor Plan */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => project.brochure_url ? window.open(project.brochure_url, '_blank') : alert('Brochure not available yet')} style={{
            flex: 1, padding: '13px 0', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
            color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>📄 Brochure</button>
          <button onClick={() => project.floor_plans?.length ? window.open(project.floor_plans[0], '_blank') : alert('Floor plan not available yet')} style={{
            flex: 1, padding: '13px 0', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)',
            color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>📐 Floor Plan</button>
        </div>

        {/* Developer info */}
        <div style={{ ...glass, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8 }}>🏢 Developer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏗️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{project.developer_name}</div>
              {project.website && <div style={{ fontSize: 12, color: '#60A5FA' }}>{project.website}</div>}
            </div>
            {project.verified && <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', fontSize: 11, fontWeight: 800, color: '#60A5FA' }}>✓ Verified</div>}
          </div>
        </div>

        {/* Book Site Visit */}
        {!showVisitForm ? (
          <button onClick={() => setShowVisitForm(true)} style={{
            width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
            color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}>📍 Book Site Visit</button>
        ) : visitSent ? (
          <div style={{ ...glass, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>Visit request sent via WhatsApp!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Developer will contact you to confirm</div>
          </div>
        ) : (
          <div style={{ ...glass, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>📍 Book Site Visit</div>
            <input value={visitName} onChange={e => setVisitName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
            <input value={visitPhone} onChange={e => setVisitPhone(e.target.value)} placeholder="WhatsApp number" type="tel" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <button onClick={handleVisitSubmit} disabled={!visitName.trim() || !visitPhone.trim()} style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: visitName.trim() && visitPhone.trim() ? 'linear-gradient(135deg, #8DC63F, #6BA52A)' : 'rgba(255,255,255,0.06)',
              color: visitName.trim() && visitPhone.trim() ? '#000' : 'rgba(255,255,255,0.2)',
              fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            }}>Send via WhatsApp</button>
          </div>
        )}

        {/* Contact row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {project.contact_whatsapp && (
            <a href={`https://wa.me/${project.contact_whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '12px 0', borderRadius: 14, textDecoration: 'none',
              background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)',
              color: '#25D366', fontSize: 13, fontWeight: 800, textAlign: 'center',
            }}>💬 WhatsApp</a>
          )}
          {project.instagram && (
            <a href={`https://instagram.com/${project.instagram}`} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, padding: '12px 0', borderRadius: 14, textDecoration: 'none',
              background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.25)',
              color: '#E1306C', fontSize: 13, fontWeight: 800, textAlign: 'center',
            }}>📸 Instagram</a>
          )}
        </div>
      </div>

      <IndooFooter label="Project" onBack={onClose} onHome={onClose} />
    </div>,
    document.body
  )
}
