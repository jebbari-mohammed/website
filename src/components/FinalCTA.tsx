import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import storeLinks from '../content/store-links.json';

export default function FinalCTA() {
  return (
    <section className="editorial-section editorial-final">

      <div className="editorial-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="editorial-eyebrow">
            <span>AVAILABLE NOW ON GOOGLE PLAY</span>
          </div>

          <h2 className="editorial-title">
            One profile for training, nutrition,<br />
            <span className="editorial-final-title-detail">
              progress, chat and live coaching.
            </span>
          </h2>

          <p className="editorial-intro">
            Explore exactly how IZEM connects personalized workouts, meal plans and grocery lists, real training history, scans, AI chat, and optional live coach calls—without invented testimonials or guaranteed outcomes.
          </p>

          <div className="editorial-final-actions">
            <a
              href={storeLinks.google}
              className="editorial-button"
            >
              <span>Get it on Google Play</span>
              <ArrowRight size={18} />
            </a>

            <a
              href="/workout-consistency-calculator/"
              className="editorial-button editorial-button-secondary"
            >
              <span>Calculate Consistency Score</span>
            </a>
          </div>

          <div className="editorial-final-details">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} aria-hidden="true" />
              The free website tool is available now
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} aria-hidden="true" />
              Available for Android on Google Play
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} aria-hidden="true" />
              In-app account deletion flow
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
