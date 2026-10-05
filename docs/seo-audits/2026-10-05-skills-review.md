# SEO review: October 5, 2026

The build, discovery files and internal routes passed their checks. The rendered mobile review found a long template line overflowing the gym-accountability article. The initial review prepared a shared CSS correction; the [follow-up rendering release](2026-10-05-rendering-fixes.md) records its implementation and the wider mobile findings. The strongest current search opportunities sit in existing planning, progression and accountability pages; their evaluation windows and recrawl state should guide the next editorial action.

## Scope and skill use

| Skill | Applied work |
| --- | --- |
| `seo-audit` | Site-wide metadata/schema scan, discovery and internal-link validation, live route checks and mobile rendering |
| `seo-analysis` | Authenticated private query/page evidence, public-safe landing-page review, indexing and recrawl diagnosis, PageSpeed attempt |
| `seo-topic-research-pipeline` | Business context, opportunity inventory, live search-result review, intent ownership, product-fit filtering and sequencing |
| `humanizer` | Editorial review of the audit, integration guide and proposed comparison introduction; second read for cadence and factual drift |

The owner authorized full use of these skills. Repository context supplied the site, audience and commercial goal. The generic B2B onboarding and fixed keyword quota were adapted to the repository policy.

## Evidence and limits

The latest [public Search Console snapshot](https://github.com/jebbari-mohammed/website/issues/34) points to [workflow run 37290850033](https://github.com/jebbari-mohammed/website/actions/runs/37290850033). Its named encrypted artifact was downloaded and its SHA-256 digest verified. The connected private vault manifest, key fingerprint, RSA unwrapping, AES-GCM authentication, query/page dimensions, row count and reporting period all matched.

The period is September 7 through October 4, 2026. The public snapshot reports 158 private query/page rows, 29 landing pages, 424 impressions, 2 clicks, 0.47% CTR and impression-weighted average position 22.86. Exact rows informed private reasoning and are excluded from this report. This single period does not establish a traffic trend or a reliable uplift forecast.

Semrush reports were unavailable because the account had insufficient API units. PageSpeed Insights returned HTTP 429, so no performance score or field Core Web Vitals result was verified. Numeric search volumes, keyword difficulty, domain strength and conversion rates remain unavailable. Live web search identified competing formats; it did not establish a fixed Google result position or prove monthly search demand.

## Business context

IZEM connects workout planning, logged training, meals, progress, AI chat and eligible voice calls. The live homepage says the app is awaiting store review. The available website conversion route is the free workout-plan generator and relevant feature information; paid app availability and purchase conversion must not be assumed.

The audience includes people choosing a first workout plan, lifters comparing progression support, and people who need training, meals and accountability to work together. Geography, subscription revenue and measured conversion outcomes were not available. Medical, rehabilitation and hands-on form-coaching needs remain outside the product's stated scope.

## Technical and discovery findings

| Check | Result |
| --- | --- |
| Production build | Passed; pre-rendering and theme validation completed |
| Internal links | Passed: 456 pages and 10,112 links |
| Source sitemap | Current: 275 indexable canonical URLs |
| Indexable HTML metadata | 276 HTML documents; no missing canonical, missing description, duplicate title or H1-count issue |
| Canonical duplication | One intentional alias: `/ai-fitness-coach` points to `/izem-ai-fitness-coach/`; every canonical target is in the sitemap |
| JSON-LD syntax scan | No malformed blocks across the scanned generated pages |
| Structured-data synchronization tests | 2 passed |
| Live routes | All 12 checked routes returned HTTP 200 |
| Deep live review | Homepage plus four planning, progression, meal and accountability pages had metadata, viewport and parseable schema |
| Open Graph images | 157 indexable HTML documents lacked `og:image`; the live homepage and free weekly generator were among them |
| Mobile rendering | Four sampled pages fit a 390px viewport; the gym-accountability article had a 482px document width on a 390px viewport before correction |

Open Graph gaps deserve a separate image-preview and sharing review. They do not by themselves prove a ranking problem. Existing Article, application and breadcrumb markup should be maintained against current Google requirements. FAQ and HowTo markup must not be presented as currently available Google rich-result wins. [Current Google updates](https://developers.google.com/search/updates), [HowTo retirement](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

### Mobile rendering correction

The `.template code` block in `/blog/best-accountability-app-for-gym` contains long underscore blanks. Those unbroken strings extend beyond the reading column. Applying `.template { overflow-wrap: anywhere; }` in the browser reduced document width from 482px to 390px at a 390px viewport. The correction is added to `public/izem-theme.css`, which is loaded across the site.

This is a rendering correction under the repository's exception policy. The locked article source, title, body, schema, links and September 19 experiment definition are untouched; its October 10 lock remains in force. The correction has not been deployed. Local responsive and release checks passed as recorded below.

### Indexing and attribution

The public snapshot reports 23 indexed URLs, two unknown/neutral states and 11 source updates awaiting recrawl among the 25 inspected URLs. The inspection for `/blog/ai-personal-trainer-that-actually-works` predates its September rehabilitation and reports a historical noindex state. The live page currently returns HTTP 200, index/follow and its own canonical. Removing noindex again would not address the observed state.

The call-script article is discovered but has no recorded crawl in the snapshot. It has contextual incoming links from five indexable source pages, including the blog index and voice-call feature, so it is not orphaned. The rehabilitated trainer article has links from four indexable source pages. Preserve discovery and verify the next crawl instead of repeatedly rewriting either article.

Today's existing commit `dc523cea804f497104063850ffffd02512f79cb0` already added contextual body-recomposition links from four articles. This review adds no second material editorial experiment and preserves the unrelated workout-split and rest-between-sets drafts.

## Prioritized decisions

| Priority | Work | Evidence and condition | Next step |
| --- | --- | --- | --- |
| 1 | Correct mobile template wrapping | Reproduced 92px overflow on the gym-accountability page | Validate the shared CSS correction at small and desktop widths before release |
| 2 | Verify discovery and recrawl | One discovered article and several inspection results older than source revisions | Check fresh inspection results; preserve current indexability and contextual links |
| 3 | Evaluate the progression comparison | Public aggregate: 49 impressions, position 9.16; Google's recorded crawl predates the September revision | Review after recrawl, preferably October 11; use fresh private evidence before any snippet experiment |
| 4 | Protect adaptive planning's current test | Public aggregate: 95 impressions and one click for the workout-generator feature | Preserve the October 14 lock; evaluate the current version after its window |
| 5 | Qualify a distinct new utility | Rest/session-time tools appear in current search results, but volume and attainability are not established | Validate demand and inventory overlap before preparing a publishable brief |

No numerical click gain is forecast. A broad topic with credible demand and realistic competition should outrank a tiny query that is merely easy. Apply the policy's weighted criteria at the next decision with fresh evidence.

## Topic plan and ownership

The inventory below uses public page topics and current competitor pages. It contains no exact private Search Console query/page rows. Existing owners should absorb adjacent questions when the intent is the same.

| Opportunity | Proposed format or owner | Decision |
| --- | --- | --- |
| Adaptive workout planning | Existing workout-generator feature | Preserve test through October 14 |
| First weekly workout plan | Existing free workout-plan generator | Keep the free starting-plan intent distinct from premium adaptation |
| Equipment-based sessions | Existing equipment generator and home-gym guide | Preserve active tests; avoid another generic equipment URL |
| Automatic progression support | Existing progression comparison and tracker template | Evaluate current revision after recrawl |
| Combined training and meal planning | Existing meal-planning comparison | Evaluate preferred October 11 review after recrawl |
| Training-day nutrition changes | Existing workout-day meal-planner utility | Preserve test through October 17 |
| Gym accountability choices | Existing gym-accountability guide | Correct rendering; preserve the editorial test through October 10 |
| Private coach calls | Existing call-based fitness hub and voice-call feature | Preserve the current hub test through October 15 |
| Missed-session recovery | Existing reset map and fallback-workout guide | Keep reset and fallback intent distinct; no duplicate URL |
| Accountability scripts | Existing call-script utility | Support discovery and observe first crawl |
| Protein target and meal split | Existing protein calculator | Preserve test through October 20 |
| Workout splits | Existing weekly generator plus unrelated draft | Conditional: map the draft's intent before adding a separate URL |
| Rest periods and session duration | Possible utility supporting the existing rest-period draft | Conditional: verify demand; add time-budget value that existing tools do not provide |
| Fitbod comparisons | Existing comparison and alternatives assets | Check actual modifier demand; brand demand is not modifier demand |
| Hevy/Strong comparisons | Existing comparison assets | Avoid near-duplicate review pages; check current product facts first |
| Trainer business answering services | Professional communications product | Exclude: product and audience mismatch |

The rest/session-duration idea is a research candidate, not publication approval. The live results show calculators, which makes a generic article alone a weak format match. A useful version would explain the effect of rest intervals on a limited session budget, with transparent assumptions and careful health language. It still needs a verified demand signal, a fuller competition review and a non-overlapping intent check.

### Live research references

| Cluster | Current primary-source examples | Implication |
| --- | --- | --- |
| First workout plans | [FitCraft](https://getfitcraft.com/tools/ai-workout-generator), [Gymkee](https://gymkee.com/tools/ai-workout-generator/) | Visitors can get a concrete plan from a tool; information pages need a useful route to the existing generator |
| Progression apps | [Overload](https://progressiveoverloadfitnessapp.com/), [Unit](https://www.unitlift.app/) | Specialist products explain next-session guidance; compare documented behavior rather than vague AI claims |
| Combined training and food | [BodyPlus](https://bodyplusapp.com/workout-and-meal-planner-app/), [Exerprise listing](https://apps.apple.com/au/app/exerprise-workout-meal-planner/id1334788127) | Both product pages and store listings compete; explain how the two plans respond to changes |
| Accountability | [Ray](https://www.rayfit.com/blog/2026/03/best-app-for-workout-accountability/), [Coach Sal](https://getcoachsal.com/workout-accountability-app), [Pactive](https://pactive.com/) | Different accountability mechanisms already have detailed coverage; use product-specific evidence and availability disclosures |
| Split selection | [Mesostrength](https://mesostrength.com/tools/workout-split-generator), [Push/Pull](https://push-pull.app/workout-split-generator) | Tool intent is visible; verify overlap with the existing weekly generator |
| Rest and session time | [Itsha](https://itsha.com/tools/rest-time-calculator), [Health Calculator Online](https://healthcalculatoronline.com/rest-time-calculator/) | A time-budget utility may add value; numeric demand and ranking feasibility remain unverified |

These examples document current formats and task coverage. They do not establish domain-authority scores or prove that IZEM can outrank them.

## Editorial preparation

Several sampled introductions repeat a "Direct answer" opening and formulaic contrasts. Use the humanizer pass when a page is eligible for its next editorial review. The progression guide can open more plainly while keeping its existing product categories:

> If you want an app to recommend your next weight or rep target, look for documented progression and adjustment rules. A fast logger can be enough when you already follow a program and mainly need to see your last session. IZEM connects progression support with workouts, meals, scans, reviews, saved coaching context and accountability, so it serves a broader coaching job than a specialist lifting log.

This proposed paragraph is not a hands-on ranking and does not add competitor testing or user outcomes. Preserve the guide's source-check date, methodology disclosure, citations, availability qualifications and health scope if a future review uses it. The existing page was not rewritten.

## Final local verification

The rebuilt accountability page passed at viewport widths of 320, 375, 390, 768 and 1280 pixels. Document width matched the viewport at every size. The homepage, workout-generator feature, progression comparison and meal-planning comparison also passed the 390px check against the corrected build.

The final production build and theme normalization passed. The critical-route check covered 460 pages and 10,175 internal links. Source JSON-LD validation passed for 461 blocks across 459 HTML files; built JSON-LD validation passed for 463 blocks across 460 files. The link checker passed for 456 pages and 10,112 links, and the sitemap remained current at 275 canonical URLs. All 36 existing brand-theme tests and the two structured-data synchronization tests passed.

The local active-experiment check found no protected target changes or lock mutations. The accountability article source was verified byte-for-byte against HEAD. The temporary plaintext Search Console file and copied private key were deleted after the decision. The installed skill files, integration references and relative Markdown dependencies were also verified.

At the end of this initial review, the CSS correction and repository workflow changes were local. The production-route checks above describe the deployed site before the rendering correction. See the follow-up rendering release for subsequent implementation and verification.
