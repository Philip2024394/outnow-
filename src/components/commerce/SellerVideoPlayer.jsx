/**
 * SellerVideoPlayer — full-screen video embed.
 * Supports YouTube, TikTok, Instagram URLs.
 * No frames — fills entire screen.
 */
import { createPortal } from 'react-dom'
import styles from './SellerVideoPlayer.module.css'

// Extract embed URL from various platforms
function getEmbedUrl(url) {
  if (!url) return null
  const u = url.trim()

  // YouTube
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`

  // TikTok
  const ttMatch = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`

  // Instagram Reel/Post
  const igMatch = u.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/)
  if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`

  // Direct video URL (mp4, webm)
  if (u.match(/\.(mp4|webm|mov)(\?|$)/i)) return u

  return null
}

function isDirectVideo(url) {
  return url && url.match(/\.(mp4|webm|mov)(\?|$)/i)
}

export default function SellerVideoPlayer({ open, onClose, videoUrl, sellerName }) {
  if (!open || !videoUrl) return null

  const embedUrl = getEmbedUrl(videoUrl)
  if (!embedUrl) return null

  const direct = isDirectVideo(embedUrl)

  return createPortal(
    <div className={styles.page}>
      {/* Close button */}
      <button className={styles.closeBtn} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Seller name overlay */}
      {sellerName && (
        <div className={styles.sellerOverlay}>
          <span className={styles.sellerName}>{sellerName}</span>
        </div>
      )}

      {/* Video — full screen, no frames */}
      {direct ? (
        <video
          src={embedUrl}
          className={styles.video}
          autoPlay
          controls
          playsInline
          loop
        />
      ) : (
        <iframe
          src={embedUrl}
          className={styles.iframe}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          frameBorder="0"
          title="Seller Video"
        />
      )}
    </div>,
    document.body
  )
}
