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
    label: 'IN THE STREET',
    emoji: '🍽',
    tagline: 'Everything near you',
    color: '#F59E0B',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/makan.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvbWFrYW4ubXA0IiwiaWF0IjoxNzc1NzYwNDUxLCJleHAiOjIwOTExMjA0NTF9.m8BVMh8JqQ_BQCeRXgV_ND8IORN4bhqkiGgrRDgu5wE',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a1200 0%, #2d2000 50%, #0d0d0d 100%)',
  },
  {
    id: 'street_food',
    label: 'Street Food',
    emoji: '🛺',
    tagline: 'Warung, sate, gorengan & more',
    color: '#F59E0B',
    videoUrl:  null,
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0d00 0%, #2d1800 50%, #0d0d0d 100%)',
  },
  {
    id: 'rice',
    label: 'Rice Dishes',
    emoji: '🍚',
    tagline: 'Comfort in every grain',
    color: '#F59E0B',
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
    color: '#F59E0B',
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
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/desert.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvZGVzZXJ0Lm1wNCIsImlhdCI6MTc3NTc2MjAyNywiZXhwIjoyMDkxMTIyMDI3fQ.831NMRUM3WnBwYXCRAD91pw2ZkiPQgpoT8XnPgDko80',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0015 0%, #280020 50%, #0d0d0d 100%)',
  },
  {
    id: 'drinks',
    label: 'Drinks & Juice',
    emoji: '🥤',
    tagline: 'Refresh your world',
    color: '#a78bfa',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/drinks.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvZHJpbmtzLm1wNCIsImlhdCI6MTc3NTc1Nzc0NiwiZXhwIjoyMDkxMTE3NzQ2fQ.tXm_IMzicZrQoJ-ceVifxowRDiHe0Uy7pvJqyg2T6hw',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #0d0020 0%, #150030 50%, #0d0d0d 100%)',
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    emoji: '🌅',
    tagline: 'Start the day right',
    color: '#fb923c',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/breakft%20indonisea.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvYnJlYWtmdCBpbmRvbmlzZWEubXA0IiwiaWF0IjoxNzc1NzYxNTY5LCJleHAiOjIwOTExMjE1Njl9.3cAy4fm8DAZvuzfntSGY2GJ_KgW1H_MObvKIDwlzj48',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #1a0c00 0%, #2d1a00 50%, #0d0d0d 100%)',
  },
  {
    id: 'snacks',
    label: 'Snacks',
    emoji: '🍿',
    tagline: 'Always hungry for more',
    color: '#4ade80',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/snacks.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3Mvc25hY2tzLm1wNCIsImlhdCI6MTc3NTc2MTY2NiwiZXhwIjoyMDkxMTIxNjY2fQ.z6jnpz-tsYsPKYzwoa0iw4fUWD6i1IZpi3wONrvy6iM',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #001a0a 0%, #002810 50%, #0d0d0d 100%)',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    emoji: '🥗',
    tagline: 'Clean. Green. Delicious.',
    color: '#22c55e',
    videoUrl:  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/sign/category-videos/vegi.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mN2EwYjVlOC05MWUxLTRkMTAtYmU3ZC1kMzcyM2FhY2ZjZTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjYXRlZ29yeS12aWRlb3MvdmVnaS5tcDQiLCJpYXQiOjE3NzU3NjIyMDksImV4cCI6MjA5MTEyMjIwOX0.G53NKNh8-KqMGoDKZHXUqkLfRaAZHQ_maXpfkMfIAE8',
    posterUrl: null,
    gradient: 'linear-gradient(160deg, #001508 0%, #002210 50%, #0d0d0d 100%)',
  },
]

// ── Demo avatars — replaced by real users when live ──────────────────────────
const DEMO_AVATARS = [
  { id: 'd1', photo_url: 'https://i.pravatar.cc/100?img=1',  name: 'Sari' },
  { id: 'd2', photo_url: 'https://i.pravatar.cc/100?img=5',  name: 'Budi' },
  { id: 'd3', photo_url: 'https://i.pravatar.cc/100?img=9',  name: 'Rina' },
  { id: 'd4', photo_url: 'https://i.pravatar.cc/100?img=14', name: 'Dian' },
  { id: 'd5', photo_url: 'https://i.pravatar.cc/100?img=20', name: 'Agus' },
  { id: 'd6', photo_url: 'https://i.pravatar.cc/100?img=25', name: 'Tini' },
  { id: 'd7', photo_url: 'https://i.pravatar.cc/100?img=33', name: 'Wahyu' },
  { id: 'd8', photo_url: 'https://i.pravatar.cc/100?img=44', name: 'Dewi' },
  { id: 'd9', photo_url: 'https://i.pravatar.cc/100?img=52', name: 'Fajar' },
]

