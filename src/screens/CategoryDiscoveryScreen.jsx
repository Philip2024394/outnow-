import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './CategoryDiscoveryScreen.module.css'

// ── Category definitions ──────────────────────────────────────────────────────
// videoUrl  → short looping clip (WebM or H.264, ≤1 MB, no audio needed)
// posterUrl → static frame shown before video loads / on slow connections
// gradient  → fallback when neither image nor video supplied yet
export const FOOD_CATEGORIES = [
  {
    id: 'all',
    label: 'MAKAN',
    emoji: '🍽',
    tagline: 'Everything near you',
    color: '#F5C518',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a1200 0%, #2d2000 50%, #0d0d0d 100%)',
  },
  {
    id: 'rice',
    label: 'Rice Dishes',
    emoji: '🍚',
    tagline: 'Comfort in every grain',
    color: '#F5C518',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/cool%20rice.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvY29vbCByaWNlLm1wNCIsImlhdCI6MTc3NTY3MjExMSwiZXhwIjoyMDkxMDMyMTExfQ.Ny19MR2SrVB9aNEGGzh2p_8A863OagwOSLSoENM_A_4',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a1500 0%, #2a2100 50%, #0d0d0d 100%)',
  },
  {
    id: 'noodles',
    label: 'Noodles',
    emoji: '🍜',
    tagline: 'Slurp-worthy every time',
    color: '#ff8c42',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/noodle.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3Mvbm9vZGxlLm1wNCIsImlhdCI6MTc3NTcxNDc3MiwiZXhwIjoyMDkxMDc0NzcyfQ.QcNPpQVXoxZZRDn_UvaGPanhD9yaXmhQA8YUs3oP3_Y',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0d00 0%, #2d1800 50%, #0d0d0d 100%)',
  },
  {
    id: 'grilled',
    label: 'Grilled',
    emoji: '🔥',
    tagline: 'Charred. Bold. Perfect.',
    color: '#ff6b35',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/steak.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3Mvc3RlYWsubXA0IiwiaWF0IjoxNzc1NzE1MjQ0LCJleHAiOjIwOTEwNzUyNDR9.FqAaGz_mVChVkIkjLYT442Th6EX_Cw0gITFtVrLE1gc',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0800 0%, #2d1000 50%, #0d0d0d 100%)',
  },
  {
    id: 'burgers',
    label: 'Burgers',
    emoji: '🍔',
    tagline: 'Stack it high',
    color: '#8DC63F',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/burger.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvYnVyZ2VyLm1wNCIsImlhdCI6MTc3NTcxNjgzMSwiZXhwIjoyMDkxMDc2ODMxfQ.sC5ZQtgp0mgFVdFgn-xIHo2d9AGsTN_NXK5aCqh2Dlc',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #071a00 0%, #0f2800 50%, #0d0d0d 100%)',
  },
  {
    id: 'seafood',
    label: 'Seafood',
    emoji: '🦐',
    tagline: 'Fresh from the ocean',
    color: '#38bdf8',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/fish.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvZmlzaC5tcDQiLCJpYXQiOjE3NzU3MTc2MDcsImV4cCI6MjA5MTA3NzYwN30.ZpiEWK8_6r65DGtkOlN5x4kcMUrMPS7uLXW4axQ169o',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #001520 0%, #002030 50%, #0d0d0d 100%)',
  },
  {
    id: 'desserts',
    label: 'Desserts',
    emoji: '🧁',
    tagline: 'Life is short. Eat dessert first.',
    color: '#f472b6',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/steak.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3Mvc3RlYWsubXA0IiwiaWF0IjoxNzc1NzE2NzM1LCJleHAiOjIwOTEwNzY3MzV9.ImT5fFzSkF86maWeJFcwlinK343XGSqVdixbNbBa6vE',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0015 0%, #280020 50%, #0d0d0d 100%)',
  },
  {
    id: 'drinks',
    label: 'Drinks & Juice',
    emoji: '🥤',
    tagline: 'Refresh your world',
    color: '#a78bfa',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #0d0020 0%, #150030 50%, #0d0d0d 100%)',
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    emoji: '🌅',
    tagline: 'Start the day right',
    color: '#fb923c',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0c00 0%, #2d1a00 50%, #0d0d0d 100%)',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    emoji: '🍿',
    tagline: 'Always hungry for more',
    color: '#4ade80',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #001a0a 0%, #002810 50%, #0d0d0d 100%)',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    emoji: '🥗',
    tagline: 'Clean. Green. Delicious.',
    color: '#22c55e',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #001508 0%, #002210 50%, #0d0d0d 100%)',
  },
]

