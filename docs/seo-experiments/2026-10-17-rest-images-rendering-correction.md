# Rest-interval article image rendering correction

October 17, 2026, America/Los_Angeles. The owner reported that images do not appear at https://youraicoach.life/blog/how-long-to-rest-between-sets .

Both owned SVG URLs return HTTP 200 and image/svg+xml, but contain raw ampersands in XML text/attributes. Strict XML parsing fails at hero.svg line 21 column 147 and framework.svg line 1 column 140. The live browser reports naturalWidth=0 for the loaded hero. This establishes an image-decoding failure rather than a missing file or a CSS visibility issue.

Escape bare ampersands as &amp; in the two existing files. The displayed wording, artwork, image paths, article HTML, headings, metadata, video, internal links and discovery files are unchanged. No new content or material SEO experiment is introduced.

The active asset lock remains through November 6, with its existing review date and file list. The SEO lead reviewed this rendering exception under AGENTS.md. The guard recognizes only the complete-file digest transitions below, plus the matching committed correction records and this note. It cannot authorize arbitrary SVG edits or weaken a lock.

{
  "id": "rest-images-xml-rendering-2026-10-17",
  "kind": "svg-xml-rendering",
  "date": "2026-10-17",
  "reviewNote": "docs/seo-experiments/2026-10-17-rest-images-rendering-correction.md",
  "files": [
    {
      "file": "public/blog/assets/how-long-to-rest-between-sets/hero.svg",
      "baseSha256": "a5d47fec042d153e81abb38a2881cb8cd0889d69b87cb09b489a2ea68c3af3f8",
      "headSha256": "180c8c70c657ca3156207ee1a06b9fa4ab29b64e527a25bdc29f842f60162b62"
    },
    {
      "file": "public/blog/assets/how-long-to-rest-between-sets/framework.svg",
      "baseSha256": "a7ce3a436ed4284f198818c1a5a1cb4ab3cb60e2db7958b56904d1dedeb5d9a6",
      "headSha256": "036e0d216df317d92e91b844826ed49feaea65eff2e0eb723874707f167d7bab"
    }
  ]
}

Validation: strict XML parsing, no bare ampersands, unchanged article digest and exact asset-only escaping diff; focused experiment-guard tests; production build and existing object-media/article-video checks. Browser decoding and exact-hosting/live verification are required before reporting the repair live.

Completed pre-release checks: both SVGs parsed successfully and exactly match the base with bare ampersands escaped; the entire article HTML is byte-identical. The local browser decoded both images as 1200 × 630 after scrolling to load the lazy image. All 42 experiment-guard tests, production build and postbuild checks, owner-image policy, single-article blog-media policy and six-post article-video contract passed. Live verification remains pending deployment.
