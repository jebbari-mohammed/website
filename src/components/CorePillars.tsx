import { motion } from '../lib/motion';
import { ArrowRight, Activity } from 'lucide-react';

export default function CorePillars() {
  return (
    <section id="features" className="editorial-section editorial-pillars">
      <div className="editorial-container">
        <div className="editorial-section-heading">
          <p className="editorial-eyebrow">FOUR CONNECTED COACHING PILLARS</p>
          <h2 className="editorial-title">
            The Value Is in the Connection Between Features.
          </h2>
          <p className="editorial-intro">
            Workouts, nutrition, scans, progress and coach conversations can use the same profile. That is the difference between a collection of tools and a coaching loop.
          </p>
        </div>

        <div className="editorial-pillars-grid">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="editorial-pillar editorial-pillar-voice"
          >
            <div className="editorial-pillar-copy">
              <p className="editorial-eyebrow">Accountability</p>
              <h3>Live Voice Calls in Both Directions</h3>
              <p className="editorial-pillar-lead">
                Premium members can call the coach, and optional coach-initiated calls can support workout and review moments.
              </p>
              <p className="editorial-pillar-body">
                The call can use relevant non-Health coaching context such as today’s workout, recent training, current meals and saved preferences. When offered during onboarding, eligible non-subscribers can try one complimentary coach call, once, capped at three connected minutes.
              </p>
              <div className="editorial-pillar-footer">
                <a href="/fitness-app-that-calls-you/" className="editorial-text-link">
                  <span>Read how voice calling works</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="editorial-pillar-evidence editorial-call-directions">
              <div className="editorial-call-direction">
                <p className="editorial-evidence-label">You call the coach</p>
                <p>Ask about today’s workout, a meal change or the plan you already have.</p>
              </div>
              <div className="editorial-call-direction">
                <p className="editorial-evidence-label">Coach calls you</p>
                <p>When enabled and eligible, proactive calls can support accountability around your schedule.</p>
              </div>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="editorial-pillar editorial-pillar-scans"
          >
            <div className="editorial-pillar-copy">
              <p className="editorial-eyebrow">Vision AI</p>
              <h3>Food, Equipment & Body-Progress Scans</h3>
              <p className="editorial-pillar-lead">
                Optional camera tools add context without pretending the camera is a medical device.
              </p>
              <p className="editorial-pillar-body">
                Use a meal photo for calorie/macro estimates, identify gym equipment for general setup and exercise ideas, or create approximate body-progress baselines. Scan output can be incomplete or wrong and should be treated as coaching context.
              </p>
            </div>

            <ul className="editorial-pillar-evidence editorial-scan-list">
              {['Food photo → estimated calories/macros', 'Equipment photo → identification + exercise ideas', 'Body progress → approximate visual baseline/trend'].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>

            <div className="editorial-pillar-footer">
              <a href="/features/body-scanning" className="editorial-text-link">
                <span>Learn about visual scans</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="editorial-pillar editorial-pillar-meals"
          >
            <div className="editorial-pillar-copy">
              <p className="editorial-eyebrow">Nutrition</p>
              <h3>Meal Plans, Meal Changes & Grocery Lists</h3>
              <p className="editorial-pillar-lead">
                Dietary preferences and allergies are real plan inputs, not marketing footnotes.
              </p>
              <p className="editorial-pillar-body">
                IZEM can build meal plans around your diet preference, allergies, meal count and calorie/macro targets. Supported meals can be replaced, logged meals stay visible to the coach, and the active plan produces a grocery list.
              </p>
            </div>

            <ul className="editorial-pillar-evidence editorial-meal-list">
              {['Diet preferences + allergies', 'Calories + macro targets', 'Meal replacement + meal logging', 'Generated grocery list'].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>

            <div className="editorial-pillar-footer">
              <a href="/features/ai-meal-planner" className="editorial-text-link">
                <span>Explore AI meal planner</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="editorial-pillar editorial-pillar-training"
          >
            <div className="editorial-pillar-copy">
              <p className="editorial-eyebrow">Adaptation</p>
              <h3>Training History the Coach Can Actually Use</h3>
              <p className="editorial-pillar-lead">
                Sets, reps, load, partial completion and effort feedback are more useful than invented telemetry.
              </p>
              <p className="editorial-pillar-body">
                IZEM records what you complete and can use that history for progression, review and supported plan changes. If a workout is only partially completed, the system can represent it as partial instead of pretending the entire session happened.
              </p>
              <div className="editorial-pillar-footer">
                <a href="/features/ai-workout-generator" className="editorial-text-link">
                  <span>See AI workout planning</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="editorial-pillar-evidence editorial-training-evidence">
              <div className="editorial-training-heading">
                <span className="editorial-evidence-label">
                  <Activity size={16} aria-hidden="true" /> Logged training evidence
                </span>
                <span className="editorial-evidence-caption">Used for future coaching</span>
              </div>
              <ul className="editorial-training-list">
                {['Sets / reps / load', 'Full or partial completion', 'Workout history', 'Difficulty / effort feedback'].map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
