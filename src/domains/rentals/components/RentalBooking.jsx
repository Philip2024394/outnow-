import { useState } from 'react'
import { createPortal } from 'react-dom'
import { checkSpam, recordStrike, isUserBanned, getWarningMessage } from '@/utils/spamFilter'

const COMMISSION_RATE = 0.10 // 10%

function fmtPrice(n) {
  if (!n) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

// Rental Chat Window
export function RentalChat({ listing, onClose, onBook }) {
  const [messages, setMessages] = useState([
    { from: 'system', text: `Welcome! Ask the owner about "${listing?.title}". Phone numbers and contact details are blocked until booking is confirmed.`, time: new Date() },
  ])
  const [input, setInput] = useState('')
  const [spamWarning, setSpamWarning] = useState('')
  const [banned, setBanned] = useState(false)

  const sendMessage = () => {
    if (!input.trim()) return
    if (isUserBanned()) { setBanned(true); return }
    const result = checkSpam(input)
    if (result.isSpam) {
      const strike = recordStrike()
      if (strike.banned) {
        setBanned(true)
        setSpamWarning(`Chat temporarily disabled for ${strike.minutesLeft} minutes due to repeated violations.`)
      } else {
        setSpamWarning(getWarningMessage(result.severity) + (strike.strikesLeft <= 1 ? ' ⚠️ Last warning before temporary ban.' : ` (${strike.strikesLeft} warning${strike.strikesLeft > 1 ? 's' : ''} left)`))
      }
      setTimeout(() => setSpamWarning(''), 5000)
      return
    }
    setMessages(prev => [...prev, { from: 'user', text: input.trim(), time: new Date() }])
    setInput('')
    // Simulate owner reply
    setTimeout(() => {
      const replies = [
        'Yes, the bike is available! Would you like to book?',
        'Sure, I can deliver to your hotel. Just confirm the dates.',
        'The price includes 2 helmets and a raincoat.',
        'Yes, it\'s in great condition. Recently serviced.',
        'I can do a small discount for weekly rental.',
      ]
      setMessages(prev => [...prev, { from: 'owner', text: replies[Math.floor(Math.random() * replies.length)], time: new Date() }])
    }, 1500)
  }

  if (!listing) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: '#0d0d0f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{listing.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{listing.extra_fields?.make} {listing.extra_fields?.model} · {fmtPrice(listing.price_day)}/day</div>
        </div>
        <button onClick={onBook} style={{ padding: '8px 14px', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          Book Now
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
              background: msg.from === 'system' ? 'rgba(141,198,63,0.08)' : msg.from === 'user' ? '#8DC63F' : 'rgba(255,255,255,0.06)',
              border: msg.from === 'system' ? '1px solid rgba(141,198,63,0.15)' : 'none',
              borderBottomRightRadius: msg.from === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.from === 'owner' ? 4 : 16,
            }}>
              {msg.from === 'owner' && <div style={{ fontSize: 9, fontWeight: 700, color: '#FFD700', marginBottom: 4 }}>Owner</div>}
              <div style={{ fontSize: 13, fontWeight: 500, color: msg.from === 'user' ? '#000' : msg.from === 'system' ? 'rgba(141,198,63,0.7)' : 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{msg.text}</div>
              <div style={{ fontSize: 8, color: msg.from === 'user' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.15)', marginTop: 4, textAlign: 'right' }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Spam warning */}
      {spamWarning && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{spamWarning}</span>
        </div>
      )}

      {/* Banned notice */}
      {banned && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', borderTop: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>Chat disabled — too many violations. Try again in 15 minutes.</span>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={sendMessage} style={{ width: 44, height: 44, borderRadius: '50%', background: '#8DC63F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

// Booking Flow
export function RentalBookingFlow({ listing, onClose, onConfirm }) {
  const [days, setDays] = useState(1)
  const [pickupDate, setPickupDate] = useState('')
  const [step, setStep] = useState(0) // 0: select dates, 1: payment, 2: upload proof, 3: confirmed
  const [paymentProof, setPaymentProof] = useState(null)
  const [processing, setProcessing] = useState(false)

  if (!listing) return null

  const pricePerDay = Number(String(listing.price_day).replace(/\./g, '')) || 0
  const totalRental = pricePerDay * days
  const deposit = Math.round(totalRental * COMMISSION_RATE)
  const balanceDue = totalRental - deposit

  const handleConfirmBooking = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setStep(3)
      // Save booking
      try {
        const bookings = JSON.parse(localStorage.getItem('indoo_rental_bookings') || '[]')
        bookings.push({
          id: 'BK-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
          listing_ref: listing.ref || listing.id,
          listing_title: listing.title,
          days,
          pickup_date: pickupDate,
          total: totalRental,
          deposit,
          balance: balanceDue,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('indoo_rental_bookings', JSON.stringify(bookings))
      } catch {}
    }, 3000)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.1)' }}>

        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏍️</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Book Rental</span>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Step 0: Select dates */}
        {step === 0 && (
          <div style={{ padding: '16px' }}>
            {/* Listing summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 8 }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{listing.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{fmtPrice(pricePerDay)} / day</div>
              </div>
            </div>

            {/* Pickup date */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Pickup Date</label>
              <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Rental Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setDays(Math.max(1, days - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', minWidth: 40, textAlign: 'center' }}>{days}</span>
                <button onClick={() => setDays(days + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>day{days > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fmtPrice(pricePerDay)} × {days} day{days > 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{fmtPrice(totalRental)}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FFD700' }}>Deposit (10%) — Pay Now</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD700' }}>{fmtPrice(deposit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Balance — Pay Owner on Pickup</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{fmtPrice(balanceDue)}</span>
              </div>
            </div>

            <button onClick={() => setStep(1)} disabled={!pickupDate} style={{ width: '100%', padding: '14px', borderRadius: 14, background: pickupDate ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: pickupDate ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 800, cursor: pickupDate ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Continue to Payment →
            </button>
          </div>
        )}

        {/* Step 1: Payment details */}
        {step === 1 && (
          <div style={{ padding: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Deposit Amount</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFD700' }}>{fmtPrice(deposit)}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Pay via Transfer or E-Wallet:</div>
              {[
                { method: 'Bank BCA', detail: '1234 5678 90 · Indoo Indonesia' },
                { method: 'GoPay / OVO', detail: '0812-3456-7890' },
                { method: 'QRIS', detail: 'Scan QR code at checkout' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>{p.method}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.detail}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '0 0 12px' }}>After payment, upload proof to confirm your booking</p>

            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#FFD700', border: 'none', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              I've Paid — Upload Proof →
            </button>
          </div>
        )}

        {/* Step 2: Upload proof */}
        {step === 2 && (
          <div style={{ padding: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Upload Payment Proof</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Screenshot of transfer or e-wallet receipt</div>
            </div>

            {paymentProof ? (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img src={paymentProof} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }} />
                <button onClick={() => setPaymentProof(null)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <button onClick={() => {
                const inp = document.createElement('input')
                inp.type = 'file'; inp.accept = 'image/*'
                inp.onchange = e => {
                  const f = e.target.files?.[0]
                  if (f) setPaymentProof(URL.createObjectURL(f))
                }
                inp.click()
              }} style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, border: '2px dashed rgba(141,198,63,0.2)', background: 'rgba(141,198,63,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F' }}>Tap to Upload</span>
              </button>
            )}

            <button onClick={handleConfirmBooking} disabled={!paymentProof || processing} style={{ width: '100%', padding: '14px', borderRadius: 14, background: paymentProof ? '#8DC63F' : 'rgba(255,255,255,0.06)', border: 'none', color: paymentProof ? '#000' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 800, cursor: paymentProof ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {processing ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        )}

        {/* Step 3: Confirmed — WhatsApp unlocked */}
        {step === 3 && (() => {
          const ownerWa = listing.extra_fields?.whatsapp || (() => { try { return JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}').whatsapp } catch { return '' } })() || '08123456789'
          const waLink = `https://wa.me/${ownerWa.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I've booked your ${listing.title} for ${days} day(s) starting ${pickupDate}. Booking confirmed via Indoo Rentals.`)}`
          return (
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(141,198,63,0.4)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Booking Confirmed!</h2>
            <p style={{ fontSize: 12, color: '#8DC63F', fontWeight: 700, margin: '0 0 4px' }}>Deposit of {fmtPrice(deposit)} received</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>Pay {fmtPrice(balanceDue)} directly to owner on pickup</p>

            {/* Booking summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px', marginBottom: 12, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{listing.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Pickup: {pickupDate} · {days} day{days > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Total: {fmtPrice(totalRental)}</div>
            </div>

            {/* WhatsApp unlocked */}
            <div style={{ background: 'rgba(37,211,102,0.08)', border: '1.5px solid rgba(37,211,102,0.25)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#25D366' }}>WhatsApp Unlocked</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.02em', marginBottom: 8 }}>{ownerWa}</div>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px 0', borderRadius: 12,
                background: '#25D366', border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                textDecoration: 'none', boxShadow: '0 2px 10px rgba(37,211,102,0.3)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                Chat on WhatsApp
              </a>
            </div>

            <button onClick={() => { onConfirm?.(); onClose() }} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Done
            </button>
          </div>
          )
        })()}
      </div>
    </div>,
    document.body
  )
}
