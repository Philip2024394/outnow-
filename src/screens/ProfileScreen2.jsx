/**
 * ProfileScreen2 — View & edit user profile for Indoo Done Deal
 * Loads from indoo_profile (buyer) and indoo_rental_owner (seller)
 * Premium marketplace card style
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

/* ── Green Glow Line ── */
function GlowLine() {
  return (
    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />
  )
}

/* ── Glass Card ── */
function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(141,198,63,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
      marginBottom: 12,
      ...style,
    }}>
      <GlowLine />
      {children}
    </div>
  )
}

export default function ProfileScreen2({ open, onClose }) {
  const [profile, setProfile] = useState(null)
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (open) {
      try { setProfile(JSON.parse(localStorage.getItem('indoo_profile') || 'null')) } catch { setProfile(null) }
      try { setOwnerProfile(JSON.parse(localStorage.getItem('indoo_rental_owner') || 'null')) } catch { setOwnerProfile(null) }
    }
  }, [open])

  if (!open) return null

  const data = ownerProfile || profile || {}
  const name = data.name || data.fullName || 'Guest'
  const phone = data.phone || data.whatsapp || data.phoneNum || '—'
  const city = data.city || data.rentalCity || '—'
  const bio = data.bio || ''
  const isOwner = !!ownerProfile
  const interests = profile?.rentalInterests || []

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const startEdit = () => {
    setEditData({ name, phone, city, bio })
    setEditing(true)
  }

  const saveEdit = () => {
    if (ownerProfile) {
      const updated = { ...ownerProfile, name: editData.name, whatsapp: editData.phone, city: editData.city, bio: editData.bio }
      localStorage.setItem('indoo_rental_owner', JSON.stringify(updated))
      setOwnerProfile(updated)
    }
    if (profile) {
      const updated = { ...profile, fullName: editData.name, phoneNum: editData.phone, rentalCity: editData.city }
      localStorage.setItem('indoo_profile', JSON.stringify(updated))
      setProfile(updated)
    }
    setEditing(false)
    showToast('Profile updated')
  }

  const sectionLabel = { fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }
  const valueStyle = { fontSize: 14, fontWeight: 700, color: '#fff' }
  const inputStyle = { width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', outline: 'none', marginTop: 4, boxSizing: 'border-box' }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>12</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>PROFILE</span></div>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>My Profile</span>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Hero Card */}
        <GlassCard style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(141,198,63,0.08)',
              border: '2.5px solid rgba(141,198,63,0.3)',
              boxShadow: '0 0 20px rgba(141,198,63,0.15), inset 0 0 12px rgba(141,198,63,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontWeight: 600 }}>{city}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {isOwner && (
                  <span style={{
                    padding: '4px 12px', borderRadius: 10,
                    background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)',
                    fontSize: 10, fontWeight: 800, color: '#8DC63F',
                  }}>Owner</span>
                )}
                {profile && (
                  <span style={{
                    padding: '4px 12px', borderRadius: 10,
                    background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)',
                    fontSize: 10, fontWeight: 800, color: '#FFD700',
                  }}>Buyer</span>
                )}
              </div>
            </div>
            {/* Edit button (top-right) */}
            {!editing && (
              <button onClick={startEdit} style={{
                position: 'absolute', top: 0, right: 0,
                padding: '8px 16px', borderRadius: 14,
                background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)',
                color: '#8DC63F', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>Edit</button>
            )}
          </div>
        </GlassCard>

        {/* Edit mode */}
        {editing ? (
          <GlassCard style={{ padding: '20px' }}>
            <div style={sectionLabel}>Edit Profile</div>
            <div style={{ ...sectionLabel, marginTop: 14 }}>Name</div>
            <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <div style={{ ...sectionLabel, marginTop: 16 }}>Phone / WhatsApp</div>
            <input value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
            <div style={{ ...sectionLabel, marginTop: 16 }}>City</div>
            <input value={editData.city} onChange={e => setEditData(p => ({ ...p, city: e.target.value }))} style={inputStyle} />
            <div style={{ ...sectionLabel, marginTop: 16 }}>Bio</div>
            <textarea value={editData.bio} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditing(false)} style={{
                flex: 1, padding: '13px 0', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
              <button onClick={saveEdit} style={{
                flex: 1, padding: '13px 0', borderRadius: 14,
                background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
              }}>Save</button>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Contact Card */}
            <GlassCard style={{ padding: '16px 20px' }}>
              <div style={sectionLabel}>Phone / WhatsApp</div>
              <div style={valueStyle}>{phone}</div>
            </GlassCard>

            {/* Bio Card */}
            {bio && (
              <GlassCard style={{ padding: '16px 20px' }}>
                <div style={sectionLabel}>Bio</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontWeight: 500 }}>{bio}</div>
              </GlassCard>
            )}

            {/* Owner Details Card */}
            {isOwner && (
              <GlassCard style={{ padding: '18px 20px' }}>
                <div style={sectionLabel}>Owner Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>TYPE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{ownerProfile.ownerType || 'Individual'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>FLEET SIZE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{ownerProfile.fleetSize || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>ADDRESS</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{ownerProfile.address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>MEMBER SINCE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{ownerProfile.created_at ? new Date(ownerProfile.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Interests Card */}
            {interests.length > 0 && (
              <GlassCard style={{ padding: '16px 20px' }}>
                <div style={sectionLabel}>Interests</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {interests.map(i => (
                    <span key={i} style={{
                      padding: '6px 14px', borderRadius: 12,
                      background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.15)',
                      fontSize: 11, fontWeight: 700, color: '#8DC63F',
                    }}>{i}</span>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* No profile state */}
        {!profile && !ownerProfile && (
          <GlassCard style={{ textAlign: 'center', padding: '48px 24px', marginTop: 20 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(141,198,63,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No Profile Yet</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Sign up as a buyer or create an owner account to get started</div>
          </GlassCard>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 14, background: 'rgba(141,198,63,0.95)', color: '#000', fontSize: 12, fontWeight: 800, zIndex: 100000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>,
    document.body
  )
}
