import { motion } from '../lib/motion';
import { Phone, Brain, Utensils, MessageSquare, ScanFace, BarChart3 } from 'lucide-react';

const decisionContrasts = [
  {
    iconPassive: MessageSquare,
    iconOurs: Phone,
    passive: 'A log records the missed workout after it happens.',
    ours: 'Optional calls and check-ins can help choose the full session, a smaller fallback, or an honest reschedule.',
  },
  {
    iconPassive: BarChart3,
    iconOurs: Brain,
    passive: 'A dashboard presents data and leaves the next decision open.',
    ours: 'Day reviews are designed to turn what happened into a clearer next action.',
  },
  {
    iconPassive: Utensils,
    iconOurs: Utensils,
    passive: 'A static meal list can become impractical when the week changes.',
    ours: 'Meal planning can account for preferences, schedule, budget, and the constraints reported in check-ins.',
  },
  {
    iconPassive: ScanFace,
    iconOurs: ScanFace,
    passive: 'Manual entries provide only the context a person remembers to type.',
    ours: 'Optional food, body-progress, and equipment scans can add context to the coaching conversation.',
  },
  {
    iconPassive: BarChart3,
    iconOurs: BarChart3,
    passive: 'A fixed progression rule can miss changes in performance, recovery, or available equipment.',
    ours: 'Weekly reviews can inform exercise substitutions and planned progression without treating every week as identical.',
  },
];

export default function WhyDifferent() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-primary/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-[#111A22] border border-primary/30 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(141,255,106,0.15)]">
            ✦ Tracking and coaching solve different jobs
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black font-display leading-[1.05] tracking-tight mb-4">
            A TRACKER RECORDS.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#D8FF86] to-secondary">A COACH RESPONDS.</span>
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-[680px] mx-auto leading-relaxed font-normal px-2">
            These are decision patterns, not claims that every competing app behaves the same way. IZEM is designed to connect planning, check-ins, context, reviews, and optional calls so the next step is easier to choose.
          </p>
        </motion.div>

        <div className="space-y-3 sm:space-y-4">
          {decisionContrasts.map((item, index) => {
            const PassiveIcon = item.iconPassive;
            const IzemIcon = item.iconOurs;
            return (
              <motion.div
                key={item.passive}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-[16px] sm:rounded-[20px] overflow-hidden border border-white/10 hover:border-primary/30 transition-all duration-300 shadow-glass">
                  <div className="bg-[#0E151B]/80 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border-b sm:border-b-0 sm:border-r border-white/10">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#86D7FF]/10 flex items-center justify-center shrink-0">
                      <PassiveIcon size={18} className="text-[#86D7FF]/80" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#86D7FF]/80 block mb-0.5">Passive pattern</span>
                      <p className="text-xs sm:text-sm text-textSecondary/85 font-normal">{item.passive}</p>
                    </div>
                  </div>
                  <div className="bg-[#111A22] p-4 sm:p-6 flex items-center gap-3 sm:gap-4 group-hover:bg-[#17232D] transition-colors duration-300">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(141,255,106,0.2)]">
                      <IzemIcon size={18} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-primary block mb-0.5">IZEM coaching response</span>
                      <p className="text-xs sm:text-sm text-textPrimary font-semibold">{item.ours}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
