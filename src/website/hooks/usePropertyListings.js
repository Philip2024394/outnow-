/**
 * usePropertyListings — Fetch property listings from Supabase for website.
 * Falls back to DEMO_LISTINGS if Supabase unavailable.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DEMO_LISTINGS } from '@/services/rentalService'

const DEMO_PROPERTY = DEMO_LISTINGS.filter(l => l.category === 'Property' && l.images?.length > 0)

export function usePropertyListings(refreshKey = 0) {
  const [listings, setListings] = useState(DEMO_PROPERTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('rental_listings')
            .select('*')
            .eq('category', 'Property')
            .in('status', ['active', 'live', 'sold', 'rented'])
            .order('created_at', { ascending: false })
          if (!error && data?.length) {
            setListings(data)
            setLoading(false)
            return
          }
        } catch (e) { console.warn('Website listings fetch error:', e) }
      }
      // Fallback: merge demo + localStorage owner listings
      const localKeys = ['indoo_rental_listings_owner', 'indoo_my_property_listings']
      const localListings = []
      localKeys.forEach(key => { try { const d = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(d)) localListings.push(...d) } catch {} })
      const localProperty = localListings.filter(l => l.category === 'Property' && l.images?.length > 0)
      const localIds = new Set(localProperty.map(l => l.id || l.ref))
      setListings([...localProperty, ...DEMO_PROPERTY.filter(l => !localIds.has(l.id))])
      setLoading(false)
    }
    fetch()
  }, [refreshKey])

  return { listings, loading, refresh: () => {} }
}

export function useAgentListings(agentId) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      if (supabase && agentId) {
        try {
          const { data } = await supabase
            .from('rental_listings')
            .select('*')
            .eq('owner_id', agentId)
            .order('created_at', { ascending: false })
          if (data?.length) { setListings(data); setLoading(false); return }
        } catch {}
      }
      setListings(DEMO_PROPERTY.filter(l => l.owner_type === 'agent').slice(0, 8))
      setLoading(false)
    }
    fetch()
  }, [agentId])

  return { listings, loading }
}
