import { motion } from '../lib/motion';

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
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-condensed leading-[0.95] tracking-normal mb-6 sm:mb-8">
            STOP FIGURING<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">FITNESS OUT ALONE.</span><br />
            <span className="text-textSecondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl">GET AN AI COACH THAT</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-2xl sm:text-4xl md:text-5xl lg:text-6xl">CALLS, REVIEWS, ADAPTS.</span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-xl md:text-2xl text-textSecondary max-w-[700px] mx-auto leading-relaxed font-light mb-8 sm:mb-12 px-2"
          >
            Get a coach who <strong className="text-textPrimary font-semibold">knows you</strong>, <strong className="text-textPrimary font-semibold">calls you</strong>, 
            builds your workouts, plans your meals, scans your context, and <strong className="text-primary font-semibold">updates the plan every week</strong> — about $24.99/month, with the annual plan as the best value.
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-7 h-7 sm:w-8 sm:h-8 relative z-10 fill-current">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-7 h-7 sm:w-8 sm:h-8 fill-current">
                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
              </svg>
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
            <span>✓ $24.99/month premium plan</span>
            <span>✓ Annual plan best value</span>
            <span>✓ iOS & Android</span>
            <span>✓ Cancel anytime</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