// ── Demo avatars — replaced by real users when live ──────────────────────────
const DEMO_AVATARS = [
  { id: 'd1', photo_url: 'https://ik.imagekit.io/nepgaxllc/av1.jpg', name: 'Sari' },
  { id: 'd2', photo_url: 'https://ik.imagekit.io/nepgaxllc/av2.jpg', name: 'Budi' },
  { id: 'd3', photo_url: 'https://ik.imagekit.io/nepgaxllc/av3.jpg', name: 'Rina' },
  { id: 'd4', photo_url: 'https://ik.imagekit.io/nepgaxllc/av4.jpg', name: 'Dian' },
  { id: 'd5', photo_url: 'https://ik.imagekit.io/nepgaxllc/av5.jpg', name: 'Agus' },
  { id: 'd6', photo_url: 'https://ik.imagekit.io/nepgaxllc/av6.jpg', name: 'Tini' },
  { id: 'd7', photo_url: 'https://ik.imagekit.io/nepgaxllc/av7.jpg', name: 'Wahyu' },
  { id: 'd8', photo_url: 'https://ik.imagekit.io/nepgaxllc/av8.jpg', name: 'Dewi' },
  { id: 'd9', photo_url: 'https://ik.imagekit.io/nepgaxllc/av9.jpg', name: 'Fajar' },
]

// ── Search demo data (replaced by Supabase when live) ────────────────────────
const DEMO_SEARCH = [
  { id: 1, name: 'Warung Bu Sari',        category: 'rice',      cuisine_type: 'Javanese',   rating: 4.8, is_open: true  },
  { id: 2, name: 'Bakso Pak Budi',        category: 'noodles',   cuisine_type: 'Indonesian', rating: 4.6, is_open: true  },
  { id: 3, name: 'Ayam Geprek Mbak Rina', category: 'grilled',   cuisine_type: 'Indonesian', rating: 4.9, is_open: false },
  { id: 4, name: 'Es Teler 77',           category: 'drinks',    cuisine_type: 'Indonesian', rating: 4.5, is_open: true  },
  { id: 5, name: 'Pisang Goreng Mbok Tum',category: 'snacks',    cuisine_type: 'Javanese',   rating: 4.7, is_open: true  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function CategoryDiscoveryScreen({ onClose, onSelectCategory }) {
  const [activeIndex,    setActiveIndex]    = useState(0)
  const [search,         setSearch]         = useState('')
  const [searchFocused,  setSearchFocused]  = useState(false)
  const [searchResults,  setSearchResults]  = useState([])
  const [allRestaurants, setAllRestaurants] = useState(DEMO_SEARCH)

  const containerRef = useRef(null)
  const searchRef    = useRef(null)
  // One ref per category video element
  const videoRefs    = useRef(FOOD_CATEGORIES.map(() => null))

  // ── Load restaurant list for search ──
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('restaurants')
      .select('id, name, category, cuisine_type, rating, is_open')
      .eq('status', 'approved')
      .then(({ data }) => { if (data?.length) setAllRestaurants(data) })
  }, [])

  // ── Live search filter ──
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const q = search.toLowerCase()
    setSearchResults(
      allRestaurants.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine_type?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      ).slice(0, 8)
    )
  }, [search, allRestaurants])

  // ── Active-only video playback ────────────────────────────────────────────
  // When the active card changes, pause ALL videos then play only the active one.
  // This keeps battery usage low and prevents audio bleed (even muted, helps perf).
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activeIndex) {
        // Only play if video has a src
        if (v.src) {
          v.currentTime = 0
          v.play().catch(() => {}) // catch DOMException on some browsers
        }
      } else {
        v.pause()
      }
    })
  }, [activeIndex])

  // ── Scroll tracking ──
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    if (idx !== activeIndex) setActiveIndex(idx)
  }, [activeIndex])

  // ── Handlers ──
  const handleCategoryTap = (cat) => {
    setSearch('')
    setSearchFocused(false)
    onSelectCategory(cat)
  }

  const handleSearchSelect = (restaurant) => {
    setSearch('')
    setSearchFocused(false)
    const cat = FOOD_CATEGORIES.find(c => c.id === restaurant.category) || FOOD_CATEGORIES[0]
    onSelectCategory(cat, restaurant.id)
  }

  const showSearchOverlay = searchFocused && search.trim().length > 0

  return (
    <div className={styles.screen}>

      {/* ── Pinned search bar ────────────────────────────────────────────────── */}
      <div className={styles.searchBar}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className={styles.searchInputWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Search MAKAN — restaurant, dish, cuisine…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => { setSearch(''); searchRef.current?.focus() }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Search overlay ───────────────────────────────────────────────────── */}
      {showSearchOverlay && (
        <div className={styles.searchOverlay}>
          {searchResults.length === 0
            ? <div className={styles.searchEmpty}>No results for "{search}"</div>
            : searchResults.map(r => (
              <button key={r.id} className={styles.searchResult} onClick={() => handleSearchSelect(r)}>
                <span className={styles.searchResultEmoji}>
                  {FOOD_CATEGORIES.find(c => c.id === r.category)?.emoji ?? '🍽'}
                </span>
                <span className={styles.searchResultInfo}>
                  <span className={styles.searchResultName}>{r.name}</span>
                  <span className={styles.searchResultSub}>{r.cuisine_type} · {r.is_open ? 'Open now' : 'Closed'}</span>
                </span>
                {r.rating && <span className={styles.searchResultRating}>⭐ {r.rating}</span>}
              </button>
            ))
          }
        </div>
      )}

      {/* ── Right-side scroll dots ───────────────────────────────────────────── */}
      <div className={styles.dots}>
        {FOOD_CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            style={i === activeIndex ? { background: cat.color } : {}}
          />
        ))}
      </div>

      {/* ── Full-screen snap-scroll cards ────────────────────────────────────── */}
      <div className={styles.cardContainer} ref={containerRef} onScroll={handleScroll}>
        {FOOD_CATEGORIES.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            isActive={i === activeIndex}
            videoRef={el => { videoRefs.current[i] = el }}
            onClick={() => handleCategoryTap(cat)}
          />
        ))}
      </div>

    </div>
  )
}

