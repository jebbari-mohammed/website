# Video watch-page rendering correction

## Observed behavior

The site already has 56 dedicated `/youtube/<id>/` pages, self-canonical URLs,
direct YouTube iframes and a video sitemap. Article pages link to those watch
pages. This correction strengthens the existing architecture rather than
creating competing pages or converting articles into video landing pages.

The previous 16:9 player fell below YouTube's 200-pixel minimum height on narrow
phones: a 360px viewport left 312px of content width and a 175.5px-high player.
Long titles also preceded the player. On the homepage, React loads supplementary
app-preview clips after hydration and scrolling; those clips are not standalone
video guides.

## Changes

- Put the single player first inside each watch page's main content. The unchanged
  title and supporting text follow it.
- Keep a 200px minimum player height, declare iframe dimensions and eager loading,
  and connect each existing VideoObject to its WebPage main entity.
- Add `X-Robots-Tag: noindex` only to the two decorative homepage MP4 files and
  their two existing poster images. Their appearance and playback are unchanged.
  The posters are excluded from image indexing as well. Homepage HTML, articles,
  watch pages and the 56 people-free guide thumbnails remain indexable.
- Validate native and privacy-enhanced video embeds, canonical identity and
  primary-player placement in the existing link check. Only the explicitly
  excluded native homepage previews are exempt from the watch-page requirement.
- Add a deterministic browser check to the production build. It exercises both
  homepage preview groups after hydration, scrolling and tab changes, then checks
  narrow and desktop watch layouts, including the longest title. External
  services are blocked during this layout check; real YouTube availability is
  a separate live check.

No article, product, title, description, publication-date, catalog or thumbnail
content is rewritten. No new blog URL is created, and experiment locks remain
unchanged.

## Verification and Google validation

Run the existing source/media/JSON-LD/sitemap checks, `pnpm build`, critical-route
and link checks, and the normal PR release gates. The build now fails if the
rendered-video check cannot complete; a skipped browser launch is not a pass.
After release, verify the exact media headers and updated watch markup on the
custom domain, as well as a representative player in a browser.

Google's report can retain older article or homepage detections until recrawling.
Media exclusion is documented, but it does not guarantee immediate disappearance
of a "Video isn't on a watch page" report row. Review the failed URL list and
crawl timestamps in Search Console, then start a new validation after the
previous attempt has failed. The video sitemap can scope validation to the
actual watch pages. Neither green CI nor a successful deployment proves that
Google has indexed a video or accepted the validation.

## Primary references

- [Google video SEO guidance](https://developers.google.com/search/docs/appearance/video)
- [Search Console video indexing and validation](https://support.google.com/webmasters/answer/9495631?hl=en)
- [Noindex headers for non-HTML resources](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [YouTube embedded player size requirements](https://developers.google.com/youtube/player_parameters)
