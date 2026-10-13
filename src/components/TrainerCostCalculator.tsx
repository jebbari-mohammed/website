import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, Calculator, Info } from 'lucide-react';

export default function TrainerCostCalculator() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [sessionRate, setSessionRate] = useState(65);

  const monthlyTrainerBudget = sessionsPerWeek * 4.33 * sessionRate;
  const yearlyTrainerBudget = monthlyTrainerBudget * 12;

  return (
    <section id="trainer-budget" className="editorial-section editorial-calculator">

      <div className="editorial-container">
        <div className="editorial-section-heading">
          <div className="editorial-eyebrow">
            <Calculator size={13} className="text-primary" />
            <span>PERSONAL COACHING BUDGET CALCULATOR</span>
          </div>
          <h2 className="editorial-title">
            Compare Against Your Own Trainer Quote.
          </h2>
          <p className="editorial-intro">
            Trainer pricing varies enormously by location, credentials, session length, facility, and service model. Replace the example inputs below with the rate you were actually quoted.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="editorial-calculator-sheet"
        >
          <div className="editorial-calculator-grid">
            <div className="editorial-calculator-inputs">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="session-slider" className="text-sm font-semibold text-textSecondary">
                    Trainer sessions per week:
                  </label>
                  <span className="editorial-calculator-input-value">
                    {sessionsPerWeek}
                  </span>
                </div>
                <input
                  id="session-slider"
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={sessionsPerWeek}
                  onChange={(event) => setSessionsPerWeek(Number(event.target.value))}
                  className="editorial-range"
                />
                <div className="flex justify-between text-[11px] text-textSecondary/60 mt-2 font-mono">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="rate-input" className="text-sm font-semibold text-textSecondary">
                    Your quoted price per session (USD):
                  </label>
                  <span className="editorial-calculator-input-value">
                    ${sessionRate}
                  </span>
                </div>
                <input
                  id="rate-input"
                  type="number"
                  min="0"
                  max="1000"
                  step="5"
                  inputMode="decimal"
                  value={sessionRate}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setSessionRate(Number.isFinite(next) ? Math.min(1000, Math.max(0, next)) : 0);
                  }}
                  className="editorial-number-input"
                />
              </div>

              <div className="editorial-calculator-note">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    A human trainer and an AI app are not interchangeable services. Human coaches can provide hands-on observation, technique feedback, relationship depth, and professional judgment that software cannot replace. This calculator compares budget only.
                  </p>
                </div>
              </div>
            </div>

            <div className="editorial-calculator-result">
              <div className="mb-6">
                <div className="editorial-budget-summary">
                  <div>
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">
                      Example / entered budget
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-textPrimary font-mono">
                      ${Math.round(monthlyTrainerBudget).toLocaleString()}
                      <span className="text-xs font-normal text-textSecondary">/mo</span>
                    </p>
                    <p className="text-[11px] text-textSecondary/70 mt-1 font-mono">
                      ${Math.round(yearlyTrainerBudget).toLocaleString()}/year
                    </p>
                  </div>

                  <div>
                    <div className="editorial-budget-label">
                      IZEM
                    </div>
                    <p className="editorial-budget-status">
                      Prelaunch
                    </p>
                    <p className="text-[11px] text-primary/80 mt-1">
                      App awaiting store review
                    </p>
                  </div>
                </div>

                <div className="editorial-budget-total">
                  <p className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-1">
                    Your Entered Trainer Budget
                  </p>
                  <p className="editorial-budget-amount">
                    ${Math.round(yearlyTrainerBudget).toLocaleString()}
                    <span className="text-sm font-sans font-medium text-textSecondary"> / year</span>
                  </p>
                  <p className="text-xs text-textSecondary mt-3 leading-relaxed">
                    Calculated as your entered session rate × sessions per week × 4.33 weeks × 12 months. It does not estimate trainer quality, outcomes, or the value of in-person supervision.
                  </p>
                </div>
              </div>

              <a
                href="/izem-ai-fitness-coach/"
                className="editorial-button editorial-button-secondary"
              >
                <span>Read IZEM’s Product Information</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
