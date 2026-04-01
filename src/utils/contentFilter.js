// Strict content filter — blocks numbers (digits or words), links, and social-media references
// Returns { blocked: boolean, reason: string | null }

// E.164 and common formatted phone numbers
const PHONE_RE = /(\+|00)?(44|1|61|33|49|34|39|353|31|32|41|43|45|46|47|48|351|30|358)[\s\-.]?\d[\d\s\-\.]{7,12}\d|(\b0[1-9]\d{8,9}\b)|(\b\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}\b)|(\b07\d{9}\b)/

// Any sequence of 7+ digits (even spaced/dashed)
const DIGIT_SEQ_RE = /\b(\d[\s\-\.]{0,2}){7,}\d\b/

// Written-out number words used to spell a phone number (6+ words)
const NUMBER_WORDS_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b[\s,\-]*((\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b[\s,\-]*){5,})/i

// URLs and domain references
const URL_RE = /(https?:\/\/|www\.|\.com\b|\.co\.uk|\.io\b|\.me\b|\.net\b|\.org\b|\.app\b)/i

// @username handles
const HANDLE_RE = /@[a-z0-9_\.]{2,}/i

// Bare social media platform names
const SOCIAL_PLATFORM_RE = /\b(snap(chat)?|insta(gram)?|facebook|\bfb\b|whatsapp|\bwa\b|telegram|\btg\b|tiktok|twitter|wechat|kik|viber|signal app|hinge|bumble|tinder)\b/i

// Contact-sharing phrases (e.g. "my snap is", "add me on", "find me on")
const SOCIAL_SHARE_RE = /(my\s*(snap|insta|ig|fb|facebook|whatsapp|wa|telegram|signal|tiktok|twitter)\s*(is|:|=|handle|username|@)?|add\s+me\s+(on|at|to)|find\s+me\s+on|dm\s+me\s+(on|at)|follow\s+me\s+on|hit\s+me\s+up\s+(on|at))/i

// Phrases offering to share a phone number
const NUMBER_SHARE_RE = /(my\s*(number|num|no\.?|phone)\s*(is|:|=)?|call\s+me\s+(on|at)?|text\s+me\s+(on|at)?|ring\s+me|mob(ile)?\s*(is|:|=)?|whatsapp\s+me\s+(on|at)?)/i

export function filterMessage(text) {
  if (PHONE_RE.test(text))          return { blocked: true, reason: 'phone' }
  if (DIGIT_SEQ_RE.test(text))      return { blocked: true, reason: 'phone' }
  if (NUMBER_WORDS_RE.test(text))   return { blocked: true, reason: 'phone' }
  if (URL_RE.test(text))            return { blocked: true, reason: 'link' }
  if (HANDLE_RE.test(text))         return { blocked: true, reason: 'social' }
  if (SOCIAL_PLATFORM_RE.test(text))return { blocked: true, reason: 'social' }
  if (SOCIAL_SHARE_RE.test(text))   return { blocked: true, reason: 'social' }
  if (NUMBER_SHARE_RE.test(text))   return { blocked: true, reason: 'phone' }
  return { blocked: false, reason: null }
}

export const BLOCK_MESSAGES = {
  phone:  "Phone numbers stay offline — that's the point 😄 Share it in person.",
  link:   "Links aren't allowed in chat. Meet up and take it from there.",
  social: "Keep socials offline — meet first, then connect everywhere else.",
}
