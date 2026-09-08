import { useState } from 'react';
import { motion } from '../lib/motion';
import { Calculator, ArrowRight, Check, X, Sparkles } from 'lucide-react';

export default function TrainerCostCalculator() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const sessionRate = 65; // realistic avg rate per session

  const monthlyTrainerCost = sessionsPerWeek * 4.33 * sessionRate;
  const yearlyTrainerCost = monthlyTrainerCost * 12;

  const izemMonthly = 24.99;
  const izemYearly = izemMonthly * 12;

  const annualSavings = Math.round(yearlyTrainerCost - izemYearly);

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C]">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/[0.05] blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Calculator size={13} className="text-primary" />
            <span>INTERACTIVE ROI CALCULATOR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            Personal Trainer vs. IZEM AI Coach
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            See how much you save every year while getting 10x more daily accountability, nutrition planning, and 24/7 adaptation.
          </p>
        </div>

        {/* Interactive Calculator Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 sm:p-10 specular-card shadow-2xl relative overflow-hidden"
        >
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Interactive Controls */}
            <div className="lg:col-span-6">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="session-slider" className="text-sm font-semibold text-textSecondary">
                    Workouts per week:
                  </label>
                  <span className="text-2xl font-extrabold text-primary font-mono">
                    {sessionsPerWeek} sessions
                  </span>
                </div>

                <input
                  id="session-slider"
                  type="range"
                  min="2"
                  max="6"
                  step="1"
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />

                <div className="flex justify-between text-[11px] text-textSecondary/60 mt-2 font-mono">
                  <span>2 days</span>
                  <span>3 days</span>
                  <span>4 days</span>
                  <span>5 days</span>
                  <span>6 days</span>
                </div>
              </div>

              {/* Quick Spec Matrix */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-textSecondary">Pre-workout phone call accountability</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <X size={13} /> Trainer
                    </span>
                    <span className="text-primary font-bold text-xs flex items-center gap-1">
                      <Check size={13} /> IZEM
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-textSecondary">Computer vision food & gym scans</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <X size={13} /> Trainer
                    </span>
                    <span className="text-primary font-bold text-xs flex items-center gap-1">
                      <Check size={13} /> IZEM
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-textSecondary">24/7 Plan adaptation when travel or meetings hit</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <X size={13} /> Trainer
                    </span>
                    <span className="text-primary font-bold text-xs flex items-center gap-1">
                      <Check size={13} /> IZEM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Numbers Comparison Card */}
            <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.1] relative">
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/[0.08]">
                  <div>
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">
                      In-Person Trainer
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white/60 font-mono line-through decoration-red-400/80">
                      ${Math.round(monthlyTrainerCost)}
                      <span className="text-xs font-normal text-textSecondary">/mo</span>
                    </p>
                    <p className="text-[11px] text-textSecondary/70 mt-1 font-mono">
                      ${Math.round(yearlyTrainerCost).toLocaleString()}/year
                    </p>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary mb-1">
                      <Sparkles size={10} /> IZEM COACH
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
                      $24.99
                      <span className="text-xs font-normal text-textSecondary">/mo</span>
                    </p>
                    <p className="text-[11px] text-primary/80 mt-1 font-mono">
                      $299.88/year
                    </p>
                  </div>
                </div>

                {/* Big Annual Savings Readout */}
                <div className="pt-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-textSecondary mb-1">
                    Your Projected Annual Savings
                  </p>
                  <p className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C8FF7E] to-secondary font-mono">
                    +${annualSavings.toLocaleString()}
                    <span className="text-sm font-sans font-medium text-textSecondary"> / year</span>
                  </p>
                  <p className="text-xs text-textSecondary mt-2">
                    Structured weekly hypertrophy programming and meal guidance—without paying $65/hr or rigid in-person bookings.
                  </p>
                </div>
              </div>

              <div>
                <a
                  href="/izem-ai-fitness-coach/"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] transition-all shadow-[0_0_20px_rgba(141,255,106,0.3)]"
                >
                  <span>Start Coaching for $24.99/mo</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
