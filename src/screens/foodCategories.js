// ── Food category definitions ─────────────────────────────────────────────────
// Single unified food section — street food, warung, and restaurants all together.
// Swap videoUrl once you create the montage video with ffmpeg:
//   food-all.mp4  (concat: fresh.mp4 + makan.mp4 + noodle.mp4 + steak.mp4 + burger.mp4 + snacks.mp4)
export const FOOD_CATEGORIES = [
  {
    id: 'all',
    label: 'Food & Restaurants',
    emoji: '🍽',
    tagline: 'Warung, street food, restaurants & more',
    color: '#E8458C',
    videoUrl: '/videos/food-all.mp4',
    posterUrl: '/images/food-poster.jpg',
    withSound: true,
    gradient: 'linear-gradient(160deg, #1a000d 0%, #2d001a 50%, #0d0d0d 100%)',
  },
]
