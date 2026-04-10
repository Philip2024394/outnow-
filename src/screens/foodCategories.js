// ── Food category definitions ─────────────────────────────────────────────────
// 2 master categories — each covers a broad food type.
// Swap videoUrl values once you create the montage videos with ffmpeg:
//   street-food-indonesia.mp4  (concat: fresh.mp4 + makan.mp4 + noodle.mp4 + snacks.mp4 + vegi.mp4 + cool-rice.mp4)
//   restaurant-western.mp4     (concat: steak.mp4 + burger.mp4 + fish.mp4 + desert.mp4 + drinks.mp4 + breakft-indonesia.mp4)
export const FOOD_CATEGORIES = [
  {
    id: 'street_food',
    label: 'Street Food',
    emoji: '🛺',
    tagline: 'Warung, sate, bakso, nasi goreng & more',
    color: '#F59E0B',
    videoUrl: '/videos/street-food-indonesia.mp4',
    posterUrl: '/images/street-food-poster.jpg',
    withSound: true,
    gradient: 'linear-gradient(160deg, #1a0d00 0%, #2d1800 50%, #0d0d0d 100%)',
  },
  {
    id: 'all',
    label: 'Restaurant & Western',
    emoji: '🍽',
    tagline: 'Steak, burger, seafood, fine dining & more',
    color: '#38bdf8',
    videoUrl: '/videos/restaurant-western.mp4',
    posterUrl: '/images/restaurant-western-poster.jpg',
    gradient: 'linear-gradient(160deg, #001520 0%, #002030 50%, #0d0d0d 100%)',
  },
]
