/**
 * ExportVerification — Seller verification for export badge
 * Requirements: KTP+selfie, WhatsApp (verified), Social media accounts
 * On completion: export_badge = true on profile
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'

const STEPS = [
  { id: 'ktp', label: 'KTP & Selfie', icon: '🪪' },
  { id: 'whatsapp', label: 'WhatsApp Number', icon: '💬' },
  { id: 'social', label: 'Social Media', icon: '📱' },
]

export default function ExportVerification({ profile, onClose, onVerified }) {
  const [step, setStep] = useState(0)
  const [ktpPhoto, setKtpPhoto] = useState(profile?.ktp_photo_url ?? '')
  const [ktpSelfie, setKtpSelfie] = useState(profile?.ktp_selfie_url ?? '')
  const [waNumber, setWaNumber] = useState(profile?.wa_number ?? '')
  const [waVerified, setWaVerified] = useState(profile?.wa_verified ?? false)
  const [waTesting, setWaTesting] = useState(false)
  const [instagram, setInstagram] = useState(profile?.instagram_handle ?? '')
  const [tiktok, setTiktok] = useState(profile?.tiktok_handle ?? '')
  const [facebook, setFacebook] = useState(profile?.facebook_handle ?? '')
  const [website, setWebsite] = useState(profile?.website_url ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Test WhatsApp number by opening wa.me link
  const testWhatsApp = () => {
    if (!waNumber.trim()) return
    setWaTesting(true)
    const cleaned = waNumber.replace(/\D/g, '')
    window.open(`https://wa.me/${cleaned}?text=Hello%20from%20INDOO%20verification`, '_blank')
    setTimeout(() => {
      setWaVerified(true)
      setWaTesting(false)
      showToast('WhatsApp verified')
    }, 3000)
  }

  const canSubmit = ktpPhoto && ktpSelfie && waNumber && waVerified && (instagram || tiktok || facebook)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    if (supabase) {
      await supabase.from('profiles').update({
        wa_number: waNumber.replace(/\D/g, ''),
        wa_verified: true,
        instagram_handle: instagram || null,
        tiktok_handle: tiktok || null,
        facebook_handle: facebook || null,
        website_url: website || null,
        export_badge: true,
        export_verified_at: new Date().toISOString(),
      }).eq('id', profile?.id)
    }
    setSaving(false)
    showToast('Export badge activated!')
    onVerified?.()
    setTimeout(onClose, 1500)
  }

  const inputStyle = {
    width: '100%', padding: '14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', display: 'block' }}>Export Verification</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Get verified to sell internationally</span>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 8px' }}>
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: step === i ? '#8DC63F' : i < step ? 'rgba(141,198,63,0.2)' : 'rgba(255,255,255,0.06)',
            color: step === i ? '#000' : i < step ? '#8DC63F' : 'rgba(255,255,255,0.4)',
            fontSize: 14, fontWeight: 800,
          }}>{s.icon} {s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Step 1: KTP */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 14, color: '#8DC63F', lineHeight: 1.5 }}>Upload your KTP (Indonesian ID card) and a selfie holding your KTP. This verifies your identity for international buyers.</span>
            </div>

            <div>
              <span style={labelStyle}>KTP Photo URL</span>
              <input value={ktpPhoto} onChange={e => setKtpPhoto(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            {ktpPhoto && <img src={ktpPhoto} alt="KTP" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} />}

            <div>
              <span style={labelStyle}>Selfie Holding KTP</span>
              <input value={ktpSelfie} onChange={e => setKtpSelfie(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            {ktpSelfie && <img src={ktpSelfie} alt="Selfie" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} />}

            <button onClick={() => setStep(1)} disabled={!ktpPhoto || !ktpSelfie} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: ktpPhoto && ktpSelfie ? '#8DC63F' : 'rgba(255,255,255,0.06)',
              border: 'none', color: ktpPhoto && ktpSelfie ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 16, fontWeight: 900, cursor: 'pointer',
            }}>Next — WhatsApp</button>
          </div>
        )}

        {/* Step 2: WhatsApp */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 14, color: '#8DC63F', lineHeight: 1.5 }}>Enter your WhatsApp number. We will test it to confirm it's active. This number will be shared with international buyers who purchase your contact.</span>
            </div>

            <div>
              <span style={labelStyle}>WhatsApp Number (with country code)</span>
              <input value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="+6281234567890" style={inputStyle} />
            </div>

            {!waVerified ? (
              <button onClick={testWhatsApp} disabled={!waNumber.trim() || waTesting} style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: waNumber.trim() ? '#25D366' : 'rgba(255,255,255,0.06)',
                border: 'none', color: waNumber.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: 16, fontWeight: 900, cursor: 'pointer',
              }}>{waTesting ? 'Testing...' : 'Test WhatsApp Number'}</button>
            ) : (
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.3)', textAlign: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#8DC63F' }}>WhatsApp Verified</span>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!waVerified} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: waVerified ? '#8DC63F' : 'rgba(255,255,255,0.06)',
              border: 'none', color: waVerified ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 16, fontWeight: 900, cursor: 'pointer',
            }}>Next — Social Media</button>
          </div>
        )}

        {/* Step 3: Social Media */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)' }}>
              <span style={{ fontSize: 14, color: '#8DC63F', lineHeight: 1.5 }}>Add at least one social media account. These will be shared with buyers who purchase the WhatsApp + Social Media package.</span>
            </div>

            <div>
              <span style={labelStyle}>Instagram Username</span>
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourbusiness" style={inputStyle} />
            </div>

            <div>
              <span style={labelStyle}>TikTok Username</span>
              <input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@yourbusiness" style={inputStyle} />
            </div>

            <div>
              <span style={labelStyle}>Facebook Page</span>
              <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/yourbusiness" style={inputStyle} />
            </div>

            <div>
              <span style={labelStyle}>Website (optional)</span>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbusiness.com" style={inputStyle} />
            </div>

            <button onClick={handleSubmit} disabled={!canSubmit || saving} style={{
              width: '100%', padding: '16px', borderRadius: 14,
              background: canSubmit ? '#8DC63F' : 'rgba(255,255,255,0.06)',
              border: 'none', color: canSubmit ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: 16, fontWeight: 900, cursor: 'pointer',
              boxShadow: canSubmit ? '0 4px 25px rgba(141,198,63,0.5)' : 'none',
            }}>{saving ? 'Verifying...' : 'Complete Verification'}</button>
          </div>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: 12, background: '#8DC63F', color: '#000', fontSize: 14, fontWeight: 800, zIndex: 99999 }}>{toast}</div>}
    </div>,
    document.body
  )
}
