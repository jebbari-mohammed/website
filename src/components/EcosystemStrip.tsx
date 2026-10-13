import { Database, Shield, Lock, Camera, CheckCircle2, Smartphone } from 'lucide-react';

const verifiedPillars = [
  { name: 'Apple HealthKit', icon: Database, badge: 'Optional' },
  { name: 'Google Firebase', icon: Lock, badge: 'Protected transport' },
  { name: 'User-Controlled Scans', icon: Camera, badge: 'Clear retention' },
  { name: 'No Ad Networks', icon: Shield, badge: 'No ad targeting' },
];

const securityBadges = [
  { label: 'Built for iOS & Android', icon: Smartphone },
  { label: 'App awaiting store review', icon: CheckCircle2 },
];

export default function EcosystemStrip() {
  return (
    <section className="editorial-safeguards" aria-label="Product safeguards">
      <div className="editorial-container">
        <p className="editorial-safeguards-label">Product safeguards</p>
        <div className="editorial-safeguards-list">
          {verifiedPillars.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="editorial-safeguard">
                <Icon size={17} aria-hidden="true" />
                <div><strong>{item.name}</strong><span>{item.badge}</span></div>
              </div>
            );
          })}
        </div>
        <div className="editorial-safeguards-status">
          {securityBadges.map((badge) => {
            const Icon = badge.icon;
            return <span key={badge.label}><Icon size={15} aria-hidden="true" />{badge.label}</span>;
          })}
        </div>
      </div>
    </section>
  );
}
