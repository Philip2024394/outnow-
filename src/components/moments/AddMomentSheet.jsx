import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import styles from './AddMomentSheet.module.css'

const MOMENT_EMOJIS = ['🍸', '🍺', '🎶', '🎉', '🌙', '🔥', '💃', '🎯', '🍝', '☕', '🍷', '✨']

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

export default function AddMomentSheet({ open, onClose, onAdd }) {
  const { show: showIntro, dismiss: dismissIntro } = useFeatureIntro('moments')
  const [emoji,    setEmoji]    = useState(MOMENT_EMOJIS[0])
  const [gradient, setGradient] = useState(GRADIENTS[0])
  const [caption,  setCaption]  = useState('')

  const handleAdd = () => {
    if (!caption.trim()) return
    onAdd?.({ emoji, gradient, caption: caption.trim() })
    setCaption('')
    onClose?.()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {showIntro && (
        <FeatureIntro
          emoji="⚡"
          title="Ephemeral Moments"
          bullets={[
            'Share a snap from your night — visible to nearby users for 6 hours only',
            'Photos and moments auto-delete when the time runs out — nothing stored',
            'Only people who are also out can see your moments',
            'No screenshots saved, no sharing outside the app',
          ]}
          onDone={dismissIntro}
        />
      )}

      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share a Moment</h2>
          <p className={styles.sub}>Disappears in 6 hours</p>
        </div>

        {/* Preview */}
        <div className={styles.preview} style={{ background: gradient }}>
          <span className={styles.previewEmoji}>{emoji}</span>
          {caption && <p className={styles.previewCaption}>{caption}</p>}
          <span className={styles.previewExpiry}>Gone in 6h</span>
        </div>

        {/* Emoji picker */}
        <div className={styles.section}>
          <label className={styles.label}>Pick an emoji</label>
          <div className={styles.emojiGrid}>
            {MOMENT_EMOJIS.map(e => (
              <button
                key={e}
                className={`${styles.emojiBtn} ${emoji === e ? styles.emojiBtnActive : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Gradient picker */}
        <div className={styles.section}>
          <label className={styles.label}>Background</label>
          <div className={styles.gradients}>
            {GRADIENTS.map(g => (
              <button
                key={g}
                className={`${styles.gradientSwatch} ${gradient === g ? styles.gradientSwatchActive : ''}`}
                style={{ background: g }}
                onClick={() => setGradient(g)}
              />
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className={styles.section}>
          <label className={styles.label}>Caption</label>
          <textarea
            className={styles.textarea}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's happening right now?"
            maxLength={120}
            rows={2}
          />
          <span className={styles.charCount}>{caption.length}/120</span>
        </div>

        <div className={styles.privacyNote}>
          🔒 Only visible to people who are also out right now — auto-deletes in 6h
        </div>

        <button
          className={styles.shareBtn}
          onClick={handleAdd}
          disabled={!caption.trim()}
        >
          Share Moment ⚡
        </button>
      </div>
    </BottomSheet>
  )
}
