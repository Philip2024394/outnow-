/**
 * SellerDealsDrawer — Slides from the left showing all deals by a seller.
 * Reads from localStorage `indoo_public_deals` filtered by seller_id.
 *
 * Props: { open, onClose, sellerId, sellerName, onSelectDeal }
 */
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

// ── helpers ──────────────────────────────────────────────

function formatRp(n) {
  return `Rp${Number(n).toLocaleString('id-ID')}`
}

function isWithinLastWeek(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return now - d.getTime() <= weekMs
}

// ── keyframes (injected once) ────────────────────────────

let injected = false
function injectKeyframes() {
  if (injected) return
  injected = true
  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes sellerDrawerSlideRight {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    @keyframes sellerDrawerFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes sellerDrawerEdgeGlow {
      0%   { background-position: 0% 0%; }
      100% { background-position: 0% 200%; }
    }
  `
  document.head.appendChild(sheet)
}

// ── DealCard ─────────────────────────────────────────────

function DealCard({ deal, expired, onSelect }) {
  const photo = deal.image || deal.photo || null
  const title = deal.title || 'Untitled Deal'
  const dealPrice = deal.dealPrice || deal.deal_price || 0
  const originalPrice = deal.originalPrice || deal.original_price || 0
  const discount = deal.discount || 0

  return (
    <button
      onClick={() => onSelect(deal)}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        overflow: 'hidden',
        opacity: expired ? 0.6 : 1,
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Photo area */}
      <div
        style={{
          width: '100%',
          height: 100,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '14px 14px 0 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.2)',
              fontSize: 28,
            }}
          >
            No Photo
          </div>
        )}

        {/* Discount badge (yellow, top-right) */}
        {discount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: '#f5a623',
              color: '#000',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 8,
              lineHeight: '16px',
            }}
          >
            -{discount}%
          </div>
        )}

        {/* Expired badge */}
        {expired && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'rgba(220,38,38,0.9)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 8,
              lineHeight: '16px',
            }}
          >
            Expired
          </div>
        )}
      </div>

      {/* Info area */}
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            lineHeight: '17px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 6,
            minHeight: 34,
          }}
        >
          {title}
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
            {formatRp(dealPrice)}
          </span>
          {originalPrice > 0 && originalPrice !== dealPrice && (
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'line-through',
              }}
            >
              {formatRp(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Section header ───────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.7)',
        padding: '16px 0 8px',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </div>
  )
}

// ── Main component ───────────────────────────────────────

export default function SellerDealsDrawer({ open, onClose, sellerId, sellerName, onSelectDeal }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    injectKeyframes()
  }, [])

  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  // Read deals from localStorage
  const { activeDeals, weekDeals } = useMemo(() => {
    if (!open || !sellerId) return { activeDeals: [], weekDeals: [] }

    let allDeals = []
    try {
      const raw = localStorage.getItem('indoo_public_deals')
      if (raw) allDeals = JSON.parse(raw)
    } catch { /* ignore */ }

    if (!Array.isArray(allDeals)) return { activeDeals: [], weekDeals: [] }

    const sellerDeals = allDeals.filter(
      (d) => d.seller_id === sellerId || d.sellerId === sellerId
    )

    const active = sellerDeals.filter((d) => d.active === true || d.status === 'active')
    const expired = sellerDeals
      .filter((d) => {
        const isInactive = d.active === false || d.status === 'expired' || d.status === 'paused'
        const endDate = d.endTime || d.end_time || d.updated_at
        return isInactive && isWithinLastWeek(endDate)
      })

    return { activeDeals: active, weekDeals: expired }
  }, [open, sellerId])

  if (!visible) return null

  const handleAnimEnd = () => {
    if (!open) setVisible(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        animation: open
          ? 'sellerDrawerFadeIn 0.25s ease-out forwards'
          : 'sellerDrawerFadeIn 0.2s ease-in reverse forwards',
      }}
      onAnimationEnd={handleAnimEnd}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: 400,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          animation: open
            ? 'sellerDrawerSlideRight 0.3s cubic-bezier(0.22,1,0.36,1) forwards'
            : 'sellerDrawerSlideRight 0.25s ease-in reverse forwards',
          overflow: 'hidden',
        }}
      >
        {/* Green edge line on right side with running light */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, transparent 0%, #4ade80 25%, #22d3ee 50%, #4ade80 75%, transparent 100%)',
            backgroundSize: '100% 200%',
            animation: 'sellerDrawerEdgeGlow 2s linear infinite',
            zIndex: 1,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {sellerName ? `${sellerName} Deals` : 'Seller Deals'}
          </div>
          <button
            onClick={onClose}
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 18,
              lineHeight: 1,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="Close seller deals drawer"
          >
            &#10005;
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0 14px 24px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Active Deals */}
          <SectionHeader label="Active Deals" />
          {activeDeals.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {activeDeals.map((deal, i) => (
                <DealCard
                  key={deal.id || i}
                  deal={deal}
                  expired={false}
                  onSelect={onSelectDeal}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
                padding: '12px 0',
              }}
            >
              No active deals right now
            </div>
          )}

          {/* This Week */}
          <SectionHeader label="This Week" />
          {weekDeals.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {weekDeals.map((deal, i) => (
                <DealCard
                  key={deal.id || i}
                  deal={deal}
                  expired={true}
                  onSelect={onSelectDeal}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
                padding: '12px 0',
              }}
            >
              No deals this week
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
