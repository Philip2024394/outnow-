/**
 * KprRatesTab — Admin tab for managing KPR bank interest rates.
 * Add/edit/delete banks, toggle active status, reorder.
 */
import { useState, useEffect } from 'react'
import { fetchAllKprRates, upsertKprRate, deleteKprRate, DEFAULT_BANKS } from '@/services/kprRatesService'

const EMOJI_OPTIONS = ['🏦', '🏛️', '🏢', '🏗️', '🏠', '🏤', '🏫', '💰', '💳', '🪙']

function calcMonthly(principal, annualRate, years) {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function fmtRp(n) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`
}

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: '20px 24px',
  marginBottom: 16,
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}

const btnGreen = {
  padding: '10px 20px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #8DC63F, #6BA52A)',
  color: '#000',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const btnOutline = {
  padding: '10px 20px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export default function KprRatesTab() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formRate, setFormRate] = useState('')
  const [formEmoji, setFormEmoji] = useState('🏦')
  const [formActive, setFormActive] = useState(true)
  const [formOrder, setFormOrder] = useState(0)

  // Preview price for comparison
  const previewPrice = 500_000_000 // Rp 500M
  const previewTerm = 20 // years

  useEffect(() => { loadRates() }, [])

  async function loadRates() {
    setLoading(true)
    const data = await fetchAllKprRates()
    setRates(data)
    setLoading(false)
  }

  function resetForm() {
    setFormName('')
    setFormRate('')
    setFormEmoji('🏦')
    setFormActive(true)
    setFormOrder(rates.length + 1)
    setEditId(null)
    setShowAdd(false)
  }

  function startEdit(bank) {
    setEditId(bank.id)
    setFormName(bank.bank_name)
    setFormRate(String(bank.rate))
    setFormEmoji(bank.emoji || '🏦')
    setFormActive(bank.is_active)
    setFormOrder(bank.sort_order || 0)
    setShowAdd(true)
  }

  function startAdd() {
    resetForm()
    setFormOrder(rates.length + 1)
    setShowAdd(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formRate) return
    setSaving(true)
    try {
      await upsertKprRate({
        id: editId || undefined,
        bank_name: formName.trim(),
        rate: parseFloat(formRate),
        emoji: formEmoji,
        is_active: formActive,
        sort_order: formOrder,
      })
      await loadRates()
      resetForm()
    } catch (e) {
      console.error('Save failed:', e)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this bank rate?')) return
    try {
      await deleteKprRate(id)
      await loadRates()
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  async function handleToggleActive(bank) {
    try {
      await upsertKprRate({ ...bank, is_active: !bank.is_active })
      await loadRates()
    } catch (e) {
      console.error('Toggle failed:', e)
    }
  }

  const activeCount = rates.filter(r => r.is_active).length

  return (
    <div style={{ padding: 0 }}>
      {/* Header Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>TOTAL BANKS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{rates.length}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>ACTIVE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#8DC63F' }}>{activeCount}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>RATE RANGE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FACC15' }}>
            {rates.length ? `${Math.min(...rates.map(r => r.rate))}% – ${Math.max(...rates.map(r => r.rate))}%` : '—'}
          </div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6 }}>PREVIEW (Rp 500M / 20yr)</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA' }}>
            {rates.length ? `${fmtRp(calcMonthly(400_000_000, Math.min(...rates.map(r => r.rate)), 20))}/mo` : '—'}
          </div>
        </div>
      </div>

      {/* Add Bank Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>🏦 Bank KPR Rates</h2>
        <button onClick={startAdd} style={btnGreen}>+ Add Bank</button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div style={{ ...card, border: '1.5px solid rgba(141,198,63,0.3)', background: 'rgba(141,198,63,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F', marginBottom: 16 }}>
            {editId ? '✏️ Edit Bank Rate' : '➕ New Bank Rate'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Bank Name</label>
              <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. BCA" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Interest Rate (%)</label>
              <input style={inputStyle} type="number" step="0.1" min="0" max="30" value={formRate} onChange={e => setFormRate(e.target.value)} placeholder="e.g. 7.5" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Icon</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setFormEmoji(e)} style={{
                    width: 38, height: 38, borderRadius: 10, fontSize: 18, cursor: 'pointer',
                    border: formEmoji === e ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
                    background: formEmoji === e ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 6, display: 'block' }}>Sort Order</label>
              <input style={inputStyle} type="number" min="0" value={formOrder} onChange={e => setFormOrder(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setFormActive(!formActive)} style={{
              padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              border: formActive ? '1.5px solid rgba(141,198,63,0.4)' : '1px solid rgba(255,255,255,0.1)',
              background: formActive ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.04)',
              color: formActive ? '#8DC63F' : 'rgba(255,255,255,0.4)',
            }}>
              {formActive ? '✓ Active' : '○ Inactive'}
            </button>
            {formRate && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Preview: {fmtRp(calcMonthly(400_000_000, parseFloat(formRate) || 0, 20))}/mo on Rp 500M (20% DP, 20yr)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving || !formName.trim() || !formRate} style={{
              ...btnGreen, opacity: (saving || !formName.trim() || !formRate) ? 0.5 : 1,
            }}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Bank'}
            </button>
            <button onClick={resetForm} style={btnOutline}>Cancel</button>
          </div>
        </div>
      )}

      {/* Bank Rates Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>Loading rates...</div>
      ) : (
        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Bank', 'Rate', 'Monthly (Rp 500M)', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map((bank, idx) => {
                const monthly = calcMonthly(previewPrice * 0.8, bank.rate, previewTerm)
                return (
                  <tr key={bank.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: bank.is_active ? 1 : 0.45 }}>
                    <td style={{ padding: '14px', fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{bank.sort_order || idx + 1}</td>
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{bank.emoji}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{bank.bank_name}</span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{bank.rate}%</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>p.a.</span>
                    </td>
                    <td style={{ padding: '14px', fontSize: 14, fontWeight: 700, color: '#60A5FA' }}>{fmtRp(monthly)}</td>
                    <td style={{ padding: '14px' }}>
                      <button onClick={() => handleToggleActive(bank)} style={{
                        padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none',
                        background: bank.is_active ? 'rgba(141,198,63,0.15)' : 'rgba(239,68,68,0.15)',
                        color: bank.is_active ? '#8DC63F' : '#EF4444',
                      }}>
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '14px', display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(bank)} style={{ ...btnOutline, padding: '6px 14px', fontSize: 12 }}>Edit</button>
                      <button onClick={() => handleDelete(bank.id)} style={{ ...btnOutline, padding: '6px 14px', fontSize: 12, borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rates.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)' }}>No bank rates configured. Click "Add Bank" to get started.</div>
          )}
        </div>
      )}

      {/* Info */}
      <div style={{ ...card, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA', marginBottom: 8 }}>ℹ️ How KPR Rates Work</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Rates set here appear in the KPR Calculator on property FOR SALE listings. Users see active banks in the "Bank Rate Comparison" section and can compare monthly payments.
          The calculator also has a manual interest rate slider (5%–15%) for custom calculations. Preview column shows monthly payment for Rp 500M property with 20% down payment over 20 years.
        </div>
      </div>
    </div>
  )
}
