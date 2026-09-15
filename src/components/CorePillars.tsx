import { motion } from '../lib/motion';
import { Phone, Brain, Utensils, Camera, ArrowRight, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

export default function CorePillars() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C]">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-primary/[0.04] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Sparkles size={13} className="text-primary" />
            <span>FOUR CONNECTED COACHING PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            The Value Is in the Connection Between Features.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Workouts, nutrition, scans, progress and coach conversations can use the same profile. That is the difference between a collection of tools and a coaching loop.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 specular-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-[#070A0D] transition-colors duration-300 shadow-sm">
                  <Phone size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  Accountability
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2 tracking-tight">
                Live Voice Calls in Both Directions
              </h3>
              <p className="text-base font-semibold text-primary mb-3 leading-snug">
                Premium members can call the coach, and optional coach-initiated calls can support workout and review moments.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                The call can use relevant coaching context such as today’s workout, recent training, current meals and saved preferences. Eligible non-subscribers can receive one complimentary onboarding coach call capped at 5 minutes before deciding whether to join.
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#090D13]/90 border border-white/[0.1] shadow-inner mb-6 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">You call the coach</p>
                  <p className="text-xs text-textSecondary">Ask about today’s workout, a meal change or the plan you already have.</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-1">Coach calls you</p>
                  <p className="text-xs text-textSecondary">When enabled and eligible, proactive calls can support accountability around your schedule.</p>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07] relative z-10">
              <a
                href="/fitness-app-that-calls-you/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors"
              >
                <span>Read how voice calling works</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 specular-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-[#070A0D] transition-colors duration-300 shadow-sm">
                  <Camera size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-secondary px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                  Vision AI
                </span>
              </div>

              <h3 className="text-2xl font-bold text-textPrimary mb-2 tracking-tight">
                Food, Equipment & Body-Progress Scans
              </h3>
              <p className="text-sm sm:text-base font-semibold text-secondary mb-3 leading-snug">
                Optional camera tools add context without pretending the camera is a medical device.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                Use a meal photo for calorie/macro estimates, identify gym equipment for general setup and exercise ideas, or create approximate body-progress baselines. Scan output can be incomplete or wrong and should be treated as coaching context.
              </p>

              <div className="p-3.5 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] space-y-2 mb-6">
                {['Food photo → estimated calories/macros', 'Equipment photo → identification + exercise ideas', 'Body progress → approximate visual baseline/trend'].map((text) => (
                  <div key={text} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <CheckCircle2 size={14} className="text-secondary mt-0.5 shrink-0" />
                    <span className="text-textSecondary">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07]">
              <a
                href="/features/body-scanning"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-secondary transition-colors"
              >
                <span>Learn about visual scans</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-5 specular-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-[#070A0D] transition-colors duration-300 shadow-sm">
                  <Utensils size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  Nutrition
                </span>
              </div>

              <h3 className="text-2xl font-bold text-textPrimary mb-2 tracking-tight">
                Meal Plans, Meal Changes & Grocery Lists
              </h3>
              <p className="text-sm sm:text-base font-semibold text-primary mb-3 leading-snug">
                Dietary preferences and allergies are real plan inputs, not marketing footnotes.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                IZEM can build meal plans around your diet preference, allergies, meal count and calorie/macro targets. Supported meals can be replaced, logged meals stay visible to the coach, and the active plan produces a grocery list.
              </p>

              <div className="p-4 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] mb-6 space-y-2">
                {['Diet preferences + allergies', 'Calories + macro targets', 'Meal replacement + meal logging', 'Generated grocery list'].map((text) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-textSecondary">
                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07]">
              <a
                href="/features/ai-meal-planner"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors"
              >
                <span>Explore AI meal planner</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-7 specular-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-[#070A0D] transition-colors duration-300 shadow-sm">
                  <Brain size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-secondary px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                  Adaptation
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2 tracking-tight">
                Training History the Coach Can Actually Use
              </h3>
              <p className="text-base font-semibold text-secondary mb-3 leading-snug">
                Sets, reps, load, partial completion and effort feedback are more useful than invented telemetry.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                IZEM records what you complete and can use that history for progression, review and supported plan changes. If a workout is only partially completed, the system can represent it as partial instead of pretending the entire session happened.
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] mb-6">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-textSecondary flex items-center gap-1.5 font-medium">
                    <Activity size={14} className="text-primary" /> Logged training evidence
                  </span>
                  <span className="text-primary font-semibold">Used for future coaching</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {['Sets / reps / load', 'Full or partial completion', 'Workout history', 'Difficulty / effort feedback'].map((text) => (
                    <div key={text} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-textSecondary flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-primary shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07]">
              <a
                href="/features/ai-workout-generator"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-secondary transition-colors"
              >
                <span>See AI workout planning</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
