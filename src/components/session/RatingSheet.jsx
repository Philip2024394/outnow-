import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import styles from './RatingSheet.module.css'

const PROMPTS = [
  { min: 1, max: 1, label: 'What went wrong?',      emoji: '😔' },
  { min: 2, max: 2, label: 'Could be better',        emoji: '😕' },
  { min: 3, max: 3, label: 'It was alright',         emoji: '😐' },
  { min: 4, max: 4, label: 'Pretty good night!',     emoji: '😄' },
  { min: 5, max: 5, label: 'Amazing — tell us more', emoji: '🔥' },
]

const QUICK_TAGS = [
  'Met someone great', 'Good conversation', 'Easy to use',
  'Quick connection', 'Safe & comfortable', 'Would use again',
]

export default function RatingSheet({ open, onSubmit, onSkip }) {
  const [stars, setStars]     = useState(0)
  const [hovered, setHovered] = useState(0)
  const [tags, setTags]       = useState([])
  const [text, setText]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const active = hovered || stars
  const prompt = PROMPTS.find(p => active >= p.min && active <= p.max)

  const toggleTag = (t) => setTags(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
  )

  const handleSubmit = async () => {
    if (!stars) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    onSubmit?.({ stars, tags, text })
    setSubmitting(false)
  }

  return (
    <BottomSheet open={open} onClose={onSkip} title="">
      <div className={styles.sheet}>

        {/* Heading */}
        <div className={styles.top}>
          <div className={styles.iconWrap}>
            <span className={styles.icon}>🌙</span>
          </div>
          <h2 className={styles.title}>How was your night out?</h2>
          <p className={styles.sub}>Your feedback keeps IMOUTNOW real</p>
        </div>

        {/* Star selector */}
        <div className={styles.starsWrap}>
          <div className={styles.stars}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                className={`${styles.star} ${n <= active ? styles.starActive : ''}`}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
              >
                ★
              </button>
            ))}
          </div>
          {prompt && (
            <div className={styles.promptRow}>
              <span className={styles.promptEmoji}>{prompt.emoji}</span>
              <span className={styles.promptLabel}>{prompt.label}</span>
            </div>
          )}
        </div>

        {/* Quick tags — show when star selected */}
        {stars > 0 && (
          <div className={styles.tagsSection}>
            <p className={styles.tagsLabel}>What stood out?</p>
            <div className={styles.tags}>
              {QUICK_TAGS.map(t => (
                <button
                  key={t}
                  className={`${styles.tag} ${tags.includes(t) ? styles.tagActive : ''}`}
                  onClick={() => toggleTag(t)}
                >
                  {tags.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text review — show when 4+ stars */}
        {stars >= 4 && (
          <textarea
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your story — it helps others feel confident going out..."
            maxLength={280}
            rows={3}
          />
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!stars || submitting}
          >
            {submitting ? 'Saving…' : stars ? 'Submit & End Session' : 'Select a rating'}
          </button>
          <button className={styles.skipBtn} onClick={onSkip}>
            Skip — just end session
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
