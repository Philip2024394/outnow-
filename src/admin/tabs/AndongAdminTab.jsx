/**
 * AndongAdminTab — Full admin control for andong service.
 * Features: owner list, block/activate, chat, commission view, map, wallet overview.
 */
import { useState, useEffect } from 'react'
import { getAvailableHorses, WELFARE, formatRpAndong, ANDONG_PACKAGES } from '@/services/andongService'
import { getAllWallets, getAllTransactions, getTotalCommission, formatRpWallet } from '@/services/andongWalletService'

export default function AndongAdminTab() {
  const [view, setView] = useState('owners') // owners | wallets | transactions | map
  const [horses, setHorses] = useState([])
  const [wallets, setWallets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [chatOpen, setChatOpen] = useState(null)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState({})

  useEffect(() => {
    getAvailableHorses().then(setHorses)
    getAllWallets().then(setWallets)
    getAllTransactions().then(setTransactions)
    getTotalCommission().then(setTotalCommission)
  }, [])

  const toggleBlock = (horseId) => {
    setHorses(prev => prev.map(h =>
      h.id === horseId ? { ...h, is_active: !h.is_active, status: h.is_active ? 'blocked' : 'available' } : h
    ))
  }

  const sendAdminChat = (ownerId) => {
    if (!chatMsg.trim()) return
    const msg = { from: 'admin', text: chatMsg.trim(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }
    setChatHistory(prev => ({ ...prev, [ownerId]: [...(prev[ownerId] || []), msg] }))
    setChatMsg('')
  }

  const totalEarned = wallets.reduce((s, w) => s + w.total_earned, 0)
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0)
  const activeHorses = horses.filter(h => h.is_active).length

  return (
    <div style={{ padding: 0 }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 0', overflowX: 'auto' }}>
        {[
          { label: 'Horses', value: `${activeHorses}/${horses.length}`, color: '#8DC63F' },
          { label: 'Commission', value: formatRpWallet(totalCommission), color: '#FACC15' },
          { label: 'Owner Balances', value: formatRpWallet(totalBalance), color: '#60A5FA' },
          { label: 'Total Earned', value: formatRpWallet(totalEarned), color: '#fff' },
        ].map((s, i) => (
          <div key={i} style={{ minWidth: 120, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'owners', label: '🐴 Owners' },
          { id: 'wallets', label: '💰 Wallets' },
          { id: 'transactions', label: '📊 Transactions' },
          { id: 'map', label: '🗺️ Map' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: view === t.id ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
            color: view === t.id ? '#8DC63F' : 'rgba(255,255,255,0.5)',
            fontSize: 11, fontWeight: 700,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OWNERS VIEW ── */}
      {view === 'owners' && (
        <div>
          {horses.map(h => (
            <div key={h.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: `1px solid ${h.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.3)'}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={h.owner_photo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{h.owner_name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>🐴 {h.name} · {h.breed} · {h.color}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {h.cart_type === 'covered' ? '🏠 Covered' : '☀️ Open'} · 🪑 {h.seats} seats · 🎨 {h.cart_color}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: h.is_active ? '#8DC63F' : '#EF4444' }}>{h.is_active ? 'Active' : 'Blocked'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>⭐ {h.rating} · {h.total_trips} trips</div>
                </div>
              </div>

              {/* Welfare stats */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.4)' }}>
                  Trips: {h.today_trips}/{WELFARE.MAX_TRIPS_PER_DAY}
                </span>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.4)' }}>
                  Hours: {h.today_hours}/{WELFARE.MAX_HOURS_PER_DAY}h
                </span>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.4)' }}>
                  KM: {h.today_km}/{WELFARE.MAX_DISTANCE_KM_PER_DAY}
                </span>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.3)', color: h.vet_status === 'healthy' ? '#8DC63F' : '#EF4444' }}>
                  Vet: {h.vet_status}
                </span>
              </div>

              {/* Languages */}
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {(h.languages || []).map(l => (
                  <span key={l} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(141,198,63,0.1)', color: '#8DC63F' }}>{l}</span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={() => toggleBlock(h.id)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  background: h.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(141,198,63,0.1)',
                  color: h.is_active ? '#EF4444' : '#8DC63F',
                }}>{h.is_active ? 'Block Owner' : 'Activate Owner'}</button>
                <button onClick={() => setChatOpen(chatOpen === h.id ? null : h.id)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  background: 'rgba(59,130,246,0.1)', color: '#60A5FA',
                }}>💬 Chat</button>
              </div>

              {/* Inline chat */}
              {chatOpen === h.id && (
                <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
                    {(chatHistory[h.id] || []).length === 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 8 }}>No messages yet</div>
                    )}
                    {(chatHistory[h.id] || []).map((msg, i) => (
                      <div key={i} style={{ marginBottom: 4, textAlign: msg.from === 'admin' ? 'right' : 'left' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 8px', borderRadius: 8, fontSize: 11, maxWidth: '80%',
                          background: msg.from === 'admin' ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.08)',
                          color: msg.from === 'admin' ? '#8DC63F' : 'rgba(255,255,255,0.6)',
                        }}>{msg.text}</span>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>{msg.time}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendAdminChat(h.id)}
                      placeholder="Message owner..."
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={() => sendAdminChat(h.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#8DC63F', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── WALLETS VIEW ── */}
      {view === 'wallets' && (
        <div>
          {wallets.map(w => (
            <div key={w.owner_id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{w.owner_name}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#8DC63F' }}>{formatRpWallet(w.balance)}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Total Earned</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatRpWallet(w.total_earned)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Commission (10%)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FACC15' }}>{formatRpWallet(w.total_commission)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Withdrawn</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{formatRpWallet(w.total_withdrawals)}</div>
                </div>
              </div>
              {w.pending_withdrawal > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#FACC15' }}>Pending withdrawal: {formatRpWallet(w.pending_withdrawal)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TRANSACTIONS VIEW ── */}
      {view === 'transactions' && (
        <div>
          {transactions.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {t.type === 'earning' ? `📥 ${t.package_name}` : `📤 Withdrawal`}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {t.type === 'earning' ? `Customer: ${t.customer_name}` : `${t.bank_name} ${t.account_number}`}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{new Date(t.created_at).toLocaleDateString('id-ID')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.type === 'earning' ? '#8DC63F' : '#EF4444' }}>
                  {t.type === 'earning' ? '+' : '-'}{formatRpWallet(Math.abs(t.amount))}
                </div>
                {t.commission > 0 && (
                  <div style={{ fontSize: 9, color: '#FACC15' }}>Commission: {formatRpWallet(t.commission)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {view === 'map' && (
        <div>
          <div style={{ height: 300, borderRadius: 14, overflow: 'hidden', background: '#111', position: 'relative', marginBottom: 12 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a1a0a, #0a0a15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
                <div style={{ fontSize: 12 }}>Yogyakarta — Horse Locations</div>
              </div>
            </div>
            {horses.map((h, i) => {
              const isActive = h.is_active && h.status !== 'booked'
              const left = 12 + (i * 16) + (i % 2 ? 5 : 0)
              const top = 20 + (i * 11) + (i % 3 ? 14 : -6)
              return (
                <div key={h.id} style={{
                  position: 'absolute', left: `${Math.min(left, 80)}%`, top: `${Math.min(Math.max(top, 10), 75)}%`,
                  textAlign: 'center', zIndex: 5,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', margin: '0 auto',
                    background: !h.is_active ? '#666' : h.status === 'booked' ? '#EF4444' : '#8DC63F',
                    border: '2px solid rgba(0,0,0,0.5)',
                    boxShadow: isActive ? '0 0 10px rgba(141,198,63,0.6)' : 'none',
                    animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
                  }} />
                  <div style={{ fontSize: 8, color: '#fff', fontWeight: 700, marginTop: 2, background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                    {h.name}
                  </div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{h.owner_name}</div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8DC63F' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>On Ride</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#666' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Blocked</span>
            </div>
          </div>

          {/* Quick list under map */}
          {horses.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: !h.is_active ? '#666' : h.status === 'booked' ? '#EF4444' : '#8DC63F', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, flex: 1 }}>{h.name}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.owner_name}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.today_km}km today</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
