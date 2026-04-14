import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ui/ImageUpload'
import { CATEGORY_SPECS, ALL_CATEGORIES, getSpecsForCategory, UNIVERSAL_SPECS } from '@/constants/categorySpecs'
import styles from './DatingAdminTab.module.css'

const DEMO_LISTINGS = [
  { id:'m1', name:'Batik Kemeja Premium',  seller:'Admin', category:'fashion',      price:'Rp 285.000',    city:'Jakarta',    status:'active',  views:891,  contacts:23, photoURL:'https://picsum.photos/seed/batik/80',  description:'Premium quality batik shirt, size M-XL',
    specs:{ material:'Cotton', condition:'New', brand:'Batik Keris', gender:'Men', fit:'Regular' }, variants:{ size:['M','L','XL'], color:['Brown','Navy','Black'] } },
  { id:'m2', name:'iPhone 14 Pro (Used)',  seller:'Admin', category:'electronics',  price:'Rp 12.500.000', city:'Surabaya',   status:'active',  views:2140, contacts:87, photoURL:'https://picsum.photos/seed/phone/80',  description:'Good condition, 92% battery health',
    specs:{ brand:'Apple', model:'iPhone 14 Pro', condition:'Like New', storage:'256GB', battery:'92% health', includes:'Charger, box' }, variants:{ color:['Black','Silver'] } },
  { id:'m3', name:'Handmade Leather Bag',  seller:'Admin', category:'bags',         price:'Rp 450.000',    city:'Bali',       status:'active',  views:340,  contacts:11, photoURL:'https://picsum.photos/seed/bag/80',    description:'Hand-stitched genuine leather',
    specs:{ material:'Genuine Leather', brand:'Local artisan', style:'Crossbody', condition:'New', dimensions:'26 x 18 x 8 cm', closure:'Magnetic', strap:'Adjustable 55-120cm' }, variants:{ color:['Tan','Black','Brown'] } },
  { id:'m4', name:'Fresh Organic Durian',  seller:'Admin', category:'fresh_produce',price:'Rp 85.000',     city:'Medan',      status:'active',  views:122,  contacts:4,  photoURL:'https://picsum.photos/seed/fruit/80',  description:'Straight from the farm',
    specs:{ type:'Fruit', organic:'Certified Organic', farm:'Tani Jaya Farm', shelf_life:'3 days', storage:'Keep cool', unit:'kg' }, variants:{ weight:['1kg','2kg','5kg'] } },
  { id:'m5', name:'Vintage Vinyl Records', seller:'Admin', category:'vintage',      price:'Rp 350.000',    city:'Yogyakarta', status:'pending', views:58,   contacts:2,  photoURL:'https://picsum.photos/seed/vinyl/80',  description:'70s-80s classics, good condition',
    specs:{ era:'1970s-1980s', condition:'Good', material:'Vinyl', origin:'USA/UK imports' }, variants:{} },
  { id:'m6', name:'Catering for 50 pax',   seller:'Admin', category:'catering',     price:'Rp 4.500.000',  city:'Jakarta',    status:'active',  views:445,  contacts:19, photoURL:'https://picsum.photos/seed/food/80',   description:'Full buffet with setup',
    specs:{ cuisine:'Indonesian', min_pax:'30', max_pax:'100', halal:'Yes', includes:'Setup, utensils, cleanup', lead_time:'3 days', delivery:'Free delivery', area:'Jabodetabek' }, variants:{ package:['Standard','Premium'] } },
]

function buildBlankForm() {
  return {
    name:'', category:'fashion', price:'', city:'', description:'', photoURL:'',
    sellerName:'Admin', whatsapp:'', status:'active', specs:{}, variants:{},
  }
}

