# IZEM 90-Day Search and AI Recommendation Plan

Updated: 2026-07-31

Scope: Google Search, Google AI features, Bing/Copilot, ChatGPT Search, and Perplexity

Decision: use a variable publishing cadence, transparent AI assistance, a named accountable publisher, evidence-led consolidation, and measured topic authority.

## Research integrity note

This plan is an AI-assisted synthesis. It does not pretend otherwise.

The public web does not provide a dependable way to prove that a page received zero AI assistance. For that reason, the research standard used here was **human accountability**, not an unverifiable “AI-free” detector score:

- Prefer named authors, disclosed contributors, dates, methodologies, and accountable editorial organizations.
- Prefer first-party platform documentation for crawler and search-engine rules.
- Prefer studies that publish sample sizes and limitations.
- Exclude anonymous SEO posts, affiliate pages with no methodology, invented-sounding case studies, and claims that promise guaranteed rankings.
- Treat vendor studies as directional evidence, not neutral truth.

The July 2026 critical survey by Olivier Martinez is the guardrail for this plan: no reviewed GEO technique has yet shown a stable, longitudinal, cross-platform causal effect on organic discoverability and downstream business results. We will therefore run measured experiments instead of claiming guaranteed rankings.

## Executive decision

IZEM should stop trying to win by publishing more pages. It should win a narrow set of topics by becoming the clearest, most verifiable, most directly experienced source in those topics.

The current site is beginning to work, but its strongest pages are surrounded by a much larger set of automated, overlapping, and weakly attributable pages. That creates four risks:

1. Search engines have too many similar URLs competing for the same intent.
2. Readers and recommendation engines cannot verify who tested the product or wrote health-related claims.
3. Automated first-person stories and unsupported statistics weaken trust.
4. Citation counts can grow without brand mentions, qualified visits, or signups.

The 90-day strategy is therefore:

1. Protect the pages already earning impressions and clicks.
2. Pause low-accountability content automation.
3. Consolidate duplicate intent into a small number of canonical topic hubs.
4. Replace generic claims with named authors, real product demonstrations, real user evidence, and primary sources.
5. Earn independent, honest coverage where fitness-app buyers already research products.
6. Measure Google, Bing, ChatGPT, and Perplexity separately from visibility through conversion.

No ethical plan can guarantee first place. The goal is to create the conditions that make high ranking and recommendation materially more likely while producing useful business results.

## Current baseline

### Search performance

Google Search Console page-level data:

| Period | Pages with impressions | Impressions | Clicks | CTR |
| --- | ---: | ---: | ---: | ---: |
| 2026-06-05 to 2026-07-02 | 4 | 17 | 0 | 0% |
| Latest 28 days ending 2026-07-30 | 48 | 294 | 21 | 7.14% |

This is early traction, not failure. Do not remove or radically change a page that is performing until its query and conversion data have been reviewed.

Current pages to protect first:

| Page | Clicks | Impressions | Avg. position | Initial action |
| --- | ---: | ---: | ---: | --- |
| `/blog/fitness-app-that-reviews-your-day` | 8 | 41 | 4.22 | Keep URL; add founder publisher attribution, screenshots, a real workflow demo, and a conversion event. |
| `/blog/workout-reminder-app-that-calls-you` | 4 | 15 | 7.87 | Keep URL; document an actual call test and clarify who this is and is not for. |
| `/features/ai-workout-generator` | 3 | 12 | 3.42 | Keep URL; add real inputs/outputs, limitations, and app-store path. |
| `/` | 2 | 30 | 3.97 | Keep positioning; strengthen human/company identity and verifiable product proof. |
| `/fitness-app-that-calls-you/` | 1 | 26 | 3.23 | Make this the canonical commercial call-accountability landing page. |
| `/izem-ai-fitness-coach/` | 1 | 4 | 2.75 | Keep as the canonical entity/product explanation. |

### Inventory and quality risks

