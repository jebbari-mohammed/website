import { Heart, Shield, Lock, EyeOff, CheckCircle2, Smartphone } from 'lucide-react';

const verifiedPillars = [
  { name: 'Apple HealthKit', icon: Heart, badge: 'Biometrics' },
  { name: 'Google Firebase', icon: Lock, badge: '256-Bit SSL' },
  { name: 'Ephemeral Scans', icon: EyeOff, badge: 'Zero Photo Storage' },
  { name: 'No Ad Networks', icon: Shield, badge: '100% Private' },
];

const securityBadges = [
  { label: 'Built for iOS & Android', icon: Smartphone },
  { label: 'Cancel Anytime', icon: CheckCircle2 },
];

export default function EcosystemStrip() {
  return (
    <section className="py-10 px-4 sm:px-6 relative border-y border-white/[0.06] bg-[#05080C]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
          {/* Left label */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-textSecondary/80">
              Verified Standards
            </span>
          </div>

          {/* Center pillars list */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {verifiedPillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:border-white/20 transition-colors"
                >
                  <Icon size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-textPrimary">{item.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-textSecondary/60 bg-white/[0.04] px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Security tags */}
          <div className="hidden xl:flex items-center gap-4 text-xs text-textSecondary/70">
            {securityBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-secondary" />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
