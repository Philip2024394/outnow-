import { supabase } from '@/lib/supabase'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function sendOtwRequest(sessionId, toUserId) {
  if (!supabase) {
    await delay(600)
    return { requestId: `demo-otw-${Date.now()}`, sessionId, toUserId }
  }
  const { data, error } = await supabase
    .from('otw_requests')
    .insert({ session_id: sessionId, to_user_id: toUserId, status: 'pending' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return { requestId: data.id, sessionId, toUserId }
}

export async function respondToOtw(requestId, accept) {
  if (!supabase) { await delay(400); return { status: accept ? 'accepted' : 'declined' } }
  const status = accept ? 'accepted' : 'declined'
  const { error } = await supabase
    .from('otw_requests')
    .update({ status })
    .eq('id', requestId)
  if (error) throw new Error(error.message)
  return { status }
}

export async function markOtwProceeding(requestId, etaMinutes) {
  if (!supabase) { await delay(400); return { success: true, etaMinutes } }
  const { error } = await supabase
    .from('otw_requests')
    .update({ status: 'proceeding', eta_minutes: etaMinutes })
    .eq('id', requestId)
  if (error) throw new Error(error.message)
  return { success: true, etaMinutes }
}

export async function cancelOtw(requestId) {
  if (!supabase) { await delay(300); return }
  await supabase.from('otw_requests').update({ status: 'cancelled' }).eq('id', requestId)
}

export async function expressInterest(toUserId, sessionId, gift = null, message = '') {
  if (!supabase) { await delay(400); return }
  const { error } = await supabase.from('interests').upsert({
    to_user_id: toUserId,
    session_id: sessionId,
    status: 'pending',
    gift,
    message,
  }, { onConflict: 'from_user_id,session_id' })
  if (error) throw new Error(error.message)
}

export async function withdrawInterest(interestId) {
  if (!supabase) return
  await supabase.from('interests').delete().eq('id', interestId)
}

export async function sendWave(toUserId, sessionId) {
  if (!supabase) { await delay(400); return }
  const { error } = await supabase.from('waves').insert({ to_user_id: toUserId, session_id: sessionId })
  if (error) throw new Error(error.message)
}
