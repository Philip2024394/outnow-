import { useState } from 'react'

function fmtRp(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Math.floor(n).toLocaleString('id-ID')
}

function eligibilityTier(amount) {
  if (amount <= 0)     return { label: 'No COD orders · Rides only', color: '#555' }
  if (amount < 50000)  return { label: 'Small street food orders only', color: '#FF9500' }
  if (amount < 100000) return { label: 'Most street food orders', color: '#FFB800' }
  if (amount < 150000) return { label: 'Most restaurant orders', color: '#8DC63F' }
  return                      { label: 'Full access to all orders', color: '#8DC63F' }
}

export default function DriverCashFloatModal({ driverName = 'Driver', onConfirm }) {
  const [amount, setAmount] = useState(100000)
  const tier = eligibilityTier(amount)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: '24px 24px 0 0', background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', padding: '24px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)', animation: 'slideUp 0.3s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', display: 'block' }}>💵 Cash Float</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Your cash determines your booking value</span>
        </div>

        {/* Amount display */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#FACC15', display: 'block' }}>{fmtRp(amount)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: tier.color, marginTop: 4, display: 'block' }}>{tier.label}</span>
        </div>

        {/* Slider */}
        <div style={{ padding: '0 4px', marginBottom: 16 }}>
          <input
            type="range"
            min={0}
            max={300000}
            step={10000}
            value={amount}
            onChange={e => setAmount(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#8DC63F', height: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Rp 0</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Rp 300.000</span>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)', marginBottom: 16, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          <span style={{ fontWeight: 800, color: '#FACC15', display: 'block', marginBottom: 6 }}>How Cash Float Works</span>
          <span>You pay the restaurant upfront for COD food orders, then collect from the customer on delivery. More cash = bigger orders = more earnings.</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              <span>No cash = no COD food orders (rides still available)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FACC15', flexShrink: 0 }} />
              <span>Rp 50.000 = small street food orders</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8DC63F', flexShrink: 0 }} />
              <span>Rp 150.000+ = full access to all food orders</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button onClick={() => onConfirm(amount)} style={{ width: '100%', padding: 16, borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
          Go Online{amount > 0 ? ` · ${fmtRp(amount)} float` : ''}
        </button>
        <button onClick={() => onConfirm(0)} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          No cash — skip COD orders
        </button>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