- 336 HTML files exist under `public/`.
- 52 top-level English blog posts exist.
- 199 localized blog files exist.
- 21 city pages exist under `best-ai-fitness-app/`.
- The main sitemap contains 100 URLs, so the relationship between published, indexable, canonical, and translated URLs is not yet explicit.
- Most article schema uses the organization “IZEM” as author instead of a named person with demonstrated experience.
- The daily blog workflow generates and publishes Gemini-written articles automatically.
- The translation workflow publishes machine translations automatically.
- The weekly refresh workflow changes `dateModified` even when the article body was not substantively reviewed. Google explicitly lists this as a search-engine-first warning sign.
- Some published pages contain first-person product experiences that are not tied to a real named tester, along with statistics that do not link to a verifiable study.
- Several “best AI fitness app 2026” pages and city variants compete for substantially similar intent.
- `llms.txt` is maintained as if it were a ranking lever. Google’s July guidance says Google Search ignores it; it may remain as a reference file, but it is not a priority.
- `robots.txt` allows unknown crawlers through the wildcard group, but should explicitly list `OAI-SearchBot` so the ChatGPT Search decision is unambiguous. Training crawler access (`GPTBot`) is a separate business decision.

## What July’s human-accountable research says

### Google and Google AI features

- Google’s July guide says ordinary SEO remains the foundation for AI Overviews and AI Mode because those systems retrieve from the Search index.
- It prioritizes unique first-hand work and explicitly says not to recycle material that a generative model could easily produce.
- It warns against creating a separate page for every fan-out query and says quantity does not make a site more relevant.
- It says `llms.txt`, special AI markup, tiny “chunks,” and rewriting solely for AI are not Google ranking requirements.
- It recommends Search Console as the measurement source and warns that no third party has Google’s internal ranking data.

Implication for IZEM: stop expanding keyword variations and city pages; consolidate real experience into authoritative topic pages.

### Bing and Copilot

- Microsoft’s named product team says AI grounding needs accurate, fresh, attributable, supportable facts—not just rankable documents.
- Bing Webmaster Tools now reports AI citations, cited pages, and grounding queries. A citation does not indicate placement, authority, or business impact.
- Microsoft recommends clear headings, tables, evidence, accurate freshness, complete sitemaps, and IndexNow.
- Microsoft also warns that overlapping and duplicate pages dilute signals and make the intended URL harder to select.

Implication for IZEM: use Bing’s actual grounding-query data, consolidate duplicates, and submit only truthful changes through IndexNow.

### ChatGPT Search

- OpenAI’s publisher guidance says public pages can appear in ChatGPT Search when `OAI-SearchBot` is allowed and the content is publicly crawlable.
- OpenAI adds `utm_source=chatgpt.com` to referral URLs, making downstream sessions and conversions measurable.
- Semrush’s July topic study found that a single winning prompt is not topic ownership. In its sample, owners appeared across at least four of five related prompts with a meaningful lead.
- The same study found broad domain metrics alone did not consistently explain topic ownership. Topical visibility should therefore be measured across a question set, not one vanity prompt.
- Semrush’s earlier “ghost citation” study found that citation and brand mention are different outcomes; comparison content produced more brand mentions than informational content in that sample.

Implication for IZEM: build one coherent accountability topic system, track brand mentions separately from citations, and make comparison pages transparent and test-based.

### Perplexity

- Perplexity states that `PerplexityBot` respects `robots.txt` and uses the web index for real-time search and citation.
- Cross-engine studies show different industries and engines favor different source mixes. There is no universal “AI loves this format” template.
- The July critical survey says GEO is stochastic and multi-stage: crawl, index, retrieve, rerank, cite, mention, and convert are different events.

Implication for IZEM: make evidence easy to retrieve, but test Perplexity independently and repeat prompts rather than trusting one run.

### What visible winners in the fitness-app category do well

Human-authored examples reviewed in July show repeatable editorial patterns:

