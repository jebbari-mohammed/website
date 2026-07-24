import { motion } from '../lib/motion';
import { Dumbbell, Star } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-[140px] px-4 sm:px-6 relative overflow-hidden">
      {/* Dramatic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary/20 via-[#D8FF86]/20 to-secondary/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-display leading-[0.95] tracking-tight mb-6 sm:mb-8">
            STOP FIGURING<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">FITNESS OUT ALONE.</span><br />
            <span className="text-textSecondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl">GET AN AI COACH THAT</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-secondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl">CALLS, REVIEWS, ADAPTS.</span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-xl md:text-2xl text-textSecondary max-w-[700px] mx-auto leading-relaxed font-sans font-normal mb-8 sm:mb-12 px-2"
          >
            Get a coach who <strong className="text-textPrimary font-semibold">knows you</strong>, <strong className="text-textPrimary font-semibold">calls you</strong>, 
            builds your workouts, plans your meals, scans your context, and <strong className="text-primary font-bold">updates the plan every week</strong>. About $24.99/month, with the annual plan as the best value.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(141,255,106,0.5)" }}
              whileTap={{ scale: 0.95 }}
              href="/izem-ai-fitness-coach/"
              className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-extrabold bg-gradient-to-r from-primary via-[#D8FF86] to-secondary text-[#070A0D] overflow-hidden group transition-all text-base sm:text-lg shadow-[0_0_30px_rgba(141,255,106,0.35)]"
            >
              <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Dumbbell className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 text-[#070A0D]" />
              <div className="flex flex-col leading-[1.1] relative z-10 text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-90 font-bold font-sans">See the full</span>
                <span className="text-base sm:text-[20px] font-display uppercase tracking-wide">AI Coach</span>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05, backgroundColor: "rgba(23,35,45,0.9)", borderColor: "rgba(141,255,106,0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="/features/ai-meal-planner"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-semibold bg-[#111A22] border border-white/15 hover:border-primary/50 text-textPrimary backdrop-blur-xl transition-all duration-300 shadow-xl text-base sm:text-lg"
            >
              <Star className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              <div className="flex flex-col leading-[1.1] text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium font-sans">See the</span>
                <span className="text-base sm:text-[20px] font-display uppercase tracking-wide">Meal Planner</span>
              </div>
            </motion.a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-textSecondary/70 font-medium"
          >
            <span>✓ $24.99/month premium plan</span>
            <span>✓ Annual plan best value</span>
            <span>✓ Built for iOS & Android</span>
            <span>✓ Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
