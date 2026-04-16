/**
 * therapistCardHelpers.js — Utility functions for TherapistCard.
 * Converted from therapistCardHelpers.ts — TypeScript removed, logic identical.
 * Every function preserved exactly.
 */
import { AvailabilityStatus } from '../constants/types'

/** Map language name to flag emoji for therapist/place cards. */
export const LANGUAGE_FLAG_MAP = {
  english: '🇬🇧', en: '🇬🇧',
  indonesian: '🇮🇩', id: '🇮🇩', 'bahasa indonesia': '🇮🇩',
  mandarin: '🇨🇳', chinese: '🇨🇳', zh: '🇨🇳',
  japanese: '🇯🇵', ja: '🇯🇵',
  korean: '🇰🇷', ko: '🇰🇷',
  thai: '🇹🇭', th: '🇹🇭',
  vietnamese: '🇻🇳', vi: '🇻🇳',
  spanish: '🇪🇸', es: '🇪🇸',
  french: '🇫🇷', fr: '🇫🇷',
  german: '🇩🇪', de: '🇩🇪',
  portuguese: '🇵🇹', pt: '🇵🇹',
  italian: '🇮🇹', it: '🇮🇹',
  russian: '🇷🇺', ru: '🇷🇺',
  arabic: '🇸🇦', ar: '🇸🇦',
  dutch: '🇳🇱', nl: '🇳🇱',
  hindi: '🇮🇳', hi: '🇮🇳',
  malay: '🇲🇾', ms: '🇲🇾',
  javanese: '🇮🇩', jv: '🇮🇩',
}

export function getLanguageFlag(lang) {
  if (!lang || typeof lang !== 'string') return '🌐'
  const key = lang.trim().toLowerCase()
  return LANGUAGE_FLAG_MAP[key] || '🌐'
}

/**
 * Parse therapist languages from API (array, JSON string, or comma-separated string).
 */
export function parseTherapistLanguages(therapist) {
  const raw = therapist?.languagesSpoken ?? therapist?.languages
  if (Array.isArray(raw) && raw.length > 0) return raw.map(l => String(l).trim()).filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(l => String(l).trim()).filter(Boolean)
    } catch {
      return raw.split(',').map(l => l.trim()).filter(Boolean)
    }
  }
  return []
}

/**
 * Therapist display name: only the first word (until first space).
 * "Philip francis o farrell" displays as "Philip".
 */
export function getTherapistDisplayName(name) {
  if (name == null || typeof name !== 'string') return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const firstWord = trimmed.split(/\s+/)[0]
  return firstWord || trimmed
}

/**
 * Utility function to determine display status
 */
export const getDisplayStatus = (therapist) => {
  // Check if therapist has a busyUntil timestamp and is still busy
  if (therapist.busyUntil) {
    const busyUntil = new Date(therapist.busyUntil)
    if (!isNaN(busyUntil.getTime()) && busyUntil > new Date()) {
      return AvailabilityStatus.Busy
    }
  }

  // Legacy: bookedUntil
  try {
    const bookedUntil = therapist?.bookedUntil
    if (bookedUntil) {
      const until = new Date(bookedUntil)
      if (!isNaN(until.getTime()) && until > new Date()) {
        return AvailabilityStatus.Busy
      }
    }
  } catch { /* ignore */ }

  const currentStatus = therapist?.availability || therapist.status || AvailabilityStatus.Available

  // Show all offline therapists as "Busy" to customers
  if (currentStatus === AvailabilityStatus.Offline || String(currentStatus).toLowerCase() === 'offline') {
    return AvailabilityStatus.Busy
  }

  return currentStatus
}

/**
 * Check if discount is currently active
 */
export const isDiscountActive = (therapist) => {
  const hasDiscountData = !!(
    therapist.discountPercentage &&
    therapist.discountPercentage > 0 &&
    therapist.discountEndTime &&
    therapist.isDiscountActive === true
  )
  if (!hasDiscountData) return false
  const now = new Date()
  const endTime = therapist.discountEndTime ? new Date(therapist.discountEndTime) : null
  const notExpired = endTime && !isNaN(endTime.getTime()) && endTime > now
  return Boolean(hasDiscountData && notExpired)
}

/**
 * Get translated description based on current language
 */
export const getTranslatedDescription = (therapist, language) => {
  const fallbackDesc = `Certified massage therapist with ${
    therapist.yearsOfExperience || 5
  }+ years experience. Specialized in therapeutic and relaxation techniques. Available for home, hotel, and villa services.`
  if (language === 'id') {
    return therapist.description_id || therapist.description || fallbackDesc
  }
  return therapist.description_en || therapist.description || fallbackDesc
}

