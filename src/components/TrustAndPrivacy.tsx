import { motion } from '../lib/motion';
import { Lock, Smartphone, Ban, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const trustPillars = [
  {
    icon: Lock,
    title: 'Data Encrypted',
    desc: 'All fitness, nutrition, and personal data is encrypted in transit and at rest via Google Firebase enterprise security.',
  },
  {
    icon: Smartphone,
    title: 'Ephemeral Camera Scans',
    desc: 'Food and body progress camera scans are processed strictly for real-time analysis and are not retained as stored photos.',
  },
  {
    icon: Ban,
    title: 'Zero Ad Network Sales',
    desc: 'We never sell, rent, or monetize your health habits, workout logs, or dietary logs with third-party advertisers.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure App Store Billing',
    desc: 'Subscribers upgrade securely via Apple App Store and Google Play. We never hold or process your payment card numbers.',
  },
];

export default function TrustAndPrivacy() {
  return (
    <section id="privacy" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            ✦ PRIVACY & SECURITY BY DESIGN
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            Your Health Data Stays Yours.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            We believe in complete transparency. No predatory tracking, no hidden photo retention, and full control over your account.
          </p>
        </div>

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12">
          {trustPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-2xl p-6 specular-card hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm">
                  <Icon size={20} />
                </div>
                <h4 className="text-base font-bold text-textPrimary mb-2">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* In-App Deletion & Medical Disclaimer Banner */}
        <div id="delete" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Deletion Card */}
          <div className="lg:col-span-6 rounded-2xl p-6 sm:p-8 specular-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
                <Trash2 size={16} />
                <span>Instant Account Deletion</span>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">
                Delete everything anytime in one tap.
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed mb-4">
                You do not need to send awkward support tickets to remove your data. Open the app, go to Profile → Settings → Delete Account to immediately purge your profile, workouts, and meals.
              </p>
              <p className="text-xs text-textSecondary/80">
                You can also email <a href="mailto:support@youraicoach.life" className="text-primary hover:underline">support@youraicoach.life</a> with "Data Deletion Request" and we will confirm completion within 30 days.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-4">
              <a href="/privacy-policy.html" className="text-xs font-semibold text-textSecondary hover:text-primary transition-colors">
                Privacy Policy →
              </a>
              <a href="/terms.html" className="text-xs font-semibold text-textSecondary hover:text-primary transition-colors">
                Terms of Service →
              </a>
            </div>
          </div>

          {/* Medical Boundaries Card */}
          <div className="lg:col-span-6 rounded-2xl p-6 sm:p-8 specular-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                <AlertCircle size={16} />
                <span>Non-Clinical Fitness Scope</span>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">
                Responsible health boundaries.
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed mb-4">
                IZEM provides adaptive athletic programming and nutrition targets for healthy adults. It does not provide medical diagnosis, physical therapy rehabilitation, or replace an in-person physician. Always consult a healthcare provider before undertaking new high-intensity programs.
              </p>
              <p className="text-xs text-textSecondary/80">
                All voice call schedules, check-in cadences, and message permissions remain fully configurable in your notification settings.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <a href="/editorial-policy.html" className="text-xs font-semibold text-textSecondary hover:text-primary transition-colors">
                Review our Editorial Standards →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
