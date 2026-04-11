import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './DatingAdminTab.module.css' // reuse same table styles
import mStyles from './MarketplaceAdminTab.module.css'

const CATEGORIES = [
  'fashion','electronics','handmade','fresh_produce','beauty','food_drink',
  'art_craft','vehicles','property','vintage','tools_equip','catering',
]

const DEMO_LISTINGS = [
  { id:'m1', name:'Batik Kemeja Premium',    seller:'Admin',  category:'fashion',     price:'Rp 285.000', city:'Jakarta',  status:'active',  views:891,  contacts:23, photoURL:'https://picsum.photos/seed/batik/80'    },
  { id:'m2', name:'iPhone 14 Pro (Used)',    seller:'Admin',  category:'electronics', price:'Rp 12.500.000',city:'Surabaya',status:'active',  views:2140, contacts:87, photoURL:'https://picsum.photos/seed/phone/80'    },
  { id:'m3', name:'Handmade Leather Bag',    seller:'Admin',  category:'handmade',    price:'Rp 450.000', city:'Bali',     status:'active',  views:340,  contacts:11, photoURL:'https://picsum.photos/seed/bag/80'      },
  { id:'m4', name:'Fresh Organic Durian',    seller:'Admin',  category:'fresh_produce',price:'Rp 85.000', city:'Medan',    status:'active',  views:122,  contacts:4,  photoURL:'https://picsum.photos/seed/fruit/80'    },
  { id:'m5', name:'Vintage Vinyl Records',   seller:'Admin',  category:'vintage',     price:'Rp 350.000', city:'Yogyakarta',status:'pending',views:58,   contacts:2,  photoURL:'https://picsum.photos/seed/vinyl/80'    },
  { id:'m6', name:'Catering for 50 pax',     seller:'Admin',  category:'catering',    price:'Rp 4.500.000',city:'Jakarta', status:'active',  views:445,  contacts:19, photoURL:'https://picsum.photos/seed/food/80'     },
]

const BLANK = {
  name:'', category:'fashion', price:'', city:'', description:'',
  photoURL:'', sellerName:'Admin', whatsapp:'', status:'active',
}

export default function MarketplaceAdminTab() {
  const [listings, setListings] = useState(DEMO_LISTINGS)
  const [form,     setForm]     = useState(BLANK)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter] = useState('all')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const handleSave = async () => {
    if (!form.name || !form.price) { showToast('Name and price required', 'error'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('listings').insert({
        title:       form.name,
        category:    form.category,
        price_label: form.price,
        city:        form.city,
        description: form.description,
        photo_url:   form.photoURL,
        seller_name: form.sellerName,
        whatsapp:    form.whatsapp,
        status:      form.status,
        is_admin:    true,
        created_at:  new Date().toISOString(),
      })
      if (error) throw error
    } catch {}
    setListings(p => [{
      id: `m${Date.now()}`, name: form.name, seller: form.sellerName,
      category: form.category, price: form.price, city: form.city,
      status: form.status, views: 0, contacts: 0,
      photoURL: form.photoURL || `https://picsum.photos/seed/${form.name}/80`,
    }, ...p])
    setForm(BLANK); setShowForm(false)
    showToast(`✅ "${form.name}" uploaded to Marketplace`)
    setSaving(false)
  }

  const filtered = listings.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && l.category !== catFilter) return false
    return true
  })

  const totalViews    = listings.reduce((s, l) => s + l.views, 0)
  const totalContacts = listings.reduce((s, l) => s + l.contacts, 0)

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}

      {/* Stats */}
      <div className={styles.statsBar}>
        {[
          { label: 'Total Listings', value: listings.length,  color: '#A855F7' },
          { label: 'Active',         value: listings.filter(l => l.status === 'active').length, color: '#00FF9D' },
          { label: 'Total Views',    value: totalViews,        color: '#00E5FF' },
          { label: 'Contact Clicks', value: totalContacts,     color: '#FFB800' },
        ].map(s => (
          <div key={s.label} className={styles.statChip} style={{ '--c': s.color }}>
            <span className={styles.statChipVal}>{s.value.toLocaleString()}</span>
            <span className={styles.statChipLabel}>{s.label}</span>
          </div>
        ))}
        <button className={styles.addBtn} style={{ color: '#A855F7', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)' }}
          onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Upload Listing'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={styles.formCard} style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
          <h3 className={styles.formTitle} style={{ color: '#A855F7' }}>🛍️ Upload Marketplace Listing</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Product Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Batik Premium" /></div>
            <div className={styles.field}><label>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className={styles.field}><label>Price *</label><input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Rp 250.000" /></div>
            <div className={styles.field}><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Jakarta" /></div>
            <div className={styles.field}><label>Seller Name</label><input value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))} placeholder="Admin" /></div>
            <div className={styles.field}><label>WhatsApp</label><input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+62812..." /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label>Photo URL</label><input value={form.photoURL} onChange={e => setForm(f => ({ ...f, photoURL: e.target.value }))} placeholder="https://…" /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the product…" /></div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} style={{ color: '#A855F7', borderColor: 'rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.1)' }}
              onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Upload Listing'}</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="🔍 Search listings…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filterBtns}>
          <button className={`${styles.filterBtn} ${catFilter === 'all' ? styles.filterBtnActive : ''}`} onClick={() => setCatFilter('all')}>All</button>
          {CATEGORIES.slice(0, 5).map(c => (
            <button key={c} className={`${styles.filterBtn} ${catFilter === c ? styles.filterBtnActive : ''}`}
              onClick={() => setCatFilter(c)}>{c.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{['Photo','Name','Category','Price','City','Seller','Status','Views','Contacts','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id}>
                <td><img src={l.photoURL} alt="" className={styles.avatar} style={{ borderRadius: 6, borderColor: 'rgba(168,85,247,0.3)' }} /></td>
                <td><span className={styles.name}>{l.name}</span></td>
                <td><span className={styles.lookingBadge} style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', borderColor: 'rgba(168,85,247,0.2)' }}>{l.category.replace('_', ' ')}</span></td>
                <td className={styles.mono} style={{ color: '#00FF9D' }}>{l.price}</td>
                <td className={styles.dim}>{l.city}</td>
                <td className={styles.dim}>{l.seller}</td>
                <td><span className={`${styles.statusBadge} ${styles[l.status]}`}>{l.status}</span></td>
                <td className={styles.mono}>{l.views.toLocaleString()}</td>
                <td className={styles.mono} style={{ color: '#FFB800' }}>{l.contacts}</td>
                <td>
                  <div className={styles.actions}>
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
