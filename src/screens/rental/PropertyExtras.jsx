import { useState, useEffect } from 'react'
import { getWantedProperties, fmtBudget, TIMELINE_OPTIONS } from '@/services/wantedPropertyService'
import { getInvestorListings, convertFromIDR, calculateInvestmentGrade, CURRENCIES } from '@/services/investorService'

const GREEN = '#8DC63F'
const GOLD = '#FACC15'
const GLASS_BG = 'rgba(0,0,0,0.5)'
const BORDER = 'rgba(255,255,255,0.06)'
const CURRENCY_OPTIONS = ['USD', 'SGD', 'AUD', 'CNY']

function SectionHeader({ title, accent, icon, collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: GLASS_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: accent, letterSpacing: '0.02em' }}>{title}</span>
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
        ▼
      </span>
    </button>
  )
}

/* ── Wanted Property Section ── */

function WantedPropertySection({ onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let active = true
    getWantedProperties({ limit: 3 })
      .then(data => { if (active) setItems(data || []) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const getTimelineLabel = (val) => {
    const opt = TIMELINE_OPTIONS?.find(o => o.value === val)
    return opt ? opt.label : val || 'Flexible'
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <SectionHeader
        title="Looking for property?"
        accent={GREEN}
        icon="🏠"
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      {!collapsed && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: `linear-gradient(135deg, rgba(141,198,63,0.15), rgba(141,198,63,0.05))`,
            border: `1px solid rgba(141,198,63,0.2)`,
            borderRadius: 12,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              Can't find what you need? Post a request
            </span>
            <button
              onClick={onNavigate}
              style={{
                padding: '6px 14px',
                background: GREEN,
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#000',
                cursor: 'pointer',
                minHeight: 44,
                minWidth: 44,
              }}
            >
              Post Request
            </button>
          </div>

          {/* Cards */}
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No requests yet</div>
          ) : (
            items.map((item, i) => (
              <div
                key={item.id || i}
                style={{
                  padding: '10px 12px',
                  background: GLASS_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.property_type || 'Any'}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.location || 'Any area'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>
                    {fmtBudget ? fmtBudget(item.budget_min, item.budget_max) : `${item.budget_min || '?'} - ${item.budget_max || '?'}`}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: GREEN,
                  background: 'rgba(141,198,63,0.12)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {getTimelineLabel(item.timeline)}
                </span>
              </div>
            ))
          )}

          {/* See All */}
          {items.length > 0 && (
            <button
              onClick={onNavigate}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: `1px solid rgba(141,198,63,0.2)`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: GREEN,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              See All Requests
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── International Investors Section ── */

function InternationalInvestorsSection({ onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    let active = true
    getInvestorListings({ limit: 3, featured: true })
      .then(data => { if (active) setItems(data || []) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const gradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return GOLD
    if (grade === 'B+' || grade === 'B') return GREEN
    return 'rgba(255,255,255,0.5)'
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <SectionHeader
        title="Global Invest"
        accent={GOLD}
        icon="🌍"
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      {!collapsed && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Banner */}
          <div style={{
            padding: '10px 14px',
            background: `linear-gradient(135deg, rgba(250,204,21,0.12), rgba(250,204,21,0.04))`,
            border: `1px solid rgba(250,204,21,0.15)`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              Investment-grade properties
            </span>
            {/* Currency selector */}
            <div style={{ display: 'flex', gap: 2 }}>
              {CURRENCY_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '4px 8px',
                    background: currency === c ? 'rgba(250,204,21,0.2)' : 'transparent',
                    border: `1px solid ${currency === c ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: currency === c ? 700 : 500,
                    color: currency === c ? GOLD : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    minHeight: 28,
                    minWidth: 28,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No listings yet</div>
          ) : (
            items.map((item, i) => {
              const grade = calculateInvestmentGrade ? calculateInvestmentGrade(item) : item.grade || '—'
              const price = convertFromIDR ? convertFromIDR(item.price_idr, currency) : item.price_idr
              const currencyObj = CURRENCIES?.find(c => c.code === currency)
              const symbol = currencyObj?.symbol || currency

              return (
                <div
                  key={item.id || i}
                  style={{
                    padding: '10px 12px',
                    background: GLASS_BG,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                      {item.title || 'Untitled'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {item.city || '—'}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>·</span>
                      <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>
                        {symbol}{typeof price === 'number' ? price.toLocaleString() : price}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Yield */}
                    {item.yield_pct != null && (
                      <span style={{ fontSize: 10, color: GREEN, fontWeight: 600 }}>
                        {item.yield_pct}%
                      </span>
                    )}
                    {/* Grade badge */}
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: gradeColor(grade),
                      background: `${gradeColor(grade)}18`,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {grade}
                    </span>
                  </div>
                </div>
              )
            })
          )}

          {/* Explore All */}
          {items.length > 0 && (
            <button
              onClick={onNavigate}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: `1px solid rgba(250,204,21,0.2)`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: GOLD,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Explore All
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Combined Export ── */

export default function PropertyExtras({ onNavigateWanted, onNavigateInvest }) {
  return (
    <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <WantedPropertySection onNavigate={onNavigateWanted} />
      <InternationalInvestorsSection onNavigate={onNavigateInvest} />
    </div>
  )
}
