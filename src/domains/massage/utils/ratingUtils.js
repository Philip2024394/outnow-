/**
 * Rating utility functions for therapists and massage places.
 * Converted from ratingUtils.ts — TypeScript removed, logic identical.
 */

export const DEFAULT_RATING = 4.8
export const DEFAULT_REVIEW_COUNT = 0

/**
 * Gets the display rating for a therapist or place.
 * New providers start with 4.8 rating, adjusts as real reviews come in.
 */
export const getDisplayRating = (rating, reviewCount) => {
  if (!reviewCount || reviewCount === 0) return DEFAULT_RATING
  if (!rating || rating <= 0) return DEFAULT_RATING
  return rating
}

/**
 * Gets the display review count.
 */
export const getDisplayReviewCount = (reviewCount) => {
  return reviewCount || DEFAULT_REVIEW_COUNT
}

/**
 * Formats rating for display (1 decimal place).
 */
export const formatRating = (rating) => {
  return rating.toFixed(1)
}

/**
 * Checks if a provider is new (no reviews yet).
 */
export const isNewProvider = (reviewCount) => {
  return !reviewCount || reviewCount === 0
}

/**
 * Gets initial rating data for new providers.
 */
export const getInitialRatingData = () => {
  return { rating: DEFAULT_RATING, reviewCount: DEFAULT_REVIEW_COUNT }
}
