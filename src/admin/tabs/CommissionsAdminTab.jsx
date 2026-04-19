/**
 * CommissionsAdminTab
 * Admin view of the commission system.
 * - Marketplace sellers  → 10% per completed order
 * - Restaurant owners    → 10% per completed order
 * - 72-hour payment window — auto-posted to overdue by DB cron
 * - Chat lock + account block for non-payers
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { markSellerCommissionsPaid, blockAccount, unblockAccount } from '@/services/commissionService'
import { setSellerChatBlock } from '@/services/marketplaceChatService'
import { notifyCommissionDueSoon } from '@/services/notificationService'
import styles from './CommissionsAdminTab.module.css'

const REMINDER_SENT_KEY = 'indoo_reminder_sent'

function getReminderSent(sellerId) {
  try {
    const store = JSON.parse(localStorage.getItem(REMINDER_SENT_KEY) || '{}')
    const ts = store[sellerId]
    if (ts && (Date.now() - ts) < 24 * 3600000) return true
  } catch {}
  return false
}

function setReminderSent(sellerId) {
  try {
    const store = JSON.parse(localStorage.getItem(REMINDER_SENT_KEY) || '{}')
    store[sellerId] = Date.now()
    localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(store))
  } catch {}
}

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

// ── Demo data ─────────────────────────────────────────────────────────────────
const now = Date.now()
const h = (n) => new Date(now + n * 3600000).toISOString()
const hAgo = (n) => new Date(now - n * 3600000).toISOString()

const DEMO = [
  { id:'c1',  seller:'Bali Crafts Co.',        sellerId:'s1',  orderRef:'#SHOP_11223344', commission_type:'marketplace', rate:0.05, order_total:1225000, amount:61250,  status:'pending',  created_at:hAgo(4),  due_at:h(68),  paid_at:null,  blocked:false },
  { id:'c2',  seller:'Warung Sari Rasa',        sellerId:'s2',  orderRef:'#MAKAN_87654321',commission_type:'restaurant',  rate:0.10, order_total:81000,   amount:8100,   status:'pending',  created_at:hAgo(2),  due_at:h(70),  paid_at:null,  blocked:false },
  { id:'c3',  seller:'Toko Batik Mega',         sellerId:'s3',  orderRef:'#SHOP_55443322', commission_type:'marketplace', rate:0.05, order_total:340000,  amount:17000,  status:'overdue',  created_at:hAgo(80), due_at:hAgo(8),paid_at:null,  blocked:false },
  { id:'c4',  seller:'Ayam Geprek Mbak Rina',   sellerId:'s4',  orderRef:'#MAKAN_12345678',commission_type:'restaurant',  rate:0.10, order_total:56000,   amount:5600,   status:'overdue',  created_at:hAgo(96), due_at:hAgo(24),paid_at:null, blocked:false },
  { id:'c5',  seller:'Butik Kebaya Sari',        sellerId:'s5',  orderRef:'#SHOP_99887766', commission_type:'marketplace', rate:0.05, order_total:890000,  amount:44500,  status:'paid',     created_at:hAgo(120),due_at:hAgo(48),paid_at:hAgo(50),blocked:false },
  { id:'c6',  seller:'Bakso Pak Budi',           sellerId:'s6',  orderRef:'#MAKAN_44332211',commission_type:'restaurant',  rate:0.10, order_total:32000,   amount:3200,   status:'paid',     created_at:hAgo(72), due_at:hAgo(1), paid_at:hAgo(2), blocked:false },
  { id:'c7',  seller:'Toko Elektronik Jaya',    sellerId:'s7',  orderRef:'#SHOP_77665544', commission_type:'marketplace', rate:0.05, order_total:2800000, amount:140000, status:'overdue',  created_at:hAgo(200),due_at:hAgo(128),paid_at:null, blocked:true  },
  { id:'c8',  seller:'Nasi Goreng Pak Harto',   sellerId:'s8',  orderRef:'#MAKAN_66554433',commission_type:'restaurant',  rate:0.10, order_total:28000,   amount:2800,   status:'pending',  created_at:hAgo(1),  due_at:h(71),   paid_at:null,    blocked:false },
  { id:'c9',  seller:'Handmade by Dewi',         sellerId:'s9',  orderRef:'#SHOP_22334455', commission_type:'marketplace', rate:0.05, order_total:475000,  amount:23750,  status:'paid',     created_at:hAgo(50), due_at:hAgo(2),  paid_at:hAgo(3), blocked:false },
  { id:'c10', seller:'Sate & Gule Pak Sabar',    sellerId:'s10', orderRef:'#MAKAN_55667788',commission_type:'restaurant',  rate:0.10, order_total:65000,   amount:6500,   status:'overdue',  created_at:hAgo(100),due_at:hAgo(28), paid_at:null,    blocked:false },
  { id:'c11', seller:'Budi Santoso (Bike)',       sellerId:'s11', orderRef:'#RIDE_11223344', commission_type:'driver_bike', rate:0.10, order_total:28000,   amount:2800,   status:'pending',  created_at:hAgo(3),  due_at:null,    paid_at:null,    blocked:false },
  { id:'c12', seller:'Agus Wijaya (Bike)',        sellerId:'s12', orderRef:'#RIDE_22334455', commission_type:'driver_bike', rate:0.10, order_total:35000,   amount:3500,   status:'pending',  created_at:hAgo(5),  due_at:null,    paid_at:null,    blocked:false },
  { id:'c13', seller:'Rizky Pratama (Car)',       sellerId:'s13', orderRef:'#RIDE_33445566', commission_type:'driver_car',  rate:0.10, order_total:85000,   amount:8500,   status:'overdue',  created_at:hAgo(350),due_at:null,    paid_at:null,    blocked:false },
  { id:'c14', seller:'Hendra Gunawan (Car)',      sellerId:'s14', orderRef:'#RIDE_44556677', commission_type:'driver_car',  rate:0.10, order_total:120000,  amount:12000,  status:'paid',     created_at:hAgo(48), due_at:null,    paid_at:hAgo(1), blocked:false },
]

const BLOCKED_ACCOUNTS = DEMO.filter(c => c.blocked).map(c => ({
  sellerId: c.sellerId,
  seller:   c.seller,
  commission_type: c.commission_type,
  totalOwed: c.amount,
  blockedAt: hAgo(50),
  reason: 'Commission overdue > 72h — no response',
}))

const STATUS_TABS = ['all', 'pending', 'overdue', 'paid', 'blocked']
const TYPE_FILTERS = [
  { key: 'all',         label: 'All Types' },
  { key: 'marketplace', label: '🛍️ Marketplace', rate: '10%' },
  { key: 'restaurant',  label: '🍽️ Restaurant',   rate: '10%' },
  { key: 'driver_bike', label: '🚲 Bike Driver',  rate: '10%' },
  { key: 'driver_car',  label: '🚗 Car Driver',   rate: '10%' },
]

export default function CommissionsAdminTab() {
  const [statusTab,  setStatusTab]  = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [data,       setData]       = useState(DEMO)
  const [blocked,    setBlocked]    = useState(BLOCKED_ACCOUNTS)

  // ── Payment proofs from sellers ────────────────────────────────────────────
  const [paymentProofs, setPaymentProofs] = useState([
    { id:'pp1', seller_id:'s1', seller_name:'Bali Crafts Co.', amount:61250, screenshot_url:'https://picsum.photos/seed/proof1/400/600', status:'pending_review', created_at:hAgo(1) },
    { id:'pp2', seller_id:'s2', seller_name:'Warung Sari Rasa', amount:8100, screenshot_url:'https://picsum.photos/seed/proof2/400/600', status:'pending_review', created_at:hAgo(3) },
  ])
  const [proofPreview, setProofPreview] = useState(null)
  const [reminderSent, setReminderSentState] = useState(() => {
    try {
      const store = JSON.parse(localStorage.getItem(REMINDER_SENT_KEY) || '{}')
      const recent = {}
      for (const [k, v] of Object.entries(store)) {
        if (Date.now() - v < 24 * 3600000) recent[k] = true
      }
      return recent
    } catch { return {} }
  })

  const handleSendReminder = async (sellerId, amount) => {
    const dueDate = new Date(Date.now() + 48 * 3600000).toISOString()
    await notifyCommissionDueSoon(sellerId, amount, dueDate)
    setReminderSentState(s => ({ ...s, [sellerId]: true }))
    setReminderSent(sellerId)
  }

  useEffect(() => {
    if (!supabase) return
    supabase.from('commission_payments')
      .select('*, profiles:seller_id(display_name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .then(({ data: proofs }) => {
        if (proofs?.length) {
          setPaymentProofs(proofs.map(p => ({
            ...p, seller_name: p.profiles?.display_name ?? 'Unknown',
          })))
        }
      })
  }, [])

  const handleConfirmProof = async (proofId, sellerId) => {
    setPaymentProofs(prev => prev.map(p => p.id === proofId ? { ...p, status: 'confirmed' } : p))
    // Mark all seller commissions as paid
    await markSellerCommissionsPaid(sellerId, `Payment proof confirmed by admin`)
    setData(d => d.map(c => c.sellerId === sellerId && ['pending','overdue'].includes(c.status)
      ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c))
    // Update proof status in DB
    supabase?.from('commission_payments').update({ status: 'confirmed', reviewed_at: new Date().toISOString() }).eq('id', proofId).catch(() => {})
  }

  const handleRejectProof = async (proofId) => {
    setPaymentProofs(prev => prev.map(p => p.id === proofId ? { ...p, status: 'rejected' } : p))
    supabase?.from('commission_payments').update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: 'Screenshot rejected — payment not confirmed' }).eq('id', proofId).catch(() => {})
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalOutstanding = data.filter(c => ['pending','overdue'].includes(c.status)).reduce((s,c) => s + c.amount, 0)
  const totalOverdue     = data.filter(c => c.status === 'overdue').reduce((s,c) => s + c.amount, 0)
  const todayPaid        = data.filter(c => c.status === 'paid' && c.paid_at && (Date.now() - new Date(c.paid_at)) < 86400000).reduce((s,c) => s + c.amount, 0)

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = data.filter(c => {
    if (statusTab === 'blocked') return c.blocked
    if (statusTab !== 'all' && c.status !== statusTab) return false
    if (typeFilter !== 'all' && c.commission_type !== typeFilter) return false
    return true
  })

  // ── Actions ────────────────────────────────────────────────────────────────
  const markPaid = async (id) => {
    setData(d => d.map(c => c.id === id ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c))
    const c = data.find(x => x.id === id)
    if (c) {
      // Mark paid in Supabase
      supabase?.from('seller_commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id).catch(() => {})
      // If seller was blocked, unblock their chat
      if (c.blocked) {
        await setSellerChatBlock(c.sellerId, false)
        await unblockAccount({ userId: c.sellerId })
        setBlocked(b => b.filter(x => x.sellerId !== c.sellerId))
        setData(d => d.map(x => x.sellerId === c.sellerId ? { ...x, blocked: false } : x))
      }
      // Notify seller
      supabase?.from('notifications').insert({
        user_id: c.sellerId,
        type: 'commission',
        title: 'Commission Paid',
        body: `Your commission of ${fmtRp(c.amount)} has been confirmed. Thank you!`,
        read: false,
      }).catch(() => {})
    }
  }

  const markBlocked = async (id) => {
    setData(d => d.map(c => c.id === id ? { ...c, blocked: true } : c))
    const c = data.find(x => x.id === id)
    if (c) {
      setBlocked(b => [...b, { sellerId: c.sellerId, seller: c.seller, commission_type: c.commission_type, totalOwed: c.amount, blockedAt: new Date().toISOString(), reason: 'Manually blocked by admin' }])
      // Block seller chat + account in Supabase
      await setSellerChatBlock(c.sellerId, true)
      await blockAccount({ userId: c.sellerId, reason: 'commission_overdue', notes: `Commission ${fmtRp(c.amount)} overdue — chat locked` })
      // Notify seller
      supabase?.from('notifications').insert({
        user_id: c.sellerId,
        type: 'commission',
        title: 'Messaging Locked',
        body: `Your messaging is locked due to unpaid commission (${fmtRp(c.amount)}). Pay to restore access.`,
        read: false,
      }).catch(() => {})
    }
  }

  const unblock = async (sellerId) => {
    setBlocked(b => b.filter(x => x.sellerId !== sellerId))
    setData(d => d.map(c => c.sellerId === sellerId ? { ...c, blocked: false } : c))
    // Unblock seller chat + account in Supabase
    await setSellerChatBlock(sellerId, false)
    await unblockAccount({ userId: sellerId })
    // Notify seller
    supabase?.from('notifications').insert({
      user_id: sellerId,
      type: 'commission',
      title: 'Messaging Restored',
      body: 'Your messaging access has been restored. Thank you for your payment.',
      read: false,
    }).catch(() => {})
  }

  const payAllOverdue = () => {
    setData(d => d.map(c => c.status === 'overdue' ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c))
  }

  return (
    <div className={styles.wrap}>

      {/* ── Summary cards ── */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Outstanding</span>
          <span className={styles.summaryValue} style={{ color: '#FF9500' }}>{fmtRp(totalOutstanding)}</span>
          <span className={styles.summarySub}>{data.filter(c => ['pending','overdue'].includes(c.status)).length} commissions</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overdue (72h+)</span>
          <span className={styles.summaryValue} style={{ color: '#FF3B30' }}>{fmtRp(totalOverdue)}</span>
          <span className={styles.summarySub}>{data.filter(c => c.status === 'overdue').length} sellers affected</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Collected Today</span>
          <span className={styles.summaryValue} style={{ color: '#34C759' }}>{fmtRp(todayPaid)}</span>
          <span className={styles.summarySub}>{data.filter(c => c.status === 'paid' && c.paid_at && (Date.now() - new Date(c.paid_at)) < 86400000).length} payments</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Blocked Accounts</span>
          <span className={styles.summaryValue} style={{ color: '#FF3B30' }}>{blocked.length}</span>
          <span className={styles.summarySub}>commission avoidance</span>
        </div>
      </div>

      {/* ── 72h rule banner ── */}
      <div className={styles.ruleBanner}>
        <span className={styles.ruleIcon}>⏱</span>
        <span className={styles.ruleText}>
          <strong>72-hour rule</strong> — commissions are auto-posted to <em>Overdue</em> 72 hours after order completion.
          Chat is locked when overdue. Account is blocked after a second missed payment.
        </span>
        {data.filter(c => c.status === 'overdue' && !c.blocked).length > 0 && (
          <button className={styles.payAllBtn} onClick={payAllOverdue}>
            ✓ Mark All Overdue as Paid
          </button>
        )}
      </div>

      {/* ── Incoming payment proofs ── */}
      {paymentProofs.filter(p => p.status === 'pending_review').length > 0 && (
        <div style={{
          margin:'0 0 16px', padding:16, borderRadius:12,
          background:'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(0,229,255,0.05))',
          border:'1px solid rgba(34,197,94,0.2)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontSize:18 }}>📸</span>
            <span style={{ fontSize:14, fontWeight:800, color:'#22c55e' }}>
              Incoming Payment Proofs ({paymentProofs.filter(p => p.status === 'pending_review').length})
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {paymentProofs.filter(p => p.status === 'pending_review').map(proof => (
              <div key={proof.id} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                background:'rgba(0,0,0,0.3)', borderRadius:10,
              }}>
                <img
                  src={proof.screenshot_url} alt="Payment proof"
                  onClick={() => setProofPreview(proof.screenshot_url)}
                  style={{ width:48, height:64, objectFit:'cover', borderRadius:6, cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)' }}
                />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{proof.seller_name}</div>
                  <div style={{ fontSize:12, color:'#22c55e', fontWeight:700, fontFamily:'monospace' }}>
                    Rp {Number(proof.amount).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                    {new Date(proof.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => handleConfirmProof(proof.id, proof.seller_id)}
                    style={{ padding:'6px 14px', borderRadius:8, background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Confirm
                  </button>
                  <button onClick={() => handleRejectProof(proof.id)}
                    style={{ padding:'6px 14px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Reject
                  </button>
                  <button onClick={() => setProofPreview(proof.screenshot_url)}
                    style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshot preview modal */}
      {proofPreview && (
        <div onClick={() => setProofPreview(null)} style={{
          position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <img src={proofPreview} alt="Payment proof" style={{ maxWidth:'90%', maxHeight:'90vh', borderRadius:12, boxShadow:'0 16px 64px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className={styles.statusTabs}>
        {STATUS_TABS.map(t => (
          <button
            key={t}
            className={`${styles.statusTab} ${statusTab === t ? styles.statusTabActive : ''}`}
            onClick={() => setStatusTab(t)}
          >
            {t === 'all'     && 'All'}
            {t === 'pending' && `⏳ Pending (${data.filter(c=>c.status==='pending').length})`}
            {t === 'overdue' && `🔴 Overdue (${data.filter(c=>c.status==='overdue').length})`}
            {t === 'paid'    && `✅ Paid (${data.filter(c=>c.status==='paid').length})`}
            {t === 'blocked' && `🚫 Blocked (${blocked.length})`}
          </button>
        ))}
      </div>

      {/* ── Type filter row ── */}
      {statusTab !== 'blocked' && (
        <div className={styles.typeRow}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.typeBtn} ${typeFilter === f.key ? styles.typeBtnActive : ''}`}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
              {f.rate && <span className={styles.rateTag}>{f.rate}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Blocked accounts list ── */}
      {statusTab === 'blocked' && (
        <div className={styles.blockedList}>
          {blocked.length === 0 && (
            <div className={styles.empty}>No blocked accounts</div>
          )}
          {blocked.map(b => (
            <div key={b.sellerId} className={styles.blockedRow}>
              <div className={styles.blockedLeft}>
                <span className={styles.blockedName}>{b.seller}</span>
                <span className={`${styles.typePill} ${b.commission_type === 'restaurant' ? styles.typePillFood : styles.typePillMarket}`}>
                  {b.commission_type === 'restaurant' ? '🍽️ 10%' : '🛍️ 10%'}
                </span>
              </div>
              <div className={styles.blockedMid}>
                <span className={styles.blockedOwed}>{fmtRp(b.totalOwed)} outstanding</span>
                <span className={styles.blockedReason}>{b.reason}</span>
              </div>
              <button className={styles.unblockBtn} onClick={() => unblock(b.sellerId)}>
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Commission table ── */}
      {statusTab !== 'blocked' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Type</th>
                <th>Order Ref</th>
                <th>Order Total</th>
                <th>Commission</th>
                <th>72h Window</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>No commissions match this filter</td>
                </tr>
              )}
              {filtered.map(c => {
                const due = dueLabel(c.due_at)
                return (
                  <tr key={c.id} className={c.blocked ? styles.rowBlocked : ''}>
                    <td className={styles.sellerCell}>
                      <span className={styles.sellerName}>{c.seller}</span>
                      {c.blocked && <span className={styles.blockedTag}>🚫 blocked</span>}
                    </td>
                    <td>
                      <span className={`${styles.typePill} ${
                        c.commission_type === 'restaurant'  ? styles.typePillFood  :
                        c.commission_type === 'driver_bike' ? styles.typePillBike  :
                        c.commission_type === 'driver_car'  ? styles.typePillCar   :
                        styles.typePillMarket
                      }`}>
                        {c.commission_type === 'restaurant'  && '🍽️ 10%'}
                        {c.commission_type === 'driver_bike' && '🚲 10%'}
                        {c.commission_type === 'driver_car'  && '🚗 10%'}
                        {c.commission_type === 'marketplace' && '🛍️ 10%'}
                      </span>
                    </td>
                    <td className={styles.refCell}>{c.orderRef}</td>
                    <td className={styles.numCell}>{fmtRp(c.order_total)}</td>
                    <td className={styles.commCell}>{fmtRp(c.amount)}</td>
                    <td>
                      {c.commission_type?.startsWith('driver_') ? (
                        <span className={`${styles.duePill} ${c.status === 'overdue' ? styles.duePillOverdue : styles.duePillSignIn}`}>
                          {c.status === 'overdue' ? '🔴 14d+ overdue' : '🔑 Due: sign-in'}
                        </span>
                      ) : due ? (
                        <span className={`${styles.duePill} ${due.overdue ? styles.duePillOverdue : styles.duePillOk}`}>
                          {due.text}
                        </span>
                      ) : (
                        <span className={styles.dueNa}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[`statusPill_${c.status}`]}`}>
                        {c.status === 'pending' && '⏳ Pending'}
                        {c.status === 'overdue' && '🔴 Overdue'}
                        {c.status === 'paid'    && '✅ Paid'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {(c.status === 'pending' || c.status === 'overdue') && !c.blocked && (
                          <>
                            <button className={styles.btnPay} onClick={() => markPaid(c.id)}>
                              Mark Paid
                            </button>
                            {reminderSent[c.sellerId] ? (
                              <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontStyle:'italic', padding:'4px 8px' }}>Sent</span>
                            ) : (
                              <button
                                style={{
                                  padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
                                  background:'transparent', border:'1px solid #34C759', color:'#34C759',
                                  display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit',
                                }}
                                onClick={() => handleSendReminder(c.sellerId, c.amount)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                Remind
                              </button>
                            )}
                            {c.status === 'overdue' && (
                              <button className={styles.btnBlock} onClick={() => markBlocked(c.id)}>
                                Block
                              </button>
                            )}
                          </>
                        )}
                        {c.status === 'paid' && (
                          <span className={styles.paidAt}>
                            {c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—'}
                          </span>
                        )}
                        {c.blocked && (
                          <button className={styles.btnUnblock} onClick={() => unblock(c.sellerId)}>
                            Unblock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
