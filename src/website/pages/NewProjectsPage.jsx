/**
 * NewProjectsPage — Browse new developer projects on desktop website.
 */
import { useState, useEffect } from 'react'
import { getNewProjects, fmtRp, STATUS_LABELS } from '@/services/newProjectService'
import { ScrollReveal } from '../hooks/useScrollReveal'

const glass = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

export default function NewProjectsPage({ onSelectProject, onBack }) {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => { getNewProjects().then(setProjects) }, [])

  let filtered = projects
  if (search.trim()) { const q = search.toLowerCase(); filtered = projects.filter(p => p.project_name?.toLowerCase().includes(q) || p.developer_name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)) }

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="ws-container">
        {/* Header */}
        <ScrollReveal>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>🏗️ <span style={{ color: '#FACC15' }}>New</span> Projects</h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{filtered.length} projects · Pre-sale & under construction</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 240 }} />
              {onBack && <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
            </div>
          </div>
        </ScrollReveal>

        {/* Projects Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {filtered.map((p, i) => {
            const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
            const soldPct = p.total_units > 0 ? Math.round((p.units_sold || 0) / p.total_units * 100) : 0
            return (
              <ScrollReveal key={p.id} delay={i * 0.06}>
                <div className="ws-card" onClick={() => onSelectProject?.(p)} style={{ ...glass, overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ height: 220, position: 'relative', overflow: 'hidden' }}>
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'} alt={p.project_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8))' }} />
                    <div style={{ position: 'absolute', top: 14, left: 14, padding: '5px 14px', borderRadius: 10, background: `${status.color}20`, border: `1.5px solid ${status.color}50`, fontSize: 12, fontWeight: 800, color: status.color }}>{status.label}</div>
                    <div style={{ position: 'absolute', top: 14, right: 14, padding: '5px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>📅 {p.completion_date}</div>
                    <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{p.project_name}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>by {p.developer_name} · {p.location}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Starting from</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#FACC15' }}>{fmtRp(p.min_price)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{p.units?.length || 0} unit types</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{p.units_sold || 0}/{p.total_units} sold</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${soldPct}%`, borderRadius: 3, background: soldPct > 80 ? '#EF4444' : '#8DC63F' }} />
                    </div>

                    {/* Amenities preview */}
                    {p.amenities?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.amenities.slice(0, 5).map(a => <span key={a} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.06)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{a}</span>)}
                        {p.amenities.length > 5 && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>+{p.amenities.length - 5}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>No projects found</div>}
      </div>
    </div>
  )
}
