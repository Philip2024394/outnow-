import { supabase } from '@/lib/supabase'

/**
 * Save profile fields to Supabase profiles table.
 */
export async function saveProfile({
  userId, displayName, dob, bio, city, country, activities, lookingFor, extraPhotos,
  speakingNative, speakingSecond,
  priceMin, priceMax, brandName, tradeRole, market,
  relationshipGoal, starSign, height,
  photoOffsetX, photoOffsetY, photoZoom,
  tags,
  instagramHandle, tiktokHandle, facebookHandle, websiteUrl, youtubeHandle,
}) {
  if (!supabase || !userId) return

  // Calculate age from dob string "YYYY-MM-DD"
  let age = null
  if (dob) {
    const birth = new Date(dob)
    const today = new Date()
    age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name:      displayName ?? null,
      dob:               dob ?? null,
      age:               age,
      bio:               bio ?? null,
      city:              city ?? null,
      country:           country ?? null,
      activities:        activities ?? [],
      looking_for:       lookingFor ?? null,
      extra_photos:      (extraPhotos ?? []).filter(Boolean),
      speaking_native:   speakingNative ?? null,
      speaking_second:   speakingSecond ?? null,
      price_min:         priceMin || null,
      price_max:         priceMax || null,
      brand_name:        brandName || null,
      trade_role:        tradeRole || null,
      market:            market || null,
      relationship_goal: relationshipGoal || null,
      star_sign:         starSign || null,
      height:            height || null,
      photo_offset_x:    photoOffsetX ?? 50,
      photo_offset_y:    photoOffsetY ?? 50,
      photo_zoom:        photoZoom ?? 1,
      tags:              (tags ?? []).filter(Boolean).slice(0, 10),
      instagram_handle:  instagramHandle || null,
      tiktok_handle:     tiktokHandle || null,
      facebook_handle:   facebookHandle || null,
      website_url:       websiteUrl || null,
      youtube_handle:    youtubeHandle || null,
      updated_at:        new Date().toISOString(),
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
 * Upload one of the 4 gallery (extra) photos to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadGalleryPhoto(userId, file, index) {
  if (!supabase || !userId || !file) return null

  const ext  = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/gallery_${index}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

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
