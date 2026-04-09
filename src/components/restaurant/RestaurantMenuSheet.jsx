import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './RestaurantMenuSheet.module.css'
import WeeklyPromoSheet from './WeeklyPromoSheet'
import PaymentCard from './PaymentCard'

function fmtRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}` }

const EVENT_LABELS = {
  live_music:    '🎵 Live Music',
  birthday_setup:'🎂 Birthday Setup',
  private_room:  '🚪 Private Room',
  sound_system:  '🎤 Sound System',
  party_package: '🥂 Party Packages',
  wedding:       '💍 Weddings',
}

const CATEGORY_EMOJIS = {
  'Main':     '🍽',
  'Drinks':   '🥤',
  'Snacks':   '🍿',
  'Sides':    '🥗',
  'Desserts': '🧁',
  'Rice':     '🍚',
  'Noodles':  '🍜',
  'Grilled':  '🔥',
  'Seafood':  '🦐',
  'Breakfast':'🌅',
  'Soup':     '🍲',
  'Salad':    '🥗',
}

const CATEGORY_GRADIENTS = {
  'Main':     'linear-gradient(160deg, #1a0d00 0%, #0d0d0d 100%)',
  'Drinks':   'linear-gradient(160deg, #000d1a 0%, #0d0d0d 100%)',
  'Snacks':   'linear-gradient(160deg, #0d1a00 0%, #0d0d0d 100%)',
  'Sides':    'linear-gradient(160deg, #1a1500 0%, #0d0d0d 100%)',
  'Desserts': 'linear-gradient(160deg, #1a0015 0%, #0d0d0d 100%)',
}

function buildWhatsAppMessage(restaurant, cart, address, deliveryFare, maxPrepMin) {
  const lines = cart.map(i => {
    let line = `• ${i.name} × ${i.qty} — ${fmtRp(i.price * i.qty)}`
    if (i.prep_time_min) line += ` (${i.prep_time_min} min prep)`
    if (i.note?.trim())  line += `\n   📝 ${i.note.trim()}`
    return line
  })
  const foodTotal  = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const grandTotal = foodTotal + (deliveryFare ?? 0)
  const ref        = `#MAKAN_${Date.now().toString().slice(-8)}`
  const msg = [
    `🍽 *Order from ${restaurant.name}*`,
    `MAKAN by Hangger — ${ref}`,
    '———————————————',
    ...lines,
    '———————————————',
    maxPrepMin > 0 ? `⏱ Est. prep time: ${maxPrepMin} min` : '',
    `🍴 Food total: ${fmtRp(foodTotal)}`,
    deliveryFare != null ? `🛵 Est. delivery: ~${fmtRp(deliveryFare)}` : '🛵 Delivery: calculating',
    `💰 *Est. total: ~${fmtRp(grandTotal)}*`,
    address ? `📍 Deliver to: ${address}` : '',
  ].filter(Boolean).join('\n')
  return { msg, ref }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RestaurantMenuSheet({ restaurant, onClose }) {
  const items      = restaurant.menu_items ?? []
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const [cart,           setCart]           = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartExpanded,   setCartExpanded]   = useState(false)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [eventsOpen,     setEventsOpen]     = useState(false)
  const [socialsOpen,    setSocialsOpen]    = useState(false)
  const [address,        setAddress]        = useState('')
  const [showAddrInput,  setShowAddrInput]  = useState(false)
  const [editingNoteId,  setEditingNoteId]  = useState(null)
  const [promosOpen,     setPromosOpen]     = useState(false)
  const [locating,       setLocating]       = useState(false)
  const [paymentData,    setPaymentData]    = useState(null)  // { total, orderRef }

  const feedRef     = useRef(null)
  const itemRefs    = useRef([])
  const collapseRef = useRef(null)

  // ── Cart persistence — restore on mount, save on change, auto-clear 24 h ──
  const CART_KEY = `makan_cart_${restaurant.id}`
  const CART_TTL = 24 * 60 * 60 * 1000
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY))
      if (saved && Date.now() - saved.ts < CART_TTL) setCart(saved.cart)
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cart.length > 0) localStorage.setItem(CART_KEY, JSON.stringify({ cart, ts: Date.now() }))
    else localStorage.removeItem(CART_KEY)
  }, [cart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter items by active category
  const visibleItems = activeCategory
    ? items.filter(i => i.category === activeCategory)
    : items

  // ── Cart helpers ──
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex
        ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { ...item, qty: 1 }]
    })
    // Spring open + auto-collapse after 2.5s
    setCartExpanded(true)
    clearTimeout(collapseRef.current)
    collapseRef.current = setTimeout(() => setCartExpanded(false), 2500)
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id)
      return ex?.qty <= 1
        ? prev.filter(c => c.id !== id)
        : prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const updateNote = (id, note) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c))
  }

  const cartCount   = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const deliveryFare = restaurant.deliveryFare ?? null
  const grandTotal  = cartTotal + (deliveryFare ?? 0)
  const maxPrepMin  = cart.length > 0
    ? Math.max(...cart.map(i => i.prep_time_min ?? 0))
    : 0
  const qtyFor = (id) => cart.find(c => c.id === id)?.qty ?? 0

  // ── Jump to category in feed ──
  const jumpToCategory = useCallback((cat) => {
    setActiveCategory(cat)
    setDrawerOpen(false)
    // Small delay so filtered items render before scroll
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = 0
    }, 60)
  }, [])

  // ── GPS location → address ──
  const handleUseLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          setAddress(data.display_name ?? `${coords.latitude}, ${coords.longitude}`)
        } catch {
          setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`)
        } finally {
          setLocating(false)
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  // ── WhatsApp order ──
  const handleOrder = () => {
    if (!showAddrInput) { setShowAddrInput(true); return }
    const { msg, ref } = buildWhatsAppMessage(restaurant, cart, address, deliveryFare, maxPrepMin)
    window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
    // Record pending review — 1 per restaurant per 24 h
    const reviewKey = `makan_review_${restaurant.id}`
    const lastReview = JSON.parse(localStorage.getItem(reviewKey) || 'null')
    if (!lastReview || Date.now() - lastReview.ts > 24 * 60 * 60 * 1000) {
      localStorage.setItem(reviewKey, JSON.stringify({
        restaurantId:   restaurant.id,
        restaurantName: restaurant.name,
        orderRef:       ref,
        ts:             Date.now(),
        reviewed:       false,
      }))
      window.dispatchEvent(new CustomEvent('makan:review-pending', {
        detail: { restaurantId: restaurant.id, restaurantName: restaurant.name, orderRef: ref }
      }))
    }

    const hasBank = restaurant.bank_name && restaurant.bank_account_number && restaurant.bank_account_holder
    if (hasBank) {
      setPaymentData({ total: grandTotal, orderRef: ref })
      setCartExpanded(false)
    }
  }

  useEffect(() => () => clearTimeout(collapseRef.current), [])

  return (
    <div className={styles.screen}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{restaurant.name}</span>
          {activeCategory && (
            <button className={styles.clearCat} onClick={() => setActiveCategory(null)}>
              {activeCategory} · All items ×
            </button>
          )}
        </div>
      </div>

      {/* ── Growing cart badge (top-right) ── */}
      <div
        className={`${styles.cartBadge} ${cartExpanded ? styles.cartBadgeOpen : ''}`}
        onClick={() => {
          setCartExpanded(e => !e)
          clearTimeout(collapseRef.current)
        }}
      >
        {/* Icon row */}
        <div className={styles.cartBadgeTop}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
        </div>

        {/* Expanded: last 3 items + total + order */}
        {cartExpanded && cart.length > 0 && (
          <div className={styles.cartDropdown} onClick={e => e.stopPropagation()}>
            {cart.slice(-3).map(item => (
              <div key={item.id} className={styles.cartRowWrap}>
                <div className={styles.cartRow}>
                  <span className={styles.cartQty}>{item.qty}×</span>
                  <span className={styles.cartName}>{item.name}</span>
                  <span className={styles.cartPrice}>{fmtRp(item.price * item.qty)}</span>
                  <button
                    className={`${styles.cartEditBtn} ${editingNoteId === item.id ? styles.cartEditBtnActive : ''}`}
                    onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)}
                    title="Customise"
                  >✏</button>
                </div>

                {/* Existing note preview */}
                {item.note?.trim() && editingNoteId !== item.id && (
                  <span className={styles.cartNotePreview}>📝 {item.note}</span>
                )}

                {/* Inline note editor */}
                {editingNoteId === item.id && (
                  <div className={styles.cartNoteWrap}>
                    <input
                      className={styles.cartNoteInput}
                      placeholder="e.g. no chili, extra sauce, less rice…"
                      value={item.note ?? ''}
                      onChange={e => updateNote(item.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      maxLength={120}
                    />
                    <button
                      className={styles.cartNoteDone}
                      onClick={() => setEditingNoteId(null)}
                    >Done</button>
                  </div>
                )}
              </div>
            ))}
            {cart.length > 3 && (
              <span className={styles.cartMore}>+{cart.length - 3} more items</span>
            )}
            <div className={styles.cartDivider} />

            {/* Prep time */}
            {maxPrepMin > 0 && (
              <div className={styles.cartMeta}>
                <span className={styles.cartMetaIcon}>⏱</span>
                <span className={styles.cartMetaLabel}>Est. prep time</span>
                <span className={styles.cartMetaValue}>{maxPrepMin} min</span>
              </div>
            )}

            {/* Delivery fare — always shown */}
            <div className={styles.cartMeta}>
              <span className={styles.cartMetaIcon}>🛵</span>
              <span className={styles.cartMetaLabel}>Delivery</span>
              <span className={styles.cartMetaValue}>
                {deliveryFare !== null ? fmtRp(deliveryFare) : 'Calculating…'}
              </span>
            </div>

            <div className={styles.cartDivider} />

            <div className={styles.cartTotal}>
              <span>Total est.</span>
              <span style={{ color: '#F59E0B' }}>
                {deliveryFare !== null ? fmtRp(grandTotal) : `${fmtRp(cartTotal)} + delivery`}
              </span>
            </div>

            {showAddrInput && (
              <div className={styles.addrWrap} onClick={e => e.stopPropagation()}>
                <input
                  className={styles.addrInput}
                  placeholder="📍 Your delivery address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  autoFocus
                />
                <button
                  className={styles.locateBtn}
                  onClick={handleUseLocation}
                  disabled={locating}
                  title="Use my location"
                >
                  {locating ? '…' : '🎯'}
                </button>
              </div>
            )}

            <button className={styles.orderBtn} onClick={handleOrder}>
              {showAddrInput ? '📲 Send Order via WhatsApp' : 'Order Now →'}
            </button>
          </div>
        )}

        {cartExpanded && cart.length === 0 && (
          <div className={styles.cartEmpty}>Cart is empty</div>
        )}
      </div>

      {/* ── Right floating panel ── */}
      <div className={styles.floatingPanel}>
        {/* Promos */}
        <button
          className={styles.panelBtn}
          onClick={() => setPromosOpen(true)}
          title="Weekly deals"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className={styles.panelLabel}>Deals</span>
        </button>

        {/* Categories */}
        <button
          className={styles.panelBtn}
          onClick={() => setDrawerOpen(true)}
          title="Browse categories"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span className={styles.panelLabel}>Menu</span>
        </button>

        {/* Events */}
        {(restaurant.seating_capacity || restaurant.catering_available || restaurant.event_features?.length > 0) && (
          <button
            className={styles.panelBtn}
            onClick={() => setEventsOpen(true)}
            title="Events & venue"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className={styles.panelLabel}>Events</span>
          </button>
        )}

        {/* Socials */}
        {(restaurant.instagram || restaurant.tiktok || restaurant.facebook) && (
          <button
            className={styles.panelBtn}
            onClick={() => setSocialsOpen(true)}
            title="Social media"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className={styles.panelLabel}>Follow</span>
          </button>
        )}
      </div>

      {/* ── Full-screen snap-scroll menu feed ── */}
      <div className={styles.feed} ref={feedRef}>
        {visibleItems.length === 0 ? (
          <div className={styles.emptyFeed}>No items in this category</div>
        ) : (
          visibleItems.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={qtyFor(item.id)}
              onAdd={() => addToCart(item)}
              onRemove={() => removeFromCart(item.id)}
              itemRef={el => { itemRefs.current[i] = el }}
            />
          ))
        )}
      </div>

      {/* ── Category floating grid (left side) ── */}
      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawerGrid} onClick={e => e.stopPropagation()}>
            {/* All items */}
            <button
              className={`${styles.drawerCat} ${!activeCategory ? styles.drawerCatActive : ''}`}
              onClick={() => jumpToCategory(null)}
            >
              <span className={styles.drawerCatEmoji}>🍽</span>
              <span className={styles.drawerCatName}>All</span>
              <span className={styles.drawerCatCount}>{items.length}</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.drawerCat} ${activeCategory === cat ? styles.drawerCatActive : ''}`}
                onClick={() => jumpToCategory(cat)}
              >
                <span className={styles.drawerCatEmoji}>{CATEGORY_EMOJIS[cat] ?? '🍽'}</span>
                <span className={styles.drawerCatName}>{cat}</span>
                <span className={styles.drawerCatCount}>{items.filter(i => i.category === cat).length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Events / venue left drawer ── */}
      {eventsOpen && (
        <div className={styles.panelBackdrop} onClick={() => setEventsOpen(false)}>
          <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
            <h3 className={styles.infoPanelTitle}>Events & Venue</h3>
            <p className={styles.infoPanelSub}>{restaurant.name}</p>

            {restaurant.seating_capacity && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🪑</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Seating Capacity</span>
                  <span className={styles.infoValue}>Up to {restaurant.seating_capacity} guests</span>
                </div>
              </div>
            )}

            {restaurant.catering_available && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🍽</span>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Catering</span>
                  <span className={styles.infoValue}>Available for external events</span>
                </div>
              </div>
            )}

            {restaurant.event_features?.map(f => (
              <div key={f} className={styles.infoRow}>
                <span className={styles.infoIcon}>{EVENT_LABELS[f]?.split(' ')[0] ?? '✓'}</span>
                <div className={styles.infoText}>
                  <span className={styles.infoValue}>{EVENT_LABELS[f]?.split(' ').slice(1).join(' ') ?? f}</span>
                </div>
              </div>
            ))}

            <button
              className={styles.eventEnquiryBtn}
              onClick={() => {
                const msg = `Hi ${restaurant.name}, I'd like to enquire about hosting an event at your venue. Please send me details about availability and packages.`
                window.open(`https://wa.me/${restaurant.phone}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
            >
              📲 Enquire via WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ── Weekly promos sheet ── */}
      {promosOpen && <WeeklyPromoSheet onClose={() => setPromosOpen(false)} restaurant={restaurant} />}

      {/* ── Payment card ── */}
      {paymentData && (
        <PaymentCard
          restaurant={restaurant}
          total={paymentData.total}
          orderRef={paymentData.orderRef}
          onDone={() => setPaymentData(null)}
        />
      )}

      {/* ── Socials left drawer ── */}
      {socialsOpen && (
        <div className={styles.panelBackdrop} onClick={() => setSocialsOpen(false)}>
          <div className={styles.infoPanel} onClick={e => e.stopPropagation()}>
            <h3 className={styles.infoPanelTitle}>Follow Us</h3>
            <p className={styles.infoPanelSub}>{restaurant.name}</p>

            {restaurant.instagram && (
              <a className={styles.socialLink} href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>📸</span>
                <span className={styles.socialName}>Instagram</span>
                <span className={styles.socialHandle}>@{restaurant.instagram}</span>
              </a>
            )}
            {restaurant.tiktok && (
              <a className={styles.socialLink} href={`https://tiktok.com/@${restaurant.tiktok}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>🎵</span>
                <span className={styles.socialName}>TikTok</span>
                <span className={styles.socialHandle}>@{restaurant.tiktok}</span>
              </a>
            )}
            {restaurant.facebook && (
              <a className={styles.socialLink} href={`https://facebook.com/${restaurant.facebook}`} target="_blank" rel="noreferrer">
                <span className={styles.socialIcon}>👥</span>
                <span className={styles.socialName}>Facebook</span>
                <span className={styles.socialHandle}>{restaurant.facebook}</span>
              </a>
            )}

            {!restaurant.instagram && !restaurant.tiktok && !restaurant.facebook && (
              <p className={styles.noSocials}>No social links added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Menu item card — full-screen ──────────────────────────────────────────────
function MenuItemCard({ item, qty, onAdd, onRemove, itemRef }) {
  const bg = item.photo_url
    ? `url("${item.photo_url}")`
    : CATEGORY_GRADIENTS[item.category] ?? 'linear-gradient(160deg, #1a1200 0%, #0d0d0d 100%)'

  return (
    <div className={styles.itemCard} ref={itemRef}>
      {/* Background */}
      <div className={styles.itemBg} style={{ backgroundImage: bg }} />
      <div className={styles.itemOverlay} />

      {/* Category pill top-left */}
      {item.category && (
        <div className={styles.itemCatPill}>{item.category}</div>
      )}

      {/* Prep time top-right */}
      {item.prep_time_min && (
        <div className={styles.itemPrep}>⏱ {item.prep_time_min} min</div>
      )}

      {/* Sold out overlay */}
      {item.is_available === false && (
        <div className={styles.soldOutOverlay}>
          <span className={styles.soldOutText}>Sold Out</span>
        </div>
      )}

      {/* Bottom content */}
      <div className={styles.itemBottom}>
        <h2 className={styles.itemName}>{item.name}</h2>
        {item.description && (
          <p className={styles.itemDesc}>{item.description}</p>
        )}
        <div className={styles.itemFooter}>
          <span className={styles.itemPrice}>{fmtRp(item.price)}</span>

          {item.is_available !== false && (
            qty > 0 ? (
              <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={onRemove}>−</button>
                <span className={styles.qtyNum}>{qty}</span>
                <button className={styles.qtyBtn} onClick={onAdd}>+</button>
              </div>
            ) : (
              <button className={styles.addBtn} onClick={onAdd}>
                + Add
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
