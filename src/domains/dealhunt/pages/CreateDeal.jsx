import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { uploadImage } from '@/lib/uploadImage'
import { createDeal } from '@/services/dealService'
import styles from './CreateDeal.module.css'

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { key: 'food',        icon: '\uD83C\uDF7D\uFE0F', label: 'Makanan' },
  { key: 'marketplace', icon: '\uD83D\uDECD\uFE0F', label: 'Marketplace' },
  { key: 'massage',     icon: '\uD83D\uDC86',       label: 'Massage' },
  { key: 'rentals',     icon: '\uD83D\uDE97',       label: 'Rental' },
  { key: 'rides',       icon: '\uD83C\uDFCD\uFE0F', label: 'Ojek' },
  { key: 'property',    icon: '\uD83C\uDFE0',       label: 'Properti' },
]

const SUB_CATEGORIES = {
  food:        ['Nasi', 'Mie & Bakso', 'Ayam', 'Seafood', 'Minuman', 'Snack', 'Kopi', 'Lainnya'],
  marketplace: ['Fashion', 'Elektronik', 'Kecantikan', 'Rumah Tangga', 'Olahraga', 'Lainnya'],
  massage:     ['Full Body', 'Reflexi', 'Couple', 'Spa Package', 'Lainnya'],
  rentals:     ['Motor', 'Mobil', 'Sepeda', 'Audio', 'Properti', 'Lainnya'],
  rides:       ['Ojek Motor', 'Taksi Mobil', 'Bandara', 'Lainnya'],
  property:    ['Kos', 'Villa', 'Apartemen', 'Lainnya'],
}

const QUICK_DURATIONS = [
  { label: '3 Jam',  hours: 3 },
  { label: '6 Jam',  hours: 6 },
  { label: '1 Hari', hours: 24 },
  { label: '3 Hari', hours: 72 },
  { label: '7 Hari', hours: 168 },
]

const MAX_IMAGES = 5
const MAX_TITLE = 100
const MAX_DESC = 500
const MAX_DEAL_DAYS = 7

const MIN_DISCOUNT = {
  food: 15,
  massage: 15,
  marketplace: 10,
  rentals: 10,
  rides: 10,
}
const DEFAULT_MIN_DISCOUNT = 10

const DEAL_TYPES = [
  { key: 'eat_in',   label: 'Makan di Tempat' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'pickup',   label: 'Ambil Sendiri' },
]

function toLocalDatetime(date) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatRp(n) {
  if (!n && n !== 0) return ''
  return Number(n).toLocaleString('id-ID')
}

/* ══════════════════════════════════════════════════════════════════════════════
   CREATE DEAL FORM
   ══════════════════════════════════════════════════════════════════════════════ */

