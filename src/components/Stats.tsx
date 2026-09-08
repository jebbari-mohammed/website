import { motion } from '../lib/motion';

const stats = [
  {
    value: '$24.99',
    unit: '/mo',
    label: 'Predictable Pricing',
    detail: 'Complete AI personal trainer at a fraction of in-person coaching rates.',
  },
  {
    value: '100%',
    unit: '',
    label: 'Adaptive Programming',
    detail: 'Workouts, weights, reps, and meals recalculate when your schedule shifts.',
  },
  {
    value: '60 FPS',
    unit: '',
    label: 'Video Guidance',
    detail: 'HD exercise form cues and cooking walkthroughs on every workout day.',
  },
  {
    value: '24/7',
    unit: '',
    label: 'Biometric Intelligence',
    detail: 'Remembers prior sessions, Apple Health metrics, and real-life constraints.',
  },
];

export default function Stats() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 border-y border-white/[0.06] bg-[#05080C]/90">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-6 sm:p-7 rounded-2xl specular-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline gap-1 mb-2 font-mono">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#C8FF7E]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-base sm:text-lg font-bold text-textSecondary font-sans">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-textPrimary mb-1">
                  {stat.label}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed mt-2 font-normal">
                {stat.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
