# SEO Experiment: Adaptive GSC Index Monitoring

- **Status:** launched
- **Launch date:** 2026-08-20
- **Action class:** technical SEO observability
- **Owner:** ChatGPT senior SEO lead

## First-party baseline

The freshest 2026-08-20 Search Console health run covers 2026-07-23 through 2026-08-19 and returned 38 private query + landing-page rows, 54 impressions, and 0 clicks. The public-safe landing-page aggregate showed 10 public landing pages receiving impressions. URL Inspection was still driven by a fixed list of 18 URLs and inspected 10 as indexed, 8 as neutral/unknown, with 0 API errors.

A material content experiment had already launched earlier the same day at `/blog/progressive-overload-tracker-template`, followed by its video integration. That new URL did not exist when the morning Search Console health run started and therefore was not part of the 18-URL inspection set.

The safe landing-page aggregate also showed GSC-visible URLs such as `/blog/workout-reminder-app-that-calls-you` that were not in the fixed inspection list. This created a measurement gap: pages could begin receiving Search Console visibility without automatically entering URL Inspection monitoring.

## Chosen action

Keep the existing fixed priority set, add today's progressive-overload tracker experiment to it, and supplement the fixed set with the highest-impression same-origin landing pages from the private Search Analytics report generated earlier in the same health run. The final inspection set remains capped at 25 URLs.

The priority builder uses only landing-page URLs and aggregate impression counts. Query strings are neither returned nor logged.

## Hypothesis

Adaptive monitoring will reduce blind spots between Search Console performance and URL Inspection state. New experiments can be monitored immediately through the fixed set, while existing pages that unexpectedly begin earning impressions can enter the inspection set automatically without requiring another manual code edit.

## Baseline

- Fixed URL Inspection set: **18 URLs**.
- Indexed in latest run: **10/18**.
- Neutral/unknown in latest run: **8/18**.
- API errors: **0**.
- GSC-visible landing pages in safe snapshot: **10**.
- Today's new progressive-overload tracker: **not yet monitored** in the morning run.
- At least one GSC-visible core page (`/blog/workout-reminder-app-that-calls-you`) was outside the fixed inspection set.

## Target metrics

1. Today's new progressive-overload tracker appears in the next URL Inspection report.
2. GSC-visible same-origin landing pages not already fixed are added automatically, up to the 25-URL safety cap.
3. Fixed priority URLs are never displaced by dynamic candidates.
4. URL Inspection API errors remain at 0.
5. No Search Console query string is exposed by the priority-selection helper, logs, or safe snapshot.

## Expected direction

- Active experiment monitoring coverage: incomplete → complete for the new tracker.
- GSC-visible-page monitoring: static/manual → adaptive within the cap.
- Time from first GSC visibility to URL Inspection coverage: manual-code-change dependent → next health run.
- Query privacy: unchanged; exact queries remain private.

## Review window

- **Immediate technical validation:** CI tests and the first post-merge Search Console health run.
- **Earliest operational review:** 2026-08-21, after the next scheduled health check.
- Keep this architecture unless it produces API errors, exceeds the 25-URL design limit, leaks private query evidence, or proves too noisy for useful prioritization.

## Risks and controls

- A surge of many landing pages could fill the 25-URL cap. Fixed priorities are inserted first, so dynamic pages cannot displace them.
- Search Console can surface low-value pages. Dynamic candidates are sorted by total impressions and are added only after fixed strategic URLs.
- External or malformed page URLs are ignored; only URLs on the Search Console property origin are eligible.
- If the private Search Analytics report is unavailable, the monitor safely falls back to the fixed priority set.
