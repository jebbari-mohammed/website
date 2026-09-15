import { motion } from '../lib/motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden bg-[#05080C]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-primary/[0.07] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] text-xs font-semibold text-primary mb-6">
            <Sparkles size={13} className="text-primary" />
            <span>SEE THE CURRENT PRODUCT</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-textPrimary leading-[1.1] mb-6">
            One profile for training, nutrition,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C8FF7E] to-secondary">
              progress, chat and live coaching.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Explore exactly how IZEM connects personalized workouts, meal plans and grocery lists, real training history, scans, AI chat, and optional live coach calls—without invented testimonials or guaranteed outcomes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href="/izem-ai-fitness-coach/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold bg-primary text-[#070A0D] hover:bg-[#A3FF85] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_0_35px_rgba(141,255,106,0.35)]"
            >
              <span>Read Current Product Facts</span>
              <ArrowRight size={18} />
            </a>

            <a
              href="/workout-consistency-calculator/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-medium text-textPrimary bg-white/[0.04] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-200"
            >
              <span>Calculate Consistency Score</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-textSecondary/70 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              Storefront terms control price and eligibility
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              Built for iOS & Android
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              In-app account deletion flow
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
