import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './RatingSheet.module.css'

const NIGHT_PROMPTS = [
  { min: 1, max: 1, label: 'What went wrong?',      emoji: '😔' },
  { min: 2, max: 2, label: 'Could be better',        emoji: '😕' },
  { min: 3, max: 3, label: 'It was alright',         emoji: '😐' },
  { min: 4, max: 4, label: 'Pretty good night!',     emoji: '😄' },
  { min: 5, max: 5, label: 'Amazing — tell us more', emoji: '🔥' },
]

const NIGHT_TAGS = [
  'Met someone great', 'Good conversation', 'Easy to use',
  'Quick connection', 'Safe & comfortable', 'Would use again',
]

const VENUE_PROMPTS = [
  { min: 1, max: 1, label: 'Not a great spot',      emoji: '😔' },
  { min: 2, max: 2, label: 'Below expectations',     emoji: '😕' },
  { min: 3, max: 3, label: 'Decent enough',          emoji: '😐' },
  { min: 4, max: 4, label: 'Solid venue!',           emoji: '😄' },
  { min: 5, max: 5, label: 'Great spot — go there!', emoji: '🔥' },
]

const VENUE_TAGS = [
  'Great atmosphere', 'Good music', 'Friendly staff',
  'Perfect for meeting people', 'Good drinks', 'Busy tonight',
  'Quiet but nice', 'Would come back',
]

function StarRow({ stars, hovered, onSet, onHover, onLeave }) {
  const active = hovered || stars
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          className={`${styles.star} ${n <= active ? styles.starActive : ''}`}
          onClick={() => onSet(n)}
          onMouseEnter={() => onHover(n)}
          onMouseLeave={onLeave}
        >★</button>
      ))}
    </div>
  )
}

