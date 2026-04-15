import { useState, useEffect, useCallback } from 'react'
import {
  fetchProducts, fetchOrders, fetchStats,
  updateOrderStatus, toggleProductActive, DEMO_STATS,
} from '@/services/commerceService'
import ProductCatalogSlider from './ProductCatalogSlider'
import DeliveryPricingEditor from './DeliveryPricingEditor'
import styles from './EchoCommercePanel.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// EchoCommercePanel — right-side seller control panel (280px, collapsible)
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered']

const STATUS_COLORS = {
  pending:   { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#FBBF24' },
  confirmed: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#A78BFA' },
  shipped:   { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#818CF8' },
  delivered: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34D399' },
}

function StatCard({ label, value, icon }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function EchoCommercePanel({ userId, businessName, open: externalOpen, onToggle }) {
  const [open, setOpen]               = useState(externalOpen ?? false)
  const [stats, setStats]             = useState(DEMO_STATS)
  const [orders, setOrders]           = useState([])
  const [products, setProducts]       = useState([])
  const [section, setSection]         = useState('orders') // orders | products | shipping
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [deliveryPricingOpen, setDeliveryPricingOpen] = useState(false)
  const [deliveryPricingProduct, setDeliveryPricingProduct] = useState(null)
  const [loading, setLoading]         = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [s, o, p] = await Promise.all([fetchStats(userId), fetchOrders(userId), fetchProducts(userId)])
    setStats(s)
    setOrders(o)
    setProducts(p)
    setLoading(false)
  }, [userId])

  useEffect(() => { if (open) load() }, [open, load])

  // sync external open prop
  useEffect(() => { if (externalOpen !== undefined) setOpen(externalOpen) }, [externalOpen])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    onToggle?.(next)
  }

  async function advanceOrder(orderId, currentStatus) {
    const idx  = ORDER_STATUS_FLOW.indexOf(currentStatus)
    const next = ORDER_STATUS_FLOW[idx + 1]
    if (!next) return
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o))
    await updateOrderStatus(orderId, next)
  }

  async function handleToggleProduct(productId, current) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, active: !current } : p))
    await toggleProductActive(productId, !current)
  }

  return (
    <>
      {/* Slide-in panel */}
      <div className={[styles.panel, open ? styles.panelOpen : ''].join(' ')}>
        {/* Tab on left edge to open/close */}
        <button className={styles.tab} onClick={toggleOpen} title={open ? 'Close panel' : 'Open seller panel'}>
          {open ? '›' : '‹'}
          {!open && <span className={styles.tabLabel}>Shop</span>}
        </button>

        <div className={styles.inner}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <img src="https://ik.imagekit.io/nepgaxllc/Indoo%20Market%20logo%20design.png?updatedAt=1776203793752" alt="Indoo Market" style={{ height:22, objectFit:'contain' }} />
              <span className={styles.commerce}>Seller</span>
            </div>
            <button className={styles.headerCatalogBtn} onClick={() => setCatalogOpen(true)}>
              📦 Products
            </button>
          </div>

          {/* Business name */}
          {businessName && (
            <div className={styles.bizName}>{businessName}</div>
          )}

          {/* Stats row */}
          <div className={styles.statsRow}>
            <StatCard icon="👁" label="Views"   value={stats.views ?? 0} />
            <StatCard icon="🛒" label="Carts"   value={stats.cartAdds ?? 0} />
            <StatCard icon="💬" label="WA Clicks" value={stats.whatsappClicks ?? 0} />
            <StatCard icon="📦" label="Orders"  value={stats.orders ?? 0} />
          </div>

          {/* Section tabs */}
          <div className={styles.sectionTabs}>
            {['orders', 'products', 'shipping', 'payment'].map(s => (
              <button
                key={s}
                className={[styles.sectionTab, section === s ? styles.sectionTabActive : ''].join(' ')}
                onClick={() => setSection(s)}
              >
                {s === 'orders' ? '🧾 Orders' : s === 'products' ? '📦 Products' : s === 'shipping' ? '🚚 Ship' : '🛡 Pay'}
              </button>
            ))}
          </div>

          {loading && <div className={styles.loading}>Loading…</div>}

          {/* ── Orders section ── */}
          {!loading && section === 'orders' && (
            <div className={styles.list}>
              {orders.length === 0 && (
                <div className={styles.empty}>No orders yet — share your store link to get started!</div>
              )}
              {orders.map(order => {
                const color = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                const canAdvance = ORDER_STATUS_FLOW.indexOf(order.status) < ORDER_STATUS_FLOW.length - 1
                return (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderTop}>
                      <span className={styles.orderProduct}>{order.product}</span>
                      <span
                        className={styles.orderStatus}
                        style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span>{order.buyer}</span>
                      <span>Qty: {order.qty}</span>
                      <span>${(order.total ?? 0).toFixed(2)}</span>
                      <span className={styles.orderTime}>{order.time}</span>
                    </div>
                    {canAdvance && (
                      <button
                        className={styles.advanceBtn}
                        onClick={() => advanceOrder(order.id, order.status)}
                      >
                        Mark as {ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1]} →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Products section ── */}
          {!loading && section === 'products' && (
            <div className={styles.list}>
              <button className={styles.addProductBtn} onClick={() => setCatalogOpen(true)}>
                + Add / Edit Products
              </button>
              {products.map(p => (
                <div key={p.id} className={[styles.productRow, p.active ? '' : styles.productInactive].join(' ')}>
                  {p.image && (
                    <img src={p.image} alt={p.name} className={styles.productThumb} />
                  )}
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productPrice}>${(p.price ?? 0).toFixed(2)}</span>
                    <span className={styles.productStock}>Stock: {p.stock ?? '–'}</span>
                  </div>
                  <button
                    className={[styles.toggleActive, p.active ? styles.toggleOn : styles.toggleOff].join(' ')}
                    onClick={() => handleToggleProduct(p.id, p.active)}
                    title={p.active ? 'Hide product' : 'Show product'}
                  >
                    {p.active ? 'Live' : 'Off'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Shipping section ── */}
          {!loading && section === 'shipping' && (
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Shipping Options</div>
              {[
                { icon: '🏃', label: 'Same-day delivery',      sub: 'Within city — 2-4 hrs',      checked: true },
                { icon: '📦', label: 'Standard shipping',       sub: '3-5 business days',          checked: true },
                { icon: '✈️',  label: 'International shipping', sub: '7-14 business days',         checked: false },
                { icon: '🤝', label: 'Click & Collect',        sub: 'Buyer picks up from you',    checked: true },
                { icon: '💬', label: 'WhatsApp order only',    sub: 'Chat before completing',     checked: false },
              ].map(opt => (
                <label key={opt.label} className={styles.shippingOpt}>
                  <input type="checkbox" defaultChecked={opt.checked} className={styles.shippingCheck} />
                  <span className={styles.shippingIcon}>{opt.icon}</span>
                  <div className={styles.shippingText}>
                    <span className={styles.shippingLabel}>{opt.label}</span>
                    <span className={styles.shippingSub}>{opt.sub}</span>
                  </div>
                </label>
              ))}
              <button className={styles.saveShippingBtn}>Save Shipping Settings</button>

              {/* Per-product delivery pricing */}
              <div className={styles.shippingTitle} style={{ marginTop: 16 }}>Product Delivery Pricing</div>
              <div className={styles.shippingSub2}>Set delivery prices per product, per carrier</div>
              {products.map(p => (
                <button
                  key={p.id}
                  className={styles.deliveryPricingBtn}
                  onClick={() => { setDeliveryPricingProduct(p); setDeliveryPricingOpen(true) }}
                >
                  <span className={styles.deliveryPricingName}>{p.name}</span>
                  <span className={styles.deliveryPricingArrow}>→</span>
                </button>
              ))}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first to set delivery pricing</div>
              )}
            </div>
          )}

          {/* ── Payment section (COD + Safe Trade) ── */}
          {!loading && section === 'payment' && (
            <div className={styles.shippingSection}>
              <div className={styles.shippingTitle}>Cash on Delivery</div>
              <div className={styles.shippingSub2}>Enable COD per product</div>
              {products.map(p => (
                <label key={p.id} className={styles.shippingOpt}>
                  <input
                    type="checkbox"
                    checked={p.cashOnDelivery ?? false}
                    onChange={() => setProducts(prev => prev.map(pr =>
                      pr.id === p.id ? { ...pr, cashOnDelivery: !pr.cashOnDelivery } : pr
                    ))}
                    className={styles.shippingCheck}
                  />
                  <div className={styles.shippingText}>
                    <span className={styles.shippingLabel}>{p.name}</span>
                    <span className={styles.shippingSub}>{p.cashOnDelivery ? 'COD enabled' : 'COD disabled'}</span>
                  </div>
                </label>
              ))}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first</div>
              )}

              <div className={styles.shippingTitle} style={{ marginTop: 16 }}>Safe Trade</div>
              <div className={styles.shippingSub2}>Buyer protection via PayPal or Escrow</div>

              {products.map(p => {
                const st = p.safeTrade ?? {}
                return (
                  <div key={p.id} className={styles.safeTradeProduct}>
                    <span className={styles.safeTradeProductName}>{p.name}</span>
                    <div className={styles.safeTradeToggles}>
                      <label className={styles.safeTradeToggle}>
                        <input
                          type="checkbox"
                          checked={st.enabled ?? false}
                          onChange={() => setProducts(prev => prev.map(pr =>
                            pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, enabled: !(pr.safeTrade?.enabled) } } : pr
                          ))}
                          className={styles.shippingCheck}
                        />
                        <span className={styles.safeTradeLabel}>Enabled</span>
                      </label>
                      {st.enabled && (
                        <>
                          <label className={styles.safeTradeToggle}>
                            <input
                              type="checkbox"
                              checked={st.paypal ?? false}
                              onChange={() => setProducts(prev => prev.map(pr =>
                                pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, paypal: !(pr.safeTrade?.paypal) } } : pr
                              ))}
                              className={styles.shippingCheck}
                            />
                            <span className={styles.safeTradeLabel}>PayPal</span>
                          </label>
                          <label className={styles.safeTradeToggle}>
                            <input
                              type="checkbox"
                              checked={st.escrow ?? false}
                              onChange={() => setProducts(prev => prev.map(pr =>
                                pr.id === p.id ? { ...pr, safeTrade: { ...pr.safeTrade, escrow: !(pr.safeTrade?.escrow) } } : pr
                              ))}
                              className={styles.shippingCheck}
                            />
                            <span className={styles.safeTradeLabel}>Escrow</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {products.length === 0 && (
                <div className={styles.empty} style={{ fontSize: 11 }}>Add products first</div>
              )}

              <button className={styles.saveShippingBtn}>Save Payment Settings</button>
            </div>
          )}
        </div>
      </div>

      {/* Product catalog slider */}
      <ProductCatalogSlider
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        userId={userId}
        products={products}
        onProductsChange={setProducts}
      />

      {/* Delivery pricing editor per product */}
      <DeliveryPricingEditor
        open={deliveryPricingOpen}
        onClose={() => { setDeliveryPricingOpen(false); setDeliveryPricingProduct(null) }}
        product={deliveryPricingProduct}
        onSave={(config) => {
          if (deliveryPricingProduct) {
            setProducts(prev => prev.map(p =>
              p.id === deliveryPricingProduct.id
                ? { ...p, deliveryPricing: config }
                : p
            ))
          }
          setDeliveryPricingOpen(false)
          setDeliveryPricingProduct(null)
        }}
      />
    </>
  )
}
