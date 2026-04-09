import { useState, useEffect } from 'react'
import { fetchProducts, DEMO_PRODUCTS } from '@/services/commerceService'
import ProductCatalogSlider from './ProductCatalogSlider'
import styles from './SellerProfileSheet.module.css'

export default function SellerProfileSheet({ seller, onClose }) {
  const [products,     setProducts]     = useState(DEMO_PRODUCTS.slice(0, 9))
  const [catalogOpen,  setCatalogOpen]  = useState(false)
  const [hoursOpen,    setHoursOpen]    = useState(false)
  const [contactOpen,  setContactOpen]  = useState(false)

  useEffect(() => {
    if (!seller?.id || seller.id.startsWith('d')) return
    fetchProducts(seller.id).then(p => setProducts(p))
  }, [seller?.id])

  if (!seller) return null

  const waLink = seller.bizWhatsapp
    ? `https://wa.me/${seller.bizWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I found your store on ECHO Shop!')}`
    : null

  const openTime  = seller.openTime  ?? '9:00 AM'
  const closeTime = seller.closeTime ?? '6:00 PM'

  return (
    <div className={styles.page}>

      {/* Full-height background image */}
      {seller.photoURL
        ? <img src={seller.photoURL} alt="" className={styles.bgImg} />
        : <div className={styles.bgFallback}>
            <span className={styles.bgInitial}>{(seller.brandName ?? seller.displayName)[0]}</span>
          </div>
      }
      <div className={styles.bgGrad} />

      {/* Top bar — logo left, back button right */}
      <div className={styles.topBar}>
        <div className={styles.hanggerLogoWrap}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/Hangger%20Market%20logo%20design.png"
            alt="Hangger Market"
            className={styles.hanggerLogoImg}
          />
        </div>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </div>


      {/* Opening hours card (toggled by clock button) */}
      {hoursOpen && (
        <div className={styles.hoursCard}>
          <span className={styles.hoursTitle}>Opening Hours</span>
          <span className={styles.hoursTime}>{openTime} — {closeTime}</span>
        </div>
      )}

      {/* Floating right side panel */}
      <div className={styles.sidePanel}>
        {/* Catalogue round button */}
        <button className={styles.sidePanelBtn} onClick={() => setCatalogOpen(true)} aria-label="View products">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </button>

        {/* Opening hours toggle */}
        <button
          className={[styles.sidePanelBtn, hoursOpen ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => setHoursOpen(v => !v)}
          aria-label="Opening hours"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
      </div>

      {/* Bottom overlay — brand name + chips + bio + contact btn */}
      <div className={styles.bottomOverlay}>
        <div className={styles.brandName}>{seller.brandName || seller.displayName}</div>
        {seller.brandName && seller.displayName !== seller.brandName && (
          <div className={styles.ownerName}>by {seller.displayName}</div>
        )}
        {seller.city && (
          <p className={styles.locationText}>
            📍 {seller.city}{seller.country ? `, ${seller.country}` : ''}
          </p>
        )}
        {seller.bio && (
          <p className={styles.bio}>{seller.bio.slice(0, 350)}</p>
        )}

        {/* Contact button */}
        <button className={styles.contactRowBtn} onClick={() => setContactOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Contact &amp; Socials
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto'}}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Contact slide-up sheet */}
      {contactOpen && (
        <div className={styles.contactBackdrop} onClick={() => setContactOpen(false)}>
          <div className={styles.contactSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.contactHandle} />
            <div className={styles.contactTitle}>{seller.brandName || seller.displayName}</div>
            <div className={styles.contactSub}>Choose how to connect</div>

            <div className={styles.contactList}>

              {/* WhatsApp */}
              {waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.contactItemWa}>
                  <span className={styles.contactIcon} style={{background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.15)'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel} style={{color:'#000'}}>WhatsApp</span>
                    <span className={styles.contactItemSub} style={{color:'rgba(0,0,0,0.55)'}}>Tap to message us now</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              ) : (
                <div className={[styles.contactItem, styles.contactItemDisabled].join(' ')}>
                  <span className={styles.contactIcon} style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel} style={{color:'rgba(255,255,255,0.25)'}}>WhatsApp</span>
                    <span className={styles.contactItemSub}>Not listed</span>
                  </span>
                </div>
              )}

              {/* Instagram */}
              {seller.instagram && (
                <a href={`https://instagram.com/${seller.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{background:'rgba(228,64,95,0.12)', border:'1px solid rgba(228,64,95,0.3)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E4405F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="#E4405F"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel}>Instagram</span>
                    <span className={styles.contactItemSub}>@{seller.instagram}</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              )}

              {/* TikTok */}
              {seller.tiktok && (
                <a href={`https://tiktok.com/@${seller.tiktok}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel}>TikTok</span>
                    <span className={styles.contactItemSub}>@{seller.tiktok}</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              )}

              {/* Facebook */}
              {seller.facebook && (
                <a href={`https://facebook.com/${seller.facebook}`} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{background:'rgba(24,119,242,0.12)', border:'1px solid rgba(24,119,242,0.3)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel}>Facebook</span>
                    <span className={styles.contactItemSub}>{seller.facebook}</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              )}

              {/* Website */}
              {seller.website && (
                <a href={seller.website} target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </span>
                  <span className={styles.contactItemText}>
                    <span className={styles.contactItemLabel}>Website</span>
                    <span className={styles.contactItemSub}>{seller.website.replace(/^https?:\/\//, '')}</span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              )}

            </div>

            <button className={styles.contactDismiss} onClick={() => setContactOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Product catalog slider */}
      <ProductCatalogSlider
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        products={products}
        sellerWa={seller.bizWhatsapp}
        sellerName={seller.brandName || seller.displayName}
      />
    </div>
  )
}
