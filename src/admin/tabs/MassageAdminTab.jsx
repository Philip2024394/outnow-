/**
 * MassageAdminTab
 * Admin management for massage therapist profiles:
 * - View all therapist profiles with status, ratings, earnings
 * - Deactivate / reactivate any therapist
 * - Edit therapist profile details (name, services, pricing, area)
 * - Full commission flow: 10% per completed booking, 72h payment window
 * - Send notifications to therapist profiles
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTherapists, MASSAGE_TYPES } from '@/services/massageService'
import { getAllPendingCommissions as getMassagePendingCommissions, getAllBookings, fmtPrice, COMMISSION_RATE } from '@/domains/massage/services/massageBookingService'
import { recordCommission, markSellerCommissionsPaid } from '@/services/commissionService'
import styles from './MassageAdminTab.module.css'

function fmtRp(n) { return `Rp ${Number(n ?? 0).toLocaleString('id-ID')}` }

function dueLabel(dueAt) {
  if (!dueAt) return null
  const diff = new Date(dueAt) - Date.now()
  if (diff <= 0) {
    const overH = Math.floor(Math.abs(diff) / 3600000)
    return { text: overH > 0 ? `${overH}h overdue` : 'Just overdue', overdue: true }
  }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 48) return { text: `${Math.floor(h / 24)}d left`, overdue: false }
  return { text: h > 0 ? `${h}h ${m}m left` : `${m}m left`, overdue: h < 12 }
}

const now = Date.now()
const h = (n) => new Date(now + n * 3600000).toISOString()
const hAgo = (n) => new Date(now - n * 3600000).toISOString()

// Demo commission data for massage therapists
const DEMO_COMMISSIONS = [
  { id:'mc1', therapist:'Dewi Sari',       therapistId:'th1', bookingRef:'#MASS_10001', order_total:200000, amount:20000, status:'pending',  created_at:hAgo(6),  due_at:h(66),   paid_at:null,  blocked:false },
  { id:'mc2', therapist:'Putu Ayu',         therapistId:'th2', bookingRef:'#MASS_10002', order_total:250000, amount:25000, status:'pending',  created_at:hAgo(12), due_at:h(60),   paid_at:null,  blocked:false },
  { id:'mc3', therapist:'Wayan Surya',      therapistId:'th3', bookingRef:'#MASS_10003', order_total:350000, amount:35000, status:'overdue',  created_at:hAgo(80), due_at:hAgo(8), paid_at:null,  blocked:false },
  { id:'mc4', therapist:'Kadek Yoga',       therapistId:'th5', bookingRef:'#MASS_10004', order_total:300000, amount:30000, status:'paid',     created_at:hAgo(96), due_at:hAgo(24),paid_at:hAgo(20), blocked:false },
  { id:'mc5', therapist:'Sri Wahyuni',      therapistId:'th6', bookingRef:'#MASS_10005', order_total:190000, amount:19000, status:'overdue',  created_at:hAgo(100),due_at:hAgo(28),paid_at:null,  blocked:true },
  { id:'mc6', therapist:'Nia Rahmawati',    therapistId:'th4', bookingRef:'#MASS_10006', order_total:175000, amount:17500, status:'paid',     created_at:hAgo(48), due_at:hAgo(1), paid_at:hAgo(2), blocked:false },
  { id:'mc7', therapist:'Dewi Sari',        therapistId:'th1', bookingRef:'#MASS_10007', order_total:275000, amount:27500, status:'paid',     created_at:hAgo(120),due_at:hAgo(48),paid_at:hAgo(50), blocked:false },
  { id:'mc8', therapist:'Putu Ayu',         therapistId:'th2', bookingRef:'#MASS_10008', order_total:300000, amount:30000, status:'overdue',  created_at:hAgo(90), due_at:hAgo(18),paid_at:null,  blocked:false },
]

const TABS = ['profiles', 'commissions', 'notifications']

export default function MassageAdminTab() {
  const [activeTab, setActiveTab] = useState('profiles')
  const [therapists, setTherapists] = useState([])
  const [commissions, setCommissions] = useState(DEMO_COMMISSIONS)
  const [editModal, setEditModal] = useState(null)
  const [notifyModal, setNotifyModal] = useState(null)
  const [notifyAll, setNotifyAll] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState({ title: '', body: '' })
  const [notifySent, setNotifySent] = useState([])
  const [commFilter, setCommFilter] = useState('all')

  // Load therapists
  useEffect(() => {
    const data = getTherapists().map(t => ({ ...t, active: t.status !== 'Deactivated' }))
    setTherapists(data)
  }, [])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = therapists.filter(t => t.active !== false && t.status !== 'Deactivated').length
  const totalBookings = commissions.length
  const totalRevenue = commissions.reduce((s, c) => s + c.order_total, 0)
  const totalCommission = commissions.reduce((s, c) => s + c.amount, 0)
  const overdueCount = commissions.filter(c => c.status === 'overdue').length
  const pendingCommission = commissions.filter(c => ['pending', 'overdue'].includes(c.status)).reduce((s, c) => s + c.amount, 0)

  // ── Therapist actions ──────────────────────────────────────────────────────
  const toggleActive = (id) => {
    setTherapists(prev => prev.map(t => {
      if (t.id !== id) return t
      const newActive = t.status === 'Deactivated' ? true : false
      return {
        ...t,
        active: newActive,
        status: newActive ? 'Offline' : 'Deactivated',
        isLive: newActive ? false : false,
      }
    }))
    // Supabase update
    if (supabase) {
      const t = therapists.find(t => t.id === id)
      const newStatus = t?.status === 'Deactivated' ? 'Offline' : 'deactivated'
      supabase.from('massage_therapists').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id).catch(() => {})
    }
  }

  const saveEdit = (updated) => {
    setTherapists(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
    setEditModal(null)
    // Supabase update
    if (supabase) {
      supabase.from('massage_therapists').update({
        name: updated.name,
        phone: updated.phone,
        area: updated.area,
        massage_types: updated.massageTypes,
        price_60: updated.price60,
        price_90: updated.price90,
        price_120: updated.price120,
        description: updated.description,
        client_preferences: updated.clientPreferences,
        updated_at: new Date().toISOString(),
      }).eq('id', updated.id).catch(() => {})
    }
  }

  // ── Commission actions ─────────────────────────────────────────────────────
  const markPaid = (id) => {
    setCommissions(d => d.map(c => c.id === id ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c))
    const c = commissions.find(x => x.id === id)
    if (c && supabase) {
      markSellerCommissionsPaid(c.therapistId, 'Admin marked paid', 'massage').catch(() => {})
    }
  }

  const markBlocked = (id) => {
    setCommissions(d => d.map(c => c.id === id ? { ...c, blocked: true } : c))
    // Also deactivate the therapist
    const c = commissions.find(x => x.id === id)
    if (c) {
      setTherapists(prev => prev.map(t =>
        t.id === c.therapistId ? { ...t, active: false, status: 'Deactivated' } : t
      ))
    }
  }

  const unblock = (id) => {
    setCommissions(d => d.map(c => c.id === id ? { ...c, blocked: false } : c))
  }

  const filteredCommissions = commissions.filter(c => {
    if (commFilter === 'all') return true
    if (commFilter === 'blocked') return c.blocked
    return c.status === commFilter
  })

  // ── Notification actions ───────────────────────────────────────────────────
  const sendNotification = async () => {
    if (!notifyMsg.title.trim()) return
    const targets = notifyAll ? therapists : [notifyModal]
    const sent = []
    for (const t of targets) {
      if (supabase) {
        await supabase.from('notifications').insert({
          id: `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          user_id: t.userId || t.id,
          type: 'massage_admin',
          title: notifyMsg.title,
          body: notifyMsg.body,
          from_user_id: null,
          data: { action: 'open_massage' },
          read: false,
          created_at: new Date().toISOString(),
        }).catch(() => {})
      }
      sent.push({ therapist: t.name, title: notifyMsg.title, time: new Date().toLocaleTimeString() })
    }
    setNotifySent(prev => [...sent, ...prev].slice(0, 50))
    setNotifyMsg({ title: '', body: '' })
    setNotifyModal(null)
    setNotifyAll(false)
  }

  return (
    <div className={styles.wrap}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Massage Management</h2>
          <p className={styles.subtitle}>Manage therapist profiles, commissions, and notifications</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.notifyAllBtn} onClick={() => { setNotifyAll(true); setNotifyModal({}) }}>
            Send to All Therapists
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Active Therapists</span>
          <span className={styles.summaryValue} style={{ color: '#00E5FF' }}>{activeCount}</span>
          <span className={styles.summarySub}>{therapists.length} total registered</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Revenue</span>
          <span className={styles.summaryValue} style={{ color: '#34C759' }}>{fmtRp(totalRevenue)}</span>
          <span className={styles.summarySub}>{totalBookings} bookings</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Commission Earned</span>
          <span className={styles.summaryValue} style={{ color: '#FF9500' }}>{fmtRp(totalCommission)}</span>
          <span className={styles.summarySub}>10% rate</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Outstanding</span>
          <span className={styles.summaryValue} style={{ color: '#FF3B30' }}>{fmtRp(pendingCommission)}</span>
          <span className={styles.summarySub}>{overdueCount} overdue</span>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div className={styles.tabRow}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'profiles' && 'Therapist Profiles'}
            {t === 'commissions' && `Commissions (${commissions.filter(c => ['pending','overdue'].includes(c.status)).length})`}
            {t === 'notifications' && 'Notifications'}
          </button>
        ))}
      </div>

      {/* ═══════ PROFILES TAB ═══════ */}
      {activeTab === 'profiles' && (
        <div className={styles.profileGrid}>
          {therapists.map(t => (
            <div key={t.id} className={`${styles.profileCard} ${t.status === 'Deactivated' ? styles.profileDeactivated : ''}`}>
              <div className={styles.profileHeader}>
                <img src={t.profileImage} alt={t.name} className={styles.profileAvatar} />
                <div className={styles.profileInfo}>
                  <div className={styles.profileNameRow}>
                    <span className={styles.profileName}>{t.name}</span>
                    {t.isVerified && <span className={styles.verifiedBadge}>Verified</span>}
                  </div>
                  <span className={styles.profileArea}>{t.area}, {t.location}</span>
                  <div className={styles.profileMeta}>
                    <span className={styles.profileRating}>{t.rating} ({t.reviewCount})</span>
                    <span className={styles.profileExp}>{t.yearsOfExperience}y exp</span>
                    <span className={styles.profileAge}>Age {t.age}</span>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${
                  t.status === 'Available' ? styles.statusAvailable :
                  t.status === 'Busy' ? styles.statusBusy :
                  t.status === 'Deactivated' ? styles.statusDeactivated :
                  styles.statusOffline
                }`}>
                  {t.status}
                </span>
              </div>

              {/* Services */}
              <div className={styles.profileServices}>
                {t.massageTypes.map(mt => (
                  <span key={mt} className={styles.serviceTag}>{mt}</span>
                ))}
              </div>

              {/* Pricing */}
              <div className={styles.pricingRow}>
                <span className={styles.priceItem}>60m: {fmtRp(t.price60)}</span>
                <span className={styles.priceItem}>90m: {fmtRp(t.price90)}</span>
                <span className={styles.priceItem}>120m: {fmtRp(t.price120)}</span>
              </div>

              {/* Client pref + languages */}
              <div className={styles.profileDetails}>
                <span className={styles.detailItem}>Clients: {t.clientPreferences}</span>
                <span className={styles.detailItem}>Lang: {t.languages?.join(', ')}</span>
                <span className={styles.detailItem}>Phone: {t.phone}</span>
              </div>

              {/* Actions */}
              <div className={styles.profileActions}>
                <button className={styles.btnEdit} onClick={() => setEditModal({ ...t })}>
                  Edit Profile
                </button>
                <button
                  className={t.status === 'Deactivated' ? styles.btnActivate : styles.btnDeactivate}
                  onClick={() => toggleActive(t.id)}
                >
                  {t.status === 'Deactivated' ? 'Reactivate' : 'Deactivate'}
                </button>
                <button className={styles.btnNotify} onClick={() => setNotifyModal(t)}>
                  Notify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ COMMISSIONS TAB ═══════ */}
      {activeTab === 'commissions' && (
        <div className={styles.commSection}>
          {/* 72h rule banner */}
          <div className={styles.ruleBanner}>
            <span className={styles.ruleIcon}>&#x23F1;</span>
            <span className={styles.ruleText}>
              <strong>72-hour rule</strong> &#8212; massage commissions (10%) are auto-posted to <em>Overdue</em> 72 hours after booking completion.
              Chat is locked when overdue. Account is deactivated after a second missed payment.
            </span>
          </div>

          {/* Commission filter */}
          <div className={styles.commFilters}>
            {['all', 'pending', 'overdue', 'paid', 'blocked'].map(f => (
              <button key={f} className={`${styles.commFilterBtn} ${commFilter === f ? styles.commFilterActive : ''}`}
                onClick={() => setCommFilter(f)}>
                {f === 'all' && 'All'}
                {f === 'pending' && `Pending (${commissions.filter(c=>c.status==='pending').length})`}
                {f === 'overdue' && `Overdue (${commissions.filter(c=>c.status==='overdue').length})`}
                {f === 'paid' && `Paid (${commissions.filter(c=>c.status==='paid').length})`}
                {f === 'blocked' && `Blocked (${commissions.filter(c=>c.blocked).length})`}
              </button>
            ))}
          </div>

          {/* Commission table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Therapist</th>
                  <th>Booking Ref</th>
                  <th>Booking Total</th>
                  <th>Commission (10%)</th>
                  <th>72h Window</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.length === 0 && (
                  <tr><td colSpan={7} className={styles.emptyRow}>No commissions match this filter</td></tr>
                )}
                {filteredCommissions.map(c => {
                  const due = dueLabel(c.due_at)
                  return (
                    <tr key={c.id} className={c.blocked ? styles.rowBlocked : ''}>
                      <td className={styles.sellerCell}>
                        <span className={styles.sellerName}>{c.therapist}</span>
                        {c.blocked && <span className={styles.blockedTag}>blocked</span>}
                      </td>
                      <td className={styles.refCell}>{c.bookingRef}</td>
                      <td className={styles.numCell}>{fmtRp(c.order_total)}</td>
                      <td className={styles.commCell}>{fmtRp(c.amount)}</td>
                      <td>
                        {due ? (
                          <span className={`${styles.duePill} ${due.overdue ? styles.duePillOverdue : styles.duePillOk}`}>
                            {due.text}
                          </span>
                        ) : (
                          <span className={styles.dueNa}>&#8212;</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${styles[`statusPill_${c.status}`]}`}>
                          {c.status === 'pending' && 'Pending'}
                          {c.status === 'overdue' && 'Overdue'}
                          {c.status === 'paid' && 'Paid'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {(c.status === 'pending' || c.status === 'overdue') && !c.blocked && (
                            <>
                              <button className={styles.btnPay} onClick={() => markPaid(c.id)}>Mark Paid</button>
                              {c.status === 'overdue' && (
                                <button className={styles.btnBlock} onClick={() => markBlocked(c.id)}>Block</button>
                              )}
                            </>
                          )}
                          {c.status === 'paid' && (
                            <span className={styles.paidAt}>
                              {c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : ''}
                            </span>
                          )}
                          {c.blocked && (
                            <button className={styles.btnUnblock} onClick={() => unblock(c.id)}>Unblock</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ NOTIFICATIONS TAB ═══════ */}
      {activeTab === 'notifications' && (
        <div className={styles.notifySection}>
          <div className={styles.notifyHeader}>
            <h3 className={styles.notifySectionTitle}>Send Notification to Therapist</h3>
            <button className={styles.notifyAllBtn} onClick={() => { setNotifyAll(true); setNotifyModal({}) }}>
              Broadcast to All
            </button>
          </div>

          {/* Quick send list */}
          <div className={styles.notifyList}>
            {therapists.map(t => (
              <div key={t.id} className={styles.notifyRow}>
                <img src={t.profileImage} alt={t.name} className={styles.notifyAvatar} />
                <div className={styles.notifyInfo}>
                  <span className={styles.notifyName}>{t.name}</span>
                  <span className={styles.notifyArea}>{t.area} &middot; {t.status}</span>
                </div>
                <button className={styles.btnNotify} onClick={() => setNotifyModal(t)}>
                  Send Notification
                </button>
              </div>
            ))}
          </div>

          {/* Sent log */}
          {notifySent.length > 0 && (
            <div className={styles.sentLog}>
              <h4 className={styles.sentLogTitle}>Recent Notifications Sent</h4>
              {notifySent.map((s, i) => (
                <div key={i} className={styles.sentItem}>
                  <span className={styles.sentTo}>To: {s.therapist}</span>
                  <span className={styles.sentTitle}>{s.title}</span>
                  <span className={styles.sentTime}>{s.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ EDIT MODAL ═══════ */}
      {editModal && (
        <div className={styles.modalOverlay} onClick={() => setEditModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Therapist Profile</h3>
              <button className={styles.modalClose} onClick={() => setEditModal(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>Name</label>
              <input className={styles.fieldInput} value={editModal.name}
                onChange={e => setEditModal(p => ({ ...p, name: e.target.value }))} />

              <label className={styles.fieldLabel}>Phone</label>
              <input className={styles.fieldInput} value={editModal.phone}
                onChange={e => setEditModal(p => ({ ...p, phone: e.target.value }))} />

              <label className={styles.fieldLabel}>Area</label>
              <input className={styles.fieldInput} value={editModal.area}
                onChange={e => setEditModal(p => ({ ...p, area: e.target.value }))} />

              <label className={styles.fieldLabel}>Description</label>
              <textarea className={styles.fieldTextarea} value={editModal.description} rows={3}
                onChange={e => setEditModal(p => ({ ...p, description: e.target.value }))} />

              <label className={styles.fieldLabel}>Client Preferences</label>
              <select className={styles.fieldInput} value={editModal.clientPreferences}
                onChange={e => setEditModal(p => ({ ...p, clientPreferences: e.target.value }))}>
                <option value="All">All</option>
                <option value="Females Only">Females Only</option>
                <option value="Males Only">Males Only</option>
              </select>

              <label className={styles.fieldLabel}>Massage Types</label>
              <div className={styles.typeCheckboxes}>
                {MASSAGE_TYPES.map(mt => (
                  <label key={mt} className={styles.checkboxLabel}>
                    <input type="checkbox"
                      checked={editModal.massageTypes?.includes(mt)}
                      onChange={e => {
                        const types = editModal.massageTypes || []
                        setEditModal(p => ({
                          ...p,
                          massageTypes: e.target.checked
                            ? [...types, mt]
                            : types.filter(t => t !== mt),
                        }))
                      }}
                    />
                    {mt}
                  </label>
                ))}
              </div>

              <div className={styles.priceFields}>
                <div>
                  <label className={styles.fieldLabel}>Price 60min</label>
                  <input className={styles.fieldInput} type="number" value={editModal.price60}
                    onChange={e => setEditModal(p => ({ ...p, price60: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Price 90min</label>
                  <input className={styles.fieldInput} type="number" value={editModal.price90}
                    onChange={e => setEditModal(p => ({ ...p, price90: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Price 120min</label>
                  <input className={styles.fieldInput} type="number" value={editModal.price120}
                    onChange={e => setEditModal(p => ({ ...p, price120: Number(e.target.value) }))} />
                </div>
              </div>

              <label className={styles.fieldLabel}>Languages (comma separated)</label>
              <input className={styles.fieldInput} value={editModal.languages?.join(', ')}
                onChange={e => setEditModal(p => ({ ...p, languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean) }))} />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setEditModal(null)}>Cancel</button>
              <button className={styles.btnSave} onClick={() => saveEdit(editModal)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ NOTIFY MODAL ═══════ */}
      {notifyModal && (
        <div className={styles.modalOverlay} onClick={() => { setNotifyModal(null); setNotifyAll(false) }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {notifyAll ? 'Broadcast to All Therapists' : `Notify ${notifyModal.name}`}
              </h3>
              <button className={styles.modalClose} onClick={() => { setNotifyModal(null); setNotifyAll(false) }}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>Notification Title</label>
              <input className={styles.fieldInput} placeholder="e.g. Commission Reminder"
                value={notifyMsg.title} onChange={e => setNotifyMsg(p => ({ ...p, title: e.target.value }))} />

              <label className={styles.fieldLabel}>Message Body</label>
              <textarea className={styles.fieldTextarea} rows={4}
                placeholder="e.g. Your commission is due in 24 hours. Please submit payment proof."
                value={notifyMsg.body} onChange={e => setNotifyMsg(p => ({ ...p, body: e.target.value }))} />

              {/* Quick templates */}
              <div className={styles.templateRow}>
                <span className={styles.templateLabel}>Quick:</span>
                <button className={styles.templateBtn} onClick={() => setNotifyMsg({ title: 'Commission Due', body: 'Your massage commission is due within 72 hours. Please submit payment proof via the app to avoid account restrictions.' })}>Commission Due</button>
                <button className={styles.templateBtn} onClick={() => setNotifyMsg({ title: 'Profile Update Required', body: 'Please update your profile information and availability status. Incomplete profiles receive fewer bookings.' })}>Profile Update</button>
                <button className={styles.templateBtn} onClick={() => setNotifyMsg({ title: 'New Booking Available', body: 'A new massage booking request is available in your area. Open the app to accept.' })}>New Booking</button>
                <button className={styles.templateBtn} onClick={() => setNotifyMsg({ title: 'Account Warning', body: 'Your account has an overdue commission. Please settle your outstanding balance to avoid deactivation.' })}>Warning</button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => { setNotifyModal(null); setNotifyAll(false) }}>Cancel</button>
              <button className={styles.btnSave} onClick={sendNotification} disabled={!notifyMsg.title.trim()}>
                {notifyAll ? `Send to ${therapists.length} Therapists` : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
