import { motion } from '../lib/motion';
import { Check, X, Minus } from 'lucide-react';

const features = [
  { name: "AI Voice Coaching Calls", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Weekly Adaptive Plan Updates", us: true, fitbod: "partial" as const, future: true, freeletics: "partial" as const },
  { name: "Personalized Workouts", us: true, fitbod: true, future: true, freeletics: "partial" as const },
  { name: "Personalized Meal Plans", us: true, fitbod: false, future: "partial" as const, freeletics: false },
  { name: "Body Progress Scanning", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Camera Food Scanning", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Gym Equipment Scanning", us: true, fitbod: false, future: false, freeletics: false },
  { name: "Progress Review Calls", us: true, fitbod: false, future: "partial" as const, freeletics: false },
  { name: "iOS + Android", us: true, fitbod: true, future: "partial" as const, freeletics: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={18} className="text-cta stroke-[3] mx-auto drop-shadow-[0_0_8px_rgba(124,255,107,0.5)]" />;
  if (value === false) return <X size={18} className="text-red-400/60 mx-auto" />;
  if (value === "partial") return <Minus size={18} className="text-tertiary mx-auto" />;
  return <span className="text-xs sm:text-sm font-bold text-textPrimary">{value}</span>;
}

export default function Comparison() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-3 bg-[#111A22] border border-primary/30 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(141,255,106,0.15)]">
            ✦ The Honest Comparison
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black font-display leading-[1.05] tracking-tight mb-4">
            FULL COACHING.<br />
            <span className="text-textSecondary">NOT JUST TRACKING.</span>
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-[500px] mx-auto leading-relaxed font-normal px-2">
            IZEM is priced like a premium AI coach, not a cheap tracker. The value is one connected system for workout plans, meal plans, scans, reviews, calls, memory, and weekly adaptation.
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
              className="bg-[#111A22] border border-white/10 rounded-2xl p-4 shadow-glass"
            >
              <p className="text-sm font-semibold text-textPrimary mb-3 font-sans">{feature.name}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-primary font-bold block mb-1 uppercase tracking-wider">Us</span>
                  <CellValue value={feature.us} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/60 font-medium block mb-1">
                    <a href="/vs-fitbod" className="underline hover:text-primary transition-colors">Fitbod</a>
                  </span>
                  <CellValue value={feature.fitbod} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/60 font-medium block mb-1">
                    <a href="/vs-future" className="underline hover:text-primary transition-colors">Future</a>
                  </span>
                  <CellValue value={feature.future} />
                </div>
                <div>
                  <span className="text-[9px] text-textSecondary/60 font-medium block mb-1">Freeletics</span>
                  <CellValue value={feature.freeletics} />
                </div>
              </div>
            </motion.div>
          ))}
          {/* Price card */}
          <div className="bg-[#17232D] border border-primary/30 rounded-2xl p-4 shadow-[0_0_25px_rgba(141,255,106,0.15)]">
            <p className="text-sm font-bold text-textPrimary mb-3 font-sans">Monthly Price</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">$24.99/mo</span>
              </div>
              <div><span className="text-xs text-textSecondary/60">$15/mo</span></div>
              <div><span className="text-xs text-textSecondary/60">$150+/mo</span></div>
              <div><span className="text-xs text-textSecondary/60">$15/mo</span></div>
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
          <div className="min-w-[640px] bg-[#111A22]/80 border border-white/10 rounded-2xl p-4 shadow-glass backdrop-blur-xl">
            {/* Header */}
            <div className="grid grid-cols-5 gap-0 mb-2 border-b border-white/10 pb-3">
              <div className="p-4"></div>
              <div className="p-4 text-center bg-primary/10 rounded-xl border border-primary/20">
                <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-secondary block font-display">IZEM</span>
                <span className="text-[11px] text-cta font-bold">$24.99/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-semibold text-textSecondary block">
                  <a href="/vs-fitbod" className="underline hover:text-primary transition-colors">Fitbod</a>
                </span>
                <span className="text-[11px] text-textSecondary/60">$15/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-semibold text-textSecondary block">
                  <a href="/vs-future" className="underline hover:text-primary transition-colors">Future</a>
                </span>
                <span className="text-[11px] text-textSecondary/60">$150+/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-semibold text-textSecondary block">Freeletics</span>
                <span className="text-[11px] text-textSecondary/60">$15/mo</span>
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
                  <span className="text-sm text-textPrimary font-medium">{feature.name}</span>
                </div>
                <div className="p-4 flex items-center justify-center bg-primary/[0.06] border-x border-primary/20">
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
              <div className="p-4 flex items-center justify-center bg-primary/[0.08] border-x border-primary/30 rounded-b-xl">
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">$24.99/mo</span>
              </div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/70">$15/mo</span></div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/70">$150+/mo</span></div>
              <div className="p-4 text-center"><span className="text-sm text-textSecondary/70">$15/mo</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
