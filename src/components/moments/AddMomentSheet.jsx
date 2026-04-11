import { useRef, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import FeatureIntro, { useFeatureIntro } from '@/components/ui/FeatureIntro'
import { uploadImage } from '@/lib/uploadImage'
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
  const fileInputRef = useRef(null)

  const [photoURL,    setPhotoURL]    = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [emoji,       setEmoji]       = useState(MOMENT_EMOJIS[0])
  const [gradient,    setGradient]    = useState(GRADIENTS[0])
  const [caption,     setCaption]     = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadError(null)
    // Show instant local preview while uploading
    const localUrl = URL.createObjectURL(file)
    setPhotoURL(localUrl)
    setUploading(true)
    try {
      const url = await uploadImage(file, 'moments')
      setPhotoURL(url)
    } catch (err) {
      setUploadError(err.message)
      setPhotoURL(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = () => { setPhotoURL(null); setUploadError(null) }

  const handleAdd = () => {
    if (!caption.trim()) return
    onAdd?.({ emoji, gradient, caption: caption.trim(), photoURL: photoURL ?? null })
    setCaption('')
    setPhotoURL(null)
    onClose?.()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="">
      {/* Hidden file input — triggers camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showIntro && (
        <FeatureIntro
          emoji="⚡"
          title="Ephemeral Moments"
          bullets={[
            'Share a photo from your night — visible to nearby users for 6 hours only',
            'Photos auto-delete when the time runs out — nothing stored',
            'Only people who are also out can see your moments',
            'No saving, no forwarding outside the app',
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
        <div
          className={styles.preview}
          style={photoURL
            ? { backgroundImage: `url(${photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: gradient }
          }
        >
          {!photoURL && <span className={styles.previewEmoji}>{emoji}</span>}
          {caption && <p className={styles.previewCaption}>{caption}</p>}
          <span className={styles.previewExpiry}>Gone in 6h</span>

          {/* Photo controls overlay */}
          <div className={styles.photoOverlay}>
            {uploading ? (
              <span style={{ fontSize:12, fontWeight:700, color:'#fff', background:'rgba(0,0,0,0.55)', padding:'6px 14px', borderRadius:20 }}>Uploading…</span>
            ) : photoURL ? (
              <button className={styles.removePhotoBtn} onClick={handleRemovePhoto}>
                ✕ Remove photo
              </button>
            ) : (
              <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <span className={styles.uploadIcon}>📷</span>
                <span className={styles.uploadLabel}>Add Photo</span>
              </button>
            )}
            {uploadError && (
              <span style={{ fontSize:11, color:'#FF4444', background:'rgba(0,0,0,0.7)', padding:'4px 10px', borderRadius:12, marginTop:4 }}>{uploadError}</span>
            )}
          </div>
        </div>

        {/* Emoji + gradient — hidden when photo is uploaded */}
        {!photoURL && (
          <>
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
          </>
        )}

        {/* Caption */}
        <div className={styles.section}>
          <label className={styles.label}>Caption</label>
          <textarea
            className={styles.textarea}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's happening right now?"
            maxLength={350}
            rows={3}
          />
          <span className={styles.charCount}>{caption.length}/350</span>
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
