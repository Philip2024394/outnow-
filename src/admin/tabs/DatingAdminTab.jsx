import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ui/ImageUpload'
import styles from './DatingAdminTab.module.css'

const LOOKING_FOR_OPTIONS = ['dating','marriage','date_night','friendship','travel','pen_pal','meet_new']
const GENDERS = ['male','female','non_binary','prefer_not']

const DEMO_PROFILES = [
  { id:'d1', displayName:'Aria Santoso',    age:24, gender:'female', lookingFor:'dating',    city:'Jakarta',  status:'active',  photoURL:'https://i.pravatar.cc/80?img=1',  views:412, likes:38, featured:true  },
  { id:'d2', displayName:'Bima Wicaksono',  age:27, gender:'male',   lookingFor:'marriage',  city:'Surabaya', status:'active',  photoURL:'https://i.pravatar.cc/80?img=2',  views:289, likes:22, featured:false },
  { id:'d3', displayName:'Citra Dewi',      age:22, gender:'female', lookingFor:'friendship',city:'Bali',     status:'active',  photoURL:'https://i.pravatar.cc/80?img=3',  views:541, likes:61, featured:true  },
  { id:'d4', displayName:'Dian Permata',    age:29, gender:'female', lookingFor:'date_night',city:'Jakarta',  status:'active',  photoURL:'https://i.pravatar.cc/80?img=4',  views:178, likes:14, featured:false },
  { id:'d5', displayName:'Eko Prasetyo',    age:31, gender:'male',   lookingFor:'dating',    city:'Bandung',  status:'pending', photoURL:'https://i.pravatar.cc/80?img=5',  views:92,  likes:7,  featured:false },
  { id:'d6', displayName:'Farah Indah',     age:25, gender:'female', lookingFor:'travel',    city:'Lombok',   status:'active',  photoURL:'https://i.pravatar.cc/80?img=6',  views:334, likes:45, featured:false },
]

const BLANK_FORM = {
  displayName:'', age:'', gender:'female', lookingFor:'dating', city:'', bio:'',
  photoURL:'', height:'', starSign:'', relationshipGoal:'open', status:'active',
}

