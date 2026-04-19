/**
 * CommissionPaymentScreen
 * Full-screen overlay for sellers to upload proof of commission payment.
 * Sections: Bank Details (saved to localStorage), Submit Payment, Payment History.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getWalletSummary, fmtIDR } from '@/services/walletService'

const BANK_KEY = 'indoo_seller_bank'
const PAYMENTS_KEY = 'indoo_commission_payments'
const NOTIF_KEY = 'indoo_notifications'

const BANK_OPTIONS = [
  { group: 'Banks', items: ['BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB Niaga', 'Bank Permata', 'Bank Danamon', 'Bank Mega', 'BSI (Bank Syariah)'] },
  { group: 'E-Wallets', items: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'] },
]

const ALL_BANK_ITEMS = BANK_OPTIONS.flatMap(g => g.items)

function formatDateInput(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtIDRInput(val) {
  const num = Number(String(val).replace(/\D/g, ''))
  if (!num) return ''
  return num.toLocaleString('id-ID')
}

function parseIDRInput(str) {
  return Number(String(str).replace(/\D/g, '')) || 0
}

// Pre-seed demo payments if none exist
function seedDemoPayments() {
  try {
    const existing = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]')
    if (existing.length > 0) return
    const now = Date.now()
    const demo = [
      {
        id: 'demo_pay_1',
        amount: 50000,
        bank: 'BCA',
        referenceNumber: '1234567890',
        dateOfTransfer: new Date(now - 86400000 * 3).toISOString(),
        screenshot: null,
        notes: '',
        status: 'confirmed',
        submittedAt: new Date(now - 86400000 * 3).toISOString(),
      },
      {
        id: 'demo_pay_2',
        amount: 35000,
        bank: 'GoPay',
        referenceNumber: '9876543210',
        dateOfTransfer: new Date(now).toISOString(),
        screenshot: null,
        notes: 'Monthly commission',
        status: 'pending_review',
        submittedAt: new Date(now).toISOString(),
      },
    ]
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(demo))
  } catch {}
}

const STATUS_MAP = {
  pending_review: { label: 'Pending Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  confirmed: { label: 'Confirmed', color: '#34C759', bg: 'rgba(52,199,89,0.1)', border: 'rgba(52,199,89,0.3)' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
}

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 99998,
    background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative',
  },
  glowLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)',
  },
  title: { fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' },
  closeBtn: {
    width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none',
    color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tabBar: {
    display: 'flex', margin: '0 16px 12px', borderRadius: 12, overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
  },
  tabBtn: (active) => ({
    flex: 1, padding: '10px 0', border: 'none', fontSize: 12, fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    background: active ? '#F59E0B' : 'transparent',
    color: active ? '#000' : 'rgba(255,255,255,0.35)',
    borderRadius: active ? 10 : 0,
  }),
  scroll: { flex: 1, overflowY: 'auto', padding: '0 16px 24px', WebkitOverflowScrolling: 'touch' },
  card: {
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20,
    padding: '18px', marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 800, color: 'rgba(141,198,63,0.6)',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12,
  },
  input: {
    width: '100%', padding: 14, borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: 14, borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 16, fontFamily: 'inherit', outline: 'none',
    appearance: 'none', WebkitAppearance: 'none', boxSizing: 'border-box',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  fieldGap: { marginBottom: 12 },
  submitBtn: (enabled) => ({
    width: '100%', padding: 16, borderRadius: 14, border: 'none',
    background: enabled ? '#8DC63F' : 'rgba(255,255,255,0.06)',
    color: enabled ? '#000' : 'rgba(255,255,255,0.2)',
    fontWeight: 900, fontSize: 16, cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
  }),
  saveBtn: {
    width: '100%', padding: 14, borderRadius: 14, border: 'none',
    background: '#8DC63F', color: '#000', fontWeight: 900, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  editBtn: {
    padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(141,198,63,0.2)',
    background: 'rgba(141,198,63,0.06)', color: '#8DC63F', fontWeight: 800,
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  toast: {
    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
    padding: '10px 24px', borderRadius: 999, background: '#8DC63F', color: '#000',
    fontSize: 13, fontWeight: 800, zIndex: 100000, boxShadow: '0 4px 20px rgba(141,198,63,0.4)',
    whiteSpace: 'nowrap',
  },
  uploadArea: {
    width: '100%', padding: 20, borderRadius: 12,
    border: '2px dashed rgba(141,198,63,0.15)', background: 'rgba(141,198,63,0.03)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    cursor: 'pointer', boxSizing: 'border-box',
  },
  thumbnail: {
    position: 'relative', borderRadius: 12, overflow: 'hidden', marginTop: 4,
  },
  removeBtn: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
    background: '#EF4444', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}

export default function CommissionPaymentScreen({ open, onClose }) {
  const [tab, setTab] = useState('pay')
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  // Bank details state
  const [bankDetails, setBankDetails] = useState(null)
  const [editingBank, setEditingBank] = useState(false)
  const [bankForm, setBankForm] = useState({ bank: '', holderName: '', accountNumber: '' })

  // Payment form state
  const [amount, setAmount] = useState('')
  const [paymentBank, setPaymentBank] = useState('')
  const [refNumber, setRefNumber] = useState('')
  const [transferDate, setTransferDate] = useState(formatDateInput(new Date()))
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [notes, setNotes] = useState('')

  // History
  const [payments, setPayments] = useState([])
  const [fullScreenImg, setFullScreenImg] = useState(null)

  // Seed demo data + load
  useEffect(() => {
    if (!open) return
    seedDemoPayments()
    loadBankDetails()
    loadPayments()
    // Pre-fill commission owed
    const summary = getWalletSummary()
    if (summary.commissionOwed > 0) {
      setAmount(fmtIDRInput(summary.commissionOwed))
    }
  }, [open])

  // Auto-fill payment bank from saved details
  useEffect(() => {
    if (bankDetails && !paymentBank) {
      setPaymentBank(bankDetails.bank)
    }
  }, [bankDetails, paymentBank])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  function loadBankDetails() {
    try {
      const saved = JSON.parse(localStorage.getItem(BANK_KEY))
      if (saved) {
        setBankDetails(saved)
        setBankForm(saved)
      }
    } catch {}
  }

  function loadPayments() {
    try {
      const data = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]')
      setPayments(data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
    } catch { setPayments([]) }
  }

  function saveBankDetails() {
    if (!bankForm.bank || !bankForm.holderName || !bankForm.accountNumber) return
    localStorage.setItem(BANK_KEY, JSON.stringify(bankForm))
    setBankDetails({ ...bankForm })
    setEditingBank(false)
    setPaymentBank(bankForm.bank)
    showToast('Bank details saved')
  }

  function handleScreenshot(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotFile(file)
    setScreenshot(URL.createObjectURL(file))
  }

  function removeScreenshot() {
    if (screenshot) URL.revokeObjectURL(screenshot)
    setScreenshot(null)
    setScreenshotFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSubmit() {
    if (!refNumber || !screenshot) return
    const parsedAmount = parseIDRInput(amount)
    const payment = {
      id: `pay_${Date.now()}`,
      amount: parsedAmount,
      bank: paymentBank || bankDetails?.bank || '',
      referenceNumber: refNumber,
      dateOfTransfer: new Date(transferDate).toISOString(),
      screenshot, // objectURL for demo; in prod this would be uploaded
      notes,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    }

    // Save to commission payments
    try {
      const existing = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]')
      existing.push(payment)
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(existing))
    } catch {}

    // Save notification
    try {
      const notifs = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]')
      notifs.push({
        id: `notif_${Date.now()}`,
        type: 'commission_payment_submitted',
        title: 'Commission Payment Submitted',
        body: `Payment of ${fmtIDR(parsedAmount)} submitted for review`,
        amount: parsedAmount,
        paymentId: payment.id,
        read: false,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs))
    } catch {}

    // Clear form
    setRefNumber('')
    removeScreenshot()
    setNotes('')
    const summary = getWalletSummary()
    setAmount(summary.commissionOwed > 0 ? fmtIDRInput(summary.commissionOwed) : '')
    loadPayments()
    showToast('Payment submitted for review')
  }

  if (!open) return null

  const canSubmit = refNumber.trim().length > 0 && screenshot

  return createPortal(
    <div style={S.overlay}>
      {/* Toast */}
      {toast && <div style={S.toast}>{toast}</div>}

      {/* Header */}
      <div style={S.header}>
        <div style={S.glowLine} />
        <span style={S.title}>Commission Payment</span>
        <button onClick={onClose} style={S.closeBtn}>✕</button>
      </div>

      {/* Tab toggle */}
      <div style={S.tabBar}>
        <button style={S.tabBtn(tab === 'pay')} onClick={() => setTab('pay')}>Pay Commission</button>
        <button style={S.tabBtn(tab === 'history')} onClick={() => setTab('history')}>Payment History</button>
      </div>

      {/* Scrollable content */}
      <div style={S.scroll}>
        {tab === 'pay' && (
          <>
            {/* Section 1: Bank Details */}
            <div style={S.card}>
              <div style={S.sectionLabel}>Bank / E-Wallet Details</div>

              {bankDetails && !editingBank ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#34C759' }}>&#10003;</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{bankDetails.bank}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{bankDetails.holderName}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{bankDetails.accountNumber}</div>
                  <button style={S.editBtn} onClick={() => setEditingBank(true)}>Edit</button>
                </div>
              ) : (
                <div>
                  <div style={S.fieldGap}>
                    <label style={S.label}>Bank / E-Wallet</label>
                    <select
                      style={S.select}
                      value={bankForm.bank}
                      onChange={e => setBankForm(f => ({ ...f, bank: e.target.value }))}
                    >
                      <option value="" disabled>Select bank or e-wallet</option>
                      {BANK_OPTIONS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.items.map(item => <option key={item} value={item}>{item}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div style={S.fieldGap}>
                    <label style={S.label}>Account Holder Name</label>
                    <input
                      style={S.input}
                      value={bankForm.holderName}
                      onChange={e => setBankForm(f => ({ ...f, holderName: e.target.value }))}
                      placeholder="Full name on account"
                    />
                  </div>
                  <div style={S.fieldGap}>
                    <label style={S.label}>Account Number</label>
                    <input
                      style={S.input}
                      value={bankForm.accountNumber}
                      onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Account number"
                      inputMode="numeric"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.saveBtn} onClick={saveBankDetails}>Save Bank Details</button>
                    {bankDetails && (
                      <button style={{ ...S.editBtn, padding: '14px 20px' }} onClick={() => { setBankForm(bankDetails); setEditingBank(false) }}>Cancel</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Submit Payment */}
            <div style={S.card}>
              <div style={S.sectionLabel}>Submit Payment</div>

              <div style={S.fieldGap}>
                <label style={S.label}>Amount (IDR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input
                    style={{ ...S.input, paddingLeft: 42 }}
                    value={amount}
                    onChange={e => setAmount(fmtIDRInput(e.target.value))}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div style={S.fieldGap}>
                <label style={S.label}>Bank / E-Wallet</label>
                <select
                  style={S.select}
                  value={paymentBank}
                  onChange={e => setPaymentBank(e.target.value)}
                >
                  <option value="" disabled>Select bank or e-wallet</option>
                  {BANK_OPTIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(item => <option key={item} value={item}>{item}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={S.fieldGap}>
                <label style={S.label}>Transfer / Reference Number</label>
                <input
                  style={S.input}
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  placeholder="Enter 10-20 digit transfer number"
                />
              </div>

              <div style={S.fieldGap}>
                <label style={S.label}>Date of Transfer</label>
                <input
                  type="date"
                  style={{ ...S.input, colorScheme: 'dark' }}
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                />
              </div>

              <div style={S.fieldGap}>
                <label style={S.label}>Screenshot</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleScreenshot}
                />
                {screenshot ? (
                  <div style={S.thumbnail}>
                    <img
                      src={screenshot}
                      alt="Transfer screenshot"
                      style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}
                    />
                    <button style={S.removeBtn} onClick={removeScreenshot}>✕</button>
                  </div>
                ) : (
                  <button style={S.uploadArea} onClick={() => fileInputRef.current?.click()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>Upload Transfer Screenshot</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Tap to select image</span>
                  </button>
                )}
              </div>

              <div style={{ ...S.fieldGap, marginBottom: 16 }}>
                <label style={S.label}>Notes</label>
                <textarea
                  style={{ ...S.input, minHeight: 60, resize: 'vertical' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <button style={S.submitBtn(canSubmit)} disabled={!canSubmit} onClick={handleSubmit}>
                Submit Payment
              </button>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: 30, display: 'block', marginBottom: 10 }}>📋</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No payments yet</span>
              </div>
            ) : payments.map(p => {
              const cfg = STATUS_MAP[p.status] || STATUS_MAP.pending_review
              return (
                <div key={p.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{fmtIDR(p.amount)}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.bank} &middot; {fmtDate(p.dateOfTransfer)}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                    Ref: {p.referenceNumber}
                  </div>
                  {p.notes && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', marginBottom: 4 }}>
                      {p.notes}
                    </div>
                  )}
                  {p.screenshot && (
                    <div
                      style={{ marginTop: 8, cursor: 'pointer' }}
                      onClick={() => setFullScreenImg(p.screenshot)}
                    >
                      <img
                        src={p.screenshot}
                        alt="Transfer proof"
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Full screen image viewer */}
      {fullScreenImg && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setFullScreenImg(null)}
        >
          <img src={fullScreenImg} alt="Full size" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button
            onClick={() => setFullScreenImg(null)}
            style={{ position: 'absolute', top: 16, right: 16, ...S.closeBtn }}
          >✕</button>
        </div>
      )}
    </div>,
    document.body
  )
}
