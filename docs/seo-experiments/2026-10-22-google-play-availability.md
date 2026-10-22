# Google Play availability factual correction

October 22, 2026, America/Los_Angeles.

The owner reported Google Play approval and supplied the official listing at https://play.google.com/store/apps/details?id=com.ai.gym.coach . A live browser inspection on this date showed the title **IZEM: AI Fitness Coach**, an **Install** button, and **This app is available for your device**. This supports changing the website's blanket awaiting-review language to Android availability on Google Play. Store availability can still depend on region, account and device.

This change corrects the existing homepage status labels, availability copy, FAQ, metadata and structured descriptions, plus the product overview and download chooser. It preserves the existing Google Play package and download destination. The homepage primary actions now use that verified Google Play destination, with the free workout generator still available as a secondary action. A separate live request to the configured Apple App Store URL returned HTTP 404, so the website states that the iOS listing is not yet available. It does not claim that an iOS release was approved or that every region or device is eligible. Membership pricing and purchase terms remain those shown by the applicable storefront.

This is a factual availability correction under AGENTS.md, outside the keyword-selection and new-page publication cycle. No new URL, keyword target or material SEO experiment is introduced. The existing experiment dates, review dates, file lists and prior correction history remain intact. The correction is recorded on every active lock protecting an affected file. The root index.html file has no active target lock. The product overview’s prior lock expired on October 7, so its factual correction does not need an override.

The experiment guard recognizes only the complete-file SHA-256 transitions in the reviewed manifest below, matching committed annotations and this note. A different file, extra byte, missing annotation or changed lock definition remains blocked. The guard's release path uses the code-pinned manifest, never an approval flag from configuration.

```json
{
  "id": "google-play-availability-2026-10-22",
  "kind": "store-availability-factual-correction",
  "date": "2026-10-22",
  "reviewNote": "docs/seo-experiments/2026-10-22-google-play-availability.md",
  "files": [
    {
      "file": "src/components/Hero.tsx",
      "baseSha256": "cfeb8db18ba2c17b7ddd5e866d3957e6a506a3b7bbc5ca44eb1ec63ff29813f7",
      "headSha256": "1937a4c289ad0e3f33da3df1e85ca1bd94836ad1f37dd8548b2be7434b9157e2"
    },
    {
      "file": "src/components/FinalCTA.tsx",
      "baseSha256": "f57e3e4dd5aa1f07aa525fac59df2aa09b6def049a724173990558a0d5adb103",
      "headSha256": "f05ccc60ff6fc2c4d83213bcd0072ded0390cb39a25960fd6d77ac0c561ae46c"
    },
    {
      "file": "src/components/EcosystemStrip.tsx",
      "baseSha256": "421ef030d97b5a7e18d350cf6497c4ec0f9e7401d6580d2051b697fc7bf44223",
      "headSha256": "750e2ca576ef37a2cfe4fc549305c46900c2eaf2c7bbfed37ec277b2bd71740a"
    },
    {
      "file": "src/components/TrainerCostCalculator.tsx",
      "baseSha256": "b26d7c469e0ff33911116a3584256bfb08cf5faaef42ce2fcd48d41353bf5416",
      "headSha256": "edbdfb9de71a250ec7727ea39433c3569f27ffc5f39e839a37b38ed3349178d5"
    },
    {
      "file": "src/components/TrustAndPrivacy.tsx",
      "baseSha256": "1b8137a1ec422e0715c4938355f12c86dc37183988c8057f7e9115a48dc67570",
      "headSha256": "4add7e6493a90018c2e512437ee71bd02a80c4b0a58682b2cfdc4a9ac43698a1"
    },
    {
      "file": "src/components/Capabilities.tsx",
      "baseSha256": "95b9e0c4c392b414b3630978d87e00bf8090d2a44b86185f277a82729ba1c4aa",
      "headSha256": "82906067d82bf1a96b64b8889b00d63181d5a157747e5403976293e6fbd5095f"
    },
    {
      "file": "src/content/homepage-faq.json",
      "baseSha256": "89bff47e4231ee66fe1f7133ef22a71106d9b239ba7bff47e7e9780bd38b8c60",
      "headSha256": "aa7d4c6e81e945564af438266ff3906ea468016f27fdc186ed1a996d27c52b9a"
    },
    {
      "file": "public/download/index.html",
      "baseSha256": "820cfb00d03aee2769fcf4483aaef00aaaa2ce5cc588e7fa005f9d6777f4fa80",
      "headSha256": "d4b4aa5123c240563cb3c8da17c7e9089a7713bd600a8e8fa8c2de173e5a7373"
    }
  ]
}
```

Validation covers the focused experiment-guard tests, existing store-link policy tests, production build and download browser checks, structured data, discovery files, critical routes and internal links. Publication must be verified on the live website before reporting the correction as deployed.

Pre-release governance checks passed: all 63 experiment-guard tests, including the seven new factual-correction cases, and the actual working-tree transition check accepted all eight reviewed protected files with no remaining lock violations. The committed base/head guard and website release checks remain required before publication.