// ── Time-of-day viewer count — Yogyakarta activity curve ─────────────────────
// Based on: Jogja pop 3.72M, 175K+ students, GoFood peak data
// Breakfast 06–08 | Lunch rush 11:30–13:30 | Dinner 18–21 | Late night 21–23
const HOUR_RANGES = {
  //  hour  : [min, max]
  0:  [7,  12],   // early morning — night owls, students
  1:  [7,  10],   // very quiet
  2:  [7,   9],
  3:  [7,   8],
  4:  [7,   9],
  5:  [7,  14],   // pre-dawn, early risers
  6:  [12, 28],   // breakfast rush begins
  7:  [18, 35],   // peak breakfast
  8:  [15, 28],   // post-breakfast
  9:  [10, 20],   // mid-morning lull
  10: [12, 24],   // pre-lunch browsing
  11: [28, 48],   // lunch rush building
  12: [38, 60],   // PEAK LUNCH
  13: [32, 55],   // peak lunch continues
  14: [20, 35],   // post-lunch
  15: [14, 25],   // afternoon dip
  16: [15, 28],   // after school/campus
  17: [22, 40],   // early dinner browsing
  18: [35, 58],   // PEAK DINNER
  19: [38, 60],   // peak dinner
  20: [32, 55],   // dinner continues
  21: [25, 48],   // late night — student heavy
  22: [20, 38],   // late night
  23: [12, 22],   // winding down
}

// Generate N unique viewer counts spread across 1–90.
// Time-of-day biases the density band but counts never repeat
// and are always at least MIN_GAP apart so no two cards look the same.
const MIN_GAP = 7

function generateSpreadCounts(n) {
  const hour = new Date().getHours()
  const [bandMin, bandMax] = HOUR_RANGES[hour] ?? [7, 30]
  // Scale band to 1–90 with some spread outside it for variety
  const lo = Math.max(1,  bandMin - 5)
  const hi = Math.min(90, bandMax + 10)

  const counts = new Set()
  let attempts = 0
  while (counts.size < n && attempts < 500) {
    attempts++
    const v = Math.floor(Math.random() * (hi - lo + 1)) + lo
    // Ensure no existing count is within MIN_GAP
    const tooClose = [...counts].some(c => Math.abs(c - v) < MIN_GAP)
    if (!tooClose) counts.add(v)
  }
  // If we ran out of room in the band, fill remaining from full 1–90
  while (counts.size < n) {
    const v = Math.floor(Math.random() * 90) + 1
    const tooClose = [...counts].some(c => Math.abs(c - v) < MIN_GAP)
    if (!tooClose) counts.add(v)
  }
  // Shuffle so high/low numbers aren't always in the same card slot
  return [...counts].sort(() => Math.random() - 0.5)
}

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

  // One unique spread count per category — regenerated every 60s
  const catCount = FOOD_CATEGORIES.filter(c => c.id !== 'all').length
  const [viewerCounts, setViewerCounts] = useState(() => generateSpreadCounts(catCount))

  useEffect(() => {
    const id = setInterval(() => setViewerCounts(generateSpreadCounts(catCount)), 60000)
    return () => clearInterval(id)
  }, [catCount])

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
            placeholder="Search In The Street — warung, dish, cuisine…"
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
        {FOOD_CATEGORIES.map((cat, i) => {
          const nonAllIndex = FOOD_CATEGORIES.filter(c => c.id !== 'all').findIndex(c => c.id === cat.id)
          return (
            <CategoryCard
              key={cat.id}
              cat={cat}
              isActive={i === activeIndex}
              videoRef={el => { videoRefs.current[i] = el }}
              onClick={() => handleCategoryTap(cat)}
              viewerCount={nonAllIndex >= 0 ? viewerCounts[nonAllIndex] : null}
            />
          )
        })}
      </div>

    </div>
  )
}

// ── Now In Kitchen widget ─────────────────────────────────────────────────────
function NowInKitchen({ categoryId, viewerCount }) {
  const [viewers,    setViewers]    = useState([])
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
      setVisibleSet(users.slice(0, 5))
    }
    load()
  }, [categoryId])

  // Cycle visible avatars every 5s with a fade crossfade
  useEffect(() => {
    const avatarId = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setVisibleSet(prev => {
          if (viewers.length <= 5) return viewers.slice(0, 5)
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

    return () => clearInterval(avatarId)
  }, [viewers])

  if (!visibleSet.length || viewerCount == null) return null

  const extra = Math.max(0, viewerCount - 5)

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
function CategoryCard({ cat, isActive, videoRef, onClick, viewerCount }) {
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
      {cat.id !== 'all' && <NowInKitchen categoryId={cat.id} viewerCount={viewerCount} />}

      {/* Bottom: tagline + name + CTA */}
      <div className={styles.cardBottom}>
        <span className={styles.tagline}>{cat.tagline}</span>
        <h2 className={styles.categoryName}>{cat.label}</h2>

        <button
          className={styles.explorBtn}
          style={{ background: '#F59E0B' }}
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
        style={{ background: '#F59E0B', opacity: isActive ? 1 : 0 }}
      />
    </div>
  )
}
