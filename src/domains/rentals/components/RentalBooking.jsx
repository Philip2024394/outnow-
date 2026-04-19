import { useState } from 'react'
import { createPortal } from 'react-dom'
import { checkSpam, recordStrike, isUserBanned, getWarningMessage } from '@/utils/spamFilter'
import { processCommission, COMMISSION_RATE } from '@/services/walletService'

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

// Booking Flow — professional form with live pricing
export function RentalBookingFlow({ listing, onClose, onConfirm }) {
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [days, setDays] = useState(1)
  const [pickupDate, setPickupDate] = useState('')
  const [notes, setNotes] = useState('')

  if (!listing) return null

  const pricePerDay = Number(String(listing.price_day).replace(/\./g, '')) || 0
  const pricePerWeek = Number(String(listing.price_week).replace(/\./g, '')) || 0
  const pricePerMonth = Number(String(listing.price_month).replace(/\./g, '')) || 0
  const total = days >= 30 && pricePerMonth ? Math.round(pricePerMonth * (days / 30)) : days >= 7 && pricePerWeek ? Math.round(pricePerWeek * (days / 7)) : pricePerDay * days
  const rateUsed = days >= 30 && pricePerMonth ? 'monthly' : days >= 7 && pricePerWeek ? 'weekly' : 'daily'
  const canSubmit = name.trim() && whatsapp.trim() && pickupDate
  const inputStyle = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{ width: '100%', maxWidth: 400, maxHeight: '92vh', overflowY: 'auto', background: 'rgba(10,10,15,0.95)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 22, boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 24px rgba(141,198,63,0.08), inset 0 1px 0 rgba(255,255,255,0.04)', scrollbarWidth: 'none' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.95)', zIndex: 2, borderRadius: '22px 22px 0 0' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Booking Request</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>Complete your details to proceed</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px 18px' }}>
          {/* Vehicle card */}
          <div style={{ display: 'flex', gap: 12, padding: '14px', background: 'rgba(141,198,63,0.03)', borderRadius: 16, border: '1px solid rgba(141,198,63,0.1)', marginBottom: 16 }}>
            {listing.images?.[0] && <img src={listing.images[0]} alt="" style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>📍 {listing.city || 'Indonesia'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ padding: '2px 8px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{listing.sub_category || listing.category}</span>
                {listing.extra_fields?.withDriver && <span style={{ padding: '2px 8px', background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>🚗 Driver</span>}
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" style={inputStyle} />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>WhatsApp <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08123456789" type="tel" style={inputStyle} />
            </div>

            {/* Pickup date */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Pickup Date <span style={{ color: '#EF4444' }}>*</span></label>
              <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} style={inputStyle} />
            </div>

            {/* Duration + live price */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Rental Duration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setDays(Math.max(1, days - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', minWidth: 30, textAlign: 'center' }}>{days}</span>
                <button onClick={() => setDays(days + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD700', border: 'none', color: '#000', fontSize: 18, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>day{days > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: 14, border: '1px solid rgba(141,198,63,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{fmtPrice(pricePerDay)} × {days} day{days > 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{fmtPrice(pricePerDay * days)}</span>
              </div>
              {rateUsed !== 'daily' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(141,198,63,0.5)' }}>✓ {rateUsed} rate applied</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>Save {fmtPrice(pricePerDay * days - total)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Estimated Total</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#8DC63F' }}>{fmtPrice(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>Special Requests <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Pickup location, helmet size, delivery to hotel..." rows={3} style={{ ...inputStyle, resize: 'none', fontSize: 13 }} />
            </div>
          </div>

          {/* Info */}
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, margin: '14px 0', textAlign: 'center' }}>
            Your booking request will be sent to the rental company. They will contact you via chat to confirm availability and arrange your rental.
          </p>

          {/* Submit */}
          <button onClick={() => { onConfirm?.({ name, whatsapp, days, pickupDate, notes, total }); onClose() }} disabled={!canSubmit} style={{ width: '100%', padding: '15px 0', borderRadius: 14, background: canSubmit ? '#8DC63F' : 'rgba(255,255,255,0.04)', border: 'none', color: canSubmit ? '#000' : 'rgba(255,255,255,0.15)', fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: canSubmit ? '0 4px 20px rgba(141,198,63,0.3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            Send Booking Request
          </button>

          <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '11px 0', borderRadius: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
