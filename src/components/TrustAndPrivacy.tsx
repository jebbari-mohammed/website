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
    <section id="privacy" className="editorial-section editorial-privacy">
      <div className="editorial-container">
        {/* Header */}
        <div className="editorial-section-heading">
          <div className="editorial-eyebrow">
            PRIVACY & SECURITY BY DESIGN
          </div>
          <h2 className="editorial-title">
            Your Health Data Stays Yours.
          </h2>
          <p className="editorial-intro">
            We believe in clear controls, no ad-network sale of health data, and plain-language disclosure of photo handling and account deletion.
          </p>
        </div>

        {/* 4 Trust Pillars */}
        <div className="editorial-privacy-grid">
          {trustPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="editorial-privacy-item"
              >
                <div className="editorial-privacy-icon">
                  <Icon size={20} />
                </div>
                <h3 className="editorial-privacy-title">
                  {item.title}
                </h3>
                <p className="editorial-privacy-detail">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* In-App Deletion & Medical Disclaimer Banner */}
        <div id="delete" className="editorial-privacy-notes">
          {/* Deletion Card */}
          <div className="editorial-privacy-note">
            <div>
              <div className="editorial-eyebrow">
                <Trash2 size={16} />
                <span>In-App Account Deletion</span>
              </div>
              <h3 className="editorial-privacy-note-title">
                Start account deletion from the app.
              </h3>
              <p className="editorial-privacy-detail">
                In the app, go to Profile → Account → Delete account. Limited records or backups may remain as described in the Privacy Policy. Deleting your account does not cancel a store subscription; manage billing separately in the applicable store.
              </p>
              <p className="editorial-privacy-detail">
                You can also email <a href="mailto:support@youraicoach.life" className="text-primary hover:underline">support@youraicoach.life</a> with "Data Deletion Request". Requests may require identity verification and are handled within applicable legal timelines.
              </p>
            </div>

            <div className="editorial-privacy-links">
              <a href="/privacy-policy.html" className="editorial-link">
                Privacy Policy →
              </a>
              <a href="/terms.html" className="editorial-link">
                Terms of Service →
              </a>
            </div>
          </div>

          {/* Medical Boundaries Card */}
          <div className="editorial-privacy-note">
            <div>
              <div className="editorial-eyebrow">
                <AlertCircle size={16} />
                <span>Non-Clinical Fitness Scope</span>
              </div>
              <h3 className="editorial-privacy-note-title">
                Responsible health boundaries.
              </h3>
              <p className="editorial-privacy-detail">
                IZEM provides adaptive athletic programming and nutrition targets for healthy adults. It does not provide medical diagnosis, physical therapy rehabilitation, or replace an in-person physician. Always consult a healthcare provider before undertaking new high-intensity programs.
              </p>
              <p className="editorial-privacy-detail">
                Eligible call and notification preferences can be changed in the app. You can revoke notification, microphone, camera and Health permissions in your device settings.
              </p>
            </div>

            <div className="editorial-privacy-links">
              <a href="/editorial-policy.html" className="editorial-link">
                Review our Editorial Standards →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
