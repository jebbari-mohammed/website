import { motion } from '../lib/motion';
import { Phone, Star, Flame, Dumbbell } from 'lucide-react';

export default function Hero() {
  return (
    <section id="download" className="relative min-h-screen flex items-center pt-[120px] pb-[80px] px-6 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 hidden h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[160px] pointer-events-none z-0 lg:block" />

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60 z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 bg-[#111A22]/90 border border-primary/30 rounded-full px-4 py-2 text-[13px] text-primary font-bold tracking-wider mb-8 backdrop-blur-md shadow-[0_0_25px_rgba(141,255,106,0.2)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            PREMIUM AI PERSONAL TRAINER
          </motion.div>

          <h1 className="text-5xl md:text-[72px] lg:text-[84px] font-black font-display leading-[0.9] tracking-normal mb-6 relative z-10">
            <span className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -z-10 opacity-60 rounded-[40px]"></span>
            THE AI FITNESS COACH<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-secondary">
              THAT PLANS, REVIEWS, ADAPTS.
            </span>
          </h1>

          <p className="text-lg md:text-[20px] text-textSecondary mb-8 max-w-[540px] leading-relaxed font-sans font-normal">
            IZEM is the premium AI personal trainer that builds your <strong className="text-textPrimary font-semibold">weekly workout plan and meal plan</strong>, scans food, body progress, and gym equipment, reviews your day, remembers your context, adapts every week, and can call you for accountability.
            <span className="text-primary font-medium"> See the full <a href="/izem-ai-fitness-coach/" className="underline hover:text-secondary transition-colors">IZEM AI Fitness Coach answer page</a>.</span>
          </p>

          {/* Key highlights */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: Dumbbell, text: "Full workout plan" },
              { icon: Star, text: "Meal plan every week" },
              { icon: Flame, text: "Food, body, machine scans" },
              { icon: Phone, text: "Coach calls you" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111A22] border border-white/10 text-sm text-textSecondary hover:border-primary/30 transition-colors"
              >
                <item.icon size={14} className="text-primary" />
                {item.text}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <motion.a
              whileHover={{ scale: 1.04, boxShadow: "0 0 45px rgba(141,255,106,0.45)" }}
              whileTap={{ scale: 0.96 }}
              href="/izem-ai-fitness-coach/"
              className="relative inline-flex items-center gap-3 px-8 py-4 rounded-[20px] font-extrabold bg-gradient-to-r from-primary via-[#D8FF86] to-secondary text-[#070A0D] overflow-hidden group transition-all shadow-[0_0_25px_rgba(141,255,106,0.3)]"
            >
              <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Dumbbell className="w-7 h-7 relative z-10 text-[#070A0D]" />
              <div className="flex flex-col leading-[1.1] relative z-10 text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-90 font-bold font-sans">See the full</span>
                <span className="text-[17px] font-display uppercase tracking-wide">AI Fitness Coach</span>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.04, backgroundColor: "rgba(23,35,45,0.9)", borderColor: "rgba(141,255,106,0.4)" }}
              whileTap={{ scale: 0.96 }}
              href="/features/ai-workout-generator"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-[20px] font-semibold bg-[#111A22]/90 border border-white/15 hover:border-primary/50 text-textPrimary backdrop-blur-xl transition-all duration-300 shadow-xl"
            >
              <Star className="w-7 h-7 text-primary" />
              <div className="flex flex-col leading-[1.1] text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium font-sans">See how</span>
                <span className="text-[17px] font-display uppercase tracking-wide">Plans Adapt</span>
              </div>
            </motion.a>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-textSecondary font-sans opacity-90 pl-2">
              <strong>$24.99/month premium coaching</strong> • Annual plan best value
            </p>
            {/* Social proof bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-wrap gap-6 text-sm text-textSecondary/80"
            >
              <span className="flex items-center gap-1.5"><Dumbbell size={14} className="text-cta" /> Weekly workouts and meals</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-tertiary" /> Food, body, equipment scans</span>
              <span className="flex items-center gap-1.5"><Phone size={14} className="text-primary" /> Optional real phone calls</span>
            </motion.div>
          </div>
        </motion.div>

        <div className="hidden lg:block relative h-[600px] w-full" style={{ perspective: "1000px" }}>
          {/* Main Primary Phone */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-[280px] h-[580px] rounded-[48px] bg-[#0E151B] border-[2px] border-primary/30 p-2 shadow-[0_25px_60px_rgba(0,0,0,0.9),_inset_0_0_20px_rgba(141,255,106,0.1)] z-20"
            whileHover={{ scale: 1.02, rotateY: -5, rotateX: 5 }}
          >
            {/* Ringing pulse effect */}
            <div className="absolute -inset-3 rounded-[56px] bg-gradient-to-r from-primary/25 to-secondary/25 blur-xl animate-pulse opacity-70 pointer-events-none" />
            <div className="w-full h-full rounded-[38px] border border-white/10 overflow-hidden bg-black relative">
              <div
                role="img"
                aria-label="IZEM interface"
                className="w-full h-full bg-[url('/images/hero1-desktop.webp')] bg-cover bg-center"
              />
            </div>
          </motion.div>

          {/* Secondary Phone Float */}
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[80px] -left-10 w-[240px] h-[500px] rounded-[40px] bg-[#070A0D] border-[2px] border-white/10 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.95)] z-10 opacity-70"
          >
            <div className="w-full h-full rounded-[30px] border border-white/5 overflow-hidden bg-black relative">
              <div
                role="img"
                aria-label="Streak tracking in AI Coach app"
                className="w-full h-full bg-[url('/images/hero2-desktop.webp')] bg-cover bg-center"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
