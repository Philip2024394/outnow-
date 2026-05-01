/**
 * WebsiteFooter — Property website footer with links + branding.
 */

const LOGO = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

const LINKS = {
  Property: ['For Sale', 'For Rent', 'New Projects', 'Kos', 'Villa', 'Land'],
  Services: ['KPR Calculator', 'Property Valuation', 'Agent Directory', 'Deal Hunt'],
  Company: ['About INDOO', 'Contact Us', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

export default function WebsiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="ws-container" style={{ padding: '48px 48px 24px', display: 'flex', gap: 48 }}>

        {/* Brand */}
        <div style={{ flex: 1.5, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <img src={LOGO} alt="Indoo" style={{ height: 28 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>PROPERTY</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            Indonesia's most complete property platform. Buy, sell, rent — houses, villas, apartments, kos, land, and more.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(141,198,63,0.1)', border: '1px solid rgba(141,198,63,0.2)', color: '#8DC63F', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>📱 Android</button>
            <button style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🍎 iOS</button>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([title, links]) => (
          <div key={title} style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 14 }}>{title}</div>
            {links.map(link => (
              <a key={link} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#8DC63F'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >{link}</a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="ws-container" style={{ padding: '16px 48px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>© 2026 INDOO Indonesia. All rights reserved.</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>indoo.id</span>
      </div>
    </footer>
  )
}
