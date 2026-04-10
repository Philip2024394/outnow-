import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { startCheckout } from '@/services/checkoutService'
import styles from './VibeBlastPage.module.css'

const PRICE_DISPLAY   = 'Rp 32.000'
const MAX_CONNECTIONS = 20
const DISTANCES       = [1, 5, 10, 25, 50]

const VIBES = [
  { value: 'coffee',       emoji: '☕', label: 'Feeling like a coffee' },
  { value: 'hangout',      emoji: '👋', label: 'Who wants to hang out' },
  { value: 'drink',        emoji: '🍸', label: 'Who wants a drink' },
  { value: 'bite',         emoji: '🍜', label: 'Who wants to grab a bite' },
  { value: 'party',        emoji: '🎉', label: 'Who wants to party' },
  { value: 'music',        emoji: '🎵', label: 'Up for a music night' },
  { value: 'convo',        emoji: '🗣️', label: 'Looking for good conversation' },
  { value: 'out_tonight',  emoji: '🌙', label: 'Out tonight, looking for company' },
]

function fmtCountdown(ms) {
  if (ms <= 0) return '0m'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDaysLeft(date) {
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  return days <= 1 ? '1 day' : `${days} days`
}

export default function VibeBlastPage({ open, onClose, userId, userProfile }) {
  const [vibe,         setVibe]         = useState('coffee')
  const [lookingFor,   setLookingFor]   = useState('both')
  const [ageMin,       setAgeMin]       = useState(18)
  const [ageMax,       setAgeMax]       = useState(35)
  const [distance,     setDistance]     = useState(10)
  const [safetyPublic, setSafetyPublic] = useState(false)
  const [safetyFriend, setSafetyFriend] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [checking,     setChecking]     = useState(true)

  const [activeBlast,  setActiveBlast]  = useState(null)
  const [seenCount,    setSeenCount]    = useState(0)
  const [connectCount, setConnectCount] = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(0)
  const [nextBlastAt,  setNextBlastAt]  = useState(null)

  // ── Photo verification: admin must have set photoVerified = true ──────────
  const photoVerified = !!(userProfile?.photoVerified || userProfile?.photo_verified)
  const inCooldown    = nextBlastAt && nextBlastAt > new Date()
  const cooldownStr   = nextBlastAt ? fmtDaysLeft(nextBlastAt) : ''
  const slotsFull     = connectCount >= MAX_CONNECTIONS

  const selectedVibe  = VIBES.find(v => v.value === vibe) ?? VIBES[0]

  // ── Load status ───────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    if (!userId || !supabase) { setChecking(false); return }
    setChecking(true)
    try {
      const { data: active } = await supabase
        .from('vibe_blasts')
        .select('id, expires_at, seen_count, connections_count, looking_for_gender, looking_for_age_min, looking_for_age_max, looking_for_distance_km, vibe')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (active) {
        setActiveBlast(active)
        setSeenCount(active.seen_count ?? 0)
        setConnectCount(active.connections_count ?? 0)
        setChecking(false)
        return
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recent } = await supabase
        .from('vibe_blasts')
        .select('created_at')
        .eq('user_id', userId)
        .gt('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setNextBlastAt(recent
        ? new Date(new Date(recent.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        : null
      )
    } catch { /* non-fatal */ }
    setChecking(false)
  }, [userId])

  useEffect(() => {
    if (open) { setError(null); loadStatus() }
  }, [open, loadStatus])

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBlast) return
    const tick = () => {
      const left = new Date(activeBlast.expires_at).getTime() - Date.now()
      setTimeLeft(Math.max(0, left))
      if (left <= 0) {
        setActiveBlast(null)
        setNextBlastAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      }
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [activeBlast])

  // ── Poll live stats ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBlast || !supabase) return
    const id = setInterval(async () => {
      const { data } = await supabase
        .from('vibe_blasts')
        .select('seen_count, connections_count')
        .eq('id', activeBlast.id)
        .maybeSingle()
      if (data) {
        setSeenCount(data.seen_count ?? 0)
        setConnectCount(data.connections_count ?? 0)
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [activeBlast])

  // ── Create blast ──────────────────────────────────────────────────────────
  const createBlast = async () => {
    if (!supabase || !userId) return false
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const { data, error: err } = await supabase
      .from('vibe_blasts')
      .insert({
        user_id:                 userId,
        city:                    userProfile?.city ?? null,
        vibe:                    vibe,
        vibe_label:              selectedVibe.label,
        vibe_emoji:              selectedVibe.emoji,
        looking_for_gender:      lookingFor,
        looking_for_age_min:     ageMin,
        looking_for_age_max:     ageMax,
        looking_for_distance_km: distance,
        max_connections:         MAX_CONNECTIONS,
        connections_count:       0,
        seen_count:              0,
        expires_at:              expiresAt,
        is_active:               true,
      })
      .select()
      .single()

    if (!err && data) {
      setActiveBlast(data)
      setSeenCount(0)
      setConnectCount(0)
      setTimeLeft(3 * 60 * 60 * 1000)
      return true
    }
    return false
  }

  const handlePay = async () => {
    setError(null)
    setLoading(true)
    try {
      await startCheckout('vibe_blast', 'payment', userId)
    } catch (e) {
      if (e.message?.includes('not configured') || e.message?.includes('demo') || !supabase) {
        const ok = await createBlast()
        if (!ok) setError('Could not start blast. Please try again.')
      } else {
        setError(e.message ?? 'Payment failed — please try again.')
      }
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (!activeBlast || !supabase) return
    await supabase.from('vibe_blasts').update({ is_active: false }).eq('id', activeBlast.id)
    setActiveBlast(null)
    setNextBlastAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    setTimeLeft(0)
  }

  const canSubmit = photoVerified && safetyPublic && safetyFriend && !inCooldown && !activeBlast && !loading

  if (!open) return null

  return (
    <div className={styles.page}>

      {/* ── Header — no bottom line ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.bolt}>⚡</span>
          Vibe Blasting
        </div>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>

        {/* ── Price line ── */}
        <div className={styles.priceLine}>
          <span className={styles.priceAmount}>{PRICE_DISPLAY}</span>
          <span className={styles.priceDot}>·</span>
          <span className={styles.priceMeta}>3 hrs</span>
          <span className={styles.priceDot}>·</span>
          <span className={`${styles.priceMeta} ${styles.priceWeekly}`}>1× per week</span>
          <span className={styles.priceDot}>·</span>
          <span className={styles.priceMeta}>Max {MAX_CONNECTIONS} connects</span>
        </div>

        <div className={styles.divider} />

        {/* ── Checking ── */}
        {checking && <div className={styles.checking}>Checking status…</div>}

        {/* ── ACTIVE BLAST ── */}
        {!checking && activeBlast && (
          <>
            <div className={styles.liveRow}>
              <div className={styles.liveDot} />
              <span className={styles.liveLabel}>Your blast is live</span>
              <span className={styles.liveTimer}>{fmtCountdown(timeLeft)} left</span>
            </div>

            <div className={styles.liveStats}>
              <div className={styles.liveStat}>
                <span className={styles.liveStatNum}>{seenCount}</span>
                <span className={styles.liveStatLabel}>seen by</span>
              </div>
              <div className={styles.liveStatDiv} />
              <div className={styles.liveStat}>
                <span className={styles.liveStatNum}>{connectCount} / {MAX_CONNECTIONS}</span>
                <span className={styles.liveStatLabel}>connected</span>
              </div>
              <div className={styles.liveStatDiv} />
              <div className={styles.liveStat}>
                <span className={styles.liveStatNum}>{MAX_CONNECTIONS - connectCount}</span>
                <span className={styles.liveStatLabel}>slots left</span>
              </div>
            </div>

            {slotsFull && (
              <div className={styles.fullNotice}>All 20 slots filled — blast stopped early</div>
            )}

            <div className={styles.liveTarget}>
              {activeBlast.vibe_emoji} {activeBlast.vibe_label} · {activeBlast.looking_for_gender === 'both' ? 'Everyone' : activeBlast.looking_for_gender === 'male' ? 'Men' : 'Women'} · age {activeBlast.looking_for_age_min}–{activeBlast.looking_for_age_max} · {activeBlast.looking_for_distance_km} km
            </div>

            <div className={styles.divider} />
            <button className={styles.cancelBtn} onClick={handleCancel}>Cancel blast — no refund</button>
            <div className={styles.divider} />
          </>
        )}

        {/* ── COOLDOWN ── */}
        {!checking && inCooldown && !activeBlast && (
          <>
            <div className={styles.cooldownRow}>
              <span className={styles.cooldownIcon}>📅</span>
              <div>
                <div className={styles.cooldownTitle}>Next blast in {cooldownStr}</div>
                <div className={styles.cooldownSub}>Limited to once per week — keeps blasts meaningful</div>
              </div>
            </div>
            <div className={styles.divider} />
          </>
        )}

        {/* ── PHOTO NOT VERIFIED ── */}
        {!photoVerified && (
          <>
            <div className={styles.verifyRow}>
              <span className={styles.verifyIcon}>🔒</span>
              <div>
                <div className={styles.verifyTitle}>Admin-verified photo required</div>
                <div className={styles.verifySub}>Your profile photo must be verified by our team before you can Vibe Blast. This prevents marketing abuse and keeps the community genuine. Go to your profile to request verification.</div>
              </div>
            </div>
            <div className={styles.divider} />
          </>
        )}

        {/* ── FORM (hidden while blast is active) ── */}
        {!checking && !activeBlast && (
          <>
            {/* My vibe */}
            <div className={styles.formSection}>
              <span className={styles.formLabel}>MY VIBE RIGHT NOW</span>
              <div className={styles.selectWrap}>
                <select
                  className={styles.vibeSelect}
                  value={vibe}
                  onChange={e => setVibe(e.target.value)}
                >
                  {VIBES.map(v => (
                    <option key={v.value} value={v.value}>
                      {v.emoji}  {v.label}
                    </option>
                  ))}
                </select>
                <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Audience */}
            <div className={styles.formSection}>
              <span className={styles.formLabel}>AUDIENCE</span>

              <div className={styles.formRow}>
                <span className={styles.rowLabel}>Looking for</span>
                <div className={styles.segmented}>
                  {[['male','Men'], ['female','Women'], ['both','Everyone']].map(([v, l]) => (
                    <button
                      key={v}
                      className={`${styles.seg} ${lookingFor === v ? styles.segActive : ''}`}
                      onClick={() => setLookingFor(v)}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.rowLabel}>Age range</span>
                <span className={styles.rowValue}>{ageMin} – {ageMax}</span>
              </div>
              <div className={styles.dualRange}>
                <div className={styles.rangeItem}>
                  <span className={styles.rangeTag}>Min</span>
                  <input type="range" min={18} max={60} value={ageMin} className={styles.range}
                    onChange={e => setAgeMin(Math.min(Number(e.target.value), ageMax - 1))} />
                </div>
                <div className={styles.rangeItem}>
                  <span className={styles.rangeTag}>Max</span>
                  <input type="range" min={19} max={99} value={ageMax} className={styles.range}
                    onChange={e => setAgeMax(Math.max(Number(e.target.value), ageMin + 1))} />
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.rowLabel}>Distance</span>
                <div className={styles.distPills}>
                  {DISTANCES.map(d => (
                    <button key={d}
                      className={`${styles.distPill} ${distance === d ? styles.distPillActive : ''}`}
                      onClick={() => setDistance(d)}
                    >{d} km</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Safety */}
            <div className={styles.formSection}>
              <span className={styles.formLabel}>SAFETY — BOTH REQUIRED</span>

              <button
                className={`${styles.safeRow} ${safetyPublic ? styles.safeRowOn : ''}`}
                onClick={() => setSafetyPublic(v => !v)}
              >
                <div className={`${styles.tick} ${safetyPublic ? styles.tickOn : ''}`}>
                  {safetyPublic && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div className={styles.safeTitle}>I will meet in a public place</div>
                  <div className={styles.safeSub}>Coffee shop, restaurant or another safe venue</div>
                </div>
              </button>

              <button
                className={`${styles.safeRow} ${safetyFriend ? styles.safeRowOn : ''}`}
                onClick={() => setSafetyFriend(v => !v)}
              >
                <div className={`${styles.tick} ${safetyFriend ? styles.tickOn : ''}`}>
                  {safetyFriend && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div className={styles.safeTitle}>I have notified a friend or family member</div>
                  <div className={styles.safeSub}>Let someone know where you're going</div>
                </div>
              </button>
            </div>

            <div className={styles.divider} />

            {/* Pay */}
            <div className={styles.paySection}>
              <div className={styles.blastPreview}>
                {selectedVibe.emoji} {selectedVibe.label} · {lookingFor === 'both' ? 'Everyone' : lookingFor === 'male' ? 'Men' : 'Women'} · age {ageMin}–{ageMax} · {distance} km · {userProfile?.city ?? 'your city'}
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <button className={styles.payBtn} disabled={!canSubmit} onClick={handlePay}>
                {loading ? 'Starting payment…' : <><span className={styles.payBolt}>⚡</span> Pay {PRICE_DISPLAY} &amp; Blast</>}
              </button>

              <div className={styles.payMeta}>
                {!photoVerified
                  ? 'Verified profile photo required to blast'
                  : !safetyPublic || !safetyFriend
                  ? 'Complete both safety confirmations above'
                  : inCooldown
                  ? `Next blast available in ${cooldownStr}`
                  : `Max ${MAX_CONNECTIONS} connections · Stops when full · No refund on cancel`
                }
              </div>
            </div>

            <div className={styles.divider} />
          </>
        )}

        {/* ── How it works ── */}
        <div className={styles.howSection}>
          <span className={styles.formLabel}>HOW IT WORKS</span>
          {[
            `Pay ${PRICE_DISPLAY} — your profile broadcasts for 3 hours`,
            'Matching users in your city see your blast in their notifications',
            'They can view your profile and send you a Connect request',
            `First ${MAX_CONNECTIONS} connections accepted — blast stops when full`,
            'After 3 hours the blast expires — 1 blast per week maximum',
          ].map((step, i) => (
            <div key={i} className={styles.howRow}>
              <span className={styles.howNum}>{i + 1}</span>
              <span className={styles.howText}>{step}</span>
            </div>
          ))}
        </div>

        <div className={styles.bottomPad} />
      </div>
    </div>
  )
}
