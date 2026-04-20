import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchActiveDeals, claimDeal as claimDealService } from '@/services/dealService'

// ─────────────────────────────────────────────────────────────────────────────
// Deal Hunt — hooks
// ─────────────────────────────────────────────────────────────────────────────

// ── useDeals — fetch & filter active deals ──────────────────────────────────

export function useDeals({ domain, sort } = {}) {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchActiveDeals({ domain, sort })
      setDeals(data)
    } catch {
      setDeals([])
    } finally {
      setLoading(false)
    }
  }, [domain, sort])

  useEffect(() => { load() }, [load])

  return { deals, loading, refresh: load }
}

// ── useCountdown — live countdown to endTime ────────────────────────────────

export function useCountdown(endTime) {
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const diff = Math.max(0, new Date(endTime).getTime() - now)
  const isExpired = diff <= 0
  const totalSec = Math.floor(diff / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  const pad = n => String(n).padStart(2, '0')
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return { hours, minutes, seconds, isExpired, formatted }
}

// ── useClaimDeal — claim action with loading/error state ────────────────────

export function useClaimDeal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const claim = useCallback(async (dealId, buyerId) => {
    setLoading(true)
    setError(null)
    try {
      const result = await claimDealService(dealId, buyerId)
      if (result.error) {
        setError(result.error)
        return null
      }
      return result.claim
    } catch (e) {
      setError(e.message || 'Gagal klaim deal')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { claim, loading, error }
}
