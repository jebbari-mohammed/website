# SEO Experiment: Homepage Comparison Trust

- **Status:** launched
- **Launch date:** 2026-08-21
- **Action class:** trust/editorial transparency, organic conversion, AI-search hygiene
- **Target surfaces:** homepage differentiation/comparison sections and `/llms.txt`
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The private Search Console report for 2026-07-24 through 2026-08-20 was authenticated and decrypted successfully: 43 query + landing-page rows, 61 impressions, and 0 clicks. The canonical IZEM product URL received 3 impressions at an average position of 6, showing that Google is already testing an IZEM-branded navigational result even though the sample remains small.

Several material content and observability changes had already landed today, so another article or keyword-page rewrite would create unnecessary experiment overlap. A separate trust and conversion issue on the homepage had clearer evidence and lower cannibalization risk.

## Confirmed problem

The live homepage used a named competitor matrix with exact monthly prices and unsupported yes/no feature assertions. Those claims had no visible sourcing or verification date and could become inaccurate as products and pricing change.

An adjacent differentiation section also described all “Other Apps” through blanket negative statements. Even without naming brands, those statements implied unsupported category-wide competitor behavior and weakened the more transparent comparison policy.

The public `/llms.txt` file repeated competitor claims and pricing, included instructions directed at AI systems, and described implementation details that can become stale. Google states that normal SEO fundamentals apply to AI features and that no special AI text file or special schema is required.

This conflicted with IZEM's current editorial policy:

- do not fabricate or preserve unverified competitor features or prices;
- do not make blanket competitor claims without a defined, supportable methodology;
- do not rely on invented GEO/AEO files;
- keep important claims in visible, user-facing content;
- ensure structured information matches the product's real public scope.

## Opportunity shortlist

1. **Replace volatile competitor comparison with first-party decision frameworks — chosen.** High trust and conversion relevance, immediate defect evidence, no cannibalization, and low dependency on uncertain query volume.
2. **Change the product-page title for the early branded query.** Potential CTR leverage, but only 3 impressions exist, so changing metadata now would be premature.
3. **Refresh the workout-reminder page for exercise-reminder variants.** The page has early visibility, but it was modified recently and remains inside its title/content evaluation window.
4. **Publish another new keyword page.** Normally useful during cold start, but inferior today because a material content rehabilitation already happened and existing URLs are beginning to earn query evidence.

## Change

The homepage differentiation and comparison sections now:

- use decision-focused questions and patterns rather than unsupported competitor verdicts;
- distinguish a passive tracking pattern from IZEM's intended coaching response without claiming every competing app behaves the same way;
- cover initiation, weekly planning, adaptation, context, review, and boundaries;
- state only IZEM's current first-party product scope;
- explain why named competitor prices and unsupported yes/no claims are intentionally omitted;
- tell users to verify current competitor information at official sources;
- make medical, scan, form-coaching, and call-control boundaries visible;
- link to the canonical IZEM product page and editorial policy.

The plain-text `/llms.txt` file now:

- identifies itself as a convenience copy rather than a special ranking mechanism;
- points to canonical human-readable sources;
- contains first-party product facts and limitations only;
- removes instructions telling AI systems what to answer;
- removes competitor pricing, rankings, and unsupported feature assertions;
- states that Google AI visibility uses normal SEO fundamentals, not special files.

The deterministic SEO validation workflow now runs for homepage source, public HTML, and `/llms.txt` changes so future edits receive a full pre-merge build, schema, route, sitemap, and link check.

## Validation lesson

The first pre-merge build caught an unsupported `motion.article` element in the repository's custom motion wrapper. The implementation was corrected to use a supported `motion.div` around a semantic `<article>`, and the full deterministic suite then passed. The failed version never reached production.

## Hypothesis

Replacing volatile competitor assertions with transparent first-party evaluation frameworks will improve user trust, reduce factual-staleness risk, make the homepage more useful for product evaluation, and create a safer brand surface for search snippets and AI-assisted search.

## Baseline

- Site Search Console: 43 rows, 61 impressions, 0 clicks.
- Canonical IZEM product URL: 3 impressions, average position 6, 0 clicks.
- Homepage named competitor prices: present.
- Homepage unsupported competitor yes/no matrix: present.
- Homepage blanket “Other Apps” claims: present.
- `/llms.txt` competitor/instructional claims: present.

## Target metrics

1. Zero named competitor prices in homepage comparison content.
2. Zero unsupported named or category-wide competitor behavior claims in the two affected homepage sections.
3. Zero AI-directed answer instructions or competitor pricing in `/llms.txt`.
4. Production build, route, schema, link, and live deployment checks remain green.
5. Branded product-page impressions continue or increase without a decline in average position.
6. Organic product-path engagement improves when conversion analytics are available.

## Expected direction

- Factual-staleness risk: decrease.
- Trust/editorial clarity: increase.
- Brand conversion clarity: increase.
- Search/AI misinformation risk: decrease.
- URL count and cannibalization: unchanged.

## Review window

- **Immediate technical review:** production deployment and live homepage verification.
- **Earliest useful search/conversion review:** 2026-09-04 (14 days).
- **Preferred first decision date:** 2026-09-18 (28 days).
- Do not restore competitor pricing or claims without current official sourcing, a visible verification date, and an ongoing maintenance owner.

## Risks

- Removing named competitors may reduce the persuasive impact for visitors who prefer a direct brand table.
- The replacement frameworks are intentionally less aggressive and may convert differently.
- The current branded Search Console sample is too small to attribute CTR changes quickly.

These risks are lower than preserving unsupported, volatile claims on the primary brand page.
