import { load } from 'cheerio'

// This exception records one owner-approved release. A config change cannot
// expand it to a different listing, document, or approval without code review.
const approvedLinks = Object.freeze({
  apple: 'https://apps.apple.com/app/id6760679807',
  google: 'https://play.google.com/store/apps/details?id=com.ai.gym.coach',
})
const approvedFile = 'download/index.html'
const approvedReview = 'docs/seo-experiments/2026-10-22-google-play-availability.md'
const pendingNotice = 'IZEM is available on Google Play for Android. The iOS App Store listing is not yet available.'

function matchesPinnedLinks(value) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 2 &&
    value.apple === approvedLinks.apple && value.google === approvedLinks.google
}

export function isOwnerApprovedPendingStoreLink(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false
  const { htmlFile, html, url, approval, configuredLinks } = input
  const href = typeof url === 'string' ? url : url instanceof URL ? url.href : ''
  if (htmlFile !== approvedFile || typeof html !== 'string' ||
      href !== approvedLinks.apple || !matchesPinnedLinks(configuredLinks)) return false
  if (!approval || approval.version !== 2 ||
      approval.status !== 'owner-approved-pending-apple-listing' || approval.approvedAt !== '2026-10-22' ||
      approval.reviewNote !== approvedReview || approval.allowedFile !== approvedFile ||
      !matchesPinnedLinks(approval.urls)) return false

  const $ = load(html)
  const noindex = $('head > meta[name]').toArray().some((element) =>
    ($(element).attr('name') || '').trim().toLowerCase() === 'robots' &&
    ($(element).attr('content') || '').toLowerCase().split(/[\s,]+/).includes('noindex'))
  if (!noindex) return false

  const isInert = (element) => $(element).parents().addBack().toArray().some((ancestor) => {
    const node = $(ancestor)
    return node.is('script, style, template, noscript, [hidden]') ||
      /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|opacity\s*:\s*0(?:\.0+)?)\s*(?:!important\s*)?(?:;|$)/i
        .test(node.attr('style') || '')
  })
  const hasNotice = $('main p').toArray().some((element) =>
    $(element).text().replace(/\s+/g, ' ').trim() === pendingNotice && !isInert(element))
  if (!hasNotice) return false

  const anchors = $('body a.store[href]')
  const destinations = anchors.toArray().map((element) => $(element).attr('href'))
  if (anchors.length !== 2 || destinations.filter((destination) => destination === approvedLinks.apple).length !== 1 ||
      destinations.filter((destination) => destination === approvedLinks.google).length !== 1 ||
      anchors.toArray().some(isInert)) return false

  // The approved destinations must occur only in these two store links. A URL
  // elsewhere in text, script, schema, or an unrelated anchor stays blocked.
  anchors.remove()
  const remainder = $.html()
  return !Object.values(approvedLinks).some((destination) => remainder.includes(destination))
}
