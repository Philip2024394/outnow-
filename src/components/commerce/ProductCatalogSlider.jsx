import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DEMO_PRODUCTS } from '@/services/commerceService'
import ProductDetailSheet from './ProductDetailSheet'
import HanggerCartPanel from './HanggerCartPanel'
import HanggerCartSheet from './HanggerCartSheet'
import SellerTrustCard from './SellerTrustCard'
import FlashSalePage from './FlashSalePage'
import styles from './ProductCatalogSlider.module.css'

// ── IDR price formatter ───────────────────────────────────────────────────────
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

// Group products by category, preserving order of first appearance
function groupByCategory(items) {
  const map = new Map()
  items.forEach(p => {
    const key = p.category?.trim() || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  })
  return map
}

// ── Cart persistence ──────────────────────────────────────────────────────────
const CART_TTL = 24 * 60 * 60 * 1000 // 24 hours

function loadCart(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const { items, ts } = JSON.parse(raw)
    if (Date.now() - ts > CART_TTL) { localStorage.removeItem(key); return [] }
    return items ?? []
  } catch { return [] }
}

function saveCart(key, items) {
  try { localStorage.setItem(key, JSON.stringify({ items, ts: Date.now() })) } catch { /* noop */ }
}

export default function ProductCatalogSlider({
  open, onClose,
  products = DEMO_PRODUCTS,
  sellerWa, sellerName = 'Products',
  onGiftSelect = null,    // gift mode — product tap opens GiftOrderSheet
  giftRecipientName = null,
  onWishlistAdd = null,   // wishlist mode — product tap pins to wishlist
  onMakeOffer = null,     // make an offer — sends offer card to chat
  seller = null,          // seller data for trust card
}) {
  const cartKey = `hangger_cart_${sellerWa || sellerName || 'default'}`

  const [detailProduct, setDetailProduct] = useState(null)
  const [query,         setQuery]         = useState('')
  const [cart,          setCart]          = useState(() => loadCart(cartKey))
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [trustCardOpen, setTrustCardOpen] = useState(false)
  const [flashSaleOpen, setFlashSaleOpen] = useState(false)

  // Persist cart on every change
  useEffect(() => { saveCart(cartKey, cart) }, [cart, cartKey])

  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  const addToCart = useCallback((product, variantStr) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id && i.variant === variantStr)
      if (existing) {
        return prev.map(i =>
          i.id === product.id && i.variant === variantStr
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }
      return [...prev, {
        id:      product.id,
        name:    product.name,
        price:   product.price,
        image:   product.image ?? null,
        variant: variantStr || null,
        qty:     1,
      }]
    })
  }, [])

  const updateQty = useCallback((id, variant, qty) => {
    setCart(prev =>
      qty <= 0
        ? prev.filter(i => !(i.id === id && i.variant === variant))
        : prev.map(i => i.id === id && i.variant === variant ? { ...i, qty } : i)
    )
  }, [])

  const removeFromCart = useCallback((id, variantStr) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id && i.variant === variantStr)
      if (!item) return prev
      return item.qty <= 1
        ? prev.filter(i => !(i.id === id && i.variant === variantStr))
        : prev.map(i => i.id === id && i.variant === variantStr ? { ...i, qty: i.qty - 1 } : i)
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const getCartQty = useCallback((id, variantStr) => {
    const item = cart.find(i => i.id === id && i.variant === variantStr)
    return item?.qty ?? 0
  }, [cart])

  const filtered = query.trim()
    ? products.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      )
    : products

  const grouped = groupByCategory(filtered)

  return createPortal(
    <>
      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} />}

      {/* Slider panel */}
      <div className={[styles.slider, open ? styles.sliderOpen : ''].join(' ')}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.echo}>Indoo Market</span>
            <span className={styles.catalog}>{sellerName}</span>
          </div>

          {/* Seller trust card button */}
          <button className={styles.trustBtn} onClick={() => setTrustCardOpen(true)} aria-label="Seller info">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>

          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Mode banners */}
        {onWishlistAdd && (
          <div className={styles.wishlistModeBanner}>
            📌 Tap a product to pin it to your wishlist
          </div>
        )}
        {onGiftSelect && !onWishlistAdd && (
          <div className={styles.giftModeBanner}>
            🛍️ Select a product to gift to <strong>{giftRecipientName ?? 'them'}</strong>
          </div>
        )}

        {/* Search bar */}
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        <div className={styles.body}>
          {/* Flash Sale banner — shown when seller has active flash sales */}
          {products.some(p => p.flashSale?.active && p.flashSale.endsAt > Date.now()) && (
            <button className={styles.flashBanner} onClick={() => setFlashSaleOpen(true)}>
              <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2015,%202026,%2008_25_21%20PM.png" alt="Flash Sale" className={styles.flashBannerImg} />
            </button>
          )}

          {/* Product groups */}
          {filtered.length === 0 ? (
            <div className={styles.emptyGrid}>
              {query ? `No results for "${query}"` : 'No products listed yet.'}
            </div>
          ) : (
            [...grouped.entries()].map(([category, items]) => (
              <div key={category} className={styles.categoryGroup}>
                <div className={styles.categoryHeader}>{category}</div>
                <div className={styles.grid}>
                  {items.map(p => (
                    <div
                      key={p.id}
                      className={[styles.card, !p.active ? styles.cardInactive : '', onGiftSelect ? styles.cardGiftMode : ''].join(' ')}
                      onClick={() => onWishlistAdd ? onWishlistAdd(p) : onGiftSelect ? onGiftSelect(p) : setDetailProduct(p)}
                    >
                      <div className={styles.cardImgWrap}>
                        {p.image
                          ? <img src={p.image} alt={p.name} className={styles.cardImg} />
                          : <div className={styles.cardImgPlaceholder}>📦</div>
                        }
                        {p.isNew && <span className={styles.newBadge}>NEW</span>}
                        {p.flashSale?.active && p.flashSale.endsAt > Date.now() && (
                          <span className={styles.discountBadge}>-{p.flashSale.discountPercent}%</span>
                        )}
                      </div>
                      <div className={styles.cardInfo}>
                        {p.brand_name && (
                          <div className={styles.cardBrand}>{p.brand_name}</div>
                        )}
                        <div className={styles.cardName}>{p.name}</div>
                        <div className={styles.cardMeta}>
                          {p.flashSale?.active && p.flashSale.endsAt > Date.now() ? (
                            <>
                              <span className={styles.cardPriceSale}>{formatIDR(Math.round(p.price * (1 - p.flashSale.discountPercent / 100)))}</span>
                              <span className={styles.cardPriceOriginal}>{formatIDR(p.price)}</span>
                            </>
                          ) : (
                            <span className={styles.cardPrice}>{formatIDR(p.price)}</span>
                          )}
                          {p.condition && p.condition !== 'new' && (
                            <span className={styles.cardCondition}>{p.condition}</span>
                          )}
                        </div>
                        <div className={styles.cardTags}>
                          {p.dispatch_time && (
                            <span className={styles.cardDispatch}>{p.dispatch_time}</span>
                          )}
                          {p.deliveryPricing?.priceIncluded && (
                            <span className={styles.cardFreeDelivery}>Free delivery</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Cart panel — fixed top-right corner of the screen */}
      <HanggerCartPanel
        cart={cart}
        onUpdateQty={updateQty}
        onClearCart={clearCart}
        sellerName={sellerName}
        sellerWa={sellerWa}
        cartSheetOpen={cartModalOpen && totalQty > 0}
      />

      <ProductDetailSheet
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        sellerWa={sellerWa}
        sellerName={sellerName}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        getCartQty={getCartQty}
        totalCartQty={totalQty}
        onOpenCart={() => { setDetailProduct(null); setCartModalOpen(true) }}
        onMakeOffer={onMakeOffer}
      />

      <HanggerCartSheet
        open={cartModalOpen && totalQty > 0}
        onClose={() => setCartModalOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onClearCart={clearCart}
        sellerName={sellerName}
        sellerWa={sellerWa}
      />

      <FlashSalePage
        open={flashSaleOpen}
        onClose={() => setFlashSaleOpen(false)}
        allProducts={products}
        onMakeOffer={onMakeOffer}
      />

      <SellerTrustCard
        open={trustCardOpen}
        onClose={() => setTrustCardOpen(false)}
        seller={seller ?? {
          brandName: sellerName,
          bizWhatsapp: sellerWa,
          businessType: 'Seller',
        }}
      />
    </>,
    document.body
  )
}