// ── Now In Kitchen widget ─────────────────────────────────────────────────────
function NowInKitchen({ categoryId }) {
  const [viewers,    setViewers]    = useState([])
  const [total,      setTotal]      = useState(0)
  const [visibleSet, setVisibleSet] = useState([])
  const [fade,       setFade]       = useState(true)

  // Load real users browsing this category, fall back to demo avatars
  useEffect(() => {
    async function load() {
      let users = []
      if (supabase) {
        const { data } = await supabase
          .from('profiles')
          .select('id, photo_url, name')
          .eq('browsing_category', categoryId)
          .limit(20)
        if (data?.length) users = data
      }
      if (!users.length) users = DEMO_AVATARS
      setViewers(users)
      setTotal(users.length)
      setVisibleSet(users.slice(0, 5))
    }
    load()
  }, [categoryId])

  // Cycle visible avatars every 5s with fade
  useEffect(() => {
    if (viewers.length <= 5) return
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setVisibleSet(prev => {
          const pool = viewers.filter(u => !prev.find(p => p.id === u.id))
          if (!pool.length) return viewers.slice(0, 5)
          const swap = Math.floor(Math.random() * Math.min(prev.length, pool.length))
          const next = [...prev]
          next[swap] = pool[Math.floor(Math.random() * pool.length)]
          return next
        })
        setFade(true)
      }, 300)
    }, 5000)
    return () => clearInterval(id)
  }, [viewers])

  if (!visibleSet.length) return null

  const extra = Math.max(0, total - 5)

  return (
    <div className={styles.kitchenWrap}>
      <div className={styles.kitchenAvatars} style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        {visibleSet.map(u => (
          <div key={u.id} className={styles.kitchenAvatar}>
            <img
              src={u.photo_url || 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png'}
              alt={u.name}
              className={styles.kitchenAvatarImg}
              onError={e => { e.target.src = 'https://ik.imagekit.io/nepgaxllc/sdfasdfasdf.png' }}
            />
          </div>
        ))}
        {extra > 0 && (
          <div className={styles.kitchenExtra}>+{extra}</div>
        )}
      </div>
      <span className={styles.kitchenLabel}>Now in the Kitchen</span>
    </div>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, videoRef, onClick }) {
  const hasVideo = Boolean(cat.videoUrl)

  return (
    <div className={styles.card} onClick={onClick}>

      {/* ── Background: video (if supplied) or gradient ── */}
      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            className={styles.cardVideo}
            src={cat.videoUrl}
            poster={cat.posterUrl ?? undefined}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          {/* Darken the video so text stays readable */}
          <div className={styles.videoScrim} />
        </>
      ) : (
        <>
          {/* Poster / static image fallback */}
          {cat.posterUrl && (
            <div
              className={styles.cardBg}
              style={{ backgroundImage: `url("${cat.posterUrl}")` }}
            />
          )}
          {/* Gradient fill (always rendered, covers poster or stands alone) */}
          <div className={styles.cardBg} style={{ backgroundImage: cat.gradient }} />
        </>
      )}

      {/* Cinematic overlay — heavy bottom, light top */}
      <div className={styles.cardOverlay} />

      {/* Subtle color glow at top matching category accent */}
      <div
        className={styles.cardTopGlow}
        style={{ background: `linear-gradient(to bottom, ${cat.color}22 0%, transparent 40%)` }}
      />

      {/* Now in the Kitchen — top of card */}
      {cat.id !== 'all' && <NowInKitchen categoryId={cat.id} />}

      {/* Bottom: tagline + name + CTA */}
      <div className={styles.cardBottom}>
        <span className={styles.tagline}>{cat.tagline}</span>
        <h2 className={styles.categoryName}>{cat.label}</h2>

        <button
          className={styles.explorBtn}
          style={{ background: '#8DC63F' }}
          onClick={onClick}
        >
          <span>
            <span>Explore {cat.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </button>
      </div>

      {/* Bottom strip — glows active color when this card is visible */}
      <div
        className={styles.activeStrip}
        style={{ background: '#8DC63F', opacity: isActive ? 1 : 0 }}
      />
    </div>
  )
}
