// Blocks phone numbers, URLs, and social handle sharing attempts
// Returns { blocked: boolean, reason: string | null }

const PHONE_RE = /(\+|00)?(44|1|61|33|49|34|39|353|31|32|41|43|45|46|47|48|351|30|358)[\s\-.]?\d[\d\s\-\.]{7,12}\d|(\b0[1-9]\d{8,9}\b)|(\b\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}\b)|(\b07\d{9}\b)/

const URL_RE = /(https?:\/\/|www\.|\.com\b|\.co\.uk|\.io\b|\.me\b|\.net\b|\.org\b|\.app\b)/i

// Phrases that indicate trying to share contact info
const SOCIAL_RE = /(my\s*(snap(chat)?|insta(gram)?|ig|fb|facebook|whatsapp|wa|telegram|tg|signal|tiktok|twitter|x)\s*(is|:|=|handle|username)?|add\s+me\s+(on|at|to)|find\s+me\s+on|dm\s+me\s+(on|at)|follow\s+me\s+on|hit\s+me\s+up\s+on)/i

const NUMBER_SHARE_RE = /(my\s*(number|num|no\.?|phone)\s*(is|:|=)?|call\s+me\s+(on|at)?|text\s+me\s+(on|at)?|ring\s+me|mob(ile)?\s*(is|:|=)?|whatsapp\s+me\s+on)/i

// Digit sequences 7+ digits that look like numbers (even with spaces/dashes)
const DIGIT_SEQ_RE = /\b(\d[\s\-\.]{0,2}){7,}\d\b/

export function filterMessage(text) {
  if (PHONE_RE.test(text))        return { blocked: true, reason: 'phone' }
  if (DIGIT_SEQ_RE.test(text))    return { blocked: true, reason: 'phone' }
  if (URL_RE.test(text))          return { blocked: true, reason: 'link' }
  if (SOCIAL_RE.test(text))       return { blocked: true, reason: 'social' }
  if (NUMBER_SHARE_RE.test(text)) return { blocked: true, reason: 'phone' }
  return { blocked: false, reason: null }
}

export const BLOCK_MESSAGES = {
  phone:  "Phone numbers stay offline — that's the point 😄 Share it in person.",
  link:   "Links aren't allowed in chat. Meet up and take it from there.",
  social: "Keep socials offline — meet first, then connect everywhere else.",
}
