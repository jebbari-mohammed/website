const features = [
  {
    title: 'Adaptive plans',
    description:
      'Training and nutrition plans shaped around your goals, schedule, equipment, and feedback.',
  },
  {
    title: 'Live voice coaching',
    description:
      'Request or schedule a focused session when you want hands-free guidance.',
  },
  {
    title: 'Visual check-ins',
    description:
      'Choose a meal, equipment, or body-scan photo for bounded AI analysis; raw body photos are not retained on IZEM servers.',
  },
  {
    title: 'Your controls',
    description:
      'Manage consent, Health access, membership, reports, and account deletion inside the app.',
  },
];

export default function LegalLanding() {
  return (
    <div className="izem-site">
      <header className="topbar">
        <div className="shell">
          <a className="brand" href="/" aria-label="IZEM home">
            <span>IZEM</span> / COACHING SYSTEM
          </a>
          <nav aria-label="Site navigation">
            <a href="/privacy-policy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="/support.html">Support</a>
          </nav>
        </div>
      </header>

      <div className="shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="eyebrow">
            Adult-only · privacy-forward · built for consistency
          </div>
          <h1 id="hero-title">Training that keeps up with real life.</h1>
          <p className="lede">
            IZEM brings adaptive workouts, practical nutrition guidance, visual
            check-ins, and optional live voice coaching into one calm system.
          </p>
        </section>

        <main>
          <section className="card notice">
            <h2>Built with clear boundaries</h2>
            <p>
              IZEM is for general fitness and wellness—not medical diagnosis or
              emergency care. AI processing is always disclosed and requires
              your permission. Apple Health is optional, stays on-device for its
              dashboard, and has a separate opt-in before a minimized summary
              can reach Gemini.
            </p>
          </section>

          <section className="card" aria-label="IZEM features">
            <div className="grid">
              {features.map((feature) => (
                <article className="mini" key={feature.title}>
                  <strong>{feature.title}</strong>
                  {feature.description}
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="footer">
          <nav aria-label="Footer navigation">
            <a href="/privacy-policy.html">Privacy Policy</a>
            <a href="/terms.html">Terms of Use</a>
            <a href="/support.html">Support</a>
            <a href="mailto:support@youraicoach.life">Contact</a>
          </nav>
          © 2026 IZEM. Adult-only general wellness coaching.
        </footer>
      </div>
    </div>
  );
}
