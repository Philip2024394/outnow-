/**
 * DeliveryPricingEditor
 * Seller dashboard component to set delivery prices per product.
 * - Toggle "Price Included" (delivery cost baked into product price)
 * - Set price per carrier (Parcels & Cargo)
 * - Add custom carrier with logo + price
 * - Configure export rates by country, size, weight
 */
import { useState } from 'react'
import { PARCEL_CARRIERS, CARGO_CARRIERS, EXPORT_CARRIERS } from '@/services/commissionService'
import styles from './DeliveryPricingEditor.module.css'

function fmtIDR(n) {
  if (!n && n !== 0) return ''
  return Number(n).toLocaleString('id-ID')
}

export default function DeliveryPricingEditor({ open, onClose, product, onSave }) {
  const existing = product?.deliveryPricing ?? {}

  const [priceIncluded, setPriceIncluded] = useState(existing.priceIncluded ?? false)
  const [carrierPrices, setCarrierPrices] = useState(existing.carriers ?? {})
  const [enabledCarriers, setEnabledCarriers] = useState(() => {
    const init = {}
    Object.keys(existing.carriers ?? {}).forEach(k => { init[k] = true })
    return init
  })
  const [customCarriers, setCustomCarriers] = useState(existing.customCarriers ?? [])
  const [exportRates, setExportRates] = useState(existing.exportRates ?? [])
  const [tab, setTab] = useState('parcels')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Custom carrier form
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [customLogo, setCustomLogo] = useState('')
  const [customCategory, setCustomCategory] = useState('parcel')

  // Export rate form
  const [expCountry, setExpCountry] = useState('')
  const [expPrice, setExpPrice] = useState('')
  const [expWeight, setExpWeight] = useState('')
  const [expSize, setExpSize] = useState('')

  function toggleCarrier(type) {
    setEnabledCarriers(prev => {
      const next = { ...prev, [type]: !prev[type] }
      if (!next[type]) {
        setCarrierPrices(p => { const n = { ...p }; delete n[type]; return n })
      }
      return next
    })
  }

  function setPrice(type, val) {
    setCarrierPrices(prev => ({ ...prev, [type]: val ? Number(val) : 0 }))
  }

  function addCustom() {
    if (!customName.trim()) return
    setCustomCarriers(prev => [...prev, {
      name: customName.trim(),
      price: customPrice ? Number(customPrice) : 0,
      logo: customLogo.trim() || null,
      category: customCategory,
    }])
    setCustomName('')
    setCustomPrice('')
    setCustomLogo('')
  }

  function removeCustom(i) {
    setCustomCarriers(prev => prev.filter((_, idx) => idx !== i))
  }

  function addExportRate() {
    if (!expCountry.trim()) return
    setExportRates(prev => [...prev, {
      country: expCountry.trim(),
      price: expPrice ? Number(expPrice) : 0,
      maxWeight: expWeight ? Number(expWeight) : null,
      maxSize: expSize.trim() || null,
      flag: null,
    }])
    setExpCountry('')
    setExpPrice('')
    setExpWeight('')
    setExpSize('')
  }

  function removeExport(i) {
    setExportRates(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    setSaving(true)
    const config = {
      priceIncluded,
      carriers: carrierPrices,
      customCarriers,
      exportRates,
    }
    onSave?.(config)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1200) }, 400)
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>Delivery Pricing</span>
          <span className={styles.sub}>
            {product?.name ?? 'Product'} — set delivery costs per carrier
          </span>
        </div>

        {/* Price included toggle */}
        <div className={styles.inclRow} onClick={() => setPriceIncluded(v => !v)}>
          <div className={styles.inclInfo}>
            <span className={styles.inclLabel}>Price Included</span>
            <span className={styles.inclSub}>Delivery cost included in product price</span>
          </div>
          <div className={`${styles.toggle} ${priceIncluded ? styles.toggleOn : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['parcels', 'cargo', 'custom', 'export'].map(t => (
            <button key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'parcels' ? 'Parcels' : t === 'cargo' ? 'Cargo' : t === 'custom' ? 'Custom' : 'Export'}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {/* ── Parcels ── */}
          {tab === 'parcels' && PARCEL_CARRIERS.map(c => (
            <div key={c.type} className={`${styles.carrierRow} ${enabledCarriers[c.type] ? styles.carrierOn : ''}`}>
              <div className={styles.carrierToggle} onClick={() => toggleCarrier(c.type)}>
                <div className={`${styles.check} ${enabledCarriers[c.type] ? styles.checkOn : ''}`}>
                  {enabledCarriers[c.type] && <span>✓</span>}
                </div>
                <span className={styles.carrierName}>{c.label}</span>
              </div>
              {enabledCarriers[c.type] && !priceIncluded && (
                <div className={styles.priceInput} onClick={e => e.stopPropagation()}>
                  <span className={styles.rpLabel}>Rp</span>
                  <input
                    type="number"
                    className={styles.priceField}
                    value={carrierPrices[c.type] ?? ''}
                    onChange={e => setPrice(c.type, e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          ))}

          {/* ── Cargo ── */}
          {tab === 'cargo' && CARGO_CARRIERS.map(c => (
            <div key={c.type} className={`${styles.carrierRow} ${enabledCarriers[c.type] ? styles.carrierOn : ''}`}>
              <div className={styles.carrierToggle} onClick={() => toggleCarrier(c.type)}>
                <div className={`${styles.check} ${enabledCarriers[c.type] ? styles.checkOn : ''}`}>
                  {enabledCarriers[c.type] && <span>✓</span>}
                </div>
                <span className={styles.carrierName}>{c.label}</span>
              </div>
              {enabledCarriers[c.type] && !priceIncluded && (
                <div className={styles.priceInput} onClick={e => e.stopPropagation()}>
                  <span className={styles.rpLabel}>Rp</span>
                  <input
                    type="number"
                    className={styles.priceField}
                    value={carrierPrices[c.type] ?? ''}
                    onChange={e => setPrice(c.type, e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          ))}

          {/* ── Custom Carriers ── */}
          {tab === 'custom' && (
            <>
              <div className={styles.formSection}>
                <span className={styles.formTitle}>Add Your Own Carrier</span>
                <input className={styles.textInput} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Carrier name" />
                <input className={styles.textInput} value={customLogo} onChange={e => setCustomLogo(e.target.value)} placeholder="Logo URL (optional)" />
                <div className={styles.formRow}>
                  <div className={styles.priceInput} style={{ flex: 1 }}>
                    <span className={styles.rpLabel}>Rp</span>
                    <input type="number" className={styles.priceField} value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Price" />
                  </div>
                  <select className={styles.selectInput} value={customCategory} onChange={e => setCustomCategory(e.target.value)}>
                    <option value="parcel">Parcel</option>
                    <option value="cargo">Cargo</option>
                  </select>
                </div>
                <button className={styles.addBtn} onClick={addCustom} disabled={!customName.trim()}>+ Add Carrier</button>
              </div>

              {customCarriers.length > 0 && (
                <div className={styles.customList}>
                  {customCarriers.map((c, i) => (
                    <div key={i} className={styles.customRow}>
                      {c.logo ? <img src={c.logo} alt="" className={styles.customLogo} /> : <div className={styles.customDot}>{c.name.charAt(0)}</div>}
                      <div className={styles.customInfo}>
                        <span className={styles.customName}>{c.name}</span>
                        <span className={styles.customCat}>{c.category}</span>
                      </div>
                      <span className={styles.customPrice}>Rp {fmtIDR(c.price)}</span>
                      <button className={styles.removeBtn} onClick={() => removeCustom(i)}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Export Rates ── */}
          {tab === 'export' && (
            <>
              {/* DHL, FedEx, Pos Indonesia */}
              {EXPORT_CARRIERS.map(c => (
                <div key={c.type} className={`${styles.carrierRow} ${enabledCarriers[c.type] ? styles.carrierOn : ''}`}>
                  <div className={styles.carrierToggle} onClick={() => toggleCarrier(c.type)}>
                    <div className={`${styles.check} ${enabledCarriers[c.type] ? styles.checkOn : ''}`}>
                      {enabledCarriers[c.type] && <span>✓</span>}
                    </div>
                    <span className={styles.carrierName}>{c.label}</span>
                  </div>
                  {enabledCarriers[c.type] && !priceIncluded && (
                    <div className={styles.priceInput} onClick={e => e.stopPropagation()}>
                      <span className={styles.rpLabel}>Rp</span>
                      <input
                        type="number"
                        className={styles.priceField}
                        value={carrierPrices[c.type] ?? ''}
                        onChange={e => setPrice(c.type, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className={styles.formSection}>
                <span className={styles.formTitle}>Add Country Rate</span>
                <input className={styles.textInput} value={expCountry} onChange={e => setExpCountry(e.target.value)} placeholder="Country (e.g. Australia)" />
                <div className={styles.formRow}>
                  <div className={styles.priceInput} style={{ flex: 1 }}>
                    <span className={styles.rpLabel}>Rp</span>
                    <input type="number" className={styles.priceField} value={expPrice} onChange={e => setExpPrice(e.target.value)} placeholder="Price" />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <input className={styles.textInput} style={{ flex: 1 }} value={expWeight} onChange={e => setExpWeight(e.target.value)} placeholder="Max weight (kg)" type="number" />
                  <input className={styles.textInput} style={{ flex: 1 }} value={expSize} onChange={e => setExpSize(e.target.value)} placeholder="Max size (e.g. 30x30x30cm)" />
                </div>
                <button className={styles.addBtn} onClick={addExportRate} disabled={!expCountry.trim()}>+ Add Rate</button>
              </div>

              {exportRates.length > 0 && (
                <div className={styles.customList}>
                  {exportRates.map((r, i) => (
                    <div key={i} className={styles.exportRow}>
                      <div className={styles.exportInfo}>
                        <span className={styles.exportCountry}>{r.country}</span>
                        <span className={styles.exportMeta}>
                          {r.maxWeight ? `${r.maxWeight}kg` : 'Any'}
                          {r.maxSize ? ` / ${r.maxSize}` : ''}
                        </span>
                      </div>
                      <span className={styles.customPrice}>Rp {fmtIDR(r.price)}</span>
                      <button className={styles.removeBtn} onClick={() => removeExport(i)}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`} onClick={handleSave} disabled={saving || saved}>
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Delivery Pricing'}
          </button>
        </div>
      </div>
    </div>
  )
}
