import { useState, useMemo } from 'react'
import styles from './ProductDetailSheet.module.css'

function formatIDR(val) {
  const n = parseFloat(val) || 0
  if (n === 0) return '—'
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return Number.isInteger(jt) ? `${jt}jt` : `${jt.toFixed(1).replace('.', ',')}jt`
  }
  if (n >= 1_000) return `${n.toLocaleString('id-ID')}rp`
  return `${n}rp`
}

function getLabel(opt) { return typeof opt === 'object' ? opt.label : opt }
function getImage(opt) { return typeof opt === 'object' ? opt.image ?? null : null }

export default function ProductDetailSheet({ product, onClose, sellerWa, sellerName, sellerId, onAddToCart, onRemoveFromCart, getCartQty, totalCartQty, onOpenCart, onOrderViaChat }) {
  const [selected,    setSelected]    = useState({})
  const [showOverlay, setShowOverlay] = useState(true)
  const [showSpecs,   setShowSpecs]   = useState(false)

  const activeImage = useMemo(() => {
    if (!product) return null
    const colorVariants = product.variants?.color
    if (colorVariants) {
      const selectedLabel = selected.color ?? getLabel(colorVariants[0])
      const match = colorVariants.find(v => getLabel(v) === selectedLabel)
      if (match && getImage(match)) return getImage(match)
    }
    return product.image ?? null
  }, [selected.color, product])

  if (!product) return null

  const variantKeys = product.variants ? Object.keys(product.variants) : []

  // Build a stable variant string for cart keying
  const variantStr = variantKeys.length
    ? variantKeys.map(k => selected[k] ?? getLabel(product.variants[k][0])).join(' / ')
    : null

  const cartQty = getCartQty ? getCartQty(product.id, variantStr) : 0

  function handleAddToCart() {
    if (onAddToCart) onAddToCart(product, variantStr)
  }

  const waLink = sellerWa
    ? (() => {
        const variantText = variantKeys
          .map(k => {
            const opts = product.variants[k]
            const sel  = selected[k] ?? getLabel(opts[0])
            return `${k}: ${sel}`
          })
          .join(', ')
        const msg = `Hi, I'm interested in *${product.name}*${variantText ? ` (${variantText})` : ''} from ${sellerName ?? 'your store'} on ECHO Shop!`
        return `https://wa.me/${sellerWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`
      })()
    : null

  function handleSpecsBtn() {
    if (!showOverlay) {
      setShowOverlay(true)
      setShowSpecs(true)
    } else {
      setShowSpecs(v => !v)
    }
  }

  const hasSpecs = product.specs && Object.keys(product.specs).length > 0

  return (
    <div className={styles.page}>

      {/* Background image */}
      {activeImage
        ? <img key={activeImage} src={activeImage} alt={product.name} className={styles.bgImg} />
        : <div className={styles.bgFallback}><span className={styles.bgEmoji}>📦</span></div>
      }

      {/* Gradient — hidden when overlay is off so image shows fully */}
      <div className={[styles.bgGrad, showOverlay ? '' : styles.bgGradHidden].join(' ')} />

      {/* Watermark stamp */}
      {product.watermark && (
        <div className={styles.watermarkOverlay}>
          <span className={styles.watermarkText}>{product.watermark.toUpperCase()}</span>
        </div>
      )}

      {/* Back button */}
      <button className={styles.backBtn} onClick={onClose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* Floating side panel — top-right */}
      <div className={styles.sidePanel}>
        {/* Cart count — tap to open cart */}
        {totalCartQty > 0 && (
          <button className={styles.sidePanelCartBtn} onClick={onOpenCart} aria-label="View cart">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className={styles.sidePanelCartCount}>{totalCartQty}</span>
          </button>
        )}

        {/* Eye — toggle overlay */}
        <button
          className={[styles.sidePanelBtn, showOverlay ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={() => { setShowOverlay(v => !v); if (showSpecs) setShowSpecs(false) }}
          aria-label="Toggle text overlay"
          title={showOverlay ? 'Hide info' : 'Show info'}
        >
          {showOverlay
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          }
        </button>

        {/* Specs / list icon */}
        <button
          className={[styles.sidePanelBtn, showOverlay && showSpecs ? styles.sidePanelBtnActive : ''].join(' ')}
          onClick={handleSpecsBtn}
          aria-label="Product specifications"
          title="Specifications"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6"  x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6"  x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Bottom overlay */}
      <div className={[styles.overlay, showOverlay ? '' : styles.overlayHidden].join(' ')}>

        {showSpecs ? (
          /* ── Specs view ── */
          <>
            <div className={styles.specsHeader}>
              <span className={styles.specsTitle}>Specifications</span>
              <button className={styles.specsBackBtn} onClick={() => setShowSpecs(false)}>
                ← Details
              </button>
            </div>

            {hasSpecs ? (
              <div className={styles.specsList}>
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className={styles.specRow}>
                    <span className={styles.specKey}>{k}</span>
                    <span className={styles.specVal}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSpecs}>No specifications listed for this product.</p>
            )}

            <div className={styles.ctaRow}>
              {onOrderViaChat
                ? <button
                    className={onAddToCart ? styles.orderBtnSecondary : styles.orderBtn}
                    onClick={() => onOrderViaChat({ product, variantStr, qty: Math.max(cartQty, 1), sellerName, sellerId })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Order via Chat
                  </button>
                : waLink
                  ? <a href={waLink} target="_blank" rel="noopener noreferrer" className={onAddToCart ? styles.orderBtnSecondary : styles.orderBtn}>
                      Order via WhatsApp
                    </a>
                  : <button className={styles.orderBtnDisabled} disabled>
                      💬 Contact seller to order
                    </button>
              }
              {onAddToCart && (
                cartQty > 0 ? (
                  <div className={styles.qtyCompact}>
                    <button className={styles.qtyCompactBtn} onClick={() => onRemoveFromCart(product.id, variantStr)}>−</button>
                    <span className={styles.qtyCompactNum}>{cartQty}</span>
                    <button className={styles.qtyCompactBtn} onClick={handleAddToCart}>+</button>
                  </div>
                ) : (
                  <button
                    className={styles.addCartSmall}
                    onClick={handleAddToCart}
                    disabled={(product.stock ?? 0) === 0}
                  >Add Cart</button>
                )
              )}
            </div>
          </>
        ) : (
          /* ── Details view ── */
          <>
            {/* NEW badge + category */}
            <div className={styles.badgeRow}>
              {product.isNew && <span className={styles.newBadge}>NEW</span>}
              {product.category && <span className={styles.category}>{product.category}</span>}
            </div>

            <h2 className={styles.name}>{product.name}</h2>
            <div className={styles.price}>{formatIDR(product.price)}</div>

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            {/* Variants */}
            {variantKeys.map(key => {
              const opts = product.variants[key]
              const selectedLabel = selected[key] ?? getLabel(opts[0])
              return (
                <div key={key} className={styles.variantGroup}>
                  <div className={styles.variantLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {selected[key] && <span className={styles.variantSelected}> — {selected[key]}</span>}
                  </div>
                  <div className={styles.variantOptions}>
                    {opts.map(opt => {
                      const label    = getLabel(opt)
                      const img      = getImage(opt)
                      const isActive = selectedLabel === label

                      if (key === 'color' && img) {
                        return (
                          <button
                            key={label}
                            className={styles.swatchBtn}
                            onClick={() => setSelected(prev => ({ ...prev, [key]: label }))}
                            title={label}
                            aria-label={label}
                          >
                            <span
                              className={[styles.swatchDot, isActive ? styles.swatchDotActive : ''].join(' ')}
                              style={{ backgroundImage: `url(${img})` }}
                            />
                          </button>
                        )
                      }

                      return (
                        <button
                          key={label}
                          className={[styles.variantBtn, isActive ? styles.variantBtnActive : ''].join(' ')}
                          onClick={() => setSelected(prev => ({ ...prev, [key]: label }))}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Stock */}
            <div className={styles.stockRow}>
              <span className={styles.stockDot} style={{ background: (product.stock ?? 0) > 0 ? '#34D399' : '#EF4444' }} />
              <span className={styles.stockText}>
                {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className={styles.ctaRow}>
              {onOrderViaChat
                ? <button
                    className={onAddToCart ? styles.orderBtnSecondary : styles.orderBtn}
                    onClick={() => onOrderViaChat({ product, variantStr, qty: Math.max(cartQty, 1), sellerName, sellerId })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Order via Chat
                  </button>
                : waLink
                  ? <a href={waLink} target="_blank" rel="noopener noreferrer" className={onAddToCart ? styles.orderBtnSecondary : styles.orderBtn}>
                      Order via WhatsApp
                    </a>
                  : <button className={styles.orderBtnDisabled} disabled>
                      💬 Contact seller to order
                    </button>
              }
              {onAddToCart && (
                cartQty > 0 ? (
                  <div className={styles.qtyCompact}>
                    <button className={styles.qtyCompactBtn} onClick={() => onRemoveFromCart(product.id, variantStr)}>−</button>
                    <span className={styles.qtyCompactNum}>{cartQty}</span>
                    <button className={styles.qtyCompactBtn} onClick={handleAddToCart}>+</button>
                  </div>
                ) : (
                  <button
                    className={styles.addCartSmall}
                    onClick={handleAddToCart}
                    disabled={(product.stock ?? 0) === 0}
                  >Add Cart</button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
