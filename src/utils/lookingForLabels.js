// Shared label map for the "here for" / lookingFor field
// Used in DiscoveryCard, DiscoveryListSheet, VibeCheckSheet, ProfileCard

export const LOOKING_FOR_OPTIONS = [
  { value: 'open',         emoji: '🌍', label: 'Open to Everything' },
  { value: 'dating',       emoji: '💕', label: 'Dating & Romance' },
  { value: 'friends',      emoji: '👋', label: 'Friends & Social' },
  { value: 'activity',     emoji: '⚡', label: 'Activity Partner' },
  { value: 'music',        emoji: '🎵', label: 'Music & Gigs' },
  { value: 'arts',         emoji: '🎨', label: 'Arts & Creative' },
  { value: 'family',       emoji: '👨‍👩‍👧', label: 'Family & Parenting' },
  { value: 'culture',      emoji: '🎭', label: 'Culture & Events' },
  { value: 'tech',         emoji: '💻', label: 'Tech & Gaming' },
  { value: 'professional', emoji: '💼', label: 'Career & Business' },
  { value: 'learning',     emoji: '📚', label: 'Learning & Skills' },
  { value: 'community',    emoji: '🤝', label: 'Community & Causes' },
  { value: 'travel',       emoji: '✈️', label: 'Travel Companion' },
  { value: 'wellness',     emoji: '🧘', label: 'Wellness & Mindful' },
  { value: 'handmade',       emoji: '🧵', label: 'Handmade & Makers' },
  { value: 'craft_supplies', emoji: '🪡', label: 'Handy Craft Supplies' },
  { value: 'property',    emoji: '🏠', label: 'Property & Rentals' },
]

export const LANGUAGE_FLAGS = {
  'English':    '🇬🇧', 'Mandarin':   '🇨🇳', 'Hindi':      '🇮🇳', 'Spanish':    '🇪🇸',
  'French':     '🇫🇷', 'Arabic':     '🇸🇦', 'Bengali':    '🇧🇩', 'Portuguese': '🇵🇹',
  'Russian':    '🇷🇺', 'Urdu':       '🇵🇰', 'Indonesian': '🇮🇩', 'Filipino':   '🇵🇭',
  'Vietnamese': '🇻🇳', 'Thai':       '🇹🇭', 'Malay':      '🇲🇾', 'Japanese':   '🇯🇵',
  'Korean':     '🇰🇷', 'Turkish':    '🇹🇷', 'Italian':    '🇮🇹', 'German':     '🇩🇪',
  'Dutch':      '🇳🇱', 'Polish':     '🇵🇱', 'Ukrainian':  '🇺🇦', 'Swedish':    '🇸🇪',
  'Norwegian':  '🇳🇴', 'Danish':     '🇩🇰', 'Finnish':    '🇫🇮', 'Swahili':    '🇰🇪',
  'Amharic':    '🇪🇹', 'Yoruba':     '🇳🇬', 'Zulu':       '🇿🇦', 'Tamil':      '🇱🇰',
  'Telugu':     '🇮🇳', 'Punjabi':    '🇮🇳', 'Burmese':    '🇲🇲', 'Khmer':      '🇰🇭',
  'Lao':        '🇱🇦', 'Sinhala':    '🇱🇰', 'Nepali':     '🇳🇵', 'Georgian':   '🇬🇪',
  'Armenian':   '🇦🇲', 'Hebrew':     '🇮🇱', 'Persian':    '🇮🇷', 'Pashto':     '🇦🇫',
  'Somali':     '🇸🇴', 'Hausa':      '🇳🇬',
}

/** Returns "👋 Friends & Social" for value "friends", etc. Falls back to raw value. */
export function lookingForText(value) {
  if (!value) return null
  const entry = LOOKING_FOR_OPTIONS.find(o => o.value === value)
  if (!entry) return value
  return `${entry.emoji} ${entry.label}`
}