export default function RatingSheet({ open, onSubmit, onSkip, session }) {
  const [step, setStep] = useState(1)

  // Step 1 — night rating
  const [nightStars, setNightStars]   = useState(0)
  const [nightHover, setNightHover]   = useState(0)
  const [nightTags, setNightTags]     = useState([])
  const [nightText, setNightText]     = useState('')

  // Step 2 — venue rating
  const [venueStars, setVenueStars]   = useState(0)
  const [venueHover, setVenueHover]   = useState(0)
  const [venueTags, setVenueTags]     = useState([])
  const [venueText, setVenueText]     = useState('')

  const [submitting, setSubmitting]   = useState(false)

  const { show: showVenueIntro, dismiss: dismissVenueIntro } = useFeatureIntro('venue_rating')

  const nightActive  = nightHover || nightStars
  const venueActive  = venueHover || venueStars
  const nightPrompt  = NIGHT_PROMPTS.find(p => nightActive >= p.min && nightActive <= p.max)
  const venuePrompt  = VENUE_PROMPTS.find(p => venueActive >= p.min && venueActive <= p.max)

  const toggleNightTag = t => setNightTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])
  const toggleVenueTag = t => setVenueTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const handleNightSubmit = () => {
    if (!nightStars) return
    if (session?.placeName) {
      setStep(2)
    } else {
      finishAll()
    }
  }

  const finishAll = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    onSubmit?.({
      night: { stars: nightStars, tags: nightTags, text: nightText },
      venue: venueStars ? { stars: venueStars, tags: venueTags, text: venueText, venueName: session?.placeName } : null,
    })
    setSubmitting(false)
    // Reset for next time
    setStep(1); setNightStars(0); setNightTags([]); setNightText('')
    setVenueStars(0); setVenueTags([]); setVenueText('')
  }

  const handleSkipVenue = () => finishAll()

  return (
    <BottomSheet open={open} onClose={onSkip} title="">
      {step === 2 && showVenueIntro && (
        <FeatureIntro
          emoji="🏠"
          title="Rate the Venue"
          bullets={[
            'Your review is completely anonymous',
            'Helps others know if a venue is worth going to tonight',
            'Only takes 5 seconds — honest ratings keep the map real',
          ]}
          onDone={dismissVenueIntro}
        />
      )}

      {step === 1 && (
        <div className={styles.sheet}>
          {/* Step indicator */}
          <div className={styles.stepRow}>
            <span className={`${styles.stepDot} ${styles.stepDotActive}`} />
            <span className={styles.stepDot} />
          </div>

          <div className={styles.top}>
            <div className={styles.iconWrap}><span className={styles.icon}>🌙</span></div>
            <h2 className={styles.title}>How was your night out?</h2>
            <p className={styles.sub}>Your feedback keeps IMOUTNOW real</p>
          </div>

          <div className={styles.starsWrap}>
            <StarRow
              stars={nightStars} hovered={nightHover}
              onSet={setNightStars} onHover={setNightHover} onLeave={() => setNightHover(0)}
            />
            {nightPrompt && (
              <div className={styles.promptRow}>
                <span className={styles.promptEmoji}>{nightPrompt.emoji}</span>
                <span className={styles.promptLabel}>{nightPrompt.label}</span>
              </div>
            )}
          </div>

          {nightStars > 0 && (
            <div className={styles.tagsSection}>
              <p className={styles.tagsLabel}>What stood out?</p>
              <div className={styles.tags}>
                {NIGHT_TAGS.map(t => (
                  <button
                    key={t}
                    className={`${styles.tag} ${nightTags.includes(t) ? styles.tagActive : ''}`}
                    onClick={() => toggleNightTag(t)}
                  >
                    {nightTags.includes(t) ? '✓ ' : ''}{t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {nightStars >= 4 && (
            <textarea
              className={styles.textarea}
              value={nightText}
              onChange={e => setNightText(e.target.value)}
              placeholder="Share your story — it helps others feel confident going out..."
              maxLength={280}
              rows={3}
            />
          )}

          <div className={styles.actions}>
            <button
              className={styles.submitBtn}
              onClick={handleNightSubmit}
              disabled={!nightStars}
            >
              {session?.placeName ? 'Next — Rate the Venue →' : 'Submit & End Session'}
            </button>
            <button className={styles.skipBtn} onClick={onSkip}>
              Skip — just end session
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.sheet}>
          {/* Step indicator */}
          <div className={styles.stepRow}>
            <span className={`${styles.stepDot} ${styles.stepDotDone}`} />
            <span className={`${styles.stepDot} ${styles.stepDotActive}`} />
          </div>

          <div className={styles.top}>
            <div className={styles.iconWrap}><span className={styles.icon}>🏠</span></div>
            <h2 className={styles.title}>{session?.placeName ?? 'Rate the Venue'}</h2>
            <p className={styles.sub}>Anonymous — helps others decide where to go</p>
          </div>

          <div className={styles.starsWrap}>
            <StarRow
              stars={venueStars} hovered={venueHover}
              onSet={setVenueStars} onHover={setVenueHover} onLeave={() => setVenueHover(0)}
            />
            {venuePrompt && (
              <div className={styles.promptRow}>
                <span className={styles.promptEmoji}>{venuePrompt.emoji}</span>
                <span className={styles.promptLabel}>{venuePrompt.label}</span>
              </div>
            )}
          </div>

          {venueStars > 0 && (
            <div className={styles.tagsSection}>
              <p className={styles.tagsLabel}>What was it like?</p>
              <div className={styles.tags}>
                {VENUE_TAGS.map(t => (
                  <button
                    key={t}
                    className={`${styles.tag} ${venueTags.includes(t) ? styles.tagActive : ''}`}
                    onClick={() => toggleVenueTag(t)}
                  >
                    {venueTags.includes(t) ? '✓ ' : ''}{t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {venueStars >= 4 && (
            <textarea
              className={styles.textarea}
              value={venueText}
              onChange={e => setVenueText(e.target.value)}
              placeholder="What made it great? Others will see this before they go out..."
              maxLength={280}
              rows={3}
            />
          )}

          <div className={styles.actions}>
            <button
              className={styles.submitBtn}
              onClick={finishAll}
              disabled={!venueStars || submitting}
            >
              {submitting ? 'Saving…' : 'Submit & End Session'}
            </button>
            <button className={styles.skipBtn} onClick={handleSkipVenue}>
              Skip venue rating
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
