/**
 * MarketplaceCartScreen
 * Shopping cart + order tracking for marketplace buyers.
 * Tabs: Cart, Active Orders, Order History
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { createOrder, notifySeller, fetchBuyerOrders } from '@/services/marketplaceOrderService'
import styles from './MarketplaceCartScreen.module.css'

const MARKET_LOGO = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdsd-removebg-preview.png'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

const DEMO_CART = [
  { id: 'c1', name: 'Nike Air Max 90 Original', price: 1250000, qty: 1, image: 'https://picsum.photos/seed/shoe1/200', seller: 'Bali Crafts Co.', sellerId: 's1', stock: 5 },
  { id: 'c2', name: 'Batik Shirt Premium Jogja', price: 340000, qty: 2, image: 'https://picsum.photos/seed/batik1/200', seller: 'Toko Batik Mega', sellerId: 's2', stock: 12 },
  { id: 'c3', name: 'Aromatherapy Candle Set', price: 175000, qty: 1, image: 'https://picsum.photos/seed/candle1/200', seller: 'Handmade by Dewi', sellerId: 's3', stock: 8 },
  { id: 'c4', name: 'Handmade Ceramic Mug', price: 95000, qty: 1, image: 'https://picsum.photos/seed/mug1/200', seller: 'Handmade by Dewi', sellerId: 's3', stock: 15 },
  { id: 'c5', name: 'Vintage Batik Scarf', price: 185000, qty: 1, image: 'https://picsum.photos/seed/scarf1/200', seller: 'Toko Batik Mega', sellerId: 's2', stock: 7 },
]

const PAYMENT_METHODS = [
  { id: 'bca',     label: 'BCA Transfer',     account: '123-456-7890' },
  { id: 'mandiri', label: 'Mandiri Transfer',  account: '987-654-3210' },
  { id: 'bri',     label: 'BRI Transfer',      account: '111-222-3333' },
  { id: 'qris',    label: 'QRIS',              account: 'Scan QR Code' },
  { id: 'gopay',   label: 'GoPay',             account: '0812-3456-7890' },
  { id: 'ovo',     label: 'OVO',               account: '0812-3456-7890' },
  { id: 'cod',     label: 'Cash on Delivery',  account: null },
]

const DEMO_ACTIVE = [
  { id: 'a1', product: 'Samsung Galaxy Buds Pro', total: 890000, status: 'confirmed', seller: 'Toko Elektronik Jaya', date: 'Apr 16', tracking: null },
  { id: 'a2', product: 'Leather Wallet Handmade', total: 285000, status: 'shipped', seller: 'Handmade by Dewi', date: 'Apr 15', tracking: 'JNE1234567' },
]

const DEMO_HISTORY = [
  { id: 'h1', product: 'Kebaya Sari Modern', total: 450000, status: 'delivered', seller: 'Butik Kebaya Sari', date: 'Apr 10' },
  { id: 'h2', product: 'Organic Honey 500ml', total: 120000, status: 'delivered', seller: 'Farm Fresh Indo', date: 'Apr 8' },
  { id: 'h3', product: 'Phone Case Premium', total: 85000, status: 'cancelled', seller: 'Tech Accessories ID', date: 'Apr 5' },
]

const STATUS_STYLES = {
  pending:   { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24', label: 'Pending' },
  confirmed: { bg: '#8DC63F',               color: '#fff',    label: 'Confirmed' },
  shipped:   { bg: '#8DC63F',               color: '#fff',    label: 'Shipped', glow: true },
  delivered: { bg: 'rgba(52,199,89,0.15)',  color: '#34C759', label: 'Delivered' },
  cancelled: { bg: '#EF4444',              color: '#fff',    label: 'Cancelled' },
}

export default function MarketplaceCartScreen({ open, onClose, onWriteReview }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('cart')
  const [cart, setCart] = useState(DEMO_CART)
  const [activeOrders, setActiveOrders] = useState(DEMO_ACTIVE)
  const [history, setHistory] = useState(DEMO_HISTORY)

  useEffect(() => {
    if (!open || !user?.id) return
    fetchBuyerOrders(user.id).then(orders => {
      if (!orders.length) return
      const active = orders.filter(o => ['awaiting_payment','pending','confirmed','shipped'].includes(o.status))
        .map(o => ({
          id: o.id,
          product: o.items?.[0]?.name ?? 'Order',
          total: o.total,
          status: o.status,
          seller: o.seller?.display_name ?? o.seller?.brand_name ?? 'Seller',
          date: new Date(o.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
          tracking: o.tracking_no,
        }))
      const hist = orders.filter(o => ['delivered','cancelled','refunded'].includes(o.status))
        .map(o => ({
          id: o.id,
          product: o.items?.[0]?.name ?? 'Order',
          total: o.total,
          status: o.status,
          seller: o.seller?.display_name ?? o.seller?.brand_name ?? 'Seller',
          date: new Date(o.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        }))
      if (active.length) setActiveOrders(active)
      if (hist.length) setHistory(hist)
    })
  }, [open, user?.id])
  // Checkout flow
  const [checkoutStep, setCheckoutStep] = useState(null) // null | 'review' | 'pay' | index (seller) | 'done'
  const [checkoutSellers, setCheckoutSellers] = useState([])
  const [currentSellerIdx, setCurrentSellerIdx] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentProofs, setPaymentProofs] = useState({}) // sellerId -> url
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  if (!open) return null

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item
      const newQty = Math.max(1, Math.min(item.stock, item.qty + delta))
      return { ...item, qty: newQty }
    }))
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  // Group cart by seller
  const sellerGroups = {}
  cart.forEach(item => {
    if (!sellerGroups[item.seller]) sellerGroups[item.seller] = { seller: item.seller, sellerId: item.sellerId, items: [] }
    sellerGroups[item.seller].items.push(item)
  })
  const sellerList = Object.values(sellerGroups)

  const startCheckout = () => {
    setCheckoutSellers(sellerList)
    setCurrentSellerIdx(0)
    setPaymentProofs({})
    setCheckoutStep('review')
  }

  const handleUploadProof = (sellerId) => {
    const url = prompt('Paste payment proof screenshot URL:')
    if (url?.trim()) setPaymentProofs(prev => ({ ...prev, [sellerId]: url.trim() }))
  }

  const [submitting, setSubmitting] = useState(false)

  const handleConfirmAll = async () => {
    if (!user?.id) { setCheckoutStep('done'); return }
    setSubmitting(true)
    try {
      for (const group of checkoutSellers) {
        const items = group.items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image }))
        const subtotal = group.items.reduce((s, i) => s + i.price * i.qty, 0)
        const order = await createOrder({
          buyerId: user.id,
          sellerId: group.sellerId,
          items,
          subtotal,
          deliveryFee: 0,
          total: subtotal,
          paymentMethod,
          paymentProofUrl: paymentProofs[group.sellerId] ?? null,
          deliveryAddress: address,
          notes,
        })
        if (order) await notifySeller(group.sellerId, order)
      }
    } catch (e) {
      console.warn('[checkout] order creation failed', e)
    }
    setSubmitting(false)
    setCheckoutStep('done')
  }

  return createPortal(
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={MARKET_LOGO} alt="Indoo Market" className={styles.headerLogo} />
        <h1 className={styles.title}>
          {tab === 'cart' && <><svg className={styles.titleIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> My Cart</>}
          {tab === 'active' && <><svg className={styles.titleIconSpin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Active Orders</>}
          {tab === 'history' && <><svg className={styles.titleIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Order History</>}
        </h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'cart' ? styles.tabActive : ''}`} onClick={() => setTab('cart')}>
          Cart {cart.length > 0 && <span className={styles.tabBadge}>{cartCount}</span>}
        </button>
        <button className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
          Active {activeOrders.length > 0 && <span className={styles.tabBadge}>{activeOrders.length}</span>}
        </button>
        <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      {/* Content */}
      <div className={styles.list}>

        {/* ═══ CART TAB — grouped by seller ═══ */}
        {tab === 'cart' && !checkoutStep && (
          <>
            {cart.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🛒</span>
                <span>Your cart is empty</span>
                <span className={styles.emptySub}>Browse the marketplace to add products</span>
              </div>
            )}
            {sellerList.map(group => (
              <div key={group.seller} className={styles.sellerGroup}>
                <div className={styles.sellerGroupHeader}>
                  <span className={styles.sellerGroupIcon}>🏪</span>
                  <span className={styles.sellerGroupName}>{group.seller}</span>
                  <span className={styles.sellerGroupCount}>{group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                </div>
                {group.items.map(item => (
                  <div key={item.id} className={styles.cartCard}>
                    <div className={styles.cartLeft}>
                      <img src={item.image} alt={item.name} className={styles.cartImg} />
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item.id, -1)}>-</button>
                        <span className={styles.qtyNum}>{item.qty}</span>
                        <button className={styles.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <div className={styles.cartRight}>
                      <div className={styles.cartTopRow}>
                        <div className={styles.cartInfo}>
                          <span className={styles.cartName}>{item.name}</span>
                          <span className={styles.cartPrice}>{fmtRp(item.price)}</span>
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                      <div className={styles.cartBottomRow}>
                        <span className={styles.cartSubtotalLabel}>Total</span>
                        <span className={styles.cartSubtotal}>{fmtRp(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className={styles.sellerGroupTotal}>
                  Subtotal: <strong>{fmtRp(group.items.reduce((s, i) => s + i.price * i.qty, 0))}</strong>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══ CHECKOUT: Review all sellers ═══ */}
        {tab === 'cart' && checkoutStep === 'review' && (
          <>
            <h2 className={styles.checkoutTitle}>Review Your Orders</h2>
            <p className={styles.checkoutSub}>Your cart will be split into {checkoutSellers.length} separate order{checkoutSellers.length > 1 ? 's' : ''} — one per seller</p>

            {/* Delivery address */}
            <div className={styles.checkoutField}>
              <label className={styles.checkoutLabel}>Delivery Address</label>
              <textarea className={styles.checkoutTextarea} value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Full address: street, city, postal code" rows={3} />
            </div>

            {checkoutSellers.map((group, i) => {
              const total = group.items.reduce((s, item) => s + item.price * item.qty, 0)
              return (
                <div key={group.seller} className={styles.checkoutSellerCard}>
                  <div className={styles.checkoutSellerHeader}>
                    <span className={styles.checkoutSellerNum}>Order {i + 1} of {checkoutSellers.length}</span>
                    <span className={styles.checkoutSellerName}>🏪 {group.seller}</span>
                  </div>
                  {group.items.map(item => (
                    <div key={item.id} className={styles.checkoutItem}>
                      <img src={item.image} alt="" className={styles.checkoutItemImg} />
                      <span className={styles.checkoutItemName}>{item.name}</span>
                      <span className={styles.checkoutItemQty}>x{item.qty}</span>
                      <span className={styles.checkoutItemPrice}>{fmtRp(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className={styles.checkoutSellerTotal}>
                    Total to {group.seller}: <strong>{fmtRp(total)}</strong>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ═══ CHECKOUT: Payment per seller ═══ */}
        {tab === 'cart' && checkoutStep === 'pay' && (
          <>
            <div className={styles.checkoutProgress}>
              {checkoutSellers.map((_, i) => (
                <span key={i} className={`${styles.progressDot} ${i < currentSellerIdx ? styles.progressDotDone : i === currentSellerIdx ? styles.progressDotActive : ''}`} />
              ))}
            </div>

            {(() => {
              const group = checkoutSellers[currentSellerIdx]
              if (!group) return null
              const total = group.items.reduce((s, item) => s + item.price * item.qty, 0)
              return (
                <div className={styles.paySection}>
                  <h2 className={styles.checkoutTitle}>Payment {currentSellerIdx + 1} of {checkoutSellers.length}</h2>
                  <div className={styles.checkoutSellerCard}>
                    <div className={styles.checkoutSellerHeader}>
                      <span className={styles.checkoutSellerName}>🏪 {group.seller}</span>
                    </div>
                    {group.items.map(item => (
                      <div key={item.id} className={styles.checkoutItem}>
                        <img src={item.image} alt="" className={styles.checkoutItemImg} />
                        <span className={styles.checkoutItemName}>{item.name}</span>
                        <span className={styles.checkoutItemQty}>x{item.qty}</span>
                        <span className={styles.checkoutItemPrice}>{fmtRp(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className={styles.payTotal}>
                      Pay: <strong>{fmtRp(total)}</strong>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className={styles.checkoutField}>
                    <label className={styles.checkoutLabel}>Payment Method</label>
                    <div className={styles.paymentGrid}>
                      {PAYMENT_METHODS.map(m => (
                        <button key={m.id} className={`${styles.paymentBtn} ${paymentMethod === m.id ? styles.paymentBtnOn : ''}`}
                          onClick={() => setPaymentMethod(m.id)}>
                          <span className={styles.paymentBtnLabel}>{m.label}</span>
                          {m.account && <span className={styles.paymentBtnAccount}>{m.account}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload proof */}
                  {paymentMethod && paymentMethod !== 'cod' && (
                    <div className={styles.checkoutField}>
                      <label className={styles.checkoutLabel}>Upload Payment Proof</label>
                      {paymentProofs[group.sellerId] ? (
                        <div className={styles.proofUploaded}>
                          <img src={paymentProofs[group.sellerId]} alt="Proof" className={styles.proofImg} />
                          <span className={styles.proofCheck}>Uploaded</span>
                        </div>
                      ) : (
                        <button className={styles.uploadBtn} onClick={() => handleUploadProof(group.sellerId)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload Screenshot
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className={styles.checkoutField}>
                    <label className={styles.checkoutLabel}>Note to seller (optional)</label>
                    <input className={styles.checkoutInput} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Please wrap as gift" />
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {/* ═══ CHECKOUT: Done ═══ */}
        {tab === 'cart' && checkoutStep === 'done' && (
          <div className={styles.checkoutDone}>
            <span className={styles.checkoutDoneIcon}>🎉</span>
            <h2 className={styles.checkoutDoneTitle}>{checkoutSellers.length} Order{checkoutSellers.length > 1 ? 's' : ''} Placed!</h2>
            <p className={styles.checkoutDoneSub}>Payment proof sent to each seller. You'll receive confirmation within 24 hours.</p>
            <div className={styles.checkoutDoneList}>
              {checkoutSellers.map((group, i) => (
                <div key={i} className={styles.checkoutDoneItem}>
                  <span className={styles.checkoutDoneCheck}>✓</span>
                  <span>{group.seller}</span>
                  <span className={styles.checkoutDoneAmount}>{fmtRp(group.items.reduce((s, item) => s + item.price * item.qty, 0))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ACTIVE ORDERS TAB ═══ */}
        {tab === 'active' && (
          <>
            {activeOrders.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📦</span>
                <span>No active orders</span>
              </div>
            )}
            {activeOrders.map(order => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderProduct}>{order.product}</span>
                    <span className={`${styles.orderStatus} ${st.glow ? styles.orderStatusGlow : ''}`} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>{order.seller}</span>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  {order.tracking && (
                    <div className={styles.orderTracking}>Tracking: {order.tracking}</div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ═══ ORDER HISTORY TAB ═══ */}
        {tab === 'history' && (
          <>
            {history.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>📋</span>
                <span>No past orders</span>
              </div>
            )}
            {history.map(order => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.delivered
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderProduct}>{order.product}</span>
                    <span className={`${styles.orderStatus} ${st.glow ? styles.orderStatusGlow : ''}`} style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>{order.seller}</span>
                    <span className={styles.orderTotal}>{fmtRp(order.total)}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                  {order.status === 'delivered' && (
                    <div className={styles.actionRow}>
                      <button className={styles.reviewBtn} onClick={() => onWriteReview?.(order)}>Write Review</button>
                      <button className={styles.reorderBtn}>Buy Again</button>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer */}
      {tab === 'cart' && cart.length > 0 && !checkoutStep && (
        <div className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.footerLabel}>Total ({cartCount} items from {sellerList.length} seller{sellerList.length > 1 ? 's' : ''})</span>
            <span className={styles.footerPrice}>{fmtRp(cartTotal)}</span>
          </div>
          <button className={styles.checkoutBtn} onClick={startCheckout}>
            Checkout All →
          </button>
        </div>
      )}
      {tab === 'cart' && checkoutStep === 'review' && (
        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => setCheckoutStep(null)}>Back</button>
          <button className={styles.checkoutBtn} onClick={() => { setCheckoutStep('pay'); setCurrentSellerIdx(0); setPaymentMethod('') }} disabled={!address.trim()}>
            Proceed to Payment →
          </button>
        </div>
      )}
      {tab === 'cart' && checkoutStep === 'pay' && (
        <div className={styles.footer}>
          <button className={styles.backBtn} onClick={() => {
            if (currentSellerIdx > 0) { setCurrentSellerIdx(i => i - 1); setPaymentMethod('') }
            else setCheckoutStep('review')
          }}>Back</button>
          {currentSellerIdx < checkoutSellers.length - 1 ? (
            <button className={styles.checkoutBtn} onClick={() => { setCurrentSellerIdx(i => i + 1); setPaymentMethod(''); setNotes('') }}
              disabled={!paymentMethod || (paymentMethod !== 'cod' && !paymentProofs[checkoutSellers[currentSellerIdx]?.sellerId])}>
              Next Seller →
            </button>
          ) : (
            <button className={styles.checkoutBtn} onClick={handleConfirmAll}
              disabled={submitting || !paymentMethod || (paymentMethod !== 'cod' && !paymentProofs[checkoutSellers[currentSellerIdx]?.sellerId])}>
              {submitting ? 'Placing Orders…' : 'Confirm All Orders'}
            </button>
          )}
        </div>
      )}
      {tab === 'cart' && checkoutStep === 'done' && (
        <div className={styles.footer}>
          <button className={styles.checkoutBtn} onClick={() => { setCheckoutStep(null); setCart([]); setTab('active') }}>
            View Active Orders
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
