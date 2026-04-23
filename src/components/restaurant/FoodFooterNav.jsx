/**
 * FoodFooterNav — shared floating footer for entire food module
 * Shows on landing, browse, menu, deals — same design everywhere
 */
import { createPortal } from 'react-dom'

const btnStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', minWidth: 48 }
const labelStyle = { fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }

export default function FoodFooterNav({ onHome, onDeals, onCart, onMyFood, onVendorDash, isVendor, activeTab }) {
  return createPortal(
    <div style={{
      position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      left: 16, right: 16, zIndex: 9500,
      background: 'rgba(10, 10, 14, 0.8)',
      backdropFilter: 'blur(20px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
      border: '1px solid rgba(141,198,63,0.12)',
      borderRadius: 28,
      padding: '12px 7px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {/* Home */}
        <button onClick={onHome} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#8DC63F' : '#fff'} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'home' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Home</span>
        </button>

        {/* Deals */}
        <button onClick={onDeals} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'deals' ? '#FACC15' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'deals' ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>Deals</span>
        </button>

        {/* My Food */}
        <button onClick={onMyFood} style={btnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'myfood' ? '#8DC63F' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
          <span style={{ ...labelStyle, color: activeTab === 'myfood' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>My Food</span>
        </button>

        {/* Vendor Dashboard */}
        {isVendor && (
          <button onClick={onVendorDash} style={btnStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'vendor' ? '#8DC63F' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span style={{ ...labelStyle, color: activeTab === 'vendor' ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>Vendor</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