/**
 * Format price with Indonesian locale
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID').format(price)
}

/**
 * Get location city from full location string
 */
export const getLocationCity = (location) => {
  if (!location) return ''
  return String(location).split(',')[0].trim()
}

/**
 * Get joined date display
 */
export const getJoinedDateDisplay = (therapist) => {
  const joinedDateRaw = therapist.membershipStartDate || therapist.activeMembershipDate || therapist?.$createdAt
  if (!joinedDateRaw) return '—'
  try {
    const d = new Date(joinedDateRaw)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-GB')
  } catch {
    return '—'
  }
}

/**
 * Calculate dynamic spacing based on description length
 */
export const getDynamicSpacing = (descriptionLength, longSpacing, mediumSpacing, shortSpacing) => {
  if (descriptionLength < 200) return shortSpacing
  if (descriptionLength < 300) return mediumSpacing
  return longSpacing
}

/**
 * Format countdown timer
 */
export const formatCountdown = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Normalize service/massage name from menu item.
 */
export const getMenuItemDisplayName = (item) => {
  const raw = (item?.name ?? item?.serviceName ?? item?.title ?? '').toString().trim()
  return raw || 'Traditional Massage'
}

/**
 * Deduplicate menu items by display name. Keeps the cheapest per name.
 */
export const getUniqueMenuItemsByName = (menuData) => {
  if (!menuData?.length) return []
  const byName = new Map()
  for (const item of menuData) {
    const name = getMenuItemDisplayName(item)
    const price60 = parseFloat(item?.price60) ?? 999999
    const existing = byName.get(name)
    const existingPrice = existing != null ? parseFloat(existing?.price60) ?? 999999 : 999999
    if (existing == null || price60 < existingPrice) {
      byName.set(name, {
        ...item,
        name,
        serviceName: item?.serviceName ?? item?.name ?? item?.title ?? name,
      })
    }
  }
  return Array.from(byName.values())
}

/**
 * Deduplicate massage type strings.
 */
export const getUniqueMassageTypes = (types) => {
  if (!Array.isArray(types) || types.length === 0) return []
  const seen = new Set()
  return types.filter(t => {
    const n = String(t ?? '').trim()
    if (!n || seen.has(n)) return false
    seen.add(n)
    return true
  })
}

/** Sum of 60+90+120 for finding lowest-total service. */
function totalPrice(item) {
  const p60 = parseFloat(item?.price60) || 0
  const p90 = parseFloat(item?.price90) || 0
  const p120 = parseFloat(item?.price120) || 0
  return p60 + p90 + p120
}

/**
 * Build combined menu list. Same logic as massage app.
 */
export function getCombinedMenuForDisplay(menuData, therapist) {
  const normalizedMenuData = Array.isArray(menuData)
    ? menuData
    : Array.isArray(menuData?.items)
      ? menuData.items
      : Array.isArray(menuData?.menuData)
        ? menuData.menuData
        : []

  const realItems = normalizedMenuData
    .filter(item => {
      const p60 = Number(item?.price60)
      const p90 = Number(item?.price90)
      const p120 = Number(item?.price120)
      return p60 > 0 && p90 > 0 && p120 > 0
    })
    .map(item => ({
      price60: Number(item.price60),
      price90: Number(item.price90),
      price120: Number(item.price120),
      name: item.name ?? item.serviceName ?? item.title,
      serviceName: item.serviceName ?? item.name ?? item.title,
      title: item.title ?? item.name ?? item.serviceName,
    }))

  return realItems
}

/**
 * From menu items with full 60/90/120 pricing, return the one with the lowest total.
 */
export function getCheapestServiceByTotalPrice(items) {
  if (!items?.length) return null
  return items.reduce((best, current) => {
    const bestSum = totalPrice(best)
    const currentSum = totalPrice(current)
    return currentSum < bestSum ? current : best
  })
}

/**
 * Client preference display text
 */
export function getClientPreferenceDisplay(pref, lang) {
  if (!pref) return lang === 'id' ? 'Semua' : 'All'
  const map = {
    'Males Only': lang === 'id' ? 'Pria Saja' : 'Males Only',
    'Females Only': lang === 'id' ? 'Wanita Saja' : 'Females Only',
    'Males And Females': lang === 'id' ? 'Pria & Wanita' : 'Males & Females',
    'All Ages And Genders': lang === 'id' ? 'Semua Usia & Gender' : 'All Ages & Genders',
    'All': lang === 'id' ? 'Semua' : 'All',
  }
  return map[pref] || pref
}
