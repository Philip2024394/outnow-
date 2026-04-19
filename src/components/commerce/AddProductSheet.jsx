/**
 * AddProductSheet — Shopee-style product listing form for sellers.
 * Covers: images, name, category, description, price, stock, variations,
 * shipping weight/dimensions, condition, and pre-order toggle.
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { saveProduct } from '@/services/commerceService'
import styles from './AddProductSheet.module.css'

const PRODUCT_CATEGORIES = [
  { id: 'womens_fashion',     label: "Women's Fashion" },
  { id: 'mens_fashion',       label: "Men's Fashion" },
  { id: 'shoes',              label: 'Shoes' },
  { id: 'bags',               label: 'Bags & Luggage' },
  { id: 'watches_jewellery',  label: 'Watches & Jewellery' },
  { id: 'muslim_fashion',     label: 'Muslim Fashion' },
  { id: 'phones_accessories', label: 'Phones & Accessories' },
  { id: 'computers',          label: 'Computers & Laptops' },
  { id: 'electronics',        label: 'Electronics' },
  { id: 'cameras',            label: 'Cameras & Photography' },
  { id: 'tv_appliances',      label: 'TV & Home Appliances' },
  { id: 'beauty',             label: 'Beauty & Skincare' },
  { id: 'health',             label: 'Health & Personal Care' },
  { id: 'food_beverages',     label: 'Food & Beverages' },
  { id: 'groceries',          label: 'Groceries' },
  { id: 'mom_baby',           label: 'Mom & Baby' },
  { id: 'toys_games',         label: 'Toys & Games' },
  { id: 'sports_outdoor',     label: 'Sports & Outdoors' },
  { id: 'home_living',        label: 'Home & Living' },
  { id: 'furniture',          label: 'Furniture & Decor' },
  { id: 'tools_garden',       label: 'Tools & Garden' },
  { id: 'automotive',         label: 'Automotive & Motorcycles' },
  { id: 'books_stationery',   label: 'Books & Stationery' },
  { id: 'pet_supplies',       label: 'Pet Supplies' },
  { id: 'hobbies',            label: 'Hobbies & Collections' },
  { id: 'vouchers_services',  label: 'Vouchers & Services' },
]

const CARRIERS = [
  { id: 'spx',     label: 'Indoo Express' },
  { id: 'jne',     label: 'JNE' },
  { id: 'jnt',     label: 'J&T Express' },
  { id: 'sicepat', label: 'SiCepat' },
  { id: 'ninja',   label: 'Ninja Express' },
  { id: 'anteraja',label: 'Anteraja' },
  { id: 'pos',     label: 'Pos Indonesia' },
  { id: 'grab',    label: 'GrabExpress' },
  { id: 'gosend',  label: 'GoSend' },
]

export default function AddProductSheet({ open, onClose, onSaved, userId, editProduct = null }) {
  // Basic info
  const [name, setName] = useState(editProduct?.name || '')
  const [category, setCategory] = useState(editProduct?.category || '')
  const [description, setDescription] = useState(editProduct?.description || '')
  const [brand, setBrand] = useState(editProduct?.brand_name || '')
  const [images, setImages] = useState(editProduct?.images || [])

  // Sales info
  const [price, setPrice] = useState(editProduct?.price || '')
  const [stock, setStock] = useState(editProduct?.stock ?? '')
  const [sku, setSku] = useState(editProduct?.sku || '')
  const [condition, setCondition] = useState(editProduct?.condition || 'new')

  // Variations
  const [hasVariations, setHasVariations] = useState(editProduct?.variants ? true : false)
  const [varType1, setVarType1] = useState('Color')
  const [varOptions1, setVarOptions1] = useState(editProduct?.variants?.color?.join(', ') || '')
  const [varType2, setVarType2] = useState('Size')
  const [varOptions2, setVarOptions2] = useState(editProduct?.variants?.size?.join(', ') || '')

  // Wholesale
  const [hasWholesale, setHasWholesale] = useState(false)
  const [wholesale, setWholesale] = useState([{ minQty: 2, maxQty: 5, price: '' }])

  // Shipping
  const [weight, setWeight] = useState(editProduct?.weight_grams || '')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [carriers, setCarriers] = useState(['spx', 'jne', 'jnt'])
  const [preorder, setPreorder] = useState(false)
  const [preorderDays, setPreorderDays] = useState(7)

  const [section, setSection] = useState('basic')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  if (!open) return null

  const toggleCarrier = (id) => setCarriers(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleImageAdd = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setImages(prev => [...prev, blobUrl].slice(0, 9))
    // Reset input so the same file can be re-selected if needed
    e.target.value = ''
  }

  const handleSave = async (asDraft = false) => {
    if (!name.trim() || !category || !price) return
    setSaving(true)

    const product = {
      id: editProduct?.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      name: name.trim(),
      category,
      description: description.trim(),
      brand_name: brand.trim() || null,
      price: Number(price),
      stock: stock === '' ? null : Number(stock),
      sku: sku.trim() || null,
      condition,
      active: !asDraft,
      image: images[0] || null,
      images,
      weight_grams: weight ? Number(weight) : null,
      dimensions: (length && width && height) ? `${length}x${width}x${height}cm` : null,
      carriers,
      preorder: preorder ? preorderDays : null,
      variants: hasVariations ? {
        [varType1.toLowerCase()]: varOptions1.split(',').map(s => s.trim()).filter(Boolean),
        ...(varOptions2.trim() ? { [varType2.toLowerCase()]: varOptions2.split(',').map(s => s.trim()).filter(Boolean) } : {}),
      } : null,
      wholesale: hasWholesale ? wholesale.filter(w => w.price) : null,
    }

    if (userId) {
      await saveProduct(userId, product)
    }

    // localStorage fallback
    const key = 'indoo_seller_products'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex(p => p.id === product.id)
    if (idx >= 0) existing[idx] = product
    else existing.unshift(product)
    localStorage.setItem(key, JSON.stringify(existing))

    setSaving(false)
    onSaved?.(product)
    onClose?.()
  }

  const SECTIONS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'sales', label: 'Price & Stock' },
    { id: 'shipping', label: 'Shipping' },
  ]

  return createPortal(
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          <span className={styles.headerTitle}>{editProduct ? 'Edit Product' : 'Add New Product'}</span>
          <button className={styles.draftBtn} onClick={() => handleSave(true)} disabled={!name.trim() || saving}>
            Save Draft
          </button>
        </div>

        {/* Section tabs */}
        <div className={styles.tabs}>
          {SECTIONS.map(s => (
            <button key={s.id} className={`${styles.tab} ${section === s.id ? styles.tabActive : ''}`}
              onClick={() => setSection(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* ═══ BASIC INFO ═══ */}
          {section === 'basic' && (
            <>
              {/* Images */}
              <div className={styles.field}>
                <label className={styles.label}>Product Images <span className={styles.hint}>(up to 9, first = cover)</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelected}
                />
                <div className={styles.imageGrid}>
                  {images.map((img, i) => (
                    <div key={i} className={styles.imageThumb}>
                      <img src={img} alt="" />
                      <button className={styles.imageRemove} onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>&times;</button>
                      {i === 0 && <span className={styles.coverBadge}>Cover</span>}
                    </div>
                  ))}
                  {images.length < 9 && (
                    <button className={styles.imageAdd} onClick={handleImageAdd}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span>Add Photo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Product name */}
              <div className={styles.field}>
                <label className={styles.label}>Product Name *</label>
                <input className={styles.input} value={name} onChange={e => setName(e.target.value)}
                  placeholder="Brand + Product Type + Key Spec" maxLength={120} />
                <span className={styles.charCount}>{name.length}/120</span>
              </div>

              {/* Category */}
              <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className={styles.field}>
                <label className={styles.label}>Brand</label>
                <input className={styles.input} value={brand} onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Nike, Samsung, No Brand" />
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Product features, specs, size chart, package contents..." rows={5} maxLength={3000} />
                <span className={styles.charCount}>{description.length}/3000</span>
              </div>

              {/* Condition */}
              <div className={styles.field}>
                <label className={styles.label}>Condition</label>
                <div className={styles.condRow}>
                  <button className={`${styles.condBtn} ${condition === 'new' ? styles.condBtnOn : ''}`}
                    onClick={() => setCondition('new')}>New</button>
                  <button className={`${styles.condBtn} ${condition === 'like_new' ? styles.condBtnOn : ''}`}
                    onClick={() => setCondition('like_new')}>Like New</button>
                  <button className={`${styles.condBtn} ${condition === 'good' ? styles.condBtnOn : ''}`}
                    onClick={() => setCondition('good')}>Good</button>
                  <button className={`${styles.condBtn} ${condition === 'fair' ? styles.condBtnOn : ''}`}
                    onClick={() => setCondition('fair')}>Fair</button>
                </div>
              </div>
            </>
          )}

          {/* ═══ PRICE & STOCK ═══ */}
          {section === 'sales' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Price (IDR) *</label>
                <input className={styles.input} type="number" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 150000" min={0} />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Stock</label>
                  <input className={styles.input} type="number" value={stock} onChange={e => setStock(e.target.value)}
                    placeholder="Qty" min={0} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>SKU</label>
                  <input className={styles.input} value={sku} onChange={e => setSku(e.target.value)}
                    placeholder="Optional" />
                </div>
              </div>

              {/* Variations */}
              <div className={styles.field}>
                <label className={styles.toggleRow}>
                  <input type="checkbox" checked={hasVariations} onChange={e => setHasVariations(e.target.checked)} />
                  <span className={styles.label} style={{ margin: 0 }}>Enable Variations</span>
                </label>
              </div>
              {hasVariations && (
                <div className={styles.variationBox}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Variation 1 Type</label>
                      <select className={styles.select} value={varType1} onChange={e => setVarType1(e.target.value)}>
                        <option>Color</option><option>Size</option><option>Style</option><option>Material</option>
                      </select>
                    </div>
                    <div className={styles.field} style={{ flex: 2 }}>
                      <label className={styles.label}>Options (comma separated)</label>
                      <input className={styles.input} value={varOptions1} onChange={e => setVarOptions1(e.target.value)}
                        placeholder="e.g. Red, Blue, Black" />
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Variation 2 Type</label>
                      <select className={styles.select} value={varType2} onChange={e => setVarType2(e.target.value)}>
                        <option>Size</option><option>Color</option><option>Style</option><option>Material</option>
                      </select>
                    </div>
                    <div className={styles.field} style={{ flex: 2 }}>
                      <label className={styles.label}>Options (comma separated)</label>
                      <input className={styles.input} value={varOptions2} onChange={e => setVarOptions2(e.target.value)}
                        placeholder="e.g. S, M, L, XL" />
                    </div>
                  </div>
                </div>
              )}

              {/* Wholesale */}
              <div className={styles.field}>
                <label className={styles.toggleRow}>
                  <input type="checkbox" checked={hasWholesale} onChange={e => setHasWholesale(e.target.checked)} />
                  <span className={styles.label} style={{ margin: 0 }}>Wholesale Pricing</span>
                </label>
              </div>
              {hasWholesale && (
                <div className={styles.wholesaleBox}>
                  {wholesale.map((w, i) => (
                    <div key={i} className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.label}>Min Qty</label>
                        <input className={styles.input} type="number" value={w.minQty}
                          onChange={e => { const v = [...wholesale]; v[i].minQty = Number(e.target.value); setWholesale(v) }} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Max Qty</label>
                        <input className={styles.input} type="number" value={w.maxQty}
                          onChange={e => { const v = [...wholesale]; v[i].maxQty = Number(e.target.value); setWholesale(v) }} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Price/unit</label>
                        <input className={styles.input} type="number" value={w.price}
                          onChange={e => { const v = [...wholesale]; v[i].price = e.target.value; setWholesale(v) }}
                          placeholder="IDR" />
                      </div>
                    </div>
                  ))}
                  {wholesale.length < 3 && (
                    <button className={styles.addTierBtn} onClick={() => setWholesale(prev => [...prev, { minQty: prev[prev.length-1]?.maxQty + 1 || 6, maxQty: 10, price: '' }])}>
                      + Add Tier
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ SHIPPING ═══ */}
          {section === 'shipping' && (
            <>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Weight (grams) *</label>
                  <input className={styles.input} type="number" value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="e.g. 500" min={0} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Package Size (cm)</label>
                <div className={styles.fieldRow}>
                  <input className={styles.input} type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="L" min={0} />
                  <input className={styles.input} type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="W" min={0} />
                  <input className={styles.input} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="H" min={0} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Shipping Channels</label>
                <div className={styles.carrierGrid}>
                  {CARRIERS.map(c => (
                    <label key={c.id} className={`${styles.carrierOpt} ${carriers.includes(c.id) ? styles.carrierOn : ''}`}>
                      <input type="checkbox" checked={carriers.includes(c.id)} onChange={() => toggleCarrier(c.id)} />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.toggleRow}>
                  <input type="checkbox" checked={preorder} onChange={e => setPreorder(e.target.checked)} />
                  <span className={styles.label} style={{ margin: 0 }}>Pre-order</span>
                </label>
                {preorder && (
                  <div className={styles.preorderRow}>
                    <span className={styles.hint}>Processing time:</span>
                    <input className={styles.inputSmall} type="number" value={preorderDays}
                      onChange={e => setPreorderDays(Math.min(15, Math.max(1, Number(e.target.value))))} min={1} max={15} />
                    <span className={styles.hint}>days</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.publishBtn} onClick={() => handleSave(false)}
            disabled={!name.trim() || !category || !price || saving}>
            {saving ? 'Publishing...' : 'Publish Product'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
