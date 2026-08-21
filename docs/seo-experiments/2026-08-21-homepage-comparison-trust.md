# SEO Experiment: Homepage Comparison Trust

- **Status:** implementation
- **Launch date:** 2026-08-21
- **Action class:** trust/editorial transparency, organic conversion, AI-search hygiene
- **Target surfaces:** homepage comparison section and `/llms.txt`
- **Owner:** ChatGPT senior SEO lead

## First-party evidence

The private Search Console report for 2026-07-24 through 2026-08-20 was authenticated and decrypted successfully: 43 query + landing-page rows, 61 impressions, and 0 clicks. The canonical IZEM product URL received 3 impressions at an average position of 6, showing that Google is already testing an IZEM-branded navigational result even though the sample remains small.

Several material content and observability changes had already landed today, so another article or keyword-page rewrite would create unnecessary experiment overlap. A separate trust and conversion issue on the homepage had clearer evidence and lower cannibalization risk.

## Confirmed problem

The live homepage used a named competitor matrix with exact monthly prices and unsupported yes/no feature assertions. Those claims had no visible sourcing or verification date and could become inaccurate as products and pricing change.

The public `/llms.txt` file repeated competitor claims and pricing, included instructions directed at AI systems, and described implementation details that can become stale. Google states that normal SEO fundamentals apply to AI features and that no special AI text file or special schema is required.

This conflicted with IZEM's current editorial policy:

- do not fabricate or preserve unverified competitor features or prices;
- do not rely on invented GEO/AEO files;
- keep important claims in visible, user-facing content;
- ensure structured information matches the product's real public scope.

## Opportunity shortlist

1. **Replace volatile competitor comparison with a first-party Coach Loop Test — chosen.** High trust and conversion relevance, immediate defect evidence, no cannibalization, and low dependency on uncertain query volume.
2. **Change the product-page title for the early branded query.** Potential CTR leverage, but only 3 impressions exist, so changing metadata now would be premature.
3. **Refresh the workout-reminder page for exercise-reminder variants.** The page has early visibility, but it was modified recently and remains inside its title/content evaluation window.
4. **Publish another new keyword page.** Normally useful during cold start, but inferior today because a material content rehabilitation already happened and existing URLs are beginning to earn query evidence.

## Change

The homepage comparison section now:

- uses six decision-focused questions: initiation, weekly planning, adaptation, context, review, and boundaries;
- states only IZEM's current first-party product scope;
- explains why named competitor prices and unsupported yes/no claims are intentionally omitted;
- tells users to verify current competitor information at official sources;
- makes medical, scan, form-coaching, and call-control boundaries visible;
- links to the canonical IZEM product page and editorial policy.

The plain-text `/llms.txt` file now:

- identifies itself as a convenience copy rather than a special ranking mechanism;
- points to canonical human-readable sources;
- contains first-party product facts and limitations only;
- removes instructions telling AI systems what to answer;
- removes competitor pricing, rankings, and unsupported feature assertions;
- states that Google AI visibility uses normal SEO fundamentals, not special files.

## Hypothesis

Replacing volatile competitor assertions with a transparent first-party evaluation framework will improve user trust, reduce factual-staleness risk, make the homepage more useful for product evaluation, and create a safer brand surface for search snippets and AI-assisted search.

## Baseline

- Site Search Console: 43 rows, 61 impressions, 0 clicks.
- Canonical IZEM product URL: 3 impressions, average position 6, 0 clicks.
- Homepage named competitor prices: present.
- Homepage unsupported competitor yes/no matrix: present.
- `/llms.txt` competitor/instructional claims: present.

## Target metrics

1. Zero named competitor prices on the homepage comparison section.
2. Zero unsupported competitor yes/no claims on that section.
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
- The replacement framework is intentionally less aggressive and may convert differently.
- The current branded Search Console sample is too small to attribute CTR changes quickly.

These risks are lower than preserving unsupported, volatile claims on the primary brand page.
