import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Returns the count of IM OUT (active) users in the given city
 * over the last 2 hours. Refreshes every 90 seconds.
 *
 * Used by MomentumBanner: "🔥 14 people out in London right now"
 * Also available to VenueOwnerDashboard for near-venue counts.
 *
 * @param {string|null} city — profile city or venue city
 * @returns {{ count: number, loading: boolean }}
 */
export function useMomentum(city) {
  const [count,   setCount]   = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!city || !supabase) { setLoading(false); return }

    let mounted = true

    async function fetch() {
      const { data, error } = await supabase.rpc('get_city_momentum', { p_city: city })
      if (!mounted) return
      if (!error && typeof data === 'number') setCount(data)
      setLoading(false)
    }

    fetch()
    const interval = setInterval(fetch, 90_000) // refresh every 90s

    return () => { mounted = false; clearInterval(interval) }
  }, [city])

  return { count, loading }
}
