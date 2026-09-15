import { useState } from 'react';
import { motion } from '../lib/motion';
import { ArrowRight, Calculator, Info, Sparkles } from 'lucide-react';

export default function TrainerCostCalculator() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [sessionRate, setSessionRate] = useState(65);

  const monthlyTrainerBudget = sessionsPerWeek * 4.33 * sessionRate;
  const yearlyTrainerBudget = monthlyTrainerBudget * 12;

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/[0.05] blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Calculator size={13} className="text-primary" />
            <span>PERSONAL COACHING BUDGET CALCULATOR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            Compare Against Your Own Trainer Quote.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Trainer pricing varies enormously by location, credentials, session length, facility, and service model. Enter the rate you were actually quoted instead of relying on a made-up “average.”
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 sm:p-10 specular-card shadow-2xl relative overflow-hidden"
        >
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="session-slider" className="text-sm font-semibold text-textSecondary">
                    Trainer sessions per week:
                  </label>
                  <span className="text-2xl font-extrabold text-primary font-mono">
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
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
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
                  <span className="text-xl font-extrabold text-secondary font-mono">
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
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.12] px-4 py-3 text-textPrimary font-mono outline-none focus:border-primary/60"
                />
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 text-sm text-textSecondary leading-relaxed">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-primary shrink-0 mt-0.5" />
                  <p>
                    A human trainer and an AI app are not interchangeable services. Human coaches can provide hands-on observation, technique feedback, relationship depth, and professional judgment that software cannot replace. This calculator compares budget only.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.1] relative">
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/[0.08]">
                  <div>
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">
                      Your trainer input
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
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary mb-1">
                      <Sparkles size={10} /> IZEM
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
                      Store
                      <span className="text-xs font-normal text-textSecondary"> price</span>
                    </p>
                    <p className="text-[11px] text-primary/80 mt-1">
                      Exact current terms shown before purchase
                    </p>
                  </div>
                </div>

                <div className="pt-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-1">
                    Your Entered Trainer Budget
                  </p>
                  <p className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C8FF7E] to-secondary font-mono">
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
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] transition-all shadow-[0_0_20px_rgba(141,255,106,0.3)]"
              >
                <span>Compare Against IZEM’s Current Store Offer</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
