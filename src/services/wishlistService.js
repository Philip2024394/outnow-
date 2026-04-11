/**
 * wishlistService.js
 * Profile wishlist — up to 5 items per type pinned to a dating profile.
 * item_type: 'product' (marketplace gifts) | 'food' (dish cravings)
 * Anyone can view a profile's wishlist and send any item as an anonymous gift.
 */
import { supabase } from '@/lib/supabase'

const DEMO_WISHLIST = []

// ── Add ───────────────────────────────────────────────────────────────────────

/**
 * Add a product/dish to the signed-in user's wishlist.
 * itemType: 'product' | 'food'
 * Returns { ok, msg } — msg is 'added' | 'already_added' | 'limit_reached' | error string
 */
export async function addToWishlist(product, seller, itemType = 'product') {
  if (!supabase) return { ok: true, msg: 'added' }

  const { data, error } = await supabase.rpc('add_to_wishlist', {
    p_product_id:       String(product.id),
    p_seller_id:        seller.id,
    p_product_name:     product.name,
    p_product_price:    Number(product.price),
    p_product_currency: product.currency ?? 'IDR',
    p_product_image:    product.image ?? product.image_url ?? null,
    p_seller_name:      seller.brandName ?? seller.displayName ?? null,
    p_item_type:        itemType,
  })

  if (error) return { ok: false, msg: error.message }
  return data  // { ok, msg }
}

// ── Remove ────────────────────────────────────────────────────────────────────

export async function removeFromWishlist(userId, productId, itemType = 'product') {
  if (!supabase) return { error: null }
  const { error } = await supabase
    .from('profile_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', String(productId))
    .eq('item_type', itemType)
  return { error: error?.message ?? null }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** Fetch the signed-in user's own wishlist for a given type. */
export async function getMyWishlist(userId, itemType = 'product') {
  if (!supabase) return DEMO_WISHLIST
  const { data } = await supabase
    .from('profile_wishlists')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .order('added_at', { ascending: false })
  return data ?? []
}

/** Fetch any user's public wishlist for a given type (for buyers viewing a profile). */
export async function getProfileWishlist(userId, itemType = 'product') {
  if (!supabase) return DEMO_WISHLIST
  const { data } = await supabase
    .from('profile_wishlists')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .order('added_at', { ascending: true })
  return data ?? []
}

/** Check if a specific product is already in the user's wishlist for a given type. */
export async function isInWishlist(userId, productId, itemType = 'product') {
  if (!supabase) return false
  const { data } = await supabase
    .from('profile_wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', String(productId))
    .eq('item_type', itemType)
    .maybeSingle()
  return !!data
}
