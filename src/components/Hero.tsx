import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Phone, Star, Flame, Dumbbell } from 'lucide-react';

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
            THE ONLY APP THAT CALLS YOU
          </motion.div>

          <h1 className="text-5xl md:text-[72px] lg:text-[84px] font-black font-condensed leading-[0.9] tracking-normal mb-6 relative z-10">
            <span className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl -z-10 opacity-50 rounded-[40px]"></span>
            Callio<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              CALLS YOU.
            </span>
          </h1>

          <p className="text-lg md:text-[20px] text-textSecondary mb-8 max-w-[540px] leading-relaxed font-sans font-light">
            The only fitness app where your coach <strong className="text-textPrimary font-semibold">literally calls your phone</strong>. 
            Before your workout to fire you up. After your day to review your progress. 
            <span className="text-primary font-medium"> 24/7 personal coaching at a fraction of the cost. Learn why we're rated the <a href="/best-ai-fitness-app" className="underline hover:text-secondary transition-colors">best AI fitness app</a>.</span>
          </p>

          {/* Key highlights */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: Phone, text: "Real voice calls" },
              { icon: Dumbbell, text: "Custom programs" },
              { icon: Star, text: "AI meal plans" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-textSecondary"
              >
                <item.icon size={14} className="text-primary" />
                {item.text}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,212,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="https://apps.apple.com/app/your-ai-coach"
              className="relative inline-flex items-center gap-3 px-8 py-4 rounded-[20px] font-semibold bg-gradient-to-r from-primary to-secondary text-white overflow-hidden group transition-all"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-8 h-8 relative z-10 fill-current">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 fill-current">
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
            </svg>
              <div className="flex flex-col leading-[1.1] text-left">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-medium font-sans">Get it on</span>
                <span className="text-[17px] font-condensed uppercase tracking-wide">Google Play</span>
              </div>
            </motion.a>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-textSecondary font-sans opacity-80 pl-2">
              <strong>Free base app</strong> • Optional premium voice upgrades
            </p>
            {/* Social proof bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex flex-wrap gap-6 text-sm text-textSecondary/70"
            >
              <span className="flex items-center gap-1.5"><Flame size={14} className="text-cta" /> Top Early Access AI App</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400" /> 13 intelligence modules</span>
              <span className="flex items-center gap-1.5"><Phone size={14} className="text-primary" /> Real phone calls</span>
            </motion.div>
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
            {/* Ringing pulse effect */}
            <div className="absolute -inset-3 rounded-[56px] bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl animate-pulse opacity-60 pointer-events-none" />
            <div className="w-full h-full rounded-[38px] border border-white/5 overflow-hidden bg-black relative">
              <img src="/images/hero1.png" alt="Callio interface" className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
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