export default function CreateDeal({ open, onClose, onSaved, userId }) {
  /* ── Form state ── */
  const [images, setImages]           = useState([])       // array of { file, url }
  const [uploading, setUploading]     = useState(false)
  const [category, setCategory]       = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [dealPrice, setDealPrice]     = useState('')
  const [quantity, setQuantity]       = useState('5')
  const [perUser, setPerUser]         = useState('1')
  const [dealType, setDealType]       = useState('pickup')
  const [indooRide, setIndooRide]     = useState(true)
  const [startTime, setStartTime]     = useState(toLocalDatetime(new Date()))
  const [endTime, setEndTime]         = useState(toLocalDatetime(new Date(Date.now() + 3 * 3600000)))
  const [quickDur, setQuickDur]       = useState(3)
  const [terms, setTerms]             = useState('')

  /* ── UI state ── */
  const [submitting, setSubmitting]   = useState(false)
  const [toast, setToast]             = useState(null)
  const [errors, setErrors]           = useState({})
  const fileRef = useRef(null)

  if (!open) return null

  /* ── Derived ── */
  const origNum = Number(originalPrice) || 0
  const dealNum = Number(dealPrice) || 0
  const discount = origNum > 0 ? Math.round((1 - dealNum / origNum) * 100) : 0
  const discountValid = origNum > 0 && dealNum > 0 && dealNum < origNum
  const discountTooHigh = discount > 70
  const minDiscount = MIN_DISCOUNT[category] || DEFAULT_MIN_DISCOUNT
  const discountTooLow = discountValid && discount < minDiscount
  const discountBad = origNum > 0 && dealNum > 0 && dealNum >= origNum
  const subCats = SUB_CATEGORIES[category] || []
  const catObj = CATEGORIES.find(c => c.key === category)
  const maxEnd = toLocalDatetime(new Date(new Date(startTime).getTime() + MAX_DEAL_DAYS * 86400000))

  /* ── Image handling ── */
  const handleAddImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || images.length >= MAX_IMAGES) return
    e.target.value = ''

    setUploading(true)
    try {
      const url = await uploadImage(file, 'deals')
      setImages(prev => [...prev, { file, url }])
    } catch (err) {
      showToast(err.message || 'Gagal upload gambar', 'error')
    }
    setUploading(false)
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  /* ── Quick duration ── */
  const applyQuickDuration = (hours) => {
    setQuickDur(hours)
    const start = new Date(startTime)
    setEndTime(toLocalDatetime(new Date(start.getTime() + hours * 3600000)))
  }

  /* ── Toast ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Validation ── */
  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Judul wajib diisi'
    if (images.length === 0) errs.images = 'Minimal 1 gambar'
    if (!category) errs.category = 'Pilih kategori'
    if (!origNum || origNum <= 0) errs.originalPrice = 'Harga normal wajib diisi'
    if (!dealNum || dealNum <= 0) errs.dealPrice = 'Harga deal wajib diisi'
    if (dealNum >= origNum) errs.dealPrice = 'Harga deal harus lebih murah'
    const catLabel = CATEGORIES.find(c => c.key === category)?.label || category
    const reqMin = MIN_DISCOUNT[category] || DEFAULT_MIN_DISCOUNT
    if (discountValid && discount < reqMin) errs.dealPrice = `Minimum diskon untuk ${catLabel} adalah ${reqMin}%`
    if (discountValid && discount > 90) errs.dealPrice = 'Diskon maksimal 90%'
    if (!quantity || Number(quantity) < 5) errs.quantity = 'Minimum 5 deal per posting'
    const st = new Date(startTime)
    const et = new Date(endTime)
    if (et <= st) errs.endTime = 'Harus setelah waktu mulai'
    if (et - st > MAX_DEAL_DAYS * 86400000) errs.endTime = 'Maksimal 7 hari dari mulai'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)

    try {
      const dealData = {
        seller_id: userId,
        domain: category,
        sub_category: subCategory || null,
        title: title.trim(),
        description: description.trim() || null,
        original_price: origNum,
        deal_price: dealNum,
        discount_pct: discount,
        quantity_available: Number(quantity) || 1,
        quantity_per_user: Number(perUser) || 1,
        images: images.map(img => img.url),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        terms: terms.trim() || null,
        redemption_method: 'voucher',
        deal_type: dealType,
        indoo_ride: dealType === 'delivery' ? indooRide : false,
      }

      const result = await createDeal(dealData)
      if (!result) throw new Error('Gagal membuat deal')

      showToast('Deal berhasil dipasang!', 'success')
      onSaved?.(result)
      setTimeout(() => onClose?.(), 600)
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    }
    setSubmitting(false)
  }

  /* ── Render ── */
  return createPortal(
    <div className={styles.overlay}>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Buat Deal Baru</span>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      {/* Scrollable content */}
      <div className={styles.content}>

        {/* ── 1. Image Upload ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Foto Deal</h3>
          <p className={styles.cardSub}>Tambahkan hingga 5 foto. Foto pertama jadi thumbnail.</p>
          <div className={styles.imageGrid}>
            {images.map((img, i) => (
              <div key={i} className={`${styles.imageSlot} ${i === 0 ? styles.imageSlotMain : ''}`}>
                <img src={img.url} alt="" className={styles.imageSlotImg} />
                <button className={styles.imageSlotRemove} onClick={() => removeImage(i)}>x</button>
                {i === 0 && <div className={styles.imageSlotBadge}>THUMB</div>}
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className={styles.imageAddBtn}>
                {uploading ? (
                  <span style={{ fontSize: 12, fontWeight: 700 }}>...</span>
                ) : (
                  <>
                    <span>+</span>
                    <span className={styles.imageAddLabel}>Tambah</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  style={{ display: 'none' }}
                  onChange={handleAddImage}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {errors.images && <div className={styles.error}>{errors.images}</div>}
        </div>

        {/* ── 2. Category Selector ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Kategori</h3>
          <p className={styles.cardSub}>Pilih kategori deal kamu</p>
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`${styles.catBtn} ${category === cat.key ? styles.catBtnActive : ''}`}
                onClick={() => { setCategory(cat.key); setSubCategory('') }}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
          {errors.category && <div className={styles.error}>{errors.category}</div>}
        </div>

        {/* ── 3. Sub-category ── */}
        {subCats.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Sub-kategori</h3>
            <p className={styles.cardSub}>{catObj?.label} &mdash; pilih jenis lebih spesifik</p>
            <select
              className={styles.select}
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
            >
              <option value="">-- Pilih sub-kategori --</option>
              {subCats.map(sc => (
                <option key={sc} value={sc.toLowerCase().replace(/\s+/g, '_')}>{sc}</option>
              ))}
            </select>
          </div>
        )}

        {/* ── 3b. Deal Type Selector ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tipe Deal</h3>
          <p className={styles.cardSub}>Pilih cara pelanggan mendapatkan deal</p>
          <div className={styles.catGrid}>
            {DEAL_TYPES.map(dt => (
              <button
                key={dt.key}
                className={`${styles.catBtn} ${dealType === dt.key ? styles.catBtnActive : ''}`}
                onClick={() => setDealType(dt.key)}
              >
                <span className={styles.catLabel}>{dt.label}</span>
              </button>
            ))}
          </div>
          {dealType === 'eat_in' && (
            <div className={styles.cardSub} style={{ marginTop: 8, fontStyle: 'italic', color: '#e67e22' }}>
              Voucher berlaku hari ini saja
            </div>
          )}
          {dealType === 'delivery' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={indooRide}
                onChange={e => setIndooRide(e.target.checked)}
              />
              Kirim dengan Indoo Ride (diskon Rp5.000)
            </label>
          )}
        </div>

        {/* ── 4. Deal Title ── */}
        <div className={styles.card}>
          <label className={styles.label}>Judul Deal</label>
          <input
            className={styles.input}
            value={title}
            onChange={e => { if (e.target.value.length <= MAX_TITLE) setTitle(e.target.value) }}
            placeholder="Judul deal yang menarik..."
            maxLength={MAX_TITLE}
          />
          <div className={`${styles.charCount} ${title.length > MAX_TITLE - 10 ? styles.charCountWarn : ''}`}>
            {title.length}/{MAX_TITLE}
          </div>
          {errors.title && <div className={styles.error}>{errors.title}</div>}
        </div>

        {/* ── 5. Description ── */}
        <div className={styles.card}>
          <label className={styles.label}>Deskripsi</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => { if (e.target.value.length <= MAX_DESC) setDescription(e.target.value) }}
            placeholder="Jelaskan deal kamu secara detail..."
            maxLength={MAX_DESC}
            rows={4}
          />
          <div className={`${styles.charCount} ${description.length > MAX_DESC - 30 ? styles.charCountWarn : ''}`}>
            {description.length}/{MAX_DESC}
          </div>
        </div>

        {/* ── 6. Price Section ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Harga</h3>
          <p className={styles.cardSub}>Tetapkan harga normal dan harga deal</p>
          <div className={styles.priceRow}>
            <div className={styles.priceField}>
              <label className={styles.label}>Harga Normal</label>
              <div className={styles.priceInputWrap}>
                <span className={styles.pricePrefix}>Rp</span>
                <input
                  className={styles.priceInput}
                  type="number"
                  inputMode="numeric"
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="100000"
                />
              </div>
              {errors.originalPrice && <div className={styles.error}>{errors.originalPrice}</div>}
            </div>
            <div className={styles.priceField}>
              <label className={styles.label}>Harga Deal</label>
              <div className={styles.priceInputWrap}>
                <span className={styles.pricePrefix}>Rp</span>
                <input
                  className={styles.priceInput}
                  type="number"
                  inputMode="numeric"
                  value={dealPrice}
                  onChange={e => setDealPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="60000"
                />
              </div>
              {errors.dealPrice && <div className={styles.error}>{errors.dealPrice}</div>}
            </div>
          </div>

          {/* Discount badge */}
          {origNum > 0 && dealNum > 0 && (
            discountBad ? (
              <span className={`${styles.discountBadge} ${styles.discountError}`}>
                Harga deal harus lebih murah dari harga normal!
              </span>
            ) : discountTooLow ? (
              <span className={`${styles.discountBadge} ${styles.discountError}`}>
                Diskon {discount}% &mdash; minimum diskon untuk {catObj?.label || category} adalah {minDiscount}%
              </span>
            ) : discountTooHigh ? (
              <span className={`${styles.discountBadge} ${styles.discountWarn}`}>
                Diskon {discount}%! Wow, yakin segitu?
              </span>
            ) : (
              <span className={`${styles.discountBadge} ${styles.discountGreen}`}>
                Diskon {discount}%!
              </span>
            )
          )}
        </div>

        {/* ── 7. Quantity & Per-user limit ── */}
        <div className={styles.card}>
          <div className={styles.numberRow}>
            <div className={styles.numberField}>
              <label className={styles.label}>Jumlah tersedia</label>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min="5"
                value={quantity}
                onChange={e => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10"
              />
              {errors.quantity && <div className={styles.error}>{errors.quantity}</div>}
            </div>
            <div className={styles.numberField}>
              <label className={styles.label}>Maks per pengguna</label>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min="1"
                value={perUser}
                onChange={e => setPerUser(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* ── 8. Duration ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Durasi Deal</h3>
          <p className={styles.cardSub}>Kapan deal dimulai dan berakhir (maks 7 hari)</p>
          <div className={styles.dateRow}>
            <div className={styles.dateField}>
              <label className={styles.label}>Mulai</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value)
                  setQuickDur(null)
                }}
              />
            </div>
            <div className={styles.dateField}>
              <label className={styles.label}>Berakhir</label>
              <input
                className={styles.input}
                type="datetime-local"
                value={endTime}
                max={maxEnd}
                onChange={e => {
                  setEndTime(e.target.value)
                  setQuickDur(null)
                }}
              />
              {errors.endTime && <div className={styles.error}>{errors.endTime}</div>}
            </div>
          </div>
          <div className={styles.quickBtns}>
            {QUICK_DURATIONS.map(d => (
              <button
                key={d.hours}
                className={`${styles.quickBtn} ${quickDur === d.hours ? styles.quickBtnActive : ''}`}
                onClick={() => applyQuickDuration(d.hours)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 9. Terms ── */}
        <div className={styles.card}>
          <label className={styles.label}>Syarat &amp; Ketentuan (opsional)</label>
          <textarea
            className={styles.textarea}
            value={terms}
            onChange={e => setTerms(e.target.value)}
            placeholder="Contoh: Berlaku dine-in saja, tidak bisa digabung promo lain..."
            rows={3}
          />
        </div>

        {/* ── 10. Preview Card ── */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Preview Deal</h3>
          <p className={styles.cardSub}>Tampilan deal kamu di feed</p>

          <div className={styles.preview}>
            {images.length > 0 ? (
              <img src={images[0].url} alt="" className={styles.previewImg} />
            ) : (
              <div className={styles.previewImgPlaceholder}>&#x1F4F7;</div>
            )}
            <div className={styles.previewBody}>
              {catObj && (
                <span className={styles.previewCat}>{catObj.icon} {catObj.label}</span>
              )}
              <h4 className={styles.previewTitle}>{title || 'Judul deal kamu...'}</h4>
              <div className={styles.previewPrices}>
                {dealNum > 0 && (
                  <span className={styles.previewDealPrice}>Rp {formatRp(dealNum)}</span>
                )}
                {origNum > 0 && (
                  <span className={styles.previewOrigPrice}>Rp {formatRp(origNum)}</span>
                )}
                {discountValid && !discountTooLow && discount <= 90 && (
                  <span className={styles.previewDiscount}>-{discount}%</span>
                )}
              </div>
              <div className={styles.previewMeta}>
                {quantity && Number(quantity) > 0
                  ? `${quantity} tersedia`
                  : ''}
                {subCategory ? ` \u00B7 ${subCategory.replace(/_/g, ' ')}` : ''}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky Submit ── */}
      <div className={styles.footer}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Memproses...' : 'Pasang Deal \uD83D\uDD25'}
        </button>
      </div>

    </div>,
    document.body
  )
}
