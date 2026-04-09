import { supabase } from '@/lib/supabase'

export async function submitVenueSuggestion({ name, area, activityTypes, link, openTime, closeTime, offersDiscount, discountPercent, discountType, userId, displayName }) {
  if (!supabase) return { id: `demo-venue-${Date.now()}` }
  const { data, error } = await supabase
    .from('suggested_venues')
    .insert({
      name,
      area,
      activity_types:   activityTypes   ?? [],
      link:             link            ?? '',
      open_time:        openTime        ?? '',
      close_time:       closeTime       ?? '',
      offers_discount:  offersDiscount  ?? false,
      discount_percent: discountPercent ?? null,
      discount_type:    discountType    ?? null,
      discount_status:  offersDiscount ? 'offered' : null,
      submitted_by:     userId,
      submitted_by_name: displayName,
      status:           'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getSuggestedVenues() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('suggested_venues')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function approveVenueSuggestion(id) {
  if (!supabase) return
  await supabase.from('suggested_venues').update({ status: 'approved' }).eq('id', id)
}

export async function rejectVenueSuggestion(id, note = '') {
  if (!supabase) return
  await supabase.from('suggested_venues').update({ status: 'rejected', admin_note: note }).eq('id', id)
}

export async function confirmVenueDiscount(id) {
  if (!supabase) return
  await supabase.from('suggested_venues').update({ discount_status: 'confirmed' }).eq('id', id)
}

export async function declineVenueDiscount(id) {
  if (!supabase) return
  await supabase.from('suggested_venues').update({ discount_status: 'declined' }).eq('id', id)
}
