import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ui/ImageUpload'
import styles from './DatingAdminTab.module.css'

const CATEGORIES = [
  'fashion','electronics','handmade','fresh_produce','beauty','food_drink',
  'art_craft','vehicles','property','vintage','tools_equip','catering',
]

const DEMO_LISTINGS = [
  { id:'m1', name:'Batik Kemeja Premium',    seller:'Admin',  category:'fashion',      price:'Rp 285.000',    city:'Jakarta',   status:'active',  views:891,  contacts:23, photoURL:'https://picsum.photos/seed/batik/80',  description:'Premium quality batik shirt, size M-XL' },
  { id:'m2', name:'iPhone 14 Pro (Used)',    seller:'Admin',  category:'electronics',  price:'Rp 12.500.000', city:'Surabaya',  status:'active',  views:2140, contacts:87, photoURL:'https://picsum.photos/seed/phone/80',  description:'Good condition, 92% battery health' },
  { id:'m3', name:'Handmade Leather Bag',    seller:'Admin',  category:'handmade',     price:'Rp 450.000',    city:'Bali',      status:'active',  views:340,  contacts:11, photoURL:'https://picsum.photos/seed/bag/80',    description:'Hand-stitched genuine leather' },
  { id:'m4', name:'Fresh Organic Durian',    seller:'Admin',  category:'fresh_produce',price:'Rp 85.000',     city:'Medan',     status:'active',  views:122,  contacts:4,  photoURL:'https://picsum.photos/seed/fruit/80',  description:'Straight from the farm' },
  { id:'m5', name:'Vintage Vinyl Records',   seller:'Admin',  category:'vintage',      price:'Rp 350.000',    city:'Yogyakarta',status:'pending', views:58,   contacts:2,  photoURL:'https://picsum.photos/seed/vinyl/80',  description:'70s-80s classics, good condition' },
  { id:'m6', name:'Catering for 50 pax',     seller:'Admin',  category:'catering',     price:'Rp 4.500.000',  city:'Jakarta',   status:'active',  views:445,  contacts:19, photoURL:'https://picsum.photos/seed/food/80',   description:'Full buffet with setup' },
]

const BLANK = { name:'', category:'fashion', price:'', city:'', description:'', photoURL:'', sellerName:'Admin', whatsapp:'', status:'active' }

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
  })
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} style={{ borderColor: 'rgba(168,85,247,0.25)' }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color:'#A855F7' }}>✏️ Edit Marketplace Listing</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.photoPreviewRow}>
          <ImageUpload
            value={form.photoURL}
            onChange={url => setForm(p => ({ ...p, photoURL: url }))}
            folder="marketplace"
            size={80}
            shape="square"
            accentColor="#A855F7"
          />
        </div>

        <div className={styles.modalGrid}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Product Name *</label>
            <input className={styles.modalInput} value={form.name} onChange={f('name')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Category</label>
            <select className={styles.modalSelect} value={form.category} onChange={f('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
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
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} style={{ color:'#A855F7', borderColor:'rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.1)' }}
            onClick={() => onSave(form)}>✓ Save Changes</button>
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceAdminTab() {
  const [listings,  setListings]  = useState(DEMO_LISTINGS)
  const [form,      setForm]      = useState(BLANK)
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
      if (!supabase) throw new Error('no supabase')
      const { error } = await supabase.from('listings').insert({
        title: form.name, category: form.category, price_label: form.price,
        city: form.city, description: form.description, photo_url: form.photoURL,
        seller_name: form.sellerName, whatsapp: form.whatsapp,
        status: form.status, is_admin: true, created_at: new Date().toISOString(),
      })
      if (error) throw error
    } catch {}
    setListings(p => [{
      id: `m${Date.now()}`, name: form.name, seller: form.sellerName,
      category: form.category, price: form.price, city: form.city,
      status: form.status, views: 0, contacts: 0, description: form.description,
      photoURL: form.photoURL || `https://picsum.photos/seed/${form.name}/80`,
    }, ...p])
    setForm(BLANK); setShowForm(false)
    showToast(`✅ "${form.name}" uploaded`)
    setSaving(false)
  }

  const handleEditSave = (updated) => {
    if (!updated.name || !updated.price) { showToast('Name and price required', 'error'); return }
    if (supabase) {
      supabase.from('listings').update({
        title: updated.name, category: updated.category,
        price_label: updated.price, city: updated.city,
        description: updated.description, photo_url: updated.photoURL,
        seller_name: updated.seller, whatsapp: updated.whatsapp, status: updated.status,
      }).eq('id', editItem.id).catch(() => {})
    }
    setListings(p => p.map(x => x.id === editItem.id ? { ...x, ...updated, name: updated.name } : x))
    setEditItem(null)
    showToast(`✅ "${updated.name}" updated`)
  }

  const filtered = listings.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && l.category !== catFilter) return false
    return true
  })

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}
      {editItem && <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}

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

      {showForm && (
        <div className={styles.formCard} style={{ borderColor:'rgba(168,85,247,0.2)' }}>
          <h3 className={styles.formTitle} style={{ color:'#A855F7' }}>🛍️ Upload Marketplace Listing</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Product Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Batik Premium" /></div>
            <div className={styles.field}><label>Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}</select></div>
            <div className={styles.field}><label>Price *</label><input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Rp 250.000" /></div>
            <div className={styles.field}><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Jakarta" /></div>
            <div className={styles.field}><label>Seller Name</label><input value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))} /></div>
            <div className={styles.field}><label>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+62812…" /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Product Photo</label>
              <ImageUpload
                value={form.photoURL}
                onChange={url => setForm(f => ({ ...f, photoURL: url }))}
                folder="marketplace"
                size={72}
                shape="square"
                accentColor="#A855F7"
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} style={{ color:'#A855F7', borderColor:'rgba(168,85,247,0.35)', background:'rgba(168,85,247,0.1)' }}
              onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Upload Listing'}</button>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="🔍 Search listings…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${catFilter === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {CATEGORIES.slice(0,5).map(c => (
            <button key={c} className={`${styles.filterBtn} ${catFilter === c ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter(c)}>{c.replace('_',' ')}</button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{['Photo','Name','Category','Price','City','Seller','Status','Views','Contacts','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td><img src={l.photoURL} alt="" className={styles.avatar} style={{ borderRadius:6, borderColor:'rgba(168,85,247,0.3)' }} /></td>
                <td><span className={styles.name}>{l.name}</span></td>
                <td><span className={styles.lookingBadge} style={{ background:'rgba(168,85,247,0.1)', color:'#A855F7', borderColor:'rgba(168,85,247,0.2)' }}>{l.category.replace('_',' ')}</span></td>
                <td className={styles.mono} style={{ color:'#00FF9D' }}>{l.price}</td>
                <td className={styles.dim}>{l.city}</td>
                <td className={styles.dim}>{l.seller}</td>
                <td><span className={`${styles.statusBadge} ${styles[l.status]}`}>{l.status}</span></td>
                <td className={styles.mono}>{l.views.toLocaleString()}</td>
                <td className={styles.mono} style={{ color:'#FFB800' }}>{l.contacts}</td>
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
