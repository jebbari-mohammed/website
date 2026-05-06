import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

const features = [
  { name: "AI Voice Coaching Calls", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Personalized Workouts", us: true, fitbod: true, future: true, freeletics: "partial" as const },
  { name: "AI Meal Plans (Your Cuisine)", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Camera Body Scanning", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Camera Food Scanning", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Progressive Overload Engine", us: true, fitbod: true, future: "partial" as const, freeletics: false },
  { name: "Intelligence Modules", us: "13", fitbod: "0", future: "0", freeletics: "1" },
  { name: "ED Safety Detection", us: true, fitbod: false, future: false, freeletics: false },
  { name: "iOS + Android", us: true, fitbod: true, future: "partial" as const, freeletics: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-cta mx-auto" />;
  if (value === false) return <X size={16} className="text-red-400/50 mx-auto" />;
  if (value === "partial") return <Minus size={16} className="text-yellow-500/60 mx-auto" />;
  return <span className="text-xs sm:text-sm font-bold text-textPrimary">{value}</span>;
}

export default function Comparison() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md">
            ✦ The Honest Comparison
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-condensed leading-[1.05] tracking-tighter mb-4">
            US VS.<br />
            <span className="text-textSecondary">EVERYONE ELSE.</span>
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-[500px] mx-auto leading-relaxed font-light px-2">
            We're not afraid of a fair comparison. Here's exactly how we stack up.
          </p>
        </motion.div>

        {/* Mobile: Card-based layout */}
        <div className="block sm:hidden space-y-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="bg-[#0C1232]/60 border border-white/8 rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-textPrimary mb-3">{feature.name}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-primary font-bold block mb-1">Us</span>
                  <CellValue value={feature.us} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/50 font-medium block mb-1">Fitbod</span>
                  <CellValue value={feature.fitbod} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/50 font-medium block mb-1">Future</span>
                  <CellValue value={feature.future} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/50 font-medium block mb-1">Freeletics</span>
                  <CellValue value={feature.freeletics} />
                </div>
              </div>
            </motion.div>
          ))}
          {/* Price card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-sm font-bold text-textPrimary mb-3">Monthly Price</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">~Free</span>
              </div>
              <div><span className="text-xs text-textSecondary/50">$15/mo</span></div>
              <div><span className="text-xs text-textSecondary/50">$150/mo</span></div>
              <div><span className="text-xs text-textSecondary/50">$15/mo</span></div>
            </div>
          </div>
        </div>

        {/* Desktop: Table layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="hidden sm:block overflow-x-auto"
        >
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-5 gap-0 mb-2">
              <div className="p-4"></div>
              <div className="p-4 text-center">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block">Your AI Coach</span>
                <span className="text-[11px] text-cta font-semibold">~Free</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-medium text-textSecondary block">Fitbod</span>
                <span className="text-[11px] text-textSecondary/50">$15/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-medium text-textSecondary block">Future</span>
                <span className="text-[11px] text-textSecondary/50">$150/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-medium text-textSecondary block">Freeletics</span>
                <span className="text-[11px] text-textSecondary/50">$15/mo</span>
              </div>
            </div>

            {/* Rows */}
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className={`grid grid-cols-5 gap-0 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''} rounded-lg hover:bg-white/[0.04] transition-colors`}
              >
                <div className="p-4 flex items-center">
                  <span className="text-sm text-textSecondary font-medium">{feature.name}</span>
                </div>
                <div className="p-4 flex items-center justify-center bg-primary/[0.03] border-x border-primary/10">
                  <CellValue value={feature.us} />
                </div>
                <div className="p-4 flex items-center justify-center"><CellValue value={feature.fitbod} /></div>
                <div className="p-4 flex items-center justify-center"><CellValue value={feature.future} /></div>
                <div className="p-4 flex items-center justify-center"><CellValue value={feature.freeletics} /></div>
              </motion.div>
            ))}

            {/* Price row */}
            <div className="grid grid-cols-5 gap-0 mt-4 pt-4 border-t border-white/10">
              <div className="p-4"><span className="text-sm font-bold text-textPrimary">Monthly Price</span></div>
              <div className="p-4 flex items-center justify-center bg-primary/[0.03] border-x border-primary/10">
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">~Free</span>
              </div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/60">$15/mo</span></div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/60">$150/mo</span></div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/60">$15/mo</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
