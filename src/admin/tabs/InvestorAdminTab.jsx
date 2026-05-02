/**
 * InvestorAdminTab — Admin tab for managing Global Agents and investor services.
 * Shows agent roster, certification controls, supervised transactions placeholder.
 */
import { useState } from 'react'
import { DEMO_GLOBAL_AGENTS, FOREIGN_OWNERSHIP_GUIDE } from '@/services/investorService'

const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }

export default function InvestorAdminTab() {
  const [agents, setAgents] = useState([...DEMO_GLOBAL_AGENTS])

  function toggleCertify(id) {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, certified: !a.certified } : a))
  }

  function removeAgent(id) {
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  const totalAgents = agents.length
  const certifiedCount = agents.filter(a => a.certified).length
  const totalDeals = agents.reduce((s, a) => s + (a.deals_closed || 0), 0)

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL AGENTS', value: totalAgents, color: '#fff' },
          { label: 'CERTIFIED', value: certifiedCount, color: '#8DC63F' },
          { label: 'TOTAL DEALS', value: totalDeals, color: '#FACC15' },
        ].map(s => (
          <div key={s.label} style={{ ...card, flex: 1, minWidth: 120, marginBottom: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Global Agents section */}
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Global Agents</div>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'City', 'Languages', 'Specializations', 'Rating', 'Deals Closed', 'Certified', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 800, color: '#fff' }}>{a.name}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a.city}</td>
                <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{a.languages?.join(', ') || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(a.specialization || []).map(s => (
                      <span key={s} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'rgba(141,198,63,0.10)', color: '#8DC63F' }}>{s}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#FACC15' }}>{a.rating}</td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.deals_closed}</td>
                <td style={{ padding: '12px' }}>
                  {a.certified
                    ? <span style={{ color: '#8DC63F', fontWeight: 800, fontSize: 12 }}>Certified</span>
                    : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No</span>
                  }
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleCertify(a.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      background: a.certified ? 'rgba(245,158,11,0.12)' : 'rgba(141,198,63,0.12)',
                      color: a.certified ? '#F59E0B' : '#8DC63F',
                    }}
                  >
                    {a.certified ? 'Uncertify' : 'Certify'}
                  </button>
                  <button
                    onClick={() => removeAgent(a.id)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {agents.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No agents</div>}
      </div>

      {/* Supervised Transactions — placeholder */}
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12, marginTop: 32 }}>Supervised Transactions</div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Supervised Transactions Dashboard</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Coming soon — escrow tracking, notaris scheduling, document verification</div>
        </div>
      </div>

      {/* Foreign Ownership Guide reference */}
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12, marginTop: 32 }}>Foreign Ownership Guide (Reference)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {FOREIGN_OWNERSHIP_GUIDE.map(g => (
          <div key={g.title} style={{ ...card, marginBottom: 0 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{g.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{g.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
