import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client — null when env vars are absent (demo/dev mode).
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

/**
 * Map a Supabase auth user to a shape compatible with the rest of the app.
 * Firebase used user.uid; Supabase uses user.id — we expose both.
 */
export function mapAuthUser(supabaseUser) {
  if (!supabaseUser) return null
  return {
    ...supabaseUser,
    uid: supabaseUser.id,                          // backward compat
    displayName: supabaseUser.phone ?? supabaseUser.email ?? 'User',
    photoURL: null,
    phoneNumber: supabaseUser.phone ?? null,
  }
}