- Tom’s Guide names Jane McGuire and contributor James Frew, states the July 27 review date, explains multi-week hands-on testing, discloses affiliate economics, and gives both reasons to buy and reasons to avoid.
- Ray’s Colin Raney discloses that Ray owns the comparison, publishes the review date and method, links each product fact to an official source, and says when another product is a better fit.
- Strong product landing pages make the product category and differentiator clear in the H1, show real product screens, and link to verifiable app-store listings.

Implication for IZEM: transparent bias plus real testing is more credible than pretending to be an independent reviewer.

## Non-negotiable editorial standard

No new page may be indexed until it passes all of these checks:

- A named accountable publisher is shown with a real profile. Name an author or reviewer only when that role is true.
- Health or exercise guidance is reviewed by an appropriately qualified human when it goes beyond simple product usage.
- First-person language describes an event that actually happened to the named person.
- Every statistic links to the original study or primary data; vague “research shows” language is removed.
- Product facts link to the official product page or app-store listing and show a checked/reviewed date.
- A brand-owned comparison discloses ownership and states where a competitor is better.
- Screenshots, call transcripts, test logs, survey results, or other original evidence support the page’s main claim.
- AI assistance, if used, is disclosed in the editorial policy. AI may organize notes or check structure; it may not invent experience, sources, quotes, users, credentials, or outcomes.
- `dateModified` changes only after a substantive human-reviewed change.
- The page has one distinct user intent and is not a near-duplicate of an existing URL.

## 90-day execution plan

### Days 1-7: stop risk and preserve evidence

1. Replace fixed-time publishing with one deterministic-random slot inside each workflow's existing start time plus seven hours. Scheduled drafts must identify AI assistance and the accountable publisher. Keep the weekly date-only refresh disabled.
2. Keep drafts and tooling; do not mass-delete published URLs in the first week.
3. Export Google Search Console page/query data for 16 months where available. Create an analogous Bing Webmaster Tools export for web performance and AI Performance.
4. Inventory every canonical, indexable URL into one of five states: keep, improve, merge/301, noindex pending review, or remove/410.
5. Mark all pages with clicks, impressions, backlinks, or conversions as protected until individually reviewed.
6. Audit and remove fabricated first-person experiences, unverifiable testimonials, unsupported medical/fitness statistics, and invented reviewer credentials.
7. Publish an editorial policy, AI-use disclosure, corrections policy, comparison methodology, and named founder/publisher profile. Use “author” or “reviewer” only when that person actually wrote or reviewed the page.

Deliverable: an approved URL decision sheet and no new undisclosed or deceptively attributed indexed content.

### Days 8-21: consolidate and make the site technically unambiguous

1. Establish five canonical topic assets:
   - Product/entity: `/izem-ai-fitness-coach/`
   - Call accountability: `/fitness-app-that-calls-you/`
   - Daily review and recovery after missed workouts: keep the current winning review page as the informational hub.
   - Adaptive workout planning: `/features/ai-workout-generator`
   - Honest category/comparison: `/best-ai-fitness-app`
2. Map overlapping “best AI fitness app,” call-reminder, and generic AI coach URLs to those hubs. Merge unique useful material and use 301 redirects where intent is the same.
3. Noindex machine translations until a fluent human reviews meaning, product facts, cultural fit, and safety. Reindex languages one at a time only when the page adds local value.
4. Noindex or merge city pages that contain no real local pricing, availability, fitness context, tester, or local evidence.
5. Rebuild the sitemap from canonical, indexable URLs only. Use accurate `lastmod`; remove unsupported `priority` and `changefreq` assumptions if the generator cannot maintain them truthfully.
6. Explicitly allow `OAI-SearchBot`, `PerplexityBot`, `Bingbot`, and `Googlebot`. Decide separately whether training crawlers such as `GPTBot` should be allowed.
7. Verify raw and rendered HTML contains the same primary H1, core product facts, links, and schema. The custom audit currently reports zero homepage words despite live prerendered content, so fix the audit or prerender verification before trusting its score.
8. Validate canonical, hreflang, Article, Organization, and MobileApplication markup against visible page content. Remove schema that exists only to target AI or a retired rich-result treatment.
9. Submit the clean sitemap to Google and Bing; use IndexNow only for added, changed, redirected, or removed URLs.

