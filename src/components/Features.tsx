import { motion } from '../lib/motion';
import { Phone, Dumbbell, Utensils, Camera, Brain, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Dumbbell,
    title: "Full Workout Plans",
    subtitle: "Built around your real week",
    desc: (
      <>
        IZEM builds training around your goal, body, schedule, equipment, level, recovery, and progress instead of making you browse a generic exercise library. Read the{" "}
        <a href="/features/ai-workout-generator" className="underline hover:text-primary transition-colors font-medium">
          AI workout generator guide
        </a>
        .
      </>
    ),
    gradient: "from-primary to-secondary",
    span: "md:col-span-2",
    image: "/images/hero-call-card.webp",
  },
  {
    icon: Utensils,
    title: "Weekly Meal Plans",
    subtitle: "Your food, your macros",
    desc: (
      <>
        Meals are built around macros, preferences, budget, schedule, culture, lifestyle, and consistency. See how the{" "}
        <a href="/features/ai-meal-planner" className="underline hover:text-primary transition-colors font-medium">
          AI meal planner
        </a>
        {" "}keeps nutrition practical.
      </>
    ),
    gradient: "from-[#8DFF6A] to-[#FFD36E]",
    span: "",
  },
  {
    icon: Camera,
    title: "Food, Body & Equipment Scans",
    subtitle: "More context, better coaching",
    desc: "Scan meals, body progress, and gym equipment so the coach understands what you ate, how progress is trending, and what machines are available in the gym.",
    gradient: "from-secondary to-tertiary",
    span: "md:col-span-2",
    image: "/images/food-scan-card.webp",
  },
  {
    icon: Brain,
    title: "Daily Reviews & Weekly Adaptation",
    subtitle: "Review what happened",
    desc: (
      <>
        IZEM reviews workouts, meals, recovery, consistency, scans, and real-life constraints before updating the next week. The complete loop is explained on the{" "}
        <a href="/izem-ai-fitness-coach/" className="underline hover:text-primary transition-colors font-medium">
          IZEM AI Fitness Coach page
        </a>
        . It is not a dashboard; it is a coach that keeps track.
      </>
    ),
    gradient: "from-primary to-secondary",
    span: "",
  },
  {
    icon: Phone,
    title: "Optional Voice Calls",
    subtitle: "Your coach can call you",
    desc: (
      <>
        Not a chatbot. Not just a notification. IZEM can call your phone before training, at review time, and when accountability matters. Learn more about{" "}
        <a href="/features/ai-voice-calls" className="underline hover:text-primary transition-colors font-medium">
          AI voice calls
        </a>
        .
      </>
    ),
    gradient: "from-primary to-secondary",
    span: "",
  },
  {
    icon: ShieldCheck,
    title: "Coach Memory & Context",
    subtitle: "A coach, not a tracker",
    desc: "IZEM can use prior workouts, meals, preferences, scan context, and check-ins so the same problem does not need to be explained every week.",
    gradient: "from-secondary to-tertiary",
    span: "",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-0 w-1/3 h-1/2 bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/4 h-1/3 bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-[#111A22] border border-primary/30 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(141,255,106,0.15)]">
            ✦ Everything You Need
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black font-display leading-[1.05] tracking-tight">
            NOT JUST CALLS.<br />
            <span className="text-textSecondary">THE FULL COACHING LOOP.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`${feature.span || ''} bg-[#111A22] border border-white/10 rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(141,255,106,0.15)]`}
              >
                {/* Ambient glow on hover */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} blur-[80px] rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none`} />

                {/* Feature image for wide cards */}
                {feature.image && (
                  <div className="absolute -right-4 sm:-right-2 top-4 sm:top-2 w-[140px] sm:w-[200px] h-[140px] sm:h-[200px] rounded-2xl overflow-hidden opacity-30 sm:opacity-50 group-hover:opacity-75 transition-opacity duration-500 z-0">
                    <img src={feature.image} alt={feature.title} width={420} height={420} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#111A22]" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-5 relative z-10 shadow-lg shadow-primary/20`}>
                  <Icon className="text-[#070A0D]" size={24} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight mb-1 text-textPrimary">
                    {feature.title}
                  </h3>
                  <p className="text-primary text-xs sm:text-sm font-bold mb-3 uppercase tracking-wider">
                    {feature.subtitle}
                  </p>
                  <p className="text-sm sm:text-[15px] text-textSecondary leading-relaxed font-normal">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
