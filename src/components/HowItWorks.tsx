import { motion } from 'framer-motion';
import { ScanFace, Brain, Phone, Sparkles } from 'lucide-react';

const steps = [
  {
    num: "1",
    icon: ScanFace,
    title: "Tell Us Everything",
    desc: "Answer a few questions about your goals, injuries, and preferences. Then scan your body with your phone camera — our AI learns everything about you in 60 seconds.",
    highlight: "Body scanning + smart profiling",
  },
  {
    num: "2",
    icon: Brain,
    title: "Get Your Custom Plan",
    desc: "AI builds your complete workout program AND meal plan. Not a template — built for YOUR body, your cuisine, your schedule. Progressive overload, macro targets, the works.",
    highlight: "Workouts + meals + macros",
  },
  {
    num: "3",
    icon: Phone,
    title: "Your Coach Calls You",
    desc: "Before the gym: your coach calls to fire you up and review today's session. End of day: calls again to check if you trained, review your nutrition, and plan tomorrow.",
    highlight: "Real voice calls, every day",
  },
  {
    num: "4",
    icon: Sparkles,
    title: "Watch Yourself Transform",
    desc: "Scan your body anytime to see real progress. Your coach detects plateaus, adjusts your program, celebrates milestones, and never lets you quit.",
    highlight: "AI-tracked transformation",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-[120px] px-4 sm:px-6 bg-gradient-to-b from-transparent via-[#0C1232]/50 to-transparent relative">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[1.5px] text-primary mb-4 font-sans">
            ✦ How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold font-condensed leading-[1.05] tracking-tighter mb-4">
            FROM DOWNLOAD TO<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">TRANSFORMATION.</span>
          </h2>
          <p className="text-sm sm:text-[17px] text-textSecondary max-w-[560px] leading-relaxed font-sans font-light">
            No guesswork. No generic plans. A real coaching relationship — powered by AI that knows you better than any human trainer could.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-14 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-primary/30 via-secondary/30 to-cta/30" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="glass-card rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 relative group hover:border-primary/25 hover:-translate-y-2 transition-all duration-300"
              >
                {/* Step number + icon */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 relative z-10">
                    <Icon className="text-white" size={22} />
                  </div>
                  <span className="absolute -top-2 -left-2 text-[40px] sm:text-[48px] font-black font-condensed text-white/5 leading-none z-0">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 font-sans text-textPrimary">{step.title}</h3>
                <p className="text-xs sm:text-sm text-textSecondary leading-[1.7] font-sans mb-3 sm:mb-4">
                  {step.desc}
                </p>

                {/* Highlight tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-[11px] text-primary font-semibold uppercase tracking-wider">
                  {step.highlight}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
