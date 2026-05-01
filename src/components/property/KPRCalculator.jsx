/**
 * KPRCalculator — Mortgage/KPR calculator overlay for property FOR SALE listings.
 * Shows monthly payment, total interest, bank comparisons for Indonesian banks.
 *
 * Props: { open, onClose, propertyPrice }
 */
import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'

const LOAN_TERMS = [10, 15, 20, 25, 30]

const BANKS = [
  { name: 'BCA', rate: 7.5, emoji: '🏦' },
  { name: 'Mandiri', rate: 8.0, emoji: '🏛️' },
  { name: 'BNI', rate: 8.5, emoji: '🏢' },
]

function formatRupiah(num) {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`
  return `Rp ${num.toLocaleString('id-ID')}`
}

function formatRupiahFull(num) {
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`
}

function calcMonthly(principal, annualRate, years) {
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

export default function KPRCalculator({ open, onClose, propertyPrice = 500_000_000 }) {
  const [downPct, setDownPct] = useState(20)
  const [termIdx, setTermIdx] = useState(2) // default 20 years
  const [rate, setRate] = useState(8.5)
  const [toast, setToast] = useState(false)

  const term = LOAN_TERMS[termIdx]
  const downPayment = propertyPrice * (downPct / 100)
  const loanAmount = propertyPrice - downPayment

  const result = useMemo(() => {
    const monthly = calcMonthly(loanAmount, rate, term)
    const totalPayment = monthly * term * 12
    const totalInterest = totalPayment - loanAmount
    return { monthly, totalPayment, totalInterest }
  }, [loanAmount, rate, term])

  const bankResults = useMemo(() => {
    return BANKS.map((b) => {
      const monthly = calcMonthly(loanAmount, b.rate, term)
      const total = monthly * term * 12
      return { ...b, monthly, total }
    })
  }, [loanAmount, term])

  const showToast = useCallback(() => {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }, [])

  if (!open) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9600, background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...glass, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', flexShrink: 0, padding: '16px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>KPR Calculator</h1>
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Property Price */}
        <div style={{ ...glass, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 6 }}>💰 Property Price</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FACC15' }}>{formatRupiahFull(propertyPrice)}</div>
        </div>

        {/* Down Payment Slider */}
        <div style={{ ...glass, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>📊 Down Payment</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{downPct}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#8DC63F', height: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>10%</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{formatRupiah(downPayment)}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>50%</span>
          </div>
        </div>

        {/* Loan Term Pills */}
        <div style={{ ...glass, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 10 }}>📅 Loan Term (Years)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LOAN_TERMS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTermIdx(i)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: termIdx === i ? '2px solid #8DC63F' : '1px solid rgba(255,255,255,0.1)',
                  background: termIdx === i ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                  color: termIdx === i ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Interest Rate */}
        <div style={{ ...glass, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>📈 Interest Rate</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#8DC63F' }}>{rate.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={15}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#8DC63F', height: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>5%</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>15%</span>
          </div>
        </div>

        {/* Results */}
        <div style={{ ...glass, padding: '20px 18px', background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.2)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4 }}>💳 Monthly Payment</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FACC15', marginBottom: 16 }}>{formatRupiahFull(result.monthly)}</div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Loan Amount</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{formatRupiah(loanAmount)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Interest</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6b6b' }}>{formatRupiah(result.totalInterest)}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total Payment ({term} years)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{formatRupiah(result.totalPayment)}</div>
          </div>
        </div>

        {/* Bank Comparison */}
        <div style={{ ...glass, padding: '18px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏦</span> Bank Rate Comparison
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bankResults.map((b) => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px 14px', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{b.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.rate}% p.a.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FACC15' }}>{formatRupiah(b.monthly)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>/month</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={showToast}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #8DC63F 0%, #6ba32e 100%)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}
        >
          <span style={{ fontSize: 18 }}>📋</span> Apply for KPR
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(141,198,63,0.3)',
          borderRadius: 12,
          padding: '12px 20px',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 16 }}>🏦</span> Contact bank directly to apply for KPR
        </div>
      )}
    </div>,
    document.body
  )
}
