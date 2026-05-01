/**
 * NewProjectsAdminTab — Approve/manage developer projects.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getNewProjects, fmtRp, STATUS_LABELS } from '@/services/newProjectService'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

export default function NewProjectsAdminTab() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getNewProjects().then(data => { setProjects(data); setLoading(false) }) }, [])

  async function updateProject(id, updates) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    if (supabase) { try { await supabase.from('new_projects').update(updates).eq('id', id) } catch {} }
  }

  async function verifyProject(id) { updateProject(id, { verified: true }) }
  async function unverifyProject(id) { updateProject(id, { verified: false }) }

  const verified = projects.filter(p => p.verified).length
  const totalUnits = projects.reduce((s, p) => s + (p.total_units || 0), 0)
  const totalSold = projects.reduce((s, p) => s + (p.units_sold || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL PROJECTS', value: projects.length, color: '#fff' },
          { label: 'VERIFIED', value: verified, color: '#8DC63F' },
          { label: 'TOTAL UNITS', value: totalUnits, color: '#FACC15' },
          { label: 'UNITS SOLD', value: totalSold, color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 120, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Project', 'Developer', 'City', 'Status', 'Units', 'Sold', 'Price From', 'Verified', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const status = STATUS_LABELS[p.status] || STATUS_LABELS.pre_sale
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.project_name}</td>
                  <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.developer_name}</td>
                  <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.city}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: `${status.color}15`, color: status.color }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.total_units}</td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#8DC63F' }}>{p.units_sold || 0}</td>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#FACC15' }}>{fmtRp(p.min_price)}</td>
                  <td style={{ padding: '12px' }}>
                    {p.verified ? <span style={{ color: '#8DC63F', fontWeight: 800, fontSize: 12 }}>✓ Yes</span> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No</span>}
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                    {!p.verified && <button onClick={() => verifyProject(p.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(141,198,63,0.12)', color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Verify</button>}
                    {p.verified && <button onClick={() => unverifyProject(p.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Unverify</button>}
                    {p.contact_whatsapp && <a href={`https://wa.me/${p.contact_whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(37,211,102,0.12)', color: '#25D366', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>WA</a>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {projects.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No projects</div>}
      </div>
    </div>
  )
}
