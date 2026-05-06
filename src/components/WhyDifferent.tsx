import { motion } from 'framer-motion';
import { PhoneOff, Phone, Brain, Utensils, MessageSquare, ScanFace, BarChart3 } from 'lucide-react';

const comparisons = [
  {
    iconOther: PhoneOff,
    iconOurs: Phone,
    others: "Send you a push notification you'll ignore",
    ours: "Calls your phone with a real AI voice conversation",
  },
  {
    iconOther: MessageSquare,
    iconOurs: Brain,
    others: "Basic chatbot with a generic system prompt",
    ours: "13 intelligence modules analyzing your behavior 24/7",
  },
  {
    iconOther: Utensils,
    iconOurs: Utensils,
    others: "Generic \"chicken and rice\" meal templates",
    ours: "Your culture's cuisine — tagine, donburi, biryani — with your macros",
  },
  {
    iconOther: ScanFace,
    iconOurs: ScanFace,
    others: "Manual body measurement logging",
    ours: "Camera body scanning with AI-tracked progress over time",
  },
  {
    iconOther: BarChart3,
    iconOurs: BarChart3,
    others: "\"Add 5 lbs next week\" simple progression",
    ours: "Epley 1RM tracking, plateau detection, auto-program triage",
  },
];

export default function WhyDifferent() {
  return (
    <section className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-primary/8 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md">
            ✦ Not Another Fitness App
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-condensed leading-[1.05] tracking-tighter mb-4">
            OTHER APPS NOTIFY.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">WE CALL.</span>
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-[600px] mx-auto leading-relaxed font-light px-2">
            Every fitness app claims to be "AI-powered." Here's what that actually looks like when you compare them to us.
          </p>
        </motion.div>

        <div className="space-y-3 sm:space-y-4">
          {comparisons.map((item, idx) => {
            const IconOther = item.iconOther;
            const IconOurs = item.iconOurs;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-[16px] sm:rounded-[20px] overflow-hidden border border-white/8 hover:border-white/15 transition-all duration-300">
                  {/* Other apps */}
                  <div className="bg-[#0C1232]/50 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border-b sm:border-b-0 sm:border-r border-white/8">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <IconOther size={18} className="text-red-400/60" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-red-400/50 block mb-0.5">Other Apps</span>
                      <p className="text-xs sm:text-sm text-textSecondary/70 font-light">{item.others}</p>
                    </div>
                  </div>
                  {/* Your AI Coach */}
                  <div className="bg-[#0C1232]/80 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 group-hover:bg-primary/5 transition-colors duration-300">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <IconOurs size={18} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary block mb-0.5">Your AI Coach</span>
                      <p className="text-xs sm:text-sm text-textPrimary font-medium">{item.ours}</p>
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
