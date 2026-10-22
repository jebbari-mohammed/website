import assert from 'node:assert/strict'
import test from 'node:test'
import { isOwnerApprovedPendingStoreLink } from './store-link-policy.mjs'

const links = {
  apple: 'https://apps.apple.com/app/id6760679807',
  google: 'https://play.google.com/store/apps/details?id=com.ai.gym.coach',
}
const approval = {
  version: 2,
  status: 'owner-approved-pending-apple-listing',
  approvedAt: '2026-10-22',
  reviewNote: 'docs/seo-experiments/2026-10-22-google-play-availability.md',
  allowedFile: 'download/index.html',
  urls: { ...links },
}
const notice = 'IZEM is available on Google Play for Android. The iOS App Store listing is not yet available.'
const storeAnchors = `<div class="stores"><a class="store" href="${links.apple}">Apple App Store</a><a class="store" href="${links.google}">Google Play</a></div>`
const html = `<!doctype html><html><head><meta name="robots" content="noindex, follow"></head><body><main><p>${notice}</p>${storeAnchors}</main></body></html>`
const input = (changes = {}) => ({ htmlFile: 'download/index.html', html, url: links.apple,
  approval: structuredClone(approval), configuredLinks: { ...links }, ...changes })

test('allows the exact pending Apple store link only on the noindex chooser', () => {
  for (const url of [links.apple, new URL(links.apple)]) {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ url })), true)
  }
})

test('does not grant a pending-store exception to the available Google Play listing', () => {
  for (const url of [links.google, new URL(links.google)]) {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ url })), false)
  }
})

test('accepts case-insensitive robots metadata and harmless notice whitespace', () => {
  const edited = html.replace('name="robots" content="noindex, follow"', 'name="ROBOTS" content="NoIndex, FOLLOW"')
    .replace(notice, notice.replace(' available ', '\n  available '))
  assert.equal(isOwnerApprovedPendingStoreLink(input({ html: edited })), true)
})

for (const htmlFile of ['index.html', 'blog/index.html', 'public/download/index.html', '/download/index.html',
  'download/../download/index.html', 'download/index.html?approved', 'download\\index.html']) {
  test(`rejects another or nonexact file: ${htmlFile}`, () => {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ htmlFile })), false)
  })
}

for (const url of ['https://apps.apple.com/app/your-ai-coach', 'https://apps.apple.com/app/id1234567890',
  'https://play.google.com/store/apps/details?id=com.other.app', `${links.google}&ref=campaign`,
  `${links.apple}/`, links.apple.replace('https:', 'http:'),
  'https://apps.apple.com.evil.example/app/id6760679807', 'https://example.com/']) {
  test(`rejects unapproved URL: ${url}`, () => {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ url })), false)
  })
}

for (const [name, change] of [
  ['missing approval', () => null],
  ['wrong version', (record) => ({ ...record, version: '2' })],
  ['wrong status', (record) => ({ ...record, status: 'approved' })],
  ['arbitrary availability status', (record) => ({ ...record, status: 'all-stores-available' })],
  ['stale release version', (record) => ({ ...record, version: 1 })],
  ['stale pending-listings status', (record) => ({ ...record, status: 'owner-approved-pending-listings' })],
  ['stale approval date', (record) => ({ ...record, approvedAt: '2026-10-12' })],
  ['stale review note', (record) => ({ ...record, reviewNote: 'docs/seo-experiments/2026-10-12-platform-download-button.md' })],
  ['changed date', (record) => ({ ...record, approvedAt: '2026-10-13' })],
  ['missing date', (record) => { delete record.approvedAt; return record }],
  ['changed review note', (record) => ({ ...record, reviewNote: 'docs/another-approval.md' })],
  ['changed allowed file', (record) => ({ ...record, allowedFile: 'index.html' })],
  ['missing Apple approval', (record) => { delete record.urls.apple; return record }],
  ['changed Google approval', (record) => ({ ...record, urls: { ...record.urls, google: 'https://example.com/' } })],
  ['extra approved URL', (record) => ({ ...record, urls: { ...record.urls, unrelated: 'https://example.com/' } })],
]) {
  test(`rejects ${name}`, () => {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ approval: change(structuredClone(approval)) })), false)
  })
}

test('rejects changed or missing configuration, even when approval is changed to match', () => {
  for (const configuredLinks of [undefined, {}, { google: links.google },
    { ...links, apple: 'https://apps.apple.com/app/your-ai-coach' },
    { ...links, google: 'https://play.google.com/store/apps/details?id=com.other.app' },
    { ...links, extra: 'https://example.com/' }]) {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ configuredLinks,
      approval: { ...approval, urls: configuredLinks } })), false)
  }
})

for (const [name, edited] of [
  ['missing robots metadata', html.replace('<meta name="robots" content="noindex, follow">', '')],
  ['indexable metadata', html.replace('noindex, follow', 'index, follow')],
  ['noindex substring', html.replace('noindex, follow', 'not-noindex, follow')],
  ['Google-only exclusion', html.replace('name="robots"', 'name="googlebot"')],
  ['metadata inside an inert template', html.replace('<meta name="robots" content="noindex, follow">', '<template><meta name="robots" content="noindex, follow"></template>')],
  ['missing visible notice', html.replace(`<p>${notice}</p>`, '')],
  ['stale pending-review notice', html.replace(notice, 'Store links may be unavailable while the app is awaiting review.')],
  ['hidden notice', html.replace(`<p>${notice}</p>`, `<p hidden>${notice}</p>`)],
  ['notice in a script', html.replace(`<p>${notice}</p>`, `<script>const notice = ${JSON.stringify(notice)};</script>`)],
  ['non-anchor store references', html.replaceAll('<a class="store"', '<div class="store"').replaceAll('</a>', '</div>')],
  ['store URLs only in a script', html.replace(storeAnchors, `<script>const stores = ${JSON.stringify(links)};</script>`)],
  ['anchors in a template', html.replace(storeAnchors, `<template>${storeAnchors}</template>`)],
  ['hidden store anchors', html.replace('<div class="stores">', '<div class="stores" style="display:none">')],
  ['wrong anchor class', html.replaceAll('class="store"', 'class="unrelated"')],
  ['missing Apple anchor', html.replace(`<a class="store" href="${links.apple}">Apple App Store</a>`, '')],
  ['duplicate Google anchors', html.replace(links.apple, links.google)],
  ['unapproved third store anchor', html.replace('</main>', '<a class="store" href="https://example.com/">Another store</a></main>')],
  ['approved URL in unrelated anchor', html.replace('</main>', `<a href="${links.google}">Unrelated CTA</a></main>`)],
  ['approved URL additionally in script', html.replace('</main>', `<script>const destination = ${JSON.stringify(links.google)};</script></main>`)],
]) {
  test(`rejects chooser with ${name}`, () => {
    assert.equal(isOwnerApprovedPendingStoreLink(input({ html: edited })), false)
  })
}

test('fails closed for missing input or non-string HTML', () => {
  assert.equal(isOwnerApprovedPendingStoreLink(), false)
  assert.equal(isOwnerApprovedPendingStoreLink(null), false)
  assert.equal(isOwnerApprovedPendingStoreLink('approved'), false)
  assert.equal(isOwnerApprovedPendingStoreLink([]), false)
  assert.equal(isOwnerApprovedPendingStoreLink(input({ html: null })), false)
  assert.equal(isOwnerApprovedPendingStoreLink(input({ url: null })), false)
})
