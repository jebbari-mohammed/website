import { motion } from 'framer-motion';
import { Phone, Dumbbell, Utensils, Camera, Brain, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Phone,
    title: "Proactive Voice Calls",
    subtitle: "Your coach calls YOU",
    desc: "Not a chatbot. Not a notification. Your AI coach literally calls your phone via real VoIP voice calls. Before the gym to remind and motivate you. End of day to review your workouts and plan tomorrow. Two-way conversation — you talk, your coach listens and responds.",
    gradient: "from-primary to-blue-500",
    span: "md:col-span-2",
    image: "/images/hero-call.png",
  },
  {
    icon: Dumbbell,
    title: "AI Workout Generator",
    subtitle: "Built for YOUR body",
    desc: "After scanning your body and learning your goals, AI generates a complete personalized program. Progressive overload with Epley 1RM tracking and plateau detection.",
    gradient: "from-secondary to-purple-500",
    span: "",
  },
  {
    icon: Utensils,
    title: "Region-Aware Meals",
    subtitle: "Your culture, your macros",
    desc: "Moroccan? Get tagine with the right protein. Japanese? Get donburi. High protein, easy to make, absolutely delicious — not generic \"chicken and rice\" templates.",
    gradient: "from-cta to-emerald-500",
    span: "",
  },
  {
    icon: Camera,
    title: "Food & Body Scanning",
    subtitle: "Point your camera, get answers",
    desc: "Take a photo of your meal — instant calorie and protein analysis. Scan your body anytime for composition tracking with progress deltas over time. No manual logging ever.",
    gradient: "from-amber-500 to-orange-500",
    span: "md:col-span-2",
    image: "/images/food-scan.png",
  },
  {
    icon: Brain,
    title: "13 Intelligence Modules",
    subtitle: "A relationship engine",
    desc: "Anti-skip detector, dark moment protocol, behavioral profiling, communication DNA, milestone detection, memory manager, personality engine — your coach remembers everything.",
    gradient: "from-primary to-secondary",
    span: "",
  },
  {
    icon: ShieldCheck,
    title: "Safety-First Design",
    subtitle: "Built with responsibility",
    desc: "Eating disorder detection. Never uses toxic language like \"cheat meal\" or \"earn your food.\" Calorie floors prevent dangerous prescriptions. Your mental health matters.",
    gradient: "from-rose-500 to-pink-500",
    span: "",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-[120px] px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-0 w-1/3 h-1/2 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/4 h-1/3 bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[11px] sm:text-[12px] text-primary font-bold uppercase tracking-[2px] mb-6 backdrop-blur-md">
            ✦ Everything You Need
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-condensed leading-[1.05] tracking-tighter">
            NOT JUST AN APP.<br />
            <span className="text-textSecondary">A REAL COACH.</span>
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
                className={`${feature.span || ''} bg-[#0C1232]/80 border border-white/10 rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,212,255,0.08)]`}
              >
                {/* Ambient glow on hover */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} blur-[80px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`} />

                {/* Feature image for wide cards */}
                {feature.image && (
                  <div className="absolute -right-4 sm:-right-2 top-4 sm:top-2 w-[140px] sm:w-[200px] h-[140px] sm:h-[200px] rounded-2xl overflow-hidden opacity-30 sm:opacity-50 group-hover:opacity-70 transition-opacity duration-500 z-0">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0C1232]" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-5 relative z-10 shadow-lg`}>
                  <Icon className="text-white" size={24} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-black font-condensed tracking-tight mb-1 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-primary text-xs sm:text-sm font-semibold mb-3 uppercase tracking-wider">
                    {feature.subtitle}
                  </p>
                  <p className="text-sm sm:text-[15px] text-textSecondary leading-relaxed font-light">
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
