/**
 * WalletAdminTab — Admin panel for managing all user wallets
 * View balances, add/subtract credits, clear debt, block/unblock
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { adminAdjustWallet, fmtIDR } from '@/services/walletService'

const DEMO_WALLETS = [
  { id: 'w1', user_id: 'u1', username: 'Budi Santoso', balance: 125000, commission_owed: 15000, debt_limit: 50000, total_earned: 3500000, total_orders: 42, free_orders_left: 0, status: 'active' },
  { id: 'w2', user_id: 'u2', username: 'Siti Rahayu', balance: 0, commission_owed: 48000, debt_limit: 50000, total_earned: 1200000, total_orders: 15, free_orders_left: 0, status: 'active' },
  { id: 'w3', user_id: 'u3', username: 'Made Wirawan', balance: 50000, commission_owed: 0, debt_limit: 75000, total_earned: 8500000, total_orders: 87, free_orders_left: 0, status: 'active' },
  { id: 'w4', user_id: 'u4', username: 'Ketut Darma', balance: 0, commission_owed: 52000, debt_limit: 50000, total_earned: 950000, total_orders: 12, free_orders_left: 1, status: 'paused' },
  { id: 'w5', user_id: 'u5', username: 'Nyoman Ari', balance: 200000, commission_owed: 0, debt_limit: 100000, total_earned: 15000000, total_orders: 156, free_orders_left: 0, status: 'active' },
]

export default function WalletAdminTab() {
  const [wallets, setWallets] = useState(DEMO_WALLETS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, active, paused, blocked
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustType, setAdjustType] = useState('credit')

  // Load from Supabase
  useEffect(() => {
    if (!supabase) return
    const load = async () => {
      try {
        const { data } = await supabase.from('wallets').select('*').order('updated_at', { ascending: false })
        if (data?.length) setWallets(data)
      } catch {}
    }
    load()
  }, [])

  const filtered = wallets.filter(w => {
    if (filter !== 'all' && w.status !== filter) return false
    if (search && !(w.username || w.user_id || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAdjust = async () => {
    if (!selectedWallet || !adjustAmount) return
    const amount = Number(adjustAmount.replace(/\./g, ''))
    if (!amount && adjustType !== 'clear_debt' && adjustType !== 'block' && adjustType !== 'unblock') return

    await adminAdjustWallet('admin', selectedWallet.user_id, amount, adjustType, adjustNote)

    // Update local state
    setWallets(prev => prev.map(w => {
      if (w.id !== selectedWallet.id) return w
      if (adjustType === 'credit') return { ...w, balance: w.balance + amount }
      if (adjustType === 'debit') return { ...w, balance: Math.max(0, w.balance - amount) }
      if (adjustType === 'clear_debt') return { ...w, commission_owed: 0, status: 'active' }
      if (adjustType === 'block') return { ...w, status: 'blocked' }
      if (adjustType === 'unblock') return { ...w, status: 'active' }
      return w
    }))
    setSelectedWallet(null)
    setAdjustAmount('')
    setAdjustNote('')
  }

  const statusColor = { active: '#8DC63F', paused: '#FFD700', blocked: '#EF4444' }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>💰 Wallet Management</h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 14, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>TOTAL WALLETS</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F', marginTop: 4 }}>{wallets.length}</div>
        </div>
        <div style={{ padding: 14, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>PAUSED</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD700', marginTop: 4 }}>{wallets.filter(w => w.status === 'paused').length}</div>
        </div>
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>TOTAL OWED</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>{fmtIDR(wallets.reduce((s, w) => s + (w.commission_owed || 0), 0))}</div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user..." style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Wallet list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(w => (
          <div key={w.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{w.username || w.user_id}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: statusColor[w.status] || '#fff', marginLeft: 8, padding: '2px 6px', background: `${statusColor[w.status] || '#fff'}15`, borderRadius: 4 }}>{w.status?.toUpperCase()}</span>
              </div>
              <button onClick={() => setSelectedWallet(w)} style={{ padding: '6px 12px', background: '#FFD700', border: 'none', borderRadius: 8, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>Balance: </span><span style={{ fontWeight: 800, color: '#8DC63F' }}>{fmtIDR(w.balance)}</span></div>
              <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>Owed: </span><span style={{ fontWeight: 800, color: w.commission_owed > 0 ? '#EF4444' : 'rgba(255,255,255,0.2)' }}>{fmtIDR(w.commission_owed)}</span></div>
              <div><span style={{ color: 'rgba(255,255,255,0.3)' }}>Orders: </span><span style={{ fontWeight: 700, color: '#fff' }}>{w.total_orders}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit wallet popup */}
      {selectedWallet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#111', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Edit Wallet — {selectedWallet.username || selectedWallet.user_id}</span>
              <button onClick={() => setSelectedWallet(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '16px' }}>
              {/* Current state */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ padding: 10, background: 'rgba(141,198,63,0.06)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>BALANCE</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>{fmtIDR(selectedWallet.balance)}</div>
                </div>
                <div style={{ padding: 10, background: 'rgba(239,68,68,0.06)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>OWED</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{fmtIDR(selectedWallet.commission_owed)}</div>
                </div>
              </div>

              {/* Action type */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { id: 'credit', label: '+ Add Credit', color: '#8DC63F' },
                  { id: 'debit', label: '- Subtract', color: '#EF4444' },
                  { id: 'clear_debt', label: 'Clear Debt', color: '#FFD700' },
                  { id: 'block', label: 'Block', color: '#EF4444' },
                  { id: 'unblock', label: 'Unblock', color: '#8DC63F' },
                ].map(a => (
                  <button key={a.id} onClick={() => setAdjustType(a.id)} style={{ padding: '8px 12px', borderRadius: 8, background: adjustType === a.id ? a.color : 'rgba(255,255,255,0.04)', border: adjustType === a.id ? 'none' : '1px solid rgba(255,255,255,0.08)', color: adjustType === a.id ? '#000' : a.color, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Amount (not needed for block/unblock/clear_debt) */}
              {!['block', 'unblock', 'clear_debt'].includes(adjustType) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input value={adjustAmount} onChange={e => setAdjustAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Amount" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} inputMode="decimal" />
                </div>
              )}

              {/* Note */}
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Admin note (optional)" style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />

              <button onClick={handleAdjust} style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
