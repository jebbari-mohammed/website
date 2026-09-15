import { motion } from '../lib/motion';
import { ArrowRight, Check, Circle, ShieldCheck, Sparkles, Zap } from 'lucide-react';

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
    <section id="comparison" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]">
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Zap size={13} className="text-primary fill-primary" />
            <span>LOGGING VS. CONNECTED COACHING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            A Log Tells You What Happened. IZEM Is Built to Help With What Comes Next.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            This is a product-model comparison, not a claim that every other fitness app works the same way. A simple tracker can be the right choice if logging is all you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          <div className="rounded-3xl p-7 sm:p-9 bg-[#0B0F15]/90 border border-white/[0.08] shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-bold text-textSecondary uppercase tracking-wider mb-5">
                Basic log-only workflow
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary mb-4">
                Useful When You Already Know the Next Decision
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                A straightforward tracker can be excellent for experienced users who mainly want a clean record and prefer to make programming and nutrition decisions themselves.
              </p>

              <ul className="space-y-4">
                {basicLogging.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-textSecondary leading-relaxed">
                    <div className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.12] flex items-center justify-center text-textSecondary shrink-0 mt-0.5">
                      <Circle size={9} fill="currentColor" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-xs text-textSecondary/70">
              No criticism implied: for many people, simple logging is the right product.
            </div>
          </div>

          <div className="rounded-3xl p-7 sm:p-9 specular-card border-2 border-primary/40 shadow-[0_20px_60px_rgba(141,255,106,0.18)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-primary/[0.1] blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-primary uppercase tracking-wider mb-5 shadow-sm">
                <Sparkles size={12} />
                <span>IZEM connected coaching</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-textPrimary mb-4">
                Planning, Logging, Conversation and Adjustment in One Profile
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                IZEM is aimed at people who want the app to connect training, nutrition, progress and coaching context rather than only store a workout history.
              </p>

              <ul className="space-y-4">
                {izemCapabilities.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-textPrimary font-medium leading-relaxed">
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
                <span>See the Exact Product Facts</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 sm:p-6 bg-[#0E151B]/80 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-primary shrink-0" />
            <p className="text-xs sm:text-sm text-textSecondary">
              <strong className="text-textPrimary">Responsible guidance:</strong> IZEM provides general fitness and nutrition coaching. It does not diagnose injuries, replace medical care, or provide hands-on lifting supervision. Voice features are optional and account-dependent.
            </p>
          </div>
          <div className="shrink-0">
            <a href="/editorial-policy.html" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              Read Editorial Policy →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
