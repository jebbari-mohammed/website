import { motion } from '../lib/motion';
import { Lock, Smartphone, Ban, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const trustPillars = [
  {
    icon: Lock,
    title: 'Protected Data',
    desc: 'Network requests use HTTPS/TLS, and protected cloud records use authenticated access controls. See the Privacy Policy for details.',
  },
  {
    icon: Smartphone,
    title: 'Clear Photo Controls',
    desc: 'An optional pre-analysis photo pair can be kept in an encrypted on-device vault. Selected photos are sent for analysis with permission; the saved pair is deleted after successful analysis or when you delete it. See the Privacy Policy for retention details.',
  },
  {
    icon: Ban,
    title: 'Zero Ad Network Sales',
    desc: 'We never sell, rent, or monetize your health habits, workout logs, or dietary logs with third-party advertisers.',
  },
  {
    icon: ShieldCheck,
    title: 'Store-Managed Billing',
    desc: 'The app is awaiting store review. When subscriptions are available, purchases use the applicable store’s billing. IZEM does not process your payment card numbers.',
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
            We believe in clear controls, no ad-network sale of health data, and plain-language disclosure of photo handling and account deletion.
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
                <h3 className="text-base font-bold text-textPrimary mb-2">
                  {item.title}
                </h3>
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
                <span>In-App Account Deletion</span>
              </div>
              <h3 className="text-xl font-bold text-textPrimary mb-3">
                Start account deletion from the app.
              </h3>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed mb-4">
                In the app, go to Profile → Account → Delete account. Limited records or backups may remain as described in the Privacy Policy. Deleting your account does not cancel a store subscription; manage billing separately in the applicable store.
              </p>
              <p className="text-xs text-textSecondary/80">
                You can also email <a href="mailto:support@youraicoach.life" className="text-primary hover:underline">support@youraicoach.life</a> with "Data Deletion Request". Requests may require identity verification and are handled within applicable legal timelines.
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
                Eligible call and notification preferences can be changed in the app. You can revoke notification, microphone, camera and Health permissions in your device settings.
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
