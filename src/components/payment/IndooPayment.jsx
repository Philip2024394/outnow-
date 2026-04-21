import { useState } from 'react'

/**
 * IndooPayment — shared payment selector used across ALL modules.
 * Supports: Bank Transfer (with QR), COD (Cash on Delivery/Arrival)
 *
 * Props:
 * @param {number} amount - total to pay
 * @param {object} bankDetails - { name, account_number, account_holder, qr_url }
 * @param {function} onConfirm - called with { method: 'bank'|'cod', transactionCode?: string }
 * @param {string} codLabel - custom COD label (default: "Cash on Delivery")
 * @param {string} confirmLabel - custom confirm button text
 * @param {boolean} disabled - disable confirm button
 */
export default function IndooPayment({ amount, bankDetails, onConfirm, codLabel, confirmLabel, disabled }) {
  const [method, setMethod] = useState(null)
  const [txCode, setTxCode] = useState('')
  const [qrZoom, setQrZoom] = useState(false)

  const fmtRp = (n) => 'Rp ' + (n ?? 0).toLocaleString('id-ID')
  const canConfirm = method === 'cod' || (method === 'bank' && txCode.trim())

  return (
    <>
      {/* Method selection */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block' }}>Payment Method</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMethod('bank')} style={{
            flex: 1, padding: '14px 8px', borderRadius: 12,
            background: '#000',
            border: `1.5px solid ${method === 'bank' ? '#8DC63F' : 'rgba(255,255,255,0.12)'}`,
            color: method === 'bank' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>🏦</span>
            <span>Bank Transfer</span>
          </button>
          <button onClick={() => setMethod('cod')} style={{
            flex: 1, padding: '14px 8px', borderRadius: 12,
            background: '#000',
            border: `1.5px solid ${method === 'cod' ? '#8DC63F' : 'rgba(255,255,255,0.12)'}`,
            color: method === 'cod' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>💵</span>
            <span>{codLabel || 'Cash on Delivery'}</span>
          </button>
        </div>
      </div>

      {/* Bank transfer details */}
      {method === 'bank' && bankDetails && (
        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontSize: 10 }}>Transfer to:</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{bankDetails.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14 }}>{bankDetails.account_number}</span>
                <button onClick={() => navigator.clipboard?.writeText(bankDetails.account_number)} style={{ padding: '2px 8px', borderRadius: 6, background: '#8DC63F', border: 'none', color: '#000', fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{bankDetails.account_holder}</div>
              <div style={{ color: '#FACC15', fontWeight: 900, fontSize: 18, marginTop: 8 }}>{fmtRp(amount)}</div>
            </div>
            {bankDetails.qr_url && (
              <div onClick={() => setQrZoom(true)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                <img src={bankDetails.qr_url} alt="QR" style={{ width: 80, height: 80, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)', objectFit: 'cover', background: '#fff' }} />
                <span style={{ display: 'block', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 3 }}>Screenshot to scan</span>
              </div>
            )}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
          <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontSize: 11 }}>Enter transaction/reference code:</div>
          <input
            value={txCode}
            onChange={e => setTxCode(e.target.value)}
            placeholder="e.g. TRX-123456789"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '14px 16px', borderRadius: 12,
              background: '#000', border: '1.5px solid #FACC15',
              color: '#fff', fontSize: 15, fontFamily: 'inherit', fontWeight: 700,
              outline: 'none', letterSpacing: '0.02em',
              animation: 'borderHeartbeat 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={() => { if (canConfirm && !disabled) onConfirm?.({ method, transactionCode: method === 'bank' ? txCode : null }) }}
        style={{
          width: '100%', padding: 16, borderRadius: 16,
          background: canConfirm && !disabled ? '#8DC63F' : 'rgba(255,255,255,0.06)',
          color: canConfirm && !disabled ? '#000' : 'rgba(255,255,255,0.3)',
          border: 'none', fontSize: 16, fontWeight: 900,
          cursor: canConfirm && !disabled ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
        }}
      >
        {!method ? 'Select Payment Method' : method === 'bank' && !txCode.trim() ? 'Enter Transaction Code' : confirmLabel || 'Confirm & Pay'}
      </button>

      {/* QR fullscreen zoom */}
      {qrZoom && bankDetails?.qr_url && (
        <div onClick={() => setQrZoom(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <img src={bankDetails.qr_url} alt="QR Code" style={{ width: '75vw', maxWidth: 300, height: 'auto', borderRadius: 16, border: '2px solid rgba(255,255,255,0.1)', background: '#fff' }} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#FACC15' }}>{fmtRp(amount)}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Scan to Pay</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Tap anywhere to close</span>
        </div>
      )}
    </>
  )
}
