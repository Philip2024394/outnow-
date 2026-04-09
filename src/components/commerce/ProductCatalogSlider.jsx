import { useState, useRef } from 'react'
import { saveProduct, deleteProduct, DEMO_PRODUCTS } from '@/services/commerceService'
import styles from './ProductCatalogSlider.module.css'

// ─────────────────────────────────────────────────────────────────────────────
// ProductCatalogSlider — slides from LEFT, 50% screen width
// Displays product grid + inline add/edit form
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name: '', price: '', currency: 'USD', category: '', stock: '',
  description: '', image: '', active: true, condition: 'new',
}

const CATEGORIES = [
  'Electronics', 'Fashion', 'Beauty', 'Wellness', 'Handmade',
  'Home', 'Food & Drink', 'Art & Craft', 'Vintage', 'Other',
]

export default function ProductCatalogSlider({ open, onClose, userId, products = DEMO_PRODUCTS, onProductsChange }) {
  const [editing, setEditing]     = useState(null)   // null | product obj
  const [form, setForm]           = useState(EMPTY_PRODUCT)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(null)
  const imgInputRef               = useRef(null)

  function openNew() {
    setForm({ ...EMPTY_PRODUCT })
    setEditing('new')
  }

  function openEdit(p) {
    setForm({ ...p })
    setEditing(p)
  }

  function closeForm() {
    setEditing(null)
    setForm(EMPTY_PRODUCT)
  }

  function patch(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    const saved = await saveProduct(userId, { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 })
    const result = saved ?? { ...form, id: `local-${Date.now()}` }
    if (editing === 'new') {
      onProductsChange?.([result, ...products])
    } else {
      onProductsChange?.(products.map(p => p.id === result.id ? result : p))
    }
    setSaving(false)
    closeForm()
  }

  async function handleDelete(productId) {
    setDeleting(productId)
    await deleteProduct(productId)
    onProductsChange?.(products.filter(p => p.id !== productId))
    setDeleting(null)
    if (editing?.id === productId) closeForm()
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className={styles.backdrop} onClick={onClose} />}

      {/* Slider panel — 50vw from left */}
      <div className={[styles.slider, open ? styles.sliderOpen : ''].join(' ')}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.echo}>ECHO</span>
            <span className={styles.catalog}>Product Catalog</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Add new button */}
          {!editing && (
            <button className={styles.addBtn} onClick={openNew}>
              + Add New Product
            </button>
          )}

          {/* ── Inline form ── */}
          {editing && (
            <div className={styles.form}>
              <div className={styles.formTitle}>
                {editing === 'new' ? 'New Product' : 'Edit Product'}
              </div>

              {/* Product image */}
              <div className={styles.formImgArea} onClick={() => imgInputRef.current?.click()}>
                {form.image
                  ? <img src={form.image} alt="Product" className={styles.formImg} />
                  : <span className={styles.formImgPlaceholder}>📷 Tap to add image</span>
                }
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) patch('image', URL.createObjectURL(file))
                  }}
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Product Name *</label>
                <input className={styles.formInput} value={form.name} onChange={e => patch('name', e.target.value)} placeholder="e.g. Wireless Earbuds Pro" />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Price *</label>
                  <input className={styles.formInput} type="number" min="0" step="0.01" value={form.price} onChange={e => patch('price', e.target.value)} placeholder="0.00" />
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Currency</label>
                  <select className={styles.formSelect} value={form.currency} onChange={e => patch('currency', e.target.value)}>
                    {['USD','GBP','EUR','AUD','NGN','KES','ZAR','INR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formSelect} value={form.category} onChange={e => patch('category', e.target.value)}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Stock</label>
                  <input className={styles.formInput} type="number" min="0" value={form.stock} onChange={e => patch('stock', e.target.value)} placeholder="0" />
                </div>
              </div>

              {/* Condition: New or Used */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Condition</label>
                <div className={styles.conditionRow}>
                  {['new', 'used', 'refurbished'].map(c => (
                    <button
                      key={c}
                      type="button"
                      className={[styles.conditionBtn, form.condition === c ? styles.conditionBtnActive : ''].join(' ')}
                      onClick={() => patch('condition', c)}
                    >
                      {c === 'new' ? '✨ New' : c === 'used' ? '♻️ Used' : '🔧 Refurbished'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={form.description}
                  onChange={e => patch('description', e.target.value)}
                  placeholder="Brief product description…"
                  rows={3}
                />
              </div>

              {/* Active toggle */}
              <label className={styles.activeToggle}>
                <input type="checkbox" checked={form.active} onChange={e => patch('active', e.target.checked)} />
                <span>List product publicly</span>
              </label>

              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={closeForm} disabled={saving}>Cancel</button>
                {editing !== 'new' && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(editing.id)}
                    disabled={deleting === editing.id}
                  >
                    {deleting === editing.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.name.trim() || !form.price}>
                  {saving ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </div>
          )}

          {/* ── Product grid ── */}
          {!editing && (
            <div className={styles.grid}>
              {products.map(p => (
                <div
                  key={p.id}
                  className={[styles.card, !p.active ? styles.cardInactive : ''].join(' ')}
                  onClick={() => openEdit(p)}
                >
                  {p.image
                    ? <img src={p.image} alt={p.name} className={styles.cardImg} />
                    : <div className={styles.cardImgPlaceholder}>📦</div>
                  }
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{p.name}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardPrice}>${(parseFloat(p.price) || 0).toFixed(2)}</span>
                      {p.condition && p.condition !== 'new' && (
                        <span className={styles.cardCondition}>{p.condition}</span>
                      )}
                      {!p.active && <span className={styles.cardOff}>Hidden</span>}
                    </div>
                    <div className={styles.cardStock}>Stock: {p.stock ?? '–'}</div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className={styles.emptyGrid}>
                  No products yet. Add your first product above.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
