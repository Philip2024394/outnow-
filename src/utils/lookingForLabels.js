// Shared label map for the "here for" / lookingFor field
// Used in DiscoveryCard, DiscoveryListSheet, VibeCheckSheet, ProfileCard

export const LOOKING_FOR_OPTIONS = [
  { value: 'friends',      emoji: '👋', label: 'Friends & Social' },
  { value: 'activity',     emoji: '⚡', label: 'Activity Partner' },
  { value: 'open',         emoji: '🌍', label: 'Open to Everything' },
  { value: 'culture',      emoji: '🎭', label: 'Culture & Events' },
  { value: 'wellness',     emoji: '🧘', label: 'Wellness Social' },
  { value: 'professional', emoji: '💼', label: 'Networking' },
  { value: 'travel',       emoji: '✈️', label: 'Travel Companion' },
  { value: 'dating',       emoji: '💕', label: 'Dating' },
]

/** Returns "👋 Friends & Social" for value "friends", etc. Falls back to raw value. */
export function lookingForText(value) {
  if (!value) return null
  const entry = LOOKING_FOR_OPTIONS.find(o => o.value === value)
  if (!entry) return value
  return `${entry.emoji} ${entry.label}`
}
