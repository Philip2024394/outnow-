import {
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth } from '@/firebase/config'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return result.user
}

let recaptchaVerifier = null

export function setupRecaptcha(containerId) {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
  })
  return recaptchaVerifier
}

export async function sendPhoneOTP(phoneNumber) {
  if (!recaptchaVerifier) {
    throw new Error('Recaptcha not set up. Call setupRecaptcha first.')
  }
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
  return confirmationResult
}

export async function verifyOTP(confirmationResult, code) {
  const result = await confirmationResult.confirm(code)
  return result.user
}

export async function signOut() {
  await fbSignOut(auth)
}
