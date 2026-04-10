import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './GlobalSearchSuggest.module.css'

// ─── Category config ──────────────────────────────────────────────────────────
const CAT = {
  food:     { label: 'Street Food',  emoji: '🍜', color: '#F97316' },
  ride:     { label: 'Ride / Bike',  emoji: '🚴', color: '#8DC63F' },
  taxi:     { label: 'Taxi / Car',   emoji: '🚗', color: '#F59E0B' },
  dating:   { label: 'Dating',       emoji: '💕', color: '#EC4899' },
  shopping: { label: 'Market',       emoji: '🛍️', color: '#A78BFA' },
  massage:  { label: 'Massage',      emoji: '💆', color: '#34D399' },
  people:   { label: 'People',       emoji: '👤', color: '#94A3B8' },
}

// Keywords that trigger a section shortcut at the top of the list
const SHORTCUTS = [
  { keywords: ['food','eat','street','resto','restau','nasi','makan','sate','warung'],  cat: 'food',     label: 'Browse Street Food' },
  { keywords: ['ride','bike','bicycle','ojek','sepeda'],                                cat: 'ride',     label: 'Book a Bike Ride' },
  { keywords: ['taxi','car','grab','mobil','gojek','driver'],                           cat: 'taxi',     label: 'Book a Taxi / Car' },
  { keywords: ['date','dating','meet','love','partner','jodoh'],                        cat: 'dating',   label: 'Browse Dating' },
  { keywords: ['shop','market','buy','sell','product','belanja','toko','beli'],         cat: 'shopping', label: 'Browse Marketplace' },
  { keywords: ['massage','spa','pijat','relaxation','therapist'],                       cat: 'massage',  label: 'Browse Massage' },
]

function getShortcut(q) {
  const lq = q.toLowerCase()
  return SHORTCUTS.find(s => s.keywords.some(k => lq.includes(k))) ?? null
}

// ─── Session category detection ───────────────────────────────────────────────
function sessionCat(s) {
  const at = s.activity_type ?? s.activityType ?? ''
  if (at === 'food' || at.includes('food'))                    return 'food'
  if (at === 'bike_ride')                                      return 'ride'
  if (at === 'car_taxi')                                       return 'taxi'
  if (at === 'massage')                                        return 'massage'
  if (at === 'shopping' || s.brand_name || s.brandName)       return 'shopping'
  if (at === 'dating' || s.looking_for || s.lookingFor)       return 'dating'
  return 'people'
}

// ─── Seller category from profile ─────────────────────────────────────────────
function sellerCat(p) {
  const st = (p.seller_type ?? '').toLowerCase()
  if (st.includes('food') || st.includes('restaurant') || st.includes('cafe')) return 'food'
  if (st.includes('massage') || st.includes('spa'))                             return 'massage'
  return 'shopping'
}

