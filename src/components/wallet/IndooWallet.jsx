/**
 * IndooWallet — universal wallet UI for all services
 * Shows balance, commission owed, warning level, top-up, transaction history
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getWalletSummary, topUpWallet, getTransactions, fmtIDR, COMMISSION_RATE,
} from '@/services/walletService'

export default function IndooWallet({ open, onClose, userId = 'default' }) {
  const [summary, setSummary] = useState(() => getWalletSummary(userId))
  const [transactions, setTransactions] = useState(() => getTransactions(userId))
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpProof, setTopUpProof] = useState(null)
  const [tab, setTab] = useState('wallet') // wallet | history

  if (!open) return null

  const refresh = () => {
    setSummary(getWalletSummary(userId))
    setTransactions(getTransactions(userId))
  }

  const handleTopUp = () => {
    const amount = Number(topUpAmount.replace(/\./g, ''))
    if (!amount || !topUpProof) return
    topUpWallet(userId, amount)
    setShowTopUp(false)
    setTopUpAmount('')
    setTopUpProof(null)
    refresh()
  }

  const warnColor = { green: '#8DC63F', yellow: '#FFD700', orange: '#F59E0B', red: '#EF4444' }[summary.warning.level]

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: '#0d0d0f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💰</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Indoo Wallet</span>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Balance card */}
      <div style={{ margin: '16px', padding: '20px', background: 'rgba(141,198,63,0.06)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 4 }}>Available Balance</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#8DC63F' }}>{fmtIDR(summary.balance)}</div>

        {/* Commission owed */}
        {summary.commissionOwed > 0 && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: `${warnColor}15`, border: `1px solid ${warnColor}33`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: warnColor }}>{summary.warning.message}</span>
          </div>
        )}

        {/* Free orders left */}
        {summary.freeOrdersLeft > 0 && (
          <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(141,198,63,0.08)', borderRadius: 8, display: 'inline-block' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>🎁 {summary.freeOrdersLeft} free order{summary.freeOrdersLeft > 1 ? 's' : ''} remaining</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>TOTAL EARNED</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{fmtIDR(summary.totalEarned)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>COMMISSION PAID</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{fmtIDR(summary.totalCommissionPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>ORDERS</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{summary.totalOrders}</div>
          </div>
        </div>
      </div>

      {/* Top Up button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button onClick={() => setShowTopUp(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#FFD700', border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>
          + Top Up Wallet
        </button>
      </div>

      {/* Commission rate info */}
      <div style={{ margin: '0 16px 12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>COMMISSION RATE — ALL SERVICES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Marketplace', 'Rentals', 'Bike Ride', 'Car Ride', 'Food', 'Dating'].map(s => (
            <span key={s} style={{ padding: '4px 8px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.12)', borderRadius: 6, fontSize: 9, fontWeight: 700, color: '#8DC63F' }}>{s} · 10%</span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          Credit limit: {fmtIDR(summary.debtLimit)} · Increases with order history
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setTab('wallet')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: tab === 'wallet' ? '2px solid #8DC63F' : '2px solid transparent', color: tab === 'wallet' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Wallet</button>
        <button onClick={() => setTab('history')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: tab === 'history' ? '2px solid #8DC63F' : '2px solid transparent', color: tab === 'history' ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>History</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {tab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Debt meter */}
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Commission Balance</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: warnColor }}>{fmtIDR(summary.commissionOwed)} / {fmtIDR(summary.debtLimit)}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (summary.commissionOwed / summary.debtLimit) * 100)}%`, background: warnColor, borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              {summary.warning.paused && (
                <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: '#EF4444' }}>⚠ New orders paused — top up wallet to clear debt and continue</div>
              )}
            </div>

            {/* How it works */}
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 10 }}>How it Works</div>
              {[
                { icon: '🎁', text: 'First 3 orders are FREE — no commission' },
                { icon: '💰', text: '10% commission per order after free period' },
                { icon: '⚡', text: 'Auto-deducts from wallet if balance available' },
                { icon: '📊', text: 'No balance? Commission added to debt' },
                { icon: '⚠️', text: `Debt limit: ${fmtIDR(summary.debtLimit)} — orders pause at limit` },
                { icon: '📈', text: 'More orders = higher credit limit' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: 30, display: 'block', marginBottom: 10 }}>📋</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No transactions yet</span>
              </div>
            ) : transactions.map(tx => (
              <div key={tx.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {tx.type === 'top_up' ? '+ Top Up' : tx.type === 'free_order' ? '🎁 Free Order' : tx.type === 'commission_paid' ? '✓ Commission Paid' : '⏳ Commission Owed'}
                    </span>
                    {tx.service && <span style={{ fontSize: 9, color: 'rgba(141,198,63,0.5)', marginLeft: 6 }}>{tx.service}</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: tx.type === 'top_up' ? '#8DC63F' : tx.type === 'free_order' ? '#8DC63F' : tx.commission ? '#EF4444' : '#fff' }}>
                    {tx.type === 'top_up' ? `+${fmtIDR(tx.amount)}` : tx.commission ? `-${fmtIDR(tx.commission)}` : fmtIDR(tx.amount)}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>{tx.note} · {new Date(tx.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Up Popup */}
      {showTopUp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#111', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Top Up Wallet</span>
              <button onClick={() => setShowTopUp(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '16px' }}>
              {/* Quick amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {['25.000', '50.000', '100.000'].map(amt => (
                  <button key={amt} onClick={() => setTopUpAmount(amt)} style={{ padding: '10px', borderRadius: 10, background: topUpAmount === amt ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: topUpAmount === amt ? 'none' : '1px solid rgba(255,255,255,0.08)', color: topUpAmount === amt ? '#000' : '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Rp {amt}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                <input value={topUpAmount} onChange={e => setTopUpAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Custom amount" style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} inputMode="decimal" />
              </div>

              {/* Payment methods */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Pay via:</div>
                {[
                  { method: 'Bank BCA', detail: '1234 5678 90 · Indoo' },
                  { method: 'GoPay / OVO / DANA', detail: '0812-3456-7890' },
                  { method: 'QRIS', detail: 'Scan QR code' },
                  { method: 'Indomaret / Alfamart', detail: 'Show code at counter' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{p.method}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.detail}</span>
                  </div>
                ))}
              </div>

              {/* Upload proof */}
              {topUpProof ? (
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <img src={topUpProof} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }} />
                  <button onClick={() => setTopUpProof(null)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = e => { const f = e.target.files?.[0]; if (f) setTopUpProof(URL.createObjectURL(f)) }; inp.click() }} style={{ width: '100%', padding: '16px', borderRadius: 12, border: '2px dashed rgba(141,198,63,0.15)', background: 'rgba(141,198,63,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Upload Payment Proof</span>
                </button>
              )}

              <button onClick={handleTopUp} disabled={!topUpAmount || !topUpProof} style={{ width: '100%', padding: '14px', borderRadius: 14, background: topUpAmount && topUpProof ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: topUpAmount && topUpProof ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 800, cursor: topUpAmount && topUpProof ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                Confirm Top Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
