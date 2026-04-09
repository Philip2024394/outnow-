import { useState, useRef } from 'react'
import styles from './ProductImageEditor.module.css'

export default function ProductImageEditor({ initialUrl = null, onConfirm, onCancel }) {
  const [imgSrc,    setImgSrc]    = useState(initialUrl)
  const [zoom,      setZoom]      = useState(100)   // 100–250
  const [offsetX,   setOffsetX]   = useState(50)    // 0–100 %
  const [offsetY,   setOffsetY]   = useState(50)    // 0–100 %
  const [watermark, setWatermark] = useState('')
  const [exporting, setExporting] = useState(false)
  const fileRef   = useRef()
  const canvasRef = useRef()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    setZoom(100); setOffsetX(50); setOffsetY(50)
  }

  async function exportCanvas() {
    const canvas = canvasRef.current
    const W = 900, H = 675   // 4:3 export
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res; img.onerror = rej; img.src = imgSrc
    })

    // Cover W×H with natural image, then apply zoom/pan
    const nat = img.naturalWidth / img.naturalHeight
    let drawW, drawH
    if (nat > W / H) { drawH = H; drawW = H * nat }
    else              { drawW = W; drawH = W / nat }

    drawW *= zoom / 100
    drawH *= zoom / 100
    const ox = -((drawW - W) * (offsetX / 100))
    const oy = -((drawH - H) * (offsetY / 100))

    ctx.drawImage(img, ox, oy, drawW, drawH)

    // Watermark — diagonal from lower-left to upper-right
    if (watermark.trim()) {
      const angle    = Math.atan2(-H, W)          // exact diagonal of canvas
      const fontSize = Math.round(Math.sqrt(W * W + H * H) * 0.038)
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate(angle)
      ctx.font         = `900 ${fontSize}px sans-serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeStyle  = 'rgba(0,0,0,0.18)'
      ctx.lineWidth    = fontSize * 0.06
      ctx.strokeText(watermark.toUpperCase(), 0, 0)
      ctx.fillStyle    = 'rgba(255,255,255,0.22)'
      ctx.fillText(watermark.toUpperCase(), 0, 0)
      ctx.restore()
    }

    return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
  }

  async function handleConfirm() {
    if (!imgSrc) { onConfirm(null, null); return }
    setExporting(true)
    try {
      const outputBlob = await exportCanvas()
      onConfirm(outputBlob, URL.createObjectURL(outputBlob))
    } catch {
      // crossOrigin or canvas taint — return preview URL as-is
      onConfirm(null, imgSrc)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        <div className={styles.header}>
          <span className={styles.title}>Product Photo</span>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        </div>

        {/* ── Preview ── */}
        <div
          className={styles.previewBox}
          onClick={() => !imgSrc && fileRef.current?.click()}
        >
          {imgSrc ? (
            <>
              <img
                src={imgSrc}
                alt="preview"
                className={styles.previewImg}
                style={{
                  objectPosition: `${offsetX}% ${offsetY}%`,
                  transform:       `scale(${zoom / 100})`,
                  transformOrigin: `${offsetX}% ${offsetY}%`,
                }}
              />
              {watermark.trim() && (
                <div className={styles.wmOverlay}>
                  <span className={styles.wmText}>
                    {watermark.toUpperCase()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className={styles.previewEmpty}>
              <span className={styles.previewIcon}>📷</span>
              <span className={styles.previewHint}>Tap to select photo</span>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        {imgSrc && (
          <button className={styles.changeBtn} onClick={() => fileRef.current?.click()}>
            ↩ Change photo
          </button>
        )}

        {/* ── Editing sliders ── */}
        {imgSrc && (
          <div className={styles.sliders}>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>ZOOM</span>
              <input
                type="range" min={100} max={250} value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sliderVal}>{zoom}%</span>
            </div>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>← →</span>
              <input
                type="range" min={0} max={100} value={offsetX}
                onChange={e => setOffsetX(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>↑ ↓</span>
              <input
                type="range" min={0} max={100} value={offsetY}
                onChange={e => setOffsetY(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        )}

        {/* ── Watermark ── */}
        <div className={styles.wmSection}>
          <label className={styles.wmLabel}>
            Watermark
            <span className={styles.wmOptional}> — optional</span>
          </label>
          <input
            className={styles.wmInput}
            placeholder="e.g. Luxe Leather Studio"
            value={watermark}
            onChange={e => setWatermark(e.target.value)}
            maxLength={40}
          />
          {watermark.trim() && (
            <p className={styles.wmHint}>
              Lightly stamped diagonally across the image.
            </p>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={exporting}
        >
          {exporting ? 'Processing…' : imgSrc ? 'Use This Photo' : 'Skip Photo'}
        </button>
      </div>
    </div>
  )
}
