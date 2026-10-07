# Article video recovery

The existing daily-video-tts workflow remains the only article video publisher. Its push trigger processes one new English article; the hourly recovery trigger finds missing dedicated videos. No second uploader or recurring job is introduced.

1. Reconcile any matching existing YouTube upload and verify its exact title, canonical article, validation stamp, public visibility and processing status before reuse.
2. Attempt native generation at most once per article. Persist the spending checkpoint to main before making the provider request. The separately authorized exact-run native retry is unchanged and is not an unlimited retry mechanism.
3. When native generation or requested recovery fails, synthesize a reviewed article-specific narration with the existing Gemini key, then use the same deterministic object-only renderer. A missing native video is not required by this fallback.
4. Prefer an editorial narration manifest in data/marketing-employee/narrations/<slug>.json. It must match the canonical URL and either the source digest or exact approved Git blob. Without a manifest, speak selected existing article passages and label them as such; never ask a model to invent a script.
5. Narration is limited to two provider attempts per article with a six-hour cooldown. The checkpoint is committed before the request, so a crashed runner does not reset the budget. Source edits do not silently reset counters. A failed checkpoint aborts before spending. No key rotation or rate-limit bypass is performed.
6. Require a valid audio track and plausible duration, real MP4 encoding, the existing people-free classifier, and the unchanged public YouTube verification. Only then embed the exact video, update its completion record, refresh discovery and run the normal hosting deployment.

The source and narration hashes in attempt files are operational checkpoints, not publication approvals. Never set people_free_validated or a completed record just because generation returned a file. If both providers are unavailable, leave the article pending and the deployment gate closed rather than release it without its video.

The WAV fallback uses the official Gemini Interactions REST API with gemini-3.8-flash-lite-tts, avoiding an unrelated SDK upgrade. The response must contain one WAV audio block. Narration is verbatim reviewed text; style is supplied separately. Reference: https://ai.google.dev/gemini-api/docs/speech-generation

Run tests with node --test tools/ai-marketing/article-video-fallback.test.mjs tools/ai-marketing/youtube-publication*.test.mjs tools/ai-marketing/object-only-video*.test.mjs. The media tests require ffmpeg and ffprobe. A synthetic tone in a test is never a public article video.
