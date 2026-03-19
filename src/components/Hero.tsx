import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section id="download" className="relative min-h-screen flex items-center pt-[120px] pb-[80px] px-6 overflow-hidden">
      {/* Interactive Background Glow */}
      <motion.div
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 2 }}
        className="absolute w-[800px] h-[800px] rounded-full bg-primary/20 blur-[150px] pointer-events-none z-0 hidden lg:block"
      />

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-70 z-0 pointer-events-none" />

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
            className="inline-flex items-center gap-3 bg-[#0A102E]/80 border border-white/10 rounded-full px-4 py-2 text-[13px] text-primary font-bold tracking-wider mb-8 backdrop-blur-md shadow-[0_0_30px_rgba(0,212,255,0.15)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            NEXT-GEN FITNESS AI
          </motion.div>

          <h1 className="text-6xl md:text-[84px] lg:text-[96px] font-black font-condensed leading-[0.9] tracking-tighter mb-6 relative z-10">
            <span className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl -z-10 opacity-50 rounded-[40px]"></span>
            TRAIN SMARTER.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              TRANSFORM FASTER.
            </span>
          </h1>

          <p className="text-lg md:text-[21px] text-textSecondary mb-10 max-w-[520px] leading-relaxed font-sans font-light">
            AI-powered fitness guidance tailored precisely to your biometrics. <strong className="text-textPrimary font-medium">Personalized workout plans</strong>, smart meal generation, and 24/7 coaching in your pocket.
          </p>

          <div className="flex flex-wrap gap-4">
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,212,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="https://apps.apple.com/app/your-ai-coach"
              className="relative inline-flex items-center gap-3 px-8 py-4 rounded-[20px] font-semibold bg-gradient-to-r from-primary to-secondary text-white overflow-hidden group transition-all"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="text-3xl relative z-10">🍎</span>
              <div className="flex flex-col leading-[1.1] relative z-10 text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-90 font-medium font-sans">Download on the</span>
                <span className="text-[17px] font-condensed uppercase tracking-wide">App Store</span>
              </div>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(0,212,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="https://play.google.com/store/apps/details?id=com.ai.gym.coach"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-[20px] font-semibold bg-[#0A102E]/60 border border-white/10 hover:border-primary/50 text-white backdrop-blur-xl transition-all duration-300 shadow-xl"
            >
              <span className="text-3xl">▶</span>
              <div className="flex flex-col leading-[1.1] text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium font-sans">Get it on</span>
                <span className="text-[17px] font-condensed uppercase tracking-wide">Google Play</span>
              </div>
            </motion.a>
          </div>
        </motion.div>

        <div className="hidden lg:block relative h-[600px] w-full" style={{ perspective: "1000px" }}>
          {/* Main Primary Phone */}
          <motion.div
            style={{ y: y1 }}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-[280px] h-[580px] rounded-[48px] bg-bgPrimary border-[2px] border-white/20 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8),_inset_0_0_20px_rgba(255,255,255,0.05)] z-20"
            whileHover={{ scale: 1.02, rotateY: -5, rotateX: 5 }}
          >
            <div className="w-full h-full rounded-[38px] border border-white/5 overflow-hidden bg-black relative">
              <img src="/images/hero1.png" alt="Your AI Coach interface" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
            </div>
          </motion.div>

          {/* Secondary Phone Float */}
          <motion.div
            style={{ y: y2 }}
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[80px] -left-10 w-[240px] h-[500px] rounded-[40px] bg-bgPrimary border-[2px] border-white/10 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.9)] z-10 opacity-60"
          >
            <div className="w-full h-full rounded-[30px] border border-white/5 overflow-hidden bg-black relative">
              <img src="/images/hero2.png" alt="Streak tracking in AI Coach app" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
