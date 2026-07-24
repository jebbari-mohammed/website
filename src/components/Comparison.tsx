import { motion } from '../lib/motion';
import { Check, X, Minus, Sparkles, Zap } from 'lucide-react';

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

function CellValue({ value, isUs }: { value: boolean | string; isUs?: boolean }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUs ? 'bg-primary/20 border border-primary/50 shadow-[0_0_15px_rgba(141,255,106,0.4)]' : 'bg-emerald-500/10'}`}>
          <Check size={18} className={isUs ? "text-primary stroke-[3]" : "text-emerald-400"} />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
          <X size={16} className="text-red-400/50" />
        </div>
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Minus size={16} className="text-amber-400/70" />
        </div>
      </div>
    );
  }
  return <span className="text-xs sm:text-sm font-bold text-textPrimary">{value}</span>;
}

export default function Comparison() {
  return (
    <section className="py-20 sm:py-[140px] px-4 sm:px-6 relative overflow-hidden bg-[#070A0D]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-primary/15 via-[#86D7FF]/10 to-transparent blur-[160px] rounded-full pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2.5 bg-[#111A22] border border-primary/40 rounded-full px-5 py-2 text-xs text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-xl shadow-[0_0_25px_rgba(141,255,106,0.2)]">
            <Zap size={14} className="fill-primary" />
            The Honest Comparison
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display leading-[1.02] tracking-tight mb-6">
            FULL COACHING SYSTEM.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-[#86D7FF]">
              NOT JUST A SIMPLE TRACKER.
            </span>
          </h2>
          <p className="text-base sm:text-xl text-textSecondary max-w-[620px] mx-auto leading-relaxed font-sans font-normal px-2">
            IZEM is priced as a complete AI personal trainer. You get workout plans, meal plans, 3D scans, accountability calls, and weekly adaptation in one connected system.
          </p>
        </motion.div>

        {/* Mobile: Sleek Cards */}
        <div className="block lg:hidden space-y-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="glass-card rounded-2xl p-5 border border-white/10 bg-[#111A22]/90 backdrop-blur-xl shadow-glass"
            >
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-textPrimary font-sans">{feature.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  IZEM
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center items-center">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/30">
                  <span className="text-[10px] text-primary font-black block mb-1 uppercase tracking-wider">IZEM</span>
                  <CellValue value={feature.us} isUs={true} />
                </div>
                <div>
                  <span className="text-[10px] text-textSecondary/70 font-medium block mb-1">
                    <a href="/vs-fitbod" className="underline hover:text-primary transition-colors">Fitbod</a>
                  </span>
                  <CellValue value={feature.fitbod} />
                </div>
                <div>
                  <span className="text-[10px] text-textSecondary/70 font-medium block mb-1">
                    <a href="/vs-future" className="underline hover:text-primary transition-colors">Future</a>
                  </span>
                  <CellValue value={feature.future} />
                </div>
                <div>
                  <span className="text-[10px] text-textSecondary/70 font-medium block mb-1">Freeletics</span>
                  <CellValue value={feature.freeletics} />
                </div>
              </div>
            </motion.div>
          ))}
          {/* Mobile Pricing Summary */}
          <div className="glass-card rounded-2xl p-6 border-2 border-primary/40 bg-gradient-to-br from-[#111A22] to-[#17232D] shadow-[0_0_30px_rgba(141,255,106,0.15)]">
            <p className="text-base font-bold text-textPrimary mb-4 font-sans text-center">Monthly Investment</p>
            <div className="grid grid-cols-4 gap-2 text-center items-center">
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/40">
                <span className="text-xs font-black text-primary block">$24.99</span>
                <span className="text-[9px] text-textSecondary uppercase font-bold">IZEM</span>
              </div>
              <div>
                <span className="text-xs font-medium text-textSecondary/70 block">$15</span>
                <span className="text-[9px] text-textSecondary/50">Fitbod</span>
              </div>
              <div>
                <span className="text-xs font-medium text-textSecondary/70 block">$150+</span>
                <span className="text-[9px] text-textSecondary/50">Future</span>
              </div>
              <div>
                <span className="text-xs font-medium text-textSecondary/70 block">$15</span>
                <span className="text-[9px] text-textSecondary/50">Freeletics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Pixel-Perfect Table Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block overflow-hidden rounded-[28px] border border-white/12 bg-[#0E151B]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[20%]" />
              <col className="w-[14.6%]" />
              <col className="w-[14.6%]" />
              <col className="w-[14.8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-white/10 bg-[#111A22]/90">
                <th className="p-6 text-sm font-bold uppercase tracking-wider text-textSecondary font-sans">Feature Matrix</th>
                {/* IZEM Featured Column Header */}
                <th className="p-6 text-center bg-gradient-to-b from-primary/20 to-primary/5 border-x border-primary/30 relative">
                  <div className="absolute -top-1 inset-x-0 h-1 bg-gradient-to-r from-primary via-[#D8FF86] to-[#86D7FF]" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-[#070A0D] font-extrabold text-[11px] uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(141,255,106,0.4)]">
                    <Sparkles size={12} /> IZEM AI
                  </div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#86D7FF] font-display">
                    $24.99 / mo
                  </div>
                </th>
                <th className="p-6 text-center">
                  <a href="/vs-fitbod" className="text-sm font-bold text-textPrimary hover:text-primary transition-colors block font-sans">Fitbod</a>
                  <span className="text-xs text-textSecondary/60 font-mono">$15 / mo</span>
                </th>
                <th className="p-6 text-center">
                  <a href="/vs-future" className="text-sm font-bold text-textPrimary hover:text-primary transition-colors block font-sans">Future</a>
                  <span className="text-xs text-textSecondary/60 font-mono">$150+ / mo</span>
                </th>
                <th className="p-6 text-center">
                  <span className="text-sm font-bold text-textPrimary block font-sans">Freeletics</span>
                  <span className="text-xs text-textSecondary/60 font-mono">$15 / mo</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((feature, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="p-5 pl-6 text-sm font-medium text-textPrimary font-sans">
                    {feature.name}
                  </td>
                  {/* IZEM Featured Column Body */}
                  <td className="p-5 text-center bg-primary/[0.04] border-x border-primary/20 group-hover:bg-primary/[0.08] transition-colors">
                    <CellValue value={feature.us} isUs={true} />
                  </td>
                  <td className="p-5 text-center">
                    <CellValue value={feature.fitbod} />
                  </td>
                  <td className="p-5 text-center">
                    <CellValue value={feature.future} />
                  </td>
                  <td className="p-5 text-center">
                    <CellValue value={feature.freeletics} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-[#111A22]/90">
                <td className="p-6 text-sm font-bold text-textPrimary font-sans">Monthly Investment</td>
                <td className="p-6 text-center bg-primary/10 border-x border-primary/30">
                  <span className="text-xl font-black text-primary font-display">$24.99</span>
                  <span className="block text-[10px] text-primary/80 font-bold uppercase tracking-wider">Best Value</span>
                </td>
                <td className="p-6 text-center text-sm font-semibold text-textSecondary/70 font-mono">$15</td>
                <td className="p-6 text-center text-sm font-semibold text-textSecondary/70 font-mono">$150+</td>
                <td className="p-6 text-center text-sm font-semibold text-textSecondary/70 font-mono">$15</td>
              </tr>
            </tfoot>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
