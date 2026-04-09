import { useState, useEffect } from 'react'
import {
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '@/services/productService'
import ProductImageEditor from '@/components/commerce/ProductImageEditor'
import { CATEGORY_SPECS, ALL_CATEGORIES } from '@/data/categorySpecs'
import styles from './MicroShopEditor.module.css'

const PREMIUM_LIMIT = 6
const CURRENCIES = ['IDR', 'GBP', 'USD', 'EUR']

function formatPrice(price, currency = 'IDR') {
  if (currency === 'IDR') {
    const n = parseFloat(price) || 0
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
    if (n >= 1_000) return `${n.toLocaleString('id-ID')}rp`
    return `${n}rp`
  }
  const symbols = { GBP: '£', USD: '$', EUR: '€' }
  return `${symbols[currency] ?? currency}${parseFloat(price).toFixed(2)}`
}

// ── Dynamic spec fields based on category ────────────────────────────────────
function SpecsSection({ category, specs, onChange }) {
  const fields = CATEGORY_SPECS[category] ?? []
  if (!fields.length) return null

  return (
    <div className={styles.specsSection}>
      <div className={styles.specsSectionTitle}>
        Specifications
        <span className={styles.specsSectionSub}> — {category}</span>
      </div>
      {fields.map(field => (
        <div key={field.key} className={styles.specRow}>
          <label className={styles.specLabel}>{field.key}</label>
          {field.type === 'select' ? (
            <select
              className={styles.specSelect}
              value={specs[field.key] ?? ''}
              onChange={e => onChange(field.key, e.target.value)}
            >
              <option value="">— select —</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              className={styles.specInput}
              type="text"
              placeholder={field.placeholder ?? ''}
              value={specs[field.key] ?? ''}
              onChange={e => onChange(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ProductFormSheet({ product, userId, tier, onSaved, onClose }) {
  const isEdit = !!product
  const [name,       setName]       = useState(product?.name ?? '')
  const [price,      setPrice]      = useState(product?.price != null ? String(product.price) : '')
  const [currency,   setCurrency]   = useState(product?.currency ?? 'IDR')
  const [category,   setCategory]   = useState(product?.category ?? '')
  const [desc,       setDesc]       = useState(product?.description ?? '')
  const [specs,      setSpecs]      = useState(product?.specs ?? {})
  const [imageUrl,   setImageUrl]   = useState(product?.image_url ?? product?.image ?? '')
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState('')
  const [showEditor, setShowEditor] = useState(false)

  // Reset specs when category changes
  function handleCategoryChange(val) {
    setCategory(val)
    setSpecs({})
  }

  function handleSpecChange(key, val) {
    setSpecs(prev => ({ ...prev, [key]: val }))
  }

  async function handleEditorConfirm(blob, previewUrl) {
    setShowEditor(false)
    if (!blob && !previewUrl) return
    if (!blob) { setImageUrl(previewUrl); return }
    setUploading(true)
    setError('')
    try {
      const file = new File([blob], 'product.jpg', { type: 'image/jpeg' })
      const url  = await uploadProductImage(userId, file)
      setImageUrl(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // Strip empty spec values before saving
  function cleanSpecs(raw) {
    const out = {}
    Object.entries(raw).forEach(([k, v]) => { if (v && v.trim()) out[k] = v.trim() })
    return Object.keys(out).length ? out : null
  }

  async function handleSave() {
    if (!name.trim()) return setError('Product name is required.')
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0)
      return setError('Enter a valid price (0 or more).')
    setSaving(true)
    setError('')
    const payload = {
      name, price, currency,
      category: category || null,
      imageUrl: imageUrl || null,
      description: desc || null,
      specs: cleanSpecs(specs),
    }
    try {
      if (isEdit) {
        await updateProduct(product.id, payload)
      } else {
        await addProduct({ userId, tier, ...payload })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <button className={styles.sheetCancel} onClick={onClose}>Cancel</button>
          <span className={styles.sheetTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</span>
          <button className={styles.sheetSave} onClick={handleSave} disabled={saving || uploading}>
            {saving ? '…' : 'Save'}
          </button>
        </div>

        {/* Image picker */}
        <div className={styles.imagePicker} onClick={() => !uploading && setShowEditor(true)}>
          {imageUrl
            ? <img src={imageUrl} alt="Product" className={styles.imagePreview} />
            : <div className={styles.imagePlaceholderBtn}>
                <span className={styles.imageIcon}>{uploading ? '⏳' : '📷'}</span>
                <span className={styles.imageLabel}>{uploading ? 'Uploading…' : 'Add Photo'}</span>
              </div>
          }
          {imageUrl && !uploading && (
            <div className={styles.imageOverlay}><span>📷 Edit</span></div>
          )}
        </div>

        {showEditor && (
          <ProductImageEditor
            initialUrl={imageUrl || null}
            onConfirm={handleEditorConfirm}
            onCancel={() => setShowEditor(false)}
          />
        )}

        <div className={styles.fields}>
          <label className={styles.fieldLabel}>Product name *</label>
          <input
            className={styles.input}
            placeholder="e.g. Leather Crossbody Bag"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
          />

          {/* Category — drives the spec fields below */}
          <label className={styles.fieldLabel}>Category</label>
          <input
            className={styles.input}
            list="category-list"
            placeholder="Select or type a category…"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
          />
          <datalist id="category-list">
            {ALL_CATEGORIES.map(c => <option key={c} value={c} />)}
          </datalist>

          <label className={styles.fieldLabel}>Price *</label>
          <div className={styles.priceRow}>
            <select
              className={styles.currencySelect}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              className={`${styles.input} ${styles.priceInput}`}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <label className={styles.fieldLabel}>
            Description <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Short description…"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={300}
            rows={3}
          />

          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* Dynamic spec fields — shown when a known category is selected */}
        <SpecsSection
          category={category}
          specs={specs}
          onChange={handleSpecChange}
        />
      </div>
    </div>
  )
}

export default function MicroShopEditor({ userId, tier, visible = true }) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  const limit   = tier === 'business' ? Infinity : PREMIUM_LIMIT
  const atLimit = products.length >= limit

  async function load() {
    setLoading(true)
    try { setProducts(await getMyProducts(userId)) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { if (visible) load() }, [visible]) // eslint-disable-line

  function openAdd()         { setEditing(null); setShowForm(true) }
  function openEdit(product) { setEditing(product); setShowForm(true) }
  function closeForm()       { setShowForm(false); setEditing(null) }
  async function onSaved()   { closeForm(); await load() }

  async function handleDelete(product) {
    if (deleting) return
    if (!window.confirm(`Delete "${product.name}"?`)) return
    setDeleting(product.id)
    try { await deleteProduct(product.id, product.image_url) }
    catch { /* silent */ }
    finally { setDeleting(null); load() }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.headerIcon}>🛍️</span>
        <span className={styles.headerTitle}>My Shop</span>
        <span className={styles.headerMeta}>
          {tier === 'business' ? 'Unlimited' : `${products.length}/${PREMIUM_LIMIT}`}
        </span>
      </header>

      {!atLimit && (
        <button className={styles.addBtn} onClick={openAdd}>+ Add product</button>
      )}
      {atLimit && tier !== 'business' && (
        <p className={styles.limitNote}>Upgrade to Business for unlimited products.</p>
      )}

      {loading ? (
        <div className={styles.skeletonList}>
          {[0,1,2].map(i => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛒</span>
          <p className={styles.emptyText}>No products yet. Tap "+ Add product" to start.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {products.map(p => (
            <div key={p.id} className={`${styles.row} ${!p.active ? styles.rowInactive : ''}`}>
              <div className={styles.rowThumb}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className={styles.thumb} />
                  : <div className={styles.thumbPlaceholder}>🛍️</div>
                }
              </div>
              <div className={styles.rowInfo}>
                <p className={styles.rowName}>{p.name}</p>
                <p className={styles.rowPrice}>{formatPrice(p.price, p.currency)}</p>
                {p.category && <p className={styles.rowCategory}>{p.category}</p>}
              </div>
              <div className={styles.rowActions}>
                <button className={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}
                >
                  {deleting === p.id ? '…' : 'Del'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormSheet
          product={editing}
          userId={userId}
          tier={tier}
          onSaved={onSaved}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
