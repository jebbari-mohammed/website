import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-[140px] px-4 sm:px-6 relative overflow-hidden">
      {/* Dramatic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/8 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary/15 to-secondary/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-condensed leading-[0.95] tracking-tighter mb-6 sm:mb-8">
            STOP PAYING<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">$150/MONTH</span><br />
            <span className="text-textSecondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl">FOR A COACH AVAILABLE</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 text-2xl sm:text-4xl md:text-5xl lg:text-6xl">2 HOURS A WEEK.</span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-xl md:text-2xl text-textSecondary max-w-[700px] mx-auto leading-relaxed font-light mb-8 sm:mb-12 px-2"
          >
            Get a coach who <strong className="text-textPrimary font-semibold">knows you</strong>, <strong className="text-textPrimary font-semibold">calls you</strong>, 
            builds your workouts, plans your meals, and <strong className="text-primary font-semibold">never gives up on you</strong> — for almost free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(0,212,255,0.5)" }}
              whileTap={{ scale: 0.95 }}
              href="https://apps.apple.com/app/your-ai-coach"
              className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-semibold bg-gradient-to-r from-primary to-secondary text-white overflow-hidden group transition-all text-base sm:text-lg shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="text-2xl sm:text-3xl relative z-10">🍎</span>
              <div className="flex flex-col leading-[1.1] relative z-10 text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-90 font-medium">Download on the</span>
                <span className="text-base sm:text-[20px] font-condensed uppercase tracking-wide">App Store</span>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://play.google.com/store/apps/details?id=com.ai.gym.coach"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-semibold bg-[#0A102E]/60 border border-white/15 hover:border-primary/50 text-white backdrop-blur-xl transition-all duration-300 shadow-xl text-base sm:text-lg"
            >
              <span className="text-2xl sm:text-3xl">▶</span>
              <div className="flex flex-col leading-[1.1] text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium">Get it on</span>
                <span className="text-base sm:text-[20px] font-condensed uppercase tracking-wide">Google Play</span>
              </div>
            </motion.a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-textSecondary/50"
          >
            <span>✓ Free to download</span>
            <span>✓ No credit card</span>
            <span>✓ iOS & Android</span>
            <span>✓ Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