// ── Render a list of spec fields ────────────────────────────────────────────
function renderSpecInputs({ fields, specs, onChange, styles }) {
  const update = (key, val) => onChange({ ...specs, [key]: val })
  return fields.map(field => (
    <div key={field.key} className={styles.modalField}>
      <label className={styles.modalLabel}>{field.label}</label>
      {field.type === 'select' ? (
        <select className={styles.modalSelect} value={specs[field.key] ?? ''} onChange={e => update(field.key, e.target.value)}>
          <option value="">— Select —</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'number' ? (
        <input className={styles.modalInput} type="number" value={specs[field.key] ?? ''} onChange={e => update(field.key, e.target.value)} placeholder={field.placeholder ?? ''} />
      ) : (
        <input className={styles.modalInput} value={specs[field.key] ?? ''} onChange={e => update(field.key, e.target.value)} placeholder={field.placeholder ?? ''} />
      )}
    </div>
  ))
}

// ── Spec & Variant Fields Component ─────────────────────────────────────────
function SpecFields({ category, specs, onChange }) {
  const config = getSpecsForCategory(category)

  return (
    <>
      {/* Universal fields — always shown */}
      <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
        <label className={styles.modalLabel} style={{ color:'#00E5FF', fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:8 }}>
          Product Details — All Categories
        </label>
      </div>
      {renderSpecInputs({ fields: UNIVERSAL_SPECS, specs, onChange, styles })}

      {/* Category-specific fields */}
      {config.specs.length > 0 && (
        <>
          <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
            <label className={styles.modalLabel} style={{ color:'#A855F7', fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:8 }}>
              Specifications — {config.label}
            </label>
          </div>
          {renderSpecInputs({ fields: config.specs, specs, onChange, styles })}
        </>
      )}
    </>
  )
}

function VariantFields({ category, variants, onChange }) {
  const config = getSpecsForCategory(category)
  if (!config.variants?.length) return null

  const toggleOption = (varKey, option) => {
    const current = variants[varKey] ?? []
    const next = current.includes(option)
      ? current.filter(x => x !== option)
      : [...current, option]
    onChange({ ...variants, [varKey]: next })
  }

  return (
    <>
      <div className={styles.modalField} style={{ gridColumn:'1/-1' }}>
        <label className={styles.modalLabel} style={{ color:'#FFB800', fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:8 }}>
          Variants — Buyer selects from these
        </label>
      </div>
      {config.variants.map(field => {
        const selected = variants[field.key] ?? []
        return (
          <div key={field.key} className={styles.modalField} style={{ gridColumn:'1/-1' }}>
            <label className={styles.modalLabel}>{field.label}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
              {field.options.map(opt => {
                const active = selected.includes(opt)
                return (
                  <button key={opt} type="button" onClick={() => toggleOption(field.key, opt)}
                    style={{
                      padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                      border: active ? '1px solid #FFB800' : '1px solid rgba(255,255,255,0.12)',
                      background: active ? 'rgba(255,184,0,0.15)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#FFB800' : 'rgba(255,255,255,0.5)',
                      cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
                    }}
                  >{opt}</button>
                )
              })}
            </div>
            <input
              className={styles.modalInput}
              style={{ marginTop:6, fontSize:11 }}
              placeholder="Or type custom options (comma-separated)"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const customs = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  if (customs.length) {
                    const merged = [...new Set([...selected, ...customs])]
                    onChange({ ...variants, [field.key]: merged })
                    e.target.value = ''
                  }
                }
              }}
            />
            {selected.length > 0 && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>
                Selected: {selected.join(', ')}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── Edit Modal ──────────────────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name:        item.name        || '',
    category:    item.category    || 'fashion',
    price:       item.price       || '',
    city:        item.city        || '',
    description: item.description || '',
    photoURL:    item.photoURL    || '',
    seller:      item.seller      || 'Admin',
    whatsapp:    item.whatsapp    || '',
    status:      item.status      || 'active',
    specs:       item.specs       || {},
    variants:    item.variants    || {},
  })
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} style={{ borderColor:'rgba(168,85,247,0.25)', maxHeight:'92vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color:'#A855F7' }}>Edit Marketplace Listing</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.photoPreviewRow}>
          <ImageUpload value={form.photoURL} onChange={url => setForm(p => ({ ...p, photoURL: url }))} folder="marketplace" size={80} shape="square" accentColor="#A855F7" />
        </div>

        <div className={styles.modalGrid}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Product Name *</label>
            <input className={styles.modalInput} value={form.name} onChange={f('name')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Category</label>
            <select className={styles.modalSelect} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, specs:{}, variants:{} }))}>
              {ALL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Price *</label>
            <input className={styles.modalInput} value={form.price} onChange={f('price')} placeholder="Rp 250.000" />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>City</label>
            <input className={styles.modalInput} value={form.city} onChange={f('city')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Seller Name</label>
            <input className={styles.modalInput} value={form.seller} onChange={f('seller')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>WhatsApp</label>
            <input className={styles.modalInput} value={form.whatsapp} onChange={f('whatsapp')} placeholder="+62812…" />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Status</label>
            <select className={styles.modalSelect} value={form.status} onChange={f('status')}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className={`${styles.modalField} ${styles.modalFieldFull}`}>
            <label className={styles.modalLabel}>Description</label>
            <textarea className={styles.modalTextarea} value={form.description} onChange={f('description')} rows={3} />
          </div>

          {/* Category-specific specs */}
          <SpecFields category={form.category} specs={form.specs} onChange={specs => setForm(p => ({ ...p, specs }))} />

          {/* Variant selectors */}
          <VariantFields category={form.category} variants={form.variants} onChange={variants => setForm(p => ({ ...p, variants }))} />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} style={{ color:'#A855F7', borderColor:'rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.1)' }}
            onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Tab ────────────────────────────────────────────────────────────────
export default function MarketplaceAdminTab() {
  const [listings,  setListings]  = useState(DEMO_LISTINGS)
  const [form,      setForm]      = useState(buildBlankForm)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const handleSave = async () => {
    if (!form.name || !form.price) { showToast('Name and price required', 'error'); return }
    setSaving(true)
    try {
      if (supabase) {
        await supabase.from('listings').insert({
          title: form.name, category: form.category, price_label: form.price,
          city: form.city, description: form.description, photo_url: form.photoURL,
          seller_name: form.sellerName, whatsapp: form.whatsapp,
          status: form.status, is_admin: true,
          specs: form.specs, variants: form.variants,
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
    } catch {}
    setListings(p => [{
      id: `m${Date.now()}`, name: form.name, seller: form.sellerName,
      category: form.category, price: form.price, city: form.city,
      status: form.status, views: 0, contacts: 0, description: form.description,
      photoURL: form.photoURL || `https://picsum.photos/seed/${form.name}/80`,
      specs: form.specs, variants: form.variants,
    }, ...p])
    setForm(buildBlankForm()); setShowForm(false)
    showToast(`"${form.name}" uploaded`)
    setSaving(false)
  }

  const handleEditSave = (updated) => {
    if (!updated.name || !updated.price) { showToast('Name and price required', 'error'); return }
    if (supabase) {
      supabase.from('listings').update({
        title: updated.name, category: updated.category,
        price_label: updated.price, city: updated.city,
        description: updated.description, photo_url: updated.photoURL,
        seller_name: updated.seller, whatsapp: updated.whatsapp,
        status: updated.status, specs: updated.specs, variants: updated.variants,
      }).eq('id', editItem.id).catch(() => {})
    }
    setListings(p => p.map(x => x.id === editItem.id ? { ...x, ...updated, name: updated.name } : x))
    setEditItem(null)
    showToast(`"${updated.name}" updated`)
  }

  const filtered = listings.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && l.category !== catFilter) return false
    return true
  })

  const specCount = (item) => {
    const sc = Object.keys(item.specs ?? {}).filter(k => item.specs[k]).length
    const vc = Object.keys(item.variants ?? {}).filter(k => item.variants[k]?.length).length
    return sc + vc
  }

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}
      {editItem && <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Listings', value: listings.length, color: '#A855F7' },
          { label: 'Active',         value: listings.filter(l => l.status === 'active').length, color: '#00FF9D' },
          { label: 'Total Views',    value: listings.reduce((s,l) => s+l.views, 0), color: '#00E5FF' },
          { label: 'Contact Clicks', value: listings.reduce((s,l) => s+l.contacts, 0), color: '#FFB800' },
        ].map(s => (
          <div key={s.label} className={styles.statChip} style={{ '--c': s.color }}>
            <span className={styles.statChipVal}>{s.value.toLocaleString()}</span>
            <span className={styles.statChipLabel}>{s.label}</span>
          </div>
        ))}
        <button className={styles.addBtn} style={{ color:'#A855F7', borderColor:'rgba(168,85,247,0.3)', background:'rgba(168,85,247,0.1)' }}
          onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Upload Listing'}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className={styles.formCard} style={{ borderColor:'rgba(168,85,247,0.2)' }}>
          <h3 className={styles.formTitle} style={{ color:'#A855F7' }}>Upload Marketplace Listing</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Product Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Batik Premium" /></div>
            <div className={styles.field}>
              <label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, specs:{}, variants:{} }))}>
                {ALL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className={styles.field}><label>Price *</label><input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Rp 250.000" /></div>
            <div className={styles.field}><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Jakarta" /></div>
            <div className={styles.field}><label>Seller Name</label><input value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))} /></div>
            <div className={styles.field}><label>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+62812…" /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Product Photo</label>
              <ImageUpload value={form.photoURL} onChange={url => setForm(f => ({ ...f, photoURL: url }))} folder="marketplace" size={72} shape="square" accentColor="#A855F7" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>

          {/* Universal product details — always shown */}
          <div style={{ marginTop:16, padding:'16px 0 0', borderTop:'1px solid rgba(0,229,255,0.15)' }}>
            <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#00E5FF', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Product Details — All Categories
            </h4>
            <div className={styles.formGrid}>
              {UNIVERSAL_SPECS.map(field => (
                <div key={field.key} className={styles.field}>
                  <label>{field.label}</label>
                  {field.type === 'select' ? (
                    <select value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))}>
                      <option value="">— Select —</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'number' ? (
                    <input type="number" value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))} placeholder={field.placeholder ?? ''} />
                  ) : (
                    <input value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))} placeholder={field.placeholder ?? ''} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category-specific specification fields */}
          {getSpecsForCategory(form.category).specs.length > 0 && (
            <div style={{ marginTop:16, padding:'16px 0 0', borderTop:'1px solid rgba(168,85,247,0.15)' }}>
              <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#A855F7', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Specifications — {getSpecsForCategory(form.category).label}
              </h4>
              <div className={styles.formGrid}>
                {getSpecsForCategory(form.category).specs.map(field => (
                  <div key={field.key} className={styles.field}>
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))}>
                        <option value="">— Select —</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'number' ? (
                      <input type="number" value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))} placeholder={field.placeholder ?? ''} />
                    ) : (
                      <input value={form.specs[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [field.key]: e.target.value } }))} placeholder={field.placeholder ?? ''} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variant selectors in upload form */}
          {(getSpecsForCategory(form.category).variants?.length > 0) && (
            <div style={{ marginTop:16, padding:'16px 0 0', borderTop:'1px solid rgba(255,184,0,0.15)' }}>
              <h4 style={{ margin:'0 0 12px', fontSize:13, fontWeight:800, color:'#FFB800', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Variants — Buyer selects from these
              </h4>
              {getSpecsForCategory(form.category).variants.map(field => {
                const selected = form.variants[field.key] ?? []
                return (
                  <div key={field.key} style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>{field.label}</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {field.options.map(opt => {
                        const active = selected.includes(opt)
                        return (
                          <button key={opt} type="button"
                            onClick={() => {
                              const next = active ? selected.filter(x => x !== opt) : [...selected, opt]
                              setForm(f => ({ ...f, variants: { ...f.variants, [field.key]: next } }))
                            }}
                            style={{
                              padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600,
                              border: active ? '1px solid #FFB800' : '1px solid rgba(255,255,255,0.12)',
                              background: active ? 'rgba(255,184,0,0.15)' : 'rgba(255,255,255,0.04)',
                              color: active ? '#FFB800' : 'rgba(255,255,255,0.5)',
                              cursor:'pointer', fontFamily:'inherit',
                            }}
                          >{opt}</button>
                        )
                      })}
                    </div>
                    <input
                      style={{
                        marginTop:6, width:'100%', background:'rgba(255,255,255,0.06)',
                        border:'1px solid rgba(255,255,255,0.12)', borderRadius:7,
                        color:'#fff', fontSize:11, padding:'6px 10px', fontFamily:'inherit', outline:'none',
                      }}
                      placeholder="Or type custom options (comma-separated) + Enter"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const customs = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          if (customs.length) {
                            const merged = [...new Set([...selected, ...customs])]
                            setForm(f => ({ ...f, variants: { ...f.variants, [field.key]: merged } }))
                            e.target.value = ''
                          }
                        }
                      }}
                    />
                    {selected.length > 0 && (
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:4 }}>Selected: {selected.join(', ')}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} style={{ color:'#A855F7', borderColor:'rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.1)' }}
              onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Upload Listing'}</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search listings…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${catFilter === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {ALL_CATEGORIES.slice(0,8).map(c => (
            <button key={c.key} className={`${styles.filterBtn} ${catFilter === c.key ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter(c.key)}>{c.label.split(' ')[0]}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{['Photo','Name','Category','Price','City','Seller','Specs','Status','Views','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td><img src={l.photoURL} alt="" className={styles.avatar} style={{ borderRadius:6, borderColor:'rgba(168,85,247,0.3)' }} /></td>
                <td><span className={styles.name}>{l.name}</span></td>
                <td><span className={styles.lookingBadge} style={{ background:'rgba(168,85,247,0.1)', color:'#A855F7', borderColor:'rgba(168,85,247,0.2)' }}>{(CATEGORY_SPECS[l.category]?.label ?? l.category).split(' ')[0]}</span></td>
                <td className={styles.mono} style={{ color:'#00FF9D' }}>{l.price}</td>
                <td className={styles.dim}>{l.city}</td>
                <td className={styles.dim}>{l.seller}</td>
                <td>
                  <span style={{ fontSize:11, color: specCount(l) > 0 ? '#00E5FF' : 'rgba(255,255,255,0.2)', fontWeight:600 }}>
                    {specCount(l) > 0 ? `${specCount(l)} fields` : 'none'}
                  </span>
                </td>
                <td><span className={`${styles.statusBadge} ${styles[l.status]}`}>{l.status}</span></td>
                <td className={styles.mono}>{l.views.toLocaleString()}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Edit" onClick={() => setEditItem(l)}>✏️</button>
                    <button className={styles.actionBtn} onClick={() => setListings(p => p.map(x => x.id === l.id ? { ...x, status: x.status === 'active' ? 'pending' : 'active' } : x))}>
                      {l.status === 'active' ? '🔴' : '🟢'}
                    </button>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => { setListings(p => p.filter(x => x.id !== l.id)); showToast('Listing removed') }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
