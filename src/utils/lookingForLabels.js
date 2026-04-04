// Shared label map for the "here for" / lookingFor field
// Used in DiscoveryCard, DiscoveryListSheet, VibeCheckSheet, ProfileCard

export const LOOKING_FOR_OPTIONS = [
  { value: 'open',         emoji: '🌍', label: 'Open to Everything' },
  { value: 'friends',      emoji: '👋', label: 'Friends & Social' },
  { value: 'activity',     emoji: '⚡', label: 'Activity Partner' },
  { value: 'family',       emoji: '👨‍👩‍👧', label: 'Family & Parenting' },
  { value: 'culture',      emoji: '🎭', label: 'Culture & Events' },
  { value: 'professional', emoji: '💼', label: 'Career & Business' },
  { value: 'learning',     emoji: '📚', label: 'Learning & Skills' },
  { value: 'community',    emoji: '🤝', label: 'Community & Causes' },
  { value: 'travel',       emoji: '✈️', label: 'Travel Companion' },
  { value: 'wellness',     emoji: '🧘', label: 'Wellness & Mindful' },
]

/** Returns "👋 Friends & Social" for value "friends", etc. Falls back to raw value. */
export function lookingForText(value) {
  if (!value) return null
  const entry = LOOKING_FOR_OPTIONS.find(o => o.value === value)
  if (!entry) return value
  return `${entry.emoji} ${entry.label}`
}
