/**
 * FreightCompaniesSheet
 * Bottom slide-up sheet showing available freight/delivery companies for a product.
 * Shows seller-configured carriers with prices, grouped by Parcels & Cargo.
 * Buyers see which delivery options the seller offers + pricing.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PARCEL_CARRIERS, CARGO_CARRIERS, EXPORT_CARRIERS } from '@/services/commissionService'
import styles from './FreightCompaniesSheet.module.css'

function fmtIDR(n) {
  if (!n && n !== 0) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

// Placeholder icon when no logo is set
function CarrierIcon({ label }) {
  return (
    <div className={styles.carrierIcon}>
      <span>{label.charAt(0)}</span>
    </div>
  )
}

// Carrier card — logo on top, info bar underneath
function CarrierCard({ logo, logoBg, label, badge, badgeClass, price, priceIncluded, deliveryDays, express }) {
  return (
    <div className={styles.carrierRow}>
      <div className={styles.carrierLeft} style={logoBg ? { background: logoBg, borderRadius: '13px 13px 0 0' } : undefined}>
        {logo
          ? <img src={logo} alt={label} className={styles.carrierLogo} />
          : <CarrierIcon label={label} />
        }
      </div>
      <div className={styles.carrierInfo}>
        <span className={styles.carrierName}>{label}</span>
        <div className={styles.carrierMeta}>
          <span className={badgeClass}>{badge}</span>
          {deliveryDays && <span className={styles.carrierDays}>{deliveryDays}</span>}
        </div>
        {express && <span className={styles.carrierExpress}>Express: {express}</span>}
        <div className={styles.carrierPrice}>
          {priceIncluded
            ? <span className={styles.priceIncluded}>Included</span>
            : <span className={styles.priceValue}>{price}</span>
          }
        </div>
      </div>
    </div>
  )
}

export default function FreightCompaniesSheet({ open, onClose, product }) {
  const [tab, setTab] = useState('parcels') // parcels | cargo | export

  if (!open) return null

  // Seller-configured delivery prices for this product (demo fallback)
  const deliveryConfig = product?.deliveryPricing ?? {}
  const priceIncluded = deliveryConfig.priceIncluded ?? false
  const carrierPrices = deliveryConfig.carriers ?? {}
  const customCarriers = deliveryConfig.customCarriers ?? []
  const exportRates = deliveryConfig.exportRates ?? []

  // Filter to only show carriers the seller has enabled (or show all in demo)
  const enabledParcels = PARCEL_CARRIERS.filter(c =>
    carrierPrices[c.type] !== undefined || Object.keys(carrierPrices).length === 0
  )
  const enabledCargo = CARGO_CARRIERS.filter(c =>
    carrierPrices[c.type] !== undefined || Object.keys(carrierPrices).length === 0
  )

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Delivery Options</span>
          <span className={styles.sheetSub}>
            {priceIncluded
              ? 'Delivery price included in product price'
              : 'Available shipping for this product'}
          </span>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'parcels' ? styles.tabActive : ''}`}
            onClick={() => setTab('parcels')}
          >
            Parcels
          </button>
          <button
            className={`${styles.tab} ${tab === 'cargo' ? styles.tabActive : ''}`}
            onClick={() => setTab('cargo')}
          >
            Large Cargo
          </button>
          <button
            className={`${styles.tab} ${tab === 'export' ? styles.tabActive : ''}`}
            onClick={() => setTab('export')}
          >
            Export
          </button>
        </div>

        <div className={styles.list}>
          {/* ── Parcels & Packages ── */}
          {tab === 'parcels' && (
            <>
              {enabledParcels.map(carrier => (
                <CarrierCard
                  key={carrier.type}
                  logo={carrier.logo}
                  logoBg={carrier.logoBg}
                  label={carrier.label}
                  badge="Parcels & Packages"
                  badgeClass={styles.carrierBadge}
                  price={carrierPrices[carrier.type] ? fmtIDR(carrierPrices[carrier.type]) : 'Contact seller'}
                  priceIncluded={priceIncluded}
                  deliveryDays={carrier.deliveryDays}
                  express={carrier.express}
                />
              ))}
              {customCarriers.filter(c => c.category === 'parcel').map((c, i) => (
                <CarrierCard
                  key={`custom-p-${i}`}
                  logo={c.logo}
                  label={c.name}
                  badge="Custom"
                  badgeClass={styles.carrierBadgeCustom}
                  price={c.price ? fmtIDR(c.price) : '—'}
                />
              ))}
              {enabledParcels.length === 0 && customCarriers.filter(c => c.category === 'parcel').length === 0 && (
                <div className={styles.empty}>No parcel delivery options set by seller</div>
              )}
            </>
          )}

          {/* ── Large Cargo ── */}
          {tab === 'cargo' && (
            <>
              {enabledCargo.map(carrier => (
                <CarrierCard
                  key={carrier.type}
                  logo={carrier.logo}
                  logoBg={carrier.logoBg}
                  label={carrier.label}
                  badge="Large Cargo"
                  badgeClass={styles.carrierBadgeCargo}
                  price={carrierPrices[carrier.type] ? fmtIDR(carrierPrices[carrier.type]) : 'Contact seller'}
                  priceIncluded={priceIncluded}
                  deliveryDays={carrier.deliveryDays}
                  express={carrier.express}
                />
              ))}
              {customCarriers.filter(c => c.category === 'cargo').map((c, i) => (
                <CarrierCard
                  key={`custom-c-${i}`}
                  logo={c.logo}
                  label={c.name}
                  badge="Custom"
                  badgeClass={styles.carrierBadgeCustom}
                  price={c.price ? fmtIDR(c.price) : '—'}
                />
              ))}
              {enabledCargo.length === 0 && customCarriers.filter(c => c.category === 'cargo').length === 0 && (
                <div className={styles.empty}>No cargo delivery options set by seller</div>
              )}
            </>
          )}

          {/* ── Export / International ── */}
          {tab === 'export' && (
            <>
              {EXPORT_CARRIERS.map(carrier => (
                <CarrierCard
                  key={carrier.type}
                  logo={carrier.logo}
                  logoBg={carrier.logoBg}
                  label={carrier.label}
                  badge="International"
                  badgeClass={styles.carrierBadgeExport}
                  price={carrierPrices[carrier.type] ? fmtIDR(carrierPrices[carrier.type]) : 'Contact seller'}
                  priceIncluded={priceIncluded}
                  deliveryDays={carrier.deliveryDays}
                  express={carrier.express}
                />
              ))}

              {/* Country-specific export rates set by seller */}
              {exportRates.length > 0 && (
                <>
                  <div className={styles.sectionDivider}>Country Rates</div>
                  {exportRates.map((rate, i) => (
                    <div key={i} className={styles.exportRow}>
                      <div className={styles.exportCountry}>
                        <span className={styles.exportFlag}>{rate.flag ?? '🌍'}</span>
                        <span className={styles.exportName}>{rate.country}</span>
                      </div>
                      <div className={styles.exportDetails}>
                        <span className={styles.exportSize}>
                          {rate.maxWeight ? `Up to ${rate.maxWeight}kg` : 'Any weight'}
                          {rate.maxSize ? ` / ${rate.maxSize}` : ''}
                        </span>
                        <span className={styles.exportPrice}>{fmtIDR(rate.price)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerNote}>Prices set by seller. Final cost confirmed at checkout.</span>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
