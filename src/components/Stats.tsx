import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

interface StatItemProps {
  value: string;
  suffix?: string;
  label: string;
  sublabel: string;
  delay: number;
}

function StatItem({ value, suffix, label, sublabel, delay }: StatItemProps) {
  const isAnimatable = !isNaN(Number(value));
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="text-center group"
    >
      <div className="text-4xl sm:text-5xl md:text-7xl font-black font-condensed tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
        {isAnimatable ? <AnimatedCounter target={Number(value)} /> : value}
        {suffix && <span className="text-2xl sm:text-3xl md:text-5xl">{suffix}</span>}
      </div>
      <p className="text-sm sm:text-lg font-bold text-textPrimary mb-1 font-sans">{label}</p>
      <p className="text-xs sm:text-sm text-textSecondary font-light px-2">{sublabel}</p>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-secondary/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-condensed leading-[1.05] tracking-tighter">
            BY THE<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">NUMBERS.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-6">
          <StatItem value="24/7" label="Always On" sublabel="Your coach never sleeps" delay={0} />
          <StatItem value="13" label="Intel Modules" sublabel="Behind every conversation" delay={0.1} />
          <StatItem value="44000" suffix="+" label="Token Personality" sublabel="Deepest AI coach identity" delay={0.2} />
          <StatItem value="$0" label="Coach Cost" sublabel="24/7 coaching, almost free" delay={0.3} />
        </div>

        {/* Bottom highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 sm:mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-[#0C1232]/80 border border-white/10 rounded-2xl sm:rounded-full px-5 sm:px-6 py-3 backdrop-blur-md">
            <span className="text-xs sm:text-sm text-textSecondary">Compare to a human trainer:</span>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-bold text-red-400 line-through">$150/mo</span>
              <span className="text-textSecondary/30">·</span>
              <span className="text-xs sm:text-sm font-bold text-red-400 line-through">2 hrs/week</span>
              <span className="text-textSecondary/30">·</span>
              <span className="text-xs sm:text-sm font-bold text-red-400 line-through">No meals</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
