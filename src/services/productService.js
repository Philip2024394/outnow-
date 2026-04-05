import { supabase } from '@/lib/supabase'

const BUCKET = 'product-images'
const PREMIUM_LIMIT = 6

/**
 * Fetch active products for a given user (public view).
 */
export async function getProducts(userId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, currency, image_url, description, order_index')
    .eq('user_id', userId)
    .eq('active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Fetch all products for owner (includes inactive).
 */
export async function getMyProducts(userId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Add a product. Enforces PREMIUM_LIMIT for non-business tiers.
 */
export async function addProduct({ userId, tier, name, price, currency = 'GBP', imageUrl, description }) {
  if (tier !== 'business') {
    const existing = await getMyProducts(userId)
    if (existing.length >= PREMIUM_LIMIT) {
      throw new Error(`Premium shops are limited to ${PREMIUM_LIMIT} products. Upgrade to Business for unlimited listings.`)
    }
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      name: name.trim(),
      price: parseFloat(price),
      currency,
      image_url: imageUrl ?? null,
      description: description?.trim() ?? null,
      order_index: 0,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Update an existing product.
 */
export async function updateProduct(productId, { name, price, currency, imageUrl, description, active, orderIndex }) {
  const patch = {}
  if (name       !== undefined) patch.name        = name.trim()
  if (price      !== undefined) patch.price       = parseFloat(price)
  if (currency   !== undefined) patch.currency    = currency
  if (imageUrl   !== undefined) patch.image_url   = imageUrl
  if (description !== undefined) patch.description = description?.trim() ?? null
  if (active     !== undefined) patch.active      = active
  if (orderIndex !== undefined) patch.order_index = orderIndex

  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId)
  if (error) throw new Error(error.message)
}

/**
 * Delete a product and its storage image.
 */
export async function deleteProduct(productId, imageUrl) {
  if (imageUrl) {
    // Extract storage path from public URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKET}/`)
    if (pathParts.length > 1) {
      await supabase.storage.from(BUCKET).remove([pathParts[1]])
    }
  }
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw new Error(error.message)
}

/**
 * Upload a product image and return the public URL.
 * Path: product-images/{userId}/{productId}.{ext}
 */
export async function uploadProductImage(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif']
  if (!allowed.includes(ext)) throw new Error('Only JPG, PNG, WEBP or AVIF images are allowed.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.')

  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
