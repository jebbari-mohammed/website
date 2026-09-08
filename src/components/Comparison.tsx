import { motion } from '../lib/motion';
import { Check, X, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const trackerDrawbacks = [
  'Waits for you to manually log sets after the workout',
  'Shows graphs and charts but leaves the next decision up to you',
  'Rigid templates that break as soon as you miss a day',
  'Disconnected workout and nutrition trackers that do not coordinate',
  'Silent notifications that get swiped away and ignored',
];

const izemAdvantages = [
  'Proactive scheduled phone calls before workouts to build real consistency',
  '60 FPS video form demos with exact technique and setup cues',
  'Automatic weekly volume and exercise adaptations when life gets busy',
  'Unified workout & meal planning with smart social macro banking',
  'Apple Health sync to protect joints and adapt to fatigue in real time',
];

export default function Comparison() {
  return (
    <section id="comparison" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Zap size={13} className="text-primary fill-primary" />
            <span>TRACKER VS. COACH</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            A Tracker Records. A Coach Responds.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Logging data does not build muscle or burn fat—taking the right action does. Compare how IZEM differs from traditional fitness apps.
          </p>
        </motion.div>

        {/* Side-by-Side Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {/* Traditional Trackers */}
          <div className="rounded-3xl p-7 sm:p-9 bg-[#0B0F15]/90 border border-white/[0.08] shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-bold text-textSecondary uppercase tracking-wider mb-5">
                Traditional Fitness Trackers
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary mb-4">
                Passive Logging & Disconnected Tools
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                Most apps are passive digital spreadsheets. They record when you succeed and stay silent when you struggle.
              </p>

              <ul className="space-y-4">
                {trackerDrawbacks.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-textSecondary leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                      <X size={12} strokeWidth={2.5} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-xs text-textSecondary/70">
              Leaves you to plan workouts, count macros, and find motivation alone.
            </div>
          </div>

          {/* IZEM AI Fitness Coach */}
          <div className="rounded-3xl p-7 sm:p-9 specular-card border-2 border-primary/40 shadow-[0_20px_60px_rgba(141,255,106,0.18)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-primary/[0.1] blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-primary uppercase tracking-wider mb-5 shadow-sm">
                <Sparkles size={12} />
                <span>IZEM AI Personal Trainer</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary mb-4">
                Active Guidance & Real Accountability
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                An intelligent partner that monitors your recovery, calls your phone, and recalibrates your training when life shifts.
              </p>

              <ul className="space-y-4">
                {izemAdvantages.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-textPrimary font-medium leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-primary/25 border border-primary/50 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08]">
              <a
                href="/izem-ai-fitness-coach/"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] hover:scale-[1.01] transition-all shadow-[0_0_25px_rgba(141,255,106,0.3)]"
              >
                <span>Experience the Difference</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Trust & Boundary Banner */}
        <div className="rounded-2xl p-5 sm:p-6 bg-[#0E151B]/80 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-primary shrink-0" />
            <p className="text-xs sm:text-sm text-textSecondary">
              <strong className="text-textPrimary">Responsible guidance:</strong> IZEM provides fitness and nutritional coaching. It does not replace medical care or diagnose injuries. Call times remain 100% under your control.
            </p>
          </div>
          <div className="shrink-0">
            <a
              href="/editorial-policy.html"
              className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
            >
              Read Editorial Policy →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
