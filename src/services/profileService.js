import { supabase } from '@/lib/supabase'

/**
 * Save profile fields to Supabase profiles table.
 */
export async function saveProfile({ userId, displayName, age, bio, city, activities, lookingFor }) {
  if (!supabase || !userId) return
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName ?? null,
      age:          age ? parseInt(age, 10) : null,
      bio:          bio ?? null,
      city:         city ?? null,
      activities:   activities ?? [],
      looking_for:  lookingFor ?? null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

/**
 * Upload avatar file to Supabase Storage and save the public URL to profiles.
 * Returns the public URL.
 */
export async function uploadAvatar(userId, file) {
  if (!supabase || !userId || !file) return null

  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Persist URL to profiles row
  await supabase
    .from('profiles')
    .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return publicUrl
}

/**
 * Record a profile view (once per viewer per day).
 */
export async function recordProfileView(viewedUserId) {
  if (!supabase || !viewedUserId) return
  await supabase
    .from('profile_views')
    .upsert({ viewed_id: viewedUserId }, { onConflict: 'viewer_id,viewed_id,date_trunc(day, created_at)', ignoreDuplicates: true })
    .then(() => {})
}
