/**
 * ImageGalleryViewer — full-screen image viewer with thumbnail strip.
 *
 * Product images show as small thumbnails. Tapping a thumbnail opens
 * this full-screen viewer with swipe/tap navigation.
 *
 * Props:
 *   images      {string[]}  array of image URLs
 *   startIndex  {number}    which image to show first (default 0)
 *   onClose     {fn}        close the viewer
 */
import { useState, useRef } from 'react'
import styles from './ImageGalleryViewer.module.css'

export default function ImageGalleryViewer({ images = [], startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)
  const touchStartRef = useRef(null)

  if (!images.length) return null

  const goNext = () => setCurrent(i => Math.min(i + 1, images.length - 1))
  const goPrev = () => setCurrent(i => Math.max(i - 1, 0))

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartRef.current
    if (diff > 60) goPrev()
    else if (diff < -60) goNext()
    touchStartRef.current = null
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.viewer} onClick={e => e.stopPropagation()}>

        {/* Back / Close button — prominent top-left */}
        <button className={styles.backBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        {/* Close X — top-right */}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {/* Counter */}
        <div className={styles.counter}>{current + 1} / {images.length}</div>

        {/* Main image */}
        <div
          className={styles.imageWrap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setZoomed(z => !z)}
        >
          <img
            src={images[current]}
            alt={`Product ${current + 1}`}
            className={`${styles.mainImg} ${zoomed ? styles.mainImgZoomed : ''}`}
            draggable={false}
          />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            {current > 0 && (
              <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={goPrev}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}
            {current < images.length - 1 && (
              <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={goNext}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )}
          </>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className={styles.thumbStrip}>
            {images.map((url, i) => (
              <button
                key={i}
                className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
                onClick={() => setCurrent(i)}
              >
                <img src={url} alt={`Thumb ${i + 1}`} className={styles.thumbImg} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