// ─── Format price ─────────────────────────────────────────────────────────────
function fmtPrice(price, currency = 'IDR') {
  if (!price) return ''
  if (currency === 'IDR') return `Rp ${(price / 1000).toFixed(0)}k`
  return `$${price}`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GlobalSearchSuggest({ query, sessions = [], onNavigate, onClose }) {
  const [dbResults, setDbResults] = useState({ sellers: [], products: [] })
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  const q = query.trim()
  const lq = q.toLowerCase()

  // ── Supabase search (debounced) ────────────────────────────────────────────
  const runDbSearch = useCallback(async (term) => {
    if (!supabase || !term) { setDbResults({ sellers: [], products: [] }); return }
    setLoading(true)
    const like = `%${term}%`

    const [sellersRes, productsRes] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('id, display_name, brand_name, photo_url, city, country, seller_type, seller_plan')
        .not('brand_name', 'is', null)
        .or(`brand_name.ilike.${like},display_name.ilike.${like},city.ilike.${like}`)
        .limit(20),
      supabase
        .from('products')
        .select('id, name, price, currency, image_url, user_id, profiles(display_name, brand_name, city)')
        .eq('active', true)
        .ilike('name', like)
        .limit(15),
    ])

    setDbResults({
      sellers:  sellersRes.status  === 'fulfilled' ? (sellersRes.value.data  ?? []) : [],
      products: productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : [],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (q.length < 2) { setDbResults({ sellers: [], products: [] }); setLoading(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runDbSearch(lq), 280)
    return () => clearTimeout(debounceRef.current)
  }, [q]) // eslint-disable-line

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose?.()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  if (q.length < 2) return null

  // ── Local session filter ───────────────────────────────────────────────────
  const localSessions = sessions.filter(s =>
    s.displayName?.toLowerCase().includes(lq) ||
    s.brandName?.toLowerCase().includes(lq) ||
    s.area?.toLowerCase().includes(lq) ||
    s.city?.toLowerCase().includes(lq) ||
    s.lookingFor?.toLowerCase().includes(lq) ||
    (s.activityType ?? '').includes(lq)
  ).slice(0, 6)

  // ── Map DB sellers → result rows ───────────────────────────────────────────
  const sellerRows = dbResults.sellers.map(p => ({
    _type: 'seller',
    id:    p.id,
    cat:   sellerCat(p),
    name:  p.brand_name ?? p.display_name,
    sub:   [p.display_name !== p.brand_name ? `by ${p.display_name}` : '', p.city].filter(Boolean).join(' · '),
    photo: p.photo_url,
    raw:   p,
  }))

  // ── Map DB products → result rows ──────────────────────────────────────────
  const productRows = dbResults.products.map(p => ({
    _type:  'product',
    id:     p.id,
    cat:    'shopping',
    name:   p.name,
    sub:    [fmtPrice(p.price, p.currency), p.profiles?.brand_name ?? p.profiles?.display_name].filter(Boolean).join(' · '),
    photo:  p.image_url,
    userId: p.user_id,
    raw:    p,
  }))

  // ── Map session → result rows ──────────────────────────────────────────────
  const sessionRows = localSessions.map(s => ({
    _type: 'session',
    id:    s.id,
    cat:   sessionCat(s),
    name:  s.brandName ?? s.displayName ?? 'Someone',
    sub:   [s.age ? `Age ${s.age}` : '', s.area ?? s.city].filter(Boolean).join(' · '),
    photo: s.photoURL,
    raw:   s,
  }))

  // ── Deduplicate by id ──────────────────────────────────────────────────────
  const seen = new Set()
  const allRows = [...sessionRows, ...sellerRows, ...productRows].filter(r => {
    if (seen.has(`${r._type}-${r.id}`)) return false
    seen.add(`${r._type}-${r.id}`)
    return true
  })

  // ── Section shortcut (quick-nav) ───────────────────────────────────────────
  const shortcut = getShortcut(q)

  // ── Group results by category ──────────────────────────────────────────────
  const grouped = {}
  allRows.forEach(r => {
    if (!grouped[r.cat]) grouped[r.cat] = []
    grouped[r.cat].push(r)
  })

  const noResults = allRows.length === 0 && !loading && !shortcut

  return (
    <div ref={containerRef} className={styles.wrap}>
      {/* Shortcut quick-nav */}
      {shortcut && (
        <button
          className={styles.shortcut}
          onClick={() => { onNavigate(shortcut.cat, null); onClose?.() }}
        >
          <span className={styles.shortcutEmoji}>{CAT[shortcut.cat].emoji}</span>
          <span className={styles.shortcutLabel}>{shortcut.label}</span>
          <svg className={styles.shortcutArrow} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {loading && allRows.length === 0 && (
        <div className={styles.loadingRow}>
          <span className={styles.loadingDot} /><span className={styles.loadingDot} /><span className={styles.loadingDot} />
        </div>
      )}

      {noResults && (
        <div className={styles.empty}>No results for "<strong>{q}</strong>"</div>
      )}

      {/* Grouped results */}
      {Object.entries(grouped).map(([cat, rows]) => {
        const meta = CAT[cat] ?? CAT.people
        return (
          <div key={cat} className={styles.group}>
            <div className={styles.groupHeader} style={{ color: meta.color }}>
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </div>
            {rows.slice(0, 4).map(r => (
              <ResultRow
                key={`${r._type}-${r.id}`}
                row={r}
                meta={meta}
                onSelect={() => { onNavigate(r._type === 'product' ? 'product' : cat, r.raw, r._type); onClose?.() }}
              />
            ))}
            {rows.length > 4 && (
              <button className={styles.seeAll} onClick={() => { onNavigate(cat, null); onClose?.() }}>
                See all {rows.length} {meta.label} results →
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ResultRow({ row, meta, onSelect }) {
  const initial = (row.name ?? '?')[0].toUpperCase()
  return (
    <button className={styles.row} onClick={onSelect}>
      <span className={styles.avatar} style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44` }}>
        {row.photo
          ? <img src={row.photo} alt="" className={styles.avatarImg} />
          : <span className={styles.avatarInitial} style={{ color: meta.color }}>{initial}</span>
        }
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{row.name}</span>
        {row.sub && <span className={styles.sub}>{row.sub}</span>}
      </span>
      <span className={styles.chip} style={{ background: `${meta.color}22`, color: meta.color }}>
        {meta.emoji}
      </span>
    </button>
  )
}
