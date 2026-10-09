// These existing homepage app previews are decorative media, not watch-page
// videos. Keep the exclusions exact so real guides and thumbnails stay indexable.
export const decorativeVideoPaths = [
  '/videos/izem-coach-chat-dark-web.mp4',
  '/videos/izem-workout-nutrition-dark-web.mp4',
]

export const decorativePosterPaths = [
  '/images/hero1-desktop.webp',
  '/images/hero2-desktop.webp',
]

export function hasExactNoindexHeader(hosting, resourcePath) {
  return (hosting.headers || []).some((rule) => rule.source === resourcePath &&
    rule.headers?.some((header) => header.key.toLowerCase() === 'x-robots-tag' &&
      header.value.toLowerCase().split(/[\s,]+/).includes('noindex')))
}
