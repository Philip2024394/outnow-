/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Daily Restaurant Deals — one themed deal per day of the week
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Each day has: name, background image, default discount, color accent.
 * The active day shows a full-size card with glowing discount + countdown.
 * Only today's deal is "live" — others show as upcoming/past.
 */

// Day index: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const DAILY_DEALS = [
  {
    day: 0,
    name: 'Sunday Saver',
    emoji: '🌅',
    discount: 25,
    color: '#FACC15',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2008_53_16%20AM.png?updatedAt=1776909215010',
  },
  {
    day: 1,
    name: 'Magic Monday',
    emoji: '✨',
    discount: 20,
    color: '#A78BFA',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2007_48_02%20AM.png?updatedAt=1776905296343',
  },
  {
    day: 2,
    name: 'Tuesday Grooves',
    emoji: '🎵',
    discount: 15,
    color: '#34D399',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2008_47_37%20AM.png?updatedAt=1776908876816',
  },
  {
    day: 3,
    name: 'Wicked Wednesday',
    emoji: '🔥',
    discount: 30,
    color: '#F87171',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2007_50_12%20AM.png?updatedAt=1776905429676',
  },
  {
    day: 4,
    name: 'Thirsty Thursday',
    emoji: '🥤',
    discount: 20,
    color: '#60A5FA',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2008_50_07%20AM.png?updatedAt=1776909023069',
  },
  {
    day: 5,
    name: 'Crunchy Friday',
    emoji: '🍗',
    discount: 25,
    color: '#FB923C',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2007_48_02%20AM.png?updatedAt=1776905296343',
  },
  {
    day: 6,
    name: 'Sizzling Saturday',
    emoji: '🥩',
    discount: 35,
    color: '#EF4444',
    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2023,%202026,%2007_43_17%20AM.png?updatedAt=1776905011381',
  },
]

/**
 * Get today's active deal (WIB timezone)
 */
export function getTodayDeal() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wib = new Date(utcMs + 7 * 3_600_000)
  return DAILY_DEALS[wib.getDay()]
}

/**
 * Get milliseconds until today's deal expires (midnight WIB)
 */
export function getMsUntilMidnightWIB() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const wib = new Date(utcMs + 7 * 3_600_000)
  const midnight = new Date(wib)
  midnight.setHours(23, 59, 59, 999)
  return midnight.getTime() - wib.getTime()
}