function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    displayName: item.displayName || '',
    age:         String(item.age || ''),
    gender:      item.gender     || 'female',
    lookingFor:  item.lookingFor || 'dating',
    city:        item.city       || '',
    bio:         item.bio        || '',
    photoURL:    item.photoURL   || '',
    height:      item.height     || '',
    starSign:    item.starSign   || '',
    status:      item.status     || 'active',
  })
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>✏️ Edit Dating Profile</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Photo upload */}
        <div className={styles.photoPreviewRow}>
          <ImageUpload
            value={form.photoURL}
            onChange={url => setForm(p => ({ ...p, photoURL: url }))}
            folder="dating-profiles"
            size={80}
            shape="circle"
            accentColor="#F472B6"
          />
        </div>

        <div className={styles.modalGrid}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Display Name *</label>
            <input className={styles.modalInput} value={form.displayName} onChange={f('displayName')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Age *</label>
            <input className={styles.modalInput} type="number" value={form.age} onChange={f('age')} min={18} max={99} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Gender</label>
            <select className={styles.modalSelect} value={form.gender} onChange={f('gender')}>
              {GENDERS.map(g => <option key={g} value={g}>{g.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Looking For</label>
            <select className={styles.modalSelect} value={form.lookingFor} onChange={f('lookingFor')}>
              {LOOKING_FOR_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>City</label>
            <input className={styles.modalInput} value={form.city} onChange={f('city')} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Height</label>
            <input className={styles.modalInput} value={form.height} onChange={f('height')} placeholder="165cm" />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Star Sign</label>
            <input className={styles.modalInput} value={form.starSign} onChange={f('starSign')} placeholder="Leo" />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Status</label>
            <select className={styles.modalSelect} value={form.status} onChange={f('status')}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className={`${styles.modalField} ${styles.modalFieldFull}`}>
            <label className={styles.modalLabel}>Bio</label>
            <textarea className={styles.modalTextarea} value={form.bio} onChange={f('bio')} rows={3} />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(form)}>✓ Save Changes</button>
        </div>
      </div>
    </div>
  )
}

export default function DatingAdminTab() {
  const [profiles,  setProfiles]  = useState(DEMO_PROFILES)
  const [form,      setForm]      = useState(BLANK_FORM)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [realCount, setRealCount] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('lookingFor', 'is', null)
      .then(({ count }) => setRealCount(count))
      .catch(() => {})
  }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!form.displayName || !form.age) { showToast('Name and age required', 'error'); return }
    setSaving(true)
    try {
      if (!supabase) throw new Error('no supabase')
      const { error } = await supabase.from('profiles').insert({
        display_name: form.displayName, age: parseInt(form.age),
        gender: form.gender, looking_for: form.lookingFor,
        city: form.city, bio: form.bio, photo_url: form.photoURL,
        height: form.height, star_sign: form.starSign,
        relationship_goal: form.relationshipGoal, status: form.status,
        is_seeded: true, is_admin_created: true, created_at: new Date().toISOString(),
      })
      if (error) throw error
    } catch {}
    setProfiles(p => [{
      id: `d${Date.now()}`, displayName: form.displayName,
      age: parseInt(form.age), gender: form.gender,
      lookingFor: form.lookingFor, city: form.city, status: form.status,
      photoURL: form.photoURL || 'https://i.pravatar.cc/80',
      views: 0, likes: 0, featured: false,
    }, ...p])
    setForm(BLANK_FORM); setShowForm(false)
    showToast(`✅ Profile "${form.displayName}" added`)
    setSaving(false)
  }

  const handleEditSave = async (updated) => {
    if (!updated.displayName || !updated.age) { showToast('Name and age required', 'error'); return }
    const changes = {
      displayName: updated.displayName,
      age:         parseInt(updated.age),
      gender:      updated.gender,
      lookingFor:  updated.lookingFor,
      city:        updated.city,
      bio:         updated.bio,
      photoURL:    updated.photoURL,
      height:      updated.height,
      starSign:    updated.starSign,
      status:      updated.status,
    }
    if (supabase && !editItem.id.startsWith('d')) {
      supabase.from('profiles').update({
        display_name: changes.displayName, age: changes.age,
        gender: changes.gender, looking_for: changes.lookingFor,
        city: changes.city, bio: changes.bio, photo_url: changes.photoURL,
        height: changes.height, star_sign: changes.starSign, status: changes.status,
      }).eq('id', editItem.id).catch(() => {})
    }
    setProfiles(p => p.map(x => x.id === editItem.id ? { ...x, ...changes } : x))
    setEditItem(null)
    showToast(`✅ "${changes.displayName}" updated`)
  }

  const toggleFeatured = (id) => { setProfiles(p => p.map(x => x.id === id ? { ...x, featured: !x.featured } : x)); showToast('Featured status updated') }
  const toggleStatus   = (id) => setProfiles(p => p.map(x => x.id === id ? { ...x, status: x.status === 'active' ? 'banned' : 'active' } : x))
  const deleteProfile  = (id) => { setProfiles(p => p.filter(x => x.id !== id)); showToast('Profile removed') }

  const filtered = profiles.filter(p => {
    if (search && !p.displayName.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== 'all' && p.status !== filter) return false
    return true
  })

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>}

      {editItem && <EditModal item={editItem} onSave={handleEditSave} onClose={() => setEditItem(null)} />}

      <div className={styles.statsBar}>
        {[
          { label: 'Total Profiles', value: realCount ?? profiles.length, color: '#F472B6' },
          { label: 'Active',         value: profiles.filter(p => p.status === 'active').length, color: '#00FF9D' },
          { label: 'Featured',       value: profiles.filter(p => p.featured).length, color: '#FFB800' },
          { label: 'Total Likes',    value: profiles.reduce((s, p) => s + p.likes, 0), color: '#A855F7' },
        ].map(s => (
          <div key={s.label} className={styles.statChip} style={{ '--c': s.color }}>
            <span className={styles.statChipVal}>{s.value}</span>
            <span className={styles.statChipLabel}>{s.label}</span>
          </div>
        ))}
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Upload Profile'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>💕 Upload Dating Profile</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}><label>Display Name *</label><input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Aria Santoso" /></div>
            <div className={styles.field}><label>Age *</label><input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="24" min={18} max={99} /></div>
            <div className={styles.field}><label>Gender</label><select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>{GENDERS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}</select></div>
            <div className={styles.field}><label>Looking For</label><select value={form.lookingFor} onChange={e => setForm(f => ({ ...f, lookingFor: e.target.value }))}>{LOOKING_FOR_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}</select></div>
            <div className={styles.field}><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Jakarta" /></div>
            <div className={styles.field}><label>Height</label><input value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="165cm" /></div>
            <div className={styles.field}><label>Star Sign</label><input value={form.starSign} onChange={e => setForm(f => ({ ...f, starSign: e.target.value }))} placeholder="Leo" /></div>
            <div className={styles.field}><label>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="scheduled">Scheduled</option></select></div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Profile Photo</label>
              <ImageUpload
                value={form.photoURL}
                onChange={url => setForm(f => ({ ...f, photoURL: url }))}
                folder="dating-profiles"
                size={72}
                shape="circle"
                accentColor="#F472B6"
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label>Bio</label><textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell a bit about this person…" rows={3} /></div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Upload Profile'}</button>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="🔍 Search profiles…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filterBtns}>
          {['all','active','pending','banned'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>{['Photo','Name','Age','Gender','Looking For','City','Status','Views','Likes','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><img src={p.photoURL} alt="" className={styles.avatar} /></td>
                <td>
                  <span className={styles.name}>{p.displayName}</span>
                  {p.featured && <span className={styles.featuredBadge}>⭐ Featured</span>}
                </td>
                <td className={styles.mono}>{p.age}</td>
                <td className={styles.dim}>{p.gender}</td>
                <td><span className={styles.lookingBadge}>{p.lookingFor?.replace('_',' ')}</span></td>
                <td className={styles.dim}>{p.city}</td>
                <td><span className={`${styles.statusBadge} ${styles[p.status]}`}>{p.status}</span></td>
                <td className={styles.mono}>{p.views.toLocaleString()}</td>
                <td className={styles.mono} style={{ color: '#F472B6' }}>{p.likes}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title="Edit" onClick={() => setEditItem(p)}>✏️</button>
                    <button className={styles.actionBtn} title="Toggle featured" onClick={() => toggleFeatured(p.id)}>⭐</button>
                    <button className={styles.actionBtn} title="Toggle status" onClick={() => toggleStatus(p.id)}>{p.status === 'active' ? '🔴' : '🟢'}</button>
                    <button className={`${styles.actionBtn} ${styles.danger}`} title="Delete" onClick={() => deleteProfile(p.id)}>🗑</button>
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