Deliverable: fewer, stronger indexable URLs with clean canonical and crawler signals.

### Days 22-45: turn the winning cluster into human evidence

Improve the six protected pages before creating anything new.

For each page:

1. Name the founder/tester and explain what was actually tested.
2. Add original screenshots or short videos showing the real product path.
3. Add a dated test protocol: device, app version, scenario, duration, and limitations.
4. Include “best for,” “not for,” and safety/limitations sections.
5. Link product claims to current official listings or documentation.
6. Add one clear conversion path with events for store click, signup, trial start, and purchase.
7. Add a short source table that distinguishes IZEM observations from external research.

Recommended original evidence projects:

- **Seven-day call accountability diary:** one named tester documents scheduled calls, answered calls, workouts started, and where the experience failed.
- **Crowded-gym substitution test:** record 20 real equipment-unavailable scenarios and score whether the suggested substitute preserved movement pattern, load intent, and session time.
- **Missed-workout recovery study:** with informed consent, analyze a small beta cohort’s return-to-plan rate after a missed session. Publish sample size, method, anonymization, and limitations; do not imply clinical efficacy.
- **Meal-scan accuracy boundaries:** compare estimated foods/macros against weighed entries and show error ranges and failure cases. Do not market the feature as medical-grade.

Deliverable: product evidence that no generic model or competitor can reproduce without testing IZEM.

### Days 46-70: earn independent corroboration

1. Build a reviewer kit with store links, demo access, pricing, screenshots, founder identity, privacy/safety notes, and a list of known limitations.
2. Contact a small number of relevant human reviewers, fitness-app journalists, trainers, and creator-newsletter authors. Offer access, not editorial control or a required positive verdict.
3. Ask existing real users for honest app-store reviews at an appropriate in-product moment. Never script sentiment or offer rewards for positive reviews.
4. Participate transparently in relevant communities as the founder. Answer questions with useful detail; do not seed fake recommendations, fake users, or undisclosed promotional posts.
5. Seek inclusion in genuinely relevant product directories and comparison databases only when the listing can be complete, accurate, and free. Submit the listing directly when possible; skip paid placement, paid acceleration, reciprocal-link schemes, and fake community participation. Stop the blanket “five directories per month” target.
6. Pitch the original tests, not “IZEM is the best” claims. Journalists and AI systems have a reason to reference unique data when the method is clear.

Deliverable: first independent mentions, reviews, or links tied to the accountability topic.

### Days 71-90: expand only from measured gaps

1. Build a fixed buyer-question set across three narrow categories:
   - Fitness app that calls or follows up
   - Workout accountability after missed sessions
   - Adaptive workouts for busy or crowded gyms
2. Use five question types per category: definition, comparison, alternatives, use case, and buying decision.
3. Run each prompt at least three times per engine per measurement cycle. Record brand mention, recommendation position, cited URL, cited domain, answer sentiment, referral, and conversion.
4. Compare IZEM with the same competitor set each week; never infer a trend from a single answer.
5. Create a new page only when Search Console/Bing data, user support questions, or prompt evidence shows a distinct unmet intent that cannot be satisfied by improving an existing hub.
6. Refresh content only when facts, product behavior, test evidence, or user needs changed. Record the change in a visible changelog.

Deliverable: a repeatable search-and-recommendation measurement system, not a vanity rank screenshot.

## Engine-specific operating checklist

### Google Search and Google AI

- Measure pages, queries, clicks, conversions, and the Generative AI performance report in Search Console.
- Protect pages already earning clicks.
- Prioritize original experience and non-commodity evidence.
- Consolidate fan-out keyword variations.
- Keep JavaScript-rendered and raw essential content consistent.
- Treat `llms.txt` as optional documentation, not a ranking task.

### Bing and Copilot

