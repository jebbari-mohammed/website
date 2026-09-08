import { motion } from '../lib/motion';
import { Phone, Brain, Utensils, Camera, ArrowRight, Sparkles, Activity } from 'lucide-react';

export default function CorePillars() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden bg-[#05080C]">
      {/* Background ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-primary/[0.04] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-primary mb-4">
            <Sparkles size={13} className="text-primary" />
            <span>THE FOUR COACHING PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-tight mb-4">
            A Coach That Acts, Not a Tracker That Waits.
          </h2>
          <p className="text-base sm:text-lg text-textSecondary font-normal leading-relaxed">
            Everything connects into a closed coaching loop. Workouts, nutrition, scans, and daily check-ins inform every single recommendation.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Bento Card 1 (Large Feature Card): Proactive Voice Accountability */}
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
                Proactive Voice Calls
              </h3>
              <p className="text-base font-semibold text-primary mb-3 leading-snug">
                A coach that calls your phone, not another silent notification to swipe away.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                IZEM schedules real phone calls 15 minutes before your planned gym session to verify your readiness, and calls again at night to review completed sets and nutritional adherence.
              </p>

              {/* Micro-UI: Interactive Incoming Call Simulation */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#090D13]/90 border border-white/[0.1] shadow-inner mb-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold animate-pulse">
                      📞
                    </div>
                    <div>
                      <p className="text-xs font-bold text-textPrimary">IZEM AI Coach</p>
                      <p className="text-[11px] text-textSecondary">Incoming call • 5:45 PM Leg Day Check-in</p>
                    </div>
                  </div>
                  {/* Audio Waveform Graphic */}
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <span className="w-1 h-7 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <span className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
                <p className="text-xs text-textSecondary/80 bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                  <span className="text-primary font-semibold">Sample call preview:</span> "Your workout starts in 20 minutes. Last week's squats were completed at 225 lbs. Let's aim for 230 lbs on your first two working sets."
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07] relative z-10">
              <a
                href="/fitness-app-that-calls-you/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors"
              >
                <span>Read voice calling guide</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>

          {/* Bento Card 2: Multimodal Camera Scans */}
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
                Multimodal Camera Scans
              </h3>
              <p className="text-sm sm:text-base font-semibold text-secondary mb-3 leading-snug">
                Scan your food, gym floor, and physique trends.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                Point your camera at gym machines to see if they fit your routine, scan meal plates for instant macro estimation, and track visual body composition privately.
              </p>

              {/* Micro-UI: Camera Recognition Overlay */}
              <div className="p-3.5 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-textPrimary font-medium">📸 Plate Scan</span>
                  <span className="text-primary font-mono font-bold">42g Protein • 610 kcal</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-textPrimary font-medium">🏋️ Machine Scan</span>
                  <span className="text-secondary font-mono font-bold">Chest Press (Subbed)</span>
                </div>
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

          {/* Bento Card 3: Real-World Macro Banking */}
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
                Real-World Macro Banking
              </h3>
              <p className="text-sm sm:text-base font-semibold text-primary mb-3 leading-snug">
                Hit 150g+ protein without giving up social dinners.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                Have a steakhouse or birthday dinner planned? IZEM banks calories from earlier meals so you can enjoy dinner out while keeping your weekly recomposition on target.
              </p>

              {/* Micro-UI: Dynamic Macro Ring */}
              <div className="p-4 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-textSecondary">Dinner Banked Allowance</span>
                  <span className="text-xs font-mono font-bold text-primary">+650 kcal</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary" style={{ width: '65%' }} />
                  <div className="h-full bg-secondary" style={{ width: '35%' }} />
                </div>
                <div className="flex justify-between text-[11px] text-textSecondary/70 mt-2 font-mono">
                  <span>Protein: 154g / 160g</span>
                  <span className="text-primary">Deficit Preserved</span>
                </div>
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

          {/* Bento Card 4: Weekly Training Adaptation */}
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
                Weekly Training Adaptation
              </h3>
              <p className="text-base font-semibold text-secondary mb-3 leading-snug">
                When your week breaks, your plan adapts—it doesn't fail.
              </p>
              <p className="text-sm text-textSecondary leading-relaxed mb-6">
                Missed Wednesday? Running on 4 hours of sleep? Gym equipment occupied? IZEM recalculates volume, offers biomechanical exercise substitutions, and keeps progressive overload moving forward.
              </p>

              {/* Micro-UI: Progression & Adaptation Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#090D13]/90 border border-white/[0.08] mb-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-textSecondary flex items-center gap-1.5 font-medium">
                    <Activity size={14} className="text-primary" /> Double Progression Engine
                  </span>
                  <span className="text-primary font-mono font-bold">+5 lbs next session</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-textSecondary flex items-center justify-between">
                  <span>Bar velocity: 0.62 m/s (Clean lockouts)</span>
                  <span className="text-textPrimary font-semibold">RPE 7.5 ✓</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/[0.07]">
              <a
                href="/features/ai-workout-generator"
                className="inline-flex items-center gap-2 text-sm font-semibold text-textPrimary group-hover:text-secondary transition-colors"
              >
                <span>See AI workout generator</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
