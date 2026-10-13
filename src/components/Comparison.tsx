import { motion } from '../lib/motion';
import { ArrowRight, Check, Circle, ShieldCheck } from 'lucide-react';

const basicLogging = [
  'Records exercises, sets, or completed activity',
  'Shows history so you can review what happened',
  'Leaves workout changes and meal decisions to the user unless coaching features are added',
  'Can be exactly enough for someone who already knows how to program and adjust their own training',
];

const izemCapabilities = [
  'Personalized weekly workout plans plus sets, reps, load, history, effort feedback, and partial-workout logging',
  'Meal plans using preferences and allergies, with supported meal changes, meal logging, and a generated grocery list',
  'AI text chat plus premium user-initiated live calls and optional coach-initiated accountability calls when enabled',
  'Food, equipment, and body-progress scans for non-clinical coaching context',
  'Optional Apple Health context on supported iPhones after separate permission and consent',
];

export default function Comparison() {
  return (
    <section id="comparison" className="editorial-section editorial-comparison">
      <div className="editorial-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="editorial-section-heading"
        >
          <div className="editorial-eyebrow">
            <span>LOGGING VS. CONNECTED COACHING</span>
          </div>
          <h2 className="editorial-title">
            A Log Tells You What Happened. IZEM Is Built to Help With What Comes Next.
          </h2>
          <p className="editorial-intro">
            This is a product-model comparison, not a claim that every other fitness app works the same way. A simple tracker can be the right choice if logging is all you need.
          </p>
        </motion.div>

        <div className="editorial-comparison-grid">
          <div className="editorial-comparison-column">
            <div>
              <div className="editorial-eyebrow">
                Basic log-only workflow
              </div>
              <h3 className="editorial-comparison-title">
                Useful When You Already Know the Next Decision
              </h3>
              <p className="editorial-comparison-intro">
                A straightforward tracker can be excellent for experienced users who mainly want a clean record and prefer to make programming and nutrition decisions themselves.
              </p>

              <ul className="editorial-comparison-list">
                {basicLogging.map((item) => (
                  <li key={item} className="editorial-comparison-point">
                    <div className="editorial-comparison-marker">
                      <Circle size={9} fill="currentColor" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="editorial-comparison-footer">
              No criticism implied: for many people, simple logging is the right product.
            </div>
          </div>

          <div className="editorial-comparison-column editorial-comparison-izem">

            <div>
              <div className="editorial-eyebrow">
                <span>IZEM connected coaching</span>
              </div>
              <h3 className="editorial-comparison-title">
                Planning, Logging, Conversation and Adjustment in One Profile
              </h3>
              <p className="editorial-comparison-intro">
                IZEM is aimed at people who want the app to connect training, nutrition, progress and coaching context rather than only store a workout history.
              </p>

              <ul className="editorial-comparison-list">
                {izemCapabilities.map((item) => (
                  <li key={item} className="editorial-comparison-point">
                    <div className="editorial-comparison-marker">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="editorial-comparison-footer">
              <a
                href="/izem-ai-fitness-coach/"
                className="editorial-link"
              >
                <span>See the Exact Product Facts</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="editorial-responsible-note">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-primary shrink-0" />
            <p className="editorial-note-text">
              <strong className="text-textPrimary">Responsible guidance:</strong> IZEM provides general fitness and nutrition coaching. It does not diagnose injuries, replace medical care, or provide hands-on lifting supervision. Voice features are optional and account-dependent.
            </p>
          </div>
          <div className="shrink-0">
            <a href="/editorial-policy.html" className="editorial-link">
              Read Editorial Policy →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