- Verify the property in Bing Webmaster Tools.
- Track web position plus AI citations, cited pages, and grounding queries.
- Use Bing’s Recommendations and URL Inspection after consolidation.
- Maintain one truthful sitemap and IndexNow updates for real changes.
- Optimize facts for provenance: source, date, tester, method, limitation.

### ChatGPT Search

- Explicitly allow `OAI-SearchBot` and verify it receives HTTP 200 without a challenge.
- Track `utm_source=chatgpt.com`, engaged sessions, store clicks, trials, and purchases.
- Measure mentions and citations separately.
- Build topic coverage through a few strong pages and third-party corroboration, not dozens of keyword variants.

### Perplexity

- Explicitly allow `PerplexityBot` and verify server access.
- Make claims independently checkable and link to primary evidence.
- Track cited URL, brand mention, freshness, and referral separately.
- Repeat queries; do not treat one citation as durable visibility.

## Weekly scorecard

| Layer | Metric | Why it matters |
| --- | --- | --- |
| Discovery | Valid indexed canonical pages; crawler 2xx rate; sitemap errors | A page cannot be retrieved reliably if discovery is unclear. |
| Traditional search | Non-brand impressions, clicks, CTR, median position by topic | Shows whether Google/Bing visibility is improving. |
| Retrieval | Bing grounding queries; AI crawler visits to target pages | Shows whether the evidence is entering the candidate set. |
| Citation | Citation share by engine and target topic | Attribution, not recommendation. |
| Brand | Mention share, recommendation share, sentiment, accuracy | Shows whether IZEM is actually named and described correctly. |
| Business | AI/search referrals, store clicks, trial starts, paid conversions | Prevents vanity optimization. |
| Quality | Corrections, unsupported claims found, reviewer completion, user complaints | Protects long-term trust. |

Report Google, Bing/Copilot, ChatGPT, and Perplexity separately. Do not blend them into one “AI rank.”

## 90-day targets

Targets should be revised after the first two weeks of complete measurement. Initial targets:

- 100% of built pages visibly identify Mohammed Jebbari as IZEM's accountable publisher; name an author or reviewer only when that role is true.
- 100% of statistics on protected pages link to a primary source or IZEM’s published method/data.
- Zero scheduled date-only freshness changes.
- 100% of automatically drafted English posts and translations disclose AI assistance, avoid invented human experience, and link to the editorial policy.
- Reduce indexable near-duplicate and no-local-value pages by at least 50% through merge, noindex, or redirect decisions, while protecting URLs with signals.
- Double non-brand Google impressions from the latest 28-day baseline without reducing clicks on protected pages.
- Reach at least 40 qualified organic clicks per 28 days; treat conversions, not the number alone, as the final success measure.
- Establish a repeatable baseline for 15 buyer prompts per engine, with three runs per prompt.
- Earn at least three independent, editorially controlled reviews or mentions from relevant humans; no paid-positive or fake-community placements.
- Publish at least two original, reproducible product tests with named human testers and explicit limitations.

## Stop, continue, and expand rules

Stop or reverse an experiment when:

- A protected page loses more than 30% of clicks or qualified impressions for two consecutive measurement periods after a change.
- A page attracts impressions but no relevant clicks, no brand lift, and no conversions after it has had enough exposure to evaluate.
- A claim cannot be supported by a primary source, real product behavior, or disclosed first-party data.
- Independent reviewers repeatedly identify the same product weakness; route that evidence to product work instead of rewriting the marketing claim.

Continue when:

- Non-brand impressions and clicks grow for the intended topic.
- Multiple runs across an engine show improving mentions or citations.
- Visitors reach store/trial actions and the answer accurately represents the product.

Expand only when:

- The existing topic hub is accurate and complete.
- A distinct user intent is visible in Search Console, Bing grounding queries, support conversations, or repeated AI prompts.
- A named human can contribute real experience or evidence that is not already on the site.

## Source ledger

Sources were selected for named human accountability, transparent methodology, or necessary first-party platform rules. Vendor research remains directional.

