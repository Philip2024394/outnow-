/**
 * PromoBannerPage — full-screen promo banners with swipeable cards
 * Shows active promotions, tap to copy code
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getPromoBanners } from '@/services/promoCodeService'

export default function PromoBannerPage({ onClose, onApplyCode }) {
  const banners = getPromoBanners()
  const [copiedCode, setCopiedCode] = useState(null)

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9950, background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px',
        background: '#0a0a0a', borderBottom: '2px solid #8DC63F',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, #fff, transparent)', animation: 'runningLight 3s linear infinite', opacity: 0.7 }} />
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', display: 'block' }}>Promo & Deals</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{banners.length} active promotions</span>
        </div>
      </div>

      {/* Banner cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {banners.map(banner => (
          <div key={banner.id} style={{
            borderRadius: 20, overflow: 'hidden', position: 'relative',
            border: `1.5px solid ${banner.color}33`,
            background: 'rgba(255,255,255,0.03)',
          }}>
            {/* Image */}
            <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
              <img src={banner.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #0a0a0a 0%, transparent 60%, ${banner.color}22 100%)` }} />
              {/* Discount badge */}
              <div style={{
                position: 'absolute', top: 14, left: 14, padding: '6px 14px', borderRadius: 12,
                background: banner.color, boxShadow: `0 0 12px ${banner.color}66`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#000' }}>PROMO</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 18px 18px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{banner.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '6px 0 14px', lineHeight: 1.4 }}>{banner.subtitle}</p>

              {/* Code + buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: banner.color, letterSpacing: '0.08em' }}>{banner.code}</span>
                </div>
                <button onClick={() => handleCopy(banner.code)} style={{
                  padding: '10px 16px', borderRadius: 12,
                  background: copiedCode === banner.code ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1.5px solid ${copiedCode === banner.code ? '#8DC63F' : 'rgba(255,255,255,0.1)'}`,
                  color: copiedCode === banner.code ? '#8DC63F' : '#fff',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}>
                  {copiedCode === banner.code ? 'Copied!' : 'Copy'}
                </button>
                {onApplyCode && (
                  <button onClick={() => onApplyCode(banner.code)} style={{
                    padding: '10px 16px', borderRadius: 12,
                    background: '#8DC63F', border: 'none',
                    color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Bottom padding for footer nav */}
        <div style={{ height: 80 }} />
      </div>

      <style>{`@keyframes runningLight { from { transform: translateX(-100%); } to { transform: translateX(450%); } }`}</style>
    </div>,
    document.body
  )
}
