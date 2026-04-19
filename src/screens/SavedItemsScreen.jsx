import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const STORAGE_KEY = 'indoo_saved_items'

/* ── Utility functions (exported) ── */

export function getSavedItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

export function saveItem(listing) {
  const items = getSavedItems()
  if (items.some(i => i.id === listing.id)) return
  items.unshift({ ...listing, savedAt: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function removeSavedItem(id) {
  const items = getSavedItems().filter(i => i.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  return items
}

export function isItemSaved(id) {
  return getSavedItems().some(i => i.id === id)
}

/* ── Screen component ── */

export default function SavedItemsScreen({ open, onClose }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (open) setItems(getSavedItems())
  }, [open])

  if (!open) return null

  const handleRemove = (id) => {
    const updated = removeSavedItem(id)
    setItems(updated)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 50%, #0d0d0f 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
            {/* DEV page badge */}
      <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 99999, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000', boxShadow: '0 2px 8px rgba(141,198,63,0.4)' }}>10</div><span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(141,198,63,0.6)', letterSpacing: '0.03em' }}>SAVED</span></div>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.3), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>❤️</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Saved Items</span>
          {items.length > 0 && (
            <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(141,198,63,0.12)', fontSize: 10, fontWeight: 800, color: '#8DC63F' }}>{items.length}</span>
          )}
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)', marginTop: 40 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.7 }}>🤍</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No Saved Items</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Tap the heart on any listing to save it here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)', position: 'relative' }}>
                {/* Green glow line */}
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(141,198,63,0.2), transparent)', pointerEvents: 'none', zIndex: 2 }} />

                {/* 16:9 Image */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'rgba(255,255,255,0.03)' }}>
                  {item.image ? (
                    <img src={item.image} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,255,255,0.08)' }}>📷</div>
                  )}
                  {/* Gradient overlay at bottom of image */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', pointerEvents: 'none' }} />

                  {/* Category badge top-left */}
                  {item.category && (
                    <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, background: 'rgba(141,198,63,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#fff', boxShadow: '0 2px 8px rgba(141,198,63,0.3)', zIndex: 3 }}>{item.category}</div>
                  )}

                  {/* Heart (remove) button top-right */}
                  <button onClick={() => handleRemove(item.id)} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', color: '#EF4444', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, lineHeight: 1, padding: 0 }} title="Unsave">♥</button>
                </div>

                {/* Info below image */}
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled'}</div>
                  {item.city && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{item.city}</div>}
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#8DC63F' }}>{item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
