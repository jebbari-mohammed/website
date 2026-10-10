import heroPreviewMedia from '../src/content/hero-preview-media.json' with { type: 'json' }

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
export const decorativePosterUrls = heroPreviewMedia.map((preview) =>
  `${preview.posterPath}?v=${preview.posterSha256.slice(0, 12)}`)

export function hasExactNoindexHeader(hosting, resourcePath) {
  const versionedPosterIndex = decorativePosterUrls.indexOf(resourcePath)
  const headerPath = versionedPosterIndex < 0 ? resourcePath : decorativePosterPaths[versionedPosterIndex]
  return (hosting.headers || []).some((rule) => rule.source === headerPath &&
    rule.headers?.some((header) => header.key.toLowerCase() === 'x-robots-tag' &&
      header.value.toLowerCase().split(/[\s,]+/).includes('noindex')))
}
