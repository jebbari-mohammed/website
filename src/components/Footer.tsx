export default function Footer() {
  return (
    <footer className="bg-[#050709] border-t border-white/[0.07] pt-16 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Brand Col */}
          <div className="md:col-span-4 lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/images/izem-app-logo-192.png"
                alt="IZEM App Logo"
                width="32"
                height="32"
                loading="lazy"
                decoding="async"
                className="w-8 h-8 rounded-xl object-cover shadow-[0_0_12px_rgba(141,255,106,0.3)]"
              />
              <span className="text-xl font-bold tracking-tight text-textPrimary">IZEM</span>
            </div>
            <p className="text-sm text-textSecondary leading-relaxed max-w-sm mb-4">
              Premium AI personal training combining weekly adaptive workouts, precision nutrition, computer vision scans, daily check-ins, and proactive voice calls.
            </p>
            <p className="text-xs text-textSecondary/60 leading-normal">
              <strong>Location:</strong> Casablanca, Morocco<br />
              <strong>Entity:</strong> Consumer fitness app, not affiliated with youraicoach.ai.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary/80 mb-4 font-sans">
              Product
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="/izem-ai-fitness-coach/" className="text-textSecondary hover:text-primary transition-colors">
                  AI Fitness Coach
                </a>
              </li>
              <li>
                <a href="/features/ai-workout-generator" className="text-textSecondary hover:text-primary transition-colors">
                  Workout Generator
                </a>
              </li>
              <li>
                <a href="/features/ai-meal-planner" className="text-textSecondary hover:text-primary transition-colors">
                  AI Meal Planner
                </a>
              </li>
              <li>
                <a href="/features/ai-voice-calls" className="text-textSecondary hover:text-primary transition-colors">
                  AI Voice Calls
                </a>
              </li>
              <li>
                <a href="/features/body-scanning" className="text-textSecondary hover:text-primary transition-colors">
                  Body Scanning
                </a>
              </li>
            </ul>
          </div>

          {/* Guides & Tools */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary/80 mb-4 font-sans">
              Guides & Tools
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="/fitness-app-that-calls-you/" className="text-textSecondary hover:text-primary transition-colors">
                  Fitness App That Calls You
                </a>
              </li>
              <li>
                <a href="/best-ai-fitness-app" className="text-textSecondary hover:text-primary transition-colors">
                  Best AI Fitness Apps
                </a>
              </li>
              <li>
                <a href="/tools/" className="text-textSecondary hover:text-primary transition-colors">
                  Free Fitness Calculators
                </a>
              </li>
              <li>
                <a href="/workout-consistency-calculator/" className="text-textSecondary hover:text-primary transition-colors">
                  Consistency Calculator
                </a>
              </li>
              <li>
                <a href="/blog/" className="text-textSecondary hover:text-primary transition-colors">
                  Coaching Blog & Insights
                </a>
              </li>
              <li>
                <a href="/glossary/" className="text-textSecondary hover:text-primary transition-colors">
                  Fitness Glossary
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-textPrimary/80 mb-4 font-sans">
              Trust & Company
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="/about.html" className="text-textSecondary hover:text-primary transition-colors">
                  About Mohammed Jebbari & IZEM
                </a>
              </li>
              <li>
                <a href="/editorial-policy.html" className="text-textSecondary hover:text-primary transition-colors">
                  Editorial Standards
                </a>
              </li>
              <li>
                <a href="/privacy-policy.html" className="text-textSecondary hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms.html" className="text-textSecondary hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#delete" className="text-textSecondary hover:text-primary transition-colors">
                  Data Deletion
                </a>
              </li>
              <li>
                <a href="mailto:support@youraicoach.life" className="text-textSecondary hover:text-primary transition-colors">
                  support@youraicoach.life
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-textSecondary/60">
          <p>© 2026 IZEM AI Fitness Coach. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy-policy.html" className="hover:text-textPrimary transition-colors">Privacy</a>
            <a href="/terms.html" className="hover:text-textPrimary transition-colors">Terms</a>
            <a href="/editorial-policy.html" className="hover:text-textPrimary transition-colors">Editorial</a>
            <a href="/sitemap.xml" className="hover:text-textPrimary transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
