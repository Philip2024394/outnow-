import { useState, useEffect } from 'react'
import { fetchProducts, DEMO_PRODUCTS } from '@/services/commerceService'
import { LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import ProductCatalogSlider from './ProductCatalogSlider'
import styles from './SellerProfileSheet.module.css'

function getCategoryLabel(lookingFor) {
  const opt = LOOKING_FOR_OPTIONS.find(o => o.value === lookingFor)
  return opt ? `${opt.emoji ?? '🏪'} ${opt.label}` : '🏪 Business'
}

export default function SellerProfileSheet({ seller, onClose }) {
  const [products,    setProducts]    = useState(DEMO_PRODUCTS.slice(0, 9))
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [hoursOpen,   setHoursOpen]   = useState(false)

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

  const hasSocials = seller.instagram || seller.facebook || seller.tiktok || seller.website

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

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        {seller.isOnline && <span className={styles.onlinePill}>● Online now</span>}
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

        {/* Opening hours toggle button */}
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

        {/* Social / website buttons */}
        {seller.instagram && (
          <a href={`https://instagram.com/${seller.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.sidePanelBtn} aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
            </svg>
          </a>
        )}
        {seller.tiktok && (
          <a href={`https://tiktok.com/@${seller.tiktok}`} target="_blank" rel="noopener noreferrer" className={styles.sidePanelBtn} aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
            </svg>
          </a>
        )}
        {seller.facebook && (
          <a href={`https://facebook.com/${seller.facebook}`} target="_blank" rel="noopener noreferrer" className={styles.sidePanelBtn} aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </a>
        )}
        {seller.website && (
          <a href={seller.website} target="_blank" rel="noopener noreferrer" className={styles.sidePanelBtn} aria-label="Website">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </a>
        )}
        {!hasSocials && (
          <button className={[styles.sidePanelBtn, styles.sidePanelBtnDim].join(' ')} disabled aria-label="No socials">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom overlay — brand name + chips + bio */}
      <div className={styles.bottomOverlay}>
        <div className={styles.brandName}>{seller.brandName || seller.displayName}</div>
        {seller.brandName && seller.displayName !== seller.brandName && (
          <div className={styles.ownerName}>by {seller.displayName}</div>
        )}
        <div className={styles.metaRow}>
          <span className={styles.categoryChip}>{getCategoryLabel(seller.lookingFor)}</span>
          {seller.city && (
            <span className={styles.cityChip}>📍 {seller.city}{seller.country ? `, ${seller.country}` : ''}</span>
          )}
          {seller.productCondition && seller.productCondition !== 'new' && (
            <span className={styles.conditionChip}>
              {seller.productCondition === 'used' ? '♻️ Used'
               : seller.productCondition === 'both' ? '🔀 New & Used'
               : '🔧 Refurbished'}
            </span>
          )}
        </div>
        {seller.bio && (
          <p className={styles.bio}>{seller.bio.slice(0, 350)}</p>
        )}
      </div>

      {/* Sticky footer — Contact Us CTA */}
      <div className={styles.footer}>
        {waLink
          ? <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.contactBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Contact Us on WhatsApp
            </a>
          : <button className={styles.contactBtnDisabled} disabled>
              💬 No WhatsApp listed
            </button>
        }
      </div>

      {/* Product catalog slider */}
      <ProductCatalogSlider
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        userId={seller.id}
        products={products}
        onProductsChange={setProducts}
      />
    </div>
  )
}
