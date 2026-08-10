# SEO Production Metrics

Each automated action stores a private baseline and a `reviewNotBefore` date.

## Refresh

Primary metrics:

- landing-page average position for the target query cluster;
- CTR at comparable average positions;
- clicks and impressions;
- number of ranking URLs for the same intent.

Earliest normal review: 21 days.

## Create

Primary metrics:

- indexation and first impressions;
- average position trajectory;
- clicks;
- whether the existing site URL loses visibility for the same intent.

Earliest normal review: 35 days.

## System health

- successful private GSC pulls;
- successful Gemini structured-output smoke;
- percentage of runs that correctly choose no publication;
- quality-gate rejection/repair rate;
- Pages deployment and live-marker verification success;
- open SEO automation health issue count.

The system should not optimize for article count. A high-quality no-action decision is a successful run when evidence or expected value is weak.
