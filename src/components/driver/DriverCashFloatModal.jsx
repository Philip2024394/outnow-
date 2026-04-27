import { useState } from 'react'

function fmtRp(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Math.floor(n).toLocaleString('id-ID')
}

export default function DriverCashFloatModal({ onConfirm }) {
  const [amount, setAmount] = useState(100000)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: '24px 24px 0 0', background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', padding: '28px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)', animation: 'slideUp 0.3s ease', position: 'relative', overflow: 'hidden' }}>
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2022,%202026,%2006_39_04%20AM.png?updatedAt=1776814761653" alt="" style={{ position: 'absolute', top: 0, right: -10, width: 120, height: 120, objectFit: 'contain', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', display: 'block' }}>💵 Enter Your Cash Float</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: '#FACC15', display: 'block' }}>{fmtRp(amount)}</span>
        </div>

        <div style={{ padding: '0 4px', marginBottom: 24 }}>
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

        <button onClick={() => onConfirm(amount)} style={{ width: '100%', padding: 16, borderRadius: 14, background: '#8DC63F', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
          Go Online{amount > 0 ? ` · ${fmtRp(amount)}` : ''}
        </button>
        <button onClick={() => onConfirm(0)} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          No cash — skip COD orders
        </button>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
