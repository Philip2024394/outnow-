import { supabase } from '@/lib/supabase'

/**
 * No-op: Supabase phone auth doesn't require reCAPTCHA.
 * Kept so PhoneAuthScreen doesn't need to change its setup call.
 */
export function setupRecaptcha() {}

/**
 * Sign in with Google via Supabase OAuth.
 */
export async function signInWithGoogle() {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
}

/**
 * Sign in with email + password via Supabase Auth.
 */
export async function signInWithEmail(email, password) {
  if (!supabase) return
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

/**
 * Create a new account with email + password via Supabase Auth.
 */
export async function signUpWithEmail(email, password) {
  if (!supabase) return
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

/**
 * Send an SMS OTP to the given phone number via Supabase Auth.
 * Returns a "confirmation" object { phone } used by verifyOTP.
 */
export async function sendPhoneOTP(phone) {
  if (!supabase) {
    // Demo mode — pretend we sent an OTP
    return { phone }
  }
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw new Error(error.message)
  return { phone }
}

/**
 * Verify the OTP code entered by the user.
 * `confirmation` is the object returned by sendPhoneOTP.
 */
export async function verifyOTP(confirmation, code) {
  if (!supabase) return null  // demo mode — AuthContext handles fake user
  const { data, error } = await supabase.auth.verifyOtp({
    phone: confirmation.phone,
    token: code,
    type: 'sms',
  })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}