1. Google Search Central, **Optimizing your website for generative AI features on Google Search**, published July 2026. First-party institutional guidance. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
2. Google Search Central, **Creating helpful, reliable, people-first content**. First-party institutional guidance, including warnings about extensive automation and changing dates without substantive updates. https://developers.google.com/search/docs/fundamentals/creating-helpful-content
3. Olivier Martinez, **Optimizing Visibility in Generative Engines: A Critical Survey of Generative Engine Optimization (2023-2026)**, July 15, 2026. Named author, methods and literature matrix disclosed; preprint, not treated as peer-reviewed final evidence. https://arxiv.org/abs/2607.14035
4. Margarita Loktionova with Kevin Indig/Growth Memo, **AI visibility is a topic-level game: A study of 50,000 brands in ChatGPT**, July 20, 2026. Named authors/contributors and sample disclosed; vendor study. https://www.semrush.com/blog/chatgpt-topic-authority-study/
5. Margarita Loktionova, Christine Skopec, and Kevin Indig/Growth Memo, **Why 62% of AI citations don’t lead to brand mentions**, June 9, 2026. Named contributors and methodology disclosed; vendor study. https://www.semrush.com/blog/the-ghost-citations-study/
6. Louise Linehan, **5 AI Search Trends I’m Seeing in 2026, Backed by Ahrefs Data**, July 24, 2026. Named author with linked examples; vendor perspective. https://ahrefs.com/blog/ai-search-trends/
7. Brandon Kidd, **We analyzed 25,000+ AI citations across 5 engines**, July 13, 2026. Named author, dates, sample, and classification limits disclosed; agency/client-portfolio study. https://www.deltavdigital.com/resources/reports/ai-citation-study/
8. Krishna Madhavan, Knut Risvik, and Meenaz Merchant, Microsoft AI, **Evolving role of the index: From ranking pages to supporting answers**, May 6, 2026. Named first-party authors. https://blogs.bing.com/search/May-2026/Evolving-role-of-the-index-From-ranking-pages-to-supporting-answers
9. Krishna Madhavan, Meenaz Merchant, Fabrice Canel, and Saral Nigam, Microsoft AI, **Introducing AI Performance in Bing Webmaster Tools Public Preview**, February 10, 2026. Named first-party authors. https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
10. Fabrice Canel and Krishna Madhavan, Microsoft Bing, **Does Duplicate Content Hurt SEO and AI Search Visibility?**, December 19, 2025. Named first-party authors. https://blogs.bing.com/webmaster/December-2025/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility
11. OpenAI, **Publishers and Developers FAQ**, updated July 2026. Necessary first-party crawler/referral rule; institutional authorship, no individual byline. https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
12. Perplexity Support, **How does Perplexity follow robots.txt?**, updated July 16, 2026. Necessary first-party crawler rule; team byline rather than an individual. https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt
13. Jane McGuire, contributions by James Frew, **We've tested the best workout apps to help you train at home**, updated July 27, 2026. Named editors, hands-on test method, and affiliate disclosure. https://www.tomsguide.com/best-picks/best-workout-apps
14. Colin Raney, Co-Founder of Ray, **The Best Workout Accountability Apps to Keep You Consistent**, reviewed May 11, 2026. Named founder, ownership disclosure, comparison method, and official fact sources. https://www.rayfit.com/blog/2026/03/best-app-for-workout-accountability/

## Explicitly rejected tactics

- Guaranteed first-place ranking claims.
- Mass pages for every prompt, city, or wording variation.
- Fake first-person experience, fake users, fake reviews, or undisclosed incentives.
- Updating dates without substantive review.
- Publishing AI output directly under a vague “IZEM Team” identity.
- Buying links, directory volume targets, or seeding undisclosed Reddit/community posts.
- Treating schema, FAQ blocks, `llms.txt`, or “AI answer boxes” as a substitute for proof and authority.
- Reporting a single prompt run, citation count, or blended “AI rank” as success.
