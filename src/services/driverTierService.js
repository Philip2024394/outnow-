/**
 * Driver Tier System — Bronze → Silver → Gold → Platinum
 * Higher tiers get: priority orders, higher bonuses, exclusive incentives.
 */
import { supabase } from '@/lib/supabase'

export const TIERS = [
  { id: 'bronze',   label: 'Bronze',   icon: '🥉', color: '#CD7F32', minTrips: 0,    minRating: 0,   bonusMultiplier: 1.0, perks: ['Basic orders'] },
  { id: 'silver',   label: 'Silver',   icon: '🥈', color: '#C0C0C0', minTrips: 50,   minRating: 4.3, bonusMultiplier: 1.15, perks: ['Priority food orders', '15% bonus boost'] },
  { id: 'gold',     label: 'Gold',     icon: '🥇', color: '#FFD700', minTrips: 200,  minRating: 4.6, bonusMultiplier: 1.3,  perks: ['Priority all orders', '30% bonus boost', 'Exclusive promos'] },
  { id: 'platinum', label: 'Platinum', icon: '💎', color: '#E5E4E2', minTrips: 500,  minRating: 4.8, bonusMultiplier: 1.5,  perks: ['First pick on all orders', '50% bonus boost', 'VIP support', 'Profile badge'] },
]

/**
 * Calculate driver's current tier based on total trips and rating.
 */
export function calculateTier(totalTrips, rating) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (totalTrips >= t.minTrips && rating >= t.minRating) tier = t
  }
  return tier
}

/**
 * Get driver's tier with progress to next level.
 */
export async function getDriverTier(driverId) {
  let totalTrips = 0
  let rating = 4.5

  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('total_trips, rating')
      .eq('id', driverId)
      .single()
    if (data) {
      totalTrips = data.total_trips ?? 0
      rating = data.rating ?? 4.5
    }
  }

  const current = calculateTier(totalTrips, rating)
  const currentIdx = TIERS.findIndex(t => t.id === current.id)
  const next = TIERS[currentIdx + 1] ?? null

  return {
    current,
    next,
    totalTrips,
    rating,
    tripsToNext: next ? Math.max(0, next.minTrips - totalTrips) : 0,
    ratingNeeded: next ? next.minRating : null,
    progress: next ? Math.min(1, totalTrips / next.minTrips) : 1,
  }
}
