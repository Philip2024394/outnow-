import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const SETTINGS_KEY = 'indoo_settings'

const defaultSettings = {
  notifications: { bookingAlerts: true, chatMessages: true, promotions: false },
  language: 'id',
  privacy: { showProfile: true, shareLocation: true },
}

function loadSettings() {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { ...defaultSettings } }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

/* ── Green Glow Line ── */
function GlowLine() {
  return (
    <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />
  )
}

/* ── Toggle Switch (pill-shaped, green glow when on) ── */
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 48, height: 26, borderRadius: 13, border: 'none',
      background: on ? '#8DC63F' : 'rgba(255,255,255,0.1)',
      position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'all 0.3s ease',
      boxShadow: on ? '0 0 12px rgba(141,198,63,0.35)' : 'none',
      outline: 'none',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 25 : 3,
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

/* ── Glass Section Card ── */
function Section({ title, children, danger }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      <div style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: danger ? '1.5px solid rgba(239,68,68,0.15)' : '1.5px solid rgba(141,198,63,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)',
        padding: '6px 18px',
      }}>
        <GlowLine />
        {children}
      </div>
    </div>
  )
}

/* ── Setting Row ── */
function Row({ label, children, noBorder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: noBorder ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      {children}
    </div>
  )
}

/* ── Language Pill ── */
function LangPill({ label, value, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(value)} style={{
      padding: '10px 18px', borderRadius: 14,
      background: selected ? 'rgba(141,198,63,0.12)' : 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: `1.5px solid ${selected ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.06)'}`,
      color: selected ? '#8DC63F' : 'rgba(255,255,255,0.4)',
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
      boxShadow: selected ? '0 0 14px rgba(141,198,63,0.2)' : 'none',
      transition: 'all 0.3s ease',
      outline: 'none',
    }}>
      {label}
    </button>
  )
}

export default function SettingsScreen({ open, onClose }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [profile, setProfile] = useState({ name: '', city: '' })

  useEffect(() => {
    if (open) {
      setSettings(loadSettings())
      try {
        const p = JSON.parse(localStorage.getItem('indoo_profile') || '{}')
        const owner = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}')
        setProfile({
          name: p.name || owner.name || 'User',
          city: p.city || owner.city || '',
        })
      } catch {
        setProfile({ name: 'User', city: '' })
      }
    }
  }, [open])

  if (!open) return null

  const update = (path, value) => {
    setSettings(prev => {
      const next = { ...prev }
      if (path.includes('.')) {
        const [section, key] = path.split('.')
        next[section] = { ...next[section], [key]: value }
      } else {
        next[path] = value
      }
      saveSettings(next)
      return next
    })
  }

  const handleDeleteAccount = () => {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('indoo_')) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setShowDeleteConfirm(false)
    onClose()
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>13</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>SETTINGS</span></div>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Settings</span>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {/* Account */}
        <Section title="Account">
          <Row label="Name" noBorder={!profile.city}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{profile.name}</span>
          </Row>
          {profile.city && (
            <Row label="City" noBorder>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{profile.city}</span>
            </Row>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row label="Booking Alerts">
            <Toggle on={settings.notifications?.bookingAlerts ?? true} onChange={v => update('notifications.bookingAlerts', v)} />
          </Row>
          <Row label="Chat Messages">
            <Toggle on={settings.notifications?.chatMessages ?? true} onChange={v => update('notifications.chatMessages', v)} />
          </Row>
          <Row label="Promotions" noBorder>
            <Toggle on={settings.notifications?.promotions ?? false} onChange={v => update('notifications.promotions', v)} />
          </Row>
        </Section>

        {/* Language */}
        <Section title="Language">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0' }}>
            <LangPill label="Bahasa Indonesia" value="id" selected={settings.language === 'id'} onSelect={v => update('language', v)} />
            <LangPill label="English" value="en" selected={settings.language === 'en'} onSelect={v => update('language', v)} />
            <LangPill label="中文" value="zh" selected={settings.language === 'zh'} onSelect={v => update('language', v)} />
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <Row label="Show Profile to Others">
            <Toggle on={settings.privacy?.showProfile ?? true} onChange={v => update('privacy.showProfile', v)} />
          </Row>
          <Row label="Share Location" noBorder>
            <Toggle on={settings.privacy?.shareLocation ?? true} onChange={v => update('privacy.shareLocation', v)} />
          </Row>
        </Section>

        {/* About */}
        <Section title="About">
          <Row label="App Version">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>v1.0</span>
          </Row>
          <Row label="Terms of Service">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', cursor: 'pointer' }}>View &rarr;</span>
          </Row>
          <Row label="Privacy Policy" noBorder>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8DC63F', cursor: 'pointer' }}>View &rarr;</span>
          </Row>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" danger>
          <div style={{ padding: '10px 0' }}>
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              width: '100%', padding: '13px', borderRadius: 14,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit', outline: 'none',
            }}>
              Delete Account
            </button>
          </div>
        </Section>

        <div style={{ height: 40 }} />
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            position: 'relative',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(239,68,68,0.15)',
            borderRadius: 20, padding: 28, maxWidth: 320, width: '100%', textAlign: 'center',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 14px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Delete Account?</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 22 }}>
              This will permanently delete all your data including profile, bookings, saved items, and chat history. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                flex: 1, padding: '13px', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} style={{
                flex: 1, padding: '13px', borderRadius: 14,
                background: '#EF4444', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
